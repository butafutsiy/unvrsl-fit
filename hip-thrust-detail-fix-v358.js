'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslHipThrustDetailFixV362)return;
  W.__unvrslHipThrustDetailFixV362=true;

  const norm=v=>String(v??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[‐‑‒–—-]+/g,' ').replace(/\s+/g,' ').trim();
  const DATA={
    machine:{name:'Ягодичный мост в тренажёре',eq:'leverage machine',tech:'Зафиксируй верх спины на опоре и поставь стопы устойчиво на платформу. Опускай таз подконтрольно, сохраняя нейтральное положение позвоночника. Разгибай таз за счёт ягодичных до линии плечи – таз – колени. В верхней точке сделай короткую фиксацию без переразгибания поясницы.'},
    smith:{name:'Ягодичный мост в Смите',eq:'smith machine',tech:'Расположи верх спины на скамье, гриф Смита – над тазом через мягкую накладку. Стопы поставь примерно на ширине таза так, чтобы в верхней точке голени были близки к вертикали. Опускай таз подконтрольно и разгибай его до нейтрального положения корпуса.'},
    barbell:{name:'Ягодичный мост со штангой',eq:'barbell',tech:'Расположи верх спины на скамье, штангу – над тазом через мягкую накладку. Стопы поставь устойчиво; в верхней точке голени должны быть близки к вертикали. Опускай таз подконтрольно и разгибай его за счёт ягодичных до линии плечи – таз – колени. Удерживай штангу руками и не переразгибай поясницу.'}
  };
  const PARTS={barbell:5,smith:5};
  const mediaCache={};

  function kindFromText(value){
    const hay=norm(value);
    if(!/ягодич.*мост|hip thrust|glute bridge|хип траст/.test(hay))return'';
    if(/smith|смит/.test(hay))return'smith';
    if(/machine|тренаж|leverage/.test(hay))return'machine';
    if(/barbell|штанг/.test(hay))return'barbell';
    return'';
  }
  function kindOf(ex){
    if(!ex)return'';
    if(ex.unvrslHipKind&&DATA[ex.unvrslHipKind])return ex.unvrslHipKind;
    return kindFromText(`${ex.id||''} ${ex.rawId||''} ${ex.n||''} ${ex.name||''} ${ex.strictName||''} ${ex.sourceName||''} ${ex.eq||ex.equipment||''}`);
  }
  function asset(kind){
    try{return new URL(`assets/hip-thrust-${kind}.gif?v=362`,D.baseURI).href}
    catch(_){return `assets/hip-thrust-${kind}.gif?v=362`}
  }
  function loadMedia(kind){
    if(!PARTS[kind])return Promise.resolve(asset(kind));
    if(mediaCache[kind])return mediaCache[kind];
    mediaCache[kind]=(async()=>{
      const count=PARTS[kind],parts=[];
      for(let i=1;i<=count;i++){
        const n=String(i).padStart(2,'0');
        const url=new URL(`gif-source/${kind}/${n}.txt?v=362`,D.baseURI).href;
        const r=await fetch(url,{cache:'no-store'});
        if(!r.ok)throw new Error(`hip media ${kind} ${n}: ${r.status}`);
        parts.push((await r.text()).trim());
      }
      return `data:image/gif;base64,${parts.join('')}`;
    })().catch(()=>asset(kind));
    return mediaCache[kind];
  }
  function normalizeHip(ex){
    if(!ex||typeof ex!=='object')return ex;
    const kind=kindOf(ex);if(!kind)return ex;
    const d=DATA[kind],oldName=String(ex.planRaw||ex.raw||ex.n||'').trim();
    const direct=PARTS[kind]?'':asset(kind);
    return {...ex,planRaw:oldName||d.name,n:d.name,name:d.name,strictName:d.name,bp:'upper legs',tg:'glutes',eq:d.eq,gif:direct,gif_url:direct,image:'',mediaUnavailable:false,instructions:{...(typeof ex.instructions==='object'?ex.instructions:{}),ru:d.tech},unvrslHipKind:kind};
  }
  W.UNVRSL_NORMALIZE_HIP_V362=normalizeHip;

  function patchRuName(){
    let base;try{base=W.ruExerciseName||ruExerciseName}catch(_){base=W.ruExerciseName}
    if(typeof base!=='function'||base.__hipNameV362)return;
    const wrapped=function(name){const kind=kindFromText(name);return kind?DATA[kind].name:base.apply(this,arguments)};
    wrapped.__hipNameV362=true;W.ruExerciseName=wrapped;try{ruExerciseName=wrapped}catch(_){ }
  }
  async function fixRenderedDetail(kind){
    if(!kind||!DATA[kind])return;
    const sheet=D.getElementById('sheet');if(!sheet)return;
    const token=`${kind}-${Date.now()}-${Math.random()}`;sheet.dataset.hipMediaV362=token;
    const title=sheet.querySelector('.detail-title');if(title)title.textContent=DATA[kind].name;
    let media=sheet.querySelector('.exercise-media');
    if(PARTS[kind]&&media)media.remove();
    if(!PARTS[kind]){
      const img=sheet.querySelector('.exercise-media img');if(img)img.src=asset(kind);
      return;
    }
    try{
      const src=await loadMedia(kind);
      if(!sheet.isConnected||sheet.dataset.hipMediaV362!==token)return;
      media=sheet.querySelector('.exercise-media');
      if(!media){
        media=D.createElement('div');media.className='exercise-media';
        const btn=sheet.querySelector('.add-plan-btn');if(btn)btn.before(media);else sheet.appendChild(media);
      }
      let img=media.querySelector('img');if(!img){img=D.createElement('img');media.appendChild(img)}
      img.alt=DATA[kind].name;img.loading='eager';img.src=src;
    }catch(_){ }
  }
  function patchFind(){
    let base;try{base=W.findExercise||findExercise}catch(_){base=W.findExercise}
    if(typeof base!=='function'||base.__hipV362)return;
    const wrapped=function(){return normalizeHip(base.apply(this,arguments))};
    wrapped.__hipV362=true;W.findExercise=wrapped;try{findExercise=wrapped}catch(_){ }
  }
  function patchCatalog(){
    let base;try{base=W.catalogRecords||catalogRecords}catch(_){base=W.catalogRecords}
    if(typeof base!=='function'||base.__hipV362)return;
    const wrapped=function(){const rows=base.apply(this,arguments);return Array.isArray(rows)?rows.map(normalizeHip):rows};
    wrapped.__hipV362=true;W.catalogRecords=wrapped;try{catalogRecords=wrapped}catch(_){ }
  }
  function patchDetail(){
    let base;try{base=W.renderExerciseDetail||renderExerciseDetail}catch(_){base=W.renderExerciseDetail}
    if(typeof base!=='function'||base.__hipV362)return;
    const wrapped=function(ex){
      const normalized=normalizeHip(ex),kind=kindOf(normalized),r=base.call(this,normalized);
      if(kind){fixRenderedDetail(kind);setTimeout(()=>fixRenderedDetail(kind),40)}
      return r;
    };
    wrapped.__hipV362=true;W.renderExerciseDetail=wrapped;try{renderExerciseDetail=wrapped}catch(_){ }
  }
  function patchRows(){
    D.querySelectorAll('#exList .smart-ex-row,#exList .exlib-btn').forEach(row=>{
      const title=row.querySelector('b');if(!title)return;
      const meta=row.querySelector('.catalog-meta')?.textContent||'',kind=kindFromText(`${title.textContent||''} ${meta}`);if(!kind)return;
      title.textContent=DATA[kind].name;
      const img=row.querySelector('img.ex-thumb');if(!img)return;
      if(PARTS[kind])loadMedia(kind).then(src=>{if(img.isConnected)img.src=src}).catch(()=>{});else img.src=asset(kind);
    });
  }
  function boot(){
    patchRuName();patchFind();patchCatalog();patchDetail();patchRows();
    try{if(D.querySelector('#exercises.page.active')&&typeof renderExerciseResults==='function')renderExerciseResults()}catch(_){ }
  }
  [0,60,180,450,900,1800,3500,6000].forEach(t=>setTimeout(boot,t));
})();
