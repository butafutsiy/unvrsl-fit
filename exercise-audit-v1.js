'use strict';
(()=>{
 if(window.__unvrslExerciseAuditV1)return;window.__unvrslExerciseAuditV1=true;
 const BASE=window.UNVRSL_EXERCISE_RECORDS;
 if(typeof BASE!=='function')return;
 const EXACT={
  '0003':{title:'Велосипедные скручивания',bp:'waist',eq:'body weight',kind:'strength',target:'abs'},
  '2141':{title:'Эллиптический тренажёр',bp:'cardio',eq:'cardio',kind:'cardio',target:'cardiovascular system'},
  '2138':{title:'Велотренажёр',bp:'cardio',eq:'cardio',kind:'cardio',target:'cardiovascular system'},
  '0798':{title:'Велотренажёр',bp:'cardio',eq:'cardio',kind:'cardio',target:'cardiovascular system'},
  '3666':{title:'Ходьба на беговой дорожке под наклоном',bp:'cardio',eq:'cardio',kind:'cardio',target:'cardiovascular system'}
 };
 const weird=/(basic toe touch|body.?up|bench dip|elbow dip|battle rope|battling rope|bench hip extension|reverse hyper|neck bridge|finger|wrist roller|rotary calf|donkey calf|sissy squat|jefferson|zercher|reverse hack|power clean|clean and jerk|hang clean|snatch|muscle.?up|handstand|planche|human flag|iron cross|dragon flag|archer|typewriter|commando|pistol squat|burpee|bear crawl|crab walk|frog jump|windmill|kneeling jump|bosu|swiss ball|stability ball|exercise ball|suspension|trx|stretch|mobility|warm.?up|cool.?down|yoga|pilates|foam roll|massage|jumping jack|high knees|mountain climber)/i;
 const norm=s=>String(s||'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[_–—-]+/g,' ').replace(/\s+/g,' ').trim();
 function rawId(e){return String(e?.rawId||e?.id||'').replace(/^og:/,'')}
 function audit(e){if(!e)return null;const id=rawId(e),o=EXACT[id],raw=norm(e.n||e.name);if(weird.test(raw))return null;let x={...e};if(o){x.__ruTitle=o.title;x.bp=o.bp;x.eq=o.eq;x.kind=o.kind;x.tg=o.target;x.target=o.target}
  // ExerciseDB cardio is accepted only when it is explicitly cardio and machine-based.
  const srcBp=String(e.bp||e.body_part||e.category||'').toLowerCase();
  if(!o&&srcBp==='cardio')return null;
  if(x.kind==='cardio'&&x.bp!=='cardio')x.kind='strength';
  return x;
 }
 function audited(){const out=[],seen=new Set();for(const e of BASE()){const x=audit(e);if(!x)continue;const key=`${norm(x.__ruTitle||x.n)}|${x.eq||''}`;if(seen.has(key))continue;seen.add(key);out.push(x)}return out.sort((a,b)=>String(a.__ruTitle||a.n).localeCompare(String(b.__ruTitle||b.n),'ru'))}
 window.UNVRSL_EXERCISE_RECORDS=audited;
 const oldTitle=window.UNVRSL_EXERCISE_TITLE;window.UNVRSL_EXERCISE_TITLE=e=>{const x=audit(e);return x?.__ruTitle||(typeof oldTitle==='function'?oldTitle(e):String(e?.n||''))};
 const oldFind=window.findExercise;window.findExercise=function(token){const e=typeof oldFind==='function'?oldFind(token):null;return e?audit(e):null};try{findExercise=window.findExercise}catch(_){}
 const oldCatalog=window.catalogRecords;window.catalogRecords=function(){let custom=[];try{custom=typeof customCatalog==='function'?customCatalog():[]}catch(_){}return[...custom,...audited()]};try{catalogRecords=window.catalogRecords}catch(_){}
 const BP=[['all','Все'],['chest','Грудь'],['back','Спина'],['shoulders','Плечи'],['upper arms','Руки'],['upper legs','Бёдра'],['lower legs','Голени'],['waist','Кор'],['cardio','Кардио']];
 const EQ=[['all','Все'],['smith machine','Смит'],['dumbbell','Гантели'],['barbell','Штанга'],['cable','Блок'],['machine','Тренажёры'],['body weight','Свой вес'],['kettlebell','Гири'],['band','Резина'],['cardio','Кардио']];
 let q='',bp='all',eq='all',limit=180;
 function eqGroup(e){const z=String(e.eq||'').toLowerCase();if(z==='cardio')return'cardio';if(z==='smith machine')return'smith machine';if(z==='dumbbell')return'dumbbell';if(['barbell','olympic barbell','ez barbell'].includes(z))return'barbell';if(['cable','rope'].includes(z))return'cable';if(['leverage machine','sled machine','assisted'].includes(z))return'machine';if(z==='body weight')return'body weight';if(z==='kettlebell')return'kettlebell';if(z==='band')return'band';return z}
 const bRu=e=>({chest:'Грудь',back:'Спина',shoulders:'Плечи','upper arms':'Руки','upper legs':'Бёдра','lower legs':'Голени',waist:'Кор',cardio:'Кардио'}[e.bp]||e.bp||'—');
 const eRu=e=>e.kind==='cardio'?'Кардиотренажёр':({'smith machine':'Смит',dumbbell:'Гантели',barbell:'Штанга','olympic barbell':'Штанга','ez barbell':'EZ-штанга',cable:'Блок',rope:'Блок','leverage machine':'Тренажёр','sled machine':'Тренажёр',assisted:'Гравитрон','body weight':'Свой вес',kettlebell:'Гиря',band:'Резина'}[e.eq]||e.eq||'—');
 function filtered(){const s=q.toLowerCase();return audited().filter(e=>(bp==='all'||e.bp===bp)&&(eq==='all'||eqGroup(e)===eq)&&(!s||`${e.__ruTitle||e.n} ${e.n||''} ${bRu(e)} ${eRu(e)}`.toLowerCase().includes(s)))}
 function row(e){const id=String(e.id).startsWith('og:')?e.id:`og:${e.id}`,t=e.__ruTitle||e.n,g=typeof mediaUrl==='function'?mediaUrl(e.gif||e.gif_url||''):(e.gif||e.gif_url||'');return `<button class="card exlib exlib-btn" onclick="openExerciseDetail('${encodeURIComponent(id)}')"><div class="exercise-list-row"><img class="ex-thumb" src="${g}" loading="lazy" alt="${esc(t)}"><div class="grow"><b>${esc(t)}</b><div class="catalog-meta">${esc(bRu(e))} · ${esc(eRu(e))} · ${e.kind==='cardio'?'Кардио':esc(typeof ruTarget==='function'?ruTarget(e.tg):e.tg||'—')}</div></div><span class="chev">›</span></div></button>`}
 const chips=(arr,cur,fn)=>arr.map(([v,n])=>`<button class="filterchip ${cur===v?'on':''}" onclick="${fn}('${v}')">${n}</button>`).join('');
 function page(){const root=document.getElementById('exercises');if(!root)return;const all=audited(),f=filtered(),shown=f.slice(0,limit);root.innerHTML=`<div class="card"><div class="title">Упражнения</div><div class="muted">База упражнений · ${all.length}${f.length!==all.length?` · найдено ${f.length}`:''}</div></div><input class="search" value="${esc(q)}" placeholder="Поиск упражнений" oninput="auditExQ(this.value)"><div class="filterbar">${chips(BP,bp,'auditExBp')}</div><div class="section" style="margin-top:10px;margin-bottom:4px">ОБОРУДОВАНИЕ</div><div class="filterbar">${chips(EQ,eq,'auditExEq')}</div><div id="exList">${shown.map(row).join('')}${shown.length<f.length?`<button class="btn full" onclick="auditExMore()">Показать ещё · ${shown.length} из ${f.length}</button>`:''}${!f.length?'<div class="card muted">По этому фильтру ничего не найдено.</div>':''}</div>`}
 window.auditExQ=v=>{q=v||'';limit=180;page()};window.auditExBp=v=>{bp=v||'all';limit=180;page()};window.auditExEq=v=>{eq=v||'all';limit=180;page()};window.auditExMore=()=>{limit+=180;page()};
 window.exercisesPage=page;try{exercisesPage=page}catch(_){};if(document.querySelector('#exercises.page.active'))page();
})();