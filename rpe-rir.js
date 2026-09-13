'use strict';
(()=>{
  if(window.__unvrslRpeRir)return;
  window.__unvrslRpeRir=true;

  const style=document.createElement('style');
  style.id='unvrsl-rpe-rir-style';
  style.textContent=`
    #start .exercise:not(.anton-superset):not(.anton-single) .sethead,
    #start .exercise:not(.anton-superset):not(.anton-single) .setrow{
      grid-template-columns:24px minmax(54px,1fr) minmax(48px,.78fr) minmax(43px,.64fr) minmax(40px,.58fr) 32px!important;
      column-gap:4px!important
    }
    #start .exercise:not(.anton-superset):not(.anton-single) .sethead{font-size:9.5px!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .setrow input{min-height:37px!important;padding:6px 2px!important;font-size:13.5px!important;border-radius:11px!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .check{width:32px!important;height:32px!important;min-width:32px!important;border-radius:11px!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .prev-set{margin-left:28px!important;font-size:10px!important}
    @media(max-width:370px){
      #start .exercise:not(.anton-superset):not(.anton-single) .sethead,
      #start .exercise:not(.anton-superset):not(.anton-single) .setrow{grid-template-columns:22px minmax(48px,1fr) minmax(43px,.75fr) minmax(40px,.6fr) minmax(38px,.56fr) 30px!important;column-gap:3px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .setrow input{font-size:12.5px!important;min-height:35px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .check{width:30px!important;height:30px!important;min-width:30px!important}
    }
  `;
  document.head.appendChild(style);

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const number=value=>{if(value===''||value==null)return null;const n=Number(String(value).replace(',','.'));return Number.isFinite(n)?n:null};
  const round=value=>Math.round(value*10)/10;
  const rirFromRpe=value=>{const n=number(value);return n==null?null:round(clamp(10-n,0,10))};
  const rpeFromRir=value=>{const n=number(value);return n==null?null:round(clamp(10-n,0,10))};
  const state=()=>{try{if(typeof st!=='undefined'){window.st=st;return st}}catch(_){}return window.st||null};
  const saveState=()=>{try{if(typeof save==='function')save();else window.save?.()}catch(_){}};

  function parseEffortIndex(input){
    const raw=input?.getAttribute('onchange')||'';
    let match=raw.match(/editSet\((\d+)\s*,\s*(\d+)\s*,\s*['"]rpe['"]/);
    if(!match)match=raw.match(/editEffort\((\d+)\s*,\s*(\d+)/);
    return match?{exerciseIndex:Number(match[1]),setIndex:Number(match[2])}:null;
  }

  window.unvrslEditEffort=function(exerciseIndex,setIndex,kind,value){
    const set=state()?.current?.ex?.[exerciseIndex]?.set?.[setIndex];
    if(!set)return;
    const parsed=number(value);
    if(parsed==null){set.rpe='';set.rir=''}
    else if(kind==='rir'){set.rir=round(clamp(parsed,0,10));set.rpe=rpeFromRir(set.rir)}
    else{set.rpe=round(clamp(parsed,0,10));set.rir=rirFromRpe(set.rpe)}
    set.actualRpe=set.rpe===''?null:set.rpe;
    set.actualRir=set.rir===''?null:set.rir;
    saveState();
    document.querySelectorAll(`[data-effort-exercise="${exerciseIndex}"][data-effort-set="${setIndex}"]`).forEach(input=>{
      input.value=input.dataset.effortKind==='rir'?(set.rir??''):(set.rpe??'');
    });
  };

  function enhanceWorkout(){
    const current=state()?.current;
    if(!current)return;
    document.querySelectorAll('#start .exercise:not(.anton-superset):not(.anton-single)').forEach(card=>{
      const head=card.querySelector('.sethead:not(.cardiohead)');
      if(!head)return;
      if(!head.querySelector('.rpe-rir-head')){
        const label=document.createElement('span');
        label.className='rpe-rir-head';
        label.textContent='RIR';
        head.insertBefore(label,head.lastElementChild);
      }
      card.querySelectorAll('.setrow:not(.cardiorow)').forEach(row=>{
        const rpe=[...row.querySelectorAll('input')].find(input=>(input.getAttribute('onchange')||'').includes("'rpe'"))||row.querySelectorAll('input')[2];
        const index=parseEffortIndex(rpe);
        if(!rpe||!index)return;
        const set=current.ex?.[index.exerciseIndex]?.set?.[index.setIndex];
        if(!set)return;
        rpe.dataset.effortExercise=index.exerciseIndex;
        rpe.dataset.effortSet=index.setIndex;
        rpe.dataset.effortKind='rpe';
        rpe.setAttribute('onchange',`unvrslEditEffort(${index.exerciseIndex},${index.setIndex},'rpe',this.value)`);
        if(!row.querySelector('.rpe-rir-input')){
          const rir=document.createElement('input');
          rir.className='rpe-rir-input';
          rir.inputMode='decimal';
          rir.value=set.rir??'';
          rir.placeholder=String(rirFromRpe(current.ex?.[index.exerciseIndex]?.target??current.target??8)??'');
          rir.dataset.effortExercise=index.exerciseIndex;
          rir.dataset.effortSet=index.setIndex;
          rir.dataset.effortKind='rir';
          rir.setAttribute('onchange',`unvrslEditEffort(${index.exerciseIndex},${index.setIndex},'rir',this.value)`);
          row.insertBefore(rir,row.querySelector('.check'));
        }
      });
      card.querySelectorAll('.chip').forEach(chip=>{if(/^RIR\s/i.test((chip.textContent||'').trim()))chip.remove()});
    });
  }

  function install(){
    let base=null;
    try{if(typeof startPage==='function')base=startPage}catch(_){}
    if(!base)base=window.startPage;
    if(typeof base!=='function'||base.__rpeRirOwner)return false;
    const wrapped=function(){
      const result=base.apply(this,arguments);
      requestAnimationFrame(enhanceWorkout);
      return result;
    };
    wrapped.__rpeRirOwner=true;
    window.startPage=wrapped;
    try{startPage=wrapped}catch(_){}
    return true;
  }

  install();
  let attempts=0;
  const timer=setInterval(()=>{install();if(++attempts>160)clearInterval(timer)},150);
  setTimeout(enhanceWorkout,800);
})();

