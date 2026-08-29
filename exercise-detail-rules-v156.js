'use strict';
(()=>{
  if(window.__unvrslExerciseDetailRulesV156)return;
  window.__unvrslExerciseDetailRulesV156=true;

  const weightedEquipment=new Set(['barbell','dumbbell','cable','leverage machine','smith machine','kettlebell','ez barbell','medicine ball','sled machine','weighted','olympic barbell']);
  function usesExternalWeight(ex){
    const eq=String(ex?.eq||ex?.equipment||'').trim().toLowerCase();
    if(weightedEquipment.has(eq))return true;
    if(['body weight','assisted','band','stability ball','roller','rope','bosu ball','cardio','custom',''].includes(eq))return false;
    const n=String(ex?.n||ex?.raw||'').toLowerCase();
    return /штанг|гантел|гир|блок|кроссовер|смит|тренаж|hammer|жим ногами|гакк|отягощ|barbell|dumbbell|cable|machine|kettlebell|weighted/.test(n);
  }

  function remove1RMForUnweighted(ex){
    if(usesExternalWeight(ex))return;
    const sheet=document.getElementById('sheet');if(!sheet)return;
    const sections=[...sheet.querySelectorAll('.section')];
    const rm=sections.find(x=>/РАСЧ[ЁЕ]ТНЫЙ\s*1ПМ/i.test(x.textContent||''));
    if(!rm)return;
    let node=rm;
    while(node){
      const next=node.nextElementSibling;
      node.remove();
      if(next?.classList?.contains('section'))break;
      node=next;
    }
  }

  function dedupeDotText(root=document){
    root.querySelectorAll?.('.catalog-meta,.detail-tags').forEach(el=>{
      if(el.classList.contains('detail-tags')){
        const seen=new Set();
        [...el.children].forEach(x=>{const k=(x.textContent||'').trim().toLowerCase();if(k&&seen.has(k))x.remove();else if(k)seen.add(k)});
        return;
      }
      const text=(el.textContent||'').trim();if(!text.includes('·'))return;
      const parts=text.split('·').map(x=>x.trim()).filter(Boolean),seen=new Set(),out=[];
      parts.forEach(p=>{const k=p.toLowerCase();if(!seen.has(k)){seen.add(k);out.push(p)}});
      if(out.length!==parts.length)el.textContent=out.join(' · ');
    });
  }

  function patchDetail(){
    const base=window.renderExerciseDetail;
    if(typeof base!=='function'||base.__weightRulesV156)return;
    const wrapped=function(ex){const r=base.apply(this,arguments);remove1RMForUnweighted(ex);dedupeDotText(document.getElementById('sheet')||document);return r};
    wrapped.__weightRulesV156=true;
    window.renderExerciseDetail=wrapped;
    try{renderExerciseDetail=wrapped}catch(e){}
  }

  const observer=new MutationObserver(()=>dedupeDotText(document));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  patchDetail();
  [50,250,900,2200].forEach(t=>setTimeout(patchDetail,t));
})();

(()=>{
  if(!document.querySelector('script[data-unvrsl-unified-training-v174]')){
    const s=document.createElement('script');
    s.src='unified-training-v174.js';
    s.async=false;
    s.dataset.unvrslUnifiedTrainingV174='1';
    document.body.appendChild(s);
  }
  if(!document.querySelector('script[data-unvrsl-workout-recommendation-v180]')){
    const s=document.createElement('script');
    s.src='workout-recommendation-v180.js';
    s.async=false;
    s.dataset.unvrslWorkoutRecommendationV180='1';
    document.body.appendChild(s);
  }
  if(!document.querySelector('script[data-unvrsl-muscle-drilldown-v181]')){
    const s=document.createElement('script');
    s.src='muscle-drilldown-fix-v181.js';
    s.async=false;
    s.dataset.unvrslMuscleDrilldownV181='1';
    document.body.appendChild(s);
  }
})();
