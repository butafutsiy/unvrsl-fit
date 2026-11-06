#!/usr/bin/env python3
# UNVRSL FIT Anatomy Studio | Blender background builder
# Source Écorché model: CC BY-SA 4.0, based on BodyParts3D (CC BY 4.0)
# and Z-Anatomy by Gauthier Kervyn (CC BY-SA 4.0).
import bpy
import math
import json
import os
import sys
import argparse
from collections import defaultdict
from mathutils import Vector, Matrix
from mathutils.kdtree import KDTree

def args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--ecorche", required=True)
    p.add_argument("--human", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--preview", default="")
    p.add_argument("--no-rig", action="store_true")
    return p.parse_args(argv)

def v3(p):
    # source uses glTF Y-up / face +Z, Blender uses Z-up / face -Y
    return Vector((float(p[0]), -float(p[2]), float(p[1])))

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def coll(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent or bpy.context.scene.collection).children.link(c)
    return c

def move_obj(obj, destination):
    for c in tuple(obj.users_collection):
        c.objects.unlink(obj)
    destination.objects.link(obj)

def mat_plain(name, color, rough=.8, metal=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    bs=m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value=(*color,1)
    bs.inputs["Roughness"].default_value=rough
    bs.inputs["Metallic"].default_value=metal
    return m

def muscle_shader(label, attr_name=None, deep=False):
    name="UNVRSL | "+label+(" ["+attr_name+"]" if attr_name else "")
    m=bpy.data.materials.get(name)
    if m: return m
    m=mat_plain(name, (.72,.40,.34) if deep else (.79,.49,.40),.82)
    bs=m.node_tree.nodes.get("Principled BSDF")
    if "Subsurface Weight" in bs.inputs:
        bs.inputs["Subsurface Weight"].default_value=.08
    if "Subsurface" in bs.inputs:
        bs.inputs["Subsurface"].default_value=.08
    if "Coat Weight" in bs.inputs:
        bs.inputs["Coat Weight"].default_value=.055
    nodes=m.node_tree.nodes;links=m.node_tree.links
    if attr_name:
        a=nodes.new("ShaderNodeAttribute");a.attribute_name=attr_name;a.location=(-720,200)
        sep=nodes.new("ShaderNodeSeparateColor");sep.mode='RGB';sep.location=(-510,180)
        links.new(a.outputs["Color"],sep.inputs["Color"])
        subtract=nodes.new("ShaderNodeMath");subtract.operation="SUBTRACT";subtract.location=(-300,130)
        links.new(sep.outputs["Red"],subtract.inputs[0]);links.new(sep.outputs["Green"],subtract.inputs[1])
        ramp=nodes.new("ShaderNodeValToRGB");ramp.location=(-110,150)
        ramp.color_ramp.elements[0].position=.035
        ramp.color_ramp.elements[0].color=(.85,.77,.69,1)
        ramp.color_ramp.elements[1].position=.46
        ramp.color_ramp.elements[1].color=(.69,.32,.27,1) if deep else (.83,.46,.37,1)
        links.new(subtract.outputs[0],ramp.inputs["Fac"])
        links.new(ramp.outputs["Color"],bs.inputs["Base Color"])
    tex=nodes.new("ShaderNodeTexNoise");tex.inputs["Scale"].default_value=110.0
    tex.inputs["Detail"].default_value=1.0;tex.location=(-390,-290)
    bump=nodes.new("ShaderNodeBump");bump.location=(-90,-240)
    bump.inputs["Strength"].default_value=.08
    bump.inputs["Distance"].default_value=.0004
    links.new(tex.outputs["Fac"],bump.inputs["Height"])
    links.new(bump.outputs["Normal"],bs.inputs["Normal"])
    return m

def world_bounds(objects):
    coords=[]
    for obj in objects:
        if obj.type!='MESH': continue
        coords.extend((obj.matrix_world@Vector(p) for p in obj.bound_box))
    if not coords: raise RuntimeError("Écorché model import contains no meshes")
    return Vector((min(v.x for v in coords),min(v.y for v in coords),min(v.z for v in coords))),Vector((max(v.x for v in coords),max(v.y for v in coords),max(v.z for v in coords)))

def anatomy_layer(obj):
    layer=str(obj.get("layer","")).lower()
    if layer: return layer
    p=obj.parent
    while p:
        s=p.name.lower()
        if "superficial" in s: return "superficial muscles"
        if "deep" in s: return "deep muscles"
        if "skeleton" in s: return "skeleton"
        p=p.parent
    return "superficial muscles"

def import_anatomy(path, subdivisions, height):
    existing=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.abspath(path))
    objs=[o for o in bpy.data.objects if o not in existing]
    meshes=[o for o in objs if o.type=="MESH"]
    if not meshes: raise RuntimeError("Import yielded zero meshes")
    lower,upper=world_bounds(meshes)
    ext=upper-lower
    target_height=height
    scale=target_height/max(.01,ext.z)
    print("Écorché model bounds:",tuple(lower),tuple(upper),"scale",scale,flush=True)
    groups={"superficial muscles":subdivisions["01 | Surface anatomy"],
            "deep muscles":subdivisions["02 | Deep muscles"],
            "skeleton":subdivisions["03 | Bones and cartilages"]}
    layers=defaultdict(list)
    for obj in meshes:
        name=str(obj.get("name") or obj.name)
        layer=anatomy_layer(obj)
        if layer not in groups: layer="superficial muscles"
        obj.name=name
        # Bake imported glTF transform to mesh local coordinates.
        obj.data=obj.data.copy()
        original=obj.matrix_world.copy()
        obj.parent=None
        obj.data.transform(original)
        obj.matrix_world=Matrix.Identity(4)
        for v in obj.data.vertices:
            x,y,z=v.co
            # Small, deliberate silhouette stylisation for UNVRSL FIT
            taper=1.07 if z>lower.z+ext.z*.62 else 1.025
            v.co=((x-(lower.x+upper.x)*.5)*scale*taper,
                  (y-(lower.y+upper.y)*.5)*scale*.99,
                  (z-lower.z)*scale)
        obj.data.update()
        obj["original_anatomy_name"]=name
        obj["UNVRSL_category"]=layer
        obj["source_license"]="Écorché CC BY-SA 4.0"
        move_obj(obj,groups[layer])
        if layer=="skeleton":
            obj.data.materials.clear();obj.data.materials.append(mat_plain("UNVRSL | Ivory bone",(.86,.82,.75),.87))
            obj.hide_render=True;obj.hide_set(True)
        else:
            attr=obj.data.color_attributes[0].name if obj.data.color_attributes else None
            shader=muscle_shader("Deep tissue" if layer=="deep muscles" else "Muscle / tendon",attr,layer=="deep muscles")
            obj.data.materials.clear();obj.data.materials.append(shader)
            if layer=="deep muscles":
                obj.hide_render=True;obj.hide_set(True)
        layers[layer].append(obj)
    for o in objs:
        if o.type!="MESH" and o.name in bpy.data.objects and not o.children:
            bpy.data.objects.remove(o,do_unlink=True)
    print("Imported meshes:",len(meshes),"by layer:",{k:len(v) for k,v in layers.items()},flush=True)
    return layers

def make_rig(human, destination):
    bones=human["bones"]
    arm=bpy.data.armatures.new("UNVRSL | MakeHuman original skeleton")
    rig=bpy.data.objects.new("UNVRSL_RIG | MakeHuman",arm)
    destination.objects.link(rig)
    bpy.context.view_layer.objects.active=rig;rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    eb=[]
    childmap=defaultdict(list)
    for i,b in enumerate(bones):
        parent=int(b.get("parent",-1))
        if parent>=0: childmap[parent].append(i)
    heads=[v3(b["head"]) for b in bones]
    for i,b in enumerate(bones):
        e=arm.edit_bones.new(b["name"])
        e.head=heads[i]
        children=[j for j in childmap[i] if (heads[j]-heads[i]).length>.015]
        if children:
            j=min(children,key=lambda j:(heads[j]-heads[i]).length)
            direction=heads[j]-heads[i]
            e.tail=heads[i]+direction
        else:
            parent=int(b.get("parent",-1))
            dr=heads[i]-heads[parent] if parent>=0 else Vector((0,0,.08))
            if dr.length<.01: dr=Vector((0,0,.08))
            e.tail=heads[i]+dr.normalized()*min(.11,max(.03,dr.length*.33))
        if (e.tail-e.head).length<.005: e.tail=e.head+Vector((0,0,.035))
        eb.append(e)
    for i,b in enumerate(bones):
        parent=int(b.get("parent",-1))
        if parent>=0: eb[i].parent=eb[parent]
    bpy.ops.object.mode_set(mode="OBJECT")
    rig.show_in_front=True
    rig["bind_note"]="Provisional nearest-surface weights. Inspect shoulders and elbows before final animation."
    rig.select_set(False)
    print("Armature bones:",len(bones),flush=True)
    return rig

def transfer_weights(layers, human, rig):
    pos=human["positions"];inds=human["skinIndices"];weights=human["skinWeights"]
    pts=[v3(pos[i:i+3]) for i in range(0,len(pos),3)]
    kd=KDTree(len(pts))
    for i,p in enumerate(pts): kd.insert(p,i)
    kd.balance()
    names=[b["name"] for b in human["bones"]]
    total=0
    for layer in ("superficial muscles","deep muscles"):
        for j,obj in enumerate(layers[layer]):
            buckets=defaultdict(list)
            used=set()
            for vert in obj.data.vertices:
                _,near,_=kd.find(vert.co)
                start=near*4
                for i in range(4):
                    index=int(inds[start+i])
                    w=float(weights[start+i])
                    if index<0 or index>=len(names) or w<.035: continue
                    w=round(w*25)/25.
                    if w<=0: continue
                    buckets[(index,w)].append(vert.index)
                    used.add(index)
            groups={idx:obj.vertex_groups.new(name=names[idx]) for idx in sorted(used)}
            for (idx,w),vertex_ids in buckets.items():
                groups[idx].add(vertex_ids,w,"REPLACE")
            mod=obj.modifiers.new("UNVRSL | Provisional MakeHuman skinning","ARMATURE")
            mod.object=rig
            mod.use_deform_preserve_volume=True
            total+=len(obj.data.vertices)
            if (j+1)%60==0:
                print("Retargeting",layer,j+1,"/",len(layers[layer]),flush=True)
    print("Approximate skinning vertices:",total,flush=True)

def cloth(name,color):
    return mat_plain(name,color,.9)
def shorts(destination,height):
    dark=cloth("UNVRSL | Athletic shorts / black",(.025,.024,.03))
    seam=cloth("UNVRSL | Shorts waistband",(.015,.014,.02))
    out=[]
    def cylinder(name,r1,r2,depth,z,x,material):
        bpy.ops.mesh.primitive_cone_add(vertices=64,radius1=r2,radius2=r1,depth=depth,location=(x,0,z))
        o=bpy.context.object;o.name=name
        move_obj(o,destination);o.data.materials.append(material)
        bevel=o.modifiers.new("Soft fabric edges","BEVEL");bevel.width=.008;bevel.segments=2
        o.modifiers.new("Soft normals","WEIGHTED_NORMAL")
        out.append(o);return o
    h=height/1.8
    cylinder("Wardrobe | Shorts / hips",.20*h,.24*h,.24*h,.91*h,0,dark)
    cylinder("Wardrobe | Shorts / left leg",.12*h,.145*h,.21*h,.76*h,-.124*h,dark)
    cylinder("Wardrobe | Shorts / right leg",.12*h,.145*h,.21*h,.76*h,.124*h,dark)
    cylinder("Wardrobe | Elastic waistband",.205*h,.208*h,.05*h,1.038*h,0,seam)
    return out

def studio(scene, h, destination):
    world=bpy.data.worlds.new("UNVRSL | Studio warm environment")
    world.use_nodes=True
    world.node_tree.nodes.get("Background").inputs["Color"].default_value=(.85,.82,.78,1)
    world.node_tree.nodes.get("Background").inputs["Strength"].default_value=.6
    scene.world=world
    floor=mat_plain("UNVRSL | Milk white matte",(.91,.87,.83),.96)
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.012))
    obj=bpy.context.object;obj.name="Studio | Infinite beige floor";move_obj(obj,destination);obj.data.materials.append(floor)
    def light(name,loc,power,size,color):
        data=bpy.data.lights.new(name,"AREA");data.energy=power;data.shape="DISK";data.size=size;data.color=color
        obj=bpy.data.objects.new(name,data);destination.objects.link(obj);obj.location=loc
        target=Vector((0,0,h*.56));obj.rotation_euler=(target-obj.location).to_track_quat('-Z','Y').to_euler()
    light("Studio | Key softbox",(2.0,-2.5,3.5),650,3.0,(1,.96,.92))
    light("Studio | Fill softbox",(-1.9,-1.8,2.4),360,2.4,(1,.96,.94))
    light("Studio | Rim",(-1.2,2.2,2.9),800,2.2,(1,.95,.89))
    camera_data=bpy.data.cameras.new("UNVRSL | Portrait 9:16")
    camera=bpy.data.objects.new("Camera | Anatomy reel",camera_data)
    destination.objects.link(camera)
    camera.location=(2.0,-3.8,h*.72)
    target=Vector((0,0,h*.55))
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    camera_data.type="ORTHO";camera_data.ortho_scale=2.18*h/1.8
    scene.camera=camera
    scene.render.resolution_x=1080;scene.render.resolution_y=1920
    scene.render.resolution_percentage=100
    scene.render.film_transparent=False
    scene.render.image_settings.file_format="PNG";scene.render.image_settings.color_mode="RGBA"
    try:scene.render.engine="BLENDER_EEVEE_NEXT"
    except:scene.render.engine="BLENDER_EEVEE"
    scene.render.film_transparent=False
    scene.view_settings.view_transform="AgX" if "AgX" in [e.identifier for e in bpy.types.ColorManagedViewSettings.bl_rna.properties["view_transform"].enum_items] else "Standard"
    scene.camera.data.lens=48
    scene.render.fps=30;scene.frame_start=1;scene.frame_end=240
    # Camera makes one full rotation as an editable Blender animation.
    orbit=bpy.data.objects.new("ANIMATION | Turntable 360deg",None);destination.objects.link(orbit)
    camera.parent=orbit;camera.matrix_parent_inverse=Matrix.Identity(4)
    orbit.rotation_euler.z=0;orbit.keyframe_insert(data_path="rotation_euler",frame=1)
    orbit.rotation_euler.z=math.tau;orbit.keyframe_insert(data_path="rotation_euler",frame=241)
    if orbit.animation_data and orbit.animation_data.action:
        action=orbit.animation_data.action
        try:
            for fc in action.fcurves:
                for kp in fc.keyframe_points:kp.interpolation="LINEAR"
        except AttributeError: pass
    scene.frame_set(1)
    return camera

