'use strict';
(()=>{
  const W=window,D=document,REV=373;
  if(W.__unvrslProgramRepAuthorityV373)return;
  W.__unvrslProgramRepAuthorityV373=true;
  W.__unvrslProgramRepRangeV266=true;

  const PRESETS=[
    {hi:65,base:[12,15],iso:[15,20]},
    {hi:70,base:[10,12],iso:[12,15]},
    {hi:75,base:[8,10],iso:[12,15]},
    {hi:80,base:[6,8],iso:[10,12]},
    {hi:85,base:[5,7],iso:[8,12]},
    {hi:88,base:[4,6],iso:[8,10]},
    {hi:90,base:[3,5],iso:[6,10]},
    {hi:95,base:[2,4],iso:[6,8]},
    {hi:101,base:[1,3],iso:[4,6]}
  ];
  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};
  const program=id=>{const s=state();try{return typeof programById==='function'?programById(id):(s?.programs||[]).find(p=>String(p?.id)===String(id))||null}catch(_){return null}};
  const label=(a,b,arrow=false)=>a===b?String(a):`${a}${arrow?'→':'–'}${b}`;
  const baseName=n=>String(n||'').split(' — ')[0].trim().toLowerCase();
  const special=m=>['UNVRSL','SLDR'].includes(String(m||'').toUpperCase());

  function kindOf(ex){
    const k=String(ex?.kind||D.getElementById('pmKind')?.value||'').toLowerCase();
    if(k==='compound'||k==='isolation')return k;
    const s=String(ex?.n||'').toLowerCase();
    return /(разгибан|сгибан|подъ[её]м|мах|разведен|сведен|бицеп|трицеп|кроссов|икр|дельт|бабоч|канат|отведен|приведен)/.test(s)?'isolation':'compound'
  }
  function band(w){
    let lo=N(w?.intensityMin??w?.weekIntensityMin??w?.intensity?.min),hi=N(w?.intensityMax??w?.weekIntensityMax??w?.intensity?.max);
    if(lo!=null&&lo<=1)lo*=100;if(hi!=null&&hi<=1)hi*=100;
    if(lo==null||hi==null)return[70,75];
    return[Math.min(lo,hi),Math.max(lo,hi)]
  }
  function autoRange(p,wi,ex){
    const w=p?.weeks?.[Number(wi)];if(!w)return[8,10];
    const kind=kindOf(ex);
    const manualWeek=w.repGuidanceManual===true;
    const a=kind==='isolation'?[N(w.isolationRepMin),N(w.isolationRepMax)]:[N(w.baseRepMin),N(w.baseRepMax)];
    if(a[0]!=null&&a[1]!=null&&(manualWeek||w.repGuidanceRevision!=null))return[Math.min(a[0],a[1]),Math.max(a[0],a[1])];
    const b=band(w),mid=(b[0]+b[1])/2,pr=PRESETS.find(x=>mid<=x.hi)||PRESETS.at(-1);
    return(kind==='isolation'?pr.iso:pr.base).slice()
  }
  function exAt(x){
    if(x?.existingIndex===null||x?.existingIndex===undefined)return null;
    return program(x.pid)?.weeks?.[Number(x.wi)]?.days?.[Number(x.di)]?.ex?.[Number(x.existingIndex)]||null
  }
  function currentCtx(){
    const u=(()=>{try{return typeof programUi!=='undefined'?programUi:null}catch(_){return null}})();
    const p=u?.pid?program(u.pid):null,wi=Number(u?.week)||0,di=Number(u?.day)||0,d=p?.weeks?.[wi]?.days?.[di],name=D.querySelector('#sheet h2')?.textContent?.trim()||'';
    const idx=d?.ex?.findIndex(e=>String(e.n).trim()===name)??-1;
    return {pid:u?.pid,wi,di,n:name,existingIndex:idx>=0?idx:null}
  }
  function parsePattern(v,fallback=[12,10,8]){
    const a=String(v??'').split(/[\s,;/→>-]+/).map(N).filter(n=>n!=null&&n>0).map(n=>clamp(Math.round(n),1,50));
    return a.length>=2?a:fallback.slice()
  }
  function existingSldr(ex){
    if(ex?.sldrPattern)return parsePattern(ex.sldrPattern);
    const a=(ex?.sets||[]).map(s=>N(s?.r)).filter(n=>n!=null&&n>0);return a.length>=2?a:[12,10,8]
  }
  function existingDs(ex,auto){
    const s=N(ex?.dsRepStart),e=N(ex?.dsRepEnd);if(s!=null&&e!=null)return[s,e];
    const lo=N(ex?.repMin),hi=N(ex?.repMax);if(lo!=null&&hi!=null)return[Math.max(lo,hi),Math.min(lo,hi)];
    const reps=(ex?.sets||[]).map(x=>N(x?.r)).filter(n=>n!=null&&n>0);if(reps.length>1)return[reps[0],reps.at(-1)];
    return[auto[1],auto[0]]
  }
  function dsSteps(start,end,count){
    const n=Math.max(1,count||5);if(n===1)return[Math.round(start)];
    return Array.from({length:n},(_,i)=>Math.max(1,Math.round(start+(end-start)*(i/(n-1)))))
  }

  function ensureStyle(){
    if(D.getElementById('pr373-style'))return;
    const s=D.createElement('style');s.id='pr373-style';s.textContent=`
      .pr373-note{grid-column:1/-1;margin:2px 0 10px;padding:11px 12px;border:1px solid #303034;border-radius:14px;background:#19191c;color:#9999a0;font-size:12px;line-height:1.42}
      .pr373-note b{color:#f2f2f4}.pr373-note .accent{color:#bf5af2;font-weight:800}.pr373-reset{display:block;width:100%;margin-top:8px}
      .pr373-range-field input::placeholder,.pr373-target::placeholder{color:#9b9ba0!important;opacity:.62!important;font-weight:720}
      .pr373-sldr-field{grid-column:1/-1}.pr373-sldr-field input{letter-spacing:.02em}
      .pr373-method-summary{grid-column:1/-1;margin:4px 0 7px;padding:10px 12px;border-radius:13px;background:#202024;border:1px solid #303036;color:#aaa;font-size:12px;line-height:1.4}
    `;D.head?.appendChild(s)
  }
  function ensureMaxField(){
    const lo=D.getElementById('pmReps');if(!lo)return null;
    let hi=D.getElementById('pmRepsMax');if(hi)return hi;
    const lf=lo.closest('.field');if(!lf)return null;
    const f=D.createElement('div');f.className='field pr373-range-field';f.id='pr373MaxField';f.innerHTML='<label>Повторы до</label><input id="pmRepsMax" type="number" min="1" max="50">';lf.insertAdjacentElement('afterend',f);return f.querySelector('#pmRepsMax')
  }
  function ensureNote(host){
    let n=D.getElementById('pr373Note');if(n)return n;
    n=D.createElement('div');n.id='pr373Note';n.className='pr373-note';host?.insertAdjacentElement('afterend',n);return n
  }
  function ensureSldrField(){
    const host=D.getElementById('pmSldrFields');if(!host)return null;
    let field=D.getElementById('pr373SldrField');if(!field){
      field=D.createElement('div');field.id='pr373SldrField';field.className='field pr373-sldr-field';field.innerHTML='<label>Схема повторов</label><input id="pmSldrPattern" inputmode="text" placeholder="12/10/8"><div class="px-auto-help">Например: 15/12/10. Между мини-подходами остаётся 15 сек.</div>';host.appendChild(field)
    }
    return D.getElementById('pmSldrPattern')
  }
  function setAutoInputs(lo,hi,a,b){
    lo.value='';lo.placeholder=String(a);lo.dataset.pr373Auto='1';
    if(hi){hi.value='';hi.placeholder=String(b);hi.dataset.pr373Auto='1'}
  }
  function setManualInputs(lo,hi,a,b){
    lo.value=String(a);lo.placeholder='';lo.dataset.pr373Auto='0';
    if(hi){hi.value=String(b);hi.placeholder='';hi.dataset.pr373Auto='0'}
  }
  function bindManual(lo,hi){
    const bind=el=>{if(!el||el.dataset.pr373Bound==='1')return;el.dataset.pr373Bound='1';el.addEventListener('input',e=>{if(!e.isTrusted)return;el.dataset.pr373Touched='1';const other=el===lo?hi:lo;if(other&&other.dataset.pr373Auto==='1'&&other.value==='')other.dataset.pr373Touched='0';refreshNote()},{passive:true})};
    bind(lo);bind(hi)
  }
  function refreshNote(){
    const ctx=W.__pr373Ctx||currentCtx(),p=program(ctx?.pid),ex=exAt(ctx),method=String(D.getElementById('pmMethod')?.value||'STANDARD').toUpperCase(),auto=autoRange(p,ctx?.wi,ex||ctx),lo=D.getElementById('pmReps'),hi=D.getElementById('pmRepsMax'),note=D.getElementById('pr373Note');if(!note)return;
    if(method==='UNVRSL'){note.innerHTML='<b>UNVRSL</b> · повторения задаются фазами метода: тяжёлые, лёгкие и средние подходы. Общего поля «повторы до» нет.';return}
    if(method==='SLDR'){note.innerHTML=`<b>SLDR</b> · используется собственная схема мини-подходов. Неделя рекомендует нагрузку <span class="accent">${label(auto[0],auto[1])}</span>, но схема повторов задаётся отдельно.`;return}
    const lv=N(lo?.value),hv=N(hi?.value),manual=lv!=null||hv!=null;
    if(method==='DS'){
      const st=lv??auto[1],en=hv??auto[0];
      note.innerHTML=`<b>Рекомендация недели · ${label(auto[0],auto[1])}</b><br>Дроп-сет: ${manual?'своя схема':'авто'} <span class="accent">${st}→${en}</span>. Старт может быть выше финиша — это нормально.`;
      return
    }
    note.innerHTML=`<b>Рекомендация недели · ${label(auto[0],auto[1])}</b><br>${manual?`Для этого упражнения выбран ручной диапазон <span class="accent">${label(lv??auto[0],hv??auto[1])}</span>.`:'Серые значения — рекомендация. Оставь поля пустыми для авто или введи свой диапазон.'}`
  }

  function decorateForm(x,force=false){
    ensureStyle();if(x)W.__pr373Ctx=x;const ctx=W.__pr373Ctx||x||currentCtx();
    const lo=D.getElementById('pmReps'),method=String(D.getElementById('pmMethod')?.value||'STANDARD').toUpperCase();if(!lo)return false;
    const p=program(ctx?.pid),ex=exAt(ctx),auto=autoRange(p,ctx?.wi,ex||ctx),hi=ensureMaxField(),lf=lo.closest('.field'),hf=hi?.closest('.field');
    D.querySelector('#sheet .pr266-range-note')?.remove();D.querySelector('#sheet .pr371-note')?.remove();D.querySelector('#sheet .pr372-note')?.remove();
    if(lf)lf.classList.add('pr373-range-field');
    const note=ensureNote(hf||lf);
    const repsVisible=!special(method);
    if(lf)lf.style.display=repsVisible?'':'none';if(hf)hf.style.display=repsVisible?'':'none';

    const oldSldr=[D.getElementById('pmSldrSets')?.closest('.field'),D.getElementById('pmSldrDrop')?.closest('.field')];
    oldSldr.forEach(f=>{if(f)f.style.display=method==='SLDR'?'none':''});
    const pat=ensureSldrField();if(pat?.closest('.field'))pat.closest('.field').style.display=method==='SLDR'?'':'none';

    if(method==='UNVRSL'){
      if(note)note.style.display='';refreshNote();return true
    }
    if(method==='SLDR'){
      if(pat&&(!pat.dataset.pr373Init||force)){pat.value=(ex?.sldrPattern||existingSldr(ex).join('/'));pat.dataset.pr373Init='1'}
      if(note)note.style.display='';refreshNote();return true
    }

    if(lf?.querySelector('label'))lf.querySelector('label').textContent=method==='DS'?'Первый дроп · повт.':'Повторы от';
    if(hf?.querySelector('label'))hf.querySelector('label').textContent=method==='DS'?'Последний дроп · повт.':'Повторы до';
    const manual=ex?.repMode==='manual';
    if(force){lo.dataset.pr373Touched='';if(hi)hi.dataset.pr373Touched=''}
    const touched=lo.dataset.pr373Touched==='1'||hi?.dataset.pr373Touched==='1';
    if(!touched){
      if(method==='DS'){
        const [st,en]=existingDs(ex,auto);manual?setManualInputs(lo,hi,st,en):setAutoInputs(lo,hi,auto[1],auto[0])
      }else if(manual){
        const a=N(ex?.repMin)??auto[0],b=N(ex?.repMax)??auto[1];setManualInputs(lo,hi,a,b)
      }else setAutoInputs(lo,hi,auto[0],auto[1])
    }
    bindManual(lo,hi);if(note)note.style.display='';refreshNote();return true
  }

  function installForm(){
    let cur=W.programExerciseForm;try{if(typeof programExerciseForm==='function')cur=programExerciseForm}catch(_){ }
    if(typeof cur!=='function'||cur.__pr373)return false;
    const wrapped=function(x){W.__pr373Ctx=x;const out=cur.apply(this,arguments);[0,30,100,220].forEach(ms=>setTimeout(()=>decorateForm(x,ms===0),ms));return out};
    wrapped.__pr373=true;wrapped.__pr373Base=cur;W.programExerciseForm=wrapped;try{programExerciseForm=wrapped}catch(_){ }return true
  }
  function installMethodRefresh(){
    let cur=W.programRefreshMethodUi;try{if(typeof programRefreshMethodUi==='function')cur=programRefreshMethodUi}catch(_){ }
    if(typeof cur!=='function'||cur.__pr373)return false;
    const wrapped=function(){const out=cur.apply(this,arguments);[0,35,100].forEach(ms=>setTimeout(()=>decorateForm(W.__pr373Ctx||currentCtx(),true),ms));return out};
    wrapped.__pr373=true;wrapped.__pr373Base=cur;W.programRefreshMethodUi=wrapped;try{programRefreshMethodUi=wrapped}catch(_){ }return true
  }

  function installSave(){
    let cur=W.saveProgramExercise;try{if(typeof saveProgramExercise==='function')cur=saveProgramExercise}catch(_){ }
    if(typeof cur!=='function'||cur.__pr373)return false;
    const wrapped=function(pid,wi,di,nameToken,sourceId,bp,tg,eq,existingIndex){
      const p0=program(pid),old=existingIndex==null?null:p0?.weeks?.[Number(wi)]?.days?.[Number(di)]?.ex?.[Number(existingIndex)],method=String(D.getElementById('pmMethod')?.value||'STANDARD').toUpperCase(),loEl=D.getElementById('pmReps'),hiEl=D.getElementById('pmRepsMax'),auto=autoRange(p0,wi,old||{n:decodeURIComponent(nameToken||'')});
      let manual=false,a=auto[0],b=auto[1],dsStart=null,dsEnd=null,sldr=null;
      if(method==='SLDR'){
        sldr=parsePattern(D.getElementById('pmSldrPattern')?.value,existingSldr(old));
        if(loEl)loEl.value=String(sldr[0]);const ss=D.getElementById('pmSldrSets'),sd=D.getElementById('pmSldrDrop');if(ss)ss.value=String(sldr.length);if(sd)sd.value='1'
      }else if(method==='DS'){
        const lv=N(loEl?.value),hv=N(hiEl?.value);manual=lv!=null||hv!=null||old?.repMode==='manual';dsStart=lv??N(old?.dsRepStart)??auto[1];dsEnd=hv??N(old?.dsRepEnd)??auto[0];
        if(loEl)loEl.value=String(dsStart);if(hiEl)hiEl.value=String(dsEnd)
      }else if(!special(method)){
        const lv=N(loEl?.value),hv=N(hiEl?.value);manual=lv!=null||hv!=null||old?.repMode==='manual';a=lv??N(old?.repMin)??auto[0];b=hv??N(old?.repMax)??auto[1];
        if(a>b){try{W.toast?.('Повторы: «от» не может быть больше «до»')}catch(_){ }return}
        if(loEl)loEl.value=String(a);if(hiEl)hiEl.value=String(b)
      }
      const out=cur.apply(this,arguments),p=program(pid),d=p?.weeks?.[Number(wi)]?.days?.[Number(di)],idx=existingIndex==null||Number.isNaN(Number(existingIndex))?(d?.ex?.length||1)-1:Number(existingIndex),ex=d?.ex?.[idx];if(!ex)return out;
      if(method==='SLDR'){
        ex.repMode='method';ex.sldrPattern=sldr.join('/');ex.miniSets=sldr.length;
        ex.sets=(ex.sets||[]).slice(0,sldr.length);while(ex.sets.length<sldr.length)ex.sets.push({...ex.sets.at(-1)});
        ex.sets.forEach((s,i)=>{s.label=`${i+1}/${sldr.length}`;s.role='mini';s.r=sldr[i];s.rMin=sldr[i];s.rMax=sldr[i];s.targetRepMin=sldr[i];s.targetRepMax=sldr[i];s.targetRepLabel=String(sldr[i]);s.rest=i<sldr.length-1?15:ex.rest});
      }else if(method==='UNVRSL'){
        ex.repMode='method';(ex.sets||[]).forEach(s=>{const r=Math.max(1,N(s.r)||1);s.rMin=r;s.rMax=r;s.targetRepMin=r;s.targetRepMax=r;s.targetRepLabel=String(r)})
      }else if(method==='DS'){
        ex.repMode=manual?'manual':'auto';ex.dsRepStart=dsStart;ex.dsRepEnd=dsEnd;ex.repMin=Math.min(dsStart,dsEnd);ex.repMax=Math.max(dsStart,dsEnd);ex.repRange=label(dsStart,dsEnd,true);ex.repPolicyRevision=REV;
        const steps=dsSteps(dsStart,dsEnd,(ex.sets||[]).length||5);(ex.sets||[]).forEach((s,i)=>{const r=steps[i]??dsEnd;s.r=r;s.rMin=Math.min(dsStart,dsEnd);s.rMax=Math.max(dsStart,dsEnd);s.targetRepMin=r;s.targetRepMax=r;s.targetRepLabel=String(r)})
      }else{
        ex.repMode=manual?'manual':'auto';ex.repMin=a;ex.repMax=b;ex.repRange=label(a,b);ex.repPolicyRevision=REV;
        (ex.sets||[]).forEach(s=>{s.r=a;s.rMin=a;s.rMax=b;s.targetRepMin=a;s.targetRepMax=b;s.targetRepLabel=label(a,b)})
      }
      p.updated=Date.now();saveState();try{typeof renderProgramEditor==='function'&&renderProgramEditor()}catch(_){ }return out
    };
    wrapped.__pr373=true;wrapped.__pr373Base=cur;W.saveProgramExercise=wrapped;try{saveProgramExercise=wrapped}catch(_){ }return true
  }

  function installPrescription(){
    let cur=W.prescriptionText;try{if(typeof prescriptionText==='function')cur=prescriptionText}catch(_){ }
    if(typeof cur!=='function'||cur.__pr373)return false;
    const wrapped=function(e){
      const s=e?.sets||[],method=String(e?.method||'STANDARD').toUpperCase();if(!s.length)return cur.apply(this,arguments);
      if(method==='STANDARD')return `${s.length}×${label(N(e.repMin)??N(s[0]?.r)??0,N(e.repMax)??N(s[0]?.r)??0)} · ${s[0]?.w||0} кг · RPE ${e.rpe||8}`;
      if(method==='FST-7')return `7×${label(N(e.repMin)??N(s[0]?.r)??0,N(e.repMax)??N(s[0]?.r)??0)} · ${s[0]?.w||0} кг · RPE ${e.rpe||8}`;
      if(method==='DS'&&N(e.dsRepStart)!=null&&N(e.dsRepEnd)!=null)return `${s.length} ступеней · ${label(e.dsRepStart,e.dsRepEnd,true)} · ${s[0]?.w||0} кг`;
      if(method==='SLDR'&&e.sldrPattern)return `${e.sldrPattern} · ${s[0]?.w||0} кг · 15 сек`;
      return cur.apply(this,arguments)
    };
    wrapped.__pr373=true;wrapped.__pr373Base=cur;W.prescriptionText=wrapped;try{prescriptionText=wrapped}catch(_){ }return true
  }

  function sourceTargets(p,wi,di,current){
    const d=p?.weeks?.[Number(wi)]?.days?.[Number(di)];if(!d||!current)return false;let cursor=0;
    (d.ex||[]).forEach(block=>{
      const method=String(block?.method||'STANDARD').toUpperCase(),auto=autoRange(p,wi,block),sets=block?.sets||[];
      if(method==='STANDARD'||method==='FST-7'){
        const e=current.ex?.[cursor++];if(!e)return;const lo=N(block.repMin)??auto[0],hi=N(block.repMax)??auto[1],lab=label(lo,hi);
        (e.set||[]).forEach(set=>{set.targetRepMin=lo;set.targetRepMax=hi;set.targetRepLabel=lab;set.repMode=block.repMode||'auto';if(!set.ok&&!set.manualFields?.r&&!set.repEntered)set.r=''})
      }else{
        sets.forEach((src)=>{
          const e=current.ex?.[cursor++],set=e?.set?.[0];if(!set)return;
          const r=Math.max(1,N(src?.r)||1);set.targetRepMin=N(src.targetRepMin)??r;set.targetRepMax=N(src.targetRepMax)??r;set.targetRepLabel=src.targetRepLabel||String(r);set.repMode=block.repMode||'method';if(!set.ok&&!set.manualFields?.r&&!set.repEntered)set.r=''
        })
      }
    });
    current.repPolicyRevision=REV;return true
  }
  function findCurrentDay(p,s){
    const wi=Math.max(0,Number(s?.w||1)-1),w=p?.weeks?.[wi];if(!w)return null;
    let di=w.days?.findIndex(d=>String(d?.name||'')===String(s?.c||''));if(di==null||di<0)di=0;return{wi,di}
  }
  function repairCurrent(){
    const s=state()?.current;if(!s?.programId)return false;const p=program(s.programId);if(!p)return false;const x=findCurrentDay(p,s);if(!x)return false;const ok=sourceTargets(p,x.wi,x.di,s);if(ok)saveState();return ok
  }
  function installBegin(){
    let cur=W.beginProgramDay;try{if(typeof beginProgramDay==='function')cur=beginProgramDay}catch(_){ }
    if(typeof cur!=='function'||cur.__pr373)return false;
    const wrapped=function(pid,wi,di){const out=cur.apply(this,arguments),s=state()?.current,p=program(pid);if(s&&p&&String(s.programId)===String(pid)){sourceTargets(p,wi,di,s);saveState();try{W.startPage?.()}catch(_){ }}return out};
    wrapped.__pr373=true;wrapped.__pr373Base=cur;W.beginProgramDay=wrapped;try{beginProgramDay=wrapped}catch(_){ }return true
  }

  function targetText(set){
    if(set?.targetRepLabel)return String(set.targetRepLabel);
    const lo=N(set?.targetRepMin),hi=N(set?.targetRepMax);if(lo==null&&hi==null)return'';return label(lo??hi,hi??lo)
  }
  function decorateWorkoutHtml(html,sets){
    if(!html||!sets?.length)return html;const t=D.createElement('template');t.innerHTML=html,rows=[...t.content.querySelectorAll('.setrow:not(.cardiorow)')];
    rows.forEach((row,i)=>{const set=sets[i],lab=targetText(set);if(!set||!lab)return;const inp=row.querySelectorAll('input')?.[1];if(!inp)return;inp.placeholder=lab;inp.setAttribute('data-pr373-target','1');inp.setAttribute('aria-label',`Повторы, цель ${lab}`);inp.classList.add('pr373-target');if(!set.ok&&!set.manualFields?.r&&!set.repEntered)inp.value=''});
    t.content.querySelectorAll('.unvrsl-active-rep-range-v282,.unvrsl-program-rep-target-v371').forEach(n=>n.remove());return t.innerHTML
  }
  function installGroupCard(){
    let cur=W.exerciseGroupCard;try{if(typeof exerciseGroupCard==='function')cur=exerciseGroupCard}catch(_){ }
    if(typeof cur!=='function'||cur.__pr373)return false;
    const wrapped=function(s,group){const html=cur.apply(this,arguments);if(!s?.programId)return html;const sets=[];(group?.entries||[]).forEach(e=>(e?.set||[]).forEach(set=>sets.push(set)));return decorateWorkoutHtml(html,sets)};
    wrapped.__pr373=true;wrapped.__pr373Base=cur;W.exerciseGroupCard=wrapped;try{exerciseGroupCard=wrapped}catch(_){ }return true
  }
  function installCard(){
    let cur=W.exerciseCard;try{if(typeof exerciseCard==='function')cur=exerciseCard}catch(_){ }
    if(typeof cur!=='function'||cur.__pr373)return false;
    const wrapped=function(s,e){const html=cur.apply(this,arguments);if(!s?.programId)return html;return decorateWorkoutHtml(html,e?.set||[])};
    wrapped.__pr373=true;wrapped.__pr373Base=cur;W.exerciseCard=wrapped;try{exerciseCard=wrapped}catch(_){ }return true
  }
  function installEdit(){
    let cur=W.editSet;try{if(typeof editSet==='function')cur=editSet}catch(_){ }
    if(typeof cur!=='function'||cur.__pr373)return false;
    const wrapped=function(ei,si,k,v){if(k==='r'){const set=state()?.current?.ex?.[Number(ei)]?.set?.[Number(si)];if(set){set.repEntered=String(v).trim()!=='';set.manualFields={...(set.manualFields||{}),r:set.repEntered}}}return cur.apply(this,arguments)};
    wrapped.__pr373=true;wrapped.__pr373Base=cur;W.editSet=wrapped;try{editSet=wrapped}catch(_){ }return true
  }
  function installToggle(){
    let cur=W.toggleSet;try{if(typeof toggleSet==='function')cur=toggleSet}catch(_){ }
    if(typeof cur!=='function'||cur.__pr373)return false;
    const wrapped=function(ei,si){const s=state()?.current,set=s?.ex?.[Number(ei)]?.set?.[Number(si)];if(s?.programId&&set&&!set.ok&&(set.r===''||set.r==null)){try{W.toast?.('Укажи фактически выполненные повторы')}catch(_){ }return}return cur.apply(this,arguments)};
    wrapped.__pr373=true;wrapped.__pr373Base=cur;W.toggleSet=wrapped;try{toggleSet=wrapped}catch(_){ }return true
  }

  function install(){installForm();installMethodRefresh();installSave();installPrescription();installBegin();installGroupCard();installCard();installEdit();installToggle();repairCurrent()}
  let queued=false;const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;install()})};
  const mo=typeof MutationObserver==='function'?new MutationObserver(queue):null;mo?.observe(D.documentElement,{childList:true,subtree:true});
  ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:cloud-ready','unvrsl:training-engine-ready'].forEach(ev=>W.addEventListener?.(ev,queue,{passive:true}));
  [0,60,140,300,700,1400,2600,5000].forEach(ms=>setTimeout(install,ms));setInterval(install,1200)
})();
