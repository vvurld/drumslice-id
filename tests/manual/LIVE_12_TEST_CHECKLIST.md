# Live 12 manual acceptance checklist

Record Live/Max versions, machine, Set name, and date. For each item record Pass, Fail, or Not Run plus evidence.

1. Place the device before a standard sliced Drum Rack and confirm MIDI passes unchanged.
2. Scan 16 pads; compare count, file paths, and exact Simpler marker frames.
3. Analyze; verify every chain name and every MIDI note/velocity/duration/number remains unchanged.
4. Review labels, score display, unknowns, editing, Keep Original, and reset actions.
5. Apply; verify only supported chain names change and read-back succeeds.
6. Verify sample markers, macros, effects, sends, choke groups, routing, and clips did not change.
7. Revert; verify original names return.
8. Manually edit one applied name; Revert must preserve the manual edit.
9. Move a marker after Analyze; Apply must return `PLAN_STALE` and write nothing.
10. Rename a chain after Analyze; Apply must report a row conflict.
11. Delete the rack during analysis and ensure no late writes occur.
12. Start a second analysis and ensure the first result is discarded.
13. Select each of two downstream racks.
14. Test missing file, nested Instrument Rack + Simpler, two Simplers, and multiple chains.
15. Test spaces and non-ASCII characters in source paths.
16. Test during transport and watch for UI/audio disruption.
17. Repeat one source for a cache hit; clear cache and verify inference resumes.
18. Save/reopen the Set and verify no stale Live IDs are used.
