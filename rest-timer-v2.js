'use strict';
(()=>{
  if(window.__unvrslRestTimerV2)return;window.__unvrslRestTimerV2=true;
  const KEY='unvrsl-rest-timer-end',LABEL_KEY='unvrsl-rest-timer-label';
  let id=null,end=Number(sessionStorage.getItem(KEY)||0),currentLabel=sessionStorage.getItem(LABEL_KEY)||'Отдых между подходами';

  const style=document.createElement('style');
  style.id='unvrsl-rest-timer-v2-style';
  style.textContent=`
    #timer.timer{left:16px!important;right:16px!important;bottom:calc(118px + env(safe-area-inset-bottom))!important;z-index:96!important;background:rgba(31,32,36,.98)!important;border:1px solid #3a3c42!important;border-radius:22px!important;padding:13px 14px!important;box-shadow:0 16px 50px rgba(0,0,0,.62),0 0 0 1px rgba(10,132,255,.08) inset!important;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
    #timer.timer.show{display:flex!important}
    #timer .rest-v2-main{display:flex;align-items:center;gap:11px;min-width:0}
    #timer .rest-v2-icon{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:rgba(10,132,255,.16);color:#2997ff;font-size:21px;flex:0 0 auto}
    #timer #tt{font-size:28px!important;line-height:1;font-variant-numeric:tabular-nums;color:#fff}
    #timer .rest-v2-label{font-size:12px;color:#9a9ba2;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:48vw}
    #timer .rest-v2-actions{display:flex;align-items:center;gap:7px}
    #timer .rest-v2-actions .btn{padding:9px 11px!important;border-radius:13px!important;white-space:nowrap}
    #timer .rest-v2-actions .rest-v2-minus{display:none}
    #start .rest-v2-live{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;padding:10px 12px;border-radius:15px;background:rgba(10,132,255,.10);border:1px solid rgba(10,132,255,.28)}
    #start .rest-v2-live b{font-variant-numeric:tabular-nums;color:#2997ff}
    #start .rest-v2-live.work{background:rgba(10,132,255,.13);border-color:rgba(10,132,255,.42)}
    @media(max-width:390px){#timer.timer{bottom:calc(112px + env(safe-area-inset-bottom))!important;padding:11px 12px!important}#timer #tt{font-size:25px!important}#timer .rest-v2-actions .btn{padding:8px 9px!important;font-size:12px!important}#timer .rest-v2-label{max-width:42vw}}
    @media(min-width:760px){#timer.timer{max-width:728px!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important;width:calc(100% - 32px)!important}}
  `;
  document.head.appendChild(style);

  function timerEl(){return document.getElementById('timer')}
  function isWork(){return /^Работа\b/i.test(currentLabel)}
  function secondsLeft(){return Math.max(0,Math.ceil((end-Date.now())/1000))}
  function text(sec){const m=Math.floor(sec/60),s=sec%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
  function updateLabel(el){const lab=el?.querySelector('.rest-v2-label');if(lab)lab.textContent=currentLabel||'Отдых между подходами';const icon=el?.querySelector('.rest-v2-icon');if(icon)icon.textContent=isWork()?'▶':'⏱'}
  function build(){
    const el=timerEl();if(!el)return null;
    if(!el.dataset.restV2){
      el.dataset.restV2='1';
      el.innerHTML='<div class="rest-v2-main"><div class="rest-v2-icon">⏱</div><div><div class="rest-v2-label">Отдых между подходами</div><b id="tt">00:00</b></div></div><div class="rest-v2-actions"><button class="btn tiny rest-v2-minus" type="button">−30</button><button class="btn tiny" type="button" data-rest-plus>+30</button><button class="btn tiny danger" type="button" data-rest-stop>Стоп</button></div>';
      el.querySelector('[data-rest-plus]')?.addEventListener('click',()=>add(30));
      el.querySelector('[data-rest-stop]')?.addEventListener('click',stop);
    }
    updateLabel(el);return el;
  }
  function headLive(sec){
    const head=document.querySelector('#start .workout-head');if(!head)return;
    let row=head.querySelector('.rest-v2-live');
    if(sec<=0){row?.remove();return}
    if(!row){row=document.createElement('div');row.className='rest-v2-live';row.innerHTML='<span data-rest-live-label>⏱ Отдых</span><b data-rest-live>00:00</b>';head.appendChild(row)}
    row.classList.toggle('work',isWork());
    const label=row.querySelector('[data-rest-live-label]');if(label)label.textContent=`${isWork()?'▶':'⏱'} ${currentLabel}`;
    const b=row.querySelector('[data-rest-live]');if(b)b.textContent=text(sec);
  }
  function done(){
    const work=isWork();stop(false);
    try{if(typeof beep==='function')beep()}catch(e){}
    try{if(navigator.vibrate)navigator.vibrate([120,70,120])}catch(e){}
    try{if(typeof toast==='function')toast(work?'Рабочий интервал закончен':'Отдых закончен')}catch(e){}
  }
  function tickV2(){
    const sec=secondsLeft(),el=build();
    if(!el)return;
    updateLabel(el);
    const out=el.querySelector('#tt');if(out)out.textContent=text(sec);
    headLive(sec);
    if(sec<=0&&end>0)done();
  }
  function start(sec,label){
    sec=Math.round(Number(sec)||0);if(sec<=0)return;
    currentLabel=String(label||'Отдых между подходами');
    if(id)clearInterval(id);
    end=Date.now()+sec*1000;sessionStorage.setItem(KEY,String(end));sessionStorage.setItem(LABEL_KEY,currentLabel);
    const el=build();el?.classList.add('show');
    tickV2();id=setInterval(tickV2,250);
  }
  function add(sec){
    if(!end||secondsLeft()<=0)return start(sec,currentLabel);
    end+=sec*1000;sessionStorage.setItem(KEY,String(end));tickV2();
  }
  function stop(clear=true){
    if(id)clearInterval(id);id=null;
    end=0;sessionStorage.removeItem(KEY);sessionStorage.removeItem(LABEL_KEY);
    build()?.classList.remove('show');headLive(0);currentLabel='Отдых между подходами';
  }

  window.timer=start;window.add30=()=>add(30);window.stopTimer=stop;
  try{timer=start;add30=window.add30;stopTimer=stop}catch(e){}

  function restore(){
    currentLabel=sessionStorage.getItem(LABEL_KEY)||currentLabel||'Отдых между подходами';build();
    end=Number(sessionStorage.getItem(KEY)||end||0);
    if(end>Date.now()){
      build()?.classList.add('show');
      if(id)clearInterval(id);id=setInterval(tickV2,250);tickV2();
    }else{end=0;sessionStorage.removeItem(KEY);sessionStorage.removeItem(LABEL_KEY);build()?.classList.remove('show');headLive(0);currentLabel='Отдых между подходами'}
  }
  const oldStartPage=window.startPage;
  if(typeof oldStartPage==='function'&&!oldStartPage.__restTimerV2){
    const wrapped=function(){const r=oldStartPage.apply(this,arguments);requestAnimationFrame(()=>{if(end>Date.now())tickV2()});return r};
    wrapped.__restTimerV2=true;window.startPage=wrapped;try{startPage=wrapped}catch(e){}
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)restore()});
  window.addEventListener('focus',restore);
  setTimeout(restore,0);
})();