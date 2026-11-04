// 6/4 switched reluctance motor as a page you drive. RUN: the controller fires each phase from rotor position and a
// speed loop sets the current. STEP: you fire the phases yourself. Left alone it tours itself; any click, drag, wheel or
// key hands control over, 25 s of quiet hands it back. Everything on screen reads the sim in srm-shared/srm.js.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createSim, dLdth, Lph, MOTOR as M, NEXT, PERIOD, PHASES, phiOf, STEP} from '../srm-shared/srm.js';
import {ACCENT, buildMotor} from '../srm-shared/motor.js';

const D2R = Math.PI / 180, SC = 0.01, IDLE = 25;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const wrapA = (d) => ((((d + 180) % 360) + 360) % 360) - 180;
const PH_COL = ['#e2552b', '#1f86a0', '#6a5bd0'];
const $ = (s, r = document) => r.querySelector(s);

// ---------------------------------------------------------------- page
const app = document.getElementById('app');
app.innerHTML = `
<canvas id="gl"></canvas>
<header class="top"><h1>6/4 switched reluctance motor</h1><p>3 phases · 6 stator poles · 4 rotor poles · 30° per step · no magnets</p></header>
<aside class="panel left" id="left">
  <div class="seg" id="mode"><button data-m="run" aria-pressed="true">Run</button><button data-m="step" aria-pressed="false">Step</button></div>
  <div id="runCtl">
    <label>Speed <output id="oRpm"></output><input type="range" id="rpm" min="30" max="600" step="10" value="240"></label>
    <label>Load torque <output id="oLoad"></output><input type="range" id="load" min="0" max="1.2" step="0.05" value="0.2"></label>
    <label>Turn-on advance <output id="oAdv"></output><input type="range" id="adv" min="-6" max="12" step="1" value="0"></label>
    <div class="row"><button id="dir" class="chip">Direction ↺ CCW</button></div>
  </div>
  <div id="stepCtl" hidden>
    <div class="row three" id="phBtns"></div>
    <label>Current <output id="oI"></output><input type="range" id="cur" min="1" max="10" step="0.5" value="6"></label>
    <div class="row"><button id="next" class="chip">Fire next phase (A→C→B)</button></div>
    <p class="hint">Switch a phase on and its two opposite stator poles pull the nearest rotor poles into line. Each switch moves the rotor 30°.</p>
  </div>
  <label>Slow motion <output id="oSlow"></output><input type="range" id="slow" min="0.02" max="1" step="0.01" value="0.08"></label>
  <div class="row"><button id="pause" class="chip">Pause</button></div>
</aside>
<aside class="panel right" id="right">
  <div class="grid">
    <div><i>Speed</i><b id="rRpm">0</b><u>rpm</u></div>
    <div><i>Torque</i><b id="rT">0.00</b><u>N·m</u></div>
    <div><i>Power</i><b id="rP">0</b><u>W</u></div>
    <div><i>Phase freq</i><b id="rF">0</b><u>Hz</u></div>
  </div>
  <div class="cur" id="curBars"></div>
  <h3>Inductance vs rotor angle</h3>
  <canvas id="cL" width="620" height="260"></canvas>
  <h3>Currents and torque</h3>
  <canvas id="cW" width="620" height="260"></canvas>
  <p class="eq">T = ½ · i² · dL/dθ</p>
</aside>
<nav class="bottom" id="nav"></nav>
<div class="caption" id="caption"></div>
<div id="labels"></div>`;
const canvas = $('#gl');

// ---------------------------------------------------------------- stage
const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const BG = '#ecebe6';
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 8, 18);
{
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;
  pm.dispose();
}
const camera = new THREE.PerspectiveCamera(28, 16 / 9, 0.05, 60);
const sun = new THREE.DirectionalLight('#fff4e6', 2.2);
sun.position.set(-3, 5, 4);
sun.castShadow = true;
Object.assign(sun.shadow.camera, {left: -2.4, right: 2.4, top: 2.4, bottom: -2.4, near: 1, far: 14});
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.01; sun.shadow.radius = 4;
scene.add(sun, new THREE.HemisphereLight('#ffffff', '#d9d4c8', 0.6));
const motor = buildMotor();
motor.root.scale.setScalar(SC);
scene.add(motor.root);
const floorY = -0.86;
const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshStandardMaterial({color: '#e4e1d8', roughness: 1, metalness: 0}));
floor.rotation.x = -Math.PI / 2; floor.position.y = floorY; floor.receiveShadow = true;
const plate = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 1.7), new THREE.MeshStandardMaterial({color: '#cfcbc0', roughness: 0.8}));
plate.position.y = floorY + 0.02; plate.receiveShadow = true; plate.castShadow = true;
scene.add(floor, plate);
// two saddles under the housing so the motor sits on the plate
for (const z of [-0.3, 0.3]) {
  const sd = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.16), new THREE.MeshStandardMaterial({color: '#3b424a', roughness: 0.6}));
  sd.position.set(0, floorY + 0.13, z); sd.castShadow = true; sd.receiveShadow = true; scene.add(sd);
}
motor.root.position.y = 0;

