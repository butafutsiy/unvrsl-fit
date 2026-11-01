'use strict';
(()=>{
  const W=window,D=document;if(W.__unvrslFreeWorkoutV335)return;W.__unvrslFreeWorkoutV335=true;W.__unvrslClientFreeWorkoutV334=true;
  const E=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const N=v=>WorkoutDomain.number(v);
  const userId=()=>String(W.cloud?.user?.id||'');
  const canUse=()=>!!userId();
  const draft=()=>{if(!st.clientFreeWorkoutDraftV334||typeof st.clientFreeWorkoutDraftV334!=='object')st.clientFreeWorkoutDraftV334={};const id=userId();if(!Array.isArray(st.clientFreeWorkoutDraftV334[id]))st.clientFreeWorkoutDraftV334[id]=[];return st.clientFreeWorkoutDraftV334[id]};
  const persist=()=>{try{save()}catch(_){ }};
  const norm=v=>String(v??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[‐‑‒–—-]+/g,' ').replace(/[()·•:]+/g,' ').replace(/\s+/g,' ').trim();
  function catalogItems(){
    const source=typeof W.catalogRecords==='function'?W.catalogRecords():W.UNVRSL_EXERCISES||[];
    const seen=new Set();
    return (Array.isArray(source)?source:[]).map(e=>{
      const name=String(e.strictName||(typeof W.ruExerciseName==='function'?W.ruExerciseName(e.n):e.n)||'').trim();
      const id=String(e.id||e.rawId||workoutRegistry.identity({n:name})||'');
      if(!name||!id||seen.has(id))return null;seen.add(id);
      const body=typeof BP_RU==='object'?BP_RU[e.bp]||e.bp:e.bp;
      const equipment=typeof EQ_RU==='object'?EQ_RU[e.eq]||e.eq:e.eq;
      const target=typeof W.ruTarget==='function'?W.ruTarget(e.tg):e.tg;
      const aliases=W.UNVRSL_EXERCISE_REGISTRY_V331?.aliases?.(name)||[];
      return{id,name,kind:e.bp==='cardio'||!!e.cardioMachine?'cardio':'strength',cardioMachineId:e.cardioMachine?.id||null,body:String(body||''),equipment:String(equipment||''),target:String(target||''),search:norm([name,e.n,e.sourceName,...(Array.isArray(e.aliases)?e.aliases:[]),...aliases,body,equipment,target].join(' '))};
    }).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name,'ru'));
  }
function rows(){
  const items=draft();
  const identity=x=>x.kind==='cardio'||!!(W.UNVRSLCardio?.lookup(x.name)?.cardioMachine);
  if(!items.length)return '<div class="cfw-empty">Пока нет упражнений. Выбери первое движение выше.</div>';
  return items.map((x,i)=>{
    const cardio=identity(x);
    const cfg=x.cardio||{durationMin:30,mode:'steady',intensity:'moderate'};
    const data=cardio
      ? W.UNVRSLCardio?.summary({n:x.name,cardio:cfg,cardioMachineId:x.cardioMachineId})||`${cfg.durationMin||30} мин`
      : `${x.sets} × ${x.repMin===x.repMax?x.repMin:`${x.repMin}–${x.repMax}`} · ${x.weightMode==='auto'?'Автовес':E(WorkoutDomain.setLabel({exerciseId:x.exerciseId,n:x.name},{w:x.weight,r:x.repMin},workoutRegistry).split(' × ')[0])} · RPE ${String(x.rpe).replace('.',',')} · RIR ${String(x.rir??Math.max(0,10-Number(x.rpe))).replace('.',',')}`;
    return `<article class="cfw-row"><div class="cfw-row-icon" aria-hidden="true">${cardio?'◷':'⌑'}</div><div class="cfw-row-info"><small>${cardio?'Кардио':'Силовое'}</small><b>${E(x.name)}</b><span>${E(data)}</span></div><button type="button" onclick="clientFreeWorkoutRemoveV334(${i})" aria-label="Удалить ${E(x.name)}">×</button></article>`;
  }).join('');
}
    let selectedExercise=null;
