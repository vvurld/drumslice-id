"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");

function patcher(name) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "max/patchers", name), "utf8")).patcher;
}

function boxesById(patch) {
  return new Map(patch.boxes.map(({box}) => [box.id, box]));
}

function hasLine(patch, sourceId, sourceOutlet, destinationId, destinationInlet) {
  return patch.lines.some(({patchline}) =>
    patchline.source[0] === sourceId && patchline.source[1] === sourceOutlet &&
    patchline.destination[0] === destinationId && patchline.destination[1] === destinationInlet);
}

test("main Max patch preserves MIDI and wires state/progress/runtime paths", () => {
  const patch = patcher("DrumSliceID.maxpat");
  const boxes = boxesById(patch);
  assert.equal(hasLine(patch, "midi-in", 0, "midi-out", 0), true);
  assert.equal(hasLine(patch, "controller", 1, "node", 0), true);
  assert.equal(hasLine(patch, "node", 0, "controller", 1), true);
  assert.equal(hasLine(patch, "status-route", 2, "progress-unpack", 0), true);
  assert.equal(hasLine(patch, "status-route", 1, "state-ui-route", 0), true);
  assert.equal(hasLine(patch, "status-route", 5, "revert-active", 0), true);
  assert.equal(hasLine(patch, "status-route", 6, "status-set", 0), true);
  assert.equal(hasLine(patch, "progress-unpack", 2, "progress-label-set", 0), true);
  assert.equal(hasLine(patch, "progress-unpack", 2, "status-set", 0), true, "compact status must show live analysis progress");
  assert.equal(hasLine(patch, "state-ui-route", 1, "state-ready-scan", 0), true, "NO_RACK must leave Scan available for rediscovery");
  assert.equal(boxes.get("analyze-msg").text, "scanandanalyze");
  assert.equal(boxes.get("progress").maxclass, "multislider");
  assert.notEqual(boxes.get("progress").presentation, 1, "progress bar should stay out of the device UI");
  assert.notEqual(boxes.get("progress-label").presentation, 1, "duplicate progress text should stay out of the device UI");
  assert.equal(patch.devicewidth, 560);
  assert.deepEqual(patch.openrect, [0, 0, 0, 169]);
  assert.deepEqual(boxes.get("surface").presentation_rect, [0, 0, 560, 169]);
  assert.deepEqual(boxes.get("status-card").presentation_rect, [14, 102, 532, 50]);
  assert.notEqual(boxes.get("rack-label").presentation, 1);
  assert.notEqual(boxes.get("workflow-hint").presentation, 1);
  for (let i = 1; i <= 7; i += 1) assert.equal(boxes.get(`slice-mark-${i}`).presentation, 1);
  for (const id of ["scan-active", "analyze-active", "cancel-active", "apply-active", "revert-active", "results-active"]) {
    assert.ok(boxes.has(id), `missing state gate ${id}`);
  }
  assert.equal(Array.from(boxes.values()).some((box) => String(box.text || "").startsWith("pattrstorage ")), false);
});

test("Settings exposes every required classifier control with persisted safe ranges", () => {
  const patch = patcher("DrumSliceIDSettings.maxpat");
  const boxes = boxesById(patch);
  assert.equal(patch.openinpresentation, 1);
  assert.equal(boxes.get("controller").text, "js drumslice_id_settings_bundle_v2.js");
  assert.equal(boxes.get("title").text, "DrumSLICE ID Settings");
  assert.equal(boxes.get("window-title").text, 'title "DrumSLICE ID — Settings"');
  assert.equal(hasLine(patch, "loadbang", 0, "window-title", 0), true);
  assert.equal(hasLine(patch, "window-title", 0, "window-thispatcher", 0), true);
  for (const id of ["kick", "snare", "tom", "hihat", "cymbal"]) {
    const box = boxes.get(id);
    assert.equal(box.presentation, 1, `${id} threshold is hidden`);
    assert.equal(box.parameter_enable, 1, `${id} threshold is not persisted`);
    const attributes = box.saved_attribute_attributes.valueof;
    assert.ok(attributes.parameter_initial[0] > 0 && attributes.parameter_initial[0] <= 1);
    assert.ok(attributes.parameter_mmin > 0 && attributes.parameter_mmax === 1);
  }
  assert.equal(hasLine(patch, "backend", 0, "backend-route-text", 0), true);
  assert.equal(hasLine(patch, "backend-route-text", 0, "p-python", 0), true);
  assert.equal(hasLine(patch, "loadbang", 0, "init-delay", 0), true);
  assert.equal(hasLine(patch, "init-delay", 0, "controller", 0), true);
  assert.equal(Array.from(boxes.values()).some((box) => box.id === "init-ui" || box.id === "settings-thispatcher"), false);
});

test("Results text editing strips Max's text selector and has synchronized controls", () => {
  const patch = patcher("DrumSliceIDResults.maxpat");
  const boxes = boxesById(patch);
  assert.equal(patch.openinpresentation, 1);
  assert.equal(boxes.get("controller").text, "js drumslice_id_results_bundle_v2.js");
  assert.equal(boxes.get("window-title").text, 'title "DrumSLICE ID — Results"');
  assert.equal(hasLine(patch, "window-loadbang", 0, "window-title", 0), true);
  assert.equal(hasLine(patch, "window-title", 0, "window-thispatcher", 0), true);
  assert.equal(boxes.get("name").varname, "proposed_name_editor");
  assert.equal(boxes.get("keep").varname, "keep_original_toggle");
  assert.equal(hasLine(patch, "name", 0, "name-route-text", 0), true);
  assert.equal(hasLine(patch, "name-route-text", 0, "edit-prepend", 0), true);
  assert.equal(hasLine(patch, "apply", 0, "apply-msg", 0), true);
  assert.equal(hasLine(patch, "apply-msg", 0, "outlet", 0), true);
});
