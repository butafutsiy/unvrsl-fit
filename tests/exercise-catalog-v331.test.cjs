'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const context={console,setTimeout:()=>0,setInterval:()=>0,clearInterval:()=>{},CustomEvent:function(){},document:{querySelector:()=>null},ROUTINES:[],st:{programs:[],planAdds:{}},save:()=>{throw new Error('registry must not persist plan repairs')}};
context.window=context;context.globalThis=context;context.addEventListener=()=>{};
for(const file of ['exercise-media-verified-v331.js','exercise-picker-v331.js','exercise-plan-canonical-v329.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const api=context.UNVRSL_EXERCISE_REGISTRY_V331;

const expected={
  'Молотковые сгибания с канатом':'cable_rope_hammer','Французский жим':'ez_lying_triceps','Гиперэкстензия с диском':'weighted_hyperextension',
  'Ягодичный мост':'barbell_hip_thrust','Выпады назад':'reverse_lunge_db','Зашагивания':'stepup_db','Разгибание гантели из-за головы':'db_overhead_triceps',
  'Сгибания с супинацией':'db_supination_curl','Французский жим с гантелями':'db_lying_triceps','Рывок гири одной рукой':'kettlebell_snatch',
  'Бицепс в блоке обратным хватом':'cable_reverse_curl','Вертикальная тяга одной рукой':'one_arm_lat_pulldown','Скручивания с небольшим весом':'decline_crunch',
  'Запрыгивания':'box_jump','Тяга в тренажёре одной рукой':'one_arm_machine_row','Трицепс с прямой рукоятью':'straight_bar_pushdown',
  'Подъём ног на брусьях':'captain_leg_raise','Тяга в наклоне в Смите':'smith_bent_row','Тяга гантели одной рукой':'one_arm_db_row',
  'Пуловер с гантелью':'db_pullover','Пуловер на верхнем блоке':'cable_pullover','Разгибание руки из-за головы в кроссовере':'cable_one_arm_overhead_triceps'
};

test('all reviewed plan aliases resolve to one exact entity',()=>{
  assert.equal(Object.keys(expected).length,22);
  for(const [name,key] of Object.entries(expected))assert.equal(api.find(name)?.key,key,name)
});

test('visible cards have verified media or an explicit unavailable state',()=>{
  const visible=api.specs.filter(x=>x.show);assert.equal(visible.length,22);
  const unavailable=new Set(['barbell_hip_thrust','weighted_hyperextension','box_jump']);
  for(const spec of visible){const card=api.record(spec.key);assert.equal(card.n,spec.ru);assert.equal(card.canonicalKey,spec.key);assert.equal(card.mediaUnavailable,unavailable.has(spec.key));if(!unavailable.has(spec.key))assert.match(card.gif,/\.gif$/)}
});

test('one-arm row and pullover use the checked records',()=>{
  const row=api.record('one_arm_db_row'),pullover=api.record('db_pullover');
  assert.equal(row.sourceId,'0292');assert.equal(row.eq,'dumbbell');assert.equal(row.n,'Тяга гантели к поясу одной рукой');
  assert.equal(pullover.sourceId,'0375');assert.equal(pullover.eq,'dumbbell');assert.equal(pullover.n,'Пуловер с одной гантелью лёжа')
});

test('mapping keeps plan prescription and raw title intact',()=>{
  const exercise={n:'Тяга гантели одной рукой',w:42.5,r:'8–10',rpe:'7–8',sets:[{w:42.5,r:8}]};
  context.st.programs=[{weeks:[{days:[{ex:[exercise]}]}]}];api.mapPlans();
  assert.equal(exercise.n,'Тяга гантели одной рукой');assert.equal(exercise.w,42.5);assert.equal(exercise.r,'8–10');assert.equal(exercise.rpe,'7–8');assert.deepEqual(exercise.sets,[{w:42.5,r:8}]);assert.equal(exercise.sourceId,'0292')
});

test('client picker contains every reviewed canonical name without duplicates',()=>{
  const names=context.UNVRSL_EXERCISE_PICKER_V331.list();
  for(const spec of api.specs.filter(x=>x.show))assert.ok(names.includes(spec.ru),spec.ru);
  assert.equal(names.length,new Set(names.map(x=>x.toLocaleLowerCase('ru').replace(/ё/g,'е'))).size)
});
