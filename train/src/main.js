// Loco Pilot: drive an Indian-style electric passenger train on real routes. Sign on in the crew lobby, take your
// duty, obey signals and speed limits, stop at every platform's STOP board and finish your duty on time.
import { THREE } from './kit.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { ROUTES, SCALE, TIME_X } from './data.js';
import { buildLoco, buildCoach, spinning, WR } from './rolling.js';
import { makeWorld, TRACK2 as TRACK2_ } from './world.js';
import LAND from './land.json';

const $ = (id) => document.getElementById(id);
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.75;
const scene = new THREE.Scene(); scene.fog = new THREE.Fog('#c9d6df', 260, 1300);
const camera = new THREE.PerspectiveCamera(50, 1, 0.2, 3000);
const sky = new Sky(); sky.scale.setScalar(450000);
const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(58), THREE.MathUtils.degToRad(200));
Object.assign(sky.material.uniforms, { turbidity: { value: 4 }, rayleigh: { value: 1.2 }, mieCoefficient: { value: 0.005 }, mieDirectionalG: { value: 0.8 } }); sky.material.uniforms.sunPosition.value.copy(sunDir);
scene.add(sky);
{ const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene(); const s2 = new Sky(); s2.scale.setScalar(450000); s2.material.uniforms.sunPosition.value.copy(sunDir); es.add(s2); scene.environment = pm.fromScene(es, 0.02).texture; scene.environmentIntensity = 0.8; pm.dispose(); }
const sun = new THREE.DirectionalLight('#fff0d8', 3.0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 60, bottom: -60, near: 1, far: 400 }); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target, new THREE.HemisphereLight('#d6e4f2', '#7a7a55', 0.6));
const grass = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#76904a'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 6000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(50,80,30,.35)' : 'rgba(170,180,100,.3)'; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 4 + Math.random() * 4); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(300, 300); t.anisotropy = 8; return t; })();
const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ map: grass, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.58; ground.receiveShadow = true; scene.add(ground);

// ---- sound (made in the browser: horn, traction hum, wheel beat) ----
let ac = null, muted = false, hum = null;
function audio() { if (ac) return ac; try { ac = new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), gn = ac.createGain(), lp = ac.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = 50; lp.type = 'lowpass'; lp.frequency.value = 300; gn.gain.value = 0; o.connect(lp).connect(gn).connect(ac.destination); o.start(); hum = { o, gn }; } catch (e) { ac = null; } return ac; }
function horn(len = 0.9) { if (!audio() || muted) return; const t = ac.currentTime, out = ac.createGain(); out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.16, t + 0.05); out.gain.setValueAtTime(0.16, t + len); out.gain.linearRampToValueAtTime(0, t + len + 0.25); const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; out.connect(ac.destination); lp.connect(out); for (const f of [311, 370]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(t); o.stop(t + len + 0.3); } }
function clack() { if (!ac || muted) return; const t = ac.currentTime, b = ac.createBuffer(1, 2200, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 300); const s = ac.createBufferSource(), gn = ac.createGain(); gn.gain.value = 0.06; s.buffer = b; s.connect(gn).connect(ac.destination); s.start(t); }

// ---- game state ----
const PILOT_KEY = 'locopilot.name';
let pilot = 'Ravi Kumar'; try { pilot = localStorage.getItem(PILOT_KEY) || pilot; } catch (e) { /* storage blocked */ }
let W = null, route = null, train = null, cars = [], sF = 0, v = 0, notch = 0, mode = 'lobby', camMode = 'chase', clock = 0, nextIdx = 1, dwell = 0, halted = false, elapsed = 0;
let score = null, overT = 0, lastClack = 0, msgT = 0, report = [], departed = false;
const CAMS = ['chase', 'cab', 'side'];
const fmt = (sec) => { sec = ((sec % 86400) + 86400) % 86400; const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); };
const parseT = (t) => { const [h, m] = t.split(':').map(Number); return h * 3600 + m * 60; };
const say = (t, ms = 3000) => { const m = $('msg'); m.textContent = t; m.classList.add('on'); clearTimeout(msgT); msgT = setTimeout(() => m.classList.remove('on'), ms); };

