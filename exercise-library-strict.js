'use strict';
(()=>{
  if(window.__unvrslExerciseStrict)return;window.__unvrslExerciseStrict=true;

  const oldRu=window.ruExerciseName||((typeof ruExerciseName==='function')?ruExerciseName:null);
  const clean=s=>String(s||'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
  const tech=e=>{const i=e?.instructions||{};return typeof i==='string'?i.trim():String(i.ru||i.russian||'').trim()};
  const quality=e=>!!e&&!e.custom&&!!String(e.gif||e.gif_url||'').trim()&&!!tech(e);
  const forbidden=/(archer|typewriter|commando|muscle up|one arm push|one hand push|handstand|planche|human flag|iron cross|balance board|bosu|stability ball|swiss ball|exercise ball|suspension|around the world|astride|backward jump|forward jump|side jump|jump squat|jump lunge|plyometric|plyo|pistol|sissy|zercher|jefferson|dragon flag|frog pump|frog squat|donkey calf|neck bridge|scorpion|windmill|spider|body saw|clap push|explosive push|burpee|clean and jerk|power clean|snatch|overhead squat|kneeling jump|ankle circle|ankle circles|toe touch hop|skater hop|bear crawl|crab walk)/i;
  const acceptedEq=new Set(['barbell','olympic barbell','ez barbell','dumbbell','cable','body weight','leverage machine','sled machine','smith machine','assisted','kettlebell','weighted','rope']);
  const nameMap=new Map();

  const angle=s=>/incline/.test(s)?'на наклонной скамье':/decline/.test(s)?'на отрицательной скамье':'';
  const grip=s=>/neutral grip|neutral/.test(s)?'нейтральным хватом':/wide grip|wide/.test(s)?'широким хватом':/close grip|narrow grip|close/.test(s)?'узким хватом':/reverse grip|underhand/.test(s)?'обратным хватом':'';
  const side=s=>/one arm|single arm|one hand|single hand/.test(s)?'одной рукой':'';
  const equip=(s,e)=>{
    if(e==='smith machine'||/smith/.test(s))return'в Смите';
    if(e==='barbell'||e==='olympic barbell')return'со штангой';
    if(e==='ez barbell')return'с EZ-штангой';
    if(e==='dumbbell')return'с гантелями';
    if(e==='kettlebell')return'с гирей';
    if(e==='cable'||e==='rope')return'на блоке';
    if(e==='leverage machine'||e==='sled machine')return'в тренажёре';
    if(e==='assisted')return'в гравитроне';
    if(e==='weighted')return'с дополнительным весом';
    return'';
  };

  function strictName(ex){
    const s=clean(ex?.n||ex?.name),e=String(ex?.eq||ex?.equipment||'').toLowerCase();
    if(!s||forbidden.test(s)||!acceptedEq.has(e))return null;

    // ГРУДЬ
    if(/bench press/.test(s)){
      const a=angle(s),g=grip(s);
      if(e==='smith machine'||/smith/.test(s))return ['Жим в Смите',a,g].filter(Boolean).join(' ');
      if(e==='dumbbell')return ['Жим гантелей',a||'лёжа',g].filter(Boolean).join(' ');
      if(e==='leverage machine')return ['Жим в тренажёре на грудь',a,g].filter(Boolean).join(' ');
      if(e==='barbell'||e==='olympic barbell')return ['Жим штанги',a||'лёжа',g].filter(Boolean).join(' ');
      return null;
    }
    if(/chest press/.test(s)){
      if(e==='leverage machine')return ['Жим в тренажёре на грудь',angle(s)].filter(Boolean).join(' ');
      if(e==='cable')return ['Жим на грудь в кроссовере',side(s)].filter(Boolean).join(' ');
      return null;
    }
    if(/pec deck|butterfly/.test(s))return'Сведение рук в тренажёре';
    if(/crossover|cable fly/.test(s)){
      if(/low to high|low/.test(s))return'Сведение рук в кроссовере снизу вверх';
      if(/high to low|high/.test(s))return'Сведение рук в кроссовере сверху вниз';
      return side(s)?'Сведение руки в кроссовере':'Сведение рук в кроссовере';
    }
    if(/dumbbell fly|chest fly/.test(s)&&e==='dumbbell')return ['Разведение гантелей',angle(s)||'лёжа'].join(' ');
    if(/push up|pushup/.test(s)){
      if(/diamond/.test(s))return'Отжимания узким хватом';
      if(/wide/.test(s))return'Отжимания широким хватом';
      if(/feet elevated|decline/.test(s))return'Отжимания с ногами на возвышении';
      if(/hands elevated|incline/.test(s))return'Отжимания от опоры';
      if(e==='weighted'||/weighted/.test(s))return'Отжимания с дополнительным весом';
      if(/knee/.test(s))return'Отжимания с колен';
      if(!/(spiderman|twist|rotation|shoulder tap|pike|pseudo|hindu)/.test(s))return'Классические отжимания';
      return null;
    }
    if(/chest dip|dips.*chest/.test(s))return'Отжимания на брусьях с акцентом на грудь';
    if(/pullover/.test(s)){
      if(e==='dumbbell')return'Пуловер с гантелью';
      if(e==='cable')return'Пуловер на верхнем блоке';
      if(e==='leverage machine')return'Пуловер в тренажёре';
      return null;
    }

    // СПИНА
    if(/lat pulldown|pulldown/.test(s)&&!/straight arm/.test(s)){
      if(side(s))return'Тяга верхнего блока одной рукой';
      return ['Тяга верхнего блока',grip(s)].filter(Boolean).join(' ');
    }
    if(/straight arm pulldown/.test(s))return'Тяга верхнего блока прямыми руками';
    if(/pull up|pullup/.test(s)){
      if(e==='assisted'||/assisted/.test(s))return ['Подтягивания в гравитроне',grip(s)].filter(Boolean).join(' ');
      if(e==='weighted'||/weighted/.test(s))return ['Подтягивания с дополнительным весом',grip(s)].filter(Boolean).join(' ');
      if(/L sit|kipping|mixed grip|behind/.test(s))return null;
      return ['Подтягивания',grip(s)].filter(Boolean).join(' ');
    }
    if(/chin up|chinup/.test(s))return e==='assisted'?'Подтягивания обратным хватом в гравитроне':'Подтягивания обратным хватом';
    if(/t bar row|tbar row/.test(s))return /chest supported|supported/.test(s)?'Тяга Т-грифа с упором грудью':'Тяга Т-грифа';
    if(/seated row|low row/.test(s)){
      const g=grip(s);
      if(side(s))return e==='leverage machine'?'Горизонтальная тяга в тренажёре одной рукой':'Горизонтальная тяга нижнего блока одной рукой';
      return e==='leverage machine'?['Горизонтальная тяга в тренажёре',g].filter(Boolean).join(' '):['Горизонтальная тяга нижнего блока',g].filter(Boolean).join(' ');
    }
    if(/bent over row/.test(s)){
      if(e==='dumbbell')return'Тяга гантелей в наклоне';
      if(e==='barbell'||e==='olympic barbell')return ['Тяга штанги в наклоне',grip(s)].filter(Boolean).join(' ');
      return null;
    }
    if(/one arm row|single arm row|dumbbell row/.test(s))return e==='cable'?'Тяга нижнего блока одной рукой':'Тяга гантели одной рукой';
    if(/shrug/.test(s))return ['Шраги',equip(s,e)].filter(Boolean).join(' ');
    if(/back extension|hyperextension/.test(s))return /reverse/.test(s)?'Обратная гиперэкстензия':'Гиперэкстензия';

    // ПЛЕЧИ
    if(/arnold press/.test(s))return'Жим Арнольда';
    if(/military press/.test(s))return /seated/.test(s)?'Армейский жим сидя':'Армейский жим стоя';
    if(/shoulder press|overhead press/.test(s)){
      if(e==='smith machine')return /standing/.test(s)?'Жим в Смите стоя на плечи':'Жим в Смите сидя на плечи';
      if(e==='dumbbell')return /standing/.test(s)?'Жим гантелей стоя':'Жим гантелей сидя';
      if(e==='leverage machine')return'Жим в тренажёре на плечи';
      if(e==='barbell'||e==='olympic barbell')return /seated/.test(s)?'Жим штанги сидя':'Жим штанги стоя';
      return null;
    }
    if(/lateral raise/.test(s)){
      if(e==='cable')return side(s)?'Отведение руки в сторону на блоке':'Махи в стороны на блоке';
      if(e==='leverage machine')return'Махи в тренажёре на среднюю дельту';
      if(e==='dumbbell')return /seated/.test(s)?'Махи гантелями в стороны сидя':'Махи гантелями в стороны';
      return null;
    }
    if(/front raise/.test(s)){
      if(e==='cable')return'Подъём рук перед собой на блоке';
      if(e==='dumbbell')return'Подъём гантелей перед собой';
      if(e==='barbell')return'Подъём штанги перед собой';
      return null;
    }
    if(/reverse fly|rear delt/.test(s)){
      if(e==='leverage machine')return'Обратная бабочка';
      if(e==='cable')return'Разведение рук на заднюю дельту в кроссовере';
      if(e==='dumbbell')return'Разведение гантелей на заднюю дельту';
      return null;
    }
    if(/face pull/.test(s))return'Тяга каната к лицу';
    if(/upright row/.test(s))return ['Тяга к подбородку',equip(s,e)].filter(Boolean).join(' ');

    // РУКИ
    if(/hammer curl/.test(s))return e==='cable'?'Молотковые сгибания на блоке':'Молотковые сгибания с гантелями';
    if(/preacher curl/.test(s)){
      if(e==='dumbbell')return'Сгибание руки на скамье Скотта с гантелью';
      if(e==='cable')return'Сгибание рук на скамье Скотта на блоке';
      if(e==='ez barbell'||e==='barbell')return'Сгибание рук на скамье Скотта';
      return null;
    }
    if(/concentration curl/.test(s))return'Концентрированное сгибание на бицепс';
    if(/incline.*curl|curl.*incline/.test(s)&&e==='dumbbell')return'Сгибание рук с гантелями на наклонной скамье';
    if(/biceps curl|barbell curl|dumbbell curl|cable curl|standing curl|seated curl/.test(s)){
      if(e==='barbell')return'Сгибание рук со штангой';
      if(e==='ez barbell')return'Сгибание рук с EZ-штангой';
      if(e==='cable')return side(s)?'Сгибание руки на нижнем блоке':'Сгибание рук на нижнем блоке';
      if(e==='dumbbell')return side(s)?'Сгибание руки с гантелью':'Сгибание рук с гантелями';
      return null;
    }
    if(/triceps pushdown|pushdown/.test(s))return /rope/.test(s)||e==='rope'?'Разгибание рук на блоке с канатом':'Разгибание рук на верхнем блоке';
    if(/skull crusher|lying triceps extension/.test(s)){
      if(e==='dumbbell')return'Французский жим с гантелями лёжа';
      if(e==='ez barbell')return'Французский жим с EZ-штангой лёжа';
      if(e==='barbell')return'Французский жим со штангой лёжа';
      return null;
    }
    if(/triceps extension/.test(s)){
      if(/overhead/.test(s)){
        if(e==='cable')return'Разгибание рук из-за головы на блоке';
        if(e==='dumbbell')return side(s)?'Разгибание руки с гантелью из-за головы':'Разгибание рук с гантелью из-за головы';
      }
      if(e==='cable')return'Разгибание руки на блоке';
      if(e==='dumbbell')return'Разгибание руки с гантелью';
      return null;
    }
    if(/wrist curl/.test(s))return /reverse/.test(s)?'Разгибание кистей':'Сгибание кистей';

    // НОГИ И ЯГОДИЦЫ
    if(/romanian deadlift/.test(s))return ['Румынская тяга',equip(s,e)].filter(Boolean).join(' ');
    if(/stiff leg deadlift/.test(s))return ['Тяга на прямых ногах',equip(s,e)].filter(Boolean).join(' ');
    if(/sumo deadlift/.test(s))return ['Становая тяга сумо',equip(s,e)].filter(Boolean).join(' ');
    if(/deadlift/.test(s)&&!/(romanian|stiff|sumo)/.test(s))return ['Становая тяга',equip(s,e)].filter(Boolean).join(' ');
    if(/hip thrust|glute bridge/.test(s)){
      const base='Ягодичный мост';
      if(e==='smith machine')return`${base} в Смите`;
      if(e==='barbell'||e==='olympic barbell')return`${base} со штангой`;
      if(e==='dumbbell')return`${base} с гантелью`;
      if(e==='leverage machine')return`${base} в тренажёре`;
      if(e==='body weight')return /bench|elevated/.test(s)?`${base} с опорой на скамью`:base;
      return null;
    }
    if(/front squat/.test(s))return ['Фронтальный присед',equip(s,e)].filter(Boolean).join(' ');
    if(/goblet squat/.test(s))return e==='dumbbell'?'Гоблет-присед с гантелью':'Гоблет-присед с гирей';
    if(/hack squat/.test(s))return'Гакк-присед';
    if(/squat/.test(s)&&!/(split|bulgarian|front|goblet|hack)/.test(s)){
      if(e==='smith machine')return'Присед в Смите';
      if(e==='barbell'||e==='olympic barbell')return /high bar/.test(s)?'Присед со штангой high-bar':/low bar/.test(s)?'Присед со штангой low-bar':'Присед со штангой';
      if(e==='leverage machine'||e==='sled machine')return'Присед в тренажёре';
      if(e==='body weight'&&!/(jump|pulse|single)/.test(s))return'Приседания с собственным весом';
      return null;
    }
    if(/leg press/.test(s)){
      if(/one leg|single leg/.test(s))return'Жим ногами одной ногой';
      if(/wide/.test(s))return'Жим ногами широкой постановкой';
      if(/narrow|close/.test(s))return'Жим ногами узкой постановкой';
      return'Жим ногами';
    }
    if(/leg extension/.test(s))return /single|one leg/.test(s)?'Разгибание одной ноги в тренажёре':'Разгибание ног в тренажёре';
    if(/leg curl/.test(s)){
      if(/seated/.test(s))return'Сгибание ног сидя в тренажёре';
      if(/standing/.test(s)&&/single|one leg/.test(s))return'Сгибание одной ноги стоя в тренажёре';
      return'Сгибание ног лёжа в тренажёре';
    }
    if(/bulgarian|split squat/.test(s)){
      if(e==='smith machine')return'Болгарский сплит-присед в Смите';
      if(e==='dumbbell')return'Болгарский сплит-присед с гантелями';
      if(e==='barbell')return'Болгарский сплит-присед со штангой';
      if(e==='body weight')return'Болгарский сплит-присед';
      return null;
    }
    if(/lunge/.test(s)){
      const dir=/reverse|backward/.test(s)?'назад':/walking/.test(s)?'ходьбой':'вперёд';
      if(e==='smith machine')return`Выпады ${dir} в Смите`;
      if(e==='dumbbell')return`Выпады ${dir} с гантелями`;
      if(e==='barbell')return`Выпады ${dir} со штангой`;
      if(e==='body weight')return`Выпады ${dir}`;
      return null;
    }
    if(/step up|stepup/.test(s)){
      if(e==='dumbbell')return'Зашагивания на платформу с гантелями';
      if(e==='barbell')return'Зашагивания на платформу со штангой';
      if(e==='smith machine')return'Зашагивания на платформу в Смите';
      if(e==='body weight')return'Зашагивания на платформу';
      return null;
    }
    if(/hip abduction|abductor/.test(s))return e==='cable'?'Отведение ноги в сторону в кроссовере':'Разведение ног в тренажёре';
    if(/hip adduction|adductor/.test(s))return e==='cable'?'Приведение ноги в кроссовере':'Сведение ног в тренажёре';
    if(/kickback/.test(s))return e==='cable'?'Кикбэк в кроссовере':e==='leverage machine'?'Кикбэк в тренажёре':null;
    if(/calf raise/.test(s)){
      if(e==='smith machine')return'Подъём на носки в Смите';
      if(e==='leverage machine'||e==='sled machine')return /seated/.test(s)?'Подъём на носки сидя в тренажёре':'Подъём на носки в тренажёре';
      if(e==='dumbbell')return'Подъём на носки с гантелями';
      if(e==='body weight')return /seated/.test(s)?'Подъём на носки сидя':'Подъём на носки стоя';
      if(e==='barbell')return'Подъём на носки со штангой';
      return null;
    }
    if(/good morning/.test(s))return e==='smith machine'?'Good Morning в Смите':e==='barbell'?'Good Morning со штангой':null;

    // КОР
    if(/ab wheel|rollout/.test(s)&&e==='roller')return'Ролик для пресса';
    if(/dead bug/.test(s))return'Dead Bug';
    if(/bicycle crunch/.test(s))return'Велосипедные скручивания';
    if(/russian twist/.test(s))return e==='weighted'?'Русские повороты с весом':'Русские повороты';
    if(/crunch/.test(s)&&!/(bicycle|oblique|twist)/.test(s))return e==='cable'?'Скручивания на верхнем блоке':'Скручивания';
    if(/hanging leg raise/.test(s))return'Подъём ног в висе';
    if(/hanging knee raise/.test(s))return'Подъём коленей в висе';
    if(/leg raise/.test(s)&&e==='body weight')return'Подъём ног лёжа';
    if(/sit up|situp/.test(s)&&!/(twist|jackknife)/.test(s))return'Подъём корпуса';
    if(/^plank$|front plank/.test(s))return'Планка';

    // ПРОСТОЕ КАРДИО / ОФП
    if(/mountain climber/.test(s))return'Альпинист';
    if(/jumping jack/.test(s))return'Прыжки Jumping Jack';
    if(/high knee/.test(s))return'Бег с высоким подниманием коленей';
    if(/jump rope|rope skipping/.test(s))return'Прыжки на скакалке';

    return null;
  }

  function records(){
    const src=typeof ogLibrary!=='undefined'&&Array.isArray(ogLibrary)?ogLibrary:[];
    const out=[],seen=new Set();nameMap.clear();
    for(const raw of src){
      if(!quality(raw))continue;
      const n=strictName(raw);if(!n)continue;
      const key=n.toLocaleLowerCase('ru');if(seen.has(key))continue;seen.add(key);
      nameMap.set(clean(raw.n),n);
      out.push({...raw,id:String(raw.id).startsWith('og:')?String(raw.id):`og:${raw.id}`,rawId:raw.rawId||raw.id,strictName:n,custom:false});
    }
    return out;
  }

  window.ruExerciseName=function(name=''){
    const k=clean(name);if(nameMap.has(k))return nameMap.get(k);
    return typeof oldRu==='function'?oldRu(name):String(name||'Упражнение');
  };
  try{ruExerciseName=window.ruExerciseName}catch(e){}

  const id=e=>String(e.rawId||e.id||e.n||'');
  const fav=e=>typeof isFavorite==='function'&&isFavorite(id(e));
  const recent=e=>Array.isArray(st?.recentExercises)&&st.recentExercises.includes(id(e));
  const eqOk=e=>{try{return typeof exEquipment==='undefined'||exEquipment==='all'||(typeof equipmentGroup==='function'?equipmentGroup(e)===exEquipment:String(e.eq||'')===exEquipment)}catch(_){return true}};
  const searchText=e=>`${e.strictName} ${e.n||''} ${(typeof BP_RU==='object'&&BP_RU[e.bp])||e.bp||''} ${(typeof EQ_RU==='object'&&EQ_RU[e.eq])||e.eq||''} ${typeof ruTarget==='function'?ruTarget(e.tg):e.tg||''}`.toLowerCase();
  let limit=160;const PAGE=160;

  function filtered(){
    const q=String(typeof exQuery==='undefined'?'':exQuery).trim().toLowerCase();
    return records().filter(e=>{
      if(typeof exBody!=='undefined'){
        if(exBody==='favorites'&&!fav(e))return false;
        if(exBody==='recent'&&!recent(e))return false;
        if(!['all','favorites','recent'].includes(exBody)&&e.bp!==exBody)return false;
      }
      return eqOk(e)&&(!q||searchText(e).includes(q));
    }).sort((a,b)=>a.strictName.localeCompare(b.strictName,'ru'));
  }

  function row(e){
    const t=e.strictName,body=(typeof BP_RU==='object'&&BP_RU[e.bp])||e.bp||'—',eq=(typeof EQ_RU==='object'&&EQ_RU[e.eq])||e.eq||'—',tg=typeof ruTarget==='function'?ruTarget(e.tg):(e.tg||'—'),thumb=e.image||e.gif||e.gif_url||'';
    return `<div class="card exlib exlib-btn smart-ex-row" onclick="openExerciseDetail('${encodeURIComponent(e.id)}')"><div class="exercise-list-row">${thumb?`<img class="ex-thumb" src="${mediaUrl(thumb)}" loading="lazy" alt="${esc(t)}">`:''}<div class="grow"><b>${esc(t)}</b><div class="catalog-meta">${esc(body)} · ${esc(eq)} · ${esc(tg)}</div></div><div class="smart-row-actions">${typeof isFavorite==='function'?`<button class="star-btn ${fav(e)?'on':''}" onclick="event.stopPropagation();toggleFavorite('${esc(id(e))}')">★</button>`:''}<span class="chev">›</span></div></div></div>`;
  }

  window.renderExerciseResults=function(){
    const el=document.querySelector('#exList');if(!el)return;
    const all=records(),f=filtered(),shown=f.slice(0,limit);
    el.innerHTML=shown.map(row).join('')+(shown.length<f.length?`<button class="btn full" style="margin:12px 0 4px" onclick="showMoreStrictExercises()">Показать ещё · ${shown.length} из ${f.length}</button>`:'')+(!f.length?'<div class="card muted">По этому фильтру ничего не найдено.</div>':'');
    const c=document.querySelector('#catalogCount');if(c)c.textContent=`${all.length} основных упражнений${f.length!==all.length?` · найдено ${f.length}`:''}`;
    document.querySelectorAll('#exercises .catalog-head .chip,#exercises .quality-media-line').forEach(x=>x.remove());
  };
  try{renderExerciseResults=window.renderExerciseResults}catch(e){}
  window.showMoreStrictExercises=()=>{limit+=PAGE;window.renderExerciseResults()};

  ['setExerciseQuery','setExerciseBody','setExerciseEquipment'].forEach(k=>{
    const fn=window[k];if(typeof fn!=='function'||fn.__strict)return;
    const wrapped=function(){limit=PAGE;const r=fn.apply(this,arguments);setTimeout(()=>window.renderExerciseResults(),0);return r};
    wrapped.__strict=true;window[k]=wrapped;try{globalThis[k]=wrapped}catch(e){}
  });

  const css=document.createElement('style');css.textContent='#exercises .catalog-head .chip,#exercises .quality-media-line{display:none!important}';document.head.appendChild(css);
  setTimeout(()=>{records();if(document.querySelector('#exercises.page.active'))window.renderExerciseResults()},50);
})();
