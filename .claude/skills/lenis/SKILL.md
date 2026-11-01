---
name: lenis
description: Lenis (darkroomengineering/lenis) smooth scroll library — setup, options, React/Next.js, GSAP ScrollTrigger sync, nested scroll, anchors, reduced motion, snap. Use when the user asks for smooth scrolling, inertia scroll, Lenis, scroll syncing with WebGL/GSAP, or smooth anchor scrolling.
license: MIT (library); summary written from the official README
---

# Lenis

Lightweight (few KB, no dependencies) smooth-scroll library. It wraps the browser's **native scroll**, so `position: sticky`, anchors and accessibility keep working. MIT licence. Packages: `lenis` (core), `lenis/react`, `lenis/vue`, `lenis/snap`.

## Install

```bash
npm i lenis
```
```js
import Lenis from "lenis";
import "lenis/dist/lenis.css"; // recommended CSS: always include it
```

## Basic setup

```js
const lenis = new Lenis({ autoRaf: true });
lenis.on("scroll", (e) => { /* e is the Lenis instance */ });
```

Custom loop (when another library owns the frame loop):

```js
const lenis = new Lenis();
function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
requestAnimationFrame(raf);
```

No-code: link `lenis.css`, load `lenis.min.js`, then
`new Lenis({ autoRaf: true, autoToggle: true, anchors: true, allowNestedScroll: true, naiveDimensions: true, stopInertiaOnNavigate: true })`.

## GSAP ScrollTrigger sync (must do all three)

```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000)); // GSAP time is seconds, Lenis wants ms
gsap.ticker.lagSmoothing(0);
```
Do not also use `autoRaf: true` in that setup. In React use `options={{ autoRaf: false }}` and a ref.

## React / Next.js (`lenis/react`)

```jsx
import { ReactLenis, useLenis } from "lenis/react";
function App() {
  useLenis((lenis) => { /* every scroll */ });
  return (<><ReactLenis root />{/* content */}</>);
}
```
- `root` makes the instance global (uses `<html>`); `root="asChild"` for custom containers.
- Props: `options` (Lenis settings), `ref` (gives `.lenis`).
- `useLenis(callback, deps, priority)`.
- Client-only: put it in a `"use client"` component.

## Key options

| Option | Default | Notes |
|---|---|---|
| `autoRaf` | false | run own rAF loop |
| `lerp` | 0.1 | 0 to 1 smoothing; if set, `duration`/`easing` are ignored |
| `duration` / `easing` | 1.2 / expo-out | used only without `lerp` |
| `smoothWheel` | true | smooth mouse-wheel scroll |
| `syncTouch` / `syncTouchLerp` | false / 0.075 | smooth touch too; unstable on iOS < 16 |
| `wheelMultiplier`, `touchMultiplier` | 1 | speed |
| `orientation`, `gestureOrientation` | vertical | horizontal or both |
| `infinite` | false | needs `syncTouch` on touch devices |
| `anchors` | false | `true` or ScrollTo options; otherwise anchor links are blocked during scroll |
| `allowNestedScroll` | false | simplest nested-scroll fix, but checks the DOM every scroll event |
| `prevent` | none | `(node) => boolean`, skip smoothing for a node (modals, cookie banners) |
| `autoToggle` | false | start/stop from wrapper overflow; needs the recommended CSS |
| `autoResize` | true | ResizeObserver; else call `lenis.resize()` |
| `respectReducedMotion` | true | honour `prefers-reduced-motion`: smoothing off, programmatic scrolls instant |
| `stopInertiaOnNavigate` | false | stop inertia on internal link click |
| `wrapper` / `content` / `eventsTarget` | window / html | custom scroll containers |

## Methods, properties, events

- `scrollTo(target, { offset, lerp, duration, easing, immediate, lock, force, onComplete, userData })`; target = number, selector or keyword (`top`, `bottom`, `start`, `end`), or Element.
- `start()`, `stop()` (pause scroll, e.g. while a modal is open), `resize()`, `raf(ms)`, `on(event, fn)`, `destroy()` (always call on unmount).
- Properties: `scroll`, `targetScroll`, `animatedScroll`, `actualScroll`, `progress`, `limit`, `velocity`, `direction`, `isScrolling`, `isStopped`, `prefersReducedMotion`.
- Events: `scroll` (instance), `virtual-scroll` (`{ deltaX, deltaY, event }`).

## Nested scroll areas and modals

Add attributes on the element: `data-lenis-prevent` (all), `-wheel`, `-touch`, `-vertical`, `-horizontal`. Or use the `prevent` option. Textareas, code boxes, dropdown lists and modals with their own scrolling need one of these.

## lenis/snap (partial scroll-snap)

```js
import Snap from "lenis/snap";
const snap = new Snap(lenis, { type: "proximity" /* or mandatory, lock */, distanceThreshold: "50%", debounce: 500 });
snap.add(500); snap.addElement(el, { align: ["start", "end"] }); snap.addElements(els);
```
CSS scroll-snap does not work with Lenis. Methods include `next()`; `type: "lock"` for slideshows.

## Limitations

- Capped to 60 fps on Safari (30 fps in low-power mode).
- Smooth scroll does not work over iframes (they do not forward wheel events).
- `position: fixed` can lag on pre-M1 Safari.
- `syncTouch` is unreliable on iOS < 16.
- Nested scroll needs configuration.

## Troubleshooting checklist

1. Latest `lenis` version, 2. recommended CSS included, 3. `autoRaf: true` or a manual `raf` call exists, 4. GSAP sync done as above, 5. the page scrolls without Lenis.

## Good practice

- Use it on marketing or story pages. Be careful on tool or form pages: file inputs, textareas, selects, canvases and modals need `data-lenis-prevent` or `prevent`.
- Keep `respectReducedMotion` on. Smooth scroll can make some people uncomfortable, so offer no extra effects for them.
- Call `lenis.destroy()` in the cleanup of the effect that created it, and create it only on the client.
- Do not combine two smooth-scroll systems (Lenis plus GSAP ScrollSmoother).

## In this repo

- Inline `lenis.min.js` and `lenis.css` from `node_modules/lenis/dist/` instead of linking unpkg (blocked here). `example/` in the `gsap-library` skill shows Lenis driven by GSAP's ticker, tested.
- Keep smooth scroll off pages with forms, upload boxes or embedded tools unless they carry `data-lenis-prevent`.
