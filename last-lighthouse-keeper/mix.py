"""The Last Lighthouse Keeper: score + foley + narration from timeline.json → out/mix.wav (48 kHz stereo).
Run with the library's .venv python:  "$LIB/.venv/bin/python" mix.py
Score: physically modelled harp / kalimba / music box (core/audio/pluck.py) + synthesised celesta, string pad and ship horn.
No sample libraries, no downloads."""
import sys, os, json
import numpy as np, soundfile as sf, soxr
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or '/root/lemo-opuscar'
sys.path.insert(0, LIB)
from core.audio import pluck as P
from core.audio.sfx import SR, add, bp, lp, hp, noise, brown, norm, t_, env_exp, whoosh, thump, creak, step, ignite, limit, compress

TL = json.load(open(os.path.join(HERE, 'timeline.json')))
H, DUR = TL['HIT'], TL['DUR']
N = int((DUR + 1) * SR)
tt = np.arange(N) / SR
rng = np.random.default_rng(3)
db = lambda x: 10 ** (x / 20)
rms = lambda x: np.sqrt(np.mean(x ** 2) + 1e-12)
envl = lambda pts: np.interp(tt, *zip(*pts))
hz = lambda p: 440 * 2 ** ((P.midi(p) - 69) / 12)
music, foley, amb = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))

B = 60 / 72; E8 = B / 2                      # beat, eighth
def harp(t, p, v=.5, pan=-.2, d=3.0): add(music, P.pluck('harp', p, d, vel=v), t, .55, pan)
def kal(t, p, v=.5, pan=0): add(music, P.pluck('kalimba', p, 2.2, vel=v), t, .32, pan)
def mbox(t, p, v=.5, pan=.25): add(music, P.pluck('music_box', p, 2.6, vel=v), t, .42, pan)
def celesta(t, p, v=.5, pan=0, d=3.0):
    f, x = hz(p), t_(d); s = sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x * (1.6 + m * .9)) for m, a in [(1, 1), (2, .35), (3, .12), (4.2, .08)])
    s *= np.minimum(1, x / .004); add(music, s * v * .5, t, 1, pan)
def pad(t, pitches, d, v=.18, att=1.2, rel=1.5, pan=0):
    x = t_(d + rel); s = np.zeros_like(x)
    for p in pitches:
        f = hz(p)
        for det in (-.004, 0, .005):   # three detuned saws → a soft string section
            ph = 2 * np.pi * f * (1 + det) * x; s += (2 * ((ph / (2 * np.pi)) % 1) - 1) * .33
    s = lp(s, 1400) * np.minimum(1, x / att) * np.where(x > d, np.exp(-(x - d) / (rel / 3)), 1) * (1 + .03 * np.sin(2 * np.pi * 5.2 * x))
    add(music, s * v / len(pitches), t, 1, pan)

# ——— block A: dusk and the climb (72 bpm from 0) ———
for k, (b, p) in enumerate([(0, 'B2'), (1.5, 'F#3'), (3, 'D4'), (4, 'G2'), (5.5, 'D3'), (7, 'B3')]): harp(b * B + .1, p, .5 - .03 * k)
pad(.3, ['B2', 'F#3'], 14.6, v=.13, att=2.5, rel=2)
CH_A = [(6.67, ['B2', 'D3', 'F#3', 'B3', 'D4', 'F#4', 'B4', 'D5']), (10.0, ['G2', 'B2', 'D3', 'G3', 'B3', 'D4', 'G4', 'B4']), (13.33, ['A2', 'C#3', 'E3', 'A3', 'C#4', 'E4', 'A4', 'C#5'])]
t = 6.67
while t < 15.0:
    ch = [c for s0, c in CH_A if s0 <= t + 1e-6][-1]; k = int(round((t - 6.67) / E8))
    harp(t, ch[k % 8], .32 + .015 * (k % 8) + .1 * (t - 6.67) / 8.3, pan=-.3 + .08 * (k % 8), d=2.2); t += E8
UP = ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6', 'F#6']
for k, tw in enumerate(H['windows']): kal(tw, UP[k], .45, .4 - .1 * k)

