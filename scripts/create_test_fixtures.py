#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import random
import struct
import wave
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1] / "tests" / "fixtures"
    root.mkdir(parents=True, exist_ok=True)
    sample_rate = 44_100
    duration = 1.5
    frames: list[float] = [0.0] * int(sample_rate * duration)
    random.seed(7)
    for index in range(int(0.18 * sample_rate)):
        envelope = math.exp(-index / (0.045 * sample_rate))
        frames[index] += 0.8 * envelope * math.sin(2 * math.pi * 58 * index / sample_rate)
    offset = int(0.5 * sample_rate)
    for index in range(int(0.12 * sample_rate)):
        envelope = math.exp(-index / (0.028 * sample_rate))
        frames[offset + index] += 0.55 * envelope * (random.random() * 2 - 1)
    offset = int(1.0 * sample_rate)
    for index in range(int(0.10 * sample_rate)):
        envelope = math.exp(-index / (0.018 * sample_rate))
        frames[offset + index] += 0.45 * envelope * math.sin(2 * math.pi * 8_000 * index / sample_rate)
    wav_path = root / "synthetic drums ü.wav"
    with wave.open(str(wav_path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(sample_rate)
        output.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, frame)) * 32767)) for frame in frames))
    snapshot = {
        "schemaVersion": 1,
        "jobId": "fixture-job",
        "createdAt": "2026-01-01T00:00:00Z",
        "track": {"displayName": "Fixture", "sessionPath": "live_set tracks 0"},
        "rack": {"displayName": "Fixture Rack", "sessionId": 10, "sessionPath": "live_set tracks 0 devices 1"},
        "regions": [],
        "skippedPads": [],
    }
    for index, start in enumerate((0, 22_050, 44_100)):
        portable_path = "tests/fixtures/synthetic drums ü.wav"
        snapshot["regions"].append({"regionId": f"fixture-{index}", "padIndex": index, "padNote": 36 + index, "padDisplayName": f"Slice {index + 1}", "chainSessionId": 20 + index, "chainSessionPath": f"live_set tracks 0 devices 1 chains {index}", "originalChainName": f"Slice {index + 1}", "simplerSessionPath": f"live_set tracks 0 devices 1 chains {index} devices 0", "playbackMode": 1, "source": {"path": portable_path, "sampleRate": sample_rate, "lengthFrames": len(frames), "startFrame": start, "endFrame": min(start + 22_050, len(frames))}, "warnings": []})
    (root / "rack_snapshot.json").write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