// ---------------------------------------------------------------- sim + state
const sim = createSim();
const ctl = {mode: 'run', rpm: 240, load: 0.2, dir: 1, adv: 0, I: 6, on: [false, false, false]};
let slow = 0.08, paused = false, flow = 0;
const view = {explode: 0, coils: true, flux: true, housing: false, labels: false};
const ease = {explode: 0, labels: 0, housing: 0};

// camera
const VIEWS = {
  hero: {az: 34, el: 20, d: 4.6, t: [0, -0.05, 0.05], name: '3/4'},
  end: {az: 0, el: 0, d: 3.5, t: [0, 0, 0], name: 'End'},
  side: {az: 90, el: 4, d: 4.8, t: [0, 0, 0.1], name: 'Side'},
  gap: {az: 10, el: 6, d: 2.3, t: [0.1, -0.15, 0.25], name: 'Air gap'},
  coil: {az: 24, el: 30, d: 2.5, t: [0.3, 0.05, 0.05], name: 'Coil'},
};
let viewName = 'hero', viewT0 = 0;
const cam = {...VIEWS.hero, t: [...VIEWS.hero.t]};
const off = {az: 0, el: 0, k: 1};
let T = 0;

// ---------------------------------------------------------------- UI wiring
const phBtns = $('#phBtns');
PHASES.forEach((p, k) => {
  const b = document.createElement('button'); b.className = 'chip ph'; b.dataset.k = k; b.innerHTML = `<i style="background:${PH_COL[k]}"></i>${p}`; b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', () => { takeOver(); ctl.on[k] = !ctl.on[k]; sync(); });
  phBtns.appendChild(b);
});
const bars = $('#curBars');
bars.innerHTML = PHASES.map((p, k) => `<div><span style="color:${PH_COL[k]}">${p}</span><em><s style="background:${PH_COL[k]}"></s></em><b>0.0 A</b></div>`).join('');
const nav = $('#nav');
const mkBtn = (label, key, fn, cls = '') => { const b = document.createElement('button'); b.className = 'chip ' + cls; b.innerHTML = label; b.dataset.key = key; b.addEventListener('click', () => { takeOver(); fn(b); sync(); }); nav.appendChild(b); return b; };
const setView = (v) => { viewName = v; viewT0 = T; Object.assign(off, {az: 0, el: 0, k: 1}); };
Object.entries(VIEWS).forEach(([k, v], i) => mkBtn(`<kbd>${i + 1}</kbd>${v.name}`, String(i + 1), () => setView(k), 'view'));
nav.appendChild(Object.assign(document.createElement('span'), {className: 'sp'}));
const tog = (label, key, prop, k) => mkBtn(`<kbd>${k}</kbd>${label}`, k, () => { view[prop] = typeof view[prop] === 'boolean' ? !view[prop] : view[prop] ? 0 : 1; }, 'tog');
const tbtn = {coils: tog('Coils', 'c', 'coils', 'c'), flux: tog('Flux', 'f', 'flux', 'f'), housing: tog('Housing', 'h', 'housing', 'h'), labels: tog('Labels', 'l', 'labels', 'l'), explode: tog('Exploded', 'e', 'explode', 'e')};
const tourChip = mkBtn('', 't', () => {}, 'tour'); tourChip.addEventListener('click', () => { if (AP.on) takeOver(); else startTour(); });

