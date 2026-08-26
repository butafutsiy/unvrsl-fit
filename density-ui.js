'use strict';
(()=>{
  if(window.__unvrslDensityUi)return;window.__unvrslDensityUi=true;
  const s=document.createElement('style');s.id='unvrsl-density-ui';s.textContent=`
  /* Compact, stable mobile pass: CSS only, no observers */
  body{padding-bottom:102px!important}
  .topbar{padding:calc(env(safe-area-inset-top) + 13px) 18px 8px!important;min-height:0!important}
  .brand{font-size:34px!important;line-height:1!important;letter-spacing:-1.9px!important}
  .date{font-size:16px!important;margin-top:8px!important;line-height:1.15!important}
  .gear{width:52px!important;height:52px!important;border-radius:17px!important;font-size:22px!important}
  .page{padding-left:15px!important;padding-right:15px!important;padding-bottom:24px!important}
  .card{margin:10px 0!important;padding:16px!important;border-radius:21px!important}
  .title{font-size:21px!important;line-height:1.14!important}
  .section{margin:20px 5px 8px!important}

  /* Home calendar: same information, much less vertical space */
  #home .calendar-card{padding:13px 13px 12px!important}
  #home .calendar-head{padding:0 3px 8px!important}
  #home .calendar-head b{font-size:16px!important}
  #home .calendar-head .arrow{font-size:27px!important;width:34px!important;height:34px!important;padding:0!important}
  #home .weekdays div{font-size:10.5px!important;letter-spacing:.04em!important}
  #home .datecell{height:46px!important;gap:3px!important}
  #home .datecell .num{width:36px!important;height:36px!important;font-size:17px!important}
  #home .datecell .dot{width:5px!important;height:5px!important;margin-top:37px!important}
  #home .today-card{padding:10px 11px!important;margin-top:5px!important;border-radius:17px!important;gap:10px!important}
  #home .today-icon{width:44px!important;height:44px!important;border-radius:14px!important;font-size:22px!important}
  #home .today-main small{font-size:10px!important}
  #home .today-main b{font-size:18px!important;line-height:1.08!important;margin-top:2px!important}
  #home .today-card .plus{font-size:27px!important;width:36px!important;height:42px!important}

  /* Weight card: useful chart instead of oversized decorative V */
  #home .weight-top{gap:9px!important}
  #home .weight-top .big{font-size:46px!important;letter-spacing:-2px!important;margin-top:4px!important}
  #home .weight-actions{gap:6px!important;flex-wrap:nowrap!important}
  #home .weight-actions button{font-size:12px!important;min-height:36px!important;padding:7px 9px!important;border-radius:12px!important;white-space:nowrap!important}
  .compact-weight-chart{display:block!important;width:100%!important;height:auto!important;margin:8px 0 0!important;overflow:visible!important}
  .cw-grid{stroke:#3a3b40;stroke-width:1;stroke-dasharray:3 5;opacity:.7}.cw-axis,.cw-date{fill:#85878e;font-size:10px}.cw-line{fill:none;stroke:var(--green);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.cw-dot{fill:#dfe9f5;stroke:var(--green);stroke-width:2.2}

  /* Streak / next workout */
  #home .streak{padding:14px 15px!important;gap:11px!important}
  #home .streak .fire{font-size:26px!important}
  #home .streak b{font-size:19px!important}
  #home .streak-meta{font-size:12px!important;line-height:1.3!important;margin-top:3px!important}
  #home .streak>button{font-size:22px!important}
  #home>.card:not(.calendar-card):last-child .title{font-size:21px!important}

  /* Clients header: title gets the width; actions become two clean buttons below */
  #clients>.card:first-child>.row.between{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;align-items:stretch!important}
  #clients>.card:first-child>.row.between>div:first-child{grid-column:1/-1!important;min-width:0!important}
  #clients>.card:first-child>.row.between>.btn{width:100%!important;min-width:0!important;min-height:40px!important;padding:8px 10px!important;font-size:13px!important;white-space:nowrap!important;border-radius:13px!important}
  #clients>.card:first-child .muted{font-size:14px!important;line-height:1.3!important;margin-top:3px!important}
  #clients .client-tabs{margin:9px 0 10px!important;padding:3px!important;border-radius:14px!important}
  #clients .client-tabs button{min-height:37px!important;font-size:13px!important;border-radius:11px!important}
  #clients .metrics{gap:7px!important;margin:0!important}
  #clients .metric{padding:11px 12px!important;border-radius:17px!important;min-height:76px!important}
  #clients .metric span{font-size:10px!important;line-height:1.15!important}
  #clients .metric b{font-size:22px!important;margin-top:5px!important}
  #clients .btn.full{min-height:44px!important;border-radius:14px!important;padding:10px 13px!important}
  #clients .section{margin-top:18px!important}
  #clients .offline-client-card,#clients .client-card{padding:14px!important;border-radius:18px!important}

  /* Smaller radii for small UI blocks, large radii only for large cards */
  .metric,.rule-card,.history-row,.listline,.exercise,.settings-card{border-radius:17px!important}
  input,select,textarea,.search{border-radius:13px!important}
  .btn{border-radius:13px!important}

  /* Bottom nav: icons carry navigation; only active tab gets a label. */
  .nav{left:8px!important;right:8px!important;bottom:6px!important;min-height:78px!important;padding:8px 3px calc(7px + env(safe-area-inset-bottom))!important;border-radius:21px!important;align-items:end!important}
  .nav button{font-size:0!important;line-height:1!important;min-width:0!important;padding:4px 0 1px!important;overflow:visible!important;white-space:nowrap!important}
  .nav button::after{display:block;height:10px;margin-top:3px;content:'';font-size:9px;line-height:10px;font-weight:680;letter-spacing:-.18px;color:currentColor}
  .nav button.active::after{content:attr(aria-label)}
  .nav .start::after{content:'Старт'}
  .nav .ico{height:21px!important;margin:0 auto 3px!important}
  .nav .ico svg{width:20px!important;height:20px!important}
  .nav .start .ico{width:50px!important;height:50px!important;margin:-27px auto 4px!important;box-shadow:0 0 0 6px rgba(13,14,16,.96),0 7px 22px color-mix(in srgb,var(--green),transparent 67%)!important}
  .nav .start .ico svg{width:25px!important;height:25px!important}

  @media(max-width:380px){
    .brand{font-size:32px!important}.gear{width:48px!important;height:48px!important}.page{padding-left:12px!important;padding-right:12px!important}
    #home .weight-actions button{font-size:11px!important;padding:7px 7px!important}
    .nav{left:5px!important;right:5px!important}.nav button.active::after,.nav .start::after{font-size:8.5px!important}
  }
  `;document.head.appendChild(s);

  function parseLocalDate(v){try{return typeof parseDate==='function'?parseDate(v):new Date(v+'T12:00:00')}catch(e){return new Date(v+'T12:00:00')}}
  function compactWeightChart(homeMode){
    const a=(st?.bw||[]).slice(-8);if(a.length<2)return `<div class="muted" style="margin-top:10px;font-size:12px">${homeMode?'Добавь ещё одну запись, чтобы появился график.':'Добавь минимум две записи.'}</div>`;
    const vals=a.map(x=>Number(x.w)).filter(Number.isFinite);if(vals.length<2)return'';
    const mn=Math.min(...vals),mx=Math.max(...vals),pad=Math.max(1,(mx-mn)*.22);
    let bottom=Math.floor((mn-pad)*2)/2,top=Math.ceil((mx+pad)*2)/2;if(top-bottom<3)top=bottom+3;
    const mid=(top+bottom)/2,W=360,H=132,L=8,R=30,T=9,B=24,pw=W-L-R,ph=H-T-B;
    const x=i=>L+(a.length===1?0:i*pw/(a.length-1)),y=v=>T+(top-v)/(top-bottom)*ph;
    const pts=a.map((p,i)=>`${x(i).toFixed(1)},${y(Number(p.w)).toFixed(1)}`).join(' '),base=T+ph;
    const gid=homeMode?'cwHome':'cwStats';
    const dateIdx=a.length<=4?a.map((_,i)=>i):[0,Math.round((a.length-1)/3),Math.round((a.length-1)*2/3),a.length-1];
    const dateHtml=[...new Set(dateIdx)].map(i=>{const d=parseLocalDate(a[i].d);const lab=`${d.getDate()} ${new Intl.DateTimeFormat('ru-RU',{month:'short'}).format(d).replace('.','')}`;return `<text class="cw-date" x="${x(i)}" y="${H-4}" text-anchor="${i===0?'start':i===a.length-1?'end':'middle'}">${lab}</text>`}).join('');
    const lines=[top,mid,bottom].map(v=>`<line class="cw-grid" x1="${L}" x2="${W-R+4}" y1="${y(v)}" y2="${y(v)}"/><text class="cw-axis" x="${W-1}" y="${y(v)+3}" text-anchor="end">${v.toFixed(v%1?1:0)}</text>`).join('');
    return `<svg class="compact-weight-chart" viewBox="0 0 ${W} ${H}" aria-label="График веса"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--green)" stop-opacity=".24"/><stop offset="1" stop-color="var(--green)" stop-opacity="0"/></linearGradient></defs>${lines}<polygon points="${x(0)},${base} ${pts} ${x(a.length-1)},${base}" fill="url(#${gid})"/><polyline class="cw-line" points="${pts}"/>${a.map((p,i)=>`<circle class="cw-dot" cx="${x(i)}" cy="${y(Number(p.w))}" r="3.4"/>`).join('')}${dateHtml}</svg>`;
  }
  window.weightChart=compactWeightChart;try{weightChart=compactWeightChart}catch(e){}

  function ensureNavLabels(){document.querySelectorAll('.nav button[data-p]').forEach(b=>{if(!b.getAttribute('aria-label')){const m={home:'Главная',plan:'План',programs:'Программы',start:'Старт',stats:'Статистика',exercises:'Упражнения',clients:'Клиенты'};b.setAttribute('aria-label',m[b.dataset.p]||'')}})}
  ensureNavLabels();
  setTimeout(()=>{ensureNavLabels();try{if(typeof home==='function')home();if(typeof statsPage==='function')statsPage()}catch(e){console.warn('density ui refresh',e)}},80);
})();
