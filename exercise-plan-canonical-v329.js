'use strict';
(()=>{
  if(window.__unvrslPlanExerciseCanonicalV329)return;
  window.__unvrslPlanExerciseCanonicalV329=true;

  const RELEASE=331;
  const norm=s=>String(s||'')
    .toLowerCase().replace(/ё/g,'е').replace(/[–—]/g,'-')
    .replace(/[()]/g,' ').replace(/[_.:,/\\]+/g,' ')
    .replace(/\s*-\s*/g,' ').replace(/\s+/g,' ').trim();
  const stripPlanName=raw=>{
    let s=String(raw||'').trim();
    try{if(typeof baseExerciseName==='function')s=baseExerciseName(s)}catch(_){ }
    s=s.replace(/^\s*(?:разминка|кардио)\s*·\s*/i,'')
      .replace(/^\s*\d+\s*[A-CА-С]?\s*·\s*/i,'')
      .replace(/\s+[–—-]\s+(?:UNVRSL\s+\d+\/\d+|SLDR\s+\d+\/\d+|DS\s+DS?\d+|FST-7(?:\s+\d+\/\d+)?|тест.*|back-off.*|тяж[её]л.*|л[её]гк.*|субмакс.*|W\d+).*$/i,'')
      .trim();
    return s
  };
  const ruTech=e=>{const i=e?.instructions||{};return typeof i==='string'?i.trim():String(i.ru||i.russian||'').trim()};

  const specs=[];
  const add=(key,ru,aliases,queries,opt={})=>specs.push({
    key,ru,aliases:[ru,...aliases],queries,
    eq:Array.isArray(opt.eq)?opt.eq:(opt.eq?[opt.eq]:[]),
    strictEq:!!opt.strictEq,exclude:opt.exclude||[],bp:opt.bp||'',tg:opt.tg||'',show:!!opt.show
  });

  add('high_bar_squat','Присед со штангой high-bar',['Присед HB'],['barbell high bar squat','barbell full squat'],{eq:['barbell','olympic barbell'],bp:'upper legs',tg:'quads'});
  add('leg_press','Жим ногами в тренажёре',['Жим ногами'],['lever seated leg press','sled 45 leg press','leg press'],{eq:['sled machine','leverage machine'],bp:'upper legs',tg:'quads'});
  add('leg_extension','Разгибание ног в тренажёре',['Разгибание ног'],['lever leg extension','leg extension'],{eq:'leverage machine',bp:'upper legs',tg:'quads'});
  add('hip_adduction','Сведение ног в тренажёре',['Сведение ног'],['lever seated hip adduction','hip adduction','adductor'],{eq:'leverage machine',bp:'upper legs',tg:'adductors'});
  add('calf_machine','Подъём на носки в тренажёре',['Икры','Подъём на носки в тренажёре'],['lever standing calf raise','standing calf raise','calf raise'],{eq:['leverage machine','sled machine','weighted'],bp:'lower legs',tg:'calves'});
  add('bench_press','Жим штанги лёжа',['Жим лёжа'],['barbell bench press'],{eq:['barbell','olympic barbell'],bp:'chest',tg:'pectorals'});
  add('incline_db_press','Жим гантелей на наклонной скамье',['Жим гантелей на наклонной','Наклонный жим гантелей'],['dumbbell incline bench press'],{eq:'dumbbell',bp:'chest',tg:'pectorals'});
  add('pec_deck','Сведение рук в тренажёре',['Бабочка','Разводка / бабочка'],['lever pec deck fly','pec deck fly','lever chest fly'],{eq:'leverage machine',bp:'chest',tg:'pectorals'});
  add('db_shoulder_press','Жим гантелей сидя',['Жим гантелей над головой'],['dumbbell seated shoulder press','dumbbell shoulder press'],{eq:'dumbbell',bp:'shoulders',tg:'delts'});
  add('lateral_raise','Махи гантелями в стороны',['Махи в стороны','Махи гантелями','Махи гантелями в стороны'],['dumbbell lateral raise'],{eq:'dumbbell',bp:'shoulders',tg:'delts'});
  add('cable_crossover','Сведение рук в кроссовере',['Кроссовер'],['cable crossover','cable fly'],{eq:'cable',bp:'chest',tg:'pectorals',exclude:['one arm','single arm']});
  add('preacher_ez','Сгибание рук на скамье Скотта с EZ-штангой',['EZ / скамья Скотта'],['ez barbell preacher curl','barbell preacher curl','preacher curl'],{eq:['ez barbell','barbell'],bp:'upper arms',tg:'biceps'});
  add('cable_rope_hammer','Молотковые сгибания на нижнем блоке с канатом',['Молотковые сгибания с канатом'],['cable rope hammer curl','cable hammer curl','rope hammer curl'],{eq:['cable','rope'],bp:'upper arms',tg:'biceps',show:true});
  add('weighted_pushup','Отжимания с дополнительным весом',[],['weighted push up','weighted push-up','push up'],{eq:['weighted','body weight'],bp:'chest',tg:'pectorals'});
  add('barbell_row','Тяга штанги в наклоне',[],['barbell bent over row'],{eq:['barbell','olympic barbell'],bp:'back',tg:'upper back'});
  add('weighted_pullup','Подтягивания с дополнительным весом',['Подтягивания с весом','Подтягивания'],['weighted pull up','weighted pull-up','pull up'],{eq:['weighted','body weight'],bp:'back',tg:'lats',exclude:['assisted']});
  add('tbar_row','Тяга Т-грифа',[],['lever t bar row','t bar row','t-bar row'],{eq:['leverage machine','barbell'],bp:'back',tg:'upper back'});
  add('lat_pulldown','Тяга верхнего блока',['Верхний блок','Тяга вертикального блока','Вертикальная тяга'],['cable lat pulldown','cable bar lateral pulldown','lat pulldown'],{eq:'cable',bp:'back',tg:'lats',exclude:['one arm','single arm','straight arm','behind neck']});
  add('seated_cable_row','Горизонтальная тяга нижнего блока',['Нижний блок','Тяга горизонтального блока'],['cable seated row','seated cable row'],{eq:'cable',bp:'back',tg:'upper back',exclude:['one arm','single arm']});
  add('machine_shoulder_press','Жим в тренажёре на плечи',['Жим плеч в тренажёре'],['lever shoulder press','machine shoulder press'],{eq:'leverage machine',bp:'shoulders',tg:'delts'});
  add('rear_delt','Разведение на заднюю дельту',['Задняя дельта'],['dumbbell rear delt fly','dumbbell reverse fly','rear delt fly'],{eq:['dumbbell','leverage machine'],bp:'shoulders',tg:'delts'});
  add('ez_lying_triceps','Французский жим с EZ-штангой лёжа',['Французский жим EZ','Французский жим'],['ez barbell lying triceps extension','ez barbell skull crusher','lying triceps extension'],{eq:['ez barbell','barbell'],bp:'upper arms',tg:'triceps',show:true});
  add('rope_pushdown','Разгибание рук на верхнем блоке с канатом',['Канат на трицепс','Разгибание рук с канатом-косичкой','Трицепс с канатом-косичкой'],['cable rope pushdown','rope triceps pushdown','rope pushdown'],{eq:['cable','rope'],bp:'upper arms',tg:'triceps'});
  add('weighted_hyperextension','Гиперэкстензия с дополнительным весом',['Гиперэкстензия с диском'],['weighted hyperextension','weighted back extension','hyperextension'],{eq:['weighted','body weight'],bp:'back',tg:'spine',show:true});
  add('barbell_rdl','Румынская тяга со штангой',['Румынская тяга'],['barbell romanian deadlift'],{eq:['barbell','olympic barbell'],bp:'upper legs',tg:'hamstrings'});
  add('barbell_hip_thrust','Хип-траст со штангой',['Ягодичный мост','Ягодичный мост со штангой','Хип траст','Хип-траст'],['barbell hip thrust','hip thrust'],{eq:['barbell','leverage machine'],bp:'upper legs',tg:'glutes',show:true,exclude:['single leg','one leg']});
  add('lying_leg_curl','Сгибание ног лёжа в тренажёре',['Сгибание ног лёжа','Сгибание ног'],['lever lying leg curl','lying leg curl'],{eq:'leverage machine',bp:'upper legs',tg:'hamstrings'});
  add('reverse_lunge_db','Выпады назад с гантелями',['Выпады назад'],['dumbbell rear lunge','dumbbell reverse lunge','reverse lunge'],{eq:'dumbbell',bp:'upper legs',tg:'quads',show:true});
  add('stepup_db','Зашагивания на платформу с гантелями',['Зашагивания'],['dumbbell step up','dumbbell step-up','step up'],{eq:'dumbbell',bp:'upper legs',tg:'quads',show:true});
  add('hip_abduction','Разведение ног в тренажёре',['Разведение ног'],['lever seated hip abduction','hip abduction','abductor'],{eq:'leverage machine',bp:'upper legs',tg:'abductors'});
  add('barbell_curl','Сгибание рук со штангой',['Подъём штанги на бицепс'],['barbell curl'],{eq:['barbell','olympic barbell'],bp:'upper arms',tg:'biceps'});
  add('military_press','Армейский жим стоя',['Армейский жим'],['barbell standing military press','barbell military press','military press'],{eq:['barbell','olympic barbell'],bp:'shoulders',tg:'delts'});
  add('db_overhead_triceps','Разгибание одной гантели из-за головы',['Разгибание гантели из-за головы'],['dumbbell one arm triceps extension','dumbbell seated triceps extension','dumbbell standing triceps extension','dumbbell triceps extension'],{eq:'dumbbell',bp:'upper arms',tg:'triceps',show:true,exclude:['lying','kickback']});
  add('db_supination_curl','Сгибание гантелей с супинацией',[],['dumbbell biceps curl','dumbbell alternate biceps curl','dumbbell curl'],{eq:'dumbbell',bp:'upper arms',tg:'biceps',show:true,exclude:['hammer','reverse','preacher','concentration','incline']});
  add('db_hammer_curl','Молотковые сгибания с гантелями',['Молотковые сгибания'],['dumbbell hammer curl'],{eq:'dumbbell',bp:'upper arms',tg:'biceps'});
  add('cable_curl','Сгибание рук на нижнем блоке',['Сгибание рук в блоке'],['cable biceps curl','cable curl'],{eq:'cable',bp:'upper arms',tg:'biceps',exclude:['reverse','hammer','preacher','one arm','single arm']});
  add('db_lying_triceps','Французский жим с гантелями лёжа',['Французский жим с гантелями'],['dumbbell lying triceps extension','dumbbell skull crusher'],{eq:'dumbbell',bp:'upper arms',tg:'triceps',show:true});

  add('kettlebell_snatch','Рывок гири',[],['kettlebell one arm snatch','kettlebell snatch','snatch'],{eq:'kettlebell',strictEq:true,bp:'upper arms',tg:'delts',show:true});
  add('cable_reverse_curl','Сгибание рук на нижнем блоке обратным хватом',['Сгибание рук в блоке обратным хватом','Бицепс в блоке обратным хватом','Бицепс обратным хватом'],['cable reverse grip biceps curl','cable reverse grip curl','cable reverse curl'],{eq:'cable',bp:'lower arms',tg:'forearms',show:true});
  add('machine_chest_press','Жим в тренажёре на грудь',['Жим в тренажёре'],['lever chest press','machine chest press','chest press'],{eq:'leverage machine',bp:'chest',tg:'pectorals'});
  add('one_arm_lat_pulldown','Тяга верхнего блока одной рукой',['Вертикальная тяга одной рукой'],['cable one arm lat pulldown','cable single arm lat pulldown','cable one arm pulldown','one arm lat pulldown'],{eq:'cable',bp:'back',tg:'lats',show:true});
  add('decline_crunch','Скручивания на наклонной скамье',['Скручивания на скамье','Скручивания с небольшим весом'],['decline crunch','incline sit up','decline sit up','sit up'],{eq:['body weight','weighted'],bp:'waist',tg:'abs',show:true});
  add('box_jump','Запрыгивания на тумбу',['Запрыгивания'],['box jump','jump box'],{eq:['body weight','weighted'],bp:'upper legs',tg:'quads',show:true});
  add('hack_squat','Гакк-присед',['Приседания в гакк-машине'],['sled hack squat','lever hack squat','hack squat'],{eq:['sled machine','leverage machine'],bp:'upper legs',tg:'quads'});
  add('one_arm_machine_row','Горизонтальная тяга в тренажёре одной рукой',['Тяга в тренажёре одной рукой','Тяга одной рукой'],['lever one arm row','lever seated one arm row','lever one arm bent over row','one arm row'],{eq:'leverage machine',strictEq:true,bp:'back',tg:'upper back',show:true});
  add('assisted_pullup','Подтягивания в гравитроне',[],['assisted pull up','assisted pull-up'],{eq:'assisted',bp:'back',tg:'lats'});
  add('straight_bar_pushdown','Разгибание рук на верхнем блоке с прямой рукоятью',['Разгибание рук с прямой рукоятью','Трицепс с прямой рукоятью','Разгибание рук на верхнем блоке'],['cable pushdown','cable triceps pushdown','triceps pushdown'],{eq:'cable',bp:'upper arms',tg:'triceps',show:true,exclude:['rope','v bar','one arm','single arm']});
  add('captain_leg_raise','Подъём ног в упоре на брусьях',['Подъём ног на брусьях','Подъём ног'],['captains chair leg raise','captain chair leg raise','vertical leg raise','hanging leg raise'],{eq:['body weight','assisted'],bp:'waist',tg:'abs',show:true});
  add('russian_twist','Русские повороты',['Русские твисты','Русские твисты с небольшим весом'],['russian twist'],{eq:['body weight','weighted','medicine ball'],bp:'waist',tg:'abs'});

  add('high_to_low_crossover','Сведение рук в кроссовере сверху вниз',['Сведение в кроссовере на низ груди','Кроссовер сверху вниз'],['cable high to low fly','cable standing fly high pulley','cable crossover'],{eq:'cable',bp:'chest',tg:'pectorals',exclude:['low to high']});
  add('smith_bent_row','Тяга штанги в наклоне в Смите',['Тяга в наклоне в Смите','Тяга штанги в Смите в наклоне'],['smith bent over row','smith machine bent over row','bent over row'],{eq:'smith machine',strictEq:true,bp:'back',tg:'upper back',show:true});
  add('one_arm_db_row','Тяга гантели к поясу одной рукой',['Тяга гантели одной рукой к поясу','Тяга гантели одной рукой'],['dumbbell one arm bent over row','dumbbell one arm row','dumbbell row'],{eq:'dumbbell',strictEq:true,bp:'back',tg:'upper back',show:true,exclude:['rear delt']});
  add('calf_raise_sergey','Подъём на носки в тренажёре',[],['lever standing calf raise','lever seated calf raise','calf raise'],{eq:['leverage machine','sled machine'],bp:'lower legs',tg:'calves'});

  add('db_pullover','Пуловер с одной гантелью лёжа',['Пуловер с гантелью'],['dumbbell pullover'],{eq:'dumbbell',strictEq:true,bp:'chest',tg:'pectorals',show:true});
  add('cable_pullover','Пуловер в кроссовере',['Пуловер на верхнем блоке прямыми руками','Пуловер на верхнем блоке'],['cable straight arm pulldown','cable pullover','straight arm pulldown'],{eq:'cable',strictEq:true,bp:'back',tg:'lats',show:true});
  add('cable_one_arm_overhead_triceps','Разгибание одной руки из-за головы на блоке',[],['cable one arm overhead triceps extension','cable one arm triceps extension','one arm triceps extension'],{eq:'cable',strictEq:true,bp:'upper arms',tg:'triceps',show:true,exclude:['pushdown']});

  // Only the explicitly reviewed names below gain aliases. No substring aliases.
  const additions={
    tbar_row:['Т-гриф'],db_supination_curl:['Сгибания с супинацией'],
    kettlebell_snatch:['Рывок гири одной рукой'],
    db_pullover:['Пуловер с одной гантелью'],
    cable_one_arm_overhead_triceps:['Разгибание руки из-за головы в кроссовере']
  };
  specs.forEach(s=>{if(additions[s.key])s.aliases.push(...additions[s.key])});
  const cablePullover=specs.find(s=>s.key==='cable_pullover');
  cablePullover.ru='Пуловер с верхнего блока с рукояткой стоя';cablePullover.aliases.push(cablePullover.ru);
  specs.find(s=>s.key==='barbell_hip_thrust').eq=['barbell'];
  specs.find(s=>s.key==='weighted_hyperextension').eq=['weighted'];
  specs.find(s=>s.key==='weighted_pushup').eq=['weighted'];
  specs.find(s=>s.key==='kettlebell_snatch').bp='shoulders';
  specs.splice(specs.findIndex(s=>s.key==='calf_raise_sergey'),1);
  const pendingTechnique={
    barbell_hip_thrust:'Обопрись верхней частью спины на устойчивую скамью. Расположи штангу с мягкой накладкой на сгибе бёдер. Подними таз, сохраняя рёбра опущенными и опору на стопы. Вверху выровняй корпус и бёдра без переразгибания поясницы. Плавно опусти таз.',
    weighted_hyperextension:'Настрой опору ниже сгиба бёдер, закрепи стопы и прижми диск к груди. Наклоняйся за счёт движения в тазобедренных суставах, удерживая спину нейтрально. Поднимись до прямой линии корпуса и ног, без рывка и переразгибания поясницы.',
    box_jump:'Выбери устойчивую тумбу подходящей высоты. Сделай небольшой подсед, оттолкнись двумя ногами и приземлись на тумбу обеими стопами с мягкими коленями. Выпрямись и спокойно сойди с тумбы. Это запрыгивание вверх, не спрыгивание вниз.',
    weighted_pushup:'Надёжно закрепи дополнительное отягощение. Сохраняй корпус прямым, опускайся контролируемо и выжимай себя вверх без провисания поясницы.'
  };
  const aliasMap=new Map();
  specs.forEach(s=>s.aliases.forEach(a=>aliasMap.set(norm(stripPlanName(a)),s)));
  const byKey=new Map(specs.map(s=>[s.key,s]));
  byKey.set('calf_raise_sergey',byKey.get('calf_machine'));

  function specForName(raw,context=''){
    const key=norm(stripPlanName(raw));
    if(context==='sergey'&&key==='французский жим')return byKey.get('ez_lying_triceps')||null;
    return aliasMap.get(key)||specs.find(s=>resolve(s)&&norm(resolve(s).n)===key)||null
  }

  function resolve(spec){
    if(!spec)return null;
    // Pinned record includes a checked name, equipment and GIF. Never substitute
    // another movement when the requested variant is absent from the dataset.
    return window.UNVRSL_VERIFIED_EXERCISE_MEDIA_V331?.[spec.key]||null
  }

  function canonicalRecord(spec){
    if(!spec)return null;const src=resolve(spec),sid=src?String(src.id):'';
    return {...(src||{}),id:`canon:${spec.key}`,n:spec.ru,strictName:spec.ru,raw:spec.ru,rawId:sid,sourceId:sid||null,sourceName:src?.n||'',bp:spec.bp||src?.bp||'',tg:spec.tg||src?.tg||'',eq:spec.eq[0]||src?.eq||'',gif:src?.gif||'',image:src?.image||'',instructions:src?.instructions||{ru:pendingTechnique[spec.key]||''},mediaUnavailable:!src,custom:false,canonical:true,canonicalKey:spec.key}
  }

  function sameWantedRow(e,spec,src){
    const raw=norm(stripPlanName(e?.raw||e?.n||''));
    if(spec.aliases.some(a=>norm(stripPlanName(a))===raw))return true;
    const title=norm(e?.strictName||e?.curatedName||'');
    if(title&&spec.aliases.some(a=>norm(a)===title))return true;
    const sid=String(e?.rawId||e?.sourceId||e?.id||'').replace(/^og:/,'');return !!sid&&!!src&&sid===String(src.id)
  }

  function installCatalog(){
    window.UNVRSL_MERGE_EXERCISE_CATALOG_V331=function(input){
      let rows=Array.isArray(input)?input.slice():[];
      for(const spec of specs){
        const src=resolve(spec),exists=rows.some(e=>sameWantedRow(e,spec,src));
        if(!spec.show&&!exists)continue;
        rows=rows.filter(e=>!sameWantedRow(e,spec,src));rows.push(canonicalRecord(spec))
      }
      const seen=new Set();return rows.filter(e=>{const key=norm(e.strictName||e.curatedName||e.n);if(seen.has(key))return false;seen.add(key);return true})
    }
  }

  function installMedia(){
    const base=window.findMediaForCustom||(()=>{try{return findMediaForCustom}catch(_){return null}})();
    if(typeof base!=='function'||base.__canonicalV329)return;
    const wrapped=function(raw=''){
      const spec=specForName(raw);return spec?resolve(spec):(base.apply(this,arguments)||null)
    };
    wrapped.__canonicalV329=true;wrapped.__canonicalBase=base;window.findMediaForCustom=wrapped;try{findMediaForCustom=wrapped}catch(_){ }
  }

  function installFindExercise(){
    const base=window.findExercise||(()=>{try{return findExercise}catch(_){return null}})();
    if(typeof base!=='function'||base.__canonicalV329)return;
    const wrapped=function(token){
      const id=decodeURIComponent(String(token||''));
      if(id.startsWith('canon:'))return canonicalRecord(byKey.get(id.slice(6)))||null;
      if(id.startsWith('og:')){const spec=specs.find(s=>resolve(s)?.id===id.slice(3));if(spec)return canonicalRecord(spec)}
      const ex=base.apply(this,arguments);if(!ex)return ex;
      if(id.startsWith('custom:')){
        const raw=id.slice(7),spec=specForName(raw),src=resolve(spec),title=spec?.ru||(typeof displayExerciseName==='function'?displayExerciseName(raw):raw);
        if(spec)return {...canonicalRecord(spec),id,raw,planRaw:raw};
        return {...ex,n:title,raw,sourceName:ex.sourceName||((ex.n&&norm(ex.n)!==norm(title))?ex.n:'')}
      }
      return ex
    };
    wrapped.__canonicalV329=true;wrapped.__canonicalBase=base;window.findExercise=wrapped;try{findExercise=wrapped}catch(_){ }
  }

  function installOpenByName(){
    const base=window.openExerciseDetailByName||(()=>{try{return openExerciseDetailByName}catch(_){return null}})();
    if(typeof base!=='function'||base.__canonicalV329)return;
    const wrapped=function(token){
      const raw=decodeURIComponent(String(token||'')),spec=specForName(raw),card=canonicalRecord(spec);
      if(card&&typeof renderExerciseDetail==='function'){
        card.planRaw=raw;
        const best=typeof bestEstimateFor==='function'?bestEstimateFor(raw,card.rawId):null;
        try{rmState={id:card.id,w:best?.w||20,r:best?.r||5}}catch(_){ }
        return renderExerciseDetail(card)
      }
      const media=(window.findMediaForCustom||(()=>null))(raw);
      if(media&&typeof renderExerciseDetail==='function'){
        const title=typeof displayExerciseName==='function'?displayExerciseName(raw):stripPlanName(raw),meta=typeof inferCustomMeta==='function'?inferCustomMeta(title):{};
        const ex={...media,...meta,id:`custom:${raw}`,n:title,raw,rawId:String(media.rawId||media.id||''),sourceId:String(media.rawId||media.id||''),sourceName:String(media.n||''),custom:true};
        const best=typeof bestEstimateFor==='function'?bestEstimateFor(raw,ex.rawId):null;try{rmState={id:ex.id,w:best?.w||20,r:best?.r||5}}catch(_){ }
        return renderExerciseDetail(ex)
      }
      return base.apply(this,arguments)
    };
    wrapped.__canonicalV329=true;wrapped.__canonicalBase=base;window.openExerciseDetailByName=wrapped;try{openExerciseDetailByName=wrapped}catch(_){ }
  }

  function installDisplayName(){
    const base=window.displayExerciseName||(()=>{try{return displayExerciseName}catch(_){return null}})();
    if(typeof base!=='function'||base.__canonicalV331)return;
    const wrapped=function(raw=''){
      const spec=specForName(raw);return spec?.ru||base.apply(this,arguments)
    };
    wrapped.__canonicalV331=true;wrapped.__canonicalBase=base;window.displayExerciseName=wrapped;try{displayExerciseName=wrapped}catch(_){ }
  }

  function mapExerciseObject(e,context=''){
    if(!e)return false;const spec=specForName(e.n,context)||specForName(e.cleanName,context),src=resolve(spec);if(!spec)return false;
    let changed=false;const sid=String(src?.rawId||src?.id||'');
    const set=(k,v)=>{if(v!==undefined&&v!==null&&e[k]!==v){e[k]=v;changed=true}};
    if(sid)set('sourceId',sid);set('canonicalExerciseKey',spec.key);set('canonicalName',spec.ru);
    if(!e.bp)set('bp',spec.bp);if(!e.tg)set('tg',spec.tg);if(!e.eq)set('eq',spec.eq[0]||'');
    return changed
  }

  function mapPlans(){
    let changed=false;
    try{(Array.isArray(ROUTINES)?ROUTINES:[]).forEach(r=>(r.e||[]).forEach(e=>{if(mapExerciseObject(e,'builtin'))changed=true}))}catch(_){ }
    try{
      const programs=Array.isArray(st?.programs)?st.programs:[];
      programs.forEach(p=>{const context=(p?.seedId==='sergey-8-week-training-plan')?'sergey':'';
        (p.weeks||[]).forEach(w=>(w.days||[]).forEach(d=>(d.ex||[]).forEach(e=>{if(mapExerciseObject(e,context))changed=true})));
        p.exerciseMappingRevision=RELEASE
      });
      Object.values(st.planAdds||{}).forEach(rows=>(rows||[]).forEach(e=>{if(mapExerciseObject(e))changed=true}));
      // Runtime metadata only. Never rewrite historical records, active sets,
      // user aliases, raw plan names, or prescribed loads to repair a media link.
    }catch(e){console.warn('canonical exercise mapping',e)}
    return changed
  }

  function refresh(){
    installCatalog();installMedia();installFindExercise();installOpenByName();installDisplayName();
    if(mapPlans())try{if(document.querySelector('#exercises.page.active')&&typeof renderExerciseResults==='function')renderExerciseResults()}catch(_){ }
  }

  window.UNVRSL_EXERCISE_REGISTRY_V331=Object.freeze({
    specs,normalize:norm,stripPlanName,find:specForName,
    record:name=>canonicalRecord(byKey.get(name)||specForName(name)),
    identity:name=>specForName(name)?.key||norm(stripPlanName(name)),
    aliases:name=>specForName(name)?.aliases.slice()||[],
    mapPlans
  });

  window.UNVRSL_PLAN_EXERCISES_V329=Object.freeze(specs.map(s=>({key:s.key,name:s.ru,show:s.show})));
  window.UNVRSL_PLAN_EXERCISE_AUDIT_V329=()=>specs.map(s=>{const x=resolve(s);return{key:s.key,name:s.ru,source:x?.n||null,sourceId:x?.id||null,gif:!!(x?.gif||x?.gif_url),ruTechnique:!!ruTech(x),show:s.show}});
  window.UNVRSL_PLAN_EXERCISE_UNRESOLVED_V329=()=>window.UNVRSL_PLAN_EXERCISE_AUDIT_V329().filter(x=>x.show&&!x.source);

  refresh();
  window.addEventListener('unvrsl:deferred-modules-ready',()=>setTimeout(refresh,0),{passive:true});
  window.addEventListener('unvrsl:modules-ready',()=>setTimeout(refresh,0),{passive:true});
  window.addEventListener('unvrsl:cloud-modules-settled',()=>setTimeout(refresh,0),{passive:true});
  let tries=0;const timer=setInterval(()=>{refresh();if(++tries>=40)clearInterval(timer)},300);
})();
