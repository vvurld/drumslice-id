/* global arrayfromargs, messagename, outlet */
"use strict";
inlets = 1;
outlets = 1;
autowatch = 1;

var settingsValues = {
    multiLabel: true, preToleranceMs: 35, postToleranceMs: 90, clusterMs: 18,
    fallbackEnabled: true, fallbackNormalizedFloor: 0.70, numbering: "duplicates",
    longNames: false, preserveUnknown: false, maxThreads: 2,
    kick: 0.22, snare: 0.24, tom: 0.32, hihat: 0.22, cymbal: 0.30
};
var ownerPatcher = this.patcher;
var numericSpecs = {
    preToleranceMs: {min: 0, max: 500}, postToleranceMs: {min: 0, max: 500}, clusterMs: {min: 0, max: 100},
    fallbackNormalizedFloor: {min: 0.01, max: 5}, maxThreads: {min: 1, max: 8, integer: true},
    kick: {min: 0.001, max: 1}, snare: {min: 0.001, max: 1}, tom: {min: 0.001, max: 1}, hihat: {min: 0.001, max: 1}, cymbal: {min: 0.001, max: 1}
};
var uiNames = {
    multiLabel: "multi_label", preToleranceMs: "pre_tolerance_ms", postToleranceMs: "post_tolerance_ms", clusterMs: "cluster_ms",
    fallbackEnabled: "fallback_enabled", fallbackNormalizedFloor: "fallback_floor", numbering: "numbering", longNames: "long_names",
    preserveUnknown: "preserve_unknown", maxThreads: "max_threads", kick: "kick_threshold", snare: "snare_threshold", tom: "tom_threshold",
    hihat: "hihat_threshold", cymbal: "cymbal_threshold"
};
function setUiValue(varname, value) {
    var object;
    try {
        object = ownerPatcher && ownerPatcher.getnamed(varname);
        if (object) { object.message("set", value); }
    } catch (exception) {}
}
function getUiValue(varname, fallback) {
    var object, value;
    try {
        object = ownerPatcher && ownerPatcher.getnamed(varname);
        if (!object) { return fallback; }
        value = object.getvalueof();
        if (value instanceof Array) { value = value.length ? value[0] : fallback; }
        return value == null ? fallback : value;
    } catch (exception) { return fallback; }
}
function validNumber(value, current, spec) {
    value = Number(value);
    if (!isFinite(value) || value < spec.min || value > spec.max) { return current; }
    return spec.integer ? Math.round(value) : value;
}
function pullUi() {
    var key, modes = ["off", "duplicates", "always"], value;
    settingsValues.multiLabel = Number(getUiValue(uiNames.multiLabel, settingsValues.multiLabel ? 1 : 0)) === 1;
    settingsValues.fallbackEnabled = Number(getUiValue(uiNames.fallbackEnabled, settingsValues.fallbackEnabled ? 1 : 0)) === 1;
    settingsValues.longNames = Number(getUiValue(uiNames.longNames, settingsValues.longNames ? 1 : 0)) === 1;
    settingsValues.preserveUnknown = Number(getUiValue(uiNames.preserveUnknown, settingsValues.preserveUnknown ? 1 : 0)) === 1;
    value = Number(getUiValue(uiNames.numbering, 1)); settingsValues.numbering = modes[value] || settingsValues.numbering;
    for (key in numericSpecs) {
        if (numericSpecs.hasOwnProperty(key)) { settingsValues[key] = validNumber(getUiValue(uiNames[key], settingsValues[key]), settingsValues[key], numericSpecs[key]); }
    }
}
function syncThresholdSummary() {
    var object, text = "Thresholds: Kick " + Number(settingsValues.kick).toFixed(3) + " · Snare " + Number(settingsValues.snare).toFixed(3) + " · Tom " + Number(settingsValues.tom).toFixed(3) + " · Hi-hat " + Number(settingsValues.hihat).toFixed(3) + " · Cymbal " + Number(settingsValues.cymbal).toFixed(3);
    try { object = ownerPatcher && ownerPatcher.getnamed("threshold_summary"); if (object) { object.message("set", text); } } catch (exception) {}
}
function syncUi() {
    setUiValue("multi_label", settingsValues.multiLabel ? 1 : 0);
    setUiValue("pre_tolerance_ms", settingsValues.preToleranceMs);
    setUiValue("post_tolerance_ms", settingsValues.postToleranceMs);
    setUiValue("cluster_ms", settingsValues.clusterMs);
    setUiValue("fallback_enabled", settingsValues.fallbackEnabled ? 1 : 0);
    setUiValue("fallback_floor", settingsValues.fallbackNormalizedFloor);
    setUiValue("numbering", settingsValues.numbering === "off" ? 0 : (settingsValues.numbering === "always" ? 2 : 1));
    setUiValue("long_names", settingsValues.longNames ? 1 : 0);
    setUiValue("preserve_unknown", settingsValues.preserveUnknown ? 1 : 0);
    setUiValue("max_threads", settingsValues.maxThreads);
    setUiValue("kick_threshold", settingsValues.kick);
    setUiValue("snare_threshold", settingsValues.snare);
    setUiValue("tom_threshold", settingsValues.tom);
    setUiValue("hihat_threshold", settingsValues.hihat);
    setUiValue("cymbal_threshold", settingsValues.cymbal);
    syncThresholdSummary();
}
function publish() {
    outlet(0, "settings_json", JSON.stringify({
        backend: "adtof",
        modelOptions: {device: "cpu", fps: 100, maxThreads: Number(settingsValues.maxThreads), thresholds: {kick: Number(settingsValues.kick), snare: Number(settingsValues.snare), tom: Number(settingsValues.tom), hihat: Number(settingsValues.hihat), cymbal: Number(settingsValues.cymbal)}},
        mappingOptions: {preToleranceMs: Number(settingsValues.preToleranceMs), postToleranceMs: Number(settingsValues.postToleranceMs), clusterMs: Number(settingsValues.clusterMs), multiLabel: !!settingsValues.multiLabel, fallbackEnabled: !!settingsValues.fallbackEnabled, fallbackNormalizedFloor: Number(settingsValues.fallbackNormalizedFloor)},
        namingOptions: {numbering: settingsValues.numbering, longNames: !!settingsValues.longNames, preserveUnknown: !!settingsValues.preserveUnknown}
    }));
}
function bang() { pullUi(); syncUi(); publish(); }
function anything() {
    var args = arrayfromargs(arguments), value = args.length > 1 ? args.join(" ") : args[0], modes = ["off", "duplicates", "always"];
    if (messagename === "pythonPath") { if (args[0] === "text") { args.shift(); } outlet(0, "pythonpath", args.join(" ")); return; }
    if (messagename === "checkBackend") { outlet(0, "checkbackend"); return; }
    if (!settingsValues.hasOwnProperty(messagename)) { return; }
    if (messagename === "numbering") { value = modes[Math.max(0, Math.min(2, Number(value)))] || "duplicates"; }
    else if (messagename === "multiLabel" || messagename === "fallbackEnabled" || messagename === "longNames" || messagename === "preserveUnknown") { value = Number(value) === 1; }
    else if (numericSpecs[messagename]) { value = validNumber(value, settingsValues[messagename], numericSpecs[messagename]); }
    else { value = Number(value); }
    settingsValues[messagename] = value; publish();
    syncThresholdSummary();
}
