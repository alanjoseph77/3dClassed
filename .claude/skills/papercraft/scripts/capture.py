"""Deterministic review captures and videos of a papercraft build (the harness's window.__papercraft hook).

Serves the project folder, opens the page in Chrome (headless, GPU), waits for the build, runs each shot on the fixed
clock and saves a PNG (or a frame sequence and an MP4). Prints the build time, the frame, the pieces, the standing
cards in frame, the slowest prints, the hero's card-clipping check (cards cutting into each other, standing or
walking) and every page error and console error, and exits non-zero on a page error, a clipping hero or a walk that
does not arrive.

    python scripts/capture.py <project folder> [shots ...] [--page index.html] [--out frames] [--size 1600x900] [--ss 1]
                              [--safe all|meta|tiktok|shorts]

--size: WxH, a ratio (9:16 = 1080x1920: the short side 1080) or a format (references/formats.md):
    1080p 1920x1080 | 720p | 1440p | 4k 3840x2160 | reel / story / tiktok / shorts / vertical 1080x1920 |
    reel-hd 1440x2560 | feed / portrait 1080x1350 (4:5) | grid 1080x1440 (3:4) | square 1080x1080 |
    ultrawide 2560x1080 | flat 1998x1080 (1.85) | scope 2048x858 (2.39)
The page gets ?size=WxH, so it renders exactly that frame: the 3D harness frames the shape (the short side keeps the
lens, a tall frame comes closer and lifts the subject) and prints finer for big frames. The default 1600x900 is the
review size measure.py's gates assume. --safe outlines a vertical platform's UI-safe area and the feed crops on the
frames (a check, never a deliverable).

Shots (default: overview):
    overview              restart(); step(3.2): the opening frame, risen
    midrise               restart(); step(0.8): mid-rise
    test                  the ?test page (close, your test cards)
    key                   ?diag=key: the key light alone (shadow shapes)
    mood=NAME             ?mood=NAME (golden, dusk, night or one of yours), risen
    look=X,Z[,DIST[,Y]]   a close look at (X, Z) (DIST default 30)
    spot=NAME[,DIST]      a close look at H.spots[NAME]
    walk=X,Z;X,Z;...      a scripted walk from the start through the waypoints (blockers and steps apply), the camera
                          following; prints { reached, of, stuck, blockedBy, y, on }
    at=X,Z                the hero placed at (X, Z), the walking camera framing him (walk-area and fill edges)
    hold=KEYS,SEC         from the start, hold keys (e.g. ArrowUp+ArrowLeft) for SEC seconds at 60 fps, live input
    video=SEC[,FPS[,KEYS[,FROM]]]  from restart (everything flat), SEC seconds at FPS (default 30) on the fixed
                          clock, one PNG per frame in <out>/<name>/, then <out>/<name>.mp4 if ffmpeg is on PATH (H.264
                          High, yuv420p, BT.709, +faststart: what every platform takes). KEYS (ArrowLeft+ArrowUp, or -)
                          are held while it records; FROM skips that many seconds first (3.2: start risen). Sound is
                          rendered offline and muxed after (references/sound.md).
    route=SEC,FPS[,FROM];X,Z;X,Z;...  a video of the hero walking through the waypoints (steered like a stick, the
                          camera following; FROM default 3.2: the world risen); he stops at the last one
Name a shot's file with NAME: before it (e.g. bridge:spot=bridge). Needs Playwright (pip install playwright; it uses
your installed Chrome, or run `playwright install chromium`).
"""
import argparse, functools, http.server, json, os, re, shutil, subprocess, sys, threading

FORMATS = {
    '720p': (1280, 720), '1080p': (1920, 1080), '1440p': (2560, 1440), '4k': (3840, 2160), 'uhd': (3840, 2160),
    'vertical': (1080, 1920), 'reel': (1080, 1920), 'reels': (1080, 1920), 'story': (1080, 1920), 'tiktok': (1080, 1920),
    'shorts': (1080, 1920), 'reel-hd': (1440, 2560), 'feed': (1080, 1350), 'portrait': (1080, 1350), 'grid': (1080, 1440),
    'square': (1080, 1080), 'ultrawide': (2560, 1080), 'flat': (1998, 1080), 'scope': (2048, 858),
}


