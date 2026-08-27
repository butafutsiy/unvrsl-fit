'use strict';
(()=>{
  if(window.__unvrslProgramDeletePersistenceV3)return;window.__unvrslProgramDeletePersistenceV3=true;
  const BUILTIN='__builtin_cycle__';
  const STORE='unvrsl-fit-deleted-programs-v2';
  const BUILTIN_STORE='unvrsl-fit-builtin-hidden-v1';

  const norm=v=>String(v||'').toLowerCase().replace(/[·•]/g,' ').replace(/\s+/g,' ').trim();
  function read(){
    const s=new Set(Array.isArray(st.deletedProgramKeys)?st.deletedProgramKeys:[]);
    try{(JSON.parse(localStorage.getItem(STORE)||'[]')||[]).forEach(x=>s.add(String(x)))}catch(e){}
    return s
  }
  function write(s){const a=[...s];st.deletedProgramKeys=a;try{localStorage.setItem(STORE,JSON.stringify(a))}catch(e){}}
  function durableKeys(p){
    if(!p)return[];
    const out=[];
    if(p.id)out.push('id:'+p.id);
    if(p.seedId)out.push('seed:'+p.seedId);
    if(p.cloudPlanId)out.push('cloud:'+p.cloudPlanId);
    if(p.templateKey)out.push('template:'+p.templateKey);
    if((p.seedId||p.internetTemplate||p.femaleTemplate||p.templateKey)&&p.name)out.push('name:'+norm(p.name));
    return out
  }
  function deleted(p,s=read()){return durableKeys(p).some(k=>s.has(k))}
  function visible(){return (Array.isArray(st.programs)?st.programs:[]).filter(p=>p&&!p.archived&&!deleted(p))}
  function fallback(){const p=visible()[0];return p?String(p.id):(st.builtinProgramHidden?'':BUILTIN)}
  function normalize(){
    const ids=new Set(visible().map(p=>String(p.id)));
    if((String(st.primaryProgramId)===BUILTIN&&st.builtinProgramHidden)||(String(st.primaryProgramId)!==BUILTIN&&st.primaryProgramId&&!ids.has(String(st.primaryProgramId))))st.primaryProgramId=fallback();
    if((String(st.startProgramId)===BUILTIN&&st.builtinProgramHidden)||(String(st.startProgramId)!==BUILTIN&&st.startProgramId&&!ids.has(String(st.startProgramId))))st.startProgramId=st.primaryProgramId||fallback()
  }
  function prune(saveIt=false){
    const s=read(),before=(st.programs||[]).length;
    st.programs=(Array.isArray(st.programs)?st.programs:[]).filter(p=>!deleted(p,s));normalize();
    if(saveIt||before!==st.programs.length)try{save()}catch(e){}
  }
  function refresh(){try{trainerProgramsPage()}catch(e){};try{planPage()}catch(e){}}

  try{if(localStorage.getItem(BUILTIN_STORE)==='1')st.builtinProgramHidden=true}catch(e){}
  normalize();

  const baseDelete=window.trainerDeleteOwnProgram;
  if(typeof baseDelete==='function'&&!baseDelete.__persistV3){
    const wrapped=function(id){
      id=String(id);
      if(id===BUILTIN)return window.deleteBuiltinProgram();
      const p=(Array.isArray(st.programs)?st.programs:[]).find(x=>String(x?.id)===id);
      if(p){const s=read();durableKeys(p).forEach(k=>s.add(k));write(s)}
      const r=baseDelete.apply(this,arguments);setTimeout(()=>{prune(true);refresh()},40);return r
    };
    wrapped.__persistV3=true;window.trainerDeleteOwnProgram=wrapped;window.deleteProgram=wrapped;
    try{trainerDeleteOwnProgram=wrapped;deleteProgram=wrapped}catch(e){}
  }

  const baseBuiltin=window.deleteBuiltinProgram;
  window.deleteBuiltinProgram=function(){
    if(!st.builtinProgramHidden){try{localStorage.setItem(BUILTIN_STORE,'1')}catch(e){}}
    const r=typeof baseBuiltin==='function'?baseBuiltin.apply(this,arguments):undefined;
    if(st.builtinProgramHidden){try{localStorage.setItem(BUILTIN_STORE,'1')}catch(e){};normalize();try{save()}catch(e){};refresh()}
    return r
  };
  try{deleteBuiltinProgram=window.deleteBuiltinProgram}catch(e){}

  const baseCreateFemale=window.createFemaleTemplateProgram;
  if(typeof baseCreateFemale==='function'&&!baseCreateFemale.__persistV3){
    const wrapped=function(key){
      const s=read();[...s].filter(x=>x===`template:${key}`).forEach(x=>s.delete(x));write(s);
      return baseCreateFemale.apply(this,arguments)
    };
    wrapped.__persistV3=true;window.createFemaleTemplateProgram=wrapped
  }

  function install(){
    try{if(localStorage.getItem(BUILTIN_STORE)==='1')st.builtinProgramHidden=true}catch(e){}
    prune(false)
  }
  [0,120,500,1200,2500,5000].forEach(t=>setTimeout(install,t));
  window.addEventListener('pageshow',()=>setTimeout(()=>{install();refresh()},60),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>{install();refresh()},80)},{passive:true});
})();
