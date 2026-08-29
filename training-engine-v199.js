'use strict';
(()=>{
 if(window.__unvrslTrainingEngineV199)return;window.__unvrslTrainingEngineV199=true;
 const W=window,REV=199;
 const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
 const num=v=>N(v)??0,mean=a=>{a=(a||[]).filter(Number.isFinite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null},clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const base=n=>{try{return W.baseExerciseName?W.baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim()}catch(_){return String(n||'')}};
 const same=(e,n,id)=>(id&&String(e?.sourceId||'')===String(id))||base(e?.n).toLowerCase()===base(n).toLowerCase();
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 if(!Array.isArray(W.st?.readinessLog))W.st.readinessLog=[];
 const style=document.createElement('style');style.id='training-engine-v199-style';style.textContent='.te199-list{display:grid;gap:8px;margin:14px 0}.te199-row{display:flex;justify-content:space-between;gap:12px;background:#202023;border:1px solid #303034;border-radius:15px;padding:11px 12px}.te199-row span{display:block;color:#8e8e93;font-size:12px;margin-top:3px}.te199-ready{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}.te199-item{background:#202023;border:1px solid #303034;border-radius:18px;padding:13px}.te199-item b{display:flex;justify-content:space-between;margin-bottom:9px}.te199-item input{width:100%;accent-color:var(--green)}';document.head.appendChild(style);
 function program(cur){try{if(cur?.programId&&W.programById){const p=W.programById(cur.programId);if(p)return p}}catch(_){}return(W.st?.programs||[]).find(p=>String(p?.cloudPlanId||'')===String(cur?.planId||''))||(W.st?.programs||[]).find(p=>String(p?.name||'')===String(cur?.programName||''))||null}
 function source(ex,cur){const p=program(cur),week=p?.weeks?.[Math.max(0,(N(cur?.w)||1)-1)];if(!week)return null;let days=week.days||[];const exact=days.find(d=>String(d?.name||'')===String(cur?.c||''));if(exact)days=[exact,...days.filter(d=>d!==exact)];for(const d of days){const s=(d.ex||[]).find(x=>same({n:x.n,sourceId:x.sourceId},ex.n,ex.sourceId));if(s)return s}return null}
 function modeFromSource(src){return(src?.sets||[]).some(x=>num(x?.w)>0)?'prescribed':'adaptive'}
 function effort(x){let rpe=N(x?.rpe),rir=N(x?.rir);if(rir==null&&rpe!=null)rir=10-rpe;if(rpe==null&&rir!=null)rpe=10-rir;return rpe==null?null:{rpe,rir:clamp(rir,0,10)}}
 function rowsFrom(s,ex){const out=[];(s?.ex||[]).forEach(e=>{if(!same(e,ex.n,ex.sourceId))return;(e.set||[]).forEach(x=>{const ef=effort(x),w=N(x?.w),r=N(x?.r);if(x?.ok&&w>0&&r>0&&ef)out.push({w,r,rir:ef.rir,date:s.date||''})})});return out}
 function localHistory(ex,cur){const ss=W.st?.sessions||[];for(let i=ss.length-1;i>=0;i--){const s=ss[i];if(String(s?.id||'')===String(cur.id||'')||!s?.ended)continue;const r=rowsFrom(s,ex);if(r.length)return r}return[]}
 async function history(ex,cur){const local=localHistory(ex,cur);if(local.length)return local;try{if(!W.cloud?.client||!W.cloud?.user?.id)return[];const q=await W.cloud.client.from('workouts').select('payload,workout_date').eq('user_id',W.cloud.user.id).order('workout_date',{ascending:false}).limit(50);if(q.error)return[];for(const row of q.data||[]){const p=row.payload||{};if(String(p.id||'')===String(cur.id||'')||!p?.ended)continue;const r=rowsFrom(p,ex);if(r.length)return r}}catch(e){console.warn('v199 history',e)}return[]}
 function e1rm(rows){let a=(rows||[]).map(x=>x.w*(1+(x.r+x.rir)/30)).filter(x=>x>0);if(!a.length)return null;const m=mean(a);if(a.length>=3){const kept=a.filter(x=>x>=m*.82&&x<=m*1.18);if(kept.length>=2)a=kept}return mean(a)}
 function step(ex,rows=[]){let s=2.5;try{s=Number(W.loadStepFor?.(base(ex.n),ex.sourceId||null))||s}catch(_){}const m=mean(rows.map(x=>x.w))||0;if(m<=6)s=Math.min(s,.5);else if(m<=12)s=Math.min(s,1);else if(m<=22)s=Math.min(s,2);return s}
 function round(v,s){return Math.max(s,Math.round(v/s)*s)}
 function target(ex,set,cur){return [N(set?.targetRpe),N(ex?.targetRpe),N(ex?.rpeTarget),N(ex?.target),N(ex?.rpe),N(cur?.target),8].find(x=>x!=null&&x>0)||8}
 function occurrenceIndex(ex,cur){const a=(cur.ex||[]).filter(x=>same(x,ex.n,ex.sourceId));const i=a.indexOf(ex);return i<0?0:i}
 function sourceWeight(src,ex,setIndex,cur){const sets=src?.sets||[];if((ex.set||[]).length>1)return num(sets[setIndex]?.w);return num(sets[occurrenceIndex(ex,cur)]?.w??sets[0]?.w)}
 async function prepare(cur){
  if(!cur)return false;
  const p=program(cur);if((cur.programId||cur.planId)&&!p)return false;
  let unresolved=false,adaptiveCount=0,prescribedCount=0;
  delete cur.trainingWeightChoice;delete cur.trainingReadinessDone;delete cur.engine196Prepared;delete cur.engine196FlowShown;delete cur.engine196ReadinessAsked;delete cur.weightsPrepared194;
  cur.unvrslAdaptive174Applied=true;cur.adaptiveEffortV2Applied=true;
  for(const ex of cur.ex||[]){
   if(ex?.mode==='cardio')continue;
   const src=source(ex,cur);if((cur.programId||cur.planId)&&!src){unresolved=true;continue}
   const mode=src?modeFromSource(src):((ex.set||[]).every(s=>num(s.w)<=0)?'adaptive':'prescribed');
   ex.programWeightMode=mode;delete ex.recommendation194;delete ex.engine196Recommendation;delete ex.progression187;
   const sets=ex.set||[];
   if(mode==='adaptive'){
    adaptiveCount++;
    sets.forEach(s=>{s.programW=0;delete s.recommendedW;if(!s.ok&&!s.manualOverride){s.w=0;s.plannedW=0;s.baselineW=0;s.baselineSource='adaptive_pending'}});
   }else{
    prescribedCount++;
    sets.forEach((s,i)=>{s.programW=sourceWeight(src,ex,i,cur);delete s.recommendedW});
   }
   const rows=await history(ex,cur),cap=e1rm(rows),stp=step(ex,rows);
   if(cap>0){sets.forEach(s=>{const reps=num(s.r);if(reps<=0)return;const rir=clamp(10-target(ex,s,cur),0,10),w=round(cap/(1+(reps+rir)/30),stp);if(w>0)s.recommendedW=w});ex.trainingEstimate199={e1rm:+cap.toFixed(1),sourceDate:rows[0]?.date||'',mode}}
   if(mode==='adaptive'){
    if(cap>0){sets.forEach(s=>{if(s.ok||s.manualOverride||num(s.recommendedW)<=0)return;s.w=num(s.recommendedW);s.plannedW=s.w;s.baselineW=s.w;s.baselineSource='adaptive_previous_workout'});ex.weightDecision='adaptive_auto'}
    else{ex.weightDecision='calibration'}
   }else{
    sets.forEach(s=>{if(s.ok||s.manualOverride)return;const w=num(s.programW);s.w=w;s.plannedW=w;s.baselineW=w;s.baselineSource='program'});
    ex.weightDecision=cap>0&&sets.some(s=>num(s.recommendedW)>0)?'awaiting_choice':'program_no_history';
   }
  }
  if(unresolved)return false;
  cur.trainingEngineRevision=REV;cur.trainingEngineVersion=REV;cur.trainingPreparedAt=new Date().toISOString();cur.trainingTrace199={adaptive:adaptiveCount,prescribed:prescribedCount};
  try{W.save?.();W.startPage?.()}catch(_){}return true
 }
 function awaiting(cur){return(cur?.ex||[]).filter(ex=>ex.programWeightMode==='prescribed'&&ex.weightDecision==='awaiting_choice')}
 function restorePrescribed(cur){let changed=false;awaiting(cur).forEach(ex=>(ex.set||[]).forEach(s=>{if(s.ok||s.manualOverride)return;const w=num(s.programW);if(w>0&&(num(s.w)!==w||num(s.plannedW)!==w)){s.w=w;s.plannedW=w;s.baselineW=w;s.baselineSource='program';changed=true}}));if(changed)try{W.save?.();W.startPage?.()}catch(_){}return changed}
 function showChoice(cur){const list=awaiting(cur);if(!list.length)return showReadiness(cur);const groups=new Map();list.forEach(ex=>{const k=ex.sourceId?`id:${ex.sourceId}`:`n:${base(ex.n).toLowerCase()}`;if(!groups.has(k))groups.set(k,{name:base(ex.n),plan:[],rec:[]});const g=groups.get(k);(ex.set||[]).forEach(s=>{if(num(s.programW)>0)g.plan.push(num(s.programW));if(num(s.recommendedW)>0)g.rec.push(num(s.recommendedW))})});const html=[...groups.values()].map(g=>`<div class="te199-row"><div><b>${esc(g.name)}</b><span>План: ${g.plan.join(' / ')} кг</span></div><div style="text-align:right"><b>${g.rec.join(' / ')} кг</b><span>рекомендация</span></div></div>`).join('');W.modal?.(`<div class="sheet-grabber"></div><h2>Рабочие веса</h2><div class="muted">Выбор показывается только для упражнений, где тренер заранее указал вес. Упражнения без исходного веса уже рассчитаны автоматически по прошлой тренировке.</div><div class="te199-list">${html}</div><button class="btn primary full" onclick="trainingChooseWeights199('recommendation')">Применить рекомендации</button><button class="btn full" style="margin-top:10px" onclick="trainingChooseWeights199('program')">Оставить веса программы</button>`)}
 function choose(kind){const cur=W.st?.current;if(!cur)return;awaiting(cur).forEach(ex=>{(ex.set||[]).forEach(s=>{if(s.ok||s.manualOverride)return;const w=kind==='recommendation'?num(s.recommendedW):num(s.programW);if(w>0){s.w=w;s.plannedW=w;s.baselineW=w;s.baselineSource=kind==='recommendation'?'prescribed_recommendation':'program'}});ex.weightDecision=kind});cur.trainingWeightChoice=kind;try{W.save?.();W.startPage?.();W.closeModal?.()}catch(_){}setTimeout(()=>showReadiness(cur),20)}
 function readiness(){const g=id=>num(document.getElementById(id)?.value||3),sl=g('te199Sleep'),en=g('te199Energy'),so=g('te199Sore'),st=g('te199Stress'),pos=v=>(v-1)/4,neg=v=>(5-v)/4,score=Math.round(pos(sl)*25+pos(en)*30+neg(so)*30+neg(st)*15);let factor=1,volume=1,drop=0;if(score<20){factor=.90;volume=.70}else if(score<35){factor=.925;drop=1}else if(score<50)factor=.95;else if(score>=92)factor=1.025;return{sleep:sl,energy:en,soreness:so,stress:st,score,factor,volume,drop,at:new Date().toISOString()}}
 function item(id,label){return `<div class="te199-item"><b><span>${label}</span><span id="${id}V">3</span></b><input id="${id}" type="range" min="1" max="5" value="3" oninput="document.getElementById('${id}V').textContent=this.value"></div>`}
 function showReadiness(cur){if(cur.trainingReadinessDone)return;W.modal?.(`<div class="sheet-grabber"></div><h2>Готовность к тренировке</h2><div class="muted">Базовые рабочие веса уже выставлены. Чек-ин только корректирует их по сегодняшнему состоянию.</div><div class="te199-ready">${item('te199Sleep','Сон')}${item('te199Energy','Энергия')}${item('te199Sore','Крепатура')}${item('te199Stress','Стресс')}</div><button class="btn primary full" onclick="trainingConfirmReadiness199(true)">Скорректировать по самочувствию</button><button class="btn full" style="margin-top:10px" onclick="trainingConfirmReadiness199(false)">Оставить базовые веса</button>`)}
 function confirm(adjust){const cur=W.st?.current;if(!cur)return;const d=readiness();(cur.ex||[]).forEach(ex=>{const stp=step(ex);(ex.set||[]).forEach(s=>{if(s.ok||s.manualOverride||num(s.plannedW)<=0)return;s.w=adjust?round(num(s.plannedW)*d.factor,stp):num(s.plannedW)});if(adjust&&d.factor<1){let keep=ex.set?.length||0;if(d.volume<1)keep=Math.max(1,Math.ceil(keep*d.volume));else if(d.drop)keep=Math.max(1,keep-d.drop);if(keep<(ex.set?.length||0))ex.set=ex.set.slice(0,keep)}});cur.readiness=d;cur.trainingReadinessDone=true;W.st.readinessLog.push({date:cur.date,sessionId:cur.id,...d});try{W.save?.();W.startPage?.();W.closeModal?.()}catch(_){}}
 let last='',busy=false;
 async function tick(){const cur=W.st?.current;if(!cur?.id||cur.ended)return;const id=String(cur.id);if(id!==last){last=id;busy=false;delete cur.trainingReadinessDone;delete cur.trainingWeightChoice}if(busy)return;busy=true;try{if(cur.trainingEngineRevision!==REV){const ok=await prepare(cur);if(!ok)return}restorePrescribed(cur);if(awaiting(cur).length&&!cur.trainingWeightChoice)showChoice(cur);else if(!cur.trainingReadinessDone)showReadiness(cur);document.querySelectorAll('#start .smart-suggest').forEach(x=>x.style.display='none')}finally{busy=false}}
 W.trainingChooseWeights199=choose;W.trainingConfirmReadiness199=confirm;W.trainingEngine199Tick=tick;
 const oldApply=W.applySuggestion;W.applySuggestion=function(){if(W.st?.current?.id){W.toast?.('Базовый вес уже рассчитан тренировочным движком');return}return typeof oldApply==='function'?oldApply.apply(this,arguments):undefined};try{applySuggestion=W.applySuggestion}catch(_){}
 setInterval(tick,250);[0,80,250,700,1500,3000].forEach(t=>setTimeout(tick,t));
})();