"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const roots = [
  process.env.SLICE_LABELER_ROOT,
  path.resolve(__dirname, ".."),
  path.join(os.homedir(), "Documents", "Max 9", "Packages", "SliceLabeler"),
  path.join(os.homedir(), "Documents", "Max 8", "Packages", "SliceLabeler")
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
  throw new Error("Slice Labeler Node runtime is not installed. Set SLICE_LABELER_ROOT or install the SliceLabeler Max package.");
}

orchestrator.installMaxHandlers();
