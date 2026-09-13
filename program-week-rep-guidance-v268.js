'use strict';
(()=>{
  const W=window,D=document,REV=380;
  if(W.__unvrslProgramWeekRepGuidanceV380)return;
  W.__unvrslProgramWeekRepGuidanceV380=true;
  W.__unvrslProgramWeekRepGuidanceV268=true;
  W.__unvrslProgramIntensityRepGuidanceV269=true;

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const ui=()=>{try{return typeof programUi!=='undefined'?programUi:null}catch(_){return null}};
  const program=id=>{try{return typeof programById==='function'?programById(id):(state()?.programs||[]).find(p=>String(p?.id)===String(id))||null}catch(_){return null}};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};
  const PRESETS=[
    {h:65,base:[12,15],iso:[15,20]},
    {h:70,base:[10,12],iso:[12,15]},
    {h:75,base:[8,10],iso:[12,15]},
    {h:80,base:[6,8],iso:[10,12]},
    {h:85,base:[5,7],iso:[8,12]},
    {h:88,base:[4,6],iso:[8,10]},
    {h:90,base:[3,5],iso:[6,10]},
    {h:95,base:[2,4],iso:[6,8]},
    {h:101,base:[1,3],iso:[4,6]}
  ];
  const label=r=>r?.[0]===r?.[1]?String(r?.[0]??'–'):`${r?.[0]??'–'}–${r?.[1]??'–'}`;
  function normalizeBand(a,b){let lo=N(a),hi=N(b);if(lo==null||hi==null)return null;if(lo>0&&lo<=1)lo*=100;if(hi>0&&hi<=1)hi*=100;return[Math.min(clamp(lo,40,100),clamp(hi,40,100)),Math.max(clamp(lo,40,100),clamp(hi,40,100))]}
  function liveBand(){const a=D.getElementById('pi380Min'),b=D.getElementById('pi380Max');return a&&b?normalizeBand(a.value,b.value):null}
  function storedBand(p,wi){const w=p?.weeks?.[Number(wi)];return w?normalizeBand(w.intensityMin??w.weekIntensityMin,w.intensityMax??w.weekIntensityMax):null}
  function defaultsFromBand(band){const mid=((band?.[0]??70)+(band?.[1]??75))/2,row=PRESETS.find(x=>mid<=x.h)||PRESETS.at(-1);return{base:row.base.slice(),iso:row.iso.slice()}}
  function profile(p,wi,useLive=true){const w=p?.weeks?.[Number(wi)];if(!w)return null;const band=(useLive?liveBand():null)||storedBand(p,wi)||[70,75],d=defaultsFromBand(band),manual=w.repGuidanceManual===true,base=manual?[N(w.baseRepMin)??d.base[0],N(w.baseRepMax)??d.base[1]]:d.base,iso=manual?[N(w.isolationRepMin)??d.iso[0],N(w.isolationRepMax)??d.iso[1]]:d.iso;return{band,base:[Math.min(...base),Math.max(...base)],iso:[Math.min(...iso),Math.max(...iso)],manual}}
  W.unvrslWeekRepGuidanceV380=profile;

  function style(){if(D.getElementById('week-rep-guidance-v380-style'))return;const s=D.createElement('style');s.id='week-rep-guidance-v380-style';s.textContent=`.wrg380{margin-top:12px;padding:12px;border-radius:16px;background:#1a1a1d;border:1px solid #303034}.wrg380-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.wrg380-head span{color:var(--green);font-size:11px;font-weight:800}.wrg380-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.wrg380-grid .field{margin:0}.wrg380-mode{display:flex;gap:4px;background:#26262a;padding:3px;border-radius:11px}.wrg380-mode button{padding:7px 9px;border-radius:8px;color:#929298;font-size:11px;font-weight:800}.wrg380-mode button.on{background:#3a3a3f;color:#fff}.wrg380-note{margin-top:8px;color:#85858b;font-size:11px;line-height:1.4}`;D.head.appendChild(s)}
  function context(){const u=ui(),p=u?.pid?program(u.pid):null,wi=Number(u?.week)||0;return{p,wi,w:p?.weeks?.[wi]||null}}
  function setFields(pr){if(!pr)return;const set=(id,v)=>{const el=D.getElementById(id);if(el&&D.activeElement!==el)el.value=v};set('wrg380BaseMin',pr.base[0]);set('wrg380BaseMax',pr.base[1]);set('wrg380IsoMin',pr.iso[0]);set('wrg380IsoMax',pr.iso[1]);const pct=D.getElementById('wrg380Pct');if(pct)pct.textContent=`${String(pr.band[0]).replace('.',',')}–${String(pr.band[1]).replace('.',',')}%`;D.querySelectorAll('[data-wrg380-mode]').forEach(b=>b.classList.toggle('on',b.dataset.wrg380Mode===(pr.manual?'manual':'auto')))}
  W.programWeekRepModeV380=mode=>{const {p,wi,w}=context();if(!p||!w)return;w.repGuidanceManual=mode==='manual';const pr=profile(p,wi,true);setFields(pr)};
  function inject(){style();const {p,wi,w}=context(),card=D.querySelector('#sheet .pi380-week');if(!p||!w||!card)return;let box=card.querySelector('.wrg380');const pr=profile(p,wi,true);if(!box){box=D.createElement('div');box.className='wrg380';box.innerHTML=`<div class="wrg380-head"><b>Рекомендуемые повторы</b><div class="wrg380-mode"><button type="button" data-wrg380-mode="auto" onclick="programWeekRepModeV380('auto')">Авто</button><button type="button" data-wrg380-mode="manual" onclick="programWeekRepModeV380('manual')">Вручную</button></div></div><div id="wrg380Pct" class="muted small" style="margin-top:5px"></div><div class="wrg380-grid"><div class="field"><label>База от</label><input id="wrg380BaseMin" type="number" min="1" max="50"></div><div class="field"><label>до</label><input id="wrg380BaseMax" type="number" min="1" max="50"></div><div class="field"><label>Изоляция от</label><input id="wrg380IsoMin" type="number" min="1" max="50"></div><div class="field"><label>до</label><input id="wrg380IsoMax" type="number" min="1" max="50"></div></div><div class="wrg380-note">Используется только как рекомендация для STANDARD. UNVRSL, SLDR, Drop Set и FST-7 используют собственные настройки повторов.</div>`;card.appendChild(box);['wrg380BaseMin','wrg380BaseMax','wrg380IsoMin','wrg380IsoMax'].forEach(id=>D.getElementById(id)?.addEventListener('input',()=>{w.repGuidanceManual=true;D.querySelectorAll('[data-wrg380-mode]').forEach(b=>b.classList.toggle('on',b.dataset.wrg380Mode==='manual'))},{passive:true}))}setFields(pr)}
  function saveReps(p,wi){const w=p?.weeks?.[Number(wi)];if(!w)return;const pr=profile(p,wi,true);if(w.repGuidanceManual===true){let a=N(D.getElementById('wrg380BaseMin')?.value)??pr.base[0],b=N(D.getElementById('wrg380BaseMax')?.value)??pr.base[1],c=N(D.getElementById('wrg380IsoMin')?.value)??pr.iso[0],d=N(D.getElementById('wrg380IsoMax')?.value)??pr.iso[1];w.baseRepMin=Math.min(a,b);w.baseRepMax=Math.max(a,b);w.isolationRepMin=Math.min(c,d);w.isolationRepMax=Math.max(c,d)}else{const auto=defaultsFromBand(liveBand()||storedBand(p,wi)||[70,75]);w.baseRepMin=auto.base[0];w.baseRepMax=auto.base[1];w.isolationRepMin=auto.iso[0];w.isolationRepMax=auto.iso[1]}w.repGuidanceRevision=REV;w.repGuidanceAuto=w.repGuidanceManual!==true;p.updated=Date.now();saveState()}
  function installSave(){const fn=W.programWeekProfileSaveV380;if(typeof fn!=='function'||fn.__wrg380)return;const wrapped=function(pid,wi){const p=program(pid);saveReps(p,wi);return fn.apply(this,arguments)};wrapped.__wrg380=true;wrapped.__wrg380Base=fn;W.programWeekProfileSaveV380=wrapped}
  function patchProfile(){const fn=W.unvrslWeekLoadProfileV263;if(typeof fn!=='function'||fn.__wrg380)return;const wrapped=function(p,wi){const out=fn.apply(this,arguments),rp=profile(p,wi,false);if(out&&rp)Object.assign(out,{baseRepMin:rp.base[0],baseRepMax:rp.base[1],isolationRepMin:rp.iso[0],isolationRepMax:rp.iso[1]});return out};wrapped.__wrg380=true;wrapped.__wrg380Base=fn;W.unvrslWeekLoadProfileV263=wrapped}
  function bindIntensity(){['pi380Min','pi380Max'].forEach(id=>{const el=D.getElementById(id);if(!el||el.dataset.wrg380Bound)return;el.dataset.wrg380Bound='1';el.addEventListener('input',()=>{const {p,wi,w}=context();if(p&&w&&w.repGuidanceManual!==true)setFields(profile(p,wi,true))},{passive:true})})}
  function install(){style();patchProfile();installSave();inject();bindIntensity()}
  ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:training-engine-ready','unvrsl:cloud-modules-settled'].forEach(ev=>W.addEventListener?.(ev,()=>setTimeout(install,0),{passive:true}));[0,200,600,1200,2500].forEach(ms=>setTimeout(install,ms));
})();
