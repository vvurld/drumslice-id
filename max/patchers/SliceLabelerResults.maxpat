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
          "patching_rect": [0, 0, 1240, 620],
          "presentation": 1,
          "presentation_rect": [0, 0, 1240, 620]
        }
      },
      {
        "box": {
          "id": "footer-card",
          "maxclass": "panel",
          "background": 1,
          "ignoreclick": 1,
          "border": 0,
          "rounded": 8,
          "bgcolor": [0.1647058824, 0.1764705882, 0.2117647059, 1.0],
          "patching_rect": [16, 497, 1208, 107],
          "presentation": 1,
          "presentation_rect": [16, 497, 1208, 107]
        }
      },
      {
        "box": {
          "id": "name-label",
          "maxclass": "comment",
          "text": "SELECTED NAME",
          "fontname": "Ableton Sans",
          "fontface": 1,
          "fontsize": 9,
          "textcolor": [0.6509803922, 0.6705882353, 0.7254901961, 1.0],
          "patching_rect": [30, 505, 160, 18],
          "presentation": 1,
          "presentation_rect": [30, 505, 160, 18]
        }
      },
      {
        "box": {
          "id": "apply",
          "maxclass": "textbutton",
          "text": "Apply Names",
          "annotation": "Apply all reviewed names to the Drum Rack.",
          "fontname": "Ableton Sans",
          "fontface": 1,
          "rounded": 6,
          "bgcolor": [0.3098039216, 0.6117647059, 0.7960784314, 1.0],
          "textcolor": [0.0549019608, 0.1019607843, 0.1333333333, 1.0],
          "patching_rect": [1066, 526, 134, 34],
          "presentation": 1,
          "presentation_rect": [1066, 526, 134, 34]
        }
      },
      {
        "box": {
          "id": "apply-msg",
          "maxclass": "message",
          "text": "apply",
          "patching_rect": [1066, 565, 40, 22]
        }
      },
      {
        "box": {
          "id": "title",
          "maxclass": "comment",
          "text": "Review slice labels",
          "fontname": "Ableton Sans",
          "fontface": 1,
          "textcolor": [0.9411764706, 0.9490196078, 0.968627451, 1.0],
          "fontsize": 20,
          "patching_rect": [
            24,
            14,
            400,
            28
          ],
          "presentation": 1,
          "presentation_rect": [
            24,
            14,
            400,
            28
          ]
        }
      },
      {
        "box": {
          "id": "subtitle",
          "maxclass": "comment",
          "text": "Select a slice to edit its proposed name, preserve the original, or inspect the model scores.",
          "fontname": "Ableton Sans",
          "fontsize": 11,
          "textcolor": [0.6509803922, 0.6705882353, 0.7254901961, 1.0],
          "patching_rect": [24, 43, 900, 20],
          "presentation": 1,
          "presentation_rect": [24, 43, 900, 20]
        }
      },
      {
        "box": {
          "id": "column-headings",
          "maxclass": "comment",
          "text": "PAD",
          "fontname": "Ableton Sans",
          "fontface": 1,
          "fontsize": 9,
          "textcolor": [0.6509803922, 0.6705882353, 0.7254901961, 1.0],
          "patching_rect": [24, 73, 51, 18],
          "presentation": 1,
          "presentation_rect": [24, 73, 51, 18]
        }
      },
      {
        "box": {
          "id": "heading-current",
          "maxclass": "comment",
          "text": "CURRENT NAME",
          "fontname": "Ableton Sans",
          "fontface": 1,
          "fontsize": 9,
          "textcolor": [0.6509803922, 0.6705882353, 0.7254901961, 1.0],
          "patching_rect": [79, 73, 111, 18],
          "presentation": 1,
          "presentation_rect": [79, 73, 111, 18]
        }
      },
      {
        "box": {
          "id": "heading-proposed",
          "maxclass": "comment",
          "text": "PROPOSED NAME",
          "fontname": "Ableton Sans",
          "fontface": 1,
          "fontsize": 9,
          "textcolor": [0.6509803922, 0.6705882353, 0.7254901961, 1.0],
          "patching_rect": [194, 73, 111, 18],
          "presentation": 1,
          "presentation_rect": [194, 73, 111, 18]
        }
      },
      {
        "box": {
          "id": "heading-labels",
          "maxclass": "comment",
          "text": "LABELS",
          "fontname": "Ableton Sans",
          "fontface": 1,
          "fontsize": 9,
          "textcolor": [0.6509803922, 0.6705882353, 0.7254901961, 1.0],
          "patching_rect": [309, 73, 106, 18],
          "presentation": 1,
          "presentation_rect": [309, 73, 106, 18]
        }
      },
      {
        "box": {
          "id": "heading-scores",
          "maxclass": "comment",
          "text": "MODEL SCORES",
          "fontname": "Ableton Sans",
          "fontface": 1,
          "fontsize": 9,
          "textcolor": [0.6509803922, 0.6705882353, 0.7254901961, 1.0],
          "patching_rect": [419, 73, 296, 18],
          "presentation": 1,
          "presentation_rect": [419, 73, 296, 18]
        }
      },
      {
        "box": {
          "id": "heading-decision",
          "maxclass": "comment",
          "text": "DECISION",
          "fontname": "Ableton Sans",
          "fontface": 1,
          "fontsize": 9,
          "textcolor": [0.6509803922, 0.6705882353, 0.7254901961, 1.0],
          "patching_rect": [719, 73, 121, 18],
          "presentation": 1,
          "presentation_rect": [719, 73, 121, 18]
        }
      },
      {
        "box": {
          "id": "heading-status",
          "maxclass": "comment",
          "text": "STATUS",
          "fontname": "Ableton Sans",
          "fontface": 1,
          "fontsize": 9,
          "textcolor": [0.6509803922, 0.6705882353, 0.7254901961, 1.0],
          "patching_rect": [844, 73, 86, 18],
          "presentation": 1,
          "presentation_rect": [844, 73, 86, 18]
        }
      },
      {
        "box": {
          "id": "heading-notes",
          "maxclass": "comment",
          "text": "NOTES",
          "fontname": "Ableton Sans",
          "fontface": 1,
          "fontsize": 9,
          "textcolor": [0.6509803922, 0.6705882353, 0.7254901961, 1.0],
          "patching_rect": [934, 73, 270, 18],
          "presentation": 1,
          "presentation_rect": [934, 73, 270, 18]
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
          "colhead": 0,
          "rowhead": 0,
          "fontname": "Ableton Sans",
          "fontsize": 10,
          "rowheight": 23,
          "selmode": 3,
          "just": 0,
          "hscroll": 0,
          "bgcolor": [0.1254901961, 0.1333333333, 0.1607843137, 1.0],
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "fgcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "gridlinecolor": [0.2117647059, 0.2235294118, 0.2588235294, 1.0],
          "bordercolor": [0.2117647059, 0.2235294118, 0.2588235294, 1.0],
          "hcellcolor": [0.1725490196, 0.3019607843, 0.3803921569, 1.0],
          "headercolor": [0.1647058824, 0.1764705882, 0.2117647059, 1.0],
          "patching_rect": [
            20,
            94,
            1200,
            391
          ],
          "presentation": 1,
          "presentation_rect": [
            20,
            94,
            1200,
            391
          ]
        }
      },
      {
        "box": {
          "id": "name",
          "maxclass": "textedit",
          "annotation": "Edit the proposed chain name for the selected slice.",
          "fontname": "Ableton Sans",
          "fontsize": 11,
          "bgcolor": [0.1058823529, 0.1137254902, 0.137254902, 1.0],
          "textcolor": [0.9411764706, 0.9490196078, 0.968627451, 1.0],
          "varname": "proposed_name_editor",
          "patching_rect": [
            30,
            529,
            270,
            28
          ],
          "keymode": 1,
          "presentation": 1,
          "presentation_rect": [
            30,
            529,
            270,
            28
          ]
        }
      },
      {
        "box": {
          "id": "keep",
          "maxclass": "toggle",
          "annotation": "Keep the original chain name for the selected slice.",
          "varname": "keep_original_toggle",
          "patching_rect": [
            318,
            531,
            24,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            318,
            531,
            24,
            24
          ]
        }
      },
      {
        "box": {
          "id": "keep-label",
          "maxclass": "comment",
          "text": "Keep original name",
          "fontname": "Ableton Sans",
          "textcolor": [0.8745098039, 0.8862745098, 0.9176470588, 1.0],
          "patching_rect": [
            348,
            533,
            120,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            348,
            533,
            120,
            20
          ]
        }
      },
      {
        "box": {
          "id": "reset-row",
          "maxclass": "textbutton",
          "text": "Reset Selected",
          "annotation": "Discard manual edits for the selected slice.",
          "fontname": "Ableton Sans",
          "rounded": 6,
          "bgcolor": [0.2117647059, 0.2235294118, 0.2588235294, 1.0],
          "textcolor": [0.8862745098, 0.8980392157, 0.9254901961, 1.0],
          "patching_rect": [
            482,
            530,
            110,
            28
          ],
          "presentation": 1,
          "presentation_rect": [
            482,
            530,
            110,
            28
          ]
        }
      },
      {
        "box": {
          "id": "reset-all",
          "maxclass": "textbutton",
          "text": "Reset All",
          "annotation": "Discard every manual name and keep-original override.",
          "fontname": "Ableton Sans",
          "rounded": 6,
          "bgcolor": [0.2117647059, 0.2235294118, 0.2588235294, 1.0],
          "textcolor": [0.8862745098, 0.8980392157, 0.9254901961, 1.0],
          "patching_rect": [
            600,
            530,
            88,
            28
          ],
          "presentation": 1,
          "presentation_rect": [
            600,
            530,
            88,
            28
          ]
        }
      },
      {
        "box": {
          "id": "export",
          "maxclass": "textbutton",
          "text": "Export Diagnostics",
          "annotation": "Export the current snapshot, plan, and diagnostics as JSON.",
          "fontname": "Ableton Sans",
          "fontsize": 10,
          "rounded": 6,
          "bgcolor": [0.2117647059, 0.2235294118, 0.2588235294, 1.0],
          "textcolor": [0.7333333333, 0.7529411765, 0.8, 1.0],
          "patching_rect": [
            734,
            567,
            132,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            734,
            567,
            132,
            24
          ]
        }
      },
      {
        "box": {
          "id": "clear",
          "maxclass": "textbutton",
          "text": "Clear Cache",
          "annotation": "Clear cached analysis results. This does not modify Live.",
          "fontname": "Ableton Sans",
          "fontsize": 10,
          "rounded": 6,
          "bgcolor": [0.2117647059, 0.2235294118, 0.2588235294, 1.0],
          "textcolor": [0.7333333333, 0.7529411765, 0.8, 1.0],
          "patching_rect": [
            874,
            567,
            90,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            874,
            567,
            90,
            24
          ]
        }
      },
      {
        "box": {
          "id": "cancel",
          "maxclass": "textbutton",
          "text": "Stop Analysis",
          "annotation": "Stop an analysis that is still running.",
          "fontname": "Ableton Sans",
          "fontsize": 10,
          "rounded": 6,
          "bgcolor": [0.2117647059, 0.2235294118, 0.2588235294, 1.0],
          "textcolor": [0.7333333333, 0.7529411765, 0.8, 1.0],
          "patching_rect": [
            972,
            567,
            105,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            972,
            567,
            105,
            24
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
          "annotation": "Allow Apply to replace a chain name that changed after analysis.",
          "patching_rect": [
            30,
            569,
            24,
            24
          ],
          "presentation": 1,
          "presentation_rect": [
            30,
            569,
            24,
            24
          ]
        }
      },
      {
        "box": {
          "id": "overwrite-label",
          "maxclass": "comment",
          "text": "Overwrite names changed since analysis",
          "fontname": "Ableton Sans",
          "fontsize": 10,
          "textcolor": [0.7333333333, 0.7529411765, 0.8, 1.0],
          "patching_rect": [
            60,
            571,
            245,
            20
          ],
          "presentation": 1,
          "presentation_rect": [
            60,
            571,
            245,
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
      },
      {
        "box": {
          "id": "window-loadbang",
          "maxclass": "newobj",
          "text": "loadbang",
          "patching_rect": [450, 590, 60, 22]
        }
      },
      {
        "box": {
          "id": "window-title",
          "maxclass": "message",
          "text": "title \"DrumSLICE ID — Results\"",
          "patching_rect": [520, 590, 190, 22]
        }
      },
      {
        "box": {
          "id": "window-thispatcher",
          "maxclass": "newobj",
          "text": "thispatcher",
          "patching_rect": [720, 590, 75, 22]
        }
      }
    ],
    "lines": [
      {
        "patchline": {
          "source": ["window-loadbang", 0],
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
            "apply",
            0
          ],
          "destination": [
            "apply-msg",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "apply-msg",
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
