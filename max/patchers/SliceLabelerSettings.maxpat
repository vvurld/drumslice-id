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
      590
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
          "maxclass": "flonum",
          "varname": "fallback_floor",
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
          "maxclass": "umenu",
          "varname": "numbering",
          "items": [
            "Off",
            ",",
            "Duplicates Only",
            ",",
            "Always"
          ],
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
          "text": "js slice_labeler_settings_bundle.js",
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
          "id": "p-python",
          "maxclass": "newobj",
          "text": "prepend pythonPath",
          "patching_rect": [
            210,
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
          "id": "kick",
          "maxclass": "flonum",
          "varname": "kick_threshold",
          "patching_rect": [
            20,
            545,
            55,
            22
          ]
        }
      },
      {
        "box": {
          "id": "snare",
          "maxclass": "flonum",
          "varname": "snare_threshold",
          "patching_rect": [
            80,
            545,
            55,
            22
          ]
        }
      },
      {
        "box": {
          "id": "tom",
          "maxclass": "flonum",
          "varname": "tom_threshold",
          "patching_rect": [
            140,
            545,
            55,
            22
          ]
        }
      },
      {
        "box": {
          "id": "hihat",
          "maxclass": "flonum",
          "varname": "hihat_threshold",
          "patching_rect": [
            200,
            545,
            55,
            22
          ]
        }
      },
      {
        "box": {
          "id": "cymbal",
          "maxclass": "flonum",
          "varname": "cymbal_threshold",
          "patching_rect": [
            260,
            545,
            55,
            22
          ]
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
          "id": "init-ui",
          "maxclass": "message",
          "text": "script sendbox multi_label 1, script sendbox pre_tolerance_ms 35, script sendbox post_tolerance_ms 90, script sendbox cluster_ms 18, script sendbox fallback_enabled 1, script sendbox fallback_floor 0.7, script sendbox numbering 1, script sendbox long_names 0, script sendbox preserve_unknown 0, script sendbox max_threads 2, script sendbox kick_threshold 0.22, script sendbox snare_threshold 0.24, script sendbox tom_threshold 0.32, script sendbox hihat_threshold 0.22, script sendbox cymbal_threshold 0.3",
          "patching_rect": [
            620,
            500,
            260,
            22
          ]
        }
      },
      {
        "box": {
          "id": "init-delay",
          "maxclass": "newobj",
          "text": "delay 100",
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
          "id": "settings-thispatcher",
          "maxclass": "newobj",
          "text": "thispatcher",
          "patching_rect": [
            620,
            535,
            70,
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
            "init-ui",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "init-ui",
            0
          ],
          "destination": [
            "settings-thispatcher",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "loadbang",
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
