'use strict';
(()=>{
  const W=window,D=document,REV=371;
  W.__unvrslBuiltInPlanRepRangesV267=true;
  W.__unvrslBuiltInPlanRepRangesAppliedV267=false;
  if(W.__unvrslProgramRepPolicyV371)return;
  W.__unvrslProgramRepPolicyV371=true;

  const PRESETS=[
    {hi:65,base:[12,15],iso:[15,20]},
    {hi:70,base:[10,12],iso:[12,15]},
    {hi:75,base:[8,10],iso:[12,15]},
    {hi:80,base:[6,8],iso:[10,12]},
    {hi:85,base:[4,6],iso:[8,12]},
    {hi:88,base:[4,6],iso:[8,10]},
    {hi:90,base:[3,5],iso:[6,10]},
    {hi:95,base:[2,4],iso:[6,8]},
    {hi:101,base:[1,3],iso:[4,6]}
  ];
  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};
  const program=id=>{try{return typeof programById==='function'?programById(id):(state()?.programs||[]).find(p=>String(p?.id)===String(id))||null}catch(_){return null}};
  const ui=()=>{try{return typeof programUi!=='undefined'?programUi:null}catch(_){return null}};
  const range=(a,b)=>{let lo=N(a),hi=N(b);if(lo==null||hi==null)return null;lo=clamp(Math.round(lo),1,50);hi=clamp(Math.round(hi),1,50);return [lo,hi]};
  const label=r=>r?(r[0]===r[1]?String(r[0]):`${r[0]}–${r[1]}`):'–';
  const ownScheme=m=>['UNVRSL','SLDR','DS'].includes(String(m||'').toUpperCase());

  function exerciseKind(ex){
    try{const k=W.trainingLoadModel258?.exerciseKind?.({n:ex?.n||'',method:'STANDARD'});if(k==='compound'||k==='isolation')return k}catch(_){ }
    const s=String(ex?.n||'').toLowerCase();
    return /(разгибан|сгибан|подъ[её]м|мах|разведен|сведен|бицеп|трицеп|кроссов|икр|дельт|бабоч|канат)/.test(s)?'isolation':'compound'
  }
  function intensityBand(w){
    let lo=N(w?.intensityMin??w?.weekIntensityMin??w?.intensity?.min),hi=N(w?.intensityMax??w?.weekIntensityMax??w?.intensity?.max);
    if(lo!=null&&lo<=1)lo*=100;if(hi!=null&&hi<=1)hi*=100;
    if(lo==null||hi==null)return[70,75];return[Math.min(lo,hi),Math.max(lo,hi)]
  }
  function presetFor(w){const [,hi]=intensityBand(w),mid=((intensityBand(w)[0]+hi)/2);return PRESETS.find(x=>mid<=x.hi)||PRESETS.at(-1)}
  function automaticRange(p,wi,ex){
    const w=p?.weeks?.[Number(wi)];if(!w)return[8,10];
    const kind=exerciseKind(ex),manualWeek=w.repGuidanceManual===true;
    if(manualWeek){
      const r=kind==='isolation'?range(w.isolationRepMin,w.isolationRepMax):range(w.baseRepMin,w.baseRepMax);
      if(r)return r
    }
    const pr=presetFor(w);return(kind==='isolation'?pr.iso:pr.base).slice()
  }
  function savedRange(ex){return range(ex?.repMin??ex?.sets?.[0]?.rMin??ex?.sets?.[0]?.targetRepMin,ex?.repMax??ex?.sets?.[0]?.rMax??ex?.sets?.[0]?.targetRepMax)}
  function chosenRange(p,wi,ex){return ex?.repMode==='manual'?(savedRange(ex)||automaticRange(p,wi,ex)):automaticRange(p,wi,ex)}
  function editorExercise(x){if(x?.existingIndex===null||x?.existingIndex===undefined)return null;return program(x.pid)?.weeks?.[Number(x.wi)]?.days?.[Number(x.di)]?.ex?.[Number(x.existingIndex)]||null}

  function ensureStyle(){
    if(D.getElementById('program-rep-policy-v371-style'))return;
    const s=D.createElement('style');s.id='program-rep-policy-v371-style';s.textContent=`.pr371-note{margin:8px 0 12px;padding:10px 11px;border:1px solid #303034;border-radius:14px;background:#1a1a1d;color:#a4a4aa;font-size:12px;line-height:1.4}.pr371-note b{color:#f2f2f4}.pr371-reset{margin-top:8px;width:100%}`;D.head?.appendChild(s)
  }
  function setFormRange(r){const lo=D.getElementById('pmReps'),hi=D.getElementById('pmRepsMax');if(lo)lo.value=r[0];if(hi)hi.value=r[1]}
  function syncForm(x){
    ensureStyle();const lo=D.getElementById('pmReps'),hi=D.getElementById('pmRepsMax'),method=String(D.getElementById('pmMethod')?.value||'STANDARD').toUpperCase();if(!lo)return false;
    const p=program(x?.pid),ex=editorExercise(x),auto=automaticRange(p,x?.wi,x||ex||{}),manual=ex?.repMode==='manual';
    const lf=lo.closest('.field'),hf=hi?.closest('.field'),old=D.querySelector('#sheet .pr371-note');old?.remove();
    const own=ownScheme(method);if(lf)lf.style.display=own?'none':'';if(hf)hf.style.display=own?'none':'';D.querySelector('#sheet .pr266-range-note')?.style.setProperty('display',own?'none':'');
    if(own)return true;
    const current=manual?(savedRange(ex)||auto):auto;if(!lo.dataset.pr371ManualTouched)setFormRange(current);
    if(lf?.querySelector('label'))lf.querySelector('label').textContent='Повторы от';if(hf?.querySelector('label'))hf.querySelector('label').textContent='Повторы до';
    const host=(hf||lf);if(host){const note=D.createElement('div');note.className='pr371-note';note.innerHTML=manual?`<b>Ручной диапазон: ${label(current)}</b><br>Он имеет приоритет над рекомендацией недели ${label(auto)}.<button type="button" class="btn tiny pr371-reset">Вернуть по неделе · ${label(auto)}</button>`:`<b>Авто по неделе: ${label(auto)}</b><br>Интенсивность недели задаёт диапазон. Измени любое поле — это упражнение станет ручным.`;host.insertAdjacentElement('afterend',note);note.querySelector('.pr371-reset')?.addEventListener('click',e=>{e.preventDefault();lo.dataset.pr371ManualTouched='';if(hi)hi.dataset.pr371ManualTouched='';if(ex)ex.repMode='auto';setFormRange(auto);syncForm(x)})}
    const touch=e=>{if(e.isTrusted){lo.dataset.pr371ManualTouched='1';if(hi)hi.dataset.pr371ManualTouched='1';const n=D.querySelector('#sheet .pr371-note');if(n)n.innerHTML=`<b>Ручной диапазон: ${lo.value||'–'}–${hi?.value||lo.value||'–'}</b><br>После сохранения он будет иметь приоритет над неделей.`}};
    if(lo.dataset.pr371Bound!=='1'){lo.dataset.pr371Bound='1';lo.addEventListener('input',touch,{passive:true})}if(hi&&hi.dataset.pr371Bound!=='1'){hi.dataset.pr371Bound='1';hi.addEventListener('input',touch,{passive:true})}
    return true
  }
  function installForm(){
    let cur=W.programExerciseForm;try{if(typeof programExerciseForm==='function')cur=programExerciseForm}catch(_){ }
    if(typeof cur!=='function'||cur.__pr371)return false;
    const wrapped=function(x){const out=cur.apply(this,arguments);[0,30,100].forEach(ms=>setTimeout(()=>syncForm(x),ms));return out};wrapped.__pr371=true;wrapped.__pr371Base=cur;W.programExerciseForm=wrapped;try{programExerciseForm=wrapped}catch(_){ }return true
  }
  function installMethod(){
    let cur=W.programMethodDefaults;try{if(typeof programMethodDefaults==='function')cur=programMethodDefaults}catch(_){ }
    if(typeof cur!=='function'||cur.__pr371)return false;
    const wrapped=function(){const out=cur.apply(this,arguments);const u=ui(),p=u?.pid?program(u.pid):null,d=p?.weeks?.[Number(u?.week)||0]?.days?.[Number(u?.day)||0],name=D.querySelector('#sheet h2')?.textContent?.trim(),idx=d?.ex?.findIndex(e=>String(e.n).trim()===String(name).trim());setTimeout(()=>syncForm({pid:u?.pid,wi:Number(u?.week)||0,di:Number(u?.day)||0,existingIndex:idx>=0?idx:null,n:name}),0);return out};wrapped.__pr371=true;wrapped.__pr371Base=cur;W.programMethodDefaults=wrapped;try{programMethodDefaults=wrapped}catch(_){ }return true
  }
  function installSave(){
    let cur=W.saveProgramExercise;try{if(typeof saveProgramExercise==='function')cur=saveProgramExercise}catch(_){ }
    if(typeof cur!=='function'||cur.__pr371)return false;
    const wrapped=function(pid,wi,di,nameToken,sourceId,bp,tg,eq,existingIndex){
      const method=String(D.getElementById('pmMethod')?.value||'STANDARD').toUpperCase(),loEl=D.getElementById('pmReps'),hiEl=D.getElementById('pmRepsMax');
      if(!ownScheme(method)&&loEl&&hiEl){const lo=N(loEl.value),hi=N(hiEl.value);if(lo==null||hi==null||lo>hi){try{W.toast?.('Повторы: значение «от» должно быть меньше или равно «до»')}catch(_){ }return}}
      const touched=loEl?.dataset.pr371ManualTouched==='1'||hiEl?.dataset.pr371ManualTouched==='1',p0=program(pid),old=existingIndex==null?null:p0?.weeks?.[Number(wi)]?.days?.[Number(di)]?.ex?.[Number(existingIndex)],keepManual=old?.repMode==='manual';
      const out=cur.apply(this,arguments),p=program(pid),d=p?.weeks?.[Number(wi)]?.days?.[Number(di)],idx=existingIndex==null||Number.isNaN(Number(existingIndex))?(d?.ex?.length||1)-1:Number(existingIndex),ex=d?.ex?.[idx];if(!ex)return out;
      if(!ownScheme(method)){
        const manual=!!(touched||keepManual),auto=automaticRange(p,wi,ex),picked=manual?(range(loEl?.value,hiEl?.value)||auto):auto;ex.repMode=manual?'manual':'auto';ex.repMin=picked[0];ex.repMax=picked[1];ex.repRange=label(picked);ex.repPolicyRevision=REV;
        (ex.sets||[]).forEach(s=>{s.r=picked[0];s.rMin=picked[0];s.rMax=picked[1];s.targetRepMin=picked[0];s.targetRepMax=picked[1]})
      }
      p.updated=Date.now();saveState();return out
    };wrapped.__pr371=true;wrapped.__pr371Base=cur;W.saveProgramExercise=wrapped;try{saveProgramExercise=wrapped}catch(_){ }return true
  }
  function installBegin(){
    let cur=W.beginProgramDay;try{if(typeof beginProgramDay==='function')cur=beginProgramDay}catch(_){ }
    if(typeof cur!=='function'||cur.__pr371)return false;
    const wrapped=function(pid,wi,di){
      const p=program(pid),blocks=p?.weeks?.[Number(wi)]?.days?.[Number(di)]?.ex||[],out=cur.apply(this,arguments),current=state()?.current;if(!current||String(current.programId)!==String(pid))return out;let cursor=0;
      blocks.forEach(block=>{const method=String(block?.method||'STANDARD').toUpperCase(),count=(block?.sets||[]).length;if(method==='STANDARD'||method==='FST-7'){
        const ex=current.ex?.[cursor++],r=chosenRange(p,wi,block);if(ex)(ex.set||[]).forEach(set=>{set.r=r[0];set.targetRepMin=r[0];set.targetRepMax=r[1];set.repMode=block.repMode||'auto';set.repPolicyRevision=REV})
      }else cursor+=Math.max(1,count)});
      current.repPolicyRevision=REV;saveState();try{W.startPage?.()}catch(_){ }return out
    };wrapped.__pr371=true;wrapped.__pr371Base=cur;W.beginProgramDay=wrapped;try{beginProgramDay=wrapped}catch(_){ }return true
  }
  function installCard(){
    let cur=W.exerciseCard;try{if(typeof exerciseCard==='function')cur=exerciseCard}catch(_){ }
    if(typeof cur!=='function'||cur.__pr371)return false;
    const wrapped=function(s,e,ei){let html=cur.apply(this,arguments);const set=e?.set?.[0],lo=N(set?.targetRepMin),hi=N(set?.targetRepMax),method=String(e?.method||'STANDARD').toUpperCase();if(!html||lo==null||hi==null||!['STANDARD','FST-7'].includes(method)||html.includes('unvrsl-program-rep-target-v371'))return html;const note=`<div class="unvrsl-program-rep-target-v371" style="margin:9px 0 3px;color:var(--green);font-size:13px;font-weight:750">Цель повторов · ${lo===hi?lo:`${lo}–${hi}`}</div>`;return html.replace('<div class="sethead">',`${note}<div class="sethead">`)};wrapped.__pr371=true;wrapped.__pr371Base=cur;W.exerciseCard=wrapped;try{exerciseCard=wrapped}catch(_){ }return true
  }
  function install(){installForm();installMethod();installSave();installBegin();installCard()}
  ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:training-engine-ready','unvrsl:cloud-ready'].forEach(e=>W.addEventListener?.(e,install,{passive:true}));[0,100,300,700,1400,2600,5000].forEach(ms=>setTimeout(install,ms));
})();