def add_notes(h):
    contents="""UNVRSL FIT | ANATOMY STUDIO / BLENDER

СЦЕНА
- 01 | Surface anatomy: отдельные мышцы (включены).
- 02 | Deep muscles: глубокие мышцы (выключены в рендере).
- 03 | Bones and cartilages: скелет (выключен в рендере).
- 04 | Shorts: чёрные шорты; это процедурная геометрия, не cloth simulation.
- 05 | MakeHuman rig: наш риг из UNVRSL FIT, перенос весов приближённый.
- 06 | Studio: свет, камера 1080 x 1920 и анимированная орбита.

ВИДЕО
- Frames 1-240: вращение камеры 360°; 30 fps (8 секунд).
- Render > Render Animation, output folder задаётся в Output Properties.
- Выделяй любую мышцу по имени в Outliner, меняй материал на Highlight.
- Для фокуса выбирай ракурс и меняй camera.data.ortho_scale.

ОГРАНИЧЕНИЯ
- Это первая интеграция анатомической модели с MakeHuman-ригом, а НЕ проверенная биомеханическая симуляция.
- Vertex weights перенесены приближённо с поверхности тела. Обязательно проверить плечо, лопатку, локоть, таз и колено при изгибах.
- Шорты пока статичные; движения ног требуют дополнительного рига одежды.
- Модель Écorché не содержит готовых корректирующих blend shapes для физиологического сокращения.
- Использовать как анатомический визуал и основу для доработки, не как медицински точную динамическую модель.

ЛИЦЕНЗИЯ МОДЕЛИ: CC BY-SA 4.0
Écorché (github.com/Charleeh/ecorche), CC BY-SA 4.0.
Based on BodyParts3D, © The Database Center for Life Science, CC BY 4.0,
and Z-Anatomy by Gauthier Kervyn, CC BY-SA 4.0.
Derivative meshes shared or redistributed must comply with CC BY-SA 4.0.
MakeHuman base rig/skin: CC0 (see UNVRSL FIT assets/3d/NOTICE.md).
Three.js is not part of this Blender file.
"""
    tb=bpy.data.texts.new("READ ME | UNVRSL FIT Anatomy");tb.write(contents)
    bpy.context.scene["UNVRSL_STUDIO"]="9:16 | 1080 x 1920 | Anatomy / 3D"
    bpy.context.scene["LICENSE"]="Écorché CC BY-SA 4.0"
    bpy.context.scene["WARNING"]="Retarget is provisional. Validate before motion renders."