function sync() {
  document.querySelectorAll('#mode button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === ctl.mode)));
  $('#runCtl').hidden = ctl.mode !== 'run'; $('#stepCtl').hidden = ctl.mode !== 'step';
  phBtns.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(ctl.on[+b.dataset.k])));
  $('#dir').textContent = ctl.dir > 0 ? 'Direction ↺ CCW' : 'Direction ↻ CW';
  $('#pause').textContent = paused ? 'Resume' : 'Pause';
  $('#oRpm').textContent = ctl.rpm + ' rpm'; $('#oLoad').textContent = ctl.load.toFixed(2) + ' N·m'; $('#oAdv').textContent = (ctl.adv > 0 ? '+' : '') + ctl.adv + '°';
  $('#oI').textContent = ctl.I.toFixed(1) + ' A'; $('#oSlow').textContent = '×' + slow.toFixed(2);
  const lit = {coils: view.coils, flux: view.flux, housing: view.housing, labels: view.labels, explode: view.explode > 0.5};
  for (const k in tbtn) tbtn[k].setAttribute('aria-pressed', String(!!lit[k]));
  nav.querySelectorAll('.view').forEach((b) => b.setAttribute('aria-pressed', String(Object.keys(VIEWS)[+b.dataset.key - 1] === viewName)));
}
document.querySelectorAll('#mode button').forEach((b) => b.addEventListener('click', () => {
  takeOver(); ctl.mode = b.dataset.m; ctl.on = [false, false, false]; if (ctl.mode === 'step') { sim.s.Iint = 0; ctl.on[0] = true; } sync();
}));
const rng = (id, fn) => $(id).addEventListener('input', (e) => { takeOver(); fn(parseFloat(e.target.value)); sync(); });
rng('#rpm', (v) => (ctl.rpm = v)); rng('#load', (v) => (ctl.load = v)); rng('#adv', (v) => (ctl.adv = v)); rng('#cur', (v) => (ctl.I = v)); rng('#slow', (v) => (slow = v));
$('#dir').addEventListener('click', () => { takeOver(); ctl.dir *= -1; sync(); });
$('#pause').addEventListener('click', () => { takeOver(); paused = !paused; sync(); });
$('#next').addEventListener('click', () => {
  takeOver();
  const cur = ctl.on.findIndex(Boolean), k = cur < 0 ? 0 : cur;
  ctl.on = [false, false, false];
  ctl.on[cur < 0 ? 0 : ctl.dir > 0 ? NEXT[k] : NEXT.indexOf(k)] = true; sync();
});
addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || /input|textarea/i.test(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  if (k === ' ') $('#pause').click();
  else if (k === 'm') document.querySelector(`#mode button[data-m="${ctl.mode === 'run' ? 'step' : 'run'}"]`).click();
  else { const b = nav.querySelector(`[data-key="${k}"]`); if (b) b.click(); else return; }
  e.preventDefault();
});

// ---------------------------------------------------------------- the tour
const AP = {on: true, t0: 0};
let lastInput = 0;
const TOUR = [
  [0, 'hero', {labels: 0, explode: 0, flux: 1, coils: 1, housing: 0}, {mode: 'run', rpm: 150}, 'No magnets and no winding on the rotor: just a 4-pole iron wheel inside 6 coiled stator poles.'],
  [7, 'end', {labels: 1}, {}, 'Each phase is a pair of opposite poles. Switch it on and the nearest rotor poles are dragged into line.'],
  [14, 'gap', {labels: 0}, {}, 'Torque is made across the 0.5 mm air gap, where inductance changes with angle: T = ½·i²·dL/dθ.'],
  [21, 'coil', {coils: 1}, {}, 'Phases fire A, C, B, one after another, so every switch turns the rotor 30° and the field chases it round.'],
  [28, 'hero', {explode: 1, labels: 1}, {}, 'Pull it apart: stator laminations, copper coils, rotor, shaft, position disc and end bells.'],
  [37, 'hero', {explode: 0, labels: 0}, {}, 'Your turn. Drag to orbit. Try Step mode and fire the phases yourself.'],
];
const DURATION = 44;
let tourIdx = -1;
function startTour() { AP.on = true; AP.t0 = T; tourIdx = -1; ctl.mode = 'run'; ctl.on = [false, false, false]; Object.assign(off, {az: 0, el: 0, k: 1}); slow = 0.08; sync(); }
function takeOver() { lastInput = T; if (!AP.on) return; AP.on = false; $('#caption').classList.remove('on'); sync(); }
addEventListener('pointerdown', (e) => { if (!e.target.closest('.tour')) takeOver(); });
function tourStep(c) {
  let i = 0; while (i + 1 < TOUR.length && c >= TOUR[i + 1][0]) i++;
  if (i === tourIdx) return;
  tourIdx = i;
  const [, v, vw, cc, cap] = TOUR[i];
  if (v !== viewName) setView(v);
  for (const q in vw) view[q] = q === 'explode' ? vw[q] : !!vw[q];
  if (cc.mode) { ctl.mode = cc.mode; } if (cc.rpm) ctl.rpm = cc.rpm;
  const el = $('#caption'); el.textContent = cap; el.classList.add('on');
  sync();
}

