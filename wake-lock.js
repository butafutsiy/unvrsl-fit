'use strict';
let unvrslWakeLock=null;
let unvrslWakeBusy=false;

if(typeof st==='object'&&st.keepAwake===undefined){st.keepAwake=true;try{save()}catch(e){}}

function unvrslWorkoutNeedsWake(){return !!(typeof st==='object'&&st.current&&st.keepAwake!==false)}

async function unvrslAcquireWakeLock(){
  if(unvrslWakeBusy||unvrslWakeLock||!unvrslWorkoutNeedsWake()||document.visibilityState!=='visible'||!('wakeLock' in navigator))return;
  unvrslWakeBusy=true;
  try{
    unvrslWakeLock=await navigator.wakeLock.request('screen');
    unvrslWakeLock.addEventListener('release',()=>{unvrslWakeLock=null});
  }catch(e){
    unvrslWakeLock=null;
  }finally{unvrslWakeBusy=false}
}

async function unvrslReleaseWakeLock(){
  const lock=unvrslWakeLock;unvrslWakeLock=null;
  if(lock){try{await lock.release()}catch(e){}}
}

function unvrslSyncWakeLock(){
  if(unvrslWorkoutNeedsWake()&&document.visibilityState==='visible')unvrslAcquireWakeLock();
  else unvrslReleaseWakeLock();
}

function unvrslWakeStatus(){
  if(!('wakeLock' in navigator))return 'Недоступно на этом устройстве';
  return unvrslWakeLock?'Экран не выключится':'Включится во время тренировки';
}

const _wakeBegin=window.begin;
if(typeof _wakeBegin==='function')window.begin=function(){const r=_wakeBegin.apply(this,arguments);setTimeout(unvrslSyncWakeLock,0);return r};
const _wakeFinish=window.finish;
if(typeof _wakeFinish==='function')window.finish=function(){const r=_wakeFinish.apply(this,arguments);setTimeout(unvrslSyncWakeLock,0);return r};
const _wakeCancel=window.cancelWorkout;
if(typeof _wakeCancel==='function')window.cancelWorkout=function(){const r=_wakeCancel.apply(this,arguments);setTimeout(unvrslSyncWakeLock,0);return r};

// iOS/browser may release Wake Lock when the app is backgrounded; request it again on return.
document.addEventListener('visibilitychange',unvrslSyncWakeLock);
document.addEventListener('pointerdown',()=>{if(unvrslWorkoutNeedsWake())unvrslAcquireWakeLock()},{passive:true});
window.addEventListener('focus',unvrslSyncWakeLock);
setInterval(unvrslSyncWakeLock,5000);
setTimeout(unvrslSyncWakeLock,250);
