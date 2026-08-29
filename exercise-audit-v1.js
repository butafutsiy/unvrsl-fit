'use strict';
(()=>{
 if(window.__unvrslExerciseAuditV2)return;window.__unvrslExerciseAuditV2=true;
 const BASE=window.UNVRSL_EXERCISE_RECORDS;if(typeof BASE!=='function')return;
 const EXACT={
  '0003':{title:'Велосипедные скручивания',bp:'waist',eq:'body weight',kind:'strength',target:'abs'},
  '2141':{title:'Эллиптический тренажёр',bp:'cardio',eq:'cardio',kind:'cardio',target:'cardiovascular system'},
  '2138':{title:'Велотренажёр',bp:'cardio',eq:'cardio',kind:'cardio',target:'cardiovascular system'},
  '0798':{title:'Велотренажёр',bp:'cardio',eq:'cardio',kind:'cardio',target:'cardiovascular system'},
  '3666':{title:'Ходьба на беговой дорожке под наклоном',bp:'cardio',eq:'cardio',kind:'cardio',target:'cardiovascular system'}
 };
 const CARDIO=[
  {id:'cardio:airbike',n:'Аэробайк',bp:'cardio',tg:'cardiovascular system',eq:'cardio',kind:'cardio',custom:true,cardioPreset:true},
  {id:'cardio:skierg',n:'Лыжный тренажёр SkiErg',bp:'cardio',tg:'cardiovascular system',eq:'cardio',kind:'cardio',custom:true,cardioPreset:true},
  {id:'cardio:rower',n:'Гребной тренажёр',bp:'cardio',tg:'cardiovascular system',eq:'cardio',kind:'cardio',custom:true,cardioPreset:true},
  {id:'cardio:treadmill',n:'Беговая дорожка',bp:'cardio',tg:'cardiovascular system',eq:'cardio',kind:'cardio',custom:true,cardioPreset:true},
  {id:'cardio:stairmaster',n:'Лестница / StairMaster',bp:'cardio',tg:'cardiovascular system',eq:'cardio',kind:'cardio',custom:true,cardioPreset:true},
  {id:'cardio:stepper',n:'Степпер',bp:'cardio',tg:'cardiovascular system',eq:'cardio',kind:'cardio',custom:true,cardioPreset:true}
 ];
 const weird=/(basic toe touch|body.?up|elbow dip|finger|wrist roller|rotary calf|neck bridge|power clean|clean and jerk|hang clean|snatch|handstand|planche|human flag|iron cross|foam roll|massage|warm.?up|cool.?down|yoga|pilates)/i;
 const norm=s=>String(s||'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[_–—-]+/g,' ').replace(/\s+/g,' ').trim();
 const rawId=e=>String(e?.rawId||e?.id||'').replace(/^og:/,'');
 function fixMeta(x){const n=norm(x.n||x.name),eq=norm(x.eq||x.equipment),bp=String(x.bp||x.body_part||x.category||'').toLowerCase();
  if(/concentration curl/.test(n)){x.bp='upper arms';x.tg='biceps';x.target='biceps';x.eq=/cable/.test(eq)?'cable':'dumbbell'}
  if(/lunge/.test(n)){x.bp='upper legs';x.tg=/rear|backward/.test(n)?'glutes':'quads';x.target=x.tg}
  if(/curl/.test(n)&&!/leg curl|wrist curl/.test(n)){x.bp='upper arms';x.tg='biceps';x.target='biceps'}
  if(/triceps|pushdown|skull crusher|french press/.test(n)){x.bp='upper arms';x.tg='triceps';x.target='triceps'}
  if(/leg extension/.test(n)){x.bp='upper legs';x.tg='quads';x.target='quads';x.eq='leverage machine'}
  if(/leg curl/.test(n)){x.bp='upper legs';x.tg='hamstrings';x.target='hamstrings';x.eq='leverage machine'}
  if(/leg press|hack squat/.test(n)){x.bp='upper legs';x.tg='quads';x.target='quads';x.eq='sled machine'}
  if(/hip abduction|abductor/.test(n)){x.bp='upper legs';x.tg='abductors';x.target='abductors'}
  if(/hip adduction|adductor/.test(n)){x.bp='upper legs';x.tg='adductors';x.target='adductors'}
  if(/calf raise/.test(n)){x.bp='lower legs';x.tg='calves';x.target='calves'}
  if(/bench press|chest press|pec deck|crossover|dumbbell fly/.test(n)){x.bp='chest';x.tg='pectorals';x.target='pectorals'}
  if(/lat pulldown|pull.?up|chin.?up|straight arm pulldown/.test(n)){x.bp='back';x.tg='lats';x.target='lats'}
  if(/seated row|low row|t.?bar row|bent over row|dumbbell row/.test(n)){x.bp='back';x.tg='upper back';x.target='upper back'}
  if(/shoulder press|military press|lateral raise|front raise|rear delt|reverse fly|face pull/.test(n)){x.bp='shoulders';x.tg='delts';x.target='delts'}
  return x
 }
 function audit(e){if(!e)return null;const id=rawId(e),o=EXACT[id],raw=norm(e.n||e.name);if(weird.test(raw))return null;let x={...e};if(o){x.__ruTitle=o.title;x.bp=o.bp;x.eq=o.eq;x.kind=o.kind;x.tg=o.target;x.target=o.target}x=fixMeta(x);if(x.kind==='cardio'&&x.bp!=='cardio')x.kind='strength';return x}
 function audited(){const out=[],seen=new Set();for(const e of BASE()){const x=audit(e);if(!x)continue;const key=`${rawId(x)}|${norm(x.n)}`;if(seen.has(key))continue;seen.add(key);out.push(x)}for(const c of CARDIO)if(!out.some(x=>String(x.id)===c.id))out.unshift(c);return out}
 window.UNVRSL_EXERCISE_RECORDS=audited;
 const oldTitle=window.UNVRSL_EXERCISE_TITLE;window.UNVRSL_EXERCISE_TITLE=e=>{const x=audit(e);return x?.__ruTitle||(typeof oldTitle==='function'?oldTitle(e):String(e?.n||''))};
 const oldFind=window.findExercise;window.findExercise=function(token){const dec=decodeURIComponent(String(token||''));const cardio=CARDIO.find(x=>x.id===dec);if(cardio)return cardio;const e=typeof oldFind==='function'?oldFind(token):null;return e?audit(e):null};try{findExercise=window.findExercise}catch(_){}
 const BP=[['all','Все'],['chest','Грудь'],['back','Спина'],['shoulders','Плечи'],['upper arms','Руки'],['upper legs','Бёдра'],['lower legs','Голени'],['waist','Кор'],['cardio','Кардио']];
 const EQ=[['all','Все'],['smith machine','Смит'],['dumbbell','Гантели'],['barbell','Штанга'],['cable','Блок'],['machine','Тренажёры'],['body weight','Свой вес'],['kettlebell','Гири'],['band','Резина'],['cardio','Кардио']];let q='',bp='all',eq='all',limit=180;
 const eqGroup=e=>{const z=String(e.eq||'').toLowerCase();if(e.kind==='cardio'||e.bp==='cardio')return'cardio';if(z==='smith machine')return'smith machine';if(z==='dumbbell')return'dumbbell';if(['barbell','olympic barbell','ez barbell'].includes(z))return'barbell';if(['cable','rope'].includes(z))return'cable';if(['leverage machine','sled machine','assisted'].includes(z))return'machine';if(z==='body weight')return'body weight';if(z==='kettlebell')return'kettlebell';if(z==='band')return'band';return z};
 const bRu=e=>({chest:'Грудь',back:'Спина',shoulders:'Плечи','upper arms':'Руки','lower arms':'Предплечья','upper legs':'Бёдра','lower legs':'Голени',waist:'Кор',cardio:'Кардио'}[e.bp]||e.bp||'—');
 const eRu=e=>e.kind==='cardio'?'Кардиотренажёр':({'smith machine':'Смит',dumbbell:'Гантели',barbell:'Штанга','olympic barbell':'Штанга','ez barbell':'EZ-штанга',cable:'Блок',rope:'Блок','leverage machine':'Тренажёр','sled machine':'Тренажёр',assisted:'Гравитрон','body weight':'Свой вес',kettlebell:'Гиря',band:'Резина'}[e.eq]||e.eq||'—');
 const title=e=>e.__ruTitle||(typeof window.UNVRSL_EXERCISE_TITLE==='function'?window.UNVRSL_EXERCISE_TITLE(e):e.n);
 function filtered(){const s=q.toLowerCase();return audited().filter(e=>(bp==='all'||e.bp===bp)&&(eq==='all'||eqGroup(e)===eq)&&(!s||`${title(e)} ${e.n||''} ${bRu(e)} ${eRu(e)}`.toLowerCase().includes(s)))}
 function row(e){const id=String(e.id).startsWith('og:')||String(e.id).startsWith('cardio:')?e.id:`og:${e.id}`,t=title(e),g=typeof mediaUrl==='function'?mediaUrl(e.gif||e.gif_url||''):(e.gif||e.gif_url||'');return `<button class="card exlib exlib-btn" onclick="openExerciseDetail('${encodeURIComponent(id)}')"><div class="exercise-list-row">${g?`<img class="ex-thumb" src="${g}" loading="lazy" alt="${esc(t)}">`:'<div class="ex-thumb" style="display:grid;place-items:center;font-size:24px">♥</div>'}<div class="grow"><b>${esc(t)}</b><div class="catalog-meta">${esc(bRu(e))} · ${esc(eRu(e))} · ${e.kind==='cardio'?'Сердечно-сосудистая система':esc(typeof ruTarget==='function'?ruTarget(e.tg):e.tg||'—')}</div></div><span class="chev">›</span></div></button>`}
 const chips=(arr,cur,fn)=>arr.map(([v,n])=>`<button class="filterchip ${cur===v?'on':''}" onclick="${fn}('${v}')">${n}</button>`).join('');
 function page(){const root=document.getElementById('exercises');if(!root)return;const all=audited(),f=filtered(),shown=f.slice(0,limit);root.innerHTML=`<div class="card"><div class="title">Упражнения</div><div class="muted">База упражнений · ${all.length}${f.length!==all.length?` · найдено ${f.length}`:''}</div></div><input class="search" value="${esc(q)}" placeholder="Поиск упражнений" oninput="auditExQ(this.value)"><div class="filterbar">${chips(BP,bp,'auditExBp')}</div><div class="section" style="margin-top:10px;margin-bottom:4px">ОБОРУДОВАНИЕ</div><div class="filterbar">${chips(EQ,eq,'auditExEq')}</div><div id="exList">${shown.map(row).join('')}${shown.length<f.length?`<button class="btn full" onclick="auditExMore()">Показать ещё · ${shown.length} из ${f.length}</button>`:''}${!f.length?'<div class="card muted">По этому фильтру ничего не найдено.</div>':''}</div>`}
 window.auditExQ=v=>{q=v||'';limit=180;page()};window.auditExBp=v=>{bp=v||'all';limit=180;page()};window.auditExEq=v=>{eq=v||'all';limit=180;page()};window.auditExMore=()=>{limit+=180;page()};window.exercisesPage=page;try{exercisesPage=page}catch(_){};if(document.querySelector('#exercises.page.active'))page();
})();