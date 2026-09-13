'use strict';
(()=>{
  const W=window,D=document,REV=376;
  if(W.__unvrslRepMethodUiV376)return;W.__unvrslRepMethodUiV376=true;

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const PRE=[
    {h:65,b:[12,15],i:[15,20]},
    {h:70,b:[10,12],i:[12,15]},
    {h:75,b:[8,10],i:[12,15]},
    {h:80,b:[6,8],i:[10,12]},
    {h:85,b:[4,6],i:[8,10]},
    {h:88,b:[4,6],i:[8,10]},
    {h:90,b:[3,5],i:[6,10]},
    {h:95,b:[2,4],i:[6,8]},
    {h:101,b:[1,3],i:[4,6]}
  ];
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const saveState=()=>{try{typeof save==='function'?save():W.save?.()}catch(_){}};
  const program=id=>{try{return typeof programById==='function'?programById(id):(state()?.programs||[]).find(p=>String(p?.id)===String(id))||null}catch(_){return null}};
  const label=(a,b,arrow=false)=>Number(a)===Number(b)?String(a):`${a}${arrow?'→':'–'}${b}`;
  const roundLoadV=v=>{try{return typeof roundLoad==='function'?roundLoad(v,2.5):Math.round(v/2.5)*2.5}catch(_){return Math.round(v/2.5)*2.5}};

  function kindOf(ex){
    const k=String(ex?.kind||D.getElementById('pmKind')?.value||'').toLowerCase();
    if(k==='compound'||k==='isolation')return k;
    return /(разгиб|сгиб|мах|развед|свед|бицеп|трицеп|кроссов|икр|дельт|канат|отвед|привед)/i.test(ex?.n||'')?'isolation':'compound'
  }
  function weekRange(p,wi,ex){
    const w=p?.weeks?.[Number(wi)];if(!w)return[8,10];const k=kindOf(ex);
    const direct=k==='isolation'?[N(w.isolationRepMin),N(w.isolationRepMax)]:[N(w.baseRepMin),N(w.baseRepMax)];
    if(direct[0]!=null&&direct[1]!=null)return[Math.min(...direct),Math.max(...direct)];
    let lo=N(w.intensityMin??w.weekIntensityMin??w.intensity?.min),hi=N(w.intensityMax??w.weekIntensityMax??w.intensity?.max);
    if(lo!=null&&lo<=1)lo*=100;if(hi!=null&&hi<=1)hi*=100;
    const mid=lo!=null&&hi!=null?(lo+hi)/2:72.5,x=PRE.find(x=>mid<=x.h)||PRE.at(-1);
    return(k==='isolation'?x.i:x.b).slice()
  }
  const dsAuto=r=>{
    const end=clamp(Math.round(r?.[1]??10),8,12),start=clamp(end+5,12,15);
    return dsInterpolate(start,end,5)
  };
  function dsInterpolate(start,end,count=5){
    const n=Math.max(2,count);return Array.from({length:n},(_,i)=>Math.max(1,Math.round(start+(end-start)*(i/(n-1)))))
  }
  const sldrAuto=r=>Number(r?.[1]||10)>=12?[15,12,10]:Number(r?.[1]||10)>=10?[12,10,8]:[10,8,6];
  function parseNumbers(v){return String(v??'').split(/[\s,;/→>-]+/).map(N).filter(n=>n!=null&&n>0).map(n=>clamp(Math.round(n),1,50))}
  function parseDs(v,fallback){const a=parseNumbers(v);if(a.length>=3)return a;if(a.length===2)return dsInterpolate(a[0],a[1],5);return fallback.slice()}
  function parseSldr(v,fallback){const a=parseNumbers(v);return a.length>=3?a.slice(0,3):fallback.slice()}
  function presetOf(a){return Array.isArray(a)&&a.join('/')==='10/8/6'?'10-8-6':Array.isArray(a)&&a.join('/')==='12/10/8'?'12-10-8':Array.isArray(a)&&a.join('/')==='15/12/10'?'15-12-10':'custom'}

  function currentCtx(){
    const u=(()=>{try{return typeof programUi!=='undefined'?programUi:null}catch(_){return null}})();
    const p=u?.pid?program(u.pid):null,wi=Number(u?.week)||0,di=Number(u?.day)||0,d=p?.weeks?.[wi]?.days?.[di],name=D.querySelector('#sheet h2')?.textContent?.trim()||'';
    const idx=d?.ex?.findIndex(e=>String(e?.n||'').trim()===name)??-1;
    return{pid:u?.pid,wi,di,n:name,existingIndex:idx>=0?idx:null}
  }
  function exAt(x){return x?.existingIndex==null?null:program(x.pid)?.weeks?.[Number(x.wi)]?.days?.[Number(x.di)]?.ex?.[Number(x.existingIndex)]||null}
  const keyOf=x=>`${x?.pid||''}:${x?.wi||0}:${x?.di||0}:${x?.existingIndex??'new'}:${x?.n||''}`;
  let transient={key:'',method:'',mode:'auto',preset:'',custom:''};
  function beginState(x,m,e){
    const key=keyOf(x);
    if(transient.key!==key||transient.method!==m){
      transient={key,method:m,mode:(String(e?.method||'').toUpperCase()===m&&e?.repMode==='manual')?'manual':'auto',preset:'',custom:''}
    }
    return transient
  }

  function ensureStyle(){
    if(D.getElementById('pr376-style'))return;
    const s=D.createElement('style');s.id='pr376-style';s.textContent=`
      #pr374mode{grid-column:1/-1;margin:12px 0 4px}.pr376-mode-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.pr376-mode-title{color:#9a9aa0;font-size:14px}.pr376-seg{display:flex;padding:3px;background:#29292d;border-radius:13px}.pr376-seg button{padding:9px 14px;border-radius:10px;color:#9a9aa0;font-weight:800}.pr376-seg button.on{background:#3b3b40;color:#fff}.pr376-seg button.auto.on{background:rgba(48,209,88,.17);color:#30d158}.pr376-help{margin-top:10px;padding:12px 14px;border:1px solid #303036;border-radius:15px;background:#1b1b1e;color:#9a9aa0;font-size:13px;line-height:1.45}.pr376-help b{color:#f0f0f2}.pr376-method-box{grid-column:1/-1;padding:12px;margin:8px 0;border:1px solid #303036;border-radius:18px;background:#19191c}.pr376-method-box .field{margin:10px 0}.pr376-method-box select,.pr376-method-box input{width:100%;background:#111113;border:1px solid #343438;border-radius:15px;color:#fff;padding:14px;font-size:17px}.pr376-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.pr376-grid3 label{font-size:12px;color:#89898f}.pr376-auto-scheme{font-size:22px;font-weight:850;letter-spacing:.01em;margin-top:8px}.pr376-hidden{display:none!important}.pr376-range input::placeholder,#start input[data-pr376-target]::placeholder{color:#8e8e93!important;opacity:.72!important;font-weight:760}
    `;D.head.appendChild(s)
  }
  function ensureMaxField(){
    const lo=D.getElementById('pmReps');if(!lo)return null;let hi=D.getElementById('pmRepsMax');if(hi)return hi;
    const f=D.createElement('div');f.className='field pr376-range';f.innerHTML='<label>Повторы до</label><input id="pmRepsMax" type="number" min="1" max="50">';lo.closest('.field')?.insertAdjacentElement('afterend',f);return f.querySelector('input')
  }
  function ensureModeBox(host){
    let box=D.getElementById('pr374mode');
    if(!box){box=D.createElement('div');box.id='pr374mode';host?.insertAdjacentElement('beforebegin',box)}
    box.innerHTML='<div class="pr376-mode-head"><span class="pr376-mode-title">Повторы</span><div class="pr376-seg"><button type="button" class="auto" data-pr376-mode="auto">Авто</button><button type="button" data-pr376-mode="manual">Вручную</button></div></div><div id="pr376help" class="pr376-help"></div>';
    box.querySelectorAll('[data-pr376-mode]').forEach(btn=>btn.onclick=e=>{e.preventDefault();e.stopPropagation();transient.mode=btn.dataset.pr376Mode;sync(true)});
    return box
  }
  function modeUi(box,mode){box?.querySelectorAll('[data-pr376-mode]').forEach(b=>b.classList.toggle('on',b.dataset.pr376Mode===mode));if(box)box.dataset.mode=mode}
  function setAutoRange(lo,hi,a,b){if(lo){lo.value='';lo.placeholder=String(a)}if(hi){hi.value='';hi.placeholder=String(b)}}
  function setManualRange(lo,hi,a,b,force){if(lo){lo.placeholder='';if(force||!lo.value)lo.value=String(a)}if(hi){hi.placeholder='';if(force||!hi.value)hi.value=String(b)}}

  function existingSldr(e,fallback){if(Array.isArray(e?.repPattern)&&e.repPattern.length>=3)return e.repPattern.slice(0,3).map(Number);const s=(e?.sets||[]).slice(0,3).map(x=>N(x?.r)).filter(Boolean);return s.length===3?s:fallback.slice()}
  function existingDs(e,fallback){if(Array.isArray(e?.dsRepPattern)&&e.dsRepPattern.length>=2)return e.dsRepPattern.map(Number);const s=(e?.sets||[]).map(x=>N(x?.r)).filter(Boolean);if(s.length>=2)return s;const a=N(e?.dsRepStart),b=N(e?.dsRepEnd);return a!=null&&b!=null?dsInterpolate(a,b,5):fallback.slice()}

  function renderSldr(box,e,r,force){
    const auto=sldrAuto(r),old=existingSldr(e,auto),mode=transient.mode;
    let preset=transient.preset||presetOf(mode==='manual'?old:auto);if(force&&mode==='manual'&&!transient.preset)preset=presetOf(old);
    if(mode==='auto')preset=presetOf(auto);transient.preset=preset;
    const chosen=preset==='10-8-6'?[10,8,6]:preset==='15-12-10'?[15,12,10]:preset==='12-10-8'?[12,10,8]:(transient.custom?parseSldr(transient.custom,old):old);
    box.innerHTML=`<div data-pr376-sldr="1"><div class="px-method-subtitle">SLDR</div><div class="pr376-method-box"><div class="muted small">3 рабочих подхода × 3 мини-подхода · один вес · 15 сек внутри</div>${mode==='auto'?`<div class="pr376-auto-scheme">${auto.join(' → ')}</div><div class="px-auto-help">Схема выбрана автоматически по интенсивности недели.</div>`:`<div class="field"><label>Схема SLDR</label><select id="pmSldrPreset376"><option value="10-8-6" ${preset==='10-8-6'?'selected':''}>10 → 8 → 6</option><option value="12-10-8" ${preset==='12-10-8'?'selected':''}>12 → 10 → 8</option><option value="15-12-10" ${preset==='15-12-10'?'selected':''}>15 → 12 → 10</option><option value="custom" ${preset==='custom'?'selected':''}>Своя схема</option></select></div><div id="pmSldrCustom376" class="${preset==='custom'?'':'pr376-hidden'}"><div class="pr376-grid3"><div><label>1-й</label><input id="pmSldr1_376" type="number" min="1" value="${chosen[0]}"></div><div><label>2-й</label><input id="pmSldr2_376" type="number" min="1" value="${chosen[1]}"></div><div><label>3-й</label><input id="pmSldr3_376" type="number" min="1" value="${chosen[2]}"></div></div></div>`}<input id="pmSldrPat374" type="hidden" value="${mode==='auto'?'':chosen.join('/')}"></div></div>`;
    const sel=D.getElementById('pmSldrPreset376');if(sel)sel.onchange=()=>{transient.preset=sel.value;const cur=sel.value==='10-8-6'?'10/8/6':sel.value==='12-10-8'?'12/10/8':sel.value==='15-12-10'?'15/12/10':chosen.join('/');transient.custom=cur;sync(false)};
    ['pmSldr1_376','pmSldr2_376','pmSldr3_376'].forEach(id=>{const el=D.getElementById(id);if(el)el.oninput=()=>{transient.custom=[N(D.getElementById('pmSldr1_376')?.value)||chosen[0],N(D.getElementById('pmSldr2_376')?.value)||chosen[1],N(D.getElementById('pmSldr3_376')?.value)||chosen[2]].join('/');const h=D.getElementById('pmSldrPat374');if(h)h.value=transient.custom}})
  }
  function renderDs(lo,hi,e,r,force,help){
    const auto=dsAuto(r),old=existingDs(e,auto),mode=transient.mode;
    lo.closest('.field')?.querySelector('label')&&(lo.closest('.field').querySelector('label').textContent='Первый дроп · повт.');
    hi.closest('.field')?.querySelector('label')&&(hi.closest('.field').querySelector('label').textContent='Последний дроп · повт.');
    if(mode==='auto'){setAutoRange(lo,hi,auto[0],auto.at(-1));if(help)help.innerHTML=`<b>Авто по неделе ${label(...r)}</b> · схема ${auto.join(' → ')}.`}
    else{setManualRange(lo,hi,old[0],old.at(-1),force);if(help)help.innerHTML=`<b>Вручную</b> · можно задать, например, 15 → 10. Пять ступеней распределятся между ними.`}
  }

  function sync(force=false){
    ensureStyle();const x=W.__pr374ctx||currentCtx(),p=program(x?.pid),e=exAt(x),m=String(D.getElementById('pmMethod')?.value||'STANDARD').toUpperCase(),lo=D.getElementById('pmReps');if(!lo)return false;
    const r=weekRange(p,x?.wi,e||x),hi=ensureMaxField(),lf=lo.closest('.field'),hf=hi?.closest('.field'),st=beginState(x,m,e),box=ensureModeBox(lf),help=D.getElementById('pr376help');modeUi(box,st.mode);
    D.getElementById('pr373SldrField')?.remove();
    const sldrBox=D.getElementById('pmSldrFields');
    box?.classList.toggle('pr376-hidden',m==='UNVRSL');
    if(m==='UNVRSL'){
      lf?.classList.add('pr376-hidden');hf?.classList.add('pr376-hidden');sldrBox?.classList.add('hidden');if(help)help.innerHTML='<b>UNVRSL</b> · повторения задаются фазами метода: 3 тяжёлых → 9 лёгких ×3 круга, затем 6 + 6.';return true
    }
    if(m==='SLDR'){
      lf?.classList.add('pr376-hidden');hf?.classList.add('pr376-hidden');sldrBox?.classList.remove('hidden');if(sldrBox)renderSldr(sldrBox,e,r,force);if(help)help.innerHTML=st.mode==='auto'?`<b>Авто по неделе ${label(...r)}</b> · SLDR ${sldrAuto(r).join(' → ')}.`:'<b>Вручную</b> · выбери готовую схему SLDR или задай свою.';return true
    }
    sldrBox?.classList.add('hidden');lf?.classList.remove('pr376-hidden');hf?.classList.remove('pr376-hidden');lf?.classList.add('pr376-range');hf?.classList.add('pr376-range');
    if(m==='DS'){renderDs(lo,hi,e,r,force,help);return true}
    lf?.querySelector('label')&&(lf.querySelector('label').textContent='Повторы от');hf?.querySelector('label')&&(hf.querySelector('label').textContent='Повторы до');
    const oldA=N(e?.repMin??e?.sets?.[0]?.targetRepMin??e?.sets?.[0]?.rMin),oldB=N(e?.repMax??e?.sets?.[0]?.targetRepMax??e?.sets?.[0]?.rMax);
    if(st.mode==='auto'){setAutoRange(lo,hi,r[0],r[1]);if(help)help.innerHTML=`<b>Рекомендация недели ${label(...r)}</b> · серым показана цель. Человек вводит фактические повторы в тренировке.`}
    else{setManualRange(lo,hi,oldA??r[0],oldB??r[1],force);if(help)help.innerHTML=`<b>Вручную</b> · неделя рекомендует ${label(...r)}, но у этого упражнения свой диапазон.`}
    return true
  }

  D.addEventListener('click',e=>{
    const b=e.target.closest?.('#pr374mode [data-pr376-mode]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();transient.mode=b.dataset.pr376Mode;sync(true)
  },true);

  function installForm(){
    let f=W.programExerciseForm;try{if(typeof programExerciseForm==='function')f=programExerciseForm}catch(_){ }if(typeof f!=='function'||f.__pr376)return false;const base=f;
    f=function(x){transient={key:'',method:'',mode:'auto',preset:'',custom:''};W.__pr374ctx=x;const out=base.apply(this,arguments);[0,30,90,180,360].forEach(ms=>setTimeout(()=>sync(false),ms));return out};f.__pr376=true;W.programExerciseForm=f;try{programExerciseForm=f}catch(_){ }return true
  }
  function installRefresh(){
    let f=W.programRefreshMethodUi;try{if(typeof programRefreshMethodUi==='function')f=programRefreshMethodUi}catch(_){ }if(typeof f!=='function'||f.__pr376)return false;const base=f;
    f=function(applyDefaults=false){const before=String(D.getElementById('pmMethod')?.value||'STANDARD').toUpperCase(),out=base.apply(this,arguments);if(applyDefaults){const x=W.__pr374ctx||currentCtx(),e=exAt(x),m=String(D.getElementById('pmMethod')?.value||before).toUpperCase();transient={key:keyOf(x),method:m,mode:(String(e?.method||'').toUpperCase()===m&&e?.repMode==='manual')?'manual':'auto',preset:'',custom:''}}[0,40,120].forEach(ms=>setTimeout(()=>sync(false),ms));return out};f.__pr376=true;W.programRefreshMethodUi=f;try{programRefreshMethodUi=f}catch(_){ }return true
  }

  function saveSldr(pid,wi,di,nameToken,sourceToken,bpToken,tgToken,eqToken,index){
    const p=program(pid),d=p?.weeks?.[wi]?.days?.[di];if(!p||!d)return;const idx=index==null||String(index)==='null'||Number.isNaN(Number(index))?null:Number(index),old=idx==null?null:d.ex?.[idx],r=weekRange(p,wi,old||{n:decodeURIComponent(nameToken||'')}),mode=transient.mode==='manual'?'manual':'auto',auto=sldrAuto(r);
    let pat=auto;if(mode==='manual'){const preset=D.getElementById('pmSldrPreset376')?.value||transient.preset||'12-10-8';if(preset==='10-8-6')pat=[10,8,6];else if(preset==='15-12-10')pat=[15,12,10];else if(preset==='12-10-8')pat=[12,10,8];else pat=parseSldr([D.getElementById('pmSldr1_376')?.value,D.getElementById('pmSldr2_376')?.value,D.getElementById('pmSldr3_376')?.value].join('/'),auto)}
    const k=D.getElementById('pmKind')?.value||kindOf(old),restMode=D.getElementById('pmRestMode')?.value||'auto',rest=restMode==='auto'&&W.programAutoRest?W.programAutoRest(k,'SLDR'):Math.max(0,N(D.getElementById('pmRest')?.value)||90),w=Math.max(0,N(D.getElementById('pmWeight')?.value)||0),rpe=N(D.getElementById('pmRpe')?.value)||8,tempo=D.getElementById('pmTempo')?.value?.trim()||(k==='compound'?'2-1-1':'3-1-2');
    const sets=Array.from({length:3},(_,round)=>pat.map((q,mini)=>({label:`Круг ${round+1}/3 · ${mini+1}/3`,role:'sldr-mini',round:round+1,mini:mini+1,w,r:q,rMin:q,rMax:q,targetRepMin:q,targetRepMax:q,targetRepLabel:String(q),rest:mini<2?15:rest,tempo}))).flat();
    const obj={...(old||{}),id:old?.id||(typeof uid==='function'?uid('pex'):`pex-${Date.now()}`),n:decodeURIComponent(nameToken||''),sourceId:decodeURIComponent(sourceToken||'')||null,bp:decodeURIComponent(bpToken||''),tg:decodeURIComponent(tgToken||''),eq:decodeURIComponent(eqToken||''),kind:k,method:'SLDR',repMode:mode,repPolicyRevision:REV,repPattern:pat.slice(),sldrPattern:pat.join('/'),sldrRounds:3,miniSets:3,rpe,tempo,restMode,rest,innerRest:15,note:D.getElementById('pmNote')?.value.trim()||'',sets};
    if(idx==null)d.ex.push(obj);else d.ex[idx]=obj;p.updated=Date.now();saveState();typeof openProgramEditor==='function'&&openProgramEditor(pid,wi,di)
  }
  function saveDs(pid,wi,di,nameToken,sourceToken,bpToken,tgToken,eqToken,index){
    const p=program(pid),d=p?.weeks?.[wi]?.days?.[di];if(!p||!d)return;const idx=index==null||String(index)==='null'||Number.isNaN(Number(index))?null:Number(index),old=idx==null?null:d.ex?.[idx],r=weekRange(p,wi,old||{n:decodeURIComponent(nameToken||'')}),mode=transient.mode==='manual'?'manual':'auto',auto=dsAuto(r),lo=N(D.getElementById('pmReps')?.value),hi=N(D.getElementById('pmRepsMax')?.value),pat=mode==='auto'?auto:dsInterpolate(lo??auto[0],hi??auto.at(-1),5);
    const k=D.getElementById('pmKind')?.value||kindOf(old),restMode=D.getElementById('pmRestMode')?.value||'auto',rest=restMode==='auto'&&W.programAutoRest?W.programAutoRest(k,'DS'):Math.max(0,N(D.getElementById('pmRest')?.value)||90),w=Math.max(0,N(D.getElementById('pmWeight')?.value)||0),rpe=N(D.getElementById('pmRpe')?.value)||8,tempo=D.getElementById('pmTempo')?.value?.trim()||(k==='compound'?'2-1-1':'3-1-2');
    const sets=pat.map((q,i)=>({label:`DS${i+1}`,role:'drop',w:roundLoadV(w*Math.pow(.8,i)),r:q,rMin:q,rMax:q,targetRepMin:q,targetRepMax:q,targetRepLabel:String(q),rest:i<pat.length-1?0:rest,tempo}));
    const obj={...(old||{}),id:old?.id||(typeof uid==='function'?uid('pex'):`pex-${Date.now()}`),n:decodeURIComponent(nameToken||''),sourceId:decodeURIComponent(sourceToken||'')||null,bp:decodeURIComponent(bpToken||''),tg:decodeURIComponent(tgToken||''),eq:decodeURIComponent(eqToken||''),kind:k,method:'DS',repMode:mode,repPolicyRevision:REV,dsRepStart:pat[0],dsRepEnd:pat.at(-1),dsRepPattern:pat.slice(),repMin:Math.min(...pat),repMax:Math.max(...pat),rpe,tempo,restMode,rest,innerRest:0,note:D.getElementById('pmNote')?.value.trim()||'',sets};
    if(idx==null)d.ex.push(obj);else d.ex[idx]=obj;p.updated=Date.now();saveState();typeof openProgramEditor==='function'&&openProgramEditor(pid,wi,di)
  }
  function installSave(){
    let f=W.saveProgramExercise;try{if(typeof saveProgramExercise==='function')f=saveProgramExercise}catch(_){ }if(typeof f!=='function'||f.__pr376)return false;const base=f;
    f=function(pid,wi,di,name,source,bp,tg,eq,index){const m=String(D.getElementById('pmMethod')?.value||'STANDARD').toUpperCase();if(m==='SLDR')return saveSldr(pid,wi,di,name,source,bp,tg,eq,index);if(m==='DS')return saveDs(pid,wi,di,name,source,bp,tg,eq,index);const box=D.getElementById('pr374mode');if(box)box.dataset.mode=transient.mode==='manual'?'manual':'auto';return base.apply(this,arguments)};f.__pr376=true;W.saveProgramExercise=f;try{saveProgramExercise=f}catch(_){ }return true
  }

  function install(){installForm();installRefresh();installSave()}
  [0,60,180,500,1000,1800].forEach(ms=>setTimeout(install,ms));
  W.addEventListener?.('unvrsl:app-ready',install,{passive:true});
})();