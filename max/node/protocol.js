"use strict";

const SCHEMA_VERSION = 1;
const MESSAGE_TYPES = new Set(["request", "progress", "result", "error", "cancel", "health", "shutdown"]);

class JsonLineParser {
  constructor(onMessage, onError) {
    this.buffer = "";
    this.onMessage = onMessage;
    this.onError = onError;
  }

  push(chunk) {
    this.buffer += chunk.toString("utf8");
    let newline;
    while ((newline = this.buffer.indexOf("\n")) !== -1) {
      const line = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (!line) continue;
      try { this.onMessage(JSON.parse(line)); }
      catch (error) { this.onError({code: "MALFORMED_WORKER_MESSAGE", message: error.message, line: line.slice(0, 500)}); }
    }
  }
}

function validateEnvelope(message) {
  if (!message || typeof message !== "object" || Array.isArray(message)) throw coded("INVALID_MESSAGE", "Worker message must be an object.");
  if (message.schemaVersion !== SCHEMA_VERSION) throw coded("SCHEMA_VERSION_MISMATCH", "Unsupported worker schema version.");
  if (!MESSAGE_TYPES.has(message.type)) throw coded("INVALID_MESSAGE_TYPE", "Unknown worker message type.");
  if (typeof message.requestId !== "string" || !message.requestId) throw coded("INVALID_REQUEST_ID", "Worker message is missing requestId.");
  return message;
}

function coded(code, message, details) { const error = new Error(message); error.code = code; error.details = details; return error; }
function encode(message) { validateEnvelope(message); return `${JSON.stringify(message)}\n`; }

module.exports = {SCHEMA_VERSION, JsonLineParser, validateEnvelope, encode, coded};
