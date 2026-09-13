'use strict';
(()=>{
  const W=window,D=document,REV=384;
  if(W.__unvrslProgramRepRangeV384)return;
  W.__unvrslProgramRepRangeV384=true;
  W.__unvrslRepPolicy374=true;
  W.__unvrslProgramRepRangeV266=true;

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const num=v=>N(v)??0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const label=(a,b,arrow=false)=>Number(a)===Number(b)?String(a):`${a}${arrow?'→':'–'}${b}`;
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const program=id=>{try{return typeof programById==='function'?programById(id):(state()?.programs||[]).find(p=>String(p?.id)===String(id))||null}catch(_){return null}};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};
  const baseName=n=>{try{return W.baseExerciseName?W.baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim()}catch(_){return String(n||'')}};
  const roundLoad=(v,ex=null)=>{let step=2.5;try{step=Number(W.loadStepFor?.(baseName(ex?.n||''),ex?.sourceId||null))||step}catch(_){}return Math.max(0,Math.round(num(v)/step)*step)};
  const safeId=()=>{try{return typeof uid==='function'?uid('pex'):`pex-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}catch(_){return`pex-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}};
  const methodOf=()=>String(D.getElementById('pmMethod')?.value||'STANDARD').toUpperCase();
  const editingExercise=x=>x?.existingIndex!==null&&x?.existingIndex!==undefined?program(x.pid)?.weeks?.[x.wi]?.days?.[x.di]?.ex?.[x.existingIndex]||null:null;
  const inferKind=(name,stored)=>{if(stored==='compound'||stored==='isolation')return stored;try{return W.programInferExerciseKind?.(name)||'compound'}catch(_){return /разгиб|сгиб|мах|развед|свед|бицеп|трицеп|икр|отвед|привед/i.test(name||'')?'isolation':'compound'}};

  const PRE=[
    {h:70,b:[10,12],i:[12,15]},
    {h:75,b:[8,10],i:[12,15]},
    {h:80,b:[6,8],i:[10,12]},
    {h:85,b:[5,7],i:[8,12]},
    {h:88,b:[4,6],i:[8,10]},
    {h:90,b:[3,5],i:[6,10]},
    {h:95,b:[2,4],i:[6,8]},
    {h:101,b:[1,3],i:[4,6]}
  ];
  function intensityBand(p,wi){
    const w=p?.weeks?.[Number(wi)];if(!w)return[70,75];
    let lo=N(w.intensityMin??w.weekIntensityMin??w.intensity?.min),hi=N(w.intensityMax??w.weekIntensityMax??w.intensity?.max);
    if(lo!=null&&lo<=1)lo*=100;if(hi!=null&&hi<=1)hi*=100;
    if(lo==null||hi==null)return[70,75];
    if(Math.min(lo,hi)===60&&Math.max(lo,hi)===65){lo=60;hi=70}
    return[Math.min(lo,hi),Math.max(lo,hi)]
  }
  function weekRange(p,wi,e){
    const w=p?.weeks?.[Number(wi)],kind=inferKind(e?.n,e?.kind),direct=kind==='isolation'?[N(w?.isolationRepMin),N(w?.isolationRepMax)]:[N(w?.baseRepMin),N(w?.baseRepMax)];
    if(direct[0]!=null&&direct[1]!=null)return[Math.min(...direct),Math.max(...direct)];
    const band=intensityBand(p,wi),mid=(band[0]+band[1])/2,x=PRE.find(v=>mid<=v.h)||PRE.at(-1);return(kind==='isolation'?x.i:x.b).slice()
  }
  function weekRpeRange(p,wi,e){
    if(e?.rpeMode==='manual'&&N(e.rpeMin)!=null&&N(e.rpeMax)!=null)return[Math.min(N(e.rpeMin),N(e.rpeMax)),Math.max(N(e.rpeMin),N(e.rpeMax))];
    const w=p?.weeks?.[Number(wi)];let lo=N(w?.rpeMin??w?.weekRpeMin),hi=N(w?.rpeMax??w?.weekRpeMax);
    try{const pr=W.unvrslWeekLoadProfileV263?.(p,Number(wi),true);lo=lo??N(pr?.rpeMin);hi=hi??N(pr?.rpeMax)}catch(_){}
    if(lo==null||hi==null){const x=N(e?.rpe)??8;return[x,x]}
    return[Math.min(lo,hi),Math.max(lo,hi)]
  }
  const midpoint=r=>Math.round(((Number(r?.[0]||8)+Number(r?.[1]||8))/2)*2)/2;
  const rirRange=r=>[Math.max(0,10-Number(r?.[1]||8)),Math.max(0,10-Number(r?.[0]||8))];
  const repMode=e=>e?.repMode==='manual'?'manual':'auto';
  const genericWeightMode=e=>e?.weightMode==='manual'?'manual':e?.weightMode==='auto'?'auto':(e?.sets||[]).some(s=>num(s?.w)>0)?'manual':'auto';

  function style(){
    if(D.getElementById('pr384-style'))return;
    const s=D.createElement('style');s.id='pr384-style';s.textContent=`
      .pr384-seg{display:flex;background:#29292d;border-radius:13px;padding:3px;gap:2px}.pr384-seg button{flex:1;padding:8px 9px;border-radius:10px;color:#98989e;font-size:12px;font-weight:800}.pr384-seg button.on{background:#3b3b40;color:#fff}.pr384-seg button.auto.on{background:rgba(48,209,88,.17);color:#30d158}.pr384-note{grid-column:1/-1;padding:10px 12px;border:1px solid #303036;background:#1a1a1d;border-radius:14px;color:#909096;font-size:12px;line-height:1.4;margin:3px 0 8px}.pr384-phase{grid-column:1/-1;padding:12px;border:1px solid #303036;background:#171719;border-radius:16px;margin:7px 0}.pr384-phase-title{font-size:13px;font-weight:850;color:#e6e6ea;margin-bottom:9px}.pr384-grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pr384-grid2 .field{margin:0 0 8px}.pr384-weight-row{display:grid;grid-template-columns:1fr 1.1fr;gap:8px;align-items:end}.pr384-weight-row .field{margin:0}.pr384-auto-input:disabled{opacity:.56}.pr384-rpe{grid-column:1/-1;color:#9c9ca2;font-size:12px;font-weight:750;margin:2px 0 6px}.pr384-ds-table{display:grid;gap:7px;margin-top:8px}.pr384-ds-row{display:grid;grid-template-columns:32px 1fr 1fr;gap:7px;align-items:center}.pr384-ds-row span{color:#85858b;font-size:12px;text-align:center}.pr384-ds-row input{min-width:0}.pr384-hidden{display:none!important}.pr384-range input:disabled{opacity:.6}.pr384-method-summary{grid-column:1/-1;padding:10px 12px;border:1px solid #303036;border-radius:14px;background:#1a1a1d;color:#9b9ba1;font-size:12px;line-height:1.4;margin-top:5px}
    `;D.head.appendChild(s)
  }
  function field(id){return D.getElementById(id)}
  function fieldWrap(id){return field(id)?.closest('.field')||null}
  function ensureRepMax(){
    const min=field('pmReps');if(!min)return null;let max=field('pmRepsMax');if(max)return max;
    const f=D.createElement('div');f.className='field pr384-range';f.innerHTML='<label>Повторы до</label><input id="pmRepsMax" type="number" min="1" max="50">';min.closest('.field')?.insertAdjacentElement('afterend',f);return f.querySelector('input')
  }
  function ensureRepMode(host,e){
    let box=field('pr384RepMode');if(box)return box;
    box=D.createElement('div');box.id='pr384RepMode';box.className='px-span-2';box.dataset.mode=repMode(e);box.innerHTML='<div class="px-choice-label" style="margin-bottom:7px">Диапазон повторов</div><div class="pr384-seg"><button type="button" class="auto" data-pr384-rep="auto">Авто</button><button type="button" data-pr384-rep="manual">Вручную</button></div><div id="pr384RepHelp" class="pr384-note"></div>';
    host?.insertAdjacentElement('beforebegin',box);box.querySelectorAll('[data-pr384-rep]').forEach(b=>b.onclick=()=>{box.dataset.mode=b.dataset.pr384Rep;renderGenericRange(true)});return box
  }
  function renderGenericRange(reset=false){
    const x=W.__pr384ctx||{},p=program(x.pid),e=editingExercise(x)||{},m=methodOf(),min=field('pmReps'),max=ensureRepMax();if(!min||!max)return;
    const box=ensureRepMode(min.closest('.field'),e),mode=box?.dataset.mode||repMode(e),wr=weekRange(p,x.wi,e||x),manualMin=N(e.repMin)??N(min.value)??wr[0],manualMax=N(e.repMax)??N(max.value)??wr[1];
    box.querySelectorAll('[data-pr384-rep]').forEach(b=>b.classList.toggle('on',b.dataset.pr384Rep===mode));
    const hidden=['UNVRSL','SLDR'].includes(m);box.classList.toggle('pr384-hidden',hidden);min.closest('.field')?.classList.toggle('pr384-hidden',hidden);max.closest('.field')?.classList.toggle('pr384-hidden',hidden);
    if(hidden)return;
    const isDs=m==='DS';min.closest('.field')?.querySelector('label')&&(min.closest('.field').querySelector('label').textContent=isDs?'Первый дроп · повт.':'Повторы от');max.closest('.field')?.querySelector('label')&&(max.closest('.field').querySelector('label').textContent=isDs?'Последний дроп · повт.':'Повторы до');
    if(mode==='auto'){
      const auto=isDs?[Math.min(15,Math.max(12,wr[1]+4)),Math.max(8,Math.min(12,wr[1]))]:wr;
      min.value=auto[0];max.value=auto[1];min.disabled=max.disabled=true;field('pr384RepHelp').innerHTML=`<b>Авто ${label(auto[0],auto[1],isDs)}</b> · диапазон берётся из профиля недели и типа упражнения.`
    }else{
      min.disabled=max.disabled=false;if(reset){min.value=wr[0];max.value=wr[1]}else{min.value=manualMin;max.value=manualMax}field('pr384RepHelp').innerHTML=isDs?'<b>Вручную.</b> Первый дроп может иметь больше повторений, последний — меньше.':'<b>Вручную.</b> Этот диапазон попадёт в тренировку как цель, например 10–12.'
    }
  }
  function rpePreview(x,e){
    const p=program(x.pid),r=weekRpeRange(p,x.wi,e),rir=rirRange(r);let n=field('pr384RpePreview');if(!n){n=D.createElement('div');n.id='pr384RpePreview';n.className='pr384-rpe';const a=field('pmRpe')?.closest('.field');a?.insertAdjacentElement('afterend',n)}
    if(n)n.textContent=`Цель недели: RPE ${label(r[0],r[1])} · RIR ${label(rir[0],rir[1])}`;
    const rp=field('pmRpe');if(rp){rp.value=midpoint(r);rp.closest('.field')?.classList.add('pr384-hidden')}
  }
  function modeSelect(id,mode,handler){return `<div class="pr384-seg" id="${id}"><button type="button" class="auto ${mode==='auto'?'on':''}" data-mode="auto" onclick="${handler}('auto')">Авто</button><button type="button" class="${mode==='manual'?'on':''}" data-mode="manual" onclick="${handler}('manual')">Вручную</button></div>`}
  function phaseData(e,role,defaults){
    const sets=(e?.sets||[]).filter(s=>s.role===role),first=sets[0]||{},cap=role==='middle'?'Middle':role==='light'?'Light':'Heavy';
    const min=N(e?.[`${role}RepMin`]??first.targetRepMin??first.rMin??e?.[`${role}Reps`]??first.r)??defaults.reps[0],max=N(e?.[`${role}RepMax`]??first.targetRepMax??first.rMax??e?.[`${role}Reps`]??first.r)??defaults.reps[1];
    const weight=N(e?.[`${role}Weight`]??first.w)??0,stored=e?.[`${role}WeightMode`]||first.weightMode,mode=stored==='manual'||(stored==null&&weight>0)?'manual':'auto';return{min,max,weight,mode,cap}
  }
  function phaseHtml(role,title,data,repsMax=30){
    const C=data.cap;return `<div class="pr384-phase"><div class="pr384-phase-title">${title}</div><div class="pr384-grid2"><div class="field"><label>Повторы от</label><input id="pm${C}RepMin384" type="number" min="1" max="${repsMax}" value="${data.min}"></div><div class="field"><label>до</label><input id="pm${C}RepMax384" type="number" min="1" max="${repsMax}" value="${data.max}"></div></div><div class="pr384-weight-row"><div><label class="px-choice-label">Вес</label>${modeSelect(`pm${C}WeightMode384`,data.mode,`pr384PhaseWeightMode.bind(null,'${C}')`)}</div><div class="field"><label>кг</label><input id="pm${C}Weight384" inputmode="decimal" value="${data.weight||''}" placeholder="Автовес" ${data.mode==='auto'?'disabled':''}></div></div></div>`}
  W.pr384PhaseWeightMode=function(cap,mode){const box=field(`pm${cap}WeightMode384`),input=field(`pm${cap}Weight384`);box?.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('on',b.dataset.mode===mode));if(box)box.dataset.mode=mode;if(input){input.disabled=mode==='auto';input.classList.toggle('pr384-auto-input',mode==='auto');if(mode==='auto')input.value=''}};
  function decorateUnvrsl(e){
    const box=field('pmUnvrslFields');if(!box)return;const heavy=phaseData(e,'heavy',{reps:[3,3]}),light=phaseData(e,'light',{reps:[9,9]}),middle=phaseData(e,'middle',{reps:[6,6]}),middleCount=(N(e?.middleSets)??(e?.sets||[]).filter(s=>s.role==='middle').length)||2;
    box.innerHTML=`<div class="px-method-subtitle">3 тяжёло-лёгких раунда</div>${phaseHtml('heavy','Heavy · тяжёлая фаза',heavy,10)}${phaseHtml('light','Light · лёгкая фаза',light,30)}<div class="px-method-subtitle">После трёх раундов</div><div class="field px-span-2"><label>Средних подходов</label><input id="pmMiddleSets" type="number" min="0" max="5" value="${middleCount}"></div>${phaseHtml('middle','Middle · средние подходы',middle,30)}<div class="pr384-method-summary">Heavy → 30 сек → Light × 3. После трёх раундов — Middle. Каждый вес можно оставить на AutoWeight или задать вручную отдельно.</div>`;
    ['Heavy','Light','Middle'].forEach(C=>{const b=field(`pm${C}WeightMode384`);if(b)b.dataset.mode=b.querySelector('[data-mode].on')?.dataset.mode||'auto'});
    fieldWrap('pmWeight')?.classList.add('pr384-hidden')
  }
  function dsStageCount(e){return clamp(Math.round(N(e?.dsStages)??e?.sets?.length??3),2,6)}
  function decorateDs(e){
    let box=field('pr384DsBox');if(!box){box=D.createElement('div');box.id='pr384DsBox';box.className='px-span-2 pr384-phase';field('methodHint')?.insertAdjacentElement('beforebegin',box)}
    const mode=e?.dsMode==='manual'?'manual':'auto',count=dsStageCount(e),drop=clamp(N(e?.dsDropPercent)??20,5,50);box.dataset.mode=mode;box.innerHTML=`<div class="pr384-phase-title">Drop Set</div><div class="pr384-grid2"><div class="field"><label>Ступеней</label><input id="pmDsStages384" type="number" min="2" max="6" value="${count}" onchange="pr384DsRender()"></div><div class="field"><label>Снижение веса, %</label><input id="pmDsDrop384" inputmode="decimal" min="5" max="50" value="${drop}"></div></div><div class="px-choice-label">Ступени</div>${modeSelect('pmDsMode384',mode,'pr384DsMode')}<div id="pmDsManual384" class="pr384-ds-table"></div><div class="pr384-note">Авто: первая ступень использует Вес/AutoWeight, каждая следующая уменьшается на указанный процент. Вручную: вес и повторы задаются для каждой ступени отдельно.</div>`;field('pmDsMode384').dataset.mode=mode;W.__pr384DsEditing=e;W.pr384DsRender()
  }
  W.pr384DsMode=function(mode){const b=field('pmDsMode384');if(b)b.dataset.mode=mode;b?.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('on',x.dataset.mode===mode));W.pr384DsRender()};
  W.pr384DsRender=function(){const box=field('pmDsMode384'),wrap=field('pmDsManual384');if(!box||!wrap)return;const mode=box.dataset.mode||'auto',count=clamp(Math.round(N(field('pmDsStages384')?.value)??3),2,6),e=W.__pr384DsEditing||{},sets=e.sets||[],min=N(field('pmReps')?.value)??12,max=N(field('pmRepsMax')?.value)??10,start=N(field('pmWeight')?.value)??0,drop=clamp(N(field('pmDsDrop384')?.value)??20,5,50);wrap.classList.toggle('pr384-hidden',mode!=='manual');if(mode!=='manual'){wrap.innerHTML='';return}wrap.innerHTML=Array.from({length:count},(_,i)=>{const prev=sets[i]||{},w=N(prev.w)??(start>0?roundLoad(start*Math.pow(1-drop/100,i)):0),r=N(prev.r)??Math.round(min+(max-min)*(i/Math.max(1,count-1)));return`<div class="pr384-ds-row"><span>${i+1}</span><input id="pmDsW${i+1}384" inputmode="decimal" value="${w||''}" placeholder="кг"><input id="pmDsR${i+1}384" type="number" min="1" max="50" value="${r}" placeholder="повт."></div>`}).join('')};
  function decorateFst(){let n=field('pr384FstInfo');if(!n){n=D.createElement('div');n.id='pr384FstInfo';n.className='px-span-2 pr384-method-summary';field('methodHint')?.insertAdjacentElement('beforebegin',n)}n.textContent='FST-7: ровно 7 рабочих подходов на одном весе. Диапазон повторов «от–до» применяется ко всем семи подходам; базовый отдых — 30 сек.'}
  function clearMethodExtras(){field('pr384DsBox')?.remove();field('pr384FstInfo')?.remove();fieldWrap('pmWeight')?.classList.remove('pr384-hidden')}
  function decorateMethod(reset=false){
    const x=W.__pr384ctx||{},e=editingExercise(x)||{},m=methodOf();clearMethodExtras();renderGenericRange(reset);rpePreview(x,e);
    if(m==='UNVRSL')decorateUnvrsl(e);else if(m==='DS')decorateDs(e);else if(m==='FST-7')decorateFst();
    if(m==='SLDR'){field('pr384RepMode')?.classList.add('pr384-hidden');fieldWrap('pmReps')?.classList.add('pr384-hidden');fieldWrap('pmRepsMax')?.classList.add('pr384-hidden')}
  }

  const baseForm=W.programExerciseForm;
  if(typeof baseForm==='function'){
    const wrapped=function(x){W.__pr384ctx=x;const r=baseForm.apply(this,arguments);[0,40,120].forEach(ms=>setTimeout(()=>decorateMethod(false),ms));return r};wrapped.__pr384=true;W.programExerciseForm=wrapped;try{programExerciseForm=wrapped}catch(_){}
  }
  const baseRefresh=W.programRefreshMethodUi;
  if(typeof baseRefresh==='function'){
    const wrapped=function(reset=false){const r=baseRefresh.apply(this,arguments);setTimeout(()=>decorateMethod(!!reset),0);return r};wrapped.__pr384=true;W.programRefreshMethodUi=wrapped;try{programRefreshMethodUi=wrapped}catch(_){}
  }

  function targetSet(set,repMin,repMax,rpeRange,extra={}){const a=Math.max(1,Math.round(repMin)),b=Math.max(1,Math.round(repMax));Object.assign(set,extra,{r:a,rMin:Math.min(a,b),rMax:Math.max(a,b),targetRepMin:Math.min(a,b),targetRepMax:Math.max(a,b),targetRepLabel:label(Math.min(a,b),Math.max(a,b)),targetRpeMin:rpeRange[0],targetRpeMax:rpeRange[1]});return set}
  function common(pid,wi,di,nameToken,sourceToken,bpToken,tgToken,eqToken,index){
    const p=program(pid),d=p?.weeks?.[Number(wi)]?.days?.[Number(di)];if(!p||!d)return null;const idx=index===null||String(index)==='null'||Number.isNaN(Number(index))?null:Number(index),old=idx==null?null:d.ex?.[idx],n=decodeURIComponent(nameToken||''),kind=field('pmKind')?.value||inferKind(n,old?.kind),method=methodOf(),restMode=field('pmRestMode')?.value||'auto',rest=restMode==='auto'&&W.programAutoRest?W.programAutoRest(kind,method):Math.max(0,N(field('pmRest')?.value)??90),tempo=(method==='UNVRSL'?field('pmTempoHeavy'):field('pmTempo'))?.value?.trim()||(kind==='compound'?'2-1-1':'3-1-2'),tempoLight=field('pmTempoLight')?.value?.trim()||'3-1-2',note=field('pmNote')?.value?.trim()||'',rpeR=weekRpeRange(p,wi,old||{n,kind}),rpe=midpoint(rpeR);return{p,d,wi:Number(wi),di:Number(di),idx,old,n,kind,method,restMode,rest,tempo,tempoLight,note,rpeR,rpe,sourceId:decodeURIComponent(sourceToken||'')||null,bp:decodeURIComponent(bpToken||''),tg:decodeURIComponent(tgToken||''),eq:decodeURIComponent(eqToken||'')}
  }
  function baseObject(c){return{...(c.old||{}),id:c.old?.id||safeId(),n:c.n,sourceId:c.sourceId,bp:c.bp,tg:c.tg,eq:c.eq,kind:c.kind,method:c.method,rpe:c.rpe,rpeMin:c.rpeR[0],rpeMax:c.rpeR[1],rpeMode:'auto',rirMin:rirRange(c.rpeR)[0],rirMax:rirRange(c.rpeR)[1],tempo:c.tempo,restMode:c.restMode,rest:c.rest,note:c.note,repPolicyRevision:REV}}
  function saveObj(c,obj){if(c.idx==null)c.d.ex.push(obj);else c.d.ex[c.idx]=obj;c.p.updated=Date.now();saveState();try{openProgramEditor(c.p.id,c.wi,c.di)}catch(_){try{openProgramEditor(c.p.id)}catch(__){}}}
  function readRange(prefix,fallback){const a=N(field(`pm${prefix}RepMin384`)?.value)??fallback[0],b=N(field(`pm${prefix}RepMax384`)?.value)??fallback[1];return[Math.min(a,b),Math.max(a,b)]}
  function phaseMode(prefix){return field(`pm${prefix}WeightMode384`)?.dataset.mode||field(`pm${prefix}WeightMode384`)?.querySelector('[data-mode].on')?.dataset.mode||'auto'}
  function phaseWeight(prefix,mode){return mode==='manual'?Math.max(0,N(field(`pm${prefix}Weight384`)?.value)??0):0}
  function saveUnvrsl(c){
    const hr=readRange('Heavy',[3,3]),lr=readRange('Light',[9,9]),mr=readRange('Middle',[6,6]),hm=phaseMode('Heavy'),lm=phaseMode('Light'),mm=phaseMode('Middle'),hw=phaseWeight('Heavy',hm),lw=phaseWeight('Light',lm),mw=phaseWeight('Middle',mm),middleSets=clamp(Math.round(N(field('pmMiddleSets')?.value)??2),0,5),sets=[];
    for(let round=1;round<=3;round++){
      sets.push(targetSet({label:`${round}/3 тяжёлая`,role:'heavy',round,w:hw,rest:30,tempo:c.tempo,weightMode:hm},hr[0],hr[1],c.rpeR));
      sets.push(targetSet({label:`${round}/3 лёгкая`,role:'light',round,w:lw,rest:c.rest,tempo:c.tempoLight,weightMode:lm},lr[0],lr[1],c.rpeR))
    }
    for(let i=0;i<middleSets;i++)sets.push(targetSet({label:`Средний ${i+1}/${middleSets}`,role:'middle',w:mw,rest:c.rest,tempo:c.tempo,weightMode:mm},mr[0],mr[1],c.rpeR));
    const allAuto=[hm,lm,mm].every(x=>x==='auto'),obj={...baseObject(c),method:'UNVRSL',tempoLight:c.tempoLight,innerRest:30,weightMode:allAuto?'auto':'manual',heavyReps:hr[0],heavyRepMin:hr[0],heavyRepMax:hr[1],heavyWeight:hw,heavyWeightMode:hm,lightReps:lr[0],lightRepMin:lr[0],lightRepMax:lr[1],lightWeight:lw,lightWeightMode:lm,middleSets,middleReps:mr[0],middleRepMin:mr[0],middleRepMax:mr[1],middleWeight:mw,middleWeightMode:mm,repMode:'method',methodConfig:{...(c.old?.methodConfig||{}),unvrsl:{rounds:3,innerRest:30,heavy:{repMin:hr[0],repMax:hr[1],weight:hw,weightMode:hm},light:{repMin:lr[0],repMax:lr[1],weight:lw,weightMode:lm},middle:{sets:middleSets,repMin:mr[0],repMax:mr[1],weight:mw,weightMode:mm}}},sets};saveObj(c,obj)
  }
  function saveDs(c){
    const box=field('pr384RepMode'),rm=box?.dataset.mode||repMode(c.old),wr=weekRange(c.p,W.__pr384ctx?.wi,c.old||c),auto=[Math.min(15,Math.max(12,wr[1]+4)),Math.max(8,Math.min(12,wr[1]))],a=N(field('pmReps')?.value)??auto[0],b=N(field('pmRepsMax')?.value)??auto[1],count=clamp(Math.round(N(field('pmDsStages384')?.value)??3),2,6),drop=clamp(N(field('pmDsDrop384')?.value)??20,5,50),mode=field('pmDsMode384')?.dataset.mode||'auto',genericMode=field('pmWeightMode')?.value||genericWeightMode(c.old),start=genericMode==='manual'?Math.max(0,N(field('pmWeight')?.value)??0):0,sets=[];
    if(mode==='manual'){
      for(let i=0;i<count;i++){const w=Math.max(0,N(field(`pmDsW${i+1}384`)?.value)??0),r=Math.max(1,Math.round(N(field(`pmDsR${i+1}384`)?.value)??Math.round(a+(b-a)*(i/Math.max(1,count-1)))));sets.push(targetSet({label:`DS${i+1}`,role:'drop',stage:i+1,w,rest:i<count-1?0:c.rest,tempo:c.tempo,weightMode:'manual'},r,r,c.rpeR))}
    }else{
      for(let i=0;i<count;i++){const r=Math.max(1,Math.round(a+(b-a)*(i/Math.max(1,count-1)))),w=start>0?roundLoad(start*Math.pow(1-drop/100,i),c):0;sets.push(targetSet({label:`DS${i+1}`,role:'drop',stage:i+1,w,rest:i<count-1?0:c.rest,tempo:c.tempo,weightMode:genericMode},r,r,c.rpeR))}
    }
    const obj={...baseObject(c),method:'DS',weightMode:mode==='manual'?'manual':genericMode,repMode:rm,repMin:Math.min(a,b),repMax:Math.max(a,b),dsRepStart:a,dsRepEnd:b,dsStages:count,dsDropPercent:drop,dsMode:mode,innerRest:0,methodConfig:{...(c.old?.methodConfig||{}),dropSet:{mode,stages:count,dropMode:'percent',dropValue:drop,dropReference:'previous',repStart:a,repEnd:b}},sets};saveObj(c,obj)
  }

  const previousSave=W.saveProgramExercise;
  W.saveProgramExercise=function(pid,wi,di,nameToken,sourceToken,bpToken,tgToken,eqToken,index){
    const c=common(pid,wi,di,nameToken,sourceToken,bpToken,tgToken,eqToken,index);if(!c)return;
    if(c.method==='UNVRSL')return saveUnvrsl(c);
    if(c.method==='DS')return saveDs(c);
    const min=field('pmReps'),max=ensureRepMax(),mode=field('pr384RepMode')?.dataset.mode||repMode(c.old),wr=weekRange(c.p,wi,c.old||c),a=mode==='auto'?wr[0]:(N(min?.value)??wr[0]),b=mode==='auto'?wr[1]:(N(max?.value)??wr[1]);if(!['SLDR'].includes(c.method)&&a>b){W.toast?.('Повторы: «от» не может быть больше «до»');return}
    if(min)min.value=a;if(max)max.value=b;
    const out=typeof previousSave==='function'?previousSave.apply(this,arguments):undefined;
    const d=c.p?.weeks?.[Number(wi)]?.days?.[Number(di)],idx=c.idx==null?(d?.ex?.length||1)-1:c.idx,e=d?.ex?.[idx];if(!e)return out;
    const rr=c.method==='SLDR'?null:[Math.min(a,b),Math.max(a,b)];e.repPolicyRevision=REV;e.rpe=c.rpe;e.rpeMin=c.rpeR[0];e.rpeMax=c.rpeR[1];e.rirMin=rirRange(c.rpeR)[0];e.rirMax=rirRange(c.rpeR)[1];e.rpeMode='auto';
    if(c.method==='STANDARD'||c.method==='FST-7'){e.repMode=mode;e.repMin=rr[0];e.repMax=rr[1];(e.sets||[]).forEach(s=>targetSet(s,rr[0],rr[1],c.rpeR))}
    if(c.method==='SLDR'){e.repMode='method';(e.sets||[]).forEach(s=>{const q=N(s.r)??1;targetSet(s,q,q,c.rpeR)});if(Array.isArray(e.repPattern))e.repPattern=e.repPattern.map(v=>Math.max(1,Math.round(v)))}
    if(c.method==='FST-7'){e.innerRest=30;e.rest=30;e.sets=(e.sets||[]).slice(0,7);while(e.sets.length<7)e.sets.push(targetSet({label:`${e.sets.length+1}/7`,w:e.sets[0]?.w||0,rest:e.sets.length<6?30:30,tempo:e.tempo},rr[0],rr[1],c.rpeR));e.sets.forEach((s,i)=>{s.label=`${i+1}/7`;s.rest=i<6?30:30})}
    c.p.updated=Date.now();saveState();return out
  };
  try{saveProgramExercise=W.saveProgramExercise}catch(_){}

  function attachTarget(ex,set,b,ps){const repMin=N(ps?.targetRepMin??ps?.rMin??ps?.r)??1,repMax=N(ps?.targetRepMax??ps?.rMax??ps?.r)??repMin,rpeR=[N(ps?.targetRpeMin??b?.rpeMin)??8,N(ps?.targetRpeMax??b?.rpeMax)??N(ps?.targetRpeMin??b?.rpeMin)??8];set.targetRepMin=Math.min(repMin,repMax);set.targetRepMax=Math.max(repMin,repMax);set.targetRepLabel=label(set.targetRepMin,set.targetRepMax);set.targetRpeMin=Math.min(...rpeR);set.targetRpeMax=Math.max(...rpeR);set.targetRirMin=Math.max(0,10-set.targetRpeMax);set.targetRirMax=Math.max(0,10-set.targetRpeMin);ex.targetRpeMin=set.targetRpeMin;ex.targetRpeMax=set.targetRpeMax;ex.rpeMin=set.targetRpeMin;ex.rpeMax=set.targetRpeMax;if(!set.ok&&!set.manualFields?.r){set.r='';set.repEntered=false}}
  function propagate(pid,wi,di){
    const p=program(pid),d=p?.weeks?.[Number(wi)]?.days?.[Number(di)],cur=state()?.current;if(!p||!d||!cur||String(cur.programId||'')!==String(pid))return false;let ci=0;
    for(const b of d.ex||[]){const m=String(b.method||'STANDARD').toUpperCase(),br=weekRpeRange(p,wi,b);b.rpeMin=b.rpeMin??br[0];b.rpeMax=b.rpeMax??br[1];if(m==='STANDARD'||m==='FST-7'){const ex=cur.ex?.[ci++];if(!ex)continue;ex.programBlockId=b.id;ex.programWeightMode=b.weightMode==='auto'?'autoweight':'prescribed';(ex.set||[]).forEach((s,i)=>attachTarget(ex,s,b,b.sets?.[i]||b.sets?.[0]||{}))}else{
        for(const ps of b.sets||[]){const ex=cur.ex?.[ci++],s=ex?.set?.[0];if(!ex||!s)continue;ex.programBlockId=b.id;ex.phaseRole=ps.role||ex.phaseRole;ex.phaseWeightMode=ps.weightMode||b.weightMode||'manual';ex.programWeightMode=ex.phaseWeightMode==='auto'?'autoweight':'prescribed';attachTarget(ex,s,b,ps)}
      }}cur.repPolicyRevision=REV;saveState();try{W.startPage?.()}catch(_){}return true
  }

  function syncCurrent(){
    const cur=state()?.current;if(!cur?.programId||cur.repPolicyRevision===REV)return false;const p=program(cur.programId),wi=Math.max(0,(Number(cur.w)||1)-1);if(!p)return false;const days=p?.weeks?.[wi]?.days||[];let di=days.findIndex(d=>String(d?.name||'')===String(cur.c||''));if(di<0)di=days.findIndex(d=>(d.ex||[]).some(b=>(cur.ex||[]).some(e=>(e?.sourceId&&b?.sourceId&&String(e.sourceId)===String(b.sourceId))||baseName(e?.n).toLowerCase().startsWith(baseName(b?.n).toLowerCase()))));if(di<0)return false;return propagate(cur.programId,wi,di)
  }

  function intensityFor(reps,rpe){const rir=clamp(10-(N(rpe)??8),0,10);return 1/(1+(Math.max(1,N(reps)??1)+rir)/30)}
  function readiness(v,ex,cur){try{const fn=W.unvrslTrainingReadinessWeightV292||W.trainingLoadModel292?.readinessWeight;if(typeof fn==='function')return fn(v,ex,cur)}catch(_){}return roundLoad(v,ex)}
  function setAuto(ex,set,base){if(!(base>0)||!set||set.ok||set.manualFields?.w)return;set.recommendedW=roundLoad(base,ex);set.plannedW=set.recommendedW;set.baselineW=set.recommendedW;set.baselineSource='method_ranges_v384';set.w=readiness(set.recommendedW,ex,state()?.current)}
  function applyMethodWeights(){
    const cur=state()?.current;
    if(!cur?.programId)return false;
    const p=program(cur.programId),wi=Math.max(0,(Number(cur.w)||1)-1);
    if(!p)return false;
    const days=p?.weeks?.[wi]?.days||[];
    const d=days.find(x=>String(x?.name||'')===String(cur.c||''))||days.find(x=>(x.ex||[]).some(b=>(cur.ex||[]).some(e=>String(e.programBlockId||'')===String(b.id||''))));
    if(!d)return false;
    let changed=false;
    for(const b of d.ex||[]){
      const rows=(cur.ex||[]).filter(e=>String(e.programBlockId||'')===String(b.id||''));
      if(!rows.length)continue;
      const m=String(b.method||'STANDARD').toUpperCase();
      if(m==='UNVRSL'){
        const heavyRows=rows.filter(e=>e.phaseRole==='heavy'),lightRows=rows.filter(e=>e.phaseRole==='light'),middleRows=rows.filter(e=>e.phaseRole==='middle'),hs=heavyRows[0]?.set?.[0];
        let hbase=N(hs?.recommendedW??hs?.plannedW??hs?.w);
        if(!(hbase>0))hbase=rows.flatMap(e=>e.set||[]).map(s=>N(s.recommendedW??s.plannedW??s.w)).find(v=>v>0);
        if(!(hbase>0))continue;
        const hr=((N(b.heavyRepMin)??N(b.heavyReps)??3)+(N(b.heavyRepMax)??N(b.heavyReps)??3))/2,rpe=midpoint(weekRpeRange(p,wi,b)),e1=hbase/intensityFor(hr,rpe);
        if(b.heavyWeightMode==='auto')heavyRows.forEach(e=>setAuto(e,e.set?.[0],hbase));
        if(b.lightWeightMode==='auto'){
          const lr=((N(b.lightRepMin)??N(b.lightReps)??9)+(N(b.lightRepMax)??N(b.lightReps)??9))/2,v=e1*intensityFor(lr,rpe);
          lightRows.forEach(e=>setAuto(e,e.set?.[0],v))
        }
        if(b.middleWeightMode==='auto'){
          const mr=((N(b.middleRepMin)??N(b.middleReps)??6)+(N(b.middleRepMax)??N(b.middleReps)??6))/2,v=e1*intensityFor(mr,rpe);
          middleRows.forEach(e=>setAuto(e,e.set?.[0],v))
        }
        changed=true
      }else if(m==='DS'&&b.dsMode!=='manual'){
        const drop=clamp(N(b.dsDropPercent)??20,5,50),first=rows[0]?.set?.[0],anchor=N(first?.recommendedW??first?.plannedW??first?.w);
        if(anchor>0){rows.forEach((e,i)=>setAuto(e,e.set?.[0],anchor*Math.pow(1-drop/100,i)));changed=true}
      }else if(m==='SLDR'&&b.weightMode==='auto'){
        const all=rows.flatMap(e=>e.set||[]),anchor=all.map(s=>N(s.recommendedW??s.plannedW??s.w)).find(v=>v>0);
        if(anchor>0){rows.forEach(e=>setAuto(e,e.set?.[0],anchor));changed=true}
      }else if(m==='FST-7'&&b.weightMode==='auto'){
        const ex=rows[0],anchor=(ex?.set||[]).map(s=>N(s.recommendedW??s.plannedW??s.w)).find(v=>v>0);
        if(anchor>0){(ex.set||[]).forEach(s=>setAuto(ex,s,anchor));changed=true}
      }
    }
    if(changed)saveState();
    return changed
  }

  const previousBegin=W.beginProgramDay;
  if(typeof previousBegin==='function'){
    W.beginProgramDay=function(pid,wi,di){const r=previousBegin.apply(this,arguments);[0,60,180,500,1000].forEach(ms=>setTimeout(()=>{propagate(pid,wi,di);applyMethodWeights()},ms));return r};try{beginProgramDay=W.beginProgramDay}catch(_){}
  }
  function installLoadHook(){const api=W.trainingLoadModel292;if(!api?.run||api.run.__pr384)return false;const old=api.run,wrapped=async function(){const r=await old.apply(this,arguments);try{applyMethodWeights()}catch(e){console.warn('method weights v384',e)}return r};wrapped.__pr384=true;wrapped.__pr384Base=old;api.run=wrapped;return true}

  const basePrescription=W.prescriptionText;
  if(typeof basePrescription==='function'){
    W.prescriptionText=function(e){const m=String(e?.method||'STANDARD').toUpperCase(),s=e?.sets||[],weight=v=>num(v)>0?`${num(v)} кг`:'авто';if(m==='STANDARD')return`${s.length}×${label(e.repMin??s[0]?.targetRepMin??s[0]?.r,e.repMax??s[0]?.targetRepMax??s[0]?.r)} · ${weight(s[0]?.w)} · RPE ${label(e.rpeMin??e.rpe,e.rpeMax??e.rpe)}`;if(m==='FST-7')return`7×${label(e.repMin??s[0]?.targetRepMin??s[0]?.r,e.repMax??s[0]?.targetRepMax??s[0]?.r)} · ${weight(s[0]?.w)} · 30с`;if(m==='UNVRSL')return`3×(${label(e.heavyRepMin??e.heavyReps,e.heavyRepMax??e.heavyReps)} · ${e.heavyWeightMode==='auto'?'авто':weight(e.heavyWeight||s.find(x=>x.role==='heavy')?.w)} → ${label(e.lightRepMin??e.lightReps,e.lightRepMax??e.lightReps)} · ${e.lightWeightMode==='auto'?'авто':weight(e.lightWeight||s.find(x=>x.role==='light')?.w)})${num(e.middleSets)>0?` + ${e.middleSets}×${label(e.middleRepMin??e.middleReps,e.middleRepMax??e.middleReps)} · ${e.middleWeightMode==='auto'?'авто':weight(e.middleWeight)}`:''}`;if(m==='DS')return`${s.length} ступ. · ${label(e.dsRepStart??s[0]?.r,e.dsRepEnd??s.at(-1)?.r,true)} · ${e.dsMode==='manual'?'вручную':`${e.dsDropPercent||20}%`}`;return basePrescription.apply(this,arguments)};try{prescriptionText=W.prescriptionText}catch(_){}
  }

  function decorateCard(html,sets){if(!html||!sets?.length)return html;const t=D.createElement('template');t.innerHTML=html,rows=[...t.content.querySelectorAll('.setrow:not(.cardiorow)')];rows.forEach((row,i)=>{const s=sets[i];if(!s)return;const inputs=[...row.querySelectorAll('input')],rep=s.targetRepLabel||label(s.targetRepMin??s.r,s.targetRepMax??s.r),rpe=label(s.targetRpeMin??8,s.targetRpeMax??s.targetRpeMin??8),rir=label(s.targetRirMin??Math.max(0,10-(s.targetRpeMax??8)),s.targetRirMax??Math.max(0,10-(s.targetRpeMin??8)));if(inputs[1]){inputs[1].placeholder=rep;inputs[1].dataset.pr384='reps';if(!s.ok&&!s.manualFields?.r&&!s.repEntered)inputs[1].value=''}if(inputs[2]){inputs[2].placeholder=rpe;inputs[2].dataset.pr384='rpe'}if(inputs[3]){inputs[3].placeholder=rir;inputs[3].dataset.pr384='rir'}});return t.innerHTML}
  function installCards(){let f=W.exerciseCard;try{if(typeof exerciseCard==='function')f=exerciseCard}catch(_){}if(typeof f==='function'&&!f.__pr384){const b=f;f=function(s,e){const h=b.apply(this,arguments);return s?.programId?decorateCard(h,e?.set||[]):h};f.__pr384=true;W.exerciseCard=f;try{exerciseCard=f}catch(_){}}let g=W.exerciseGroupCard;try{if(typeof exerciseGroupCard==='function')g=exerciseGroupCard}catch(_){}if(typeof g==='function'&&!g.__pr384){const b=g;g=function(s,x){const h=b.apply(this,arguments),sets=[];(x?.entries||[]).forEach(e=>(e.set||[]).forEach(q=>sets.push(q)));return s?.programId?decorateCard(h,sets):h};g.__pr384=true;W.exerciseGroupCard=g;try{exerciseGroupCard=g}catch(_){}}}
  function installEdit(){let f=W.editSet;try{if(typeof editSet==='function')f=editSet}catch(_){}if(typeof f!=='function'||f.__pr384)return;const b=f;f=function(ei,si,k,v){const set=state()?.current?.ex?.[Number(ei)]?.set?.[Number(si)];if(set&&k==='r'){set.repEntered=String(v).trim()!=='';set.manualFields={...(set.manualFields||{}),r:set.repEntered}}if(set&&k==='w'&&String(v).trim()!==''){set.manualFields={...(set.manualFields||{}),w:true}}return b.apply(this,arguments)};f.__pr384=true;W.editSet=f;try{editSet=f}catch(_){} }
  function installToggle(){let f=W.toggleSet;try{if(typeof toggleSet==='function')f=toggleSet}catch(_){}if(typeof f!=='function'||f.__pr384)return;const b=f;f=function(ei,si){const cur=state()?.current,set=cur?.ex?.[Number(ei)]?.set?.[Number(si)];if(cur?.programId&&set&&!set.ok&&(set.r===''||set.r==null)){W.toast?.('Укажи фактически выполненные повторы');return}return b.apply(this,arguments)};f.__pr384=true;W.toggleSet=f;try{toggleSet=f}catch(_){} }

  function migrate(){const s=state();if(!s||s.__pr384Migrated)return;s.__pr384Migrated=true;let changed=false;(s.programs||[]).forEach(p=>(p.weeks||[]).forEach(w=>{if(N(w.intensityMin)===60&&N(w.intensityMax)===65){w.intensityMax=70;changed=true}(w.days||[]).forEach(d=>(d.ex||[]).forEach(e=>{if(e.method==='FST-7'&&e.sets?.length===7&&e.repMax==null){const r=N(e.sets[0]?.r)||10;e.repMin=r;e.repMax=r;changed=true}}))}));if(changed)saveState()}
  function install(){style();migrate();syncCurrent();installLoadHook();installCards();installEdit();installToggle();applyMethodWeights()}
  ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:training-engine-ready','unvrsl:cloud-ready'].forEach(ev=>W.addEventListener?.(ev,()=>setTimeout(install,0),{passive:true}));
  [0,100,300,700,1400,2800].forEach(ms=>setTimeout(install,ms));setInterval(()=>{syncCurrent();installLoadHook();installCards();installEdit();installToggle()},1500);
})();