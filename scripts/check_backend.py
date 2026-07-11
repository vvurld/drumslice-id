#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Check the configured Slice Labeler Python worker and ADTOF backend.")
    parser.add_argument("--python", default=sys.executable, help="Python executable to check")
    parser.add_argument("--backend", default="adtof", choices=("adtof", "mock"))
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    env = dict(os.environ)
    env["PYTHONPATH"] = str(root / "python") + os.pathsep + env.get("PYTHONPATH", "")
    request = {"schemaVersion": 1, "type": "health", "requestId": "backend-check", "backend": args.backend, "options": {"device": "cpu", "fps": 100, "maxThreads": 2}}
    try:
        process = subprocess.run(
            [args.python, "-m", "slice_labeler_worker"],
            input=json.dumps(request) + "\n",
            text=True,
            capture_output=True,
            env=env,
            timeout=30,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"ok": False, "code": "WORKER_START_FAILED", "message": str(error)}))
        return 1
    first_line = process.stdout.splitlines()[0] if process.stdout.splitlines() else ""
    try:
        response = json.loads(first_line)
    except json.JSONDecodeError:
        print(json.dumps({"ok": False, "code": "MALFORMED_HEALTH_RESPONSE", "stderr": process.stderr[-1000:]}))
        return 1
    print(json.dumps(response, indent=2))
    return 0 if response.get("type") == "health" and response.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
