'use strict';
let unvrslWakeLock=null;
let unvrslWakeBusy=false;

if(typeof st==='object'&&st.keepAwake===undefined){st.keepAwake=true;try{save()}catch(e){}}

function unvrslWorkoutNeedsWake(){return !!(typeof st==='object'&&st.current&&st.keepAwake!==false)}
function unvrslWakeSupported(){return 'wakeLock' in navigator}

async function unvrslAcquireWakeLock(){
  if(unvrslWakeBusy||unvrslWakeLock||!unvrslWorkoutNeedsWake()||document.visibilityState!=='visible'||!unvrslWakeSupported())return;
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
  if(!unvrslWakeSupported())return 'Недоступно на этом устройстве';
  if(st.keepAwake===false)return 'Обычное отключение экрана';
  return unvrslWakeLock?'Экран не выключится':'Включится во время тренировки';
}

window.toggleKeepAwake=function(){
  if(!unvrslWakeSupported())return toast('Устройство не поддерживает удержание экрана');
  st.keepAwake=st.keepAwake===false;save();unvrslSyncWakeLock();
  toast(st.keepAwake?'Экран не будет выключаться во время тренировки':'Автоблокировка экрана снова разрешена')
};

// Настройку не показываем в интерфейсе. Во время тренировки удержание экрана работает автоматически.
function unvrslInjectWakeSetting(){return}

const _wakeBegin=window.begin;
if(typeof _wakeBegin==='function')window.begin=function(){const r=_wakeBegin.apply(this,arguments);setTimeout(unvrslSyncWakeLock,0);return r};
const _wakeFinish=window.finish;
if(typeof _wakeFinish==='function')window.finish=function(){const r=_wakeFinish.apply(this,arguments);setTimeout(unvrslSyncWakeLock,0);return r};
const _wakeCancel=window.cancelWorkout;
if(typeof _wakeCancel==='function')window.cancelWorkout=function(){const r=_wakeCancel.apply(this,arguments);setTimeout(unvrslSyncWakeLock,0);return r};

document.addEventListener('visibilitychange',unvrslSyncWakeLock);
document.addEventListener('pointerdown',()=>{if(unvrslWorkoutNeedsWake())unvrslAcquireWakeLock()},{passive:true});
window.addEventListener('focus',unvrslSyncWakeLock);
setInterval(unvrslSyncWakeLock,5000);
setTimeout(unvrslSyncWakeLock,250);
