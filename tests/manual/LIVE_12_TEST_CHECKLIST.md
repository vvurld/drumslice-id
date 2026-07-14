# Live 12 manual acceptance checklist

Record Live/Max versions, machine, Set name, and date. For each item record Pass, Fail, or Not Run plus evidence.

## Alpha candidate record — 2026-07-14

- Candidate: DrumSLICE ID `0.1.0-alpha.1`; AMXD SHA-256 `8f3ae84d3605e1721c4179d1934f103aa711ea82d951c980bdb999b834088263`.
- Host: Ableton Live 12.4.2 with Max 9 on Apple silicon; macOS 26.5; Set `SLICES.als`; CPython 3.10.19 backend.
- Pass — copied installation: canonical Max package, AMXD, backend, and config installed at their default paths; installed package is not a symlink; strict backend health passes.
- Pass — fresh device load: a new candidate instance opens before the prepared Drum Rack, resolves project-owned dependencies, discovers `stranj_brk_guillotine_high_bright`, and displays `Ready` without a blank UI.
- Pass — recorded production analysis: the supplied rack returns 15 predictions, zero skipped/unknown rows, and zero source errors; Results displays all five raw score columns; slice 6 resolves to snare. This result was also reproduced through the clean installed worker protocol.
- Pass — cancellation/restart protocol: cancellation during real backend preflight terminates the device-owned child before cache maintenance, and the next run starts cleanly without stale results.
- Not Run — final candidate Apply/Revert/conflict/staleness click-through. The desktop control API can select Live/Max devices but does not activate their embedded presentation controls; no result is inferred from an unregistered synthetic click.
- Not Run — native Windows Live/Max host acceptance, 128-pad rack, path/non-ASCII matrix, transport stress, multi-rack selection, and performance timing.
- Set safety: the acceptance Set was not saved after inserting the fresh candidate instance. No deletion or manual Chain-name mutation was performed by automation.

The numbered checklist remains the release gate. Automated unit/contract coverage is supporting evidence, not a replacement for the host items marked Not Run.

## Installation acceptance

- From a clean macOS account, run `./install.sh`; verify it installs without Max editing, the copied package is not a symlink, `--verify-only` passes, and the installed uninstaller removes only the selected components.
- Repeat on Windows with `install.ps1`, including a path containing spaces, `-VerifyOnly`, rerun/repair, default uninstall, and `-All`.
- Move the repository clone after a normal install and confirm the device still loads. Separately confirm the development-only `scripts/install_local.sh` remains a symlink workflow.
- Configure a non-default User Library and Max Packages directory on both platforms and verify the printed Live browser path matches the actual device location.

## Device acceptance

1. Install the exact candidate `.amxd` and its intended dependencies from a clean user account; confirm it does not resolve a developer checkout or absolute user path.
2. Place the device before a standard sliced Drum Rack and confirm MIDI passes through unchanged.
3. Scan a 16-pad rack; compare the count, source paths, sample rates, full source lengths, and exact Simpler marker frames with Live.
4. Analyze; verify every chain name and every MIDI note number, timing, velocity, and duration remains unchanged.
5. Review labels, all five raw-score columns, decisions, warnings, unknowns, editing, row selection, Keep Original, and reset actions.
6. Apply; verify only supported `Chain.name` values change and every reported success reads back exactly.
7. Verify sample markers, macros, effects, sends, choke groups, routing, and clips did not change.
8. Revert; verify original names return.
9. Manually edit one applied name; Revert must preserve the manual edit while restoring untouched applied rows.
10. Rescan after Apply, then Revert; the previous successful Apply record must remain usable.
11. Run an Apply that performs zero writes; verify it does not erase the preceding usable Revert record.
12. Move a marker after Analyze; Apply must return `PLAN_STALE` and write nothing.
13. Move the remembered chain to another pad after Analyze; Apply must return `PLAN_STALE` and write nothing.
14. Rename a chain after Analyze; Apply must report a row conflict without blocking unrelated valid rows.
15. Delete or replace the rack while Apply is being deferred; confirm rack/pad/chain revalidation prevents writes.
16. Delete the rack during analysis and ensure no late writes occur.
17. Cancel analysis, start another analysis, and start a new Scan; in each case ensure stale progress/results from the earlier job are discarded.
18. Select each of two downstream racks and verify selection invalidates the previous snapshot/plan.
19. Test a missing file alongside one valid source; the valid source must still produce predictions and the failed source must report `analysis_error` rows.
20. Test nested Instrument Rack + Simpler, two reachable Simplers, multiple top-level pad chains, multisample Simpler, and direct Simpler Slicing Mode.
21. Test spaces and non-ASCII characters in source paths and proposed chain names; confirm the 31-code-point name limit.
22. Test during transport and watch for UI/audio disruption.
23. Repeat one source for a cache hit; change only thresholds and confirm inference is still reused.
24. Clear Cache and verify the next run performs inference.
25. Test an RX2/REX source with a same-stem companion; verify the warning, full-source-length time scaling, and a cache hit. Change the companion and verify cache invalidation.
26. Open Settings, modify every control, save/reopen the Set, and verify values persist without being reset when Settings opens.
27. Configure a valid Python executable path containing spaces; then try a missing/invalid replacement and verify the prior working backend configuration remains active.
28. Save/reopen the Set and verify no stale Live IDs are used or persisted.
29. Record cold backend/model load time, cold source inference time, cache-hit time, Live/Max/Python versions, OS/architecture, and exact artifact hash. Do not make a performance claim from an unrecorded run.
