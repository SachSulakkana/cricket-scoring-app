const { app, BrowserWindow, dialog, shell, Menu } = require("electron");
const { fork } = require("child_process");
const http = require("http");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { initSqlBridge, attachToChild } = require("./sql-bridge.cjs");

const PORT = Number(process.env.CRICKSCORE_PORT || 3000);
const HOST = "0.0.0.0";
const LOCAL_URL = `http://127.0.0.1:${PORT}`;

let mainWindow = null;
let nextProcess = null;
let shuttingDown = false;

function getLanUrls() {
  const urls = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family !== "IPv4" || entry.internal) continue;
      if (entry.address.startsWith("169.254.")) continue;
      urls.push(`http://${entry.address}:${PORT}`);
    }
  }
  return urls;
}

function waitForServer(url, timeoutMs = 60_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Server did not become ready at ${url}`));
        return;
      }
      setTimeout(tryOnce, 400);
    };
    const tryOnce = () => {
      const req = http.get(url, (res) => {
        res.resume();
        // Port open alone is not enough — Next can answer with 500 while
        // still warming up. Only treat 2xx/3xx as ready.
        if (res.statusCode && res.statusCode < 400) {
          resolve();
          return;
        }
        retry();
      });
      req.on("error", () => {
        retry();
      });
    };
    tryOnce();
  });
}

function resolveStandaloneDir() {
  const candidates = [
    path.join(__dirname, "..", ".next", "standalone"),
    path.join(process.resourcesPath || "", "standalone"),
    path.join(__dirname, "standalone"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "server.js"))) return dir;
  }
  return null;
}

function startNextServer() {
  const standaloneDir = resolveStandaloneDir();
  if (!standaloneDir) {
    throw new Error(
      "Next standalone build not found.\n\nFrom the project root run:\n  npm run electron:build"
    );
  }

  const serverJs = path.join(standaloneDir, "server.js");
  // Stable per-user folder (survives rebuilds, which regenerate .next/standalone)
  // for the SQLite database when DB_BACKEND=sqlite.
  const dataDir = path.join(app.getPath("userData"), "data");
  initSqlBridge(path.join(dataDir, "crickscore.sqlite"));

  // fork() (not spawn()) gives us a Node IPC channel to the child so the
  // Next.js server can proxy SQLite queries here instead of loading the
  // native better-sqlite3 addon itself (see electron/sql-bridge.cjs).
  nextProcess = fork(serverJs, [], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(PORT),
      HOSTNAME: HOST,
      CRICKSCORE_SQLITE_IPC: "1",
    },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });

  attachToChild(nextProcess);

  nextProcess.stdout?.on("data", (chunk) => {
    process.stdout.write(`[next] ${chunk}`);
  });
  nextProcess.stderr?.on("data", (chunk) => {
    process.stderr.write(`[next] ${chunk}`);
  });
  nextProcess.on("exit", (code) => {
    nextProcess = null;
    if (!shuttingDown && code && code !== 0) {
      dialog.showErrorBox(
        "CrickScore server stopped",
        `The Next.js server exited (code ${code}).`
      );
      app.quit();
    }
  });
}

function buildMenu() {
  const lanUrls = getLanUrls();
  const lanLabel =
    lanUrls.length > 0 ? `LAN: ${lanUrls[0]}` : "LAN: (no network IP)";

  return Menu.buildFromTemplate([
    {
      label: "CrickScore",
      submenu: [
        {
          label: "Show LAN address",
          click: () => {
            const lines =
              lanUrls.length > 0
                ? [
                    "Open this URL on another PC on the same Wi‑Fi:",
                    "",
                    ...lanUrls,
                    "",
                    "If it fails, set this Wi‑Fi to Private and allow Node/Electron in Windows Firewall.",
                  ]
                : ["No LAN IPv4 address found."];
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "LAN access",
              message: "Share CrickScore on your network",
              detail: lines.join("\n"),
            });
          },
        },
        {
          label: lanLabel,
          enabled: lanUrls.length > 0,
          click: () => {
            if (lanUrls[0]) void shell.openExternal(lanUrls[0]);
          },
        },
        { type: "separator" },
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
  ]);
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "CrickScore",
  });

  Menu.setApplicationMenu(buildMenu());

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  await mainWindow.loadURL(LOCAL_URL);

  const lan = getLanUrls()[0];
  if (lan) {
    mainWindow.setTitle(`CrickScore — LAN ${lan}`);
  }
}

function stopNextServer() {
  if (!nextProcess) return;
  shuttingDown = true;
  try {
    nextProcess.kill();
  } catch {
    // ignore
  }
  nextProcess = null;
}

app.whenReady().then(async () => {
  try {
    startNextServer();
    await waitForServer(LOCAL_URL);
    await createWindow();
  } catch (err) {
    stopNextServer();
    dialog.showErrorBox(
      "Could not start CrickScore",
      err instanceof Error ? err.message : String(err)
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  stopNextServer();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopNextServer();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});
