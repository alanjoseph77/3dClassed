---
name: react-bits
description: React Bits (DavidHDev/react-bits) — 215+ free animated React components and backgrounds (text animations, cursor effects, cards, menus, micro-interactions, WebGL backgrounds), installed with the shadcn CLI or jsrepo. Use when the user wants animated UI components, hero backgrounds, text effects, or asks about React Bits.
license: MIT + Commons Clause (library); summary written from the official README
---

# React Bits

Collection of animated React components. Every component comes in four flavours: **JS or TS**, styled with **CSS or Tailwind**. The docs and live demos are at reactbits.dev. The repo is a Vite app; source for each flavour lives under `src/content/<Category>/<Name>` and in `src/ts-tailwind`, `src/ts-default`.

## Licence (read before using)

**MIT + Commons Clause**: free for personal and commercial use inside an app, website or product, including paid ones. You may **not** sell, sublicense or redistribute the components themselves (alone, in a bundle, or as a port), and may not offer the tools as a hosted service. Keep the copyright notice. Exports from the tools may be used in products but not sold as packs. Some tool effects adapt Paper Shaders (Apache 2.0) and Shaders.com (MIT), with notices in the repo.

## Install a component

```bash
npx shadcn@latest add @react-bits/SplitText-TS-TW
# or
npx jsrepo@latest add https://reactbits.dev/r/SplitText-TS-TW
```
The suffix picks the flavour: `JS`|`TS` then `CSS`|`TW`. Or open the component's Code tab on the site and copy the files by hand. For agents, add the registry to `components.json`:
```json
{ "registries": { "@react-bits": "https://reactbits.dev/r/{name}.json" } }
```
then connect the shadcn MCP server (`npx shadcn@latest mcp init --client claude`).

## Catalogue (about 215 free)

- **Text animations (33):** SplitText, BlurText, ShinyText, GradientText, CountUp, DecryptedText, ScrambledText, TextType, RotatingText, ScrollReveal, ScrollFloat, ScrollVelocity, FuzzyText, GlitchText, TrueFocus, TextPressure, VariableProximity, ASCIIText, CircularText, CurvedLoop, FallingText, Shuffle and more.
- **Animations (38):** ClickSpark, Magnet, GlareHover, ImageTrail, LogoLoop, PixelTransition, MetaBalls, MetallicPaint, ElectricBorder, StarBorder, AnimatedContent, FadeContent, GradualBlur, cursor effects (BlobCursor, SplashCursor, TargetCursor, GhostCursor) and more.
- **Components (48):** CardNav, Dock, Carousel, CircularGallery, DomeGallery, InfiniteMenu, FlowingMenu, StaggeredMenu, PillNav, SpotlightCard, TiltedCard, ProfileCard, MagicBento, Masonry, Stepper, AnimatedList, FluidGlass, GlassSurface and more.
- **Micro (about 35):** HoldButton, SwipeToast, SquishSwitch, SpringCheck, FlipCard and other small controls.
- **Backgrounds (about 64):** Aurora, Galaxy, Particles, Silk, Plasma, Waves, Iridescence, LiquidChrome, DarkVeil, Beams, LightRays, Lightning, Threads, Orb, Hyperspeed, PixelBlast, Dither, GridMotion, Ballpit and more.

## Dependencies the components pull in

Most use `react` plus one or more of: **gsap** (with `@gsap/react`, ScrollTrigger, SplitText), **motion** (`motion/react`), **ogl** or **three** (WebGL backgrounds), **matter-js**, icon packs (hugeicons). Check each component's imports before installing so the bundle does not grow unexpectedly.

## How to use well

- Components are client components (`'use client'`): fine in Next.js App Router, but keep the page itself a server component and import the animated piece only where needed.
- WebGL backgrounds (ogl/three) are heavy: use one per page, lazy-load them (`next/dynamic` with `ssr: false`), and avoid them on tool, form and upload pages and on low-power devices.
- Respect `prefers-reduced-motion`: many components do not check it, so wrap them or swap in a static version.
- Keep text readable: check contrast over animated backgrounds, and make sure the page works without the effect.
- Copy only what is needed; the files are yours to edit. Tailwind flavours need Tailwind configured, so use the CSS flavour in projects that do not use Tailwind.
- Pro (paid) is a separate product; the free catalogue stays free.

## In this repo

- React Bits needs a React project; this repo's pages are single HTML files, so use it as **inspiration or a reference for effects**, and rebuild the effect in plain JavaScript or with GSAP. Do not copy its component files into this repo: the Commons Clause forbids redistributing the components themselves.
- The install commands above were **not run** when this skill was written (not tested here).
