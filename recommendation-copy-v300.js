'use strict';
(()=>{
  const W=window,D=document,REV=300;
  if(W.__unvrslRecommendationCopyV300)return;
  W.__unvrslRecommendationCopyV300=true;

  const N=v=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null};
  const fmt=v=>String(v).replace('.',',');
  const same=(a,b)=>a!=null&&b!=null&&Math.abs(a-b)<.001;

  function previousFromCard(card){
    const text=String(card?.textContent||'');
    const m=text.match(/Прошл(?:ый|ая|ое):\s*([\d.,]+)\s*кг\s*[×x]\s*(\d+)/i);
    return m?{w:N(m[1]),r:N(m[2])}:null
  }
  function numberFrom(text,rx){const m=String(text||'').match(rx);return m?N(m[1]):null}

  function cleanOne(rec){
    const span=rec?.querySelector('.te200-rec-main span');
    const title=rec?.querySelector('.te200-rec-main b');
    if(!span||!title)return false;
    const current=String(span.textContent||'').trim();
    if(!/training-load-model|Расч[её]т\s+training|MATH_OWNER/i.test(current))return false;

    const card=rec.closest('.exercise');
    const prev=previousFromCard(card);
    const recW=numberFrom(title.textContent,/Рекомендация\s*·\s*([\d.,]+)/i);
    const planW=numberFrom(current,/план сегодня\s*([\d.,]+)/i);
    let action='по истории тренировок';
    if(recW!=null&&planW!=null){
      if(same(recW,planW))action='вес оставить';
      else if(recW>planW)action='можно повысить вес';
      else action='лучше снизить вес';
    }
    const parts=[];
    if(prev?.w!=null&&prev?.r!=null)parts.push(`По прошлой: ${fmt(prev.w)} кг × ${fmt(prev.r)}`);
    else parts.push('По истории тренировок');
    parts.push(action);
    span.textContent=parts.join(' · ');
    span.dataset.recommendationCopyRevision=String(REV);
    return true
  }

  function sync(){
    D.querySelectorAll('#start .te200-rec').forEach(cleanOne)
  }
  W.unvrslRecommendationCopySyncV300=sync;

  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync()})}
  function observe(){
    const root=D.getElementById('start');if(!root||root.__recommendationCopyV300Observer)return;
    const o=new MutationObserver(schedule);o.observe(root,{childList:true,subtree:true,characterData:true});root.__recommendationCopyV300Observer=o;sync()
  }
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
  ['unvrsl:training-engine-ready','unvrsl:app-ready','unvrsl:readiness-ready'].forEach(ev=>W.addEventListener?.(ev,()=>{observe();schedule()},{passive:true}));
})();
