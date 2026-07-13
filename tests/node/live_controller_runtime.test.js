"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function ids(...values) {
  return values.flatMap((value) => ["id", value]);
}

function runtime() {
  const graph = {
    thisDeviceTrackId: 1,
    objects: {
      1: {type: "Track", path: "live_set tracks 0", props: {name: "Breaks", devices: ids(10, 20)}},
      10: {type: "MaxDevice", path: "live_set tracks 0 devices 0", props: {name: "Slice Labeler", can_have_drum_pads: 0}},
      20: {type: "RackDevice", path: "live_set tracks 0 devices 1", props: {name: "Amen Rack", can_have_drum_pads: 1, has_drum_pads: 1, drum_pads: ids(30)}},
      30: {type: "DrumPad", path: "live_set tracks 0 devices 1 drum_pads 36", props: {note: 36, name: "Slice 1", chains: ids(40)}},
      40: {type: "Chain", path: "live_set tracks 0 devices 1 chains 0", props: {name: "Slice 1", devices: ids(50)}},
      50: {type: "SimplerDevice", path: "live_set tracks 0 devices 1 chains 0 devices 0", props: {multi_sample_mode: 0, playback_mode: 0, sample: ids(60), can_have_chains: 0}},
      60: {type: "Sample", path: "sample 60", props: {file_path: "/tmp/amen.wav", sample_rate: 48000, length: 48000, start_marker: 0, end_marker: 24000}},
    },
  };
  graph.paths = Object.fromEntries(Object.entries(graph.objects).map(([id, object]) => [object.path, Number(id)]));

  function LiveAPI() { this._id = 0; }
  Object.defineProperties(LiveAPI.prototype, {
    id: {
      get() { return this._id; },
      set(value) { this._id = Number(value) || 0; },
    },
    path: {
      get() { return graph.objects[this._id] ? graph.objects[this._id].path : ""; },
      set(value) {
        const normalized = String(value).replace(/^"|"$/g, "");
        if (normalized === "this_device") this._id = 10;
        else if (normalized === "this_device canonical_parent") this._id = graph.thisDeviceTrackId;
        else this._id = graph.paths[normalized] || 0;
      },
    },
    type: {get() { return graph.objects[this._id] ? graph.objects[this._id].type : ""; }},
  });
  LiveAPI.prototype.get = function get(property) {
    const object = graph.objects[this._id];
    if (!object) throw new Error("invalid Live object");
    if (object.throwOnGet && object.throwOnGet[property]) throw new Error(`failed LiveAPI read: ${property}`);
    return object.props[property];
  };
  LiveAPI.prototype.set = function set(property, value) {
    const object = graph.objects[this._id];
    if (!object) throw new Error("invalid Live object");
    object.props[property] = value;
  };

  function Task(fn, owner) { this.fn = fn; this.owner = owner; }
  Task.prototype.schedule = function schedule() { this.fn.call(this.owner); };

  const emitted = [];
  const context = vm.createContext({
    LiveAPI,
    Task,
    Dict: function Dict() {},
    outlet: (...args) => emitted.push(args),
    post: () => {},
    arrayfromargs: (value) => Array.prototype.slice.call(value),
    autowatch: 0,
    inlets: 0,
    outlets: 0,
    inlet: 0,
    messagename: "",
    console,
  });
  for (const source of ["live_value_helpers.js", "naming_engine.js", "live_controller.js"]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, "max/javascript", source), "utf8"), context, {filename: source});
  }
  context.initialized();
  return {context, graph, emitted};
}

function analyzeOne(context, classes = ["kick"]) {
  context.scan();
  context.analyze();
  const jobId = context.snapshot.jobId;
  context.receiveNode("result", JSON.stringify({
    schemaVersion: 1,
    type: "result",
    requestId: "request-1",
    jobId,
    predictions: [{regionId: context.snapshot.regions[0].regionId, classes, scores: {kick: 0.9}, matchedEvents: [], decision: "matched_event", topScore: 0.9, warnings: []}],
  }));
  assert.equal(context.state, "REVIEW_READY");
}

test("structured Node error selector reaches the response parser", () => {
  const {context, emitted} = runtime();
  assert.equal(typeof context.error, "undefined");
  context.inlet = 1;
  context.messagename = "error";
  context.anything(JSON.stringify({code: "BACKEND_NOT_INSTALLED", message: "Configure Python."}));
  assert.equal(context.state, "ERROR");
  assert.ok(emitted.some((message) => message[0] === 0 && message[1] === "status" && message[2] === "BACKEND_NOT_INSTALLED"));
});

test("late cancelled responses cannot overwrite a newer scan", () => {
  const {context} = runtime();
  context.scan();
  context.analyze();
  const oldJob = context.snapshot.jobId;
  context.scan();
  assert.equal(context.state, "SCAN_READY");
  context.receiveNode("error", JSON.stringify({jobId: oldJob, code: "ANALYSIS_CANCELLED", message: "cancelled"}));
  context.receiveNode("progress", JSON.stringify({jobId: oldJob, completed: 1, total: 1}));
  assert.equal(context.state, "SCAN_READY");
});

