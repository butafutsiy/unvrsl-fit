'use strict';
(()=>{
  if(window.__unvrslAnatomeLocalV2)return;
  window.__unvrslAnatomeLocalV2=true;

  const BODY_URL='./data/anatome-body-paths.json';
  const EX_URL='./data/anatome-exercises.json';
  const OVERLOAD='#ff375f';
  let bodyData=null,anatomeExercises=[];

  const accent=()=>String(window.st?.accent||getComputedStyle(document.documentElement).getPropertyValue('--green')||'#30d158').trim()||'#30d158';
  const rgba=(hex,a)=>{const m=String(hex).trim().match(/^#([0-9a-f]{6})$/i);if(!m)return`rgba(48,209,88,${a})`;const n=parseInt(m[1],16);return`rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`};

  const style=document.createElement('style');
  style.id='anatome-local-v2-style';
  style.textContent=`
    #stats .stats-muscle-week{display:none!important}
    #anatomeMuscleCard .anatome-body{grid-template-columns:1fr!important;gap:16px!important}
    #anatomeMuscleCard .anatome-figure{min-height:440px!important;padding:0!important}
    #anatomeMuscleCard .anatome-figure>img{display:none!important}
    #anatomeMuscleCard .anatome-local-dual{display:grid;grid-template-columns:1fr 1fr;gap:2px;width:100%;height:440px;align-items:center}
    #anatomeMuscleCard .anatome-local-side{height:430px;width:100%;display:block;overflow:visible}
    #anatomeMuscleCard .anatome-local-side path{transition:fill .2s ease,opacity .2s ease;stroke:rgba(255,255,255,.16);stroke-width:1.15;vector-effect:non-scaling-stroke}
    #anatomeMuscleCard .anatome-local-caption{text-align:center;color:#74747a;font-size:11px;margin-top:-18px;pointer-events:none}
    #anatomeMuscleCard .anatome-tonnage-local{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:2px 0 14px;padding:14px 16px;background:#17171a;border:1px solid #2b2c31;border-radius:17px}
    #anatomeMuscleCard .anatome-tonnage-local span{color:#8e8e93;font-size:13px}
    #anatomeMuscleCard .anatome-tonnage-local b{font-size:22px;font-variant-numeric:tabular-nums}
    #anatomeMuscleCard .anatome-top{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    #anatomeMuscleCard .anatome-muscle[data-load-level="3"] .anatome-bar i{background:${OVERLOAD}!important}
    @media(max-width:430px){#anatomeMuscleCard .anatome-figure{min-height:400px!important}#anatomeMuscleCard .anatome-local-dual{height:400px}#anatomeMuscleCard .anatome-local-side{height:390px}}
  `;
  document.head.appendChild(style);

  const BODY_PART={abs:'waist',obliques:'waist',chest:'chest',deltoids:'shoulders',triceps:'upper arms',biceps:'upper arms',forearm:'lower arms','upper-back':'back',trapezius:'back','lower-back':'back',quadriceps:'upper legs',hamstring:'upper legs',gluteal:'upper legs',adductors:'upper legs',calves:'lower legs',tibialis:'lower legs'};
  const TARGET={abs:'abs',obliques:'abs',chest:'pectorals',deltoids:'delts',triceps:'triceps',biceps:'biceps',forearm:'forearms','upper-back':'lats',trapezius:'traps','lower-back':'spine',quadriceps:'quads',hamstring:'hamstrings',gluteal:'glutes',adductors:'adductors',calves:'calves',tibialis:'calves'};
  const EQ={'body only':'body weight','bodyweight':'body weight','barbell':'barbell','dumbbell':'dumbbell','dumbbells':'dumbbell','cable':'cable','machine':'leverage machine','other':'leverage machine','kettlebells':'kettlebell','kettlebell':'kettlebell','e-z curl bar':'ez barbell','ez bar':'ez barbell','bands':'band','band':'band','exercise ball':'stability ball','foam roll':'roller','medicine ball':'medicine ball'};
  const canon=s=>String(s||'').toLowerCase().replace(/[^a-zа-яё0-9]+/gi,' ').replace(/\s+/g,' ').trim();

  function localExercise(x){
    const primary=String(x?.anatome_primary_slugs?.[0]||'');
    const secondary=(x?.anatome_secondary_slugs||[]).map(s=>TARGET[s]||s);
    const rawInstructions=Array.isArray(x.instructions)?x.instructions.join('\n'):String(x.instructions||'').trim();
    return {
      id:String(x.ext_id||x.name||`anatome-${Math.random()}`),
      n:x.name||'Exercise',
      sourceName:x.name||'',
      bp:BODY_PART[primary]||String(x.category||''),
      tg:TARGET[primary]||primary,
      eq:EQ[String(x.equipment||'').toLowerCase()]||String(x.equipment||'').toLowerCase()||'body weight',
      secondary,
      instructions:{ru:rawInstructions,en:rawInstructions},
      image:'',gif:'',attribution:'Anatome',mediaId:'',custom:false,anatome:true,
      anatomePrimary:x.anatome_primary_slugs||[],anatomeSecondary:x.anatome_secondary_slugs||[],
      level:x.level||'',force:x.force||'',mechanic:x.mechanic||'',category:x.category||''
    };
  }

  function mergeExercises(){
    if(typeof ogLibrary==='undefined'||!Array.isArray(ogLibrary)||!anatomeExercises.length)return 0;
    const byName=new Map();
    ogLibrary.forEach(e=>{const k=canon(e?.n);if(k&&!byName.has(k))byName.set(k,e)});
    const ids=new Set(ogLibrary.map(e=>String(e.id)));let added=0,enriched=0;
    anatomeExercises.forEach(a=>{
      const k=canon(a.n),existing=byName.get(k);
      if(existing){
        existing.anatomePrimary=a.anatomePrimary;
        existing.anatomeSecondary=a.anatomeSecondary;
        existing.anatomeMeta=true;
        if((!Array.isArray(existing.secondary)||!existing.secondary.length)&&a.secondary.length)existing.secondary=[...a.secondary];
        if(!existing.bp&&a.bp)existing.bp=a.bp;
        if(!existing.tg&&a.tg)existing.tg=a.tg;
        if(!existing.eq&&a.eq)existing.eq=a.eq;
        enriched++;return;
      }
      let id=String(a.id);if(ids.has(id))id=`anatome-${id}`;a.id=id;
      ogLibrary.push(a);ids.add(id);if(k)byName.set(k,a);added++;
    });
    try{ogLibraryLoaded=true}catch(_){ }
    window.UNVRSL_ANATOME_MERGE={added,enriched,total:anatomeExercises.length};
    return added;
  }
  function refreshMerged(){const added=mergeExercises();if(added){try{if(typeof refreshCatalogUI==='function')refreshCatalogUI()}catch(_){ }}}
  async function loadExercises(){try{const r=await fetch(EX_URL,{cache:'default'});if(!r.ok)throw new Error(`HTTP ${r.status}`);const d=await r.json();if(!Array.isArray(d))throw new Error('bad Anatome dataset');anatomeExercises=d.map(localExercise);window.UNVRSL_ANATOME_EXERCISES=anatomeExercises;refreshMerged();let tries=0;const timer=setInterval(()=>{refreshMerged();if(++tries>=24)clearInterval(timer)},500)}catch(e){console.warn('local Anatome exercises',e)}}

  function weekTonnage(){const cut=new Date();cut.setHours(0,0,0,0);cut.setDate(cut.getDate()-6);let total=0;(st?.sessions||[]).forEach(s=>{const d=new Date(String(s?.date||'')+'T12:00:00');if(Number.isNaN(d.getTime())||d<cut)return;(s.ex||[]).forEach(e=>(e.set||[]).forEach(x=>{if(!x?.ok)return;const w=Number(x.w),r=Number(x.r);if(Number.isFinite(w)&&Number.isFinite(r)&&w>0&&r>0)total+=w*r}))});return Math.round(total)}

  function scoresFromCard(card){
    const rows=[];card.querySelectorAll('.anatome-muscle').forEach(el=>{const val=Number(String(el.querySelector('.anatome-muscle-row span')?.textContent||'0').replace(',','.'))||0;const drill=el.dataset.drilldown||'';if(drill&&val>0)rows.push([drill,val,el])});
    rows.sort((a,b)=>b[1]-a[1]);const max=rows[0]?.[1]||1;rows.forEach(([,v,el])=>{const q=v/max;el.dataset.loadLevel=q>=.67?'3':q>=.34?'2':'1';const bar=el.querySelector('.anatome-bar i');if(bar&&q<.67)bar.style.setProperty('background',accent(),'important')});return new Map(rows.map(([s,v])=>[s,v]));
  }
  function colorFor(slug,scores){const v=scores.get(slug)||0;if(!v)return'#34343a';const max=Math.max(1,...scores.values()),q=v/max;return q>=.67?OVERLOAD:accent()}
  function sideSvg(side,scores){const body=window.st?.body==='female'?'female':'male',parts=bodyData?.[body]?.[side]||[],paths=[];parts.forEach(part=>{const fill=colorFor(part.slug,scores),active=scores.has(part.slug),opacity=active?'.98':'.72';Object.values(part.path||{}).flat().forEach(d=>{if(d)paths.push(`<path d="${String(d).replace(/"/g,'&quot;')}" fill="${fill}" opacity="${opacity}" data-muscle="${part.slug}"></path>`)})});const viewBox=side==='back'?'760 140 640 1230':'40 140 640 1230';return `<svg class="anatome-local-side" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" aria-label="${side==='front'?'Мышцы спереди':'Мышцы сзади'}">${paths.join('')}</svg>`}
  async function loadBody(){if(bodyData)return bodyData;try{const r=await fetch(BODY_URL,{cache:'default'});if(!r.ok)throw new Error(`HTTP ${r.status}`);bodyData=await r.json();window.UNVRSL_ANATOME_BODY_PATHS=bodyData;return bodyData}catch(e){console.warn('local Anatome body',e);return null}}
  async function upgradeCard(){const card=document.getElementById('anatomeMuscleCard');if(!card)return;const old=document.querySelector('#stats .stats-muscle-week');if(old)old.style.display='none';const a=accent();const fig=card.querySelector('.anatome-figure');if(fig)fig.style.background=`radial-gradient(circle at 50% 42%,${rgba(a,.10)},${rgba(a,.035)} 46%,transparent 72%)`;let ton=card.querySelector('.anatome-tonnage-local');if(!ton){ton=document.createElement('div');ton.className='anatome-tonnage-local';ton.innerHTML='<span>Недельный тоннаж</span><b></b>';const body=card.querySelector('.anatome-body');body?.before(ton)}const tb=ton.querySelector('b');if(tb)tb.textContent=`${weekTonnage().toLocaleString('ru-RU')} кг`;const scores=scoresFromCard(card);if(!scores.size)return;if(!await loadBody())return;if(!fig)return;const sig=`${window.st?.body||'male'}|${a}|`+[...scores.entries()].map(x=>x.join(':')).join('|');if(fig.dataset.localSig===sig)return;fig.dataset.localSig=sig;fig.innerHTML=`<div style="width:100%"><div class="anatome-local-dual">${sideSvg('front',scores)}${sideSvg('back',scores)}</div><div class="anatome-local-caption">СПЕРЕДИ · СЗАДИ</div></div>`}
  function watch(){const root=document.getElementById('stats');if(!root)return;let queued=false;const run=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;upgradeCard()})};new MutationObserver(run).observe(root,{childList:true,subtree:true,characterData:true});run()}

  loadExercises();if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
})();
