# 3dClassed: notes for AI assistants

Read this first. It's the project's memory: what's here, how the owner likes things done, and what earlier sessions learned the hard way. Keep it up to date (see "Keep learning" at the end).

## What this repo is

A collection of **single-file web projects, 3D builds and short films made in code**, plus the **skills** (step-by-step know-how) used to make them. `index.html` at the root links every project; `README.md` has a table of them.

| Folder | What it is |
|---|---|
| `energy-drink-landing/` | Scroll-driven landing page for an original brand ("VOLTA") |
| `portfolio/` | Freelancer portfolio: lamp-cord theme switch, doors that open into work pages. Edit its `CONFIG` block |
| `lego-crane/`, `lego-car/` | LEGO models (LDraw `.mpd`) with offline 3D HTML viewers, parts lists, previews; `lego-crane/stl/` has 3D-print files |
| `brick-builder/` | Type-to-build 3D brick models (15 object generators in `src/app.js`; `node build.mjs` bundles one HTML file) |
| `showup-site/` | One-page sales website for an automation service (reminders / no-show reduction). `CONFIG` block holds contact, prices, payment links; no fake testimonials |
| `client-finder/` | Lead tracker + outreach templates + 14-day plan for finding clients (data in localStorage only; messages are sent one by one by the owner, never in bulk) |
| `srm-motor/` | Interactive isometric figure: switched reluctance motor (built with `/anatomy`) |
| `last-lighthouse-keeper/` | 41 s vertical paper-cut short film for YouTube (built with `/lemo-opuscar`) |
| `local-ai/` | **Local Coder**: chat app for the owner's PC that runs a free model (Ollama) and uses this repo's skills |
| `tools/html-anime/` | Library files for the `html-anime-*` skills |
| `.claude/skills/` | The skills (below), including the GSAP, Lenis, Vanta and React Bits set added 2026-11-01 |

## Skills: which one to use

| Request sounds like… | Skill | Notes |
|---|---|---|
| "build a LEGO …", LDraw model, 3D-print a LEGO build | `/lego` | Uses ldraw-nova; delivers a folder with `.mpd`, HTML viewer, parts list, optional STL |
| a short film, video, promo, explainer in a named art style | `/lemo-opuscar` | 66 styles; needs its setup and ffmpeg 7+ for the final mux |
| explain a technical idea / system as an interactive figure or diagram | `/anatomy` | Isometric machine drawings; run its line check to 0 |
| an anime short drawn in HTML | `/html-anime-direct` first, then `-timing`, `-cel`, `-camera`, `-render` | Library in `tools/html-anime/` |
| a flip book, sketchbook site, pages that turn like paper | `/page-flip-book` | Tested example in `example/book.html` |
| animation on a web page: tweens, timelines, scroll-driven reveals, pinned sections, text split, SVG draw | `/gsap-core` first, then `/gsap-timeline`, `/gsap-scrolltrigger`, `/gsap-plugins`, `/gsap-utils`, `/gsap-performance` (`/gsap-react`, `/gsap-frameworks` only for React, Vue, Svelte) | Install and licence facts in `/gsap-library`. Tested offline example: `.claude/skills/gsap-library/example/` |
| smooth (inertia) scrolling | `/lenis` | Sync with ScrollTrigger as shown in the skill; keep it off form and upload pages |
| animated 3D background behind a hero (waves, net, fog, birds, globe...) | `/vanta` | WebGL: one effect per page, destroy it off-screen, skip it for reduced motion |
| ready-made animated React components and effects | `/react-bits` | Reference only here (needs React; licence MIT + Commons Clause, do not copy its files) |

If nothing fits, do the task directly. If the same kind of task keeps coming back, offer to write a new skill for it.

## How the owner likes things done

- **Deliver a single, self-contained HTML file** whenever possible: works offline, opens by double-click, no build step. Inline libraries (e.g. three.js) rather than linking CDNs.
- **Each project gets its own folder** with a short `README.md`, then a **card in the root `index.html`** and a **row in the root `README.md`**.
- **Commit and push** finished work to the working branch. Don't open pull requests unless asked.
- **Send the main file** to the owner at the end (HTML, MP4, image), with a short plain-English summary.
- The owner writes short messages, often from a phone. Pick sensible defaults, state them in one line, and build; ask only when a choice really changes the result.
- **Be honest about limits**: say what was tested, what wasn't, and what failed.

