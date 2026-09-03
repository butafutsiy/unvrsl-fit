'use strict';
(()=>{
  const W=window,D=document,REV=272;
  if(W.__unvrslRepRangeMobileV272)return;
  W.__unvrslRepRangeMobileV272=true;

  const SPECIAL=/UNVRSL|SLDR|\bDS\b|FST-7/i;
  const routines=()=>W.UNVRSL_ROUTINES||[];
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const saver=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};
  const finite=v=>Number.isFinite(Number(v));

  function ensureRangeEngine(){
    if(W.__unvrslBuiltInPlanRepRangesAppliedV267)return;
    if(D.getElementById('unvrsl-range-engine-v272'))return;
    const s=D.createElement('script');
    s.id='unvrsl-range-engine-v272';
    s.src='built-in-plan-rep-ranges-v267.js?v=272';
    s.async=false;
    (D.head||D.documentElement).appendChild(s);
  }

  function srcRoutine(w,c){
    return routines().find(r=>Number(r?.w)===Number(w)&&String(r?.c)===String(c))||null;
  }

  function rangeFor(src){
    if(!src||SPECIAL.test(String(src.n||''))||!finite(src.rMin)||!finite(src.rMax))return null;
    let lo=Number(src.rMin),hi=Number(src.rMax);
    if(src.sd){lo/=2;hi/=2}
    if(!finite(lo)||!finite(hi))return null;
    return {lo,hi,label:lo===hi?String(lo):`${lo}–${hi}`};
  }

  function replaceRepText(root,src){
    const t=rangeFor(src);if(!root||!t||t.lo===t.hi)return;
    const full=root.textContent||'';
    if(full.includes(`×${t.label}`)||full.includes(`x${t.label}`))return;
    const base=src.sd?Number(src.rMin)/2:Number(src.rMin);
    const walker=D.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const text=node.nodeValue||'';
      const re=new RegExp(`([×x]\\s*)${String(base).replace('.','\\.')}(?!\\s*[–-]\\s*\\d)`);
      if(re.test(text)){
        node.nodeValue=text.replace(re,`$1${t.label}`);
        return;
      }
    }
  }

  function previewRootFor(sheet,name){
    const nodes=[...sheet.querySelectorAll('.listline,.card,.exercise,[class*="preview"],[class*="routine"]')];
    return nodes.find(el=>(el.textContent||'').includes(name))||[...sheet.children].find(el=>(el.textContent||'').includes(name))||null;
  }

  function decoratePreview(w,c){
    const r=srcRoutine(w,c),sheet=D.getElementById('sheet');
    if(!r||!sheet)return;
    (r.e||[]).forEach(src=>{
      if(SPECIAL.test(String(src?.n||'')))return;
      const root=previewRootFor(sheet,String(src.n||''));
      if(root)replaceRepText(root,src);
    });
  }

  function patchPreview(){
    let cur=null;try{cur=typeof preview==='function'?preview:W.preview}catch(_){cur=W.preview}
    if(typeof cur!=='function'||cur.__repRangeMobile272)return false;
    const wrapped=function(w,c){
      const out=cur.apply(this,arguments);
      [0,30,100].forEach(ms=>setTimeout(()=>decoratePreview(w,c),ms));
      return out;
    };
    wrapped.__repRangeMobile272=true;
    wrapped.__repRangeMobile272Base=cur;
    W.preview=wrapped;try{preview=wrapped}catch(_){ }
    return true;
  }

  function decorateStart(){
    const s=state()?.current;if(!s?.ex)return;
    const r=srcRoutine(s.w,s.c);if(!r)return;
    const cards=[...D.querySelectorAll('#start .exercise')];
    let stateChanged=false;
    cards.forEach((card,ei)=>{
      const src=r.e?.[ei],ex=s.ex?.[ei],t=rangeFor(src);
      if(!src||!ex||!t||SPECIAL.test(String(src.n||'')))return;
      const rows=[...card.querySelectorAll('.setrow')];
      rows.forEach((row,si)=>{
        const set=ex.set?.[si],inputs=row.querySelectorAll('input'),inp=inputs?.[1];
        if(!set||!inp)return;
        inp.placeholder=t.label;
        inp.setAttribute('aria-label',`Повторы, цель ${t.label}`);
        const planned=src.sd?Number(src.rMin)/2:Number(src.rMin);
        if(!set.ok&&!set.__repManualV272&&(set.r===''||Number(set.r)===planned)){
          if(set.r!==''){set.r='';stateChanged=true}
          inp.value='';
        }
        if(inp.dataset.repRange272!=='1'){
          inp.dataset.repRange272='1';
          inp.addEventListener('input',()=>{
            set.__repManualV272=true;
          });
          inp.addEventListener('change',()=>{
            set.__repManualV272=true;
            setTimeout(saver,0);
          });
        }
      });
    });
    if(stateChanged){s.repRangeRevision=REV;saver()}
  }

  function install(){
    ensureRangeEngine();
    patchPreview();
    if(W.__unvrslBuiltInPlanRepRangesAppliedV267)decorateStart();
  }

  const start=D.getElementById('start');
  if(start){
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;queued=true;
      requestAnimationFrame(()=>{queued=false;install()});
    }).observe(start,{childList:true,subtree:true});
  }
  const sheet=D.getElementById('sheet');
  if(sheet){
    new MutationObserver(()=>{
      const s=state()?.current;
      if(s)decoratePreview(s.w,s.c);
    }).observe(sheet,{childList:true,subtree:true});
  }

  install();
  [50,120,250,500,900,1500,2500,4000].forEach(ms=>setTimeout(install,ms));
})();
