#!/usr/bin/env python3
"""Export an LDraw model to STL for 3D printing.

Usage: python mpd_to_stl.py MODEL.mpd OUTDIR [--lib /usr/share/ldraw] [--skip 75924,76384]
Writes:
  OUTDIR/<model>-display.stl   whole model as one mesh, real LEGO scale (1 LDU = 0.4 mm), Z up
  OUTDIR/parts/<part>.stl      one STL per unique part, real scale, Z up, sitting on the bed
  OUTDIR/report.json           triangle counts, sizes in mm, open-edge counts (0 = watertight)
Back-face culling (BFC) winding is honoured so normals point outwards where parts are certified.
"""
import argparse, os, re, json, struct, pathlib, collections
import numpy as np

MM = 0.4                                   # 1 LDU = 0.4 mm
TOZ = np.array([[1, 0, 0], [0, 0, 1], [0, -1, 0]], float)   # LDraw -Y up -> STL +Z up (proper rotation)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("model"); ap.add_argument("outdir")
    ap.add_argument("--lib", default=os.environ.get("LDRAW_DIR", "/usr/share/ldraw"))
    ap.add_argument("--skip", default="", help="comma-separated part numbers to leave out of the display STL (e.g. flexible strings)")
    a = ap.parse_args()
    LIB, out = a.lib, pathlib.Path(a.outdir); (out / "parts").mkdir(parents=True, exist_ok=True)
    skip = {s.strip().lower().removesuffix(".dat") for s in a.skip.split(",") if s.strip()}

    sections, cur = {}, None
    for line in open(a.model, encoding="utf-8-sig", errors="ignore"):
        if line.startswith("0 FILE "): cur = line[7:].strip().lower(); sections[cur] = []
        elif cur is not None: sections[cur].append(line)
    if not sections: sections["main"] = open(a.model, encoding="utf-8-sig").read().splitlines()
    main_name = next(iter(sections))
    cache = {}
    def lines_of(name):
        n = name.lower().replace("\\", "/")
        if n in sections: return sections[n]
        if n not in cache:
            cache[n] = []
            for sub in ("parts", "p", "models", "parts/s", "p/48"):
                for c in (os.path.join(LIB, sub, n), os.path.join(LIB, sub, os.path.basename(n))):
                    if os.path.exists(c): cache[n] = open(c, encoding="utf-8", errors="ignore").read().splitlines(); break
                if cache[n]: break
        return cache[n]

    def tris_of(name, M, t, invert, out_list):
        ccw = True; invnext = False
        for raw in lines_of(name):
            p = raw.split()
            if not p: continue
            if p[0] == "0" and len(p) > 1 and p[1] == "BFC":
                w = p[2:]
                if "CW" in w: ccw = False
                if "CCW" in w: ccw = True
                if "INVERTNEXT" in w: invnext = True
                continue
            if p[0] == "1" and len(p) >= 15:
                f = list(map(float, p[2:14])); m = np.array([f[3:6], f[6:9], f[9:12]])
                inv = invert ^ invnext ^ (np.linalg.det(m) < 0)
                tris_of(" ".join(p[14:]), M @ m, M @ np.array(f[:3]) + t, inv, out_list); invnext = False
            elif p[0] in ("3", "4"):
                v = np.array(list(map(float, p[2:2 + 3 * int(p[0])]))).reshape(-1, 3)
                w = (M @ v.T).T + t
                flip = invert ^ (not ccw)
                faces = [[0, 1, 2]] + ([[0, 2, 3]] if p[0] == "4" else [])
                for fc in faces:
                    tri = w[fc]
                    out_list.append(tri[[0, 2, 1]] if flip else tri)

    def to_mm(tris): return np.asarray(tris, float) @ TOZ.T * MM

    def write_stl(path, T):
        n = np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0]); l = np.linalg.norm(n, axis=1, keepdims=True); n = np.divide(n, l, where=l > 0, out=np.zeros_like(n))
        with open(path, "wb") as fh:
            fh.write(b"LDraw export".ljust(80, b" ")); fh.write(struct.pack("<I", len(T)))
            rec = np.zeros(len(T), dtype=[("n", "<f4", 3), ("v", "<f4", (3, 3)), ("a", "<u2")])
            rec["n"] = n; rec["v"] = T; fh.write(rec.tobytes())
        return T

    def open_edges(T):
        q = np.round(T, 3)
        cnt = collections.Counter()
        for tri in q:
            for i in range(3):
                e = tuple(sorted((tuple(tri[i]), tuple(tri[(i + 1) % 3]))))
                cnt[e] += 1
        return sum(1 for c in cnt.values() if c != 2)

    report = {"scale": "1 LDU = 0.4 mm (real LEGO size)", "parts": {}}
    display, seen = [], {}
    for raw in sections[main_name]:
        p = raw.split()
        if not (p and p[0] == "1" and len(p) >= 15): continue
        ref = " ".join(p[14:]).lower(); f = list(map(float, p[2:14]))
        m = np.array([f[3:6], f[6:9], f[9:12]]); code = ref.removesuffix(".dat")
        seen[code] = seen.get(code, 0) + 1
        if code not in skip:
            tris_of(ref, m, np.array(f[:3]), np.linalg.det(m) < 0, display)
    T = to_mm(display); T = T - [0, 0, T[:, :, 2].min()]
    write_stl(out / (pathlib.Path(a.model).stem + "-display.stl"), T)
    report["display"] = {"file": pathlib.Path(a.model).stem + "-display.stl", "triangles": len(T),
                         "size_mm": np.round(np.ptp(T.reshape(-1, 3), axis=0), 1).tolist(), "left_out": sorted(skip)}
    for code, qty in sorted(seen.items()):
        tris = []; tris_of(code + ".dat", np.eye(3), np.zeros(3), False, tris)
        T = to_mm(tris); T = T - [0, 0, T[:, :, 2].min()]          # sit on the bed
        write_stl(out / "parts" / f"{code}.stl", T)
        desc = next((l[2:].strip() for l in lines_of(code + ".dat") if l.startswith("0 ")), code)
        report["parts"][code] = {"description": desc, "quantity": qty, "triangles": len(T),
                                 "size_mm": np.round(np.ptp(T.reshape(-1, 3), axis=0), 1).tolist(), "open_edges": open_edges(T)}
    (out / "report.json").write_text(json.dumps(report, indent=1))
    print(json.dumps(report["display"])); print(len(report["parts"]), "unique parts")

if __name__ == "__main__":
    main()
