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
function setUiValue(varname, value) {
    var object;
    try {
        object = ownerPatcher && ownerPatcher.getnamed(varname);
        if (object) { object.message("set", value); }
    } catch (exception) {}
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
}
function publish() {
    outlet(0, "settings_json", JSON.stringify({
        backend: "adtof",
        modelOptions: {device: "cpu", fps: 100, maxThreads: Number(settingsValues.maxThreads), thresholds: {kick: Number(settingsValues.kick), snare: Number(settingsValues.snare), tom: Number(settingsValues.tom), hihat: Number(settingsValues.hihat), cymbal: Number(settingsValues.cymbal)}},
        mappingOptions: {preToleranceMs: Number(settingsValues.preToleranceMs), postToleranceMs: Number(settingsValues.postToleranceMs), clusterMs: Number(settingsValues.clusterMs), multiLabel: !!settingsValues.multiLabel, fallbackEnabled: !!settingsValues.fallbackEnabled, fallbackNormalizedFloor: Number(settingsValues.fallbackNormalizedFloor)},
        namingOptions: {numbering: settingsValues.numbering, longNames: !!settingsValues.longNames, preserveUnknown: !!settingsValues.preserveUnknown}
    }));
}
function bang() { syncUi(); publish(); }
function anything() {
    var args = arrayfromargs(arguments), value = args.length > 1 ? args.join(" ") : args[0], modes = ["off", "duplicates", "always"];
    if (messagename === "pythonPath") { outlet(0, "pythonpath", value); return; }
    if (messagename === "checkBackend") { outlet(0, "checkbackend"); return; }
    if (!settingsValues.hasOwnProperty(messagename)) { return; }
    if (messagename === "numbering") { value = modes[Math.max(0, Math.min(2, Number(value)))] || "duplicates"; }
    else if (messagename === "multiLabel" || messagename === "fallbackEnabled" || messagename === "longNames" || messagename === "preserveUnknown") { value = Number(value) === 1; }
    else { value = Number(value); }
    settingsValues[messagename] = value; publish();
}
