'use strict';
(()=>{
  const W=window,D=document,A=W.WorkoutDomain,F=W.WorkoutFocusFlow;
  if(!A||!F||W.workoutFocus)return;
  const reg=workoutRegistry,N=A.number;
  let view=null,openedBy=null,writing=false;
  const state=()=>W.st,cur=()=>state()?.current;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>n==null?'–':Number(n).toLocaleString('ru-RU',{maximumFractionDigits:6});
  const clock=n=>`${String(Math.floor(Math.max(0,n)/60)).padStart(2,'0')}:${String(Math.max(0,n)%60).padStart(2,'0')}`;
  const session=()=>{const s=cur(),owner=W.cloud?.user?.id||state()?.accountOwnerId;return s&&!s.ended&&!s.pendingCompletion&&(!s.userId||!owner||s.userId===owner)?s:null};
  const root=D.createElement('section');root.id='workout-focus';root.hidden=true;
  root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','focus-title');
  D.body.appendChild(root);
  const style=D.createElement('style');style.textContent=`
    #workout-focus[hidden]{display:none!important}html.workout-focus-open,body.workout-focus-open{overflow:hidden!important}
    #workout-focus{position:fixed;inset:0;z-index:3100;background:var(--bg);color:var(--text);overflow:auto;overscroll-behavior:contain;padding:0 18px calc(32px + env(safe-area-inset-bottom));font-size:14px}
    #workout-focus button,#workout-focus select,#workout-focus input{font:inherit;color:var(--text)}
    #workout-focus{--wf-accent:var(--green)}html[data-theme=light] #workout-focus{--wf-accent:var(--action)}
    body.workout-focus-open>.nav{visibility:hidden!important;pointer-events:none!important}
    #workout-focus .wf-shell{max-width:520px;margin:auto;padding-bottom:20px}
    #workout-focus .wf-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:calc(14px + env(safe-area-inset-top)) 0 14px;background:var(--bg,#101410);border-bottom:1px solid var(--line,#303a32)}
    #workout-focus h2{font-size:26px;line-height:1.15;margin:18px 0 8px;overflow-wrap:anywhere}#workout-focus h3{font-size:16px;margin:0 0 10px}
    #workout-focus .wf-brand{font-weight:900;letter-spacing:-.5px}#workout-focus .wf-brand span{color:var(--wf-accent)}
    #workout-focus button,#workout-focus select{min-height:44px;touch-action:manipulation}#workout-focus button:disabled{opacity:.45;cursor:default}
    #workout-focus .wf-close{min-width:44px;border-radius:12px;background:var(--panel2,#263026);font-size:22px}
    #workout-focus .wf-sub{color:var(--muted,#99a49b);font-size:12px;line-height:1.5;margin:8px 0 14px}
    #workout-focus .wf-card{background:var(--panel,#1b211e);border:1px solid var(--line,#303a32);border-radius:20px;padding:16px;margin:14px 0}
    html body #workout-focus .wf-load{background:color-mix(in srgb,var(--action) 6%,var(--panel))!important;border-color:color-mix(in srgb,var(--action) 35%,var(--line))!important}
    #workout-focus .wf-number{font-size:50px;line-height:1.2;font-weight:900;letter-spacing:-1.5px;margin:8px 0;overflow-wrap:anywhere}#workout-focus .wf-number.wf-unset{font-size:28px;letter-spacing:-.5px;overflow-wrap:normal}#workout-focus :focus-visible{outline:2px solid var(--green)!important;outline-offset:3px}#workout-focus .wf-number small{font-size:16px;letter-spacing:0}
    #workout-focus .wf-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}#workout-focus .wf-grid>*{min-width:0}#workout-focus .wf-grid.wf-single{grid-template-columns:1fr}
    #workout-focus label>span{display:block;font-size:12px;color:var(--muted);margin-bottom:7px}
    #workout-focus input:not([type=checkbox]),#workout-focus select{width:100%;min-width:0;min-height:50px;border:1px solid var(--line);border-radius:13px;background:var(--panel2,#232b26);color:inherit;padding:12px;font-size:18px!important}
    #workout-focus .wf-rir{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin:9px 0}#workout-focus .wf-rir button{border-radius:11px;background:var(--panel2);border:1px solid var(--line);font-weight:800;padding:0}
    #workout-focus .wf-rir button[aria-pressed=true],#workout-focus .wf-step[aria-pressed=true]{background:var(--action);color:var(--action-text);border-color:var(--wf-accent)}
    #workout-focus .wf-steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;margin:14px 0}#workout-focus .wf-step{padding:0;border:1px solid var(--line);border-radius:12px;background:var(--panel2);font-weight:800}
    #workout-focus .wf-primary{width:100%;min-height:52px;margin-top:14px;border-radius:15px;background:var(--action);color:var(--action-text);font-weight:850;padding:12px}
    #workout-focus .wf-save{margin-top:18px;min-height:52px}
    #workout-focus .wf-secondary{width:100%;margin:8px 0;border-radius:13px;background:var(--panel2);border:1px solid var(--line);padding:10px;font-weight:750}
    #workout-focus .wf-check{display:flex;align-items:center;gap:10px;min-height:44px}#workout-focus .wf-check input{width:21px;height:21px;accent-color:var(--wf-accent)}
    #workout-focus .wf-progress{display:flex;gap:5px;margin-top:18px}#workout-focus .wf-progress i{height:5px;flex:1;border-radius:4px;background:var(--line)}#workout-focus .wf-progress i.done{background:var(--green)}
    #workout-focus .wf-badge{color:var(--wf-accent);font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.7px;margin-top:18px}
    #workout-focus .wf-banner{padding:12px 14px;border-left:3px solid var(--green);background:var(--panel2);border-radius:0 12px 12px 0;line-height:1.5;margin:14px 0}
    #workout-focus .wf-warning{border-color:var(--warning)}#workout-focus .wf-error{color:var(--error);line-height:1.5;min-height:22px}
    #workout-focus .wf-row{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)}
    #workout-focus .wf-timer{font-size:54px;font-weight:850;font-variant-numeric:tabular-nums;margin:20px 0;text-align:center}
    #workout-focus details{line-height:1.5;color:var(--muted);font-size:12px;margin:14px 0}#workout-focus summary{min-height:44px;display:flex;align-items:center;cursor:pointer}
    #workout-focus table{width:100%;border-collapse:collapse;font-size:12px}#workout-focus td,#workout-focus th{text-align:left;padding:9px;border-bottom:1px solid var(--line)}
    #workout-focus .wf-mode{display:grid;grid-template-columns:1fr 1fr;gap:8px}#workout-focus .wf-mode button[aria-pressed=true]{border-color:var(--wf-accent);color:var(--wf-accent)}
    .wf-launch{min-height:44px;width:100%;margin:10px 0;padding:12px;border-radius:15px;background:var(--panel2);border:1px solid var(--line);font-weight:800;color:var(--action)}
    .wf-inline{min-height:44px;padding:8px 14px;margin:7px 0;border-radius:12px;background:var(--panel2);border:1px solid var(--line);font-weight:750;color:var(--action)}
    body.workout-focus-open #timer.timer.show{z-index:3200!important}body.workout-focus-open #timer.timer{bottom:calc(12px + env(safe-area-inset-bottom))!important}body.workout-focus-open #workout-focus{padding-bottom:calc(110px + env(safe-area-inset-bottom))}
    #workout-focus .wf-stepper{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;background:var(--panel2);border:1px solid var(--line);border-radius:13px;overflow:hidden}
    #workout-focus .wf-stepper input{border:0!important;border-radius:0!important;text-align:center;padding:8px 0!important;font-weight:800}
    #workout-focus .wf-stepper button{background:transparent;color:var(--text);font-size:22px;padding:0;border:0}
    #workout-focus .wf-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:18px 0 8px;color:var(--muted);font-size:12px}
    #workout-focus .wf-pill{border-radius:20px;background:var(--panel2);padding:6px 10px;color:var(--text);font-size:11px;white-space:nowrap}
    #workout-focus .wf-effort{display:flex;justify-content:space-between;gap:12px;padding:12px;border-radius:13px;background:var(--panel2);font-size:12px;color:var(--muted);line-height:1.4}
    #workout-focus .wf-effort strong{color:var(--text)}#workout-focus .wf-effort span{text-align:right}
    #workout-focus .wf-help{padding:14px;border:1px solid var(--line);border-radius:17px;background:var(--panel);line-height:1.5;font-size:12px;color:var(--muted);margin:14px 0}
    #workout-focus .wf-help strong{color:var(--text);font-size:14px}#workout-focus .wf-help p{margin:8px 0 0}
    #workout-focus .wf-help .wf-pill{float:right;color:var(--wf-accent);font-weight:800}
    #workout-focus .wf-heading{display:flex;justify-content:space-between;align-items:center;margin-top:16px}#workout-focus .wf-heading h3{margin:0}
    #workout-focus .wf-unknown{padding:0 8px;background:transparent;color:var(--muted);border:1px solid var(--line);border-radius:10px;font-size:12px}
    #workout-focus .wf-unknown[aria-pressed=true]{border-color:var(--wf-accent);color:var(--wf-accent)}
    @media(max-width:370px){#workout-focus .wf-rir{grid-template-columns:repeat(4,minmax(0,1fr))}}
    @media(max-width:335px){#workout-focus .wf-steps{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(min-width:760px){#workout-focus{padding-left:30px;padding-right:30px}}@media(prefers-reduced-motion:reduce){#workout-focus *{scroll-behavior:auto!important}}
  `;D.head.appendChild(style);
  function save(){try{if(W.save?.({draftOnly:true})===false)throw Error('Не удалось сохранить черновик');return true}catch(error){message(error.message||'Не удалось сохранить данные');return false}}
  function message(text){const el=root.querySelector('[data-wf-status]');if(el)el.textContent=text;else W.toast?.(text)}
  function activeRow(){const s=session();if(!s)return null;const f=s.focusState||{};
    return F.queue(s).find(r=>F.token(r)===f.token&&!s.ex[r.ei].set[r.si].ok&&!s.ex[r.ei].set[r.si].skipped)||F.next(s);
  }
  function background(hidden){for(const el of D.querySelectorAll('body>.app,body>.nav')){el.inert=hidden;if(hidden)el.setAttribute('aria-hidden','true');else el.removeAttribute('aria-hidden');}}
  function show(mode){openedBy=root.hidden?D.activeElement:openedBy;view=mode;root.hidden=false;D.body.classList.add('workout-focus-open');D.documentElement.classList.add('workout-focus-open');background(true);render();root.querySelector('[data-wf-close]')?.focus({preventScroll:true})}
  function close(){const s=cur();if(s?.focusState)s.focusState.enabled=false;save();view=null;root.hidden=true;D.body.classList.remove('workout-focus-open');D.documentElement.classList.remove('workout-focus-open');background(false);openedBy?.focus?.({preventScroll:true});W.startPage?.()}
  function open(ei){const s=session();if(!s)return W.toast?.('Сначала открой активную тренировку');
    const existing=s.focusState||{},rows=F.queue(s),row=Number.isInteger(ei)?rows.find(r=>r.ei===ei&&!s.ex[r.ei].set[r.si].ok&&!s.ex[r.ei].set[r.si].skipped):null;
    s.focusState={...existing,enabled:true,token:row?F.token(row):existing.token,workoutId:s.id};if(row)delete s.focusState.rest;
    save();show('focus');
  }
  function inputDraft(row){const s=session(),f=s.focusState,key=F.token(row),e=s.ex[row.ei],set=e.set[row.si];
    if(f.inputs?.key!==key)f.inputs={key,weight:set.w==null||F.needsCalibration(e,set,A,reg)?'':String(set.w),reps:set.repEntered||set.actualReps!=null?A.repsText(e,set.actualReps??set.r,false,set):'',rir:set.actualRir==null?'':String(set.actualRir),technique:true,pain:false};
    return f.inputs;
  }
  function label(e,set,weight){const type=A.loadType(e,reg);if(type==='bodyweight_only')return 'Свой вес';if(type==='repetitions_only')return 'По повторениям';
    if(type==='time')return 'По времени';if(type==='distance')return 'По дистанции';
    const value=weight==null?'–':A.weightText(e,weight,reg,set);return `${value} кг${type==='per_dumbbell'?' на гантель':type==='per_side'?' на сторону':type==='bodyweight_assisted'?' помощи':''}`;
  }
  const measured=type=>['time','distance'].includes(type);
  const workSeconds=(e,set)=>N(set.seconds??set.workSeconds??e.workSeconds)??(N(set.min)||0)*60;
  function loadCard(e,set,s,unknown){const type=A.loadType(e,reg),metric=measured(type),body=['bodyweight_only','repetitions_only'].includes(type),band=metric||body?null:A.intensityBand(s,e,set);
    const target=type==='time'?workSeconds(e,set):N(set.distance??set.km),value=unknown?'Подобрать вес':metric&&target>0?`${fmt(target)} ${type==='time'?'сек':'км'}`:label(e,set,N(set.w));
    const title=metric?'Задание по программе':body?'Нагрузка':unknown?'Первый рабочий вес ещё не подобран':e.programWeightMode==='prescribed'?'Вес по назначению':'Рекомендованный вес';
    const detail=metric?`${e.repLabel?`${esc(e.repLabel)} · `:''}Запиши фактическ${type==='time'?'ое время в секундах':'ую дистанцию в километрах'}. Автовес здесь не используется.`:unknown?'Без истории нельзя рассчитать рабочий вес. После разминки выполни 1–3 пробы с посильной нагрузкой: укажи повторы и запас, затем скорректируй вес на шаг оборудования.':body?'Запиши выполненные повторы и запас после подхода.':band?`План недели · ${fmt(band.lo*100)}–${fmt(band.hi*100)}% e1RM`:'Под сегодняшние повторы и запас';
    const numeric=value.match(/^(.*?) кг(.*)$/);
    return `<div class="wf-card wf-load"><div class="wf-sub">${title}</div><div class="wf-number ${unknown||metric||body?'wf-unset':''}">${numeric?`${esc(numeric[1])}<small> кг${esc(numeric[2])}</small>`:esc(value)}</div><div class="wf-sub">${detail}${e.equipmentProfile?.name&&!metric?` · ${esc(e.equipmentProfile.name)}`:''}</div>${set.recommendation?.conflict?`<div class="wf-banner wf-warning">${esc(set.recommendation.conflict)}</div>`:''}${unknown?'<button class="wf-secondary" data-wf-action="calibrate">Подобрать первый вес</button><div class="wf-sub">Если запас пока непонятен, выбери «Пока не могу оценить». По такой пробе вес автоматически не повышается.</div>':''}</div>`;
  }
  function effortLabel(value){return value==='unknown'?'Запас пока не оценён':value===''?'Выбери запас после подхода':Number(value)===6?'Ещё 6+ повторений. Приблизительная оценка.':`Ещё ${value} повт. · около RPE ${10-Number(value)}`;}
  function effortWord(value){return value==='unknown'?'Не уверен':value===''?'Оцени усилие':Number(value)>=4?'Легко':Number(value)>=2?'Умеренно':Number(value)===1?'Тяжело':'Предельное усилие';}
  function rirMarkup(value){const badge=value===''||value==='unknown'?'RPE –':Number(value)===6?'RPE ≲4':`RPE ${10-Number(value)}`;
    return `<div class="wf-meta"><strong>Осталось повторений (RIR)</strong><span class="wf-pill" data-wf-rpe>${badge}</span></div><div class="wf-rir">${[0,1,2,3,4,5,6].map(n=>`<button type="button" data-wf-rir="${n}" aria-label="RIR ${n===6?'6 и больше':n}" aria-pressed="${value!==''&&value!=='unknown'&&Number(value)===n}">${n===6?'6+':n}</button>`).join('')}</div><div class="wf-effort"><strong data-wf-effort-word>${effortWord(value)}</strong><span data-wf-effort>${effortLabel(value)}</span></div><button type="button" class="wf-unknown" data-wf-rir="unknown" aria-pressed="${value==='unknown'}">Пока не могу оценить запас</button><div class="wf-help"><span class="wf-pill" data-wf-help-rpe>${badge}</span><strong>Как оценивать усилие?</strong><p>RIR показывает, сколько качественных повторений осталось бы до отказа. RPE оценивает субъективную трудность. Для RIR 0–5 здесь используется ориентировочное RPE = 10 − RIR.</p></div>`;
  }
  function fields(d,e,{calibration=false,type='reps',set={}}={}){
    const metric=type==='time'?'Время, сек':type==='distance'?'Дистанция, км':A.legReps(e)?'Повторы: левая / правая':'Повторы';
    const weighted=!['bodyweight_only','repetitions_only','time','distance'].includes(type);
    return `<div class="wf-grid ${weighted?'':'wf-single'}">${weighted?`<label><span>${A.loadType(e,reg)==='per_dumbbell'?'Вес одной гантели, кг':'Фактический вес, кг'}</span><div class="wf-stepper"><button type="button" data-wf-weight="-1" aria-label="Уменьшить вес на шаг оборудования">−</button><input name="weight" inputmode="decimal" value="${esc(d.weight)}" placeholder="Вес" autocomplete="off"><button type="button" data-wf-weight="1" aria-label="Увеличить вес на шаг оборудования">+</button></div></label>`:''}<label><span>${metric}</span><input name="reps" inputmode="${A.legReps(e)?'text':'decimal'}" value="${esc(d.reps)}" placeholder="Факт" autocomplete="off"></label></div>${weighted&&A.pairedLoad(e,reg,set)?'<div class="wf-sub">Вес одной стороны. Можно ввести 25 / 25.</div>':''}${measured(type)?'<div class="wf-sub">Для времени и дистанции запас повторений (RIR) не требуется.</div>':rirMarkup(d.rir)}<label class="wf-check"><input name="technique" type="checkbox" ${d.technique?'checked':''}>Техника сохранена</label><label class="wf-check"><input name="pain" type="checkbox" ${d.pain?'checked':''}>Возникла боль</label>${calibration?'<div class="wf-sub">Разминка выполняется отдельно. При боли останови подбор веса.</div>':''}`;
  }
  function auto(row){const s=session(),e=s.ex[row.ei],set=e.set[row.si];
    W.trainingLoadModel292?.run();const rec=set.recommendation;
    if(e.programWeightMode==='adaptive'&&rec&&(rec.sessionIds?.length||rec.nextSetSuggestion)&&rec.action!=='stop'&&A.applyAuto(set,rec))save();
  }
  function focusMarkup(){const s=session(),f=s.focusState;
    if(f.rest){const snap=W.workoutTimerSnapshot?.();if(snap?.end>Date.now()&&snap.workoutId===String(s.id))return `<div class="wf-badge">${esc(f.rest.label)}</div><h2 id="focus-title">Подход сохранён</h2><div class="wf-timer" data-wf-countdown></div><p class="wf-sub">${esc(f.rest.nextLabel||'Работа по этому блоку завершена')}</p><button class="wf-primary" data-wf-action="continue">Закончить отдых и продолжить</button>`;delete f.rest;}
    const row=activeRow();if(!row)return `<h2 id="focus-title">Все подходы отмечены</h2><p class="wf-sub">Результаты уже в текущей тренировке. Проверь итог и заверши её.</p><button class="wf-primary" data-wf-action="finish-workout">К завершению тренировки</button><button class="wf-secondary" data-wf-close>Вернуться к списку</button>`;
    f.token=F.token(row);auto(row);
    const e=s.ex[row.ei],set=e.set[row.si],d=inputDraft(row),range=A.repRange(e,set),effort=A.effortTarget(e,set,s),type=A.loadType(e,reg),rec=set.recommendation;
    const next=F.next(s,row),rest=F.restAfter(s,row,next),all=F.queue(s),done=all.filter(r=>s.ex[r.ei].set[r.si].ok||s.ex[r.ei].set[r.si].skipped).length;
    const unknownMember=F.groupCalibration(s,row,A,reg);
    const pendingByExercise=all.filter(r=>!s.ex[r.ei].set[r.si].ok&&!s.ex[r.ei].set[r.si].skipped).filter((r,i,a)=>a.findIndex(x=>x.ei===r.ei)===i);
    const unknown=F.needsCalibration(e,set,A,reg);
    return `<div class="wf-heading"><h3>Режим «Фокус»</h3><span class="wf-pill">W${s.programWeekNumber||s.w||1}</span></div><div class="wf-sub">UNVRSL FIT · Персональная нагрузка · ${done} / ${all.length}</div>
      <div class="wf-badge">${row.group?`${row.size===3?'Трисет':'Суперсет'} · круг ${row.round} из ${row.rounds} · ${row.pos+1}/${row.size}`:'Фокус'}</div>
      <h2 id="focus-title">${esc(W.displayExerciseName?.(e.n)||e.n)}</h2>
      <div class="wf-meta"><span>Подход ${row.si+1} из ${e.set.length}</span><span class="wf-pill">${['time','distance'].includes(type)?esc(e.repLabel||'По программе'):`${A.repRangeText(e,range)} повт. · RIR ${fmt(10-effort.hi)}–${fmt(10-effort.lo)}`}</span></div>
      <div class="wf-progress">${e.set.map(x=>`<i class="${x.ok||x.skipped?'done':''}"></i>`).join('')}</div>
      ${loadCard(e,set,s,unknown)}
      ${unknownMember&&!unknown?`<div class="wf-banner">Перед первым кругом подбери вес для ${esc(s.ex[unknownMember.ei].n)}.<button class="wf-secondary" data-wf-calibrate-index="${unknownMember.ei}">Подобрать вес до начала связки</button></div>`:''}
      ${f.notice?`<div class="wf-banner">${esc(f.notice)}</div>`:''}
      <form data-wf-form="work" data-token="${F.token(row)}">${fields(d,e,{type,set})}
      <div class="wf-sub">${row.group&&rest.kind==='transition'?'После записи – следующее упражнение связки.':`После записи – отдых ${rest.seconds} сек.`}${next?` Далее: ${esc(s.ex[next.ei].n)}.`:''}</div>
      <button type="submit" class="wf-primary wf-save" ${rec?.action==='stop'?'disabled':''}>${`Записать подход ${row.si+1} ✓`}</button></form>
      ${type==='time'&&workSeconds(e,set)>0?`<button class="wf-secondary" data-wf-work-seconds="${workSeconds(e,set)}">Запустить рабочий таймер · ${fmt(workSeconds(e,set))} сек</button>`:''}
      <button class="wf-secondary" data-wf-action="rest">Отдых ${rest.seconds||Number(e.rest)||90} сек</button>
      <details><summary>Навигация и выполненные подходы</summary><label><span>Открыть упражнение</span><select data-wf-select>${pendingByExercise.map(r=>`<option value="${F.token(r)}" ${r.ei===row.ei?'selected':''}>${esc(s.ex[r.ei].n)}</option>`).join('')}</select></label>
      ${e.set.map((x,i)=>x.ok?`<div class="wf-row"><span>✓ ${i+1}</span><span>${esc(A.setLabel(e,x,reg))}</span></div>`:'').join('')}
      <button class="wf-secondary" data-wf-action="skip">Пропустить этот подход</button>${F.calibrationAllowed(e,set,A,reg)?'<button class="wf-secondary" data-wf-action="calibrate">Повторить подбор веса</button>':''}</details>`;
  }
  function beginCalibration(ei){const s=session(),e=s?.ex?.[ei],target=e?.set?.find(x=>!x.ok&&!x.skipped);if(!e||!target||!F.calibrationAllowed(e,target,A,reg))return W.toast?.('Для этого упражнения первый вес задаётся вручную');
    let d=s.loadCalibrationDraft;
    if(!d||d.ei!==ei||d.committed||!A.loadComparable(e,d.exercise,reg,target,d.targetSet)){
      d={id:`${s.id}:cal:${W.crypto?.randomUUID?.()||Date.now()}`,ei,exercise:JSON.parse(JSON.stringify(e)),targetSet:JSON.parse(JSON.stringify(target)),attempts:[],targetIndex:e.set.indexOf(target),step:null,mode:'target',form:{weight:N(target.w)>0?String(target.w):'',reps:'',rir:'',technique:false,pain:false}};
      s.loadCalibrationDraft=d;
    }
    save();show('calibration');
  }
  function calibrationEvidence(d){return A.calibrationSession(d.exercise,d.targetSet,d.attempts,session(),reg,{id:d.id})}
  function probeResult(d,a=d.attempts.at(-1)){return a?F.probeDecision(d.exercise,d.targetSet,a,session(),A,reg,state().exerciseWeightProfiles||{},a.advancedStep??null):null;}
  function calibrationMarkup(){const s=session(),d=s.loadCalibrationDraft,e=s.ex[d.ei],ev=calibrationEvidence(d),estimate=ev?A.strengthEstimate(e,A.history(e,[ev],reg),reg,[],d.targetSet):null,count=ev?.ex[0].set.length||0;
    const target=F.probeTarget(e,d.targetSet,s,A,d.mode==='advanced'?d.step:null),last=d.attempts.at(-1),decision=probeResult(d),canCredit=decision?.credit&&d.mode==='target',canUseUnconfirmed=!count&&last?.rir==='unknown'&&last.technique&&decision.reps>=target.range.lo&&decision.reps<=target.range.hi;
    return `<div class="wf-badge">Первый рабочий вес · проба ${Math.min(3,d.attempts.length+1)} из 3</div><h2 id="focus-title">${esc(e.n)}</h2><div class="wf-sub">Проверяем вес под задание текущей тренировки. Обычно достаточно 1–3 проб; все ступени проходить не нужно.</div>
      <div class="wf-card wf-load"><div class="wf-sub">Сегодняшняя цель</div><h3>${A.repRangeText(e,target.range)} повт. · RIR ${fmt(target.rir.lo)}–${fmt(target.rir.hi)}</h3><div class="wf-sub">После разминки начни с лёгкой контролируемой нагрузки. Если не знаешь вес, возьми лёгкие гантели или минимальную посильную нагрузку тренажёра; для штанги при необходимости используй облегчённый гриф. После пробы приложение предложит сохранить вес, добавить или убрать один доступный шаг. Проходка до максимума не нужна.${e.superGroup?' Пробы выполняются отдельно до кругов связки; рабочие подходы запишешь в её порядке.':''}</div></div>
      <details><summary>Дополнительные ступени 12 / 10 / 8 / 6 / 4 / 2</summary><div class="wf-mode"><button class="wf-secondary" data-wf-mode="target" aria-pressed="${d.mode==='target'}">По заданию на сегодня</button><button class="wf-secondary" data-wf-mode="advanced" aria-pressed="${d.mode==='advanced'}">Отдельная ступень</button></div><div class="wf-steps">${F.steps.map(n=>`<button class="wf-step" data-wf-step="${n}" aria-pressed="${d.mode==='advanced'&&d.step===n}">${n}</button>`).join('')}</div><p>Для опытного пользователя. Низкие повторения не обязательны. Оценки для других диапазонов остаются предварительными.</p></details>
      ${decision?`<div class="wf-banner">${esc(decision.reason)}${last.rir==='unknown'?' Эта проба не используется как силовая оценка.':''}</div>`:''}
      ${canCredit&&!d.halted?'<button class="wf-primary" data-wf-action="credit-calibration">Зачесть подход и продолжить ✓</button><div class="wf-sub">Он станет первым рабочим подходом и будет учтён один раз.</div>':''}
      ${count&&!d.halted?`<button class="wf-secondary" data-wf-action="save-calibration">Сохранить предварительный вес${canCredit?' без зачёта подхода':''}</button>`:''}
      ${canUseUnconfirmed&&!d.halted?'<button class="wf-secondary" data-wf-action="use-unconfirmed">Использовать вес без силовой оценки</button>':''}
      ${d.halted?'<div class="wf-banner wf-warning">Подбор остановлен после боли. Не продолжай это упражнение.</div>':d.attempts.length<3?`<form data-wf-form="calibration">${fields(d.form,e,{calibration:true,set:d.targetSet})}<div class="wf-sub" data-wf-cal-rest></div><button type="submit" class="wf-primary" data-wf-cal-save>Записать пробу и отдыхать</button></form>`:'<div class="wf-banner">Три пробы записаны. Если вес ещё не подошёл, уточни его на следующей тренировке. Все записанные результаты сохранены в черновике.</div>'}
      ${d.attempts.map((a,i)=>`<div class="wf-row"><span>${i+1}. ${esc(a.weight)} кг × ${esc(a.reps)}</span><span>${a.rir==='unknown'?'RIR не оценён':`RIR ${esc(a.rir)}`}${a.pain?' · боль':!a.technique?' · техника':''}</span></div>`).join('')}
      ${estimate?.estimate>0?`<div class="wf-help"><strong>Предварительный e1RM: ${fmt(Number(estimate.estimate.toFixed(1)))} кг</strong><p>${count} пригодных проб, одна сессия. Уверенность низкая. Другие диапазоны повторений уточнятся по рабочим тренировкам.</p></div>`:''}
      ${W.workoutTimerSnapshot?.().end>Date.now()?'<button class="wf-secondary" data-wf-action="skip-cal-rest">Закончить отдых</button>':''}<button class="wf-secondary" data-wf-action="back-focus">Вернуться к тренировке</button>`;
  }
  function render(){if(!session()){view=null;root.hidden=true;D.body.classList.remove('workout-focus-open');D.documentElement.classList.remove('workout-focus-open');background(false);return}if(!view)return;
    if(view==='calibration'&&!cur().loadCalibrationDraft)view='focus';
    root.innerHTML=`<div class="wf-shell"><div class="wf-head"><div class="wf-brand">UNVRSL <span>FIT</span></div><button class="wf-close" data-wf-close aria-label="Закрыть режим фокуса">×</button></div>${view==='calibration'?calibrationMarkup():focusMarkup()}<p class="wf-error" data-wf-status role="status" aria-live="polite"></p></div>`;
    root.scrollTop=0;tickTimer();
  }
  function readForm(form){return {weight:form.elements.weight?.value??'',reps:form.elements.reps.value,rir:form.querySelector('[data-wf-rir]')?(view==='calibration'?cur().loadCalibrationDraft.form:cur().focusState.inputs).rir:'unknown',technique:form.elements.technique.checked,pain:form.elements.pain.checked}}
  function record(form,{calibrationAttempt=null}={}){const s=session(),row=activeRow();if(!s||!row||writing||form.dataset.token!==F.token(row))return;
    const e=s.ex[row.ei],set=e.set[row.si];if(set.ok||set.skipped)return;
    if(row.group){const unknown=F.groupCalibration(s,row,A,reg);if(unknown)return beginCalibration(unknown.ei);}
    const d=readForm(form),type=A.loadType(e,reg),weighted=!['bodyweight_only','repetitions_only','time','distance'].includes(type);
    if(d.pain){
      for(const ex of s.ex)if(A.loadComparable(e,ex,reg,set,ex.set?.[0]||{}))for(const x of ex.set||[])if(!x.ok){x.skipped=true;x.skipReason='pain';}
      (s.exerciseStops||(s.exerciseStops=[])).push({exerciseIndex:row.ei,reason:'pain',at:Date.now()});s.focusState.notice='Упражнение остановлено после сообщения о боли. Его оставшиеся подходы пропущены.';delete s.focusState.inputs;
      save();W.startPage?.();render();return;
    }
    const reps=['time','distance'].includes(type)?N(d.reps):A.parseReps(e,d.reps),weight=weighted?F.parseWeight(d.weight):N(set.w)||0,rir=N(d.rir);
    if(measured(type)&&!(reps>0))return message(type==='time'?'Укажи фактическое время больше нуля в секундах.':'Укажи фактическую дистанцию больше нуля в километрах.');
    if(!reps||weighted&&weight==null||d.rir!=='unknown'&&(rir==null||rir<0||rir>6))return message('Запиши фактический результат, вес и выбери RIR.');
    if(F.needsCalibration(e,set,A,reg)&&weight===0)return message('Рабочий вес пока неизвестен. Подбери его или введи фактическую нагрузку.');
    const actual={...set,w:weight,techniqueFailed:!d.technique,pain:false,effortUncertain:d.rir==='unknown',effortCensored:d.rir==='6',rpe:rir==null?'':10-rir,rir:rir??'',actualRpe:rir==null?null:10-rir,actualRir:rir};
    if(type==='time')actual.seconds=reps;else if(type==='distance')actual.distance=reps;else Object.assign(actual,{r:reps.total,actualReps:reps.total,repEntered:true,manualFields:{...set.manualFields,r:true},...(A.legReps(e)?{repsLeft:reps.left,repsRight:reps.right,repCounting:'total'}:{})});
    if(!A.validSet(e,actual,reg))return message('Проверь фактически выполненные повторения, время или дистанцию.');
    if(calibrationAttempt){actual.calibrationAttemptId=calibrationAttempt.id;actual.weightSource='calibrated';actual.manualOverride=false;}
    if(!calibrationAttempt&&weighted&&Math.abs((N(set.w)||0)-weight)>1e-6){actual.manualOverride=true;actual.weightSource='manual';}
    const before=JSON.parse(JSON.stringify(set)),revert=()=>{for(const key of Object.keys(set))delete set[key];Object.assign(set,before)};Object.assign(set,actual);writing=true;
    try{W.toggleSet(row.ei,row.si,{timer:false});if(!set.ok){revert();return message('Подход не записан. Проверь фактические значения.');}
      delete s.focusState.inputs;delete s.focusState.notice;
      const following=F.next(s,row),rest=F.restAfter(s,row,following);if(calibrationAttempt)rest.seconds=Math.max(0,rest.seconds-Math.floor((Date.now()-calibrationAttempt.at)/1000));s.focusState.token=following?F.token(following):null;
      if(rest.seconds>0){s.focusState.rest={...rest,nextLabel:following?`Далее: ${s.ex[following.ei].n}`:'Все подходы отмечены'};W.timer?.(rest.seconds,rest.label);}
      save();W.trainingLoadModel292?.run();render();return true;
    }catch(error){if(!set.ok)revert();message(error.message||'Не удалось записать подход');}finally{writing=false;}
  }
  function recordCalibration(form){const s=session(),d=s.loadCalibrationDraft,e=s.ex[d.ei];if(writing||d.halted||d.committed||d.attempts.length>=3)return;
    const now=W.workoutTimerSnapshot?.();if(now?.end>Date.now())return message('Дождись окончания отдыха или заверши его кнопкой.');
    const f=readForm(form),w=F.parseWeight(f.weight),reps=A.parseReps(e,f.reps),rir=N(f.rir);
    if(f.pain){d.halted=true;d.form=f;d.attempts.push({...f,weight:w,at:Date.now()});
      for(const ex of s.ex)if(A.loadComparable(e,ex,reg,d.targetSet,ex.set?.[0]||{}))for(const x of ex.set||[])if(!x.ok){x.skipped=true;x.skipReason='pain';}
      (s.exerciseStops||(s.exerciseStops=[])).push({exerciseIndex:d.ei,reason:'pain',at:Date.now()});W.stopTimer?.();save();render();return;}
    if(!(w>0)||!reps||!(A.performedReps(e,{r:reps.total,repsLeft:reps.left,repsRight:reps.right})>=1)||A.performedReps(e,{r:reps.total,repsLeft:reps.left,repsRight:reps.right})>20||f.rir!=='unknown'&&(rir==null||rir<0||rir>6))return message('Укажи вес больше нуля, фактические повторы от 1 до 20 и оцени запас или выбери «Пока не могу оценить».');
    const target=F.probeTarget(e,d.targetSet,s,A,d.mode==='advanced'?d.step:null);
    const attempt={...f,id:`${d.id}:${d.attempts.length+1}`,weight:w,targetRepMin:target.range.lo,targetRepMax:target.range.hi,advancedStep:d.mode==='advanced'?d.step:null,at:Date.now()};
    d.attempts.push(attempt);const decision=probeResult(d);
    d.form={weight:String(decision.nextWeight),reps:'',rir:'',technique:false,pain:false};save();W.timer?.(Number(e.rest)||120,'Отдых между пробными подходами');render();
  }
  function finishCalibration(credit=false,unconfirmed=false){const s=session(),d=s?.loadCalibrationDraft;if(!d||d.halted||d.committed||writing)return;
    const e=s.ex[d.ei],target=e?.set?.[d.targetIndex??e.set.findIndex(x=>!x.ok&&!x.skipped)];
    if(!target||target.ok||target.skipped||!A.loadComparable(e,d.exercise,reg,target,d.targetSet)||A.method(e,target)!==A.method(d.exercise,d.targetSet)||JSON.stringify(F.probeTarget(e,target,s,A))!==JSON.stringify(F.probeTarget(d.exercise,d.targetSet,s,A)))return message('Задание, оборудование или упражнение изменилось. Начни новый подбор веса.');
    const attempt=d.attempts.at(-1),decision=probeResult(d);
    if(credit&&!decision?.credit)return message('Проба не соответствует сегодняшнему заданию.');
    if(unconfirmed&&!(attempt?.rir==='unknown'&&attempt.technique&&decision.reps>=decision.target.range.lo&&decision.reps<=decision.target.range.hi))return message('Проверь результат последней пробы.');
    if(credit)attempt.credited=true;
    const ev=calibrationEvidence(d);if(!credit&&!unconfirmed&&!ev)return message('Пока нет пригодной пробы с сохранённой техникой и RIR 0–4.');
    if(ev&&!(s.calibrationSessions||[]).some(x=>x.id===ev.id))(s.calibrationSessions||(s.calibrationSessions=[])).push(ev);
    const rollback=()=>{if(ev)s.calibrationSessions=(s.calibrationSessions||[]).filter(x=>x.id!==ev.id);if(credit)delete attempt.credited;};
    if(!save()){rollback();return;}
    const previousFocus=s.focusState;
    s.focusState={...(s.focusState||{}),enabled:true,workoutId:s.id,token:`${d.ei}:${e.set.indexOf(target)}`,notice:'Первый вес сохранён под сегодняшнее задание. Другие диапазоны пока предварительные.'};
    delete s.focusState.inputs;delete s.focusState.rest;
    if(credit){
      // Save through the ordinary set validator. The consumed probe is omitted
      // from nested evidence, so it cannot become a second strength sample.
      s.focusState.inputs={key:s.focusState.token,...attempt,weight:String(attempt.weight)};
      const timerBefore=W.workoutTimerSnapshot?.();W.stopTimer?.();view='focus';render();
      if(!record(root.querySelector('form[data-wf-form="work"]'),{calibrationAttempt:attempt})){
        rollback();s.focusState=previousFocus;view='calibration';save();render();message('Подход не записан. Проба сохранена для повторной попытки.');
        if(timerBefore?.end>Date.now())W.timer?.(Math.ceil((timerBefore.end-Date.now())/1000),timerBefore.label);
        return;
      }
    }else{
      if(unconfirmed){target.w=attempt.weight;target.weightSource='trial_unconfirmed';s.focusState.notice='Вес выбран без силовой оценки. Запас пока не оценён; автоматического повышения по этой пробе не будет.';}
      W.stopTimer?.();W.trainingLoadModel292?.run();
      for(const ex of s.ex)for(const x of ex.set||[]){const r=x.recommendation;if(ex.programWeightMode==='adaptive'&&r?.sessionIds?.length&&A.applyAuto(x,r))ex.weightDecision='calibrated';}
      view='focus';
    }
    d.committed=true;save();W.startPage?.();render();
  }
  root.addEventListener('submit',event=>{event.preventDefault();if(event.target.dataset.wfForm==='work')record(event.target);else if(event.target.dataset.wfForm==='calibration')recordCalibration(event.target)});
  root.addEventListener('input',event=>{if(!session()||!event.target.name)return;const form=event.target.form;if(!form?.dataset.wfForm)return;const d=readForm(form);if(view==='calibration')cur().loadCalibrationDraft.form=d;else cur().focusState.inputs={...cur().focusState.inputs,...d};save()});
  root.addEventListener('change',event=>{if(!event.target.matches('[data-wf-select]'))return;cur().focusState.token=event.target.value;delete cur().focusState.inputs;save();render()});
  root.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||b.disabled)return;
    if(b.hasAttribute('data-wf-close'))return close();
    if(!session())return close();
    const s=session(),row=activeRow();
    if(b.dataset.wfCalibrateIndex!=null)return beginCalibration(Number(b.dataset.wfCalibrateIndex));
    if(b.dataset.wfWeight){const d=view==='calibration'?s.loadCalibrationDraft.form:inputDraft(row),e=view==='calibration'?s.ex[s.loadCalibrationDraft.ei]:s.ex[row.ei],input=b.form?.elements.weight;
      const current=F.parseWeight(input?.value??d.weight);if(current==null)return message('Сначала введи исходный вес.');
      d.weight=String(A.moveWeight(current,Number(b.dataset.wfWeight),A.profile(e,reg,state().exerciseWeightProfiles||{})));if(input)input.value=d.weight;save();return;
    }
    if(b.dataset.wfRir!=null){const value=b.dataset.wfRir,d=view==='calibration'?s.loadCalibrationDraft.form:inputDraft(row);d.rir=value;root.querySelectorAll('[data-wf-rir]').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));root.querySelector('[data-wf-effort]').textContent=effortLabel(value);root.querySelector('[data-wf-effort-word]').textContent=effortWord(value);root.querySelectorAll('[data-wf-rpe],[data-wf-help-rpe]').forEach(x=>x.textContent=value==='unknown'?'RPE –':Number(value)===6?'RPE ≲4':`RPE ${10-Number(value)}`);save();return;}
    if(b.dataset.wfStep){s.loadCalibrationDraft.step=Number(b.dataset.wfStep);s.loadCalibrationDraft.mode='advanced';save();render();return;}
    if(b.dataset.wfMode){s.loadCalibrationDraft.mode=b.dataset.wfMode;if(b.dataset.wfMode==='advanced'&&!s.loadCalibrationDraft.step)s.loadCalibrationDraft.step=12;save();render();return;}
    if(b.dataset.wfWorkSeconds){const sec=Number(b.dataset.wfWorkSeconds);if(sec>0)W.timer?.(sec,'Работа · '+s.ex[row.ei].n);return;}
    switch(b.dataset.wfAction){
      case 'calibrate':return beginCalibration(row.ei);
      case 'save-calibration':return finishCalibration();
      case 'credit-calibration':return finishCalibration(true);
      case 'use-unconfirmed':return finishCalibration(false,true);
      case 'restart-calibration':{const ei=s.loadCalibrationDraft.ei;delete s.loadCalibrationDraft;return beginCalibration(ei);}
      case 'back-focus':if(!s.focusState)s.focusState={enabled:true,workoutId:s.id};view='focus';return render();
      case 'skip-cal-rest':W.stopTimer?.();return render();
      case 'continue':delete s.focusState.rest;W.stopTimer?.();save();return render();
      case 'rest':{const r=F.restAfter(s,row);W.timer?.(r.seconds||Number(s.ex[row.ei].rest)||90,r.label);return;}
      case 'skip':s.ex[row.ei].set[row.si].skipped=true;s.ex[row.ei].set[row.si].skipReason='user';delete s.focusState.inputs;save();W.startPage?.();return render();
      case 'finish-workout':close();return W.finish?.();
    }
  });
  root.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();return;}if(event.key!=='Tab')return;const items=[...root.querySelectorAll('button:not(:disabled),input,select,summary')].filter(e=>!e.closest('details:not([open])')||e.tagName==='SUMMARY');const first=items[0],last=items.at(-1);if(event.shiftKey&&D.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&D.activeElement===last){event.preventDefault();first?.focus();}});
  function tickTimer(){if(root.hidden)return;const timer=W.workoutTimerSnapshot?.(),sec=timer?.workoutId===String(cur()?.id)?Math.max(0,Math.ceil((timer.end-Date.now())/1000)):0;
    const out=root.querySelector('[data-wf-countdown]');if(out)out.textContent=clock(sec);
    const note=root.querySelector('[data-wf-cal-rest]'),button=root.querySelector('[data-wf-cal-save]');if(note)note.textContent=sec?`Отдых ${clock(sec)}`:'';if(button)button.disabled=sec>0;
  }
  function timerEnded(event){const s=session();if(!s||root.hidden||event.detail?.workoutId!==String(s.id))return;if(view==='focus'&&s.focusState?.rest){delete s.focusState.rest;save();render();}else if(view==='calibration')render();}
  W.addEventListener('unvrsl:rest-finished',timerEnded);W.addEventListener('unvrsl:rest-stopped',timerEnded);
  const timerInterval=setInterval(tickTimer,250);W.addEventListener('pagehide',()=>{if(!root.hidden)save()});
  W.addEventListener('unload',()=>clearInterval(timerInterval),{once:true});
  function mount(){const s=session(),head=D.querySelector('#start .workout-head');if(s&&head&&!head.querySelector('[data-focus-open]')){const b=D.createElement('button');b.type='button';b.className='wf-launch';b.dataset.focusOpen='1';b.textContent='◎ Режим «Фокус»';b.onclick=()=>open();head.appendChild(b);}
    if(!s){if(view){root.hidden=true;view=null;D.body.classList.remove('workout-focus-open');D.documentElement.classList.remove('workout-focus-open');background(false);}return;}
    for(const card of D.querySelectorAll('#start .exercise')){
      if(card.querySelector('[data-focus-exercise]'))continue;
      const ei=[...card.querySelectorAll('[onclick*="toggleSet("]')].map(b=>Number(b.getAttribute('onclick').match(/toggleSet\((\d+),/)?.[1])).find(i=>s.ex[i]?.set?.some(x=>!x.ok&&!x.skipped));
      if(ei==null)continue;const b=D.createElement('button');b.type='button';b.className='wf-inline';b.dataset.focusExercise=String(ei);b.textContent='Фокус на упражнении';b.onclick=()=>open(ei);card.querySelector('.row')?.insertAdjacentElement('afterend',b);
    }
    if(s.focusState?.enabled&&D.querySelector('#start.active')&&root.hidden)show('focus');
  }
  W.addEventListener('unvrsl:workout-rendered',mount);
  W.addEventListener('unvrsl:workout-set-changed',()=>{if(!writing&&view==='focus'&&!root.hidden&&!root.contains(D.activeElement))render()});
  W.addEventListener('unvrsl:auth-changed',()=>{if(view){view=null;root.hidden=true;D.body.classList.remove('workout-focus-open');D.documentElement.classList.remove('workout-focus-open');background(false);}});
  W.addEventListener('unvrsl:cloud-ready',mount);W.addEventListener('unvrsl:modules-ready',mount);
  W.addEventListener('focus',()=>{if(view)render()});
  W.openLoadCalibration=ei=>beginCalibration(Number(ei));
  W.workoutFocus={open,close,calibrate:beginCalibration,render,mount};mount();
})();
