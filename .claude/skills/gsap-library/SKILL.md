---
name: gsap-library
description: GSAP library facts (greensock/GSAP) — what it is, install via npm or CDN, imports, module layout, licence, version, ScrollTrigger/ScrollSmoother overview, @gsap/react. Use alongside the gsap-core, gsap-timeline, gsap-scrolltrigger, gsap-plugins, gsap-react skills when choosing or installing GSAP.
license: Library under GreenSock's standard no-charge licence; summary written from the official README
---

# GSAP library (greensock/GSAP)

Framework-agnostic animation engine with **zero dependencies**. Animates CSS, SVG, canvas, WebGL objects, colours, strings and any JavaScript object. Version seen: **3.15.0**. Docs: gsap.com/docs. Forum: gsap.com/community.

## Licence

GSAP, including every plugin (SplitText, MorphSVG, ScrollSmoother and the rest formerly in Club GSAP), is **free, including commercial use**, under GreenSock's **standard "no charge" licence** (gsap.com/standard-license). The npm package states that licence rather than MIT. Read it before using GSAP in a product whose purpose is to let other people build animations visually; ToolBox-style sites are ordinary use. Never write an `.npmrc` with a GreenSock token or use the old private registry.

## Install

```bash
npm install gsap          # core and every plugin
npm install @gsap/react   # useGSAP() hook for React / Next.js
```
```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/gsap.min.js"></script>
```

## Imports

```js
import gsap from "gsap";                       // core
import ScrollTrigger from "gsap/ScrollTrigger";
import Flip from "gsap/Flip";
import Draggable from "gsap/Draggable";
import { gsap, ScrollTrigger, Draggable, MotionPathPlugin } from "gsap/all"; // everything from one file
gsap.registerPlugin(ScrollTrigger, Draggable, Flip, MotionPathPlugin);       // register once
```
The npm files are ES modules; `dist/` holds UMD builds. Prefer importing only the plugins you use, so unused ones stay out of the bundle.

## What the core already includes

CSS and attribute animation, most eases, `gsap.utils` (interpolate, mapRange, clamp and more), snapping, modifiers, `gsap.matchMedia()` (responsive and reduced-motion setups).

## Plugins at a glance

ScrollTrigger (scroll-driven, pinning, scrub), ScrollSmoother (smooth scroll, needs a wrapper and content element), ScrollToPlugin, Flip, Draggable, Inertia, Observer, SplitText, MorphSVG, DrawSVG, MotionPath, CustomEase, Physics2D and more. See the gsap-plugins skill for detail.

## React

`useGSAP()` from `@gsap/react` replaces `useEffect`/`useLayoutEffect` for GSAP code and cleans up automatically; pass a `scope` ref. Run GSAP only on the client. See gsap-react.

## Choosing between scroll tools

- Scroll-linked animation, pinning, scrubbing: **ScrollTrigger**.
- Smooth, momentum scrolling: GSAP **ScrollSmoother** or **Lenis**, never both. If using Lenis with ScrollTrigger, sync them (see the lenis skill).

## Reminder

Animate transforms and opacity, use timelines instead of chained delays, honour `prefers-reduced-motion` with `gsap.matchMedia()`, and always revert or kill animations on unmount.

## In this repo

- Deliver one self-contained HTML file with the libraries **inlined**: run `npm i gsap@3.15.0` somewhere temporary and inline `gsap.min.js`, `ScrollTrigger.min.js`, `SplitText.min.js` from `node_modules/gsap/dist/`. jsdelivr and unpkg are blocked in cloud sessions.
- A tested, offline example that combines GSAP, ScrollTrigger, SplitText, Lenis and Vanta is in `example/reference-site.html` (rebuild it with `node example/build.mjs`).
