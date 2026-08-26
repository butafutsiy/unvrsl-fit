'use strict';
(()=>{
  if(window.__unvrslHomeDashboardLoaded)return;window.__unvrslHomeDashboardLoaded=true;

  const style=document.createElement('style');
  style.textContent=`
  /* Home dashboard inspired by the approved UNVRSL mockup */
  #home .dash-weight-card{padding:24px 24px 18px;overflow:hidden}
  #home .dash-weight-card .weight-top{align-items:flex-start}
  #home .dash-weight-card .weight-top>.weight-actions{padding-top:0}
  #home .dash-weight-card .weight-label{font-size:15px;text-transform:uppercase;letter-spacing:.055em;color:#a1a1a7}
  #home .dash-weight-card .big{font-size:58px;font-weight:880;letter-spacing:-2.6px;margin-top:7px;line-height:.98}
  #home .dash-weight-card .big .muted{font-size:23px!important;font-weight:650;letter-spacing:-.5px}
  #home .dash-weight-card .weight-actions{display:flex;gap:10px}
  #home .dash-weight-card .weight-actions button{min-height:43px;padding:9px 13px;border-radius:15px;border:1px solid #38383d;background:rgba(44,44,47,.72);color:var(--green);font-size:15px;font-weight:690;box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}
  #home .dash-weight-card .weight-actions button:first-child{border-color:color-mix(in srgb,var(--green),transparent 34%);background:color-mix(in srgb,var(--green),transparent 92%)}
  .dash-weight-svg{display:block;width:100%;height:auto;margin:18px 0 0;overflow:visible}
  .dash-grid{stroke:#3b3b40;stroke-width:1;stroke-dasharray:3 5;opacity:.7}.dash-axis{fill:#8e8e93;font-size:11px}.dash-date{fill:#8e8e93;font-size:10.5px}.dash-line{fill:none;stroke:var(--green);stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}.dash-dot{fill:#d7ebff;stroke:var(--green);stroke-width:2.4}

  #home .streak.dash-streak{min-height:116px;padding:20px 22px;gap:18px}
  #home .dash-streak .fire{width:70px;height:70px;flex:0 0 70px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#232326,#171719);border:1px solid #38383d;font-size:36px;box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}
  #home .dash-streak b{font-size:25px;text-transform:none;letter-spacing:-.6px}
  #home .dash-streak .streak-meta{font-size:16px;line-height:1.35;margin-top:4px;max-width:330px}
  #home .dash-streak .dash-ring{width:70px;height:70px;flex:0 0 70px;display:grid;place-items:center;border-radius:50%;padding:0;position:relative;background:conic-gradient(var(--green) var(--dash-p),#2c2c30 0);box-shadow:0 0 20px color-mix(in srgb,var(--green),transparent 82%)}
  #home .dash-streak .dash-ring:before{content:'';position:absolute;inset:7px;border-radius:50%;background:#1b1b1e;border:1px solid #3a3a3f}
  #home .dash-streak .dash-ring svg{position:relative;z-index:1;width:28px;height:28px;stroke:#f4f4f5;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}

  #home .next-workout-card.dash-next{position:relative;min-height:260px;padding:28px 26px;overflow:hidden;display:flex;align-items:stretch;background:radial-gradient(circle at 88% 54%,color-mix(in srgb,var(--green),transparent 90%),transparent 32%),linear-gradient(145deg,#1d1d1f,#19191b)}
  #home .dash-next-main{position:relative;z-index:2;width:64%;display:flex;flex-direction:column;align-items:flex-start}
  #home .dash-next-kicker{font-size:14px;line-height:1.15;color:var(--green);text-transform:uppercase;letter-spacing:.045em;margin-bottom:15px}
  #home .dash-next-title{font-size:29px;line-height:1.13;font-weight:860;letter-spacing:-1.05px;color:#f5f5f7}
  #home .dash-next-date{display:flex;align-items:center;gap:9px;color:#9a9aa0;font-size:17px;margin-top:14px}
  #home .dash-next-date svg{width:19px;height:19px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  #home .dash-next .btn.primary{margin-top:auto;min-width:230px;display:flex;align-items:center;justify-content:center;gap:18px;border-radius:18px;font-size:18px;min-height:57px;color:#fff;background:linear-gradient(180deg,color-mix(in srgb,var(--green),white 9%),var(--green));box-shadow:0 9px 28px color-mix(in srgb,var(--green),transparent 70%)}
  #home .dash-next .btn.primary .dash-arrow{font-size:28px;font-weight:350;line-height:1;margin-top:-2px}
  #home .dash-muscle-visual{position:absolute;z-index:1;right:6px;top:15px;bottom:8px;width:36%;display:grid;place-items:center;opacity:.98;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:17px 17px;mask-image:linear-gradient(90deg,transparent 0,#000 34%)}
  #home .dash-muscle-visual svg{width:100%;height:100%;max-height:240px;filter:drop-shadow(0 6px 13px rgba(0,0,0,.55))}
  #home .dash-muscle-base{fill:#242428;stroke:#333338;stroke-width:1}.dash-muscle-hi{fill:var(--green);stroke:color-mix(in srgb,var(--green),white 35%);stroke-width:.8;filter:drop-shadow(0 0 6px color-mix(in srgb,var(--green),transparent 55%))}

  @media(max-width:430px){
    #home .dash-weight-card{padding:20px 19px 15px}#home .dash-weight-card .big{font-size:54px}#home .dash-weight-card .weight-actions{gap:7px}#home .dash-weight-card .weight-actions button{font-size:14px;padding:8px 10px}
    #home .dash-streak{padding:18px!important;gap:13px!important}#home .dash-streak .fire,#home .dash-streak .dash-ring{width:60px;height:60px;flex-basis:60px}#home .dash-streak b{font-size:22px}#home .dash-streak .streak-meta{font-size:14.5px}
    #home .next-workout-card.dash-next{min-height:235px;padding:23px 20px}#home .dash-next-main{width:69%}#home .dash-next-title{font-size:25px}#home .dash-next-kicker{font-size:12px;margin-bottom:11px}#home .dash-next-date{font-size:15px;margin-top:10px}#home .dash-next .btn.primary{min-width:0;width:100%;min-height:52px;font-size:17px}#home .dash-muscle-visual{width:36%;right:-2px}
  }
  `;
  document.head.appendChild(style);

  function niceWeightChart(homeMode){
    const a=(st?.bw||[]).slice(-20);
    if(a.length<2)return `<div class="muted" style="margin-top:18px">${homeMode?'Добавь ещё одну запись, чтобы появился график.':'Добавь минимум две записи.'}</div>`;
    const vals=a.map(x=>+x.w).filter(Number.isFinite);if(vals.length<2)return '';
    const mn=Math.min(...vals),mx=Math.max(...vals);
    let top=Math.ceil((mx+1)/5)*5,bottom=Math.floor((mn-1)/5)*5;
    if(top-bottom<10){const mid=(top+bottom)/2;top=Math.ceil((mid+5)/5)*5;bottom=top-10}
    const mid=(top+bottom)/2,W=360,H=190,L=9,R=32,T=14,B=29,plotW=W-L-R,plotH=H-T-B;
    const x=i=>L+(a.length===1?0:i*plotW/(a.length-1));
    const y=v=>T+(top-v)/(top-bottom)*plotH;
    const pts=a.map((p,i)=>`${x(i).toFixed(1)},${y(+p.w).toFixed(1)}`).join(' ');
    const poly=`${x(0).toFixed(1)},${(T+plotH).toFixed(1)} ${pts} ${x(a.length-1).toFixed(1)},${(T+plotH).toFixed(1)}`;
    const gid=homeMode?'dashWeightHome':'dashWeightStats';
    const idx=a.length<=4?a.map((_,i)=>i):[0,Math.round((a.length-1)/3),Math.round((a.length-1)*2/3),a.length-1];
    const dates=[...new Set(idx)].map(i=>{const d=parseDate(a[i].d);return `<text class="dash-date" x="${x(i)}" y="${H-5}" text-anchor="${i===0?'start':i===a.length-1?'end':'middle'}">${d.getDate()} ${new Intl.DateTimeFormat('ru-RU',{month:'short'}).format(d).replace('.','')}</text>`}).join('');
    return `<svg class="dash-weight-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="График веса"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--green)" stop-opacity=".28"/><stop offset="1" stop-color="var(--green)" stop-opacity="0"/></linearGradient></defs>${[top,mid,bottom].map(v=>`<line class="dash-grid" x1="${L}" x2="${W-R+5}" y1="${y(v)}" y2="${y(v)}"/><text class="dash-axis" x="${W-2}" y="${y(v)+4}" text-anchor="end">${Number.isInteger(v)?v:v.toFixed(1)}</text>`).join('')}<polygon points="${poly}" fill="url(#${gid})"/><polyline class="dash-line" points="${pts}"/>${a.map((p,i)=>`<circle class="dash-dot" cx="${x(i)}" cy="${y(+p.w)}" r="4"/>`).join('')}${dates}</svg>`
  }

  function cap(s){s=String(s||'');return s?s[0].toUpperCase()+s.slice(1):s}
  function calIcon(){return '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>'}
  function checkIcon(){return '<svg viewBox="0 0 24 24"><path d="m5 12 4 4 10-10"/></svg>'}

  function muscleFigure(text){
    const q=String(text||'').toLowerCase();
    const quad=/квадрицеп|разгибан.*ног|жим ног|присед|выпад/.test(q),add=/привод|adduct/.test(q),calf=/икр|calf/.test(q),ham=/бицепс бедра|задн.*бед|румын|сгибан.*ног/.test(q),glute=/ягод|glute|мост/.test(q);
    const chest=/груд|жим лёжа|кроссовер|развод/.test(q),back=/спин|тяга|подтяг/.test(q),shoulder=/плеч|дельт|армей/.test(q),bi=/бицепс|сгибан.*рук/.test(q),tri=/трицепс|разгибан.*рук/.test(q);
    const lower=quad||add||calf||ham||glute;
    if(lower){return `<svg viewBox="0 0 120 220" aria-hidden="true"><path class="dash-muscle-base" d="M36 8c9 0 17 7 18 19l3 55-7 58-6 65H27l-3-64-5-57 3-58C23 15 28 8 36 8Z"/><path class="dash-muscle-base" d="M84 8c-9 0-17 7-18 19l-3 55 7 58 6 65h17l3-64 5-57-3-58C97 15 92 8 84 8Z"/>${quad?'<path class="dash-muscle-hi" d="M29 25c8-9 18-6 21 5l2 49-10 42-12-5-6-40 2-42Z"/><path class="dash-muscle-hi" d="M91 25c-8-9-18-6-21 5l-2 49 10 42 12-5 6-40-2-42Z"/>':''}${add?'<path class="dash-muscle-hi" d="M48 35 56 46 52 98 42 112l3-46Z"/><path class="dash-muscle-hi" d="M72 35 64 46 68 98 78 112l-3-46Z"/>':''}${ham?'<path class="dash-muscle-hi" d="M25 41c8-6 17-3 21 7l2 51-11 20-12-12-3-50Z"/><path class="dash-muscle-hi" d="M95 41c-8-6-17-3-21 7l-2 51 11 20 12-12 3-50Z"/>':''}${calf?'<path class="dash-muscle-hi" d="M29 128c7-7 15-4 18 6l-4 54-10 11-5-50Z"/><path class="dash-muscle-hi" d="M91 128c-7-7-15-4-18 6l4 54 10 11 5-50Z"/>':''}${glute?'<path class="dash-muscle-hi" d="M24 12c7-7 24-6 29 5l-2 22-15 8-13-11Z"/><path class="dash-muscle-hi" d="M96 12c-7-7-24-6-29 5l2 22 15 8 13-11Z"/>':''}</svg>`}
    return `<svg viewBox="0 0 140 220" aria-hidden="true"><circle class="dash-muscle-base" cx="70" cy="24" r="16"/><path class="dash-muscle-base" d="M49 45c12-7 30-7 42 0l14 55-12 51-8 51H55l-8-51-12-51Z"/><path class="dash-muscle-base" d="m46 55-21 22-10 66 13 5 20-55M94 55l21 22 10 66-13 5-20-55"/>${chest?'<path class="dash-muscle-hi" d="M51 57c7-8 16-8 19 0v29H46l2-20Z"/><path class="dash-muscle-hi" d="M89 57c-7-8-16-8-19 0v29h24l-2-20Z"/>':''}${back?'<path class="dash-muscle-hi" d="M48 62c8-9 17-10 22-2v65l-21-17-6-34Z"/><path class="dash-muscle-hi" d="M92 62c-8-9-17-10-22-2v65l21-17 6-34Z"/>':''}${shoulder?'<circle class="dash-muscle-hi" cx="44" cy="58" r="10"/><circle class="dash-muscle-hi" cx="96" cy="58" r="10"/>':''}${bi?'<path class="dash-muscle-hi" d="M31 78c8-5 13 1 12 12l-7 30-11-3 3-27Z"/><path class="dash-muscle-hi" d="M109 78c-8-5-13 1-12 12l7 30 11-3-3-27Z"/>':''}${tri?'<path class="dash-muscle-hi" d="M39 82c6 2 7 10 4 19l-9 24-9-6 5-27Z"/><path class="dash-muscle-hi" d="M101 82c-6 2-7 10-4 19l9 24 9-6-5-27Z"/>':''}</svg>`
  }

  function decorateHome(){
    const root=document.getElementById('home');if(!root)return;
    const weight=root.querySelector('.weight-top')?.closest('.card');
    if(weight){weight.classList.add('dash-weight-card');const label=weight.querySelector('.weight-top .muted');if(label)label.classList.add('weight-label')}
    const streak=root.querySelector('.streak');
    if(streak){streak.classList.add('dash-streak');const b=streak.querySelector('b');if(b)b.textContent=cap(b.textContent);const btn=streak.querySelector('button:last-child');if(btn&&!btn.classList.contains('dash-ring')){const planned=Math.max(1,typeof plannedCountThisWeek==='function'?plannedCountThisWeek():1),m=getMonday(new Date()),to=new Date(m);to.setDate(m.getDate()+7);const weekDone=(st.sessions||[]).filter(s=>{const d=parseDate(s.date);return d>=m&&d<to}).length,p=Math.max(0,Math.min(1,weekDone/planned));btn.className='dash-ring';btn.style.setProperty('--dash-p',`${Math.round(p*360)}deg`);btn.innerHTML=checkIcon();btn.setAttribute('aria-label','Открыть план')}}
    const cards=[...root.querySelectorAll(':scope > .card')],next=cards.find(c=>/Ближайшая тренировка/i.test(c.textContent||''));
    if(next&&!next.classList.contains('dash-next')){const nx=typeof nextPlan==='function'?nextPlan():null;if(nx){next.classList.add('next-workout-card','dash-next');const title=`${nx.r.c} · ${nx.r.t}`,date=cap(fmt(nx.d));next.innerHTML=`<div class="dash-next-main"><div class="dash-next-kicker">Ближайшая тренировка</div><div class="dash-next-title">${esc(title)}</div><div class="dash-next-date">${calIcon()}<span>${esc(date)}</span></div><button class="btn primary" onclick="preview(${nx.r.w},'${nx.r.c}')"><span>Посмотреть</span><span class="dash-arrow">→</span></button></div><div class="dash-muscle-visual">${muscleFigure(title)}</div>`}}
  }

  const originalWeight=window.weightChart;
  if(typeof originalWeight==='function'){window.weightChart=niceWeightChart;try{weightChart=niceWeightChart}catch(e){}}

  function installHomeWrap(){
    const cur=window.home;if(typeof cur!=='function'||cur.__dashHome)return;
    const base=cur;const wrapped=function(){const r=base.apply(this,arguments);try{decorateHome()}catch(e){console.warn('dashboard home',e)}return r};wrapped.__dashHome=true;wrapped.__dashBase=base;window.home=wrapped;try{home=wrapped}catch(e){}
    try{if(document.getElementById('home')?.classList.contains('active'))wrapped()}catch(e){}
  }
  installHomeWrap();
  let tries=0;const boot=setInterval(()=>{installHomeWrap();if(++tries>16)clearInterval(boot)},500);
  const obs=new MutationObserver(()=>decorateHome());obs.observe(document.getElementById('home')||document.body,{subtree:true,childList:true});
  setTimeout(()=>decorateHome(),30);
})();
