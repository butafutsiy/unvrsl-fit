'use strict';
(()=>{
  const W=window,D=document,REV=390;
  if(W.__unvrslOfflineScheduleV390)return;
  W.__unvrslOfflineScheduleV390=true;

  const DAYS=[
    {n:1,short:'ПН',name:'Понедельник'},
    {n:2,short:'ВТ',name:'Вторник'},
    {n:3,short:'СР',name:'Среда'},
    {n:4,short:'ЧТ',name:'Четверг'},
    {n:5,short:'ПТ',name:'Пятница'},
    {n:6,short:'СБ',name:'Суббота'},
    {n:7,short:'ВС',name:'Воскресенье'}
  ];
  const cache={selectedDay:weekday(new Date()),clients:[],slots:[],blocks:[],events:[],exceptions:[],loaded:false,renderToken:0};

  const A=value=>Array.isArray(value)?value:[];
  const E=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const money=cents=>(Number(cents||0)/100).toLocaleString('ru-RU',{maximumFractionDigits:0})+' ₽';
  const time=value=>String(value||'').slice(0,5);
  const localDate=value=>{
    const date=value instanceof Date?value:new Date(value);
    const shifted=new Date(date.getTime()-date.getTimezoneOffset()*60000);
    return shifted.toISOString().slice(0,10)
  };
  const dateObject=value=>new Date(`${String(value).slice(0,10)}T12:00:00`);
  function weekday(value){const d=value instanceof Date?value:dateObject(value);return d.getDay()||7}
  function monday(value=new Date()){
    const d=value instanceof Date?new Date(value):dateObject(value);d.setHours(12,0,0,0);d.setDate(d.getDate()-(weekday(d)-1));return d
  }
  function dateForWeekday(day){const d=monday();d.setDate(d.getDate()+Number(day)-1);return localDate(d)}
  function displayDate(value){return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long'}).format(dateObject(value))}
  function displayDateTime(value){
    const d=new Date(value);if(Number.isNaN(d.getTime()))return'';
    return new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d)
  }
  function uid(prefix='event'){return`${prefix}:${Date.now()}:${Math.random().toString(36).slice(2,10)}`}
  function clientById(id){return cache.clients.find(row=>String(row.id)===String(id))||null}
  function activeBlock(id){return cache.blocks.find(row=>String(row.offline_client_id)===String(id)&&row.status==='active')||null}
  function eventForOccurrence(slotId,originalDate){
    const key=`slot:${slotId}:${originalDate}`;
    return cache.events.find(row=>row.event_type==='completed'&&row.idempotency_key===key)||null
  }
  function exceptionFor(slotId,originalDate){return cache.exceptions.find(row=>String(row.schedule_slot_id)===String(slotId)&&row.original_date===originalDate)||null}

  function currentWeekBounds(){const start=localDate(monday()),end=dateObject(start);end.setDate(end.getDate()+6);return{start,end:localDate(end)}}
  function periodStart(kind){
    const n=new Date();n.setHours(12,0,0,0);
    if(kind==='today')return localDate(n);
    if(kind==='week')return localDate(monday(n));
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-01`
  }
  function finance(kind){
    const from=periodStart(kind),rows=cache.events.filter(row=>row.event_type==='completed'&&row.session_date>=from);
    return{count:rows.length,cents:rows.reduce((sum,row)=>sum+Number(row.revenue_cents||0),0)}
  }

  async function loadData(){
    const c=W.cloud;if(!c?.ready||!c?.user||!c?.client)throw new Error('Войди в тренерский аккаунт');
    const {start,end}=currentWeekBounds(),month=periodStart('month');
    const eventStart=start<month?start:month;
    const [clients,slots,blocks,events,exceptions]=await Promise.all([
      c.client.from('offline_clients').select('*').eq('trainer_id',c.user.id).order('display_name'),
      c.client.from('offline_weekly_slots').select('*').eq('trainer_id',c.user.id).eq('is_active',true).order('weekday').order('start_time'),
      c.client.from('offline_membership_blocks').select('*').eq('trainer_id',c.user.id).order('started_on',{ascending:false}),
      c.client.from('offline_session_events').select('*').eq('trainer_id',c.user.id).gte('session_date',eventStart).order('occurred_at',{ascending:false}).limit(600),
      c.client.from('offline_schedule_exceptions').select('*').eq('trainer_id',c.user.id).or(`and(original_date.gte.${start},original_date.lte.${end}),and(new_date.gte.${start},new_date.lte.${end})`)
    ]);
    const failed=[clients,slots,blocks,events,exceptions].find(result=>result.error);if(failed)throw failed.error;
    cache.clients=clients.data||[];cache.slots=slots.data||[];cache.blocks=blocks.data||[];cache.events=events.data||[];cache.exceptions=exceptions.data||[];cache.loaded=true;
    return cache
  }

  function scheduleSummary(clientId){
    const rows=cache.slots.filter(row=>String(row.offline_client_id)===String(clientId)).sort((a,b)=>a.weekday-b.weekday||time(a.start_time).localeCompare(time(b.start_time)));
    if(!rows.length)return'Расписание не задано';
    const times=[...new Set(rows.map(row=>time(row.start_time)))];
    if(times.length===1)return`${rows.map(row=>DAYS[row.weekday-1].short).join(' · ')} · ${times[0]}`;
    return rows.map(row=>`${DAYS[row.weekday-1].short} – ${time(row.start_time)}`).join(' · ')
  }

  function occurrenceRows(day){
    const selectedDate=dateForWeekday(day),rows=[];
    cache.slots.filter(slot=>slot.weekday===Number(day)).forEach(slot=>{
      const exception=exceptionFor(slot.id,selectedDate),client=clientById(slot.offline_client_id);
      if(exception?.exception_type==='move'){
        rows.push({slot,client,originalDate:selectedDate,displayDate:selectedDate,displayTime:time(slot.start_time),status:'moved-away',exception});return
      }
      rows.push({slot,client,originalDate:selectedDate,displayDate:selectedDate,displayTime:time(slot.start_time),status:exception?.exception_type==='skip'?'skipped':'scheduled',exception})
    });
    cache.exceptions.filter(exception=>exception.exception_type==='move'&&exception.new_date===selectedDate).forEach(exception=>{
      const slot=cache.slots.find(row=>String(row.id)===String(exception.schedule_slot_id));if(!slot)return;
      const client=clientById(slot.offline_client_id);
      rows.push({slot,client,originalDate:exception.original_date,displayDate:selectedDate,displayTime:time(exception.new_time),status:'moved-here',exception})
    });
    return rows.sort((a,b)=>a.displayTime.localeCompare(b.displayTime))
  }

  function occurrenceStatus(row){
    const completed=eventForOccurrence(row.slot.id,row.originalDate);
    if(completed)return'<span class="offline-status done">Проведено</span>';
    if(row.status==='skipped')return'<span class="offline-status skipped">Пропуск</span>';
    if(row.status==='moved-away')return`<span class="offline-status moved">На ${E(displayDate(row.exception.new_date))} · ${E(time(row.exception.new_time))}</span>`;
    if(row.status==='moved-here')return`<span class="offline-status moved">Перенос с ${E(displayDate(row.originalDate))}</span>`;
    return'<span class="offline-status planned">Запланировано</span>'
  }

  function scheduleRow(row){
    const completed=eventForOccurrence(row.slot.id,row.originalDate),disabled=!row.client||completed||row.status==='skipped'||row.status==='moved-away';
    return `<button type="button" class="offline-slot ${row.client?'occupied':'free'} ${disabled?'disabled':''}" ${row.client&&!disabled?`onclick="offlineOccurrenceMenuV390('${E(row.slot.id)}','${E(row.originalDate)}','${E(row.displayDate)}','${E(row.displayTime)}')"`:row.client?`onclick="offlineOccurrenceMenuV390('${E(row.slot.id)}','${E(row.originalDate)}','${E(row.displayDate)}','${E(row.displayTime)}')"`:`onclick="offlineFillSlotV390('${E(row.slot.id)}')"`}><time>${E(row.displayTime)}</time><span class="offline-slot-main"><b>${row.client?E(row.client.display_name):'Свободно'}</b>${row.client?occurrenceStatus(row):'<small>Назначить клиента</small>'}</span><span class="offline-slot-arrow">›</span></button>`
  }

  function scheduleHtml(){
    const day=cache.selectedDay,date=dateForWeekday(day),rows=occurrenceRows(day);
    return `<section class="offline-schedule-card"><div class="offline-week-tabs">${DAYS.map(item=>`<button type="button" class="${item.n===day?'on':''}" onclick="offlineSelectWeekdayV390(${item.n})">${item.short}</button>`).join('')}</div><div class="offline-day-head"><div><span>НЕДЕЛЬНОЕ РАСПИСАНИЕ</span><b>${DAYS[day-1].name}</b><small>${displayDate(date)}</small></div><button type="button" class="btn tiny" onclick="offlineScheduleEditorV390(null,${day})">＋ Время</button></div><div class="offline-slots">${rows.length?rows.map(scheduleRow).join(''):`<button type="button" class="offline-empty-day" onclick="offlineScheduleEditorV390(null,${day})"><b>На этот день занятий нет</b><span>Добавить постоянное время</span></button>`}</div></section>`
  }

  function metricsHtml(){
    const today=finance('today'),week=finance('week'),month=finance('month');
    return `<section class="offline-finance"><article><span>Сегодня</span><b>${today.count} зан.</b><small>${money(today.cents)}</small></article><article><span>Неделя</span><b>${week.count} зан.</b><small>${money(week.cents)}</small></article><article><span>Месяц</span><b>${month.count} зан.</b><small>${money(month.cents)}</small></article></section>`
  }

  function clientCard(client){
    const remaining=Math.max(0,Number(client.sessions_remaining)||0),block=activeBlock(client.id);
    return `<article class="offline-client-v390"><button type="button" class="offline-client-open" onclick="offlineClientDetail('${E(client.id)}')"><b>${E(client.display_name)}</b><span>${E(scheduleSummary(client.id))}</span>${block?`<small>${block.session_type==='single'?'Разовое занятие':`${block.total_sessions} занятий · ${money(block.block_price_cents)}`} · ${money(block.session_price_cents)} / занятие</small>`:'<small>Абонемент не задан</small>'}</button><div class="offline-card-balance"><span>${remaining} занятий осталось</span><div><button type="button" onclick="offlineAdjustSessions('${E(client.id)}',-1)" aria-label="Списать занятие вручную">−</button><strong>${remaining}</strong><button type="button" onclick="offlineAdjustSessions('${E(client.id)}',1)" aria-label="Вернуть занятие">＋</button></div></div></article>`
  }

  async function renderOffline(){
    const root=D.getElementById('offlineClientsPane');if(!root)return;
    const token=++cache.renderToken;root.innerHTML='<div class="card muted">Загружаю расписание…</div>';
    try{await loadData();if(token!==cache.renderToken)return;
      root.innerHTML=`${scheduleHtml()}${metricsHtml()}<button type="button" class="btn full offline-add-client" onclick="offlineNewClientSheet()">＋ Клиент</button><div class="section">ОФЛАЙН-КЛИЕНТЫ</div><div id="offlineClientList">${cache.clients.length?cache.clients.map(clientCard).join(''):'<div class="card"><div class="title">Пока нет офлайн-клиентов</div><div class="muted" style="margin-top:6px">Добавь клиента, абонемент и его постоянное расписание.</div></div>'}</div>`
    }catch(error){root.innerHTML=`<div class="card"><div class="title">Не удалось загрузить расписание</div><div class="muted" style="margin-top:7px">${E(error?.message||'Проверь подключение')}</div><button class="btn full" style="margin-top:12px" onclick="renderOfflineClients()">Повторить</button></div>`}
  }

  W.offlineSelectWeekdayV390=function(day){cache.selectedDay=Math.max(1,Math.min(7,Number(day)||1));const root=D.getElementById('offlineClientsPane');if(root&&cache.loaded)root.innerHTML=`${scheduleHtml()}${metricsHtml()}<button type="button" class="btn full offline-add-client" onclick="offlineNewClientSheet()">＋ Клиент</button><div class="section">ОФЛАЙН-КЛИЕНТЫ</div><div id="offlineClientList">${cache.clients.length?cache.clients.map(clientCard).join(''):'<div class="card muted">Клиентов пока нет.</div>'}</div>`};

  function dayInputs(rows=[]){
    const byDay=new Map(rows.map(row=>[Number(row.weekday),time(row.start_time)]));
    return `<div class="offline-day-inputs">${DAYS.map(day=>`<label><input type="checkbox" data-offline-day="${day.n}" ${byDay.has(day.n)?'checked':''}><b>${day.short}</b><input type="time" data-offline-time="${day.n}" value="${E(byDay.get(day.n)||'19:00')}"></label>`).join('')}</div>`
  }
  function readSchedule(){return DAYS.flatMap(day=>{const checked=D.querySelector(`[data-offline-day="${day.n}"]`)?.checked,start_time=D.querySelector(`[data-offline-time="${day.n}"]`)?.value;return checked&&start_time?[{weekday:day.n,start_time}]:[]})}
  function syncMembershipFields(){
    const single=D.getElementById('offMembershipType')?.value==='single',sessions=D.getElementById('offBlockSessions');if(sessions){sessions.value=single?'1':(sessions.value==='1'?'12':sessions.value);sessions.disabled=single}
  }
  W.offlineSyncMembershipV390=syncMembershipFields;

  W.offlineNewClientSheet=function(){
    const today=localDate(new Date());
    W.modal?.(`<div class="sheet-grabber"></div><div class="offline-sheet-head"><div><span>НОВЫЙ КЛИЕНТ</span><h2>Профиль и абонемент</h2></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="field"><label>Имя</label><input id="offName" placeholder="Например, Антон"></div><div class="offline-form-grid"><div class="field"><label>Пол</label><select id="offSex"><option value="female">Женский</option><option value="male">Мужской</option><option value="other">Другой</option></select></div><div class="field"><label>Рост, см</label><input id="offHeight" type="number" min="100" max="250" step="0.5" inputmode="decimal"></div><div class="field"><label>Дата рождения</label><input id="offBirth" type="date"></div><div class="field"><label>Дата начала</label><input id="offBlockStart" type="date" value="${today}"></div></div><div class="offline-form-section">Абонемент</div><div class="offline-form-grid"><div class="field"><label>Тип</label><select id="offMembershipType" onchange="offlineSyncMembershipV390()"><option value="block">Блок занятий</option><option value="single">Разовое занятие</option></select></div><div class="field"><label>Количество занятий</label><input id="offBlockSessions" type="number" min="1" max="200" value="12"></div><div class="field offline-wide"><label>Стоимость, ₽</label><input id="offBlockPrice" type="number" min="0" step="50" inputmode="numeric" value="13500"></div></div><div class="offline-form-section">Постоянное расписание</div><div class="offline-form-hint">Для каждого выбранного дня можно задать своё время.</div>${dayInputs()}<div class="offline-form-section">Начальные показатели</div><div class="offline-form-grid"><div class="field"><label>Вес, кг</label><input id="offWeight" type="number" min="20" max="400" step="0.1" inputmode="decimal"></div><div class="field"><label>Дата замера</label><input id="offMeasureDate" type="date" value="${today}"></div><div class="field"><label>Грудь, см</label><input id="offChest" type="number" step="0.1" inputmode="decimal"></div><div class="field"><label>Талия, см</label><input id="offWaist" type="number" step="0.1" inputmode="decimal"></div><div class="field"><label>Живот, см</label><input id="offAbdomen" type="number" step="0.1" inputmode="decimal"></div><div class="field"><label>Ягодицы, см</label><input id="offHips" type="number" step="0.1" inputmode="decimal"></div><div class="field"><label>Бедро, см</label><input id="offThigh" type="number" step="0.1" inputmode="decimal"></div><div class="field"><label>Рука, см</label><input id="offArm" type="number" step="0.1" inputmode="decimal"></div><div class="field"><label>Икра, см</label><input id="offCalf" type="number" step="0.1" inputmode="decimal"></div></div><div class="field"><label>Заметка</label><textarea id="offNotes" placeholder="Цель, особенности, ограничения"></textarea></div><button class="btn primary full" onclick="offlineSaveNewClient()">Добавить клиента</button>`)
  };

  W.offlineSaveNewClient=async function(){
    const c=W.cloud,name=D.getElementById('offName')?.value.trim();if(!name)return W.toast?.('Введи имя');if(!c?.user)return W.toast?.('Войди в тренерский аккаунт');
    const total=Math.max(1,parseInt(D.getElementById('offBlockSessions')?.value||'1',10)||1),rubles=Math.max(0,Number(D.getElementById('offBlockPrice')?.value)||0),button=D.querySelector('[onclick="offlineSaveNewClient()"]');
    try{
      if(button)button.disabled=true;
      const {data,error}=await c.client.rpc('create_offline_client_v390',{p_profile:{display_name:name,sex:D.getElementById('offSex')?.value||'other',height_cm:D.getElementById('offHeight')?.value||null,birth_date:D.getElementById('offBirth')?.value||null,notes:D.getElementById('offNotes')?.value.trim()||null},p_membership:{session_type:D.getElementById('offMembershipType')?.value||'block',total_sessions:total,block_price_cents:Math.round(rubles*100),started_on:D.getElementById('offBlockStart')?.value||localDate(new Date())},p_schedule:readSchedule()});
      if(error)throw error;const id=data;
      const number=id=>{const value=Number(String(D.getElementById(id)?.value||'').replace(',','.'));return value>0?value:null};
      const weight=number('offWeight'),measurements={chest:number('offChest'),waist:number('offWaist'),abdomen:number('offAbdomen'),hips:number('offHips'),thigh:number('offThigh'),arm:number('offArm'),calf:number('offCalf')};
      Object.keys(measurements).forEach(key=>measurements[key]==null&&delete measurements[key]);
      if(weight||Object.keys(measurements).length){const saved=await c.client.from('offline_client_measurements').insert({offline_client_id:id,trainer_id:c.user.id,measure_date:D.getElementById('offMeasureDate')?.value||localDate(new Date()),weight_kg:weight,measurements,notes:'Начальный замер'});if(saved.error)W.toast?.('Клиент добавлен, но замеры не сохранились')}
      W.closeModal?.();await renderOffline();W.toast?.('Клиент, абонемент и расписание сохранены');W.offlineClientDetail?.(id)
    }catch(error){W.alert?.(error?.message||'Не удалось добавить клиента')}finally{if(button)button.disabled=false}
  };

  W.offlineAdjustSessions=async function(id,delta){
    try{const {data,error}=await W.cloud.client.rpc('adjust_offline_sessions_v390',{p_offline_client_id:id,p_delta:Number(delta),p_note:Number(delta)<0?'Занятие списано вручную':'Занятие добавлено вручную'});if(error)throw error;W.toast?.(`${Number(delta)<0?'Занятие списано':'Занятие возвращено'} · ${data.before} → ${data.after}`);await renderOffline();if(D.getElementById('modal')?.classList.contains('show'))W.offlineClientDetail?.(id)}catch(error){W.alert?.(error?.message||'Не удалось изменить остаток')}
  };

  W.offlineOccurrenceMenuV390=function(slotId,originalDate,sessionDate,sessionTime){
    const slot=cache.slots.find(row=>String(row.id)===String(slotId)),client=clientById(slot?.offline_client_id),event=eventForOccurrence(slotId,originalDate),exception=exceptionFor(slotId,originalDate);if(!slot||!client)return;
    W.modal?.(`<div class="sheet-grabber"></div><div class="offline-sheet-head"><div><span>${E(displayDate(sessionDate))}</span><h2>${E(client.display_name)} · ${E(sessionTime)}</h2></div><button class="btn tiny" onclick="closeModal()">✕</button></div>${event?`<div class="offline-action-result"><b>Занятие уже проведено</b><span>${E(displayDateTime(event.occurred_at))} · списано ${money(event.session_price_cents)}</span></div>`:exception?.exception_type==='skip'?'<div class="offline-action-result"><b>Отмечен пропуск</b><span>Абонемент не списан</span></div>':`<div class="offline-menu-actions"><button class="btn primary" onclick="offlineCompleteOccurrenceV390('${E(slotId)}','${E(originalDate)}','${E(sessionDate)}','${E(sessionTime)}')">Провести занятие</button><button class="btn" onclick="offlineMoveOccurrenceSheetV390('${E(slotId)}','${E(originalDate)}','${E(sessionDate)}','${E(sessionTime)}')">Перенести сегодня</button><button class="btn" onclick="offlineSkipOccurrenceV390('${E(slotId)}','${E(originalDate)}')">Пропуск</button></div>`}<button class="btn full" style="margin-top:9px" onclick="offlineScheduleEditorV390('${E(client.id)}',${slot.weekday})">Изменить постоянное расписание</button><button class="btn danger full" style="margin-top:9px" onclick="offlineRemovePermanentSlotV390('${E(slotId)}')">Удалить это время из расписания</button>`)
  };

  W.offlineCompleteOccurrenceV390=async function(slotId,originalDate,sessionDate,sessionTime){
    const slot=cache.slots.find(row=>String(row.id)===String(slotId));if(!slot?.offline_client_id)return;
    try{const {data,error}=await W.cloud.client.rpc('record_offline_session_v390',{p_offline_client_id:slot.offline_client_id,p_schedule_slot_id:slotId,p_session_date:sessionDate,p_scheduled_time:sessionTime,p_idempotency_key:`slot:${slotId}:${originalDate}`});if(error)throw error;W.closeModal?.();await renderOffline();W.toast?.(data?.duplicate?'Это занятие уже было списано':'Занятие проведено и списано')}catch(error){W.alert?.(error?.message||'Не удалось провести занятие')}
  };

  W.offlineSkipOccurrenceV390=async function(slotId,originalDate){
    try{const {error}=await W.cloud.client.from('offline_schedule_exceptions').upsert({trainer_id:W.cloud.user.id,schedule_slot_id:slotId,original_date:originalDate,exception_type:'skip',new_date:null,new_time:null,updated_at:new Date().toISOString()},{onConflict:'schedule_slot_id,original_date'});if(error)throw error;W.closeModal?.();await renderOffline();W.toast?.('Пропуск сохранён, занятие не списано')}catch(error){W.alert?.(error?.message||'Не удалось сохранить пропуск')}
  };

  W.offlineMoveOccurrenceSheetV390=function(slotId,originalDate,sessionDate,sessionTime){
    W.modal?.(`<div class="sheet-grabber"></div><div class="offline-sheet-head"><div><span>РАЗОВЫЙ ПЕРЕНОС</span><h2>Новое время</h2></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="offline-form-grid"><div class="field"><label>Дата</label><input id="offMoveDate" type="date" value="${E(sessionDate)}"></div><div class="field"><label>Время</label><input id="offMoveTime" type="time" value="${E(sessionTime)}"></div></div><button class="btn primary full" onclick="offlineMoveOccurrenceV390('${E(slotId)}','${E(originalDate)}')">Перенести</button>`)
  };
  W.offlineMoveOccurrenceV390=async function(slotId,originalDate){
    const newDate=D.getElementById('offMoveDate')?.value,newTime=D.getElementById('offMoveTime')?.value;if(!newDate||!newTime)return W.toast?.('Укажи дату и время');
    try{const {error}=await W.cloud.client.from('offline_schedule_exceptions').upsert({trainer_id:W.cloud.user.id,schedule_slot_id:slotId,original_date:originalDate,exception_type:'move',new_date:newDate,new_time:newTime,updated_at:new Date().toISOString()},{onConflict:'schedule_slot_id,original_date'});if(error)throw error;W.closeModal?.();await renderOffline();W.toast?.('Разовый перенос сохранён')}catch(error){W.alert?.(error?.message||'Не удалось перенести занятие')}
  };

  W.offlineRemovePermanentSlotV390=async function(slotId){
    if(!W.confirm?.('Убрать это занятие из постоянного расписания? История сохранится.'))return;
    try{const {error}=await W.cloud.client.from('offline_weekly_slots').update({offline_client_id:null,updated_at:new Date().toISOString()}).eq('id',slotId).eq('trainer_id',W.cloud.user.id);if(error)throw error;W.closeModal?.();await renderOffline();W.toast?.('Время освобождено')}catch(error){W.alert?.(error?.message||'Не удалось изменить расписание')}
  };

  W.offlineFillSlotV390=function(slotId){const slot=cache.slots.find(row=>String(row.id)===String(slotId));W.offlineScheduleEditorV390(null,slot?.weekday||cache.selectedDay,slotId)};
  W.offlineScheduleEditorV390=function(clientId=null,defaultDay=cache.selectedDay,fillSlotId=null){
    const client=clientById(clientId),rows=client?cache.slots.filter(row=>String(row.offline_client_id)===String(client.id)):[];
    W.modal?.(`<div class="sheet-grabber"></div><div class="offline-sheet-head"><div><span>ПОСТОЯННОЕ РАСПИСАНИЕ</span><h2>${client?E(client.display_name):'Добавить занятие'}</h2></div><button class="btn tiny" onclick="closeModal()">✕</button></div>${client?'':`<div class="field"><label>Клиент</label><select id="offScheduleClient"><option value="">Выбери клиента</option>${cache.clients.map(row=>`<option value="${E(row.id)}">${E(row.display_name)}</option>`).join('')}</select></div>`}${dayInputs(rows.length?rows:[{weekday:Number(defaultDay),start_time:fillSlotId?time(cache.slots.find(row=>String(row.id)===String(fillSlotId))?.start_time):'19:00'}])}<button class="btn primary full" onclick="offlineSaveScheduleV390('${E(clientId||'')}')">Сохранить расписание</button>`)
  };
  W.offlineSaveScheduleV390=async function(clientId){
    const id=clientId||D.getElementById('offScheduleClient')?.value;if(!id)return W.toast?.('Выбери клиента');
    let schedule=readSchedule();
    if(!clientId){
      const byDay=new Map(cache.slots.filter(row=>String(row.offline_client_id)===String(id)).map(row=>[Number(row.weekday),{weekday:Number(row.weekday),start_time:time(row.start_time)}]));
      schedule.forEach(row=>byDay.set(Number(row.weekday),row));schedule=[...byDay.values()].sort((a,b)=>a.weekday-b.weekday)
    }
    try{const {error}=await W.cloud.client.rpc('replace_offline_client_schedule_v390',{p_offline_client_id:id,p_schedule:schedule});if(error)throw error;W.closeModal?.();await renderOffline();W.toast?.('Постоянное расписание сохранено')}catch(error){W.alert?.(error?.message||'Не удалось сохранить расписание')}
  };

  W.offlineMembershipSheetV390=function(id){
    const block=activeBlock(id),client=clientById(id),previous=cache.blocks.filter(row=>String(row.offline_client_id)===String(id)&&row.status!=='active').slice(0,6);if(!client)return;
    W.modal?.(`<div class="sheet-grabber"></div><div class="offline-sheet-head"><div><span>НОВЫЙ АБОНЕМЕНТ</span><h2>${E(client.display_name)}</h2></div><button class="btn tiny" onclick="closeModal()">✕</button></div>${block?`<div class="offline-action-result"><b>Текущий блок: ${block.sessions_remaining} из ${block.total_sessions}</b><span>${money(block.block_price_cents)} · ${money(block.session_price_cents)} за занятие</span></div>`:''}<div class="offline-form-grid"><div class="field"><label>Тип</label><select id="offNewBlockType" onchange="if(this.value==='single')document.getElementById('offNewBlockSessions').value=1"><option value="block">Блок занятий</option><option value="single">Разовое занятие</option></select></div><div class="field"><label>Количество</label><input id="offNewBlockSessions" type="number" min="1" max="200" value="12"></div><div class="field"><label>Стоимость, ₽</label><input id="offNewBlockPrice" type="number" min="0" step="50" value="13500"></div><div class="field"><label>Дата начала</label><input id="offNewBlockStart" type="date" value="${localDate(new Date())}"></div></div><button class="btn primary full" onclick="offlineStartMembershipV390('${E(id)}')">Начать новый блок</button>${previous.length?`<div class="offline-form-section">Предыдущие блоки</div><div class="offline-block-history">${previous.map(row=>`<article><b>${row.session_type==='single'?'Разовое занятие':`${row.total_sessions} занятий`} · ${money(row.block_price_cents)}</b><span>${E(row.started_on)}${row.ended_on?` – ${E(row.ended_on)}`:''} · проведено ${row.sessions_used}</span></article>`).join('')}</div>`:''}`)
  };
  W.offlineStartMembershipV390=async function(id){
    const type=D.getElementById('offNewBlockType')?.value||'block',sessions=type==='single'?1:Math.max(1,parseInt(D.getElementById('offNewBlockSessions')?.value||'1',10)||1),cents=Math.round(Math.max(0,Number(D.getElementById('offNewBlockPrice')?.value)||0)*100);
    try{const {error}=await W.cloud.client.rpc('start_offline_membership_v390',{p_offline_client_id:id,p_session_type:type,p_total_sessions:sessions,p_block_price_cents:cents,p_started_on:D.getElementById('offNewBlockStart')?.value||localDate(new Date())});if(error)throw error;W.closeModal?.();await renderOffline();W.toast?.('Новый абонемент сохранён');W.offlineClientDetail?.(id)}catch(error){W.alert?.(error?.message||'Не удалось сохранить абонемент')}
  };

  W.offlineSessionHistoryV390=async function(id){
    W.modal?.('<div class="card muted">Загружаю историю…</div>');
    try{const {data,error}=await W.cloud.client.from('offline_session_events').select('*').eq('offline_client_id',id).eq('trainer_id',W.cloud.user.id).order('occurred_at',{ascending:false}).limit(250);if(error)throw error;const rows=data||[];
      W.modal?.(`<div class="sheet-grabber"></div><div class="offline-sheet-head"><div><span>ИСТОРИЯ ЗАНЯТИЙ</span><h2>${E(clientById(id)?.display_name||'Клиент')}</h2></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="offline-event-list">${rows.length?rows.map(row=>`<article><time>${E(displayDateTime(row.occurred_at))}</time><b>${row.event_type==='completed'?'Занятие проведено':row.event_type==='manual_debit'?'Занятие списано вручную':'Занятие возвращено вручную'}</b><span>${row.event_type==='completed'?`${E(row.session_date)}${row.scheduled_time?` · ${E(time(row.scheduled_time))}`:''} · `:''}${row.balance_before} → ${row.balance_after}${row.event_type==='completed'?` · ${money(row.session_price_cents)}`:''}</span></article>`).join(''):'<div class="card muted">История пока пуста.</div>'}</div>`)
    }catch(error){W.alert?.(error?.message||'Не удалось загрузить историю')}
  };

  async function saveClientProfile(id){
    const value=key=>String(D.getElementById(key)?.value||'').trim(),name=value('offEditName');
    if(!name)return W.toast?.('Введи имя');
    const targetRaw=value('offEditTargetWeight'),target=targetRaw?Number(String(targetRaw).replace(',','.')):null;
    if(targetRaw&&(!Number.isFinite(target)||target<20||target>400))return W.toast?.('Проверь цель по весу');
    try{
      const payload={display_name:name,sex:value('offEditSex')||'other',height_cm:Number(String(value('offEditHeight')).replace(',','.'))||null,birth_date:value('offEditBirth')||null,target_weight_kg:target,notes:value('offEditNotes')||null,updated_at:new Date().toISOString()};
      const {error}=await W.cloud.client.from('offline_clients').update(payload).eq('id',id).eq('trainer_id',W.cloud.user.id);if(error)throw error;
      W.toast?.('Профиль клиента сохранён');await renderOffline();W.offlineClientDetail?.(id)
    }catch(error){W.alert?.(error?.message||'Не удалось сохранить клиента')}
  }

  function enhanceClientDetail(id){
    const session=D.querySelector('#sheet .ofp-sessions');if(!session)return;const block=activeBlock(id);
    session.querySelector('div:first-child span')?.replaceChildren(D.createTextNode(block?`${block.sessions_used} проведено · ${money(block.session_price_cents)} за занятие`:'Добавь новый абонемент'));
    if(D.querySelector('#sheet .offline-membership-actions'))return;
    const actions=D.createElement('div');actions.className='offline-membership-actions';actions.innerHTML=`<button class="btn" onclick="offlineMembershipSheetV390('${E(id)}')">Новый блок</button><button class="btn" onclick="offlineSessionHistoryV390('${E(id)}')">История занятий</button>`;session.after(actions)
  }

  function install(){
    W.renderOfflineClients=renderOffline;
    try{renderOfflineClients=renderOffline}catch(_){ }
    const originalSwitch=W.offlineSwitchTab;
    if(typeof originalSwitch==='function'&&!originalSwitch.__scheduleV390){
      const wrapped=function(){return originalSwitch.apply(this,arguments)};wrapped.__scheduleV390=true;W.offlineSwitchTab=wrapped;try{offlineSwitchTab=wrapped}catch(_){ }
    }
    const detail=W.offlineClientDetail;
    if(typeof detail==='function'&&!detail.__scheduleV390){const wrapped=async function(id){const result=await detail.apply(this,arguments);setTimeout(()=>enhanceClientDetail(id),0);return result};wrapped.__scheduleV390=true;W.offlineClientDetail=wrapped;try{offlineClientDetail=wrapped}catch(_){ }}
    const edit=W.offlineEditClientSheet;
    if(typeof edit==='function'&&!edit.__scheduleV390){const wrapped=async function(id){const result=await edit.apply(this,arguments);const input=D.getElementById('offEditSessions');input?.closest('.ofp-edit-field,.field')?.remove();return result};wrapped.__scheduleV390=true;W.offlineEditClientSheet=wrapped;try{offlineEditClientSheet=wrapped}catch(_){ }}
    W.offlineSaveClientEdit=saveClientProfile;try{offlineSaveClientEdit=saveClientProfile}catch(_){ }
    if(D.getElementById('offlineClientsPane')?.style.display!=='none'&&D.querySelector('.client-tabs button[data-tab="offline"]')?.classList.contains('on'))renderOffline()
  }

  const style=D.createElement('style');style.id='unvrsl-offline-schedule-v390';style.textContent=`
    #clients .clients-add-action [data-client-add-offline]{display:none!important}.offline-schedule-card{margin:12px 0 14px;padding:14px;border:1px solid #2f3036;border-radius:26px;background:linear-gradient(155deg,#202126,#18191d 70%)}.offline-week-tabs{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}.offline-week-tabs button{height:38px;border-radius:12px;background:#292a30;color:#85858d;font-size:12px;font-weight:850}.offline-week-tabs button.on{background:#bf5af2;color:#14091a;box-shadow:0 8px 20px rgba(191,90,242,.22)}.offline-day-head{display:flex;align-items:end;justify-content:space-between;gap:12px;padding:17px 3px 10px}.offline-day-head>div>span,.offline-sheet-head span{display:block;color:#8e8e95;font-size:10px;font-weight:850;letter-spacing:.12em}.offline-day-head b{display:block;margin-top:5px;font-size:21px}.offline-day-head small{display:block;color:#8e8e95;margin-top:3px;font-size:12px}.offline-slots{display:grid;gap:7px}.offline-slot,.offline-empty-day{width:100%;display:grid;grid-template-columns:58px minmax(0,1fr) 18px;align-items:center;gap:10px;padding:12px 13px;border:1px solid #33343a;border-radius:17px;background:#232429;text-align:left}.offline-slot time{font-size:16px;font-weight:850;font-variant-numeric:tabular-nums}.offline-slot-main b,.offline-slot-main small,.offline-status{display:block}.offline-slot-main b{font-size:15px}.offline-slot-main small,.offline-status{margin-top:4px;color:#87878f;font-size:10px}.offline-slot.free{border-style:dashed;color:#9a9aa2}.offline-slot.disabled{opacity:.72}.offline-slot-arrow{color:#75757d;font-size:21px}.offline-status.done{color:#65d985}.offline-status.skipped{color:#ff9f0a}.offline-status.moved{color:#c98af5}.offline-status.planned{color:#85858d}.offline-empty-day{display:block;padding:20px;text-align:center;border-style:dashed;color:#8e8e95}.offline-empty-day b,.offline-empty-day span{display:block}.offline-empty-day b{color:#f4f4f6}.offline-empty-day span{margin-top:6px;font-size:12px}.offline-finance{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.offline-finance article{padding:14px 12px;border:1px solid #2c2d32;border-radius:19px;background:#1c1d21}.offline-finance span,.offline-finance small,.offline-finance b{display:block}.offline-finance span{color:#8d8d94;font-size:11px}.offline-finance b{margin-top:6px;font-size:18px}.offline-finance small{margin-top:4px;color:#c98af5;font-size:12px}.offline-add-client{min-height:50px;margin:10px 0 14px;background:#2d2e33!important}.offline-client-v390{margin:9px 0;border:1px solid #2d2e33;border-radius:23px;background:#1c1d21;overflow:hidden}.offline-client-open{width:100%;padding:16px;text-align:left}.offline-client-open b,.offline-client-open span,.offline-client-open small{display:block}.offline-client-open b{font-size:18px}.offline-client-open span{margin-top:6px;color:#c5c5ca;font-size:13px;line-height:1.4}.offline-client-open small{margin-top:5px;color:#7f7f87;font-size:11px}.offline-card-balance{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 14px;border-top:1px solid #2d2e33;background:#202126}.offline-card-balance>span{color:#9b9ba2;font-size:12px}.offline-card-balance>div{display:grid;grid-template-columns:36px 34px 36px;align-items:center;gap:3px}.offline-card-balance button{height:36px;border-radius:11px;background:#303138;font-size:20px}.offline-card-balance strong{text-align:center;font-size:16px}.offline-sheet-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:13px}.offline-sheet-head h2{margin:5px 0 0!important}.offline-form-section{margin:19px 2px 6px;color:#9b9ba2;font-size:11px;font-weight:850;letter-spacing:.1em;text-transform:uppercase}.offline-form-hint{margin:0 2px 9px;color:#76767e;font-size:11px}.offline-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 9px}.offline-wide{grid-column:1/-1}.offline-day-inputs{display:grid;gap:6px}.offline-day-inputs label{display:grid;grid-template-columns:25px 45px minmax(0,1fr);align-items:center;gap:8px;padding:7px 10px;border:1px solid #303138;border-radius:15px;background:#202126}.offline-day-inputs input[type=checkbox]{width:20px;height:20px;accent-color:#bf5af2}.offline-day-inputs input[type=time]{height:38px;padding:6px 10px;border:1px solid #383940;border-radius:11px;background:#141519;color:#fff}.offline-menu-actions{display:grid;gap:8px}.offline-menu-actions .btn{min-height:48px}.offline-action-result{padding:15px;border:1px solid rgba(48,209,88,.25);border-radius:18px;background:rgba(48,209,88,.08)}.offline-action-result b,.offline-action-result span{display:block}.offline-action-result span{margin-top:5px;color:#929299;font-size:12px}.offline-membership-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 12px}.offline-event-list,.offline-block-history{display:grid;gap:7px}.offline-event-list article,.offline-block-history article{padding:13px;border:1px solid #303138;border-radius:16px;background:#202126}.offline-event-list time,.offline-event-list b,.offline-event-list span,.offline-block-history b,.offline-block-history span{display:block}.offline-event-list time{color:#808088;font-size:11px}.offline-event-list b,.offline-block-history b{margin-top:5px;font-size:14px}.offline-event-list span,.offline-block-history span{margin-top:4px;color:#aaaab0;font-size:12px}
    @media(max-width:430px){.offline-schedule-card{padding:11px;border-radius:23px}.offline-week-tabs{gap:3px}.offline-week-tabs button{height:36px;font-size:11px}.offline-day-head{padding-top:14px}.offline-slot{grid-template-columns:50px minmax(0,1fr) 14px;padding:11px}.offline-finance{gap:5px}.offline-finance article{padding:12px 9px}.offline-finance b{font-size:16px}.offline-finance small{font-size:10px}.offline-form-grid{grid-template-columns:1fr}.offline-wide{grid-column:auto}.offline-card-balance{align-items:flex-start;flex-direction:column}.offline-card-balance>div{align-self:flex-end;margin-top:-31px}}
  `;D.head.appendChild(style);

  W.unvrslOfflineScheduleV390={DAYS,weekday,monday,dateForWeekday,scheduleSummary,occurrenceRows,finance,hydrate:value=>Object.assign(cache,value||{}),version:REV,render:renderOffline};
  [0,80,260,800,1600,3400].forEach(ms=>setTimeout(install,ms));
  W.addEventListener('unvrsl:cloud-modules-settled',install,{passive:true});
  W.addEventListener('unvrsl:deferred-modules-ready',install,{passive:true});
})();
