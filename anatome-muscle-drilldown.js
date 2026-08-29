'use strict';
(()=>{
  if(window.__unvrslAnatomeDrilldown)return;
  window.__unvrslAnatomeDrilldown=true;

  const LABELS={chest:'Грудь',deltoids:'Дельты',triceps:'Трицепс',biceps:'Бицепс',forearm:'Предплечья','upper-back':'Широчайшие / верх спины',trapezius:'Трапеции','lower-back':'Поясница',abs:'Пресс',obliques:'Косые',quadriceps:'Квадрицепс',hamstring:'Бицепс бедра',gluteal:'Ягодичные',adductors:'Приводящие',calves:'Икры',tibialis:'Передняя голень'};
  const normalize=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
  const iso=d=>{const x=new Date(d);return Number.isNaN(x.getTime())?'':x.toISOString().slice(0,10)};
  const doneSets=e=>Array.isArray(e?.set)?e.set.filter(x=>x?.ok).length:Array.isArray(e?.sets)?e.sets.filter(x=>x?.ok!==false).length:0;
  const esc=s=>typeof window.esc==='function'?window.esc(String(s||'')):String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function targetSlug(target){
    const t=normalize(target);if(!t)return'';
    if(/pector|chest|груд/.test(t))return'chest';if(/delt|shoulder|плеч/.test(t))return'deltoids';if(/tricep|трицеп/.test(t))return'triceps';if(/bicep|бицеп/.test(t))return'biceps';if(/forearm|предплеч/.test(t))return'forearm';if(/trap|трапец/.test(t))return'trapezius';if(/lower.?back|поясниц/.test(t))return'lower-back';if(/lat|upper.?back|широч|верх.*спин|back/.test(t))return'upper-back';if(/oblique|кос/.test(t))return'obliques';if(/abdom|\babs?\b|пресс/.test(t))return'abs';if(/quad|квадриц/.test(t))return'quadriceps';if(/hamstring|бицепс бедр|задн.*бедр/.test(t))return'hamstring';if(/glut|ягод/.test(t))return'gluteal';if(/adductor|привод|сведение ног/.test(t))return'adductors';if(/abductor|отвод/.test(t))return'gluteal';if(/calf|calves|икр/.test(t))return'calves';if(/tibialis|передн.*голен/.test(t))return'tibialis';return'';
  }
  function fallback(name){
    const n=normalize(name);
    if(/жим.*(груд|лежа|наклон|отриц)|bench press|chest press|кроссовер|сведение рук|разведение гантел|бабочк/.test(n))return'chest';
    if(/жим.*плеч|армейск|arnold|арнольд|мах.*сторон|дельт|тяга каната к лицу|face pull/.test(n))return'deltoids';
    if(/разгиб.*рук|француз|трицеп|pushdown|skull crusher|жим узким/.test(n))return'triceps';
    if(/сгиб.*рук|бицеп|молот|preacher|curl|скотт/.test(n))return'biceps';
    if(/шраг|shrug/.test(n))return'trapezius';if(/тяга верхн|подтяг|pulldown|pull.?up|chin.?up|пуловер/.test(n))return'upper-back';if(/тяга т-гриф|тяга.*наклон|горизонтальн.*тяга|high row|seated row|low row|one arm row/.test(n))return'upper-back';
    if(/румын|станов|deadlift|good morning|сгиб.*ног|leg curl/.test(n))return'hamstring';if(/ягодич|hip thrust|glute bridge|кикбэк|kickback/.test(n))return'gluteal';if(/сведение ног|приведение ног|adduct/.test(n))return'adductors';if(/разведение ног|отведение ноги|abduct/.test(n))return'gluteal';if(/присед|squat|жим ног|leg press|разгиб.*ног|leg extension|болгар|bulgar|выпад|lunge|зашаг|step.?up/.test(n))return'quadriceps';if(/икр|носок|calf raise/.test(n))return'calves';if(/скручив|crunch|подъем ног|подьем ног|подъем колен|подьем колен|ролик.*пресс|ab wheel|планк|plank/.test(n))return'abs';return'';
  }
  function primary(ex){
    try{if(typeof inferCustomMeta==='function'){const s=targetSlug(inferCustomMeta(ex?.n||ex?.name||'')?.tg);if(s)return s}}catch(_){ }
    return targetSlug(ex?.tg||ex?.target)||fallback(ex?.n||ex?.name);
  }
  function weights(ex,p){
    const n=normalize(ex?.n||ex?.name),m=new Map(),add=(s,w)=>{if(s)m.set(s,Math.max(m.get(s)||0,w))};add(p,1);
    if(p==='chest'||/bench press|жим.*(лежа|груд)|отжим/.test(n)){add('triceps',.5);add('deltoids',.35)}
    if(p==='deltoids'&&/жим|press|армейск|арнольд/.test(n))add('triceps',.45);
    if(p==='upper-back'){add('biceps',.45);if(/горизонт|row|т-гриф|наклон/.test(n))add('trapezius',.25)}
    if(p==='quadriceps'){add('gluteal',.5);if(/присед|squat|болгар|bulgar|выпад|lunge|жим ног|leg press/.test(n))add('hamstring',.2)}
    if(p==='hamstring'){add('gluteal',.55);if(/румын|станов|deadlift|good morning/.test(n))add('lower-back',.3)}
    if(p==='gluteal'&&/ягодич|hip thrust|bridge/.test(n))add('hamstring',.3);if(p==='biceps')add('forearm',.2);if(p==='abs'&&/боков|pallof|russian twist|кос/.test(n))add('obliques',.7);return m;
  }
  function period(){const on=document.querySelector('#anatomeMuscleCard [data-days].on');return Number(on?.dataset.days)||7}
  function sessions(){return typeof st!=='undefined'&&Array.isArray(st?.sessions)?st.sessions:[]}
  function breakdown(slug,days){
    const cut=new Date();cut.setHours(0,0,0,0);cut.setDate(cut.getDate()-(days-1));const rows=new Map();
    sessions().forEach(s=>{const ds=s?.date||iso(s?.started||Date.now()),d=new Date(`${ds}T12:00:00`);if(Number.isNaN(d.getTime())||d<cut)return;(s.ex||[]).forEach(ex=>{const n=doneSets(ex);if(!n)return;const p=primary(ex);if(!p)return;const w=weights(ex,p).get(slug)||0;if(!w)return;const name=String(ex?.n||ex?.name||'Упражнение');const k=normalize(name),r=rows.get(k)||{name,sets:0,score:0,sessions:new Set()};r.sets+=n;r.score+=n*w;r.sessions.add(ds);rows.set(k,r)})});
    return [...rows.values()].sort((a,b)=>b.score-a.score||b.sets-a.sets);
  }
  function open(slug){
    const days=period(),rows=breakdown(slug,days),total=rows.reduce((q,r)=>q+r.sets,0),score=rows.reduce((q,r)=>q+r.score,0);
    const list=rows.length?rows.map((r,i)=>`<div class="anatome-detail-row"><div class="anatome-detail-rank">${i+1}</div><div class="anatome-detail-main"><b>${esc(r.name)}</b><small>${r.sessions.size} трен. · вклад ${r.score.toFixed(1).replace('.0','')}</small></div><strong>${r.sets}<small> подх.</small></strong></div>`).join(''):'<div class="muted" style="padding:16px 0">За этот период подходов на эту мышцу нет.</div>';
    if(typeof modal==='function')modal(`<div class="sheet-grabber"></div><div class="anatome-detail-head"><div><div class="muted small">НАГРУЗКА · ${days} ДНЕЙ</div><h2>${esc(LABELS[slug]||slug)}</h2></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="anatome-detail-summary"><div><span>Подходы</span><b>${total}</b></div><div><span>Индекс нагрузки</span><b>${score.toFixed(1).replace('.0','')}</b></div></div><div class="section" style="margin-left:0">УПРАЖНЕНИЯ</div>${list}`);
  }

  const style=document.createElement('style');style.textContent=`
    #anatomeMuscleCard .anatome-muscle{cursor:pointer;transition:transform .12s ease,border-color .12s ease}#anatomeMuscleCard .anatome-muscle:active{transform:scale(.985);border-color:#bf5af2}#anatomeMuscleCard .anatome-muscle::after{content:'›';float:right;color:#6f6f76;margin-top:-23px;font-size:20px}.anatome-detail-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.anatome-detail-head h2{margin:4px 0 0}.anatome-detail-summary{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:16px 0}.anatome-detail-summary>div{background:#202023;border:1px solid #303036;border-radius:16px;padding:13px}.anatome-detail-summary span{display:block;color:#85858b;font-size:12px}.anatome-detail-summary b{display:block;font-size:24px;margin-top:5px}.anatome-detail-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:10px;align-items:center;padding:13px 0;border-bottom:1px solid #2d2d31}.anatome-detail-row:last-child{border-bottom:0}.anatome-detail-rank{width:26px;height:26px;border-radius:9px;background:#2b2b30;color:#aaa;display:grid;place-items:center;font-size:12px;font-weight:800}.anatome-detail-main b{display:block;font-size:15px}.anatome-detail-main small{display:block;color:#85858b;font-size:11px;margin-top:4px}.anatome-detail-row strong{font-size:17px}.anatome-detail-row strong small{font-size:10px;color:#85858b;font-weight:600}`;document.head.appendChild(style);

  function bind(){document.querySelectorAll('#anatomeMuscleCard .anatome-muscle').forEach(el=>{if(el.dataset.drilldown)return;const label=el.querySelector('b')?.textContent?.trim();const slug=Object.keys(LABELS).find(k=>LABELS[k]===label);if(!slug)return;el.dataset.drilldown=slug;el.setAttribute('role','button');el.setAttribute('tabindex','0');el.addEventListener('click',()=>open(slug));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(slug)}})})}
  const root=document.getElementById('stats');if(root)new MutationObserver(()=>queueMicrotask(bind)).observe(root,{childList:true,subtree:true});window.addEventListener('DOMContentLoaded',bind,{once:true});setTimeout(bind,0);
})();