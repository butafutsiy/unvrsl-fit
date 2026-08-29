'use strict';
(()=>{
 if(window.__unvrslCardioFixV6)return;window.__unvrslCardioFixV6=true;
 const norm=s=>String(s||'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[_–—-]+/g,' ').replace(/\s+/g,' ').trim();
 const tech=e=>String(e?.instructions?.ru||e?.instructions?.russian||'').trim();
 const hasGif=e=>!!String(e?.gif||e?.gif_url||'').trim();
 const isCardioSource=e=>!!e&&!e.custom&&!e.anatome&&String(e.bp||e.body_part||e.category||'').toLowerCase()==='cardio';
 function title(e){const s=norm(`${e?.n||e?.name||''} ${e?.eq||e?.equipment||''}`);if(/incline treadmill/.test(s))return'Ходьба на беговой дорожке под наклоном';if(/treadmill/.test(s))return /walk/.test(s)?'Ходьба на беговой дорожке':'Беговая дорожка';if(/stationary bike/.test(s))return'Велотренажёр';if(/elliptical|cross trainer/.test(s))return'Эллиптический тренажёр';if(/stairmaster|stair master|stair climber|stair machine/.test(s))return'Лестничный тренажёр';if(/stepper/.test(s))return'Степпер';if(/ski.?erg/.test(s))return'Лыжный тренажёр SkiErg';if(/rowing ergometer|rower/.test(s))return'Гребной тренажёр';if(/air bike|assault bike/.test(s))return'Аэробайк';return''}
 function cardioRecords(){const src=Array.isArray(window.ogLibrary)?window.ogLibrary:(typeof ogLibrary!=='undefined'&&Array.isArray(ogLibrary)?ogLibrary:[]),out=[],seen=new Set();for(const e of src){if(!isCardioSource(e)||!hasGif(e)||!tech(e))continue;const t=title(e);if(!t)continue;const k=t.toLowerCase();if(seen.has(k))continue;seen.add(k);out.push({...e,id:String(e.id).startsWith('og:')?e.id:`og:${e.id}`,rawId:e.rawId||e.id,bp:'cardio',tg:'cardiovascular system',eq:'cardio',kind:'cardio',tracking:'cardio',cardioMetrics:/air bike|assault bike|stair|stepper/.test(norm(`${e.n} ${e.eq}`))?['time','calories']:['time','distance','calories'],__ruTitle:t,__ruInstruction:tech(e),__source:'ExerciseDB dataset',__mediaSource:'Gym visual',custom:false})}return out}
 try{if(typeof EQ_RU==='object')EQ_RU.cardio='Кардио-тренажёр'}catch(_){}
 const oldRecords=window.UNVRSL_CATALOG_RECORDS;
 window.UNVRSL_CATALOG_RECORDS=function(){const base=typeof oldRecords==='function'?(oldRecords()||[]):[],out=[],seen=new Set();for(const e of [...base,...cardioRecords()]){const k=String(e?.id||e?.rawId||e?.__ruTitle||e?.n||'');if(!k||seen.has(k))continue;seen.add(k);out.push(e)}return out};
 const oldTitle=window.UNVRSL_CATALOG_TITLE;window.UNVRSL_CATALOG_TITLE=e=>e?.__ruTitle||(typeof oldTitle==='function'?oldTitle(e):String(e?.n||''));
 const oldGroup=window.equipmentGroup||((typeof equipmentGroup==='function')?equipmentGroup:null);const group=e=>String(e?.bp||'').toLowerCase()==='cardio'?'cardio':(typeof oldGroup==='function'?oldGroup(e):String(e?.eq||''));window.equipmentGroup=group;try{equipmentGroup=group}catch(_){}
 try{if(Array.isArray(EQUIPMENT_FILTERS)&&!EQUIPMENT_FILTERS.some(x=>x?.[0]==='cardio'))EQUIPMENT_FILTERS.push(['cardio','Кардио'])}catch(_){}
 window.UNVRSL_CARDIO_RECORDS_V6=cardioRecords;
 setTimeout(()=>{try{if(document.querySelector('#exercises.page.active'))renderExerciseResults()}catch(_){}},100);
})();