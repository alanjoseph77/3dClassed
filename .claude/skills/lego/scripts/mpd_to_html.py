#!/usr/bin/env python3
"""Turn an LDraw .mpd/.ldr model into ONE self-contained, offline HTML 3D viewer.

Usage:
  python mpd_to_html.py MODEL.mpd OUT.html --title "LEGO Tower Crane" \
      [--subtitle "44 parts"] [--groups groups.json --plan model.plan.json] [--lib /usr/share/ldraw]

Every placement in the main FILE becomes coloured triangles + edge lines (real LDraw part
geometry, recursively expanded). three.js r160 is embedded as data: URLs, so no CDN is needed.

--groups (optional) maps group name -> list of plan placement ids or id prefixes ending in '*';
needs --plan so main-file placements can be matched to ids in order. Each group becomes its own
three.js Group named after it (window.MODEL.groups[name]) so a custom page can animate it.
"""
import argparse, base64, json, os, re, subprocess, sys, tempfile, pathlib
import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
TEMPLATE = HERE.parent / "assets" / "viewer.html"
THREE_VER = "0.160.0"


def load_three(cache):
    pkg = cache / "package"
    if not (pkg / "build" / "three.module.min.js").exists():
        cache.mkdir(parents=True, exist_ok=True)
        subprocess.run(["npm", "pack", f"three@{THREE_VER}", "--silent"], cwd=cache, check=True)
        subprocess.run(["tar", "xzf", f"three-{THREE_VER}.tgz"], cwd=cache, check=True)
    three = (pkg / "build" / "three.module.min.js").read_bytes()
    orbit = (pkg / "examples" / "jsm" / "controls" / "OrbitControls.js").read_bytes()
    u = lambda b: "data:text/javascript;base64," + base64.b64encode(b).decode()
    return json.dumps({"imports": {"three": u(three), "three/addons/controls/OrbitControls.js": u(orbit)}})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("model"); ap.add_argument("out")
    ap.add_argument("--title", default="LEGO model"); ap.add_argument("--subtitle", default="")
    ap.add_argument("--groups"); ap.add_argument("--plan")
    ap.add_argument("--lib", default=os.environ.get("LDRAW_DIR", "/usr/share/ldraw"))
    ap.add_argument("--three-cache", default=str(pathlib.Path(tempfile.gettempdir()) / "three-npm"))
    a = ap.parse_args()
    LIB = a.lib

    COL = {}
    for line in open(os.path.join(LIB, "LDConfig.ldr"), encoding="utf-8", errors="ignore"):
        m = re.search(r"!COLOUR\s+\S+\s+CODE\s+(\d+)\s+VALUE\s+#([0-9A-Fa-f]{6})\s+EDGE\s+#?(\S+)(.*)", line)
        if m:
            al = re.search(r"ALPHA\s+(\d+)", m.group(4))
            COL[int(m.group(1))] = (m.group(2), int(al.group(1)) if al else 255)

    sections, cur = {}, None
    for line in open(a.model, encoding="utf-8-sig", errors="ignore"):
        if line.startswith("0 FILE "):
            cur = line[7:].strip().lower(); sections[cur] = []
        elif cur is not None:
            sections[cur].append(line)
    if not sections:  # plain .ldr
        sections["main"] = open(a.model, encoding="utf-8-sig", errors="ignore").read().splitlines()
    main_name = next(iter(sections))

    cache = {}
    def lines_of(name):
        n = name.lower().replace("\\", "/")
        if n in sections: return sections[n]
        if n in cache: return cache[n]
        for sub in ("parts", "p", "models", "parts/s", "p/48"):
            for cand in (os.path.join(LIB, sub, n), os.path.join(LIB, sub, os.path.basename(n))):
                if os.path.exists(cand):
                    cache[n] = open(cand, encoding="utf-8", errors="ignore").read().splitlines()
                    return cache[n]
        print("warning: missing", name, file=sys.stderr); cache[n] = []; return []

    def colour(c, parent):
        if c == 16: c = parent
        if c == 24: return ("333333", 255)
        return COL.get(c, ("ff00ff", 255))

    tris, edges = {}, {}
    def emit(name, M, t, col, group):
        for raw in lines_of(name):
            p = raw.split()
            if not p: continue
            if p[0] == "1" and len(p) >= 15:
                f = list(map(float, p[2:14])); c = int(p[1])
                m = np.array([f[3:6], f[6:9], f[9:12]])
                emit(" ".join(p[14:]), M @ m, M @ np.array(f[:3]) + t, col if c == 16 else c, group)
            elif p[0] in ("3", "4"):
                v = np.array(list(map(float, p[2:2 + 3 * int(p[0])]))).reshape(-1, 3)
                w = (M @ v.T).T + t
                L = tris.setdefault((group, colour(int(p[1]), col)), [])
                L.append(w[[0, 1, 2]])
                if p[0] == "4": L.append(w[[0, 2, 3]])
            elif p[0] == "2":
                v = np.array(list(map(float, p[2:8]))).reshape(2, 3)
                edges.setdefault(group, []).append((M @ v.T).T + t)

    ids, gmap = None, {}
    if a.groups:
        if not a.plan: sys.exit("--groups needs --plan")
        plan = json.load(open(a.plan))
        ids = [pl["id"] for st in plan["sections"][0]["steps"] for pl in st]
        gmap = json.load(open(a.groups))
    def group_of(i):
        if ids is None: return "model"
        pid = ids[i]
        for g, pats in gmap.items():
            for pat in pats:
                if pid == pat or (pat.endswith("*") and pid.startswith(pat[:-1])): return g
        return "model"

    idx = 0
    for raw in sections[main_name]:
        p = raw.split()
        if p and p[0] == "1" and len(p) >= 15:
            f = list(map(float, p[2:14])); c = int(p[1])
            emit(" ".join(p[14:]), np.array([f[3:6], f[6:9], f[9:12]]), np.array(f[:3]), c, group_of(idx))
            idx += 1

    q = lambda arr: base64.b64encode(np.round(arr * 20).astype("<i2").tobytes()).decode()  # 0.05 LDU steps
    data = {"groups": {}}
    for (g, (hexc, alpha)), L in tris.items():
        arr = np.concatenate(L).reshape(-1, 3)
        data["groups"].setdefault(g, {"meshes": [], "edges": None})["meshes"].append(
            {"c": "#" + hexc, "a": alpha, "p": q(arr)})
    for g, L in edges.items():
        data["groups"].setdefault(g, {"meshes": [], "edges": None})["edges"] = {"p": q(np.concatenate(L).reshape(-1, 3))}

    html = TEMPLATE.read_text()
    html = (html.replace("__IMPORTMAP__", load_three(pathlib.Path(a.three_cache)))
                .replace("__TITLE__", a.title).replace("__SUBTITLE__", a.subtitle or f"{idx} parts")
                .replace("__DATA__", json.dumps(data)))
    pathlib.Path(a.out).write_text(html)
    ntri = sum(len(np.concatenate(L)) // 3 for L in tris.values())
    print(f"wrote {a.out}: {idx} placements, {ntri} triangles, {os.path.getsize(a.out)//1024} KB")


if __name__ == "__main__":
    main()
