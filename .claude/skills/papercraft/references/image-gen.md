# Making references with an image tool (optional, only when the user asks)

How to use an image tool to make references for a project's idea: images that set the direction for its look and its
elements, in any medium this skill builds (a game or interactive scene, a 2D scene or illustration, a web page or app
UI, an animation or video). Nothing in this skill depends on it: the work itself is still paper built in code, and
the paper spec alone is a complete target. SKILL.md section 2 gives the approach in brief; this file goes medium by
medium.

Read this when: the user asked you to use an image tool and one is available. Without one, the spec is the target and
`procedural-art.md` makes the prints; you lose nothing essential.

Contents: 1 Rules; 2 What to make, by medium; 3 Writing the prompt; 4 Image inputs and their roles; 5 Explore, then
converge; 6 A consistent set; 7 Using what you made; 8 Generated images inside the work; 9 What to reject

## 1. Rules

- **Only when the user asks, and never load-bearing.** Use the tool when the user says to and it is there. Never wait
  on it, and keep the work complete without any generated image.
- **References first.** The value is direction: how the project looks, what its elements are, how its light and mood
  feel. Generated images go inside the work only when the user wants that (section 8).
- **Look at every output.** Keep the calls few, regenerate sparingly, and keep a short log: the prompt, the image
  inputs, the verdict, what you took from it. Show the user the candidates; their pick decides.
- **Generated images are idealised.** Steer by them and measure toward them, but the finish line is the user's eye
  and the checks in SKILL.md section 8, never "a critic cannot tell them apart": in the source project, blind critics
  picked the generated frame over the build nearly every time.
- **Never ship third-party images.** The user's references may be image inputs for what they give (SKILL.md
  section 2): say in the prompt what to take from each, and that its composition, characters, logos and text are not
  to be copied. The gallery is never an input.

## 2. What to make, by medium

Make the few images the project's open decisions need, at the camera the work will use. In every medium a material
close-up (one piece: its cut edge, its print, its shadow on what lies under it) and a light study (the brief's time of
day and its shadow colour) earn their place.

| Medium | References worth making | Frame them as |
|---|---|---|
| Game or interactive 3D scene | the world around the hero at the play camera; a busy area; the brief's own landmark or feature; what is walked on, under or into (a bridge, stairs, a hall); a fold mid-rise; designs for the hero and the creatures from the front, the side and the back | the play camera: a long lens looking down, one sharp band, blur above and below, the ground past every edge |
| 2D scene, side-scroller, illustration | the scene at its 2D camera; its layers from near to far; designs for the pieces | the 2D view (frontal, or pitched down), depth from layered planes and blur |
| Web page or app UI | the page or screen as paper: a hero area, a card, a menu, a button up and pressed, a panel folding open; ornaments and icons as cut-paper pieces | flat and frontal, no lens; no words in the image (real text is set in the page, so leave room for it) |
| Animation or video | a keyframe per beat (the flat print before the rise, a fold mid-motion, the settled scene, the last frame); each key shot at its final camera; a light script across time | one camera, light and palette per shot across the set; images give moments, never timing (`motion.md` sections 3 and 11) |

## 3. Writing the prompt

One style description, reused word for word for every image of a set, and one subject line per image. Write the style
in this skill's terms, filled from the brief; labelled parts like these work well:

- **Medium:** what the image is: a macro photograph of a handmade pop-up paper world (a scene, or a still of a video),
  or a flat frontal scan of a handmade paper page (a page or UI).
- **Material:** matte, rigid cardstock; every piece a layered paper collage, printed, with accents that contrast with
  its base; chunky shapes with big, countable motifs, nothing thin or spiky. Name the edges the medium wants: crisp
  die-cut card in a scene, deckled or torn sheets only where a page calls for them (`paper-ui.md`).
- **Edges:** a thin dark cut line at every silhouette and a pale highlight just inside it on the lit side only.
- **Palette:** the brief's colours by role (the ground or page, the lead family, the accents), in words or hexes.
- **Light:** the brief's key and time of day, a soft fill, soft shadows coloured by the world, never grey.
- **Camera:** the medium's framing from section 2.
- **Surround:** the ground, or the page, fills the frame and runs past every edge.
- **Avoid:** sky, horizon, a table, a room, a book or page edge, a border; gloss and the look of a CG render; flat
  vector art; text, letters and logos; an even white rim round every piece.

The subject line says what this image is for: the place, the moment or the element, and the twist only this project
has, in a sentence or two. A long subject drowns the style.

## 4. Image inputs and their roles

