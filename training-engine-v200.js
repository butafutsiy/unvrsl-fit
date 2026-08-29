'use strict';
(()=>{
 if(window.__unvrslTrainingEngineV200)return;window.__unvrslTrainingEngineV200=true;
 const W=window,REV=200;
 const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
 const num=v=>N(v)??0,mean=a=>{a=(a||[]).filter(Number.isFinite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null},clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
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
 `;document.head.appendChild(style);
 function program(cur){try{if(cur?.programId&&W.programById){const p=W.programById(cur.programId);if(p)return p}}catch(_){}return(W.st?.programs||[]).find(p=>String(p?.cloudPlanId||'')===String(cur?.planId||''))||(W.st?.programs||[]).find(p=>String(p?.name||'')===String(cur?.programName||''))||null}
 function source(ex,cur){const p=program(cur),week=p?.weeks?.[Math.max(0,(N(cur?.w)||1)-1)];if(!week)return null;let days=week.days||[];const exact=days.find(d=>String(d?.name||'')===String(cur?.c||''));if(exact)days=[exact,...days.filter(d=>d!==exact)];for(const d of days){const s=(d.ex||[]).find(x=>same({n:x.n,sourceId:x.sourceId},ex.n,ex.sourceId));if(s)return s}return null}
 function modeFromSource(src){return(src?.sets||[]).some(x=>num(x?.w)>0)?'prescribed':'adaptive'}
 function effort(x){let rpe=N(x?.rpe),rir=N(x?.rir);if(rir==null&&rpe!=null)rir=10-rpe;if(rpe==null&&rir!=null)rpe=10-rir;return rpe==null?null:{rpe,rir:clamp(rir,0,10)}}
 function rowsFrom(s,ex){const out=[];(s?.ex||[]).forEach(e=>{if(!same(e,ex.n,ex.sourceId))return;(e.set||[]).forEach(x=>{const ef=effort(x),w=N(x?.w),r=N(x?.r);if(x?.ok&&w>0&&r>0&&ef)out.push({w,r,rir:ef.rir,date:s.date||''})})});return out}
 function localHistory(ex,cur){const ss=W.st?.sessions||[];for(let i=ss.length-1;i>=0;i--){const s=ss[i];if(String(s?.id||'')===String(cur.id||'')||!s?.ended)continue;const r=rowsFrom(s,ex);if(r.length)return r}return[]}
 async function history(ex,cur){const local=localHistory(ex,cur);if(local.length)return local;try{if(!W.cloud?.client||!W.cloud?.user?.id)return[];const q=await W.cloud.client.from('workouts').select('payload,workout_date').eq('user_id',W.cloud.user.id).order('workout_date',{ascending:false}).limit(50);if(q.error)return[];for(const row of q.data||[]){const p=row.payload||{};if(String(p.id||'')===String(cur.id||'')||!p?.ended)continue;const r=rowsFrom(p,ex);if(r.length)return r}}catch(e){console.warn('v200 history',e)}return[]}
 function e1rm(rows){let a=(rows||[]).map(x=>x.w*(1+(x.r+x.rir)/30)).filter(x=>x>0);if(!a.length)return null;const m=mean(a);if(a.length>=3){const kept=a.filter(x=>x>=m*.82&&x<=m*1.18);if(kept.length>=2)a=kept}return mean(a)}
 function step(ex,rows=[]){let s=2.5;try{s=Number(W.loadStepFor?.(base(ex.n),ex.sourceId||null))||s}catch(_){}const m=mean(rows.map(x=>x.w))||0;if(m<=6)s=Math.min(s,.5);else if(m<=12)s=Math.min(s,1);else if(m<=22)s=Math.min(s,2);return s}
 function round(v,s){return Math.max(s,Math.round(v/s)*s)}
 function target(ex,set,cur){return [N(set?.targetRpe),N(ex?.targetRpe),N(ex?.rpeTarget),N(ex?.target),N(ex?.rpe),N(cur?.target),8].find(x=>x!=null&&x>0)||8}
 function occurrenceIndex(ex,cur){const a=(cur.ex||[]).filter(x=>same(x,ex.n,ex.sourceId));const i=a.indexOf(ex);return i<0?0:i}
 function sourceWeight(src,ex,setIndex,cur){const sets=src?.sets||[];if((ex.set||[]).length>1)return num(sets[setIndex]?.w);return num(sets[occurrenceIndex(ex,cur)]?.w??sets[0]?.w)}
 async function prepare(cur){
  if(!cur)return false;const p=program(cur);if((cur.programId||cur.planId)&&!p)return false;
  let unresolved=false,adaptive=0,prescribed=0;
  cur.unvrslAdaptive174Applied=true;cur.adaptiveEffortV2Applied=true;
  delete cur.trainingWeightChoice;delete cur.engine196Prepared;delete cur.engine196FlowShown;delete cur.weightsPrepared194;
  for(const ex of cur.ex||[]){
   if(ex?.mode==='cardio')continue;const src=source(ex,cur);if((cur.programId||cur.planId)&&!src){unresolved=true;continue}
   const mode=src?modeFromSource(src):((ex.set||[]).every(s=>num(s.w)<=0)?'adaptive':'prescribed');ex.programWeightMode=mode;delete ex.recommendation194;delete ex.engine196Recommendation;delete ex.progression187;
   const sets=ex.set||[];
   if(mode==='adaptive'){adaptive++;sets.forEach(s=>{s.programW=0;delete s.recommendedW;if(!s.ok&&!s.manualOverride){s.w=0;s.plannedW=0;s.baselineW=0;s.baselineSource='adaptive_pending'}})}
   else{prescribed++;sets.forEach((s,i)=>{s.programW=sourceWeight(src,ex,i,cur);delete s.recommendedW;if(!s.ok&&!s.manualOverride){s.w=num(s.programW);s.plannedW=s.w;s.baselineW=s.w;s.baselineSource='program'}})}
   const rows=await history(ex,cur),cap=e1rm(rows),stp=step(ex,rows);
   if(cap>0){sets.forEach(s=>{const reps=num(s.r);if(reps<=0)return;const rir=clamp(10-target(ex,s,cur),0,10),w=round(cap/(1+(reps+rir)/30),stp);if(w>0)s.recommendedW=w});ex.trainingEstimate200={e1rm:+cap.toFixed(1),sourceDate:rows[0]?.date||'',mode}}
   if(mode==='adaptive'){
    if(cap>0){sets.forEach(s=>{if(s.ok||s.manualOverride||num(s.recommendedW)<=0)return;s.w=num(s.recommendedW);s.plannedW=s.w;s.baselineW=s.w;s.baselineSource='adaptive_previous_workout'});ex.weightDecision='adaptive_auto'}else ex.weightDecision='calibration'
   }else ex.weightDecision='program';
  }
  if(unresolved)return false;cur.trainingEngineRevision=REV;cur.trainingEngineVersion=REV;cur.trainingPreparedAt=new Date().toISOString();cur.trainingTrace200={adaptive,prescribed};try{W.save?.();W.startPage?.()}catch(_){}return true
 }
 function groupIndices(cur,k){const a=[];(cur.ex||[]).forEach((e,i)=>{if(key(e)===k)a.push(i)});return a}
 function fmtWeights(a){const vals=(a||[]).map(x=>num(x)).filter(x=>x>0);if(!vals.length)return'—';return vals.map(x=>String(x).replace('.',',')).join(' / ')}
 function applyRecommendation(k){const cur=W.st?.current;if(!cur)return;const idx=groupIndices(cur,k);idx.forEach(i=>{const ex=cur.ex[i];if(ex?.programWeightMode!=='prescribed')return;(ex.set||[]).forEach(s=>{if(s.ok||s.manualOverride||num(s.recommendedW)<=0)return;s.plannedW=num(s.recommendedW);s.baselineW=s.plannedW;s.baselineSource='prescribed_recommendation';if(cur.trainingReadinessDone&&cur.readinessAdjusted)s.w=round(s.plannedW*num(cur.readiness?.factor||1),step(ex));else s.w=s.plannedW});ex.weightDecision='recommendation'});try{W.save?.();W.startPage?.()}catch(_){}setTimeout(enhanceDom,0);W.toast?.('Рекомендованный вес применён')}
 function restoreProgram(k){const cur=W.st?.current;if(!cur)return;groupIndices(cur,k).forEach(i=>{const ex=cur.ex[i];if(ex?.programWeightMode!=='prescribed')return;(ex.set||[]).forEach(s=>{if(s.ok||s.manualOverride||num(s.programW)<=0)return;s.plannedW=num(s.programW);s.baselineW=s.plannedW;s.baselineSource='program';if(cur.trainingReadinessDone&&cur.readinessAdjusted)s.w=round(s.plannedW*num(cur.readiness?.factor||1),step(ex));else s.w=s.plannedW});ex.weightDecision='program'});try{W.save?.();W.startPage?.()}catch(_){}setTimeout(enhanceDom,0)}
 function readiness(){const g=id=>num(document.getElementById(id)?.value||3),sl=g('te200Sleep'),en=g('te200Energy'),so=g('te200Sore'),st=g('te200Stress'),pos=v=>(v-1)/4,neg=v=>(5-v)/4,score=Math.round(pos(sl)*25+pos(en)*30+neg(so)*30+neg(st)*15);let factor=1,volume=1,drop=0;if(score<20){factor=.90;volume=.70}else if(score<35){factor=.925;drop=1}else if(score<50)factor=.95;else if(score>=92)factor=1.025;return{sleep:sl,energy:en,soreness:so,stress:st,score,factor,volume,drop,at:new Date().toISOString()}}
 function item(id,label){return `<div class="te200-item"><b><span>${label}</span><span id="${id}V">3</span></b><input id="${id}" type="range" min="1" max="5" value="3" oninput="document.getElementById('${id}V').textContent=this.value"></div>`}
 function showReadiness(){const cur=W.st?.current;if(!cur)return;W.modal?.(`<div data-te200-flow="readiness"><div class="sheet-grabber"></div><h2>Готовность к тренировке</h2><div class="muted">Базовые веса уже выставлены. Здесь меняется только сегодняшняя работоспособность.</div><div class="te200-ready">${item('te200Sleep','Сон')}${item('te200Energy','Энергия')}${item('te200Sore','Крепатура')}${item('te200Stress','Стресс')}</div><button class="btn primary full" onclick="trainingConfirmReadiness200(true)">Скорректировать по самочувствию</button><button class="btn full" style="margin-top:10px" onclick="trainingConfirmReadiness200(false)">Оставить базовые веса</button></div>`)}
 function confirm(adjust){const cur=W.st?.current;if(!cur)return;const d=readiness();(cur.ex||[]).forEach(ex=>{const stp=step(ex);(ex.set||[]).forEach(s=>{if(s.ok||s.manualOverride||num(s.plannedW)<=0)return;s.w=adjust?round(num(s.plannedW)*d.factor,stp):num(s.plannedW)});if(adjust&&d.factor<1){let keep=ex.set?.length||0;if(d.volume<1)keep=Math.max(1,Math.ceil(keep*d.volume));else if(d.drop)keep=Math.max(1,keep-d.drop);if(keep<(ex.set?.length||0))ex.set=ex.set.slice(0,keep)}});cur.readiness=d;cur.readinessAdjusted=!!adjust;cur.trainingReadinessDone=true;W.st.readinessLog.push({date:cur.date,sessionId:cur.id,...d});try{W.save?.();W.startPage?.();W.closeModal?.()}catch(_){}setTimeout(enhanceDom,0)}
 function domSignature(cur){return JSON.stringify([cur.id,!!cur.trainingReadinessDone,!!cur.readinessAdjusted,cur.readiness?.score??null,(cur.ex||[]).map(ex=>[key(ex),ex.programWeightMode,ex.weightDecision,(ex.set||[]).map(s=>[num(s.programW),num(s.recommendedW),num(s.plannedW),num(s.w)])])])}
 function enhanceDom(){const cur=W.st?.current,root=document.getElementById('start');if(!cur||!root)return;root.querySelectorAll('.smart-suggest').forEach(x=>x.style.display='none');const sig=domSignature(cur);if(root.dataset.te200Sig===sig&&root.querySelector('.te200-readiness'))return;root.querySelectorAll('.te200-rec,.te200-auto,.te200-readiness').forEach(x=>x.remove());const cards=[...root.querySelectorAll('.exercise')];const seen=new Set();
  (cur.ex||[]).forEach((ex,i)=>{if(ex?.mode==='cardio')return;const k=key(ex);if(seen.has(k))return;seen.add(k);const indices=groupIndices(cur,k),group=indices.map(j=>cur.ex[j]),card=cards[i];if(!card)return;const anchor=card.querySelector('.exname')||card.firstElementChild;
   if(ex.programWeightMode==='adaptive'){
    const vals=[];group.forEach(g=>(g.set||[]).forEach(s=>{if(num(s.plannedW)>0)vals.push(num(s.plannedW))}));if(vals.length){const el=document.createElement('div');el.className='te200-auto';el.textContent=`Автовес · ${fmtWeights(vals)} кг · рассчитан по прошлой тренировке`;anchor?.insertAdjacentElement('afterend',el)}
   }else{
    const rec=[],plan=[];group.forEach(g=>(g.set||[]).forEach(s=>{if(num(s.recommendedW)>0)rec.push(num(s.recommendedW));if(num(s.programW)>0)plan.push(num(s.programW))}));if(rec.length){const applied=group.some(g=>g.weightDecision==='recommendation'),el=document.createElement('div');el.className='te200-rec'+(applied?' applied':'');el.innerHTML=`<div class="te200-rec-main"><b>Рекомендация · ${fmtWeights(rec)} кг</b><span>По прошлой тренировке · план ${fmtWeights(plan)} кг</span></div><button type="button">${applied?'Вернуть план':'Применить'}</button>`;el.querySelector('button').onclick=()=>applied?restoreProgram(k):applyRecommendation(k);anchor?.insertAdjacentElement('afterend',el)}
   }
  });
  const head=root.querySelector('.workout-head')||root.firstElementChild;if(head){const b=document.createElement('button');b.className='te200-readiness'+(cur.trainingReadinessDone?' done':'');b.type='button';b.textContent=cur.trainingReadinessDone?(cur.readinessAdjusted?`Самочувствие учтено · ${cur.readiness?.score??'—'}/100`:'Базовые веса оставлены'):'Самочувствие · скорректировать тренировку';b.onclick=showReadiness;head.insertAdjacentElement('afterend',b)}root.dataset.te200Sig=sig
 }
 let last='',busy=false;
 async function tick(){const cur=W.st?.current;if(!cur?.id||cur.ended)return;const id=String(cur.id);if(id!==last){last=id;busy=false;delete cur.trainingReadinessDone;delete cur.readinessAdjusted;const root=document.getElementById('start');if(root)delete root.dataset.te200Sig}if(busy)return;busy=true;try{if(cur.trainingEngineRevision!==REV){const ok=await prepare(cur);if(!ok)return}enhanceDom()}finally{busy=false}}
 W.trainingApplyRecommendation200=applyRecommendation;W.trainingRestoreProgram200=restoreProgram;W.trainingShowReadiness200=showReadiness;W.trainingConfirmReadiness200=confirm;W.trainingEngine200Tick=tick;
 const oldApply=W.applySuggestion;W.applySuggestion=function(){if(W.st?.current?.id){W.toast?.('Используй рекомендацию над упражнением');return}return typeof oldApply==='function'?oldApply.apply(this,arguments):undefined};try{applySuggestion=W.applySuggestion}catch(_){}
 setInterval(tick,300);[0,80,250,700,1500,3000].forEach(t=>setTimeout(tick,t));
})();