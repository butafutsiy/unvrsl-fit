'use strict';
(()=>{
  if(window.__unvrslExerciseLibraryQuality)return;window.__unvrslExerciseLibraryQuality=true;

  let visibleLimit=160;
  const PAGE=160;

  function ruTechnique(ex){
    const i=ex?.instructions||{};
    if(typeof i==='string')return i.trim();
    return String(i.ru||i.russian||'').trim();
  }
  function hasGif(ex){return !!String(ex?.gif||ex?.gif_url||'').trim()}
  function qualityExercise(ex){return !!ex&&!ex.custom&&hasGif(ex)&&ruTechnique(ex).length>0}
  window.isQualityExercise=qualityExercise;

  const baseCatalog=window.catalogRecords||((typeof catalogRecords==='function')?catalogRecords:null);
  if(typeof baseCatalog==='function'){
    const wrapped=function(){return baseCatalog.apply(this,arguments).filter(qualityExercise)};
    wrapped.__qualityOnly=true;window.catalogRecords=wrapped;try{catalogRecords=wrapped}catch(e){}
  }

  function idOf(e){return String(e?.rawId||e?.id||e?.raw||e?.n||'')}
  function titleOf(e){try{return e.custom?e.n:ruExerciseName(e.n)}catch(_e){return String(e?.n||'Упражнение')}}
  function searchText(e){
    const title=titleOf(e),body=(typeof BP_RU==='object'&&BP_RU[e.bp])||e.bp||'',eq=(typeof EQ_RU==='object'&&EQ_RU[e.eq])||e.eq||'',tg=typeof ruTarget==='function'?ruTarget(e.tg):(e.tg||'');
    return `${title} ${e.n||''} ${body} ${eq} ${tg}`.toLowerCase();
  }
  function order(e){
    const id=idOf(e),fav=typeof isFavorite==='function'&&isFavorite(id)?-100000:0,ri=Array.isArray(st?.recentExercises)?st.recentExercises.indexOf(id):-1;
    return fav+(ri>=0?ri:10000)
  }

  function qualityRow(ex){
    const title=titleOf(ex),body=(typeof BP_RU==='object'&&BP_RU[ex.bp])||ex.bp||'—',eq=(typeof EQ_RU==='object'&&EQ_RU[ex.eq])||ex.eq||'—',target=typeof ruTarget==='function'?ruTarget(ex.tg):(ex.tg||'—'),id=idOf(ex);
    const media=ex.image||ex.gif||ex.gif_url||'';
    const thumb=media?`<img class="ex-thumb" src="${mediaUrl(media)}" loading="lazy" alt="${esc(title)}">`:'';
    let rec=null;try{rec=typeof recordsFor==='function'?recordsFor(ex.raw||title):null}catch(e){}
    return `<div class="card exlib exlib-btn smart-ex-row quality-ex-row" onclick="openExerciseDetail('${encodeURIComponent(ex.id)}')"><div class="exercise-list-row">${thumb}<div class="grow"><b>${esc(title)}</b><div class="catalog-meta">${esc(body)} · ${esc(eq)} · ${esc(target)}</div></div><div class="smart-row-actions">${typeof isFavorite==='function'?`<button class="star-btn ${isFavorite(id)?'on':''}" onclick="event.stopPropagation();toggleFavorite('${esc(id)}')">★</button>`:''}${rec?.best?`<span class="chip green">${rec.best} кг</span>`:'<span class="chev">›</span>'}</div></div></div>`
  }

  window.renderExerciseResults=function(){
    const el=document.querySelector('#exList');if(!el)return;
    const q=String(typeof exQuery!=='undefined'?exQuery:'').trim().toLowerCase();
    let all=[];try{all=typeof catalogRecords==='function'?catalogRecords():[]}catch(e){all=[]}
    let filtered=all.filter(e=>{
      if(!qualityExercise(e))return false;
      const id=idOf(e);
      if(typeof exBody!=='undefined'){
        if(exBody==='favorites'&&!(typeof isFavorite==='function'&&isFavorite(id)))return false;
        if(exBody==='recent'&&!(Array.isArray(st?.recentExercises)&&st.recentExercises.includes(id)))return false;
        if(!['all','favorites','recent'].includes(exBody)&&e.bp!==exBody)return false;
      }
      return !q||searchText(e).includes(q)
    });
    filtered.sort((a,b)=>order(a)-order(b)||titleOf(a).localeCompare(titleOf(b),'ru'));
    const total=filtered.length,shown=filtered.slice(0,visibleLimit);
    el.innerHTML=`${shown.map(qualityRow).join('')}${shown.length<total?`<button class="btn full quality-load-more" onclick="showMoreQualityExercises()">Показать ещё · ${shown.length} из ${total}</button>`:''}${!total?'<div class="card muted">По этому фильтру ничего не найдено.</div>':''}`;
    updateQualityCount(total,all.length)
  };
  try{renderExerciseResults=window.renderExerciseResults}catch(e){}

  window.showMoreQualityExercises=function(){visibleLimit+=PAGE;window.renderExerciseResults()};

  function updateQualityCount(filtered=null,total=null){
    const c=document.querySelector('#catalogCount');if(!c)return;
    let all=total;
    if(all==null){try{all=(typeof catalogRecords==='function'?catalogRecords():[]).filter(qualityExercise).length}catch(e){all=0}}
    c.textContent=`База упражнений · ${all}${filtered!=null&&filtered!==all?` · найдено ${filtered}`:''}`
  }

  function cleanHeaderBadge(){
    const head=document.querySelector('#exercises .catalog-head');if(!head)return;
    head.querySelectorAll('.chip').forEach(chip=>{
      const t=(chip.textContent||'').trim();
      if(/GIF|RU|техник/i.test(t))chip.remove()
    })
  }

  const baseExercisesPage=window.exercisesPage||((typeof exercisesPage==='function')?exercisesPage:null);
  if(typeof baseExercisesPage==='function'){
    const wrapped=function(){visibleLimit=PAGE;const r=baseExercisesPage.apply(this,arguments);setTimeout(()=>{cleanHeaderBadge();updateQualityCount();window.renderExerciseResults()},0);return r};
    wrapped.__qualityPage=true;window.exercisesPage=wrapped;try{exercisesPage=wrapped}catch(e){}
  }

  const baseRefresh=window.refreshCatalogUI||((typeof refreshCatalogUI==='function')?refreshCatalogUI:null);
  if(typeof baseRefresh==='function'){
    const wrapped=function(){const r=baseRefresh.apply(this,arguments);visibleLimit=PAGE;setTimeout(()=>{cleanHeaderBadge();updateQualityCount();window.renderExerciseResults()},0);return r};
    wrapped.__qualityRefresh=true;window.refreshCatalogUI=wrapped;try{refreshCatalogUI=wrapped}catch(e){}
  }

  ['setExerciseQuery','setExerciseBody','setExerciseEquipment'].forEach(name=>{
    const fn=window[name]||((typeof globalThis[name]==='function')?globalThis[name]:null);if(typeof fn!=='function'||fn.__qualityReset)return;
    const wrapped=function(){visibleLimit=PAGE;return fn.apply(this,arguments)};wrapped.__qualityReset=true;window[name]=wrapped;try{globalThis[name]=wrapped}catch(e){}
  });

  const style=document.createElement('style');style.id='unvrsl-exercise-quality-style';style.textContent=`
    #exercises .quality-load-more{margin:12px 0 4px;min-height:48px}
  `;document.head.appendChild(style);

  setTimeout(()=>{if(document.querySelector('#exercises.page.active')){cleanHeaderBadge();updateQualityCount();window.renderExerciseResults()}},500);
})();
