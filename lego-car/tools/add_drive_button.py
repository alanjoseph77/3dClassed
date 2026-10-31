"""Add a Drive button to a viewer made by .claude/skills/lego/scripts/mpd_to_html.py:
spins the 'wheels-front' / 'wheels-rear' groups around their real axles.
Usage: python add_drive_button.py sports-car.html"""
import sys
p = sys.argv[1]; s = open(p).read()
s = s.replace('<button id="spin">⟳ Spin</button>', '<button id="drive">▶ Drive</button><button id="spin">⟳ Spin</button>', 1)
extra = '''
// --- car extras: wheels spin around their real axles (LDraw axle centres: y=-18, z=-80 front / +60 rear) ---
const {groups:Gs}=window.MODEL, pivots=[];
for(const [name,zc] of [["wheels-front",-80],["wheels-rear",60]]){const g=Gs[name];if(!g)continue;
  const pv=new THREE.Group();pv.position.set(0,18,-zc);root.add(pv);pv.add(g);g.position.set(0,-18,zc);pivots.push(pv)}
let driving=false;$("drive").onclick=()=>{driving=$("drive").classList.toggle("on");$("drive").textContent=driving?"■ Stop":"▶ Drive"};
let last=performance.now();
renderer.setAnimationLoop(now=>{const dt=Math.min(.1,(now-last)/1000);last=now;
  if(driving)pivots.forEach(p=>p.rotation.x+=dt*6);
  ctl.update();renderer.render(scene,cam)});
'''
anchor = "renderer.setAnimationLoop(()=>{ctl.update();renderer.render(scene,cam)});"
assert s.count(anchor) == 1, "viewer template changed"
open(p, "w").write(s.replace(anchor, extra))
print("added Drive button to", p)
