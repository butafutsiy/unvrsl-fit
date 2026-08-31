'use strict';
(()=>{
  if(window.__unvrslCalendarPlannerV234)return;
  window.__unvrslCalendarPlannerV234=true;
  const W=window,BUILTIN='__builtin_cycle__',ui={date:null,pid:null,week:1};
  const S=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const calendar=()=>{const state=S();if(!state.calendarPlans||typeof state.calendarPlans!=='object'||Array.isArray(state.calendarPlans))state.calendarPlans={};return state.calendarPlans};
  const originalPlanned=typeof W.plannedForDate==='function'?W.plannedForDate:null;
  calendar();

  const style=document.createElement('style');
  style.id='calendar-planner-v234-style';
  style.textContent=`
    #home .datecell{cursor:pointer;touch-action:manipulation;border-radius:15px;transition:background .15s,transform .15s}
    #home .datecell:active{transform:scale(.96);background:#242428}
    #home .datecell.has-calendar-plan .dot{background:var(--green)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--green) 16%,transparent)}
    #home .datecell.has-calendar-session .dot{background:#ffd60a!important}
    .cp234-head{display:grid;grid-template-columns:minmax(0,1fr) 44px;gap:12px;align-items:start}.cp234-head h2{margin:0}.cp234-close{width:44px!important;height:44px!important;padding:0!important;display:grid!important;place-items:center!important}
    .cp234-card{margin-top:15px;padding:15px;border-radius:19px;background:#202024;border:1px solid #303036}.cp234-kicker{font-size:11px;color:#8e8e93;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.cp234-title{font-size:20px;line-height:1.15;font-weight:820;margin-top:6px}.cp234-meta{font-size:13px;color:#8e8e93;margin-top:6px;line-height:1.35}.cp234-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:13px}.cp234-actions .btn{min-width:0}.cp234-danger{color:#ff6961!important;background:#351b1d!important}
    .cp234-programs{display:flex;gap:8px;overflow-x:auto;padding:2px 1px 7px;scrollbar-width:none}.cp234-programs::-webkit-scrollbar{display:none}.cp234-program{min-width:190px;flex:0 0 auto;text-align:left;padding:12px 13px;border-radius:16px;background:#202024;border:1px solid #303036}.cp234-program.on{border-color:var(--green);background:color-mix(in srgb,var(--green) 10%,#202024)}.cp234-program b{display:block;font-size:14px}.cp234-program span{display:block;color:#85858b;font-size:11px;margin-top:4px}
    .cp234-days{margin-top:10px}.cp234-day{width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:13px 2px;border-bottom:1px solid #303034;text-align:left}.cp234-day:last-child{border-bottom:0}.cp234-day b{display:block;font-size:16px}.cp234-day span{display:block;color:#85858b;font-size:12px;margin-top:4px}.cp234-add{font-size:22px;color:var(--green)}
    @media(max-width:390px){.cp234-actions{grid-template-columns:1fr}.cp234-title{font-size:18px}.cp234-program{min-width:174px}}
  `;
  document.head.appendChild(style);

  const escx=v=>typeof W.esc==='function'?W.esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const dateKey=value=>{
    if(typeof value==='string')return String(value).slice(0,10);
    try{return typeof W.iso==='function'?W.iso(value):new Date(value).toISOString().slice(0,10)}catch(_){return''}
  };
  const dateValue=key=>{try{return typeof W.parseDate==='function'?W.parseDate(key):new Date(`${key}T12:00:00`)}catch(_){return new Date(`${key}T12:00:00`)}};
  const routines=()=>{try{return typeof ROUTINES!=='undefined'?ROUTINES:(W.UNVRSL_ROUTINES||[])}catch(_){return W.UNVRSL_ROUTINES||[]}};
  const programById=id=>(S().programs||[]).find(p=>String(p?.id||'')===String(id||''));
  const originalFor=value=>originalPlanned?originalPlanned.call(W,value):null;
  const entryFor=value=>calendar()[dateKey(value)]||null;

  function clientMode(){
    if(!W.cloud?.user)return false;
    if(typeof W.unvrslTrainerMode==='function')return !W.unvrslTrainerMode();
    if(typeof W.trainerIsTrainer==='function')return !W.trainerIsTrainer();
    return W.cloud?.profile?.role!=='trainer';
  }
  function activeAssignment(p){
    if(!clientMode())return true;
    if(typeof W.clientHasActivePlan==='function')return !!W.clientHasActivePlan(p?.cloudPlanId);
    const uid=String(W.cloud?.user?.id||''),ids=(Array.isArray(S().clientAssignedPlanIds)?S().clientAssignedPlanIds:[]).map(String);
    return !!uid&&String(S().clientAssignedUserId||'')===uid&&S().clientAssignmentsLoaded===true&&p?.cloudPlanId&&ids.includes(String(p.cloudPlanId));
  }
  function programs(){
    const out=[];
    if(!clientMode()&&!S().builtinProgramHidden)out.push({id:BUILTIN,name:typeof W.unvrslBuiltInProgramName==='function'?W.unvrslBuiltInProgramName():(S().builtinProgramName||'Мой план · 8 недель'),weeks:8,builtin:true,kind:'Встроенный цикл'});
    (Array.isArray(S().programs)?S().programs:[]).forEach(p=>{if(!p||p.archived||!Array.isArray(p.weeks)||!p.weeks.length||!activeAssignment(p))return;out.push({id:String(p.id),name:p.name||'Программа',weeks:p.weeks.length,builtin:false,p,kind:clientMode()?'Назначена тренером':'Моя программа'})});
    return out;
  }
  function normalized(entry,key){
    if(!entry||entry.removed)return null;
    if(entry.kind==='builtin'){
      const r=routines().find(x=>Number(x.w)===Number(entry.week)&&String(x.c)===String(entry.code));
      return r?{...r,__calendar:{kind:'builtin',source:'manual',date:key,week:Number(entry.week),code:String(entry.code)}}:null
    }
    if(entry.kind==='program'){
      const p=programById(entry.programId),d=p?.weeks?.[Number(entry.weekIndex)]?.days?.[Number(entry.dayIndex)];
      return p&&d?{w:Number(entry.weekIndex)+1,c:d.name||`День ${Number(entry.dayIndex)+1}`,t:p.name||'Программа',e:d.ex||[],__calendar:{kind:'program',source:'manual',date:key,programId:String(p.id),weekIndex:Number(entry.weekIndex),dayIndex:Number(entry.dayIndex)}}:null
    }
    return null
  }
  function planForDate(value){
    const key=dateKey(value),entry=entryFor(key);
    if(entry)return normalized(entry,key);
    const base=originalFor(dateValue(key));
    return base?{...base,__calendar:{kind:'builtin',source:'cycle',date:key,week:Number(base.w),code:String(base.c)}}:null
  }
  W.calendarPlanForDateV234=planForDate;
  W.plannedForDate=planForDate;try{plannedForDate=planForDate}catch(_){}

  function refresh(){try{W.save?.()}catch(_){}try{W.home?.()}catch(_){}setTimeout(decorate,0)}
  function dateTitle(key){return new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(dateValue(key))}
  function planTitle(plan){return plan?`${plan.c||'Тренировка'}${plan.t?` · ${plan.t}`:''}`:'День отдыха'}
  function previewPlan(plan){
    const m=plan?.__calendar;if(!plan||!m)return;
    if(m.kind==='program'){
      if(typeof W.previewPrimaryProgramDay==='function')return W.previewPrimaryProgramDay(m.programId,m.weekIndex,m.dayIndex);
      return W.beginProgramDay?.(m.programId,m.weekIndex,m.dayIndex)
    }
    if(typeof W.preview==='function')return W.preview(m.week,m.code)
  }
  W.calendarPlannerPreviewDateV234=token=>previewPlan(planForDate(decodeURIComponent(String(token||''))));

  W.calendarPlannerOpenDayV234=token=>{
    const key=decodeURIComponent(String(token||'')),plan=planForDate(key),entry=entryFor(key),base=originalFor(dateValue(key)),completed=(S().sessions||[]).filter(s=>String(s?.date||'').slice(0,10)===key).length;
    const planHtml=plan?`<div class="cp234-card"><div class="cp234-kicker">${plan.__calendar?.source==='cycle'?'По тренировочному циклу':'Добавлено вручную'}</div><div class="cp234-title">${escx(planTitle(plan))}</div><div class="cp234-meta">${plan.w?`Неделя ${plan.w}`:'Запланировано'}${completed?` · выполнено: ${completed}`:''}</div><div class="cp234-actions"><button class="btn primary" onclick="calendarPlannerPreviewDateV234('${encodeURIComponent(key)}')">Посмотреть</button><button class="btn cp234-danger" onclick="calendarPlannerDeleteV234('${encodeURIComponent(key)}')">Удалить</button></div></div>`:`<div class="cp234-card"><div class="cp234-kicker">Свободный день</div><div class="cp234-title">Тренировка не запланирована</div>${completed?`<div class="cp234-meta">Выполненных тренировок: ${completed}</div>`:''}</div>`;
    const restore=base&&entry?`<button class="btn full" style="margin-top:9px" onclick="calendarPlannerRestoreV234('${encodeURIComponent(key)}')">Вернуть по тренировочному циклу</button>`:'';
    W.modal?.(`<div class="sheet-grabber"></div><div class="cp234-head"><div><h2>${escx(dateTitle(key))}</h2><div class="muted">Планирование тренировки</div></div><button class="btn cp234-close" onclick="closeModal()">×</button></div>${planHtml}<button class="btn primary full" style="margin-top:12px" onclick="calendarPlannerAddV234('${encodeURIComponent(key)}')">${plan?'Изменить тренировку':'＋ Добавить тренировку'}</button>${restore}`)
  };
  W.calendarPlannerDeleteV234=token=>{
    const key=decodeURIComponent(String(token||''));
    if(!planForDate(key))return;
    if(!confirm('Удалить запланированную тренировку из календаря?'))return;
    if(originalFor(dateValue(key)))calendar()[key]={removed:true,updatedAt:Date.now()};else delete calendar()[key];
    refresh();W.closeModal?.();W.toast?.('Тренировка удалена из календаря')
  };
  W.calendarPlannerRestoreV234=token=>{const key=decodeURIComponent(String(token||''));delete calendar()[key];refresh();W.closeModal?.();W.toast?.('План тренировки восстановлен')};

  function defaultWeek(p,key){
    if(p?.builtin){const base=originalFor(dateValue(key));return Math.max(1,Math.min(8,Number(base?.w||S().week||1)))}
    const saved=Number(S().primaryProgramWeeks?.[p.id]||S().startProgramWeeks?.[p.id]||1);return Math.max(1,Math.min(p?.weeks||1,saved||1))
  }
  function pickerMarkup(){
    const ps=programs(),p=ps.find(x=>x.id===ui.pid)||ps.find(x=>x.id===String(S().primaryProgramId||''))||ps[0];
    if(!p)return `<div class="sheet-grabber"></div><div class="cp234-head"><div><h2>Добавить тренировку</h2><div class="muted">Нет доступных программ</div></div><button class="btn cp234-close" onclick="closeModal()">×</button></div>`;
    ui.pid=p.id;ui.week=Math.max(1,Math.min(p.weeks,Number(ui.week)||defaultWeek(p,ui.date)));
    const programButtons=ps.map(x=>`<button class="cp234-program ${x.id===p.id?'on':''}" onclick="calendarPlannerChooseProgramV234('${encodeURIComponent(x.id)}')"><b>${escx(x.name)}</b><span>${escx(x.kind)} · ${x.weeks} нед.</span></button>`).join('');
    const weeks=Array.from({length:p.weeks},(_,i)=>i+1).map(n=>`<button class="weekbtn ${n===ui.week?'on':''}" onclick="calendarPlannerChooseWeekV234(${n})">W${n}</button>`).join('');
    const rows=p.builtin?routines().filter(r=>Number(r.w)===ui.week).map(r=>`<button class="cp234-day" onclick="calendarPlannerAssignBuiltinV234(${ui.week},'${encodeURIComponent(r.c)}')"><span><b>${escx(`${r.c} · ${r.t}`)}</b><span>RPE ${typeof RPE!=='undefined'?(RPE[ui.week]??'—'):'—'} · ${r.e?.length||0} упражнений</span></span><i class="cp234-add">＋</i></button>`).join(''):(p.p?.weeks?.[ui.week-1]?.days||[]).map((d,di)=>`<button class="cp234-day" onclick="calendarPlannerAssignProgramV234('${encodeURIComponent(p.id)}',${ui.week-1},${di})"><span><b>${escx(d.name||`День ${di+1}`)}</b><span>${d.ex?.length||0} упражнений</span></span><i class="cp234-add">＋</i></button>`).join('');
    return `<div class="sheet-grabber"></div><div class="cp234-head"><div><h2>Добавить тренировку</h2><div class="muted">${escx(dateTitle(ui.date))}</div></div><button class="btn cp234-close" onclick="calendarPlannerOpenDayV234('${encodeURIComponent(ui.date)}')" aria-label="Назад">‹</button></div><div class="section">ПРОГРАММА</div><div class="cp234-programs">${programButtons}</div><div class="weekbar">${weeks}</div><div class="cp234-days">${rows||'<div class="cp234-card muted">В этой неделе тренировок нет.</div>'}</div>`
  }
  function renderPicker(){W.modal?.(pickerMarkup())}
  W.calendarPlannerAddV234=token=>{ui.date=decodeURIComponent(String(token||''));const ps=programs(),entry=entryFor(ui.date);ui.pid=entry?.kind==='program'?String(entry.programId):entry?.kind==='builtin'?BUILTIN:String(S().primaryProgramId||'');const p=ps.find(x=>x.id===ui.pid)||ps[0];ui.week=entry?.kind==='program'?Number(entry.weekIndex)+1:entry?.kind==='builtin'?Number(entry.week):defaultWeek(p,ui.date);renderPicker()};
  W.calendarPlannerChooseProgramV234=token=>{ui.pid=decodeURIComponent(String(token||''));ui.week=defaultWeek(programs().find(x=>x.id===ui.pid),ui.date);renderPicker()};
  W.calendarPlannerChooseWeekV234=week=>{ui.week=Number(week)||1;renderPicker()};
  W.calendarPlannerAssignBuiltinV234=(week,token)=>{const key=ui.date,code=decodeURIComponent(String(token||''));calendar()[key]={kind:'builtin',week:Number(week),code,updatedAt:Date.now()};refresh();W.closeModal?.();W.toast?.('Тренировка добавлена в календарь')};
  W.calendarPlannerAssignProgramV234=(token,weekIndex,dayIndex)=>{const key=ui.date,pid=decodeURIComponent(String(token||''));calendar()[key]={kind:'program',programId:pid,weekIndex:Number(weekIndex),dayIndex:Number(dayIndex),updatedAt:Date.now()};refresh();W.closeModal?.();W.toast?.('Тренировка добавлена в календарь')};

  function decorate(){
    const root=document.getElementById('home');if(!root)return;
    let shownDate=new Date();try{if(typeof viewDate!=='undefined')shownDate=viewDate;else if(W.viewDate)shownDate=W.viewDate}catch(_){}
    const monday=typeof W.getMonday==='function'?W.getMonday(shownDate):new Date(),cells=[...root.querySelectorAll('.calendar-card .datecell')];
    cells.forEach((cell,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);const key=dateKey(d),plan=planForDate(key),session=(S().sessions||[]).some(s=>String(s?.date||'').slice(0,10)===key);cell.dataset.calendarDate=key;cell.classList.toggle('has-calendar-plan',!!plan);cell.classList.toggle('has-calendar-session',session);cell.setAttribute('role','button');cell.setAttribute('tabindex','0');cell.setAttribute('aria-label',`${dateTitle(key)}. ${plan?planTitle(plan):'Тренировка не запланирована'}`);cell.onclick=()=>W.calendarPlannerOpenDayV234(encodeURIComponent(key));cell.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();W.calendarPlannerOpenDayV234(encodeURIComponent(key))}}});
    const todayKey=dateKey(new Date()),todayPlan=planForDate(todayKey),plus=root.querySelector('.calendar-card .today-card .plus');
    if(plus){plus.removeAttribute('onclick');plus.onclick=e=>{e.stopPropagation();todayPlan?W.calendarPlannerPreviewDateV234(encodeURIComponent(todayKey)):W.calendarPlannerAddV234(encodeURIComponent(todayKey))}}
    const todayCard=root.querySelector('.calendar-card .today-card');if(todayCard){todayCard.onclick=e=>{if(!e.target.closest('.plus'))W.calendarPlannerOpenDayV234(encodeURIComponent(todayKey))}}
    const nextCard=[...root.querySelectorAll(':scope > .card')].find(x=>/^\s*Ближайшая тренировка/i.test(x.textContent||''));if(nextCard&&typeof W.nextPlan==='function'){const next=W.nextPlan(),button=nextCard.querySelector('button');if(next?.d&&button){button.removeAttribute('onclick');button.onclick=()=>W.calendarPlannerOpenDayV234(encodeURIComponent(dateKey(next.d)))}}
  }
  W.calendarPlannerDecorateV234=decorate;
  const baseHome=W.home;
  if(typeof baseHome==='function'){
    const wrapped=function(){const result=baseHome.apply(this,arguments);setTimeout(decorate,0);return result};wrapped.__calendarPlannerV234=true;wrapped.__calendarPlannerBase=baseHome;W.home=wrapped;try{home=wrapped}catch(_){}
  }
  [0,150,600,1500].forEach(t=>setTimeout(()=>{decorate()},t));
})();
