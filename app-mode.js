'use strict';
const MASTER_TRAINER_EMAIL='butafutsiy@mail.ru';

function masterTrainerEmail(){return String(cloud?.user?.email||'').trim().toLowerCase()===MASTER_TRAINER_EMAIL}
function unvrslTrainerMode(){return masterTrainerEmail()||cloud?.profile?.role==='trainer'}
function assignedClientPrograms(){return (st.programs||[]).filter(p=>p&&p.cloudPlanId&&p.trainerId)}

const _modeCloudEnsureProfile=window.cloudEnsureProfile;
if(typeof _modeCloudEnsureProfile==='function')window.cloudEnsureProfile=async function(){
  const p=await _modeCloudEnsureProfile();
  if(masterTrainerEmail()&&cloud?.profile?.role!=='trainer'){
    const q=await cloud.client.from('profiles').update({role:'trainer',updated_at:new Date().toISOString()}).eq('id',cloud.user.id).select().single();
    if(q.data)cloud.profile=q.data;
  }
  if(masterTrainerEmail())ensureMasterTrainerPlan();
  return cloud.profile||p;
};

function ensureMasterTrainerPlan(){
  if(!masterTrainerEmail()||!Array.isArray(st.programs))return;
  let existing=st.programs.find(p=>p.isMasterPlan||/мой 8-недельный цикл/i.test(p.name||''));
  if(existing){existing.isMasterPlan=true;existing.ownerEmail=MASTER_TRAINER_EMAIL;save();return}
  if(typeof builtInGroupToProgramExercise!=='function'||typeof groupIndexedEntries!=='function')return;
  const weeks=[];
  for(let wi=1;wi<=8;wi++){
    const rs=ROUTINES.filter(r=>r.w===wi);
    weeks.push({n:wi,days:rs.map(r=>({id:uid('day'),name:`${r.c} · ${r.t}`,ex:groupIndexedEntries(routineEntries(r)).map(g=>builtInGroupToProgramExercise(r,g))}))});
  }
  st.programs.unshift({id:uid('prog'),name:'Мой план · 8 недель',isMasterPlan:true,ownerEmail:MASTER_TRAINER_EMAIL,created:Date.now(),updated:Date.now(),weeks});
  save();
}

const _modeHome=window.home;
window.home=function(){if(unvrslTrainerMode())return _modeHome();return clientCleanHome()};
const _modePlanPage=window.planPage;
window.planPage=function(){if(unvrslTrainerMode())return _modePlanPage();return clientCleanPlanPage()};
const _modeStartPage=window.startPage;
window.startPage=function(){if(unvrslTrainerMode()||st.current)return _modeStartPage();const el=$('#start');if(el)el.innerHTML=`<div class="card"><div class="title">Нет активной тренировки</div><div class="muted" style="margin-top:6px">Открой назначенный тренером план и выбери тренировку.</div><button class="btn primary full" style="margin-top:14px" onclick="nav('plan')">Мой план</button></div>`};
const _modeQuick=window.quick;
if(typeof _modeQuick==='function')window.quick=function(){if(unvrslTrainerMode())return _modeQuick();nav('plan');toast(cloud?.user?'Выбери тренировку из своего плана':'Сначала войди в аккаунт')};

function clientCleanHome(){
  const root=$('#home');if(!root)return;
  const ps=assignedClientPrograms(),p=ps[0],w=latestW();
  if(!cloud?.user){root.innerHTML=`<div class="card"><div class="muted">UNVRSL FIT</div><div class="title" style="margin-top:6px">Твои тренировки — только твои</div><div class="muted" style="margin-top:8px">Войди в аккаунт. До назначения тренером здесь не будет чужих или демонстрационных программ.</div><button class="btn primary full" style="margin-top:16px" onclick="cloudAccountSheet()">Войти</button></div>`;return}
  root.innerHTML=`<div class="card"><div class="muted">МОЙ ПЛАН</div>${p?`<div class="title" style="margin-top:6px">${esc(p.name)}</div><div class="muted" style="margin-top:6px">${p.weeks?.length||0} нед. · тренер: ${esc(p.trainerName||'назначен')}</div><button class="btn primary full" style="margin-top:16px" onclick="openClientProgram('${p.id}')">Открыть план</button>`:`<div class="title" style="margin-top:6px">План пока не назначен</div><div class="muted" style="margin-top:8px">Когда тренер отправит программу, она появится здесь автоматически.</div>`}</div><div class="card"><div class="weight-top"><div><div class="muted">Вес тела</div><div class="big">${w??'—'}${w?' <span class="muted" style="font-size:20px">кг</span>':''}</div></div><div class="weight-actions"><button onclick="weight()">＋ Записать</button></div></div>${weightChart(true)}</div><div class="card"><div class="row between"><div><div class="muted">Выполнено тренировок</div><div class="title">${st.sessions?.length||0}</div></div><button class="btn" onclick="nav('stats')">Статистика</button></div></div>`;
}