function startDuty(r) {
  route = r; if (W) { /* remove the previous world */ scene.children.filter((o) => o.userData && o.userData.world).forEach((o) => scene.remove(o)); }
  for (const o of [...scene.children]) if (o.type === 'Group' && o !== sun.target) scene.remove(o);
  spinning.length = 0;
  W = makeWorld(scene, r, SCALE);
  train = new THREE.Group(); scene.add(train); cars = [];
  const loco = buildLoco(r.loco); train.add(loco); cars.push({ obj: loco, off: -loco.userData.length / 2 });
  let off = -loco.userData.length - 0.9; const labels = ['B1', 'B2', 'B3', 'A1', 'H1'];
  labels.forEach((lb, i) => { const c = buildCoach(lb, i === labels.length - 1); train.add(c); cars.push({ obj: c, off: off - c.userData.length / 2 }); off -= c.userData.length + 0.9; });
  train.userData.len = -off;
  sF = W.stations[0].s; v = 0; notch = 0; nextIdx = 1; halted = true; dwell = 5 * 60 / TIME_X; departed = false; elapsed = 0;
  score = { pts: 100, over: 0, spad: 0, notes: [] }; report = [];
  const tt = timetable(r); W.tt = tt; clock = tt[0].dep - 5 * 60;
  W.stations.forEach((st, i) => { W.setAspect(st, 'home', i === 0 ? 'green' : 'amber'); W.setAspect(st, 'starter', 'red'); });
  mode = 'drive'; document.body.classList.add('driving'); camMode = 'chase'; $('lobby').hidden = true; $('slip').hidden = true; $('report').hidden = true; $('hud').hidden = false; $('ctl').hidden = false;
  say('Duty ' + r.train + ' ' + r.trainName + ': wait for the green signal, then notch up', 4500);
}
function limitAt(s, w = W) {
  if (!w) return { lim: 110, why: 'Line speed' }; let lim = 110, why = 'Line speed';
  const z = w.zones.find((z) => s >= z.s0 - 60 && s <= z.s1 + 145); if (z) { lim = 60; why = 'Track work'; }
  for (const st of w.stations) { if (s > st.s - 440 && s <= st.s - 150 && lim > 60) { lim = 60; why = 'Station approach'; } if (s > st.s - 150 && s < st.s + 40 && lim > 30) { lim = 30; why = 'Platform'; } if (s >= st.s + 40 && s < st.s + 140 && lim > 45) { lim = 45; why = 'Leaving station'; } }
  return { lim, why };
}
// The timetable comes from an ideal run with the game's own physics and limits, plus 4 % recovery time and 4 minutes at each halt
function timetable(r) {
  const w = r === route && W ? W : makeWorld(new THREE.Scene(), r, SCALE), S = w.stations, out = [{ arr: null, dep: parseT(r.start) }];
  let t = parseT(r.start); const B = 0.75;
  for (let i = 1; i < S.length; i++) { const a = S[i - 1].s, b = S[i].s, n = Math.ceil(b - a), vmax = new Float32Array(n + 1);
    for (let k = 0; k <= n; k++) vmax[k] = limitAt(a + k, w).lim / 3.6;
    vmax[n] = 0; for (let k = n - 1; k >= 0; k--) vmax[k] = Math.min(vmax[k], Math.sqrt(vmax[k + 1] ** 2 + 2 * B));
    let v0 = 0, time = 0; for (let k = 0; k < n; k++) { const acc = Math.min(0.62, 10 / (v0 + 2)) - 0.008 - 0.000035 * v0 * v0; const v2 = Math.min(Math.sqrt(Math.max(0, v0 * v0 + 2 * acc)), vmax[k + 1]); time += 1 / Math.max(0.5, (v0 + v2) / 2); v0 = v2; }
    t += time * TIME_X * 1.04; const arr = Math.round(t / 60) * 60, dep = i === S.length - 1 ? null : arr + 4 * 60; out.push({ arr, dep }); t = dep || arr; }
  return out;
}

