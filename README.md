# 3dClassed

Single-file web projects and 3D builds. Every page is one self-contained HTML file. Open it in a browser.

| Folder | What it is | Open |
|---|---|---|
| [`energy-drink-landing/`](energy-drink-landing/) | Scroll-driven energy-drink landing page (original "VOLTA" brand): animated hero, track/sky sections, count-up counter, can picker with live ₹ price. | `energy-drink-landing/index.html` |
| [`portfolio/`](portfolio/) | Freelancer portfolio: lamp pull-cord dark/light switch, flipping role notepad, four doors that open into Web / App / UI-UX / Graphic work pages. Edit the `CONFIG` block for your name, photo and projects. | `portfolio/index.html` |
| [`lego-crane/`](lego-crane/) | LEGO tower crane (44 real parts) designed with [ldraw-nova](https://github.com/anteloc/ldraw-nova), plus an offline 3D viewer with slew / trolley / hook controls. | `lego-crane/tower-crane.html` |
| [`lego-car/`](lego-car/) | LEGO sports car: a classic 4-wide Town roadster (40 parts) built with the `/lego` skill, plus an offline 3D viewer with spinning wheels. | `lego-car/sports-car.html` |

`index.html` at the root links to every project.

## Reusable skill

Type **`/lego <your idea>`** (e.g. `/lego a red fire truck`) in Claude Code on this repo. [`.claude/skills/lego/`](.claude/skills/lego/SKILL.md) captures the LEGO workflow so a Claude Code session on this repo can build another model from a description:
setup scripts (LDraw library, LeoCAD, ldraw-nova), design rules, check/render steps, and `mpd_to_html.py`, which converts any LDraw model into a single offline HTML viewer.

## Other skills

- [`.claude/skills/lemo-opuscar/`](.claude/skills/lemo-opuscar/SOURCE.md): **/lemo-opuscar**, short films made entirely in code in 66 styles (watercolor, ukiyo-e, brick toy, pixel RPG...), with narration and music. From [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) (MIT).
