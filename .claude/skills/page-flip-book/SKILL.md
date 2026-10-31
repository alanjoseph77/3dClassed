---
name: page-flip-book
description: Build a realistic page-turning book, sketchbook, catalogue, portfolio or magazine as a single HTML page, where you drag or throw a page and the leaf bends like real paper (CSS 3D, no libraries), optionally with a brass magnifier loupe and a gentle pointer tilt. Use when someone asks for a flip book, a book-style portfolio, a page-turn effect, a sketchbook site, or "pages that turn like paper".
---

# Page-flip book

A working reference is in `example/book.html` (open it in a browser; about 170 lines, no dependencies, tested in Chromium: drag, throw, keys, reduced motion). Read it before building. It is original code; the idea comes from Meng To's open sketchbook site (github.com/MengTo/sketchbook, inspired by Matthew Yu's portfolio), whose repository has no licence: learn from its README, never copy its code or artwork.

## The one idea

**A page is not a door on a hinge.** Build the turning leaf from a **chain of N nested strips** (N ≈ 14–20). Each strip is a child of the previous one, positioned at `left: 100%` of its parent and rotated a little more about its own left edge. The first strip carries the main turn; every child adds a small extra bend, so the surface curves along its width like paper.

- Root strip: `rotateY(−π·t)` for progress `t ∈ [0, 1]`.
- Each child: `rotateY(−β·sin(π·t) / N)`: the bend grows mid-turn and vanishes when the page lands flat. β ≈ 0.6 rad.
- `transform-style: preserve-3d` on the book, the curl and every strip; `perspective` (≈ 1800 px) on the stage.

## Faces: one picture, sliced

- Treat each spread as **one picture** twice the page width (an image, or HTML laid out at spread size). A static half shows its side with an offset.
- Every strip has a **front** face (a slice of the turning page of the *from* spread) and a **back** face (`rotateY(180deg)`, a slice of the facing page of the *to* spread), with `backface-visibility: hidden` on both.
- Offset the picture inside each face by the strip's column: front `−(W + i·sw)`, back `−(W − (i + 1)·sw)` for a forward turn (mirror for backward).
- **Seams:** give faces a sub-pixel overlap (`left/right: −0.75px`) or hairlines show between strips.
- Under the turning leaf, the static halves show the from-spread on the side it leaves and the to-spread on the side it reveals.

## Light

Per strip, from its total angle `a = π·t + i·bend`:
- a shade layer with opacity `0.32·(1 − |cos a|)`;
- a soft-light specular layer, `0.5·|cos a|⁸·sin(π·t)`, so a highlight runs across the curl;
- a gutter gradient on both static halves and a soft drop shadow under the book.

## Motion

- **Drag:** progress follows the pointer across the spread (`Δx / spread width`). Use `setPointerCapture`.
- **Throw:** track pointer velocity; on release, commit (`target = 1`) when past halfway or flung fast toward the turn, otherwise fall back (`target = 0`). Seed the spring's velocity from the fling.
- **Spring:** sub-stepped, about stiffness 120 and damping 18, settled when within 0.002.
- **Keys:** ← → turn. **Reduced motion:** jump to the target with no animation.
- Rebuild the strip chain once per turn, not per frame; per frame only set transforms and opacities.

## Optional extras (from the sketchbook's write-up)

- **Magnifier loupe:** a draggable lens holding a second, scaled copy of the book (scale ≈ 2.3 about the page point under the glass), masked to a circle with `mask-image: radial-gradient(...)`. Keep the copy outside any tilt transform, slide the lens aside when a turning leaf sweeps through it, and fade the copy out when the lens leaves the paper. Hide it on touch devices.
- **Pointer tilt:** lean the book a few degrees toward the cursor (≈ 4.5° × 7°) with a spring. Restraint reads as quality.
- **Opening riffle:** flick through a few pages on load (skip under reduced motion).
- **Paper:** a warm paper colour, a faint grain or wash behind the desk, subset web fonts, no external requests.

## Checks before delivery

Screenshot at `t` = 0.25, 0.5 and 0.8 (expose a small test hook like `window.__book.setT`), plus a real drag-and-release with Playwright. No seams, the back face shows the right page, the leaf lands exactly flat, no console errors, and it works at phone width (tap the right or left half to turn).
