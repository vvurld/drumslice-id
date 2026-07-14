# Security policy

## Supported versions

Only the newest published alpha receives security fixes. Alpha software is not recommended for unattended or security-sensitive environments.

## Reporting

Do not open a public issue for a suspected vulnerability. Use GitHub's **Security → Report a vulnerability** flow for this repository. If private vulnerability reporting is unavailable, open a minimal issue requesting a private contact channel without including exploit details, private paths, logs, or sample audio.

Useful reports include the affected version, platform, impact, minimal reproduction, and whether untrusted files or repository content are required. We will acknowledge a complete report when maintainers are available; this volunteer alpha does not promise a fixed response SLA.

DrumSLICE ID sends no telemetry. Its normal runtime reads local sample files selected by Live, starts a configured local Python process, and writes local caches and logs. The device itself performs no network downloads; only the user-run backend installer invokes Git and Python package tooling.
