'use strict';
(()=>{
 if(window.__unvrslExerciseSystemCleanV1)return;window.__unvrslExerciseSystemCleanV1=true;
 const S={q:'',body:'all',eq:'all',limit:180};
 const BODY=[['all','Все'],['chest','Грудь'],['back','Спина'],['shoulders','Плечи'],['upper arms','Руки'],['upper legs','Бёдра'],['lower legs','Голени'],['waist','Кор'],['cardio','Кардио']];
 const EQ=[['all','Все'],['smith machine','Смит'],['dumbbell','Гантели'],['barbell','Штанга'],['cable','Блок'],['machine','Тренажёры'],['body weight','Свой вес'],['kettlebell','Гири'],['band','Резина'],['cardio','Кардио']];
 const BODY_RU={chest:'Грудь',back:'Спина',shoulders:'Плечи','upper arms':'Руки','lower arms':'Предплечья','upper legs':'Бёдра','lower legs':'Голени',waist:'Кор',cardio:'Кардио'};
 const EQ_RU_CLEAN={'smith machine':'Смит',dumbbell:'Гантели',barbell:'Штанга','olympic barbell':'Штанга','ez barbell':'EZ-штанга',cable:'Блок',rope:'Блок','leverage machine':'Тренажёр','sled machine':'Тренажёр',assisted:'Гравитрон','body weight':'Свой вес',kettlebell:'Гиря',band:'Резина','stationary bike':'Велотренажёр','elliptical machine':'Эллипс',treadmill:'Беговая дорожка','stepper machine':'Степпер'};
 const EXT_WEIGHT=new Set(['smith machine','dumbbell','barbell','olympic barbell','ez barbell','cable','rope','leverage machine','sled machine','kettlebell','weighted']);
 const JUNK=/(basic toe touch|toe touch|body.?up|bench dip|elbow dip|battling rope|battle rope|bench hip extension|reverse hyper|neck bridge|finger|wrist roller|rotary calf|donkey calf|sissy squat|jefferson|zercher|reverse hack|reverse t.?bar|vertical traction|power clean|clean and jerk|hang clean|snatch|muscle.?up|handstand|planche|human flag|iron cross|dragon flag|archer|typewriter|commando|pistol squat|burpee|bear crawl|crab walk|frog jump|windmill|kneeling jump|bosu|swiss ball|stability ball|exercise ball|suspension|trx|stretch|mobility|warm.?up|cool.?down|yoga|pilates|foam roll|massage|jumping jack|high knees|mountain climber)/i;
 const CARDIO_MACHINE=/(treadmill|stationary bike|elliptical|cross trainer|stepper|stair|ski.?erg|rowing ergometer|rower|air bike|assault bike)/i;
 const norm=s=>String(s||'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[_–—-]+/g,' ').replace(/\s+/g,' ').trim();
 const cap=s=>s?String(s).charAt(0).toUpperCase()+String(s).slice(1):'';
 const equipPhrase=s=>/smith/.test(s)?'в Смите':/dumbbell/.test(s)?'с гантелями':/ez barbell/.test(s)?'с EZ-штангой':/barbell|olympic barbell/.test(s)?'со штангой':/kettlebell/.test(s)?'с гирей':/cable|rope/.test(s)?'на блоке':/lever|machine/.test(s)?'в тренажёре':/band/.test(s)?'с резиной':/weighted/.test(s)?'с дополнительным весом':'';
 const grip=s=>/neutral grip/.test(s)?' нейтральным хватом':/wide grip/.test(s)?' широким хватом':/close grip|narrow grip/.test(s)?' узким хватом':/reverse grip|underhand/.test(s)?' обратным хватом':'';
 function cardioTitle(s,eq){const x=`${s} ${eq}`;if(/incline treadmill/.test(x))return'Ходьба на беговой дорожке под наклоном';if(/stationary bike/.test(x))return'Велотренажёр';if(/elliptical|cross trainer/.test(x))return'Эллиптический тренажёр';if(/stairmaster|stair master|stair climber|stair machine/.test(x))return'Лестничный тренажёр';if(/stepper/.test(x))return'Степпер';if(/ski.?erg/.test(x))return'Лыжный тренажёр SkiErg';if(/rowing ergometer|rower/.test(x))return'Гребной тренажёр';if(/air bike|assault bike/.test(x))return'Аэробайк';if(/treadmill/.test(x))return /walk/.test(s)?'Ходьба на беговой дорожке':'Беговая дорожка';return''}
 function title(raw,eqRaw='',bp=''){
  const s=norm(raw),eq=norm(eqRaw),g=grip(s),ep=equipPhrase(`${s} ${eq}`),one=/one arm|single arm|one hand|single hand/.test(s)?' одной рукой':'',oneLeg=/one leg|single leg/.test(s)?' на одной ноге':'';
  if(!s||JUNK.test(s))return'';
  if(bp==='cardio'||CARDIO_MACHINE.test(`${s} ${eq}`)){const c=cardioTitle(s,eq);if(c)return c}
  if(/3\/4 sit.?up/.test(s))return'Скручивания 3/4';
  if(/side bend/.test(s)&&/45/.test(s))return'Боковые наклоны корпуса под 45°';
  if(/reverse fly|rear delt/.test(s)&&/lever|machine/.test(`${s} ${eq}`))return'Обратная бабочка в тренажёре';
  if(/pec deck|butterfly/.test(s)||(/fly/.test(s)&&/lever|machine/.test(`${s} ${eq}`)))return'Сведение рук в тренажёре';
  if(/bench press|chest press/.test(s)){const a=/incline/.test(s)?' на наклонной скамье':/decline/.test(s)?' на скамье с отрицательным наклоном':'';if(/dumbbell/.test(`${s} ${eq}`))return`Жим гантелей${a||' лёжа'}${g}`;if(/smith/.test(`${s} ${eq}`))return`Жим в Смите${a||' лёжа'}${g}`;if(/lever|machine/.test(`${s} ${eq}`))return`Жим от груди в тренажёре${a}`;return`Жим штанги${a||' лёжа'}${g}`}
  if(/cable fly|crossover/.test(s))return /low to high/.test(s)?'Сведение рук в кроссовере снизу вверх':/high to low/.test(s)?'Сведение рук в кроссовере сверху вниз':'Сведение рук в кроссовере';
  if(/dumbbell fly/.test(s))return /incline/.test(s)?'Разведение гантелей на наклонной скамье':'Разведение гантелей лёжа';
  if(/push.?up/.test(s))return /knee/.test(s)?'Отжимания с колен':/feet elevated|decline/.test(s)?'Отжимания с ногами на возвышении':/incline|hands elevated/.test(s)?'Отжимания от опоры':/close|diamond/.test(s)?'Отжимания узким хватом':/wide/.test(s)?'Отжимания широким хватом':'Отжимания';
  if(/pull.?up/.test(s))return cap(`${/assisted/.test(s)?'подтягивания в гравитроне':/weighted/.test(s)?'подтягивания с дополнительным весом':'подтягивания'}${g}`);
  if(/chin.?up/.test(s))return /assisted/.test(s)?'Подтягивания обратным хватом в гравитроне':'Подтягивания обратным хватом';
  if(/straight arm pulldown/.test(s))return'Тяга верхнего блока прямыми руками';
  if(/lat pulldown|pulldown/.test(s))return cap(`тяга верхнего блока${one}${g}`);
  if(/high row/.test(s)&&/lever|machine/.test(`${s} ${eq}`))return'Тяга сверху в тренажёре';
  if(/seated row|low row|horizontal row/.test(s))return cap(`${/lever|machine/.test(`${s} ${eq}`)?'горизонтальная тяга в тренажёре':'горизонтальная тяга нижнего блока'}${one}${g}`);
  if(/t.?bar row/.test(s))return /chest supported|supported/.test(s)?'Тяга Т-грифа с упором грудью':'Тяга Т-грифа';
  if(/bent over row/.test(s))return /dumbbell/.test(`${s} ${eq}`)?'Тяга гантелей в наклоне':'Тяга штанги в наклоне';
  if(/dumbbell row|one arm row|single arm row/.test(s))return'Тяга гантели одной рукой';
  if(/pullover/.test(s))return /dumbbell/.test(`${s} ${eq}`)?'Пуловер с гантелью':/cable/.test(`${s} ${eq}`)?'Пуловер на верхнем блоке':'Пуловер в тренажёре';
  if(/shrug/.test(s))return cap(`шраги ${ep}`.trim());
  if(/romanian deadlift/.test(s))return cap(`румынская тяга ${ep}${oneLeg}`.trim());
  if(/stiff leg deadlift/.test(s))return cap(`тяга на прямых ногах ${ep}`.trim());
  if(/deadlift/.test(s))return cap(`становая тяга ${ep}`.trim());
  if(/front squat/.test(s))return cap(`фронтальный присед ${ep}`.trim());
  if(/bulgarian/.test(s))return cap(`болгарские выпады ${ep}`.trim());
  if(/split squat/.test(s))return cap(`выпады на месте ${ep}`.trim());
  if(/hack squat/.test(s))return'Гакк-присед в тренажёре';
  if(/squat/.test(s))return cap(`приседания ${ep}`.trim());
  if(/leg press/.test(s))return oneLeg?'Жим одной ногой в тренажёре':'Жим ногами в тренажёре';
  if(/leg extension/.test(s))return oneLeg?'Разгибание одной ноги в тренажёре':'Разгибание ног в тренажёре';
  if(/leg curl/.test(s))return /lying/.test(s)?'Сгибание ног лёжа в тренажёре':/standing/.test(s)?'Сгибание ноги стоя в тренажёре':'Сгибание ног сидя в тренажёре';
  if(/hip thrust|glute bridge/.test(s))return cap(`ягодичный мост ${ep}${oneLeg}`.trim());
  if(/lunge/.test(s))return cap(`${/reverse|backward/.test(s)?'выпады назад':'выпады'} ${ep}`.trim());
  if(/step.?up/.test(s))return cap(`зашагивания на платформу ${ep}`.trim());
  if(/hip abduction|abductor/.test(s))return /cable/.test(`${s} ${eq}`)?'Отведение ноги в сторону на блоке':'Разведение ног в тренажёре';
  if(/hip adduction|adductor/.test(s))return /cable/.test(`${s} ${eq}`)?'Приведение ноги на блоке':'Сведение ног в тренажёре';
  if(/calf raise/.test(s))return cap(`${/seated/.test(s)?'подъём на носки сидя':'подъём на носки стоя'} ${ep}`.trim());
  if(/arnold press/.test(s))return /seated/.test(s)?'Жим Арнольда сидя':'Жим Арнольда';
  if(/military press/.test(s))return cap(`${/seated/.test(s)?'армейский жим сидя':'армейский жим стоя'} ${ep}`.trim());
  if(/shoulder press|overhead press/.test(s)){if(/kettlebell/.test(`${s} ${eq}`))return /seated/.test(s)?'Жим гири сидя':'Жим гири над головой';if(/lever|machine/.test(`${s} ${eq}`))return'Жим на плечи в тренажёре';return cap(`${/dumbbell/.test(`${s} ${eq}`)?'жим гантелей над головой':'жим над головой'} ${ep}`.trim())}
  if(/lateral raise/.test(s))return /cable/.test(`${s} ${eq}`)?'Отведение руки в сторону на блоке':/lever|machine/.test(`${s} ${eq}`)?'Отведение рук в стороны в тренажёре':'Махи гантелями в стороны';
  if(/front raise/.test(s))return cap(`подъём перед собой ${ep}`.trim());
  if(/face pull/.test(s))return'Тяга каната к лицу';
  if(/hammer curl/.test(s))return /cable/.test(`${s} ${eq}`)?'Молотковые сгибания на нижнем блоке':'Молотковые сгибания с гантелями';
  if(/preacher curl/.test(s))return cap(`сгибание рук на скамье Скотта ${ep}`.trim());
  if(/concentration curl/.test(s))return'Концентрированное сгибание с гантелью';
  if(/biceps curl|barbell curl|dumbbell curl|cable curl/.test(s))return cap(`сгибание рук ${ep}${one}`.trim());
  if(/triceps pushdown|pushdown/.test(s))return /rope/.test(`${s} ${eq}`)?'Разгибание рук на верхнем блоке с канатом':'Разгибание рук на верхнем блоке';
  if(/skull crusher|lying triceps extension/.test(s))return cap(`французский жим лёжа ${ep}`.trim());
  if(/triceps extension/.test(s))return cap(`${/overhead/.test(s)?'разгибание рук из-за головы':'разгибание рук на трицепс'} ${ep}${one}`.trim());
  if(/crunch/.test(s))return /cable/.test(`${s} ${eq}`)?'Скручивания на верхнем блоке':'Скручивания';
  if(/sit.?up/.test(s))return'Подъём корпуса';
  if(/hanging leg raise/.test(s))return'Подъём ног в висе';if(/leg raise/.test(s))return'Подъём ног';if(/hanging knee raise/.test(s))return'Подъём коленей в висе';
  if(/side plank/.test(s))return'Боковая планка';if(/plank/.test(s))return'Планка';if(/russian twist/.test(s))return'Русские повороты';if(/ab wheel/.test(s))return'Выкаты с роликом для пресса';
  return'';
 }
 function polish(text=''){let s=String(text||'').trim();const reps=[[/ступни на землю/gi,'стопы на пол'],[/ступни на земле/gi,'стопы на полу'],[/ноги на земле/gi,'ноги на полу'],[/лягте на землю/gi,'лягте на пол'],[/лежите на земле/gi,'лягте на пол'],[/от земли/gi,'от пола'],[/к земле/gi,'к полу'],[/на землю/gi,'на пол'],[/на земле/gi,'на полу'],[/Включив пресс/gi,'Напрягите мышцы живота и'],[/Задействуя пресс/gi,'Напрягите мышцы живота и'],[/задействуя мышцы кора/gi,'удерживая корпус напряжённым'],[/Повторите необходимое количество повторений\.?/gi,'Выполните нужное количество повторений.'],[/Повторите желаемое количество повторений\.?/gi,'Выполните нужное количество повторений.'],[/необходимого количества повторений/gi,'нужного количества повторений'],[/желаемого количества повторений/gi,'нужного количества повторений'],[/держите спину прямо/gi,'сохраняйте нейтральное положение спины'],[/сохраняя спину прямой/gi,'сохраняя нейтральное положение спины'],[/охладитесь/gi,'снизьте темп для заминки']];for(const[a,b]of reps)s=s.replace(a,b);return s.replace(/\s+/g,' ').trim()}
 function rawSource(){return (typeof ogLibrary!=='undefined'&&Array.isArray(ogLibrary))?ogLibrary:[]}
 function adapt(e){if(!e||e.custom||e.anatome)return null;const gif=String(e.gif||e.gif_url||'').trim(),tech=polish(e?.instructions?.ru||e?.instructions?.russian||'');if(!gif||!tech)return null;const bp=String(e.bp||e.body_part||e.category||'').toLowerCase(),eq=String(e.eq||e.equipment||'').toLowerCase(),isCardio=bp==='cardio';if(isCardio&&!CARDIO_MACHINE.test(`${e.n||e.name||''} ${eq}`))return null;const t=title(e.n||e.name,eq,bp);if(!t)return null;return{...e,id:String(e.id).startsWith('og:')?String(e.id):`og:${e.id}`,rawId:e.rawId||e.id,custom:false,__ruTitle:t,__ruInstruction:tech,kind:isCardio?'cardio':'strength',tracking:isCardio?'cardio':EXT_WEIGHT.has(eq)?'weight_reps':'reps'}}
 function records(){const out=[],seen=new Set();for(const raw of rawSource()){const e=adapt(raw);if(!e)continue;const k=`${norm(e.__ruTitle)}|${equipmentGroupClean(e)}`;if(seen.has(k))continue;seen.add(k);out.push(e)}return out.sort((a,b)=>a.__ruTitle.localeCompare(b.__ruTitle,'ru'))}
 function equipmentGroupClean(e){if(e.kind==='cardio')return'cardio';const eq=String(e.eq||'').toLowerCase();if(eq==='smith machine')return'smith machine';if(eq==='dumbbell')return'dumbbell';if(['barbell','olympic barbell','ez barbell'].includes(eq))return'barbell';if(['cable','rope'].includes(eq))return'cable';if(['leverage machine','sled machine','assisted'].includes(eq))return'machine';if(eq==='body weight')return'body weight';if(eq==='kettlebell')return'kettlebell';if(eq==='band')return'band';return eq}
 function customRecords(){const a=Array.isArray(st?.customExercises)?st.customExercises:[];return a.map(x=>({id:`custom:${x.n}`,n:x.n,raw:x.n,custom:true,...(typeof inferCustomMeta==='function'?inferCustomMeta(x.n):{})}))}
 function find(token){const id=decodeURIComponent(token||'');if(id.startsWith('custom:')){const raw=id.slice(7),m=typeof inferCustomMeta==='function'?inferCustomMeta(raw):{};return{id,n:raw,raw,custom:true,...m}}const rid=id.replace(/^og:/,'');const raw=rawSource().find(x=>String(x.id)===rid);return raw?adapt(raw):null}
 function filtered(){const q=S.q.toLowerCase();return records().filter(e=>{if(S.body!=='all'&&e.bp!==S.body)return false;if(S.eq!=='all'&&equipmentGroupClean(e)!==S.eq)return false;const h=`${e.__ruTitle} ${e.n||''} ${BODY_RU[e.bp]||''} ${EQ_RU_CLEAN[e.eq]||e.eq||''} ${typeof ruTarget==='function'?ruTarget(e.tg):e.tg||''}`.toLowerCase();return !q||h.includes(q)})}
 function row(e){const t=e.__ruTitle,body=BODY_RU[e.bp]||e.bp||'—',eq=e.kind==='cardio'?'Кардио-тренажёр':(EQ_RU_CLEAN[e.eq]||e.eq||'—'),tg=e.kind==='cardio'?'Кардио':(typeof ruTarget==='function'?ruTarget(e.tg):e.tg||'—'),gif=mediaUrl(e.gif||e.gif_url||'');return `<button class="card exlib exlib-btn" onclick="openExerciseDetail('${encodeURIComponent(e.id)}')"><div class="exercise-list-row"><img class="ex-thumb" src="${gif}" loading="lazy" alt="${esc(t)}"><div class="grow"><b>${esc(t)}</b><div class="catalog-meta">${esc(body)} · ${esc(eq)} · ${esc(tg)}</div></div><span class="chev">›</span></div></button>`}
 function filtersHtml(items,current,fn){return items.map(([id,label])=>`<button class="filterchip ${current===id?'on':''}" onclick="${fn}('${id}')">${label}</button>`).join('')}
 function page(){const root=document.getElementById('exercises');if(!root)return;const all=records(),f=filtered(),shown=f.slice(0,S.limit);root.innerHTML=`<div class="card"><div class="row between"><div><div class="title">Упражнения</div><div id="catalogCount" class="muted">База упражнений · ${all.length}${f.length!==all.length?` · найдено ${f.length}`:''}</div></div></div></div><input class="search" value="${esc(S.q)}" placeholder="Поиск упражнений" oninput="cleanExerciseQuery(this.value)"><div class="filterbar">${filtersHtml(BODY,S.body,'cleanExerciseBody')}</div><div class="section" style="margin-top:10px;margin-bottom:4px">ОБОРУДОВАНИЕ</div><div class="filterbar">${filtersHtml(EQ,S.eq,'cleanExerciseEq')}</div><div id="exList">${shown.map(row).join('')}${shown.length<f.length?`<button class="btn full" style="margin:12px 0" onclick="cleanExerciseMore()">Показать ещё · ${shown.length} из ${f.length}</button>`:''}${!f.length?`<div class="card muted">${typeof ogLibraryLoading!=='undefined'&&ogLibraryLoading?'Загружаю базу…':'По этому фильтру ничего не найдено.'}</div>`:''}</div>`}
 window.cleanExerciseQuery=v=>{S.q=String(v||'');S.limit=180;page()};window.cleanExerciseBody=v=>{S.body=v||'all';S.limit=180;page()};window.cleanExerciseEq=v=>{S.eq=v||'all';S.limit=180;page()};window.cleanExerciseMore=()=>{S.limit+=180;page()};
 window.UNVRSL_EXERCISE_RECORDS=records;window.UNVRSL_EXERCISE_ADAPT=adapt;window.UNVRSL_EXERCISE_TITLE=e=>e?.__ruTitle||title(e?.n||e?.name,e?.eq,e?.bp);window.exerciseUsesExternalWeight=e=>!!e&&e.kind!=='cardio'&&EXT_WEIGHT.has(String(e.eq||'').toLowerCase());
 window.catalogRecords=()=>[...customRecords(),...records()];try{catalogRecords=window.catalogRecords}catch(_){}
 window.findExercise=find;try{findExercise=find}catch(_){}
 window.ruExerciseName=function(raw){const hit=rawSource().find(x=>String(x.n)===String(raw));const a=hit?adapt(hit):null;return a?.__ruTitle||title(raw)||String(raw||'')};try{ruExerciseName=window.ruExerciseName}catch(_){}
 window.instructionRu=function(ex){return ex?.__ruInstruction||polish(ex?.instructions?.ru||ex?.instructions?.russian||'')};try{instructionRu=window.instructionRu}catch(_){}
 window.equipmentGroup=equipmentGroupClean;try{equipmentGroup=equipmentGroupClean}catch(_){}
 window.exercisesPage=page;try{exercisesPage=page}catch(_){}
 window.renderExerciseResults=page;try{renderExerciseResults=page}catch(_){}
 const baseDetail=window.renderExerciseDetail;
 function removeRm(){const h=[...document.querySelectorAll('.section')].find(x=>(x.textContent||'').trim()==='РАСЧЁТНЫЙ 1ПМ');if(!h)return;let n=h.nextElementSibling;h.remove();while(n&&!n.classList.contains('section')&&!n.classList.contains('source-note')){const next=n.nextElementSibling;n.remove();n=next}}
 if(typeof baseDetail==='function'){window.renderExerciseDetail=function(ex){const r=baseDetail(ex);if(!window.exerciseUsesExternalWeight(ex)){removeRm();setTimeout(removeRm,0)}return r};try{renderExerciseDetail=window.renderExerciseDetail}catch(_){}}
 const style=document.createElement('style');style.textContent='#exercises .filterbar{padding-bottom:10px}#exercises .exlib-btn{width:100%;text-align:left}';document.head.appendChild(style);
 let tries=0;const timer=setInterval(()=>{if(document.querySelector('#exercises.page.active'))page();if(++tries>20)clearInterval(timer)},400);
})();