# ——— silence 15.6 – 18.0, then block B anchored at the lamp (72 bpm from 18.0) ———
L0 = H['light']
for p in ['D5', 'F#5', 'A5', 'D6']: celesta(L0, p, .55, pan={'D5': -.3, 'F#5': -.1, 'A5': .1, 'D6': .3}[p], d=4)
harp(L0, 'D2', .8, 0, 5)
CH_B = [('D', ['D3', 'A3', 'F#4']), ('A', ['A2', 'E3', 'C#4']), ('Bm', ['B2', 'F#3', 'D4']), ('G', ['G2', 'D3', 'B3'])]
for i in range(4): pad(L0 + i * 4 * B, CH_B[i % 4][1], 4 * B + .2, v=.2 if i < 3 else .14, att=.25 if i == 0 else .6, rel=1.6)
OST = {'D': ['D4', 'A4', 'F#4', 'A4'], 'A': ['C#4', 'E4', 'A4', 'E4'], 'Bm': ['B3', 'F#4', 'D4', 'F#4'], 'G': ['B3', 'D4', 'G4', 'D4']}
t = L0 + 2 * B
while t < 29.4:
    i = int((t - L0) // (4 * B)); name = CH_B[i % 4][0]; k = int(round((t - L0) / E8))
    harp(t, OST[name][k % 4], .3 if k % 8 else .38, pan=.25 - .1 * (k % 4), d=2); t += E8
# the reply: a music-box motif, then its echo
for t0, v in [(25.3, .5), (28.6, .38)]:
    for j, p in enumerate(['A5', 'F#5', 'E5', 'D5']): mbox(t0 + j * E8 * 1.5, p, v)
for a, b in H['morse']: mbox(a, 'A6', .55 if b - a > .5 else .4, .3)
# home
for t0, p in [(35.4, 'D3'), (36.2, 'A3'), (37.0, 'F#4'), (37.8, 'A4')]: harp(t0, p, .42, -.15, 4)
for p in ['D4', 'A4', 'D5']: harp(39.3, p, .38, {'D4': -.2, 'A4': 0, 'D5': .2}[p], 4)
pad(35.3, ['D3', 'A3'], 5.5, v=.08, att=2, rel=1.5)

# room-ish reverb for the music: exponential noise tail
def reverb(x, sec=2.2, mix=.22):
    ir = noise(sec) * np.exp(-t_(sec) / (sec / 6.9)); ir = lp(ir, 5000); ir /= np.sqrt(np.sum(ir ** 2))
    from scipy.signal import fftconvolve
    w = np.stack([fftconvolve(x[:, c], ir if c == 0 else np.roll(ir, 37))[:len(x)] for c in range(2)], 1)
    return x * (1 - mix) + w * mix
music = reverb(music)

# ——— ambience ———
sea = lp(brown(N / SR), 900) * (1 + .7 * np.sin(2 * np.pi * tt / 6.5) ** 2); sea = norm(sea, 1)
wind = bp(noise(N / SR), 300, 1600) * (.5 + .5 * np.sin(2 * np.pi * tt / 9.3 + 1) ** 2); wind = norm(wind, 1)
inside = envl([(0, 0), (15.5, 0), (15.7, 1), (21.8, 1), (22.4, 0), (DUR + 1, 0)])
roomt = envl([(0, 0), (34.8, 0), (37.5, 1), (DUR + 1, 1)])
seaG = db(-24) * (1 - .82 * inside) * (1 - .75 * roomt) * envl([(0, 0), (.6, 1), (DUR + 1, 1)])
add(amb, sea * seaG, 0, 1, -.15); add(amb, np.roll(sea, 9000) * seaG, 0, 1, .15)
add(amb, wind * db(-33) * (1 - inside) * (1 - roomt), 0, 1, .3)
add(amb, lp(brown(N / SR), 300) * db(-40) * np.maximum(inside, roomt), 0, 1, 0)                    # room tone

# ——— foley ———
def gravel(t, v=1.):
    x = bp(noise(.09), 900, 5000) * env_exp(.09, .022); add(foley, x * v * db(-30), t, 1, .1)
def iron(t, v=1.):
    x = bp(noise(.06), 1500, 5000) * env_exp(.06, .01); ring = np.sin(2 * np.pi * 930 * t_(.3)) * env_exp(.3, .06) * .25
    add(foley, x * v * db(-31), t, 1, .2); add(foley, ring * v * db(-38), t, 1, .2)
for k in range(11): gravel(.35 + k * .55, .8 + .2 * (k % 2))
add(foley, norm(creak(1.0), 1) * db(-26), H['door'], 1, .3)
add(foley, bp(noise(.03), 2000, 7000) * env_exp(.03, .006) * db(-27), H['door'] + .35, 1, .3)   # latch
add(foley, norm(thump(.8, 90), 1) * db(-28), 6.45, 1, .2)                                          # door shuts
t = 6.75
while t < 15.0: iron(t, .7 + .3 * ((int(t / .52)) % 2)); t += .52
add(foley, norm(whoosh(.5), 1) * db(-27), H['wipe'] - .3, 1, -.4)
add(foley, bp(noise(.7), 400, 2500) * np.sin(np.pi * t_(.7) / .7) * db(-33), H['raise'], 1, -.2)     # coat sleeve
add(foley, hp(noise(1.6), 3000) * np.minimum(1, t_(1.6) / .4) * db(-42), H['light'] - 1.6, 1, -.1)  # wick hiss
add(foley, norm(ignite(1.0), 1) * db(-22), L0 - .03, 1, 0)                                          # the flare
x = t_(2.2); shim = sum(np.sin(2 * np.pi * (f0 + 900 * x) * x) for f0 in (1800, 2400, 3100)) * np.exp(-x * 1.6) * np.minimum(1, x / .25)
add(foley, shim * db(-36), L0, 1, .2)                                                               # rising shimmer
t = H['turn']; k = 0
while t < 27.5:   # the lamp's clockwork: ticks on eighths, L-cut into the wide, fading out
    tk = bp(noise(.02), 2500, 8000) * env_exp(.02, .003) * (1.0 if k % 2 == 0 else .6)
    add(foley, tk * db(-30) * (1 - max(0, (t - 23.5) / 4)), t, 1, -.1); t += E8; k += 1
hx = t_(2.4); horn = sum(((2 * ((f * hx) % 1) - 1)) for f in (98, 98.6, 147.3)) * np.minimum(1, hx / .35) * np.where(hx > 1.6, np.exp(-(hx - 1.6) / .25), 1)
horn = lp(horn, 600); add(foley, norm(horn, 1) * db(-30), H['horn'], 1, -.5); add(foley, norm(horn, 1) * db(-40), H['horn'] + .32, 1, .5)
add(foley, bp(noise(.6), 800, 4000) * np.sin(np.pi * t_(.6) / .6) * db(-36), H['title'], 1, -.2)   # paper strip slides out
for k in range(8): gravel(36.4 + k * .6, .6 - .06 * k)                                              # walking home
add(foley, np.sin(2 * np.pi * 120 * tt) * db(-52) * roomt, 0, 1, 0)                                 # the lamp box's hum

# ——— voice ———
vo = np.zeros((N, 2)); speech = np.zeros(N)
for c in TL['cues']:
    w, sr = sf.read(os.path.join(HERE, 'voices', c['id'] + '.wav'), dtype='float32')
    if w.ndim > 1: w = w.mean(1)
    if sr != SR: w = soxr.resample(w, sr, SR)
    w = compress(w / (np.abs(w).max() + 1e-9) * .9, thr=.3, ratio=3)
    w *= db(-18) / rms(w[np.abs(w) > .02]) if np.any(np.abs(w) > .02) else 1
    add(vo, w, c['at'], 1, 0); s = int(c['at'] * SR); speech[s:s + len(w)] = 1
from scipy.ndimage import uniform_filter1d
duck = 1 - (1 - db(-6)) * np.clip(uniform_filter1d(speech, int(.25 * SR)) * 1.4, 0, 1)

# ——— balance and master ———
music *= db(-25) / rms(music[int(18 * SR):int(29 * SR)]) * duck[:, None]
mix = music + foley + amb + vo
fade = envl([(0, 0), (.05, 1), (DUR - .9, 1), (DUR, 0), (DUR + 1, 0)])
mix = mix * fade[:, None]
mix = np.stack([limit(mix[:, 0], .92), limit(mix[:, 1], .92)], 1)[:int(DUR * SR)]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
for name, x in [('music', music), ('foley', foley), ('amb', amb), ('voice', vo)]: print(f'{name:6} rms {20*np.log10(rms(x)+1e-12):6.1f} dB')
print('mix peak', round(float(np.abs(mix).max()), 3), '→ out/mix.wav', mix.shape[0] / SR, 's')
