# About this skill

Copied from [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) at commit `1482e84` (2026-10-18), MIT licence (see `LICENSE`), by Ryan.
Left out: `.git`, `.github/` (CI and README images), `tests/`, `evals/`, `agents/` and the `scripts/*.test.mjs` files. Nothing else changed.

Use: `/anatomy <idea>` in Claude Code on this repo, e.g.
`/anatomy explain how a token bucket rate limiter works, interactive`

Needs Node 20.10+ (this cloud image has Node 22) and Chrome/Chromium for its checks
(this image has Chromium at /opt/pw-browsers/chromium). No npm packages, no API keys.
Its `publish.mjs` pushes to the author's community gallery on GitHub, and the skill only does that when you ask.