When the tool takes images as inputs, give each a single role and say in the prompt what to take from it and what
not:

- **Style:** copy its craft (cut shapes, edges, the layered print, matte fibre), not its perspective, scene, light or
  subjects.
- **Content or layout:** keep its pieces, their places and their count, and redraw them in the style; add, remove and
  merge nothing.
- **Palette and mood:** take its colours and its light, nothing else.

The strongest input is the work itself. A target made from a few of your own screenshots, named as the main reference
for the world, the camera and the light ("a new scene in exactly this visual language, but better"), stays reachable:
in the source project it became the best target (the "gold" target in `process.md`), and its gaps could be closed
one by one. Feed the user's references in only for what they give.

## 5. Explore, then converge

- **Start wide:** a few distinct directions (different palettes, times of day, compositions, readings of the
  subject), not many versions of one. Show them side by side and let the user choose or combine.
- **Then converge:** make the rest of the set in the chosen direction with the same style description, changing only
  the subject line, and give the chosen image as an input where the tool allows.
- **Grow designs in steps:** an element seen in its world first, then a design sheet of it (individuals, views or
  states in rows), then more variants with the chosen sheet as the input ("more of exactly the same").
- **Stop when the decisions are made.** A reference set is done when it answers the spec (palette, ground or page,
  pieces, light, hero, layout, motion beats), not when it looks finished.

## 6. A consistent set

- One style description, one palette and one light for the whole set; one camera per medium.
- A figure that will be built from cards is designed as its parts, each from the front, the side and the back, never
  as a sheet of poses: the 3D hero is a model of parts (`mechanisms.md` section 12), the 2D one a puppet of cards
  (`web-2d.md` section 3).
- An ornate input spreads its ornament onto everything (leaf prints turned up on animals, smoke and clouds): say for
  each kind of piece what may be printed on it.
- Ask for the paper every time: left out, generated paper drifts toward soft, deckled sheets or felt.
- Generated and procedural pieces in one work must share the same print ingredients (`procedural-art.md` section 0),
  or the procedural ones look unfinished next to the others.

## 7. Using what you made

- **As the look target:** measure it (`scripts/measure.py`, then `--target` on your frames), write down what it shows
  (sizes against the hero or the page, edge rules, layers per print, the print vocabulary, light and shadow), and rank
  the gaps between it and your build, each with one measured thing to do (`process.md` section 2).
- **As designs:** build each element yourself, as a structure type with its own print (`structures.md`,
  `procedural-art.md`): the image shows what it is, this skill how paper makes it.
- **As a record:** note in the spec what each image decided, and any conflict with the brief and how you settled it.
  The brief and the user's word outrank any generated image.

## 8. Generated images inside the work

Only when the user wants generated art in the work itself: prints on cards, icons and ornaments on a page, plates for
a video. Everything above still holds, and:

- **Sheets, not single images:** one kind of piece per sheet, flat and frontal, in a fixed grid with a known count in
  reading order and wide gaps, on one flat key colour that appears in no piece (choose another key when the subject
  has that colour). Name the empty cells; counts drift otherwise.
- **The cut edge comes with the art:** ask for the thin dark outline with its lit-side highlight, and never add a
  second rim on top. No perspective, cast shadow or glow inside a sheet; a flat base on anything that stands on a
  hinge.
- **Cut, then pack** into the same atlas contract as the procedural prints (`procedural-art.md` section 4.3), so
  either source drops in and a rejected piece falls back to a procedural one. Keep the colour under the soft edge of
  each cut, and size every piece by world or layout units, never by its pixels.
- **Check after cutting, before swapping anything in:** the count and order, no key colour left inside, thin parts
  still there, the outline hugging the art, the cut edge on close crops, the colours under the final grade, and each
  piece beside the procedural ones.
- **Paper texture:** a macro photograph of one flat sheet of the stock under even light can feed the fibre
  (`scripts/paper_textures.py --photo`); the procedural maps alone are enough.

## 9. What to reject

Look at every image before you use it, and regenerate when it shows:
- a page, book or board lying on a table, a border, or a room around the work;
- flat vector art without depth, or a glossy CG render;
- soft, felt-like paper, or deckled sheets where the work wants crisp card;
- an even pale or white rim round every piece (a sticker), or a glow;
- one colour flooding the frame, or the key colour inside a piece;
- the wrong count, or pieces merged into each other;
- text or logos, third-party characters, or a user's reference copied instead of read.

If a second try still misses, keep the best image, note what it gets wrong, and fix that in the build instead.
