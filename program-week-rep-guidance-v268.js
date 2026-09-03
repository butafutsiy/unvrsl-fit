'use strict';
(()=>{
  const W=window,D=document,REV=268;
  if(W.__unvrslProgramWeekRepGuidanceV268)return;
  W.__unvrslProgramWeekRepGuidanceV268=true;

  // Recommended working-rep corridors mirror Semen's 8-week plan.
  // Special methods remain manual and are not selected here.
  const REPS=Object.freeze({
    1:{base:[8,10],iso:[12,15]},
    2:{base:[6,8],iso:[10,12]},
    3:{base:[5,8],iso:[10,15]},
    4:{base:[12,15],iso:[15,20]},
    5:{base:[4,7],iso:[8,12]},
    6:{base:[8,12],iso:[12,15]},
    7:{base:[3,5],iso:[6,10]},
    8:{base:[1,3],iso:[12,15]}
  });

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const ui=()=>{try{return typeof programUi!=='undefined'?programUi:null}catch(_){return null}};
  const program=id=>{const s=state();try{return typeof programById==='function'?programById(id):(s?.programs||[]).find(p=>String(p?.id)===String(id))||null}catch(_){return null}};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};
  const weekNo=(w,wi)=>Number(w?.n)||Number(wi)+1;
  const pair=(a,b,fallback)=>{let x=N(a),y=N(b);if(x==null)x=fallback?.[0]??null;if(y==null)y=fallback?.[1]??x;if(x==null||y==null)return [null,null];x=clamp(Math.round(x),1,50);y=clamp(Math.round(y),1,50);return [Math.min(x,y),Math.max(x,y)]};
  const label=r=>Array.isArray(r)&&r[0]!=null&&r[1]!=null?(r[0]===r[1]?String(r[0]):`${r[0]}–${r[1]}`):'–';

  function defaultsFor(w,wi){return REPS[weekNo(w,wi)]||REPS[1]}
  function repProfile(p,wi){
    const w=p?.weeks?.[Number(wi)];if(!w)return null;const d=defaultsFor(w,wi);
    const base=pair(w.baseRepMin,w.baseRepMax,d.base),iso=pair(w.isolationRepMin,w.isolationRepMax,d.iso);
    return {week:weekNo(w,wi),baseRepMin:base[0],baseRepMax:base[1],isolationRepMin:iso[0],isolationRepMax:iso[1],manual:w.repGuidanceManual===true}
  }
  function ensureWeek(p,wi,force=false){
    const w=p?.weeks?.[Number(wi)];if(!w)return false;const d=defaultsFor(w,wi);let changed=false;
    const set=(k,v)=>{if(force||w[k]==null||w[k]===''){if(w[k]!==v){w[k]=v;changed=true}}};
    set('baseRepMin',d.base[0]);set('baseRepMax',d.base[1]);set('isolationRepMin',d.iso[0]);set('isolationRepMax',d.iso[1]);
    set('repGuidanceRevision',REV);if(force){w.repGuidanceManual=false;w.repGuidanceAuto=true}
    if(changed)p.updated=Date.now();return changed
  }
  function ensureProgram(p){if(!p?.weeks)return false;let changed=false;p.weeks.forEach((_,i)=>{if(ensureWeek(p,i,false))changed=true});if(changed)saveState();return changed}

  function patchWeekProfile(){
    const cur=W.unvrslWeekLoadProfileV263;if(typeof cur!=='function'||cur.__wrg268)return false;
    const wrapped=function(p,wi,useDefaults){const out=cur.apply(this,arguments);if(!out)return out;const rp=repProfile(p,wi);if(rp)Object.assign(out,rp);return out};
    wrapped.__wrg268=true;wrapped.__wrg268Base=cur;W.unvrslWeekLoadProfileV263=wrapped;return true
  }

  function ensureStyle(){
    if(D.getElementById('program-week-rep-guidance-v268-style'))return;
    const s=D.createElement('style');s.id='program-week-rep-guidance-v268-style';s.textContent=`
      .wrg268-box{margin-top:12px;padding:12px;border-radius:16px;background:#1a1a1d;border:1px solid #303034}.wrg268-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.wrg268-head b{font-size:13px}.wrg268-head span{color:var(--green);font-size:11px;font-weight:800}.wrg268-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.wrg268-grid .field{margin:0}.wrg268-help{margin-top:8px;color:#85858b;font-size:11px;line-height:1.4}.wrg268-current{margin-top:5px;color:#d5d5d9;font-size:11px;font-weight:750}
    `;D.head?.appendChild(s)
  }
  function currentContext(){const u=ui(),p=u?.pid?program(u.pid):null,wi=Number(u?.week)||0;return {u,p,wi,w:p?.weeks?.[wi]||null}}
  function field(id){return D.getElementById(id)}
  function setVal(id,v){const el=field(id);if(el&&v!=null)el.value=v}
  function fillFields(rp){if(!rp)return;setVal('wrg268BaseMin',rp.baseRepMin);setVal('wrg268BaseMax',rp.baseRepMax);setVal('wrg268IsoMin',rp.isolationRepMin);setVal('wrg268IsoMax',rp.isolationRepMax)}
  function saveFields(p,wi,manual=true){
    const w=p?.weeks?.[Number(wi)];if(!w)return false;const d=defaultsFor(w,wi),b=pair(field('wrg268BaseMin')?.value,field('wrg268BaseMax')?.value,d.base),i=pair(field('wrg268IsoMin')?.value,field('wrg268IsoMax')?.value,d.iso);
    w.baseRepMin=b[0];w.baseRepMax=b[1];w.isolationRepMin=i[0];w.isolationRepMax=i[1];w.repGuidanceRevision=REV;w.repGuidanceManual=!!manual;w.repGuidanceAuto=!manual;p.updated=Date.now();saveState();return true
  }
  function resetFieldsForWeek(p,wi,save=false){const w=p?.weeks?.[Number(wi)];if(!w)return;const d=defaultsFor(w,wi);fillFields({baseRepMin:d.base[0],baseRepMax:d.base[1],isolationRepMin:d.iso[0],isolationRepMax:d.iso[1]});if(save){ensureWeek(p,wi,true);saveState()}}
  function applyWholeCycle(p){if(!p?.weeks)return;p.weeks.forEach((_,i)=>ensureWeek(p,i,true));p.updated=Date.now();saveState()}

  function bindWeekActions(card,p,wi){
    const saveBtn=[...card.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Сохранить профиль недели'));
    if(saveBtn&&saveBtn.dataset.wrg268Save!=='1'){
      saveBtn.dataset.wrg268Save='1';saveBtn.addEventListener('click',()=>saveFields(p,wi,true),{capture:true})
    }
    const reset=card.querySelector('[data-wr264-week]');if(reset&&reset.dataset.wrg268Reset!=='1'){
      reset.dataset.wrg268Reset='1';reset.addEventListener('click',()=>resetFieldsForWeek(p,wi,false),{passive:true})
    }
    const cycle=card.querySelector('[data-wr264-cycle]');if(cycle&&cycle.dataset.wrg268Cycle!=='1'){
      cycle.dataset.wrg268Cycle='1';cycle.addEventListener('click',()=>applyWholeCycle(p),{capture:true})
    }
  }
  function injectWeekEditor(){
    ensureStyle();const {p,wi,w}=currentContext(),card=D.querySelector('#sheet .pi261-week'),host=card?.querySelector('.wr264-box');if(!p||!w||!card||!host)return false;
    ensureProgram(p);const rp=repProfile(p,wi),key=`${p.id}|${wi}`;let box=host.querySelector('.wrg268-box');
    if(box&&box.dataset.key===key){bindWeekActions(card,p,wi);return true}
    box?.remove();box=D.createElement('div');box.className='wrg268-box';box.dataset.key=key;box.innerHTML=`
      <div class="wrg268-head"><b>Рекомендуемые повторы</b><span>по W${rp.week}</span></div>
      <div class="wrg268-grid">
        <div class="field"><label>База · от</label><input id="wrg268BaseMin" type="number" min="1" max="50" value="${rp.baseRepMin}"></div>
        <div class="field"><label>База · до</label><input id="wrg268BaseMax" type="number" min="1" max="50" value="${rp.baseRepMax}"></div>
        <div class="field"><label>Изоляция · от</label><input id="wrg268IsoMin" type="number" min="1" max="50" value="${rp.isolationRepMin}"></div>
        <div class="field"><label>Изоляция · до</label><input id="wrg268IsoMax" type="number" min="1" max="50" value="${rp.isolationRepMax}"></div>
      </div>
      <div class="wrg268-help">Диапазоны подставляются при добавлении упражнения по его виду. После подстановки повторы можно менять вручную. Методы тренировки не меняются.</div>`;
    const focus=host.querySelector('.wr264-focus');if(focus)focus.insertAdjacentElement('beforebegin',box);else host.appendChild(box);bindWeekActions(card,p,wi);return true
  }

  function inferKind(name=''){
    const explicit=field('pmKind')?.value;if(explicit==='compound'||explicit==='isolation')return explicit;
    try{if(typeof W.programInferExerciseKind==='function')return W.programInferExerciseKind(name)}catch(_){ }
    const s=String(name).toLowerCase();return /(разгибан|сгибан|сведен|разведен|мах|кроссов|икр|дельт)/.test(s)?'isolation':'compound'
  }
  function exerciseDefaults(x,kind){const p=program(x?.pid),w=p?.weeks?.[Number(x?.wi)];if(!p||!w)return null;ensureWeek(p,Number(x.wi),false);const rp=repProfile(p,Number(x.wi));return kind==='isolation'?[rp.isolationRepMin,rp.isolationRepMax]:[rp.baseRepMin,rp.baseRepMax]}
  function setExerciseReps(x,force=false){
    const min=field('pmReps'),max=field('pmRepsMax');if(!min)return;const existing=x?.existingIndex!==null&&x?.existingIndex!==undefined;if(existing&&!force)return;
    if(!force&&(min.dataset.wrg268Touched==='1'||max?.dataset.wrg268Touched==='1'))return;
    const kind=inferKind(x?.n||x?.name||''),d=exerciseDefaults(x,kind);if(!d)return;min.value=d[0];if(max)max.value=d[1];
    const line=D.querySelector('.wrg268-current');if(line)line.textContent=`Рекомендация W${Number(x?.wi)+1}: ${kind==='isolation'?'изоляция':'база'} ${label(d)} повт.`;
    try{min.dispatchEvent(new Event('change',{bubbles:true}));max?.dispatchEvent(new Event('change',{bubbles:true}))}catch(_){ }
  }
  function decorateExercise(x){
    const min=field('pmReps');if(!min)return false;const existing=x?.existingIndex!==null&&x?.existingIndex!==undefined;
    if(min.dataset.wrg268TouchBound!=='1'){min.dataset.wrg268TouchBound='1';min.addEventListener('input',e=>{if(e.isTrusted)min.dataset.wrg268Touched='1'},{passive:true})}
    const max=field('pmRepsMax');if(max&&max.dataset.wrg268TouchBound!=='1'){max.dataset.wrg268TouchBound='1';max.addEventListener('input',e=>{if(e.isTrusted)max.dataset.wrg268Touched='1'},{passive:true})}
    let note=D.querySelector('.wrg268-current');if(!note){note=D.createElement('div');note.className='wrg268-current';const anchor=D.querySelector('.pr266-range-note')||max?.closest('.field')||min.closest('.field');anchor?.insertAdjacentElement('afterend',note)}
    const d=exerciseDefaults(x,inferKind(x?.n||x?.name||''));if(d)note.textContent=`Рекомендация W${Number(x?.wi)+1}: ${inferKind(x?.n||x?.name||'')==='isolation'?'изоляция':'база'} ${label(d)} повт.`;
    if(!existing)setExerciseReps(x,false);D.documentElement.dataset.wrg268Exercise=JSON.stringify({pid:x?.pid,wi:Number(x?.wi)||0,di:Number(x?.di)||0,n:x?.n||x?.name||'',existing:!!existing});return true
  }
  function patchExerciseForm(){
    let cur=null;try{cur=typeof programExerciseForm==='function'?programExerciseForm:W.programExerciseForm}catch(_){cur=W.programExerciseForm}
    if(typeof cur!=='function'||cur.__wrg268)return false;
    const wrapped=function(x){const r=cur.apply(this,arguments);setTimeout(()=>decorateExercise(x),0);return r};wrapped.__wrg268=true;wrapped.__wrg268Base=cur;W.programExerciseForm=wrapped;try{programExerciseForm=wrapped}catch(_){ }return true
  }
  function currentExerciseContext(){try{return JSON.parse(D.documentElement.dataset.wrg268Exercise||'null')}catch(_){return null}}
  function patchSetKind(){
    const cur=W.programSetKind;if(typeof cur!=='function'||cur.__wrg268)return false;
    const wrapped=function(kind){const r=cur.apply(this,arguments),x=currentExerciseContext();if(x&&!x.existing)setTimeout(()=>setExerciseReps(x,false),0);return r};wrapped.__wrg268=true;wrapped.__wrg268Base=cur;W.programSetKind=wrapped;return true
  }

  function install(){patchWeekProfile();patchExerciseForm();patchSetKind();injectWeekEditor()}
  let q=false;function queue(){if(q)return;q=true;requestAnimationFrame(()=>{q=false;install()})}
  const mo=typeof MutationObserver==='function'?new MutationObserver(queue):null;mo?.observe(D.documentElement,{childList:true,subtree:true});
  for(const ev of ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:cloud-ready','unvrsl:training-engine-ready'])W.addEventListener?.(ev,queue,{passive:true});
  [0,100,300,700,1400,2600].forEach(ms=>setTimeout(queue,ms));setInterval(()=>{patchWeekProfile();patchExerciseForm();patchSetKind();injectWeekEditor()},1200)
})();
