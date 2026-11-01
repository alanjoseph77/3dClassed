// Opens reference-site.html in headless Chromium with the network cut off and checks the page works.
// Usage: node check.mjs      (Playwright is preinstalled in cloud sessions)
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");
const FILE = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), "reference-site.html")).href;
let failed = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) failed++; };
async function open(b, opts) {
  const p = await (await b.newContext(opts)).newPage(), errs = [], external = [];
  p.on("pageerror", (e) => errs.push(e.message.slice(0, 120)));
  p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 120)); });
  await p.route(/^https?:/, (r) => { external.push(r.request().url()); r.abort(); });
  await p.goto(FILE); await p.waitForTimeout(2500);
  return { p, errs, external };
}
const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
let { p, errs, external } = await open(b, { viewport: { width: 1280, height: 800 } });
ok(external.length === 0, "works offline: no web address was requested " + JSON.stringify(external));
ok(errs.length === 0, "desktop: no page errors " + JSON.stringify(errs));
ok(await p.evaluate(() => !!window.lenis && document.documentElement.classList.contains("lenis")), "Lenis is running");
ok(await p.evaluate(() => document.querySelectorAll("#headline div").length > 0), "SplitText wrapped the headline");
ok(await p.evaluate(() => !!document.querySelector("#vanta canvas")), "Vanta canvas is drawn in the hero");
await p.evaluate(() => window.lenis.scrollTo("#stats", { immediate: true })); await p.waitForTimeout(2500);
ok(await p.evaluate(() => document.querySelector('[data-count="110"]').textContent === "110"), "count-up ends at 110");
ok(await p.evaluate(() => !document.querySelector("#vanta canvas")), "Vanta is destroyed after the hero leaves the screen");
const top = await p.evaluate(() => document.querySelector(".hz").getBoundingClientRect().top + scrollY);
await p.evaluate((y) => window.lenis.scrollTo(y, { immediate: true }), top); await p.waitForTimeout(800);
const x0 = await p.evaluate(() => gsap.getProperty("#rail", "x"));
await p.evaluate((y) => window.lenis.scrollTo(y + 700, { immediate: true }), top); await p.waitForTimeout(1500);
ok((await p.evaluate(() => gsap.getProperty("#rail", "x"))) < x0 - 300, "the pinned rail moves sideways while scrolling down");
await p.evaluate(() => window.lenis.scrollTo("#tools", { immediate: true })); await p.waitForTimeout(2500);
ok(await p.evaluate(() => [...document.querySelectorAll(".tool")].every((t) => +getComputedStyle(t).opacity > 0.95)), "tool cards are revealed");
const ch = await p.evaluate(() => document.querySelector("#chain").getBoundingClientRect().top + scrollY);
await p.evaluate((y) => window.lenis.scrollTo(y + 1300, { immediate: true }), ch); await p.waitForTimeout(1500);
ok(await p.evaluate(() => document.querySelectorAll(".step.on").length === 3), "the scrubbed timeline reaches step 3");
({ p, errs } = await open(b, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }));
ok(errs.length === 0, "phone: no page errors " + JSON.stringify(errs));
ok(await p.evaluate(() => document.documentElement.scrollWidth <= 390), "phone: no sideways scroll");
({ p, errs } = await open(b, { viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" }));
ok(await p.evaluate(() => !window.lenis && !document.querySelector("#vanta canvas")), "reduced motion: no Lenis, no Vanta");
ok(await p.evaluate(() => [...document.querySelectorAll(".reveal,.tool,.cat,#headline")].every((e) => getComputedStyle(e).visibility !== "hidden" && +getComputedStyle(e).opacity > 0.99)), "reduced motion: all content is visible");
await b.close();
console.log(failed ? `${failed} check(s) failed` : "all checks passed");
process.exit(failed ? 1 : 0);
