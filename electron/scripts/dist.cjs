/**
 * Orchestrates a production Electron installable build:
 * 1. Next.js standalone build (+ asset copy)
 * 2. electron-builder packaging
 *
 * Usage (from electron/):
 *   node scripts/dist.cjs              # current platform defaults
 *   node scripts/dist.cjs --dir        # unpacked dir only (faster smoke test)
 *   node scripts/dist.cjs --win
 *   node scripts/dist.cjs --mac
 *   node scripts/dist.cjs --linux
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const electronRoot = path.resolve(__dirname, "..");
const standaloneServer = path.join(
  electronRoot,
  "..",
  ".next",
  "standalone",
  "server.js"
);

function run(command, args, opts = {}) {
  // Avoid leaking shell NODE_ENV into Next/electron-builder (breaks prod builds
  // and can skip installing electron when NODE_ENV=production).
  const env = { ...process.env, ...opts.env };
  delete env.ELECTRON_RUN_AS_NODE;
  if (!opts.keepNodeEnv) {
    delete env.NODE_ENV;
  }
  const result = spawnSync(command, args, {
    cwd: opts.cwd || electronRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    env,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

const builderArgs = process.argv.slice(2);

console.log("→ Building Next.js standalone + preparing assets…");
run("npm", ["run", "build"]);

if (!fs.existsSync(standaloneServer)) {
  console.error(
    `Standalone server missing at ${standaloneServer}. Aborting pack.`
  );
  process.exit(1);
}

const standaloneNext = path.join(
  electronRoot,
  "..",
  ".next",
  "standalone",
  "node_modules",
  "next"
);
if (!fs.existsSync(standaloneNext)) {
  console.error(
    `Standalone is missing node_modules/next at ${standaloneNext}. Aborting pack.`
  );
  process.exit(1);
}

console.log("→ Packaging with electron-builder…");
run("npx", ["electron-builder", ...builderArgs]);

console.log("Done. Output is in electron/dist/");
