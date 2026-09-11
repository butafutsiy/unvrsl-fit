'use strict';
(()=>{
 const W=window,D=document;
 if(W.__unvrslGluteBridgeDetailV354)return;W.__unvrslGluteBridgeDetailV354=true;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 W.openGluteBridgeV354=function(token){
  const id=decodeURIComponent(String(token||'')),H=W.__GB354;if(!H)return;
  const all=typeof W.catalogRecords==='function'?W.catalogRecords():[];
  const ex=H.enrich((all||[]).find(x=>String(x?.id||'')===id));if(!ex)return;
  try{const best=typeof bestEstimateFor==='function'?bestEstimateFor(ex.n,ex.rawId||ex.sourceId||null):null;if(typeof rmState!=='undefined')rmState={id:ex.id,w:best?.w||20,r:best?.r||5}}catch(_){ }
  if(typeof W.renderExerciseDetail==='function'){W.renderExerciseDetail(ex);return}
  const text=String(ex.instructions?.ru||'');
  W.modal?.(`<div class="sheet-grabber"></div><h2>${esc(ex.n)}</h2><div class="exercise-media"><img src="${ex.gif}" alt="${esc(ex.n)}"></div><div class="section">ТЕХНИКА ВЫПОЛНЕНИЯ</div><div class="tech-card">${esc(text)}</div>`);
 };
 function patchOpen(){
  const H=W.__GB354;if(!H)return;
  D.querySelectorAll('#exList .smart-ex-row,#exList .exlib-btn').forEach(row=>{
   const b=row.querySelector('b');if(!b)return;
   const k=H.kind({n:b.textContent,eq:row.querySelector('.catalog-meta')?.textContent});if(!k)return;
   b.textContent=H.N[k];const img=row.querySelector('img.ex-thumb,img');if(img){const fake={n:H.N[k],eq:k==='smith'?'smith machine':k==='machine'?'leverage machine':'barbell'};img.src=H.enrich(fake).gif}
  });
 }
 new MutationObserver(patchOpen).observe(D.documentElement,{childList:true,subtree:true});[0,100,400,1200].forEach(t=>setTimeout(patchOpen,t));
})();
