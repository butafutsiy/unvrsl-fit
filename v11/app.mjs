import {
  adjustedWeight,applyPlanWeight,applyRecommendation,canonicalExerciseName,createWorkout,
  isoDate,learnFromHistory,muscleLoad,readinessAdjustment,workoutWeightHistory
} from './core.mjs';
import {exportBackup,getState,importBackup,loadState,persistNow,subscribe,updateState} from './store.mjs';
import {cloud,initCloud,loadTrainerClients,signIn,signOut,syncNow,updateProfile} from './cloud.mjs';

const RPE={1:7,2:8,3:8.5,4:6.5,5:8.5,6:6.5,7:9,8:9};
const BASE_REST={1:150,2:150,3:120,4:75,5:150,6:75,7:210,8:300};
const ISO_REST={1:75,2:75,3:60,4:45,5:75,6:45,7:105,8:105};
const BASE_WORDS=/присед|жим лёжа|тяга штанги|румын|армей|жим ногами|подтяг|т-грифа|ягодичный мост/i;
const routines=(window.UNVRSL_ROUTINES||[]).map(routine=>prepareRoutine(routine));
const routineMap=new Map(routines.map(routine=>[`${routine.w}:${routine.c}`,routine]));
const view=document.querySelector('#view');
const app=document.querySelector('#app');
const boot=document.querySelector('#boot');
const modal=document.querySelector('#modal');
const sheet=document.querySelector('#sheet');
const toastNode=document.querySelector('#toast');
let page='home';
let planTab='profile';
let statsDays=7;
let statsExercise='';
let modalCleanup=null;
let toastTimer=null;
let trainerClients=[];

function prepareRoutine(source){
  const routine=JSON.parse(JSON.stringify(source));
  routine.e=(routine.e||[]).map((exercise,index)=>({...exercise,restSeconds:restFor(routine,exercise,index)}));
  return routine;
}

function restFor(routine,exercise,index){
  const name=exercise.n||'';
  const next=routine.e?.[index+1];
  if(/DS/i.test(name))return exercise.g&&next?.g===exercise.g?0:ISO_REST[routine.w]||75;
  if(/UNVRSL/i.test(name))return exercise.g&&next?.g===exercise.g?30:(BASE_REST[routine.w]||120);
  if(/SLDR/i.test(name))return exercise.g&&next?.g===exercise.g?15:(BASE_REST[routine.w]||120);
  if(/FST-?7/i.test(name))return 30;
  return BASE_WORDS.test(name)?BASE_REST[routine.w]||120:ISO_REST[routine.w]||75;
}

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fmtNumber=value=>Number(value||0).toLocaleString('ru-RU',{maximumFractionDigits:1});
const fmtDate=value=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(new Date(`${value}T12:00:00`));
const todayText=()=>new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
const weekType=week=>week===4||week===6?'Разгрузка / памп':week===8?'Тестовая неделя':week===7?'Силовая неделя':'Прогрессия';
const completeSets=workout=>workout?.exercises?.reduce((sum,exercise)=>sum+exercise.sets.filter(set=>set.done).length,0)||0;
const totalSets=workout=>workout?.exercises?.reduce((sum,exercise)=>sum+exercise.sets.length,0)||0;

function toast(message){
  toastNode.textContent=message;
  toastNode.hidden=false;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toastNode.hidden=true,2200);
}

function openModal(html,onCleanup=null){
  if(modalCleanup)modalCleanup();
  modalCleanup=onCleanup;
  sheet.innerHTML=`<div class="grabber"></div>${html}`;
  modal.hidden=false;
}

function closeModal(){
  modal.hidden=true;
  sheet.innerHTML='';
  if(modalCleanup)modalCleanup();
  modalCleanup=null;
}

function setPage(next){
  page=next;
  document.querySelectorAll('.nav button').forEach(button=>button.classList.toggle('active',button.dataset.page===page));
  render();
  scrollTo({top:0,behavior:'auto'});
}

function render(){
  document.documentElement.style.setProperty('--accent',getState().profile.accent||'#30d158');
  document.querySelector('#todayLabel').textContent=todayText();
  const renderers={home:renderHome,plan:renderPlan,workout:renderWorkout,stats:renderStats,profile:renderProfile};
  view.innerHTML=(renderers[page]||renderHome)();
}

function renderHome(){
  const state=getState();
  const lastWeight=state.bodyweights.at(-1);
  const lastWorkout=state.workouts.filter(item=>item.endedAt).sort((a,b)=>b.endedAt-a.endedAt)[0];
  const thisMonth=state.workouts.filter(item=>item.endedAt&&item.date.slice(0,7)===isoDate().slice(0,7)).length;
  const active=state.activeWorkout;
  return `
    ${active?`<div class="card readiness-banner"><div class="row between"><div><div class="title">Тренировка не завершена</div><div class="subtitle">${esc(active.code)} · ${esc(active.name)} · ${completeSets(active)}/${totalSets(active)} подходов</div></div><button class="btn primary" data-action="open-active">Продолжить</button></div></div>`:''}
    <div class="grid2">
      <div class="metric"><span>Тренировки</span><b>${state.workouts.length}</b></div>
      <div class="metric"><span>Этот месяц</span><b>${thisMonth}</b></div>
    </div>
    <div class="card">
      <div class="row between"><div><div class="muted">Вес тела</div><div class="big">${lastWeight?`${fmtNumber(lastWeight.value)} <small>кг</small>`:'Нет данных'}</div></div><button class="btn primary" data-action="add-weight">Записать</button></div>
      ${bodyweightChart(state.bodyweights.slice(-20))}
      <button class="btn full ghost" data-action="weight-history">История веса</button>
    </div>
    <div class="card">
      <div class="row between"><div><div class="title">${lastWorkout?'Последняя тренировка':'Выбери тренировку'}</div><div class="subtitle">${lastWorkout?`${fmtDate(lastWorkout.date)} · ${esc(lastWorkout.code)} · ${esc(lastWorkout.name)}`:'Самочувствие будет запрошено перед стартом'}</div></div><button class="btn primary" data-action="choose-workout">${lastWorkout?'Новая':'Выбрать'}</button></div>
    </div>`;
}

