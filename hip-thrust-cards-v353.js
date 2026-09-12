'use strict';
(()=>{
  if(window.__unvrslHipThrustCardsV353)return;
  window.__unvrslHipThrustCardsV353=true;
  const W=window,D=document;
  const MEDIA={machine:'assets/hip-thrust-machine.gif?v=353',smith:'assets/hip-thrust-smith.gif?v=353',barbell:'assets/hip-thrust-barbell.gif?v=353'};
  const DATA={
    machine:{
      id:'unvrsl:hip-thrust-machine',name:'Ягодичный мост в тренажёре',eq:'leverage machine',gif:MEDIA.machine,
      tech:'Зафиксируй верх спины на опоре и поставь стопы устойчиво. Опускай таз подконтрольно, сохраняя нейтральное положение позвоночника. Разгибай таз за счёт ягодичных до линии плечи – таз – колени. В верхней точке сделай короткую фиксацию без переразгибания поясницы.',
      summary:'Стабильный вариант ягодичного моста, в котором тренажёр фиксирует траекторию и позволяет сосредоточиться на разгибании таза.',
      cues:['Стопы устойчиво, давление через всю стопу','Подбородок слегка к груди, рёбра не раскрывать','Вверху – сильное сокращение ягодичных без прогиба в пояснице'],
      mistakes:['Толчок поясницей вместо разгибания таза','Слишком далёкая или слишком близкая постановка стоп','Отрыв стоп или потеря контроля в нижней точке']
    },
    smith:{
      id:'unvrsl:hip-thrust-smith',name:'Ягодичный мост в Смите',eq:'smith machine',gif:MEDIA.smith,
      tech:'Расположи верх спины на скамье, гриф Смита – над тазом через мягкую накладку. Стопы поставь примерно на ширине таза так, чтобы в верхней точке голени были близки к вертикали. Опускай таз подконтрольно и разгибай его до нейтрального положения корпуса.',
      summary:'Вариант с фиксированной траекторией грифа. Удобен для стабильной прогрессии рабочего веса и контроля техники.',
      cues:['Лопатки опираются на край скамьи','Голени в верхней точке близки к вертикали','Пауза 1 секунду в верхней точке'],
      mistakes:['Слишком высокая скамья и избыточный прогиб','Отталкивание носками вместо всей стопы','Сведение коленей внутрь под нагрузкой']
    },
    barbell:{
      id:'unvrsl:hip-thrust-barbell',name:'Ягодичный мост со штангой',eq:'barbell',gif:MEDIA.barbell,
      tech:'Расположи верх спины на скамье, штангу – над тазом через мягкую накладку. Стопы поставь устойчиво; в верхней точке голени должны быть близки к вертикали. Опускай таз подконтрольно и разгибай его за счёт ягодичных до линии плечи – таз – колени. Удерживай штангу руками и не переразгибай поясницу.',
      summary:'Классический силовой вариант ягодичного моста со свободной штангой. Подходит для отслеживания рабочего веса и расчётного 1ПМ.',
      cues:['Гриф расположен над тазобедренными суставами','Таз поднимать ягодичными, а не поясницей','Сохранять одинаковую постановку стоп от подхода к подходу'],
      mistakes:['Гиперэкстензия поясницы в верхней точке','Рывок со дна и потеря контроля штанги','Слишком большая амплитуда за счёт движения корпуса']
    }
  };
  const norm=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[‐‑‒–—-]+/g,' ').replace(/\s+/g,' ').trim();
  const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function kindOf(ex){
    const id=norm(`${ex?.id||''} ${ex?.rawId||''} ${ex?.sourceId||''}`);
    const name=norm(`${ex?.strictName||''} ${ex?.n||''} ${ex?.name||''} ${ex?.sourceName||''} ${ex?.raw||''}`);
    const eq=norm(ex?.eq||ex?.equipment||'');
    const hay=`${id} ${name} ${eq}`;
    if(id.includes('unvrsl:hip thrust machine'))return'machine';
    if(id.includes('unvrsl:hip thrust smith'))return'smith';
    const hip=/ягодич.*мост|hip thrust|glute bridge|хип траст/.test(hay);
    if(!hip)return'';
    if(/smith|смит/.test(hay))return'smith';
    if(/machine|тренаж|leverage/.test(hay))return'machine';
    if(/barbell|штанг/.test(hay))return'barbell';
    return'';
  }
  function virtualExercise(kind){
    const d=DATA[kind];
    return {id:d.id,rawId:d.id,strictName:d.name,n:d.name,bp:'upper legs',eq:d.eq,tg:'glutes',virtual:true,custom:false,gif:d.gif,gif_url:d.gif,image:'',instructions:{ru:d.tech},unvrslHipThrustKind:kind};
  }
  function enhance(ex){
    if(!ex||typeof ex!=='object')return ex;
    const kind=kindOf(ex);if(!kind)return ex;
    const d=DATA[kind];
    return {...ex,strictName:d.name,n:d.name,name:d.name,bp:'upper legs',eq:d.eq,tg:'glutes',gif:d.gif,gif_url:d.gif,image:'',mediaUnavailable:false,instructions:{...(typeof ex.instructions==='object'?ex.instructions:{}),ru:d.tech},unvrslHipThrustKind:kind};
  }
  function setRm(ex){
    try{
      const key=ex.raw||ex.n,best=typeof bestEstimateFor==='function'?bestEstimateFor(key,ex.rawId||ex.sourceId||null):null;
      rmState={id:ex.id,w:best?.w||20,r:best?.r||5};
    }catch(_){ }
  }
  function renderVirtual(kind){
    const ex=virtualExercise(kind);setRm(ex);
    if(typeof W.renderExerciseDetail==='function')W.renderExerciseDetail(ex);
    else if(typeof renderExerciseDetail==='function')renderExerciseDetail(ex);
  }
  function patchFind(){
    let base;try{base=W.findExercise||findExercise}catch(_){base=W.findExercise}
    if(typeof base!=='function'||base.__hip353)return;
    const wrapped=function(token){
      const id=decodeURIComponent(String(token||''));
      if(id===DATA.machine.id)return virtualExercise('machine');
      if(id===DATA.smith.id)return virtualExercise('smith');
      const ex=base.apply(this,arguments);return enhance(ex);
    };
    wrapped.__hip353=true;W.findExercise=wrapped;try{findExercise=wrapped}catch(_){ }
  }
  function patchCatalog(){
    let base;try{base=W.catalogRecords||catalogRecords}catch(_){base=W.catalogRecords}
    if(typeof base!=='function'||base.__hip353)return;
    const wrapped=function(){const rows=base.apply(this,arguments);return Array.isArray(rows)?rows.map(enhance):rows};
    wrapped.__hip353=true;W.catalogRecords=wrapped;try{catalogRecords=wrapped}catch(_){ }
  }
  function patchVirtualOpen(){
    const base=W.openFinalVirtualExerciseV352;
    if(typeof base!=='function'||base.__hip353)return;
    const wrapped=function(token){
      const id=decodeURIComponent(String(token||''));
      if(id===DATA.machine.id)return renderVirtual('machine');
      if(id===DATA.smith.id)return renderVirtual('smith');
      return base.apply(this,arguments);
    };
    wrapped.__hip353=true;W.openFinalVirtualExerciseV352=wrapped;try{openFinalVirtualExerciseV352=wrapped}catch(_){ }
  }
  function detailHtml(kind){
    const d=DATA[kind];
    return `<div class="hip353-extra" data-kind="${kind}"><div class="section">КЛЮЧЕВЫЕ АКЦЕНТЫ</div><div class="hip353-grid">${d.cues.map(x=>`<div class="hip353-point"><span>✓</span><div>${esc(x)}</div></div>`).join('')}</div><div class="section">ЧАСТЫЕ ОШИБКИ</div><div class="hip353-grid">${d.mistakes.map(x=>`<div class="hip353-point"><span>×</span><div>${esc(x)}</div></div>`).join('')}</div></div>`;
  }
  function decorateDetail(ex){
    const kind=ex?.unvrslHipThrustKind||kindOf(ex);if(!kind)return;
    const sheet=D.getElementById('sheet');if(!sheet||sheet.querySelector('.hip353-extra'))return;
    const tags=sheet.querySelector('.detail-tags');
    if(tags){const s=D.createElement('div');s.className='hip353-summary';s.textContent=DATA[kind].summary;tags.insertAdjacentElement('afterend',s)}
    const rm=[...sheet.querySelectorAll('.section')].find(x=>/РАСЧ[ЁЕ]ТНЫЙ\s*1ПМ/i.test(x.textContent||''));
    if(rm)rm.insertAdjacentHTML('beforebegin',detailHtml(kind));
    else sheet.insertAdjacentHTML('beforeend',detailHtml(kind));
    sheet.querySelector('.source-note')?.remove();
    sheet.insertAdjacentHTML('beforeend','<div class="source-note">Анимация и редакция техники: UNVRSL FIT.</div>');
  }
  function patchDetail(){
    let base;try{base=W.renderExerciseDetail||renderExerciseDetail}catch(_){base=W.renderExerciseDetail}
    if(typeof base!=='function'||base.__hip353)return;
    const wrapped=function(ex){const fixed=enhance(ex);const r=base.call(this,fixed);decorateDetail(fixed);return r};
    wrapped.__hip353=true;W.renderExerciseDetail=wrapped;try{renderExerciseDetail=wrapped}catch(_){ }
  }
  function patchRows(){
    D.querySelectorAll('#exList .smart-ex-row,#exList .exlib-btn').forEach(row=>{
      const title=row.querySelector('b');if(!title)return;
      const meta=row.querySelector('.catalog-meta')?.textContent||'';
      const kind=kindOf({n:title.textContent,eq:meta,raw:meta});if(!kind)return;
      const d=DATA[kind];title.textContent=d.name;
      let img=row.querySelector('img.ex-thumb');
      if(!img){const ph=row.querySelector('.ex-thumb.placeholder');if(ph){img=D.createElement('img');img.className='ex-thumb';img.loading='lazy';img.alt=d.name;ph.replaceWith(img)}}
      if(img&&img.src!==d.gif)img.src=d.gif;
      const english=row.querySelector('.english-name');if(english)english.remove();
    });
  }
  function patchRender(){
    let base;try{base=W.renderExerciseResults||renderExerciseResults}catch(_){base=W.renderExerciseResults}
    if(typeof base!=='function'||base.__hip353)return;
    const wrapped=function(){const r=base.apply(this,arguments);queueMicrotask(patchRows);return r};
    wrapped.__hip353=true;W.renderExerciseResults=wrapped;try{renderExerciseResults=wrapped}catch(_){ }
  }
  function style(){
    if(D.getElementById('hip353Style'))return;
    const s=D.createElement('style');s.id='hip353Style';s.textContent='.hip353-summary{margin:12px 0 2px;padding:12px 14px;border-radius:14px;background:var(--card2,#f5f5f5);line-height:1.45}.hip353-grid{display:grid;gap:8px}.hip353-point{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:12px;background:var(--card2,#f5f5f5);line-height:1.4}.hip353-point>span{font-weight:800;min-width:14px}.hip353-extra{margin-bottom:2px}';D.head.appendChild(s)
  }
  function boot(){style();patchFind();patchCatalog();patchVirtualOpen();patchDetail();patchRender();patchRows();return true}
  new MutationObserver(()=>patchRows()).observe(D.documentElement,{childList:true,subtree:true});
  [0,50,150,400,900,1800,3500].forEach(t=>setTimeout(boot,t));
})();
