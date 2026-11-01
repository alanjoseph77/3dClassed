// Builds reference-site.html: the same page with every library inlined, so it opens offline by double-click.
// Usage: node build.mjs [path-to-node_modules]   (installs the libraries into a temp folder if no path is given)
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from "node:fs";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
let nm = process.argv[2];
if (!nm) {
  const tmp = mkdtempSync(join(tmpdir(), "gsap-example-"));
  execSync("npm init -y >/dev/null && npm i gsap@3.15.0 lenis@1.3.27 vanta@0.5.24 three@0.134.0 --no-audit --no-fund", { cwd: tmp, stdio: "inherit" });
  nm = join(tmp, "node_modules");
}
const files = {
  "three.js/r134/three.min.js": "three/build/three.min.js",
  "vanta@0.5.24/dist/vanta.net.min.js": "vanta/dist/vanta.net.min.js",
  "gsap@3.15.0/dist/gsap.min.js": "gsap/dist/gsap.min.js",
  "gsap@3.15.0/dist/ScrollTrigger.min.js": "gsap/dist/ScrollTrigger.min.js",
  "gsap@3.15.0/dist/SplitText.min.js": "gsap/dist/SplitText.min.js",
  "lenis@1.3.27/dist/lenis.min.js": "lenis/dist/lenis.min.js",
};
let html = readFileSync(join(here, "reference-site.src.html"), "utf8");
for (const [url, rel] of Object.entries(files)) {
  const re = new RegExp(`<script src="[^"]*${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"></script>`);
  if (!re.test(html)) throw new Error("script tag not found for " + url);
  const code = readFileSync(join(nm, rel), "utf8").replace(/<\/script/gi, "<\\/script");
  html = html.replace(re, () => `<script>/* ${rel} */\n${code}\n</script>`);
}
const css = readFileSync(join(nm, "lenis/dist/lenis.css"), "utf8");
html = html.replace(/<link rel="stylesheet" href="[^"]*lenis\.css">/, () => `<style>/* lenis.css */\n${css}\n</style>`);
if (/https:\/\/(cdn|unpkg)/.test(html.replace(/<!--[\s\S]*?-->/g, ""))) throw new Error("a CDN link is still in the page");
writeFileSync(join(here, "reference-site.html"), html);
console.log("wrote reference-site.html", (html.length / 1024).toFixed(0) + " KB");
