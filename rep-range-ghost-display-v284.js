'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslRepRangeGhostDisplayV284)return;
  W.__unvrslRepRangeGhostDisplayV284=true;

  function paint(){
    const root=D.getElementById('start');
    if(!root)return;
    root.querySelectorAll('input[data-rep-ghost-v283="1"]').forEach(inp=>{
      const label=String(inp.placeholder||'').trim();
      if(!label)return;
      if(inp.dataset.repGhostManualV284==='1')return;
      if(D.activeElement===inp)return;
      if(!inp.dataset.repGhostPlanValueV284)inp.dataset.repGhostPlanValueV284=inp.value||'';
      inp.value='';
      inp.classList.add('unvrsl-rep-ghost-v284');
      if(inp.dataset.repGhostBoundV284==='1')return;
      inp.dataset.repGhostBoundV284='1';
      inp.addEventListener('focus',()=>{
        inp.classList.remove('unvrsl-rep-ghost-v284');
      });
      inp.addEventListener('input',()=>{
        inp.dataset.repGhostManualV284='1';
        inp.classList.remove('unvrsl-rep-ghost-v284');
      });
      inp.addEventListener('blur',()=>{
        if(inp.dataset.repGhostManualV284!=='1'&&!String(inp.value||'').trim()){
          requestAnimationFrame(paint);
        }
      });
    });
  }

  const style=D.createElement('style');
  style.id='unvrsl-rep-ghost-display-v284-style';
  style.textContent='#start input.unvrsl-rep-ghost-v284::placeholder{color:#8e8e93;opacity:.9}';
  D.head.appendChild(style);

  let cur=null;try{cur=typeof startPage==='function'?startPage:W.startPage}catch(_){cur=W.startPage}
  if(typeof cur==='function'&&!cur.__repGhostDisplayV284){
    const wrapped=function(){const out=cur.apply(this,arguments);paint();return out};
    wrapped.__repGhostDisplayV284=true;
    W.startPage=wrapped;try{startPage=wrapped}catch(_){ }
  }

  paint();
})();