def main():
    cfg=args();reset()
    with open(cfg.human,"r",encoding="utf-8") as f:human=json.load(f)
    positions=human["positions"]
    ys=positions[1::3]
    height=max(ys)-min(ys)
    if height<1 or height>3:raise RuntimeError("Unexpected MakeHuman height "+str(height))
    master=coll("UNVRSL | ANATOMY VIDEO STUDIO")
    names=["01 | Surface anatomy","02 | Deep muscles","03 | Bones and cartilages","04 | Athletic shorts","05 | MakeHuman rig","06 | Studio"]
    collections={name:coll(name,master) for name in names}
    layers=import_anatomy(cfg.ecorche,collections,height)
    rig=make_rig(human,collections["05 | MakeHuman rig"])
    if not cfg.no_rig:transfer_weights(layers,human,rig)
    shorts(collections["04 | Athletic shorts"],height)
    camera=studio(bpy.context.scene,height,collections["06 | Studio"])
    add_notes(height)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    bpy.context.scene.render.filepath="//renders/UNVRSL_anatomy_"
    os.makedirs(os.path.dirname(os.path.abspath(cfg.output)),exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(cfg.output))
    print("Saved Blender studio:",cfg.output,flush=True)
    if cfg.preview:
        bpy.context.scene.render.resolution_percentage=50
        bpy.context.scene.render.image_settings.file_format='PNG'
        bpy.context.scene.render.filepath=os.path.abspath(cfg.preview)
        bpy.ops.render.render(write_still=True)
        bpy.context.scene.render.resolution_percentage=100
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(cfg.output))
        print("Saved preview:",cfg.preview,flush=True)

if __name__=="__main__":
    main()
