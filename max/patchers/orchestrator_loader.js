"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const roots = [
  process.env.DRUMSLICE_ID_ROOT,
  path.resolve(__dirname, ".."),
  path.join(os.homedir(), "Documents", "Max 9", "Packages", "DrumSliceID"),
  path.join(os.homedir(), "Documents", "Max 8", "Packages", "DrumSliceID")
].filter(Boolean);

let orchestrator = null;
for (const root of roots) {
  const candidate = path.join(root, "node", "orchestrator.js");
  if (fs.existsSync(candidate)) {
    orchestrator = require(candidate);
    break;
  }
}

if (!orchestrator) {
  throw new Error("DrumSLICE ID Node runtime is not installed. Set DRUMSLICE_ID_ROOT or install the DrumSliceID Max package.");
}

orchestrator.installMaxHandlers();
