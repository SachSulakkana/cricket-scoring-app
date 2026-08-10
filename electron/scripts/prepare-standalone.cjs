/**
 * After `next build`, copy static assets Next standalone needs at runtime.
 *
 * Note: better-sqlite3 no longer needs special handling here. When run under
 * Electron, the standalone server proxies all SQLite queries over IPC to
 * Electron's main process (see electron/sql-bridge.cjs), which owns its own
 * better-sqlite3 build in electron/node_modules (rebuilt for Electron's ABI
 * via the `postinstall` script in electron/package.json). The copy of
 * better-sqlite3 traced into .next/standalone is only ever loaded when
 * running the standalone server directly with plain Node (no Electron).
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
const standalone = path.join(root, ".next", "standalone");
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(standalone, ".next", "static");
const publicSrc = path.join(root, "public");
const publicDest = path.join(standalone, "public");

// Next's standalone output does NOT include these — server-side code
// (e.g. firebase-admin) needs them at runtime or requests like
// /api/auth/session fail with 401 "Missing required environment variable".
const ENV_FILES = [".env", ".env.local", ".env.production", ".env.production.local"];

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Missing required folder: ${src}`);
  }
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

if (!fs.existsSync(standalone)) {
  console.error(
    "Standalone build not found. Run `npm run build` in the project root first."
  );
  process.exit(1);
}

copyDir(staticSrc, staticDest);
if (fs.existsSync(publicSrc)) {
  copyDir(publicSrc, publicDest);
}

let copiedEnv = 0;
for (const file of ENV_FILES) {
  const src = path.join(root, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(standalone, file));
    copiedEnv++;
  }
}
if (copiedEnv === 0) {
  console.warn(
    "Warning: no .env* files found to copy — server-side features (e.g. Firebase Admin) may fail at runtime."
  );
}

console.log("Standalone assets prepared for Electron.");
