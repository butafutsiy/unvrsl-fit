'use strict';
let exEquipment='all';
const EQUIPMENT_FILTERS=[
 ['all','Все'],
 ['smith machine','Смит'],
 ['dumbbell','Гантели'],
 ['barbell','Штанга'],
 ['cable','Блок'],
 ['machine','Тренажёр'],
 ['body weight','Свой вес']
];
function equipmentGroup(ex){
 const eq=String(ex?.eq||'').toLowerCase();
 if(eq==='smith machine')return'smith machine';
 if(eq==='dumbbell')return'dumbbell';
 if(['barbell','olympic barbell','ez barbell'].includes(eq))return'barbell';
 if(['cable','rope'].includes(eq))return'cable';
 if(['leverage machine','sled machine','assisted'].includes(eq))return'machine';
 if(eq==='body weight')return'body weight';
 return eq;
}
function exerciseEquipmentFilterActive(){return exEquipment!=='all'&&document.querySelector('#exercises.page.active')}
const _catalogRecordsEquipment=catalogRecords;
catalogRecords=function(){
 const all=_catalogRecordsEquipment();
 if(!exerciseEquipmentFilterActive())return all;
 return all.filter(e=>equipmentGroup(e)===exEquipment)
};
function renderEquipmentFilters(){
 const el=$('#equipmentFilters');if(!el)return;
 el.innerHTML=EQUIPMENT_FILTERS.map(([id,label])=>`<button class="filterchip ${exEquipment===id?'on':''}" onclick="setExerciseEquipment('${id}')">${label}</button>`).join('')
}
function setExerciseEquipment(eq){exEquipment=eq||'all';renderEquipmentFilters();renderExerciseResults()}
const _exercisesPageEquipment=exercisesPage;
exercisesPage=function(){
 _exercisesPageEquipment();
 const body=$('#bodyFilters');if(!body)return;
 if(!$('#equipmentFilters'))body.insertAdjacentHTML('afterend','<div class="section" style="margin-top:10px;margin-bottom:4px">ОБОРУДОВАНИЕ</div><div id="equipmentFilters" class="filterbar"></div>');
 renderEquipmentFilters();
 renderExerciseResults()
};

