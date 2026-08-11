const { app, BrowserWindow, dialog, shell, Menu } = require("electron");
const { fork } = require("child_process");
const http = require("http");
const net = require("net");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { initSqlBridge, attachToChild } = require("./sql-bridge.cjs");

// Default away from 3000 so Electron can run alongside `next dev`.
const PORT = Number(process.env.CRICKSCORE_PORT || 3456);
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

/** Fail fast if something else (usually `next dev`) already owns our port. */
function assertPortFree(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", (err) => {
      if (err && err.code === "EADDRINUSE") {
        reject(
          new Error(
            `Port ${port} is already in use (often by \`next dev\` on 3000).\n\n` +
              `Stop that process, or start Electron with a free port:\n` +
              `  set CRICKSCORE_PORT=3457 && npm start`
          )
        );
        return;
      }
      reject(err);
    });
    server.once("listening", () => {
      server.close(() => resolve());
    });
    server.listen(port, "127.0.0.1");
  });
}

function waitForServer(url, timeoutMs = 60_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      nextProcess?.off("exit", onChildExit);
      fn(value);
    };

    const onChildExit = (code) => {
      const detail = nextLogTail();
      finish(
        reject,
        new Error(
          `Next.js server exited before becoming ready (code ${code ?? "unknown"}).\n` +
            `If another app is using port ${PORT}, stop it or set CRICKSCORE_PORT.` +
            (detail ? `\n\n${detail}` : "")
        )
      );
    };

    const retry = () => {
      if (settled) return;
      if (Date.now() - started > timeoutMs) {
        finish(reject, new Error(`Server did not become ready at ${url}`));
        return;
      }
      setTimeout(tryOnce, 400);
    };

    const tryOnce = () => {
      if (settled) return;
      if (!nextProcess) {
        finish(reject, new Error("Next.js server process is not running."));
        return;
      }
      const req = http.get(url, (res) => {
        res.resume();
        // Port open alone is not enough — Next can answer with 500 while
        // still warming up. Only treat 2xx/3xx as ready.
        if (res.statusCode && res.statusCode < 400) {
          finish(resolve);
          return;
        }
        retry();
      });
      req.on("error", () => {
        retry();
      });
    };

    nextProcess?.once("exit", onChildExit);
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

const nextLogChunks = [];
const NEXT_LOG_LIMIT = 8_000;

function appendNextLog(chunk) {
  const text = String(chunk);
  nextLogChunks.push(text);
  let total = nextLogChunks.reduce((n, s) => n + s.length, 0);
  while (total > NEXT_LOG_LIMIT && nextLogChunks.length > 1) {
    total -= nextLogChunks.shift().length;
  }
}

function nextLogTail() {
  return nextLogChunks.join("").trim().slice(-NEXT_LOG_LIMIT);
}

function startNextServer() {
  const standaloneDir = resolveStandaloneDir();
  if (!standaloneDir) {
    throw new Error(
      "Next standalone build not found.\n\nFrom the project root run:\n  npm run electron:build"
    );
  }

  const serverJs = path.join(standaloneDir, "server.js");
  if (!fs.existsSync(path.join(standaloneDir, "node_modules", "next"))) {
    throw new Error(
      `Packaged standalone is missing node_modules/next.\n\nLooked in:\n  ${standaloneDir}`
    );
  }

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
      // Desktop build is always local SQLite + no Firebase login.
      DB_BACKEND: "sqlite",
      NEXT_PUBLIC_DB_BACKEND: "sqlite",
      AUTH_MODE: "none",
      NEXT_PUBLIC_AUTH_MODE: "none",
    },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });

  attachToChild(nextProcess);

  nextProcess.stdout?.on("data", (chunk) => {
    appendNextLog(chunk);
    process.stdout.write(`[next] ${chunk}`);
  });
  nextProcess.stderr?.on("data", (chunk) => {
    appendNextLog(chunk);
    process.stderr.write(`[next] ${chunk}`);
  });
  nextProcess.on("exit", (code) => {
    nextProcess = null;
    if (!shuttingDown && code && code !== 0) {
      const detail = nextLogTail();
      dialog.showErrorBox(
        "CrickScore server stopped",
        `The Next.js server exited (code ${code}).` +
          (detail ? `\n\n${detail}` : "")
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
    await assertPortFree(PORT);
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
