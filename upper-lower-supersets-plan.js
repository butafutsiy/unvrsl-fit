'use strict';
((root,factory)=>{
  const api=factory(typeof module==='object'&&module.exports?require('./workout-domain.js'):root?.WorkoutDomain);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(!root)return;
  root.UpperLowerSupersetsPlan=api;
  // Personal plans are opt-in. Loading the app never seeds other accounts.
  let adding=false;
  root.addUpperLowerSupersetsPlan=async()=>{
    if(adding)return;
    const state=typeof st==='object'?st:root.st;
    if(!state||!root.WorkoutDomain)return;
    adding=true;
    const backup=JSON.parse(JSON.stringify(state)),deletedKey='unvrsl-fit-deleted-programs-v2',deletedBackup=root.localStorage?.getItem(deletedKey);
    try{
    state.programs=Array.isArray(state.programs)?state.programs:[];
    let plan=state.programs.find(p=>p?.seedId===api.ID);
    if(!plan){
      const trashed=(state.programTrash||[]).find(entry=>entry.program?.seedId===api.ID);
      plan=trashed?JSON.parse(JSON.stringify(trashed.program)):api.build(root.WorkoutDomain);
      plan.archived=false;plan.updated=plan.updatedAt=Date.now();state.programs.push(plan);
    }
    api.upgrade(plan,root.WorkoutDomain);
    plan.importedFromLink=true;
    root.unvrslRestoreProgramKeys?.(plan);
    state.primaryProgramId=plan.id;state.startProgramId=plan.id;
    state.startProgramWeeks=state.startProgramWeeks||{};
    if(state.startProgramWeeks[plan.id]==null)state.startProgramWeeks[plan.id]=0;
    const client=typeof root.unvrslTrainerMode==='function'&&!root.unvrslTrainerMode();
    if(client)state.clientPrimaryProgramKey=state.clientPlanViewKey='coach:'+plan.id;
    const ok=root.persistWorkoutState?await root.persistWorkoutState():save();
    if(ok===false)throw Error('Не удалось сохранить план. Повтори добавление.');
    root.accountSyncNow?.({quiet:true});
    if(client){
      root.closeModal?.();root.nav?.('plan');root.clientCleanPlanPage?.();
    }else root.openProgramEditor?.(plan.id,state.startProgramWeeks[plan.id],0);
    root.toast?.('План добавлен в мои программы');
    const url=new URL(root.location.href);url.searchParams.delete('addPlan');
    root.history.replaceState(null,'',url);
    return plan;
    }catch(error){Object.keys(state).forEach(key=>delete state[key]);Object.assign(state,backup);try{if(deletedBackup==null)root.localStorage?.removeItem(deletedKey);else root.localStorage?.setItem(deletedKey,deletedBackup)}catch(_){}root.toast?.(error.message);return null}
    finally{adding=false}
  };
  const card=(canHide=false)=>canHide&&root.renderTemplateCard?root.renderTemplateCard({title:api.NAME,description:'Два дня: низ и верх. 3 суперсета на низ, 3 суперсета и трисет на верх. 2-недельная прогрессия RPE/RIR.',weeks:2,frequency:2,key:'personal:'+api.ID,action:'addUpperLowerSupersetsPlan()'}):`<div class="card" id="upper-lower-supersets-plan"><b>${api.NAME}</b><div class="muted small" style="margin-top:8px">Низ и верх · 2 недели · суперсеты и трисет · RPE/RIR. Веса подбираются по истории и усилию.</div><button class="btn primary" style="margin-top:12px" onclick="addUpperLowerSupersetsPlan()">Добавить в мои программы</button>${canHide?(root.templateHideButton?.('personal:'+api.ID)||''):''}</div>`;
  const original=root.templatesSheet;
  root.registerTemplateOption?.('personal:'+api.ID,api.NAME);
  if(typeof original==='function'){
    root.templatesSheet=function(){const result=original.apply(this,arguments);const sheet=document.getElementById('sheet');if(sheet&&!root.templateIsHidden?.('personal:'+api.ID)&&!document.getElementById('upper-lower-supersets-plan'))sheet.insertAdjacentHTML('beforeend',card(true));return result;};
  }
  let shown=false;
  function showLinkedPlan(){
    if(shown||new URL(root.location.href).searchParams.get('addPlan')!==api.ID||typeof root.modal!=='function')return;
    shown=true;
    root.modal(`<div class="sheet-grabber"></div><h2>Твой тренировочный план</h2>${card()}<div class="muted small">Добавь в нужном аккаунте. День 1 доступен сразу. Текущая незавершённая тренировка сохранится. Повторное добавление откроет существующий план.</div>`);
  }
  // Keep exercises independently editable while presenting their shared rounds.
  const row=root.programExerciseRow;
  if(typeof row==='function')root.programExerciseRow=function(p,d,e,ei){
    if(p?.seedId!==api.ID||!e?.superGroup)return row.apply(this,arguments);
    if(d.ex[ei-1]?.superGroup===e.superGroup)return '';
    const members=[];
    for(let i=ei;i<d.ex.length&&d.ex[i].superGroup===e.superGroup;i++)members.push({e:d.ex[i],i});
    const size=members.length,title=size===3?'Трисет':'Суперсет';
    return `<section class="card" data-upper-lower-group="${ei}"><b>${title} · ${e.sets?.length||3} круга</b><div class="muted small" style="margin:8px 0">${size===3?'A → B → C':'A → B'} · переход без отдыха · после круга ${members.at(-1).e.afterGroupRestSec} сек.</div>${members.map(x=>row.call(this,p,d,x.e,x.i)).join('')}</section>`;
  };
  let upgrading=false;
  async function upgradeSavedPlans(){
    if(upgrading||adding)return;
    const state=typeof st==='object'?st:root.st;
    if(!state||!root.WorkoutDomain)return;
    const plans=(state.programs||[]).filter(p=>p?.seedId===api.ID&&Number(p.sourceRevision||1)<api.REVISION);
    if(!plans.length)return;
    upgrading=true;
    const backups=plans.map(p=>JSON.parse(JSON.stringify(p)));
    try{
      let changed=false;
      for(const p of plans)changed=api.upgrade(p,root.WorkoutDomain)||changed;
      if(!changed)return;
      const ok=root.persistWorkoutState?await root.persistWorkoutState():root.save?.();
      if(ok===false)throw Error('Не удалось сохранить настройки программы');
      root.accountSyncNow?.({quiet:true});
      root.render?.();
    }catch(error){
      plans.forEach((p,i)=>{Object.keys(p).forEach(k=>delete p[k]);Object.assign(p,backups[i])});
      root.toast?.(error.message);
    }finally{upgrading=false}
  }
  root.addEventListener('unvrsl:app-ready',()=>{upgradeSavedPlans();showLinkedPlan()});
  root.addEventListener('unvrsl:cloud-ready',upgradeSavedPlans);
  if(root.__unvrslStartupComplete){upgradeSavedPlans();showLinkedPlan();}

})(typeof window==='undefined'?null:window,(defaultDomain)=>{
  const REVISION=3,ID='semen-upper-lower-supersets-2w',NAME='Верх / низ · суперсеты · 2 недели';
  // Array: exercise name, kind, working sets, low/high reps, RPE, note, load type.
  const days=[
    {name:'День 1 · Низ',groups:[
      {name:'Суперсет 1',rest:150,items:[
        ['Жим ногами','compound',3,10,12,8],
        ['Обратные приседания в Гакке','compound',3,10,12,8]
      ]},
      {name:'Суперсет 2',rest:120,items:[
        ['Разгибания голени сидя','isolation',3,12,15,8.5],
        ['Болгарские сплит-приседания','compound',3,10,12,8,'Повторы на каждую ногу.']
      ]},
      {name:'Суперсет 3',rest:120,items:[
        ['Сгибания голени в тренажёре','isolation',3,12,15,8.5],
        ['Горизонтальный жим ногами одной ногой','compound',3,10,12,8,'Повторы на каждую ногу.']
      ]},
      {name:'Икры',rest:90,items:[
        ['Подъёмы на носки со штангой','isolation',4,12,15,8.5,'Пауза в растянутом положении 1–2 секунды.']
      ]}
    ]},
    {name:'День 2 · Верх',groups:[
      {name:'Суперсет 1',rest:150,items:[
        ['Жим лёжа в Смите','compound',3,8,10,8],
        ['Подтягивания','compound',3,6,12,8,'Вес только дополнительного отягощения.','bodyweight_added']
      ]},
      {name:'Суперсет 2',rest:120,items:[
        ['Тяга вертикального блока','compound',3,10,12,8],
        ['Жим в грудном тренажёре','compound',3,10,12,8]
      ]},
      {name:'Суперсет 3',rest:120,items:[
        ['Тяга горизонтального блока','compound',3,10,12,8],
        ['Сведения рук в Бабочке','isolation',3,12,15,8.5]
      ]},
      {name:'Трисет 4',rest:90,items:[
        ['Сгибания рук на бицепс в блоке','isolation',3,12,15,8.5],
        ['Махи гантелями в стороны','isolation',3,12,15,8.5,'Вес на одну гантель.','per_dumbbell'],
        ['Разгибания рук на трицепс в блоке','isolation',3,12,15,8.5]
      ]},
      {name:'Пресс',rest:60,items:[
        ['Подъёмы корпуса на наклонной скамье','isolation',3,15,20,8,'Без рывков и инерции.']
      ]}
    ]}
  ];
  function datePlus(start,days){
    const date=new Date(start+'T12:00:00Z');
    date.setUTCDate(date.getUTCDate()+days);
    return date.toISOString().slice(0,10);
  }
  function weekProfile(wi,domain=defaultDomain){
    const profile=JSON.parse(JSON.stringify(domain.weekProfiles[wi+1]));
    // Keep the original three paired rounds; do not split four base sets
    // against three isolation sets inside a mixed superset.
    profile.week=wi+1;profile.base.sets=3;profile.isolation.sets=3;
    profile.rpe=[Math.min(profile.base.rpe[0],profile.isolation.rpe[0]),Math.max(profile.base.rpe[1],profile.isolation.rpe[1])];
    profile.baseRest=[120,150];profile.isoRest=[60,120];
    profile.focus=wi?'Рабочая неделя: база 75–80%, 8–10 повторений, RPE 7–8; изоляция 65–70%, 12–15 повторений, RPE 8–9.':'Объёмная неделя: база 70–75%, 10–12 повторений, RPE 7–8; изоляция 70–75%, 10–12 повторений, RPE 8–9.';
    return profile;
  }
  function build(domain=defaultDomain,startDate){
    domain=domain?.weekProfiles?domain:defaultDomain;
    if(!startDate){
      const date=new Date();
      date.setDate(date.getDate()+(8-date.getDay())%7);
      startDate=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
    }
    const weeks=Array.from({length:2},(_,wi)=>{
      const profile=weekProfile(wi,domain);
      return {
        n:wi+1,loadProfileManual:true,useIntensity:true,
        intensityMin:profile.pct[0],intensityMax:profile.pct[1],
        rpeMin:profile.rpe[0],rpeMax:profile.rpe[1],rirMin:10-profile.rpe[1],rirMax:10-profile.rpe[0],
        baseRepMin:profile.base.reps[0],baseRepMax:profile.base.reps[1],
        isolationRepMin:profile.isolation.reps[0],isolationRepMax:profile.isolation.reps[1],
        phase:profile.phase,deload:false,testWeek:false,weeklyLoadProfile:profile,
        tempo:profile.tempo,baseRestMin:120,baseRestMax:150,isolationRestMin:60,isolationRestMax:120,focus:profile.focus,
        days:days.map((day,di)=>({
          id:ID+'-w'+(wi+1)+'-d'+(di+1),name:day.name,role:'Middle',date:datePlus(startDate,wi*7+di*3),
          ex:day.groups.flatMap((group,gi)=>group.items.map((row,ei)=>{
            const [n,kind,count,originalMin,originalMax,,extra,sourceLoadType]=row;
            const spec=profile[kind==='isolation'?'isolation':'base'];
            const bodyweight=/Подъёмы корпуса/.test(n),[min,max]=bodyweight?[15,20]:spec.reps;
            const [rpeMin,rpeMax]=bodyweight?[8,8]:spec.rpe,rpe=(rpeMin+rpeMax)/2;
            const [pctMin,pctMax]=bodyweight?[0,0]:spec.pct;
            const rest=ei===group.items.length-1?group.rest:0,tempo=profile.tempo,isGroup=group.items.length>1;
            const note=[group.name+' · отдых после связки '+group.rest+' сек.',extra,
              bodyweight?'Пресс: 15–20 повторений, RPE 8; без расчёта %1ПМ.':`${pctMin}–${pctMax}% своего e1RM · ${min}–${max} повторений · RPE ${rpeMin}–${rpeMax}.`,
              sourceLoadType==='bodyweight_added'?'Проценты от суммарной нагрузки: масса тела плюс отягощение. В поле веса только дополнительное отягощение.':'',
              'В суперсете процент служит ориентиром; сохраняй заданные повторы и запас.'].filter(Boolean).join(' ');
            return {
              id:ID+'-w'+(wi+1)+'-d'+(di+1)+'-g'+(gi+1)+'-e'+(ei+1),
              n,kind,method:'STANDARD',loadType:bodyweight?'bodyweight_only':sourceLoadType||undefined,
              cycleManaged:!bodyweight,targetIntensityMin:pctMin,targetIntensityMax:pctMax,
              repCounting:/болгар|одной ногой/i.test(n)?'per_leg':undefined,
              ...(isGroup?{superGroup:ID+'-w'+(wi+1)+'-d'+(di+1)+'-g'+(gi+1),superPos:ei,superSize:group.items.length,transitionSec:0,afterGroupRestSec:group.rest}:{}),
              reps:{mode:'manual',min,max},originalSets:count,originalRepRange:[originalMin,originalMax],
              rpe,rpeMin,rpeMax,rirMin:10-rpeMax,rirMax:10-rpeMin,effortSourceMode:'manual',
              tempoMode:'manual',tempo,restMode:'manual',rest,restMin:rest,restMax:rest,
              weightMode:'auto',parameterOverrides:{version:386,effort:{mode:'manual',type:'rpe',rpeMin,rpeMax,rirMin:10-rpeMax,rirMax:10-rpeMin},tempo:{mode:'manual',value:tempo},rest:{mode:'manual',min:rest,max:rest},weight:{mode:'auto',value:0}},
              note,sets:Array.from({length:count},()=>({w:0,r:min,tempo,rest,targetIntensityMin:pctMin,targetIntensityMax:pctMax,targetRepMin:min,targetRepMax:max,targetRpeMin:rpeMin,targetRpeMax:rpeMax,targetRirMin:10-rpeMax,targetRirMax:10-rpeMin,allowFailure:false}))
            };
          }))
        }))
      };
    });
    return {
      id:ID,seedId:ID,sourceRevision:REVISION,name:NAME,author:'Семён Бутаков',created:Date.now(),updated:Date.now(),
      description:'Низ и верх: две недели по таблице процентов UNVRSL, с отдельными параметрами базы и изоляции. Суперсеты по 3 круга, икры 4 подхода, пресс 3 подхода.',
      principles:['Рабочие подходы не включают разминку.','Суперсеты и трисет выполняются по кругам; отдых после полной связки.','Проценты считаются от e1RM конкретного упражнения и оборудования.','RIR = 10 − RPE. В связках рабочий вес уточняется по повторам и запасу.'],
      cycleOptions:{weeks:2,daysPerWeek:2,startDate,targetDate:datePlus(startDate,13),testWeek:false,periodizationMode:'manual',weekProfiles:weeks.map(w=>w.weeklyLoadProfile),phaseSchedule:weeks.map(w=>w.phase)},weeks
    };
  }
  function upgrade(plan,domain){
    if(plan?.seedId!==ID||Number(plan.sourceRevision||1)>=REVISION)return false;
    const fresh=build(domain,plan.weeks?.[0]?.days?.[0]?.date);
    for(let wi=0;wi<(plan.weeks||[]).length;wi++){
      const week=plan.weeks[wi],next=fresh.weeks[wi];if(!next)continue;
      for(const key of ['loadProfileManual','useIntensity','intensityMin','intensityMax','baseRepMin','baseRepMax','isolationRepMin','isolationRepMax','tempo','baseRestMin','baseRestMax','isolationRestMin','isolationRestMax','rpeMin','rpeMax','rirMin','rirMax','phase','deload','testWeek','weeklyLoadProfile','focus'])week[key]=next[key];
      for(const day of week.days||[])for(const ex of day.ex||[]){
        const target=next.days.flatMap(d=>d.ex).find(e=>e.id===ex.id);if(!target)continue;
        for(const key of ['reps','cycleManaged','targetIntensityMin','targetIntensityMax','tempo','tempoMode','superGroup','superPos','superSize','transitionSec','afterGroupRestSec','rpe','rpeMin','rpeMax','rirMin','rirMax','effortSourceMode','restMode','rest','restMin','restMax']){
          if(target[key]===undefined)delete ex[key];else ex[key]=target[key];
        }
        ex.note=[String(ex.note||'').replace(/(?:Неделя [12]:[^.]*\.|[0-9]+[–-][0-9]+% своего e1RM[^.]*\.)/g,'').trim(),target.note].filter(Boolean).join(' ');
        if(target.loadType==='bodyweight_only')ex.loadType=target.loadType;
        ex.parameterOverrides={...ex.parameterOverrides,version:386,effort:{...target.parameterOverrides.effort},rest:{...target.parameterOverrides.rest},tempo:{...target.parameterOverrides.tempo}};
        delete ex.parameterOverrides.reps;
        for(const set of ex.sets||[]){
          if(set.ok||set.skipped)continue;
          Object.assign(set,{r:target.reps.min,targetRepMin:target.reps.min,targetRepMax:target.reps.max,targetIntensityMin:target.targetIntensityMin,targetIntensityMax:target.targetIntensityMax,tempo:target.tempo,rest:target.rest,targetRpeMin:target.rpeMin,targetRpeMax:target.rpeMax,targetRirMin:target.rirMin,targetRirMax:target.rirMax,allowFailure:false});
        }
      }
    }
    plan.description=fresh.description;plan.principles=fresh.principles;plan.cycleOptions=fresh.cycleOptions;plan.sourceRevision=REVISION;plan.updated=plan.updatedAt=Date.now();
    return true;
  }
  return {ID,NAME,REVISION,days,build,upgrade};
});
