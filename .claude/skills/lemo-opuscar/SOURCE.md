# About this skill

Copied unchanged from [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) (`plugin/skills/lemo-opuscar/`, commit of 2026-10-31), MIT licence (see `LICENSE`), by Lemomo / LemoLab.
The upstream README says to copy this folder into a skills folder to use it without the plugin marketplace.

Use: `/lemo-opuscar` in Claude Code on this repo, e.g.
`/lemo-opuscar Make a 40-second film in the Brick Toy style about my LEGO tower crane.`

What it does on first use: `scripts/setup.sh` clones the style library (guides, tools, 66 `STYLE.md` files) into `~/lemo-opuscar`;
`setup.sh deps` installs Node packages, a headless Chromium and a Python venv there; `deps voice` / `deps music` add narration and music tools.
Films are written to `<name>/` in this repo.

Notes for Claude Code cloud sessions (checked 2026-10-31):
- The container is fresh each session, so the library is downloaded again each time (`~/lemo-opuscar` is not kept).
- The tools want **ffmpeg 7+**; the Ubuntu image here ships ffmpeg 6.1, so final video muxing may need a newer ffmpeg.
- Node 22 and Python 3.13 are present. The voice tier needs Python < 3.14 (fine).
- Large downloads (Chromium, voice model) need network access to those hosts.
