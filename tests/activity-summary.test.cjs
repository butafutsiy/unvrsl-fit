'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../activity-summary.js');
const workout=(id,date,extra={})=>({id,date,ended:1,ex:[{set:[{ok:true,w:80,r:10}]}],...extra});
const rows=(dates)=>dates.map((date,i)=>workout('w'+i,date));
test('calendar week, month, year and daily heatmap count completed workouts',()=>{
 const dates=[1,3,5,7,9,11,12,14,19,21,24].map(d=>`2026-10-${String(d).padStart(2,'0')}`).concat([1,3,5,7,9,11,13,15,17].map(d=>`2026-09-${String(d).padStart(2,'0')}`),Array.from({length:12},(_,i)=>`2026-01-${String(i+1).padStart(2,'0')}`));
 const summary=A.summarize(A.completedWorkouts(rows(dates)),new Date(2026,9,24));
 assert.equal(summary.week.count,3);assert.equal(summary.week.previous,2);assert.equal(summary.week.delta,1);
 assert.equal(summary.month.count,11);assert.equal(summary.month.previous,9);assert.equal(summary.month.delta,2);assert.equal(summary.yearCount,32);
 assert.equal(summary.days.find(x=>x.date==='2026-10-24').count,1);
 assert.equal(new Date(summary.days[0].date+'T12:00').getDay(),1);
});
test('local corrections override duplicate cloud records, deletions and active drafts stay excluded',()=>{
 const cloud=[workout('a','2026-10-20'),workout('deleted','2026-10-21'),workout('active','2026-10-22')];
 const local=[workout('a','2026-10-19'),workout('b','2026-10-19'),workout('draft','2026-10-20',{ended:null}),workout('empty','2026-10-20',{ex:[]}),workout('cancelled','2026-10-20',{status:'cancelled'}),workout('pending','2026-10-20',{pendingCompletion:true}),workout('foreign','2026-10-20',{userId:'bob'})];
 const actual=A.completedWorkouts(local,cloud,{ownerId:'alice',deletedIds:['deleted'],currentId:'active'});
 assert.deepEqual(actual,[{id:'a',date:'2026-10-19',duration:0},{id:'b',date:'2026-10-19',duration:0}]);
 const summary=A.summarize(actual,new Date(2026,9,24));assert.equal(summary.days.find(d=>d.date==='2026-10-19').count,2);
 assert.equal(A.completedWorkouts([workout('a','2026-10-19',{ended:null})],cloud).some(x=>x.id==='a'),false);
});
test('completed conditioning counts; missing dates and unfinished conditioning do not',()=>{
 const conditioning=status=>({ex:[],conditioning:[{status,result:{rounds:3}}]});
 const actual=A.completedWorkouts([workout('cardio','2026-10-20',conditioning('completed')),workout('unfinished','2026-10-20',conditioning('pending')),workout('undated','bad-date')]);
 assert.deepEqual(actual,[{id:'cardio',date:'2026-10-20',duration:0}]);
});
test('shorter previous month compares equal prefixes while retaining full current month count',()=>{
 const actual=A.summarize(rows(['2026-02-01','2026-02-28','2026-03-01','2026-03-28','2026-03-30']),new Date(2026,2,31));
 assert.equal(actual.month.count,3);assert.equal(actual.month.compared,2);assert.equal(actual.month.previous,2);assert.equal(actual.month.delta,0);assert.equal(actual.month.comparedDays,28);assert.equal(actual.month.shorterPreviousMonth,true);
});
test('calendar boundary, leap day, future dates and deduplication',()=>{
 const s=A.summarize(rows(['2025-12-29','2025-12-30','2025-12-31','2026-01-01','2026-01-02']),new Date(2026,0,1));assert.equal(s.week.count,4);assert.equal(s.yearCount,1);assert.equal(s.month.count,1);
 assert.equal(A.key(A.calendarDate('2024-02-29')), '2024-02-29');assert.equal(A.calendarDate('2026-02-29'),null);
 assert.equal(A.summarize([{id:'one',date:'2026-01-01'},{id:'one',date:'2026-01-01'}],new Date(2026,0,1)).yearCount,1);
 assert.equal(A.summarize([],new Date(2026,0,1)).yearCount,0);
});
test('legacy records are deduplicated without merging different sessions on the same day',()=>{
 const one=workout(undefined,'2026-10-20',{name:'One'}),two=workout(undefined,'2026-10-20',{name:'Two'});
 assert.equal(A.completedWorkouts([one,two],[one]).length,2);
});
test('local date keys and Russian plurals',()=>{
 assert.equal(A.key(new Date(2026,9,24,0,1)),'2026-10-24');
 assert.deepEqual([0,1,2,5,11,21,22,111].map(A.workoutWord),['тренировок','тренировка','тренировки','тренировок','тренировок','тренировка','тренировки','тренировок']);
});
test('activity date and current-day boundaries follow the local timezone',()=>{
 const {execFileSync}=require('node:child_process');
 const script=`const A=require('./activity-summary.js');const now=new Date('2026-10-24T00:30:00Z');console.log(JSON.stringify({key:A.key(now),total:A.summarize([{id:'today',date:'2026-10-24'}],now).yearCount}));`;
 const run=TZ=>JSON.parse(execFileSync(process.execPath,['-e',script],{cwd:require('node:path').resolve(__dirname,'..'),env:{...process.env,TZ},encoding:'utf8'}));
 assert.deepEqual(run('America/Los_Angeles'),{key:'2026-10-23',total:0});
 assert.deepEqual(run('Pacific/Kiritimati'),{key:'2026-10-24',total:1});
});

