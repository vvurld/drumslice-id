{
  "patcher": {
    "fileversion": 1,
    "appversion": {
      "major": 8,
      "minor": 6,
      "revision": 0,
      "architecture": "x64",
      "modernui": 1
    },
    "classnamespace": "box",
    "rect": [
      180,
      180,
      760,
      660
    ],
    "default_fontname": "Ableton Sans",
    "default_fontsize": 11,
    "openinpresentation": 1,
    "boxes": [
      {
        "box": {
          "id": "surface",
          "maxclass": "panel",
          "background": 1,
          "ignoreclick": 1,
          "border": 0,
          "rounded": 0,
          "bgcolor": [0.1058823529, 0.1137254902, 0.137254902, 1.0],
          "patching_rect": [0, 0, 760, 660],
          "presentation": 1,
          "presentation_rect": [0, 0, 760, 660]
        }
      },
      {
        "box": {
          "id": "labels-card",
          "maxclass": "panel",
          "background": 1,
          "ignoreclick": 1,
          "border": 0,
          "rounded": 8,
          "bgcolor": [0.1647058824, 0.1764705882, 0.2117647059, 1.0],
          "patching_rect": [16, 76, 352, 250],
          "presentation": 1,
          "presentation_rect": [16, 76, 352, 250]
        }
      },
      {
        "box": {
          "id": "detection-card",
          "maxclass": "panel",
          "background": 1,
          "ignoreclick": 1,
          "border": 0,
          "rounded": 8,
          "bgcolor": [0.1647058824, 0.1764705882, 0.2117647059, 1.0],
          "patching_rect": [380, 76, 364, 250],
          "presentation": 1,
          "presentation_rect": [380, 76, 364, 250]
        }
      },
      {
        "box": {
          "id": "sensitivity-card",
          "maxclass": "panel",
          "background": 1,
          "ignoreclick": 1,
          "border": 0,
          "rounded": 8,
          "bgcolor": [0.1647058824, 0.1764705882, 0.2117647059, 1.0],
          "patching_rect": [16, 338, 728, 118],
          "presentation": 1,
          "presentation_rect": [16, 338, 728, 118]
        }
      },
      {
        "box": {
          "id": "runtime-card",
          "maxclass": "panel",
          "background": 1,
          "ignoreclick": 1,
          "border": 0,
          "rounded": 8,
          "bgcolor": [0.1647058824, 0.1764705882, 0.2117647059, 1.0],
          "patching_rect": [16, 468, 728, 150],
          "presentation": 1,
          "presentation_rect": [16, 468, 728, 150]
        }
      },
      {
        "box": {
          "id": "subtitle",
          "maxclass": "comment",
          "text": "Tune label formatting, transient context, confidence, and the local analysis runtime.",
          "fontname": "Ableton Sans",
          "fontsize": 11,
          "textcolor": [0.6509803922, 0.6705882353, 0.7254901961, 1.0],
          "patching_rect": [24, 44, 690, 20],
          "presentation": 1,
          "presentation_rect": [24, 44, 690, 20]
        }
      },
      {
        "box": {
          "id": "labels-section",
          "maxclass": "comment",
          "text": "LABEL FORMAT",
          "fontname": "Ableton Sans",
          "fontface": 1,
          "fontsize": 9,
          "textcolor": [0.6509803922, 0.6705882353, 0.7254901961, 1.0],
          "patching_rect": [32, 90, 160, 18],
          "presentation": 1,
          "presentation_rect": [32, 90, 160, 18]
        }
      },
      {
        "box": {
          "id": "detection-section",
          "maxclass": "comment",
          "text": "SLICE CONTEXT",
          "fontname": "Ableton Sans",
          "fontface": 1,
          "fontsize": 9,
          "textcolor": [0.6509803922, 0.6705882353, 0.7254901961, 1.0],
          "patching_rect": [396, 90, 160, 18],
          "presentation": 1,
          "presentation_rect": [396, 90, 160, 18]
        }
      },
      {
        "box": {
          "id": "runtime-section",
          "maxclass": "comment",
          "text": "ANALYSIS RUNTIME",
          "fontname": "Ableton Sans",
          "fontface": 1,
          "fontsize": 9,
          "textcolor": [0.6509803922, 0.6705882353, 0.7254901961, 1.0],
          "patching_rect": [32, 482, 160, 18],
          "presentation": 1,
          "presentation_rect": [32, 482, 160, 18]
        }
      },
      {
        "box": {
          "id": "runtime-help",
          "maxclass": "comment",
          "text": "Leave Python executable blank for the installed DrumSLICE ID environment. Use an override only for development or a custom runtime.",
          "fontname": "Ableton Sans",
          "fontsize": 10,
          "textcolor": [0.6509803922, 0.6705882353, 0.7254901961, 1.0],
          "patching_rect": [32, 584, 688, 22],
          "presentation": 1,
          "presentation_rect": [32, 584, 688, 22]
        }
      },
      {
        "box": {
          "id": "inlet",
          "maxclass": "inlet",
          "patching_rect": [
            575,
            15,
            30,
            30
          ]
        }
      },
      {
        "box": {
          "id": "title",
          "maxclass": "comment",
          "text": "DrumSLICE ID Settings",
          "fontname": "Ableton Sans",
          "fontface": 1,
          "fontsize": 20,
          "textcolor": [0.9411764706, 0.9490196078, 0.968627451, 1.0],
          "patching_rect": [
            24,
            14,
            250,
            28
          ],
          "presentation": 1,
          "presentation_rect": [
            24,
            14,
            250,
            28
          ]
        }
      },
      {
        "box": {
          "id": "multi-label",
          "maxclass": "live.toggle",
          "annotation": "Allow more than one instrument label when sounds overlap.",
          "activebgoncolor": [0.3098039216, 0.6117647059, 0.7960784314, 1.0],
          "bgoncolor": [0.3098039216, 0.6117647059, 0.7960784314, 1.0],
          "varname": "multi_label",
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_enum": ["off", "on"],
              "parameter_initial": [1.0],
              "parameter_initial_enable": 1,
              "parameter_linknames": 1,
              "parameter_longname": "multi_label",
              "parameter_mmax": 1.0,
              "parameter_mmin": 0.0,
              "parameter_shortname": "multi_label",
              "parameter_type": 2
            }
          },
          "patching_rect": [
            320,
            116,
            24,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            320,
            116,
            24,
            24
          ]
        }
      },
      {
        "box": {
          "id": "multi-label-label",
          "maxclass": "comment",
          "text": "Layered labels",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [
            32,
            118,
            220,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            32,
            118,
            220,
            20
          ]
        }
      },
      {
        "box": {
          "id": "pre",
          "maxclass": "live.numbox",
          "annotation": "Include this many milliseconds before each slice marker.",
          "varname": "pre_tolerance_ms",
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_initial": [35.0],
              "parameter_initial_enable": 1,
              "parameter_linknames": 1,
              "parameter_longname": "pre_tolerance_ms",
              "parameter_mmax": 500.0,
              "parameter_mmin": 0.0,
              "parameter_shortname": "pre_tolerance_ms",
              "parameter_type": 0,
              "parameter_unitstyle": 2
            }
          },
          "patching_rect": [
            656,
            116,
            70,
            22
          ],
          "presentation": 1,
          "presentation_rect": [
            656,
            116,
            70,
            22
          ]
        }
      },
      {
        "box": {
          "id": "pre-label",
          "maxclass": "comment",
          "text": "Look before marker (ms)",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [
            396,
            118,
            240,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            396,
            118,
            240,
            20
          ]
        }
      },
      {
        "box": {
          "id": "post",
          "maxclass": "live.numbox",
          "annotation": "Include this many milliseconds after each slice marker.",
          "varname": "post_tolerance_ms",
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_initial": [90.0],
              "parameter_initial_enable": 1,
              "parameter_linknames": 1,
              "parameter_longname": "post_tolerance_ms",
              "parameter_mmax": 500.0,
              "parameter_mmin": 0.0,
              "parameter_shortname": "post_tolerance_ms",
              "parameter_type": 0,
              "parameter_unitstyle": 2
            }
          },
          "patching_rect": [
            656,
            154,
            70,
            22
          ],
          "presentation": 1,
          "presentation_rect": [
            656,
            154,
            70,
            22
          ]
        }
      },
      {
        "box": {
          "id": "post-label",
          "maxclass": "comment",
          "text": "Look after marker (ms)",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [
            396,
            156,
            240,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            396,
            156,
            240,
            20
          ]
        }
      },
      {
        "box": {
          "id": "cluster",
          "maxclass": "live.numbox",
          "annotation": "Group near-simultaneous detections into a layered hit.",
          "varname": "cluster_ms",
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_initial": [18.0],
              "parameter_initial_enable": 1,
              "parameter_linknames": 1,
              "parameter_longname": "cluster_ms",
              "parameter_mmax": 100.0,
              "parameter_mmin": 0.0,
              "parameter_shortname": "cluster_ms",
              "parameter_type": 0,
              "parameter_unitstyle": 2
            }
          },
          "patching_rect": [
            656,
            192,
            70,
            22
          ],
          "presentation": 1,
          "presentation_rect": [
            656,
            192,
            70,
            22
          ]
        }
      },
      {
        "box": {
          "id": "cluster-label",
          "maxclass": "comment",
          "text": "Layer window (ms)",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [
            396,
            194,
            240,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            396,
            194,
            240,
            20
          ]
        }
      },
      {
        "box": {
          "id": "fallback",
          "maxclass": "live.toggle",
          "annotation": "Use the strongest activation when the model emits no discrete onset.",
          "activebgoncolor": [0.3098039216, 0.6117647059, 0.7960784314, 1.0],
          "bgoncolor": [0.3098039216, 0.6117647059, 0.7960784314, 1.0],
          "varname": "fallback_enabled",
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_enum": ["off", "on"],
              "parameter_initial": [1.0],
              "parameter_initial_enable": 1,
              "parameter_linknames": 1,
              "parameter_longname": "fallback_enabled",
              "parameter_mmax": 1.0,
              "parameter_mmin": 0.0,
              "parameter_shortname": "fallback_enabled",
              "parameter_type": 2
            }
          },
          "patching_rect": [
            702,
            230,
            24,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            702,
            230,
            24,
            24
          ]
        }
      },
      {
        "box": {
          "id": "fallback-label",
          "maxclass": "comment",
          "text": "Fallback detection",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [
            396,
            232,
            240,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            396,
            232,
            240,
            20
          ]
        }
      },
      {
        "box": {
          "id": "floor",
          "maxclass": "live.numbox",
          "annotation": "Minimum normalized activation accepted by fallback detection.",
          "varname": "fallback_floor",
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_initial": [0.7],
              "parameter_initial_enable": 1,
              "parameter_linknames": 1,
              "parameter_longname": "fallback_floor",
              "parameter_mmax": 5.0,
              "parameter_mmin": 0.01,
              "parameter_shortname": "fallback_floor",
              "parameter_type": 0
            }
          },
          "patching_rect": [
            656,
            268,
            70,
            22
          ],
          "presentation": 1,
          "presentation_rect": [
            656,
            268,
            70,
            22
          ]
        }
      },
      {
        "box": {
          "id": "floor-label",
          "maxclass": "comment",
          "text": "Fallback sensitivity",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [
            396,
            270,
            240,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            396,
            270,
            240,
            20
          ]
        }
      },
      {
        "box": {
          "id": "numbering",
          "maxclass": "live.menu",
          "annotation": "Choose when duplicate labels receive numeric suffixes.",
          "varname": "numbering",
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_enum": ["Off", "Duplicates Only", "Always"],
              "parameter_initial": [1.0],
              "parameter_initial_enable": 1,
              "parameter_linknames": 1,
              "parameter_longname": "numbering",
              "parameter_mmax": 2.0,
              "parameter_mmin": 0.0,
              "parameter_shortname": "numbering",
              "parameter_type": 2
            }
          },
          "patching_rect": [
            200,
            154,
            144,
            22
          ],
          "presentation": 1,
          "presentation_rect": [
            200,
            154,
            144,
            22
          ]
        }
      },
      {
        "box": {
          "id": "numbering-label",
          "maxclass": "comment",
          "text": "Number duplicate labels",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [
            32,
            156,
            158,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            32,
            156,
            158,
            20
          ]
        }
      },
      {
        "box": {
          "id": "long",
          "maxclass": "live.toggle",
          "annotation": "Use full instrument names instead of compact abbreviations.",
          "activebgoncolor": [0.3098039216, 0.6117647059, 0.7960784314, 1.0],
          "bgoncolor": [0.3098039216, 0.6117647059, 0.7960784314, 1.0],
          "varname": "long_names",
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_enum": ["off", "on"],
              "parameter_initial": [0.0],
              "parameter_initial_enable": 1,
              "parameter_linknames": 1,
              "parameter_longname": "long_names",
              "parameter_mmax": 1.0,
              "parameter_mmin": 0.0,
              "parameter_shortname": "long_names",
              "parameter_type": 2
            }
          },
          "patching_rect": [
            320,
            192,
            24,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            320,
            192,
            24,
            24
          ]
        }
      },
      {
        "box": {
          "id": "long-label",
          "maxclass": "comment",
          "text": "Full instrument names",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [
            32,
            194,
            170,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            32,
            194,
            170,
            20
          ]
        }
      },
      {
        "box": {
          "id": "unknown",
          "maxclass": "live.toggle",
          "annotation": "Do not overwrite a chain name when the classifier is uncertain.",
          "activebgoncolor": [0.3098039216, 0.6117647059, 0.7960784314, 1.0],
          "bgoncolor": [0.3098039216, 0.6117647059, 0.7960784314, 1.0],
          "varname": "preserve_unknown",
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_enum": ["off", "on"],
              "parameter_initial": [0.0],
              "parameter_initial_enable": 1,
              "parameter_linknames": 1,
              "parameter_longname": "preserve_unknown",
              "parameter_mmax": 1.0,
              "parameter_mmin": 0.0,
              "parameter_shortname": "preserve_unknown",
              "parameter_type": 2
            }
          },
          "patching_rect": [
            320,
            230,
            24,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            320,
            230,
            24,
            24
          ]
        }
      },
      {
        "box": {
          "id": "unknown-label",
          "maxclass": "comment",
          "text": "Keep names when uncertain",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [
            32,
            232,
            240,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            32,
            232,
            240,
            20
          ]
        }
      },
      {
        "box": {
          "id": "threads",
          "maxclass": "live.numbox",
          "annotation": "Limit analysis CPU threads. Zero lets the runtime choose.",
          "varname": "max_threads",
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_initial": [2.0],
              "parameter_initial_enable": 1,
              "parameter_linknames": 1,
              "parameter_longname": "max_threads",
              "parameter_mmax": 8.0,
              "parameter_mmin": 1.0,
              "parameter_shortname": "max_threads",
              "parameter_type": 1
            }
          },
          "patching_rect": [
            200,
            508,
            70,
            22
          ],
          "presentation": 1,
          "presentation_rect": [
            200,
            508,
            70,
            22
          ]
        }
      },
      {
        "box": {
          "id": "threads-label",
          "maxclass": "comment",
          "text": "CPU thread limit",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [
            32,
            510,
            180,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            32,
            510,
            180,
            20
          ]
        }
      },
      {
        "box": {
          "id": "backend",
          "maxclass": "textedit",
          "annotation": "Optional Python executable path. Leave blank to use the bundled or default runtime.",
          "fontname": "Ableton Sans",
          "bgcolor": [0.1058823529, 0.1137254902, 0.137254902, 1.0],
          "textcolor": [0.9411764706, 0.9490196078, 0.968627451, 1.0],
          "varname": "python_path",
          "keymode": 1,
          "wordwrap": 0,
          "patching_rect": [
            200,
            544,
            386,
            28
          ],
          "presentation": 1,
          "presentation_rect": [
            200,
            544,
            386,
            28
          ]
        }
      },
      {
        "box": {
          "id": "backend-label",
          "maxclass": "comment",
          "text": "Python executable",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [
            32,
            548,
            170,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            32,
            548,
            170,
            20
          ]
        }
      },
      {
        "box": {
          "id": "check",
          "maxclass": "textbutton",
          "text": "Check Runtime",
          "annotation": "Verify that the local analysis runtime and model are available.",
          "fontname": "Ableton Sans",
          "rounded": 6,
          "bgcolor": [0.3098039216, 0.6117647059, 0.7960784314, 1.0],
          "textcolor": [0.0549019608, 0.1019607843, 0.1333333333, 1.0],
          "patching_rect": [
            600,
            544,
            120,
            28
          ],
          "presentation": 1,
          "presentation_rect": [
            600,
            544,
            120,
            28
          ]
        }
      },
      {
        "box": {
          "id": "thresholds",
          "maxclass": "comment",
          "varname": "threshold_summary",
          "fontname": "Ableton Sans",
          "fontface": 1,
          "fontsize": 9,
          "textcolor": [0.6509803922, 0.6705882353, 0.7254901961, 1.0],
          "text": "Thresholds: Kick 0.22 · Snare 0.24 · Tom 0.32 · Hi-hat 0.22 · Cymbal 0.30",
          "patching_rect": [
            32,
            352,
            540,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            32,
            352,
            540,
            20
          ]
        }
      },
      {
        "box": {
          "id": "outlet",
          "maxclass": "outlet",
          "patching_rect": [
            555,
            530,
            30,
            30
          ]
        }
      },
      {
        "box": {
          "id": "controller",
          "maxclass": "newobj",
          "text": "js drumslice_id_settings_bundle_v2.js",
          "patching_rect": [
            365,
            465,
            200,
            22
          ]
        }
      },
      {
        "box": {
          "id": "loadbang",
          "maxclass": "newobj",
          "text": "loadbang",
          "patching_rect": [
            365,
            500,
            60,
            22
          ]
        }
      },
      {
        "box": {
          "id": "p-multi",
          "maxclass": "newobj",
          "text": "prepend multiLabel",
          "patching_rect": [
            300,
            55,
            120,
            22
          ]
        }
      },
      {
        "box": {
          "id": "p-pre",
          "maxclass": "newobj",
          "text": "prepend preToleranceMs",
          "patching_rect": [
            300,
            95,
            145,
            22
          ]
        }
      },
      {
        "box": {
          "id": "p-post",
          "maxclass": "newobj",
          "text": "prepend postToleranceMs",
          "patching_rect": [
            300,
            130,
            150,
            22
          ]
        }
      },
      {
        "box": {
          "id": "p-cluster",
          "maxclass": "newobj",
          "text": "prepend clusterMs",
          "patching_rect": [
            300,
            165,
            115,
            22
          ]
        }
      },
      {
        "box": {
          "id": "p-fallback",
          "maxclass": "newobj",
          "text": "prepend fallbackEnabled",
          "patching_rect": [
            300,
            200,
            150,
            22
          ]
        }
      },
      {
        "box": {
          "id": "p-floor",
          "maxclass": "newobj",
          "text": "prepend fallbackNormalizedFloor",
          "patching_rect": [
            300,
            235,
            185,
            22
          ]
        }
      },
      {
        "box": {
          "id": "p-numbering",
          "maxclass": "newobj",
          "text": "prepend numbering",
          "patching_rect": [
            360,
            275,
            115,
            22
          ]
        }
      },
      {
        "box": {
          "id": "p-long",
          "maxclass": "newobj",
          "text": "prepend longNames",
          "patching_rect": [
            300,
            310,
            120,
            22
          ]
        }
      },
      {
        "box": {
          "id": "p-unknown",
          "maxclass": "newobj",
          "text": "prepend preserveUnknown",
          "patching_rect": [
            300,
            345,
            145,
            22
          ]
        }
      },
      {
        "box": {
          "id": "p-threads",
          "maxclass": "newobj",
          "text": "prepend maxThreads",
          "patching_rect": [
            300,
            380,
            125,
            22
          ]
        }
      },
      {
        "box": {
          "id": "backend-route-text",
          "maxclass": "newobj",
          "text": "route text",
          "patching_rect": [
            210,
            450,
            75,
            22
          ]
        }
      },
      {
        "box": {
          "id": "p-python",
          "maxclass": "newobj",
          "text": "prepend pythonPath",
          "patching_rect": [
            300,
            450,
            125,
            22
          ]
        }
      },
      {
        "box": {
          "id": "p-check",
          "maxclass": "message",
          "text": "checkBackend",
          "patching_rect": [
            210,
            495,
            90,
            22
          ]
        }
      },
      {
        "box": {
          "id": "kick-threshold-label",
          "maxclass": "comment",
          "text": "Kick",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [20, 625, 55, 20],
          "presentation": 1,
          "presentation_rect": [32, 382, 96, 20]
        }
      },
      {
        "box": {
          "id": "snare-threshold-label",
          "maxclass": "comment",
          "text": "Snare",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [80, 625, 55, 20],
          "presentation": 1,
          "presentation_rect": [172, 382, 96, 20]
        }
      },
      {
        "box": {
          "id": "tom-threshold-label",
          "maxclass": "comment",
          "text": "Tom",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [140, 625, 45, 20],
          "presentation": 1,
          "presentation_rect": [312, 382, 96, 20]
        }
      },
      {
        "box": {
          "id": "hihat-threshold-label",
          "maxclass": "comment",
          "text": "Hi-hat",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [200, 625, 55, 20],
          "presentation": 1,
          "presentation_rect": [452, 382, 96, 20]
        }
      },
      {
        "box": {
          "id": "cymbal-threshold-label",
          "maxclass": "comment",
          "text": "Cymbal",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [260, 625, 60, 20],
          "presentation": 1,
          "presentation_rect": [592, 382, 96, 20]
        }
      },
      {
        "box": {
          "id": "kick",
          "maxclass": "live.numbox",
          "annotation": "Minimum confidence required to label a kick.",
          "varname": "kick_threshold",
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_initial": [0.22],
              "parameter_initial_enable": 1,
              "parameter_linknames": 1,
              "parameter_longname": "kick_threshold",
              "parameter_mmax": 1.0,
              "parameter_mmin": 0.001,
              "parameter_shortname": "kick_threshold",
              "parameter_type": 0
            }
          },
          "patching_rect": [
            20,
            545,
            55,
            22
          ],
          "presentation": 1,
          "presentation_rect": [32, 405, 96, 22]
        }
      },
      {
        "box": {
          "id": "snare",
          "maxclass": "live.numbox",
          "annotation": "Minimum confidence required to label a snare.",
          "varname": "snare_threshold",
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_initial": [0.24],
              "parameter_initial_enable": 1,
              "parameter_linknames": 1,
              "parameter_longname": "snare_threshold",
              "parameter_mmax": 1.0,
              "parameter_mmin": 0.001,
              "parameter_shortname": "snare_threshold",
              "parameter_type": 0
            }
          },
          "patching_rect": [
            80,
            545,
            55,
            22
          ],
          "presentation": 1,
          "presentation_rect": [172, 405, 96, 22]
        }
      },
      {
        "box": {
          "id": "tom",
          "maxclass": "live.numbox",
          "annotation": "Minimum confidence required to label a tom.",
          "varname": "tom_threshold",
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_initial": [0.32],
              "parameter_initial_enable": 1,
              "parameter_linknames": 1,
              "parameter_longname": "tom_threshold",
              "parameter_mmax": 1.0,
              "parameter_mmin": 0.001,
              "parameter_shortname": "tom_threshold",
              "parameter_type": 0
            }
          },
          "patching_rect": [
            140,
            545,
            55,
            22
          ],
          "presentation": 1,
          "presentation_rect": [312, 405, 96, 22]
        }
      },
      {
        "box": {
          "id": "hihat",
          "maxclass": "live.numbox",
          "annotation": "Minimum confidence required to label a hi-hat.",
          "varname": "hihat_threshold",
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_initial": [0.22],
              "parameter_initial_enable": 1,
              "parameter_linknames": 1,
              "parameter_longname": "hihat_threshold",
              "parameter_mmax": 1.0,
              "parameter_mmin": 0.001,
              "parameter_shortname": "hihat_threshold",
              "parameter_type": 0
            }
          },
          "patching_rect": [
            200,
            545,
            55,
            22
          ],
          "presentation": 1,
          "presentation_rect": [452, 405, 96, 22]
        }
      },
      {
        "box": {
          "id": "cymbal",
          "maxclass": "live.numbox",
          "annotation": "Minimum confidence required to label a cymbal.",
          "varname": "cymbal_threshold",
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_initial": [0.3],
              "parameter_initial_enable": 1,
              "parameter_linknames": 1,
              "parameter_longname": "cymbal_threshold",
              "parameter_mmax": 1.0,
              "parameter_mmin": 0.001,
              "parameter_shortname": "cymbal_threshold",
              "parameter_type": 0
            }
          },
          "patching_rect": [
            260,
            545,
            55,
            22
          ],
          "presentation": 1,
          "presentation_rect": [592, 405, 96, 22]
        }
      },
      {
        "box": {
          "id": "p-kick",
          "maxclass": "newobj",
          "text": "prepend kick",
          "patching_rect": [
            20,
            575,
            80,
            22
          ]
        }
      },
      {
        "box": {
          "id": "p-snare",
          "maxclass": "newobj",
          "text": "prepend snare",
          "patching_rect": [
            105,
            575,
            85,
            22
          ]
        }
      },
      {
        "box": {
          "id": "p-tom",
          "maxclass": "newobj",
          "text": "prepend tom",
          "patching_rect": [
            195,
            575,
            75,
            22
          ]
        }
      },
      {
        "box": {
          "id": "p-hihat",
          "maxclass": "newobj",
          "text": "prepend hihat",
          "patching_rect": [
            275,
            575,
            85,
            22
          ]
        }
      },
      {
        "box": {
          "id": "p-cymbal",
          "maxclass": "newobj",
          "text": "prepend cymbal",
          "patching_rect": [
            365,
            575,
            95,
            22
          ]
        }
      },
      {
        "box": {
          "id": "init-delay",
          "maxclass": "newobj",
          "text": "delay 150",
          "patching_rect": [
            620,
            465,
            65,
            22
          ]
        }
      },
      {
        "box": {
          "id": "window-title",
          "maxclass": "message",
          "text": "title \"DrumSLICE ID — Settings\"",
          "patching_rect": [620, 500, 195, 22]
        }
      },
      {
        "box": {
          "id": "window-thispatcher",
          "maxclass": "newobj",
          "text": "thispatcher",
          "patching_rect": [825, 500, 75, 22]
        }
      }
    ],
    "lines": [
      {
        "patchline": {
          "source": ["loadbang", 0],
          "destination": ["window-title", 0]
        }
      },
      {
        "patchline": {
          "source": ["window-title", 0],
          "destination": ["window-thispatcher", 0]
        }
      },
      {
        "patchline": {
          "source": [
            "loadbang",
            0
          ],
          "destination": [
            "init-delay",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "init-delay",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "controller",
            0
          ],
          "destination": [
            "outlet",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "multi-label",
            0
          ],
          "destination": [
            "p-multi",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-multi",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "pre",
            0
          ],
          "destination": [
            "p-pre",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-pre",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "post",
            0
          ],
          "destination": [
            "p-post",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-post",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "cluster",
            0
          ],
          "destination": [
            "p-cluster",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-cluster",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "fallback",
            0
          ],
          "destination": [
            "p-fallback",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-fallback",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "floor",
            0
          ],
          "destination": [
            "p-floor",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-floor",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "numbering",
            0
          ],
          "destination": [
            "p-numbering",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-numbering",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "long",
            0
          ],
          "destination": [
            "p-long",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-long",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "unknown",
            0
          ],
          "destination": [
            "p-unknown",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-unknown",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "threads",
            0
          ],
          "destination": [
            "p-threads",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-threads",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "backend",
            0
          ],
          "destination": [
            "backend-route-text",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "backend-route-text",
            0
          ],
          "destination": [
            "p-python",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-python",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "check",
            0
          ],
          "destination": [
            "p-check",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-check",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "kick",
            0
          ],
          "destination": [
            "p-kick",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-kick",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "snare",
            0
          ],
          "destination": [
            "p-snare",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-snare",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "tom",
            0
          ],
          "destination": [
            "p-tom",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-tom",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "hihat",
            0
          ],
          "destination": [
            "p-hihat",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-hihat",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "cymbal",
            0
          ],
          "destination": [
            "p-cymbal",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "p-cymbal",
            0
          ],
          "destination": [
            "controller",
            0
          ]
        }
      }
    ],
    "openinpresentation": 1
  }
}