function renderPlan(){
  const state=getState();
  const week=Math.min(8,Math.max(1,Number(state.preferences.week)||1));
  if(planTab==='profile')return `
    <div class="profile-tabs"><button class="active" data-plan-tab="profile">Профиль и замеры</button><button data-plan-tab="program">Программа</button></div>
    ${profileMeasurementsCard(state)}
    <div class="eyebrow">Последние замеры</div>
    ${measurementHistory(state.measurements)}`;
  return `
    <div class="profile-tabs"><button data-plan-tab="profile">Профиль и замеры</button><button class="active" data-plan-tab="program">Программа</button></div>
    <div class="weekbar">${Array.from({length:8},(_,index)=>index+1).map(value=>`<button class="week ${value===week?'active':''}" data-week="${value}">W${value}</button>`).join('')}</div>
    <div class="card"><div class="row between"><div><div class="title">Неделя ${week}</div><div class="subtitle">${weekType(week)}</div></div><span class="chip accent">RPE ${RPE[week]}</span></div></div>
    ${routines.filter(routine=>routine.w===week).map(routine=>routineCard(routine)).join('')}
    ${programCards(state,week)}`;
}

function profileMeasurementsCard(state){
  const latest=state.measurements.slice().sort((a,b)=>String(b.date||b.d).localeCompare(String(a.date||a.d)))[0]||{};
  const values=[['Грудь',latest.chest],['Талия',latest.waist],['Бёдра',latest.hips],['Бицепс',latest.arm],['Бедро',latest.thigh],['Икры',latest.calf]];
  return `<div class="card"><div class="row between"><div><div class="title">${esc(state.profile.name||cloud.profile?.display_name||'Мой профиль')}</div><div class="subtitle">${state.profile.role==='trainer'?'Тренер':'Клиент'} · ${state.profile.sex==='female'?'женская схема':'мужская схема'}</div></div><button class="btn" data-action="edit-profile">Изменить</button></div><div class="divider"></div><div class="measurement-grid">${values.map(([label,value])=>`<div class="measurement"><span class="muted small">${label}</span><b>${value?`${fmtNumber(value)} см`:'–'}</b></div>`).join('')}</div><button class="btn primary full" style="margin-top:14px" data-action="add-measurements">Добавить замеры</button></div>`;
}

function measurementHistory(items){
  const rows=items.slice().sort((a,b)=>String(b.date||b.d).localeCompare(String(a.date||a.d))).map(item=>`<div class="card"><div class="row between"><div><b>${fmtDate(String(item.date||item.d).slice(0,10))}</b><div class="subtitle">Талия ${fmtNumber(item.waist)||'–'} · Бёдра ${fmtNumber(item.hips)||'–'} · Грудь ${fmtNumber(item.chest)||'–'}</div></div><button class="btn tiny danger" data-action="delete-measurement" data-id="${esc(item.id||item.date||item.d)}">Удалить</button></div></div>`).join('');
  return rows||'<div class="card empty">Замеров пока нет.</div>';
}

function routineCard(routine){
  const weighted=routine.e.filter(exercise=>Number(exercise.w)>0).length;
  return `<button class="card routine full" data-action="routine" data-routine="${routine.w}:${esc(routine.c)}"><div class="row between"><div style="text-align:left"><h3>${esc(routine.c)} · ${esc(routine.t)}</h3><div class="subtitle">${esc(routine.p||'')}</div><div class="chips"><span class="chip">${routine.e.length} упражнений</span><span class="chip">${weighted===routine.e.length?'веса заданы':weighted?'часть весов задана':'без весов'}</span></div></div><span>›</span></div></button>`;
}

function programCards(state,week){
  const all=availablePrograms(state);
  if(!all.length)return '';
  return `<div class="eyebrow">Другие программы</div>${all.map((program,programIndex)=>{const days=program.weeks?.[week-1]?.days||program.routines.filter(item=>Number(item.w)===Number(week));return `<div class="card"><div class="title">${esc(program.name)}</div>${program.trainer?`<div class="subtitle">Тренер: ${esc(program.trainer)}</div>`:''}${days.map((day,dayIndex)=>`<div class="history-line row between"><div><b>${esc(day.name||day.t||day.c||`День ${dayIndex+1}`)}</b><div class="muted small">${day.ex?.length||day.e?.length||0} упражнений</div></div><button class="btn tiny primary" data-action="custom-routine" data-program="${programIndex}" data-day="${dayIndex}">Старт</button></div>`).join('')||'<div class="empty">На этой неделе тренировок нет.</div>'}</div>`}).join('')}`;
}

function availablePrograms(state){
  const assigned=state.assignedPrograms.map(item=>{
    const snapshot=item.snapshot?.program||item.snapshot||item;
    return {name:item.title||snapshot.name||'Назначенная программа',trainer:item.trainer||'',weeks:snapshot.weeks||[],routines:snapshot.routines||[]};
  });
  const own=state.programs.map(item=>({name:item.name||'Моя программа',trainer:'',weeks:item.weeks||[],routines:item.routines||[]}));
  return [...assigned,...own];
}

