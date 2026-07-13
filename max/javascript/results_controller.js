/* global arrayfromargs, messagename, outlet, Dict, autowatch */
"use strict";
inlets = 2;
outlets = 2;
autowatch = 1;

var resultPlan = null;
var resultSnapshot = null;
var resultDiagnostics = [];
var selectedRow = -1;
var ownerPatcher = this.patcher;
var SCORE_LABELS = {kick: "K", snare: "S", tom: "T", hihat: "HH", cymbal: "CY"};
var COLUMN_WIDTHS = [55, 115, 115, 110, 300, 125, 90, 260];

function parsePayload(args) {
    var text = arrayfromargs(args).join(" ");
    try { return JSON.parse(text); } catch (exception) { return null; }
}
function compactScores(scores) {
    var keys = ["kick", "snare", "tom", "hihat", "cymbal"], i, parts = [];
    for (i = 0; i < keys.length; i += 1) { parts.push((SCORE_LABELS[keys[i]] || keys[i].slice(0, 2).toUpperCase()) + " " + (scores.hasOwnProperty(keys[i]) && isFinite(Number(scores[keys[i]])) ? Number(scores[keys[i]]).toFixed(2) : "—")); }
    return parts.join(" · ");
}
function setNamed(varname, value) {
    var object;
    try { object = ownerPatcher && ownerPatcher.getnamed(varname); if (object) { object.message("set", value); } } catch (exception) {}
}
function syncSelection() {
    var row = resultPlan && selectedRow >= 0 && selectedRow < resultPlan.rows.length ? resultPlan.rows[selectedRow] : null;
    setNamed("proposed_name_editor", row ? row.effectiveName : "");
    setNamed("keep_original_toggle", row && row.keepOriginal ? 1 : 0);
}
function render() {
    var i, row;
    for (i = 0; i < COLUMN_WIDTHS.length; i += 1) { outlet(0, "col", i, "width", COLUMN_WIDTHS[i]); }
    outlet(0, "clear", "all");
    if (!resultPlan) { return; }
    for (i = 0; i < resultPlan.rows.length; i += 1) {
        row = resultPlan.rows[i];
        outlet(0, "set", 0, i, String(row.padNote));
        outlet(0, "set", 1, i, row.oldName);
        outlet(0, "set", 2, i, row.effectiveName);
        outlet(0, "set", 3, i, (row.classes || []).join(" + "));
        outlet(0, "set", 4, i, compactScores(row.scores || {}));
        outlet(0, "set", 5, i, row.decision || "");
        outlet(0, "set", 6, i, row.status || "ready");
        outlet(0, "set", 7, i, (row.warnings || []).join(" · "));
    }
}
function selectrow(row) { row = Number(row); if (resultPlan && row >= 0 && row < resultPlan.rows.length) { selectedRow = row; syncSelection(); } }
function edit() { var args = arrayfromargs(arguments); if (args[0] === "text") { args.shift(); } if (selectedRow < 0 || !resultPlan) { return; } outlet(1, "editname", resultPlan.rows[selectedRow].regionId, args.join(" ")); }
function keep(value) { if (selectedRow < 0 || !resultPlan) { return; } outlet(1, "keeporiginal", resultPlan.rows[selectedRow].regionId, Number(value)); }
function resetrow() { if (selectedRow >= 0 && resultPlan) { outlet(1, "resetrow", resultPlan.rows[selectedRow].regionId); } }
function resetall() { outlet(1, "resetall"); }
function clearcache() { outlet(1, "clearcache"); }
function cancelanalysis() { outlet(1, "cancel"); }
function exportdiagnostics() {
    var dict = new Dict("slice_labeler_diagnostics_export");
    dict.clear(); dict.parse(JSON.stringify({schemaVersion: 1, snapshot: resultSnapshot, plan: resultPlan, diagnostics: resultDiagnostics})); dict.export_json();
}
function anything() {
    var args = arrayfromargs(arguments), payload, previousPlan, previousRegionId, i;
    if (inlet === 1) {
        if (messagename === "select" && args.length > 1) { selectrow(args[1]); }
        else if (messagename === "list" && args.length > 1) { selectrow(args[1]); }
        return;
    }
    if (messagename === "overwrite") { outlet(1, "overwrite", Number(args[0]) === 1 ? 1 : 0); return; }
    if (messagename === "plan") { payload = parsePayload(args); if (payload && payload.rows instanceof Array) {
        previousPlan = resultPlan;
        previousRegionId = previousPlan && selectedRow >= 0 && selectedRow < previousPlan.rows.length ? previousPlan.rows[selectedRow].regionId : null;
        resultPlan = payload; selectedRow = payload.rows.length ? 0 : -1;
        if (previousRegionId != null && previousPlan && String(previousPlan.jobId || "") === String(payload.jobId || "")) {
            for (i = 0; i < payload.rows.length; i += 1) { if (String(payload.rows[i].regionId) === String(previousRegionId)) { selectedRow = i; break; } }
        }
        render(); syncSelection();
    } }
    else if (messagename === "snapshot") { payload = parsePayload(args); if (payload) { resultSnapshot = payload; resultPlan = null; selectedRow = -1; resultDiagnostics = []; render(); syncSelection(); } }
    else if (messagename === "diagnostic") { payload = parsePayload(args); resultDiagnostics.push(payload || args.join(" ")); }
}
