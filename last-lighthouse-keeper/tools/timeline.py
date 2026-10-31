"""The Last Lighthouse Keeper: the one timeline (narration starts, cues, hits, shots) → timeline.json + .srt
python3 tools/timeline.py"""
import json, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dur = json.load(open(os.path.join(HERE, 'voices/dur.json')))
lines = {l['id']: l for l in json.load(open(os.path.join(HERE, 'voices/lines.json')))}
AT = {'L1': 0.6, 'L2': 4.1, 'L3': 9.2, 'L4': 11.9, 'L5': 24.4, 'L6': 30.9, 'L7': 35.7}
SUB = {'L2': 'For 41 years, Elias climbed these steps at dusk.'}
DUR = 41.0
ids = list(AT); cues = []
for n, i in enumerate(ids):
    end = AT[i] + dur[i]
    t0, t1 = AT[i] - .15, max(AT[i] + 1.8, end + .6)
    if n + 1 < len(ids): t1 = min(t1, AT[ids[n + 1]] - .16)
    else: t1 = DUR + .3
    cues.append({'id': i, 't0': round(t0, 3), 't1': round(t1, 3), 'text': SUB.get(i, lines[i]['text']), 'at': AT[i], 'end': round(end, 3)})
# Morse "T U": unit .25 s.  T = dash; letter gap; U = dot dot dash
U0, u = 30.2, .25
MORSE = [[U0, U0 + 3*u], [U0 + 6*u, U0 + 7*u], [U0 + 8*u, U0 + 9*u], [U0 + 10*u, U0 + 13*u]]
HIT = {
    'door': 3.6, 'climb': [6.6, 15.0],
    'windows': [6.9 + k * 1.04 for k in range(8)],          # stair windows light on 8th notes of 72 bpm (≈ every 5/4 eighth)
    'wipe': 15.6, 'raise': 16.0, 'light': 18.0, 'turn': 20.2,
    'shipLit': 24.2, 'horn': 26.8, 'morse': MORSE, 'title': 35.8, 'home': 35.4, 'beamCycle0': 21.8, 'beamPeriod': 6.0,
}
SHOTS = [['W1', 0.0, None], ['ROOM', 15.6, 'cut'], ['W2', 22.0, 'dissolve']]
json.dump({'DUR': DUR, 'cues': cues, 'HIT': HIT, 'SHOTS': SHOTS}, open(os.path.join(HERE, 'timeline.json'), 'w'), indent=1)
def fmt(s): ms = int(round(max(0, s) * 1000)); return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
open(os.path.join(HERE, 'last-lighthouse-keeper.srt'), 'w').write('\n'.join(f"{k+1}\n{fmt(c['t0'])} --> {fmt(min(c['t1'], DUR))}\n{c['text']}\n" for k, c in enumerate(cues)))
for c in cues: print(f"{c['id']} {c['t0']:6.2f}–{c['t1']:6.2f} (speech ends {c['end']:.2f})  {c['text']}")
