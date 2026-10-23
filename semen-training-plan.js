'use strict';
((root,factory)=>{
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(!root)return;
  root.SemenTrainingPlan=api;
  // Personal plans are opt-in. Loading the app never seeds other accounts.
  let adding=false;
  root.addSemenTrainingPlan=async()=>{
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
  const card=(canHide=false)=>canHide&&root.renderTemplateCard?root.renderTemplateCard({title:api.NAME,description:'Два смешанных дня: грудь и квадрицепс / спина и задняя поверхность бедра. Разгрузка на 4-й и 6-й неделях.',weeks:8,frequency:2,key:'personal:'+api.ID,action:'addSemenTrainingPlan()'}):`<div class="card" id="semen-training-plan"><b>${api.NAME}</b><div class="muted small" style="margin-top:8px">Два исходных смешанных дня · 10 упражнений в каждом · 8 недель. Грудь и квадрицепс / спина и задняя поверхность бедра. Разгрузка на 4-й и 6-й неделях. Веса подбираются по истории и RPE.</div><button class="btn primary" style="margin-top:12px" onclick="addSemenTrainingPlan()">Добавить в мои программы</button>${canHide?(root.templateHideButton?.('personal:'+api.ID)||''):''}</div>`;
  const original=root.templatesSheet;
  root.registerTemplateOption?.('personal:'+api.ID,api.NAME);
  if(typeof original==='function'){
    root.templatesSheet=function(){const result=original.apply(this,arguments);const sheet=document.getElementById('sheet');if(sheet&&!root.templateIsHidden?.('personal:'+api.ID)&&!document.getElementById('semen-training-plan'))sheet.insertAdjacentHTML('beforeend',card(true));return result;};
  }
  let shown=false;
  function showLinkedPlan(){
    if(shown||new URL(root.location.href).searchParams.get('addPlan')!==api.ID||typeof root.modal!=='function')return;
    shown=true;
    root.modal(`<div class="sheet-grabber"></div><h2>Твой тренировочный план</h2>${card()}<div class="muted small">Добавь в нужном аккаунте. День 1 доступен сразу. Текущая незавершённая тренировка сохранится. Повторное добавление откроет существующий план.</div>`);
  }
  root.addEventListener('unvrsl:app-ready',showLinkedPlan);
})(typeof window==='undefined'?null:window,()=>{
  const ID='semen-upper-lower-8',NAME='Верх–низ · Семён · 8 недель';
  // n, kind, original working sets, original rep range, alternatives, note.
  const days=[
    {name:'День 1 · Грудь + квадрицепс + бицепс + средняя дельта',ex:[
      ['Жим штанги лёжа','compound',4,[6,10]],
      ['Жим гантелей на наклонной скамье','compound',4,[8,12],'','Вес на одну гантель.'],
      ['Сведения в кроссовере','isolation',4,[12,15],'Разводка гантелями'],
      ['Приседания со штангой','compound',4,[6,10]],
      ['Жим ногами','compound',4,[10,12]],
      ['Разгибания ног в тренажёре','isolation',4,[12,15]],
      ['Подъём штанги на бицепс стоя','isolation',3,[8,12]],
      ['Молотки с гантелями','isolation',2,[10,12],'','Вес на одну гантель; повторы на каждую руку. В исходнике 2–3 подхода, выбран нижний предел.'],
      ['Махи гантелями в стороны','isolation',3,[12,15],'','Вес на одну гантель.'],
      ['Махи в кроссовере','isolation',2,[12,15],'Махи на блоке','Повторы на каждую руку. В исходнике 2–3 подхода, выбран нижний предел.']
    ]},
    {name:'День 2 · Спина + бицепс бедра + трицепс + передняя дельта',ex:[
      ['Тяга штанги в наклоне','compound',4,[8,12]],
      ['Тяга гантели одной рукой в наклоне','compound',4,[8,12],'','Вес одной гантели, повторы на каждую руку.'],
      ['Подтягивания','compound',4,[8,12],'Тяга верхнего блока','В поле веса для подтягиваний указывается только дополнительное отягощение.'],
      ['Румынская становая тяга','compound',4,[8,12]],
      ['Сгибания ног лёжа','isolation',4,[10,15]],
      ['Ягодичный мост со штангой','compound',4,[12,15],'','Акцент на ягодичные мышцы.'],
      ['Жим узким хватом','compound',3,[8,12],'Брусья'],
      ['Разгибания на блоке с канатом','isolation',2,[12,15],'','В исходнике 2–3 подхода, выбран нижний предел.'],
      ['Жим гантелей сидя','compound',3,[8,12],'Жим Арнольда','Вес на одну гантель.'],
      ['Подъём гантелей перед собой','isolation',2,[12,15],'','Вес на одну гантель. В исходнике 2–3 подхода, выбран нижний предел.']
    ]}
  ];
  function build(domain,startDate){
    const today=new Date();
    startDate=startDate||[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
    const sources=days.flatMap((day,di)=>day.ex.map(([n,kind,count,reps,alternative,note],ei)=>({
      id:`${ID}-d${di+1}-e${ei+1}`,n,kind,method:'STANDARD',dayIndices:[di],
      originalSets:count,originalRepRange:reps,alternatives:alternative?[alternative]:[],
      loadType:n==='Подтягивания'?'bodyweight_added':/гантел|Молотки/.test(n)?'per_dumbbell':undefined,
      note:[note,alternative?`Замена: ${alternative}.`:''].filter(Boolean).join(' '),
      sets:Array.from({length:count},()=>({w:0,r:reps[0]}))
    })));
    const profiles=domain.cycleProfiles(8,{testWeek:false});
    const cycle=domain.generateCycle({weeks:8,daysPerWeek:2,startDate,testWeek:false,exercises:sources,
      weekExercises:profiles.map(p=>sources.map(e=>({...e,
        weeklySetsOverride:Math.min(e.originalSets,p[e.kind==='isolation'?'isolation':'base'].sets+(e.kind==='isolation'&&e.originalSets===4?1:0))
      })))
    });
    cycle.weeks.forEach((week,wi)=>week.days.forEach((day,di)=>{
      day.id=`${ID}-w${wi+1}-d${di+1}`;day.name=days[di].name;
      day.date=new Date(Date.parse(startDate+'T12:00:00Z')+(wi*7+di*3)*86400000).toISOString().slice(0,10);
      // These days train different groups, so neither is a lighter repeat.
      day.role='Middle';
      day.ex.forEach(e=>{
        e.id=`${e.id}-w${wi+1}`;
        e.tempo=week.weeklyLoadProfile.tempo;
        e.rest=(e.kind==='isolation'?week.weeklyLoadProfile.isoRest:week.weeklyLoadProfile.baseRest)[1];
        e.sets.forEach(s=>{s.rest=e.rest;s.tempo=e.tempo;});
        e.note=[e.note,`Исходный диапазон: ${e.originalSets}×${e.originalRepRange.join('–')}. Повторы и нагрузка меняются по неделям.`].filter(Boolean).join(' ');
      });
    }));
    return {id:ID,seedId:ID,sourceRevision:1,name:NAME,author:'Семён Бутаков',created:Date.now(),updated:Date.now(),
      description:'Два смешанных дня в исходной последовательности, по одной тренировке каждого дня в неделю. Это авторский сплит, а не классическое разделение всего верха и низа. Восьмая неделя без обязательного теста 1ПМ.',
      principles:['Разминочные подходы не входят в рабочие.','На 4-й и 6-й неделях снижаются объём и усилие.','RIR = 10 − RPE. При отсутствии истории вес нужно подобрать, ноль не является рекомендацией.','Сравнивай рабочие результаты, не выполняя обязательный максимальный одиночный повтор.'],...cycle};
  }
  return {ID,NAME,days,build};
});
