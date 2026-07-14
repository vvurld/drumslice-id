# Migration to DrumSLICE ID

Version `0.1.0-alpha.1` completes the product rename. New installations use these canonical identities:

| Area | Legacy | Current |
| --- | --- | --- |
| Max package | `SliceLabeler` | `DrumSliceID` |
| Python module | `slice_labeler_worker` | `drumslice_id_worker` |
| User state | `~/.slice-labeler` | `~/.drumslice-id` |
| Environment prefix | `SLICE_LABELER_` | `DRUMSLICE_ID_` |
| macOS cache | `~/Library/Caches/Slice Labeler` | `~/Library/Caches/DrumSLICE ID` |
| Windows cache | `%LOCALAPPDATA%\Slice Labeler` | `%LOCALAPPDATA%\DrumSLICE ID` |

## Upgrade procedure

1. Save a backup copy of any Live Set containing a pre-rename device.
2. Run the current installer. To install the external ADTOF backend, include `--accept-adtof-license` on macOS or `-AcceptAdtofLicense` on Windows.
3. Restart Live. Replace an old saved device instance with the new **DrumSLICE ID** device before relying on the new runtime; alpha parameter-state migration is not guaranteed across the internal patcher rename.
4. Scan and Analyze again. Existing chain names are ordinary Live state and are not erased by installation.
5. After validating the new install, optionally remove preserved legacy backend/cache data with the current uninstaller's `--remove-legacy` or `-RemoveLegacy` option.

The installer removes only recognized legacy Max-package/device paths. It preserves unknown directories and the old virtual environment. Python virtual environments contain absolute launch paths and are rebuilt at the new location instead of being moved.

For one transition release, the runtime reads legacy environment-variable aliases and a legacy backend configuration when no canonical configuration exists. A legacy config starts the legacy Python module only when using that old environment. New configuration is always written with the canonical module and paths. These aliases are migration aids, not permanent API names.
