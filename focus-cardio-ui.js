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
  const metrics=[['Скорость',info.speedKmh,'км/ч'],['Наклон',info.inclinePct,'%'],['Дистанция',info.distanceKm,'км'],['Пульс',info.heartRate,'уд/мин'],['RPE',info.rpe,'']]
   .filter(([_,v])=>C.num(v)>0).map(([label,v,unit])=>`<div><small>${label}</small><b>${fmt(v)} <em>${unit}</em></b></div>`).join('');
  const buttons=snap.completed?'':running
   ?'<button type="button" class="wf-cardio-main-btn" data-wf-cardio-action="pause">Пауза</button>'
   :`<button type="button" class="wf-cardio-main-btn" data-wf-cardio-action="${started?'resume':'start'}">${started?'Продолжить':'Начать кардио'}</button>`;
  const status=snap.completed?'Цель выполнена':running?'Идёт тренировка':started?'На паузе':'Готов к началу';
  return `<main class="wf-cardio-screen">
    <div class="wf-cardio-heading"><div class="wf-cardio-overline">КАРДИО <span>·</span> ${mode}</div>
    <h2 id="focus-title">${esc(W.displayExerciseName?.(e.n)||e.n)}</h2>
    <p>Блок ${done+1} из ${all.length} <span>·</span> Цель ${C.clock(goal)}</p></div>
    <section class="wf-cardio-clock-card" aria-label="Кардио-таймер">
      <div class="wf-cardio-clock-top"><span data-wf-cardio-status>${status}</span><span data-wf-cardio-pct>${fraction}%</span></div>
      <div class="wf-cardio-countdown" data-wf-cardio-clock role="timer" aria-label="Оставшееся время">${C.clock(started?snap.remaining:goal)}</div>
      <div class="wf-cardio-caption">ОСТАЛОСЬ ИЗ ${C.clock(goal)}</div>
      ${phase?`<div class="wf-cardio-phase" data-wf-cardio-phase>Раунд ${phase.round}/${phase.rounds} · ${phase.phase==='rest'?'Отдых':'Работа'} · ${C.clock(phase.remaining)}</div>`:''}
      <div class="wf-cardio-track" data-wf-cardio-track role="progressbar" aria-label="Прогресс кардио" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${fraction}"><i data-wf-cardio-progress style="width:${fraction}%"></i></div>
      <div class="wf-cardio-controls">${buttons}<button type="button" class="wf-cardio-reset" data-wf-cardio-action="reset" ${started?'':'disabled'}>Сбросить</button></div>
    </section>
    ${metrics?`<section class="wf-cardio-metrics">${metrics}</section>`:''}
    <form class="wf-cardio-result" data-wf-form="cardio" data-token="${row.ei}:${row.si}">
      <div class="wf-cardio-result-title"><b>Результат</b><span>Время запишется из таймера</span></div>
      <details class="wf-cardio-more"><summary>Изменить фактические показатели <span>⌄</span></summary><div class="wf-cardio-fields">
        ${field('minutes','Время, мин','Автоматически','0.1')}
        ${field('distanceKm','Дистанция, км','Необязательно','0.01')}
        ${field('heartRate','Пульс, уд/мин','Необязательно')}
        ${field('reportedKcal','Ккал с тренажёра','Необязательно')}
        ${field('rpe','RPE (факт)','1–10','0.5')}
      </div></details>
      <button type="submit" class="wf-primary wf-cardio-save">Сохранить кардио ✓</button>
    </form>
    <div class="wf-cardio-links"><button type="button" data-wf-cardio-navigation="1">Упражнения</button><button type="button" data-wf-action="skip">Пропустить</button></div>
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
    distanceKm:C.num(form.elements.distanceKm?.value),heartRate:C.num(form.elements.heartRate?.value),
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
