# My paper home

Build a pop-up paper home level by level, earn coins and decorate it. A cut-away paper house on the papercraft kit (reuses `../paper-house/src`).

- **Open `paper-home.html`** (one offline file, ~885 KB). Add `?name=Mia` to the address for "Mia's paper home" (a separate saved home per name).
- **Play:** tap golden stars on the lawn to earn coins (5 each). Tap a shop item, then tap a room to put it down. Tap a placed piece to **Colour**, **Turn**, **Move** or **Put away** (half the coins back). Placing things fills the progress bar: 3 things opens **level 2** (living room), 7 opens **level 3** (the garden with flowers, a car and a kitten), 11 completes the house. Level-ups give +25 coins.
- **Rooms:** bedroom and kitchen from the start, living room at level 2, garden at level 3. 14 paper items.
- **Safe for kids:** coins are earned in play only. There is no real money, no ads, no links out, no accounts and no data collection. The home is saved in this browser only (clearing the browser or using another device starts again).
- **Source:** `src/scene.js` (house, shop, game); the kit is `../paper-house/src`. Rebuild with `node build.mjs` (`DEPS` = a `node_modules` with `three@0.187.0` and esbuild).

Tested in headless Chromium (software GL) at 1280×720 and 390×844 touch: buying and placing with real clicks and taps, the locked living room refusing a placement, a star tap adding coins, placing 3 things reaching level 2 with the celebration card, selecting a piece and changing its colour, saving and restoring after a reload; no console errors. Not tested: a real GPU or touch device, drag-moving on touch, other levels end to end (level 3 shop items were checked in code, not played through), and children playing it.

Not in this first version: brick-built (LEGO-style) items, sound beyond the paper flaps, dragging items directly (it is tap shop item, tap room), more rooms (bathroom, garage), and unlocking by missions other than "place things".
