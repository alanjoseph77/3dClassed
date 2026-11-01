# About this skill

Copied unchanged from [greensock/gsap-skills](https://github.com/greensock/gsap-skills) (`skills/gsap-plugins/SKILL.md`, commit aed9cfd of 2026-04-21), MIT licence (see `LICENSE`), by GreenSock.
Left out: the upstream repo's examples, plugin configs and Copilot instructions. It is one of eight official GSAP skills: gsap-core, gsap-timeline, gsap-scrolltrigger, gsap-plugins, gsap-utils, gsap-react, gsap-frameworks, gsap-performance. They work together, and gsap-library (original) adds install and licence facts.

Use: `/gsap-plugins` in Claude Code on this repo, or just ask for GSAP animation work and it loads when it fits.

Notes for this repo:
- GSAP itself (the library) is free to use, including all plugins, under GreenSock's "no charge" licence (https://gsap.com/standard-license). Its npm package is not MIT; only these skill files are.
- This repo's rule is one self-contained HTML file with libraries inlined. cdn.jsdelivr.net and unpkg.com are blocked in cloud sessions, so `npm i gsap` and inline the files from `node_modules/gsap/dist/` (see `gsap-library/example/build.mjs`).
