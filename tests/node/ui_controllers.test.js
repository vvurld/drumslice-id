"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function controllerRuntime(source, values = {}) {
  const emitted = [];
  const objects = {};
  for (const [name, initial] of Object.entries(values)) {
    objects[name] = {
      value: initial,
      getvalueof() { return this.value; },
      message(selector, value) { if (selector === "set") this.value = value; },
    };
  }
  const patcher = {getnamed: (name) => objects[name] || null};
  const context = vm.createContext({
    patcher,
    outlet: (...args) => emitted.push(args),
    arrayfromargs: (value) => Array.prototype.slice.call(value),
    Dict: function Dict() {},
    inlets: 0,
    outlets: 0,
    inlet: 0,
    messagename: "",
    autowatch: 0,
  });
  vm.runInContext(fs.readFileSync(path.join(ROOT, "max/javascript", source), "utf8"), context, {filename: source});
  return {context, emitted, objects};
}

test("Settings bang publishes restored control values instead of resetting defaults", () => {
  const {context, emitted, objects} = controllerRuntime("settings_controller.js", {
    multi_label: 0,
    pre_tolerance_ms: 42,
    post_tolerance_ms: 88,
    cluster_ms: 12,
    fallback_enabled: 1,
    fallback_floor: 0.9,
    numbering: 2,
    long_names: 1,
    preserve_unknown: 1,
    max_threads: 4,
    kick_threshold: 0.31,
    snare_threshold: 0.32,
    tom_threshold: 0.33,
    hihat_threshold: 0.34,
    cymbal_threshold: 0.35,
    threshold_summary: "",
  });
  context.bang();
  const message = emitted.find((item) => item[1] === "settings_json");
  const settings = JSON.parse(message[2]);
  assert.equal(settings.mappingOptions.multiLabel, false);
  assert.equal(settings.mappingOptions.preToleranceMs, 42);
  assert.equal(settings.mappingOptions.fallbackNormalizedFloor, 0.9);
  assert.equal(settings.modelOptions.maxThreads, 4);
  assert.equal(settings.modelOptions.thresholds.tom, 0.33);
  assert.equal(settings.namingOptions.numbering, "always");
  assert.equal(settings.namingOptions.longNames, true);
  assert.match(objects.threshold_summary.value, /Kick 0\.310/);
});

test("Settings rejects an out-of-range threshold without publishing it", () => {
  const {context, emitted} = controllerRuntime("settings_controller.js");
  context.messagename = "kick";
  context.anything(-1);
  const settings = JSON.parse(emitted.at(-1)[2]);
  assert.equal(settings.modelOptions.thresholds.kick, 0.22);
});

test("Results selection synchronizes editors and strips the Max text selector", () => {
  const {context, emitted, objects} = controllerRuntime("results_controller.js", {
    proposed_name_editor: "",
    keep_original_toggle: 0,
  });
  const plan = {rows: [{regionId: "r1", padNote: 36, oldName: "Slice 1", effectiveName: "K", keepOriginal: true, classes: ["kick"], scores: {kick: 0.9}, decision: "matched_event"}]};
  context.messagename = "plan";
  context.anything(JSON.stringify(plan));
  assert.equal(objects.proposed_name_editor.value, "K");
  assert.equal(objects.keep_original_toggle.value, 1);
  assert.equal(emitted.some((item) => item[0] === 0 && item[1] === "col" && item[2] === 4 && item[3] === "width" && item[4] === 300), true);
  assert.deepEqual(emitted.find((item) => item[0] === 0 && item[1] === "set" && item[2] === 4), [0, "set", 4, 0, "K 0.90 · S — · T — · HH — · CY —"]);
  context.edit("text", "New", "Name");
  assert.deepEqual(emitted.at(-1), [1, "editname", "r1", "New Name"]);
});

test("Results exposes all five raw scores and row warnings", () => {
  const {context, emitted} = controllerRuntime("results_controller.js");
  const plan = {jobId: "job", rows: [{
    regionId: "r1", padNote: 36, oldName: "Slice", effectiveName: "S", classes: ["snare"],
    scores: {kick: 0.04, snare: 0.21, tom: 0.08, hihat: 0.14, cymbal: 0.03},
    decision: "activation_fallback", warnings: ["Analyzed companion audio."],
  }]};
  context.messagename = "plan";
  context.anything(JSON.stringify(plan));

  assert.deepEqual(emitted.find((item) => item[0] === 0 && item[1] === "set" && item[2] === 4), [0, "set", 4, 0, "K 0.04 · S 0.21 · T 0.08 · HH 0.14 · CY 0.03"]);
  assert.deepEqual(emitted.find((item) => item[0] === 0 && item[1] === "set" && item[2] === 7), [0, "set", 7, 0, "Analyzed companion audio."]);
});

test("Results exposes the explicit overwrite-conflicts safety control", () => {
  const {context, emitted} = controllerRuntime("results_controller.js");
  context.messagename = "overwrite";
  context.anything(1);
  assert.deepEqual(emitted.at(-1), [1, "overwrite", 1]);
  context.anything(0);
  assert.deepEqual(emitted.at(-1), [1, "overwrite", 0]);
});

test("Results preserves the selected region across same-job plan refreshes", () => {
  const {context, emitted, objects} = controllerRuntime("results_controller.js", {
    proposed_name_editor: "",
    keep_original_toggle: 0,
  });
  const rows = [
    {regionId: "r1", padNote: 36, oldName: "One", effectiveName: "K", keepOriginal: false, classes: ["kick"], scores: {kick: 0.9}},
    {regionId: "r2", padNote: 37, oldName: "Two", effectiveName: "S", keepOriginal: false, classes: ["snare"], scores: {snare: 0.8}},
  ];
  context.messagename = "plan";
  context.anything(JSON.stringify({jobId: "same-job", rows}));
  context.selectrow(1);
  assert.equal(objects.proposed_name_editor.value, "S");

  const refreshed = JSON.parse(JSON.stringify(rows));
  refreshed[1].effectiveName = "Snare Edit";
  refreshed[1].keepOriginal = true;
  context.anything(JSON.stringify({jobId: "same-job", rows: refreshed}));

  assert.equal(context.selectedRow, 1);
  assert.equal(objects.proposed_name_editor.value, "Snare Edit");
  assert.equal(objects.keep_original_toggle.value, 1);
  context.edit("text", "Still", "Second");
  assert.deepEqual(emitted.at(-1), [1, "editname", "r2", "Still Second"]);
});
