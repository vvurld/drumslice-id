"use strict";

const fs = require("fs");
const path = require("path");

class RotatingLogger {
  constructor(file, options = {}) { this.file = file; this.maxBytes = options.maxBytes || 1024 * 1024; this.backups = options.backups || 3; this.redactPaths = options.redactPaths !== false; }
  rotate() {
    try { if (fs.statSync(this.file).size < this.maxBytes) return; } catch { return; }
    for (let i = this.backups - 1; i >= 1; i -= 1) { const from = `${this.file}.${i}`; const to = `${this.file}.${i + 1}`; if (fs.existsSync(from)) fs.renameSync(from, to); }
    fs.renameSync(this.file, `${this.file}.1`);
  }
  write(level, message, details) {
    fs.mkdirSync(path.dirname(this.file), {recursive: true}); this.rotate();
    let payload = details == null ? undefined : JSON.stringify(details);
    if (this.redactPaths && payload) payload = payload.replace(/(?:[A-Za-z]:\\|\/Users\/|\/home\/)[^"\s]+/g, "<redacted-path>");
    fs.appendFileSync(this.file, `${new Date().toISOString()} ${level} ${message}${payload ? ` ${payload}` : ""}\n`, {encoding: "utf8", mode: 0o600});
  }
  info(message, details) { this.write("INFO", message, details); }
  error(message, details) { this.write("ERROR", message, details); }
}

module.exports = {RotatingLogger};
