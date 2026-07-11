"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const graph = require("../../max/javascript/live_graph_core");

test("finds all downstream racks, nearest first, and ignores upstream", () => {
  const devices = {1: {name: "up", canHaveDrumPads: 1}, 2: {name: "device", canHaveDrumPads: 0}, 3: {name: "near", canHaveDrumPads: 1, hasDrumPads: 1}, 4: {name: "far", canHaveDrumPads: 1, hasDrumPads: 1}};
  assert.deepEqual(graph.downstreamRacks([1, 2, 3, 4], 2, (id) => devices[id]).map((x) => x.name), ["near", "far"]);
});

test("recursively finds one nested Simpler and detects multiples", () => {
  const g = {chains: {c: {devices: ["rack"]}, nested: {devices: ["fx", "simpler"]}}, devices: {rack: {type: "RackDevice", chains: ["nested"]}, fx: {type: "AudioEffect"}, simpler: {type: "SimplerDevice"}}};
  assert.deepEqual(graph.reachableSimplers("c", g).matches, ["simpler"]);
  g.chains.nested.devices.push("simpler2"); g.devices.simpler2 = {type: "SimplerDevice"}; assert.equal(graph.reachableSimplers("c", g).matches.length, 2);
});

test("identity validation distinguishes stale markers from name conflicts", () => {
  const before = {chainKey: 1, sourcePath: "a", sampleRate: 1, startFrame: 0, endFrame: 2, chainName: "old"};
  assert.equal(graph.validateIdentity(before, {...before, endFrame: 3}).stale, true);
  assert.equal(graph.validateIdentity(before, {...before, chainName: "manual"}).conflict, true);
});

test("apply and revert skip conflicts", () => {
  const names = {a: "old", b: "manual"}; const current = (id) => ({name: names[id]}); const write = (id, name) => { names[id] = name; };
  const applied = graph.applyRows([{regionId: "a", oldName: "old", effectiveName: "K"}, {regionId: "b", oldName: "old", effectiveName: "S"}], current, write, false);
  assert.deepEqual(applied.map((x) => x.status), ["applied", "conflict"]);
  names.a = "later edit"; assert.equal(graph.revertWrites([{regionId: "a", oldName: "old", appliedName: "K"}], current, write)[0].status, "conflict");
});
