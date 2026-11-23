// Bundles src/main.js + three.js into ONE offline HTML file: train.html
//   DEPS=<node_modules with three@0.187 and esbuild> node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEPS = process.env.DEPS || path.join(HERE, 'node_modules');
const esbuild = createRequire(path.join(process.env.ESBUILD_DEPS || DEPS, 'x.js'))('esbuild');
const res = await esbuild.build({ entryPoints: [path.join(HERE, 'src/main.js')], bundle: true, format: 'esm', minify: true, write: false, target: 'es2022', legalComments: 'none', nodePaths: [DEPS], logLevel: 'warning' });
const js = res.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Train</title><link rel="icon" href="data:,">
<style>
html,body{margin:0;height:100%;overflow:hidden;background:#bcd0e0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}
#ui{position:fixed;left:0;right:0;bottom:0;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;padding:12px;background:linear-gradient(transparent,rgba(12,22,34,.55))}
#ui button{font:600 15px system-ui,sans-serif;min-height:44px;padding:8px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.35);background:rgba(20,32,48,.72);color:#fff;cursor:pointer;backdrop-filter:blur(6px)}
#ui button[aria-pressed=true],#go{background:#e8b82c;color:#1a2230;border-color:#e8b82c}
#views{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
#sp{display:flex;align-items:center;gap:10px;color:#fff;font-weight:600;background:rgba(20,32,48,.72);border-radius:12px;padding:6px 14px;min-height:44px}
#sp input{width:140px;accent-color:#e8b82c}#spd{font-size:24px;min-width:3ch;text-align:right;font-variant-numeric:tabular-nums}
#title{position:fixed;left:16px;top:12px;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.6);font-weight:700;font-size:20px;pointer-events:none}
#title small{display:block;font-weight:500;font-size:13px;opacity:.9}
@media (max-width:600px){#title{font-size:16px}#title small{display:none}#ui{gap:6px;padding:8px}#ui button{min-height:38px;padding:6px 11px;font-size:13px}#sp{min-height:38px;padding:4px 10px}#sp input{width:110px}#spd{font-size:20px}}
</style></head>
<body><canvas id="gl"></canvas>
<div id="title">Diesel-electric locomotive and coaches<small>Drag to look around · scroll or pinch to zoom · keys 1-6 change view</small></div>
<div id="ui"><div id="views"><button data-v="hero" aria-pressed="true">3/4</button><button data-v="side">Side</button><button data-v="front">Front</button><button data-v="cab">Driver</button><button data-v="top">Top</button><button data-v="whole">Whole train</button></div>
<div id="sp"><button id="go" type="button">Drive</button><input id="speed" type="range" min="0" max="33" step="1" value="0" aria-label="Speed"><span><b id="spd">0</b> km/h</span></div>
<button id="lights" type="button" aria-pressed="false">Lights</button></div>
<script type="module">${js}</script></body></html>`;
fs.writeFileSync(path.join(HERE, 'train.html'), html);
console.log('train.html', (html.length / 1024).toFixed(0) + ' KB');