function customRoutine(programIndex,dayIndex){
  const state=getState();
  const week=state.preferences.week||1;
  const program=availablePrograms(state)[programIndex];
  const routine=program?.routines?.filter(item=>Number(item.w)===Number(week))[dayIndex];
  if(routine)return {...routine,t:routine.t||program.name};
  const day=program?.weeks?.[week-1]?.days?.[dayIndex];
  if(!day)return null;
  const exercises=[];
  for(const block of day.ex||[]){
    const sets=block.sets||[];
    if(block.method&&block.method!=='STANDARD'&&block.method!=='FST-7'){
      sets.forEach((set,index)=>exercises.push({n:`${block.n} — ${block.method} ${index+1}/${sets.length}`,s:1,r:set.r,w:set.w||null,d:block.note||'',restSeconds:set.rest??block.rest??90,g:`custom-${block.id||block.n}`}));
    }else exercises.push({n:block.method==='FST-7'?`${block.n} — FST-7`:block.n,s:sets.length||block.s||3,r:sets[0]?.r||block.r||10,w:sets[0]?.w||block.w||null,d:block.note||block.d||'',restSeconds:block.rest||90});
  }
  return {w:week,c:day.name||`День ${dayIndex+1}`,t:program.name||'Программа',p:'Назначенная программа',e:exercises};
}

function renderWorkout(){
  const workout=getState().activeWorkout;
  if(!workout)return `<div class="card empty"><div class="title">Нет активной тренировки</div><div class="subtitle">Сначала выбери тренировку и оцени самочувствие.</div><button class="btn primary full" style="margin-top:16px" data-action="choose-workout">Выбрать тренировку</button></div>`;
  const completed=completeSets(workout),total=totalSets(workout),percent=total?Math.round(completed/total*100):0;
  return `
    <div class="card workout-head"><div class="row between"><div><div class="title">${esc(workout.code)} · ${esc(workout.name)}</div><div class="subtitle">W${workout.week} · RPE ${workout.targetRpe}</div></div><span class="chip accent">${percent}%</span></div><div class="progress"><i style="width:${percent}%"></i></div></div>
    <div class="card readiness-banner"><div class="row between"><div><b>Самочувствие · ${formatPercent(workout.readiness?.adjustmentPercent||0)}</b><div class="subtitle">Рабочие веса рассчитаны до показа экрана</div></div><button class="btn tiny" data-action="change-readiness">Изменить</button></div></div>
    ${workout.exercises.map(exercise=>exerciseCard(exercise)).join('')}
    <div class="card stack"><button class="btn primary full" data-action="finish-workout">Завершить тренировку</button><button class="btn danger full" data-action="cancel-workout">Отменить тренировку</button></div>`;
}

function exerciseCard(exercise){
  const history=workoutWeightHistory(getState().workouts,exercise.name);
  const method=/UNVRSL|SLDR|DS|FST-?7/i.test(exercise.name);
  return `<div class="exercise" data-exercise-id="${exercise.id}"><div class="row between"><div class="grow"><h3>${esc(exercise.name)}</h3><div class="exercise-note">${exercise.sourceHasWeight?`Плановый вес ${fmtNumber(exercise.planWeight)} кг`:`Вес рассчитан из истории${exercise.learnedWeight?` · база ${fmtNumber(exercise.learnedWeight)} кг`:''}`} · отдых ${exercise.restSeconds} сек</div>${exercise.note?`<div class="exercise-note">${esc(exercise.note)}</div>`:''}</div><button class="btn tiny" data-action="exercise-history" data-exercise="${encodeURIComponent(exercise.name)}">История</button></div>
    ${exercise.recommendation?`<div class="recommendation"><div class="row between"><div><strong>Рекомендация · ${fmtNumber(exercise.recommendation.weight)} кг</strong><div class="muted small">По тренировке ${esc(exercise.recommendation.sourceDate)} · ср. RPE ${exercise.recommendation.averageRpe}</div></div><button class="btn primary" data-action="apply-recommendation" data-exercise-id="${exercise.id}">${exercise.recommendationApplied?'Выбрано':'Применить'}</button></div><button class="btn tiny ghost" style="margin-top:8px" data-action="apply-plan" data-exercise-id="${exercise.id}">По плану</button></div>`:''}
    ${method?'<div class="method-strip"></div>':''}
    <div class="set-head"><span>Сет</span><span>кг</span><span>повт.</span><span>RPE</span><span></span></div>
    ${exercise.sets.map((set,index)=>`<div class="set-row"><span class="set-number">${index+1}</span><input inputmode="decimal" data-set-field="weight" data-exercise-id="${exercise.id}" data-set-id="${set.id}" value="${set.weight}"><input inputmode="numeric" data-set-field="reps" data-exercise-id="${exercise.id}" data-set-id="${set.id}" value="${set.reps}"><input inputmode="decimal" data-set-field="rpe" data-exercise-id="${exercise.id}" data-set-id="${set.id}" value="${set.rpe}"><button class="check ${set.done?'done':''}" data-action="toggle-set" data-exercise-id="${exercise.id}" data-set-id="${set.id}">${set.done?'✓':'○'}</button></div>`).join('')}
    ${history[0]?`<div class="exercise-note" style="margin:12px 0 0 42px">Прошлый: ${history[0].sets.map(set=>`${fmtNumber(set.weight)}×${set.reps}${set.rpe!==''?` @${set.rpe}`:''}`).join(' · ')} · ${history[0].date}</div>`:''}</div>`;
}

