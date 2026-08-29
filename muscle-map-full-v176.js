'use strict';
(()=>{
  if(window.__unvrslMuscleMapFullV176)return;
  window.__unvrslMuscleMapFullV176=true;

  const LABELS={chest:'Грудь',deltoids:'Дельты',triceps:'Трицепс',biceps:'Бицепс',forearm:'Предплечья','upper-back':'Широчайшие / верх спины',trapezius:'Трапеции','lower-back':'Поясница',abs:'Пресс',obliques:'Косые',quadriceps:'Квадрицепс',hamstring:'Бицепс бедра',gluteal:'Ягодичные',adductors:'Приводящие',calves:'Икры',tibialis:'Передняя голень'};
  const norm=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
  const state=()=>{try{if(typeof st!=='undefined'){window.st=st;return st}}catch(e){}return window.st||null};
  const done=e=>Array.isArray(e?.set)?e.set.filter(x=>x?.ok).length:0;
  const iso=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toISOString().slice(0,10)};
  const accent=()=>String(state()?.accent||getComputedStyle(document.documentElement).getPropertyValue('--green')||'#30d158').trim()||'#30d158';
  let remote=[],loadedAt=0,rendering=false;

  function targetSlug(t){
    t=norm(t);if(!t)return'';
    // Specific lower-body terms must win over the generic word "бицепс".
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
    if(/румын|romanian|станов|deadlift|good morning/.test(n))return'hamstring';
    if(/сгиб.*ног|leg curl/.test(n))return'hamstring';
    if(/ягодич|hip thrust|glute bridge|кикбэк|kickback/.test(n))return'gluteal';
    if(/сведение ног|приведение ног|adduct/.test(n))return'adductors';
    if(/разведение ног|отведение ноги|abduct/.test(n))return'gluteal';
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
    const direct=targetSlug(ex?.tg||ex?.target);if(direct)return direct;
    try{if(typeof inferCustomMeta==='function'){const x=targetSlug(inferCustomMeta(ex?.n||'')?.tg);if(x)return x}}catch(e){}
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

  async function sessions(){
    const s=state(),local=Array.isArray(s?.sessions)?s.sessions:[];
    if(!window.cloud?.client||!window.cloud?.user)return local;
    if(Date.now()-loadedAt>15000){
      try{
        const cut=new Date();cut.setDate(cut.getDate()-35);
        const q=await window.cloud.client.from('workouts').select('external_id,workout_date,payload').eq('user_id',window.cloud.user.id).gte('workout_date',iso(cut)).order('workout_date',{ascending:true}).limit(250);
        if(!q.error){remote=(q.data||[]).map(x=>({...x.payload,date:x.workout_date,id:x.payload?.id||x.external_id})).filter(x=>Array.isArray(x.ex));loadedAt=Date.now()}
      }catch(e){console.warn('full muscle sessions',e)}
    }
    const map=new Map();[...remote,...local].forEach(x=>{const k=String(x?.id||`${x?.date}-${x?.started||Math.random()}`);map.set(k,x)});return [...map.values()];
  }
  function calculate(list,days){
    const cut=new Date();cut.setHours(0,0,0,0);cut.setDate(cut.getDate()-(days-1));const scores=new Map();let sets=0;
    list.forEach(s=>{const d=new Date(`${s?.date||iso(s?.started)}T12:00:00`);if(Number.isNaN(d.getTime())||d<cut)return;(s.ex||[]).forEach(ex=>{const n=done(ex);if(!n)return;const p=primary(ex);if(!p)return;sets+=n;weights(ex,p).forEach((w,slug)=>scores.set(slug,(scores.get(slug)||0)+n*w))})});
    return{scores,sets,rows:[...scores.entries()].filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1])};
  }
  function period(card){return Number(card?.querySelector('[data-days].on')?.dataset.days)||7}
  function topHtml(rows){const max=rows[0]?.[1]||1;return rows.slice(0,8).map(([slug,v])=>`<div class="anatome-muscle" data-drilldown="${slug}"><div class="anatome-muscle-row"><b>${LABELS[slug]||slug}</b><span>${v.toFixed(1).replace('.0','')}</span></div><div class="anatome-bar"><i style="width:${Math.max(5,Math.round(v/max*100))}%"></i></div></div>`).join('')}
  function color(slug,scores){const v=scores.get(slug)||0;if(!v)return'#34343a';const max=Math.max(1,...scores.values()),q=v/max;return q>=.67?'#ff375f':accent()}
  function side(side,scores,bodyData){const sex=state()?.body==='female'?'female':'male',parts=bodyData?.[sex]?.[side]||[],paths=[];parts.forEach(part=>{const active=scores.has(part.slug),fill=color(part.slug,scores);Object.values(part.path||{}).flat().forEach(d=>{if(d)paths.push(`<path d="${String(d).replace(/"/g,'&quot;')}" fill="${fill}" opacity="${active?'.98':'.72'}" stroke="rgba(255,255,255,.16)" stroke-width="1.15" vector-effect="non-scaling-stroke"></path>`)})});const vb=side==='back'?'760 140 640 1230':'40 140 640 1230';return `<svg class="anatome-local-side" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${paths.join('')}</svg>`}
  async function render(){
    if(rendering)return;const card=document.getElementById('anatomeMuscleCard');if(!card)return;const bodyData=window.UNVRSL_ANATOME_BODY_PATHS;if(!bodyData)return;
    rendering=true;try{
      const days=period(card),data=calculate(await sessions(),days),fig=card.querySelector('.anatome-figure'),top=card.querySelector('.anatome-top'),sub=card.querySelector('.anatome-sub');if(!fig)return;
      if(sub)sub.textContent=`Последние ${days} дн. · ${data.sets} выполн. подходов`;
      if(top)top.innerHTML=topHtml(data.rows);
      if(!data.rows.length)return;
      const sig=`${state()?.body||'male'}|${days}|`+data.rows.map(x=>x.join(':')).join('|');if(fig.dataset.full176Sig===sig&&fig.querySelector('.anatome-full-v176'))return;
      fig.dataset.full176Sig=sig;fig.dataset.localSig=sig;
      fig.innerHTML=`<div class="anatome-full-v176" style="width:100%"><div class="anatome-local-dual">${side('front',data.scores,bodyData)}${side('back',data.scores,bodyData)}</div><div class="anatome-local-caption">СПЕРЕДИ · СЗАДИ</div></div>`;
    }finally{rendering=false}
  }
  function schedule(){setTimeout(render,80);setTimeout(render,450)}
  const root=document.getElementById('stats');if(root)new MutationObserver(()=>{const fig=document.querySelector('#anatomeMuscleCard .anatome-figure');if(fig&&!fig.querySelector('.anatome-full-v176'))schedule()}).observe(root,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target?.closest?.('#anatomeMuscleCard [data-days]')){loadedAt=0;setTimeout(render,120)}},true);
  window.addEventListener('focus',()=>{loadedAt=0;schedule()});
  [1200,2600,5000].forEach(t=>setTimeout(render,t));
})();