// ---- driving ----
function physics(dt) {
  const st = W.stations[nextIdx], prev = W.stations[nextIdx - 1];
  if (halted) { v = 0; if (dwell > 0) { dwell -= dt; if (dwell <= 0) { const cur = W.stations[nextIdx - 1]; if (nextIdx - 1 < W.stations.length - 1 || !departed) { W.setAspect(cur, 'starter', 'green'); say(departed ? 'Guard: right away! Starter is green.' : 'Starter signal is green: notch up and depart', 3500); horn(0.5); } } } }
  let a = 0; const vv = Math.max(v, 0.1);
  if (notch > 0 && !(halted && (prev && prev.aspect === 'red'))) a = (notch / 8) * Math.min(0.62, 10 / (vv + 2));
  if (notch < 0) a = notch <= -7 ? -1.6 : (notch / 6) * 1.05;
  a -= 0.008 + 0.000035 * v * v;
  if (halted && notch > 0 && prev && prev.aspect === 'green') { halted = false; departed = true; say('Departed ' + prev.en, 2200); }
  if (halted) return;
  v = Math.max(0, v + a * dt); sF += v * dt;
  // passing a red starter = signal passed at danger
  if (prev && sF > prev.s + 32 && sF - v * dt <= prev.s + 32 && prev.aspect !== 'green') { notch = -7; score.spad++; score.pts -= 30; score.notes.push('Passed the starter at ' + prev.code + ' at danger'); say('SPAD! You passed a red signal: emergency brake', 5000); }
  if (st && sF > st.s + 32 && sF - v * dt <= st.s + 32 && st.aspect !== 'green') { notch = -7; score.spad++; score.pts -= 30; score.notes.push('Passed the starter at ' + st.code + ' at danger'); say('SPAD! You ran past the STOP board and a red signal: emergency brake', 5000); }
  if (st && v < 0.05 && notch <= 0 && sF - st.s < -45 && sF - st.s > -400 && !physics.hinted) { physics.hinted = true; say('Pull up to the STOP board: ' + Math.round(st.s - sF) + ' m to go', 2500); }
  if (st && sF > st.s - 560 && sF - v * dt <= st.s - 560) { say('Home signal ' + st.code + ': caution, prepare to stop at ' + st.en, 3500); }
  // speed limit
  const { lim } = limitAt(sF); if (v * 3.6 > lim + 5) { overT += dt; if (overT > 1.5) { overT = 0; score.over++; score.pts -= 2; say('Over speed! Limit ' + lim + ' km/h', 1800); } } else overT = Math.max(0, overT - dt);
  // stopping at the next station
  if (st && v < 0.05 && notch <= 0 && sF - st.s > -45) {
    physics.hinted = false;
    const err = sF - st.s; halted = true; v = 0; notch = 0;
    let note = 'Perfect stop'; if (err > 45) { note = 'Overshot (passed signal)'; } else if (Math.abs(err) > 15) { score.pts -= 5; note = err > 0 ? 'Overshot the stop board' : 'Stopped short'; } else if (Math.abs(err) > 5) note = 'Good stop';
    const tt = W.tt[nextIdx], delay = Math.round((clock - tt.arr) / 60); if (delay > 5) score.pts -= Math.min(15, delay - 5);
    report.push({ st, err, delay, note, arr: clock });
    say('Arrived ' + st.en + ' (' + Math.abs(err).toFixed(0) + ' m ' + (err >= 0 ? 'past' : 'short of') + ' the board) · ' + note, 3800);
    nextIdx++;
    if (nextIdx >= W.stations.length) { setTimeout(endDuty, 2200); return; }
    dwell = 4 * 60 / TIME_X; W.setAspect(st, 'starter', 'red'); W.setAspect(W.stations[nextIdx], 'home', 'amber');
  }
}
function endDuty() {
  mode = 'report'; document.body.classList.remove('driving'); $('hud').hidden = true; $('ctl').hidden = true; $('cabframe').hidden = true;
  const grade = score.pts >= 90 ? 'Excellent' : score.pts >= 75 ? 'Good' : score.pts >= 55 ? 'Needs practice' : 'Retraining needed';
  const rows = report.map((r) => `<tr><td>${r.st.en} <small>${r.st.code}</small></td><td>${fmt(W.tt[r.st.i].arr)}</td><td>${fmt(r.arr)}</td><td>${r.delay > 0 ? '+' + r.delay : r.delay} min</td><td>${Math.abs(r.err).toFixed(0)} m ${r.err >= 0 ? 'past' : 'short'}</td><td>${r.note}</td></tr>`).join('');
  $('rep').innerHTML = `<h2>Duty complete: ${route.train} ${route.trainName}</h2><p>Loco pilot <b>${esc(pilot)}</b> · ${route.title} · ${route.stations[route.stations.length - 1].km} km</p>
    <div class="grade"><b>${Math.max(0, Math.round(score.pts))}</b><span>${grade}</span></div>
    <table><tr><th>Station</th><th>Due</th><th>Arrived</th><th>Delay</th><th>Stop</th><th></th></tr>${rows}</table>
    <p class="small">Over-speed warnings: ${score.over} · Signals passed at danger: ${score.spad}${score.notes.length ? ' · ' + score.notes.map(esc).join('; ') : ''}</p>`;
  $('report').hidden = false;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---- placing the train on the curve, camera ----
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
function poseTrain(t) {
  for (const c of cars) { const s = sF + c.off; W.at(s, 0, 0, tmp); c.obj.position.copy(tmp); c.obj.rotation.y = -W.heading(s); c.obj.position.y = Math.sin(t * 7 + c.off) * 0.008 * Math.min(1, v / 15); }
  for (const w of spinning) w.rotation.z -= 0; // rotated in the loop
}
let camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), camInit = false;
function placeCamera(dt, t) {
  let p, l;
  if (mode === 'lobby' || mode === 'report') { const s = sF - 40 + Math.sin(t * 0.07) * 40; p = W.at(s + 28, -16, 6.5, tmp); l = W.at(sF - 50, 0, 2.6, tmp2); }
  else if (camMode === 'cab') { p = W.at(sF + 0.35, -0.5, 3.45, tmp); l = W.at(sF + 90, -0.3, 2.0, tmp2); }
  else if (camMode === 'side') { const s = sF + 30; p = W.at(s, TRACK2_ + 4, 3.2, tmp); l = W.at(sF - 30, 0, 2.2, tmp2); }
  else { p = W.at(sF - 30, 7.0, 7.8, tmp); l = W.at(sF + 45, 0, 2.6, tmp2); }
  const k = camInit ? 1 - Math.exp(-dt * (camMode === 'cab' ? 20 : 4)) : 1; camInit = true;
  camPos.lerp(p, k); camLook.lerp(l, k); camera.position.copy(camPos); camera.lookAt(camLook);
  $('cabframe').hidden = !(mode === 'drive' && camMode === 'cab');
}

