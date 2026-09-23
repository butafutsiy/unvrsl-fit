'use strict';
(()=>{
  if(window.__unvrslAnatomeLocalV2)return;
  window.__unvrslAnatomeLocalV2=true;

  const EX_URL='./data/anatome-exercises.json';
  const OVERLOAD='#ff375f';
  let anatomeExercises=[];

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
    #anatomeMuscleCard .anatome-tonnage-local{display:grid;grid-template-columns:1fr auto;align-items:center;gap:6px 12px;margin:2px 0 14px;padding:14px 16px;background:#17171a;border:1px solid #2b2c31;border-radius:17px}
    #anatomeMuscleCard .anatome-tonnage-local span{color:#8e8e93;font-size:13px}
    #anatomeMuscleCard .anatome-tonnage-local b{font-size:22px;font-variant-numeric:tabular-nums}
    #anatomeMuscleCard .anatome-tonnage-local small{grid-column:1/-1;color:#73737a;font-size:11px}
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

  // The anatomy dataset is used by muscle maps only. It must never append exercises to the canonical catalog.
  async function loadExercises(){try{const r=await fetch(EX_URL,{cache:'default'});if(!r.ok)return;const d=await r.json();if(Array.isArray(d)){anatomeExercises=d.map(localExercise);window.UNVRSL_ANATOME_EXERCISES=anatomeExercises}}catch(e){console.warn('Anatomy metadata unavailable',e)}}


  loadExercises();
})();
