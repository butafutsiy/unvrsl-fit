import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const $=s=>document.querySelector(s), stage=$('#stage');
let renderer, controls, body, bones, skeleton, scene, camera, model;
let phase=.08, playing=!matchMedia('(prefers-reduced-motion: reduce)').matches, speed=1, highlight=true, selected='biceps', last=0;
const arms=[], colors=[], restPositions=[];
const vec=a=>new T.Vector3(...a), clamp=T.MathUtils.clamp;
function capsuleMaterial(color,metalness=0){return new T.MeshStandardMaterial({color,roughness:metalness?.3:.65,metalness})}
const steel=capsuleMaterial('#999eac',.8), rubber=capsuleMaterial('#1f2229',.1), accent=capsuleMaterial('#bf9aed',.4);
function dumbbell(){
 const g=new T.Group();
 function cyl(radius,length,x,material){const m=new T.Mesh(new T.CylinderGeometry(radius,radius,length,32),material);m.rotation.z=Math.PI/2;m.position.x=x;m.castShadow=true;g.add(m)}
 cyl(.011,.15,0,steel);
 for(const s of [-1,1]){cyl(.066,.049,s*.088,rubber);cyl(.043,.003,s*.114,steel);cyl(.015,.014,s*.12,accent)}
 return g;
}
function updateColors(){
 if(!body)return;
 const neutral=new T.Color('#b9b9b9'), shorts=new T.Color('#292b3e'), pink=new T.Color('#fa4265'), orange=new T.Color('#f1a458');
 for(let i=0;i<restPositions.length/3;i++){
  const p=new T.Vector3().fromArray(restPositions,i*3), base=neutral;
  let c=base.clone();
  if(highlight)for(const a of arms){
   const d=p.clone().sub(a.shoulder), t=d.dot(a.upperDir)/a.upperLen;
   const center=a.shoulder.clone().addScaledVector(a.upperDir,t*a.upperLen);
   const dist=p.distanceTo(center), front=p.z-center.z;
   const lateral=d.x*a.upperDir.y-d.y*a.upperDir.x;
   const ellipse=((t-.55)/.32)**2+(lateral/.062)**2;
   if(ellipse<1&&dist<.083&&front>.008){
    const fade=Math.min(1,(1-ellipse)*5,(front-.008)*50);
    c.lerp(pink,clamp(fade,0,1)*(selected==='biceps'?1:.4));
   }
   const f=p.clone().sub(a.elbow), ft=f.dot(a.foreDir)/a.foreLen, fc=a.elbow.clone().addScaledVector(a.foreDir,ft*a.foreLen);
   if(selected==='forearm'&&ft>.15&&ft<.85&&p.distanceTo(fc)<.075)c.lerp(orange,.9);
  }
  c.toArray(colors,i*3);
 }
 body.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
}
function createHuman(data){
 model=new T.Group();scene.add(model);
 const geo=new T.BufferGeometry();restPositions.push(...data.positions);
 geo.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));geo.setIndex(data.indices);geo.computeVertexNormals();
 geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(data.skinIndices,4));geo.setAttribute('skinWeight',new T.Float32BufferAttribute(data.skinWeights,4));
 bones=data.bones.map(b=>{const bone=new T.Bone();bone.name=b.name;bone.position.copy(vec(b.head));if(b.parent>=0)bone.position.sub(vec(data.bones[b.parent].head));return bone});
 data.bones.forEach((b,i)=>{if(b.parent>=0)bones[b.parent].add(bones[i])});
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.66,metalness:.05});
 // Outfit boundaries in rest coordinates stay clean as the surface deforms.
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 outfitPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\noutfitPosition=position;');
  shader.fragmentShader='varying vec3 outfitPosition;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float shorts=step(.83,outfitPosition.y)*(1.-step(1.025,outfitPosition.y));
   float top=0.;
   // Soft anatomical contour shading in rest space, following the mesh.
   float front=smoothstep(.035,.085,outfitPosition.z);
   float x=abs(outfitPosition.x), y=outfitPosition.y;
   float torso=(1.-smoothstep(.15,.19,x))*front;
   float pecCurve=1.317+.035*pow(x/.16,2.);
   float pec=exp(-pow((y-pecCurve)/.006,2.))*smoothstep(.014,.03,x);
   float sternum=exp(-pow(x/.005,2.))*smoothstep(1.30,1.34,y)*(1.-smoothstep(1.42,1.46,y));
   float absZone=smoothstep(1.08,1.10,y)*(1.-smoothstep(1.27,1.30,y))*(1.-smoothstep(.058,.082,x));
   float abdominal=exp(-pow(x/.0045,2.));
   abdominal+=.55*exp(-pow((y-1.115)/.004,2.))+.55*exp(-pow((y-1.18)/.004,2.))+.55*exp(-pow((y-1.245)/.004,2.));
   diffuseColor.rgb*=1.-torso*(.20*pec+.15*sternum+.18*absZone*abdominal);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.025),max(shorts,top));
  `);
 };
 body=new T.SkinnedMesh(geo,material);
 data.bones.forEach((b,i)=>{if(b.parent<0)body.add(bones[i])});
 model.add(body);skeleton=new T.Skeleton(bones);body.bind(skeleton);body.normalizeSkinWeights();body.castShadow=true;body.receiveShadow=false;body.frustumCulled=false;
 const lookup=n=>data.bones.find(b=>b.name===n), bone=n=>bones[data.bones.findIndex(b=>b.name===n)];
 for(const side of ['L','R']){
  const shoulder=vec(lookup('upperarm01.'+side).head), elbow=vec(lookup('lowerarm01.'+side).head), wrist=vec(lookup('wrist.'+side).head);
  const upperDir=elbow.clone().sub(shoulder).normalize(), foreDir=wrist.clone().sub(elbow).normalize();
  const upperQ=new T.Quaternion().setFromUnitVectors(upperDir,new T.Vector3(side==='L'?.07:-.07,-1,.02).normalize());
  bone('upperarm01.'+side).quaternion.copy(upperQ);
  const a={side,shoulder,elbow,upperDir,foreDir,upperLen:elbow.distanceTo(shoulder),foreLen:wrist.distanceTo(elbow),upperQ,lower:bone('lowerarm01.'+side),wrist:bone('wrist.'+side)};
  // Neutral wrist follows the forearm; digits are posed around the handle.
  const handDir=vec(lookup('finger3-1.'+side).head).sub(wrist).normalize();
  const across=vec(lookup('finger5-1.'+side).head).sub(vec(lookup('finger2-1.'+side).head)).normalize();
  across.addScaledVector(handDir,-across.dot(handDir)).normalize();
  const normal=across.clone().cross(handDir).normalize();
  a.handBasis=new T.Matrix4().makeBasis(across,handDir,normal);
  for(let finger=2;finger<=5;finger++)for(let part=1;part<=3;part++){
   const b=bone(`finger${finger}-${part}.${side}`);
   if(b)b.quaternion.setFromAxisAngle(across,(side==='L'?1:-1)*[0,1.35,1.5,1.0][part]);
  }
  for(let part=1;part<=3;part++){
   const b=bone(`finger1-${part}.${side}`);
   if(b)b.quaternion.setFromAxisAngle(handDir,(side==='L'?1:-1)*.6);
  }
  a.weight=dumbbell();model.add(a.weight);
  arms.push(a);
 }
 updateColors();
}
function pose(){
 const flex=.5-.5*Math.cos(phase*Math.PI*2), angle=T.MathUtils.degToRad(8+flex*112);
 for(const a of arms){
  const worldDir=new T.Vector3(0,-Math.cos(angle),Math.sin(angle));
  const parentDir=worldDir.applyQuaternion(a.upperQ.clone().invert());
  a.lower.quaternion.setFromUnitVectors(a.foreDir,parentDir);
  const handWorld=new T.Vector3(0,-Math.cos(angle),Math.sin(angle));
  const acrossWorld=new T.Vector3(a.side==='L'?1:-1,0,0);
  const normalWorld=acrossWorld.clone().cross(handWorld).normalize();
  const targetBasis=new T.Matrix4().makeBasis(acrossWorld,handWorld,normalWorld);
  const wristWorldQ=new T.Quaternion().setFromRotationMatrix(targetBasis.multiply(a.handBasis.clone().invert()));
  a.wrist.parent.updateWorldMatrix(true,false);
  a.wrist.quaternion.copy(a.wrist.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(wristWorldQ));
  a.wrist.updateWorldMatrix(true,false);
  const palm=new T.Vector3(0,Math.sin(angle),Math.cos(angle));
  a.weight.position.copy(a.wrist.getWorldPosition(new T.Vector3())).addScaledVector(handWorld,.069).addScaledVector(palm,-.018);
 }
 $('#phase').textContent=phase<.5?'Сгибание':'Опускание';$('#angle').textContent=Math.round(T.MathUtils.radToDeg(angle))+'°';
 $('#progress').value=Math.round(phase*1000);$('#progress-label').textContent=Math.round(phase*100)+'%';
}
function resize(){if(!renderer)return;const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
function cameraView(name){
 const distance=3.45;
 const positions={front:[.25,1.08,distance],side:[distance,1.05,.12],back:[.2,1.08,-distance]};
 camera.position.set(...positions[name]);controls.target.set(0,.91,0);controls.update();
 document.querySelectorAll('[data-camera]').forEach(b=>b.classList.toggle('selected',b.dataset.camera===name));
}
function playLabel(){const p=$('#play');p.textContent=playing?'Ⅱ':'▶';p.setAttribute('aria-label',playing?'Пауза':'Продолжить');p.setAttribute('aria-pressed',String(playing))}
function animate(t){
 const dt=last?Math.min((t-last)/1000,.05):0;last=t;
 if(!document.hidden){if(playing)phase=(phase+dt*speed/5)%1;pose();controls.update();renderer.render(scene,camera)}
}
async function init(){
 try{
  renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  stage.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','3D-модель человека с гантелями');
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();playing=false;playLabel();$('#loading').textContent='3D-показ приостановлен. Обнови страницу, чтобы продолжить.';$('#loading').classList.remove('hidden')});
  scene=new T.Scene();camera=new T.PerspectiveCamera(37,1,.05,40);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=1.5;controls.maxDistance=4.5;controls.minPolarAngle=.25;controls.maxPolarAngle=Math.PI*.7;
  scene.add(new T.HemisphereLight('#ffffff','#555555',1.7));
  const key=new T.DirectionalLight('#ffffff',3.0);key.position.set(2,4,3);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-2;key.shadow.camera.right=2;key.shadow.camera.top=3;key.shadow.camera.bottom=-2;key.shadow.normalBias=.015;scene.add(key);
  const rim=new T.DirectionalLight('#ffffff',1.8);rim.position.set(-2,2,-2);scene.add(rim);
  const floor=new T.Mesh(new T.CircleGeometry(1.1,80),new T.MeshStandardMaterial({color:'#24272c',roughness:.9}));floor.rotation.x=-Math.PI/2;floor.position.y=-.012;floor.receiveShadow=true;scene.add(floor);
  const ring=new T.Mesh(new T.RingGeometry(1.06,1.066,100),new T.MeshBasicMaterial({color:'#575768',side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-.01;scene.add(ring);
  const response=await fetch('./assets/3d/human.json?v=460');if(!response.ok)throw Error('model unavailable');createHuman(await response.json());
  resize();cameraView('front');pose();$('#loading').classList.add('hidden');
  ['#play','#speed','#progress'].forEach(s=>$(s).disabled=false);playLabel();
  new ResizeObserver(resize).observe(stage);renderer.setAnimationLoop(animate);
  window.__movementLab={ready:true,renderer,scene,camera,body,arms,get phase(){return phase},get playing(){return playing}};
 }catch(e){console.error(e);$('#loading').textContent='Не удалось открыть 3D. Проверь интернет и поддержку WebGL, затем обнови страницу.'}
}
$('#play').onclick=()=>{playing=!playing;playLabel()};$('#speed').onclick=()=>{speed=speed===1?.5:speed===.5?.25:1;$('#speed').textContent=speed+'×'};
$('#progress').oninput=e=>{phase=Number(e.target.value)/1000;playing=false;playLabel();pose()};
$('#highlight').onchange=e=>{highlight=e.target.checked;updateColors()};
document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>cameraView(b.dataset.camera));
document.querySelectorAll('[data-muscle]').forEach(b=>b.onclick=()=>{selected=b.dataset.muscle;document.querySelectorAll('[data-muscle]').forEach(x=>x.classList.toggle('active',x===b));$('#muscle-note').textContent=selected==='biceps'?'Красным выделена приблизительная область бицепса на поверхности модели.':'Оранжевым выделена область предплечий. Подсветка не разделяет отдельные глубокие мышцы.';updateColors()});
document.addEventListener('visibilitychange',()=>{last=0});
init();
