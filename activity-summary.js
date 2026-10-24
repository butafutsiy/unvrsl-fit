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
 function durationMinutes(s){
  const start=new Date(s.started??s.startedAt).getTime(),end=new Date(s.ended??s.completedAt??s.finishedAt).getTime();
  return start>0&&end>start?Math.max(1,Math.round((end-start)/60000)):0;
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
   map.set(identity,{session:s,id:id==null||!String(id)?identity:String(id),date});
  }
  return [...map.values()].filter(x=>x.date&&completed(x.session)).map(x=>({id:x.id,date:x.date,duration:durationMinutes(x.session)}));
 }
 function uniqueRecords(records,until){
  const unique=new Map();
  for(const record of records){const date=calendarDate(record?.date);if(!date)continue;const normalized=key(date);if(normalized<=until)unique.set(String(record.id??normalized),{...record,date:normalized})}
  return [...unique.values()];
 }
 function summarize(records=[],now=new Date()){
  const today=new Date(now);today.setHours(12,0,0,0);if(!Number.isFinite(today.getTime()))throw Error('Invalid activity date');
  const until=key(today),weekStart=new Date(today),weekday=(today.getDay()+6)%7;weekStart.setDate(today.getDate()-weekday);
  const weekEnd=new Date(weekStart);weekEnd.setDate(weekEnd.getDate()+6);
  const previousWeek=new Date(weekStart);previousWeek.setDate(previousWeek.getDate()-7);
  const previousWeekEnd=new Date(previousWeek);previousWeekEnd.setDate(previousWeekEnd.getDate()+6);
  const monthStart=new Date(today.getFullYear(),today.getMonth(),1,12),previousMonth=new Date(today.getFullYear(),today.getMonth()-1,1,12);
  const previousMonthDays=new Date(today.getFullYear(),today.getMonth(),0,12).getDate(),comparedDays=Math.min(today.getDate(),previousMonthDays);
  const monthEnd=new Date(today.getFullYear(),today.getMonth(),comparedDays,12),previousMonthEnd=new Date(previousMonth.getFullYear(),previousMonth.getMonth(),comparedDays,12);
  const workouts=uniqueRecords(records,until),count=(start,end)=>workouts.filter(x=>x.date>=key(start)&&x.date<=key(end)).length;
  const weekCount=count(weekStart,weekEnd),previousWeekCount=count(previousWeek,previousWeekEnd),monthCount=count(monthStart,today),monthCompared=count(monthStart,monthEnd),previousMonthCount=count(previousMonth,previousMonthEnd);
  const start=new Date(today);start.setDate(start.getDate()-364);start.setDate(start.getDate()-(start.getDay()+6)%7);
  const byDate=new Map(),minutes=new Map();for(const w of workouts){byDate.set(w.date,(byDate.get(w.date)||0)+1);minutes.set(w.date,(minutes.get(w.date)||0)+Math.max(0,Number(w.duration)||0))}
  const days=[];for(let d=new Date(start);d<=today;d.setDate(d.getDate()+1))days.push({date:key(d),count:byDate.get(key(d))||0,minutes:minutes.get(key(d))||0});
  const weeks=[];for(let i=0;i<days.length;i+=7){
   const monday=calendarDate(days[i].date),weekDays=Array.from({length:7},(_,n)=>{const date=new Date(monday);date.setDate(date.getDate()+n);return days[i+n]||{date:key(date),count:0,minutes:0,future:true}});
   weeks.push({from:weekDays[0].date,until:weekDays[6].date,current:weekDays[0].date===key(weekStart),days:weekDays});
  }
  return{today:until,year:today.getFullYear(),yearCount:count(new Date(today.getFullYear(),0,1,12),today),week:{count:weekCount,previous:previousWeekCount,delta:weekCount-previousWeekCount,from:key(weekStart),until:key(weekEnd),previousFrom:key(previousWeek),previousUntil:key(previousWeekEnd)},month:{count:monthCount,previous:previousMonthCount,compared:monthCompared,delta:monthCompared-previousMonthCount,comparedDays,shorterPreviousMonth:comparedDays<today.getDate(),from:key(monthStart),until,comparedUntil:key(monthEnd),previousFrom:key(previousMonth),previousUntil:key(previousMonthEnd)},days,weeks};
 }
 function periodDetails(records=[],kind='week',now=new Date()){
  if(!['week','month','year'].includes(kind))throw Error('Invalid activity period');
  const summary=summarize(records,now),all=uniqueRecords(records,summary.today);
  function section(from,until){
   const days=new Map();for(const row of all)if(row.date>=from&&row.date<=until)days.set(row.date,(days.get(row.date)||0)+1);
   const entries=[...days].sort((a,b)=>b[0].localeCompare(a[0])).map(([date,count])=>({date,count}));
   return{from,until,count:entries.reduce((sum,x)=>sum+x.count,0),days:entries};
  }
  const period=summary[kind],current=section(kind==='year'?`${summary.year}-01-01`:period.from,kind==='week'?period.until:summary.today);
  const previous=kind==='year'?null:section(period.previousFrom,period.previousUntil);
  const compared=kind==='month'&&period.shorterPreviousMonth?section(period.from,period.comparedUntil):current;
  return{kind,summary,current,previous,compared,delta:previous?compared.count-previous.count:null};
 }
 function workoutWord(n){const a=Math.abs(n)%100,b=a%10;return a>=11&&a<=14?'тренировок':b===1?'тренировка':b>=2&&b<=4?'тренировки':'тренировок'}
 return{key,calendarDate,durationMinutes,completedWorkouts,summarize,periodDetails,workoutWord};
});
