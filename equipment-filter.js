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
