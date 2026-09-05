'use strict';
(()=>{
 const W=window,REV=295,MATH_OWNER='training-load-model-v292';
 if(W.__unvrslTrainingEngineV295)return;
 let STATE=W.st||null;
 try{if(typeof st!=='undefined')STATE=st}catch(_){}
 if(!STATE)return;
 W.st=STATE;W.__unvrslTrainingEngineV295=true;W.__unvrslTrainingEngineV259=true;W.__unvrslTrainingEngineV257=true;W.__unvrslTrainingEngineV200=true;W.__unvrslRecommendationMathOwner=MATH_OWNER;
 const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
 const UNVRSL=W.UNVRSL_METHOD_V211||null;
 const num=v=>N(v)??0,mean=a=>{a=(a||[]).filter(Number.isFinite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null};
 const base=n=>{try{return W.baseExerciseName?W.baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim()}catch(_){return String(n||'')}};
 const same=(e,n,id)=>(id&&String(e?.sourceId||'')===String(id))||base(e?.n).toLowerCase()===base(n).toLowerCase();
 const key=e=>e?.sourceId?`id:${e.sourceId}`:`n:${base(e?.n).toLowerCase()}`;
 if(!Array.isArray(W.st?.readinessLog))W.st.readinessLog=[];
 const style=document.createElement('style');style.id='training-engine-v200-style';style.textContent=`
 .te200-rec{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:9px 0 2px;padding:9px 11px;border-radius:14px;background:#191d1a;border:1px solid rgba(48,209,88,.28)}
 .te200-rec .te200-rec-main{min-width:0}.te200-rec b{display:block;font-size:12px;color:#30d158}.te200-rec span{display:block;font-size:11px;color:#8e8e93;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .te200-rec button{flex:0 0 auto;background:#30d158;color:#061108;border-radius:11px;padding:8px 10px;font-weight:800;font-size:12px}
 .te200-rec.applied button{background:#2d2d31;color:#c9c9ce}.te200-auto{margin:9px 0 2px;padding:8px 10px;border-radius:13px;background:rgba(48,209,88,.10);color:#30d158;font-size:11px;font-weight:750}
 .te200-readiness{width:100%;margin:10px 0 4px;padding:11px 13px;border-radius:15px;background:#2a2a2d;border:1px solid #3a3a3e;font-weight:760;text-align:center}
 .te200-readiness.done{color:#30d158;border-color:rgba(48,209,88,.25);background:rgba(48,209,88,.08)}
 .te200-ready{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}.te200-item{background:#202023;border:1px solid #303034;border-radius:18px;padding:13px}.te200-item b{display:flex;justify-content:space-between;margin-bottom:9px}.te200-item input{width:100%;accent-color:var(--green)}
 .te200-ready-result{margin:12px 0;padding:13px 14px;border-radius:16px;background:#202023;border:1px solid #303034}.te200-ready-result b{display:block;color:#f5f5f7}.te200-ready-result span{display:block;color:#8e8e93;font-size:11px;margin-top:4px}.te200-ready-result.ready{border-color:rgba(48,209,88,.32);background:rgba(48,209,88,.08)}.te200-ready-result.ready b{color:#30d158}.te200-ready-result.down{border-color:rgba(255,159,10,.35);background:rgba(255,159,10,.08)}.te200-ready-result.down b{color:#ff9f0a}
 .te200-scale{display:flex;justify-content:space-between;color:#777;font-size:10px;margin-top:3px}.te200-explicit{margin-top:10px;color:#777;font-size:11px;line-height:1.4}
 html.te200-preparing #start>*{visibility:hidden!important}.te200-preparing-view{text-align:center;padding:24px 4px 14px}.te200-preparing-view h2{margin-bottom:8px}.te200-preparing-view .muted{line-height:1.45}
 #start .smart-suggest,#start .u177-rec,#start .wr180,#start .wr185,#start .adaptive-choice-btn,#start .adaptive-load-chip,#start .unvrsl-auto-load{display:none!important}
 `;document.head.appendChild(style);
 function disableLegacyReadiness(){if(typeof W.advAskReadiness!=='function'||W.advAskReadiness.__te205)return;const bypass=(fn,args)=>typeof fn==='function'?fn.apply(W,Array.isArray(args)?args:[]):undefined;bypass.__te205=true;W.advAskReadiness=bypass;try{advAskReadiness=bypass}catch(_){}}
 function lockLegacy(cur){if(!cur)return;cur.unvrslAdaptive174Applied=true;cur.adaptiveEffortV2Applied=true;cur.adaptiveDecision='engine295';cur.adaptivePrompted=true;delete cur.trainingWeightChoice;delete cur.engine196Prepared;delete cur.engine196FlowShown;delete cur.weightsPrepared194}
 function captureLaunchWeights(cur){if(!cur||cur.launchWeightsCaptured206)return;for(const ex of cur.ex||[]){for(const s of ex.set||[]){s.launchW=N(s.w)??0;s.launchWeightCaptured206=true}}cur.launchWeightsCaptured206=true;lockLegacy(cur)}
 disableLegacyReadiness();
 function program(cur){
  try{if(cur?.programId&&W.programById){const p=W.programById(cur.programId);if(p)return p}}catch(_){}
  if(cur?.planId){const p=(W.st?.programs||[]).find(x=>String(x?.cloudPlanId||'')===String(cur.planId));if(p)return p}
  if(cur?.programName){const p=(W.st?.programs||[]).find(x=>String(x?.name||'')===String(cur.programName));if(p)return p}
  return null
 }
 function fullName(v){return String(v||'').trim().toLowerCase()}
 function sourceFromEntries(entries,ex){
  const list=entries||[],idMatches=ex?.sourceId?list.filter(x=>String(x?.sourceId||'')===String(ex.sourceId)):[],byName=list.find(x=>fullName(x?.n||x?.name)===fullName(ex?.n));
  const exact=byName||(idMatches.length===1?idMatches[0]:null);
  if(exact){if(Array.isArray(exact.sets))return exact;const count=Math.max(1,Number(exact.s)||1);return{...exact,method:exact.method||(/UNVRSL/i.test(exact.n||'')?'UNVRSL':/FST-7/i.test(exact.n||'')?'FST-7':/SLDR/i.test(exact.n||'')?'SLDR':/\bDS\b/i.test(exact.n||'')?'DS':'STANDARD'),sets:Array.from({length:count},()=>({w:num(exact.w),r:num(exact.r)}))}}
  const matches=idMatches.length?idMatches:list.filter(x=>same({n:x.n,sourceId:x.sourceId},ex.n,ex.sourceId));if(!matches.length)return null;
  if(matches.length===1)return sourceFromEntries(matches,{...ex,n:matches[0].n});
  const expanded=UNVRSL?.expandPlanEntries?UNVRSL.expandPlanEntries(matches):null;
  if(expanded?.sets?.length)return{...matches[0],n:base(ex.n),method:expanded.method,sets:expanded.sets};
  return{...matches[0],n:base(ex.n),method:/UNVRSL/i.test(matches.map(x=>x.n).join(' '))?'UNVRSL':'STANDARD',sets:matches.flatMap(x=>Array.from({length:Math.max(1,Number(x.s)||1)},()=>({w:num(x.w),r:num(x.r)})))}
 }
 function builtInSource(ex,cur){let r=null;try{if(typeof rmap!=='undefined'&&rmap?.get)r=rmap.get(`${cur?.w}-${cur?.c}`)}catch(_){}if(!r)r=(W.UNVRSL_ROUTINES||[]).find(x=>Number(x?.w)===Number(cur?.w)&&String(x?.c||'')===String(cur?.c||''));return sourceFromEntries(r?.e||[],ex)}
 function source(ex,cur){const p=program(cur);if(!p)return builtInSource(ex,cur);const week=p?.weeks?.[Math.max(0,(N(cur?.w)||1)-1)];if(!week)return null;let days=week.days||[];const exact=days.find(d=>String(d?.name||'')===String(cur?.c||''));if(exact)days=[exact,...days.filter(d=>d!==exact)];for(const d of days){const s=sourceFromEntries(d.ex||[],ex);if(s)return s}return null}
 function isOwnerEightWeekPlan(cur){
  if(!cur||program(cur)||cur.programId||cur.planId||cur.programName)return false;
  const w=N(cur.w);if(!(w>=1&&w<=8)||!cur.c)return false;
  return(cur.ex||[]).some(ex=>ex?.mode!=='cardio'&&!!builtInSource(ex,cur))
 }
 function step(ex,rows=[]){let s=2.5;try{s=Number(W.loadStepFor?.(base(ex.n),ex.sourceId||null))||s}catch(_){}const m=mean(rows.map(x=>x.w))||0;if(m>0&&m<=6)s=Math.min(s,.5);else if(m>0&&m<=12)s=Math.min(s,1);else if(m>0&&m<=22)s=Math.min(s,2);return s}
 function round(v,s){return Math.max(s,Math.round(v/s)*s)}
 function method(src,ex){return String(src?.method||ex?.method||'STANDARD').trim().toUpperCase()||'STANDARD'}
 function occurrenceIndex(ex,cur){const a=(cur.ex||[]).filter(x=>same(x,ex.n,ex.sourceId));const i=a.indexOf(ex);return i<0?0:i}
 function sourceWeight(src,ex,setIndex,cur){const sets=src?.sets||[];if(!sets.length)return 0;if((ex.set||[]).length>1)return num(sets[setIndex]?.w??sets.at(-1)?.w);const i=occurrenceIndex(ex,cur),m=method(src,ex),count=(cur.ex||[]).filter(x=>same(x,ex.n,ex.sourceId)).length;if(m==='UNVRSL'&&count>sets.length){const map=sets.length>=3?[0,1,0,1,0,1,2,2]:sets.length===2?[0,1,0,1,0,1,1,1]:[0,0,0,0,0,0,0,0];return num(sets[map[i]??map.at(-1)]?.w)}return num(sets[i]?.w??sets.at(-1)?.w)}
 async function ensureLoadModel(){
  if(W.trainingLoadModel292?.run)return true;
  if(!document.querySelector('script[data-unvrsl-load-model-v292]')){const s=document.createElement('script');s.src='training-load-model-v292.js?v=295';s.async=false;s.dataset.unvrslLoadModelV292='1';document.body.appendChild(s)}
  for(let i=0;i<40;i++){if(W.trainingLoadModel292?.run)return true;await new Promise(r=>setTimeout(r,50))}
  return !!W.trainingLoadModel292?.run
 }
 function clearRecommendationState(cur){
  delete cur.trainingLoadModelRevision;delete cur.trainingProgressionRevision;delete cur.trainingProgressionAt;delete cur.trainingLoadModelAt;
  (cur.ex||[]).forEach(ex=>{delete ex.trainingProgression292;delete ex.trainingProgression291;delete ex.trainingProgression290;(ex.set||[]).forEach(s=>{delete s.recommendedW;delete s.trainingIntensity292;delete s.progressionGateV292;delete s.progressionGateV291;delete s.progressionGateV290})})
 }
 async function prepare(cur){
  if(!cur)return false;const p=program(cur);if((cur.programId||cur.planId)&&!p)return false;
  const ownerPlan=isOwnerEightWeekPlan(cur);cur.trainingWeightPolicy214=ownerPlan?'recommendation':'autoweight';
  let unresolved=false,adaptive=0,prescribed=0;
  const oldReadinessPercent=N(cur?.readiness?.percent);
  if(cur.trainingReadinessDone&&cur.readiness&&(oldReadinessPercent==null||oldReadinessPercent>0)){cur.readiness={...cur.readiness,percent:0,factor:1,skipped:true};cur.readinessUsed=false;cur.readinessAdjusted=false}
  lockLegacy(cur);clearRecommendationState(cur);
  for(const ex of cur.ex||[]){
   if(ex?.mode==='cardio')continue;const src=source(ex,cur);if((cur.programId||cur.planId)&&!src){unresolved=true;continue}
   const launch=(ex.set||[]).map(s=>s.launchWeightCaptured206?num(s.launchW):([s.programW,s.plannedW,s.w].map(num).find(x=>x>0)||0)),sets=ex.set||[];
   const sourceWeights=sets.map((s,i)=>src?sourceWeight(src,ex,i,cur):0);
   const seeds=sets.map((s,i)=>sourceWeights[i]>0?sourceWeights[i]:num(launch[i]));
   const mode=ownerPlan||sourceWeights.some(x=>x>0)?'prescribed':'adaptive';
   ex.programWeightMode=mode;delete ex.recommendation194;delete ex.engine196Recommendation;delete ex.progression187;
   const activeMethod=method(src,ex);
   if(mode==='adaptive'){
    adaptive++;
    sets.forEach((s,i)=>{s.programW=0;if(!s.ok&&!s.manualOverride){const start=num(seeds[i]);s.w=start;s.plannedW=start;s.baselineW=start;s.baselineSource=start>0?'autoweight_seed':'adaptive_pending'}});
    ex.weightDecision=sets.some(s=>num(s.plannedW)>0)?'adaptive_seed':'calibration'
   }else{
    prescribed++;
    sets.forEach((s,i)=>{s.programW=num(seeds[i]);if(!s.ok&&!s.manualOverride){s.w=num(s.programW);s.plannedW=s.w;s.baselineW=s.w;s.baselineSource='program'}});
    ex.weightDecision='program'
   }
   ex.trainingEstimate200={...(ex.trainingEstimate200||{}),mode,method:activeMethod,mathOwner:MATH_OWNER}
  }
  if(unresolved)return false;
  if(cur.trainingReadinessDone)(cur.ex||[]).forEach(ex=>(ex.set||[]).forEach(s=>{if(!s.ok&&!s.manualOverride&&num(s.plannedW)>0)s.w=todayWeight(s.plannedW,ex,cur)}));
  cur.trainingWeightPolicy214=ownerPlan?'recommendation':adaptive&&prescribed?'mixed':prescribed?'recommendation':'autoweight';
  cur.trainingEngineRevision=REV;cur.trainingEngineVersion=REV;cur.trainingPreparedAt=new Date().toISOString();cur.trainingMathOwner=MATH_OWNER;cur.trainingTrace200={adaptive,prescribed,policy:cur.trainingWeightPolicy214,mathOwner:MATH_OWNER};
  try{
   W.unvrslTrainingPrescriptionPrepareV292?.(cur);
   const ok=await ensureLoadModel();
   if(ok)await W.trainingLoadModel292.run(true);
   W.save?.();W.startPage?.()
  }catch(e){console.warn('training engine v295 prepare',e)}
  return true
 }
 function groupIndices(cur,k){const a=[];(cur.ex||[]).forEach((e,i)=>{if(key(e)===k)a.push(i)});return a}
 function fmtWeights(a){const vals=(a||[]).map(x=>num(x)).filter(x=>x>0),unique=[];vals.forEach(x=>{if(!unique.some(y=>Math.abs(y-x)<.001))unique.push(x)});if(!unique.length)return'—';return unique.map(x=>String(x).replace('.',',')).join(' / ')}
 function todayWeight(v,ex,cur){
  if(!(num(v)>0))return null;
  try{const fn=W.unvrslTrainingReadinessWeightV292||W.trainingLoadModel292?.readinessWeight;if(typeof fn==='function'){const out=fn(num(v),ex,cur,step(ex));if(out!=null)return out}}catch(_){ }
  const f=cur?.trainingReadinessDone&&cur?.readinessAdjusted?num(cur?.readiness?.factor)||1:1;return round(num(v)*f,step(ex))
 }
 function readinessPercent(cur){if(!cur?.trainingReadinessDone||!cur?.readinessAdjusted)return'';const p=Math.round(((num(cur?.readiness?.factor)||1)-1)*1000)/10;return`${p>0?'+':''}${String(p).replace('.',',')}%`}
 function v292Ready(group,cur){return Number(cur?.trainingLoadModelRevision)===292&&group.some(ex=>(ex?.set||[]).some(s=>N(s?.recommendedW)!=null&&!!s?.trainingIntensity292))}
 function applyRecommendation(k){const cur=W.st?.current;if(!cur)return;const idx=groupIndices(cur,k),prescribed=idx.some(i=>cur.ex?.[i]?.programWeightMode==='prescribed');if(!prescribed){W.toast?.('Здесь вес выставляется автоматически');return}idx.forEach(i=>{const ex=cur.ex[i];if(ex?.programWeightMode!=='prescribed')return;(ex.set||[]).forEach(s=>{if(s.ok||s.manualOverride||num(s.recommendedW)<=0||!s.trainingIntensity292)return;s.plannedW=num(s.recommendedW);s.baselineW=s.plannedW;s.baselineSource='prescribed_recommendation_v292';s.w=todayWeight(s.plannedW,ex,cur)});ex.weightDecision='recommendation'});try{W.save?.();W.startPage?.()}catch(_){}setTimeout(enhanceDom,0);W.toast?.('Рекомендованный вес применён')}
 function restoreProgram(k){const cur=W.st?.current;if(!cur)return;groupIndices(cur,k).forEach(i=>{const ex=cur.ex[i];if(ex?.programWeightMode!=='prescribed')return;(ex.set||[]).forEach(s=>{if(s.ok||s.manualOverride||num(s.programW)<=0)return;s.plannedW=num(s.programW);s.baselineW=s.plannedW;s.baselineSource='program';s.w=todayWeight(s.plannedW,ex,cur)});ex.weightDecision='program'});try{W.save?.();W.startPage?.()}catch(_){}setTimeout(enhanceDom,0)}
 function readiness(){const g=id=>num(document.getElementById(id)?.value||3),sl=g('te200Sleep'),en=g('te200Energy'),so=g('te200Sore'),st=g('te200Stress'),pos=v=>(v-1)/4,neg=v=>(5-v)/4,score=Math.round(pos(sl)*25+pos(en)*30+neg(so)*30+neg(st)*15);let percent=0;if(score<30)percent=-10;else if(score<50)percent=-7.5;else if(score<70)percent=-5;else if(score<85)percent=-2.5;return{sleep:sl,energy:en,soreness:so,stress:st,score,percent,factor:1+percent/100,skipped:false,at:new Date().toISOString()}}
 function item(id,label,left,right){return `<div class="te200-item"><b><span>${label}</span><span id="${id}V">3</span></b><input id="${id}" data-touched="0" type="range" min="1" max="5" value="3" oninput="this.dataset.touched='1';document.getElementById('${id}V').textContent=this.value;trainingUpdateReadiness200()"><div class="te200-scale"><span>${left}</span><span>${right}</span></div></div>`}
 function readinessText(d){const p=num(d?.percent),label=p<0?`Убавить ${String(Math.abs(p)).replace('.',',')}%`:'Оставить базовый вес';return{label,meta:`Готовность ${d?.score??0}/100 · решение применяется только после нажатия кнопки`}}
 function updateReadiness(){const ids=['te200Sleep','te200Energy','te200Sore','te200Stress'],fields=ids.map(id=>document.getElementById(id)),box=document.getElementById('te200ReadyResult'),button=document.getElementById('te200ApplyReadiness');if(!box||!button)return;const ready=fields.every(x=>x?.dataset?.touched==='1');if(!ready){box.className='te200-ready-result';box.innerHTML='<b>Оцени все четыре показателя</b><span>После этого появится расчёт от 0% до −10%</span>';button.disabled=true;button.textContent='Сначала оцени самочувствие';return}const d=readiness(),t=readinessText(d);box.className='te200-ready-result ready'+(d.percent<0?' down':'');box.innerHTML=`<b>${t.label}</b><span>${t.meta}</span>`;button.disabled=false;button.textContent=`${t.label} и открыть тренировку`}
 function readinessMarkup(){return `<div data-te200-flow="readiness"><div class="sheet-grabber"></div><h2>Самочувствие перед тренировкой</h2><div class="muted">Хорошее самочувствие не увеличивает вес. При отклонениях сайт предложит снизить его до −10%. Ты увидишь результат и сам выберешь: применить его или оставить базовый вес.</div><div class="te200-ready">${item('te200Sleep','Сон','плохо','отлично')}${item('te200Energy','Энергия','низкая','высокая')}${item('te200Sore','Крепатура','нет','сильная')}${item('te200Stress','Стресс','низкий','высокий')}</div><div id="te200ReadyResult" class="te200-ready-result"><b>Оцени все четыре показателя</b><span>После этого появится расчёт от 0% до −10%</span></div><button id="te200ApplyReadiness" class="btn primary full" disabled onclick="trainingConfirmReadiness200(true)">Сначала оцени самочувствие</button><button class="btn full" style="margin-top:10px" onclick="trainingConfirmReadiness200(false)">Оставить базовый вес</button><div class="te200-explicit">Если в программе уже указан вес, он остаётся плановым, а рекомендация применяется только вручную. Автовес включается только для упражнений без заданного веса.</div></div>`}
 function preparingMarkup(){return `<div data-te200-flow="preparing"><div class="sheet-grabber"></div><div class="te200-preparing-view"><h2>Подготавливаем тренировку</h2><div class="muted">Проверяем программу и рассчитываем рабочие веса по истории тренировок.</div></div></div>`}
 let pendingStart=null,startingAfterReadiness=false;
 function showReadiness(){const cur=W.st?.current;if(!cur)return;pendingStart=null;cur.trainingReadinessPromptShown=true;try{W.save?.()}catch(_){}W.modal?.(readinessMarkup())}
 function askBeforeStart(fn,args,ctx){pendingStart={fn,args:Array.from(args||[]),ctx,before:W.st?.current||null};W.modal?.(readinessMarkup())}
 function readinessData(adjust){return adjust?readiness():{sleep:null,energy:null,soreness:null,stress:null,score:null,percent:0,factor:1,skipped:true,at:new Date().toISOString()}}
 function attachReadiness(cur,d,adjust){cur.readiness=d;cur.readinessUsed=!!adjust;cur.readinessAdjusted=!!adjust&&Math.abs(d.factor-1)>.001;cur.trainingReadinessDone=true;cur.trainingReadinessPromptShown=true;W.st.readinessLog.push({date:cur.date,sessionId:cur.id,...d})}
 async function confirm(adjust){
  if(adjust){const fields=['te200Sleep','te200Energy','te200Sore','te200Stress'].map(id=>document.getElementById(id));if(fields.some(x=>!x||x.dataset.touched!=='1')){W.toast?.('Оцени все четыре показателя');return}}
  const d=readinessData(adjust);
  if(pendingStart){
   const p=pendingStart;pendingStart=null;document.documentElement?.classList?.add('te200-preparing');startingAfterReadiness=true;
   try{p.fn.apply(p.ctx,p.args)}finally{startingAfterReadiness=false}
   const cur=W.st?.current;if(!cur||cur===p.before){pendingStart=p;document.documentElement?.classList?.remove('te200-preparing');return}
   captureLaunchWeights(cur);attachReadiness(cur,d,adjust);try{W.save?.();W.modal?.(preparingMarkup())}catch(_){}
   busy=true;last=String(cur.id||'');
   try{await prepare(cur);enhanceDom()}catch(e){console.warn('v295 prepare before reveal',e);W.toast?.('Не удалось подготовить веса')}finally{busy=false;document.documentElement?.classList?.remove('te200-preparing');try{W.closeModal?.()}catch(_){}}
   setTimeout(tick,0);return
  }
  const cur=W.st?.current;if(!cur)return;lockLegacy(cur);attachReadiness(cur,d,adjust);(cur.ex||[]).forEach(ex=>{(ex.set||[]).forEach(s=>{if(s.ok||s.manualOverride||num(s.plannedW)<=0)return;s.w=todayWeight(s.plannedW,ex,cur)})});try{W.save?.();W.startPage?.();W.closeModal?.()}catch(_){}try{await W.trainingLoadModel292?.run?.(true)}catch(_){}setTimeout(enhanceDom,0);if(adjust)W.toast?.(readinessText(d).label)
 }
 function domSignature(cur){return JSON.stringify([cur.id,cur.trainingWeightPolicy214,cur.trainingLoadModelRevision||0,cur.trainingLoadModelAt||'',!!cur.trainingReadinessDone,!!cur.readinessAdjusted,cur.readiness?.score??null,(cur.ex||[]).map(ex=>[key(ex),ex.programWeightMode,ex.weightDecision,ex.trainingProgression292?.action||'',ex.trainingProgression292?.reason||'',(ex.set||[]).map(s=>[num(s.programW),num(s.recommendedW),!!s.trainingIntensity292,num(s.plannedW),num(s.w)])])])}
 function enhanceDom(){const cur=W.st?.current,root=document.getElementById('start');if(!cur||!root)return;root.querySelectorAll('.smart-suggest,.u177-rec,.wr180,.wr185').forEach(x=>x.remove());const sig=domSignature(cur);if(root.dataset.te200Sig===sig&&root.querySelector('.te200-readiness'))return;root.querySelectorAll('.te200-rec,.te200-auto,.te200-readiness').forEach(x=>x.remove());const cards=[...root.querySelectorAll('.exercise')];const seen=new Set();
  (cur.ex||[]).forEach((ex,i)=>{if(ex?.mode==='cardio')return;const k=key(ex);if(seen.has(k))return;seen.add(k);const indices=groupIndices(cur,k),group=indices.map(j=>cur.ex[j]),card=cards[i];if(!card)return;const anchor=card.querySelector('.exname')||card.firstElementChild;
   const prescribedGroup=group.every(g=>g?.programWeightMode==='prescribed');
   if(!prescribedGroup){
    const baseVals=[],todayVals=[],previousVals=[];group.forEach(g=>{if(num(g?.trainingEstimate200?.previousWeight)>0)previousVals.push(num(g.trainingEstimate200.previousWeight));(g.set||[]).forEach(s=>{if(num(s.plannedW)>0){baseVals.push(num(s.plannedW));todayVals.push(num(s.w)||todayWeight(s.plannedW,g,cur))}})});const el=document.createElement('div');el.className='te200-auto';const rp=readinessPercent(cur),fromHistory=Number(cur.trainingLoadModelRevision)===292&&group.some(g=>g.weightDecision==='adaptive_auto');if(baseVals.length&&fromHistory)el.textContent=`Автовес · ${fmtWeights(todayVals)} кг${previousVals.length?` · по прошлой ${fmtWeights(previousVals)} кг`:''}${rp?` · самочувствие ${rp}`:''}`;else if(baseVals.length)el.textContent=`Автовес · стартовый ${fmtWeights(todayVals)} кг${rp?` · самочувствие ${rp}`:''}`;else el.textContent='Автовес · первая тренировка · укажи рабочий вес для расчёта следующих занятий';anchor?.insertAdjacentElement('afterend',el)
   }else if(v292Ready(group,cur)){
    const rec=[],recToday=[],planToday=[];group.forEach(g=>(g.set||[]).forEach(s=>{if(num(s.recommendedW)>0&&s.trainingIntensity292){rec.push(num(s.recommendedW));recToday.push(todayWeight(s.recommendedW,g,cur))}if(num(s.programW)>0)planToday.push(todayWeight(s.programW,g,cur))}));if(rec.length){const applied=group.some(g=>g.weightDecision==='recommendation'),rp=readinessPercent(cur),progression=group.map(g=>g.trainingProgression292).find(Boolean),basis=group.map(g=>g.trainingEstimate200).find(x=>x?.method==='UNVRSL'&&x.averageWeight>0),basisText=progression?.reason|| (basis?`Основа: ср. ${String(basis.averageWeight).replace('.',',')} кг × ${String(basis.averageReps).replace('.',',')} повт.${basis.averageRpe!=null?` · ср. RPE ${String(basis.averageRpe).replace('.',',')}`:''}`:`Расчёт ${MATH_OWNER}`),el=document.createElement('div');el.className='te200-rec unvrsl-v292-ready'+(applied?' applied':'');el.dataset.recommendationOwner=MATH_OWNER;el.innerHTML=`<div class="te200-rec-main"><b>Рекомендация · ${fmtWeights(recToday)} кг</b><span>${basisText} · план сегодня ${fmtWeights(planToday)} кг${rp?` · самочувствие ${rp}`:''}</span></div><button type="button">${applied?'Вернуть план':'Применить'}</button>`;el.querySelector('button').onclick=()=>applied?restoreProgram(k):applyRecommendation(k);anchor?.insertAdjacentElement('afterend',el)}
   }
  });
  const head=root.querySelector('.workout-head')||root.firstElementChild;if(head){const b=document.createElement('button');b.className='te200-readiness'+(cur.trainingReadinessDone?' done':'');b.type='button';const rp=readinessPercent(cur);b.textContent=cur.trainingReadinessDone?(cur.readiness?.skipped?'Самочувствие · базовый вес':rp?`Самочувствие · ${rp}`:'Самочувствие · вес оставить'):'Самочувствие · рассчитать коррекцию';b.onclick=showReadiness;head.insertAdjacentElement('afterend',b)}root.dataset.te200Sig=sig
 }
 let last='',busy=false;
 function assignStart(name,fn){W[name]=fn;try{if(name==='begin')begin=fn;else if(name==='beginProgramDay')beginProgramDay=fn;else if(name==='beginRemotePlan')beginRemotePlan=fn}catch(_){}}
 function installStart(name){const fn=W[name];if(typeof fn!=='function'||fn.__te205PreStart)return;const wrapped=function(){if(startingAfterReadiness)return fn.apply(this,arguments);askBeforeStart(fn,arguments,this)};wrapped.__te205PreStart=true;wrapped.__te205Base=fn;assignStart(name,wrapped)}
 function installStartHooks(){['begin','beginProgramDay','beginRemotePlan'].forEach(installStart)}
 async function tick(){disableLegacyReadiness();installStartHooks();const cur=W.st?.current;if(!cur?.id||cur.ended)return;lockLegacy(cur);const id=String(cur.id);if(id!==last){last=id;busy=false;const root=document.getElementById('start');if(root)delete root.dataset.te200Sig}if(busy)return;busy=true;try{if(cur.trainingEngineRevision!==REV){const ok=await prepare(cur);if(!ok)return}else if(!W.trainingLoadModel292?.run){await ensureLoadModel()}enhanceDom()}finally{busy=false}}
 W.trainingApplyRecommendation200=applyRecommendation;W.trainingRestoreProgram200=restoreProgram;W.trainingShowReadiness200=showReadiness;W.trainingConfirmReadiness200=confirm;W.trainingUpdateReadiness200=updateReadiness;W.trainingEngine200Tick=tick;
 const oldApply=W.applySuggestion;W.applySuggestion=function(){if(W.st?.current?.id){W.toast?.(isOwnerEightWeekPlan(W.st.current)?'Используй рекомендацию над упражнением':'Автовес уже применяется автоматически');return}return typeof oldApply==='function'?oldApply.apply(this,arguments):undefined};try{applySuggestion=W.applySuggestion}catch(_){}
 installStartHooks();setInterval(tick,300);[0,80,250,700,1500,3000].forEach(t=>setTimeout(tick,t));
 W.dispatchEvent?.(new CustomEvent('unvrsl:training-engine-ready',{detail:{release:REV,mathOwner:MATH_OWNER}}));
})();