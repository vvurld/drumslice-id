{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 9,
			"minor" : 0,
			"revision" : 5,
			"architecture" : "x64",
			"modernui" : 1
		}
,
		"classnamespace" : "box",
		"rect" : [ 134.0, 167.0, 920.0, 600.0 ],
		"openinpresentation" : 1,
		"gridsize" : [ 15.0, 15.0 ],
		"boxes" : [ 			{
				"box" : 				{
					"id" : "midi-in",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 35.0, 430.0, 42.0, 22.0 ],
					"text" : "midiin"
				}

			}
, 			{
				"box" : 				{
					"id" : "midi-out",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 35.0, 475.0, 50.0, 22.0 ],
					"text" : "midiout"
				}

			}
, 			{
				"box" : 				{
					"id" : "thisdevice",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "bang", "int", "int" ],
					"patching_rect" : [ 35.0, 30.0, 92.0, 22.0 ],
					"text" : "live.thisdevice"
				}

			}
, 			{
				"box" : 				{
					"id" : "defer",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 145.0, 30.0, 55.0, 22.0 ],
					"text" : "deferlow"
				}

			}
, 			{
				"box" : 				{
					"id" : "init-msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 215.0, 30.0, 70.0, 22.0 ],
					"text" : "initialized"
				}

			}
, 			{
				"box" : 				{
					"id" : "controller",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "" ],
					"patching_rect" : [ 340.0, 285.0, 160.0, 22.0 ],
					"saved_object_attributes" : 					{
						"filename" : "slice_labeler_bundle_v2.js",
						"parameter_enable" : 0
					}
,
					"text" : "js slice_labeler_bundle_v2.js"
				}

			}
, 			{
				"box" : 				{
					"id" : "node",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 540.0, 285.0, 371.0, 22.0 ],
					"saved_object_attributes" : 					{
						"autostart" : 1,
						"defer" : 1,
						"node_bin_path" : "",
						"npm_bin_path" : "",
						"restart" : 0,
						"watch" : 0
					}
,
					"text" : "node.script orchestrator_loader.js @autostart 1 @defer 1 @restart 0",
					"textfile" : 					{
						"filename" : "orchestrator_loader.js",
						"flags" : 0,
						"embed" : 0,
						"autowatch" : 1
					}

				}

			}
, 			{
				"box" : 				{
					"id" : "rack-label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 35.0, 90.0, 73.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 8.0, 7.0, 73.0, 20.0 ],
					"text" : "Target Rack"
				}

			}
, 			{
				"box" : 				{
					"id" : "rack-menu",
					"items" : "<empty>",
					"maxclass" : "umenu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 120.0, 90.0, 190.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 80.0, 6.0, 190.0, 22.0 ],
					"varname" : "target_rack"
				}

			}
, 			{
				"box" : 				{
					"id" : "rack-prepend",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 120.0, 125.0, 112.0, 22.0 ],
					"text" : "prepend selectrack"
				}

			}
, 			{
				"box" : 				{
					"id" : "scan",
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 35.0, 175.0, 55.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 278.0, 6.0, 55.0, 22.0 ],
					"text" : "Scan"
				}

			}
, 			{
				"box" : 				{
					"id" : "scan-msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 35.0, 210.0, 36.0, 22.0 ],
					"text" : "scan"
				}

			}
, 			{
				"box" : 				{
					"id" : "analyze",
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 105.0, 175.0, 65.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 338.0, 6.0, 65.0, 22.0 ],
					"text" : "Analyze"
				}

			}
, 			{
				"box" : 				{
					"id" : "analyze-msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 105.0, 210.0, 50.0, 22.0 ],
					"text" : "analyze"
				}

			}
, 			{
				"box" : 				{
					"id" : "cancel",
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 180.0, 175.0, 55.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 408.0, 6.0, 55.0, 22.0 ],
					"text" : "Cancel"
				}

			}
, 			{
				"box" : 				{
					"id" : "cancel-msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 180.0, 210.0, 43.0, 22.0 ],
					"text" : "cancel"
				}

			}
, 			{
				"box" : 				{
					"id" : "apply",
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 250.0, 175.0, 55.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 468.0, 6.0, 55.0, 22.0 ],
					"text" : "Apply"
				}

			}
, 			{
				"box" : 				{
					"id" : "apply-msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 250.0, 210.0, 40.0, 22.0 ],
					"text" : "apply"
				}

			}
