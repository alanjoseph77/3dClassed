---
name: vanta
description: Vanta.js (tengbao/vanta) animated 3D/WebGL backgrounds — effects list, options, React/Next.js usage, cleanup, performance and accessibility. Use when the user wants an animated background (waves, birds, fog, net, globe, clouds, halo, rings, ripple, topology, trunk, dots, cells) behind a hero or section.
license: MIT (library); summary written from the official README
---

# Vanta.js

Adds an animated effect as a **background inside any HTML element**. Rendered with **three.js** (WebGL) or **p5.js**. MIT licence. About 120 KB minified and gzipped (mostly three.js). Demo and customiser: vantajs.com. Version seen: 0.5.24.

## Effects

`waves`, `birds`, `fog`, `clouds`, `clouds2`, `globe`, `net`, `cells`, `dots`, `halo`, `rings`, `ripple` (three.js) and `trunk`, `topology` (p5.js). Each effect has its own options (colours, speed, spacing); see vantajs.com.

## Script-tag use

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vanta/dist/vanta.waves.min.js"></script>
<script>VANTA.WAVES({ el: "#my-background", color: 0x000000, waveHeight: 20, shininess: 50, waveSpeed: 1.5, zoom: 0.75 })</script>
```

## Common options

- `el`: container selector or element. The canvas is appended inside it and takes its size. Make the container full-screen for a full-screen effect. Other children of the container appear in front as normal content.
- `mouseControls` (true), `touchControls` (true), `gyroControls` (false): only some effects react.
- Colours are numbers like `0x23153c`.

## Instance methods

```js
const effect = VANTA.WAVES({ el: "#bg" });
effect.setOptions({ color: 0xff88cc }); // change while running
effect.resize();                        // after the container changes size
effect.destroy();                       // ALWAYS call on unmount
```

## React / Next.js

```jsx
"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Hero() {
  const ref = useRef(null);
  useEffect(() => {
    let effect;
    let cancelled = false;
    (async () => {
      const { default: WAVES } = await import("vanta/dist/vanta.waves.min");
      if (cancelled || !ref.current) return;
      try { effect = WAVES({ el: ref.current, THREE }); } catch { /* no WebGL: keep the plain background */ }
    })();
    return () => { cancelled = true; effect?.destroy(); };
  }, []);
  return <section ref={ref} style={{ minHeight: "100svh" }}>{/* foreground content */}</section>;
}
```
- Pass `THREE` (or `p5` for trunk/topology) from npm to avoid a global script tag.
- Load it with a dynamic `import()` inside the effect so it never runs during server rendering and stays out of the main bundle.
- Always `destroy()` in the cleanup; in React strict mode guard against creating two instances.

## Performance and accessibility (not handled by Vanta itself)

- It is continuous WebGL: costly on cheap phones and bad for battery. Use it on one hero section, not on every page, and never on tool or form pages.
- Skip it when `prefers-reduced-motion: reduce` is set, on low-power devices, or when WebGL is unavailable. Show a plain gradient instead.
- Give the container a solid `background-color` first so text stays readable before the effect loads, and check text contrast on top of it.
- Pause or destroy it when the section is off-screen (IntersectionObserver).
- Do not put critical content only inside the animated area.

## Do not

- Do not forget `destroy()`; canvases and WebGL contexts leak.
- Do not mix several Vanta effects on one page.
- Do not load three.js twice (once via script tag and once via npm).

## In this repo

- Inline `three.min.js` (r134, `npm i three@0.134.0`, file `build/three.min.js`) and the one effect file from `node_modules/vanta/dist/` into the HTML. Do not link cdnjs or jsdelivr.
- A tested example (NET effect, destroyed when the hero scrolls away, skipped for reduced motion) is in `gsap-library/example/reference-site.html`.
- Headless Chromium draws it with `--use-gl=swiftshader`; expect a few frames per second there.