## Rules that keep work safe and legal

- **Licences:** only copy code or assets under MIT, Apache 2.0, BSD, CC0, CC BY or OFL, and keep their licence file and credit. A repo with **no licence** may be studied, never copied: write original code and credit the idea.
- **No real brands, logos or people** in designs unless the owner owns them: use original names (as with "VOLTA") and say "brick-built" rather than using the LEGO® name or logo.
- **Fonts:** OFL fonts only, self-hosted in the project.
- **Never** add features that let a web page run shell commands or reach outside the repo without the user's confirmation (see `local-ai/server.mjs`: token, localhost only, confirm before write, no command runner).
- Installing outside tools that run code or change Claude's settings (hooks, auto-updaters) needs the owner's **explicit** approval.

## How to check work before calling it done

- Open every page in headless Chromium (Playwright is preinstalled in cloud sessions: `require('playwright')`). Take screenshots at **desktop and 390 px phone width**, look at them, and check the console has **no errors**.
- For WebGL in headless Chromium use `chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })`.
- Test interactions for real (click, drag, keys) and read the result back, not just the first frame.
- Respect `prefers-reduced-motion`, and make sure light and dark themes both read.

## What the cloud environment can and can't do (learned in earlier sessions)

- **Blocked hosts:** huggingface.co (Whisper and most AI models), library.ldraw.org, cdn.jsdelivr.net, unpkg.com, theaiadventurer.com, and raw GitHub files of repos not attached to the session (e.g. google/fonts). **npm, PyPI, Ubuntu apt and `git clone` of public repos work.**
- LDraw parts and LeoCAD: `apt-get install ldraw-parts leocad xvfb` (parts in `/usr/share/ldraw`); LeoCAD renders under `xvfb-run` with `LIBGL_ALWAYS_SOFTWARE=1`. Ubuntu's LeoCAD 21.06 has no `-csv`, so ldraw-nova's `review` stops at the BOM comparison: render with `ldraw-agent render` instead.
- Chromium for tools that need a path: `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.
- **No GPU:** three.js films render at about 4–12 s per frame on CPU, so a 40 s vertical film takes over an hour. Start long renders in the background and do other work meanwhile.
- ffmpeg is 6.1 here; `lemo-opuscar`'s `mux.sh` wants 7+ and rejects the audio length on 6.x. Fallback that worked: two-pass `loudnorm` (I=-14, TP=-1.2) by hand, `-c:v copy`, AAC 192k, `apad -t <duration>` (see `last-lighthouse-keeper/build.sh`), then check both stream durations and `ebur128`.
- The Whisper model for `asr_check.py` comes from huggingface.co (blocked), so narration can't be speech-checked here: say so.
- Containers are fresh each session: anything installed outside the repo (`~/lemo-opuscar`, `~/ldraw-nova`) has to be set up again. Only the repo persists.

- Animation libraries (GSAP, Lenis, Vanta, three.js) are inlined into the single HTML file: `npm i` them in a temp folder and paste the `dist/*.min.js` files in (`.claude/skills/gsap-library/example/build.mjs` does this). GSAP's own licence is "no charge" (not MIT), so keep its licence link when you ship it.

## How to learn a new skill from a GitHub link

1. `git clone --depth 1` it into a scratch folder and read its README, licence and `SKILL.md` files.
2. If it's a skill with an open licence, copy it to `.claude/skills/<name>/` with its `LICENSE` and a `SOURCE.md` (origin, commit, what was left out, what it needs here). Leave out `.git`, CI files, test suites and large demo media.
3. If it needs setup scripts, hooks or auto-updates, explain what they do and get explicit approval before running them.
4. If it isn't a skill, or has no licence, write an original skill from what you learned, with a small tested example.
5. Add a line to the "Other skills" list in `README.md`, commit, push, and tell the owner how to use it (e.g. `/name …`).

## Keep learning

When a session discovers something that will matter again (a blocked host, a fix that worked, a preference the owner stated, a new project or skill), **add it to this file** in the right section, in one or two lines, and commit it with the work. Remove notes that are no longer true. This file is how the next session, and the Local Coder model, learn from this one.
