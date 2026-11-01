'use strict';
(function(W){
 const C=W.UNVRSLFocusCardio;
 if(!C)return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 const fmt=n=>Number(n).toLocaleString('ru-RU',{maximumFractionDigits:1});
 function render({session:s,row,e,set,d,all,done}){
  const info={...(W.UNVRSLCardio?.settings?.(e)||{}),...(e.cardio||{})};
  const goal=C.duration(e,set),timers=s.focusState.cardioTimers||{},item=timers[C.key(row)],snap=C.snapshot(item,goal);
  const started=!!item&&item.status!=='idle',running=item?.status==='running';
  const phase=C.intervalPhase(info,snap.actual),fraction=Math.round(snap.progress*100);
  const mode=info.mode==='interval'?'Интервалы':info.mode==='distance'?'Дистанция':'Непрерывно';
  const field=(name,label,placeholder,step='1')=>`<label><span>${label}</span><input name="${name}" type="number" inputmode="decimal" step="${step}" min="0" value="${esc(d[name]??'')}" placeholder="${placeholder}"></label>`;
  const planned=[];
  const add=(label,value,unit='')=>{if(C.num(value)!=null&&C.num(value)>0)planned.push([label,`${fmt(value)}${unit?' '+unit:''}`]);};
  add('Скорость',info.speedKmh,'км/ч');
  if(e?.cardio?.inclinePct!=null&&C.num(info.inclinePct)!=null)planned.push(['Наклон',fmt(info.inclinePct)+' %']);
  add('Дистанция',info.distanceKm,'км');
  add('Мощность',info.powerWatts,'Вт');
  add('Сопротивление',info.resistance);
  add('Пульс',info.heartRate,'уд/мин');
  const tempo=String(info.tempo||e.tempo||(info.mode==='interval'?'Интервальный':'Равномерный')).trim();
  if(tempo)planned.unshift(['Темп',tempo]);
  const estimate=W.UNVRSLCardio?.estimate?.(e,info,s);
  planned.push(['Калории',estimate?.kcal!=null?`${estimate.source==='met'?'≈ ':''}${fmt(estimate.kcal)} ккал`:'—']);
  const metrics=planned.map(([label,value])=>`<div><small>${esc(label)}</small><b>${esc(value)}</b></div>`).join('');
  const buttons=snap.completed?'':running
   ?'<button type="button" class="wf-cardio-main-btn" data-wf-cardio-action="pause">Пауза</button>'
   :`<button type="button" class="wf-cardio-main-btn" data-wf-cardio-action="${started?'resume':'start'}">${started?'Продолжить':'Начать кардио'}</button>`;
  const status=snap.completed?'Цель выполнена':running?'Идёт тренировка':started?'На паузе':'Готов к началу';
  return `<main class="wf-cardio-screen">
    <div class="wf-cardio-heading" style="background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important"><div class="wf-cardio-overline" style="background:var(--bg)!important;background-color:var(--bg)!important;background-image:none!important;border:0!important;box-shadow:none!important">Кардио <span>·</span> ${mode} ${C.num(info.rpe)>0?`<span>·</span> RPE ${fmt(info.rpe)}`:''}</div>
    <h2 id="focus-title">${esc(W.displayExerciseName?.(e.n)||e.n)}</h2>
    <p>Блок ${done+1} из ${all.length} <span>·</span> Цель ${C.clock(goal)}</p></div>
    <section class="wf-cardio-clock-card" aria-label="Кардио-таймер">
      <div class="wf-cardio-clock-top"><span data-wf-cardio-status>${status}</span><span data-wf-cardio-pct>${fraction}%</span></div>
      <div class="wf-cardio-countdown" data-wf-cardio-clock role="timer" aria-label="Оставшееся время">${C.clock(started?snap.remaining:goal)}</div>
      <div class="wf-cardio-caption">Цель ${C.clock(goal)}</div>
      ${phase?`<div class="wf-cardio-phase" data-wf-cardio-phase>Раунд ${phase.round}/${phase.rounds} · ${phase.phase==='rest'?'Отдых':'Работа'} · ${C.clock(phase.remaining)}</div>`:''}
      <div class="wf-cardio-track" data-wf-cardio-track role="progressbar" aria-label="Прогресс кардио" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${fraction}"><i data-wf-cardio-progress style="width:${fraction}%"></i></div>
      <div class="wf-cardio-controls">${buttons}<button type="button" class="wf-cardio-reset" data-wf-cardio-action="reset" ${started?'':'disabled'}>Сбросить</button></div>
    </section>
    <form class="wf-cardio-result" data-wf-form="cardio" data-token="${row.ei}:${row.si}">
      <details class="wf-cardio-more"><summary>Фактические показатели <span>Время · Наклон · Ккал · RPE</span></summary>
      ${metrics?`<div class="wf-cardio-plan-label">По плану</div><section class="wf-cardio-metrics">${metrics}</section>`:''}
      <div class="wf-cardio-fields">
        ${field('minutes','Время, мин','Автоматически','0.1')}
        ${field('distanceKm','Дистанция, км','Необязательно','0.01')}
        ${field('speedKmh','Скорость, км/ч','Необязательно','0.1')}
        ${field('inclinePct','Наклон, %','Необязательно','0.5')}
        ${field('powerWatts','Мощность, Вт','Необязательно')}
        ${field('resistance','Сопротивление','Необязательно')}
        ${field('heartRate','Пульс, уд/мин','Необязательно')}
        ${field('reportedKcal','Ккал с тренажёра','Необязательно')}
        ${field('rpe','RPE (факт)','1–10','0.5')}
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
    reportedKcal:C.num(form.elements.reportedKcal?.value),rpe:C.num(form.elements.rpe?.value)}};
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