function renderStats(){
  const state=getState();
  const workouts=state.workouts.filter(item=>item.endedAt);
  const volume=workouts.reduce((sum,workout)=>sum+workout.exercises.flatMap(exercise=>exercise.sets).filter(set=>set.done).reduce((subtotal,set)=>subtotal+Number(set.weight||0)*Number(set.reps||0),0),0);
  const rpes=workouts.flatMap(workout=>workout.exercises.flatMap(exercise=>exercise.sets)).filter(set=>set.done&&set.rpe!=='').map(set=>Number(set.rpe)).filter(Number.isFinite);
  const muscles=muscleLoad(workouts,statsDays);
  const maxMuscle=Math.max(1,...muscles.map(item=>item.volume));
  const names=[...new Set(workouts.flatMap(workout=>workout.exercises.map(exercise=>canonicalExerciseName(exercise.name))))].sort((a,b)=>a.localeCompare(b,'ru'));
  if(!statsExercise)statsExercise=names[0]||'';
  const weightHistory=statsExercise?workoutWeightHistory(workouts,statsExercise):[];
  return `
    <div class="grid2"><div class="metric"><span>Тренировки</span><b>${workouts.length}</b></div><div class="metric"><span>Средний RPE</span><b>${rpes.length?fmtNumber(rpes.reduce((a,b)=>a+b,0)/rpes.length):'–'}</b></div></div>
    <div class="card"><div class="muted">Общий тоннаж</div><div class="big">${Math.round(volume).toLocaleString('ru-RU')} <small>кг</small></div></div>
    <div class="card"><div class="row between"><div><div class="title">Нагрузка по мышцам</div><div class="subtitle">Учитываются все распознанные мышечные группы</div></div><div class="button-row"><button class="btn tiny ${statsDays===7?'selected':''}" data-stats-days="7">7 дн.</button><button class="btn tiny ${statsDays===28?'selected':''}" data-stats-days="28">28 дн.</button></div></div><div class="muscle-list" style="margin-top:17px">${muscles.map(item=>`<div class="muscle-row"><span>${item.name}</span><div class="bar"><i style="width:${item.volume/maxMuscle*100}%"></i></div><b>${item.volume?item.volume.toLocaleString('ru-RU'):'0'}</b></div>`).join('')}</div></div>
    <div class="card"><div class="title">История тренировочных весов</div><div class="field"><select id="statsExercise">${names.map(name=>`<option value="${esc(name)}" ${name===statsExercise?'selected':''}>${esc(name)}</option>`).join('')}</select></div>${weightHistory.map(item=>`<div class="history-line"><div class="row between"><div><b>${fmtDate(item.date)} · до ${fmtNumber(item.maxWeight)} кг</b><div class="muted small">${item.sets.map(set=>`${fmtNumber(set.weight)}×${set.reps}${set.rpe!==''?` @RPE ${set.rpe}`:''}`).join(' · ')}</div></div><button class="btn tiny danger" data-action="delete-workout" data-workout-id="${item.workoutId}">Удалить</button></div></div>`).join('')||'<div class="empty">Записей пока нет.</div>'}</div>
    <div class="card"><div class="title">История веса тела</div>${bodyweightChart(state.bodyweights)}<button class="btn full" data-action="weight-history">Все записи</button></div>
    <div class="eyebrow">Все тренировки</div>${workouts.slice().sort((a,b)=>b.endedAt-a.endedAt).map(workout=>`<div class="card"><div class="row between"><div><b>${esc(workout.code)} · ${esc(workout.name)}</b><div class="subtitle">${fmtDate(workout.date)} · ${completeSets(workout)} подходов</div></div><button class="btn tiny" data-action="workout-detail" data-workout-id="${workout.id}">Открыть</button></div></div>`).join('')||'<div class="card empty">История пока пустая.</div>'}`;
}

function renderProfile(){
  const state=getState();
  const cloudLabel=cloud.user?cloud.profile?.display_name||cloud.user.email:'Вход не выполнен';
  const clients=state.profile.role==='trainer'?`<div class="eyebrow">Клиенты</div>${trainerClients.map(row=>`<div class="card"><b>${esc(row.profiles?.display_name||row.client_id)}</b><div class="subtitle">${esc(row.status||'active')}</div></div>`).join('')||'<div class="card empty">Клиенты появятся после синхронизации.</div>'}`:'';
  return `${profileMeasurementsCard(state)}<div class="card"><div class="title">Аккаунт</div><div class="subtitle">${esc(cloudLabel)}</div><div class="stack" style="margin-top:15px">${cloud.user?`<button class="btn primary full" data-action="cloud-sync">${cloud.syncing?'Синхронизация…':'Синхронизировать'}</button><button class="btn danger full" data-action="sign-out">Выйти</button>`:'<button class="btn primary full" data-action="sign-in">Войти по почте</button>'}</div></div>${clients}`;
}

