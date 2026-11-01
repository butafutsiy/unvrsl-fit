'use strict';
(function(W){
 const C=W.UNVRSLFocusCardio;
 if(!C)return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 const fmt=n=>Number(n).toLocaleString('ru-RU',{maximumFractionDigits:1});
 // Goals by distance/calories use actual readings, never projected MET calories.
 function objective(info,d){
  const calories=info.mode==='calories',distance=info.mode==='distance';
  if(!calories&&!distance)return null;
  const key=calories?'reportedKcal':'distanceKm',target=C.num(calories?info.targetKcal:info.distanceKm),actual=C.num(d?.cardio?.[key]??d?.[key]);
  return {key,target,actual,progress:target>0&&actual!=null?Math.max(0,Math.min(1,actual/target)):0,completed:target>0&&actual!=null&&actual>=target,unit:calories?'ккал':'км',label:calories?'Ккал с тренажёра':'Фактическая дистанция'};
 }
 function render({session:s,row,e,set,d,all,done}){
  const info={...(W.UNVRSLCardio?.settings?.(e)||{}),...(e.cardio||{})};
  const goal=C.duration(e,set),timers=s.focusState.cardioTimers||{},item=timers[C.key(row)],snap=C.snapshot(item,goal);
  const started=!!item&&item.status!=='idle',running=item?.status==='running',goalMetric=objective(info,d);
  const phase=C.intervalPhase(info,snap.actual),fraction=Math.round((goalMetric?goalMetric.progress:snap.progress)*100);
  const complete=goalMetric?goalMetric.completed:snap.completed;
  const goalCaption=goalMetric?`Цель ${fmt(goalMetric.target||0)} ${goalMetric.unit}`:`Цель ${C.clock(goal)}`;
  const clockValue=goalMetric?C.clock(snap.actual):C.clock(started?snap.remaining:goal);
  const mode=info.mode==='interval'?'Интервалы':info.mode==='distance'?'По дистанции':info.mode==='calories'?'По калориям':'Непрерывно';
  const field=(name,label,placeholder,step='1')=>`<label><span>${label}</span><input name="${name}" type="number" inputmode="decimal" step="${step}" min="0" value="${esc(d?.cardio?.[name]??d[name]??'')}" placeholder="${placeholder}"></label>`;
  const actualInput=goalMetric?`<label class="wf-cardio-goal-entry"><span>${goalMetric.label} · цель ${fmt(goalMetric.target||0)} ${goalMetric.unit}</span><input name="${goalMetric.key}" type="number" inputmode="decimal" step="${goalMetric.key==='distanceKm'?'0.01':'1'}" min="0" value="${esc(d?.cardio?.[goalMetric.key]??d[goalMetric.key]??'')}" placeholder="Введи фактическое значение"></label>`:'';
  const planned=[];
  const add=(label,value,unit='')=>{if(C.num(value)!=null&&C.num(value)>0)planned.push([label,`${fmt(value)}${unit?' '+unit:''}`]);};
  add('Скорость',info.speedKmh,'км/ч');
  if(e?.cardio?.inclinePct!=null&&C.num(info.inclinePct)!=null)planned.push(['Наклон',fmt(info.inclinePct)+' %']);
  if(info.mode==='distance')add('Цель',info.distanceKm,'км');else add('Дистанция',info.distanceKm,'км');
  if(info.mode==='calories')add('Цель',info.targetKcal,'ккал');
  add('Мощность',info.powerWatts,'Вт');
  add('Сопротивление',info.resistance);
  add('Пульс',info.heartRate,'уд/мин');
  const tempo=String(info.tempo||e.tempo||(info.mode==='interval'?'Интервальный':'Равномерный')).trim();
  if(tempo)planned.unshift(['Темп',tempo]);
  const estimate=W.UNVRSLCardio?.estimate?.(e,info,s);
  planned.push(['Оценка ккал',estimate?.kcal!=null?`${estimate.source==='met'?'≈ ':''}${fmt(estimate.kcal)} ккал`:'—']);
  const metrics=planned.map(([label,value])=>`<div><small>${esc(label)}</small><b>${esc(value)}</b></div>`).join('');
  const buttons=complete?'':running
   ?'<button type="button" class="wf-cardio-main-btn" data-wf-cardio-action="pause">Пауза</button>'
   :`<button type="button" class="wf-cardio-main-btn" data-wf-cardio-action="${started?'resume':'start'}">${started?'Продолжить':'Начать кардио'}</button>`;
  const status=complete?'Цель выполнена':running?'Идёт тренировка':started?'На паузе':'Готов к началу';
  return `<main class="wf-cardio-screen">
    <div class="wf-cardio-heading" style="background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important"><div class="wf-cardio-overline" style="background:var(--bg)!important;background-color:var(--bg)!important;background-image:none!important;border:0!important;box-shadow:none!important">Кардио <span>·</span> ${mode}</div>
    <h2 id="focus-title">${esc(W.displayExerciseName?.(e.n)||e.n)}</h2>
    <p>Блок ${done+1} из ${all.length} <span>·</span> ${goalCaption}</p></div>
    <section class="wf-cardio-clock-card" aria-label="Кардио-таймер">
      <div class="wf-cardio-clock-top"><span data-wf-cardio-status>${status}</span><span data-wf-cardio-pct>${fraction}%</span></div>
      <div class="wf-cardio-countdown" data-wf-cardio-clock role="timer" aria-label="Оставшееся время">${clockValue}</div>
      <div class="wf-cardio-caption">${goalMetric?"Прошедшее время · цель по показаниям тренажёра":goalCaption}</div>
      ${phase?`<div class="wf-cardio-phase" data-wf-cardio-phase>Раунд ${phase.round}/${phase.rounds} · ${phase.phase==='rest'?'Отдых':'Работа'} · ${C.clock(phase.remaining)}</div>`:''}
      <div class="wf-cardio-track" data-wf-cardio-track role="progressbar" aria-label="Прогресс кардио" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${fraction}"><i data-wf-cardio-progress style="width:${fraction}%"></i></div>
      <div class="wf-cardio-controls">${buttons}<button type="button" class="wf-cardio-reset" data-wf-cardio-action="reset" ${started?'':'disabled'}>Сбросить</button></div>
    </section>
    <form class="wf-cardio-result" data-wf-form="cardio" data-token="${row.ei}:${row.si}">
      ${actualInput}
      <details class="wf-cardio-more"><summary>Фактические показатели <span>Время · Пульс · Ккал</span></summary>
      ${metrics?`<div class="wf-cardio-plan-label">По плану</div><section class="wf-cardio-metrics">${metrics}</section>`:''}
      <div class="wf-cardio-fields">
        ${field('minutes','Время, мин','Автоматически','0.1')}
        ${info.mode==='distance'?'':field('distanceKm','Дистанция, км','Необязательно','0.01')}
        ${field('speedKmh','Скорость, км/ч','Необязательно','0.1')}
        ${field('inclinePct','Наклон, %','Необязательно','0.5')}
        ${field('powerWatts','Мощность, Вт','Необязательно')}
        ${field('resistance','Сопротивление','Необязательно')}
        ${field('heartRate','Пульс, уд/мин','Необязательно')}
        ${info.mode==='calories'?'':field('reportedKcal','Ккал с тренажёра','Необязательно')}
        
      </div></details>
      <button type="submit" class="wf-primary wf-cardio-save">Завершить и сохранить ✓</button>
    </form>
    <div class="wf-cardio-links" style="background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important"><button type="button" data-wf-cardio-navigation="1">Другие упражнения</button><button type="button" data-wf-action="skip">Пропустить</button></div>
    <details class="wf-cardio-nav"><summary>Перейти к упражнению</summary>
      <label><span>Выбери упражнение</span><select data-wf-select>
      ${all.filter(r=>!s.ex[r.ei].set[r.si].ok&&!s.ex[r.ei].set[r.si].skipped).map(r=>`<option value="${r.ei}:${r.si}" ${r.ei===row.ei?'selected':''}>${esc(s.ex[r.ei].n)}</option>`).join('')}
      </select></label></details>
  </main>`;
 }
 function read(form,session,row){
  const item=session?.focusState?.cardioTimers?.[C.key(row)];
  const minutes=C.num(form.elements.minutes?.value),seconds=minutes>0?Math.round(minutes*60):C.elapsed(item);
  return {weight:'',reps:String(seconds),rir:'unknown',technique:true,pain:false,cardio:{
    distanceKm:C.num(form.elements.distanceKm?.value),speedKmh:C.num(form.elements.speedKmh?.value),
    inclinePct:C.num(form.elements.inclinePct?.value),powerWatts:C.num(form.elements.powerWatts?.value),
    resistance:C.num(form.elements.resistance?.value),heartRate:C.num(form.elements.heartRate?.value),
    reportedKcal:C.num(form.elements.reportedKcal?.value)}};
 }
 function action({name,session:s,row,save,render,message}){
   const ex=s?.ex?.[row?.ei],set=ex?.set?.[row?.si],goal=C.duration(ex,set);
   if(!goal){message('Для кардио не задана длительность. Проверь программу.');return;}
   const timers=s.focusState.cardioTimers||={},key=C.key(row);
   timers[key]=C.command(timers[key],name);
   if(name==='reset')delete s.focusState.inputs;
   save();render();
 }
 function tick({root,session:s,row,save,render}){
   const el=root.querySelector('[data-wf-cardio-clock]');if(!el||!row||!s)return;
   const ex=s.ex[row.ei],set=ex?.set?.[row.si],goal=C.duration(ex,set),timers=s.focusState.cardioTimers||{},key=C.key(row),item=timers[key];
   const snap=C.snapshot(item,goal);
   if(snap.completed&&item?.status==='running'){
     timers[key]=C.command(item,'finish');timers[key].elapsedMs=goal*1000;save();render();return;
   }
   const started=!!item&&item.status!=='idle';
   el.textContent=C.clock(started?snap.remaining:goal);
   const pct=Math.round(snap.progress*100),progress=root.querySelector('[data-wf-cardio-progress]');
   if(progress)progress.style.width=pct+'%';
   const label=root.querySelector('[data-wf-cardio-pct]');if(label)label.textContent=pct+'%';
   const status=root.querySelector('[data-wf-cardio-status]');
   if(status)status.textContent=snap.completed?'Цель выполнена':item?.status==='running'?'Идёт тренировка':started?'На паузе':'Готов к началу';
   root.querySelector('[data-wf-cardio-track]')?.setAttribute('aria-valuenow',String(pct));
   const phase=root.querySelector('[data-wf-cardio-phase]'),p=C.intervalPhase(ex.cardio||{},snap.actual);
   if(phase&&p)phase.textContent=`Раунд ${p.round}/${p.rounds} · ${p.phase==='rest'?'Отдых':p.phase==='work'?'Работа':'Завершено'} · ${C.clock(p.remaining)}`;
 }
 W.UNVRSLFocusCardioUI=Object.freeze({render,read,action,tick});
})(window);
