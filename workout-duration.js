'use strict';
let unvrslDurationTimer=null;

function unvrslDurationText(ms){
  const total=Math.max(0,Math.floor((Number(ms)||0)/1000));
  const h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
  const pad=n=>String(n).padStart(2,'0');
  return h>0?`${h}:${pad(m)}:${pad(s)}`:`${pad(m)}:${pad(s)}`;
}

function unvrslWorkoutDuration(session){
  if(!session?.started)return 0;
  const end=session.ended||Date.now();
  return Math.max(0,end-session.started);
}

function unvrslRenderWorkoutDuration(){
  const session=typeof st==='object'?st.current:null;
  if(!session)return;
  const head=document.querySelector('#start .workout-head');
  if(!head)return;
  let row=head.querySelector('.workout-duration-row');
  if(!row){
    row=document.createElement('div');
    row.className='workout-duration-row';
    row.style.cssText='display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:11px;border-top:1px solid #343438';
    row.innerHTML='<span class="muted small">⏱ Длительность тренировки</span><b id="workoutDuration" style="font-size:20px;font-variant-numeric:tabular-nums">00:00</b>';
    head.appendChild(row);
  }
  const el=row.querySelector('#workoutDuration');
  if(el)el.textContent=unvrslDurationText(unvrslWorkoutDuration(session));
}

function unvrslStartDurationTimer(){
  if(unvrslDurationTimer)clearInterval(unvrslDurationTimer);
  unvrslRenderWorkoutDuration();
  unvrslDurationTimer=setInterval(unvrslRenderWorkoutDuration,1000);
}

const _durationStartPage=window.startPage;
if(typeof _durationStartPage==='function')window.startPage=function(){
  const r=_durationStartPage.apply(this,arguments);
  setTimeout(unvrslRenderWorkoutDuration,0);
  return r;
};

const _durationSummary=window.summary;
if(typeof _durationSummary==='function')window.summary=function(session){
  const r=_durationSummary.apply(this,arguments);
  setTimeout(()=>{
    if(!session?.started)return;
    const sheet=document.querySelector('#sheet');if(!sheet||sheet.querySelector('.workout-duration-summary'))return;
    const box=document.createElement('div');
    box.className='card workout-duration-summary';
    box.style.marginTop='14px';
    box.innerHTML=`<div class="row between"><span class="muted">Длительность</span><b style="font-size:22px;font-variant-numeric:tabular-nums">${unvrslDurationText(unvrslWorkoutDuration(session))}</b></div>`;
    const section=sheet.querySelector('.section');
    if(section)sheet.insertBefore(box,section);else sheet.appendChild(box);
  },0);
  return r;
};

document.addEventListener('visibilitychange',()=>{if(!document.hidden)unvrslRenderWorkoutDuration()});
window.addEventListener('focus',unvrslRenderWorkoutDuration);
unvrslStartDurationTimer();

// Rest timer UI is kept separate so the workout-duration clock and the
// between-set countdown cannot hide or overwrite each other.
if(!document.querySelector('script[data-unvrsl-rest-timer-v2]')){
  const s=document.createElement('script');
  s.src='rest-timer-v2.js';
  s.async=false;
  s.dataset.unvrslRestTimerV2='1';
  s.onerror=()=>console.warn('rest timer v2 failed to load');
  document.body.appendChild(s);
}
