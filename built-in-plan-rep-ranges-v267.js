'use strict';
(()=>{
  const W=window,D=document,REV=372;
  W.__unvrslBuiltInPlanRepRangesV267=true;
  W.__unvrslBuiltInPlanRepRangesAppliedV267=false;
  if(W.__unvrslProgramRepPolicyV372)return;
  W.__unvrslProgramRepPolicyV372=true;

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
  const pair=(a,b)=>{let lo=N(a),hi=N(b);if(lo==null||hi==null)return null;lo=clamp(Math.round(lo),1,50);hi=clamp(Math.round(hi),1,50);return [lo,hi]};
  const label=r=>r?(r[0]===r[1]?String(r[0]):`${r[0]}–${r[1]}`):'–';
  const methodOwn=m=>['UNVRSL','SLDR'].includes(String(m||'').toUpperCase());
  const baseName=n=>String(n||'').replace(/\s+—\s+.*$/,'').trim().toLowerCase();

  function exerciseKind(ex){
    try{const k=W.trainingLoadModel258?.exerciseKind?.({n:ex?.n||'',method:'STANDARD'});if(k==='compound'||k==='isolation')return k}catch(_){ }
    const s=String(ex?.n||'').toLowerCase();
    return /(разгибан|сгибан|подъ[её]м|мах|разведен|сведен|бицеп|трицеп|кроссов|икр|дельт|бабоч|канат)/.test(s)?'isolation':'compound'
  }
  function intensityBand(w){
    let lo=N(w?.intensityMin??w?.weekIntensityMin??w?.intensity?.min),hi=N(w?.intensityMax??w?.weekIntensityMax??w?.intensity?.max);
    if(lo!=null&&lo<=1)lo*=100;if(hi!=null&&hi<=1)hi*=100;
    if(lo==null||hi==null)return[70,75];
    return[Math.min(lo,hi),Math.max(lo,hi)]
  }
  function presetFor(w){
    const band=intensityBand(w),mid=(band[0]+band[1])/2;
    return PRESETS.find(x=>mid<=x.hi)||PRESETS.at(-1)
  }
  function autoRange(p,wi,ex){
    const w=p?.weeks?.[Number(wi)];if(!w)return[8,10];
    const kind=exerciseKind(ex);
    if(w.repGuidanceManual===true){
      const manual=kind==='isolation'?pair(w.isolationRepMin,w.isolationRepMax):pair(w.baseRepMin,w.baseRepMax);
      if(manual)return manual
    }
    const pr=presetFor(w);return(kind==='isolation'?pr.iso:pr.base).slice()
  }
  function savedRange(ex){return pair(ex?.repMin??ex?.sets?.[0]?.rMin??ex?.sets?.[0]?.targetRepMin,ex?.repMax??ex?.sets?.[0]?.rMax??ex?.sets?.[0]?.targetRepMax)}
  function chosenRange(p,wi,ex){return ex?.repMode==='manual'?(savedRange(ex)||autoRange(p,wi,ex)):autoRange(p,wi,ex)}
  function editorExercise(x){if(x?.existingIndex===null||x?.existingIndex===undefined)return null;return program(x.pid)?.weeks?.[Number(x.wi)]?.days?.[Number(x.di)]?.ex?.[Number(x.existingIndex)]||null}

  function ensureStyle(){
    if(D.getElementById('program-rep-policy-v372-style'))return;
    const s=D.createElement('style');s.id='program-rep-policy-v372-style';s.textContent=`
      .pr372-note{margin:8px 0 12px;padding:10px 11px;border:1px solid #303034;border-radius:14px;background:#1a1a1d;color:#a4a4aa;font-size:12px;line-height:1.4}
      .pr372-note b{color:#f2f2f4}.pr372-reset{margin-top:8px;width:100%}
      .pr372-auto-input{color:#f5f5f7}.pr372-auto-input::placeholder{color:#8e8e93;opacity:.48;font-weight:650}
      .pr372-target-ghost::placeholder{color:#a4a4aa;opacity:.55;font-weight:700}
    `;D.head?.appendChild(s)
  }

  function formContext(){
    const u=ui(),p=u?.pid?program(u.pid):null,wi=Number(u?.week)||0,di=Number(u?.day)||0,d=p?.weeks?.[wi]?.days?.[di],name=D.querySelector('#sheet h2')?.textContent?.trim();
    const idx=d?.ex?.findIndex(e=>String(e.n).trim()===String(name).trim())??-1;
    return {pid:u?.pid,wi,di,existingIndex:idx>=0?idx:null,n:name}
  }
  function applyAutoPlaceholders(lo,hi,r){
    lo.value='';lo.placeholder=String(r[0]);lo.classList.add('pr372-auto-input');
    if(hi){hi.value='';hi.placeholder=String(r[1]);hi.classList.add('pr372-auto-input')}
  }
  function applyManualValues(lo,hi,r,auto){
    lo.value=String(r[0]);lo.placeholder=String(auto[0]);lo.classList.remove('pr372-auto-input');
    if(hi){hi.value=String(r[1]);hi.placeholder=String(auto[1]);hi.classList.remove('pr372-auto-input')}
  }
  function syncForm(x){
    ensureStyle();
    const lo=D.getElementById('pmReps'),hi=D.getElementById('pmRepsMax'),method=String(D.getElementById('pmMethod')?.value||'STANDARD').toUpperCase();
    if(!lo)return false;
    const p=program(x?.pid),ex=editorExercise(x),auto=autoRange(p,x?.wi,x||ex||{}),manual=ex?.repMode==='manual';
    const lf=lo.closest('.field'),hf=hi?.closest('.field');
    D.querySelector('#sheet .pr372-note')?.remove();
    const oldNote=D.querySelector('#sheet .pr266-range-note');if(oldNote)oldNote.style.display='none';
    const own=methodOwn(method);
    if(lf)lf.style.display=own?'none':'';if(hf)hf.style.display=own?'none':'';
    if(own)return true;
    if(lf?.querySelector('label'))lf.querySelector('label').textContent='Повторы от';
    if(hf?.querySelector('label'))hf.querySelector('label').textContent='Повторы до';

    if(!lo.dataset.pr372Touched){
      if(manual)applyManualValues(lo,hi,savedRange(ex)||auto,auto);
      else applyAutoPlaceholders(lo,hi,auto)
    }

    const host=hf||lf;
    if(host){
      const note=D.createElement('div');note.className='pr372-note';
      const effective=manual?(savedRange(ex)||auto):auto;
      note.innerHTML=manual
        ?`<b>Ручной диапазон · ${label(effective)}</b><br>Рекомендация недели: ${label(auto)}.<button type="button" class="btn tiny pr372-reset">Вернуть авто · ${label(auto)}</button>`
        :`<b>Авто по неделе · ${label(auto)}</b><br>Серые числа в полях — подсказка. Введи свои значения только если хочешь переопределить диапазон для этого упражнения.`;
      host.insertAdjacentElement('afterend',note);
      note.querySelector('.pr372-reset')?.addEventListener('click',e=>{
        e.preventDefault();lo.dataset.pr372Touched='';if(hi)hi.dataset.pr372Touched='';if(ex)ex.repMode='auto';applyAutoPlaceholders(lo,hi,auto);syncForm(x)
      })
    }

    const touch=e=>{
      if(!e.isTrusted)return;
      lo.dataset.pr372Touched='1';if(hi)hi.dataset.pr372Touched='1';
      lo.classList.remove('pr372-auto-input');hi?.classList.remove('pr372-auto-input');
      const a=N(lo.value)??auto[0],b=N(hi?.value)??auto[1],note=D.querySelector('#sheet .pr372-note');
      if(note)note.innerHTML=`<b>Ручной диапазон · ${a}–${b}</b><br>После сохранения он будет иметь приоритет над неделей.`
    };
    if(lo.dataset.pr372Bound!=='1'){lo.dataset.pr372Bound='1';lo.addEventListener('input',touch,{passive:true})}
    if(hi&&hi.dataset.pr372Bound!=='1'){hi.dataset.pr372Bound='1';hi.addEventListener('input',touch,{passive:true})}
    return true
  }

  function installForm(){
    let cur=W.programExerciseForm;try{if(typeof programExerciseForm==='function')cur=programExerciseForm}catch(_){ }
    if(typeof cur!=='function'||cur.__pr372)return false;
    const wrapped=function(x){const out=cur.apply(this,arguments);[0,30,100,220].forEach(ms=>setTimeout(()=>syncForm(x),ms));return out};
    wrapped.__pr372=true;wrapped.__pr372Base=cur;W.programExerciseForm=wrapped;try{programExerciseForm=wrapped}catch(_){ }return true
  }
  function installMethod(){
    let cur=W.programMethodDefaults;try{if(typeof programMethodDefaults==='function')cur=programMethodDefaults}catch(_){ }
    if(typeof cur!=='function'||cur.__pr372)return false;
    const wrapped=function(){const out=cur.apply(this,arguments),x=formContext();[0,40,120].forEach(ms=>setTimeout(()=>syncForm(x),ms));return out};
    wrapped.__pr372=true;wrapped.__pr372Base=cur;W.programMethodDefaults=wrapped;try{programMethodDefaults=wrapped}catch(_){ }return true
  }

  function installSave(){
    let cur=W.saveProgramExercise;try{if(typeof saveProgramExercise==='function')cur=saveProgramExercise}catch(_){ }
    if(typeof cur!=='function'||cur.__pr372)return false;
    const wrapped=function(pid,wi,di,nameToken,sourceId,bp,tg,eq,existingIndex){
      const method=String(D.getElementById('pmMethod')?.value||'STANDARD').toUpperCase(),loEl=D.getElementById('pmReps'),hiEl=D.getElementById('pmRepsMax');
      const p0=program(pid),old=existingIndex==null?null:p0?.weeks?.[Number(wi)]?.days?.[Number(di)]?.ex?.[Number(existingIndex)],manualTouched=loEl?.dataset.pr372Touched==='1'||hiEl?.dataset.pr372Touched==='1',keepManual=old?.repMode==='manual';
      const auto=autoRange(p0,wi,old||{n:decodeURIComponent(nameToken)});
      let manual=!methodOwn(method)&&!!(manualTouched||keepManual),picked=auto;
      if(!methodOwn(method)){
        const lo=N(loEl?.value)??auto[0],hi=N(hiEl?.value)??auto[1];
        if(manual&&lo>hi){try{W.toast?.('Повторы: «от» не может быть больше «до»')}catch(_){ }return}
        picked=manual?[lo,hi]:auto;
        if(loEl)loEl.value=String(picked[0]);if(hiEl)hiEl.value=String(picked[1])
      }
      const out=cur.apply(this,arguments),p=program(pid),d=p?.weeks?.[Number(wi)]?.days?.[Number(di)],idx=existingIndex==null||Number.isNaN(Number(existingIndex))?(d?.ex?.length||1)-1:Number(existingIndex),ex=d?.ex?.[idx];
      if(!ex)return out;
      if(methodOwn(method)){
        ex.repMode='method';delete ex.repMin;delete ex.repMax;delete ex.repRange
      }else{
        ex.repMode=manual?'manual':'auto';ex.repMin=picked[0];ex.repMax=picked[1];ex.repRange=label(picked);ex.repPolicyRevision=REV;
        (ex.sets||[]).forEach(s=>{s.r=picked[0];s.rMin=picked[0];s.rMax=picked[1];s.targetRepMin=picked[0];s.targetRepMax=picked[1]})
      }
      p.updated=Date.now();saveState();setTimeout(()=>{try{typeof renderProgramEditor==='function'&&renderProgramEditor()}catch(_){ }},0);return out
    };
    wrapped.__pr372=true;wrapped.__pr372Base=cur;W.saveProgramExercise=wrapped;try{saveProgramExercise=wrapped}catch(_){ }return true
  }

  function findBlock(blocks,ex){
    const name=baseName(ex?.n);return blocks.find(b=>baseName(b?.n)===name)||null
  }
  function installBegin(){
    let cur=W.beginProgramDay;try{if(typeof beginProgramDay==='function')cur=beginProgramDay}catch(_){ }
    if(typeof cur!=='function'||cur.__pr372)return false;
    const wrapped=function(pid,wi,di){
      const p=program(pid),blocks=p?.weeks?.[Number(wi)]?.days?.[Number(di)]?.ex||[],out=cur.apply(this,arguments),current=state()?.current;
      if(!current||String(current.programId)!==String(pid))return out;
      (current.ex||[]).forEach(ex=>{
        const block=findBlock(blocks,ex);if(!block||methodOwn(block.method))return;
        const r=chosenRange(p,wi,block);
        (ex.set||[]).forEach(set=>{
          set.targetRepMin=r[0];set.targetRepMax=r[1];set.repMode=block.repMode||'auto';set.repPolicyRevision=REV;
          if(set.repEntered==null)set.repEntered=!!set.ok
        })
      });
      current.repPolicyRevision=REV;saveState();try{W.startPage?.()}catch(_){ }return out
    };
    wrapped.__pr372=true;wrapped.__pr372Base=cur;W.beginProgramDay=wrapped;try{beginProgramDay=wrapped}catch(_){ }return true
  }

  function installCard(){
    let cur=W.exerciseCard;try{if(typeof exerciseCard==='function')cur=exerciseCard}catch(_){ }
    if(typeof cur!=='function'||cur.__pr372)return false;
    const wrapped=function(s,e,ei){
      let html=cur.apply(this,arguments);if(!html||!s?.programId)return html;
      const sets=e?.set||[];if(!sets.some(x=>N(x?.targetRepMin)!=null&&N(x?.targetRepMax)!=null))return html;
      const box=D.createElement('div');box.innerHTML=html;const rows=box.querySelectorAll('.setrow');
      rows.forEach((row,si)=>{
        const set=sets[si],lo=N(set?.targetRepMin),hi=N(set?.targetRepMax);if(lo==null||hi==null)return;
        const inputs=row.querySelectorAll('input'),rep=inputs[1];if(!rep)return;
        rep.placeholder=lo===hi?String(lo):`${lo}–${hi}`;rep.classList.add('pr372-target-ghost');
        if(!set.repEntered&&!set.ok)rep.value=''
      });
      box.querySelectorAll('.unvrsl-program-rep-target-v371').forEach(n=>n.remove());
      return box.innerHTML
    };
    wrapped.__pr372=true;wrapped.__pr372Base=cur;W.exerciseCard=wrapped;try{exerciseCard=wrapped}catch(_){ }return true
  }

  function installEdit(){
    let cur=W.editSet;try{if(typeof editSet==='function')cur=editSet}catch(_){ }
    if(typeof cur!=='function'||cur.__pr372)return false;
    const wrapped=function(ei,si,k,v){
      const set=state()?.current?.ex?.[ei]?.set?.[si];if(k==='r'&&state()?.current?.programId&&set&&N(set.targetRepMin)!=null){set.repEntered=String(v??'').trim()!==''}
      const out=cur.apply(this,arguments);saveState();return out
    };
    wrapped.__pr372=true;wrapped.__pr372Base=cur;W.editSet=wrapped;try{editSet=wrapped}catch(_){ }return true
  }
  function installToggle(){
    let cur=W.toggleSet;try{if(typeof toggleSet==='function')cur=toggleSet}catch(_){ }
    if(typeof cur!=='function'||cur.__pr372)return false;
    const wrapped=function(ei,si){
      const s=state()?.current,set=s?.ex?.[ei]?.set?.[si];
      if(s?.programId&&set&&!set.ok&&N(set.targetRepMin)!=null&&!set.repEntered){try{W.toast?.('Укажи фактические повторы')}catch(_){ }return}
      return cur.apply(this,arguments)
    };
    wrapped.__pr372=true;wrapped.__pr372Base=cur;W.toggleSet=wrapped;try{toggleSet=wrapped}catch(_){ }return true
  }

  function install(){ensureStyle();installForm();installMethod();installSave();installBegin();installCard();installEdit();installToggle()}
  ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:training-engine-ready','unvrsl:cloud-ready'].forEach(e=>W.addEventListener?.(e,install,{passive:true}));
  [0,100,300,700,1400,2600,5000].forEach(ms=>setTimeout(install,ms));
})();
