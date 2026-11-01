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
  const cleanTimerLabel=v=>{try{return decodeURIComponent(String(v||''))}catch(e){return String(v||'')}};
  window.unvrslCardioWorkTimerV2=function(sec,label){
    sec=Math.max(1,Math.round(Number(sec)||0));
    const title=cleanTimerLabel(label)||'Кардио';
    if(typeof window.timer==='function')return window.timer(sec,`Работа · ${title}`);
  };
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
      const last=entries.at(-1),restSec=Number(last?.rest||0),target=Number(rows[0]?.e?.target??s?.target??6),firstSec=rows.find(z=>z.sec>0)?.sec||60;
      const tempo=String(rows[0]?.e?.tempo||'').trim(),uniform=/равномер|steady/i.test(tempo);
      const duration=fmt(firstSec),clock=sec=>{sec=Math.max(0,Math.round(Number(sec)||0));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`};
      const pieces=[duration,rows.length>1?`${rows.length} интервалов`:uniform?'Равномерно':'Кардио',`RPE ${target}`];
      if(rows.length>1&&restSec>0)pieces.push(`отдых ${restSec} сек`);
      return `<section class="exercise cardio-compact-ex" data-cardio-compact="true"><div class="cardio-compact-head"><div class="grow"><div class="exname">${esc(title)}</div><div class="cardio-compact-meta">${esc(pieces.join(' · '))}</div></div></div><div class="cardio-compact-body">${rows.map(z=>`<div class="cardio-compact-row"><span class="cardio-compact-clock">${rows.length>1?`<small>${esc(z.label)}</small>`:''}<b>${clock(z.sec||60)}</b></span><button type="button" class="btn cardio-compact-timer" onclick="unvrslCardioWorkTimerV2(${z.sec||60},'${encodeURIComponent(title)}')">▶ Таймер</button><button type="button" aria-label="Отметить завершение кардио" class="check ${z.x?.ok?'done':''}" onclick="toggleSet(${z.ei},${z.si})">${z.x?.ok?'✓':'○'}</button></div>`).join('')}</div></section>`
    };
    wrapped.__cardioBothModes=true;wrapped.__cardioBase=base;window.exerciseGroupCard=wrapped;try{exerciseGroupCard=wrapped}catch(e){};
    if(document.querySelector('#start.page.active')&&typeof startPage==='function')try{startPage()}catch(e){}
    return true
  }

  const style=document.createElement('style');style.id='unvrsl-cardio-compact-style';style.textContent=`
    #start .cardio-compact-ex{padding:16px!important;margin:10px 0!important;border:1px solid var(--line)!important;border-radius:19px!important;background:var(--panel)!important;min-width:0}
    #start .cardio-compact-head{display:flex;align-items:center;gap:8px;min-width:0}
    #start .cardio-compact-head .exname{font-size:17px!important;font-weight:750!important;line-height:1.25!important;color:var(--text)!important}
    #start .cardio-compact-meta{margin-top:5px;color:var(--muted);font-size:12px;line-height:1.4;overflow-wrap:anywhere}
    #start .cardio-compact-body{display:grid;gap:10px;margin-top:14px}
    #start .cardio-compact-row{display:grid;grid-template-columns:minmax(75px,.9fr) minmax(95px,1fr) 44px;gap:10px;align-items:center;min-width:0}
    #start .cardio-compact-clock{display:flex;align-items:baseline;gap:5px;min-width:0;font-variant-numeric:tabular-nums}
    #start .cardio-compact-clock small{font-size:11px;color:var(--muted)}
    #start .cardio-compact-clock b{font-size:23px;color:var(--text);font-weight:800;line-height:1.15;letter-spacing:-.045em;white-space:nowrap}
    #start .cardio-compact-timer{min-height:44px!important;padding:10px 8px!important;font-size:13px!important;font-weight:700!important;background:var(--panel2)!important;color:var(--text)!important;border:1px solid var(--line)!important;border-radius:13px!important;white-space:nowrap}
    #start .cardio-compact-row .check{width:44px!important;height:44px!important;border:1px solid var(--line)!important;border-radius:13px!important}
    #start .cardio-compact-ex .eq405-control{display:none!important}
    @media(max-width:375px){#start .cardio-compact-ex{padding:13px!important}#start .cardio-compact-row{grid-template-columns:minmax(63px,.8fr) minmax(82px,1fr) 40px;gap:6px}#start .cardio-compact-clock b{font-size:20px}#start .cardio-compact-row .check{width:40px!important;height:40px!important}#start .cardio-compact-timer{font-size:12px!important}}
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
  }

  const install=()=>{installGroupWrapper();installMetricGuards()};
  install();
  ['unvrsl:modules-ready','unvrsl:deferred-modules-ready','unvrsl:app-ready'].forEach(ev=>window.addEventListener(ev,install,{passive:true}));
})();