// ---------------------------------------------------------------- camera, pointer
let drag = null; const ptrs = new Map(); let pinch = 0;
canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); drag = [e.clientX, e.clientY]; canvas.classList.add('drag'); });
canvas.addEventListener('pointermove', (e) => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) off.k = clamp(off.k * (pinch / d), 0.4, 2.4); pinch = d; lastInput = T; return; }
  off.az += (e.clientX - drag[0]) * 0.35; off.el = clamp(off.el + (e.clientY - drag[1]) * 0.25, -50, 70); drag = [e.clientX, e.clientY]; lastInput = T;
});
const endPtr = (e) => { ptrs.delete(e.pointerId); pinch = 0; if (!ptrs.size) { drag = null; canvas.classList.remove('drag'); } else drag = [...ptrs.values()][0]; };
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('wheel', (e) => { e.preventDefault(); takeOver(); off.k = clamp(off.k * Math.exp(e.deltaY * 0.0012), 0.4, 2.4); }, {passive: false});

let W = 1, H = 1;
function fit() {
  const r = canvas.getBoundingClientRect(); W = Math.max(2, r.width); H = Math.max(2, r.height);
  const pr = Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.5 : 2);
  renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.updateProjectionMatrix();
}
addEventListener('resize', fit);

// ---------------------------------------------------------------- charts
const cL = $('#cL'), cW = $('#cW'), gL = cL.getContext('2d'), gW = cW.getContext('2d');
const css = getComputedStyle(document.documentElement);
const INK = '#2b2926', MUTE = '#8d877c', LINE = '#d9d4c7';
const HIST = 520, hist = {i: [new Float32Array(HIST), new Float32Array(HIST), new Float32Array(HIST)], T: new Float32Array(HIST), n: 0, acc: 0};
function pushHist(dt, s) {
  hist.acc += dt;
  while (hist.acc >= 2.5e-4) { hist.acc -= 2.5e-4; for (let k = 0; k < 3; k++) { hist.i[k].copyWithin(0, 1); hist.i[k][HIST - 1] = s.i[k]; } hist.T.copyWithin(0, 1); hist.T[HIST - 1] = s.T; hist.n++; }
}
function drawL(th) {
  const g = gL, w = cL.width, h = cL.height, px = 66, py = 26, pw = w - px - 16, ph = h - py - 48;
  g.clearRect(0, 0, w, h); g.font = '600 24px JetBrains Mono'; g.lineWidth = 1;
  const X = (a) => px + (a / PERIOD) * pw, Y = (l) => py + ph - ((l - 0) / (M.La * 1.08)) * ph;
  g.strokeStyle = LINE; g.fillStyle = MUTE;
  for (const l of [0, 0.01, 0.02]) { g.beginPath(); g.moveTo(px, Y(l)); g.lineTo(px + pw, Y(l)); g.stroke(); g.fillText(String(l * 1000), 18, Y(l) + 8); }
  for (const a of [0, 30, 60, 90]) g.fillText(a + '°', X(a) - 16, h - 10);
  g.fillText('mH', 4, py + 4);
  for (let k = 0; k < 3; k++) {
    g.strokeStyle = PH_COL[k]; g.lineWidth = sim.s.on[k] ? 5 : 3; g.globalAlpha = sim.s.on[k] ? 1 : 0.6; g.beginPath();
    for (let a = 0; a <= PERIOD; a += 1) { const l = Lph(phiOf(a, k)); a ? g.lineTo(X(a), Y(l)) : g.moveTo(X(a), Y(l)); }
    g.stroke();
  }
  g.globalAlpha = 1;
  const a = ((((th / D2R) % PERIOD) + PERIOD) % PERIOD);
  g.strokeStyle = ACCENT; g.lineWidth = 2; g.beginPath(); g.moveTo(X(a), py); g.lineTo(X(a), py + ph); g.stroke();
  for (let k = 0; k < 3; k++) { g.fillStyle = PH_COL[k]; g.beginPath(); g.arc(X(a), Y(Lph(phiOf(th / D2R, k))), 8, 0, 7); g.fill(); }
}
function drawW() {
  const g = gW, w = cW.width, h = cW.height, px = 78, py = 14, pw = w - px - 16, ph = h - py - 46;
  g.clearRect(0, 0, w, h); g.font = '600 24px JetBrains Mono'; g.lineWidth = 1;
  const X = (j) => px + (j / (HIST - 1)) * pw, Yi = (v) => py + ph - (v / (M.Imax * 1.1)) * ph;
  g.strokeStyle = LINE; g.fillStyle = MUTE;
  for (const v of [0, 5, 10]) { g.beginPath(); g.moveTo(px, Yi(v)); g.lineTo(px + pw, Yi(v)); g.stroke(); g.fillText(v + ' A', 4, Yi(v) + 8); }
  g.fillText('last 130 ms →', w - 220, h - 10);
  const Tmax = Math.max(1, ...hist.T.map(Math.abs));
  g.setLineDash([]);
  for (let k = 0; k < 3; k++) { g.strokeStyle = PH_COL[k]; g.lineWidth = 3.4; g.beginPath(); for (let j = 0; j < HIST; j++) j ? g.lineTo(X(j), Yi(hist.i[k][j])) : g.moveTo(X(j), Yi(hist.i[k][j])); g.stroke(); }
  g.strokeStyle = INK; g.lineWidth = 2; g.setLineDash([6, 4]); g.beginPath();
  for (let j = 0; j < HIST; j++) { const y = py + ph - (clamp(hist.T[j], 0, Tmax * 1.05) / (Tmax * 1.1)) * ph; j ? g.lineTo(X(j), y) : g.moveTo(X(j), y); } g.stroke(); g.setLineDash([]);
  g.fillStyle = INK; g.fillText('torque (dashed) max ' + Tmax.toFixed(1) + ' N·m', px + 8, py + 24);
}

