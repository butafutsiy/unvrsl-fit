'use strict';
(()=>{
  if(window.__unvrslMuscleDrilldownFixV181)return;
  window.__unvrslMuscleDrilldownFixV181=true;

  const LABELS={chest:'Грудь',deltoids:'Дельты',triceps:'Трицепс',biceps:'Бицепс',forearm:'Предплечья','upper-back':'Широчайшие / верх спины',trapezius:'Трапеции','lower-back':'Поясница',abs:'Пресс',obliques:'Косые',quadriceps:'Квадрицепс',hamstring:'Бицепс бедра',gluteal:'Ягодичные',adductors:'Приводящие',calves:'Икры',tibialis:'Передняя голень'};
  const norm=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
  const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const iso=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toISOString().slice(0,10)};
  const state=()=>{try{return typeof st!=='undefined'?st:(window.st||null)}catch(_){return window.st||null}};
  const done=e=>Array.isArray(e?.set)?e.set.filter(x=>x?.ok).length:Array.isArray(e?.sets)?e.sets.filter(x=>x?.ok!==false).length:0;

  function target(t){
    t=norm(t);if(!t)return'';
    if(/hamstring|бицепс бедр|задн.*бедр/.test(t))return'hamstring';
    if(/glut|ягод/.test(t))return'gluteal';
    if(/quad|квадриц/.test(t))return'quadriceps';
    if(/adductor|привод|сведение ног/.test(t))return'adductors';
    if(/abductor|отвод/.test(t))return'gluteal';
    if(/calf|calves|икр/.test(t))return'calves';
    if(/tibialis|передн.*голен/.test(t))return'tibialis';
    if(/pector|chest|груд/.test(t))return'chest';
    if(/delt|shoulder|плеч/.test(t))return'deltoids';
    if(/tricep|трицеп/.test(t))return'triceps';
    if(/bicep|бицеп/.test(t))return'biceps';
    if(/forearm|предплеч/.test(t))return'forearm';
    if(/trap|трапец/.test(t))return'trapezius';
    if(/lower.?back|поясниц/.test(t))return'lower-back';
    if(/lat|upper.?back|широч|верх.*спин|back/.test(t))return'upper-back';
    if(/oblique|кос/.test(t))return'obliques';
    if(/abdom|\babs?\b|пресс/.test(t))return'abs';
    return'';
  }
  function fallback(name){
    const n=norm(name);
    if(/румын|romanian|станов|deadlift|good morning|сгиб.*ног|leg curl/.test(n))return'hamstring';
    if(/ягодич|hip thrust|glute bridge|кикбэк|kickback|разведение ног|отведение ноги|abduct/.test(n))return'gluteal';
    if(/сведение ног|приведение ног|adduct/.test(n))return'adductors';
    if(/присед|squat|жим ног|leg press|разгиб.*ног|leg extension|болгар|bulgar|выпад|lunge|зашаг|step.?up/.test(n))return'quadriceps';
    if(/икр|носок|calf raise/.test(n))return'calves';
    if(/жим.*(груд|лежа|наклон|отриц)|bench press|chest press|кроссовер|сведение рук|разведение гантел|бабочк/.test(n))return'chest';
    if(/жим.*плеч|армейск|arnold|арнольд|мах.*сторон|дельт|face pull/.test(n))return'deltoids';
    if(/разгиб.*рук|француз|трицеп|pushdown|жим узким/.test(n))return'triceps';
    if(/сгиб.*рук|\bбицепс\b|молот|curl|скотт/.test(n))return'biceps';
    if(/шраг|shrug/.test(n))return'trapezius';
    if(/тяга верхн|подтяг|pulldown|pull.?up|chin.?up|пуловер|тяга т-гриф|тяга.*наклон|горизонтальн.*тяга|high row|seated row|low row/.test(n))return'upper-back';
    if(/гиперэкстенз/.test(n))return'lower-back';
    if(/скручив|crunch|подъем ног|подьем ног|подъем колен|подьем колен|ролик.*пресс|ab wheel|планк|plank/.test(n))return'abs';
    return'';
  }
  function primary(ex){
    const d=target(ex?.tg||ex?.target);if(d)return d;
    try{if(typeof inferCustomMeta==='function'){const x=target(inferCustomMeta(ex?.n||ex?.name||'')?.tg);if(x)return x}}catch(_){ }
    return fallback(ex?.n||ex?.name);
  }
  function weights(ex,p){
    const n=norm(ex?.n||ex?.name),m=new Map(),add=(s,w)=>{if(s)m.set(s,Math.max(m.get(s)||0,w))};add(p,1);
    if(p==='chest'||/bench press|жим.*(лежа|груд)|отжим/.test(n)){add('triceps',.5);add('deltoids',.35)}
    if(p==='deltoids'&&/жим|press|армейск|арнольд/.test(n))add('triceps',.45);
    if(p==='upper-back'){add('biceps',.45);if(/горизонт|row|т-гриф|наклон/.test(n))add('trapezius',.25)}
    if(p==='quadriceps'){
      if(/болгар|bulgar|выпад|lunge|зашаг|step.?up/.test(n)){add('gluteal',.75);add('hamstring',.25)}
      else if(/присед|squat|жим ног|leg press/.test(n)){add('gluteal',.5);add('hamstring',.2)}
    }
    if(p==='hamstring'&&/румын|romanian|станов|deadlift|good morning/.test(n)){add('gluteal',.65);add('lower-back',.25)}
    if(p==='gluteal'&&/ягодич|hip thrust|bridge/.test(n))add('hamstring',.2);
    if(p==='biceps')add('forearm',.2);
    if(p==='abs'&&/боков|pallof|russian twist|кос/.test(n))add('obliques',.7);
    return m;
  }
  function days(){return Number(document.querySelector('#anatomeMuscleCard [data-days].on')?.dataset.days)||7}
  function localSessions(){const s=state();return Array.isArray(s?.sessions)?s.sessions:[]}
  function rowsFor(slug,period){
    const cut=new Date();cut.setHours(0,0,0,0);cut.setDate(cut.getDate()-(period-1));const map=new Map();
    localSessions().forEach(s=>{const ds=s?.date||iso(s?.started||Date.now()),d=new Date(`${ds}T12:00:00`);if(Number.isNaN(d.getTime())||d<cut)return;(s.ex||[]).forEach(ex=>{const n=done(ex);if(!n)return;const p=primary(ex);if(!p)return;const k=weights(ex,p).get(slug)||0;if(!k)return;const name=String(ex?.n||ex?.name||'Упражнение'),id=norm(name),r=map.get(id)||{name,sets:0,score:0,sessions:new Set()};r.sets+=n;r.score+=n*k;r.sessions.add(ds);map.set(id,r)})});
    return [...map.values()].sort((a,b)=>b.score-a.score||b.sets-a.sets);
  }
  function show(slug){
    const period=days(),rows=rowsFor(slug,period),sets=rows.reduce((a,r)=>a+r.sets,0),score=rows.reduce((a,r)=>a+r.score,0);
    const list=rows.length?rows.map((r,i)=>`<div class="anatome-detail-row"><div class="anatome-detail-rank">${i+1}</div><div class="anatome-detail-main"><b>${esc(r.name)}</b><small>${r.sessions.size} трен. · вклад ${r.score.toFixed(1).replace('.0','')}</small></div><strong>${r.sets}<small> подх.</small></strong></div>`).join(''):'<div class="muted" style="padding:16px 0">За этот период выполненных упражнений на эту мышцу нет.</div>';
    const html=`<div class="sheet-grabber"></div><div class="anatome-detail-head"><div><div class="muted small">НАГРУЗКА · ${period} ДНЕЙ</div><h2>${esc(LABELS[slug]||slug)}</h2></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="anatome-detail-summary"><div><span>Подходы</span><b>${sets}</b></div><div><span>Индекс нагрузки</span><b>${score.toFixed(1).replace('.0','')}</b></div></div><div class="section" style="margin-left:0">УПРАЖНЕНИЯ</div>${list}`;
    try{if(typeof modal==='function')modal(html);else if(typeof window.modal==='function')window.modal(html)}catch(e){console.warn('muscle drilldown v181',e)}
  }

  document.addEventListener('click',e=>{
    const el=e.target?.closest?.('#anatomeMuscleCard .anatome-muscle[data-drilldown]');if(!el)return;
    e.preventDefault();e.stopImmediatePropagation();const slug=el.dataset.drilldown;if(slug)show(slug);
  },true);
  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;const el=e.target?.closest?.('#anatomeMuscleCard .anatome-muscle[data-drilldown]');if(!el)return;e.preventDefault();show(el.dataset.drilldown);
  },true);
  function enhance(){document.querySelectorAll('#anatomeMuscleCard .anatome-muscle[data-drilldown]').forEach(el=>{el.setAttribute('role','button');el.setAttribute('tabindex','0')})}
  const root=document.getElementById('stats');if(root)new MutationObserver(()=>queueMicrotask(enhance)).observe(root,{childList:true,subtree:true});enhance();
})();
