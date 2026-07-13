"use strict";

const fs = require("node:fs");

const MAGIC = "ampf";
const MIDI_EFFECT_KIND = "mmmm";

function assertFourCC(value, label) {
  if (typeof value !== "string" || Buffer.byteLength(value, "ascii") !== 4) {
    throw new Error(`${label} must be a four-character ASCII code.`);
  }
}

function readContainer(buffer) {
  if (!Buffer.isBuffer(buffer)) throw new TypeError("AMXD input must be a Buffer.");
  if (buffer.length < 12 || buffer.subarray(0, 4).toString("ascii") !== MAGIC) {
    throw new Error("Not an AMPF Max device.");
  }

  const version = buffer.readUInt32LE(4);
  const kind = buffer.subarray(8, 12).toString("ascii");
  const chunks = [];
  let offset = 12;
  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) throw new Error(`Truncated chunk header at byte ${offset}.`);
    const name = buffer.subarray(offset, offset + 4).toString("ascii");
    const length = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + length;
    if (end > buffer.length) throw new Error(`Chunk ${name} extends past end of file.`);
    chunks.push({name, data: buffer.subarray(start, end)});
    offset = end;
  }
  return {version, kind, chunks};
}

function writeContainer({version, kind, chunks}) {
  if (!Number.isInteger(version) || version < 0 || version > 0xffffffff) {
    throw new Error("AMPF version must be an unsigned 32-bit integer.");
  }
  assertFourCC(kind, "AMPF device kind");
  if (!Array.isArray(chunks)) throw new Error("AMPF chunks must be an array.");

  const header = Buffer.alloc(12);
  header.write(MAGIC, 0, "ascii");
  header.writeUInt32LE(version, 4);
  header.write(kind, 8, "ascii");
  const encodedChunks = chunks.map((chunk) => {
    assertFourCC(chunk.name, "AMPF chunk name");
    if (!Buffer.isBuffer(chunk.data)) throw new Error(`Chunk ${chunk.name} data must be a Buffer.`);
    const chunkHeader = Buffer.alloc(8);
    chunkHeader.write(chunk.name, 0, "ascii");
    chunkHeader.writeUInt32LE(chunk.data.length, 4);
    return Buffer.concat([chunkHeader, chunk.data]);
  });
  return Buffer.concat([header, ...encodedChunks]);
}

function findJsonEnd(buffer, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < buffer.length; index += 1) {
    const byte = buffer[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (byte === 0x5c) escaped = true;
      else if (byte === 0x22) inString = false;
      continue;
    }
    if (byte === 0x22) inString = true;
    else if (byte === 0x7b || byte === 0x5b) depth += 1;
    else if (byte === 0x7d || byte === 0x5d) {
      depth -= 1;
      if (depth === 0) return index + 1;
      if (depth < 0) break;
    }
  }
  throw new Error("Patcher JSON is truncated.");
}

function decodePatcherChunk(data) {
  if (!Buffer.isBuffer(data)) throw new TypeError("ptch data must be a Buffer.");
  const collective = data.length >= 16 && data.subarray(0, 4).toString("ascii") === "mx@c";
  const searchStart = collective ? 16 : 0;
  const start = data.indexOf(0x7b, searchStart);
  if (start < 0) throw new Error("ptch chunk contains no patcher JSON object.");
  const end = findJsonEnd(data, start);
  let document;
  try {
    document = JSON.parse(data.subarray(start, end).toString("utf8"));
  } catch (error) {
    throw new Error(`ptch chunk contains malformed patcher JSON: ${error.message}`);
  }
  return {document, collective, jsonStart: start, jsonEnd: end};
}

function encodePlainPatcher(document) {
  if (!document || typeof document !== "object" || !document.patcher) {
    throw new Error("Cannot encode an incomplete patcher document.");
  }
  return Buffer.from(`${JSON.stringify(document, null, "\t")}\n\0`, "utf8");
}

function embeddedFilenames(data) {
  if (!Buffer.isBuffer(data)) throw new TypeError("collective data must be a Buffer.");
  const names = [];
  const marker = Buffer.from("fnam", "ascii");
  let offset = 0;
  while ((offset = data.indexOf(marker, offset)) >= 0) {
    if (offset + 8 <= data.length) {
      const recordLength = data.readUInt32BE(offset + 4);
      if (recordLength >= 8 && offset + recordLength <= data.length) {
        const candidate = data.subarray(offset + 8, offset + recordLength)
          .toString("utf8").replace(/\0+$/, "");
        if (candidate && !/[\x00-\x1f\x7f]/.test(candidate)) names.push(candidate);
      }
    }
    offset += marker.length;
  }
  return Array.from(new Set(names));
}

function readDevice(filePath) {
  const container = readContainer(fs.readFileSync(filePath));
  const patchChunks = container.chunks.filter((chunk) => chunk.name === "ptch");
  if (patchChunks.length !== 1) throw new Error("Device must contain exactly one ptch chunk.");
  return {...container, patchChunk: patchChunks[0], ...decodePatcherChunk(patchChunks[0].data)};
}

module.exports = {
  MIDI_EFFECT_KIND,
  decodePatcherChunk,
  embeddedFilenames,
  encodePlainPatcher,
  readContainer,
  readDevice,
  writeContainer,
};