function bodyweightChart(items){
  if(items.length<2)return '<div class="empty">Добавь минимум две записи для графика.</div>';
  const width=336,height=155,pad=20,values=items.map(item=>Number(item.value));
  const min=Math.min(...values),max=Math.max(...values),range=Math.max(.5,max-min);
  const points=items.map((item,index)=>({x:pad+index*(width-pad*2)/Math.max(1,items.length-1),y:height-pad-(Number(item.value)-min)*(height-pad*2)/range,item}));
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="График веса"><polyline points="${points.map(point=>`${point.x},${point.y}`).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${points.map((point,index)=>`<circle class="chart-point" cx="${point.x}" cy="${point.y}" r="6" data-action="weight-point" data-index="${index}" data-date="${point.item.date}" data-value="${point.item.value}"><title>${point.item.date}: ${point.item.value} кг</title></circle>`).join('')}<text class="chart-label" x="${pad}" y="${height-2}">${esc(items[0].date)}</text><text class="chart-label" text-anchor="end" x="${width-pad}" y="${height-2}">${esc(items.at(-1).date)}</text></svg>`;
}

function formatPercent(value){return `${Number(value)>0?'+':''}${fmtNumber(value)}%`}

function chooseWorkout(){
  const week=getState().preferences.week||1;
  openModal(`<div class="row between"><h2>Выбрать тренировку</h2><button class="btn tiny" data-action="close-modal">✕</button></div><div class="weekbar" style="margin-top:14px">${Array.from({length:8},(_,i)=>i+1).map(value=>`<button class="week ${value===week?'active':''}" data-picker-week="${value}">W${value}</button>`).join('')}</div><div id="pickerList">${pickerList(week)}</div>`);
}

function pickerList(week){
  return routines.filter(routine=>routine.w===Number(week)).map(routine=>`<button class="card routine full" data-action="routine" data-routine="${routine.w}:${esc(routine.c)}"><div style="text-align:left"><h3>${esc(routine.c)} · ${esc(routine.t)}</h3><div class="subtitle">RPE ${RPE[routine.w]} · ${routine.e.length} упражнений</div></div></button>`).join('');
}

function readinessSheet(routine){
  const scores={sleep:5,energy:5,stress:5,soreness:5};
  let manual=null;
  const labels={sleep:'Сон',energy:'Энергия',stress:'Стресс',soreness:'Восстановление'};
  const draw=()=>{
    const calculated=readinessAdjustment(scores);
    sheet.innerHTML=`<div class="grabber"></div><div class="row between"><div><h2>Самочувствие</h2><div class="subtitle">${esc(routine.c)} · ${esc(routine.t)}</div></div><button class="btn tiny" data-action="close-modal">✕</button></div>${Object.entries(labels).map(([key,label])=>`<div class="readiness-option"><b>${label}</b>${[1,2,3,4,5].map(value=>`<button class="score ${scores[key]===value?'active':''}" data-score-key="${key}" data-score="${value}">${value}</button>`).join('')}</div>`).join('')}<div class="card inset"><div class="row between"><div><b>Коррекция по самочувствию</b><div class="subtitle">Отлично: 0%. Отклонения: до −10%.</div></div><span class="chip accent">${formatPercent(calculated)}</span></div></div><div class="field"><label>Ручная коррекция, если нужна</label><div class="percent-picker">${[-10,-7.5,-5,-2.5,0,2.5,5,7.5,10].map(value=>`<button class="${manual===value?'active':''}" data-manual-percent="${value}">${formatPercent(value)}</button>`).join('')}</div></div><div class="stack"><button class="btn primary full" data-action="start-with-readiness" data-routine="${routine.w}:${esc(routine.c)}">Начать · ${formatPercent(manual??calculated)}</button><button class="btn full" data-action="start-plan" data-routine="${routine.w}:${esc(routine.c)}">По плану · 0%</button></div>`;
  };
  openModal('',()=>{});
  draw();
  const handler=event=>{
    const scoreButton=event.target.closest('[data-score-key]');
    if(scoreButton){scores[scoreButton.dataset.scoreKey]=Number(scoreButton.dataset.score);manual=null;draw();return}
    const manualButton=event.target.closest('[data-manual-percent]');
    if(manualButton){manual=Number(manualButton.dataset.manualPercent);draw();return}
    const startButton=event.target.closest('[data-action="start-with-readiness"],[data-action="start-plan"]');
    if(startButton){
      const percent=startButton.dataset.action==='start-plan'?0:(manual??readinessAdjustment(scores));
      startRoutine(routine,{scores,percent});
      sheet.removeEventListener('click',handler);
    }
  };
  sheet.addEventListener('click',handler);
  modalCleanup=()=>sheet.removeEventListener('click',handler);
}

function startRoutine(routine,{scores,percent}){
  const state=getState();
  if(state.activeWorkout&&completeSets(state.activeWorkout)>0&&!confirm('Текущая тренировка не завершена. Начать новую?'))return;
  const workout=createWorkout(routine,{targetRpe:RPE[routine.w]||8,readiness:{answers:scores,createdAt:Date.now()},manualPercent:percent,state});
  updateState(next=>{next.activeWorkout=workout;next.readinessLog.push({workoutId:workout.id,date:workout.date,answers:scores,adjustmentPercent:percent,createdAt:Date.now()})},{immediate:true});
  closeModal();
  setPage('workout');
}

function editProfileSheet(){
  const profile=getState().profile;
  openModal(`<div class="row between"><h2>Профиль</h2><button class="btn tiny" data-action="close-modal">✕</button></div><div class="field"><label>Имя</label><input id="profileName" value="${esc(profile.name)}"></div><div class="field"><label>Роль</label><select id="profileRole"><option value="client" ${profile.role==='client'?'selected':''}>Клиент</option><option value="trainer" ${profile.role==='trainer'?'selected':''}>Тренер</option></select></div><div class="field"><label>Схема тела</label><select id="profileSex"><option value="male" ${profile.sex==='male'?'selected':''}>Мужская</option><option value="female" ${profile.sex==='female'?'selected':''}>Женская</option></select></div><button class="btn primary full" data-action="save-profile">Сохранить</button>`);
}

