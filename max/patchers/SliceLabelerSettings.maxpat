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
      620,
      660
    ],
    "default_fontname": "Arial",
    "boxes": [
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
          "text": "Slice Labeler Settings",
          "fontsize": 16,
          "patching_rect": [
            20,
            15,
            250,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            15,
            250,
            24
          ]
        }
      },
      {
        "box": {
          "id": "multi-label",
          "maxclass": "live.toggle",
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
            210,
            55,
            24,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            210,
            55,
            24,
            24
          ]
        }
      },
      {
        "box": {
          "id": "multi-label-label",
          "maxclass": "comment",
          "text": "Multi-label",
          "patching_rect": [
            20,
            57,
            170,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            57,
            170,
            20
          ]
        }
      },
      {
        "box": {
          "id": "pre",
          "maxclass": "live.numbox",
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
            210,
            95,
            70,
            22
          ],
          "presentation": 1,
          "presentation_rect": [
            210,
            95,
            70,
            22
          ]
        }
      },
      {
        "box": {
          "id": "pre-label",
          "maxclass": "comment",
          "text": "Pre-tolerance (ms)",
          "patching_rect": [
            20,
            97,
            170,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            97,
            170,
            20
          ]
        }
      },
      {
        "box": {
          "id": "post",
          "maxclass": "live.numbox",
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
            210,
            130,
            70,
            22
          ],
          "presentation": 1,
          "presentation_rect": [
            210,
            130,
            70,
            22
          ]
        }
      },
      {
        "box": {
          "id": "post-label",
          "maxclass": "comment",
          "text": "Post-tolerance (ms)",
          "patching_rect": [
            20,
            132,
            170,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            132,
            170,
            20
          ]
        }
      },
      {
        "box": {
          "id": "cluster",
          "maxclass": "live.numbox",
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
            210,
            165,
            70,
            22
          ],
          "presentation": 1,
          "presentation_rect": [
            210,
            165,
            70,
            22
          ]
        }
      },
      {
        "box": {
          "id": "cluster-label",
          "maxclass": "comment",
          "text": "Cluster window (ms)",
          "patching_rect": [
            20,
            167,
            170,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            167,
            170,
            20
          ]
        }
      },
      {
        "box": {
          "id": "fallback",
          "maxclass": "live.toggle",
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
            210,
            200,
            24,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            210,
            200,
            24,
            24
          ]
        }
      },
      {
        "box": {
          "id": "fallback-label",
          "maxclass": "comment",
          "text": "Activation fallback",
          "patching_rect": [
            20,
            202,
            170,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            202,
            170,
            20
          ]
        }
      },
      {
        "box": {
          "id": "floor",
          "maxclass": "live.numbox",
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
            210,
            235,
            70,
            22
          ],
          "presentation": 1,
          "presentation_rect": [
            210,
            235,
            70,
            22
          ]
        }
      },
      {
        "box": {
          "id": "floor-label",
          "maxclass": "comment",
          "text": "Fallback normalized floor",
          "patching_rect": [
            20,
            237,
            180,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            237,
            180,
            20
          ]
        }
      },
      {
        "box": {
          "id": "numbering",
          "maxclass": "live.menu",
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
            210,
            275,
            130,
            22
          ],
          "presentation": 1,
          "presentation_rect": [
            210,
            275,
            130,
            22
          ]
        }
      },
      {
        "box": {
          "id": "numbering-label",
          "maxclass": "comment",
          "text": "Numbering",
          "patching_rect": [
            20,
            277,
            170,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            277,
            170,
            20
          ]
        }
      },
      {
        "box": {
          "id": "long",
          "maxclass": "live.toggle",
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
            210,
            310,
            24,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            210,
            310,
            24,
            24
          ]
        }
      },
      {
        "box": {
          "id": "long-label",
          "maxclass": "comment",
          "text": "Long class names",
          "patching_rect": [
            20,
            312,
            170,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            312,
            170,
            20
          ]
        }
      },
      {
        "box": {
          "id": "unknown",
          "maxclass": "live.toggle",
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
            210,
            345,
            24,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            210,
            345,
            24,
            24
          ]
        }
      },
      {
        "box": {
          "id": "unknown-label",
          "maxclass": "comment",
          "text": "Preserve names for unknown",
          "patching_rect": [
            20,
            347,
            180,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            347,
            180,
            20
          ]
        }
      },
      {
        "box": {
          "id": "threads",
          "maxclass": "live.numbox",
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
            210,
            380,
            70,
            22
          ],
          "presentation": 1,
          "presentation_rect": [
            210,
            380,
            70,
            22
          ]
        }
      },
      {
        "box": {
          "id": "threads-label",
          "maxclass": "comment",
          "text": "Maximum Torch CPU threads",
          "patching_rect": [
            20,
            382,
            180,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            382,
            180,
            20
          ]
        }
      },
      {
        "box": {
          "id": "backend",
          "maxclass": "textedit",
          "varname": "python_path",
          "keymode": 1,
          "wordwrap": 0,
          "patching_rect": [
            210,
            420,
            360,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            210,
            420,
            360,
            24
          ]
        }
      },
      {
        "box": {
          "id": "backend-label",
          "maxclass": "comment",
          "text": "Backend Python path",
          "patching_rect": [
            20,
            422,
            170,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            422,
            170,
            20
          ]
        }
      },
      {
        "box": {
          "id": "check",
          "maxclass": "textbutton",
          "text": "Check Backend",
          "patching_rect": [
            210,
            465,
            110,
            26
          ],
          "presentation": 1,
          "presentation_rect": [
            210,
            465,
            110,
            26
          ]
        }
      },
      {
        "box": {
          "id": "thresholds",
          "maxclass": "comment",
          "varname": "threshold_summary",
          "text": "Thresholds: Kick 0.22 · Snare 0.24 · Tom 0.32 · Hi-hat 0.22 · Cymbal 0.30",
          "patching_rect": [
            20,
            515,
            540,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            515,
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
          "text": "js slice_labeler_settings_bundle_v2.js",
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
          "patching_rect": [20, 625, 55, 20],
          "presentation": 1,
          "presentation_rect": [20, 547, 55, 20]
        }
      },
      {
        "box": {
          "id": "snare-threshold-label",
          "maxclass": "comment",
          "text": "Snare",
          "patching_rect": [80, 625, 55, 20],
          "presentation": 1,
          "presentation_rect": [170, 547, 55, 20]
        }
      },
      {
        "box": {
          "id": "tom-threshold-label",
          "maxclass": "comment",
          "text": "Tom",
          "patching_rect": [140, 625, 45, 20],
          "presentation": 1,
          "presentation_rect": [315, 547, 40, 20]
        }
      },
      {
        "box": {
          "id": "hihat-threshold-label",
          "maxclass": "comment",
          "text": "Hi-hat",
          "patching_rect": [200, 625, 55, 20],
          "presentation": 1,
          "presentation_rect": [20, 582, 55, 20]
        }
      },
      {
        "box": {
          "id": "cymbal-threshold-label",
          "maxclass": "comment",
          "text": "Cymbal",
          "patching_rect": [260, 625, 60, 20],
          "presentation": 1,
          "presentation_rect": [170, 582, 60, 20]
        }
      },
      {
        "box": {
          "id": "kick",
          "maxclass": "live.numbox",
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
          "presentation_rect": [85, 545, 60, 22]
        }
      },
      {
        "box": {
          "id": "snare",
          "maxclass": "live.numbox",
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
          "presentation_rect": [230, 545, 60, 22]
        }
      },
      {
        "box": {
          "id": "tom",
          "maxclass": "live.numbox",
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
          "presentation_rect": [360, 545, 60, 22]
        }
      },
      {
        "box": {
          "id": "hihat",
          "maxclass": "live.numbox",
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
          "presentation_rect": [85, 580, 60, 22]
        }
      },
      {
        "box": {
          "id": "cymbal",
          "maxclass": "live.numbox",
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
          "presentation_rect": [235, 580, 60, 22]
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
      }
    ],
    "lines": [
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
