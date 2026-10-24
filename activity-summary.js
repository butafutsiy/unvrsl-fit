'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.UNVRSLActivity=api})(typeof window==='undefined'?null:window,()=>{
 const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 function calendarDate(value){
  const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/);if(!match)return null;
  const date=new Date(+match[1],+match[2]-1,+match[3],12);
  return date.getFullYear()===+match[1]&&date.getMonth()===+match[2]-1&&date.getDate()===+match[3]?date:null;
 }
 function workoutDate(s){
  const explicit=calendarDate(s.date||s.workout_date);if(explicit)return key(explicit);
  for(const value of [s.started,s.startedAt,s.ended,s.completedAt,s.finishedAt])if(value){const d=new Date(value);if(Number.isFinite(d.getTime())&&d.getFullYear()>=2000)return key(d)}
  return null;
 }
 const completedSet=s=>s?.ok===true||s?.completed===true||s?.done===true||s?.isCompleted===true||s?.status==='completed';
 function completed(s){
  if(!s||s.pendingCompletion||['cancelled','canceled','discarded'].includes(s.status)||!(s.ended||s.completedAt||s.finishedAt||s.status==='completed'))return false;
  return (s.ex||s.exercises||[]).some(e=>(e.set||e.sets||[]).some(completedSet))||(s.conditioning||[]).some(b=>b.status==='completed'&&b.result);
 }
 function completedWorkouts(local=[],remote=[],{ownerId=null,deletedIds=[],currentId=null}={}){
  const deleted=new Set(deletedIds.map(String)),map=new Map();
  for(const s of [...remote,...local]){
   if(!s||ownerId&&s.userId&&String(s.userId)!==String(ownerId))continue;
   const id=s.id??s.external_id,date=workoutDate(s);
   if(id!=null&&(deleted.has(String(id))||currentId!=null&&String(id)===String(currentId)))continue;
   const identity=id!=null&&String(id)?'id:'+String(id):'legacy:'+JSON.stringify([date,s.started||s.startedAt||null,s.ended||s.completedAt||null,s.name||s.c||'',s.ex||s.exercises||[],s.conditioning||[]]);
   // The local copy can contain an offline date edit or an unfinished correction.
   // Reconcile identities before checking completion to avoid reviving the cloud copy.
   map.set(identity,{session:s,id:id==null?identity:String(id),date});
  }
  return [...map.values()].filter(x=>x.date&&completed(x.session)).map(x=>({id:x.id,date:x.date}));
 }
 function summarize(records=[],now=new Date()){
  const today=new Date(now);today.setHours(12,0,0,0);if(!Number.isFinite(today.getTime()))throw Error('Invalid activity date');
  const until=key(today),weekStart=new Date(today),weekday=(today.getDay()+6)%7;weekStart.setDate(today.getDate()-weekday);
  const previousWeek=new Date(weekStart);previousWeek.setDate(previousWeek.getDate()-7);
  const previousWeekEnd=new Date(previousWeek);previousWeekEnd.setDate(previousWeekEnd.getDate()+weekday);
  const monthStart=new Date(today.getFullYear(),today.getMonth(),1,12),previousMonth=new Date(today.getFullYear(),today.getMonth()-1,1,12);
  const previousMonthDays=new Date(today.getFullYear(),today.getMonth(),0,12).getDate(),comparedDays=Math.min(today.getDate(),previousMonthDays);
  const monthEnd=new Date(today.getFullYear(),today.getMonth(),comparedDays,12),previousMonthEnd=new Date(previousMonth.getFullYear(),previousMonth.getMonth(),comparedDays,12);
  const unique=new Map();for(const record of records)if(record?.date&&record.date<=until)unique.set(String(record.id??record.date),record);
  const workouts=[...unique.values()],count=(start,end)=>workouts.filter(x=>x.date>=key(start)&&x.date<=key(end)).length;
  const weekCount=count(weekStart,today),previousWeekCount=count(previousWeek,previousWeekEnd),monthCount=count(monthStart,today),monthCompared=count(monthStart,monthEnd),previousMonthCount=count(previousMonth,previousMonthEnd);
  const start=new Date(today);start.setDate(start.getDate()-364);start.setDate(start.getDate()-(start.getDay()+6)%7);
  const byDate=new Map();for(const w of workouts)byDate.set(w.date,(byDate.get(w.date)||0)+1);
  const days=[];for(let d=new Date(start);d<=today;d.setDate(d.getDate()+1))days.push({date:key(d),count:byDate.get(key(d))||0});
  return{today:until,year:today.getFullYear(),yearCount:count(new Date(today.getFullYear(),0,1,12),today),week:{count:weekCount,previous:previousWeekCount,delta:weekCount-previousWeekCount,from:key(weekStart),previousFrom:key(previousWeek),previousUntil:key(previousWeekEnd)},month:{count:monthCount,previous:previousMonthCount,compared:monthCompared,delta:monthCompared-previousMonthCount,comparedDays,shorterPreviousMonth:comparedDays<today.getDate(),from:key(monthStart),until:key(monthEnd),previousFrom:key(previousMonth),previousUntil:key(previousMonthEnd)},days};
 }
 function workoutWord(n){const a=Math.abs(n)%100,b=a%10;return a>=11&&a<=14?'тренировок':b===1?'тренировка':b>=2&&b<=4?'тренировки':'тренировок'}
 return{key,calendarDate,completedWorkouts,summarize,workoutWord};
});
