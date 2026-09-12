'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslBarbellMediaFixV364)return;
  W.__unvrslBarbellMediaFixV364=true;

  const NAME='Ягодичный мост со штангой';
  const norm=v=>String(v??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[‐‑‒–—-]+/g,' ').replace(/\s+/g,' ').trim();
  const isBarbellHip=value=>{
    const s=norm(value);
    return (/ягодич.*мост|hip thrust|glute bridge|хип траст/.test(s))&&(/штанг|barbell/.test(s));
  };

  let sourcePromise=null;
  function correctedMedia(){
    if(sourcePromise)return sourcePromise;
    sourcePromise=(async()=>{
      const parts=[];
      for(let i=1;i<=6;i++){
        const n=String(i).padStart(2,'0');
        const url=new URL(`gif-source/barbell-v364/${n}.txt?v=364`,D.baseURI).href;
        const r=await fetch(url,{cache:'no-store'});
        if(!r.ok)throw new Error(`barbell gif ${n}: ${r.status}`);
        parts.push((await r.text()).trim());
      }
      return `data:image/gif;base64,${parts.join('')}`;
    })();
    return sourcePromise;
  }

  async function patchRows(){
    let src;try{src=await correctedMedia()}catch(_){return}
    D.querySelectorAll('#exList .smart-ex-row,#exList .exlib-btn').forEach(row=>{
      const title=row.querySelector('b');
      const meta=row.querySelector('.catalog-meta')?.textContent||'';
      if(!title||!isBarbellHip(`${title.textContent||''} ${meta}`))return;
      title.textContent=NAME;
      const img=row.querySelector('img.ex-thumb');
      if(img&&img.src!==src){img.src=src;img.alt=NAME}
    });
  }

  async function patchDetail(){
    const sheet=D.getElementById('sheet');if(!sheet)return;
    const title=sheet.querySelector('.detail-title');
    const tags=sheet.querySelector('.detail-tags')?.textContent||'';
    if(!isBarbellHip(`${title?.textContent||''} ${tags}`))return;
    if(title)title.textContent=NAME;
    let src;try{src=await correctedMedia()}catch(_){return}
    if(!sheet.isConnected)return;
    let box=sheet.querySelector('.exercise-media');
    if(!box){
      box=D.createElement('div');box.className='exercise-media';
      const btn=sheet.querySelector('.add-plan-btn');
      if(btn)btn.before(box);else sheet.appendChild(box);
    }
    let img=box.querySelector('img');
    if(!img){img=D.createElement('img');box.appendChild(img)}
    img.alt=NAME;img.loading='eager';
    if(img.src!==src)img.src=src;
  }

  function wrapResults(){
    let base;try{base=W.renderExerciseResults||renderExerciseResults}catch(_){base=W.renderExerciseResults}
    if(typeof base!=='function'||base.__barbellMediaV364)return;
    const wrapped=function(){
      const r=base.apply(this,arguments);
      Promise.resolve().then(patchRows);
      setTimeout(patchRows,40);
      return r;
    };
    wrapped.__barbellMediaV364=true;W.renderExerciseResults=wrapped;
    try{renderExerciseResults=wrapped}catch(_){ }
  }

  function wrapDetail(){
    let base;try{base=W.renderExerciseDetail||renderExerciseDetail}catch(_){base=W.renderExerciseDetail}
    if(typeof base!=='function'||base.__barbellMediaV364)return;
    const wrapped=function(){
      const r=base.apply(this,arguments);
      Promise.resolve().then(patchDetail);
      setTimeout(patchDetail,60);
      setTimeout(patchDetail,220);
      return r;
    };
    wrapped.__barbellMediaV364=true;W.renderExerciseDetail=wrapped;
    try{renderExerciseDetail=wrapped}catch(_){ }
  }

  function boot(){wrapResults();wrapDetail();patchRows();patchDetail()}
  [0,80,220,500,1000,2000,4000,6500,9000].forEach(t=>setTimeout(boot,t));
})();
