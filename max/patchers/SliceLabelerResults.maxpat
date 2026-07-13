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
      120,
      120,
      1240,
      620
    ],
    "default_fontname": "Arial",
    "boxes": [
      {
        "box": {
          "id": "title",
          "maxclass": "comment",
          "text": "Slice Labeler Results — Pad | Current | Proposed | Classes | All raw scores | Decision | Status | Warnings",
          "fontsize": 16,
          "patching_rect": [
            20,
            15,
            1160,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            15,
            1160,
            24
          ]
        }
      },
      {
        "box": {
          "id": "inlet",
          "maxclass": "inlet",
          "patching_rect": [
            20,
            60,
            30,
            30
          ]
        }
      },
      {
        "box": {
          "id": "table",
          "maxclass": "jit.cellblock",
          "cols": 8,
          "rows": 129,
          "colhead": 1,
          "rowhead": 0,
          "patching_rect": [
            20,
            105,
            1200,
            385
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            105,
            1200,
            385
          ]
        }
      },
      {
        "box": {
          "id": "name",
          "maxclass": "textedit",
          "varname": "proposed_name_editor",
          "patching_rect": [
            20,
            520,
            250,
            24
          ],
          "keymode": 1,
          "presentation": 1,
          "presentation_rect": [
            20,
            520,
            250,
            24
          ]
        }
      },
      {
        "box": {
          "id": "keep",
          "maxclass": "toggle",
          "varname": "keep_original_toggle",
          "patching_rect": [
            290,
            520,
            24,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            290,
            520,
            24,
            24
          ]
        }
      },
      {
        "box": {
          "id": "keep-label",
          "maxclass": "comment",
          "text": "Keep Original",
          "patching_rect": [
            320,
            522,
            85,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            320,
            522,
            85,
            20
          ]
        }
      },
      {
        "box": {
          "id": "reset-row",
          "maxclass": "textbutton",
          "text": "Reset Row",
          "patching_rect": [
            420,
            518,
            85,
            26
          ],
          "presentation": 1,
          "presentation_rect": [
            420,
            518,
            85,
            26
          ]
        }
      },
      {
        "box": {
          "id": "reset-all",
          "maxclass": "textbutton",
          "text": "Reset All Overrides",
          "patching_rect": [
            515,
            518,
            135,
            26
          ],
          "presentation": 1,
          "presentation_rect": [
            515,
            518,
            135,
            26
          ]
        }
      },
      {
        "box": {
          "id": "export",
          "maxclass": "textbutton",
          "text": "Export Diagnostics JSON",
          "patching_rect": [
            660,
            518,
            160,
            26
          ],
          "presentation": 1,
          "presentation_rect": [
            660,
            518,
            160,
            26
          ]
        }
      },
      {
        "box": {
          "id": "clear",
          "maxclass": "textbutton",
          "text": "Clear Cache",
          "patching_rect": [
            830,
            518,
            90,
            26
          ],
          "presentation": 1,
          "presentation_rect": [
            830,
            518,
            90,
            26
          ]
        }
      },
      {
        "box": {
          "id": "cancel",
          "maxclass": "textbutton",
          "text": "Cancel Analysis",
          "patching_rect": [
            930,
            518,
            105,
            26
          ],
          "presentation": 1,
          "presentation_rect": [
            930,
            518,
            105,
            26
          ]
        }
      },
      {
        "box": {
          "id": "route",
          "maxclass": "newobj",
          "text": "route plan snapshot diagnostic",
          "patching_rect": [
            75,
            65,
            190,
            22
          ]
        }
      },
      {
        "box": {
          "id": "dict",
          "maxclass": "dict",
          "text": "slice_labeler_results",
          "patching_rect": [
            285,
            65,
            135,
            22
          ]
        }
      },
      {
        "box": {
          "id": "outlet",
          "maxclass": "outlet",
          "patching_rect": [
            995,
            565,
            30,
            30
          ]
        }
      },
      {
        "box": {
          "id": "controller",
          "maxclass": "newobj",
          "text": "js slice_labeler_results_bundle_v2.js",
          "numinlets": 2,
          "numoutlets": 2,
          "patching_rect": [
            75,
            65,
            200,
            22
          ]
        }
      },
      {
        "box": {
          "id": "name-route-text",
          "maxclass": "newobj",
          "text": "route text",
          "patching_rect": [
            20,
            555,
            75,
            22
          ]
        }
      },
      {
        "box": {
          "id": "edit-prepend",
          "maxclass": "newobj",
          "text": "prepend edit",
          "patching_rect": [
            110,
            555,
            85,
            22
          ]
        }
      },
      {
        "box": {
          "id": "keep-prepend",
          "maxclass": "newobj",
          "text": "prepend keep",
          "patching_rect": [
            290,
            555,
            85,
            22
          ]
        }
      },
      {
        "box": {
          "id": "reset-row-msg",
          "maxclass": "message",
          "text": "resetrow",
          "patching_rect": [
            420,
            555,
            58,
            22
          ]
        }
      },
      {
        "box": {
          "id": "reset-all-msg",
          "maxclass": "message",
          "text": "resetall",
          "patching_rect": [
            515,
            555,
            52,
            22
          ]
        }
      },
      {
        "box": {
          "id": "export-msg",
          "maxclass": "message",
          "text": "exportdiagnostics",
          "patching_rect": [
            660,
            555,
            110,
            22
          ]
        }
      },
      {
        "box": {
          "id": "clear-msg",
          "maxclass": "message",
          "text": "clearcache",
          "patching_rect": [
            830,
            555,
            67,
            22
          ]
        }
      },
      {
        "box": {
          "id": "cancel-msg",
          "maxclass": "message",
          "text": "cancelanalysis",
          "patching_rect": [
            910,
            555,
            90,
            22
          ]
        }
      },
      {
        "box": {
          "id": "overwrite",
          "maxclass": "toggle",
          "patching_rect": [
            20,
            590,
            24,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            590,
            24,
            24
          ]
        }
      },
      {
        "box": {
          "id": "overwrite-label",
          "maxclass": "comment",
          "text": "Overwrite manual name conflicts on Apply",
          "patching_rect": [
            50,
            592,
            260,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            50,
            592,
            260,
            20
          ]
        }
      },
      {
        "box": {
          "id": "overwrite-prepend",
          "maxclass": "newobj",
          "text": "prepend overwrite",
          "patching_rect": [
            320,
            590,
            115,
            22
          ]
        }
      }
    ],
    "lines": [
      {
        "patchline": {
          "source": [
            "inlet",
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
            "table",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "table",
            0
          ],
          "destination": [
            "controller",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "controller",
            1
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
            "name",
            0
          ],
          "destination": [
            "name-route-text",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "name-route-text",
            0
          ],
          "destination": [
            "edit-prepend",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "edit-prepend",
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
            "keep",
            0
          ],
          "destination": [
            "keep-prepend",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "keep-prepend",
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
            "reset-row",
            0
          ],
          "destination": [
            "reset-row-msg",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "reset-row-msg",
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
            "reset-all",
            0
          ],
          "destination": [
            "reset-all-msg",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "reset-all-msg",
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
            "export",
            0
          ],
          "destination": [
            "export-msg",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "export-msg",
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
            "clear",
            0
          ],
          "destination": [
            "clear-msg",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "clear-msg",
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
            "cancel",
            0
          ],
          "destination": [
            "cancel-msg",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "cancel-msg",
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
            "overwrite",
            0
          ],
          "destination": [
            "overwrite-prepend",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "overwrite-prepend",
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