function measurementsSheet(){
  const fields=[['chest','Грудь'],['waist','Талия'],['hips','Бёдра'],['arm','Бицепс'],['thigh','Бедро'],['calf','Икры']];
  openModal(`<div class="row between"><h2>Новые замеры</h2><button class="btn tiny" data-action="close-modal">✕</button></div><div class="grid2">${fields.map(([key,label])=>`<div class="field"><label>${label}, см</label><input id="measure-${key}" inputmode="decimal"></div>`).join('')}</div><button class="btn primary full" data-action="save-measurements">Сохранить</button>`);
}

function addWeightSheet(){
  const latest=getState().bodyweights.at(-1)?.value||'';
  openModal(`<div class="row between"><h2>Вес тела</h2><button class="btn tiny" data-action="close-modal">✕</button></div><div class="field"><label>Дата</label><input id="bodyweightDate" type="date" value="${isoDate()}"></div><div class="field"><label>Вес, кг</label><input id="bodyweightValue" inputmode="decimal" value="${latest}"></div><button class="btn primary full" data-action="save-weight">Сохранить</button>`);
}

function weightHistorySheet(){
  const rows=getState().bodyweights.slice().sort((a,b)=>b.date.localeCompare(a.date));
  openModal(`<div class="row between"><h2>История веса</h2><button class="btn tiny" data-action="close-modal">✕</button></div>${rows.map(item=>`<div class="history-line row between"><div><b>${fmtNumber(item.value)} кг</b><div class="muted small">${fmtDate(item.date)}</div></div><button class="btn tiny danger" data-action="delete-weight" data-date="${item.date}">Удалить</button></div>`).join('')||'<div class="empty">Записей пока нет.</div>'}`);
}

function exerciseHistorySheet(name){
  const history=workoutWeightHistory(getState().workouts,name);
  openModal(`<div class="row between"><div><h2>${esc(name)}</h2><div class="subtitle">История рабочих весов</div></div><button class="btn tiny" data-action="close-modal">✕</button></div>${history.map(item=>`<div class="history-line"><b>${fmtDate(item.date)} · до ${fmtNumber(item.maxWeight)} кг</b><div class="subtitle">${item.sets.map(set=>`${fmtNumber(set.weight)}×${set.reps}${set.rpe!==''?` @RPE ${set.rpe}`:''}`).join(' · ')}</div></div>`).join('')||'<div class="empty">Записей пока нет.</div>'}`);
}

function workoutDetailSheet(id){
  const workout=getState().workouts.find(item=>item.id===id);
  if(!workout)return;
  openModal(`<div class="row between"><div><h2>${esc(workout.code)} · ${esc(workout.name)}</h2><div class="subtitle">${fmtDate(workout.date)}</div></div><button class="btn tiny" data-action="close-modal">✕</button></div>${workout.exercises.map(exercise=>`<div class="history-line"><b>${esc(exercise.name)}</b><div class="subtitle">${exercise.sets.filter(set=>set.done).map(set=>`${fmtNumber(set.weight)}×${set.reps}${set.rpe!==''?` @RPE ${set.rpe}`:''}`).join(' · ')||'Нет выполненных подходов'}</div></div>`).join('')}<button class="btn danger full" data-action="delete-workout" data-workout-id="${workout.id}">Удалить тренировку</button>`);
}

function settingsSheet(){
  const profile=getState().profile;
  const colors=['#30d158','#0a84ff','#ff9f0a','#bf5af2','#ff375f','#64d2ff'];
  openModal(`<div class="row between"><h2>Настройки</h2><button class="btn tiny" data-action="close-modal">✕</button></div><div class="field"><label>Акцентный цвет</label><div class="button-row">${colors.map(color=>`<button class="score ${profile.accent===color?'active':''}" style="background:${color}" data-accent="${color}" aria-label="${color}"></button>`).join('')}</div></div><div class="stack"><button class="btn full" data-action="export-backup">Экспорт данных</button><label class="btn full">Импорт данных<input id="importBackup" type="file" accept="application/json" hidden></label><button class="btn full" data-action="cloud-sync">Синхронизировать</button></div><div class="subtitle" style="margin-top:16px">UNVRSL FIT v1.1.0 stable candidate · данные загружаются до показа интерфейса</div>`);
}

function finishWorkout(){
  const state=getState(),workout=state.activeWorkout;
  if(!workout)return;
  if(!completeSets(workout)&&!confirm('Нет отмеченных подходов. Завершить тренировку?'))return;
  workout.endedAt=Date.now();
  workout.updatedAt=workout.endedAt;
  updateState(next=>{next.workouts.push(workout);next.activeWorkout=null;learnFromHistory(next)},{immediate:true});
  toast('Тренировка сохранена');
  setPage('stats');
}

function deleteWorkout(id){
  if(!confirm('Удалить тренировку и её записи рабочих весов?'))return;
  updateState(state=>{
    state.workouts=state.workouts.filter(item=>item.id!==id);
    const existing=state.deletedWorkoutIds.find(item=>item.id===id);
    if(existing)existing.deletedAt=Date.now();else state.deletedWorkoutIds.push({id,deletedAt:Date.now()});
    state.learnedWeights={};
    learnFromHistory(state);
  },{immediate:true});
  closeModal();render();toast('Тренировка удалена');
}

