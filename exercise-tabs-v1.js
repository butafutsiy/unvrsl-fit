'use strict';
(()=>{
 if(window.__unvrslExerciseTabsV1)return;window.__unvrslExerciseTabsV1=true;
 let mode='strength',installed=false,limit=180;
 const clean=s=>String(s||'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[_–—-]+/g,' ').replace(/\s+/g,' ').trim();
 const eqOf=e=>String(e?.eq||e?.equipment||'').toLowerCase();
 const isCardio=e=>!!e&&(e.cardioPreset||e.kind==='cardio'||eqOf(e)==='cardio'||String(e.bp||'').toLowerCase()==='cardio'||String(e.tg||'').toLowerCase()==='cardiovascular system'||String(e.rawId||e.sourceId||e.id||'').startsWith('cardio:'));
 const cap=s=>s?String(s).charAt(0).toUpperCase()+String(s).slice(1):'';
 function naturalTitle(raw=''){
  const s=clean(raw),eq=s;
  if(!s)return'Упражнение';
  const one=/one arm|single arm|one hand|single hand/.test(s)?' одной рукой':'';
  const oneLeg=/one leg|single leg/.test(s)?' на одной ноге':'';
  const grip=/neutral grip/.test(s)?' нейтральным хватом':/wide grip|wide-grip/.test(s)?' широким хватом':/close grip|close-grip|narrow grip/.test(s)?' узким хватом':/reverse grip|underhand/.test(s)?' обратным хватом':'';
  const angle=/incline/.test(s)?' на наклонной скамье':/decline/.test(s)?' на отрицательной скамье':'';
  const equip=()=>/smith/.test(s)?'в Смите':/dumbbell/.test(s)?'с гантелями':/ez barbell/.test(s)?'с EZ-штангой':/barbell|olympic barbell/.test(s)?'со штангой':/kettlebell/.test(s)?'с гирей':/cable|rope/.test(s)?'на блоке':/lever|machine/.test(s)?'в тренажёре':/band/.test(s)?'с резиной':/weighted/.test(s)?'с дополнительным весом':'';
  if(/bench press/.test(s))return cap(`${/dumbbell/.test(s)?'жим гантелей':/smith/.test(s)?'жим в Смите':/lever|machine/.test(s)?'жим в тренажёре на грудь':'жим штанги'}${angle||' лёжа'}${grip}`);
  if(/chest press/.test(s))return cap(`${/cable/.test(s)?'жим на грудь на блоке':'жим в тренажёре на грудь'}${one}`);
  if(/pec deck|butterfly/.test(s))return'Сведение рук в тренажёре';
  if(/crossover|cable fly/.test(s))return cap(`${/low to high/.test(s)?'сведение рук в кроссовере снизу вверх':/high to low/.test(s)?'сведение рук в кроссовере сверху вниз':'сведение рук в кроссовере'}${one}`);
  if(/dumbbell fly|chest fly/.test(s))return cap(`разведение гантелей${angle||' лёжа'}`);
  if(/push.?up/.test(s)){if(/diamond|close/.test(s))return'Отжимания узким хватом';if(/wide/.test(s))return'Отжимания широким хватом';if(/feet elevated|decline/.test(s))return'Отжимания с ногами на возвышении';if(/hands elevated|incline/.test(s))return'Отжимания от опоры';if(/knee/.test(s))return'Отжимания с колен';return'Отжимания'}
  if(/pull.?up/.test(s)){if(/assisted/.test(s))return cap(`подтягивания в гравитроне${grip}`);if(/weighted/.test(s))return cap(`подтягивания с дополнительным весом${grip}`);return cap(`подтягивания${grip}`)}
  if(/chin.?up/.test(s))return /assisted/.test(s)?'Подтягивания обратным хватом в гравитроне':'Подтягивания обратным хватом';
  if(/lat pulldown|pulldown/.test(s)&&!/straight arm/.test(s))return cap(`тяга верхнего блока${one}${grip}`);
  if(/straight arm pulldown/.test(s))return'Тяга верхнего блока прямыми руками';
  if(/seated row|low row/.test(s))return cap(`${/lever|machine/.test(s)?'горизонтальная тяга в тренажёре':'горизонтальная тяга нижнего блока'}${one}${grip}`);
  if(/t.?bar row/.test(s))return /chest supported|supported/.test(s)?'Тяга Т-грифа с упором грудью':'Тяга Т-грифа';
  if(/bent over row/.test(s))return cap(`${/dumbbell/.test(s)?'тяга гантелей в наклоне':'тяга штанги в наклоне'}${grip}`);
  if(/dumbbell row|one arm row|single arm row/.test(s))return /cable/.test(s)?'Тяга нижнего блока одной рукой':'Тяга гантели одной рукой';
  if(/pullover/.test(s))return /dumbbell/.test(s)?'Пуловер с гантелью':/cable/.test(s)?'Пуловер на верхнем блоке':'Пуловер в тренажёре';
  if(/shrug/.test(s))return cap(`шраги ${equip()}`.trim());
  if(/romanian deadlift/.test(s))return cap(`румынская тяга ${equip()}`.trim()+oneLeg);
  if(/stiff leg deadlift/.test(s))return cap(`тяга на прямых ногах ${equip()}`.trim());
  if(/deadlift/.test(s))return cap(`становая тяга ${equip()}`.trim());
  if(/front squat/.test(s))return cap(`фронтальный присед ${equip()}`.trim());
  if(/split squat|bulgarian/.test(s))return cap(`${/bulgarian/.test(s)?'болгарский сплит-присед':'сплит-присед'} ${equip()}`.trim());
  if(/squat/.test(s))return cap(`приседания ${equip()}`.trim());
  if(/leg press/.test(s))return /one leg|single leg/.test(s)?'Жим ногами одной ногой':'Жим ногами в тренажёре';
  if(/leg extension/.test(s))return /one leg|single leg/.test(s)?'Разгибание одной ноги в тренажёре':'Разгибание ног в тренажёре';
  if(/leg curl/.test(s))return cap(`${/seated/.test(s)?'сгибание ног сидя':/lying/.test(s)?'сгибание ног лёжа':'сгибание ног'} в тренажёре`);
  if(/hip thrust|glute bridge/.test(s))return cap(`ягодичный мост ${equip()}`.trim()+oneLeg);
  if(/lunge/.test(s))return cap(`${/reverse|backward/.test(s)?'выпады назад':'выпады'} ${equip()}`.trim());
  if(/step.?up/.test(s))return cap(`зашагивания на платформу ${equip()}`.trim());
  if(/hip abduction|abductor/.test(s))return /cable/.test(s)?'Отведение ноги в сторону на блоке':'Разведение ног в тренажёре';
  if(/hip adduction|adductor/.test(s))return /cable/.test(s)?'Приведение ноги на блоке':'Сведение ног в тренажёре';
  if(/calf raise/.test(s))return cap(`${/seated/.test(s)?'подъём на носки сидя':'подъём на носки стоя'} ${equip()}`.trim());
  if(/arnold press/.test(s))return'Жим Арнольда';
  if(/military press/.test(s))return cap(`${/seated/.test(s)?'армейский жим сидя':'армейский жим стоя'} ${equip()}`.trim());
  if(/shoulder press|overhead press/.test(s))return cap(`${/lever|machine/.test(s)?'жим в тренажёре на плечи':/smith/.test(s)?'жим в Смите на плечи':/dumbbell/.test(s)?'жим гантелей на плечи':'жим над головой'}${/standing/.test(s)?' стоя':/seated/.test(s)?' сидя':''}`);
  if(/lateral raise/.test(s))return cap(`${/cable/.test(s)?'отведение руки в сторону на блоке':/lever|machine/.test(s)?'махи в тренажёре на среднюю дельту':'махи гантелями в стороны'}${one}`);
  if(/front raise/.test(s))return cap(`подъём перед собой ${equip()}`.trim());
  if(/reverse fly|rear delt/.test(s))return /lever|machine/.test(s)?'Обратная бабочка на заднюю дельту':/cable/.test(s)?'Разведение рук на заднюю дельту в кроссовере':'Разведение гантелей на заднюю дельту';
  if(/face pull/.test(s))return'Тяга каната к лицу';
  if(/hammer curl/.test(s))return /cable/.test(s)?'Молотковые сгибания на нижнем блоке':'Молотковые сгибания с гантелями';
  if(/preacher curl/.test(s))return cap(`сгибание рук на скамье Скотта ${equip()}`.trim());
  if(/concentration curl/.test(s))return'Концентрированное сгибание с гантелью';
  if(/biceps curl|barbell curl|dumbbell curl|cable curl/.test(s))return cap(`сгибание рук ${equip()}`.trim()+one);
  if(/triceps pushdown|pushdown/.test(s))return /rope/.test(s)?'Разгибание рук на верхнем блоке с канатом':'Разгибание рук на верхнем блоке';
  if(/skull crusher|lying triceps extension/.test(s))return cap(`французский жим лёжа ${equip()}`.trim());
  if(/triceps extension/.test(s))return cap(`${/overhead/.test(s)?'разгибание рук из-за головы':'разгибание на трицепс'} ${equip()}`.trim()+one);
  if(/crunch/.test(s))return /cable/.test(s)?'Скручивания на верхнем блоке':'Скручивания';
  if(/sit.?up/.test(s))return'Подъём корпуса';
  if(/hanging leg raise|leg raise/.test(s))return /hanging/.test(s)?'Подъём ног в висе':'Подъём ног';
  if(/knee raise/.test(s))return /hanging/.test(s)?'Подъём коленей в висе':'Подъём коленей';
  if(/side plank/.test(s))return'Боковая планка';if(/plank/.test(s))return'Планка';if(/russian twist/.test(s))return'Русские повороты';if(/ab wheel/.test(s))return'Разгибание с роликом для пресса';
  return'';
 }
 function polishInstruction(text=''){
  let s=String(text||'').trim();if(!s)return'';
  const repl=[
   [/ступни на землю/gi,'стопы на пол'],[/ступни на земле/gi,'стопы на полу'],[/ноги на земле/gi,'ноги на полу'],[/лежите на земле/gi,'лягте на пол'],[/лягте на землю/gi,'лягте на пол'],[/от земли/gi,'от пола'],[/к земле/gi,'к полу'],[/на землю/gi,'на пол'],[/на земле/gi,'на полу'],
   [/Включив пресс/gi,'Напрягите мышцы живота и'],[/Задействуя пресс/gi,'Напрягите мышцы живота и'],[/задействуя мышцы кора/gi,'удерживая корпус напряжённым'],[/желаемого количества повторений/gi,'нужного количества повторений'],[/необходимого количества повторений/gi,'нужного количества повторений'],[/Повторите необходимое количество повторений\.?/gi,'Выполните нужное количество повторений.'],[/Повторите желаемое количество повторений\.?/gi,'Выполните нужное количество повторений.'],
   [/медленно и контролируемо/gi,'плавно и подконтрольно'],[/сохраняя спину прямой/gi,'сохраняя нейтральное положение спины'],[/держите спину прямо/gi,'удерживайте спину в нейтральном положении']
  ];for(const [a,b] of repl)s=s.replace(a,b);return s.replace(/\s+/g,' ').trim()
 }
 function strengthRecords(){const f=typeof window.UNVRSL_FINAL_EXERCISES==='function'?window.UNVRSL_FINAL_EXERCISES():[];return f.filter(e=>!isCardio(e))}
 function cardioRecords(){let src=[];try{src=typeof catalogRecords==='function'?catalogRecords():[]}catch(_){}const out=[],seen=new Set();for(const e of src){if(!isCardio(e))continue;const k=clean(e.n||e.name);if(!k||seen.has(k))continue;seen.add(k);out.push(e)}return out.sort((a,b)=>String(a.n||'').localeCompare(String(b.n||''),'ru'))}
 function title(e){if(isCardio(e))return String(e.n||e.name||'Кардио');const n=naturalTitle(e.n||e.name);if(n)return n;try{return baseRu(e.n||e.name||'')}catch(_){return String(e.n||e.name||'Упражнение')}}
 let baseRu=x=>String(x||'');
 function installRu(){if(window.ruExerciseName?.__naturalRuV1)return;const prior=typeof window.ruExerciseName==='function'?window.ruExerciseName.bind(window):(x=>String(x||''));baseRu=prior;const w=function(name=''){return naturalTitle(name)||prior(name)};w.__naturalRuV1=true;window.ruExerciseName=w;try{ruExerciseName=w}catch(_){}}
 function installInstruction(){if(window.instructionRu?.__naturalRuV1)return;const prior=typeof window.instructionRu==='function'?window.instructionRu.bind(window):(e=>String(e?.instructions?.ru||''));const w=function(ex){return polishInstruction(prior(ex))};w.__naturalRuV1=true;window.instructionRu=w;try{instructionRu=w}catch(_){}}
 const fav=e=>typeof isFavorite==='function'&&isFavorite(String(e.rawId||e.id||e.n||''));
 const recent=e=>Array.isArray(st?.recentExercises)&&st.recentExercises.includes(String(e.rawId||e.id||e.n||''));
 function strengthFiltered(){const q=String(exQuery||'').trim().toLowerCase();return strengthRecords().filter(e=>{if(exBody==='favorites'&&!fav(e))return false;if(exBody==='recent'&&!recent(e))return false;if(exBody==='frequent')return false;if(!['all','favorites','recent','frequent'].includes(exBody)&&e.bp!==exBody)return false;if(typeof exEquipment!=='undefined'&&exEquipment!=='all'&&typeof equipmentGroup==='function'&&equipmentGroup(e)!==exEquipment)return false;const h=`${title(e)} ${e.n||''} ${BP_RU[e.bp]||''} ${EQ_RU[e.eq]||''} ${typeof ruTarget==='function'?ruTarget(e.tg):e.tg||''}`.toLowerCase();return !q||h.includes(q)})}
 function cardioFiltered(){const q=String(exQuery||'').trim().toLowerCase();return cardioRecords().filter(e=>!q||`${e.n||''} ${e.machine||''} кардио`.toLowerCase().includes(q))}
 function strengthRow(e){const t=title(e),body=BP_RU[e.bp]||e.bp||'—',eq=EQ_RU[e.eq]||e.eq||'—',tg=typeof ruTarget==='function'?ruTarget(e.tg):e.tg||'—',gif=e.gif||e.gif_url||'',id=String(e.id).startsWith('og:')?e.id:`og:${e.id}`;return `<div class="card exlib exlib-btn smart-ex-row" onclick="openExerciseDetail('${encodeURIComponent(id)}')"><div class="exercise-list-row"><img class="ex-thumb" src="${mediaUrl(gif)}" loading="lazy" alt="${esc(t)}"><div class="grow"><b>${esc(t)}</b><div class="catalog-meta">${esc(body)} · ${esc(eq)} · ${esc(tg)}</div></div><span class="chev">›</span></div></div>`}
 function cardioRow(e){const id=encodeURIComponent(e.id),metrics=e.cardioMetricOptions||e.metrics||['time'];const ru={time:'Время',calories:'Калории',distance:'Дистанция'};return `<div class="card exlib exlib-btn smart-ex-row" onclick="openExerciseDetail('${id}')"><div class="exercise-list-row"><div class="ex-thumb placeholder">♥︎</div><div class="grow"><b>${esc(e.n||'Кардио')}</b><div class="catalog-meta">Кардио · ${esc((metrics||[]).map(x=>ru[x]||x).join(' / ')||'Время')}</div></div><span class="chev">›</span></div></div>`}
 function renderTabs(){const root=document.querySelector('#exercises');if(!root)return;if(!document.getElementById('exerciseModeTabs')){const head=root.querySelector('.catalog-head');if(head)head.insertAdjacentHTML('afterend','<div id="exerciseModeTabs" class="exercise-mode-tabs"><button id="exerciseModeStrength" onclick="setExerciseModeV1(\'strength\')">Силовые</button><button id="exerciseModeCardio" onclick="setExerciseModeV1(\'cardio\')">Кардио</button></div>')}document.getElementById('exerciseModeStrength')?.classList.toggle('on',mode==='strength');document.getElementById('exerciseModeCardio')?.classList.toggle('on',mode==='cardio');const body=document.getElementById('bodyFilters'),eq=document.getElementById('equipmentFilters');const section=eq?.previousElementSibling;if(body)body.style.display=mode==='strength'?'':'none';if(eq)eq.style.display=mode==='strength'?'':'none';if(section&&section.classList.contains('section'))section.style.display=mode==='strength'?'':'none'}
 function render(){renderTabs();const el=document.getElementById('exList');if(!el)return;const all=mode==='strength'?strengthRecords():cardioRecords(),f=mode==='strength'?strengthFiltered():cardioFiltered(),shown=f.slice(0,limit);el.innerHTML=shown.map(mode==='strength'?strengthRow:cardioRow).join('')+(shown.length<f.length?`<button class="btn full" style="margin:12px 0 4px" onclick="showMoreExerciseModeV1()">Показать ещё · ${shown.length} из ${f.length}</button>`:'')+(!f.length?`<div class="card muted">${mode==='strength'?'По этому фильтру ничего не найдено.':'Кардио-упражнения пока не загружены.'}</div>`:'');const c=document.getElementById('catalogCount');if(c)c.textContent=`${mode==='strength'?'Силовая база':'Кардио'} · ${all.length} ${all.length===1?'упражнение':'упражнений'}${f.length!==all.length?` · найдено ${f.length}`:''}`}
 window.setExerciseModeV1=function(v){mode=v==='cardio'?'cardio':'strength';limit=180;exQuery='';const s=document.getElementById('exSearch');if(s)s.value='';render()};window.showMoreExerciseModeV1=()=>{limit+=180;render()};
 function install(){if(installed)return;installRu();installInstruction();const basePage=window.exercisesPage;if(typeof basePage!=='function')return;const page=function(){basePage.apply(this,arguments);setTimeout(render,0)};page.__exerciseTabsV1=true;window.exercisesPage=page;try{exercisesPage=page}catch(_){};const oldQ=window.setExerciseQuery;if(typeof oldQ==='function'){const q=function(v){exQuery=v||'';render()};window.setExerciseQuery=q;try{setExerciseQuery=q}catch(_){}}const oldBody=window.setExerciseBody;if(typeof oldBody==='function'){const b=function(v){exBody=v;try{renderBodyFilters()}catch(_){};render()};window.setExerciseBody=b;try{setExerciseBody=b}catch(_){}}const oldEq=window.setExerciseEquipment;if(typeof oldEq==='function'){const e=function(v){exEquipment=v||'all';try{renderEquipmentFilters()}catch(_){};render()};window.setExerciseEquipment=e;try{setExerciseEquipment=e}catch(_){}}window.renderExerciseResults=render;try{renderExerciseResults=render}catch(_){};installed=true;if(document.querySelector('#exercises.page.active'))render()}
 const css=document.createElement('style');css.textContent='.exercise-mode-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#1c1c1f;border:1px solid #303034;border-radius:17px;padding:4px;margin:12px 0}.exercise-mode-tabs button{padding:11px;border-radius:13px;color:#8e8e93;font-weight:800}.exercise-mode-tabs button.on{background:var(--green);color:#061108}';document.head.appendChild(css);
 let tries=0;const timer=setInterval(()=>{if(window.__unvrslExerciseFinalRulesV3||++tries>30){clearInterval(timer);install()}},250);setTimeout(install,9000);
})();
