'use strict';
(()=>{
  if(window.__unvrslCuratedExerciseLibrary)return;window.__unvrslCuratedExerciseLibrary=true;

  const oldRu=window.ruExerciseName||((typeof ruExerciseName==='function')?ruExerciseName:null);
  const clean=s=>String(s||'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
  const has=(s,re)=>re.test(s);
  const eqRu=e=>String(e?.eq||'').toLowerCase();
  const acceptedEq=new Set(['barbell','olympic barbell','ez barbell','dumbbell','cable','body weight','leverage machine','sled machine','smith machine','assisted','kettlebell','weighted','roller']);
  const banned=/(bosu|stability ball|swiss ball|exercise ball|suspension|suspended|band\b|resistance band|medicine ball|plyometric|plyo\b|jump squat|jump lunge|pistol|sissy|zercher|jefferson|hack lift|archer|typewriter|commando|muscle up|around the world|clock|scorpion|windmill|spider|frog pump|frog squat|donkey calf|neck bridge|handstand|one arm push up|one hand push up|impossible|iron cross|human flag|planche|dragon flag|burpee pull|push up to|twist push|clap push|superman push|kneeling jump|power clean|snatch|clean and jerk|good morning squat|overhead squat|front plank with|side plank with|plank jack|body saw)/i;
  const family=/(bench press|chest press|pec deck|crossover|cable fly|dumbbell fly|push up|push-up|chest dip|triceps dip|pullover|lat pulldown|pulldown|pull up|pull-up|chin up|chin-up|seated row|low row|bent over row|t bar row|t-bar row|one arm row|single arm row|straight arm pulldown|shrug|back extension|hyperextension|shoulder press|military press|overhead press|arnold press|lateral raise|front raise|reverse fly|rear delt|face pull|upright row|biceps curl|barbell curl|dumbbell curl|cable curl|preacher curl|concentration curl|hammer curl|incline curl|triceps pushdown|pushdown|triceps extension|skull crusher|lying triceps extension|wrist curl|reverse wrist curl|squat|leg press|leg extension|leg curl|romanian deadlift|stiff leg deadlift|deadlift|hip thrust|glute bridge|lunge|split squat|bulgarian|step up|step-up|hip abduction|hip adduction|kickback|calf raise|good morning|crunch|sit up|sit-up|leg raise|plank|russian twist|ab wheel|dead bug|bicycle crunch|mountain climber|jumping jack|high knee|jump rope|running|walking)/i;

  function equipSuffix(s,eq){
    if(eq==='smith machine'||/smith/.test(s))return'в Смите';
    if(eq==='barbell'||eq==='olympic barbell')return'со штангой';
    if(eq==='ez barbell')return'с EZ-штангой';
    if(eq==='dumbbell')return'с гантелями';
    if(eq==='kettlebell')return'с гирей';
    if(eq==='cable')return'на блоке';
    if(eq==='leverage machine'||eq==='sled machine')return'в тренажёре';
    if(eq==='assisted')return'в гравитроне';
    if(eq==='weighted')return'с дополнительным весом';
    return'';
  }
  const angle=s=>/incline/.test(s)?'на наклонной скамье':/decline/.test(s)?'на отрицательной скамье':'';
  const grip=s=>/wide grip|wide-grip/.test(s)?'широким хватом':/close grip|close-grip|narrow grip/.test(s)?'узким хватом':/reverse grip|reverse-grip|underhand/.test(s)?'обратным хватом':/neutral grip/.test(s)?'нейтральным хватом':'';

  function prettyName(name,eq=''){
    const s=clean(name),e=String(eq||'').toLowerCase();
    if(!s)return'';

    // Грудь
    if(/bench press/.test(s)){
      const a=angle(s),g=grip(s);
      if(e==='smith machine'||/smith/.test(s))return ['Жим в Смите',a,g].filter(Boolean).join(' ');
      if(e==='dumbbell'||/dumbbell/.test(s))return ['Жим гантелей',a,g].filter(Boolean).join(' ');
      if(e==='leverage machine'||/lever|machine/.test(s))return ['Жим в тренажёре',a,g].filter(Boolean).join(' ');
      return ['Жим штанги',a||'лёжа',g].filter(Boolean).join(' ');
    }
    if(/chest press/.test(s)){
      const a=angle(s);if(e==='cable'||/cable/.test(s))return ['Жим на грудь в кроссовере',a].filter(Boolean).join(' ');
      if(e==='dumbbell'||/dumbbell/.test(s))return ['Жим гантелей',a||'лёжа'].join(' ');
      return ['Жим в тренажёре на грудь',a].filter(Boolean).join(' ');
    }
    if(/pec deck|butterfly/.test(s))return'Сведение рук в тренажёре';
    if(/crossover|cable fly/.test(s)){
      if(/low to high|low/.test(s))return'Сведение рук в кроссовере снизу вверх';
      if(/high to low|upper/.test(s))return'Сведение рук в кроссовере сверху вниз';
      if(/one arm|single arm/.test(s))return'Сведение руки в кроссовере';
      return'Сведение рук в кроссовере';
    }
    if(/dumbbell fly|dumbbell chest fly|fly/.test(s)&&e==='dumbbell')return ['Разведение гантелей',angle(s)||'лёжа'].join(' ');
    if(/push up|push-up/.test(s)){
      if(/diamond|close/.test(s))return'Отжимания узким хватом';
      if(/wide/.test(s))return'Отжимания широким хватом';
      if(/decline|feet elevated/.test(s))return'Отжимания с ногами на возвышении';
      if(/incline|hands elevated/.test(s))return'Отжимания от опоры';
      if(/weighted/.test(s)||e==='weighted')return'Отжимания с дополнительным весом';
      return'Классические отжимания';
    }
    if(/chest dip/.test(s))return'Отжимания на брусьях с акцентом на грудь';
    if(/triceps dip/.test(s))return'Отжимания на брусьях с акцентом на трицепс';
    if(/pullover/.test(s)){
      if(e==='dumbbell'||/dumbbell/.test(s))return'Пуловер с гантелью';
      if(e==='cable'||/cable/.test(s))return'Пуловер на верхнем блоке';
      return'Пуловер в тренажёре';
    }

    // Спина
    if(/lat pulldown|pulldown/.test(s)&&!/straight arm/.test(s)){
      const g=grip(s);if(/one arm|single arm/.test(s))return'Тяга верхнего блока одной рукой';
      return ['Тяга верхнего блока',g].filter(Boolean).join(' ');
    }
    if(/straight arm pulldown/.test(s))return'Тяга верхнего блока прямыми руками';
    if(/pull up|pull-up/.test(s)){
      if(e==='assisted'||/assisted/.test(s))return'Подтягивания в гравитроне';
      if(/weighted/.test(s)||e==='weighted')return'Подтягивания с дополнительным весом';
      const g=grip(s);return ['Подтягивания',g].filter(Boolean).join(' ');
    }
    if(/chin up|chin-up/.test(s))return e==='assisted'?'Подтягивания обратным хватом в гравитроне':'Подтягивания обратным хватом';
    if(/t bar row|t-bar row/.test(s))return /chest supported|supported/.test(s)?'Тяга Т-грифа с упором грудью':'Тяга Т-грифа';
    if(/seated row|low row/.test(s)){
      if(/one arm|single arm/.test(s))return e==='leverage machine'?'Горизонтальная тяга в тренажёре одной рукой':'Горизонтальная тяга блока одной рукой';
      const g=grip(s);return e==='leverage machine'?['Горизонтальная тяга в тренажёре',g].filter(Boolean).join(' '):['Горизонтальная тяга нижнего блока',g].filter(Boolean).join(' ');
    }
    if(/bent over row/.test(s)){
      if(e==='dumbbell'||/dumbbell/.test(s))return'Тяга гантелей в наклоне';
      return ['Тяга штанги в наклоне',grip(s)].filter(Boolean).join(' ');
    }
    if(/one arm row|single arm row/.test(s))return e==='cable'?'Тяга нижнего блока одной рукой':'Тяга гантели одной рукой';
    if(/shrug/.test(s))return ['Шраги',equipSuffix(s,e)].filter(Boolean).join(' ');
    if(/back extension|hyperextension/.test(s))return /reverse/.test(s)?'Обратная гиперэкстензия':'Гиперэкстензия';

    // Плечи
    if(/arnold press/.test(s))return'Жим Арнольда';
    if(/military press/.test(s))return /seated/.test(s)?'Армейский жим сидя':'Армейский жим стоя';
    if(/shoulder press|overhead press/.test(s)){
      if(e==='smith machine'||/smith/.test(s))return /seated/.test(s)?'Жим в Смите сидя на плечи':'Жим в Смите стоя на плечи';
      if(e==='dumbbell'||/dumbbell/.test(s))return /standing/.test(s)?'Жим гантелей стоя':'Жим гантелей сидя';
      if(e==='leverage machine'||/machine|lever/.test(s))return'Жим в тренажёре на плечи';
      return /seated/.test(s)?'Жим штанги сидя':'Жим штанги стоя';
    }
    if(/lateral raise/.test(s)){
      if(e==='cable'||/cable/.test(s))return /one arm|single arm/.test(s)?'Отведение руки в сторону на блоке':'Махи в стороны на блоке';
      if(e==='leverage machine'||/lever|machine/.test(s))return'Махи в тренажёре на среднюю дельту';
      return /seated/.test(s)?'Махи гантелями в стороны сидя':'Махи гантелями в стороны';
    }
    if(/front raise/.test(s))return e==='cable'?'Подъём рук перед собой на блоке':e==='barbell'?'Подъём штанги перед собой':'Подъём гантелей перед собой';
    if(/reverse fly|rear delt/.test(s)){
      if(e==='leverage machine'||/machine|lever/.test(s))return'Обратная бабочка';
      if(e==='cable'||/cable/.test(s))return'Разведение рук на заднюю дельту в кроссовере';
      return'Разведение гантелей на заднюю дельту';
    }
    if(/face pull/.test(s))return'Тяга каната к лицу';
    if(/upright row/.test(s))return ['Тяга к подбородку',equipSuffix(s,e)].filter(Boolean).join(' ');

    // Бицепс / трицепс / предплечья
    if(/hammer curl/.test(s))return e==='cable'?'Молотковые сгибания на блоке':'Молотковые сгибания с гантелями';
    if(/preacher curl/.test(s))return e==='dumbbell'?'Сгибание руки на скамье Скотта с гантелью':e==='cable'?'Сгибание рук на скамье Скотта на блоке':'Сгибание рук на скамье Скотта';
    if(/concentration curl/.test(s))return'Концентрированное сгибание на бицепс';
    if(/incline curl/.test(s))return'Сгибание рук с гантелями на наклонной скамье';
    if(/biceps curl|barbell curl|dumbbell curl|cable curl/.test(s)){
      if(e==='barbell'||/barbell/.test(s))return'Сгибание рук со штангой';
      if(e==='ez barbell'||/ez/.test(s))return'Сгибание рук с EZ-штангой';
      if(e==='cable'||/cable/.test(s))return /one arm|single arm/.test(s)?'Сгибание руки на нижнем блоке':'Сгибание рук на нижнем блоке';
      return /one arm|single arm/.test(s)?'Сгибание руки с гантелью':'Сгибание рук с гантелями';
    }
    if(/triceps pushdown|pushdown/.test(s))return /rope/.test(s)?'Разгибание рук на блоке с канатом':'Разгибание рук на верхнем блоке';
    if(/skull crusher|lying triceps extension/.test(s))return e==='dumbbell'?'Французский жим с гантелями лёжа':e==='ez barbell'?'Французский жим с EZ-штангой лёжа':'Французский жим со штангой лёжа';
    if(/triceps extension/.test(s)){
      if(/overhead/.test(s))return e==='cable'?'Разгибание рук из-за головы на блоке':e==='dumbbell'?'Разгибание гантели из-за головы':'Французский жим из-за головы';
      return e==='cable'?'Разгибание руки на блоке':'Разгибание руки на трицепс';
    }
    if(/reverse wrist curl/.test(s))return'Разгибание кистей';
    if(/wrist curl/.test(s))return'Сгибание кистей';

    // Ноги и ягодицы
    if(/hip thrust|glute bridge/.test(s)){
      if(e==='smith machine'||/smith/.test(s))return'Ягодичный мост в Смите';
      if(e==='barbell'||/barbell/.test(s))return'Ягодичный мост со штангой';
      if(e==='dumbbell'||/dumbbell/.test(s))return'Ягодичный мост с гантелью';
      if(e==='leverage machine'||/machine|lever/.test(s))return'Ягодичный мост в тренажёре';
      if(/single leg|one leg/.test(s))return'Ягодичный мост на одной ноге';
      return /hip thrust/.test(s)?'Ягодичный мост с опорой на скамью':'Ягодичный мост';
    }
    if(/romanian deadlift/.test(s))return ['Румынская тяга',equipSuffix(s,e)].filter(Boolean).join(' ');
    if(/stiff leg deadlift/.test(s))return ['Тяга на прямых ногах',equipSuffix(s,e)].filter(Boolean).join(' ');
    if(/deadlift/.test(s)){
      if(/sumo/.test(s))return ['Становая тяга сумо',equipSuffix(s,e)].filter(Boolean).join(' ');
      if(/trap bar/.test(s))return'Становая тяга с трэп-грифом';
      return ['Классическая становая тяга',equipSuffix(s,e)].filter(Boolean).join(' ');
    }
    if(/hack squat/.test(s))return /single leg|one leg/.test(s)?'Гакк-присед одной ногой':'Гакк-присед';
    if(/split squat|bulgarian/.test(s))return ['Болгарский сплит-присед',equipSuffix(s,e)].filter(Boolean).join(' ');
    if(/squat/.test(s)){
      if(/front/.test(s))return'Фронтальный присед со штангой';
      if(/goblet/.test(s))return e==='kettlebell'?'Гоблет-присед с гирей':'Гоблет-присед с гантелью';
      if(e==='smith machine'||/smith/.test(s))return'Приседания в Смите';
      if(e==='leverage machine'||/lever|machine/.test(s))return'Приседания в тренажёре';
      if(e==='body weight')return'Приседания с собственным весом';
      return'Присед со штангой';
    }
    if(/leg press/.test(s))return /single leg|one leg/.test(s)?'Жим ногами одной ногой':'Жим ногами';
    if(/leg extension/.test(s))return /single leg|one leg/.test(s)?'Разгибание одной ноги в тренажёре':'Разгибание ног в тренажёре';
    if(/leg curl/.test(s)){
      if(/seated/.test(s))return /single leg|one leg/.test(s)?'Сгибание одной ноги сидя в тренажёре':'Сгибание ног сидя в тренажёре';
      if(/standing/.test(s))return'Сгибание одной ноги стоя в тренажёре';
      return /single leg|one leg/.test(s)?'Сгибание одной ноги лёжа в тренажёре':'Сгибание ног лёжа в тренажёре';
    }
    if(/lunge/.test(s)){
      const dir=/reverse|backward/.test(s)?'назад':/walking/.test(s)?'ходьбой':'вперёд';
      return [`Выпады ${dir}`,equipSuffix(s,e)].filter(Boolean).join(' ');
    }
    if(/step up|step-up/.test(s))return ['Зашагивания на платформу',equipSuffix(s,e)].filter(Boolean).join(' ');
    if(/hip abduction/.test(s))return e==='cable'?'Отведение ноги в сторону в кроссовере':'Разведение ног в тренажёре';
    if(/hip adduction/.test(s))return e==='cable'?'Приведение ноги в кроссовере':'Сведение ног в тренажёре';
    if(/kickback/.test(s))return e==='cable'?'Отведение ноги назад в кроссовере':'Кикбэк в тренажёре';
    if(/calf raise/.test(s)){
      if(/seated/.test(s))return'Подъём на носки сидя';
      if(/leg press/.test(s))return'Подъём на носки в жиме ногами';
      if(e==='smith machine'||/smith/.test(s))return'Подъём на носки в Смите';
      if(e==='leverage machine'||/machine|lever/.test(s))return'Подъём на носки в тренажёре';
      return'Подъём на носки стоя';
    }
    if(/good morning/.test(s))return e==='smith machine'?'Наклоны Good Morning в Смите':'Наклоны Good Morning со штангой';

    // Кор
    if(/bicycle crunch/.test(s))return'Велосипедные скручивания';
    if(/reverse crunch/.test(s))return'Обратные скручивания';
    if(/cable crunch/.test(s))return'Скручивания на верхнем блоке';
    if(/crunch/.test(s))return'Скручивания';
    if(/hanging leg raise/.test(s))return'Подъём ног в висе';
    if(/leg raise/.test(s))return /hanging/.test(s)?'Подъём ног в висе':'Подъём ног лёжа';
    if(/sit up|sit-up/.test(s))return'Подъём корпуса';
    if(/side plank/.test(s))return'Боковая планка';
    if(/plank/.test(s))return'Планка';
    if(/russian twist/.test(s))return'Русские повороты';
    if(/ab wheel/.test(s))return'Ролик для пресса';
    if(/dead bug/.test(s))return'Мёртвый жук';

    // Кардио
    if(/mountain climber/.test(s))return'Альпинист';
    if(/jumping jack/.test(s))return'Джампинг-джек';
    if(/high knee/.test(s))return'Бег с высоким подниманием коленей';
    if(/jump rope/.test(s))return'Прыжки на скакалке';
    if(/running/.test(s))return'Бег';
    if(/walking/.test(s))return'Ходьба';
    return'';
  }

  function isCurated(e){
    if(!e||e.custom)return false;
    const s=clean(e.n),eq=eqRu(e);
    if(!acceptedEq.has(eq)||banned.test(s)||!family.test(s))return false;
    return !!prettyName(e.n,eq);
  }
  function quality(e){const i=e?.instructions||{};const tech=typeof i==='string'?i.trim():String(i.ru||i.russian||'').trim();return !!String(e?.gif||e?.gif_url||'').trim()&&!!tech}
  function score(e){const s=clean(e.n);let x=s.length;if(/alternate|alternating|one arm|single arm|one leg|single leg/.test(s))x+=12;if(/wide grip|close grip|neutral grip|reverse grip/.test(s))x+=4;return x}
  function curated(){
    const src=(typeof ogLibrary!=='undefined'&&Array.isArray(ogLibrary)?ogLibrary:[]).filter(e=>quality(e)&&isCurated(e));
    const byName=new Map();
    src.forEach(e=>{const pretty=prettyName(e.n,e.eq),key=pretty.toLowerCase();const item={...e,id:String(e.id).startsWith('og:')?String(e.id):`og:${e.id}`,rawId:e.rawId||e.id,custom:false,prettyRu:pretty};const prev=byName.get(key);if(!prev||score(e)<score(prev))byName.set(key,item)});
    return [...byName.values()]
  }
  window.UNVRSL_CURATED_EXERCISES=curated;
  window.curatedExerciseName=(name,eq='')=>prettyName(name,eq)||(oldRu?oldRu(name):String(name||''));
  window.ruExerciseName=function(name=''){return window.curatedExerciseName(name,'')};
  try{ruExerciseName=window.ruExerciseName}catch(e){}

  window.catalogRecords=function(){return curated()};
  try{catalogRecords=window.catalogRecords}catch(e){}

  let limit=180;const PAGE=180;
  const id=e=>String(e.rawId||e.id||e.n||'');
  const title=e=>e.prettyRu||prettyName(e.n,e.eq)||window.curatedExerciseName(e.n,e.eq);
  const fav=e=>typeof isFavorite==='function'&&isFavorite(id(e));
  const recent=e=>Array.isArray(st?.recentExercises)&&st.recentExercises.includes(id(e));
  const eqOk=e=>{try{return typeof exEquipment==='undefined'||exEquipment==='all'||(typeof equipmentGroup==='function'?equipmentGroup(e)===exEquipment:String(e.eq||'')===exEquipment)}catch(_){return true}};
  const groupRank={'chest':1,'back':2,'shoulders':3,'upper arms':4,'upper legs':5,'lower legs':6,'waist':7,'cardio':8,'lower arms':9};
  function filtered(){
    const q=String(typeof exQuery==='undefined'?'':exQuery).trim().toLowerCase();
    return curated().filter(e=>{
      if(typeof exBody!=='undefined'){
        if(exBody==='favorites'&&!fav(e))return false;
        if(exBody==='recent'&&!recent(e))return false;
        if(!['all','favorites','recent'].includes(exBody)&&e.bp!==exBody)return false;
      }
      const hay=`${title(e)} ${e.n||''} ${(BP_RU&&BP_RU[e.bp])||e.bp||''} ${(EQ_RU&&EQ_RU[e.eq])||e.eq||''} ${typeof ruTarget==='function'?ruTarget(e.tg):e.tg||''}`.toLowerCase();
      return eqOk(e)&&(!q||hay.includes(q))
    }).sort((a,b)=>(groupRank[a.bp]||99)-(groupRank[b.bp]||99)||title(a).localeCompare(title(b),'ru'))
  }
  function row(e){
    const t=title(e),body=(BP_RU&&BP_RU[e.bp])||e.bp||'—',eq=(EQ_RU&&EQ_RU[e.eq])||e.eq||'—',tg=typeof ruTarget==='function'?ruTarget(e.tg):e.tg||'—',thumb=e.image||e.gif||e.gif_url||'';
    return `<div class="card exlib exlib-btn smart-ex-row" onclick="openExerciseDetail('${encodeURIComponent(e.id)}')"><div class="exercise-list-row">${thumb?`<img class="ex-thumb" src="${mediaUrl(thumb)}" loading="lazy" alt="${esc(t)}">`:''}<div class="grow"><b>${esc(t)}</b><div class="catalog-meta">${esc(body)} · ${esc(eq)} · ${esc(tg)}</div></div><div class="smart-row-actions">${typeof isFavorite==='function'?`<button class="star-btn ${fav(e)?'on':''}" onclick="event.stopPropagation();toggleFavorite('${esc(id(e))}')">★</button>`:''}<span class="chev">›</span></div></div></div>`
  }
  window.renderExerciseResults=function(){
    const el=document.querySelector('#exList');if(!el)return;const a=curated(),f=filtered(),shown=f.slice(0,limit);
    el.innerHTML=shown.map(row).join('')+(shown.length<f.length?`<button class="btn full" style="margin:12px 0 4px" onclick="showMoreCuratedExercises()">Показать ещё · ${shown.length} из ${f.length}</button>`:'')+(!f.length?'<div class="card muted">Ничего не найдено.</div>':'');
    const c=document.querySelector('#catalogCount');if(c)c.textContent=`Основная база · ${a.length} упражнений${f.length!==a.length?` · найдено ${f.length}`:''}`;
    document.querySelectorAll('#exercises .catalog-head .chip,#exercises .quality-media-line').forEach(x=>x.remove())
  };
  try{renderExerciseResults=window.renderExerciseResults}catch(e){}
  window.showMoreCuratedExercises=()=>{limit+=PAGE;window.renderExerciseResults()};

  ['setExerciseQuery','setExerciseBody','setExerciseEquipment'].forEach(k=>{const f=window[k];if(typeof f!=='function'||f.__curated)return;const w=function(){limit=PAGE;const r=f.apply(this,arguments);setTimeout(()=>window.renderExerciseResults(),0);return r};w.__curated=true;window[k]=w;try{globalThis[k]=w}catch(_){}});
  const baseRefresh=window.refreshCatalogUI;if(typeof baseRefresh==='function'&&!baseRefresh.__curated){const w=function(){const r=baseRefresh.apply(this,arguments);setTimeout(()=>window.renderExerciseResults(),0);return r};w.__curated=true;window.refreshCatalogUI=w;try{refreshCatalogUI=w}catch(_){}}
  setTimeout(()=>{if(document.querySelector('#exercises.page.active'))window.renderExerciseResults()},100);
})();