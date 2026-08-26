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
  st.keepAwake=st.keepAwake===false;save();unvrslSyncWakeLock();settingsSheet();
  toast(st.keepAwake?'Экран не будет выключаться во время тренировки':'Автоблокировка экрана снова разрешена')
};

function unvrslInjectWakeSetting(){
  const sh=document.querySelector('#sheet');if(!sh||sh.querySelector('.wake-setting-card'))return;
  const card=document.createElement('div');card.className='settings-card wake-setting-card';
  const supported=unvrslWakeSupported();
  card.innerHTML=`<div class="setting"><div><b>Не выключать экран</b><div class="muted small">${supported?'Во время активной тренировки':'Не поддерживается этим браузером'}</div></div><button class="btn tiny ${supported&&st.keepAwake!==false?'primary':''}" ${supported?'onclick="toggleKeepAwake()"':'disabled'}>${supported?(st.keepAwake!==false?'Вкл':'Выкл'):'—'}</button></div>`;
  const cards=sh.querySelectorAll('.settings-card');
  if(cards.length)cards[cards.length-1].after(card);else sh.appendChild(card)
}

const _wakeSettingsSheet=window.settingsSheet;
if(typeof _wakeSettingsSheet==='function')window.settingsSheet=function(){const r=_wakeSettingsSheet.apply(this,arguments);setTimeout(unvrslInjectWakeSetting,0);return r};

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