, 			{
				"box" : 				{
					"id" : "revert",
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 320.0, 175.0, 110.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 528.0, 6.0, 110.0, 22.0 ],
					"text" : "Revert Last Apply"
				}

			}
, 			{
				"box" : 				{
					"id" : "revert-msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 320.0, 210.0, 43.0, 22.0 ],
					"text" : "revert"
				}

			}
, 			{
				"box" : 				{
					"id" : "results",
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 455.0, 175.0, 87.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 643.0, 6.0, 87.0, 22.0 ],
					"text" : "Open Results"
				}

			}
, 			{
				"box" : 				{
					"id" : "results-msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 455.0, 210.0, 35.0, 22.0 ],
					"text" : "open"
				}

			}
, 			{
				"box" : 				{
					"id" : "results-pcontrol",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 455.0, 245.0, 53.0, 22.0 ],
					"text" : "pcontrol"
				}

			}
, 			{
				"box" : 				{
					"id" : "results-abs",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 455.0, 330.0, 120.0, 22.0 ],
					"text" : "SliceLabelerResults"
				}

			}
, 			{
				"box" : 				{
					"id" : "settings",
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 555.0, 175.0, 67.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 735.0, 6.0, 67.0, 22.0 ],
					"text" : "Settings"
				}

			}
, 			{
				"box" : 				{
					"id" : "settings-msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 555.0, 210.0, 35.0, 22.0 ],
					"text" : "open"
				}

			}
, 			{
				"box" : 				{
					"id" : "settings-pcontrol",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 600.0, 210.0, 53.0, 22.0 ],
					"text" : "pcontrol"
				}

			}
, 			{
				"box" : 				{
					"id" : "settings-abs",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 600.0, 330.0, 125.0, 22.0 ],
					"text" : "SliceLabelerSettings",
					"varname" : "SliceLabelerSettings"
				}

			}
, 			{
				"box" : 				{
					"id" : "status-route",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 6,
					"outlettype" : [ "", "", "", "", "", "" ],
					"patching_rect" : [ 340.0, 375.0, 355.0, 22.0 ],
					"text" : "route status state progress rack_menu_clear rack_menu_append"
				}

			}
, 			{
				"box" : 				{
					"id" : "status-set",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 340.0, 405.0, 75.0, 22.0 ],
					"text" : "prepend set"
				}

			}
, 			{
				"box" : 				{
					"id" : "status",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 340.0, 415.0, 500.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 8.0, 34.0, 794.0, 20.0 ],
					"text" : "DEVICE_NOT_READY Slice Labeler is waiting for Live to initialize the device."
				}

			}
, 			{
				"box" : 				{
					"id" : "progress",
					"maxclass" : "live.slider",
					"numinlets" : 1,
					"numoutlets" : 2,
					"orientation" : 1,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 340.0, 445.0, 300.0, 41.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 8.0, 57.0, 794.0, 41.0 ],
					"varname" : "live.slider"
				}

			}
, 			{
				"box" : 				{
					"id" : "pattr",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 35.0, 535.0, 271.0, 22.0 ],
					"saved_object_attributes" : 					{
						"client_rect" : [ 100, 100, 500, 600 ],
						"parameter_enable" : 0,
						"parameter_mappable" : 0,
						"storage_rect" : [ 200, 200, 800, 500 ]
					}
,
					"text" : "pattrstorage slice_labeler_settings @savemode 3",
					"varname" : "slice_labeler_settings"
				}

			}
, 			{
				"box" : 				{
					"id" : "rack-clear",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 700.0, 415.0, 38.0, 22.0 ],
					"text" : "clear"
				}

			}
