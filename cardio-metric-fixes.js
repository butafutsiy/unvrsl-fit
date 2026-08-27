'use strict';
(()=>{
  if(window.__unvrslCardioMetricFixes)return;window.__unvrslCardioMetricFixes=true;
  const nameOf=x=>String(x?.n||x?.name||x||'').trim().toLowerCase();
  const cardioName=x=>/аэробайк|аэро\s*байк|лыжн.*тренаж|ski\s*erg|гребн.*тренаж|велотренаж|бегов.*дорож|ходьб.*наклон|эллип|лестниц|stairmaster|степпер|скакал/.test(nameOf(x));
  const isCardioEntry=e=>!!e&&(e.mode==='cardio'||e.mode==='timer'||e.kind==='cardio'||e.workMode==='timer'||String(e.eq||'').toLowerCase()==='cardio'||String(e.bp||'').toLowerCase()==='cardio'||String(e.tg||'').toLowerCase()==='cardiovascular system'||String(e.sourceId||'').startsWith('cardio:')||cardioName(e));
  const isCardioCatalog=e=>!!e&&(String(e.eq||'').toLowerCase()==='cardio'||String(e.bp||'').toLowerCase()==='cardio'||String(e.tg||'').toLowerCase()==='cardiovascular system'||String(e.rawId||e.sourceId||'').startsWith('cardio:')||(e.custom&&cardioName(e)));
  const isCardioRef=(n,sourceId)=>String(sourceId||'').startsWith('cardio:')||cardioName(n);
  window.isCardioMetricExercise=isCardioEntry;

  const fmt=sec=>{sec=Math.max(1,Math.round(Number(sec)||0));const m=Math.floor(sec/60),s=sec%60;if(!s&&m)return`${m} мин`;return m?`${m}:${String(s).padStart(2,'0')}`:`${s} сек`};
  window.unvrslCardioWorkTimerV2=function(sec){sec=Math.max(1,Math.round(Number(sec)||0));if(typeof window.unvrslStartWorkTimer==='function')return window.unvrslStartWorkTimer(sec);if(typeof window.programWorkTimer==='function')return window.programWorkTimer(sec);if(typeof window.timer==='function')return window.timer(sec)};

  const groupBase=window.exerciseGroupCard||((typeof exerciseGroupCard==='function')?exerciseGroupCard:null);
  if(typeof groupBase==='function'&&!groupBase.__cardioBothModes){
    const wrapped=function(s,group){
      const entries=group?.entries||[];
      if(!entries.length||!entries.every(isCardioEntry))return groupBase.apply(this,arguments);
      const rows=[];
      entries.forEach((e,local)=>{const ei=group.indices?.[local]??local;(e.set||[]).forEach((x,si)=>{const sec=Number(x?.workSeconds||e?.workSeconds||e?.timedSeconds||(Number(x?.min)>0?Number(x.min)*60:0));rows.push({e,x,ei,si,sec,label:typeof variantLabel==='function'?variantLabel(e.n,si):String(si+1)})})});
      if(!rows.some(z=>z.sec>0))return groupBase.apply(this,arguments);
      const title=typeof displayExerciseName==='function'?displayExerciseName(group.base):group.base,last=entries.at(-1),restSec=Number(last?.rest||0),target=rows[0]?.e?.target||s?.target||6;
      return `<div class="exercise cardio-program-ex cardio-both-modes"><div class="row between"><div class="grow"><div class="exname">${esc(title)}</div><div class="rule-line">Кардио по времени${restSec?` · отдых ${restSec} сек`:''}</div><div class="chips compact"><span class="chip green">RPE ${target}</span><span class="chip">ТАЙМЕР</span></div></div>${restSec?`<button class="btn tiny" onclick="timer(${restSec})">⏱</button>`:''}</div><div class="sethead cardio-v2-head"><span>Сет</span><span>время</span><span>таймер</span><span>RPE</span><span></span></div>${rows.map(z=>`<div class="cardio-v2-row"><span class="setnum">${esc(z.label)}</span><b>${fmt(z.sec||60)}</b><button class="btn tiny cardio-v2-timer" onclick="unvrslCardioWorkTimerV2(${z.sec||60})">▶ Таймер</button><input inputmode="decimal" value="${z.x?.rpe||''}" placeholder="${z.e?.target||target}" onchange="editSet(${z.ei},${z.si},'rpe',this.value)"><button class="check ${z.x?.ok?'done':''}" onclick="toggleSet(${z.ei},${z.si})">${z.x?.ok?'✓':'○'}</button></div>`).join('')}</div>`
    };
    wrapped.__cardioBothModes=true;window.exerciseGroupCard=wrapped;try{exerciseGroupCard=wrapped}catch(e){}
  }

  const style=document.createElement('style');style.textContent=`.cardio-both-modes{border-color:rgba(10,132,255,.36)!important}.cardio-v2-head,.cardio-v2-row{display:grid;grid-template-columns:34px minmax(68px,.8fr) minmax(92px,1fr) minmax(70px,.8fr) 42px;gap:8px;align-items:center}.cardio-v2-head{color:#777;font-size:11px;text-align:center;margin:13px 0 2px}.cardio-v2-row{margin-top:8px}.cardio-v2-row>b{text-align:center;font-variant-numeric:tabular-nums}.cardio-v2-row input{width:100%;background:#111113;border:1px solid #343438;border-radius:13px;color:#fff;padding:11px 7px;text-align:center}.cardio-v2-timer{min-height:42px;background:rgba(10,132,255,.14)!important;color:#58a9ff!important;border-color:rgba(10,132,255,.35)!important}@media(max-width:390px){.cardio-v2-head,.cardio-v2-row{grid-template-columns:28px 62px minmax(82px,1fr) 62px 40px;gap:5px}.cardio-v2-timer{padding:8px 6px!important;font-size:11px!important}}`;document.head.appendChild(style);

  function removeRmSection(){
    const nodes=[...document.querySelectorAll('.section')],head=nodes.find(x=>(x.textContent||'').trim()==='РАСЧЁТНЫЙ 1ПМ');if(!head)return;
    let n=head.nextElementSibling;head.remove();
    while(n&&!n.classList.contains('section')){const next=n.nextElementSibling;n.remove();n=next}
  }
  const detailBase=window.renderExerciseDetail||((typeof renderExerciseDetail==='function')?renderExerciseDetail:null);
  if(typeof detailBase==='function'&&!detailBase.__noCardioRm){
    const wrapped=function(ex){const r=detailBase.apply(this,arguments);if(isCardioCatalog(ex)){removeRmSection();setTimeout(removeRmSection,0)}return r};
    wrapped.__noCardioRm=true;window.renderExerciseDetail=wrapped;try{renderExerciseDetail=wrapped}catch(e){}
  }
  const historyBase=window.historySetsFor||((typeof historySetsFor==='function')?historySetsFor:null);
  if(typeof historyBase==='function'&&!historyBase.__noCardioRm){const w=function(n,sourceId){if(isCardioRef(n,sourceId))return[];return historyBase.apply(this,arguments)};w.__noCardioRm=true;window.historySetsFor=w;try{historySetsFor=w}catch(e){}}
  const bestBase=window.bestEstimateFor||((typeof bestEstimateFor==='function')?bestEstimateFor:null);
  if(typeof bestBase==='function'&&!bestBase.__noCardioRm){const w=function(n,sourceId){if(isCardioRef(n,sourceId))return null;return bestBase.apply(this,arguments)};w.__noCardioRm=true;window.bestEstimateFor=w;try{bestEstimateFor=w}catch(e){}}

  function installLate(){
    const pr=window.advDetectSetPR;if(typeof pr==='function'&&!pr.__noCardioRm){const w=function(e,x){if(isCardioEntry(e))return[];return pr.apply(this,arguments)};w.__noCardioRm=true;window.advDetectSetPR=w;try{advDetectSetPR=w}catch(e){}}
    const hist=window.advHistorySets;if(typeof hist==='function'&&!hist.__noCardioRm){const w=function(base,sourceId){if(isCardioRef(base,sourceId))return[];return hist.apply(this,arguments)};w.__noCardioRm=true;window.advHistorySets=w;try{advHistorySets=w}catch(e){}}
    const sug=window.suggestionFor;if(typeof sug==='function'&&!sug.__noCardioRm){const w=function(base,sourceId){if(isCardioRef(base,sourceId))return null;return sug.apply(this,arguments)};w.__noCardioRm=true;window.suggestionFor=w;try{suggestionFor=w}catch(e){}}
    const adaptive=window.applyAdaptiveLoads;if(typeof adaptive==='function'&&!adaptive.__noCardioRm){const w=function(){const a=[];(st?.current?.ex||[]).forEach(e=>{if(isCardioEntry(e)&&e.mode==='timer'){a.push(e);e.mode='cardio'}});try{return adaptive.apply(this,arguments)}finally{a.forEach(e=>e.mode='timer')}};w.__noCardioRm=true;window.applyAdaptiveLoads=w;try{applyAdaptiveLoads=w}catch(e){}}
  }
  installLate();let tries=0;const id=setInterval(()=>{installLate();if(++tries>20)clearInterval(id)},500);
})();