/* Patch-relative loader keeps user-specific absolute paths out of the device source. */
var sliceLabelerBase = this.patcher.filepath.replace(/[/\\][^/\\]+$/, "");
include(sliceLabelerBase + "/../javascript/live_value_helpers.js");
include(sliceLabelerBase + "/../javascript/naming_engine.js");
include(sliceLabelerBase + "/../javascript/live_controller.js");
