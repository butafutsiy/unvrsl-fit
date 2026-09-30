'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.UNVRSLIntakeProfile=api})(typeof window!=='undefined'?window:globalThis,()=>{
 const EQUIPMENT={gym:'Тренажёрный зал',bodyweight:'Только собственный вес',pullup_dip:'Турник и брусья',kettlebells:'Гири',barbell:'Штанга',dumbbells:'Гантели'};
 const CONDITIONS={spinal_hernia:'Грыжа межпозвонкового диска',spinal_protrusion:'Протрузия позвоночника',back_pain:'Боль в спине или шее',umbilical_hernia:'Пупочная грыжа',inguinal_hernia:'Паховая / другая грыжа живота',knees:'Боль или травма коленей',shoulders:'Боль или травма плеч',hips:'Проблемы тазобедренных суставов',ankles:'Боль или травма голеностопа / стопы',elbows_wrists:'Боль или травма локтей / кистей',blood_pressure:'Повышенное давление',heart:'Заболевания сердца / сосудов',diabetes:'Сахарный диабет',respiratory:'Астма / другие заболевания дыхания',pregnancy:'Беременность',postpartum:'Восстановление после родов',surgery:'Недавняя операция / восстановление после травмы',other:'Другое ограничение',unsure:'Не уверен(а), нужно обсудить'};
 const SPORT={none:'Раньше не занимался(ась)',under6m:'Меньше 6 месяцев',m6_24:'От 6 месяцев до 2 лет',y2plus:'Больше 2 лет'};
 const BREAK={none:'Тренируюсь сейчас / перерыв меньше месяца',m1_3:'От 1 до 3 месяцев',m3_12:'От 3 до 12 месяцев',y1plus:'Больше года',never:'Ещё не начинал(а)'};
 const ACTIVITY={sedentary:'В основном сижу',low:'Немного хожу в течение дня',moderate:'Много хожу / часть дня на ногах',high:'Подвижная работа / высокая активность',very_high:'Тяжёлая физическая работа / очень высокая активность'};
 const NUTRITION_GOALS={cut:'Снижение веса',maintain:'Поддержание веса',gain:'Набор массы'};
 const text=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
 const num=v=>v===''||v==null?null:Number(String(v).replace(',','.'));
 const has=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k);
 function list(v,dict,label){if(!Array.isArray(v)||v.length>Object.keys(dict).length||v.some(x=>!has(dict,x)))throw Error('Проверь '+label);return [...new Set(v)].sort()}
 function normalize(raw){
  const firstName=text(raw.firstName,40),lastName=text(raw.lastName,50),age=num(raw.age),height=num(raw.height),weight=num(raw.weight),steps=num(raw.steps),currentSessions=num(raw.currentSessions);
  if(!firstName||!lastName)throw Error('Укажи имя и фамилию');
  if(!Number.isInteger(age)||age<12||age>100)throw Error('Проверь возраст');
  if(!['male','female'].includes(raw.sex))throw Error('Укажи пол для расчёта КБЖУ');
  if(!Number.isFinite(height)||height<120||height>230||!Number.isFinite(weight)||weight<35||weight>300)throw Error('Проверь рост и вес');
  if(!has(SPORT,raw.sportExperience)||!has(SPORT,raw.strengthExperience)||!has(BREAK,raw.trainingBreak))throw Error('Укажи спортивный опыт и перерыв');
  if(!has(ACTIVITY,raw.dailyActivity)||!has(NUTRITION_GOALS,raw.nutritionGoal)||!['yes','no','unsure'].includes(raw.overweight))throw Error('Заполни данные для питания');
  if(steps!==null&&(!Number.isInteger(steps)||steps<0||steps>50000)||!Number.isInteger(currentSessions)||currentSessions<0||currentSessions>14)throw Error('Проверь шаги и текущие силовые занятия');
  const conditions=list(raw.conditions,CONDITIONS,'ограничения'),equipmentGroups=list(raw.equipmentGroups,EQUIPMENT,'оборудование');
  if(!equipmentGroups.length)throw Error('Выбери доступное оборудование');
  if(equipmentGroups.includes('bodyweight')&&equipmentGroups.length>1)throw Error('«Только собственный вес» нельзя сочетать с оборудованием');
  if(typeof raw.noConditions!=='boolean'||(raw.noConditions&&conditions.length)||(!raw.noConditions&&!conditions.length))throw Error('Отметь ограничения или «Ничего из перечисленного»');
  if(!['none','sometimes','current'].includes(raw.pain)||!['none','yes','unsure'].includes(raw.medicalRestrictions))throw Error('Уточни боль и ограничения врача');
  const regions=list(raw.spineRegions||[],{neck:1,chest:1,lumbar:1},'отдел позвоночника');
  const equipment=new Set();for(const key of equipmentGroups){
   if(key==='gym')for(const item of ['dumbbells','bench','barbell','rack','cable','legpress','legcurl','chestpress'])equipment.add(item);
   else if(key!=='bodyweight')equipment.add(key);
  }
  const home=!equipmentGroups.includes('gym')&&!equipmentGroups.includes('bodyweight'),homeBench=home&&raw.homeBench===true,homeRack=home&&equipment.has('barbell')&&raw.homeRack===true;
  if(homeBench)equipment.add('bench');if(homeRack)equipment.add('rack');
  const strengthKnown=['m6_24','y2plus'].includes(raw.strengthExperience),longBreak=['m3_12','y1plus','never'].includes(raw.trainingBreak);
  return{schemaVersion:2,firstName,lastName,name:`${firstName} ${lastName}`,age,sex:raw.sex,height,weight,sportExperience:raw.sportExperience,sports:text(raw.sports,180),strengthExperience:raw.strengthExperience,trainingBreak:raw.trainingBreak,experience:strengthKnown&&!longBreak?'regular':'beginner',currentSessions,steps,dailyActivity:raw.dailyActivity,nutritionGoal:raw.nutritionGoal,overweight:raw.overweight,equipmentGroups,equipment:[...equipment].sort(),homeBench,homeRack,noConditions:raw.noConditions,conditions,spineRegions:regions,pain:raw.pain,medicalRestrictions:raw.medicalRestrictions,limitationNotes:text(raw.limitationNotes,350),limitations:conditions.length>0||raw.pain!=='none'||raw.medicalRestrictions!=='none'};
 }
 function nutritionInputs(a){
  if(a.schemaVersion!==2)throw Error('В старой анкете нет данных для КБЖУ. Отправь новую анкету.');
  if(a.age<18||a.conditions.some(x=>['pregnancy','postpartum','diabetes','heart','surgery'].includes(x)))throw Error('Питание требует индивидуального разбора. Автоматический расчёт для этой анкеты отключён.');
  if(a.overweight==='unsure')throw Error('Уточни наличие лишнего веса для выбора формулы.');
  if(a.steps===null)throw Error('Уточни среднее количество шагов для расчёта активности.');
  return{sex:a.sex,age:a.age,height:a.height,weight:a.weight,steps:a.steps,strengthSessions:a.currentSessions,dailyActivity:a.dailyActivity,overweight:a.overweight==='yes',activityFactor:''};
 }
 return{EQUIPMENT,CONDITIONS,SPORT,BREAK,ACTIVITY,NUTRITION_GOALS,normalize,nutritionInputs};
});
