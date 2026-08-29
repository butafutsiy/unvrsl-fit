'use strict';
(()=>{
  if(window.__unvrslWorkoutRecommendationV177)return;
  window.__unvrslWorkoutRecommendationV177=true;

  const style=document.createElement('style');
  style.id='unvrsl-workout-recommendation-v177-style';
  style.textContent=`
    #start .u177-rec{
      margin:4px 0 1px 28px!important;
      min-height:16px;
      display:flex;
      align-items:center;
      gap:5px;
      flex-wrap:wrap;
      font-size:10.5px;
      line-height:1.15;
      color:#8e8e93
    }
    #start .u177-rec b{color:var(--green);font-weight:800}
    #start .u177-rec .u177-mode{color:#737378;font-size:9.5px}
    #start .u177-rec[data-mode="adaptive"] .u177-mode{color:var(--green)}
    @media(max-width:430px){#start .u177-rec{margin-left:28px!important;font-size:10px;gap:4px}}
  `;
  document.head.appendChild(style);

  const num=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const fmt=v=>{const n=num(v);if(n==null)return'—';return Number.isInteger(n)?String(n):String(Math.round(n*10)/10).replace('.',',')};
  const state=()=>{try{if(typeof st!=='undefined'){window.st=st;return st}}catch(_){ }return window.st||null};

  function idxFromRow(row){
    const marked=row.querySelector('[data-u174-ei][data-u174-si]');
    if(marked)return{ei:Number(marked.dataset.u174Ei),si:Number(marked.dataset.u174Si)};
    const inputs=[...row.querySelectorAll('input')];
    for(const input of inputs){
      const raw=input.getAttribute('onchange')||'';
      let m=raw.match(/editSet\((\d+)\s*,\s*(\d+)/);
      if(!m)m=raw.match(/unvrslEditEffort174\((\d+)\s*,\s*(\d+)/);
      if(m)return{ei:Number(m[1]),si:Number(m[2])};
    }
    return null;
  }

  function recommendationFor(e,x,cur){
    if(!x)return null;
    const adaptive=num(x.adaptiveSuggestedW);
    const existing=num(x.recommended177W);
    const planned=num(x.plannedW);
    const current=num(x.w);
    let w=adaptive??existing??planned??current;
    if(!(w>0))return null;
    const reps=num(x.r);
    const target=num(e?.target)??num(cur?.target);
    const adaptiveMode=adaptive!=null&&adaptive>0&&!!e?.unvrslAdaptive174;
    if(x.recommended177W==null)x.recommended177W=w;
    return{w,reps,target,mode:adaptiveMode?'adaptive':'plan'};
  }

  function render(){
    const s=state(),cur=s?.current;if(!cur)return;
    document.querySelectorAll('#start .exercise:not(.anton-superset):not(.anton-single) .setrow:not(.cardiorow)').forEach(row=>{
      const idx=idxFromRow(row);if(!idx)return;
      const e=cur.ex?.[idx.ei],x=e?.set?.[idx.si];if(!e||!x)return;
      const rec=recommendationFor(e,x,cur);if(!rec)return;
      let el=row.parentElement?.querySelector?.(`.u177-rec[data-ei="${idx.ei}"][data-si="${idx.si}"]`);
      if(!el){
        el=document.createElement('div');el.className='u177-rec';el.dataset.ei=idx.ei;el.dataset.si=idx.si;
        const prev=row.nextElementSibling?.classList?.contains('prev-set')?row.nextElementSibling:null;
        if(prev)prev.insertAdjacentElement('afterend',el);else row.insertAdjacentElement('afterend',el);
      }
      el.dataset.mode=rec.mode;
      const effort=rec.target!=null?` · RPE ${fmt(rec.target)}`:'';
      const reps=rec.reps!=null?` × ${fmt(rec.reps)}`:'';
      const mode=rec.mode==='adaptive'?'адаптивно':'по плану';
      const note=rec.mode==='plan'?' · прошлый RPE/RIR не учтён':'';
      el.innerHTML=`<span>Рекомендация:</span> <b>${fmt(rec.w)} кг${reps}${effort}</b><span class="u177-mode">${mode}${note}</span>`;
    });
  }

  function install(){
    const base=window.startPage;
    if(typeof base!=='function'||base.__u177Recommendation)return false;
    const wrapped=function(){const r=base.apply(this,arguments);requestAnimationFrame(render);setTimeout(render,80);return r};
    wrapped.__u177Recommendation=true;
    window.startPage=wrapped;try{startPage=wrapped}catch(_){ }
    return true;
  }

  install();[50,250,900,1800].forEach(t=>setTimeout(()=>{install();render()},t));
  const root=document.getElementById('start');if(root)new MutationObserver(()=>queueMicrotask(render)).observe(root,{childList:true,subtree:true});
  render();
})();
