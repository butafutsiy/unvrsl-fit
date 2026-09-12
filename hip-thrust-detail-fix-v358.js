'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslHipThrustDetailFixV360)return;
  W.__unvrslHipThrustDetailFixV360=true;

  const norm=v=>String(v??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[‐‑‒–—-]+/g,' ').replace(/\s+/g,' ').trim();
  const DATA={
    machine:{name:'Ягодичный мост в тренажёре',eq:'leverage machine',tech:'Зафиксируй верх спины на опоре и поставь стопы устойчиво на платформу. Опускай таз подконтрольно, сохраняя нейтральное положение позвоночника. Разгибай таз за счёт ягодичных до линии плечи – таз – колени. В верхней точке сделай короткую фиксацию без переразгибания поясницы.'},
    smith:{name:'Ягодичный мост в Смите',eq:'smith machine',tech:'Расположи верх спины на скамье, гриф Смита – над тазом через мягкую накладку. Стопы поставь примерно на ширине таза так, чтобы в верхней точке голени были близки к вертикали. Опускай таз подконтрольно и разгибай его до нейтрального положения корпуса.'},
    barbell:{name:'Ягодичный мост со штангой',eq:'barbell',tech:'Расположи верх спины на скамье, штангу – над тазом через мягкую накладку. Стопы поставь устойчиво; в верхней точке голени должны быть близки к вертикали. Опускай таз подконтрольно и разгибай его за счёт ягодичных до линии плечи – таз – колени. Удерживай штангу руками и не переразгибай поясницу.'}
  };

  function kindOf(ex){
    if(!ex)return'';
    if(ex.unvrslHipKind&&DATA[ex.unvrslHipKind])return ex.unvrslHipKind;
    const hay=norm(`${ex.id||''} ${ex.rawId||''} ${ex.n||''} ${ex.name||''} ${ex.strictName||''} ${ex.sourceName||''} ${ex.eq||ex.equipment||''}`);
    if(!/ягодич.*мост|hip thrust|glute bridge|хип траст/.test(hay))return'';
    if(/smith|смит/.test(hay))return'smith';
    if(/machine|тренаж|leverage/.test(hay))return'machine';
    if(/barbell|штанг/.test(hay))return'barbell';
    return'';
  }

  function media(kind){
    try{return new URL(`assets/hip-thrust-${kind}.gif?v=360`,D.baseURI).href}
    catch(_){return `assets/hip-thrust-${kind}.gif?v=360`}
  }

  function normalizeHip(ex){
    if(!ex||typeof ex!=='object')return ex;
    const kind=kindOf(ex);if(!kind)return ex;
    const d=DATA[kind],gif=media(kind);
    const oldName=String(ex.planRaw||ex.raw||ex.n||'').trim();
    return {...ex,planRaw:oldName||d.name,n:d.name,name:d.name,strictName:d.name,bp:'upper legs',tg:'glutes',eq:d.eq,gif,gif_url:gif,image:'',mediaUnavailable:false,instructions:{...(typeof ex.instructions==='object'?ex.instructions:{}),ru:d.tech},unvrslHipKind:kind};
  }
  W.UNVRSL_NORMALIZE_HIP_V360=normalizeHip;

  function fixRenderedDetail(kind){
    if(!kind||!DATA[kind])return;
    const sheet=D.getElementById('sheet');if(!sheet)return;
    const title=sheet.querySelector('.detail-title');if(title)title.textContent=DATA[kind].name;
    const img=sheet.querySelector('.exercise-media img');if(img&&img.src!==media(kind))img.src=media(kind);
  }

  function patchFind(){
    let base;try{base=W.findExercise||findExercise}catch(_){base=W.findExercise}
    if(typeof base!=='function'||base.__hipV360)return;
    const wrapped=function(){return normalizeHip(base.apply(this,arguments))};
    wrapped.__hipV360=true;W.findExercise=wrapped;try{findExercise=wrapped}catch(_){ }
  }

  function patchCatalog(){
    let base;try{base=W.catalogRecords||catalogRecords}catch(_){base=W.catalogRecords}
    if(typeof base!=='function'||base.__hipV360)return;
    const wrapped=function(){const rows=base.apply(this,arguments);return Array.isArray(rows)?rows.map(normalizeHip):rows};
    wrapped.__hipV360=true;W.catalogRecords=wrapped;try{catalogRecords=wrapped}catch(_){ }
  }

  function patchDetail(){
    let base;try{base=W.renderExerciseDetail||renderExerciseDetail}catch(_){base=W.renderExerciseDetail}
    if(typeof base!=='function'||base.__hipV360)return;
    const wrapped=function(ex){const normalized=normalizeHip(ex),kind=kindOf(normalized),r=base.call(this,normalized);fixRenderedDetail(kind);setTimeout(()=>fixRenderedDetail(kind),0);return r};
    wrapped.__hipV360=true;W.renderExerciseDetail=wrapped;try{renderExerciseDetail=wrapped}catch(_){ }
  }

  function patchRows(){
    D.querySelectorAll('#exList .smart-ex-row,#exList .exlib-btn').forEach(row=>{
      const title=row.querySelector('b');if(!title)return;
      const meta=row.querySelector('.catalog-meta')?.textContent||'';
      const kind=kindOf({n:title.textContent,eq:meta});if(!kind)return;
      title.textContent=DATA[kind].name;
      const img=row.querySelector('img.ex-thumb');if(img)img.src=media(kind);
    });
  }

  function boot(){
    patchFind();patchCatalog();patchDetail();patchRows();
    try{if(D.querySelector('#exercises.page.active')&&typeof renderExerciseResults==='function')renderExerciseResults()}catch(_){ }
  }
  [0,60,180,450,900,1800,3500,6000].forEach(t=>setTimeout(boot,t));
})();