def parse_size(s):
    s = s.strip().lower()
    if s in FORMATS:
        return FORMATS[s]
    m = re.fullmatch(r'(\d+)x(\d+)', s)
    if m:
        return int(m[1]), int(m[2])
    m = re.fullmatch(r'([\d.]+):([\d.]+)', s)
    if m:   # a ratio: the short side 1080, both sides even
        a, b = float(m[1]), float(m[2])
        w, h = (1080 * a / b, 1080) if a >= b else (1080, 1080 * b / a)
        return int(round(w / 2)) * 2, int(round(h / 2)) * 2
    raise SystemExit(f'capture.py: --size {s!r}: use WxH, a ratio like 9:16, or one of {", ".join(FORMATS)}')


def serve(root):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=root))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv.server_address[1]


def plan(shot):
    """(file name, url query, js run on the risen page or None, kind)"""
    name = None
    if ':' in shot.split('=')[0]:
        name, shot = shot.split(':', 1)
    key, _, arg = shot.partition('=')
    base = 'restart(); step(3.2);'
    if key == 'overview': return name or 'overview', '', base, 'frame'
    if key == 'midrise': return name or 'midrise', '', 'restart(); step(0.8);', 'frame'
    if key == 'test': return name or 'test', 'test', 'restart(); step(2.5);', 'frame'
    if key == 'key': return name or 'key', 'diag=key', base, 'frame'
    if key == 'mood': return name or f'mood-{arg}', f'mood={arg}', base, 'frame'
    if key == 'look':
        v = [float(t) for t in arg.split(',')]
        return name or 'look-' + '_'.join(f'{t:g}' for t in v[:2]), '', base + f' look({", ".join(str(t) for t in v)}); step(1 / 60);', 'frame'
    if key == 'spot':
        sp, _, d = arg.partition(',')
        return name or f'spot-{sp}', '', base + f' look(spots[{json.dumps(sp)}][0], spots[{json.dumps(sp)}][1], {d or 30}); step(1 / 60);', 'frame'
    if key == 'walk':
        pts = [[float(t) for t in p.split(',')] for p in arg.split(';') if p]
        return name or 'walk', '', pts, 'walk'
    if key == 'at':
        x, z = [float(t) for t in arg.split(',')]
        return name or f'at-{x:g}_{z:g}', '', base + f' const y = place({x}, {z}); step(0.5); return y;', 'at'
    if key == 'hold':
        keys, _, sec = arg.partition(',')
        return name or 'hold', '', (keys.split('+'), float(sec or 1)), 'hold'
    if key == 'video':
        p = arg.split(',')
        sec = float(p[0] or 4) if p and p[0] else 4.0
        fps = int(p[1]) if len(p) > 1 and p[1] else 30
        keys = p[2].split('+') if len(p) > 2 and p[2] and p[2] != '-' else []
        start = float(p[3]) if len(p) > 3 and p[3] else 0.0
        return name or 'video', '', (sec, fps, keys, start, None), 'video'
    if key == 'route':
        head, *pts = arg.split(';')
        p = head.split(',')
        sec, fps = float(p[0] or 4), int(p[1]) if len(p) > 1 and p[1] else 30
        start = float(p[2]) if len(p) > 2 and p[2] else 3.2
        way = [[float(t) for t in q.split(',')] for q in pts if q]
        return name or 'route', '', (sec, fps, [], start, way), 'video'
    raise SystemExit(f'capture.py: unknown shot "{shot}" (see the docstring)')


