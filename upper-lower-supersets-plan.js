'use strict';
((root,factory)=>{
  const api=factory();
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
  root.addEventListener('unvrsl:app-ready',showLinkedPlan);
})(typeof window==='undefined'?null:window,()=>{
  const ID='semen-upper-lower-supersets-2w',NAME='Верх / низ · суперсеты · 2 недели';
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
  function build(domain,startDate){
    if(!startDate){
      const date=new Date();
      date.setDate(date.getDate()+(8-date.getDay())%7);
      startDate=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
    }
    const weeks=Array.from({length:2},(_,wi)=>({
      n:wi+1,
      loadProfileManual:true,useIntensity:false,
      rpeMin:wi?8:7,rpeMax:wi?9:8.5,rirMin:wi?1:1.5,rirMax:wi?2:3,
      tempo:'2-1-1',baseRestMin:90,baseRestMax:150,isolationRestMin:60,isolationRestMax:120,
      focus:wi?'Неделя 2: добавляй повторения в указанном диапазоне либо 2,5–5% веса только при сохранении целевого RPE.':'Неделя 1: подбор нагрузки и контроль техники; основные упражнения без отказа.',
      days:days.map((day,di)=>({
        id:ID+'-w'+(wi+1)+'-d'+(di+1),name:day.name,role:'Middle',date:datePlus(startDate,wi*7+di*3),
        ex:day.groups.flatMap((group,gi)=>group.items.map((row,ei)=>{
          const [n,kind,count,min,max,baseRpe,extra,loadType]=row;
          const rpe=Math.min(9,baseRpe+(wi?0.5:0));
          const rest=ei===group.items.length-1?group.rest:0;
          const tempo=/носки/.test(n)?'2-1-2':'2-1-1';
          const isGroup=group.items.length>1;
          const note=[group.name+' · отдых после связки '+group.rest+' сек.',extra,wi?'Неделя 2: увеличить повторы либо вес при сохранении RPE.':'Неделя 1: подобрать рабочий вес.'].filter(Boolean).join(' ');
          return {
            id:ID+'-w'+(wi+1)+'-d'+(di+1)+'-g'+(gi+1)+'-e'+(ei+1),
            n,kind,method:'STANDARD',loadType:loadType||undefined,
            repCounting:/болгар|одной ногой/i.test(n)?'per_leg':undefined,
            ...(isGroup?{superGroup:ID+'-w'+(wi+1)+'-d'+(di+1)+'-g'+(gi+1),superPos:ei,superSize:group.items.length,transitionSec:0,afterGroupRestSec:group.rest}:{}),
            reps:{mode:'manual',min,max},originalSets:count,originalRepRange:[min,max],
            rpe,rpeMin:rpe,rpeMax:rpe,rirMin:10-rpe,rirMax:10-rpe,effortSourceMode:'manual',
            tempoMode:'manual',tempo,restMode:'manual',rest,restMin:rest,restMax:rest,
            weightMode:'auto',parameterOverrides:{version:386,effort:{mode:'manual',type:'rpe',rpeMin:rpe,rpeMax:rpe,rirMin:10-rpe,rirMax:10-rpe},tempo:{mode:'manual',value:tempo},rest:{mode:'manual',min:rest,max:rest},weight:{mode:'auto',value:0}},
            note,sets:Array.from({length:count},()=>({w:0,r:min,tempo,rest}))
          };
        }))
      }))
    }));
    return {
      id:ID,seedId:ID,sourceRevision:1,name:NAME,author:'Семён Бутаков',
      created:Date.now(),updated:Date.now(),
      description:'2 тренировки в неделю: низ и верх. Три суперсета на низ + икры; три суперсета и трисет на верх + пресс. Прогрессия на 2 недели.',
      principles:['Рабочие подходы не включают разминку.','Внутри суперсета/трисета только переход; отдых 60–150 сек после полного круга.','RIR = 10 − RPE.','Неделя 2: повторы в диапазоне или 2,5–5% веса при сохранении RPE.'],
      weeks
    };
  }
  return {ID,NAME,days,build};
});