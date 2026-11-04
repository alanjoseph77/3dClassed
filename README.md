# 3dClassed

Single-file web projects and 3D builds. Every page is one self-contained HTML file. Open it in a browser.

| Folder | What it is | Open |
|---|---|---|
| [`energy-drink-landing/`](energy-drink-landing/) | Scroll-driven energy-drink landing page (original "VOLTA" brand): animated hero, track/sky sections, count-up counter, can picker with live ₹ price. | `energy-drink-landing/index.html` |
| [`portfolio/`](portfolio/) | Freelancer portfolio: lamp pull-cord dark/light switch, flipping role notepad, four doors that open into Web / App / UI-UX / Graphic work pages. Edit the `CONFIG` block for your name, photo and projects. | `portfolio/index.html` |
| [`lego-crane/`](lego-crane/) | LEGO tower crane (44 real parts) designed with [ldraw-nova](https://github.com/anteloc/ldraw-nova), plus an offline 3D viewer with slew / trolley / hook controls. | `lego-crane/tower-crane.html` |
| [`lego-car/`](lego-car/) | LEGO sports car: a classic 4-wide Town roadster (40 parts) built with the `/lego` skill, plus an offline 3D viewer with spinning wheels. | `lego-car/sports-car.html` |
| [`srm-motor/`](srm-motor/) | Interactive isometric figure explaining a switched reluctance motor (6/4, three phases), made with `/anatomy`. | `srm-motor/srm-motor.html` |
| [`srm-teardown/`](srm-teardown/) | 3D simulator of a 6/4 switched reluctance motor: run it, step the phases, explode it. Made with `/teardown`. | `srm-teardown/srm-teardown.html` |
| [`local-ai/`](local-ai/) | **Local Coder**: a chat app for your own PC that runs a free coding model (Ollama) and uses this repo's skills automatically. | `node local-ai/server.mjs` |
| [`brick-builder/`](brick-builder/) | **Brick Builder**: type what to build (15 objects, any colour, sizes) and watch it assemble brick by brick in 3D. Offline, one HTML file. | `brick-builder/brick-builder.html` |
| [`last-lighthouse-keeper/`](last-lighthouse-keeper/) | **The Last Lighthouse Keeper**: 41 s vertical paper-cut short film (YouTube Shorts), made with `/lemo-opuscar`. | `last-lighthouse-keeper/last-lighthouse-keeper.mp4` |
| [`showup-site/`](showup-site/) | **ShowUp**: a one-page website that sells an appointment-reminder and follow-up automation service (savings calculator, plans, order form). Edit its `CONFIG` block for your WhatsApp, email, prices and payment links. | `showup-site/index.html` |
| [`client-finder/`](client-finder/) | **Client Finder**: a lead tracker with follow-up dates, message templates (WhatsApp, Instagram, email, call), a daily goal and a 14-day plan. Saved on the device only. | `client-finder/index.html` |

`index.html` at the root links to every project.

## Reusable skill

Type **`/lego <your idea>`** (e.g. `/lego a red fire truck`) in Claude Code on this repo. [`.claude/skills/lego/`](.claude/skills/lego/SKILL.md) captures the LEGO workflow so a Claude Code session on this repo can build another model from a description:
setup scripts (LDraw library, LeoCAD, ldraw-nova), design rules, check/render steps, and `mpd_to_html.py`, which converts any LDraw model into a single offline HTML viewer.

## Other skills

- [`.claude/skills/lemo-opuscar/`](.claude/skills/lemo-opuscar/SOURCE.md): **/lemo-opuscar**, short films made entirely in code in 66 styles (watercolor, ukiyo-e, brick toy, pixel RPG...), with narration and music. From [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) (MIT).
- [`.claude/skills/anatomy/`](.claude/skills/anatomy/SOURCE.md): **/anatomy**, explains a technical idea as a crafted, interactive isometric machine drawing (SVG / WebGL / 3D). From [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) (MIT).
- [`.claude/skills/html-anime-*`](tools/html-anime/SOURCE.md): **/html-anime-direct, -timing, -cel, -camera, -render**, short anime drawn in HTML (shot sheet → cel frames → HyperFrames render). Library files in `tools/html-anime/`. From [blixvip/html-anime](https://github.com/blixvip/html-anime) (MIT).
- [`.claude/skills/teardown`](.claude/skills/teardown/SOURCE.md): **/teardown**, builds an interactive 3D simulator of a machine as one offline HTML page (take it apart, live panels, auto tour, optional 60 fps film). Needs a one-time `npm install && npx playwright install chromium`. From [elvarofficial/teardown](https://github.com/elvarofficial/teardown) (MIT).
- [`.claude/skills/page-flip-book/`](.claude/skills/page-flip-book/SKILL.md): **/page-flip-book**, books and portfolios whose pages bend like paper when dragged (CSS 3D strip chain), with a tested example. Original write-up of the technique from Meng To's [sketchbook](https://github.com/MengTo/sketchbook) (no code copied: that repo has no licence).
- [`.claude/skills/gsap-*`](.claude/skills/gsap-core/SOURCE.md): **/gsap-core, -timeline, -scrolltrigger, -plugins, -utils, -react, -frameworks, -performance**, the eight official GSAP skills (tweens, timelines, ScrollTrigger, SplitText and other plugins, React, Vue, Svelte, performance). From [greensock/gsap-skills](https://github.com/greensock/gsap-skills) (MIT, copied unchanged).
- [`.claude/skills/gsap-library/`](.claude/skills/gsap-library/SOURCE.md): **/gsap-library**, original notes on installing GSAP, its licence and imports, plus a tested offline example page (`example/reference-site.html`) that combines GSAP, ScrollTrigger, SplitText, Lenis and Vanta.
- [`.claude/skills/lenis/`](.claude/skills/lenis/SOURCE.md): **/lenis**, smooth scrolling and syncing it with GSAP ScrollTrigger. Original write-up of [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) (MIT; no code copied).
- [`.claude/skills/vanta/`](.claude/skills/vanta/SOURCE.md): **/vanta**, animated WebGL backgrounds (waves, net, fog, birds, globe...) with cleanup, performance and reduced-motion rules. Original write-up of [tengbao/vanta](https://github.com/tengbao/vanta) (MIT; no code copied).
- [`.claude/skills/react-bits/`](.claude/skills/react-bits/SOURCE.md): **/react-bits**, a guide to the 215+ free animated React components in [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits) (MIT + Commons Clause; reference only, no files copied).
