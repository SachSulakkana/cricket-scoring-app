/**
 * electron-builder skips `node_modules` when copying extraResources.
 * After the app is packed, replace resources/standalone with a full
 * recursive copy of Next's standalone output (includes node_modules/next).
 */
const fs = require("fs");
const path = require("path");

exports.default = async function afterPack(context) {
  const src = path.resolve(__dirname, "..", "..", ".next", "standalone");
  const dest = path.join(context.appOutDir, "resources", "standalone");

  if (!fs.existsSync(path.join(src, "server.js"))) {
    throw new Error(
      `afterPack: standalone server missing at ${src}. Run the Next build first.`
    );
  }
  if (!fs.existsSync(path.join(src, "node_modules", "next"))) {
    throw new Error(
      `afterPack: standalone/node_modules/next missing at ${src}. ` +
        `The packaged app will crash with MODULE_NOT_FOUND.`
    );
  }

  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });

  console.log(
    `afterPack: copied standalone + node_modules → ${dest}`
  );
};
