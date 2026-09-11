'use strict';
(()=>{
 const W=window,D=document;
 if(W.__unvrslGluteBridgeCatalogV354)return;W.__unvrslGluteBridgeCatalogV354=true;
 let base=null,limit=180;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function body(e){try{return BP_RU?.[e.bp]||e.bp||'—'}catch(_){return e.bp||'—'}}
 function eq(e){try{return EQ_RU?.[e.eq]||e.eq||'—'}catch(_){return e.eq||'—'}}
 function target(e){try{return typeof ruTarget==='function'?ruTarget(e.tg):e.tg||'—'}catch(_){return e.tg||'—'}}
 function fav(e){try{return typeof isFavorite==='function'&&isFavorite(String(e.rawId||e.id||e.n||''))}catch(_){return false}}
 function recent(e){try{return Array.isArray(st?.recentExercises)&&st.recentExercises.includes(String(e.rawId||e.id||e.n||''))}catch(_){return false}}
 function eqGroup(e){try{return typeof equipmentGroup==='function'?equipmentGroup(e):String(e.eq||'')}catch(_){return String(e.eq||'')}}
 function all(){const H=W.__GB354;if(!H||typeof base!=='function')return[];const a=base();return Array.isArray(a)?a.map(H.enrich):[]}
 function ok(e){const H=W.__GB354,q=H.norm(typeof exQuery==='undefined'?'':exQuery),b=typeof exBody==='undefined'?'all':exBody,g=typeof exEquipment==='undefined'?'all':exEquipment;if(b==='favorites'&&!fav(e))return false;if(b==='recent'&&!recent(e))return false;if(!['all','favorites','recent','frequent'].includes(b)&&e.bp!==b)return false;if(g!=='all'&&eqGroup(e)!==g)return false;return !q||H.norm(`${e.n} ${body(e)} ${eq(e)} ${target(e)} hip thrust хип траст`).includes(q)}
 function row(e){const H=W.__GB354,k=H.kind(e),id=encodeURIComponent(e.id),open=k?`openGluteBridgeV354('${id}')`:e.virtual?`openFinalVirtualExerciseV352('${id}')`:`openExerciseDetail('${id}')`,src=e.image||e.gif||e.gif_url||'',star=!e.virtual&&typeof isFavorite==='function'?`<button class="star-btn ${fav(e)?'on':''}" onclick="event.stopPropagation();toggleFavorite('${esc(String(e.rawId||e.id||e.n||''))}')">★</button>`:'';return `<div class="card exlib exlib-btn smart-ex-row" onclick="${open}"><div class="exercise-list-row">${src?`<img class="ex-thumb" src="${src}" loading="lazy" alt="${esc(e.n)}">`:''}<div class="grow"><b>${esc(e.n)}</b><div class="catalog-meta">${esc(body(e))} · ${esc(eq(e))} · ${esc(target(e))}</div></div><div class="smart-row-actions">${star}<span class="chev">›</span></div></div></div>`}
 function render(){const el=D.querySelector('#exList');if(!el)return;const a=all(),f=a.filter(ok),s=f.slice(0,limit);el.innerHTML=s.map(row).join('')+(s.length<f.length?`<button class="btn full" style="margin:12px 0 4px" onclick="showMoreGluteCatalogV354()">Показать ещё · ${s.length} из ${f.length}</button>`:'')+(!f.length?'<div class="card muted">По этому фильтру ничего не найдено.</div>':'');const c=D.querySelector('#catalogCount');if(c)c.textContent=`Основная база · ${a.length} упражнений${f.length!==a.length?` · найдено ${f.length}`:''}`}
 function install(){if(base)return true;if(!W.__GB354||typeof W.catalogRecords!=='function')return false;base=W.catalogRecords;W.catalogRecords=all;try{catalogRecords=all}catch(_){ }W.renderExerciseResults=render;try{renderExerciseResults=render}catch(_){ }W.showMoreGluteCatalogV354=()=>{limit+=180;render()};if(D.querySelector('#exercises.page.active'))render();return true}
 let n=0,t=setInterval(()=>{n++;if(install()||n>300)clearInterval(t)},30);install();
})();
