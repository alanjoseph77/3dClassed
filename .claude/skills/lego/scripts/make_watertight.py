#!/usr/bin/env python3
"""Rebuild an STL as a guaranteed-watertight solid (voxelise -> fill -> marching cubes), optionally scaled.

Usage: python make_watertight.py IN.stl OUT.stl [--scale 0.5] [--pitch 0.25]
Needs: pip install trimesh scipy scikit-image
--pitch is the voxel size in mm AFTER scaling; features thinner than ~2 pitches may be lost.
"""
import argparse, numpy as np, trimesh
from scipy import ndimage
from skimage import measure

ap = argparse.ArgumentParser(); ap.add_argument("inp"); ap.add_argument("out")
ap.add_argument("--scale", type=float, default=1.0); ap.add_argument("--pitch", type=float, default=0.25)
a = ap.parse_args()
m = trimesh.load(a.inp, force="mesh"); m.apply_scale(a.scale)
# rasterise the surface by dense barycentric sampling (low memory, chunked)
lo = m.bounds[0] - 2 * a.pitch
dims = np.ceil((m.bounds[1] - lo) / a.pitch).astype(int) + 3
grid = np.zeros(dims, bool)
T = m.triangles
step = a.pitch / 2
for i in range(0, len(T), 2000):
    tri = T[i:i + 2000]
    edge = np.maximum(np.linalg.norm(tri[:, 1] - tri[:, 0], axis=1), np.linalg.norm(tri[:, 2] - tri[:, 0], axis=1))
    edge = np.maximum(edge, np.linalg.norm(tri[:, 2] - tri[:, 1], axis=1))
    for k in np.unique(np.ceil(edge / step).astype(int)):
        sel = tri[np.ceil(edge / step).astype(int) == k]
        n = max(k, 1)
        u, w = np.meshgrid(np.arange(n + 1), np.arange(n + 1)); keep = (u + w) <= n
        bu, bw = (u[keep] / n)[None, :, None], (w[keep] / n)[None, :, None]
        pts = sel[:, None, 0] + bu * (sel[:, None, 1] - sel[:, None, 0]) + bw * (sel[:, None, 2] - sel[:, None, 0])
        idx = np.floor((pts.reshape(-1, 3) - lo) / a.pitch).astype(int)
        grid[idx[:, 0], idx[:, 1], idx[:, 2]] = True
grid = np.pad(grid, 2)
solid = ndimage.binary_fill_holes(ndimage.binary_closing(grid, iterations=1))
verts, faces, _, _ = measure.marching_cubes(solid.astype(np.uint8), 0.5)
verts = (verts - 2) * a.pitch + lo + a.pitch / 2   # back to mm
out = trimesh.Trimesh(verts, faces, process=True)
out.apply_translation([0, 0, -out.bounds[0][2]])
trimesh.repair.fix_normals(out)
out.export(a.out)
print(f"{a.out}: {len(out.faces)} faces, size {np.round(out.extents,1).tolist()} mm, watertight={out.is_watertight}, volume={out.volume/1000:.1f} cm3")
