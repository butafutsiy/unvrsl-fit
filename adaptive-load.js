'use strict';
// Compatibility entry point. All calculations belong to Recommendation Engine 3.
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./recommendation-engine'):root.UNVRSLRecommendationEngine);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.UNVRSLLoadAdjustment=api;})(typeof window==='undefined'?globalThis:window,E=>{
 function adjust(input={}){
  const accounting={per_dumbbell:'per_implement',machine_stack:'stack_display'}[input.loadType]||input.loadType;
  const exercise={n:input.exerciseName,exerciseId:input.exerciseId,loadedSides:input.loadedSides,implementWeight:input.implementWeight};
  const resolved=E.resolveExerciseProfile(exercise);
  const profile=input.profile||{...resolved,...(accounting&&resolved.family!=='F00'?{loadAccounting:accounting}: {})};
  const c=E.normalizeRecommendationInput({exercise,profile,scope:'LIVE',
   actual:{w:input.weight,r:input.actualReps,actualRir:input.actualRir,actualRpe:input.actualRpe,status:'completed',
    painFlag:input.pain,technique:input.techniqueFailed?'invalid':input.technique||'unknown',rom:input.fullROM===false||input.partial||input.incomplete?'unplanned_partial':'unknown',
    warmup:input.warmup,effortUncertain:input.effortUncertain,effortUpperCensored:input.effortCensored},
   session:{bodyWeight:input.bodyWeight},equipment:{step:input.step,available:input.available,min:input.min,max:input.max,loadedSides:input.loadedSides,implementWeight:input.implementWeight},
   prescription:{repMin:E.num(input.targetRepMin),repMax:E.num(input.targetRepMax)??E.num(input.targetRepMin),targetRirMin:E.num(input.targetRirMin),targetRirMax:E.num(input.targetRirMax)??E.num(input.targetRirMin),plannedDeload:input.deload,methodId:'STANDARD',allowLoadIncrease:true}});
  const r=E.recommendNextSet(c),action={harder:'up',easier:'down',hold:'hold',review:'hold',stop:'stop',calibrate:'hold'}[r.effortAction];
  return {...r,action,weight:r.suggestedWeight,reason:r.reasonText,version:3,category:profile.family,blockedByStep:r.blockedByEquipment};
 }
 return {adjust,category:input=>E.resolveExerciseProfile({n:input.exerciseName,exerciseId:input.exerciseId}).family,version:3};
});
