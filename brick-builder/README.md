# Brick Builder

Type what to build and it's assembled **brick by brick in 3D**: one offline HTML file (`brick-builder.html`), with three.js built in.

- **Objects (15):** car, truck (try "fire truck"), house, tower, castle, bridge, boat, plane, robot, rocket, crane, train, tree, pyramid, dog. Synonyms work too ("lorry", "ship", "lighthouse", "spaceship"…).
- **Colours:** red, blue, yellow, green, lime, white, black, orange, purple, pink, grey, brown, tan, dark blue, dark red, dark green, azure, gold, silver, or **rainbow**. A second colour is used for roofs and trims ("grey castle with blue roof"). Materials work as colours: stone, wood, metal, sand, snow.
- **Sizes and extras:** small, big, tall, "with garden", "police car", "flat roof".
- Build animation, drag to rotate, scroll to zoom, auto-spin, parts list. The same words always give the same build.

Limits: it only knows the 15 objects above. An unknown word gets a message listing what it can build. Bricks are simple studded blocks, not exact catalogue parts. For real LDraw models use the `/lego` skill with Claude Code.

Edit `src/app.js` (generators are the `G.<name>` functions) and `src/page.html`, then run `node build.mjs` to rebuild the single file. three.js r160: MIT licence.
