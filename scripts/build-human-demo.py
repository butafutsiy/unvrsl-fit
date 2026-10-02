"""Convert CC0 MakeHuman body + default rig to a compact demo mesh.
Usage: python scripts/build-human-demo.py /path/to/downloads
Inputs: base.obj, default.mhskel, default_weights.mhw (official MakeHuman).
Only the body group is exported; helpers and anatomical helper geometry are excluded.
"""
import json, sys, math
from pathlib import Path

src = Path(sys.argv[1])
vertices, faces, group = [], [], ''
for line in (src / 'base.obj').read_text().splitlines():
    if line.startswith('v '): vertices.append(list(map(float, line.split()[1:])))
    elif line.startswith('g '): group = line[2:]
    elif line.startswith('f ') and group == 'body':
        f = [int(x.split('/')[0])-1 for x in line.split()[1:]]
        for i in range(1, len(f)-1): faces.extend([f[0], f[i], f[i+1]])
# Apply CC0 male and muscular macro targets before calculating joints.
for target in ['caucasian-male-young.target', 'universal-male-young-maxmuscle-averageweight.target']:
    for line in (src / target).read_text().splitlines():
        if not line.strip() or line.startswith('#'): continue
        index, *delta = line.split()
        for axis in range(3): vertices[int(index)][axis] += float(delta[axis])
used = sorted(set(faces)); remap = {v:i for i,v in enumerate(used)}
rig = json.loads((src / 'default.mhskel').read_text())
weights = json.loads((src / 'default_weights.mhw').read_text())['weights']
names = list(rig['bones']); floor = min(vertices[i][1] for i in used)
scale = 1.80 / (max(vertices[i][1] for i in used)-floor)
def point(p):
    x,y,z=p[0]*scale,(p[1]-floor)*scale,p[2]*scale
    # Athletic silhouette; smoothly taper waist and broaden shoulder girdle.
    breadth=1 + .16*math.exp(-((y-1.42)/.19)**2) - .04*math.exp(-((y-1.08)/.12)**2)
    return [round(x*breadth,6),round(y,6),round(z,6)]
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
positions=[point(vertices[i]) for i in used]
def bulge(x,y,cx,cy,rx,ry):return math.exp(-((x-cx)/rx)**2-((y-cy)/ry)**2)
for p in positions:
    x,y,z=p
    # Continuous mesh relief for the pectoral and abdominal forms, no overlays.
    front=max(0,min(1,(z+.015)/.055))
    if abs(x)<.24 and 1.03<y<1.48:
        chest=sum(.041*bulge(x,y,c,1.365,.075,.054) for c in [-.097,.097])
        abdomen=sum(.010*bulge(x,y,c,level,.034,.026) for c in [-.036,.036] for level in [1.14,1.205,1.27])
        p[2]+=front*(chest+abdomen)
    # Broaden limb cross-sections along the existing skeleton.
    for side in ['L','R']:
        for name,amount in [('upperarm01.',.5),('lowerarm01.',.20),('upperleg01.',.25),('lowerleg01.',.2)]:
            bone=next((b for b in bones if b['name']==name+side),None)
            if not bone:continue
            head=bone['head']; tail=bone['tail']
            # The first segment is followed by a second twist segment.
            second=next((b for b in bones if b['name']==name.replace('01','02')+side),None)
            if second:tail=second['tail']
            d=[tail[a]-head[a] for a in range(3)];length=sum(v*v for v in d)
            t=sum((p[a]-head[a])*d[a] for a in range(3))/length
            if not 0<t<1:continue
            center=[head[a]+t*d[a] for a in range(3)];rad=[p[a]-center[a] for a in range(3)]
            radius=math.sqrt(sum(v*v for v in rad))
            limit=.10 if 'arm' in name else .14
            if radius<limit:
                growth=amount*math.sin(math.pi*t)**2
                for a in range(3):p[a]+=rad[a]*growth
    for a in range(3):p[a]=round(p[a],6)
out = dict(source='MakeHuman base mesh and default skeleton / CC0',positions=[x for p in positions for x in p],indices=[remap[i] for i in faces],skinIndices=si,skinWeights=sw,bones=bones)
dest = Path(__file__).resolve().parents[1] / 'assets/3d/human.json'
dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(json.dumps(out,separators=(',',':')))
print(f'{len(used)} vertices, {len(faces)//3} triangles, {len(bones)} bones; {dest.stat().st_size} bytes')
