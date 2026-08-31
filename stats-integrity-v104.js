'use strict';
(()=>{
  if(window.__unvrslStatsIntegrityV104)return;
  window.__unvrslStatsIntegrityV104=true;

  const style=document.createElement('style');
  style.id='stats-integrity-v104-style';
  style.textContent=`
    #stats .stats-last-session-v104-wrap{margin-top:4px}
    #stats .stats-last-session-v104-wrap .section{margin-top:20px}
    #stats .stats-last-session-v104{margin-top:10px}
    #stats .stats-last-session-v104 .v104-metric-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    #stats .stats-last-session-v104 .v104-metric{background:#1c1c1f;border:1px solid #292a2f;border-radius:18px;padding:14px;min-width:0}
    #stats .stats-last-session-v104 .v104-metric span{display:block;color:#8e8e93;font-size:12px}
    #stats .stats-last-session-v104 .v104-metric b{display:block;margin-top:6px;font-size:23px;line-height:1.05;font-variant-numeric:tabular-nums}
    #stats .weekly-tonnage-v104{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:12px 0 2px;padding:13px 14px;background:#17171a;border:1px solid #2b2c31;border-radius:16px}
    #stats .weekly-tonnage-v104 span{color:#8e8e93;font-size:13px}
    #stats .weekly-tonnage-v104 b{font-size:20px;font-variant-numeric:tabular-nums}
  `;
  document.head.appendChild(style);

  const arr=x=>Array.isArray(x)?x:[];
  const completedCount=s=>arr(s?.ex).reduce((n,e)=>n+arr(e?.set).filter(x=>x?.ok).length,0);
  const finished=s=>!!s?.ended&&completedCount(s)>0;
  const cardio=e=>/^(cardio|time|timer)$/i.test(String(e?.mode||e?.kind||''))||String(e?.kind||'').toLowerCase()==='cardio';
  const sessionTonnage=s=>Math.round(arr(s?.ex).reduce((sum,e)=>{
    if(cardio(e))return sum;
    return sum+arr(e?.set).reduce((q,x)=>{
      if(!x?.ok)return q;
      const w=Number(x.w),r=Number(x.r);
      return q+(Number.isFinite(w)&&Number.isFinite(r)&&w>0&&r>0?w*r:0);
    },0);
  },0));
  const sessionAvgRpe=s=>{
    const vals=[];
    arr(s?.ex).forEach(e=>arr(e?.set).forEach(x=>{const r=Number(x?.rpe);if(x?.ok&&x?.rpe!==''&&x?.rpe!=null&&Number.isFinite(r)&&r>0)vals.push(r)}));
    return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10:null;
  };
  const sessionDate=s=>String(s?.date||new Date(Number(s?.ended||s?.started||0)).toISOString().slice(0,10));
  const today=()=>typeof iso==='function'?iso():new Date().toISOString().slice(0,10);

  function finishedSessions(){
    let source=[];
    try{source=typeof window.unvrslStatsSessions208==='function'?window.unvrslStatsSessions208():arr(st?.sessions)}catch(e){source=arr(st?.sessions)}
    const deleted=new Set(arr(st?.deletedSessionIds).map(String));
    const out=[],seen=new Set();
    arr(source).forEach(s=>{
      if(!finished(s)||deleted.has(String(s?.id||'')))return;
      const key=String(s?.id||`${sessionDate(s)}:${s?.started||s?.ended||''}`);
      if(seen.has(key))return;seen.add(key);out.push(s);
    });
    return out.sort((a,b)=>Number(a.ended||a.started||0)-Number(b.ended||b.started||0));
  }

  const weekStart=()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-6);return d};
  const last7=()=>finishedSessions().filter(s=>{const d=new Date(sessionDate(s)+'T12:00:00');return Number.isFinite(d.getTime())&&d>=weekStart()});
  const weekTonnage=()=>last7().reduce((a,s)=>a+sessionTonnage(s),0);
  const fmtKg=n=>`${Math.round(Number(n)||0).toLocaleString('ru-RU')} кг`;

  window.advSessionTonnage=sessionTonnage;
  window.advSessionRpe=sessionAvgRpe;
  try{advSessionTonnage=window.advSessionTonnage}catch(e){}
  try{advSessionRpe=window.advSessionRpe}catch(e){}

  function installMuscleFix(){
    if(typeof window.advMuscleFor!=='function'||typeof window.advMuscleMapHtml!=='function')return false;
    if(!window.__unvrslBaseMuscleMapV104)window.__unvrslBaseMuscleMapV104=window.advMuscleMapHtml;
    window.advMuscleVolume=function(days=7){
      const names=Array.isArray(window.ADV_MUSCLES)?window.ADV_MUSCLES:['Грудь','Спина','Плечи','Бицепс','Трицепс','Квадрицепс','Бицепс бедра','Ягодичные','Икры','Кор'];
      const out=Object.fromEntries(names.map(x=>[x,0]));
      const cut=new Date();cut.setHours(0,0,0,0);cut.setDate(cut.getDate()-(Math.max(1,Number(days)||7)-1));
      finishedSessions().forEach(s=>{
        const d=new Date(sessionDate(s)+'T12:00:00');if(!Number.isFinite(d.getTime())||d<cut)return;
        arr(s.ex).forEach(e=>{const m=window.advMuscleFor(e);if(m&&Object.prototype.hasOwnProperty.call(out,m))out[m]+=arr(e.set).filter(x=>x?.ok).length});
      });
      return out;
    };
    try{advMuscleVolume=window.advMuscleVolume}catch(e){}
    if(!window.advMuscleMapHtml.__statsMergedV250){
      const base=window.__unvrslBaseMuscleMapV104;
      const wrapped=function(){
        let html=base.apply(this,arguments);
        const block=`<div class="weekly-tonnage-v104"><span>Недельный тоннаж</span><b>${fmtKg(weekTonnage())}</b></div>`;
        if(!html.includes('weekly-tonnage-v104'))html=html.replace('<div class="muscle-list">',block+'<div class="muscle-list">');
        return html;
      };
      wrapped.__statsMergedV250=true;window.advMuscleMapHtml=wrapped;try{advMuscleMapHtml=wrapped}catch(e){}
    }
    return true;
  }

  function updateMetric(root,label,value){
    [...root.querySelectorAll('.sd2-metric')].forEach(card=>{
      const text=card.querySelector('.sd2-metric-label')?.textContent||'';
      if(text.includes(label)){const b=card.querySelector('b');if(b&&b.textContent!==String(value))b.textContent=String(value)}
    });
  }

  function weekKey(date){const d=new Date(String(date)+'T12:00:00');const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return d.toISOString().slice(0,10)}
  function streak(list){
    const keys=new Set(list.map(s=>weekKey(sessionDate(s)))),d=new Date(),day=(d.getDay()+6)%7;d.setHours(12,0,0,0);d.setDate(d.getDate()-day);let n=0;
    for(let i=0;i<104;i++){const k=d.toISOString().slice(0,10);if(!keys.has(k))break;n++;d.setDate(d.getDate()-7)}return n;
  }

  function lastSessionBlock(){
    const list=finishedSessions(),s=list.at(-1);if(!s)return'';
    const ton=sessionTonnage(s),rpe=sessionAvgRpe(s);
    return `<div class="section">ПОСЛЕДНЯЯ ТРЕНИРОВКА</div><div class="card stats-last-session-v104"><div class="v104-metric-grid"><div class="v104-metric"><span>Тоннаж</span><b>${fmtKg(ton)}</b></div><div class="v104-metric"><span>Средний RPE</span><b>${rpe??'—'}</b></div></div></div>`;
  }

  function patchStatsDom(){
    const root=document.getElementById('stats');if(!root||!root.classList.contains('stats-v2'))return;
    installMuscleFix();
    root.querySelectorAll('.adv-insights-root').forEach(x=>x.remove());

    const list=finishedSessions(),ym=today().slice(0,7);
    updateMetric(root,'Тренировки',list.length);
    updateMetric(root,'Этот месяц',list.filter(s=>sessionDate(s).startsWith(ym)).length);
    updateMetric(root,'Серия недель',streak(list));

    const block=lastSessionBlock();
    let wrap=root.querySelector('.stats-last-session-v104-wrap');
    if(!block){wrap?.remove()}
    else{
      if(!wrap){wrap=document.createElement('div');wrap.className='stats-last-session-v104-wrap'}
      if(wrap.innerHTML!==block)wrap.innerHTML=block;
      const grid=root.querySelector('.sd2-grid');
      if(grid&&wrap.previousElementSibling!==grid)grid.insertAdjacentElement('afterend',wrap);
      else if(!wrap.isConnected)root.appendChild(wrap);
    }

    const muscle=root.querySelector('.stats-muscle-week-card');
    if(muscle&&typeof window.advMuscleMapHtml==='function'){
      const html=window.advMuscleMapHtml();if(muscle.innerHTML!==html)muscle.innerHTML=html;
    }

    if(!list.some(s=>sessionDate(s)===today())){
      root.querySelectorAll(`.sd2-cell[title^="${today()}:"]`).forEach(cell=>{cell.className='sd2-cell';cell.title=`${today()}: нет тренировки`});
    }
  }
  window.statsIntegrityPatch=patchStatsDom;

  function patchHomeDom(){
    const root=document.getElementById('home');if(!root)return;
    const hasToday=finishedSessions().some(s=>sessionDate(s)===today());
    if(!hasToday)root.querySelectorAll('.datecell.today .dot').forEach(x=>x.remove());
  }

  function patchSettingsDom(){
    const modalRoot=document.getElementById('modal');if(!modalRoot)return;
    [...modalRoot.querySelectorAll('.section')].forEach(sec=>{
      if((sec.textContent||'').trim().toUpperCase()==='АККАУНТ'){
        const card=sec.nextElementSibling;if(card?.classList?.contains('settings-card'))card.remove();sec.remove();
      }
    });
  }

  function patchSummaryDom(s){
    const sheet=document.querySelector('#modal .sheet,#modal .modal-sheet,#modal>*');
    if(!sheet||sheet.querySelector('.finish-metrics-v104'))return;
    const box=document.createElement('div');box.className='adv-stat-grid finish-metrics-v104';box.style.margin='14px 0';
    box.innerHTML=`<div class="adv-stat"><span>Тоннаж</span><b>${fmtKg(sessionTonnage(s))}</b></div><div class="adv-stat"><span>Средний RPE</span><b>${sessionAvgRpe(s)??'—'}</b></div>`;
    const section=sheet.querySelector('.section');if(section)section.before(box);else sheet.appendChild(box);
  }

  function installWrappers(){
    installMuscleFix();

    const sf=window.settingsSheet;
    if(typeof sf==='function'&&!sf.__v250){const base=sf;const w=function(){const r=base.apply(this,arguments);requestAnimationFrame(patchSettingsDom);return r};w.__v250=true;window.settingsSheet=w;try{settingsSheet=w}catch(e){}}

    const sp=window.statsPage;
    if(typeof sp==='function'&&!sp.__v250){const base=sp;const w=function(){const r=base.apply(this,arguments);requestAnimationFrame(()=>{patchStatsDom();window.statsCleanupPatch?.()});return r};w.__v250=true;window.statsPage=w;try{statsPage=w}catch(e){}}

    const hm=window.home;
    if(typeof hm==='function'&&!hm.__v250){const base=hm;const w=function(){const r=base.apply(this,arguments);requestAnimationFrame(patchHomeDom);return r};w.__v250=true;window.home=w;try{home=w}catch(e){}}

    const sm=window.summary;
    if(typeof sm==='function'&&!sm.__v250){const base=sm;const w=function(s){const r=base.apply(this,arguments);requestAnimationFrame(()=>patchSummaryDom(s));return r};w.__v250=true;window.summary=w;try{summary=w}catch(e){}}

    const fn=window.finish;
    if(typeof fn==='function'&&!fn.__v250){const base=fn;const w=function(){const id=st?.current?.id||null,r=base.apply(this,arguments);if(id){const s=arr(st?.sessions).find(x=>String(x.id)===String(id));if(s){s.advancedMetrics={...(s.advancedMetrics||{}),tonnage:sessionTonnage(s),avgRpe:sessionAvgRpe(s),sets:completedCount(s)};try{save()}catch(e){}}}requestAnimationFrame(()=>{patchStatsDom();patchHomeDom()});return r};w.__v250=true;window.finish=w;try{finish=w}catch(e){}}
  }

  installWrappers();patchStatsDom();patchHomeDom();
  [250,900,2200].forEach(t=>setTimeout(()=>{installWrappers();patchStatsDom()},t));
})();