test('duration heatmap sums minutes per day while counters remain workout counts',()=>{
 const start=Date.parse('2026-10-20T09:00:00Z'),finished=(id,date,minutes)=>workout(id,date,{started:start,ended:start+minutes*60000});
 const records=A.completedWorkouts([finished('one','2026-10-20',45),finished('two','2026-10-20',30),finished('three','2026-10-21',120)]);
 const summary=A.summarize(records,new Date(2026,9,24));assert.equal(summary.week.count,3);
 const day=summary.days.find(x=>x.date==='2026-10-20');assert.equal(day.count,2);assert.equal(day.minutes,75);
 assert.equal(summary.days.find(x=>x.date==='2026-10-21').minutes,120);
 assert.equal(A.durationMinutes({ended:1}),0);assert.equal(A.durationMinutes({started:start,ended:start-1000}),0);
});

test('two workouts including yesterday Friday occupy one Monday–Sunday column',()=>{
 const now=new Date(2026,9,24),data=rows(['2026-10-12','2026-10-15','2026-10-18','2026-10-20','2026-10-23']);
 const summary=A.summarize(data,now),week=summary.weeks.at(-1);
 assert.equal(summary.week.count,2);assert.equal(summary.week.previous,3);assert.equal(summary.week.delta,-1);
 assert.equal(week.from,'2026-10-19');assert.equal(week.until,'2026-10-25');assert.equal(week.current,true);
 assert.deepEqual(week.days.map(d=>d.count),[0,1,0,0,1,0,0]);assert.equal(week.days[6].future,true);
 for(const w of summary.weeks){assert.equal(w.days.length,7);w.days.forEach((day,i)=>assert.equal(new Date(day.date+'T12:00').getDay(),(i+1)%7))}
 assert.equal(summary.weeks.filter(w=>w.current).length,1);
});
test('whole previous week includes Sunday and details explain each counted date',()=>{
 const dates=[1,3,4,5,6,7,8,12,15,18,20,23].map(d=>`2026-10-${String(d).padStart(2,'0')}`).concat([1,3,5,7,9,11,13,15,17,19,21,23,27].map(d=>`2026-09-${String(d).padStart(2,'0')}`),[1,2,3,4,5,6].map(d=>`2026-08-0${d}`));
 const records=rows(dates),now=new Date(2026,9,24),summary=A.summarize(records,now);
 assert.deepEqual([summary.week.count,summary.week.previous,summary.month.count,summary.month.previous,summary.yearCount],[2,3,12,12,31]);
 const detail=A.periodDetails(records,'week',now);assert.deepEqual(detail.current.days,[{date:'2026-10-23',count:1},{date:'2026-10-20',count:1}]);
 assert.deepEqual(detail.previous.days,[{date:'2026-10-18',count:1},{date:'2026-10-15',count:1},{date:'2026-10-12',count:1}]);assert.equal(detail.previous.until,'2026-10-18');assert.equal(detail.delta,-1);
 const month=A.periodDetails(records,'month',now);assert.equal(month.previous.until,'2026-09-24');assert.equal(month.previous.count,12);assert.ok(!month.previous.days.some(d=>d.date==='2026-09-27'));
 for(const kind of ['week','month','year']){const d=A.periodDetails(records,kind,now);assert.equal(d.current.count,d.current.days.reduce((sum,x)=>sum+x.count,0));assert.equal(d.current.count,kind==='year'?summary.yearCount:summary[kind].count)}
});
test('empty legacy IDs do not merge different workouts, exact duplicate backups still count once',()=>{
 const one=workout('','2026-10-20'),two=workout('','2026-10-23');
 const records=A.completedWorkouts([one,two],[one]);assert.equal(records.length,2);assert.notEqual(records[0].id,records[1].id);
 assert.equal(A.summarize(records,new Date(2026,9,24)).week.count,2);
});
test('short-month details separate current total from the equal-length comparison',()=>{
 const report=A.periodDetails(rows(['2026-02-01','2026-02-28','2026-03-01','2026-03-28','2026-03-30']),'month',new Date(2026,2,31));
 assert.equal(report.current.count,3);assert.equal(report.current.until,'2026-03-31');assert.equal(report.compared.count,2);assert.equal(report.compared.until,'2026-03-28');assert.equal(report.previous.count,2);assert.equal(report.delta,0);
});
test('calendar boundaries match an independent UTC day-number oracle',()=>{
 const dates=[];for(let t=Date.UTC(2023,11,1),end=Date.UTC(2028,1,1),i=0;t<end;t+=86400000,i++)if(i%3===0||i%7===0)dates.push(new Date(t).toISOString().slice(0,10));
 const records=dates.map((date,i)=>({id:String(i),date}));
 for(const year of [2024,2025,2026,2027])for(let month=0;month<12;month++)for(const day of [1,15,new Date(year,month+1,0).getDate()]){
  const timestamp=Date.UTC(year,month,day),weekday=(new Date(timestamp).getUTCDay()+6)%7,weekStart=timestamp-weekday*86400000,prevMonthStart=Date.UTC(year,month-1,1),daysCompared=Math.min(day,new Date(Date.UTC(year,month,0)).getUTCDate());
  const count=(a,b)=>dates.filter(date=>{const t=Date.parse(date+'T00:00:00Z');return t>=a&&t<=b}).length;
  const actual=A.summarize(records,new Date(year,month,day));
  assert.equal(actual.week.count,count(weekStart,timestamp));assert.equal(actual.week.previous,count(weekStart-7*86400000,weekStart-86400000));
  assert.equal(actual.month.count,count(Date.UTC(year,month,1),timestamp));assert.equal(actual.month.previous,count(prevMonthStart,Date.UTC(year,month-1,daysCompared)));
  assert.equal(actual.month.delta,count(Date.UTC(year,month,1),Date.UTC(year,month,daysCompared))-actual.month.previous);assert.equal(actual.yearCount,count(Date.UTC(year,0,1),timestamp));
 }
});
