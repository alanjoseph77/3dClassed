// Bundles src/scene.js (shares ../paper-house/src for the kit) + three.js into ONE offline HTML file: paper-explorer.html
//   node build.mjs   (needs esbuild and three@0.187: set DEPS to a node_modules folder that has them)
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEPS = process.env.DEPS || path.join(HERE, 'node_modules');
const ESB = process.env.ESBUILD_DEPS || DEPS;
const esbuild = createRequire(path.join(ESB, 'x.js'))('esbuild');
const alias = {name: 'alias', setup(b) { b.onResolve({filter: /^papercraft\//}, (a) => ({path: path.join(HERE, '..', 'paper-house', 'src', a.path.slice('papercraft/'.length))})); }};
const res = await esbuild.build({entryPoints: [path.join(HERE, 'src/scene.js')], bundle: true, format: 'esm', minify: true, write: false, target: 'es2022', legalComments: 'none', plugins: [alias], nodePaths: [DEPS], logLevel: 'warning'});
const js = res.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Paper garden explorer</title><link rel="icon" href="data:,">
<style>html,body{margin:0;height:100%;overflow:hidden;background:#cdd7c4}canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}
.hint{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);font:italic 14px/1.3 Georgia,'Times New Roman',serif;color:#fffaf0;opacity:.9;letter-spacing:.03em;pointer-events:none;text-shadow:0 1px 3px #4a3a58}</style></head>
<body>
<script type="module">${js}</script></body></html>`;
fs.writeFileSync(path.join(HERE, 'paper-explorer.html'), html);
console.log('paper-explorer.html', (html.length / 1024).toFixed(0) + ' KB');
