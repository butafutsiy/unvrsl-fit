'use strict';
(()=>{
  if(window.__unvrslWorkoutRecommendationV180)return;
  window.__unvrslWorkoutRecommendationV180=true;

  const style=document.createElement('style');
  style.id='workout-recommendation-v180-style';
  style.textContent=`
    #start .exercise .wr180{margin:10px 0 2px;padding:10px 12px;border-radius:14px;background:rgba(191,90,242,.10);border:1px solid rgba(191,90,242,.28);font-size:12px;line-height:1.35;color:#c7c7cc}
    #start .exercise .wr180 b{color:#d68cff;font-size:12px}
    #start .exercise .wr180 .wr180-main{color:#f5f5f7;font-weight:700;margin-left:4px}
  `;
  document.head.appendChild(style);

  const n=v=>{const x=parseFloat(String(v??'').replace(',','.'));return Number.isFinite(x)?x:null};
  const roundStep=(v,step)=>Math.round(v/step)*step;
  const fmt=v=>Number.isInteger(v)?String(v):String(Math.round(v*10)/10);

  function recommendation(card){
    const row=card.querySelector('.setrow:not(.cardiorow)');
    if(!row)return null;
    const inputs=[...row.querySelectorAll('input')];
    if(inputs.length<2)return null;
    const currentW=n(inputs[0].value), currentReps=n(inputs[1].value);
    const targetRpe=n(inputs[2]?.value);
    if(!(currentW>0&&currentReps>0))return null;

    const prev=[...card.querySelectorAll('.prev-set')].map(x=>x.textContent||'').find(Boolean)||'';
    const m=prev.match(/([\d.,]+)\s*кг\s*[×x]\s*([\d.,]+)/i);
    if(!m)return {weight:currentW,reps:currentReps,targetRpe};
    const prevW=n(m[1]),prevReps=n(m[2]);
    if(!(prevW>0&&prevReps>0))return {weight:currentW,reps:currentReps,targetRpe};

    // Conservative DOM-only fallback. The main v174 engine has already filled the planned
    // adaptive load; this block only surfaces it and never touches application state.
    let suggested=currentW;
    if(Math.abs(currentW-prevW)<0.01){
      if(currentReps>prevReps)suggested=roundStep(prevW+2.5,2.5);
      else if(currentReps<prevReps-2)suggested=roundStep(Math.max(0,prevW-2.5),2.5);
    }
    return {weight:suggested,reps:currentReps,targetRpe,prevW,prevReps};
  }

  function render(){
    document.querySelectorAll('#start .exercise').forEach(card=>{
      const r=recommendation(card);
      let box=card.querySelector('.wr180');
      if(!r){box?.remove();return}
      if(!box){
        box=document.createElement('div');box.className='wr180';
        const anchor=card.querySelector('.chips,.method-strip,.sethead');
        if(anchor)anchor.insertAdjacentElement('afterend',box);else card.appendChild(box);
      }
      const rpe=r.targetRpe?` · цель RPE ${fmt(r.targetRpe)}`:'';
      box.innerHTML=`<b>Рекомендация</b><span class="wr180-main">${fmt(r.weight)} кг × ${fmt(r.reps)}</span>${rpe}`;
    });
  }

  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render()})};
  new MutationObserver(schedule).observe(document.getElementById('start')||document.body,{childList:true,subtree:true});
  document.addEventListener('input',e=>{if(e.target.closest?.('#start .exercise'))schedule()},true);
  document.addEventListener('change',e=>{if(e.target.closest?.('#start .exercise'))schedule()},true);
  [0,150,500,1200,2500].forEach(t=>setTimeout(render,t));
})();
