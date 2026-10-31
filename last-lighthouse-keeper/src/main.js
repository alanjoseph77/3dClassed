// The Last Lighthouse Keeper: one timeline (timeline.json from tools/timeline.py) drives picture, subtitles and mix.
// Vertical frame (size from the viewport, e.g. --size 1080x1920). ?nosub=1 hides subtitles. ?ssaa=N supersampling (default 1).
import * as THREE from 'three';
import { Pipe } from './post.js';
import { dispose } from './stage.js';
import { ss, seg, clamp } from './lib.js';
import { world, room, TITLE_BOX } from './scenes.js';

const Q = new URLSearchParams(location.search), SSAA = +(Q.get('ssaa') || 1);
const TL = await (await fetch('timeline.json')).json();
window.DUR = TL.DUR;
const W = innerWidth, H = innerHeight;
const BUILD = { W1: world, ROOM: room, W2: world };
const TR = { cut: { type: 'cut', dur: 0 }, dissolve: { type: 'dissolve', dur: .8 } };
const plan = TL.SHOTS.map(([id, start, tr]) => ({ id, start, in: TR[tr] || TR.cut }));
plan.forEach((s, i) => { s.end = i + 1 < plan.length ? plan[i + 1].start : TL.DUR; });

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(SSAA); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
const pipe = new Pipe(renderer, W, H, SSAA);
await Promise.all([document.fonts.load("46px 'IM Fell English'", 'Tonight'), document.fonts.load("700 40px 'IM Fell English'", 'KEEPER')]);

const live = new Map();
function get(i) { if (!live.has(i)) live.set(i, BUILD[plan[i].id]({ TL, H: TL.HIT, id: plan[i].id, aspect: W / H })); return live.get(i); }
function gc(keep) { for (const [i, s] of live) if (!keep.includes(i)) { dispose(s.S.scene); live.delete(i); } }
function draw(i, t, target) { const s = get(i); s.update(t); pipe.shot(s.S.scene, s.S.cam, s.post(), target); return s.grade(); }

const sub = document.getElementById('sub'), en = sub.querySelector('.en');
function R(t) {
  let i = plan.findIndex(p => t >= p.start && t < p.end); if (i < 0) i = plan.length - 1;
  const p = plan[i], tl = t - p.start;
  let g, mixB = 0;
  if (i > 0 && p.in.type !== 'cut' && tl < p.in.dur) { draw(i - 1, t, pipe.rtA); g = draw(i, t, pipe.rtB); mixB = ss(tl / p.in.dur); gc([i - 1, i]); }
  else { g = draw(i, t, pipe.rtA); gc([i]); }
  pipe.final({ ...g, mixB, fade: (g.fade ?? 1) * ss(clamp(t / .6)) });
  let c = null, a = 0;
  for (const q of TL.cues) if (t > q.t0 && t < q.t1) { c = q; a = Math.min(ss(seg(t, q.t0, q.t0 + .2)), 1 - ss(seg(t, q.t1 - .22, q.t1))); }
  en.textContent = c ? c.text : ''; sub.style.opacity = Q.has('nosub') ? 0 : a;
}
window.render = t => R(t);
// every on-screen text (the paper title) for readcheck; subtitles are checked from the .srt
window.TEXTS = t => (t >= TL.HIT.title + .9 ? [{ id: 'title', text: 'THE LAST LIGHTHOUSE KEEPER', ...TITLE_BOX(W, H) }] : []);
// sound and cue events for the mixer
const EV = [{ t: TL.HIT.door, type: 'door' }, ...TL.HIT.windows.map(t => ({ t, type: 'step' })), { t: TL.HIT.wipe, type: 'wipe' },
  { t: TL.HIT.raise, type: 'cloth' }, { t: TL.HIT.light, type: 'flare' }, { t: TL.HIT.turn, type: 'clock' }, { t: TL.HIT.horn, type: 'horn' },
  ...TL.HIT.morse.map(([a, b]) => ({ t: a, type: 'morse', d: +(b - a).toFixed(3) })), { t: TL.HIT.title, type: 'strip' }, { t: 22.0, type: 'dissolve' }];
window.EV = EV;
window.READY = true;
