'use strict';
(function(root,factory){
  const api=factory(root||{});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)api.boot();
})(typeof window!=='undefined'?window:globalThis,function(W){
  const D=W.document,VERSION=315;
  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const mean=a=>{a=(a||[]).map(N).filter(Number.isFinite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null};
  const median=a=>{a=(a||[]).map(N).filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};
  const fmt=v=>{const n=N(v);return n==null?'–':String(Math.round(n*10)/10).replace('.',',')};
  const rangeLabel=(a,b)=>{const lo=N(a),hi=N(b);if(lo==null&&hi==null)return'–';const x=Math.min(lo??hi,hi??lo),y=Math.max(lo??hi,hi??lo);return Math.abs(x-y)<.001?fmt(x):`${fmt(x)}–${fmt(y)}`};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state=()=>{try{if(typeof st!=='undefined'){W.st=st;return st}}catch(_){ }return W.st||null};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){ }};
  const base=n=>{try{return W.baseExerciseName?W.baseExerciseName(n):String(n||'').split(' — ')[0].trim()}catch(_){return String(n||'').split(' — ')[0].trim()}};
  const key=e=>e?.sourceId?`id:${e.sourceId}`:`n:${base(e?.n).toLowerCase()}`;
  const same=(a,b)=>(a?.sourceId&&b?.sourceId&&String(a.sourceId)===String(b.sourceId))||base(a?.n).toLowerCase()===base(b?.n).toLowerCase();

  function targetFor(session,ex,set){
    let repMin=N(set?.targetRepMin??set?.rMin??ex?.targetRepMin??ex?.repMin),repMax=N(set?.targetRepMax??set?.rMax??ex?.targetRepMax??ex?.repMax);
    if(repMin==null)repMin=N(set?.programR??set?.r);if(repMax==null)repMax=repMin;
    if(repMin!=null&&repMax!=null){const a=Math.min(repMin,repMax);repMax=Math.max(repMin,repMax);repMin=a}
    let rpeMin=N(set?.targetRpeMin??ex?.targetRpeMin??session?.programWeekRpeMin??session?.targetRpeMin),rpeMax=N(set?.targetRpeMax??ex?.targetRpeMax??session?.programWeekRpeMax??session?.targetRpeMax);
    const point=N(set?.targetRpeResolved??set?.targetRpe??ex?.targetRpe??ex?.target??session?.target);
    if(rpeMin==null)rpeMin=point;if(rpeMax==null)rpeMax=point;
    if(rpeMin!=null&&rpeMax!=null){const a=Math.min(rpeMin,rpeMax);rpeMax=Math.max(rpeMin,rpeMax);rpeMin=a}
    return{repMin,repMax,rpeMin,rpeMax,repLabel:rangeLabel(repMin,repMax),rpeLabel:rangeLabel(rpeMin,rpeMax)}
  }
  function analyzeSet(input){
    const reps=N(input?.reps),rpe=N(input?.rpe),repMin=N(input?.repMin),repMax=N(input?.repMax)??repMin,rpeMin=N(input?.rpeMin),rpeMax=N(input?.rpeMax)??rpeMin;
    if(!(reps>0)||rpe==null||!(repMin>0)||rpeMin==null)return{code:'missing',tone:'neutral',title:'Недостаточно данных',message:'Добавь выполненные повторы и RPE, чтобы рассчитать коррекцию.'};
    const repTarget=rangeLabel(repMin,repMax),rpeTarget=rangeLabel(rpeMin,rpeMax);
    if(reps<repMin&&rpe>rpeMax+.25)return{code:'too_heavy',tone:'danger',title:'Нагрузка завышена',message:`${fmt(reps)} повт. ниже цели ${repTarget}, RPE ${fmt(rpe)} выше ${rpeTarget}.`};
    if(reps<repMin)return{code:'below_reps',tone:'warning',title:'Повторов меньше цели',message:`${fmt(reps)} повт. вместо ${repTarget}. Вес пока не повышаем.`};
    if(rpe>rpeMax+.25)return{code:'high_rpe',tone:'warning',title:'RPE выше цели',message:`${fmt(reps)} повт. выполнено, но RPE ${fmt(rpe)} выше ${rpeTarget}.`};
    if(reps>=repMax&&rpe<rpeMin-.25)return{code:'easy_top',tone:'easy',title:'Есть запас',message:`Верх диапазона ${repTarget} выполнен при RPE ${fmt(rpe)}. Для повышения нужно подтвердить результат дважды.`};
    if(reps>=repMax)return{code:'top_target',tone:'good',title:'Верх диапазона выполнен',message:`${fmt(reps)} повт. при RPE ${fmt(rpe)} – результат идёт в контроль прогрессии.`};
    return{code:'on_target',tone:'good',title:'В целевом диапазоне',message:`${fmt(reps)} повт. при RPE ${fmt(rpe)} соответствует плану.`}
  }
  function exerciseAssessment(session,reference){
    const entries=(session?.ex||[]).filter(e=>same(e,reference)),rows=[];
    entries.forEach(ex=>(ex.set||[]).forEach(set=>{if(!set?.ok)return;const t=targetFor(session,ex,set),reps=N(set.actualReps??set.r),rpe=N(set.actualRpe??set.rpe)??(N(set.actualRir??set.rir)!=null?10-N(set.actualRir??set.rir):null);if(!(reps>0)||rpe==null||!(t.repMin>0)||t.rpeMin==null)return;rows.push({set,ex,reps,rpe,...t,analysis:analyzeSet({reps,rpe,...t})})}));
    if(!rows.length)return null;
    const topNeed=Math.max(1,Math.ceil(rows.length*.75)),topNormal=rows.filter(x=>x.reps>=x.repMax&&x.rpe<=x.rpeMax+.25).length,avgReps=mean(rows.map(x=>x.reps)),avgRpe=mean(rows.map(x=>x.rpe)),tooHeavy=rows.some(x=>x.analysis.code==='too_heavy');
    return{rows,topNeed,topNormal,topReady:topNormal>=topNeed,tooHeavy,avgReps,avgRpe,weight:median(rows.map(x=>N(x.set?.w)).filter(x=>x>0))}
  }
  function historyFor(session,ex,limit=2){
    const out=[{session,assessment:exerciseAssessment(session,ex)}],list=Array.isArray(state()?.sessions)?state().sessions:[];
    for(let i=list.length-1;i>=0&&out.length<limit;i--){const old=list[i];if(String(old?.id||'')===String(session?.id||''))continue;const assessment=exerciseAssessment(old,ex);if(assessment)out.push({session:old,assessment})}
    return out.filter(x=>x.assessment)
  }
  function progressionFor(session,ex){
    const history=historyFor(session,ex,2),latest=history[0]?.assessment;if(!latest)return null;let topStreak=0;for(const item of history){if(!item.assessment.topReady)break;topStreak++}
    if(latest.tooHeavy)return{action:'down',topStreak,assessment:latest,reason:'Повторы ниже цели одновременно с RPE выше цели.'};
    if(topStreak>=2)return{action:'up',topStreak,assessment:latest,reason:'Верх диапазона выполнен две тренировки подряд при целевом RPE.'};
    if(latest.topReady)return{action:'hold',topStreak,assessment:latest,reason:'Верх диапазона выполнен один раз из двух. Вес пока оставляем.'};
    return{action:'hold',topStreak,assessment:latest,reason:'Сначала нужно стабильно выполнить целевой диапазон повторений и RPE.'}
  }

  function programFor(cur){
    const programs=Array.isArray(state()?.programs)?state().programs:[];
    return programs.find(p=>cur?.programId&&String(p?.id||'')===String(cur.programId))||programs.find(p=>cur?.planId&&String(p?.cloudPlanId||'')===String(cur.planId))||programs.find(p=>cur?.programName&&String(p?.name||'')===String(cur.programName))||null
  }
  function blockTarget(program,wi,di,block){
    const week=program?.weeks?.[wi]||{},sets=block?.sets||[],repMin=N(block?.repMin??block?.targetRepMin??block?.rMin??block?.r)??median(sets.map(s=>N(s?.targetRepMin??s?.rMin??s?.programR??s?.r)).filter(x=>x>0)),repMax=N(block?.repMax??block?.targetRepMax??block?.rMax)??median(sets.map(s=>N(s?.targetRepMax??s?.rMax??s?.programR??s?.r)).filter(x=>x>0))??repMin;
    let rpeMin=N(block?.rpeMin??block?.targetRpeMin)??median(sets.map(s=>N(s?.targetRpeMin)).filter(Number.isFinite))??N(week?.rpeMin??week?.weekRpeMin),rpeMax=N(block?.rpeMax??block?.targetRpeMax)??median(sets.map(s=>N(s?.targetRpeMax)).filter(Number.isFinite))??N(week?.rpeMax??week?.weekRpeMax),point=N(block?.rpe??block?.targetRpe)??median(sets.map(s=>N(s?.targetRpeResolved??s?.targetRpe)).filter(Number.isFinite));
    if(rpeMin==null)rpeMin=point;if(rpeMax==null)rpeMax=point;
    return{kind:'program',week:wi+1,day:program.weeks?.[wi]?.days?.[di]?.name||`День ${di+1}`,repMin,repMax,rpeMin,rpeMax,weights:sets.map(s=>N(s?.w)).filter(x=>x>0),block}
  }
  function nextProgramPrescription(cur,ex){
    const p=programFor(cur);if(!p)return null;const wi=Math.max(0,(N(cur?.programWeekNumber)??N(cur?.w)??1)-1),days=p.weeks?.[wi]?.days||[],di=days.findIndex(d=>String(d?.name||'')===String(cur?.c||''));
    for(let w=wi;w<(p.weeks?.length||0);w++){
      const list=p.weeks[w]?.days||[],start=w===wi?(di>=0?di+1:list.length):0;
      for(let d=start;d<list.length;d++)for(const block of list[d]?.ex||[])if(same(block,ex))return blockTarget(p,w,d,block)
    }
    return null
  }
  function builtInPrescription(cur,ex){
    const order={A1:1,B:2,C:3,A2:4,D:5},all=(W.UNVRSL_ROUTINES||[]).slice().sort((a,b)=>(N(a?.w)||0)-(N(b?.w)||0)||(order[a?.c]||99)-(order[b?.c]||99)),pos=all.findIndex(r=>N(r?.w)===N(cur?.w)&&String(r?.c||'')===String(cur?.c||''));
    for(let i=Math.max(0,pos+1);i<all.length;i++){
      const routine=all[i],matches=(routine?.e||[]).filter(item=>same(item,ex));if(!matches.length)continue;const first=matches[0],mapped=W.unvrslActiveRepRangeV315?.(routine.w,first),profile=W.UNVRSL_BUILTIN_LOAD_PROFILE?.[Number(routine.w)]?.rpe||[],repMin=N(mapped?.min)??median(matches.map(x=>N(x?.r)).filter(x=>x>0)),repMax=N(mapped?.max)??repMin;
      return{kind:'builtin',week:N(routine.w),day:String(routine.c||''),repMin,repMax,rpeMin:N(profile[0]),rpeMax:N(profile[1]),weights:matches.map(x=>N(x?.w)).filter(x=>x>0),block:first}
    }
    return null
  }
  function nextPrescription(cur,ex){return nextProgramPrescription(cur,ex)||builtInPrescription(cur,ex)}
  function loadStep(ex,weights=[]){
    let step=null;try{step=N(W.loadStepFor?.(base(ex?.n),ex?.sourceId||null))}catch(_){ }
    const w=median(weights);if(!(step>0))step=2.5;if(w>0&&w<=6)step=Math.min(step,.5);else if(w>0&&w<=12)step=Math.min(step,1);else if(w>0&&w<=22)step=Math.min(step,2);return step
  }
  function adjustedWeights(next,progression,ex){
    const weights=(next?.weights||[]).filter(x=>N(x)>0),step=loadStep(ex,weights),assisted=/гравитрон|assisted|помощ/i.test(base(ex?.n));if(!weights.length)return{weights:[],step};
    const delta=progression?.action==='up'?(assisted?-step:step):progression?.action==='down'?(assisted?step:-step):0;
    return{weights:weights.map(w=>Math.max(0,Math.round((w+delta)/step)*step)),step}
  }
  function buildReport(session){
    const seen=new Set(),entries=[];
    (session?.ex||[]).forEach(ex=>{if(ex?.mode==='cardio'||seen.has(key(ex)))return;seen.add(key(ex));const progression=progressionFor(session,ex);if(!progression)return;const next=nextPrescription(session,ex),adjusted=adjustedWeights(next,progression,ex);entries.push({key:key(ex),name:base(ex.n),action:progression.action,topStreak:progression.topStreak,reason:progression.reason,next:next?{week:next.week,day:next.day,repMin:next.repMin,repMax:next.repMax,rpeMin:next.rpeMin,rpeMax:next.rpeMax,planWeights:next.weights,recommendedWeights:adjusted.weights}:null})});
    return{id:String(session?.id||Date.now()),revision:VERSION,createdAt:new Date().toISOString(),entries}
  }

  function parseIndex(row){
    const input=[...row.querySelectorAll('input')].find(x=>x.dataset?.u174Ei!=null)||row.querySelector('input'),ei=N(input?.dataset?.u174Ei),si=N(input?.dataset?.u174Si);if(ei!=null&&si!=null)return{ei,si};
    const raw=[...row.querySelectorAll('input')].map(x=>x.getAttribute('onchange')||'').join(' '),m=raw.match(/(?:editSet|unvrslEditEffort174)\((\d+)\s*,\s*(\d+)/);return m?{ei:+m[1],si:+m[2]}:null
  }
  function ensureStyle(){
    if(!D||D.getElementById('performance-control-v315-style'))return;const s=D.createElement('style');s.id='performance-control-v315-style';s.textContent=`
      #start .setrow.pc315-danger{box-shadow:0 0 0 1px rgba(255,69,58,.60);border-radius:14px;background:rgba(255,69,58,.05)}
      #start .setrow.pc315-warning{box-shadow:0 0 0 1px rgba(255,159,10,.50);border-radius:14px;background:rgba(255,159,10,.05)}
      #start .setrow.pc315-easy{box-shadow:0 0 0 1px rgba(100,210,255,.42);border-radius:14px;background:rgba(100,210,255,.04)}
      .pc315-feedback{margin:6px 4px 2px;padding:8px 10px;border-radius:12px;font-size:12px;line-height:1.35;background:#242428;color:#b8b8bd}.pc315-feedback b{color:#f5f5f7}.pc315-feedback.danger{background:rgba(255,69,58,.10);color:#ff9b95}.pc315-feedback.warning{background:rgba(255,159,10,.10);color:#ffc261}.pc315-feedback.easy{background:rgba(100,210,255,.09);color:#9cdefb}.pc315-feedback.good{background:rgba(48,209,88,.08);color:#78df91}
      .pc315-summary{margin-top:12px}.pc315-entry{padding:13px 0;border-bottom:1px solid #303034}.pc315-entry:last-child{border-bottom:0}.pc315-entry-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.pc315-entry-head b{font-size:15px}.pc315-action{padding:5px 8px;border-radius:999px;font-size:11px;font-weight:850}.pc315-action.up{color:#30d158;background:rgba(48,209,88,.12)}.pc315-action.down{color:#ff9f0a;background:rgba(255,159,10,.12)}.pc315-action.hold{color:#c6c6ca;background:#2b2b2e}.pc315-next{margin-top:6px;color:#dadade;font-size:12px;line-height:1.4}.pc315-reason{margin-top:4px;color:#8e8e93;font-size:11px;line-height:1.4}
    `;D.head?.appendChild(s)
  }
  function enhanceRows(){
    if(!D)return;ensureStyle();const cur=state()?.current,root=D.getElementById('start');if(!cur||!root)return;
    root.querySelectorAll('.setrow').forEach(row=>{const anchor=row.closest('.set-wrap')||row,idx=parseIndex(row),old=anchor.nextElementSibling?.matches?.('.pc315-feedback')?anchor.nextElementSibling:null;row.classList.remove('pc315-danger','pc315-warning','pc315-easy');if(!idx)return;const ex=cur.ex?.[idx.ei],set=ex?.set?.[idx.si];if(!set?.ok||ex?.mode==='cardio'){old?.remove();return}const t=targetFor(cur,ex,set),reps=N(set.actualReps??set.r),rpe=N(set.actualRpe??set.rpe)??(N(set.actualRir??set.rir)!=null?10-N(set.actualRir??set.rir):null),result=analyzeSet({reps,rpe,...t});if(result.tone==='danger')row.classList.add('pc315-danger');if(result.tone==='warning')row.classList.add('pc315-warning');if(result.tone==='easy')row.classList.add('pc315-easy');if(old?.dataset?.code===result.code&&old.dataset.message===result.message)return;old?.remove();const note=D.createElement('div');note.className=`pc315-feedback ${result.tone}`;note.dataset.code=result.code;note.dataset.message=result.message;note.setAttribute('role','status');note.innerHTML=`<b>${esc(result.title)}</b> · ${esc(result.message)}`;anchor.insertAdjacentElement('afterend',note)})
  }
  function weightsLabel(values){const u=[];(values||[]).forEach(v=>{const n=N(v);if(n!=null&&!u.some(x=>Math.abs(x-n)<.001))u.push(n)});return u.length?u.map(fmt).join(' / '):'–'}
  function reportHtml(report){
    if(!report?.entries?.length)return'';const rows=report.entries.map(x=>{const action=x.action==='up'?'Повысить':x.action==='down'?'Снизить':'Оставить',next=x.next?`W${x.next.week}${x.next.day?` · ${esc(x.next.day)}`:''} · ${rangeLabel(x.next.repMin,x.next.repMax)} повт. · RPE ${rangeLabel(x.next.rpeMin,x.next.rpeMax)}`:'Следующее появление упражнения',weight=x.next?.planWeights?.length?`План ${weightsLabel(x.next.planWeights)} кг · рекомендация ${weightsLabel(x.next.recommendedWeights)} кг`:'Вес будет рассчитан при старте следующей тренировки';return`<div class="pc315-entry"><div class="pc315-entry-head"><b>${esc(x.name)}</b><span class="pc315-action ${x.action}">${action}</span></div><div class="pc315-next">${next}<br>${weight}</div><div class="pc315-reason">${esc(x.reason)}</div></div>`}).join('');return`<div class="pc315-summary" data-pc315-report="${esc(report.id)}"><div class="section">КОРРЕКЦИЯ СЛЕДУЮЩЕЙ ТРЕНИРОВКИ</div><div class="card">${rows}</div></div>`
  }
  let pendingReport=null;
  function injectReport(){if(!D||!pendingReport)return;const sheet=D.getElementById('sheet');if(!sheet||sheet.querySelector(`[data-pc315-report="${pendingReport.id}"]`))return;const html=reportHtml(pendingReport);if(html)sheet.insertAdjacentHTML('beforeend',html)}
  function installFinish(){
    if(W.__unvrslPerformanceFinishV315)return true;let fn=W.finish;try{if(typeof finish==='function')fn=finish}catch(_){ }if(typeof fn!=='function')return false;
    const wrapped=function(){const session=state()?.current;if(session){pendingReport=buildReport(session);session.performanceControl315=pendingReport;saveState()}const out=fn.apply(this,arguments);if(session?.ended){[40,140,320].forEach(ms=>setTimeout(injectReport,ms))}return out};wrapped.__performanceControlV315=true;wrapped.__performanceControlBase=fn;W.finish=wrapped;W.__unvrslPerformanceFinishV315=true;try{finish=wrapped}catch(_){ }return true
  }
  function boot(){
    if(!D||W.__unvrslPerformanceControlV315)return;W.__unvrslPerformanceControlV315=true;ensureStyle();W.performanceControl315={analyzeSet,targetFor,exerciseAssessment,progressionFor,nextPrescription,buildReport,enhanceRows,version:VERSION};
    const sync=()=>{installFinish();enhanceRows()};if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
    let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();injectReport()})}).observe(D.documentElement,{childList:true,subtree:true});
    D.addEventListener('change',e=>{if(e.target?.closest?.('#start .setrow'))setTimeout(enhanceRows,0)},true);D.addEventListener('click',e=>{if(e.target?.closest?.('#start .check'))setTimeout(enhanceRows,40)},true);
    ['unvrsl:training-engine-ready','unvrsl:modules-ready','unvrsl:app-ready','unvrsl:client-ready','unvrsl:cloud-modules-settled'].forEach(ev=>W.addEventListener?.(ev,()=>setTimeout(sync,0),{passive:true}));setInterval(sync,900)
  }
  return{analyzeSet,targetFor,exerciseAssessment,progressionFor,nextPrescription,buildReport,rangeLabel,boot,version:VERSION}
});
