'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslNativeRepPlaceholderV287)return;
  W.__unvrslNativeRepPlaceholderV287=true;

  const SPECIAL=/UNVRSL|SLDR|\bDS\b|FST-7/i;
  const baseName=n=>String(n||'').split(' — ')[0].trim();
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const same=(a,b)=>Number.isFinite(Number(a))&&Number.isFinite(Number(b))&&Math.abs(Number(a)-Number(b))<0.0001;
  const cache=new Map();

  function sourceRoutine(s){
    return (W.UNVRSL_ROUTINES||[]).find(r=>Number(r?.w)===Number(s?.w)&&String(r?.c)===String(s?.c))||null;
  }
  function sourceEntry(s,group,local,e){
    const r=sourceRoutine(s),idx=group?.indices?.[local],src=r?.e?.[Number(idx)];
    if(src&&baseName(src.n)===baseName(e?.n))return src;
    return e||src||null;
  }
  function manualRep(set,src,label){
    if(!set)return true;
    if(set.ok||set.manualFields?.r||set.__repManualV272||set.__repManualV283||set.__repManualV287)return true;
    const m=String(label||'').match(/^\s*(\d+(?:[.,]\d+)?)/),lo=m?Number(m[1].replace(',','.')):NaN;
    const raw=src?.sd?Number(src?.r)/2:Number(src?.r);
    const cur=set.r;
    if(cur===''||cur==null||Number(cur)===0||same(cur,lo)||same(cur,raw))return false;
    return true;
  }

  function previewRanges(s){
    const key=`${s?.w}:${s?.c}`;
    if(cache.has(key))return cache.get(key);
    let fn=null;try{fn=typeof preview==='function'?preview:W.preview}catch(_){fn=W.preview}
    if(typeof fn!=='function'||!fn.__unvrslPreviewAuthorityV281)return null;
    let captured='';
    const capture=html=>{captured=String(html||'');return captured};
    let oldWindowModal=W.modal,oldBinding=null,hasBinding=false;
    try{oldBinding=modal;hasBinding=true;modal=capture}catch(_){ }
    try{W.modal=capture;fn(s.w,s.c)}catch(_){captured=''}finally{
      W.modal=oldWindowModal;
      if(hasBinding)try{modal=oldBinding}catch(_){ }
    }
    if(!captured)return null;
    const t=D.createElement('template');t.innerHTML=captured;
    const out=new Map();
    [...t.content.querySelectorAll('.rp281-item')].forEach(item=>{
      const name=baseName(item.querySelector('.rp281-name')?.textContent||'');
      const text=String(item.querySelector('.rp281-prescription')?.textContent||'').trim();
      const m=text.match(/^\s*\d+\s*[×x]\s*(\d+(?:[.,]\d+)?\s*[–-]\s*\d+(?:[.,]\d+)?)/);
      if(name&&m&&!out.has(name))out.set(name,m[1].replace(/\s+/g,''));
    });
    if(out.size)cache.set(key,out);
    return out.size?out:null;
  }

  function installCard(){
    let cur=null;try{cur=typeof exerciseGroupCard==='function'?exerciseGroupCard:W.exerciseGroupCard}catch(_){cur=W.exerciseGroupCard}
    if(typeof cur!=='function'||cur.__nativeRepPlaceholderV287)return false;
    const wrapped=function(s,group){
      const html=cur.apply(this,arguments);
      if(!html||!s||!group||group.entries?.every(e=>e.mode==='cardio'))return html;
      let method='';try{method=typeof methodType==='function'?methodType(group.entries):''}catch(_){ }
      if(method||(group.entries||[]).some(e=>SPECIAL.test(String(e?.n||''))))return html;
      const ranges=previewRanges(s);if(!ranges)return html;
      let title=group.base;try{if(typeof displayExerciseName==='function')title=displayExerciseName(group.base)}catch(_){ }
      const label=ranges.get(baseName(title))||ranges.get(baseName(group.base));if(!label)return html;

      const rows=[];
      (group.entries||[]).forEach((e,local)=>{
        const src=sourceEntry(s,group,local,e);
        (e.set||[]).forEach((set,si)=>rows.push({set,src,e,si}));
      });
      const t=D.createElement('template');t.innerHTML=html;
      const inputs=[...t.content.querySelectorAll('.setrow:not(.cardiorow)')].map(row=>row.querySelectorAll('input')?.[1]).filter(Boolean);
      inputs.forEach((inp,i)=>{
        const row=rows[i];if(!row)return;
        inp.setAttribute('placeholder',label);
        inp.setAttribute('aria-label',`Повторы, цель ${label}`);
        inp.setAttribute('data-unvrsl-rep-placeholder-v287','1');
        if(!manualRep(row.set,row.src,label))inp.setAttribute('value','');
      });
      return t.innerHTML;
    };
    wrapped.__nativeRepPlaceholderV287=true;
    wrapped.__nativeRepPlaceholderV287Base=cur;
    W.exerciseGroupCard=wrapped;try{exerciseGroupCard=wrapped}catch(_){ }
    return true;
  }

  function installEdit(){
    let cur=null;try{cur=typeof editSet==='function'?editSet:W.editSet}catch(_){cur=W.editSet}
    if(typeof cur!=='function'||cur.__nativeRepPlaceholderEditV287)return false;
    const wrapped=function(ei,si,k,v){
      if(k==='r'){
        const set=state()?.current?.ex?.[Number(ei)]?.set?.[Number(si)];
        if(set){set.manualFields={...(set.manualFields||{}),r:true};set.__repManualV287=true}
      }
      return cur.apply(this,arguments);
    };
    wrapped.__nativeRepPlaceholderEditV287=true;
    wrapped.__nativeRepPlaceholderEditV287Base=cur;
    W.editSet=wrapped;try{editSet=wrapped}catch(_){ }
    return true;
  }

  if(!D.getElementById('unvrsl-native-rep-placeholder-v287-style')){
    const style=D.createElement('style');style.id='unvrsl-native-rep-placeholder-v287-style';
    style.textContent='#start input[data-unvrsl-rep-placeholder-v287="1"]::placeholder{color:#8e8e93!important;opacity:.72!important}';
    D.head.appendChild(style);
  }

  function install(){installEdit();if(installCard()){try{if(D.getElementById('start')?.classList.contains('active')&&typeof startPage==='function')startPage()}catch(_){ }}}
  install();
  [40,100,220,450,900,1600,3000,6000].forEach(ms=>setTimeout(install,ms));
  W.addEventListener('load',install,{once:true});
})();
