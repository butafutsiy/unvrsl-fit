'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ConditioningClock=api})(typeof window!=='undefined'?window:globalThis,()=>{
 const TYPES={AMRAP:'AMRAP',EMOM:'EMOM',HIIT:'HIIT',FORTIME:'На время'};
 const integer=(v,min,max,label)=>{const n=Number(v);if(!Number.isInteger(n)||n<min||n>max)throw Error('Проверь '+label);return n};
 function normalize(raw){
  if(!raw||!Object.hasOwn(TYPES,raw.type))throw Error('Выбери формат блока');
  const stations=(raw.stations||[]).map(s=>({name:String(s.name||'').trim().slice(0,100),target:String(s.target||'').trim().slice(0,80)}));
  if(!stations.length||stations.length>20||stations.some(s=>!s.name||!s.target))throw Error('Укажи упражнения и задания для каждой станции');
  const duration=integer(raw.duration??600,30,7200,'длительность (30–7200 сек)'),interval=integer(raw.interval??60,10,600,'интервал (10–600 сек)'),work=integer(raw.work??30,5,600,'время работы'),rest=integer(raw.rest??15,0,600,'отдых'),rounds=integer(raw.rounds??4,1,100,'число кругов');
  const total=raw.type==='HIIT'?(work+rest)*stations.length*rounds:duration;if(total>7200)throw Error('Блок не должен превышать 120 минут');
  return{id:String(raw.id||'block').slice(0,100),type:raw.type,title:String(raw.title||TYPES[raw.type]).trim().slice(0,100),duration,interval,work,rest,rounds,total,stations,note:String(raw.note||'').trim().slice(0,500)}
 }
 function elapsed(block,now=Date.now()){return Math.max(0,Number(block.elapsedMs||0)+(block.status==='running'?Math.max(0,now-Number(block.startedAt)):0))}
 function view(block,now=Date.now()){
  const c=normalize(block.config),ms=elapsed(block,now),sec=Math.min(c.total,ms/1000),expired=ms>=c.total*1000;
  let index=0,phase='Работа',remaining=c.total-sec,cycle=0;
  if(c.type==='EMOM'){cycle=Math.floor(sec/c.interval);index=cycle%c.stations.length;remaining=Math.min(c.interval-sec%c.interval,c.total-sec);if(block.workDone?.[cycle])phase='Отдых'}
  if(c.type==='HIIT'){cycle=Math.floor(sec/(c.work+c.rest));index=cycle%c.stations.length;const inCycle=sec%(c.work+c.rest);phase=inCycle<c.work?'Работа':'Отдых';remaining=Math.min((phase==='Работа'?c.work:c.work+c.rest)-inCycle,c.total-sec)}
  if(expired){phase='Время вышло';remaining=0}
  return{elapsed:sec,remaining:Math.max(0,remaining),totalRemaining:Math.max(0,c.total-sec),expired,index,cycle,phase,station:c.stations[index],next:c.stations[(index+1)%c.stations.length],round:Math.floor(cycle/c.stations.length)+1}
 }
 const create=config=>({config:normalize(config),status:'ready',elapsedMs:0,startedAt:null,roundsDone:0,workDone:{},result:null});
 function start(b,now=Date.now()){if(['ready','paused'].includes(b.status)){b.startedAt=now;b.status='running'}return b}
 function pause(b,now=Date.now()){if(b.status==='running'){b.elapsedMs=elapsed(b,now);b.startedAt=null;b.status='paused'}return b}
 function stop(b,now=Date.now()){pause(b,now);b.status='awaiting';return b}
 function score(b,input,now=Date.now()){
  const c=normalize(b.config),e=Math.min(c.total,elapsed(b,now)/1000),rounds=integer(input.rounds??0,0,9999,'выполненные круги'),reps=integer(input.reps??0,0,99999,'дополнительные повторы'),intervals=integer(input.intervals??0,0,10000,'выполненные интервалы');
  if(['AMRAP','FORTIME'].includes(c.type)&&rounds===0&&reps===0)throw Error('Укажи выполненную работу или оставь блок незавершённым');
  const slots=Math.ceil(e/(c.type==='EMOM'?c.interval:c.work+c.rest));if(['EMOM','HIIT'].includes(c.type)&&(intervals===0||intervals>slots))throw Error('Укажи фактически выполненные интервалы (не больше '+slots+')');
  if(c.type==='FORTIME'&&rounds>c.rounds)throw Error('Кругов больше, чем задано в блоке');
  return{type:c.type,elapsedSeconds:Math.floor(e),rounds,reps,intervals,outcome:e>=c.total?'timecap':c.type==='FORTIME'&&rounds===c.rounds?'finished':'stopped'}
 }
 return{TYPES,normalize,elapsed,view,create,start,pause,stop,score};
});