function builder(){
  selectedExercise=null;
  const items=catalogItems();
  W.modal?.(`<div class="sheet-grabber"></div>
    <div class="cfw-head"><div><div class="cfw-kicker">СВОБОДНАЯ ТРЕНИРОВКА</div><h2>Собрать тренировку</h2></div><button class="btn tiny" onclick="closeModal()" aria-label="Закрыть">✕</button></div>
    <section class="cfw-surface cfw-pick">
      <div class="cfw-section-title"><span class="cfw-step">01</span><b>Упражнение</b></div>
      <div id="cfwSearchBox"><input id="cfwExercise" type="search" placeholder="Найти упражнение..." autocomplete="off" aria-label="Поиск упражнения"><div class="cfw-picker-meta" id="cfwPickerCount">Начни вводить название</div><div id="cfwResults" class="cfw-picker-results" hidden role="listbox" aria-label="Упражнения"></div></div>
      <div id="cfwSelected" class="cfw-selected" hidden><div><small id="cfwSelectedType">Силовое</small><b id="cfwSelectedName"></b></div><button type="button" id="cfwChange">Изменить</button></div>
    </section>
    <section id="cfwStrengthBox" class="cfw-surface" hidden>
      <div class="cfw-section-title"><span class="cfw-step">02</span><b>Силовая нагрузка</b></div>
      <div class="cfw-form"><label><span>Подходы</span><input id="cfwSets" type="number" inputmode="numeric" min="1" max="12" value="3"></label><div class="cfw-reps-field" role="group" aria-label="Повторения"><span>Повторения</span><div class="cfw-reps-range"><input id="cfwRepMin" type="number" inputmode="numeric" min="1" max="100" value="8" aria-label="Повторения от"><span aria-hidden="true">–</span><input id="cfwRepMax" type="number" inputmode="numeric" min="1" max="100" value="12" aria-label="Повторения до"></div></div><div class="cfw-effort-field" role="group" aria-label="Интенсивность"><span>Интенсивность</span><div class="cfw-effort-range"><label><small>RPE</small><input id="cfwRpe" type="number" inputmode="decimal" min="6" max="10" step="0.5" value="8" aria-label="RPE"></label><span class="cfw-effort-divider" aria-hidden="true"></span><label><small>RIR</small><input id="cfwRir" type="number" inputmode="decimal" min="0" max="4" step="0.5" value="2" aria-label="RIR"></label></div></div><label><span>Рабочий вес</span><input id="cfwWeight" type="number" inputmode="decimal" min="0" max="999" step="any" value="0"></label><label><span>Отдых, сек</span><input id="cfwRest" type="number" inputmode="numeric" min="15" max="600" step="15" value="90"></label></div>
      <label class="cfw-mode-field"><span>Подбор веса</span><select id="cfwWeightMode"><option value="manual">Задать вручную</option><option value="auto">Автоматически по истории</option></select></label><p class="cfw-note" id="cfwWeightNote">Для упражнений с собственным весом можно указать 0 кг.</p>
    </section>
    <section id="cfwCardioBox" class="cfw-surface" hidden>
      <div class="cfw-section-title"><span class="cfw-step">02</span><b>Кардионагрузка</b></div>
      <div class="cfw-form"><label class="cfw-wide"><span>Режим</span><select id="cfwCardioMode"><option value="steady">Непрерывное кардио</option><option value="interval">Интервальное кардио</option><option value="distance">По дистанции</option></select></label>
      <label class="cfw-wide" id="cfwCardioMinutesBox"><span>Время, мин</span><input id="cfwCardioMinutes" type="number" inputmode="decimal" min="1" max="1440" step="0.5" value="30"></label>
      <label class="cfw-wide"><span>Интенсивность</span><select id="cfwCardioIntensity"><option value="light">Лёгкая</option><option value="moderate" selected>Умеренная</option><option value="vigorous">Высокая</option></select></label></div>
      <div id="cfwCardioIntervalFields" class="cfw-form cfw-interval-form" hidden><label><span>Раундов</span><input id="cfwCardioRounds" type="number" inputmode="numeric" min="1" max="100" value="8"></label><label><span>Работа, сек</span><input id="cfwCardioWork" type="number" inputmode="numeric" min="1" max="3600" value="30"></label><label><span>Отдых, сек</span><input id="cfwCardioRest" type="number" inputmode="numeric" min="0" max="3600" value="60"></label></div>
      <details class="cfw-more"><summary>Дополнительные показатели</summary><div class="cfw-form">
        <label><span>Дистанция, км</span><input id="cfwCardioDistance" type="number" inputmode="decimal" min="0" max="1000" step=".01"></label>
        <label><span>Скорость, км/ч</span><input id="cfwCardioSpeed" type="number" inputmode="decimal" min="0" max="40" step=".1"></label>
        <label><span>Наклон, %</span><input id="cfwCardioIncline" type="number" inputmode="decimal" min="0" max="25" step=".5"></label>
        <label><span>Сопротивление</span><input id="cfwCardioResistance" type="number" inputmode="decimal" min="0" max="100"></label>
        <label><span>Мощность, Вт</span><input id="cfwCardioPower" type="number" inputmode="numeric" min="0" max="3000"></label>
        <label><span>Пульс, уд/мин</span><input id="cfwCardioHr" type="number" inputmode="numeric" min="0" max="250"></label>
        <label><span>Калории с тренажёра</span><input id="cfwCardioKcal" type="number" inputmode="numeric" min="0" max="10000"></label>
        <label><span>Масса тела, кг</span><input id="cfwCardioMass" type="number" inputmode="decimal" min="0" max="500" step=".1"></label>
      </div></details><p class="cfw-note">Калории рассчитываются приблизительно по MET или берутся из показаний тренажёра.</p>
    </section>
    <button id="cfwAdd" class="btn full cfw-add" onclick="clientFreeWorkoutAddV334()" disabled>＋ Добавить упражнение</button>
    <section class="cfw-draft"><div class="cfw-section-title"><b>Твоя тренировка</b><span id="cfwDraftCount">${draft().length} упр.</span></div><div id="cfwRows" class="cfw-rows">${rows()}</div></section>
    <div class="cfw-actions"><button class="btn cfw-clear" onclick="clientFreeWorkoutClearV334()"${draft().length?'':' disabled'}>Очистить</button><button class="btn primary" onclick="clientFreeWorkoutStartV334()"${draft().length?'':' disabled'}>Начать тренировку</button></div>`);
  const input=D.getElementById('cfwExercise'),results=D.getElementById('cfwResults'),count=D.getElementById('cfwPickerCount'),chosen=D.getElementById('cfwSelected');
  if(!input||!results)return;
  let visible=[];
  const render=()=>{
    const q=norm(input.value);
    if(q.length<2){visible=[];results.hidden=true;count.textContent="Введи минимум 2 символа для поиска";return}
    visible=items.filter(item=>item.search.includes(q)||q.split(' ').every(token=>item.search.includes(token))).slice(0,35);
    count.textContent=visible.length?`Найдено: ${visible.length}${visible.length===35?' · уточни запрос':''}`:'Ничего не найдено';
    results.hidden=false;
    results.innerHTML=visible.map((item,i)=>`<button type="button" class="cfw-picker-option" role="option" data-cfw-index="${i}"><b>${E(item.name)}</b><small>${E(item.kind==='cardio'?'Кардио':[item.body,item.equipment].filter(Boolean).join(' · '))}</small></button>`).join('');
  };
  const choose=item=>{
    if(!item)return;
    selectedExercise=item;input.value=item.name;results.hidden=true;
    D.getElementById('cfwSearchBox').hidden=true;chosen.hidden=false;D.getElementById('cfwSelectedName').textContent=item.name;D.getElementById('cfwSelectedType').textContent=item.kind==='cardio'?'Кардио':'Силовое';
    D.getElementById('cfwStrengthBox').hidden=item.kind==='cardio';
    D.getElementById('cfwCardioBox').hidden=item.kind!=='cardio';
    D.getElementById('cfwAdd').disabled=false;
    if(item.kind!=='cardio'){
      const exercise=workoutRegistry.resolve({exerciseId:item.id,n:item.name});
      if(exercise)D.getElementById('cfwWeight').step=WorkoutDomain.profile(exercise,workoutRegistry,st.exerciseWeightProfiles||{}).step||'any';
    }
  };
  results.addEventListener('click',event=>{const button=event.target.closest('[data-cfw-index]');if(button)choose(visible[Number(button.dataset.cfwIndex)])});
  input.addEventListener('input',()=>{selectedExercise=null;chosen.hidden=true;render()});
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&visible.length){event.preventDefault();choose(visible[0]);input.blur()}});
  D.getElementById('cfwChange')?.addEventListener('click',()=>{selectedExercise=null;chosen.hidden=true;D.getElementById('cfwSearchBox').hidden=false;D.getElementById('cfwStrengthBox').hidden=true;D.getElementById('cfwCardioBox').hidden=true;D.getElementById('cfwAdd').disabled=true;input.value='';render();input.focus({preventScroll:true})});
  D.getElementById('cfwCardioMode')?.addEventListener('change',()=>{
    const interval=D.getElementById('cfwCardioMode').value==='interval';
    D.getElementById('cfwCardioIntervalFields').hidden=!interval;
    D.getElementById('cfwCardioMinutesBox').hidden=interval;
  });
  const rpeInput=D.getElementById('cfwRpe'),rirInput=D.getElementById('cfwRir');
  const synchronizeEffort=(edited,other,reverse=false)=>{
    const raw=String(edited?.value??'').trim().replace(',','.');
    if(raw==='')return;
    const number=Number(raw);
    if(!Number.isFinite(number))return;
    const low=reverse?0:6,high=reverse?4:10;
    const bounded=Math.max(low,Math.min(high,Math.round(number*2)/2));
    other.value=String(Number((10-bounded).toFixed(1)));
    if(String(edited.value)!==String(bounded)&&Number(edited.value)!==bounded)edited.value=String(bounded);
  };
  rpeInput?.addEventListener('change',()=>synchronizeEffort(rpeInput,rirInput));
  rirInput?.addEventListener('change',()=>synchronizeEffort(rirInput,rpeInput,true));
  rpeInput?.addEventListener('input',()=>synchronizeEffort(rpeInput,rirInput));
  rirInput?.addEventListener('input',()=>synchronizeEffort(rirInput,rpeInput,true));
  D.getElementById('cfwWeightMode')?.addEventListener('change',()=>{
    const auto=D.getElementById('cfwWeightMode').value==='auto';
    D.getElementById('cfwWeight').disabled=auto;
    D.getElementById('cfwWeightNote').textContent=auto?'Если истории нет, после запуска появится «Тестовые подходы»: 1–3 пробы с весом, повторениями и RIR. Сохраним расчёт для следующих тренировок.':'Для упражнений с собственным весом можно указать 0 кг.';
  });
  render();
}
    function readNumber(id,fallback,min,max){const n=N(D.getElementById(id)?.value);return n==null?fallback:Math.max(min,Math.min(max,n))}
  W.clientFreeWorkoutOpenV334=builder;
  W.clientFreeWorkoutAddV334=function(){
  const selected=selectedExercise;
  if(!selected)return W.toast?.('Выбери упражнение из списка');
  const common={id:`cfw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,name:selected.name,exerciseId:selected.id,kind:selected.kind};
  if(selected.kind==='cardio'){
    const value=id=>D.getElementById(id)?.value;
    const positiveOptional=(id,max)=>{const n=N(value(id));return n==null||n<=0?null:Math.min(n,max)};
    const zeroOptional=(id,max)=>{const raw=value(id);const n=N(raw);return raw==null||raw===''||n==null?null:Math.max(0,Math.min(n,max))};
    const mode=value('cfwCardioMode')||'steady';
    const cardio={mode,intensity:value('cfwCardioIntensity')||'moderate',durationMin:mode==='interval'?null:positiveOptional('cfwCardioMinutes',1440),rounds:Math.round(readNumber('cfwCardioRounds',8,1,100)),workSeconds:Math.round(readNumber('cfwCardioWork',30,1,3600)),restSeconds:Math.round(readNumber('cfwCardioRest',60,0,3600)),distanceKm:positiveOptional('cfwCardioDistance',1000),speedKmh:positiveOptional('cfwCardioSpeed',40),inclinePct:zeroOptional('cfwCardioIncline',25),resistance:zeroOptional('cfwCardioResistance',100),powerWatts:positiveOptional('cfwCardioPower',3000),heartRate:positiveOptional('cfwCardioHr',250),reportedKcal:positiveOptional('cfwCardioKcal',10000),weightKg:positiveOptional('cfwCardioMass',500)};
    if(mode!=='interval'&&!cardio.durationMin)return W.toast?.('Укажи длительность кардио');
    if(mode==='distance'&&!cardio.distanceKm)return W.toast?.('Укажи дистанцию');
    draft().push({...common,cardioMachineId:selected.cardioMachineId,cardio});
  }else{
    const repMin=Math.round(readNumber('cfwRepMin',8,1,100)),repMax=Math.max(repMin,Math.round(readNumber('cfwRepMax',repMin,1,100)));
    const rpe=Math.round(readNumber('cfwRpe',8,6,10)*2)/2;
    draft().push({...common,weightMode:D.getElementById('cfwWeightMode')?.value||'manual',sets:Math.round(readNumber('cfwSets',3,1,12)),repMin,repMax,weight:readNumber('cfwWeight',0,0,999),rpe,rir:Number((10-rpe).toFixed(1)),rest:Math.round(readNumber('cfwRest',90,15,600))});
  }
  persist();
  builder();
};
  W.clientFreeWorkoutRemoveV334=function(index){draft().splice(Number(index),1);persist();builder()};
  W.clientFreeWorkoutClearV334=function(){if(!draft().length||!W.confirm('Очистить список упражнений?'))return;draft().splice(0);persist();builder()};
  function program(){
  const id=`free-workout-v335-${userId()}`,items=draft();
  const ex=items.map(item=>{
    const meta=workoutRegistry.resolve({exerciseId:item.exerciseId,n:item.name})||{};
    const isCardio=item.kind==='cardio'||!!W.UNVRSLCardio?.lookup(item.name)?.cardioMachine;
    if(isCardio){
      const cardio={mode:'steady',intensity:'moderate',durationMin:30,...item.cardio};
       // Remove obsolete effort metrics from saved cardio drafts.
       delete cardio.rpe;delete cardio.rir;
      const durationSec=cardio.mode==='interval'
        ? Math.max(1,Math.round(cardio.rounds||1))*Math.max(1,Math.round(cardio.workSeconds||60))
          +Math.max(0,Math.round((cardio.rounds||1)-1))*Math.max(0,Math.round(cardio.restSeconds||0))
        : Math.round(Math.max(1,Number(cardio.durationMin)||30)*60);
      const machineId=item.cardioMachineId||meta.cardioMachine?.id||W.UNVRSLCardio?.lookup(item.name)?.cardioMachine?.id||null;
      return {id:item.id,n:item.name,exerciseId:meta.id||item.exerciseId,sourceId:meta.id||null,bp:'cardio',kind:'cardio',loadType:'time',workMode:'timer',method:'STANDARD',cardioMachineId:machineId,cardio,durationSec,workSeconds:durationSec,rest:0,note:'Свободная тренировка',sets:[{label:'1',w:0,r:0,workSeconds:durationSec,reportedKcal:cardio.reportedKcal??null,weightKg:cardio.weightKg??null}]};
    }
    return{id:item.id,n:item.name,exerciseId:meta.id||item.exerciseId,sourceId:meta.id||null,loadType:meta.loadType,implementCount:meta.implementCount,bp:meta?.bp||'',tg:meta?.tg||'',eq:meta?.eq||'',method:'STANDARD',rpe:item.rpe,rir:item.rir??Math.max(0,10-item.rpe),tempo:'2-0-2',rest:item.rest,note:'Свободная тренировка',weightMode:item.weightMode||(item.weight>0?'manual':'auto'),programWeightMode:(item.weightMode==='manual'||item.weight>0)?'prescribed':'autoweight',repMin:item.repMin,repMax:item.repMax,sets:Array.from({length:item.sets},(_,i)=>({label:String(i+1),w:item.weight,r:item.repMin,rMin:item.repMin,rMax:item.repMax,rest:item.rest,targetRpeMin:item.rpe,targetRpeMax:item.rpe,targetRirMin:item.rir??Math.max(0,10-item.rpe),targetRirMax:item.rir??Math.max(0,10-item.rpe)}))};
  });
  const value={id,name:'Свободная тренировка',isFreeWorkout:true,isClientFreeWorkout:true,ownerUserId:userId(),created:Date.now(),updated:Date.now(),weeks:[{n:1,useIntensity:false,days:[{id:`${id}-day`,name:'Свободная тренировка',ex}]}]};
  if(!Array.isArray(st.programs))st.programs=[];
  const index=st.programs.findIndex(x=>x?.id===id);
  if(index>=0){value.created=st.programs[index].created||value.created;st.programs[index]=value;}
  else st.programs.push(value);
  persist();
  return value;
}
    W.clientFreeWorkoutStartV334=function(){if(st.current){W.nav('start');return W.toast('У вас есть незавершённая тренировка')}if(!draft().length)return W.toast?.('Сначала добавь упражнения');const p=program();if(typeof W.beginProgramDay!=='function'&&typeof beginProgramDay!=='function')return W.toast?.('Экран тренировки ещё загружается');(W.beginProgramDay||beginProgramDay)(p.id,0,0)};
  function inject(){
    const root=D.getElementById('plan');if(!root||!canUse()||root.querySelector('[data-client-free-v334]'))return;const card=D.createElement('div');card.dataset.clientFreeV334='1';card.innerHTML=`<div class="section">СВОБОДНАЯ ТРЕНИРОВКА</div><button type="button" class="card cfw-plan-card" onclick="clientFreeWorkoutOpenV334()"><div><span>Свой набор упражнений</span><b>Свободная тренировка</b><small>${draft().length?`${draft().length} упражнений уже выбрано`:'Собери тренировку из нашей базы'}</small></div><strong>Собрать ›</strong></button>`;const profile=root.querySelector('#clientPlanProfileV255,.trainer-self-profile-v111');if(profile)profile.after(card);else root.prepend(card)
  }
  const style=D.createElement('style');style.id='client-free-workout-v334-style';style.textContent="\n.cfw-plan-card{display:flex;width:100%;align-items:center;justify-content:space-between;gap:12px;text-align:left;background:var(--panel);border:1px solid var(--line);border-radius:20px}\n.cfw-plan-card span,.cfw-plan-card small{display:block;color:var(--muted);font-size:12px}\n.cfw-plan-card b{display:block;margin:5px 0;font-size:19px}\n.cfw-plan-card strong{color:var(--accent);font-size:13px;white-space:nowrap}\n.cfw-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:4px 0 14px}\n#modal .cfw-head h2{margin:4px 0;font-size:25px;line-height:1.18;letter-spacing:-.035em}\n.cfw-kicker{color:var(--accent);font-size:10px;font-weight:750;letter-spacing:.11em}\n.cfw-head>.btn{width:40px;min-width:40px;height:40px;border-radius:13px}\n.cfw-surface{margin:12px 0;padding:15px;border:1px solid var(--line);border-radius:20px;background:var(--panel)}\n.cfw-section-title{display:flex;align-items:center;gap:9px;margin:0 0 13px;font-size:15px;color:var(--text);font-weight:700}\n.cfw-section-title b{font-size:15px}\n.cfw-step{display:grid;place-items:center;width:26px;height:26px;background:var(--panel2);border-radius:9px;color:var(--accent);font-size:11px;font-weight:800}\n.cfw-picker-meta{margin:8px 3px 0;color:var(--muted);font-size:12px}\n.cfw-picker-results{max-height:34vh;overflow:auto;margin-top:10px;border:1px solid var(--line);border-radius:16px;background:var(--panel2);overscroll-behavior:contain;-webkit-overflow-scrolling:touch}\n.cfw-picker-option{display:block;width:100%;min-height:62px;padding:12px;text-align:left;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--text)}\n.cfw-picker-option:last-child{border:0}\n.cfw-picker-option:active,.cfw-picker-option:focus-visible{background:color-mix(in srgb,var(--accent) 9%,var(--panel2))}\n.cfw-picker-option b,.cfw-picker-option small{display:block}\n.cfw-picker-option b{font-size:14px;line-height:1.35}\n.cfw-picker-option small{margin-top:4px;color:var(--muted);font-size:12px}\n.cfw-selected{display:flex;justify-content:space-between;align-items:center;gap:12px;border-radius:15px;padding:14px;background:color-mix(in srgb,var(--accent) 7%,var(--panel));border:1px solid color-mix(in srgb,var(--accent) 22%,var(--line))}\n.cfw-selected>div{min-width:0}\n.cfw-selected small,.cfw-selected b{display:block}\n.cfw-selected small{font-size:11px;color:var(--muted);margin-bottom:4px}\n.cfw-selected b{font-size:16px;line-height:1.25;color:var(--text);overflow-wrap:anywhere}\n.cfw-selected button{flex:none;border:0;background:transparent;color:var(--accent);font-size:13px;font-weight:700}\n.cfw-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px 10px}\n.cfw-form label,.cfw-mode-field{display:flex;flex-direction:column;gap:6px;min-width:0}\n.cfw-form label>span,.cfw-mode-field>span{font-size:12px;color:var(--muted);font-weight:500}\n.cfw-form input,.cfw-form select,.cfw-mode-field select,#cfwExercise{width:100%;min-width:0;height:46px;border:1px solid var(--line);border-radius:13px;padding:0 12px;background:var(--panel);color:var(--text);font-size:15px;outline:none}\n.cfw-form :is(input,select):focus,#cfwExercise:focus{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 11%,transparent)}\n.cfw-form input:disabled{opacity:.45}\n.cfw-wide{grid-column:1/-1}\n.cfw-reps-field{display:flex;flex-direction:column;gap:6px;min-width:0}\n.cfw-reps-field>span{font-size:12px;color:var(--muted);font-weight:500}\n.cfw-reps-range{display:flex;align-items:center;gap:5px;min-width:0;height:46px;border:1px solid var(--line);border-radius:13px;background:var(--panel);overflow:hidden}\n.cfw-form .cfw-reps-range input{flex:1 1 0;width:0;min-width:0;height:100%;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;padding:0 8px;text-align:center;font-size:15px;color:var(--text);appearance:textfield;-moz-appearance:textfield}\n.cfw-reps-range>span{flex:none;color:var(--muted);font-size:17px;font-weight:500}\n.cfw-reps-range:focus-within{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 11%,transparent)}\n.cfw-effort-field{display:flex;flex-direction:column;gap:6px;min-width:0}\n.cfw-effort-field>span{font-size:12px;color:var(--muted);font-weight:500}\n.cfw-effort-range{display:grid;grid-template-columns:minmax(0,1fr) 1px minmax(0,1fr);align-items:center;min-width:0;height:46px;border:1px solid var(--line);border-radius:13px;background:var(--panel);overflow:hidden}\n.cfw-effort-range label{height:100%;min-width:0;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:3px;padding:0 5px}\n.cfw-effort-range label small{font-size:10px;font-weight:650;color:var(--muted);white-space:nowrap}\n.cfw-form .cfw-effort-range input{width:100%;flex:1 1 0;min-width:0;height:100%;padding:0 1px;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;outline:none;text-align:center;color:var(--text);font-size:15px;appearance:textfield;-moz-appearance:textfield}\n.cfw-effort-range input::-webkit-inner-spin-button,.cfw-reps-range input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}\n.cfw-effort-divider{display:block;width:1px;height:22px;background:var(--line)}\n.cfw-effort-range:focus-within{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 11%,transparent)}\n.cfw-mode-field{margin-top:11px}\n.cfw-note{margin:9px 1px 0;color:var(--muted);font-size:12px;line-height:1.45}\n.cfw-interval-form{padding-top:12px;border-top:1px solid var(--line);margin-top:12px}\n.cfw-more{margin-top:14px;border-top:1px solid var(--line);padding-top:12px}\n.cfw-more summary{font-size:13px;font-weight:650;color:var(--text);cursor:pointer;padding:3px 0}\n.cfw-more[open] .cfw-form{margin-top:12px}\n.cfw-add{margin-top:10px;min-height:48px;border-radius:15px}\n.cfw-add:disabled{opacity:.45}\n.cfw-draft{margin:22px 0 0}\n.cfw-draft .cfw-section-title{justify-content:space-between;margin:0 2px 10px}\n#cfwDraftCount{font-size:12px;color:var(--muted);font-weight:500}\n.cfw-rows{display:grid;gap:8px}\n.cfw-row{display:grid;grid-template-columns:36px minmax(0,1fr) 36px;gap:11px;align-items:center;padding:12px;border-radius:17px;background:var(--panel);border:1px solid var(--line)}\n.cfw-row-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;background:var(--panel2);color:var(--accent);font-size:20px;font-weight:600}\n.cfw-row-info{min-width:0}\n.cfw-row-info small,.cfw-row-info b,.cfw-row-info span{display:block}\n.cfw-row-info small{font-size:10px;color:var(--muted);margin-bottom:3px}\n.cfw-row-info b{font-size:14px;line-height:1.32;color:var(--text)}\n.cfw-row-info span{font-size:12px;color:var(--muted);margin-top:5px;line-height:1.4}\n.cfw-row>button{width:36px;height:36px;border:0;border-radius:12px;color:#ca5353;background:color-mix(in srgb,#ef7070 11%,var(--panel));font-size:21px}\n.cfw-empty{padding:17px;border:1px dashed var(--line);border-radius:16px;color:var(--muted);font-size:12px}\n.cfw-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.8fr);gap:9px;margin:14px 0 8px}\n.cfw-actions .btn{min-height:50px;border-radius:15px;font-size:14px}\n.cfw-clear{background:var(--panel2);border:1px solid var(--line);color:var(--text)}\n.cfw-actions .btn:disabled{opacity:.4}\n.cfw-selected[hidden],.cfw-surface[hidden],.cfw-interval-form[hidden],#cfwSearchBox[hidden],#cfwResults[hidden],#cfwCardioMinutesBox[hidden]{display:none!important}\n@media(max-width:375px){.cfw-actions{grid-template-columns:1fr 1.4fr}.cfw-actions .btn{font-size:12px}.cfw-surface{padding:12px}.cfw-form{gap:9px}}\n";D.head.appendChild(style);
  function wrap(name){const base=W[name];if(typeof base!=='function'||base.__freeWorkoutV335)return;const wrapped=function(){const result=base.apply(this,arguments);queueMicrotask(inject);return result};Object.assign(wrapped,base);wrapped.__freeWorkoutV335=true;W[name]=wrapped;try{if(name==='planPage')planPage=wrapped;else if(name==='clientCleanPlanPage')clientCleanPlanPage=wrapped}catch(_){ }}
  function install(){wrap('clientCleanPlanPage');wrap('planPage');inject()}
  [0,200,700,1800,3500,7000].forEach(ms=>setTimeout(install,ms));W.addEventListener('unvrsl:deferred-modules-ready',install,{passive:true});W.addEventListener('pageshow',install,{passive:true});
})();

