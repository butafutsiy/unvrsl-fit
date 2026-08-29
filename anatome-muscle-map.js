'use strict';
(()=>{
  if(window.__unvrslAnatomeMuscleMap)return;
  window.__unvrslAnatomeMuscleMap=true;

  const API='https://api.anatome.dev/generateImage';
  const SVG_CACHE_KEY='unvrsl-anatome-svg-v1';
  const CACHE_TTL=12*60*60*1000;
  let periodDays=7;
  let cloudSessions=null;
  let cloudLoadedAt=0;
  let rendering=false;

  const LABELS={
    chest:'Грудь',deltoids:'Дельты',triceps:'Трицепс',biceps:'Бицепс',forearm:'Предплечья',
    'upper-back':'Широчайшие / верх спины',trapezius:'Трапеции','lower-back':'Поясница',
    abs:'Пресс',obliques:'Косые',quadriceps:'Квадрицепс',hamstring:'Бицепс бедра',
    gluteal:'Ягодичные',adductors:'Приводящие',calves:'Икры',tibialis:'Передняя голень'
  };

  const style=document.createElement('style');
  style.id='anatome-muscle-map-style';
  style.textContent=`
    .anatome-card{position:relative}.anatome-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px}.anatome-title{font-size:18px;font-weight:850;letter-spacing:-.3px}.anatome-sub{font-size:12px;color:#85858b;margin-top:4px}.anatome-seg{display:flex;background:#303035;padding:2px;border-radius:10px;flex:0 0 auto}.anatome-seg button{border:0;background:transparent;color:#9999a0;padding:7px 9px;border-radius:8px;font-size:12px;font-weight:750}.anatome-seg button.on{background:#1d1d20;color:#fff}.anatome-body{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(120px,.65fr);gap:12px;align-items:center}.anatome-figure{min-height:255px;display:grid;place-items:center;background:radial-gradient(circle at 50% 45%,rgba(191,90,242,.09),transparent 65%);border-radius:18px;overflow:hidden}.anatome-figure img{display:block;width:100%;max-width:330px;height:auto;max-height:330px;object-fit:contain}.anatome-loading,.anatome-empty{color:#85858b;font-size:13px;text-align:center;padding:45px 14px}.anatome-top{display:flex;flex-direction:column;gap:8px}.anatome-muscle{background:#17171a;border:1px solid #292a2f;border-radius:13px;padding:10px}.anatome-muscle-row{display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:12px}.anatome-muscle-row b{font-size:12px}.anatome-muscle-row span{color:#8e8e93;font-variant-numeric:tabular-nums}.anatome-bar{height:5px;background:#2b2b30;border-radius:99px;overflow:hidden;margin-top:7px}.anatome-bar i{display:block;height:100%;background:#bf5af2;border-radius:99px}.anatome-foot{color:#6f6f76;font-size:10px;line-height:1.35;margin-top:10px}.anatome-error{color:#ff9f0a;font-size:12px;text-align:center;padding:36px 12px}
    @media(max-width:430px){.anatome-body{grid-template-columns:1fr}.anatome-figure{min-height:235px}.anatome-figure img{max-height:290px}.anatome-top{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.anatome-head{align-items:center}}
  `;
  document.head.appendChild(style);

  const normalize=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
  const iso=d=>{const x=new Date(d);return Number.isNaN(x.getTime())?'':x.toISOString().slice(0,10)};
  const completedSets=e=>Array.isArray(e?.set)?e.set.filter(x=>x?.ok).length:Array.isArray(e?.sets)?e.sets.filter(x=>x?.ok!==false).length:0;

  function targetSlug(target){
    const t=normalize(target);
    if(!t)return'';
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
    if(/quad|квадриц/.test(t))return'quadriceps';
    if(/hamstring|бицепс бедр|задн.*бедр/.test(t))return'hamstring';
    if(/glut|ягод/.test(t))return'gluteal';
    if(/adductor|привод|сведение ног/.test(t))return'adductors';
    if(/abductor|отвод/.test(t))return'gluteal';
    if(/calf|calves|икр/.test(t))return'calves';
    if(/tibialis|передн.*голен/.test(t))return'tibialis';
    return'';
  }

  function fallbackTarget(name){
    const n=normalize(name);
    if(/жим.*(груд|лежа|наклон|отриц)|bench press|chest press|кроссовер|сведение рук|разведение гантел|бабочк/.test(n))return'chest';
    if(/жим.*плеч|армейск|arnold|арнольд|мах.*сторон|дельт|тяга каната к лицу|face pull/.test(n))return'deltoids';
    if(/разгиб.*рук|разгиб.*рук|француз|трицеп|pushdown|skull crusher|жим узким/.test(n))return'triceps';
    if(/сгиб.*рук|сгиб.*рук|бицеп|молот|preacher|curl|скотт/.test(n))return'biceps';
    if(/шраг|shrug/.test(n))return'trapezius';
    if(/тяга верхн|подтяг|pulldown|pull.?up|chin.?up|пуловер/.test(n))return'upper-back';
    if(/тяга т-гриф|тяга.*наклон|горизонтальн.*тяга|high row|seated row|low row|one arm row/.test(n))return'upper-back';
    if(/румын|станов|deadlift|good morning|сгиб.*ног|leg curl/.test(n))return'hamstring';
    if(/ягодич|hip thrust|glute bridge|кикбэк|kickback/.test(n))return'gluteal';
    if(/сведение ног|приведение ног|adduct/.test(n))return'adductors';
    if(/разведение ног|отведение ноги|abduct/.test(n))return'gluteal';
    if(/присед|squat|жим ног|leg press|разгиб.*ног|leg extension|болгар|bulgar|выпад|lunge|зашаг|step.?up/.test(n))return'quadriceps';
    if(/икр|носок|calf raise/.test(n))return'calves';
    if(/скручив|crunch|подъем ног|подьем ног|подъем колен|подьем колен|ролик.*пресс|ab wheel|планк|plank/.test(n))return'abs';
    return'';
  }

  function catalogTarget(ex,lookup){
    const sid=String(ex?.sourceId||ex?.rawId||'');
    if(sid&&lookup?.has(sid))return targetSlug(lookup.get(sid)?.tg);
    try{
      if(typeof inferCustomMeta==='function'){
        const meta=inferCustomMeta(ex?.n||ex?.name||'');
        const slug=targetSlug(meta?.tg);
        if(slug)return slug;
      }
    }catch(_){ }
    return targetSlug(ex?.tg||ex?.target)||fallbackTarget(ex?.n||ex?.name);
  }

  function catalogLookup(){
    const map=new Map();
    try{
      if(typeof catalogRecords==='function'){
        catalogRecords().forEach(e=>{
          [e?.id,e?.rawId,e?.sourceId].filter(Boolean).forEach(id=>map.set(String(id),e));
        });
      }
    }catch(_){ }
    return map;
  }

  function muscleWeights(ex,primary){
    const n=normalize(ex?.n||ex?.name);
    const out=new Map();
    const add=(slug,w)=>{if(slug)out.set(slug,Math.max(out.get(slug)||0,w))};
    add(primary,1);

    if(primary==='chest'||/bench press|жим.*(лежа|груд)|отжим/.test(n)){add('triceps',.5);add('deltoids',.35)}
    if(primary==='deltoids'&&/жим|press|армейск|арнольд/.test(n))add('triceps',.45);
    if(primary==='upper-back'){add('biceps',.45);if(/горизонт|row|т-гриф|наклон/.test(n))add('trapezius',.25)}
    if(primary==='quadriceps'){add('gluteal',.5);if(/присед|squat|болгар|bulgar|выпад|lunge|жим ног|leg press/.test(n))add('hamstring',.2)}
    if(primary==='hamstring'){add('gluteal',.55);if(/румын|станов|deadlift|good morning/.test(n))add('lower-back',.3)}
    if(primary==='gluteal'&&/ягодич|hip thrust|bridge/.test(n))add('hamstring',.3);
    if(primary==='biceps')add('forearm',.2);
    if(primary==='abs'&&/боков|pallof|russian twist|кос/.test(n))add('obliques',.7);
    return out;
  }

  function sessionDate(s){return s?.date||s?.workout_date||iso(s?.started||s?.payload?.started||Date.now())}

  async function getSessions(){
    const local=(typeof st!=='undefined'&&Array.isArray(st?.sessions))?st.sessions:[];
    if(!window.cloud?.client||!window.cloud?.user)return local;
    if(cloudSessions&&Date.now()-cloudLoadedAt<60000)return cloudSessions.length?cloudSessions:local;
    try{
      const cut=new Date();cut.setDate(cut.getDate()-35);
      const r=await window.cloud.client.from('workouts').select('external_id,workout_date,payload').eq('user_id',window.cloud.user.id).gte('workout_date',iso(cut)).order('workout_date',{ascending:true}).limit(250);
      if(r.error)throw r.error;
      cloudSessions=(r.data||[]).map(x=>({...x.payload,date:x.workout_date,id:x.payload?.id||x.external_id})).filter(x=>Array.isArray(x.ex));
      cloudLoadedAt=Date.now();
      return cloudSessions.length?cloudSessions:local;
    }catch(e){
      console.warn('Anatome cloud sessions',e);
      return local;
    }
  }

  function scoreSessions(sessions,days){
    const cut=new Date();cut.setHours(0,0,0,0);cut.setDate(cut.getDate()-(days-1));
    const lookup=catalogLookup(),scores=new Map();let sets=0,exercises=0;
    sessions.forEach(s=>{
      const d=new Date(`${sessionDate(s)}T12:00:00`);if(Number.isNaN(d.getTime())||d<cut)return;
      (s.ex||[]).forEach(ex=>{
        const n=completedSets(ex);if(!n)return;
        const primary=catalogTarget(ex,lookup);if(!primary)return;
        const weights=muscleWeights(ex,primary);sets+=n;exercises++;
        weights.forEach((w,slug)=>scores.set(slug,(scores.get(slug)||0)+n*w));
      });
    });
    return {scores,sets,exercises};
  }

  function layersFromScores(scores){
    const rows=[...scores.entries()].filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
    if(!rows.length)return {layers:'',rows:[]};
    const max=rows[0][1],high=[],mid=[],low=[];
    rows.forEach(([slug,v])=>{const r=v/max;(r>=.67?high:r>=.34?mid:low).push(slug)});
    const layers=[high.length&&`BF5AF2:${high.join(',')}`,mid.length&&`8E44AD:${mid.join(',')}`,low.length&&`5A356E:${low.join(',')}`].filter(Boolean).join('|');
    return {layers,rows};
  }

  function dataUri(svg){return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
  async function imageSrc(layers){
    const sig=`male|dual|${layers}`;
    try{
      const c=JSON.parse(localStorage.getItem(SVG_CACHE_KEY)||'null');
      if(c?.sig===sig&&c?.svg&&Date.now()-c.ts<CACHE_TTL)return dataUri(c.svg);
    }catch(_){ }
    const url=`${API}?gender=male&view=dual&width=420&layers=${encodeURIComponent(layers)}&output=raw`;
    try{
      const r=await fetch(url,{mode:'cors',cache:'force-cache'});if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const svg=await r.text();if(!/<svg[\s>]/i.test(svg))throw new Error('Anatome returned non-SVG');
      try{localStorage.setItem(SVG_CACHE_KEY,JSON.stringify({sig,svg,ts:Date.now()}))}catch(_){ }
      return dataUri(svg);
    }catch(e){
      console.warn('Anatome SVG cache',e);
      return url;
    }
  }

  function topHtml(rows){
    if(!rows.length)return'';
    const max=rows[0][1]||1;
    return rows.slice(0,6).map(([slug,v])=>`<div class="anatome-muscle"><div class="anatome-muscle-row"><b>${LABELS[slug]||slug}</b><span>${v.toFixed(1).replace('.0','')}</span></div><div class="anatome-bar"><i style="width:${Math.max(5,Math.round(v/max*100))}%"></i></div></div>`).join('');
  }

  async function renderCard(card){
    if(rendering||!card?.isConnected)return;rendering=true;
    const figure=card.querySelector('.anatome-figure'),top=card.querySelector('.anatome-top'),sub=card.querySelector('.anatome-sub');
    try{
      const sessions=await getSessions(),data=scoreSessions(sessions,periodDays),built=layersFromScores(data.scores);
      if(sub)sub.textContent=`Последние ${periodDays} дн. · ${data.sets} выполн. подходов`;
      if(!built.layers){if(figure)figure.innerHTML='<div class="anatome-empty">Нет выполненных силовых подходов за этот период.</div>';if(top)top.innerHTML='';return}
      if(top)top.innerHTML=topHtml(built.rows);
      const src=await imageSrc(built.layers);if(!card.isConnected)return;
      if(figure)figure.innerHTML=`<img src="${src}" alt="Карта нагрузки на мышцы за ${periodDays} дней">`;
    }catch(e){
      console.warn('Anatome muscle map',e);if(figure)figure.innerHTML='<div class="anatome-error">Не удалось загрузить карту мышц. Статистика тренировок сохранена.</div>';
    }finally{rendering=false}
  }

  function cardHtml(){return `<div id="anatomeMuscleCard" class="sd2-card anatome-card"><div class="anatome-head"><div><div class="anatome-title">Нагрузка по мышцам</div><div class="anatome-sub">Последние ${periodDays} дн.</div></div><div class="anatome-seg"><button data-days="7" class="${periodDays===7?'on':''}">7 дн.</button><button data-days="28" class="${periodDays===28?'on':''}">28 дн.</button></div></div><div class="anatome-body"><div class="anatome-figure"><div class="anatome-loading">Строю карту…</div></div><div class="anatome-top"></div></div><div class="anatome-foot">Визуализация: Anatome · интенсивность рассчитана UNVRSL FIT по выполненным подходам, включая вспомогательную нагрузку.</div></div>`}

  function mount(){
    const root=document.getElementById('stats');if(!root||root.querySelector('#anatomeMuscleCard'))return;
    const anchor=root.querySelector('#sd2HeatWrap')?.closest('.sd2-card');if(!anchor)return;
    const wrap=document.createElement('div');wrap.innerHTML=cardHtml();const card=wrap.firstElementChild;anchor.insertAdjacentElement('afterend',card);
    card.querySelectorAll('[data-days]').forEach(btn=>btn.addEventListener('click',()=>{
      const d=Number(btn.dataset.days);if(![7,28].includes(d)||d===periodDays)return;periodDays=d;
      card.querySelectorAll('[data-days]').forEach(b=>b.classList.toggle('on',Number(b.dataset.days)===d));
      card.querySelector('.anatome-figure').innerHTML='<div class="anatome-loading">Пересчитываю…</div>';renderCard(card);
    }));
    renderCard(card);
  }

  const root=document.getElementById('stats');
  if(root){new MutationObserver(()=>queueMicrotask(mount)).observe(root,{childList:true});mount()}
  else window.addEventListener('DOMContentLoaded',()=>{const r=document.getElementById('stats');if(!r)return;new MutationObserver(()=>queueMicrotask(mount)).observe(r,{childList:true});mount()},{once:true});
})();
