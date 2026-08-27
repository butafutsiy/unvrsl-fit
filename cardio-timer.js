'use strict';
(()=>{
  if(window.__unvrslCardioTimer)return;window.__unvrslCardioTimer=true;

  const timers=new Map();
  const style=document.createElement('style');
  style.id='unvrsl-cardio-timer-style';
  style.textContent=`
    .cardio-timer-box{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:12px 0 10px;padding:12px 13px;background:#151a20;border:1px solid rgba(10,132,255,.34);border-radius:16px}
    .cardio-timer-copy{min-width:0}.cardio-timer-label{display:block;color:#8e8e93;font-size:12px;margin-bottom:3px}.cardio-timer-value{display:block;font-size:28px;line-height:1;font-weight:850;font-variant-numeric:tabular-nums;letter-spacing:.02em}
    .cardio-timer-actions{display:flex;gap:7px;flex:0 0 auto}.cardio-timer-actions .btn{min-width:48px;height:44px;padding:0 12px!important;border-radius:13px!important;font-size:18px!important}
    .cardio-timer-box.running{border-color:var(--green);box-shadow:0 0 0 1px color-mix(in srgb,var(--green) 25%,transparent) inset}.cardio-timer-box.done{border-color:#ff9f0a}
  `;
  document.head.appendChild(style);

  function isAerobike(e){return /аэро\s*байк|аэробайк|air\s*bike/i.test(String(e?.n||''))}
  function targetSeconds(e){
    const explicit=Number(e?.timedSeconds||e?.seconds||0);
    if(explicit>0)return Math.round(explicit);
    if(isAerobike(e)){
      const r=Number(e?.set?.[0]?.r||0);
      return r>0&&r<=600?Math.round(r):40;
    }
    return 0;
  }
  function key(ei){return `${st?.current?.id||'none'}:${ei}`}
  function state(ei,e){
    const k=key(ei),target=targetSeconds(e);
    let s=timers.get(k);
    if(!s||s.target!==target){s={target,remaining:target,end:0,running:false,done:false};timers.set(k,s)}
    return s;
  }
  function remain(s){
    if(!s.running)return Math.max(0,Math.ceil(s.remaining));
    return Math.max(0,Math.ceil((s.end-Date.now())/1000));
  }
  function text(sec){sec=Math.max(0,Math.round(sec||0));const m=Math.floor(sec/60),s=sec%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}

  window.cardioTimerToggle=function(ei){
    const e=st?.current?.ex?.[ei];if(!e)return;
    const s=state(ei,e);
    if(s.running){s.remaining=remain(s);s.running=false;s.end=0;updateOne(ei,e);return}
    if(s.remaining<=0)s.remaining=s.target;
    s.end=Date.now()+s.remaining*1000;s.running=true;s.done=false;updateOne(ei,e);
  };
  window.cardioTimerReset=function(ei){
    const e=st?.current?.ex?.[ei];if(!e)return;
    const s=state(ei,e);s.remaining=s.target;s.end=0;s.running=false;s.done=false;updateOne(ei,e)
  };

  function finishTimer(ei,e,s){
    s.running=false;s.remaining=0;s.end=0;s.done=true;
    try{navigator.vibrate?.([120,70,120])}catch(_e){}
    try{if(typeof toast==='function')toast('Аэробайк: время вышло')}catch(_e){}
  }
  function updateOne(ei,e){
    const s=state(ei,e),r=remain(s);
    if(s.running&&r<=0)finishTimer(ei,e,s);
    document.querySelectorAll(`[data-cardio-ei="${ei}"]`).forEach(box=>{
      if(box.dataset.session!==String(st?.current?.id||''))return;
      box.classList.toggle('running',s.running);box.classList.toggle('done',s.done);
      const v=box.querySelector('.cardio-timer-value');if(v)v.textContent=text(remain(s));
      const play=box.querySelector('[data-cardio-play]');if(play)play.textContent=s.running?'Ⅱ':'▶';
    });
  }
  function tick(){
    const cur=st?.current;if(!cur)return;
    (cur.ex||[]).forEach((e,ei)=>{if(targetSeconds(e)>0&&isAerobike(e))updateOne(ei,e)})
  }

  const base=window.exerciseCard;
  if(typeof base==='function'){
    const wrapped=function(s,e,ei){
      let html=base.apply(this,arguments);
      if(!isAerobike(e))return html;
      const seconds=targetSeconds(e);if(!seconds)return html;
      const t=state(ei,e),box=`<div class="cardio-timer-box ${t.running?'running':''} ${t.done?'done':''}" data-cardio-ei="${ei}" data-session="${esc(String(s?.id||''))}"><div class="cardio-timer-copy"><span class="cardio-timer-label">Таймер аэробайка · ${seconds} сек</span><b class="cardio-timer-value">${text(remain(t))}</b></div><div class="cardio-timer-actions"><button type="button" class="btn primary" data-cardio-play onclick="cardioTimerToggle(${ei})">${t.running?'Ⅱ':'▶'}</button><button type="button" class="btn" onclick="cardioTimerReset(${ei})">↺</button></div></div>`;
      if(html.includes('<div class="sethead">'))return html.replace('<div class="sethead">',box+'<div class="sethead">');
      return html+box;
    };
    wrapped.__cardioTimer=true;window.exerciseCard=wrapped;try{exerciseCard=wrapped}catch(e){}
  }

  setInterval(tick,250);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});
})();
