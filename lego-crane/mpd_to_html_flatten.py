"""Flatten an LDraw MPD into coloured triangles + edge lines, grouped by placement id, as JSON-able arrays."""
import sys, os, re, json, struct, base64
import numpy as np
LIB = "/usr/share/ldraw"
mpd_path, plan_path, out = sys.argv[1:4]

# colours
COL = {}
for line in open(os.path.join(LIB, "LDConfig.ldr"), encoding="utf-8", errors="ignore"):
    m = re.search(r"!COLOUR\s+\S+\s+CODE\s+(\d+)\s+VALUE\s+#([0-9A-Fa-f]{6})\s+EDGE\s+#?([0-9A-Fa-f]{6}|\d+)(.*)", line)
    if m:
        a = re.search(r"ALPHA\s+(\d+)", m.group(4))
        COL[int(m.group(1))] = (m.group(2), m.group(3), int(a.group(1)) if a else 255)

# MPD sections
sections, cur = {}, None
for line in open(mpd_path, encoding="utf-8-sig"):
    if line.startswith("0 FILE "):
        cur = line[7:].strip().lower(); sections[cur] = []
    elif cur is not None:
        sections[cur].append(line)
main = next(iter(sections))

cache = {}
def lines_of(name):
    n = name.lower().replace("\\", "/")
    if n in sections: return sections[n]
    if n in cache: return cache[n]
    for sub in ("parts", "p", "models", "parts/s", "p/48"):
        p = os.path.join(LIB, sub, n)
        if os.path.exists(p):
            cache[n] = open(p, encoding="utf-8", errors="ignore").read().splitlines(); return cache[n]
        p2 = os.path.join(LIB, sub, os.path.basename(n))
        if os.path.exists(p2):
            cache[n] = open(p2, encoding="utf-8", errors="ignore").read().splitlines(); return cache[n]
    print("missing", name, file=sys.stderr); cache[n] = []; return []

def rgb(c, parent, edge=False):
    if c == 16: c = parent
    if c == 24:
        e = COL.get(parent, ("808080", "333333", 255))[1]
        return (e if not e.isdigit() else "333333", 255)
    v = COL.get(c)
    if not v: return ("ff00ff", 255)
    return (v[0], v[2])

tris, edges = {}, {}   # group -> list
def emit(name, M, t, colour, group, depth=0):
    for raw in lines_of(name):
        p = raw.split()
        if not p: continue
        k = p[0]
        if k == "1" and len(p) >= 15:
            c = int(p[1]); f = list(map(float, p[2:14]))
            m = np.array([[f[3], f[4], f[5]], [f[6], f[7], f[8]], [f[9], f[10], f[11]]])
            child = p[14] if len(p) == 15 else " ".join(p[14:])
            g = group
            if depth == 0 and name.lower() == main: g = None
            emit(child, M @ m, M @ np.array(f[:3]) + t, colour if c == 16 else c, g, depth + 1)
        elif k in ("3", "4") and group is not None:
            c = int(p[1]); v = np.array(list(map(float, p[2:2 + 3 * int(k)]))).reshape(-1, 3)
            w = (M @ v.T).T + t
            col = rgb(c, colour)
            L = tris.setdefault((group, col), [])
            L.append(w[[0, 1, 2]])
            if k == "4": L.append(w[[0, 2, 3]])
        elif k == "2" and group is not None:
            v = np.array(list(map(float, p[2:8]))).reshape(2, 3)
            edges.setdefault(group, []).append((M @ v.T).T + t)

# map placement index -> group via plan ids (order of type-1 lines in main section == plan order)
plan = json.load(open(plan_path))
ids = [pl["id"] for st in plan["sections"][0]["steps"] for pl in st]
def grp(i):
    if i in ("trolley",): return "trolley"
    if i.startswith("rope"): return "rope"
    if i.startswith("hook"): return "hook"
    order = ids.index(i); top = ids.index("tt-top")
    return "slew" if order >= top else "static"

idx = 0
for raw in sections[main]:
    p = raw.split()
    if p and p[0] == "1":
        c = int(p[1]); f = list(map(float, p[2:14]))
        m = np.array([[f[3], f[4], f[5]], [f[6], f[7], f[8]], [f[9], f[10], f[11]]])
        emit(p[14], m, np.array(f[:3]), c, grp(ids[idx]), 1); idx += 1

def b64(a, dt): return base64.b64encode(np.ascontiguousarray(a, dtype=dt).tobytes()).decode()
res = {"groups": {}}
for (g, (hexc, alpha)), L in tris.items():
    arr = np.concatenate(L).reshape(-1, 3)
    res["groups"].setdefault(g, {"meshes": [], "edges": None})["meshes"].append(
        {"c": "#" + hexc, "a": alpha, "n": len(arr), "p": b64(np.round(arr*20), "<i2")})
for g, L in edges.items():
    arr = np.concatenate(L).reshape(-1, 3)
    res["groups"].setdefault(g, {"meshes": [], "edges": None})["edges"] = {"n": len(arr), "p": b64(np.round(arr*20), "<i2")}
json.dump(res, open(out, "w"))
print({g: (sum(m["n"] for m in v["meshes"]) // 3, (v["edges"] or {}).get("n", 0) // 2) for g, v in res["groups"].items()}, os.path.getsize(out) // 1024, "KB")
