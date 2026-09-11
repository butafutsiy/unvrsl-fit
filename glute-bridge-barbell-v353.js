'use strict';
(()=>{
  if(window.__unvrslGluteBridgeBarbellV353)return;
  window.__unvrslGluteBridgeBarbellV353=true;
  const W=window,D=document,NAME='Ягодичный мост со штангой';
  const GIF='data:image/gif;base64,'+String(W.__UNVRSL_GBB64||'');
  const TECH='Обопрись верхней частью спины на устойчивую скамью. Расположи штангу с мягкой накладкой на сгибе бёдер. Подними таз, сохраняя рёбра опущенными и опору на стопы. Вверху выровняй корпус и бёдра без переразгибания поясницы. Плавно опусти таз.';
  const norm=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[‐‑‒–—-]+/g,' ').replace(/\s+/g,' ').trim();
  const targetText=s=>/ягодич.*мост.*штанг|hip thrust.*barbell|barbell.*hip thrust|glute bridge.*barbell|barbell.*glute bridge|хип траст.*штанг/.test(norm(s));
  function isTarget(ex){if(!ex)return false;const eq=String(ex.eq||ex.equipment||'').toLowerCase(),hay=`${ex.n||''} ${ex.name||''} ${ex.strictName||''} ${ex.sourceName||''}`;return(eq==='barbell'||eq==='olympic barbell'||/штанг/.test(norm(hay)))&&targetText(hay)}
  function enrich(ex){if(!isTarget(ex))return ex;const old=ex.instructions||{};return{...ex,n:NAME,strictName:NAME,bp:ex.bp||'upper legs',tg:ex.tg||'glutes',eq:'barbell',gif:GIF,gif_url:GIF,image:'',mediaUnavailable:false,instructions:typeof old==='string'?{ru:old||TECH}:{...old,ru:String(old.ru||old.russian||TECH)}}}
  function patchFind(){let base=null;try{base=W.findExercise||findExercise}catch(_){base=W.findExercise}if(typeof base!=='function'||base.__gbb353)return false;const wrapped=function(){return enrich(base.apply(this,arguments))};wrapped.__gbb353=true;W.findExercise=wrapped;try{findExercise=wrapped}catch(_){ }return true}
  function patchRows(){D.querySelectorAll('#exList .smart-ex-row,#exList .exlib-btn').forEach(row=>{const b=row.querySelector('b');if(!b||!targetText(b.textContent))return;b.textContent=NAME;const holder=row.querySelector('.exercise-list-row')||row;let img=row.querySelector('img.ex-thumb');if(!img){const ph=row.querySelector('.ex-thumb.placeholder');if(ph)ph.remove();img=D.createElement('img');img.className='ex-thumb';img.loading='lazy';holder.insertBefore(img,holder.querySelector('.grow')||holder.firstChild)}if(img.src!==GIF)img.src=GIF;img.alt=NAME})}
  function patchSheet(){const title=D.querySelector('#sheet .detail-title,#sheet h2');if(!title||!targetText(title.textContent))return;title.textContent=NAME;let media=D.querySelector('#sheet .exercise-media');if(!media){const noGif=[...D.querySelectorAll('#sheet .tech-card.muted,#sheet .card.muted')].find(x=>/нет.*gif|gif-анимац/i.test(x.textContent||''));media=D.createElement('div');media.className='exercise-media';const img=D.createElement('img');img.src=GIF;img.alt=NAME;img.loading='eager';media.appendChild(img);if(noGif)noGif.replaceWith(media);else title.insertAdjacentElement('afterend',media)}else{const img=media.querySelector('img');if(img){img.src=GIF;img.alt=NAME}}}
  function refresh(){patchFind();patchRows();patchSheet()}
  new MutationObserver(refresh).observe(D.documentElement,{childList:true,subtree:true});
  [0,100,300,900,2200].forEach(t=>setTimeout(refresh,t));
})();
(()=>{[
 ['glute-bridge-meta-v354.js?v=354','gbMeta354'],
 ['glute-bridge-detail-v354.js?v=354','gbDetail354'],
 ['glute-bridge-catalog-v354.js?v=354','gbCatalog354']
].forEach(([src,key])=>{if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.async=false;s.setAttribute(`data-${key}`,'1');document.body.appendChild(s)})})();
