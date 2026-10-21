'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(!root)return;
  root.prepareProgramWeights=api.prepareProgramWeights;
  root.duplicateProgram=function(id,mode){
    const source=root.programById?.(id);if(!source||root.intakeDraftBlocked?.(source))return;
    if(!mode)return root.chooseProgramWeights(choice=>root.duplicateProgram(id,choice));
    const copy=api.prepareProgramWeights(source,mode);
    for(const field of ['cloudPlanId','cloudVersion','trainerId','trainerName','intakeDraft','intakeSourceKey'])delete copy[field];
    copy.id=root.uid('prog');copy.name=`${source.name} · копия`;copy.created=Date.now();copy.updated=Date.now();
    for(const week of copy.weeks||[])for(const day of week.days||[])day.id=root.uid('day');
    root.st.programs.push(copy);root.save();root.closeModal?.();root.openProgramEditor(copy.id);
    return copy;
  };
  let pending=null;
  root.chooseProgramWeights=function(action,options={}){
    pending=action;
    root.modal(`<div class="row between"><h2>Веса в программе</h2><button class="btn tiny" onclick="cancelProgramWeightChoice()" aria-label="Закрыть">✕</button></div><p class="muted">Выбери веса для копии или получателя. Исходная программа сохранится.</p>${options.name!=null?`<label class="field">Название у клиента<input id="pwcTitle521" maxlength="100" value="${String(options.name).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}" autocomplete="off"></label>`:''}<button class="btn full" style="margin-top:12px" onclick="applyProgramWeightChoice('keep')">Сохранить веса</button><p class="muted small">Оставить все заданные рабочие веса.</p><button class="btn primary full" style="margin-top:16px" onclick="applyProgramWeightChoice('auto')">Автовес</button><p class="muted small">Очистить веса. Рассчитывать по истории человека, неделе и выбранному тренажёру. Без истории нужно задать стартовый вес.</p>`);
  };
  root.cancelProgramWeightChoice=()=>{pending=null;root.closeModal?.()};
  root.applyProgramWeightChoice=mode=>{if(!['keep','auto'].includes(mode)||!pending)return;const input=root.document?.getElementById?.('pwcTitle521'),title=input?.value.trim();if(input&&!title){root.toast?.('Укажи название программы');return}const action=pending;pending=null;root.closeModal?.();return action(mode,title)};
})(typeof window!=='undefined'?window:null,function(){
  function prepareProgramWeights(program,mode='keep'){
    const copy=JSON.parse(JSON.stringify(program));
    for(const field of ['autoWeightCloudPlanId','autoWeightCloudVersion','pendingCloudUpdate'])delete copy[field];
    if(mode!=='auto')return copy;
    delete copy.previousCycle;
    for(const field of ['assignedUserId','clientId','userId'])delete copy[field];
    const clearWeights=object=>{
      for(const field of ['w','weight','programW','plannedW','launchW','recommendedW','recommendationOriginalWeight','machineRecommendedW','lightWeight','middleWeight','heavyWeight'])if(field in object)object[field]='';
      for(const field of ['recommendation','manualOverride','weightDecision','equipmentCalibration','trainingProgression292','autoWeightSource','weightSource','trainingIntensity292'])delete object[field];
    };
    const visit=node=>{
      if(!node||typeof node!=='object')return;
      if(!Array.isArray(node)&&(Array.isArray(node.sets)||Array.isArray(node.set)||(node.n&&Object.prototype.hasOwnProperty.call(node,'w')))){
        clearWeights(node);node.weightMode='auto';node.programWeightMode='adaptive';
        node.parameterOverrides={...node.parameterOverrides,weight:{mode:'auto',value:null}};
        for(const sets of [node.sets,node.set,node.cycleOriginalSets])for(const set of sets||[])clearWeights(set);
      }
      for(const value of Object.values(node))if(value&&typeof value==='object')visit(value);
    };
    visit(copy);copy.deliveryWeightMode='auto';return copy;
  }
  return{prepareProgramWeights};
});
