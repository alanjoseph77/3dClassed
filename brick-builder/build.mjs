// node build.mjs → brick-builder.html (one offline file: three.js r160 + OrbitControls inlined as data: URLs)
// three.js: MIT, (c) 2010-2023 three.js authors. Needs npm to fetch three@0.160.0 once into ./.three/
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
const C = new URL("./.three/", import.meta.url).pathname;
if (!existsSync(C + "package/build/three.module.min.js")) { mkdirSync(C, { recursive: true }); execSync("npm pack three@0.160.0 --silent && tar xzf three-0.160.0.tgz", { cwd: C }); }
const u = (f) => "data:text/javascript;base64," + readFileSync(C + f).toString("base64");
const map = JSON.stringify({ imports: { three: u("package/build/three.module.min.js"), "three/addons/controls/OrbitControls.js": u("package/examples/jsm/controls/OrbitControls.js") } });
const page = readFileSync(new URL("./src/page.html", import.meta.url), "utf8").replace("__IMPORTMAP__", map).replace("__APP__", readFileSync(new URL("./src/app.js", import.meta.url), "utf8"));
writeFileSync(new URL("./brick-builder.html", import.meta.url), page);
console.log("wrote brick-builder.html", Math.round(page.length / 1024), "KB");