// ---------------------------------------------------------------- labels
const LABELS = [
  ['stator', 'Stator core', 'laminated iron, 6 poles', [-1, -0.6]],
  ['coil', 'Coil', '60 turns, one per pole', [1, -0.4]],
  ['rotor', 'Rotor', '4 iron poles, no winding', [1, 0.7]],
  ['gap', 'Air gap', '0.5 mm', [-1, 0.9]],
  ['shaft', 'Shaft', 'Ø16 steel', [1, -0.2]],
  ['disc', 'Position disc', '3 sensors choose the phase', [-1, 0.2]],
  ['housing', 'Housing', 'shell and end bells', [-1, 0.5]],
];
const lbEl = $('#labels');
const lbNodes = LABELS.map(([k, a, b]) => { const d = document.createElement('div'); d.className = 'lb'; d.innerHTML = `<b>${a}</b><span>${b}</span><svg><line/></svg>`; lbEl.appendChild(d); return d; });
const tmp = new THREE.Vector3();
function drawLabels(alpha) {
  lbEl.style.opacity = alpha; lbEl.style.visibility = alpha < 0.02 ? 'hidden' : 'visible';
  if (alpha < 0.02) return;
  const cx = W / 2, items = [], wide = innerWidth > 860;
  LABELS.forEach(([k], i) => {
    const d = lbNodes[i]; d.style.display = 'none';
    if ((k === 'housing' && !view.housing) || (k === 'coil' && !view.coils)) return;
    motor.anchors[k].getWorldPosition(tmp); tmp.project(camera);
    const sx = (tmp.x * 0.5 + 0.5) * W, sy = (-tmp.y * 0.5 + 0.5) * H;
    if (tmp.z > 1 || sx < 0 || sx > W || sy < 0 || sy > H) return;
    items.push({d, sx, sy, left: sx < cx, y: sy});
  });
  for (const left of [true, false]) {
    const side = items.filter((q) => q.left === left).sort((a, b) => a.y - b.y);
    for (let j = 1; j < side.length; j++) side[j].y = Math.max(side[j].y, side[j - 1].y + 50);
    for (let j = side.length - 2; j >= 0; j--) if (side[j].y > H - 30 - (side.length - 1 - j) * 50) side[j].y = H - 30 - (side.length - 1 - j) * 50;
  }
  items.forEach((q) => {
    const lo = wide ? 316 : 8, hi = wide ? W - 372 : W - 8;
    let bx = q.left ? Math.min(q.sx - 90, W * 0.5 - 150) : Math.max(q.sx + 90, W * 0.5 + 150); bx = q.left ? clamp(bx, lo + 150, hi) : clamp(bx, lo, hi - 190);
    const by = clamp(q.y, 24, H - 24), d = q.d;
    d.style.display = 'block';
    d.style.transform = `translate(${bx}px,${by}px) translate(${q.left ? '-100%' : '0'},-50%)`;
    const svg = $('svg', d), ln = $('line', d), ex = bx;
    svg.style.cssText = `position:absolute;left:${q.left ? '100%' : '0'};top:50%;overflow:visible;width:1px;height:1px`;
    ln.setAttribute('x1', 0); ln.setAttribute('y1', 0); ln.setAttribute('x2', q.sx - ex); ln.setAttribute('y2', q.sy - by);
  });
}

