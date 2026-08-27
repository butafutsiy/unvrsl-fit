'use strict';
function unvrslWrapProgramReadiness(){
  const f=window.beginProgramDay;
  if(typeof f!=='function'||f.__advReadiness||typeof advAskReadiness!=='function')return;
  const base=f;
  const wrapped=function(){return advAskReadiness(base,[...arguments])};
  wrapped.__advReadiness=true;
  window.beginProgramDay=wrapped;
}

function unvrslRestorePlannedWeights(){
  const s=window.st?.current;
  if(!s)return;
  s.keepPlannedWeights=true;
  s.adaptiveEffortV2Applied=true;
  (s.ex||[]).forEach(e=>{
    delete e.adaptiveEffort;
    (e.set||[]).forEach(x=>{
      if(x&&x.plannedW!=null&&Number.isFinite(Number(x.plannedW)))x.w=Number(x.plannedW);
    });
  });
  try{save()}catch(e){}
}

function unvrslPatchReadinessChoice(){
  const apply=window.advApplyReadinessToCurrent;
  if(typeof apply==='function'&&!apply.__keepPlanFix){
    const baseApply=apply;
    const wrappedApply=function(d,useAdjust){
      if(useAdjust)return baseApply.apply(this,arguments);
      const s=window.st?.current;
      if(!s)return;
      s.readiness=d;
      s.keepPlannedWeights=true;
      if(Array.isArray(window.st?.readinessLog)){
        window.st.readinessLog.push({date:s.date,sessionId:s.id,...d});
        window.st.readinessLog=window.st.readinessLog.slice(-120);
      }
      unvrslRestorePlannedWeights();
      try{startPage()}catch(e){}
      // Пользователь выбрал «Оставить веса по плану»: рекомендацию о снижении/повышении не показываем.
    };
    wrappedApply.__keepPlanFix=true;
    window.advApplyReadinessToCurrent=wrappedApply;
    try{advApplyReadinessToCurrent=wrappedApply}catch(e){}
  }

  const confirm=window.advConfirmReadiness;
  if(typeof confirm==='function'&&!confirm.__keepPlanFix){
    const baseConfirm=confirm;
    const wrappedConfirm=function(useAdjust){
      const r=baseConfirm.apply(this,arguments);
      if(useAdjust===false){
        // Автопрогрессия может успеть примениться во время запуска. Сразу возвращаем исходные веса плана.
        unvrslRestorePlannedWeights();
        setTimeout(unvrslRestorePlannedWeights,0);
      }
      return r;
    };
    wrappedConfirm.__keepPlanFix=true;
    window.advConfirmReadiness=wrappedConfirm;
    try{advConfirmReadiness=wrappedConfirm}catch(e){}
  }
}

unvrslWrapProgramReadiness();
unvrslPatchReadinessChoice();
setTimeout(()=>{unvrslWrapProgramReadiness();unvrslPatchReadinessChoice()},800);
setTimeout(unvrslPatchReadinessChoice,1800);
