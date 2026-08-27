'use strict';
(()=>{
  if(window.__unvrslExerciseFull)return;window.__unvrslExerciseFull=true;
  let limit=160;const PAGE=160;
  const tech=e=>{const i=e?.instructions||{};return typeof i==='string'?i.trim():String(i.ru||i.russian||'').trim()};
  const good=e=>!!e&&!e.custom&&!!String(e.gif||e.gif_url||'').trim()&&!!tech(e);
  const all=()=>{const a=typeof ogLibrary!=='undefined'&&Array.isArray(ogLibrary)?ogLibrary:[];return a.filter(good).map(e=>({...e,id:String(e.id).startsWith('og:')?String(e.id):`og:${e.id}`,rawId:e.rawId||e.id,custom:false}))};
  const id=e=>String(e.rawId||e.id||e.n||'');
  const title=e=>{try{return ruExerciseName(e.n)}catch(_){return String(e.n||'Упражнение')}};
  const hay=e=>`${title(e)} ${e.n||''} ${(BP_RU&&BP_RU[e.bp])||e.bp||''} ${(EQ_RU&&EQ_RU[e.eq])||e.eq||''} ${typeof ruTarget==='function'?ruTarget(e.tg):e.tg||''}`.toLowerCase();
  const eqOk=e=>{try{return typeof exEquipment==='undefined'||exEquipment==='all'||(typeof equipmentGroup==='function'?equipmentGroup(e)===exEquipment:String(e.eq||'')===exEquipment)}catch(_){return true}};
  const fav=e=>typeof isFavorite==='function'&&isFavorite(id(e));
  const recent=e=>Array.isArray(st?.recentExercises)&&st.recentExercises.includes(id(e));
  function filtered(){const q=String(typeof exQuery==='undefined'?'':exQuery).trim().toLowerCase();return all().filter(e=>{if(typeof exBody!=='undefined'){if(exBody==='favorites'&&!fav(e))return false;if(exBody==='recent'&&!recent(e))return false;if(!['all','favorites','recent'].includes(exBody)&&e.bp!==exBody)return false}return eqOk(e)&&(!q||hay(e).includes(q))}).sort((a,b)=>title(a).localeCompare(title(b),'ru'))}
  function row(e){const t=title(e),body=(BP_RU&&BP_RU[e.bp])||e.bp||'—',eq=(EQ_RU&&EQ_RU[e.eq])||e.eq||'—',tg=typeof ruTarget==='function'?ruTarget(e.tg):e.tg||'—',thumb=e.image||e.gif||e.gif_url||'';return `<div class="card exlib exlib-btn smart-ex-row" onclick="openExerciseDetail('${encodeURIComponent(e.id)}')"><div class="exercise-list-row">${thumb?`<img class="ex-thumb" src="${mediaUrl(thumb)}" loading="lazy" alt="${esc(t)}">`:''}<div class="grow"><b>${esc(t)}</b><div class="catalog-meta">${esc(body)} · ${esc(eq)} · ${esc(tg)}</div></div><div class="smart-row-actions">${typeof isFavorite==='function'?`<button class="star-btn ${fav(e)?'on':''}" onclick="event.stopPropagation();toggleFavorite('${esc(id(e))}')">★</button>`:''}<span class="chev">›</span></div></div></div>`}
  function clean(){document.querySelectorAll('#exercises .quality-media-line').forEach(x=>x.remove());document.querySelectorAll('#exercises .catalog-head .chip').forEach(x=>x.remove())}
  window.renderExerciseResults=function(){const el=document.querySelector('#exList');if(!el)return;const a=all(),f=filtered(),shown=f.slice(0,limit);el.innerHTML=shown.map(row).join('')+(shown.length<f.length?`<button class="btn full" style="margin:12px 0 4px" onclick="showMoreFullExercises()">Показать ещё · ${shown.length} из ${f.length}</button>`:'')+(!f.length?'<div class="card muted">Ничего не найдено.</div>':'');const c=document.querySelector('#catalogCount');if(c)c.textContent=`${a.length} упражнений${f.length!==a.length?` · найдено ${f.length}`:''}`;clean()};
  try{renderExerciseResults=window.renderExerciseResults}catch(_){}
  window.showMoreFullExercises=()=>{limit+=PAGE;window.renderExerciseResults()};
  ['setExerciseQuery','setExerciseBody','setExerciseEquipment'].forEach(k=>{const f=window[k];if(typeof f!=='function'||f.__full)return;const w=function(){limit=PAGE;const r=f.apply(this,arguments);setTimeout(()=>window.renderExerciseResults(),0);return r};w.__full=true;window[k]=w;try{globalThis[k]=w}catch(_){}});
  const css=document.createElement('style');css.textContent='#exercises .quality-media-line,#exercises .catalog-head .chip{display:none!important}';document.head.appendChild(css);
  setTimeout(()=>{clean();if(document.querySelector('#exercises.page.active'))window.renderExerciseResults()},100);
})();