// ---------------------------------------------------------------- frame
fit(); sync(); startTour();
let last = performance.now(), frameNo = 0;
function readouts() {
  const s = sim.s, rpm = sim.rpm();
  $('#rRpm').textContent = Math.round(rpm); $('#rT').textContent = s.Tavg.toFixed(2); $('#rP').textContent = Math.round(Math.max(0, s.Tavg * s.w));
  $('#rF').textContent = Math.round(Math.abs(rpm) * M.Nr / 60);
  bars.querySelectorAll('div').forEach((d, k) => { $('s', d).style.width = clamp(s.i[k] / M.Imax, 0, 1) * 100 + '%'; $('b', d).textContent = s.i[k].toFixed(1) + ' A'; d.classList.toggle('on', s.on[k]); });
}
function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt; frameNo++;
  if (AP.on) { const c = (T - AP.t0) % DURATION; if (c < tourIdx * 0 && false) return; tourStep(c); if (c < 0.05 && tourIdx !== 0) tourIdx = -1; }
  else if (T - lastInput > IDLE) startTour();
  // simulate
  if (!paused) {
    const sd = dt * slow, n = Math.max(1, Math.ceil(sd / 4e-5)), h = sd / n;
    for (let i = 0; i < n; i++) sim.step(h, ctl);
    pushHist(sd, sim.s);
    flow = (flow + dt * 1.6 * Math.min(1, Math.max(Math.max(...sim.s.i) / 4, 0))) % 1;
  }
  // eased toggles
  const k = 1 - Math.exp(-dt / 0.35);
  ease.explode += ((view.explode ? 1 : 0) - ease.explode) * k;
  ease.labels += ((view.labels ? 1 : 0) - ease.labels) * (1 - Math.exp(-dt / 0.25));
  const s = sim.s, Ls = sim.L();
  const psi = [0, 1, 2].map((q) => Ls[q] * s.i[q]);
  motor.update({th: s.th, i: s.i, on: s.on, psi, flow}, {explode: ease.explode, coils: view.coils, flux: view.flux, housing: view.housing});
  // camera
  const V = VIEWS[viewName], tgt = {az: V.az + off.az, el: clamp(V.el + off.el, -60, 88), d: V.d * off.k * (1 + ease.explode * 0.55), t: [V.t[0], V.t[1], V.t[2] + ease.explode * 0.35]};
  const kk = 1 - Math.exp(-dt / (AP.on ? 0.3 : 0.4));
  cam.az += wrapA(tgt.az - cam.az) * kk; cam.el += (tgt.el - cam.el) * kk; cam.d += (tgt.d - cam.d) * kk;
  for (let q = 0; q < 3; q++) cam.t[q] += (tgt.t[q] - cam.t[q]) * kk;
  // phones: pull the camera back so the whole motor fits a tall canvas
  const fitK = camera.aspect < 1 ? 1 + (1 - camera.aspect) * 0.9 : 1;
  const az = cam.az * D2R, el = cam.el * D2R, d = cam.d * fitK;
  camera.position.set(cam.t[0] + d * Math.cos(el) * Math.sin(az), cam.t[1] + d * Math.sin(el), cam.t[2] + d * Math.cos(el) * Math.cos(az));
  camera.lookAt(cam.t[0], cam.t[1], cam.t[2]);
  renderer.render(scene, camera);
  drawLabels(ease.labels);
  if (frameNo % 2 === 0) { readouts(); drawL(s.th); drawW(); }
  if (tourChip.dataset.on !== String(AP.on)) { tourChip.dataset.on = String(AP.on); tourChip.classList.add('tour'); tourChip.classList.toggle('on', AP.on); tourChip.innerHTML = AP.on ? '<i></i>Auto tour · click to take over' : '▶ Resume tour'; }
  if (!window.SIM_SHOWN) { window.SIM_SHOWN = true; dispatchEvent(new Event('simframe')); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.LIVE = {sim, ctl, view, motor, get T() { return T; }, takeOver, setView, camera};
void dLdth; void STEP;
