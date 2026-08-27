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
  const rirFromTarget=v=>{const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.round((10-n)*10)/10):''};
  const cleanTimerLabel=v=>{try{return decodeURIComponent(String(v||''))}catch(e){return String(v||'')}};
  window.unvrslCardioWorkTimerV2=function(sec,label){
    sec=Math.max(1,Math.round(Number(sec)||0));
    const title=cleanTimerLabel(label)||'Кардио';
    if(typeof window.timer==='function')return window.timer(sec,`Работа · ${title}`);
  };
  // Anton's timer button uses the same work-timer semantics too.
  window.programWorkTimer=function(sec,label){return window.unvrslCardioWorkTimerV2(sec,label)};
  try{programWorkTimer=window.programWorkTimer}catch(e){}

  function installGroupWrapper(){
    const base=window.exerciseGroupCard||((typeof exerciseGroupCard==='function')?exerciseGroupCard:null);
    if(typeof base!=='function'||base.__cardioBothModes)return false;
    const wrapped=function(s,group){
      const entries=group?.entries||[];
      if(!entries.length||!entries.every(isCardioEntry))return base.apply(this,arguments);
      const rows=[];
      entries.forEach((e,local)=>{const ei=group.indices?.[local]??local;(e.set||[]).forEach((x,si)=>{const sec=Number(x?.workSeconds||e?.workSeconds||e?.timedSeconds||(Number(x?.min)>0?Number(x.min)*60:0));rows.push({e,x,ei,si,sec,label:typeof variantLabel==='function'?variantLabel(e.n,si):String(si+1)})})});
      if(!rows.some(z=>z.sec>0))return base.apply(this,arguments);
      const title=typeof displayExerciseName==='function'?displayExerciseName(group.base):group.base;
      const last=entries.at(-1),restSec=Number(last?.rest||0),target=Number(rows[0]?.e?.target??s?.target??6),rir=rirFromTarget(target),firstSec=rows.find(z=>z.sec>0)?.sec||60;
      const tempo=String(rows[0]?.e?.tempo||'').trim(),showTempo=tempo&&!/^\d+(?:[-–]\d+){2,3}$/.test(tempo);
      const rule=`${fmt(firstSec)}${showTempo?` · темп ${tempo}`:''}${restSec?` · отдых ${restSec} сек`:''}`;
      return `<div class="exercise cardio-compact-ex"><div class="row between cardio-compact-head"><div class="grow"><div class="exname">${esc(title)}</div><div class="muted small">${esc(rule)}</div></div><div class="cardio-compact-effort"><span class="chip green">RPE ${target}</span><span class="chip">RIR ${rir}</span></div></div>${rows.map(z=>`<div class="cardio-compact-row"><span class="setnum">${esc(z.label)}</span><b>${fmt(z.sec||60)}</b><button class="btn tiny cardio-compact-timer" onclick="unvrslCardioWorkTimerV2(${z.sec||60},'${encodeURIComponent(title)}')">▶ Таймер</button><input inputmode="decimal" value="${z.x?.rpe||''}" placeholder="${z.e?.target||target}" onchange="editSet(${z.ei},${z.si},'rpe',this.value)"><button class="check ${z.x?.ok?'done':''}" onclick="toggleSet(${z.ei},${z.si})">${z.x?.ok?'✓':'○'}</button></div>`).join('')}</div>`
    };
    wrapped.__cardioBothModes=true;wrapped.__cardioBase=base;window.exerciseGroupCard=wrapped;try{exerciseGroupCard=wrapped}catch(e){};
    if(document.querySelector('#start.page.active')&&typeof startPage==='function')try{startPage()}catch(e){}
    return true
  }

  const style=document.createElement('style');style.id='unvrsl-cardio-compact-style';style.textContent=`
    #start .cardio-compact-ex{border-color:#303034!important;background:#1c1c1e!important}
    #start .cardio-compact-head{align-items:flex-start!important;gap:12px}
    #start .cardio-compact-effort{display:flex;gap:7px;align-items:center;justify-content:flex-end;flex:0 0 auto}
    #start .cardio-compact-row{display:grid;grid-template-columns:34px minmax(72px,.82fr) minmax(108px,1.18fr) minmax(72px,.82fr) 42px;gap:10px;align-items:center;margin-top:14px}
    #start .cardio-compact-row .setnum{color:#8e8e93;text-align:center;font-size:17px}
    #start .cardio-compact-row>b{text-align:center;font-size:17px;font-variant-numeric:tabular-nums;white-space:nowrap}
    #start .cardio-compact-row input{width:100%;min-width:0;background:#111113;border:1px solid #343438;border-radius:16px;color:#fff;padding:13px 7px;text-align:center;font-size:16px}
    #start .cardio-compact-timer{min-height:48px!important;background:#252529!important;color:#fff!important;border-color:#37373c!important;border-radius:15px!important;font-weight:750!important;white-space:nowrap}
    #start .cardio-compact-timer:active{background:#303036!important}
    @media(max-width:390px){
      #start .cardio-compact-effort{gap:5px}
      #start .cardio-compact-row{grid-template-columns:27px 62px minmax(90px,1fr) 62px 40px;gap:6px}
      #start .cardio-compact-row>b{font-size:15px}
      #start .cardio-compact-timer{padding:8px 6px!important;font-size:12px!important;min-height:44px!important}
      #start .cardio-compact-row input{font-size:14px;padding:11px 5px}
    }
  `;document.head.appendChild(style);

  function removeRmSection(){
    const nodes=[...document.querySelectorAll('.section')],head=nodes.find(x=>(x.textContent||'').trim()==='РАСЧЁТНЫЙ 1ПМ');if(!head)return;
    let n=head.nextElementSibling;head.remove();
    while(n&&!n.classList.contains('section')){const next=n.nextElementSibling;n.remove();n=next}
  }

  function installMetricGuards(){
    const detail=window.renderExerciseDetail||((typeof renderExerciseDetail==='function')?renderExerciseDetail:null);
    if(typeof detail==='function'&&!detail.__noCardioRm){const w=function(ex){const r=detail.apply(this,arguments);if(isCardioCatalog(ex)){removeRmSection();setTimeout(removeRmSection,0)}return r};w.__noCardioRm=true;window.renderExerciseDetail=w;try{renderExerciseDetail=w}catch(e){}}
    const history=window.historySetsFor||((typeof historySetsFor==='function')?historySetsFor:null);
    if(typeof history==='function'&&!history.__noCardioRm){const w=function(n,sourceId){if(isCardioRef(n,sourceId))return[];return history.apply(this,arguments)};w.__noCardioRm=true;window.historySetsFor=w;try{historySetsFor=w}catch(e){}}
    const best=window.bestEstimateFor||((typeof bestEstimateFor==='function')?bestEstimateFor:null);
    if(typeof best==='function'&&!best.__noCardioRm){const w=function(n,sourceId){if(isCardioRef(n,sourceId))return null;return best.apply(this,arguments)};w.__noCardioRm=true;window.bestEstimateFor=w;try{bestEstimateFor=w}catch(e){}}
    const pr=window.advDetectSetPR;if(typeof pr==='function'&&!pr.__noCardioRm){const w=function(e,x){if(isCardioEntry(e))return[];return pr.apply(this,arguments)};w.__noCardioRm=true;window.advDetectSetPR=w;try{advDetectSetPR=w}catch(e){}}
    const hist=window.advHistorySets;if(typeof hist==='function'&&!hist.__noCardioRm){const w=function(base,sourceId){if(isCardioRef(base,sourceId))return[];return hist.apply(this,arguments)};w.__noCardioRm=true;window.advHistorySets=w;try{advHistorySets=w}catch(e){}}
    const sug=window.suggestionFor;if(typeof sug==='function'&&!sug.__noCardioRm){const w=function(base,sourceId){if(isCardioRef(base,sourceId))return null;return sug.apply(this,arguments)};w.__noCardioRm=true;window.suggestionFor=w;try{suggestionFor=w}catch(e){}}
    const adaptive=window.applyAdaptiveLoads;if(typeof adaptive==='function'&&!adaptive.__noCardioRm){const w=function(){const changed=[];(st?.current?.ex||[]).forEach(e=>{if(isCardioEntry(e)&&e.mode!=='cardio'){changed.push([e,e.mode]);e.mode='cardio'}});try{return adaptive.apply(this,arguments)}finally{changed.forEach(([e,m])=>e.mode=m)}};w.__noCardioRm=true;window.applyAdaptiveLoads=w;try{applyAdaptiveLoads=w}catch(e){}}
  }

  installGroupWrapper();installMetricGuards();
  let tries=0;const id=setInterval(()=>{installGroupWrapper();installMetricGuards();if(++tries>60)clearInterval(id)},500);
})();