// ---- HUD and India map ----
const mapCtx = (c) => c.getContext('2d');
function drawMap(c, r, prog = null, all = true) {
  const g = mapCtx(c), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
  const B = { lon0: 67.5, lon1: 97.8, lat0: 6.2, lat1: 36.2 }, k = Math.min(w / (B.lon1 - B.lon0), h / ((B.lat1 - B.lat0) * 1.06)), ox = (w - (B.lon1 - B.lon0) * k) / 2, oy = (h - (B.lat1 - B.lat0) * 1.06 * k) / 2;
  const P = (lon, lat) => [ox + (lon - B.lon0) * k, oy + (B.lat1 - lat) * 1.06 * k];
  g.fillStyle = '#d9e8f2'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f2e8cf'; g.strokeStyle = '#b8a888'; g.lineWidth = 1;
  for (const ring of LAND) { g.beginPath(); ring.forEach(([lon, lat], i) => { const [x, y] = P(lon, lat); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fill(); g.stroke(); }
  const drawR = (rr, hl) => { g.strokeStyle = hl ? '#8b1e24' : 'rgba(80,80,90,.45)'; g.lineWidth = hl ? 4 : 2; g.beginPath(); rr.stations.forEach((s, i) => { const [x, y] = P(s.lon, s.lat); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    rr.stations.forEach((s, i) => { const [x, y] = P(s.lon, s.lat); g.fillStyle = hl ? '#fff' : '#666'; g.strokeStyle = hl ? '#8b1e24' : '#666'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, hl ? 4 : 2.5, 0, 7); g.fill(); g.stroke();
      if (hl && (i === 0 || i === rr.stations.length - 1)) { g.fillStyle = '#222'; g.font = `bold ${Math.max(10, w / 32)}px system-ui`; g.fillText(s.code, x + 6, y - 6); } }); };
  if (all) ROUTES.forEach((rr) => { if (rr !== r) drawR(rr, false); });
  if (r) drawR(r, true);
  if (r && prog != null) { const km = prog, S = r.stations; let i = 0; while (i < S.length - 2 && S[i + 1].km < km) i++; const t = Math.max(0, Math.min(1, (km - S[i].km) / (S[i + 1].km - S[i].km))); const [x0, y0] = P(S[i].lon, S[i].lat), [x1, y1] = P(S[i + 1].lon, S[i + 1].lat); const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; g.fillStyle = '#f2c12e'; g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,.45)'; g.font = `${Math.max(9, w / 40)}px system-ui`; g.fillText('Land outline only (no borders) · Natural Earth', 6, h - 6);
}
function hud() {
  const st = W.stations[Math.min(nextIdx, W.stations.length - 1)], kmLeft = Math.max(0, (st.s - sF) / SCALE), { lim, why } = limitAt(sF), kmh = v * 3.6;
  $('h-train').textContent = route.train + ' ' + route.trainName; $('h-pilot').textContent = 'LP ' + pilot;
  $('h-next').textContent = st.en + ' (' + st.code + ')'; $('h-dist').textContent = kmLeft < 1 ? Math.round(kmLeft * 1000 / SCALE * SCALE) + ' m' : kmLeft.toFixed(1) + ' km';
  $('h-clock').textContent = fmt(clock); const due = W.tt[st.i].arr; $('h-due').textContent = due ? 'due ' + fmt(due) + (clock > due ? ' (late ' + Math.round((clock - due) / 60) + ' min)' : '') : '';
  $('spd').textContent = Math.round(kmh); $('lim').textContent = lim; $('limwhy').textContent = why; $('spdbar').style.width = Math.min(100, kmh / 130 * 100) + '%'; $('spdbar').style.background = kmh > lim + 5 ? '#e74c3c' : kmh > lim ? '#f2c12e' : '#4caf50';
  $('notch').textContent = notch > 0 ? 'Power ' + notch : notch === 0 ? 'Coast (0)' : notch <= -7 ? 'EMERGENCY' : 'Brake ' + -notch;
  $('notch').className = notch > 0 ? 'p' : notch < 0 ? 'b' : '';
  const prev = W.stations[nextIdx - 1], sig = halted ? prev && prev.aspect : (sF < st.s - 560 ? st.homeAspect : st.aspect);
  $('sig').className = 'sig ' + (sig || 'red'); $('sigtxt').textContent = halted ? 'Starter' : sF < st.s - 560 ? 'Home' : 'Starter';
  $('halt').textContent = halted && dwell > 0 ? 'Doors open · boarding ' + Math.ceil(dwell * TIME_X / 60) + ' min' : '';
  const km = (sF - W.stations[0].s) / SCALE; drawMap($('mini'), route, km, false);
}

// ---- input ----
const setNotch = (n) => { notch = Math.max(-7, Math.min(8, n)); audio(); };
addEventListener('keydown', (e) => { if (mode !== 'drive' || /input/i.test(e.target.tagName)) return;
  if (e.code === 'ArrowUp' || e.code === 'KeyW') setNotch(notch < -6 ? -6 : notch + 1); else if (e.code === 'ArrowDown' || e.code === 'KeyS') setNotch(notch - 1 < -6 ? -6 : notch - 1);
  else if (e.code === 'Space' || e.code === 'KeyH') horn(); else if (e.code === 'KeyE') setNotch(-7); else if (e.code === 'KeyC') cycleCam(); else if (e.code === 'Digit0') setNotch(0); else return; e.preventDefault(); });
const cycleCam = () => { camMode = CAMS[(CAMS.indexOf(camMode) + 1) % CAMS.length]; $('cam').textContent = 'View: ' + camMode; camInit = false; };
$('up').addEventListener('click', () => setNotch(notch < -6 ? -6 : notch + 1)); $('dn').addEventListener('click', () => setNotch(Math.max(-6, notch - 1)));
$('zero').addEventListener('click', () => setNotch(0)); $('eb').addEventListener('click', () => setNotch(-7)); $('hornb').addEventListener('click', () => horn()); $('cam').addEventListener('click', cycleCam);
$('mute').addEventListener('click', () => { muted = !muted; $('mute').textContent = muted ? 'Sound off' : 'Sound on'; });
$('quit').addEventListener('click', () => { if (confirm('Leave this duty and go back to the crew lobby?')) showLobby(); });

// ---- lobby, duty slip, report ----
function showLobby() { mode = 'lobby'; document.body.classList.remove('driving'); $('hud').hidden = true; $('ctl').hidden = true; $('report').hidden = true; $('slip').hidden = true; $('lobby').hidden = false; $('cabframe').hidden = true;
  $('pname').value = pilot; const list = $('duties'); list.innerHTML = '';
  ROUTES.forEach((r) => { const S = r.stations, km = S[S.length - 1].km, mins = Math.round((km * SCALE / 24 + (S.length - 1) * 8) / 60); const b = document.createElement('button'); b.className = 'duty';
    b.innerHTML = `<b>${r.train} ${r.trainName}</b><span>${S[0].en} → ${S[S.length - 1].en}</span><small>${km} km · ${S.length} stations · about ${mins} min to drive</small>`; b.addEventListener('click', () => showSlip(r)); list.appendChild(b); });
  drawMap($('lobbymap'), null, null, true);
}
function showSlip(r) {
  pilot = ($('pname').value || 'Loco Pilot').slice(0, 28); try { localStorage.setItem(PILOT_KEY, pilot); } catch (e) { /* ignore */ }
  const tt = timetable(r); $('lobby').hidden = true; $('slip').hidden = false;
  $('slipbody').innerHTML = `<h2>Duty slip</h2><p><b>LP ${esc(pilot)}</b> · Train <b>${r.train} ${r.trainName}</b> · Loco <b>${r.loco}</b> · Sign on ${fmt(tt[0].dep - 30 * 60)} at ${r.stations[0].en}</p>
    <table><tr><th>Station</th><th>Code</th><th>km</th><th>Arr</th><th>Dep</th></tr>${r.stations.map((s, i) => `<tr><td>${s.en}<br><small class="hi">${s.hi}</small></td><td>${s.code}</td><td>${s.km}</td><td>${tt[i].arr ? fmt(tt[i].arr) : '-'}</td><td>${tt[i].dep ? fmt(tt[i].dep) : '-'}</td></tr>`).join('')}</table>
    <ul class="rules"><li>Wait for the <b>green starter signal</b>, then notch up (↑ or W).</li><li>Obey speed boards: line 110, approach 60, platform 30 km/h.</li><li>A <b>yellow home signal</b> means stop at the next platform: brake (↓ or S) and stop at the <b>STOP board</b>.</li><li>Never pass a red signal. Horn: H or Space. Camera: C. Emergency brake: E.</li></ul>`;
  drawMap($('slipmap'), r, null, true); $('signon').onclick = () => { audio(); startDuty(r); };
}
// ---- full screen (and landscape where the browser allows it) ----
const fsEl = document.documentElement, fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
const fsLabel = () => { $('fs').textContent = fsOn() ? '✕ Exit full screen' : '⛶ Full screen'; };
$('fs').addEventListener('click', async () => {
  try {
    if (fsOn()) { await (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    const req = fsEl.requestFullscreen || fsEl.webkitRequestFullscreen;
    if (!req) { say('This browser has no full-screen mode. On iPhone, use Share > Add to Home Screen.', 4500); return; }
    await req.call(fsEl, { navigationUI: 'hide' });
    if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
  } catch (e) { say('Full screen was blocked by the browser', 3000); }
});
for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(ev, () => { fsLabel(); setTimeout(fit, 60); });
$('portraitok').addEventListener('click', () => document.body.classList.add('portrait-ok'));
$('back').addEventListener('click', showLobby); $('again').addEventListener('click', showLobby);

// ---- loop ----
function fit() { const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.fov = camera.aspect < 1 ? 70 : 50; camera.updateProjectionMatrix(); }
addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 120)); fit();
startDuty(ROUTES[0]); mode = 'lobby'; $('hud').hidden = true; $('ctl').hidden = true; showLobby();
let last = performance.now(), t = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
  if (mode === 'drive') { physics(dt); clock += dt * TIME_X; elapsed += dt; }
  for (const w of spinning) w.rotation.z -= v * dt / WR;
  W.update(sF); poseTrain(t); placeCamera(dt, t);
  const lead = W.at(sF, 0, 0, tmp); sun.position.copy(lead).addScaledVector(sunDir, 200); sun.target.position.copy(lead); ground.position.set(Math.round(camera.position.x / 10) * 10, -0.58, Math.round(camera.position.z / 10) * 10); grass.offset.set(ground.position.x / 10, -ground.position.z / 10);
  const loco = cars[0].obj; const night = false; void night; loco.userData.spot.intensity = mode === 'drive' ? 300 : 0;
  if (hum) { hum.o.frequency.value = 40 + v * 3 + Math.max(0, notch) * 6; hum.gn.gain.value = muted || mode !== 'drive' ? 0 : 0.015 + Math.max(0, notch) * 0.004; }
  if (mode === 'drive' && v > 1 && sF - lastClack > 25) { lastClack = sF; clack(); }
  if (mode === 'drive') hud();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.GAME = { limit: (s) => limitAt(s).lim, sim: (secs, driver) => { for (let i = 0; i < secs / 0.05; i++) { if (driver) driver(); if (mode !== 'drive') break; physics(0.05); clock += 0.05 * TIME_X; } }, get s() { return sF; }, get v() { return v; }, get notch() { return notch; }, setNotch, get W() { return W; }, get mode() { return mode; }, get halted() { return halted; }, get nextIdx() { return nextIdx; }, get score() { return score; }, startDuty, ROUTES, cycleCam, place: (s) => { sF = s; camInit = false; }, setV: (x) => { v = x; }, endDuty };
