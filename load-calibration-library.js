'use strict';
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.unvrslCalibrationLibrary=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 const limit=100;
 const valid=record=>!!record&&record.isLoadCalibration===true&&
   record.id!=null&&record.calibrationParentId!=null&&
   Array.isArray(record.ex)&&record.ex.some(e=>(e.set||[]).some(s=>
     s?.ok===true&&Number(s.w)>0&&Number(s.actualReps??s.r)>0&&
     (s.actualRir??s.rir)!=null&&String(s.actualRir??s.rir).trim()!==''&&
     Number(s.actualRir??s.rir)>=0&&Number(s.actualRir??s.rir)<=4));
 function owner(state,userId){
   return String(userId||state?.accountOwnerId||state?.cloudUserId||'');
 }
 function stored(state,userId){
   const identity=owner(state,userId);
   return (state?.exerciseLoadCalibrations||[]).filter(s=>
     valid(s)&&(!identity||String(s.userId||'')===identity));
 }
 function record(state,source,userId){
   if(!state||!valid(source))return {ok:false,reason:'invalid'};
   const identity=owner(state,userId)||String(source.userId||'');
   if(!identity)return {ok:false,reason:'owner_missing'};
   const entry={...JSON.parse(JSON.stringify(source)),userId:identity,calibrationSavedAt:Date.now()};
   const previous=Array.isArray(state.exerciseLoadCalibrations)?state.exerciseLoadCalibrations:[];
   const filtered=previous.filter(x=>String(x?.id)!==String(entry.id));
   state.exerciseLoadCalibrations=[...filtered,entry].slice(-limit);
   return {ok:true,id:entry.id,added:filtered.length===previous.length};
 }
 function sessions(state,local=[],current=null,userId=null){
   const identity=owner(state,userId);
   const seen=new Set(),output=[];
   function add(session){
     if(!session||session.id==null)return;
     if(identity&&session.userId&&session.userId!==identity)return;
     if(seen.has(String(session.id)))return;
     seen.add(String(session.id));output.push(session);
   }
   // Completed workouts and nested calibration are owned by the primary history
   // reader; flat saved calibration evidence fills gaps after an abandoned workout.
   for(const row of local||[])add(row);
   for(const row of stored(state,identity))add(row);
   return output;
 }
 function forget(state,id){
   if(!state||!Array.isArray(state.exerciseLoadCalibrations))return false;
   const before=state.exerciseLoadCalibrations.length;
   state.exerciseLoadCalibrations=state.exerciseLoadCalibrations.filter(x=>String(x.id)!==String(id));
   return state.exerciseLoadCalibrations.length!==before;
 }
 return Object.freeze({valid,record,stored,sessions,forget});
});