function changeReadiness(){
  const workout=getState().activeWorkout;
  if(!workout)return;
  const answers=workout.readiness?.answers||{sleep:5,energy:5,stress:5,soreness:5};
  openModal(`<div class="row between"><h2>Коррекция веса</h2><button class="btn tiny" data-action="close-modal">✕</button></div><div class="subtitle">Меняет только незавершённые подходы. Рекомендации остаются отдельным выбором.</div><div class="percent-picker" style="margin-top:16px">${[-10,-7.5,-5,-2.5,0,2.5,5,7.5,10].map(value=>`<button class="${Number(workout.readiness?.adjustmentPercent)===value?'active':''}" data-change-percent="${value}">${formatPercent(value)}</button>`).join('')}</div><button class="btn primary full" style="margin-top:15px" data-action="apply-readiness-change">Сохранить</button>`);
  sheet.dataset.pendingPercent=String(workout.readiness?.adjustmentPercent||0);
  sheet.dataset.answers=JSON.stringify(answers);
}

async function refreshTrainerClients(){
  try{trainerClients=await loadTrainerClients();if(page==='profile')render()}catch(error){console.warn(error)}
}

document.querySelector('.nav').addEventListener('click',event=>{
  const button=event.target.closest('[data-page]');
  if(button)setPage(button.dataset.page);
});
document.querySelector('#settingsButton').addEventListener('click',settingsSheet);
modal.addEventListener('click',event=>{if(event.target===modal)closeModal()});
window.addEventListener('unvrsl:toast',event=>toast(event.detail));
window.addEventListener('unvrsl:cloud',()=>{if(cloud.profile?.role==='trainer')refreshTrainerClients();if(page==='profile')render()});
subscribe(()=>render());

document.addEventListener('change',async event=>{
  if(event.target.id==='statsExercise'){statsExercise=event.target.value;render();return}
  if(event.target.id==='importBackup'&&event.target.files?.[0]){
    try{await importBackup(event.target.files[0]);closeModal();toast('Данные импортированы')}catch{toast('Не удалось импортировать файл')}
    return;
  }
  const field=event.target.closest('[data-set-field]');
  if(field){
    const value=field.value===''?'':Number(String(field.value).replace(',','.'));
    updateState(state=>{
      const exercise=state.activeWorkout?.exercises.find(item=>item.id===field.dataset.exerciseId);
      const set=exercise?.sets.find(item=>item.id===field.dataset.setId);
      if(set)set[field.dataset.setField]=value;
    });
  }
});