, 			{
				"box" : 				{
					"id" : "rack-append",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 750.0, 415.0, 96.0, 22.0 ],
					"text" : "prepend append"
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"destination" : [ "analyze-msg", 0 ],
					"source" : [ "analyze", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "controller", 0 ],
					"source" : [ "analyze-msg", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "apply-msg", 0 ],
					"source" : [ "apply", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "controller", 0 ],
					"source" : [ "apply-msg", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "cancel-msg", 0 ],
					"source" : [ "cancel", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "controller", 0 ],
					"source" : [ "cancel-msg", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "node", 0 ],
					"source" : [ "controller", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "results-abs", 0 ],
					"source" : [ "controller", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "status-route", 0 ],
					"source" : [ "controller", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "init-msg", 0 ],
					"source" : [ "defer", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "controller", 0 ],
					"source" : [ "init-msg", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "midi-out", 0 ],
					"source" : [ "midi-in", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "controller", 1 ],
					"source" : [ "node", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "rack-menu", 0 ],
					"source" : [ "rack-append", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "rack-menu", 0 ],
					"source" : [ "rack-clear", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "rack-prepend", 0 ],
					"source" : [ "rack-menu", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "controller", 0 ],
					"source" : [ "rack-prepend", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "results-msg", 0 ],
					"source" : [ "results", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "controller", 0 ],
					"source" : [ "results-abs", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "results-pcontrol", 0 ],
					"source" : [ "results-msg", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "results-abs", 0 ],
					"source" : [ "results-pcontrol", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "revert-msg", 0 ],
					"source" : [ "revert", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "controller", 0 ],
					"source" : [ "revert-msg", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "scan-msg", 0 ],
					"source" : [ "scan", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "controller", 0 ],
					"source" : [ "scan-msg", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "settings-msg", 0 ],
					"source" : [ "settings", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "controller", 0 ],
					"source" : [ "settings-abs", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "settings-pcontrol", 0 ],
					"source" : [ "settings-msg", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "settings-abs", 0 ],
					"source" : [ "settings-pcontrol", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "rack-append", 0 ],
					"source" : [ "status-route", 4 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "rack-clear", 0 ],
					"source" : [ "status-route", 3 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "status-set", 0 ],
					"source" : [ "status-route", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "status", 0 ],
					"source" : [ "status-set", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "defer", 0 ],
					"source" : [ "thisdevice", 0 ]
				}

			}
 ],
		"originid" : "pat-4",
		"parameters" : 		{
			"settings-abs::cluster" : [ "cluster_ms", "cluster_ms", 0 ],
			"settings-abs::fallback" : [ "fallback_enabled", "fallback_enabled", 0 ],
			"settings-abs::floor" : [ "fallback_floor", "fallback_floor", 0 ],
			"settings-abs::long" : [ "long_names", "long_names", 0 ],
			"settings-abs::multi-label" : [ "multi_label", "multi_label", 0 ],
			"settings-abs::post" : [ "post_tolerance_ms", "post_tolerance_ms", 0 ],
			"settings-abs::pre" : [ "pre_tolerance_ms", "pre_tolerance_ms", 0 ],
			"settings-abs::threads" : [ "max_threads", "max_threads", 0 ],
			"settings-abs::unknown" : [ "preserve_unknown", "preserve_unknown", 0 ],
			"parameterbanks" : 			{
				"0" : 				{
					"index" : 0,
					"name" : "",
					"parameters" : [ "-", "-", "-", "-", "-", "-", "-", "-" ]
				}

			}
,
			"parameter_overrides" : 			{
				"settings-abs::cluster" : 				{
					"parameter_longname" : "cluster_ms",
					"parameter_shortname" : "cluster_ms"
				}
,
				"settings-abs::fallback" : 				{
					"parameter_longname" : "fallback_enabled",
					"parameter_shortname" : "fallback_enabled"
				}
,
				"settings-abs::floor" : 				{
					"parameter_longname" : "fallback_floor",
					"parameter_shortname" : "fallback_floor"
				}
,
				"settings-abs::long" : 				{
					"parameter_longname" : "long_names",
					"parameter_shortname" : "long_names"
				}
,
				"settings-abs::multi-label" : 				{
					"parameter_longname" : "multi_label",
					"parameter_shortname" : "multi_label"
				}
,
				"settings-abs::post" : 				{
					"parameter_longname" : "post_tolerance_ms",
					"parameter_shortname" : "post_tolerance_ms"
				}
,
				"settings-abs::pre" : 				{
					"parameter_longname" : "pre_tolerance_ms",
					"parameter_shortname" : "pre_tolerance_ms"
				}
,
				"settings-abs::threads" : 				{
					"parameter_longname" : "max_threads",
					"parameter_shortname" : "max_threads"
				}
,
				"settings-abs::unknown" : 				{
					"parameter_longname" : "preserve_unknown",
					"parameter_shortname" : "preserve_unknown"
				}

			}
,
			"inherited_shortname" : 1
		}
,
		"dependency_cache" : [ ],
		"autosave" : 0,
		"oscreceiveudpport" : 0
	}

}
