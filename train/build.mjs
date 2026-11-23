// Bundles src/*.js + three.js into ONE offline HTML file: train.html
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
const avatar = `<svg viewBox="0 0 120 120" class="ava" aria-hidden="true"><circle cx="60" cy="60" r="58" fill="#dfe8f0"/><path d="M18 118c4-26 20-36 42-36s38 10 42 36z" fill="#2c4a7a"/><path d="M48 84l12 14 12-14z" fill="#f4f1e8"/><circle cx="60" cy="56" r="22" fill="#a8714a"/><path d="M38 50c2-14 12-20 22-20s20 6 22 20c-6-6-14-8-22-8s-16 2-22 8z" fill="#1e1a18"/><rect x="34" y="28" width="52" height="12" rx="4" fill="#1d2c4a"/><rect x="40" y="38" width="40" height="5" rx="2" fill="#111"/><circle cx="51" cy="57" r="2.6" fill="#1a120c"/><circle cx="69" cy="57" r="2.6" fill="#1a120c"/><path d="M50 67c6 5 14 5 20 0" stroke="#1a120c" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M49 64c4-2 7-2 11 0 4-2 7-2 11 0" stroke="#1e1a18" stroke-width="3" fill="none"/></svg>`;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="theme-color" content="#1c2229"><title>Loco Pilot</title><link rel="icon" href="data:,">
<style>
:root{--ink:#1c2229;--card:rgba(255,252,244,.96);--red:#8b1e24;--yel:#f2c12e}
html,body{margin:0;height:100%;overflow:hidden;background:#c9d6df;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink)}
canvas#gl{display:block;width:100%;height:100%;touch-action:none}
[hidden]{display:none!important}
.panel{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:14px;overflow:auto;background:rgba(20,28,38,.25)}
.card{background:var(--card);border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.25);padding:18px 20px;max-width:980px;width:100%;max-height:calc(100% - 20px);overflow:auto}
.card h1{margin:0;font-size:24px}.card h2{margin:0 0 6px;font-size:20px}
.lob{display:grid;grid-template-columns:1.1fr 1fr;gap:18px}.who{display:flex;gap:12px;align-items:center;margin:10px 0 14px}.ava{width:76px;height:76px;flex:none}
.who label{font-size:13px;color:#555}.who input{display:block;font:600 17px system-ui;padding:8px 10px;border:1px solid #c9bfa8;border-radius:10px;width:200px;margin-top:4px}
.duty{display:block;width:100%;text-align:left;border:1px solid #e0d6bf;background:#fff;border-radius:12px;padding:10px 12px;margin:0 0 8px;cursor:pointer;font:inherit;color:inherit}
.duty:hover{border-color:var(--red)}.duty b{display:block;color:var(--red)}.duty span{display:block}.duty small{color:#666}
canvas.map{width:100%;height:auto;border-radius:12px;border:1px solid #d9cfb8;background:#d9e8f2}
table{border-collapse:collapse;width:100%;font-size:14px;margin:8px 0}th,td{text-align:left;padding:5px 6px;border-bottom:1px solid #e6dcc6}th{font-size:12px;color:#666;text-transform:uppercase;letter-spacing:.04em}
.hi{color:#555;font-family:"Noto Sans Devanagari","Nirmala UI",Mangal,sans-serif}.rules{font-size:14px;padding-left:18px;margin:8px 0}
.btn{font:700 16px system-ui;min-height:46px;padding:8px 18px;border-radius:12px;border:0;background:var(--red);color:#fff;cursor:pointer}.btn.ghost{background:#e9e1cf;color:var(--ink)}
.slipgrid{display:grid;grid-template-columns:1.25fr 1fr;gap:16px}.row{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
.grade{display:flex;align-items:baseline;gap:12px;margin:10px 0}.grade b{font-size:48px;color:var(--red)}.grade span{font-size:20px;font-weight:700}.small{font-size:13px;color:#555}
#hud{position:fixed;left:10px;right:10px;top:10px;display:flex;justify-content:space-between;gap:10px;pointer-events:none}
.hcard{background:rgba(14,20,28,.78);color:#fff;border-radius:12px;padding:8px 12px;font-size:14px;backdrop-filter:blur(6px)}
.hcard b{color:var(--yel)}#h-next{font-weight:700;font-size:16px}#mini{width:170px;height:170px;border-radius:10px;display:block}
.limrow{display:flex;align-items:center;gap:10px;margin-top:6px}.limsign{width:46px;height:46px;border-radius:50%;background:#fff;border:6px solid #c0281e;color:#111;font:800 17px system-ui;display:flex;align-items:center;justify-content:center;box-sizing:border-box}
.sig{width:16px;height:16px;border-radius:50%;display:inline-block;vertical-align:middle;margin-right:6px;box-shadow:0 0 8px currentColor}.sig.red{background:#ff3b2a;color:#ff3b2a}.sig.amber{background:#ffb21a;color:#ffb21a}.sig.green{background:#2aff6a;color:#2aff6a}
#ctl{position:fixed;left:0;right:0;bottom:0;display:flex;align-items:flex-end;justify-content:space-between;gap:10px;padding:10px;pointer-events:none}
#ctl>*{pointer-events:auto}.speedo{background:rgba(14,20,28,.82);color:#fff;border-radius:14px;padding:8px 14px;min-width:150px}.speedo b{font-size:38px;font-variant-numeric:tabular-nums}.bar{height:8px;background:#333;border-radius:4px;overflow:hidden;margin-top:4px}.bar i{display:block;height:100%;width:0}
#notch{font-weight:700;margin-top:4px}#notch.p{color:#7cff9a}#notch.b{color:#ffb21a}
.lever{display:grid;grid-template-columns:repeat(3,auto);gap:6px}.lever button,.tools button{font:700 15px system-ui;min-width:54px;min-height:52px;border-radius:12px;border:0;background:rgba(14,20,28,.82);color:#fff;cursor:pointer}
.lever #up{background:#2e7d32}.lever #dn{background:#c77d10}.lever #eb{background:#b71c1c}.tools{display:flex;flex-direction:column;gap:6px}.tools button{min-height:40px;font-size:13px;padding:0 10px}
#msg{position:fixed;left:50%;top:72px;transform:translateX(-50%);background:rgba(14,20,28,.88);color:#fff;padding:10px 16px;border-radius:12px;font-weight:600;opacity:0;transition:opacity .3s;pointer-events:none;max-width:calc(100% - 30px);text-align:center}#msg.on{opacity:1}
#halt{color:var(--yel);font-weight:700}
#cabframe{position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse 72% 62% at 50% 44%,transparent 92%,rgba(20,22,26,.96) 93%),linear-gradient(transparent 82%,#2b2f35 82%)}
#cabframe:after{content:"";position:absolute;left:50%;top:4%;bottom:18%;width:14px;margin-left:-7px;background:#2b2f35}
button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
#hud{top:max(10px,env(safe-area-inset-top));left:max(10px,env(safe-area-inset-left));right:max(10px,env(safe-area-inset-right))}
#ctl{padding:10px max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))}
.fsbtn{position:fixed;right:max(10px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom));z-index:30;font:700 14px system-ui;min-height:40px;padding:0 14px;border-radius:12px;border:0;background:rgba(14,20,28,.82);color:#fff;cursor:pointer}
#rotate{position:fixed;inset:0;z-index:40;display:none;align-items:center;justify-content:center;background:rgba(14,20,28,.92);color:#fff;text-align:center;padding:24px}
#rotate .ph{width:64px;height:104px;border:5px solid #fff;border-radius:14px;margin:0 auto 18px;animation:rot 2.4s ease-in-out infinite}
@keyframes rot{0%,20%{transform:rotate(0)}50%,80%{transform:rotate(-90deg)}100%{transform:rotate(0)}}
#rotate button{margin-top:16px;font:700 15px system-ui;min-height:44px;padding:0 18px;border-radius:12px;border:0;background:#f2c12e;color:#111}
@media (orientation:portrait) and (max-width:760px){body.driving:not(.portrait-ok) #rotate{display:flex}}
@media (prefers-reduced-motion:reduce){#rotate .ph{animation:none;transform:rotate(-90deg)}}
/* phones held sideways: everything smaller so the line stays in view */
@media (orientation:landscape) and (max-height:520px){
  .hcard{font-size:11.5px;padding:5px 8px;border-radius:10px}#h-next{font-size:12.5px}#h-pilot{display:none}
  .limrow{margin-top:3px;gap:6px}.limsign{width:34px;height:34px;border-width:4px;font-size:13px}#mini{width:96px;height:96px}
  #ctl{padding-top:4px}.speedo{min-width:96px;padding:5px 10px}.speedo b{font-size:26px}#notch{font-size:12px}
  .lever{grid-template-columns:repeat(6,auto)}.lever button{min-width:50px;min-height:44px;font-size:13px;padding:0 6px}
  .tools{flex-direction:row}.tools button{min-height:44px}
  .fsbtn{bottom:auto;top:max(8px,env(safe-area-inset-top));right:calc(max(10px,env(safe-area-inset-right)) + 112px);min-height:34px;font-size:12px}
  #msg{top:28%;font-size:13px}
  .card{padding:12px 14px}.card h1{font-size:19px}.card h2{font-size:16px}.lob,.slipgrid{grid-template-columns:1.2fr 1fr;gap:12px}
  .who{margin:6px 0 8px}.ava{width:56px;height:56px}.duty{padding:7px 10px;margin-bottom:6px}table{font-size:12px}.rules{font-size:12px}
}
@media (orientation:portrait) and (max-width:760px){.fsbtn{top:max(10px,env(safe-area-inset-top));bottom:auto}}
body:not(.driving) .fsbtn{top:auto;bottom:max(8px,env(safe-area-inset-bottom));right:max(8px,env(safe-area-inset-right))}
@media (max-width:760px){#msg{top:40%}.lob,.slipgrid{grid-template-columns:1fr}#mini{width:110px;height:110px}.hcard{font-size:12px;padding:6px 9px}#h-next{font-size:13px}.speedo b{font-size:28px}.speedo{min-width:110px}.lever button{min-width:48px;min-height:48px}#hud{flex-wrap:wrap}}
</style></head>
<body><canvas id="gl"></canvas>
<div id="cabframe" hidden></div>
<div id="hud" hidden>
  <div class="hcard"><div id="h-train"></div><div id="h-pilot" style="opacity:.8"></div><div style="margin-top:4px">Next halt: <span id="h-next"></span> · <b id="h-dist"></b></div><div>Clock <b id="h-clock"></b> <span id="h-due" style="opacity:.85"></span></div><div id="halt"></div>
    <div class="limrow"><div class="limsign" id="lim">110</div><div><div id="limwhy">Line speed</div><div><span class="sig red" id="sig"></span><span id="sigtxt">Signal</span></div></div></div></div>
  <div class="hcard"><canvas id="mini" width="340" height="340"></canvas></div>
</div>
<div id="ctl" hidden>
  <div class="speedo"><div><b id="spd">0</b> km/h</div><div class="bar"><i id="spdbar"></i></div><div id="notch">Coast (0)</div></div>
  <div class="lever"><button id="up" title="Power up (↑ / W)">▲ Power</button><button id="zero" title="Coast (0)">0</button><button id="dn" title="Brake (↓ / S)">▼ Brake</button><button id="hornb" title="Horn (H)">Horn</button><button id="eb" title="Emergency brake (E)">EB</button><button id="cam" title="Camera (C)">View: chase</button></div>
  <div class="tools"><button id="mute">Sound on</button><button id="quit">Lobby</button></div>
</div>
<div id="msg"></div>
<button class="fsbtn" id="fs" type="button">⛶ Full screen</button>
<div id="rotate"><div><div class="ph"></div><b>Turn your phone sideways</b><br>The line looks best in landscape.<br><button id="portraitok" type="button">Play in portrait</button></div></div>
<div class="panel" id="lobby" hidden><div class="card"><div class="lob"><div>
  <h1>Crew lobby</h1><div class="who">${avatar}<div><label for="pname">Loco pilot</label><input id="pname" maxlength="28" autocomplete="off"></div></div>
  <h2>Today's duties</h2><div id="duties"></div></div>
  <div><canvas class="map" id="lobbymap" width="600" height="600"></canvas><p class="small">Pick a duty, read your duty slip and sign on. Distances on the line are shortened (1 km is driven as 40 m) and the clock runs faster, so a 300 km duty takes minutes. Speeds shown are true.</p></div></div></div></div>
<div class="panel" id="slip" hidden><div class="card"><div class="slipgrid"><div id="slipbody"></div><div><canvas class="map" id="slipmap" width="600" height="600"></canvas></div></div>
  <div class="row"><button class="btn" id="signon">Sign on and start duty</button><button class="btn ghost" id="back">Back to lobby</button></div></div></div>
<div class="panel" id="report" hidden><div class="card"><div id="rep"></div><div class="row"><button class="btn" id="again">Back to crew lobby</button></div></div></div>
<script type="module">${js}</script></body></html>`;
fs.writeFileSync(path.join(HERE, 'train.html'), html);
console.log('train.html', (html.length / 1024).toFixed(0) + ' KB');
