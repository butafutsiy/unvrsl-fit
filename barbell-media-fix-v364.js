'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslBarbellMediaFixV365)return;
  W.__unvrslBarbellMediaFixV365=true;

  const NAME='Ягодичный мост со штангой';
  const THUMB=(()=>{try{return new URL('assets/hip-thrust-barbell-thumb.svg?v=365',D.baseURI).href}catch(_){return'assets/hip-thrust-barbell-thumb.svg?v=365'}})();
  const norm=v=>String(v??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[‐‑‒–—-]+/g,' ').replace(/\s+/g,' ').trim();
  const isBarbellHip=value=>{const s=norm(value);return(/ягодич.*мост|hip thrust|glute bridge|хип траст/.test(s))&&(/штанг|barbell/.test(s))};

  let sourcePromise=null;
  function correctedMedia(){
    if(sourcePromise)return sourcePromise;
    sourcePromise=(async()=>{
      const parts=[];
      for(let i=1;i<=6;i++){
        const n=String(i).padStart(2,'0');
        const url=new URL(`gif-source/barbell-v364/${n}.txt?v=365`,D.baseURI).href;
        const r=await fetch(url,{cache:'no-store'});
        if(!r.ok)throw new Error(`barbell gif ${n}: ${r.status}`);
        parts.push((await r.text()).trim());
      }
      return `data:image/gif;base64,${parts.join('')}`;
    })();
    return sourcePromise;
  }

  function patchRows(){
    D.querySelectorAll('#exList .smart-ex-row,#exList .exlib-btn').forEach(row=>{
      const title=row.querySelector('b');
      const meta=row.querySelector('.catalog-meta')?.textContent||'';
      if(!title||!isBarbellHip(`${title.textContent||''} ${meta}`))return;
      title.textContent=NAME;
      const img=row.querySelector('img.ex-thumb');
      if(img&&img.src!==THUMB){img.src=THUMB;img.alt=NAME;img.loading='eager'}
    });
  }

  async function patchDetail(){
    const sheet=D.getElementById('sheet');if(!sheet)return;
    const title=sheet.querySelector('.detail-title');
    const tags=sheet.querySelector('.detail-tags')?.textContent||'';
    if(!isBarbellHip(`${title?.textContent||''} ${tags}`))return;
    if(title)title.textContent=NAME;
    let box=sheet.querySelector('.exercise-media');
    if(!box){box=D.createElement('div');box.className='exercise-media';const btn=sheet.querySelector('.add-plan-btn');if(btn)btn.before(box);else sheet.appendChild(box)}
    let img=box.querySelector('img');if(!img){img=D.createElement('img');box.appendChild(img)}
    img.alt=NAME;img.loading='eager';
    if(!img.src||/hip-thrust-barbell\.gif/.test(img.src))img.src=THUMB;
    let src;try{src=await correctedMedia()}catch(_){return}
    if(!sheet.isConnected)return;
    if(img.isConnected&&img.src!==src)img.src=src;
  }

  function watchList(){
    const list=D.getElementById('exList');if(!list||list.dataset.barbellThumbV365)return;
    list.dataset.barbellThumbV365='1';
    let raf=0;
    new MutationObserver(()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(patchRows)}).observe(list,{childList:true,subtree:true});
  }

  function wrapResults(){
    let base;try{base=W.renderExerciseResults||renderExerciseResults}catch(_){base=W.renderExerciseResults}
    if(typeof base!=='function'||base.__barbellMediaV365)return;
    const wrapped=function(){const r=base.apply(this,arguments);patchRows();setTimeout(patchRows,30);return r};
    wrapped.__barbellMediaV365=true;W.renderExerciseResults=wrapped;try{renderExerciseResults=wrapped}catch(_){ }
  }

  function wrapDetail(){
    let base;try{base=W.renderExerciseDetail||renderExerciseDetail}catch(_){base=W.renderExerciseDetail}
    if(typeof base!=='function'||base.__barbellMediaV365)return;
    const wrapped=function(){const r=base.apply(this,arguments);patchDetail();setTimeout(patchDetail,50);return r};
    wrapped.__barbellMediaV365=true;W.renderExerciseDetail=wrapped;try{renderExerciseDetail=wrapped}catch(_){ }
  }

  function boot(){watchList();wrapResults();wrapDetail();patchRows();patchDetail()}
  [0,60,180,450,900,1800,3500,6000,9000].forEach(t=>setTimeout(boot,t));
})();
