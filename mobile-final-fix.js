'use strict';
(()=>{
  if(window.__unvrslMobileFinalFix)return;window.__unvrslMobileFinalFix=true;

  const s=document.createElement('style');s.id='unvrsl-mobile-final-fix';s.textContent=`
    /* iPhone bottom bar: safe area stays outside the bar instead of making the bar huge */
    body{padding-bottom:92px!important}
    .nav{left:8px!important;right:8px!important;bottom:calc(env(safe-area-inset-bottom) + 5px)!important;height:64px!important;min-height:64px!important;padding:7px 4px 5px!important;border-radius:20px!important;align-items:center!important}
    .nav button{height:48px!important;min-height:48px!important;padding:2px 0 0!important;align-self:center!important;justify-content:center!important}
    .nav button::after{height:9px!important;line-height:9px!important;margin-top:2px!important;font-size:8.5px!important}
    .nav .ico{height:20px!important;margin:0 auto 2px!important}
    .nav .ico svg{width:20px!important;height:20px!important}
    .nav .start .ico{width:46px!important;height:46px!important;margin:-24px auto 2px!important;box-shadow:0 0 0 5px rgba(13,14,16,.97),0 7px 20px color-mix(in srgb,var(--green),transparent 70%)!important}
    .nav .start .ico svg{width:23px!important;height:23px!important}

    /* Streak action: remove the old square glyph */
    #home .streak>button{font-size:0!important;width:38px!important;height:38px!important;min-width:38px!important;padding:0!important;border-radius:50%!important;background:#25262a!important;border:1px solid #34363b!important;display:grid!important;place-items:center!important;color:var(--green)!important}
    #home .streak>button::before{content:'›';font-size:28px!important;line-height:1!important;font-weight:500!important;transform:translateY(-1px)}

    /* Clients: keep the tab switch visible and compact */
    #clients .client-tabs{display:grid!important;grid-template-columns:1fr 1fr!important;margin:9px 0 10px!important}
    #clients .client-tabs button{display:block!important;min-height:38px!important}
    #clients #onlineClientsPane,#clients #offlineClientsPane{min-width:0!important;width:100%!important}
    #clients>.card:first-child{padding-bottom:15px!important}

    @media(max-width:430px){
      .nav{left:7px!important;right:7px!important;height:62px!important;min-height:62px!important;padding-top:6px!important;padding-bottom:4px!important}
      .nav button{height:46px!important;min-height:46px!important}
      .nav .start .ico{width:44px!important;height:44px!important;margin-top:-23px!important}
    }
  `;document.head.appendChild(s);

  function uniqueDailyWeights(){
    const map=new Map();
    for(const p of (st?.bw||[]))if(p&&p.d&&Number.isFinite(Number(p.w)))map.set(String(p.d),p);
    return [...map.values()].sort((a,b)=>String(a.d).localeCompare(String(b.d))).slice(-8);
  }
  function localDate(v){try{return typeof parseDate==='function'?parseDate(v):new Date(v+'T12:00:00')}catch(e){return new Date(v+'T12:00:00')}}
  function cleanWeightChart(homeMode){
    const a=uniqueDailyWeights();
    if(a.length<2)return `<div class="muted" style="margin-top:10px;font-size:12px">${homeMode?'Добавь ещё одну запись в другой день, чтобы появился график.':'Добавь минимум две записи в разные дни.'}</div>`;
    const vals=a.map(x=>Number(x.w)),mn=Math.min(...vals),mx=Math.max(...vals),pad=Math.max(1,(mx-mn)*.22);
    let bottom=Math.floor((mn-pad)*2)/2,top=Math.ceil((mx+pad)*2)/2;if(top-bottom<3)top=bottom+3;
    const mid=(top+bottom)/2,W=360,H=132,L=8,R=30,T=9,B=24,pw=W-L-R,ph=H-T-B;
    const x=i=>L+i*pw/(a.length-1),y=v=>T+(top-v)/(top-bottom)*ph,base=T+ph;
    const pts=a.map((p,i)=>`${x(i).toFixed(1)},${y(Number(p.w)).toFixed(1)}`).join(' '),gid=homeMode?'cwHomeFinal':'cwStatsFinal';
    const idx=a.length<=4?a.map((_,i)=>i):[0,Math.round((a.length-1)/3),Math.round((a.length-1)*2/3),a.length-1];
    const dates=[...new Set(idx)].map(i=>{const d=localDate(a[i].d),lab=`${d.getDate()} ${new Intl.DateTimeFormat('ru-RU',{month:'short'}).format(d).replace('.','')}`;return `<text class="cw-date" x="${x(i)}" y="${H-4}" text-anchor="${i===0?'start':i===a.length-1?'end':'middle'}">${lab}</text>`}).join('');
    const grid=[top,mid,bottom].map(v=>`<line class="cw-grid" x1="${L}" x2="${W-R+4}" y1="${y(v)}" y2="${y(v)}"/><text class="cw-axis" x="${W-1}" y="${y(v)+3}" text-anchor="end">${v.toFixed(v%1?1:0)}</text>`).join('');
    return `<svg class="compact-weight-chart" viewBox="0 0 ${W} ${H}" aria-label="График веса"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--green)" stop-opacity=".24"/><stop offset="1" stop-color="var(--green)" stop-opacity="0"/></linearGradient></defs>${grid}<polygon points="${x(0)},${base} ${pts} ${x(a.length-1)},${base}" fill="url(#${gid})"/><polyline class="cw-line" points="${pts}"/>${a.map((p,i)=>`<circle class="cw-dot" cx="${x(i)}" cy="${y(Number(p.w))}" r="3.4"/>`).join('')}${dates}</svg>`;
  }
  window.weightChart=cleanWeightChart;try{weightChart=cleanWeightChart}catch(e){}

  function saveWeightDaily(){
    const el=document.querySelector('#weightInput'),v=Number(String(el?.value||'').replace(',','.'));if(!v||v<20||v>400)return toast('Проверь вес');
    const d=typeof iso==='function'?iso():new Date().toISOString().slice(0,10),item={d,w:v,t:Date.now()},arr=Array.isArray(st.bw)?st.bw:(st.bw=[]);
    const indexes=[];arr.forEach((p,i)=>{if(p?.d===d)indexes.push(i)});
    if(indexes.length){arr[indexes[indexes.length-1]]=item;for(let i=indexes.length-2;i>=0;i--)arr.splice(indexes[i],1)}else arr.push(item);
    save();closeModal();render();toast('Вес сохранён');
  }
  window.saveWeight=saveWeightDaily;try{saveWeight=saveWeightDaily}catch(e){}

  function ensureClientPanes(){
    if(typeof trainerIsTrainer!=='function'||!trainerIsTrainer())return;
    const el=document.querySelector('#clients');if(!el)return;
    if(el.querySelector('.client-tabs'))return;
    const metrics=el.querySelector('#clientMetrics'),list=el.querySelector('#clientList');if(!metrics||!list)return;
    const plans=[...el.children].find(x=>x.tagName==='BUTTON'&&/отправленные планы/i.test(x.textContent||''));
    const tabs=document.createElement('div');tabs.className='client-tabs';tabs.innerHTML='<button class="on" data-tab="online" onclick="offlineSwitchTab(\'online\')">Онлайн</button><button data-tab="offline" onclick="offlineSwitchTab(\'offline\')">Офлайн</button>';
    metrics.before(tabs);
    const online=document.createElement('div');online.id='onlineClientsPane';tabs.after(online);online.append(metrics,list);if(plans)online.append(plans);
    const offline=document.createElement('div');offline.id='offlineClientsPane';online.after(offline);offline.style.display='none';
    const head=el.querySelector(':scope > .card .muted');if(head)head.textContent='Онлайн и офлайн клиенты · планы, занятия и прогресс';
  }
  function scheduleClientPanes(){[0,120,450,1000].forEach(t=>setTimeout(ensureClientPanes,t))}
  function patchClients(){
    const cp=window.clientsPage;
    if(typeof cp==='function'&&!cp.__finalPanes){const wrapped=async function(){const r=await cp.apply(this,arguments);ensureClientPanes();return r};wrapped.__finalPanes=true;window.clientsPage=wrapped;try{clientsPage=wrapped}catch(e){}}
    const nv=window.nav;
    if(typeof nv==='function'&&!nv.__finalPanes){const wrappedNav=function(p){const r=nv.apply(this,arguments);if(p==='clients')scheduleClientPanes();return r};wrappedNav.__finalPanes=true;window.nav=wrappedNav;try{nav=wrappedNav}catch(e){}}
    scheduleClientPanes();
  }
  [0,250,900,2200].forEach(t=>setTimeout(patchClients,t));
})();
