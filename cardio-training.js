'use strict';
(function(root,factory){
  const api=factory(root||{});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.UNVRSLCardio=api;
})(typeof window!=='undefined'?window:globalThis,function(W){
  const numeric=value=>{
    if(value==null||String(value).trim()==='')return null;
    const n=Number(String(value).replace(',','.'));
    return Number.isFinite(n)?n:null;
  };
  const positive=(v,max=100000)=>{const n=numeric(v);return n!=null&&n>0&&n<=max?n:null};
  const between=(v,min,max)=>{const n=numeric(v);return n==null?null:Math.max(min,Math.min(max,n))};
  const fmt=(n,digits=1)=>n==null?'—':Number(n).toLocaleString('ru-RU',{maximumFractionDigits:digits});
  const esc=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const catalog=()=>W.UNVRSL_EXERCISES||[];
  const lookup=name=>catalog().find(x=>x?.cardioMachine?.id===name||x?.n===name||x?.id===name);
  const isCardio=x=>!!(x?.cardioMachineId||x?.cardioMachine||x?.kind==='cardio'||x?.loadType==='time'||lookup(x?.n)?.cardioMachine);
  const machine=ex=>lookup(ex?.cardioMachineId||ex?.n)?.cardioMachine||null;
  const defaults=Object.freeze({mode:'steady',intensity:'moderate',durationMin:30,distanceKm:null,targetKcal:null,speedKmh:null,inclinePct:0,resistance:null,powerWatts:null,heartRate:null,rounds:5,workSeconds:60,restSeconds:60,reportedKcal:null,weightKg:null});
  function settings(ex){
    const old=ex?.cardio||{},first=ex?.sets?.[0]||ex?.set?.[0]||{};
    return {...defaults,...old,
      durationMin:['distance','calories'].includes(old.mode)?positive(old.durationMin,1440):(positive(old.durationMin??(numeric(ex?.durationSec)!=null?Number(ex.durationSec)/60:null)??(numeric(first.workSeconds)!=null?Number(first.workSeconds)/60:null),1440)??30),
      reportedKcal:positive(first.reportedKcal??old.reportedKcal,10000),
      weightKg:positive(first.weightKg??old.weightKg,500)};
  }
  function bodyweightKg(data,s){
    const direct=positive(data?.weightKg,500);
    if(direct)return direct;
    const values=W.st?.bw||s?.bw||[];
    if(Array.isArray(values)&&values.length){
      const latest=values.at(-1);
      return positive(latest?.w??latest?.weight,500);
    }
    return positive(s?.bodyWeight,500);
  }
  function metFor(ex,data){
    const levels=machine(ex)?.met||{light:3,moderate:5,vigorous:8};
    const level=['light','moderate','vigorous'].includes(data.intensity)?data.intensity:'moderate';
    const met=levels[level];
    // ACSM level-treadmill estimate, speed in meters/minute, grade as a fraction.
    const treadmill=machine(ex)?.id==='treadmill'||machine(ex)?.id==='curved-treadmill';
    const speed=positive(data.speedKmh,25),grade=between(data.inclinePct,0,25);
    if(treadmill&&speed!=null&&machine(ex)?.id==='treadmill'){
      const metersMin=speed*1000/60;
      const oxygen=speed<8?3.5+.1*metersMin+1.8*metersMin*(grade??0)/100:
        3.5+.2*metersMin+.9*metersMin*(grade??0)/100;
      return Math.max(1.5,Math.min(22,oxygen/3.5));
    }
    return met;
  }
  function duration(data){
    const mode=data.mode||'steady';
    if(mode==='interval'){
      const rounds=Math.max(1,Math.min(100,Math.floor(positive(data.rounds,100)||1)));
      const work=Math.max(1,Math.round(positive(data.workSeconds,3600)||60));
      const rest=Math.max(0,Math.round(between(data.restSeconds,0,3600)||0));
      return {totalMin:(rounds*work+(rounds-1)*rest)/60,workMin:rounds*work/60,restMin:(rounds-1)*rest/60};
    }
    const totalMin=positive(data.durationMin,1440)||0;
    return {totalMin,workMin:totalMin,restMin:0};
  }
  function estimate(ex,source={},session={}){
    const data={...settings(ex),...source};
    const measured=positive(data.reportedKcal,10000);
    const weight=bodyweightKg(data,session),period=duration(data),met=metFor(ex,data);
    if(measured!=null)return {kcal:Math.round(measured),source:'machine',met:null,weight,minutes:period.totalMin,activeKcal:null};
    if(!weight||!period.totalMin)return {kcal:null,source:'missing',met,weight,minutes:period.totalMin,activeKcal:null};
    // Gross energy expenditure ≈ MET × 3.5 × bodyweight(kg) / 200 × minutes.
    // For intervals, rest phases are 1.5 MET and must not be counted as work.
    const gross=3.5*weight/200*(met*period.workMin+1.5*period.restMin);
    const active=3.5*weight/200*(Math.max(0,met-1)*period.workMin+.5*period.restMin);
    return {kcal:Math.round(gross),activeKcal:Math.round(active),source:'met',met:Number(met.toFixed(1)),weight,minutes:period.totalMin};
  }
  function summary(ex){
    const c=settings(ex),d=duration(c),parts=[];
    if(c.mode==='calories'&&positive(c.targetKcal))parts.push(`Цель ${fmt(c.targetKcal,0)} ккал`);
    else if(c.mode==='distance'&&positive(c.distanceKm))parts.push(`Цель ${fmt(c.distanceKm,2)} км`);
    else if(d.totalMin>0)parts.push(`${fmt(d.totalMin)} мин`);
    if(c.mode!=='distance'&&positive(c.distanceKm))parts.push(`${fmt(c.distanceKm,2)} км`);
    if(positive(c.speedKmh))parts.push(`${fmt(c.speedKmh)} км/ч`);
    if(positive(c.powerWatts))parts.push(`${fmt(c.powerWatts,0)} Вт`);
    if(c.mode==='interval')parts.push(`${c.rounds} интервалов`);
    if(positive(c.reportedKcal))parts.push(`${fmt(c.reportedKcal,0)} ккал (тренажёр)`);
    return parts.join(' · ');
  }
  function input(id,label,value,type='number',step='1',min='0'){
    const val=value==null?'':String(value);
    return `<label class="cardio-field"><span>${esc(label)}</span><input id="${id}" type="${type}" inputmode="decimal" step="${step}" min="${min}" value="${esc(val)}"></label>`;
  }
  function form(x){
    const p=W.programById?.(x.pid),day=p?.weeks?.[x.wi]?.days?.[x.di];
    const existing=x.existingIndex!=null?day?.ex?.[x.existingIndex]:null;
    const data=settings(existing||{cardioMachineId:lookup(x.n)?.cardioMachine?.id});
    const labels={steady:'Непрерывно',interval:'Интервалы',distance:'По дистанции',calories:'По калориям'};
    const modes=Object.entries(labels).map(([v,label])=>`<option value="${v}" ${data.mode===v?'selected':''}>${label}</option>`).join('');
    const levels=[['light','Лёгкая'],['moderate','Умеренная'],['vigorous','Высокая']].map(([v,t])=>`<option value="${v}" ${data.intensity===v?'selected':''}>${t}</option>`).join('');
    const close=`openProgramEditor('${encodeURIComponent(x.pid)}',${x.wi},${x.di})`;
    W.__unvrslCardioEditing={...x,name:existing?.n||x.n};
    W.modal(`<div class="sheet-grabber"></div><div class="row between"><h2>${esc(existing?.n||x.n)}</h2><button class="btn tiny" onclick="${close}">←</button></div>
      <p class="muted">Кардио · план и учёт энергозатрат</p>
      <div class="cardio-form-grid">
        <label class="cardio-field"><span>Режим</span><select id="cardioMode">${modes}</select></label>
        <label class="cardio-field"><span>Интенсивность</span><select id="cardioIntensity">${levels}</select></label>
        ${input('cardioMinutes','Длительность, мин',data.durationMin)}
        ${input('cardioDistance','Дистанция, км (цель для режима по дистанции)',data.distanceKm,'number','0.1')}
        ${input('cardioTargetKcal','Цель, ккал (для режима по калориям)',data.targetKcal,'number','1')}
        ${input('cardioSpeed','Скорость, км/ч',data.speedKmh,'number','0.1')}
        ${input('cardioGrade','Наклон, %',data.inclinePct)}
        ${input('cardioResistance','Уровень сопротивления',data.resistance)}
        ${input('cardioPower','Мощность, Вт',data.powerWatts)}
        ${input('cardioHr','Пульс, уд/мин',data.heartRate)}
        
        ${input('cardioRounds','Интервалов',data.rounds)}
        ${input('cardioWork','Работа, сек',data.workSeconds)}
        ${input('cardioRest','Пауза, сек',data.restSeconds)}
        ${input('cardioKcal','Ккал с тренажёра (если есть)',data.reportedKcal)}
        ${input('cardioMass','Масса тела, кг (необязательно)',data.weightKg,'number','0.1')}
      </div>
      <p class="muted small">Калории: показание тренажёра или оценка по MET и массе тела. Не прибавляются автоматически к калорийности питания.</p>
      <button class="btn primary full" onclick="unvrslCardioSave()">${existing?'Сохранить':'Добавить в программу'}</button>`);
  }
  function saveProgram(){
    const x=W.__unvrslCardioEditing,p=W.programById?.(x?.pid),day=p?.weeks?.[x?.wi]?.days?.[x?.di];
    if(!day||!x)return;
    const v=id=>W.document?.getElementById(id)?.value??null;
    const mode=v('cardioMode')||'steady';
    const intensity=v('cardioIntensity')||'moderate';
    const n=(id,max)=>positive(v(id),max),optional=(id,max)=>between(v(id),0,max);
    const data={
      mode,intensity,durationMin:['distance','calories'].includes(mode)?null:n('cardioMinutes',1440),targetKcal:mode==='calories'?n('cardioTargetKcal',10000):null,
      distanceKm:n('cardioDistance',1000),speedKmh:n('cardioSpeed',40),
      inclinePct:optional('cardioGrade',25),resistance:optional('cardioResistance',100),
      powerWatts:n('cardioPower',3000),heartRate:n('cardioHr',250),
      rounds:Math.max(1,Math.round(n('cardioRounds',100)||1)),
      workSeconds:Math.max(1,Math.round(n('cardioWork',3600)||60)),
      restSeconds:Math.round(optional('cardioRest',3600)||0),
      reportedKcal:n('cardioKcal',10000),weightKg:n('cardioMass',500)
    };
    if(!data.durationMin&&mode==='steady'){W.toast?.('Укажи время кардио');return}
    if(mode==='distance'&&!data.distanceKm){W.toast?.('Укажи дистанцию');return}
    if(mode==='calories'&&!data.targetKcal){W.toast?.('Укажи цель в ккал');return}
    const old=x.existingIndex!=null?day.ex[x.existingIndex]:null,oldSet=old?.sets?.[0]||{};
    const durationSec=['distance','calories'].includes(mode)?0:Math.max(1,Math.round(duration(data).totalMin*60));
    const row={
      ...(old||{}),id:old?.id||W.uid?.('pex')||`cardio-${Date.now()}`,
      n:x.name,sourceId:x.sourceId||old?.sourceId||null,
      kind:'cardio',method:'STANDARD',workMode:'timer',loadType:'time',
      cardioMachineId:lookup(x.name)?.cardioMachine?.id||old?.cardioMachineId||null,
      cardio:data,durationSec,workSeconds:durationSec,
      sets:[{...oldSet,w:0,r:0,workSeconds:durationSec,reportedKcal:data.reportedKcal,weightKg:data.weightKg}]
    };
    // Cardio is recorded using machine and time metrics, without RPE or RIR.
    delete row.rpe;delete row.rir;delete row.cardio.rpe;
    if(x.existingIndex==null)day.ex.push(row);else day.ex[x.existingIndex]=row;
    p.updated=Date.now();
    W.save?.();
    W.openProgramEditor?.(x.pid,x.wi,x.di);
  }
  function workoutCard(session,ex,ei){
    const set=ex.set?.[0]||{},data={...settings(ex),...ex.cardio,
      durationMin:positive(set.workSeconds,86400)?Number(set.workSeconds)/60:settings(ex).durationMin,
      reportedKcal:positive(set.reportedKcal,10000),weightKg:positive(set.weightKg,500)};
    const estimateResult=estimate(ex,data,session);
    const info=estimateResult.kcal==null?'Для оценки ккал укажи массу тела':
      estimateResult.source==='machine'?`${fmt(estimateResult.kcal,0)} ккал · тренажёр`:
      `≈ ${fmt(estimateResult.kcal,0)} ккал · MET ${fmt(estimateResult.met)} (оценка)`;
    const row=(key,label,val,step='1')=>`<label class="cardio-field"><span>${label}</span><input type="number" inputmode="decimal" min="0" step="${step}" value="${esc(val??'')}" onchange="unvrslCardioEdit(${ei},'${key}',this.value)"></label>`;
    return `<div class="exercise cardio-workout" data-cardio-exercise="${ei}"><div class="row between"><div class="grow"><div class="exname">${esc(ex.n)}</div><div class="muted small">${esc(data.mode==='interval'?'Интервалы':data.mode==='distance'?'Дистанция':data.mode==='calories'?'Калории':'Непрерывно')}</div></div></div>
      <div class="cardio-form-grid">
       ${row('durationMin','Время, мин',data.durationMin,'0.5')}
       ${row('distanceKm','Дистанция, км',data.distanceKm,'0.1')}
       ${row('speedKmh','Скорость, км/ч',data.speedKmh,'0.1')}
       ${row('inclinePct','Наклон, %',data.inclinePct)}
       ${row('resistance','Сопротивление',data.resistance)}
       ${row('powerWatts','Мощность, Вт',data.powerWatts)}
       ${row('heartRate','Пульс',data.heartRate)}
       
       ${row('reportedKcal','Ккал на тренажёре',set.reportedKcal)}
       ${row('weightKg','Вес тела, кг',data.weightKg||bodyweightKg(data,session),'0.1')}
      </div><div class="row between" style="margin:12px 0 7px"><b class="cardio-energy" data-cardio-kcal="${ei}">${esc(info)}</b>
       <button class="check ${set.ok?'done':''}" onclick="toggleSet(${ei},0,{timer:false})" aria-label="Отметить кардио">${set.ok?'✓':'○'}</button>
      </div><p class="muted small">Оценка ккал не является измерением. Приоритет у показания тренажёра.</p></div>`;
  }
  function editWorkout(ei,key,value){
    const ex=W.st?.current?.ex?.[ei],set=ex?.set?.[0];
    if(!ex||!set||set.ok||!isCardio(ex))return;
    const data={...settings(ex),...ex.cardio};
    const optionalKeys=new Set(['inclinePct','resistance','powerWatts','heartRate','distanceKm','speedKmh','reportedKcal','weightKg']);
    if(key==='rpe'||key==='rir')return;
    const n=key==='inclinePct'?between(value,0,25):positive(value,100000);
    data[key]=n==null&&optionalKeys.has(key)?null:n;
    if(key==='durationMin'){
      if(n==null){W.toast?.('Укажи положительное время');return;}
      set.workSeconds=Math.round(n*60);
      ex.workSeconds=set.workSeconds;ex.durationSec=set.workSeconds;
    }
    if(key==='reportedKcal')set.reportedKcal=n;
    if(key==='weightKg')set.weightKg=n;
    ex.cardio=data;
    W.save?.({draftOnly:true});
    const el=W.document?.querySelector?.(`[data-cardio-kcal="${ei}"]`);
    if(el){const r=estimate(ex,data,W.st.current);el.textContent=r.kcal==null?'Для оценки ккал укажи массу тела':r.source==='machine'?`${fmt(r.kcal,0)} ккал · тренажёр`:`≈ ${fmt(r.kcal,0)} ккал · MET ${fmt(r.met)} (оценка)`;}
  }
  function sessionCalories(session){
    let total=0,hasEstimate=false,count=0;
    for(const ex of session?.ex||[]){
      if(!isCardio(ex))continue;
      for(const set of ex.set||[]){
        if(!set.ok)continue;
        const data={...settings(ex),...ex.cardio,
          durationMin:(positive(set.workSeconds,86400)||0)/60,
          reportedKcal:positive(set.reportedKcal,10000),weightKg:positive(set.weightKg,500)};
        const r=estimate(ex,data,session);
        if(r.kcal!=null){total+=r.kcal;count++;if(r.source!=='machine')hasEstimate=true;}
      }
    }
    return count?{kcal:Math.round(total),estimated:hasEstimate}:null;
  }
  if(W.document){
    const style=W.document.createElement('style');
    style.textContent='.cardio-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:14px 0}.cardio-field{display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--text-secondary,#94989d);min-width:0}.cardio-field input,.cardio-field select{width:100%;min-width:0;padding:12px;border-radius:12px;background:var(--input-bg,#1f2126);border:1px solid #43464d;color:inherit;font-size:15px}.cardio-workout{padding:16px}.cardio-energy{font-size:14px}@media(max-width:360px){.cardio-form-grid{grid-template-columns:1fr}}';
    W.document.head.appendChild(style);
    const original=W.programExerciseForm;
    if(typeof original==='function'){
      W.programExerciseForm=function(x){
        const existing=x?.existingIndex!=null?W.programById?.(x.pid)?.weeks?.[x.wi]?.days?.[x.di]?.ex?.[x.existingIndex]:null;
        return isCardio(existing||x)&&lookup(existing?.cardioMachineId||x?.n)?.cardioMachine?form(x):original(x);
      };
    }
    W.unvrslCardioSave=saveProgram;
    W.unvrslCardioEdit=editWorkout;
  }
  return Object.freeze({lookup,isCardio,settings,metFor,duration,estimate,summary,workoutCard,editWorkout,sessionCalories,form,saveProgram});
});
