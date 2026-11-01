'use strict';
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else if(root)root.UNVRSLFocusCardio=api;
})(typeof window==='undefined'?null:window,function(){
 const num=x=>{if(x==null||String(x).trim()==='')return null;const v=Number(String(x).replace(',','.'));return Number.isFinite(v)?v:null;};
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const seconds=x=>Math.max(0,Math.round(num(x)||0));
 const clock=x=>{const n=seconds(x),h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;};
 const cardio=(e,type)=>{
  if(e?.kind==='cardio'||e?.mode==='cardio'||e?.bp==='cardio'||e?.cardioMachineId||e?.cardioMachine)return true;
  if(!['time','distance'].includes(type))return false;
  return /аэробайк|air.?bike|велотренаж|бегов.*дорож|эллипти|степпер|лестниц|stairmaster|ski.?erg|гребн.*тренаж|сайкл|кардио|аэробик/i.test(String(e?.n||''));
 };
 const duration=(e,set)=>{
  const c=e?.cardio||{},interval=c.mode==='interval';
  if(interval){const rounds=clamp(Math.round(num(c.rounds)||1),1,100),work=seconds(c.workSeconds||60),rest=seconds(c.restSeconds||0);return rounds*work+(rounds-1)*rest;}
  return seconds(set?.workSeconds??set?.seconds??e?.workSeconds??e?.durationSec??(num(set?.min)!=null?num(set.min)*60:null)??(num(c.durationMin)!=null?num(c.durationMin)*60:null));
 };
 const key=row=>`${row.ei}:${row.si}`;
 function elapsed(item,now=Date.now()){if(!item)return 0;return seconds(((num(item.elapsedMs)||0)+(item.status==='running'?Math.max(0,now-(num(item.startedAt)||now)):0))/1000);}
 function snapshot(item,target,now=Date.now()){
   const actual=elapsed(item,now),goal=seconds(target),remaining=Math.max(0,goal-actual),completed=goal>0&&actual>=goal;
   return {actual,remaining,completed,progress:goal>0?clamp(actual/goal,0,1):0,status:completed?'finished':item?.status||'idle'};
 }
 function command(item,action,now=Date.now()){
   const v={status:item?.status||'idle',startedAt:item?.startedAt||null,elapsedMs:Math.max(0,num(item?.elapsedMs)||0)};
   if(action==='reset')return {status:'idle',startedAt:null,elapsedMs:0};
   if(action==='start'||action==='resume'){if(v.status==='running')return v;return {...v,status:'running',startedAt:now};}
   if(action==='pause'&&v.status==='running')return {...v,status:'paused',elapsedMs:v.elapsedMs+Math.max(0,now-v.startedAt),startedAt:null};
   if(action==='finish')return {...v,status:'finished',elapsedMs:v.elapsedMs+(v.status==='running'?Math.max(0,now-v.startedAt):0),startedAt:null};
   return v;
 }
 function intervalPhase(data,elapsedSec){
   if(data?.mode!=='interval')return null;
   const rounds=clamp(Math.round(num(data.rounds)||1),1,100),work=Math.max(1,seconds(data.workSeconds||60)),rest=seconds(data.restSeconds||0),spent=Math.max(0,elapsedSec);
   for(let i=1,t=0;i<=rounds;i++){
     if(spent<t+work)return {round:i,rounds,phase:'work',remaining:t+work-spent};
     t+=work;
     if(i<rounds&&spent<t+rest)return {round:i,rounds,phase:'rest',remaining:t+rest-spent};
     if(i<rounds)t+=rest;
   }
   return {round:rounds,rounds,phase:'finished',remaining:0};
 }
 return Object.freeze({num,seconds,clock,cardio,duration,key,elapsed,snapshot,command,intervalPhase});
});
