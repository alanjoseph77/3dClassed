// The maths of a 6/4 three-phase switched reluctance motor. No three.js in here: every pose, gauge and chart on the
// page reads these functions, so the picture cannot disagree with the numbers.
//
// Geometry (mm): 6 stator poles with a coil each (opposite poles share a phase), 4 salient rotor poles of plain
// laminated iron, no magnets and no windings on the rotor. Torque is made only where inductance changes with angle:
//   T = 1/2 * i^2 * dL/dtheta      (linear magnetics; saturation left out)
export const MOTOR = {
  Ns: 6, Nr: 4, phases: 3,
  Ro: 64, Ry: 50, Rb: 30, Rr: 29.5, hub: 15, shaft: 8, stack: 50, wt: 6, shoulder: 33.5, rotorW: 8, // stator OD/yoke/bore, rotor OD, hub, shaft, stack length, tooth half-width
  bs: 30, br: 32,            // stator / rotor pole arcs, degrees
  gap: 0.5,                  // mm
  turns: 60,
  Lu: 4e-3, La: 28e-3,       // unaligned / aligned phase inductance, henry
  Imax: 10,                  // A
  J: 6e-4, B: 2e-3,          // rotor inertia kg m2, friction N m s/rad
  tauUp: 2.5e-3, tauDown: 1.0e-3,
};
export const PHASES = ['A', 'B', 'C'];
export const STEP = 360 / (MOTOR.Nr * MOTOR.phases);        // 30 degrees
export const PERIOD = 360 / MOTOR.Nr;                        // 90 degrees: the rotor looks the same
export const POLE = [0, 60, 120];                            // stator pole angle of each phase (its partner is +180)
export const ALIGN = [0, 60, 30];                            // rotor angle that lines a rotor pole up with that phase (mod 90)
// Turning counter-clockwise (+theta) the phases line up in the order A (0) -> C (30) -> B (60).
export const NEXT = [2, 0, 1];                               // phase to fire after A, B, C (counter-clockwise)
export const D2R = Math.PI / 180;

const X0 = (MOTOR.br - MOTOR.bs) / 2;                        // 1 deg: full pole overlap while |phi| <= X0
const X1 = (MOTOR.br + MOTOR.bs) / 2;                        // 31 deg: no overlap beyond
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const wrap90 = (d) => ((((d + 45) % 90) + 90) % 90) - 45;
export const phiOf = (thDeg, k) => wrap90(thDeg - ALIGN[k]);  // rotor angle seen from phase k's aligned position

// Phase inductance against the angle phi from alignment (degrees): a flat top while the poles face each other,
// a ramp while they overlap less and less, flat at Lu when they do not overlap.
export function Lph(phiDeg) {
  const x = Math.abs(phiDeg);
  const lin = Math.min(1, Math.max(0, (X1 - x) / (X1 - X0)));
  const h = 0.55 * lin + 0.45 * (1 - sm(X0, X1, x));
  return MOTOR.Lu + (MOTOR.La - MOTOR.Lu) * h;
}
export function dLdth(phiDeg) { // henry per radian
  const e = 0.05;
  return (Lph(phiDeg + e) - Lph(phiDeg - e)) / (2 * e * D2R);
}

export function createSim() {
  const s = {t: 0, th: -4 * D2R, w: 0, i: [0, 0, 0], Iint: 0, T: 0, Tavg: 0, want: [0, 0, 0], Iset: 0, on: [false, false, false]};
  const KP = 0.35, KI = 70;
  // c: {mode:'run'|'step', rpm, load, dir (+1 ccw | -1 cw), adv (deg), I (A), on:[b,b,b]}
  function step(h, c) {
    const thDeg = s.th / D2R;
    const want = [0, 0, 0];
    let Iset = 0;
    if (c.mode === 'run') {
      const err = (c.rpm * 2 * Math.PI) / 60 - s.w * c.dir;
      s.Iint = Math.min(MOTOR.Imax, Math.max(0, s.Iint + KI * err * h));
      Iset = Math.min(MOTOR.Imax, Math.max(0, KP * err + s.Iint));
      let n = 0;
      const act = [0, 1, 2].map((k) => { const p = phiOf(thDeg, k) * c.dir; const a = p >= -29 - c.adv && p < -3 - c.adv; if (a) n++; return a; });
      if (!n && Iset > 0.01) { // between two windows: fire the phase that pulls hardest the way we are going
        let best = 0, bv = -1e9;
        for (let k = 0; k < 3; k++) { const v = dLdth(phiOf(thDeg, k)) * c.dir; if (v > bv) { bv = v; best = k; } }
        act[best] = true;
      }
      for (let k = 0; k < 3; k++) want[k] = act[k] ? Iset : 0;
    } else {
      Iset = c.I;
      for (let k = 0; k < 3; k++) want[k] = c.on[k] ? c.I : 0;
    }
    let T = 0;
    for (let k = 0; k < 3; k++) {
      const tau = want[k] > s.i[k] ? MOTOR.tauUp : MOTOR.tauDown;
      s.i[k] += (want[k] - s.i[k]) * (1 - Math.exp(-h / tau));
      T += 0.5 * s.i[k] * s.i[k] * dLdth(phiOf(thDeg, k));
    }
    const load = c.mode === 'run' ? c.load * Math.tanh(s.w / 2) : 0;
    s.w += ((T - MOTOR.B * s.w - load) / MOTOR.J) * h;
    s.th += s.w * h;
    s.t += h;
    s.T = T;
    s.Tavg += (T - s.Tavg) * Math.min(1, h / 5e-3);
    s.want = want; s.Iset = Iset; s.on = want.map((v) => v > 0.05);
  }
  const L = () => [0, 1, 2].map((k) => Lph(phiOf(s.th / D2R, k)));
  const rpm = () => (s.w * 60) / (2 * Math.PI);
  return {s, step, L, rpm};
}
