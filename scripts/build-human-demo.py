"""Convert CC0 MakeHuman body + default rig to a compact demo mesh.
Usage: python scripts/build-human-demo.py /path/to/downloads
Inputs: base.obj, default.mhskel, default_weights.mhw (official MakeHuman).
Only the body group is exported; helpers and anatomical helper geometry are excluded.
"""
import json, sys
from pathlib import Path

src = Path(sys.argv[1])
vertices, faces, group = [], [], ''
for line in (src / 'base.obj').read_text().splitlines():
    if line.startswith('v '): vertices.append(list(map(float, line.split()[1:])))
    elif line.startswith('g '): group = line[2:]
    elif line.startswith('f ') and group == 'body':
        f = [int(x.split('/')[0])-1 for x in line.split()[1:]]
        for i in range(1, len(f)-1): faces.extend([f[0], f[i], f[i+1]])
used = sorted(set(faces)); remap = {v:i for i,v in enumerate(used)}
rig = json.loads((src / 'default.mhskel').read_text())
weights = json.loads((src / 'default_weights.mhw').read_text())['weights']
names = list(rig['bones']); floor = min(vertices[i][1] for i in used)
scale = 1.80 / (max(vertices[i][1] for i in used)-floor)
def point(p): return [round(p[0]*scale,6),round((p[1]-floor)*scale,6),round(p[2]*scale,6)]
def joint(name):
    ids = rig['joints'][name]
    return point([sum(vertices[i][a] for i in ids)/len(ids) for a in range(3)])
bones = [dict(name=n,parent=names.index(b['parent']) if b['parent'] else -1,head=joint(b['head']),tail=joint(b['tail'])) for n,b in rig['bones'].items()]
vw = [[] for _ in vertices]
for name, pairs in weights.items():
    if name not in names: continue
    for i,w in pairs: vw[i].append((names.index(name),w))
si, sw = [], []
for i in used:
    top = sorted(vw[i],key=lambda x:-x[1])[:4] or [(names.index('root'),1)]
    total = sum(w for _,w in top)
    si.extend([n for n,_ in top]+[0]*(4-len(top)))
    sw.extend([round(w/total,6) for _,w in top]+[0]*(4-len(top)))
out = dict(source='MakeHuman base mesh and default skeleton / CC0',positions=[x for i in used for x in point(vertices[i])],indices=[remap[i] for i in faces],skinIndices=si,skinWeights=sw,bones=bones)
dest = Path(__file__).resolve().parents[1] / 'assets/3d/human.json'
dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(json.dumps(out,separators=(',',':')))
print(f'{len(used)} vertices, {len(faces)//3} triangles, {len(bones)} bones; {dest.stat().st_size} bytes')