test("rack discovery follows the device when it moves to another MIDI track", () => {
  const {context, graph} = runtime();
  graph.objects[2] = {type: "Track", path: "live_set tracks 1", props: {name: "Moved", devices: ids(10, 21)}};
  graph.objects[10].path = "live_set tracks 1 devices 0";
  graph.objects[21] = {type: "RackDevice", path: "live_set tracks 1 devices 1", props: {name: "Moved Rack", can_have_drum_pads: 1, has_drum_pads: 1, drum_pads: []}};
  graph.paths[graph.objects[2].path] = 2;
  graph.paths[graph.objects[10].path] = 10;
  graph.paths[graph.objects[21].path] = 21;
  graph.thisDeviceTrackId = 2;

  context.discoverRacks();

  assert.equal(context.trackPath, "live_set tracks 1");
  assert.equal(context.rackCandidates.length, 1);
  assert.equal(context.rackCandidates[0].id, 21);
});

test("rack discovery's constrained index fallback accepts Live's quoted paths", () => {
  const {context, graph} = runtime();
  graph.objects[1].path = '"live_set tracks 0"';
  graph.objects[10].path = '"live_set tracks 0 devices 0"';
  graph.objects[11] = {type: "MaxDevice", path: "", props: {name: "Pending ID"}};
  graph.objects[1].props.devices = ids(11, 20);

  context.discoverRacks();

  assert.equal(context.state, "READY_TO_SCAN");
  assert.equal(context.rackCandidates.length, 1);
  assert.equal(context.rackCandidates[0].id, 20);
});

test("rack discovery rejects devices that explicitly have no drum pads", () => {
  const {context, graph} = runtime();
  graph.objects[20].props.has_drum_pads = 0;
  context.discoverRacks();
  assert.equal(context.rackCandidates.length, 0);
  assert.equal(context.state, "NO_RACK");
});

test("Scan recovers after a downstream Drum Rack is added or becomes available", () => {
  const {context, graph} = runtime();
  graph.objects[20].props.has_drum_pads = 0;
  context.discoverRacks();
  assert.equal(context.state, "NO_RACK");
  graph.objects[20].props.has_drum_pads = 1;
  context.scan();
  assert.equal(context.state, "SCAN_READY");
  assert.equal(context.snapshot.rack.sessionId, 20);
});

test("rack refresh retains the selected rack by identity after reordering", () => {
  const {context, graph} = runtime();
  graph.objects[21] = {type: "RackDevice", path: "live_set tracks 0 devices 2", props: {name: "Second Rack", can_have_drum_pads: 1, has_drum_pads: 1, drum_pads: []}};
  graph.objects[1].props.devices = ids(10, 20, 21);
  context.discoverRacks();
  context.selectrack(1);
  assert.equal(context.rackCandidates[context.targetRackIndex].id, 21);

  graph.objects[19] = {type: "RackDevice", path: "live_set tracks 0 devices 1", props: {name: "Inserted Rack", can_have_drum_pads: 1, has_drum_pads: 1, drum_pads: []}};
  graph.objects[20].path = "live_set tracks 0 devices 2";
  graph.objects[21].path = "live_set tracks 0 devices 3";
  graph.objects[1].props.devices = ids(10, 19, 20, 21);
  context.discoverRacks();

  assert.equal(context.rackCandidates[context.targetRackIndex].id, 21);
});

test("an analysis uses one immutable settings snapshot while it is in flight", () => {
  const {context} = runtime();
  context.scan();
  context.analyze();
  const jobId = context.snapshot.jobId;
  context.settings_json(JSON.stringify({
    backend: "adtof",
    modelOptions: {},
    mappingOptions: {},
    namingOptions: {numbering: "off", longNames: true, preserveUnknown: false},
  }));
  context.receiveNode("result", JSON.stringify({
    schemaVersion: 1,
    type: "result",
    requestId: "request-settings",
    jobId,
    predictions: [{regionId: context.snapshot.regions[0].regionId, classes: ["kick"], scores: {kick: 0.9}, matchedEvents: [], decision: "matched_event", topScore: 0.9, warnings: []}],
  }));
  assert.equal(context.plan.rows[0].proposedName, "K");
  assert.equal(context.analysisSettings.namingOptions.longNames, true);
});

test("backend checks are blocked while analysis is active", () => {
  const {context, emitted} = runtime();
  context.scan();
  context.analyze();
  const before = emitted.length;
  context.checkbackend();
  const messages = emitted.slice(before);
  assert.equal(messages.some((message) => message[0] === 1 && message[1] === "health"), false);
  assert.equal(messages.some((message) => message[0] === 0 && message[1] === "status" && message[2] === "BUSY"), true);
});

test("rack selection cannot invalidate a deferred Apply", () => {
  const {context} = runtime();
  context.snapshot = {sentinel: true};
  context.state = "APPLYING";
  context.selectrack(0);
  assert.deepEqual(context.snapshot, {sentinel: true});
  assert.equal(context.state, "APPLYING");
});

