'use strict';
(()=>{
  if(window.__unvrslExerciseMediaMapping)return;
  window.__unvrslExerciseMediaMapping=true;

  const originalFindMedia=window.findMediaForCustom||(()=>{try{return findMediaForCustom}catch(e){return null}})();
  const originalFindExercise=window.findExercise||(()=>{try{return findExercise}catch(e){return null}})();

  const norm=s=>String(s||'').toLowerCase().replace(/[_–—]+/g,' ').replace(/\s+/g,' ').trim();
  const lib=()=>{try{return Array.isArray(ogLibrary)?ogLibrary:[]}catch(e){return[]}};
  const exact=(...names)=>{
    const wanted=names.flat().map(norm);
    return lib().find(e=>wanted.includes(norm(e?.n)))||null;
  };
  const contains=(must=[],exclude=[])=>lib().find(e=>{
    const n=norm(e?.n);
    return must.every(x=>n.includes(norm(x)))&&!exclude.some(x=>n.includes(norm(x)));
  })||null;

  function mappedMedia(raw=''){
    const q=norm(typeof baseExerciseName==='function'?baseExerciseName(raw):raw);

    // В цикле «Подтягивания» — это подтягивания с дополнительным весом, не гравитрон.
    if(/^подтягивания(?: с весом)?$/.test(q)){
      return exact('weighted pull-up','weighted pull up')
        ||contains(['weighted','pull-up'],['assisted'])
        ||exact('pull-up','pull up')
        ||contains(['pull-up'],['assisted','archer','parallel','close grip','commando','negative']);
    }

    // «Верхний блок» в плане = обычная вертикальная тяга к груди.
    if(/^(верхний блок|тяга верхнего блока|тяга вертикального блока)$/.test(q)){
      return exact('cable bar lateral pulldown','cable lat pulldown')
        ||contains(['cable','pulldown'],['full range of motion','standing','kneeling','one arm','single arm','straight arm','behind neck','rear','reverse grip']);
    }

    // «Нижний блок» в плане = стандартная горизонтальная тяга сидя.
    if(/^(нижний блок|тяга нижнего блока|тяга нижнего блока сидя|тяга горизонтального блока)$/.test(q)){
      return exact('cable seated row')
        ||contains(['cable','seated','row'],['wide-grip','wide grip','one arm','single arm']);
    }

    return null;
  }

  function mappedTitle(raw=''){
    const q=norm(typeof baseExerciseName==='function'?baseExerciseName(raw):raw);
    if(/^подтягивания(?: с весом)?$/.test(q))return'Подтягивания с весом';
    if(/^(верхний блок|тяга верхнего блока|тяга вертикального блока)$/.test(q))return'Тяга вертикального блока';
    if(/^(нижний блок|тяга нижнего блока|тяга нижнего блока сидя|тяга горизонтального блока)$/.test(q))return'Тяга горизонтального блока';
    return typeof displayExerciseName==='function'?displayExerciseName(raw):String(raw||'');
  }

  function patchedFindMedia(raw=''){
    return mappedMedia(raw)||(typeof originalFindMedia==='function'?originalFindMedia(raw):null);
  }

  function customExercise(raw=''){
    const media=patchedFindMedia(raw);
    const meta=typeof inferCustomMeta==='function'?inferCustomMeta(raw):{};
    return {
      id:`custom:${raw}`,
      ...meta,
      ...(media||{}),
      n:mappedTitle(raw),
      raw,
      sourceName:media?.n||'',
      custom:true
    };
  }

  window.findMediaForCustom=patchedFindMedia;
  try{findMediaForCustom=patchedFindMedia}catch(e){}

  window.findExercise=function(token){
    const id=decodeURIComponent(token||'');
    if(id.startsWith('custom:'))return customExercise(id.slice(7));
    return typeof originalFindExercise==='function'?originalFindExercise(token):null;
  };
  try{findExercise=window.findExercise}catch(e){}

  window.openExerciseDetailByName=function(token){
    const raw=decodeURIComponent(token||''),ex=customExercise(raw);
    const best=typeof bestEstimateFor==='function'?bestEstimateFor(raw):null;
    try{rmState={id:ex.id,w:best?.w||20,r:best?.r||5}}catch(e){}
    if(typeof renderExerciseDetail==='function')renderExerciseDetail(ex);
  };
  try{openExerciseDetailByName=window.openExerciseDetailByName}catch(e){}

  // Красивые названия в каталоге ExerciseDB.
  try{
    EXACT_RU['weighted pull-up']='Подтягивания с весом';
    EXACT_RU['cable bar lateral pulldown']='Тяга вертикального блока';
    EXACT_RU['cable lat pulldown']='Тяга вертикального блока';
    EXACT_RU['cable seated row']='Тяга горизонтального блока';
  }catch(e){}

  // Встроенный план отображаем однозначно, но ключи истории/прогрессии не меняем.
  try{
    st.aliases=st.aliases&&typeof st.aliases==='object'?st.aliases:{};
    const aliases={
      'Подтягивания':'Подтягивания с весом',
      'Верхний блок':'Тяга вертикального блока',
      'Нижний блок':'Тяга горизонтального блока'
    };
    let changed=false;
    Object.entries(aliases).forEach(([k,v])=>{
      if(!st.aliases[k]||st.aliases[k]===k){st.aliases[k]=v;changed=true}
    });
    if(changed&&typeof save==='function')save();
  }catch(e){}
})();
