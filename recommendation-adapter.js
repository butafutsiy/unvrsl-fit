'use strict';
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./recommendation-engine'):root.UNVRSLRecommendationEngine);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.UNVRSLRecommendationAdapter=api;})(typeof window==='undefined'?globalThis:window,E=>{
 const legacyAction=r=>({harder:'up',easier:'down',hold:'hold',stop:'stop',review:'hold',calibrate:'hold',increase_reps:'reps'}[r.effortAction]||'hold');
 function context(e,set,session,sessions,reg,overrides={},scope='START'){
  const profile=E.resolveExerciseProfile(e,reg,overrides),prescription=E.resolvePrescription({exercise:e,set,session,profile});
  const equipment={...(reg?.resolve(e)?.weightProfile?.confirmed?reg.resolve(e).weightProfile:{}),...e.weightProfile,...overrides[reg?.identity(e)],...e.equipmentProfile};
  if(equipment.weightStep>0)equipment.step=equipment.weightStep;
  if(equipment.availableLoads?.length)equipment.available=equipment.availableLoads;
  // Scalar defaults are metadata, never a substitute for a confirmed machine base.
  if(e.loadedSides!=null)equipment.loadedSides=e.loadedSides;
  if(e.implementWeight!=null)equipment.implementWeight=e.implementWeight;
  return E.normalizeRecommendationInput({exercise:e,set,session:{...session,userId:session.userId||session.recommendationActorId},history:sessions,profile,prescription,equipment,
   now:E.num(session.started)??(Date.parse(session.started||session.date||'')||0),targetSetId:set.recommendationTargetId||set.id,scope:session.recommendationScope||scope,targetSetKey:`${session.id||'draft'}:${(session.ex||[]).indexOf(e)}:${(e.set||[]).indexOf(set)}`},reg,overrides);
 }
 function decision(e,s,session,p,target=s,reg){
  const c=context(e,target,session,[],reg,{},'LIVE');c.equipment={...c.equipment,...p};
  const a=E.normalizeRecommendationInput({exercise:e,set:s,session,profile:c.profile,equipment:c.equipment}).actual;
  c.actual=a;
  const r=E.recommendNextSet(c);
  return {...r,action:legacyAction(r),state:r.effortAction==='stop'?'STOP':r.effortAction==='review'?'REVIEW':r.effortAction==='harder'?'TOO_EASY':r.effortAction==='easier'?'TOO_HARD':'TARGET',weight:r.suggestedWeight,reason:r.reasonText};
 }
 function recommend(e,set,session,sessions,reg,overrides={}){
  const c=context(e,set,session,sessions,reg,overrides);
  const targetIndex=(e.set||[]).indexOf(set);
  // Select the last comparable role, including safety signals with incomplete metrics.
  const prior=(e.set||[]).slice(0,targetIndex).filter(s=>(s.ok||['completed','failed_attempt'].includes(s.status))&&!s.warmup&&!s.skipped&&E.resolvePrescription({exercise:e,set:s,session}).setRole===c.prescription.setRole).at(-1);
  let live=null,r;
  if(prior){
   const actual=E.normalizeRecommendationInput({exercise:e,set:prior,session,profile:c.profile,equipment:c.equipment}).actual;
   const previousTarget=E.resolvePrescription({exercise:e,set:prior,session});
   const sameCluster=['SLDR','REST_PAUSE'].includes(c.prescription.methodId)&&prior.round!=null&&prior.round===set.round;
   if(sameCluster)c.clusterInitialWeight=E.num((e.set||[]).find(s=>s.ok&&s.round===set.round)?.actualWeight??(e.set||[]).find(s=>s.ok&&s.round===set.round)?.w);
   if(sameCluster||prior.targetRepMin==null&&prior.plannedReps==null||previousTarget.repMin===c.prescription.repMin&&previousTarget.repMax===c.prescription.repMax){c.scope='LIVE';c.actual=actual;r=E.recommendNextSet(c);live={...r,action:legacyAction(r),weight:r.suggestedWeight,reason:r.reasonText};}
   else {c.scope='PHASE_CHANGE';r=E.recommendPhaseChange(c);}
  }
  if(!r){if(c.prescription.plannedTest){c.scope='TEST';r=E.recommendTestAttempt(c);}else r=c.scope==='NEXT_SESSION'?E.recommendNextSession(c):E.recommendStart(c);}
  const evidence=E.getComparableEvidence(c),estimate=E.estimateLocalCapacity(evidence,c.profile);
  const p=c.prescription,action=legacyAction(r),last=evidence[0]?.rows[0]?.context.actual.weight??null;
  const applicable=(r.suggestedWeight!=null||r.suggestedReps!=null||r.suggestedSeconds!=null||r.suggestedDistance!=null)&&!['review','stop','calibrate'].includes(r.effortAction)&&!r.needsAcknowledgement;
  return {...r,targetPath:{sessionId:session.id,exerciseIndex:(session.ex||[]).indexOf(e),setIndex:(e.set||[]).indexOf(set)},appliedAt:set.recommendationDecision?.id===r.id&&set.recommendationDecision.status==='applied'?set.recommendationDecision.at:null,applicationFingerprint:E.applicationFingerprint(set),proposalKey:r.inputFingerprint,
   action,weight:r.suggestedWeight,raw:r.rawTargetLoad,previous:last,delta:r.deltaDisplayed??0,reason:r.reasonText,
   canApply:applicable,reliable:!!evidence.length||!!prior,scope:r.scope,
   sessionIds:r.evidenceSessionIds.length?r.evidenceSessionIds:evidence.map(s=>s.sessionId),
   evidence:[...evidence.slice(0,3).map(s=>`${s.sessionId}: ${s.rows.map(x=>`${x.context.actual.weight} × ${x.context.actual.reps}`).join(' / ')}`),...(prior?[`Сегодня: ${c.actual.reps} / RIR ${c.actual.actualRir??'?'}`]:[])],
   weightMode:p.weightMode,repRange:{lo:p.repMin,hi:p.repMax},targetEffort:{lo:10-p.targetRirMax,hi:10-p.targetRirMin},
   step:E.num(c.equipment.step??c.equipment.weightStep)??0,profile:c.profile,
   confidence:{low:'низкая',medium:'средняя',high:'высокая',none:'нет данных'}[r.confidence]||r.confidence,
   dataConfidence:r.confidence,confidenceFlags:r.warnings,rounding:'Только доступные ступени выбранного оборудования',
   strength:{estimate:estimate.estimate,stableMean:estimate.estimate,best:null,confirmed:null,sessionCount:estimate.sessions.length,setCount:estimate.sessions.reduce((s,x)=>s+x.validSets,0),sources:evidence.flatMap(s=>s.rows.slice(0,2).map(x=>({date:new Date(s.performedAt).toISOString().slice(0,10),method:x.context.prescription.methodId,weight:x.context.actual.weight,reps:x.context.actual.reps,rpe:x.context.actual.actualRpe}))),protocols:{}},
   nextSetSuggestion:live,methodStage:p.setRole,scopeLabel:r.scope,
   reasonCodes:[r.reasonCode],series:null,calibration:{samples:0,applied:false,factor:1},repetitionGoal:r.suggestedReps,
   allowedWeightRange:Array.isArray(r.rawTargetLoad)?{min:E.fromModel(r.rawTargetLoad[0],c),max:E.fromModel(r.rawTargetLoad[1],c)}:null,
   calculatedWeight:r.suggestedWeight,weeklyCalculated:false,planPreserved:false,conflict:r.effortAction==='review'?r.reasonText:null,
   equipmentId:String(c.equipment.id||e.equipmentProfileId||''),equipmentName:String(c.equipment.name||''),profileWarnings:r.warnings,
   exerciseKind:c.profile.movementKind==='isolation'?'isolation':'base',basis:evidence[0]?{date:new Date(evidence[0].performedAt).toISOString().slice(0,10),weight:last}:null};
 }
 return {context,decision,recommend,legacyAction};
});
