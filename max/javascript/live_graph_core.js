/* Pure graph algorithms shared by mocked LiveAPI tests. ES5-compatible. */
(function (root) {
    "use strict";
    function downstreamRacks(deviceIds, currentId, readDevice) {
        var current = deviceIds.indexOf(currentId), out = [], i, device;
        if (current < 0) { return out; }
        for (i = current + 1; i < deviceIds.length; i += 1) { device = readDevice(deviceIds[i]); if (device.canHaveDrumPads === 1 && device.hasDrumPads !== 0) { out.push({id: deviceIds[i], deviceIndex: i, downstreamOffset: i - current, name: device.name}); } }
        return out;
    }
    function reachableSimplers(chainId, graph, maxDepth) {
        var found = [], warnings = [], seen = {}, walkChain, walkDevice;
        maxDepth = maxDepth == null ? 8 : maxDepth;
        walkChain = function (id, depth) { var chain = graph.chains[id], i; if (depth > maxDepth) { warnings.push("MAX_DEPTH"); return; } if (seen[id]) { warnings.push("CYCLE"); return; } seen[id] = true; if (!chain) { return; } for (i = 0; i < chain.devices.length; i += 1) { walkDevice(chain.devices[i], depth); } };
        walkDevice = function (id, depth) { var device = graph.devices[id], i; if (!device) { return; } if (device.type === "SimplerDevice") { found.push(id); return; } if (device.chains) { for (i = 0; i < device.chains.length; i += 1) { walkChain(device.chains[i], depth + 1); } } };
        walkChain(chainId, 0); return {matches: found, warnings: warnings};
    }
    function validateIdentity(before, after, overwrite) {
        if (!after || before.chainKey !== after.chainKey || before.sourcePath !== after.sourcePath || before.sampleRate !== after.sampleRate || before.startFrame !== after.startFrame || before.endFrame !== after.endFrame) { return {ok: false, stale: true}; }
        if (!overwrite && before.chainName !== after.chainName) { return {ok: false, stale: false, conflict: true}; }
        return {ok: true};
    }
    function applyRows(rows, current, write, overwrite) {
        var result = [], i, row, item;
        for (i = 0; i < rows.length; i += 1) { row = rows[i]; item = current(row.regionId); if (row.keepOriginal) { result.push({regionId: row.regionId, status: "kept"}); } else if (!item || item.stale) { result.push({regionId: row.regionId, status: "stale"}); } else if (!overwrite && item.name !== row.oldName) { result.push({regionId: row.regionId, status: "conflict"}); } else { write(row.regionId, row.effectiveName); result.push({regionId: row.regionId, status: "applied"}); } }
        return result;
    }
    function revertWrites(writes, current, write) {
        var result = [], i, entry, item;
        for (i = 0; i < writes.length; i += 1) { entry = writes[i]; item = current(entry.regionId); if (item && !item.stale && item.name === entry.appliedName) { write(entry.regionId, entry.oldName); result.push({regionId: entry.regionId, status: "reverted"}); } else { result.push({regionId: entry.regionId, status: "conflict"}); } }
        return result;
    }
    var api = {downstreamRacks: downstreamRacks, reachableSimplers: reachableSimplers, validateIdentity: validateIdentity, applyRows: applyRows, revertWrites: revertWrites};
    root.SliceLabelerLiveGraph = api; if (typeof module !== "undefined" && module.exports) { module.exports = api; }
}(this));
