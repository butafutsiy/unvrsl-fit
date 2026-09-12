'use strict';
(()=>{
  if(window.__unvrslPersonal8WeekRollbackV372)return;
  window.__unvrslPersonal8WeekRollbackV372=true;
  const BUILTIN='__builtin_cycle__';
  function state(){try{return typeof st!=='undefined'?st:window.st}catch(_){return window.st||null}}
  function persist(){try{if(typeof save==='function')save()}catch(_){}}
  function cleanup(){
    const s=state();if(!s||!Array.isArray(s.programs))return;
    const old=s.programs.filter(x=>x?.systemKey==='semen-8week-v2'||x?.systemKey==='editable-builtin-cycle-v370'||x?.name==='Мой план · 8 недель v2');
    if(!old.length)return;
    const ids=new Set(old.map(x=>String(x.id||'')));
    s.programs=s.programs.filter(x=>!ids.has(String(x?.id||'')));
    if(ids.has(String(s.primaryProgramId||'')))s.primaryProgramId=BUILTIN;
    if(ids.has(String(s.startProgramId||'')))s.startProgramId=BUILTIN;
    if(s.primaryProgramWeeks&&typeof s.primaryProgramWeeks==='object')ids.forEach(id=>delete s.primaryProgramWeeks[id]);
    persist();
  }
  function edit(){
    cleanup();
    const s=state(),id=String(s?.primaryProgramId||BUILTIN);
    if(id!==BUILTIN){
      try{if(typeof openProgramEditor==='function'){openProgramEditor(id,Math.max(0,(Number(s?.primaryProgramWeeks?.[id])||1)-1),0);return}}catch(_){ }
    }
    if(typeof cloneBuiltInCycle==='function'){
      const before=new Set((s?.programs||[]).map(x=>String(x.id)));
      cloneBuiltInCycle();
      const p=[...(s?.programs||[])].reverse().find(x=>!before.has(String(x.id)));
      if(p){s.primaryProgramId=p.id;s.startProgramId=p.id;if(!s.primaryProgramWeeks)s.primaryProgramWeeks={};s.primaryProgramWeeks[p.id]=Math.max(1,Number(s.week)||1);persist()}
    }else if(typeof toast==='function')toast('Редактор программы не загрузился');
  }
  window.editPersonal8WeekV367=edit;
  window.editPersonal8WeekV369=edit;
  window.editAnyProgramV370=function(id){
    cleanup();
    const p=(state()?.programs||[]).find(x=>String(x?.id||'')===String(id)||String(x?.cloudPlanId||'')===String(id));
    if(p&&typeof openProgramEditor==='function')openProgramEditor(p.id,0,0);else if(!id||String(id)===BUILTIN)edit();
  };
  function decorate(){
    const root=document.getElementById('plan');if(!root)return;
    const head=root.querySelector('.primary-plan-head .row');
    if(head&&!head.querySelector('[data-plan-edit-v372]')){
      const b=document.createElement('button');b.className='btn tiny';b.type='button';b.textContent='Редактировать';b.dataset.planEditV372='1';b.onclick=e=>{e.preventDefault();e.stopPropagation();edit()};
      const badge=head.querySelector('.chip.green');if(badge)head.insertBefore(b,badge);else head.appendChild(b)
    }
    root.querySelectorAll('.coach-program button').forEach(b=>{if(String(b.textContent||'').trim()==='Открыть')b.textContent='Редактировать'})
  }
  const base=window.planPage;
  if(typeof base==='function'&&!base.__editV372){
    const wrapped=function(){const r=base.apply(this,arguments);setTimeout(decorate,0);return r};wrapped.__editV372=true;window.planPage=wrapped;try{planPage=wrapped}catch(_){ }
  }
  cleanup();[0,200,800,1800].forEach(ms=>setTimeout(decorate,ms));
})();
