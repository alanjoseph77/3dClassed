# 3dClassed

Single-file web projects and 3D builds. Every page is one self-contained HTML file. Open it in a browser.

| Folder | What it is | Open |
|---|---|---|
| [`energy-drink-landing/`](energy-drink-landing/) | Scroll-driven energy-drink landing page (original "VOLTA" brand): animated hero, track/sky sections, count-up counter, can picker with live ₹ price. | `energy-drink-landing/index.html` |
| [`portfolio/`](portfolio/) | Freelancer portfolio: lamp pull-cord dark/light switch, flipping role notepad, four doors that open into Web / App / UI-UX / Graphic work pages. Edit the `CONFIG` block for your name, photo and projects. | `portfolio/index.html` |
| [`lego-crane/`](lego-crane/) | LEGO tower crane (44 real parts) designed with [ldraw-nova](https://github.com/anteloc/ldraw-nova), plus an offline 3D viewer with slew / trolley / hook controls. | `lego-crane/tower-crane.html` |
| [`lego-car/`](lego-car/) | LEGO sports car: a classic 4-wide Town roadster (40 parts) built with the `/lego` skill, plus an offline 3D viewer with spinning wheels. | `lego-car/sports-car.html` |
| [`srm-motor/`](srm-motor/) | Interactive isometric figure explaining a switched reluctance motor (6/4, three phases), made with `/anatomy`. | `srm-motor/srm-motor.html` |
| [`local-ai/`](local-ai/) | **Local Coder**: a chat app for your own PC that runs a free coding model (Ollama) and uses this repo's skills automatically. | `node local-ai/server.mjs` |

`index.html` at the root links to every project.

## Reusable skill

Type **`/lego <your idea>`** (e.g. `/lego a red fire truck`) in Claude Code on this repo. [`.claude/skills/lego/`](.claude/skills/lego/SKILL.md) captures the LEGO workflow so a Claude Code session on this repo can build another model from a description:
setup scripts (LDraw library, LeoCAD, ldraw-nova), design rules, check/render steps, and `mpd_to_html.py`, which converts any LDraw model into a single offline HTML viewer.

## Other skills

- [`.claude/skills/lemo-opuscar/`](.claude/skills/lemo-opuscar/SOURCE.md): **/lemo-opuscar**, short films made entirely in code in 66 styles (watercolor, ukiyo-e, brick toy, pixel RPG...), with narration and music. From [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) (MIT).
- [`.claude/skills/anatomy/`](.claude/skills/anatomy/SOURCE.md): **/anatomy**, explains a technical idea as a crafted, interactive isometric machine drawing (SVG / WebGL / 3D). From [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) (MIT).
- [`.claude/skills/html-anime-*`](tools/html-anime/SOURCE.md): **/html-anime-direct, -timing, -cel, -camera, -render**, short anime drawn in HTML (shot sheet → cel frames → HyperFrames render). Library files in `tools/html-anime/`. From [blixvip/html-anime](https://github.com/blixvip/html-anime) (MIT).
- [`.claude/skills/page-flip-book/`](.claude/skills/page-flip-book/SKILL.md): **/page-flip-book**, books and portfolios whose pages bend like paper when dragged (CSS 3D strip chain), with a tested example. Original write-up of the technique from Meng To's [sketchbook](https://github.com/MengTo/sketchbook) (no code copied: that repo has no licence).