// Preserve timed cardio when the built-in 8-week cycle is copied into «Мои программы».
(()=>{
 const normalize=n=>typeof baseExerciseName==='function'?baseExerciseName(n).trim().toLowerCase():String(n||'').trim().toLowerCase();
 const timeText=sec=>sec%60===0?`${sec/60} мин`:`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
 function timedMeta(r,g){
  const src=(g?.entries||[]).find(e=>Number(e?.m)>0);if(!src)return null;
  const sec=Math.max(1,Math.round(Number(src.m)*60)),count=Math.max(1,Number(src.s)||1),entries=typeof routineEntries==='function'?routineEntries(r):(r.e||[]),idx=g?.indices?.at?.(-1)??g?.indices?.[g.indices.length-1]??0;
  let restSec=90;try{restSec=typeof rest==='function'?Number(rest(r,entries[idx],idx)||0):90}catch(e){}
  return{src,sec,count,restSec}
 }
 function applyTimed(obj,r,g){
  const meta=timedMeta(r,g);if(!obj||!meta)return obj;
  const prev=Array.isArray(obj.sets)?obj.sets:[],count=prev.length||meta.count;
  obj.kind='cardio';obj.workMode='timer';obj.bp='cardio';obj.tg='cardiovascular system';obj.eq='cardio';obj.method='STANDARD';
  obj.durationSec=meta.sec;obj.workSeconds=meta.sec;obj.rpe=Number(obj.rpe||((typeof RPE==='object'&&RPE[r.w])||6));obj.tempo=obj.tempo||'равномерный';obj.rest=Number(obj.rest??meta.restSec??0);
  if(meta.src.d&&!obj.note)obj.note=meta.src.d;
  obj.displayPrescription=`${count>1?`${count}×`:''}${timeText(meta.sec)} · RPE ${obj.rpe}${obj.rest?` · отдых ${obj.rest} сек`:''}`;
  obj.sets=Array.from({length:count},(_,i)=>({label:prev[i]?.label||String(i+1),w:0,r:0,rest:Number(prev[i]?.rest??obj.rest??0),workSeconds:meta.sec}));
  return obj
 }
 function sourceGroupFor(w,dayName,exerciseName){
  if(typeof ROUTINES==='undefined'||typeof groupIndexedEntries!=='function'||typeof routineEntries!=='function')return null;
  const code=String(dayName||'').split('·')[0].trim(),target=normalize(exerciseName),week=Number(w)||1;
  const passes=[ROUTINES.filter(r=>Number(r.w)===week&&(!code||String(r.c)===code)),ROUTINES.filter(r=>Number(r.w)===week)];
  for(const list of passes)for(const r of list)for(const g of groupIndexedEntries(routineEntries(r))){if(!timedMeta(r,g))continue;if(normalize(g.base)===target)return{r,g}}
  return null
 }
 const original=window.builtInGroupToProgramExercise||((typeof builtInGroupToProgramExercise==='function')?builtInGroupToProgramExercise:null);
 if(typeof original==='function'&&!original.__timedCardioCopy){
  const wrapped=function(r,g){return applyTimed(original.apply(this,arguments),r,g)};
  wrapped.__timedCardioCopy=true;window.builtInGroupToProgramExercise=wrapped;try{builtInGroupToProgramExercise=wrapped}catch(e){}
 }
 function migratePrograms(){
  if(!Array.isArray(st?.programs))return false;let changed=false;
  st.programs.forEach(p=>(p.weeks||[]).forEach((w,wi)=>(w.days||[]).forEach(d=>(d.ex||[]).forEach(pe=>{
   if(pe?.kind==='cardio'&&Number(pe.durationSec||pe.workSeconds)>0)return;
   const hit=sourceGroupFor(w.n||wi+1,d.name,pe?.n);if(!hit)return;
   applyTimed(pe,hit.r,hit.g);changed=true
  }))));
  if(changed)try{save()}catch(e){}
  return changed
 }
 function migrateCurrent(){
  const cur=st?.current;if(!cur?.programId||!Array.isArray(st?.programs))return false;
  const p=st.programs.find(x=>String(x.id)===String(cur.programId));if(!p)return false;
  const w=p.weeks?.[(Number(cur.w)||1)-1],d=w?.days?.find(x=>String(x.name)===String(cur.c))||w?.days?.[0];if(!d)return false;
  let changed=false;(cur.ex||[]).forEach(e=>{
   const pe=(d.ex||[]).find(x=>normalize(x.n)===normalize(e.n));if(!pe||pe.kind!=='cardio')return;
   const sec=Number(pe.durationSec||pe.workSeconds||pe.sets?.[0]?.workSeconds||0);if(!sec)return;
   const old=Array.isArray(e.set)?e.set:[],count=pe.sets?.length||old.length||1;
   e.mode='timer';e.kind='cardio';e.workSeconds=sec;e.timedSeconds=sec;e.sourceId=pe.sourceId||e.sourceId||null;e.target=Number(pe.rpe||e.target||cur.target||6);e.d=pe.note||e.d||'';e.rest=Number(pe.rest||e.rest||0);
   e.set=Array.from({length:count},(_,i)=>({n:i+1,workSeconds:sec,rpe:old[i]?.rpe||'',ok:!!old[i]?.ok}));changed=true
  });
  if(changed){try{save()}catch(e){};try{startPage()}catch(e){}}return changed
 }
 window.migrateMyProgramTimedCardio=function(){const a=migratePrograms(),b=migrateCurrent();return a||b};
 migratePrograms();migrateCurrent();setTimeout(()=>{migratePrograms();migrateCurrent()},1200);
})();

Promise.resolve()
 .then(()=>loadExternalScript('exercise-library-quality.js'))
 .then(()=>loadExternalScript('exercise-library-curated.js'))
 .then(()=>loadExternalScript('exercise-library-strict.js'))
 .then(()=>loadExternalScript('cardio-metric-fixes.js'))
 .then(()=>loadExternalScript('preview-mobile-fix.js'))
 .then(()=>loadExternalScript('template-programs-v3.js'))
 .then(()=>loadExternalScript('template-tempo-wave.js'))
 .catch(e=>console.warn('curated exercise/cardio/preview/template fixes',e));