def encode(frames_dir, fps, mp4):
    """Frame PNGs -> an MP4 every platform accepts: H.264 High, yuv420p, BT.709 limited range, closed GOP of half a
    second, +faststart (references/formats.md, export settings)."""
    exe = shutil.which('ffmpeg')
    if not exe:
        print(f'  ffmpeg is not on PATH: the frames are in {frames_dir} (f_%05d.png at {fps} fps)')
        return False
    cmd = [exe, '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', os.path.join(frames_dir, 'f_%05d.png'),
           '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv',
           '-c:v', 'libx264', '-profile:v', 'high',
           '-preset', 'slow', '-crf', '18', '-g', str(max(1, fps // 2)), '-bf', '2',
           '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
           '-movflags', '+faststart', mp4]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print('  ffmpeg failed:', r.stderr[-600:])
        return False
    return True


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('project'); ap.add_argument('shots', nargs='*')
    ap.add_argument('--page', default='index.html'); ap.add_argument('--out', default='frames')
    ap.add_argument('--size', default='1600x900'); ap.add_argument('--ss', default='1')
    ap.add_argument('--safe', default=None, help='outline a vertical platform safe area: all | meta | tiktok | shorts')
    a = ap.parse_args()
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise SystemExit('capture.py needs Playwright: pip install playwright (and `playwright install chromium` if Chrome is not installed)')
    root = os.path.abspath(a.project); out = os.path.join(root, a.out) if not os.path.isabs(a.out) else a.out
    os.makedirs(out, exist_ok=True)
    W, H = parse_size(a.size)
    if W % 2 or H % 2:
        print(f'note: {W}x{H} has an odd side; H.264 (yuv420p) needs even sides for a video')
    page, _, page_q = a.page.partition('?')
    port = serve(root)
    failed = False
    with sync_playwright() as p:
        args = ['--enable-gpu', '--ignore-gpu-blocklist'] + (['--use-angle=d3d11'] if os.name == 'nt' else [])
        try: b = p.chromium.launch(channel='chrome', headless=True, args=args)
        except Exception: b = p.chromium.launch(headless=True, args=args)
        logs, errors = [], []
        pg, cur = None, None
        for shot in (a.shots or ['overview']):
            name, query, js, kind = plan(shot)
            q = '&'.join(t for t in ('capture', f'size={W}x{H}', f'ss={a.ss}' if a.ss != '1' else '',
                                     f'safe={a.safe}' if a.safe else '', page_q, query) if t)
            if q != cur:   # a fresh page per URL: a reload in the same tab builds slower (the old page's canvases)
                if pg: pg.close()
                pg = b.new_page(viewport={'width': W, 'height': H})
                pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
                pg.on('pageerror', lambda e: errors.append(str(e)))
                pg.goto(f'http://127.0.0.1:{port}/{page}?{q}')
                try:
                    pg.wait_for_function('window.__papercraft && window.__papercraft.ready', timeout=300000)
                except Exception:
                    print('the page never became ready (no window.__papercraft.ready):')
                    for e in errors: print('  PAGE ERROR', e)
                    for l in logs[:30]: print('  ', l[:300])
                    raise SystemExit(1)
                cur = q
                s = pg.evaluate('__papercraft.printStats ? __papercraft.printStats(5) : null')
                f = pg.evaluate('__papercraft.frame || null')
                fr = (f' | frame {f["w"]}x{f["h"]}, fovY {f["fovY"]:.1f}, mag {f.get("mag", 1):.2f}, print x{f.get("printScale", 1):.2f}' if f and 'fovY' in f else '')
                print(f'[{q}] build {pg.evaluate("__papercraft.buildMs")} ms, pieces {pg.evaluate("__papercraft.pieces")}'
                      + (f', {s["prints"]} prints {s["printMs"]} ms ({s["mpx"]} Mpx)' if s else '') + fr)
                if s:
                    for e in s['top']: print(f'    {e["ms"]:6d} ms  {e["prints"]:4d} x {e["each"]:6.1f} ms  {e["at"]}')
                cl = pg.evaluate('__papercraft.clips ? __papercraft.clips() : null')
                if cl is not None:   # the hero's cards, standing and through his stride (references/mechanisms.md 12)
                    print(f'  hero: {len(cl)} card pair(s) cut into each other' if cl else '  hero: no card cuts into another, standing or walking')
                    for c in cl[:12]: print(f'    {c["a"]} / {c["b"]}: {c["kind"]} by {c["depth"]} ({c["at"]})')
                    if cl: failed = True
            if kind == 'video':
                sec, fps, keys, start, way = js
                fdir = os.path.join(out, name)
                os.makedirs(fdir, exist_ok=True)
                for old in os.listdir(fdir):
                    if re.fullmatch(r'f_\d{5}\.png', old): os.remove(os.path.join(fdir, old))
                pg.evaluate(f'() => {{ __papercraft.restart(); if ({start} > 0) __papercraft.step({start}); }}')
                for k in keys: pg.evaluate('(k) => dispatchEvent(new KeyboardEvent("keydown", { code: k, key: k }))', k)
                n, wi = max(1, round(sec * fps)), 0
                for i in range(n):
                    if way:   # steer toward the next waypoint (a stick held that way); stop at the last
                        while wi < len(way):
                            h = pg.evaluate('(() => { const h = __papercraft.heroPos; return [h.x, h.z]; })()')
                            dx, dz = way[wi][0] - h[0], way[wi][1] - h[1]
                            if dx * dx + dz * dz > 0.36: break
                            wi += 1
                        pg.evaluate(f'() => __papercraft.steer({dx}, {dz})' if wi < len(way) else '() => __papercraft.steer(null)')
                    pg.evaluate(f'() => __papercraft.step({1 / fps}, {fps})')
                    pg.screenshot(path=os.path.join(fdir, f'f_{i:05d}.png'))
                for k in keys: pg.evaluate('(k) => dispatchEvent(new KeyboardEvent("keyup", { code: k, key: k }))', k)
                if way:
                    pg.evaluate('() => __papercraft.steer(null)')
                    h = pg.evaluate('(() => { const h = __papercraft.heroPos; return [+h.x.toFixed(1), +h.z.toFixed(1)]; })()')
                    print(f'{name}: waypoints reached {wi} of {len(way)}, hero at {h}')
                    if wi < len(way): failed = True
                mp4 = os.path.join(out, name + '.mp4')
                ok = encode(fdir, fps, mp4)
                print(f'{name}: {n} frames at {fps} fps ({W}x{H}) in {os.path.join(a.out, name)}' + (f'  -> {os.path.join(a.out, name + ".mp4")}' if ok else ''))
                continue
            if kind == 'walk':
                r = pg.evaluate('(pts) => { const P = __papercraft; P.restart(); P.step(3.2); const r = P.walkPath(pts); P.step(1 / 60); return r; }', js)
                r.pop('heights', None); print(f'{name}: walk {json.dumps(r)}')
                if r.get('reached', 0) < r.get('of', 0): failed = True
            elif kind == 'hold':
                keys, sec = js
                pg.evaluate('() => { __papercraft.restart(); __papercraft.step(3.2); }')
                for k in keys: pg.evaluate('(k) => dispatchEvent(new KeyboardEvent("keydown", { code: k, key: k }))', k)
                pg.evaluate(f'() => __papercraft.step({sec})')
                for k in keys: pg.evaluate('(k) => dispatchEvent(new KeyboardEvent("keyup", { code: k, key: k }))', k)
                pos = pg.evaluate('(() => { const h = __papercraft.heroPos; return [+h.x.toFixed(2), +h.y.toFixed(2), +h.z.toFixed(2)]; })()')
                print(f'{name}: hero at {pos}')
            else:
                r = pg.evaluate(f'(() => {{ const P = __papercraft; with (P) {{ {js} }} }})()')
                if kind == 'at': print(f'{name}: hero at ({shot.split("=")[1]}), y {r}' + ('  (outside the walk field: blocked there)' if r is None else ''))
            cards = pg.evaluate('__papercraft.cards ? __papercraft.cards() : null')
            pg.screenshot(path=os.path.join(out, f'{name}.png'))
            print(f'  -> {os.path.join(a.out, name + ".png")}' + (f'  ({cards} standing cards in frame)' if cards is not None else ''))
        b.close()
    noise = re.compile(r'X4000|willReadFrequently|favicon')
    shown = [l for l in logs if not noise.search(l)]
    for e in errors: print('PAGE ERROR', e)
    for l in shown[:40]: print(l[:400])
    if errors or failed: sys.exit(1)


if __name__ == '__main__':
    main()
