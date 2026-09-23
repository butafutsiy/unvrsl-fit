'use strict';
(()=>{
  if(window.__unvrslMuscleMapFullV176)return;
  window.__unvrslMuscleMapFullV176=true;

  const BODY_URL='./data/anatome-body-paths.json';
  const LABELS={chest:'Грудь',deltoids:'Дельты',triceps:'Трицепс',biceps:'Бицепс',forearm:'Предплечья','upper-back':'Широчайшие / верх спины',trapezius:'Трапеции','lower-back':'Поясница',abs:'Пресс',obliques:'Косые',quadriceps:'Квадрицепс',hamstring:'Бицепс бедра',gluteal:'Ягодичные',adductors:'Приводящие',calves:'Икры',tibialis:'Передняя голень',neck:'Шея'};
  const norm=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
  const state=()=>{try{if(typeof st!=='undefined'){window.st=st;return st}}catch(e){}return window.st||null};
  // Sessions created before the current training engine used `exercises`,
  // `sets`, `weight`, `reps` and sometimes `completed` instead of the newer
  // short fields. Read both formats here. Statistics must never require a
  // migration of a user's saved training history.
  const rows=v=>Array.isArray(v)?v:[];
  const exercises=s=>rows(s?.ex||s?.exercises);
  const setRows=e=>rows(e?.set||e?.sets);
  const completed=x=>x?.ok===true||x?.completed===true||x?.done===true||x?.isCompleted===true||String(x?.status||'').toLowerCase()==='completed';
  const done=e=>setRows(e).filter(completed).length;
  const numeric=v=>{if(v==null||String(v).trim()==='')return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const repsOf=x=>numeric(x?.actualReps??x?.r??x?.reps);
  const weightOf=x=>numeric(x?.w??x?.weight??x?.load??x?.kg);
  const accent=()=>String(state()?.accent||getComputedStyle(document.documentElement).getPropertyValue('--green')||'#30d158').trim()||'#30d158';
  let rendering=false,bodyCache=null,bodyLoading=null,rerender=false;

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
    if(/neck|ше[яи]/.test(t))return'neck';
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
    if(/жим.*(груд|лежа|наклон|отриц)|bench press|chest press|кроссовер|сведение рук|разведение гантел|разводк|бабочк|отжим/.test(n))return'chest';
    if(/жим.*плеч|армейск|arnold|арнольд|мах.*сторон|дельт|face pull|жим.*(гантел|штанг|тренаж).*(сидя|стоя)/.test(n))return'deltoids';
    if(/разгиб.*рук|разгиб.*(гантел|штанг).*(голов)|француз|трицеп|pushdown|жим узким/.test(n))return'triceps';
    if(/сгиб.*рук|сгиб.*(гантел|штанг|блок)|подъем.*(гантел|штанг).*бицепс|\bбицепс\b|молот|curl|скотт/.test(n))return'biceps';
    if(/шраг|shrug/.test(n))return'trapezius';
    if(/тяга верхн|верхн.*блок|нижн.*блок|подтяг|pulldown|pull.?up|chin.?up|пуловер|тяга т-гриф|тяга.*наклон|горизонтальн.*тяга|high row|seated row|low row/.test(n))return'upper-back';
    if(/гиперэкстенз/.test(n))return'lower-back';
    if(/скручив|crunch|подъем ног|подьем ног|подъем колен|подьем колен|ролик.*пресс|ab wheel|планк|plank/.test(n))return'abs';
    return'';
  }
  function baseName(ex){const raw=ex?.n||ex?.name||'';try{return typeof baseExerciseName==='function'?baseExerciseName(raw):raw}catch(e){return raw}}
  function catalogLookup(){
    const ids=new Map(),names=new Map(),add=e=>{if(!e)return;[e.id,e.rawId,e.sourceId].filter(Boolean).forEach(id=>ids.set(String(id),e));const namesToAdd=[e.n,e.name,e.raw,e.sourceName].filter(Boolean);namesToAdd.forEach(n=>{const k=norm(n);if(k&&!names.has(k))names.set(k,e)})};
    try{if(typeof catalogRecords==='function')catalogRecords().forEach(add)}catch(e){}
    try{if(typeof ogLibrary!=='undefined'&&Array.isArray(ogLibrary))ogLibrary.forEach(add)}catch(e){}
    (window.UNVRSL_ANATOME_EXERCISES||[]).forEach(add);return{ids,names}
  }
  function catalogMeta(ex,lookup){const sid=String(ex?.sourceId||ex?.rawId||'');if(sid&&lookup.ids.has(sid))return lookup.ids.get(sid);return lookup.names.get(norm(baseName(ex)))||null}
  function slugOf(x){return targetSlug(typeof x==='object'?(x?.slug||x?.tg||x?.target||x?.name):x)}
  function values(x){return Array.isArray(x)?x:x==null?[]:[x]}
  function primary(ex,lookup){
    const meta=catalogMeta(ex,lookup),candidates=[...values(ex?.anatomePrimary),ex?.tg,ex?.target,...values(meta?.anatomePrimary),...values(meta?.anatome_primary_slugs),meta?.tg,meta?.target];
    for(const x of candidates){const slug=slugOf(x);if(slug)return slug}
    try{if(typeof inferCustomMeta==='function'){const x=targetSlug(inferCustomMeta(baseName(ex))?.tg);if(x)return x}}catch(e){}
    return fallback(baseName(ex));
  }
  function declaredSecondary(ex,meta){
    const out=new Set(),all=[...values(ex?.secondary),...values(ex?.secondary_muscles),...values(ex?.anatomeSecondary),...values(meta?.secondary),...values(meta?.secondary_muscles),...values(meta?.anatomeSecondary),...values(meta?.anatome_secondary_slugs)];
    all.forEach(x=>{const slug=slugOf(x);if(slug)out.add(slug)});return out
  }
  function weights(ex,p,meta){
    const n=norm(ex?.n||ex?.name),m=new Map(),add=(s,w)=>{if(s)m.set(s,Math.max(m.get(s)||0,w))};add(p,1);
    declaredSecondary(ex,meta).forEach(slug=>{if(slug!==p)add(slug,.35)});
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

  async function bodyPaths(){
    if(window.UNVRSL_ANATOME_BODY_PATHS)return window.UNVRSL_ANATOME_BODY_PATHS;if(bodyCache)return bodyCache;if(bodyLoading)return bodyLoading;
    let timer;
    const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Карта мышц не ответила вовремя')),8000)});
    bodyLoading=Promise.race([fetch(BODY_URL,{cache:'default'}),timeout]).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}).then(x=>{bodyCache=x;window.UNVRSL_ANATOME_BODY_PATHS=x;return x}).catch(e=>{console.warn('full muscle body',e);return null}).finally(()=>{clearTimeout(timer);bodyLoading=null});return bodyLoading
  }

  function sessions(){
    if(typeof window.unvrslStatsSessions254==='function')return window.unvrslStatsSessions254();
    return Array.isArray(state()?.sessions)?state().sessions:[];
  }
  function sessionDay(session){const raw=session?.date||session?.workout_date||session?.started||session?.payload?.started;if(raw==null)return null;const date=new Date(raw);return Number.isNaN(date.getTime())?null:new Date(date.getFullYear(),date.getMonth(),date.getDate())}
  function legacySession(session){
    return {...session,ex:exercises(session).map(ex=>({...ex,set:setRows(ex).map(set=>({...set,ok:completed(set),w:weightOf(set)??set?.w,r:repsOf(set)??set?.r}))}))};
  }
  function directVolume(session){
    let volume=0,unknown=0;
    for(const ex of exercises(session))for(const set of setRows(ex)){
      if(!completed(set)||set?.warmup===true||set?.isWarmup===true)continue;
      const reps=repsOf(set);if(!(reps>0)){unknown++;continue}
      const type=String(ex?.loadType||ex?.weightProfile?.loadType||'');
      if(/^(time|distance|repetitions_only)$/.test(type)){unknown++;continue}
      const weight=weightOf(set);
      if(/^(bodyweight_only|bodyweight_added|bodyweight_assisted)$/.test(type)){
        const direct=numeric(session?.bodyWeight);const date=String(session?.date||session?.workout_date||'').slice(0,10);
        const history=rows(state()?.bw).filter(row=>String(row?.d||row?.date||'').slice(0,10)<=date).sort((a,b)=>String(a?.d||a?.date||'').localeCompare(String(b?.d||b?.date||'')));
        const body=direct>0?direct:numeric(history.at(-1)?.w??history.at(-1)?.weight);
        if(!(body>0)){unknown++;continue}
        volume+=Math.max(0,body+(type==='bodyweight_assisted'?-(weight??0):(type==='bodyweight_added'?(weight??0):0)))*reps;
      }else if(weight!=null){volume+=weight*reps}
      else unknown++;
    }
    return {volume,unknownVolumeSets:unknown};
  }
  function sessionVolume(session){
    const legacy=legacySession(session);
    try{
      if(window.WorkoutDomain&&typeof workoutRegistry!=='undefined'){
        const result=window.WorkoutDomain.summary(legacy,[],workoutRegistry,state()?.bw||[],{records:false,comparison:false});
        if(Number(result?.volume)>0||Number(result?.unknownVolumeSets)>0)return {volume:Number(result.volume)||0,unknownVolumeSets:Number(result.unknownVolumeSets)||0};
      }
    }catch(error){console.warn('Muscle map canonical tonnage calculation',error)}
    const saved=numeric(session?.advancedMetrics?.tonnage??session?.tonnage);
    if(saved>0)return {volume:saved,unknownVolumeSets:0};
    return directVolume(session);
  }
  function calculate(list,days){
    const cut=new Date();cut.setHours(0,0,0,0);cut.setDate(cut.getDate()-(days-1));const scores=new Map(),lookup=catalogLookup();let sets=0,volume=0,unknownVolumeSets=0;
    list.forEach(s=>{const d=sessionDay(s);if(!d||d<cut||s?.pendingCompletion)return;exercises(s).forEach(ex=>{const n=done(ex);if(!n)return;const meta=catalogMeta(ex,lookup),p=primary(ex,lookup);if(p)weights(ex,p,meta).forEach((w,slug)=>scores.set(slug,(scores.get(slug)||0)+n*w));sets+=n});const result=sessionVolume(s);volume+=result.volume;unknownVolumeSets+=result.unknownVolumeSets});
    return{scores,sets,volume,unknownVolumeSets,rows:[...scores.entries()].filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1])};
  }
  function period(card){return Number(card?.querySelector('[data-days].on')?.dataset.days)||7}
  function topHtml(rows){const max=rows[0]?.[1]||1;return rows.map(([slug,v])=>`<div class="anatome-muscle" data-drilldown="${slug}"><div class="anatome-muscle-row"><b>${LABELS[slug]||slug}</b><span>${v.toFixed(1).replace('.0','')}</span></div><div class="anatome-bar"><i style="width:${Math.max(5,Math.round(v/max*100))}%"></i></div></div>`).join('')}
  function color(slug,scores){const v=scores.get(slug)||0;if(!v)return'#34343a';const max=Math.max(1,...scores.values()),q=v/max;return q>=.67?'#ff375f':accent()}
  function side(side,scores,bodyData){const sex=state()?.body==='female'?'female':'male',parts=bodyData?.[sex]?.[side]||[],paths=[];parts.forEach(part=>{const active=scores.has(part.slug),fill=color(part.slug,scores);Object.values(part.path||{}).flat().forEach(d=>{if(d)paths.push(`<path d="${String(d).replace(/"/g,'&quot;')}" fill="${fill}" opacity="${active?'.98':'.72'}" stroke="rgba(255,255,255,.16)" stroke-width="1.15" vector-effect="non-scaling-stroke"></path>`)})});const vb=side==='back'?'760 140 640 1230':'40 140 640 1230';return `<svg class="anatome-local-side" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${paths.join('')}</svg>`}
  async function render(){
    if(rendering){rerender=true;return}const card=document.getElementById('anatomeMuscleCard');if(!card)return;rendering=true;
    try{
      const days=period(card),list=sessions(),data=calculate(list,days),fig=card.querySelector('.anatome-figure'),top=card.querySelector('.anatome-top'),sub=card.querySelector('.anatome-sub');
      // The numeric result does not depend on the optional anatomy illustration.
      // Render it first so a missing/offline body-path asset cannot strand tonnage at “—”.
      const history=window.unvrslStatsHistoryState254?.(),remoteStatus=history?.status||'ready';
      const waiting=remoteStatus==='loading'&&!list.length,failed=remoteStatus==='error'&&!list.length;
      const tonnage=card.querySelector('.anatome-tonnage-local'),tonnageValue=tonnage?.querySelector('b'),tonnageNote=tonnage?.querySelector('small');if(tonnage){const label=tonnage.querySelector('span');if(label)label.textContent=`Тоннаж за ${days} дней`;if(tonnageValue)tonnageValue.textContent=waiting||failed||data.unknownVolumeSets&&data.volume===0?'— кг':`${data.volume.toLocaleString('ru-RU')} кг`;if(tonnageNote)tonnageNote.textContent=failed?'История пока недоступна. Открой статистику повторно при подключении.':remoteStatus==='loading'?'Синхронизирую историю тренировок…':data.unknownVolumeSets?`Не включено подходов без известной нагрузки: ${data.unknownVolumeSets}`:'Только завершённые подходы'}
      const subtitle=`Последние ${days} дн. · ${data.sets} выполн. подходов`;if(sub&&sub.textContent!==subtitle)sub.textContent=subtitle;
      const topContent=topHtml(data.rows);if(top&&top.innerHTML!==topContent)top.innerHTML=topContent;
      if(!fig)return;
      if(!data.rows.length){const message=waiting?'Синхронизирую историю тренировок…':failed?'История временно недоступна. Попробуй открыть статистику позже.':'Нет распознанных выполненных упражнений за этот период.';const content=`<div class="anatome-empty">${message}</div>`;if(fig.innerHTML!==content)fig.innerHTML=content;return}
      const bodyData=await bodyPaths();if(!bodyData){const content='<div class="anatome-error">Карта мышц временно недоступна. Тоннаж рассчитан по тренировкам.</div>';if(fig.innerHTML!==content)fig.innerHTML=content;return}
      const sig=`${state()?.body||'male'}|${accent()}|${days}|`+data.rows.map(x=>x.join(':')).join('|');if(fig.dataset.full176Sig===sig&&fig.querySelector('.anatome-full-v176'))return;
      fig.dataset.full176Sig=sig;fig.dataset.localSig=sig;
      fig.innerHTML=`<div class="anatome-full-v176" style="width:100%"><div class="anatome-local-dual">${side('front',data.scores,bodyData)}${side('back',data.scores,bodyData)}</div><div class="anatome-local-caption">СПЕРЕДИ · СЗАДИ</div></div>`;
    }catch(error){
      console.warn('full muscle map render',error);
      const card=document.getElementById('anatomeMuscleCard'),note=card?.querySelector('.anatome-tonnage-local small');if(note)note.textContent='Не удалось загрузить тренировочные данные';
      const fig=card?.querySelector('.anatome-figure');if(fig)fig.innerHTML='<div class="anatome-error">Не удалось загрузить статистику. Попробуй открыть её ещё раз.</div>';
    }finally{rendering=false;if(rerender){rerender=false;schedule()}}
  }
  let scheduled=null;function schedule(){if(scheduled!=null)return;scheduled=setTimeout(()=>{scheduled=null;return render()},80)}
  window.unvrslMuscleMapCalculate211=calculate;window.unvrslRefreshMuscleMap211=schedule;
  const root=document.getElementById('stats');if(root)new MutationObserver(()=>{const fig=document.querySelector('#anatomeMuscleCard .anatome-figure');if(fig&&!fig.querySelector('.anatome-full-v176,.anatome-empty,.anatome-error'))schedule()}).observe(root,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target?.closest?.('#anatomeMuscleCard [data-days]'))setTimeout(render,120)},true);
  window.addEventListener('focus',schedule);
  window.addEventListener('unvrsl:stats-history-ready',schedule);
  schedule();
})();
