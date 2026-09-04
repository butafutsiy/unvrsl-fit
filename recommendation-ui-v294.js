'use strict';
(()=>{
  const W=window,D=document,REV=294;
  if(W.__unvrslRecommendationUiV294)return;
  W.__unvrslRecommendationUiV294=true;
  W.__unvrslCanonicalRecommendationOwner='training-load-model-v292';
  W.__unvrslRecommendationMathOwner='training-load-model-v292';

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const base=n=>{try{return W.baseExerciseName?W.baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim()}catch(_){return String(n||'')}};
  const key=e=>e?.sourceId?`id:${e.sourceId}`:`n:${base(e?.n).toLowerCase()}`;
  const fmt=a=>{const vals=(a||[]).map(N).filter(x=>x!=null&&x>=0),u=[];vals.forEach(x=>{if(!u.some(y=>Math.abs(y-x)<.001))u.push(x)});return u.length?u.map(x=>String(x).replace('.',',')).join(' / '):'—'};
  const stepFor=ex=>{try{return Number(W.loadStepFor?.(base(ex?.n),ex?.sourceId||null))||2.5}catch(_){return 2.5}};
  function today(v,ex,cur){const n=N(v);if(n==null)return null;try{const fn=W.unvrslTrainingReadinessWeightV292;if(typeof fn==='function')return fn(n,ex,cur,stepFor(ex))}catch(_){ }const f=cur?.trainingReadinessDone&&cur?.readinessAdjusted?(N(cur?.readiness?.factor)||1):1,s=stepFor(ex);return Math.max(0,Math.round((n*f)/s)*s)}
  function readinessPercent(cur){if(!cur?.trainingReadinessDone||!cur?.readinessAdjusted)return'';const p=Math.round(((N(cur?.readiness?.factor)||1)-1)*1000)/10;return`${p>0?'+':''}${String(p).replace('.',',')}%`}
  function groupIndices(cur,k){const a=[];(cur?.ex||[]).forEach((e,i)=>{if(key(e)===k)a.push(i)});return a}
  function v292Ready(group,cur){if(Number(cur?.trainingLoadModelRevision)!==292)return false;return group.some(ex=>(ex?.set||[]).some(s=>N(s?.recommendedW)!=null&&!!s?.trainingIntensity292))}
  function reasonFor(group){const progression=group.map(x=>x?.trainingProgression292).find(Boolean);if(progression?.reason)return progression.reason;const estimate=group.map(x=>x?.trainingEstimate200).find(Boolean);if(estimate?.confidence)return`Расчёт v292 · уверенность ${estimate.confidence}`;return'Единая рекомендация v292'}
  function removeLegacy(root){root?.querySelectorAll('.te200-rec,.smart-suggest,.u177-rec,.wr180,.wr185,.adaptive-rec,[data-legacy-recommendation]').forEach(x=>x.remove())}
  function render(){
    const cur=W.st?.current,root=D.getElementById('start');if(!cur||!root||cur.ended)return;
    removeLegacy(root);
    const cards=[...root.querySelectorAll('.exercise')],seen=new Set(),wanted=new Set();
    (cur.ex||[]).forEach((ex,i)=>{
      if(ex?.mode==='cardio')return;const k=key(ex);if(seen.has(k))return;seen.add(k);
      const idx=groupIndices(cur,k),group=idx.map(j=>cur.ex[j]),card=cards[i];if(!card)return;
      const prescribed=group.every(g=>g?.programWeightMode==='prescribed');if(!prescribed||!v292Ready(group,cur))return;
      const rec=[],recToday=[],planToday=[];
      group.forEach(g=>(g.set||[]).forEach(s=>{if(N(s.recommendedW)!=null&&s.trainingIntensity292){rec.push(N(s.recommendedW));recToday.push(today(s.recommendedW,g,cur))}if(N(s.programW)>0)planToday.push(today(s.programW,g,cur))}));
      if(!rec.length)return;
      const id=`tlm292-${encodeURIComponent(k)}`;wanted.add(id);
      let el=[...card.querySelectorAll('.tlm292-rec')].find(x=>x.dataset.recId===id);
      if(!el){el=D.createElement('div');el.className='tlm292-rec';el.dataset.recId=id;const anchor=card.querySelector('.exname')||card.firstElementChild;anchor?.insertAdjacentElement('afterend',el)}
      const applied=group.some(g=>g.weightDecision==='recommendation'),rp=readinessPercent(cur),reason=reasonFor(group),html=`<div class="tlm292-rec-main"><b>Рекомендация · ${fmt(recToday)} кг</b><span>${reason} · план сегодня ${fmt(planToday)} кг${rp?` · самочувствие ${rp}`:''}</span></div><button type="button">${applied?'Вернуть план':'Применить'}</button>`,sig=`${html}|${applied}|${k}`;
      if(el.dataset.sig!==sig){el.innerHTML=html;el.dataset.sig=sig;el.querySelector('button').onclick=()=>{try{applied?W.trainingRestoreProgram200?.(k):W.trainingApplyRecommendation200?.(k)}finally{setTimeout(render,0)}}}
    });
    root.querySelectorAll('.tlm292-rec').forEach(el=>{if(!wanted.has(el.dataset.recId||''))el.remove()});
  }
  function installStyle(){if(D.getElementById('recommendation-ui-v294-style'))return;const s=D.createElement('style');s.id='recommendation-ui-v294-style';s.textContent=`
    #start .te200-rec{display:none!important;visibility:hidden!important;pointer-events:none!important}
    .tlm292-rec{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:9px 0 2px;padding:9px 11px;border-radius:14px;background:#191d1a;border:1px solid rgba(48,209,88,.28)}
    .tlm292-rec-main{min-width:0}.tlm292-rec b{display:block;font-size:12px;color:#30d158}.tlm292-rec span{display:block;font-size:11px;color:#8e8e93;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tlm292-rec button{flex:0 0 auto;background:#30d158;color:#061108;border-radius:11px;padding:8px 10px;font-weight:800;font-size:12px}
  `;D.head.appendChild(s)}
  let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render()})}
  function install(){installStyle();const root=D.getElementById('start');if(root&&!root.__unvrslRecommendationUiV294Observer){const o=new MutationObserver(schedule);o.observe(root,{childList:true,subtree:true});root.__unvrslRecommendationUiV294Observer=o}schedule()}
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',install,{once:true});else install();
  ['unvrsl:training-engine-ready','unvrsl:modules-ready','unvrsl:app-ready','unvrsl:readiness-ready','unvrsl:cloud-modules-settled'].forEach(ev=>W.addEventListener?.(ev,schedule,{passive:true}));
  D.addEventListener?.('visibilitychange',()=>{if(!D.hidden)schedule()},{passive:true});
  [0,120,400,900,1800].forEach(ms=>setTimeout(schedule,ms));
})();