document.addEventListener('click',async event=>{
  const actionNode=event.target.closest('[data-action]');
  const action=actionNode?.dataset.action;
  if(!action){
    const weekNode=event.target.closest('[data-week]');
    if(weekNode){updateState(state=>state.preferences.week=Number(weekNode.dataset.week));return}
    const tabNode=event.target.closest('[data-plan-tab]');
    if(tabNode){planTab=tabNode.dataset.planTab;render();return}
    const daysNode=event.target.closest('[data-stats-days]');
    if(daysNode){statsDays=Number(daysNode.dataset.statsDays);render();return}
    const pickerWeek=event.target.closest('[data-picker-week]');
    if(pickerWeek){sheet.querySelectorAll('[data-picker-week]').forEach(item=>item.classList.toggle('active',item===pickerWeek));sheet.querySelector('#pickerList').innerHTML=pickerList(pickerWeek.dataset.pickerWeek);return}
    const accent=event.target.closest('[data-accent]');
    if(accent){updateState(state=>state.profile.accent=accent.dataset.accent);settingsSheet();return}
    const changePercent=event.target.closest('[data-change-percent]');
    if(changePercent){sheet.dataset.pendingPercent=changePercent.dataset.changePercent;sheet.querySelectorAll('[data-change-percent]').forEach(item=>item.classList.toggle('active',item===changePercent));return}
    return;
  }
  if(action==='close-modal')return closeModal();
  if(action==='choose-workout')return chooseWorkout();
  if(action==='open-active')return setPage('workout');
  if(action==='routine'){
    const routine=routineMap.get(actionNode.dataset.routine);
    if(routine)return readinessSheet(routine);
  }
  if(action==='custom-routine'){
    const routine=customRoutine(Number(actionNode.dataset.program),Number(actionNode.dataset.day));
    if(routine)return readinessSheet(prepareRoutine(routine));
  }
  if(action==='add-weight')return addWeightSheet();
  if(action==='weight-history')return weightHistorySheet();
  if(action==='save-weight'){
    const date=sheet.querySelector('#bodyweightDate')?.value;
    const value=Number(String(sheet.querySelector('#bodyweightValue')?.value||'').replace(',','.'));
    if(!date||value<20||value>400)return toast('Проверь дату и вес');
    updateState(state=>{
      state.bodyweights=state.bodyweights.filter(item=>item.date!==date);
      state.bodyweights.push({date,value,updatedAt:Date.now()});
      state.bodyweights.sort((a,b)=>a.date.localeCompare(b.date));
      state.deletedBodyweights=state.deletedBodyweights.filter(item=>item.date!==date);
    },{immediate:true});
    closeModal();toast('Вес сохранён');return;
  }
  if(action==='delete-weight'){
    const date=actionNode.dataset.date;
    if(!confirm(`Удалить вес за ${fmtDate(date)}?`))return;
    updateState(state=>{
      state.bodyweights=state.bodyweights.filter(item=>item.date!==date);
      const existing=state.deletedBodyweights.find(item=>item.date===date);
      if(existing)existing.deletedAt=Date.now();else state.deletedBodyweights.push({date,deletedAt:Date.now()});
    },{immediate:true});
    weightHistorySheet();toast('Запись удалена');return;
  }
  if(action==='weight-point')return toast(`${fmtDate(actionNode.dataset.date)} · ${fmtNumber(actionNode.dataset.value)} кг`);
  if(action==='edit-profile')return editProfileSheet();
  if(action==='save-profile'){
    const name=sheet.querySelector('#profileName').value.trim(),role=sheet.querySelector('#profileRole').value,sex=sheet.querySelector('#profileSex').value;
    updateState(state=>{Object.assign(state.profile,{name,role,sex})},{immediate:true});
    if(cloud.user)try{await updateProfile({displayName:name||cloud.profile?.display_name,role})}catch(error){console.warn(error)}
    closeModal();if(role==='trainer')refreshTrainerClients();return;
  }
  if(action==='add-measurements')return measurementsSheet();
  if(action==='save-measurements'){
    const item={id:`measurement-${Date.now()}`,date:isoDate(),updatedAt:Date.now()};
    for(const key of ['chest','waist','hips','arm','thigh','calf'])item[key]=Number(String(sheet.querySelector(`#measure-${key}`)?.value||'').replace(',','.'))||null;
    updateState(state=>state.measurements.push(item),{immediate:true});closeModal();toast('Замеры сохранены');return;
  }
  if(action==='delete-measurement'){
    if(!confirm('Удалить запись замеров?'))return;
    updateState(state=>state.measurements=state.measurements.filter(item=>String(item.id||item.date||item.d)!==actionNode.dataset.id),{immediate:true});return;
  }
  if(action==='toggle-set'){
    updateState(state=>{
      const exercise=state.activeWorkout?.exercises.find(item=>item.id===actionNode.dataset.exerciseId);
      const set=exercise?.sets.find(item=>item.id===actionNode.dataset.setId);
      if(set)set.done=!set.done;
    },{immediate:true});return;
  }
  if(action==='apply-recommendation'){
    updateState(state=>{applyRecommendation(state.activeWorkout,actionNode.dataset.exerciseId)},{immediate:true});return;
  }
  if(action==='apply-plan'){
    updateState(state=>{applyPlanWeight(state.activeWorkout,actionNode.dataset.exerciseId)},{immediate:true});return;
  }
  if(action==='exercise-history')return exerciseHistorySheet(decodeURIComponent(actionNode.dataset.exercise));
  if(action==='finish-workout')return finishWorkout();
  if(action==='cancel-workout'){
    if(confirm('Отменить текущую тренировку?')){updateState(state=>state.activeWorkout=null,{immediate:true});toast('Тренировка отменена')}return;
  }
  if(action==='change-readiness')return changeReadiness();
  if(action==='apply-readiness-change'){
    const percent=Number(sheet.dataset.pendingPercent||0);
    updateState(state=>{
      const workout=state.activeWorkout;if(!workout)return;
      const previous=Number(workout.readiness?.adjustmentPercent||0);
      workout.readiness.adjustmentPercent=percent;
      workout.exercises.forEach(exercise=>{
        if(exercise.recommendation?.baseWeight)exercise.recommendation.weight=adjustedWeight(exercise.recommendation.baseWeight,percent);
        const baseline=exercise.recommendationApplied?exercise.recommendation?.weight:(exercise.planWeight||exercise.learnedWeight||0);
        const oldBaseline=exercise.recommendationApplied?(exercise.recommendation?.baseWeight||baseline):baseline;
        const oldValue=adjustedWeight(oldBaseline,previous),newValue=adjustedWeight(oldBaseline,percent);
        exercise.sets.forEach(set=>{if(!set.done&&(set.weight===oldValue||set.weight===''))set.weight=newValue||''});
      });
    },{immediate:true});closeModal();return;
  }
  if(action==='workout-detail')return workoutDetailSheet(actionNode.dataset.workoutId);
  if(action==='delete-workout')return deleteWorkout(actionNode.dataset.workoutId);
  if(action==='sign-in'){
    openModal(`<div class="row between"><h2>Вход</h2><button class="btn tiny" data-action="close-modal">✕</button></div><div class="field"><label>Почта</label><input id="signInEmail" type="email" placeholder="name@example.com"></div><button class="btn primary full" data-action="send-sign-in">Получить ссылку</button>`);return;
  }
  if(action==='send-sign-in'){
    const email=sheet.querySelector('#signInEmail')?.value.trim();if(!email)return toast('Введи почту');
    try{await signIn(email);openModal('<h2>Проверь почту</h2><div class="subtitle">Ссылка для входа отправлена.</div>')}catch(error){toast(error.message)}return;
  }
  if(action==='sign-out'){await signOut();render();return}
  if(action==='cloud-sync'){await syncNow();return}
  if(action==='export-backup'){exportBackup();return}
  if(action==='start-with-readiness'||action==='start-plan')return;
});

async function bootApplication(){
  try{
    loadState();
    await initCloud();
    const state=getState();
    if(cloud.profile){
      state.profile.name=state.profile.name||cloud.profile.display_name||'';
      state.profile.role=cloud.profile.role||state.profile.role;
      persistNow();
    }
    if(state.profile.role==='trainer')refreshTrainerClients();
    app.hidden=false;
    boot.hidden=true;
    setPage(state.activeWorkout?'workout':'home');
    if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(error=>console.warn('service worker',error));
  }catch(error){
    console.error(error);
    boot.classList.add('error');
    boot.querySelector('span').textContent='Не удалось безопасно загрузить данные. Обнови страницу или восстанови резервную копию.';
  }
}

bootApplication();