test("Apply aborts when the remembered chain is no longer on the scanned pad", () => {
  const {context, graph} = runtime();
  analyzeOne(context);
  graph.objects[30].props.chains = ids(41);
  graph.objects[41] = {type: "Chain", path: "live_set tracks 0 devices 1 chains 1", props: {name: "Other", devices: ids(50)}};
  context.apply();
  assert.equal(context.state, "ERROR");
  assert.equal(graph.objects[40].props.name, "Slice 1");
});

test("a repeated same-name Apply preserves the prior real Revert record", () => {
  const {context, graph} = runtime();
  analyzeOne(context);
  context.apply();
  assert.equal(graph.objects[40].props.name, "K");
  assert.equal(context.lastApply.writes[0].oldName, "Slice 1");

  analyzeOne(context);
  context.apply();
  assert.equal(context.state, "APPLIED");
  assert.equal(context.plan.rows[0].status, "unchanged");
  assert.equal(context.lastApply.writes[0].oldName, "Slice 1");

  context.revert();
  assert.equal(graph.objects[40].props.name, "Slice 1");
});

test("a scan with only unsupported populated pads keeps Analyze disabled", () => {
  const {context, graph, emitted} = runtime();
  graph.objects[30].props.chains = ids(40, 41);
  graph.objects[41] = {type: "Chain", path: "live_set tracks 0 devices 1 chains 1", props: {name: "Layer", devices: ids(50)}};

  context.scan();

  assert.equal(context.snapshot.regions.length, 0);
  assert.equal(context.snapshot.skippedPads.length, 1);
  assert.equal(context.state, "READY_TO_SCAN");
  assert.equal(emitted.some((message) => message[0] === 0 && message[1] === "status" && message[2] === "NO_ANALYZABLE_PADS"), true);
  const before = emitted.length;
  context.analyze();
  assert.equal(emitted.length, before);
});

test("an incomplete nested traversal is skipped instead of accepted as one Simpler", () => {
  const {context} = runtime();
  context.findReachableSimplers = () => ({
    matches: [{id: 50, path: "live_set tracks 0 devices 1 chains 0 devices 0"}],
    warnings: ["Maximum nested rack depth reached."],
    incomplete: true,
  });

  context.scan();

  assert.equal(context.snapshot.regions.length, 0);
  assert.equal(context.snapshot.skippedPads[0].reasonCode, "INCOMPLETE_SIMPLER_TRAVERSAL");
  assert.equal(context.state, "READY_TO_SCAN");
});

test("a failed LiveAPI branch read makes nested Simpler traversal incomplete", () => {
  const {context, graph} = runtime();
  graph.objects[40].props.devices = ids(50, 51);
  graph.objects[51] = {
    type: "RackDevice",
    path: "live_set tracks 0 devices 1 chains 0 devices 1",
    props: {can_have_chains: 1},
    throwOnGet: {chains: true},
  };

  context.scan();

  assert.equal(context.snapshot.regions.length, 0);
  assert.equal(context.snapshot.skippedPads[0].reasonCode, "INCOMPLETE_SIMPLER_TRAVERSAL");
  assert.equal(context.state, "READY_TO_SCAN");
});

test("Revert remains usable after a rescan and restores only the applied name", () => {
  const {context, graph, emitted} = runtime();
  analyzeOne(context);
  context.apply();
  assert.equal(graph.objects[40].props.name, "K");
  context.scan();
  assert.equal(context.plan, null);
  assert.equal(emitted.some((message) => message[0] === 0 && message[1] === "revert_available" && message[2] === 1), true);
  context.revert();
  assert.equal(graph.objects[40].props.name, "Slice 1");
  assert.equal(context.lastApply, null);
  assert.equal(context.state, "SCAN_READY");
  assert.deepEqual(emitted.filter((message) => message[0] === 0 && message[1] === "revert_available").at(-1), [0, "revert_available", 0]);
});

test("Revert enters a busy state before deferring so it cannot be double-scheduled", () => {
  const {context, graph} = runtime();
  analyzeOne(context);
  context.apply();
  assert.equal(graph.objects[40].props.name, "K");

  const queued = [];
  context.Task = function DeferredTask(fn, owner) { this.schedule = () => queued.push(() => fn.call(owner)); };
  context.revert();
  assert.equal(context.state, "APPLYING");
  context.revert();
  assert.equal(queued.length, 1);
  queued[0]();
  assert.equal(graph.objects[40].props.name, "Slice 1");
  assert.equal(context.lastApply, null);
});

test("Revert cannot overwrite an in-flight analysis state", () => {
  const {context, emitted} = runtime();
  analyzeOne(context);
  context.apply();
  context.scan();
  context.analyze();
  assert.equal(context.state, "ANALYZING");
  assert.deepEqual(emitted.filter((message) => message[0] === 0 && message[1] === "revert_available").at(-1), [0, "revert_available", 0]);
  context.revert();
  assert.equal(context.state, "ANALYZING");
});