function clientCleanPlanPage(){
  const root=$('#plan');if(!root)return;const ps=assignedClientPrograms();
  if(!cloud?.user){root.innerHTML=`<div class="card"><div class="title">Мой план</div><div class="muted" style="margin-top:7px">Войди, чтобы получить программу от тренера.</div><button class="btn primary full" style="margin-top:14px" onclick="cloudAccountSheet()">Войти</button></div>`;return}
  let pending='';if(typeof cloudPendingProgramsHtml==='function')pending=cloudPendingProgramsHtml();
  root.innerHTML=`${pending}<div class="section">МОЯ ПРОГРАММА</div>${ps.length?ps.map(p=>`<div class="card routine"><div class="row between"><div class="grow"><div class="title">${esc(p.name)}</div><div class="muted">${p.weeks?.length||0} нед. · версия ${p.cloudVersion||1}</div></div><button class="btn primary" onclick="openClientProgram('${p.id}')">Открыть</button></div></div>`).join(''):`<div class="card"><div class="title">Пока пусто</div><div class="muted" style="margin-top:7px">Здесь будет только программа, которую назначит тренер.</div></div>`}`;
}

function openClientProgram(id,wi=0){
  const p=programById(id);if(!p)return;const w=p.weeks?.[wi]||p.weeks?.[0];if(!w)return;
  modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${esc(p.name)}</h2><div class="muted">Тренировочная программа</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="weekbar">${p.weeks.map((x,i)=>`<button class="weekbtn ${i===wi?'on':''}" onclick="openClientProgram('${p.id}',${i})">W${i+1}</button>`).join('')}</div><div class="section">НЕДЕЛЯ ${wi+1}</div>${w.days.map((d,di)=>`<div class="card program-day"><div class="row between"><div class="grow"><b>${esc(d.name)}</b><div class="muted small">${d.ex?.length||0} упражнений</div></div><button class="btn primary" onclick="beginProgramDay('${p.id}',${wi},${di})">Старт</button></div>${(d.ex||[]).map(e=>`<div class="program-ex"><b>${esc(e.n)}</b><div class="muted small">${typeof prescriptionText==='function'?esc(prescriptionText(e)):''}${e.rpe?` · RPE ${e.rpe}`:''}${e.tempo?` · темп ${esc(e.tempo)}`:''}</div></div>`).join('')}</div>`).join('')}`)
}

const _modeCloudAccountSheet=window.cloudAccountSheet;
window.cloudAccountSheet=function(){
  if(!cloudConfigured()||!cloud?.user)return _modeCloudAccountSheet();
  const role=unvrslTrainerMode()?'Тренер':'Клиент';
  modal(`<div class="sheet-grabber"></div><h2>${esc(cloud.profile?.display_name||'Аккаунт')}</h2><div class="muted">${esc(cloud.user.email||'')}</div><div class="settings-card"><div class="setting"><div><b>Роль</b><div class="muted small">${role}</div></div><span class="chip green">${role}</span></div><div class="setting"><div><b>Имя</b></div><button class="btn tiny" onclick="cloudRenameSheet()">Изменить</button></div><div class="setting"><div><b>Синхронизация</b><div class="muted small">Тренировки и вес</div></div><button class="btn tiny" onclick="cloudSyncAll()">Синхр.</button></div></div><button class="btn danger full" onclick="cloudSignOut()">Выйти</button>`)
};

const CURATED_RULES=[
 {ru:'Присед со штангой с высокой постановкой грифа',all:['barbell','squat'],any:['high bar','full squat'],not:['front','zercher','hack']},
 {ru:'Фронтальный присед со штангой',all:['barbell','front squat']},
 {ru:'Болгарский сплит-присед с гантелями',all:['dumbbell','bulgarian','split squat']},
 {ru:'Обратные выпады с гантелями',all:['dumbbell','lunge'],any:['reverse','backward']},
 {ru:'Зашагивания с гантелями',all:['dumbbell','step-up']},
 {ru:'Жим ногами',all:['leg press'],not:['calf']},
 {ru:'Разгибание ног в тренажёре',all:['leg extension']},
 {ru:'Сгибание ног лёжа',all:['leg curl'],any:['lying','prone']},
 {ru:'Сгибание ног сидя',all:['leg curl','seated']},
 {ru:'Румынская тяга со штангой',all:['barbell','romanian deadlift']},
 {ru:'Румынская тяга с гантелями',all:['dumbbell','romanian deadlift']},
 {ru:'Ягодичный мост со штангой',all:['barbell'],any:['hip thrust','glute bridge']},
 {ru:'Отведение бёдер в тренажёре',any:['hip abduction','abductor'],not:['cable','band']},
 {ru:'Приведение бёдер в тренажёре',any:['hip adduction','adductor'],not:['cable','band']},
 {ru:'Подъём на носки стоя',all:['calf raise'],any:['standing','lever']},
 {ru:'Подъём на носки сидя',all:['calf raise','seated']},
 {ru:'Жим штанги лёжа',all:['barbell','bench press'],not:['incline','decline','close grip','close-grip','reverse']},
 {ru:'Жим штанги на наклонной скамье',all:['barbell','incline','bench press']},
 {ru:'Жим гантелей лёжа',all:['dumbbell','bench press'],not:['incline','decline']},
 {ru:'Жим гантелей на наклонной скамье',all:['dumbbell','incline','bench press']},
 {ru:'Сведение рук в кроссовере',all:['cable'],any:['crossover','fly'],not:['reverse']},
 {ru:'Сведение рук в тренажёре',any:['pec deck','chest fly'],not:['reverse']},
 {ru:'Отжимания от пола',all:['push-up'],not:['incline','decline','diamond','pike']},
 {ru:'Подтягивания прямым хватом',all:['pull-up'],not:['assisted','weighted','neutral']},
 {ru:'Подтягивания обратным хватом',all:['chin-up'],not:['assisted','weighted']},
 {ru:'Подтягивания в гравитроне',all:['assisted'],any:['pull-up','chin-up']},
 {ru:'Тяга верхнего блока к груди',all:['cable'],any:['lat pulldown','pulldown'],not:['behind','one arm','single arm']},
 {ru:'Тяга верхнего блока одной рукой',all:['cable'],any:['pulldown','lat pulldown'],any2:['one arm','single arm']},
 {ru:'Тяга штанги в наклоне',all:['barbell'],any:['bent over row','bent-over row'],not:['reverse grip']},
 {ru:'Тяга Т-грифа',any:['t-bar row','t bar row']},
 {ru:'Тяга нижнего блока сидя',all:['cable','seated'],any:['row','rowing'],not:['upright']},
 {ru:'Тяга гантели одной рукой',all:['dumbbell'],any:['one arm row','single arm row','one-arm row']},
 {ru:'Тяга каната к лицу',all:['cable'],any:['face pull']},
 {ru:'Гиперэкстензия',any:['hyperextension','back extension'],not:['45 degree side']},
 {ru:'Армейский жим стоя',all:['barbell'],any:['military press','overhead press'],not:['seated']},
 {ru:'Жим гантелей сидя',all:['dumbbell','seated'],any:['shoulder press','overhead press']},
 {ru:'Жим в тренажёре на плечи',any:['lever shoulder press','machine shoulder press']},
 {ru:'Махи гантелей в стороны',all:['dumbbell','lateral raise']},
 {ru:'Разведение на заднюю дельту в тренажёре',any:['reverse pec deck','rear delt fly']},
 {ru:'Разведение гантелей на заднюю дельту',all:['dumbbell'],any:['rear delt','reverse fly']},
 {ru:'Сгибание рук со штангой',all:['barbell','curl'],not:['preacher','reverse','wrist','drag']},
 {ru:'Сгибание рук с EZ-штангой',all:['ez','curl'],not:['preacher','reverse','wrist']},
 {ru:'Сгибание рук на скамье Скотта',any:['preacher curl','preacher'],not:['reverse']},
 {ru:'Молотковые сгибания с гантелями',all:['dumbbell','hammer curl']},
 {ru:'Сгибание рук на нижнем блоке',all:['cable','curl'],not:['wrist','reverse']},
 {ru:'Разгибание рук с канатом на верхнем блоке',all:['cable'],any:['rope pushdown','pushdown'],not:['reverse grip','one arm']},
 {ru:'Разгибание рук на верхнем блоке',all:['cable','pushdown'],not:['rope','reverse grip','one arm']},
 {ru:'Французский жим с EZ-штангой',all:['ez'],any:['triceps extension','skull crusher','skullcrusher']},
 {ru:'Разгибание гантели из-за головы',all:['dumbbell'],any:['overhead triceps extension','triceps extension'],any2:['one arm','single arm']},
 {ru:'Отжимания на брусьях',any:['chest dip','triceps dip'],not:['assisted']},
 {ru:'Планка',all:['plank'],not:['side','reverse']},
 {ru:'Скручивания',all:['crunch'],not:['cable','reverse','bicycle']},
 {ru:'Подъём ног в висе',all:['hanging'],any:['leg raise','knee raise']},
 {ru:'Велосипедные скручивания',any:['air bike','bicycle crunch']}
];
function ruleMatchesName(name,r){const s=String(name||'').toLowerCase();if(r.all&&!r.all.every(x=>s.includes(x)))return false;if(r.any&&!r.any.some(x=>s.includes(x)))return false;if(r.any2&&!r.any2.some(x=>s.includes(x)))return false;if(r.not&&r.not.some(x=>s.includes(x)))return false;return true}
function curatedBuiltinRecords(){
  if(!Array.isArray(ogLibrary)||!ogLibrary.length)return[];const out=[];
  CURATED_RULES.forEach(r=>{const hits=ogLibrary.filter(e=>ruleMatchesName(e.n,r)).sort((a,b)=>{const am=(a.image||a.gif)?0:1,bm=(b.image||b.gif)?0:1;return am-bm+String(a.n).length/1000-String(b.n).length/1000});const e=hits[0];if(e)out.push({...e,id:`og:${e.id}`,rawId:e.id,n:r.ru,sourceName:e.n,custom:false,curated:true})});
  return out;
}
function visibleProgramExerciseNames(){const names=[];const ps=unvrslTrainerMode()?(st.programs||[]):assignedClientPrograms();ps.forEach(p=>p.weeks?.forEach(w=>w.days?.forEach(d=>d.ex?.forEach(e=>{if(e.n&&!names.includes(e.n))names.push(e.n)}))));if(unvrslTrainerMode())ROUTINES.forEach(r=>routineEntries(r).forEach(e=>{const b=baseExerciseName(e.n);if(b&&!names.includes(b))names.push(b)}));return names}
window.customCatalog=function(){const names=visibleProgramExerciseNames();(st.customExercises||[]).forEach(e=>{if(e.n&&!names.includes(e.n))names.push(e.n)});return names.map(n=>({id:`custom:${n}`,n:displayExerciseName(n),raw:n,...inferCustomMeta(n),custom:true}))};
window.catalogRecords=function(){const all=[...customCatalog(),...curatedBuiltinRecords()],seen=new Set();return all.filter(e=>{const k=(e.custom?displayExerciseName(e.n):e.n).toLowerCase();if(seen.has(k))return false;seen.add(k);return true})};

const _modeExercisesPage=window.exercisesPage;
window.exercisesPage=function(){_modeExercisesPage();const c=$('#catalogCount');if(c)c.textContent=ogLibraryLoaded?`Основная база · ${catalogRecords().length} упражнений`:'Загружаю упражнения…';const chip=document.querySelector('#exercises .catalog-head .chip');if(chip)chip.textContent='Отобранные'};
const _modeRefreshCatalogUI=window.refreshCatalogUI;
window.refreshCatalogUI=function(){_modeRefreshCatalogUI();const c=$('#catalogCount');if(c&&ogLibraryLoaded)c.textContent=`Основная база · ${catalogRecords().length} упражнений`};
const _modeSettingsSheet=window.settingsSheet;
window.settingsSheet=function(){_modeSettingsSheet();document.querySelectorAll('#sheet .setting').forEach(row=>{const b=row.querySelector('b');if(b?.textContent.trim()==='Русская база упражнений'){const s=row.querySelector('.muted.small');if(s)s.textContent=`${catalogRecords().length||CURATED_RULES.length} отобранных упражнений · правильные русские названия, картинки и анимации`}})};

setTimeout(()=>{if(masterTrainerEmail())ensureMasterTrainerPlan();render();},50);
