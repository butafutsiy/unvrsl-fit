'use strict';
(()=>{
  if(window.__unvrslPersistenceSafety)return;
  window.__unvrslPersistenceSafety=true;

  const PRIMARY='unvrsl-fit-v3';
  const LEGACY='unvrsl-fit-v2';
  const BACKUP='unvrsl-fit-v3-backup';
  const BACKUP_PREV='unvrsl-fit-v3-backup-prev';
  const JOURNAL='unvrsl-fit-session-journal-v1';
  const META='unvrsl-fit-persistence-meta-v1';
  const BLOCKED_SESSION_IDS=new Set(['s1787842239872']);

  const parse=(raw)=>{try{return raw?JSON.parse(raw):null}catch(e){return null}};
  const clone=(x)=>{try{return JSON.parse(JSON.stringify(x))}catch(e){return null}};
  const blocked=(s)=>!!s?.id&&BLOCKED_SESSION_IDS.has(String(s.id));
  const completed=(s)=>Array.isArray(s?.sessions)?s.sessions:[];
  const currentDone=(s)=>{try{return s?.current?.ex?.reduce((a,e)=>a+(e.set||[]).filter(x=>x.ok).length,0)||0}catch(e){return 0}};

  function scrubState(state){
    if(!state||typeof state!=='object')return false;
    let changed=false;
    if(Array.isArray(state.sessions)){
      const before=state.sessions.length;
      state.sessions=state.sessions.filter(s=>!blocked(s));
      if(state.sessions.length!==before)changed=true;
    }
    if(blocked(state.current)){state.current=null;changed=true}
    return changed;
  }

  let blockedRemoved=scrubState(st);

  function writeSnapshot(){
    try{
      const snapshot=clone(st);
      if(!snapshot)return;
      scrubState(snapshot);
      const old=localStorage.getItem(BACKUP);
      if(old)localStorage.setItem(BACKUP_PREV,old);
      localStorage.setItem(BACKUP,JSON.stringify({savedAt:Date.now(),state:snapshot}));
      localStorage.setItem(META,JSON.stringify({savedAt:Date.now(),sessions:completed(snapshot).length,currentDone:currentDone(snapshot)}));
    }catch(e){console.warn('UNVRSL persistence backup',e)}
  }

  function readBackup(key){
    const x=parse(localStorage.getItem(key));
    if(x?.state&&typeof x.state==='object')scrubState(x.state);
    return x?.state&&typeof x.state==='object'?x:null;
  }

  function journal(){
    const x=parse(localStorage.getItem(JOURNAL));
    const list=Array.isArray(x)?x:[];
    return list.filter(s=>!blocked(s));
  }

  function writeJournal(list){
    try{localStorage.setItem(JOURNAL,JSON.stringify(list.filter(s=>!blocked(s)).slice(-120)))}catch(e){}
  }

  function addJournalSession(s){
    if(!s?.id||blocked(s))return;
    const list=journal();
    const copy=clone(s);
    const i=list.findIndex(x=>String(x.id)===String(copy.id));
    if(i>=0)list[i]=copy;else list.push(copy);
    writeJournal(list);
  }

  function mergeSessions(list){
    if(!Array.isArray(list)||!list.length)return 0;
    st.sessions=Array.isArray(st.sessions)?st.sessions:[];
    const ids=new Set(st.sessions.map(x=>String(x.id)));
    let added=0;
    for(const s of list){
      if(blocked(s))continue;
      if(s?.id&&!ids.has(String(s.id))){st.sessions.push(clone(s));ids.add(String(s.id));added++}
    }
    if(added)st.sessions.sort((a,b)=>(a.started||0)-(b.started||0));
    return added;
  }

  function recoverJournal(){
    try{
      const clean=journal();writeJournal(clean);
      const added=mergeSessions(clean);
      if(added&&typeof save==='function')save();
      return added;
    }catch(e){return 0}
  }

  function recoverLegacy(){
    try{
      const legacy=parse(localStorage.getItem(LEGACY));
      if(!legacy||typeof legacy!=='object')return 0;
      scrubState(legacy);
      let added=mergeSessions(legacy.sessions);
      if(!st.current&&legacy.current&&currentDone(legacy)>0&&Date.now()-(legacy.current.started||0)<7*24*3600*1000){st.current=clone(legacy.current);added++}
      if(added&&typeof save==='function')save();
      return added;
    }catch(e){return 0}
  }

  function recoverActive(){
    try{
      if(st.current)return false;
      const candidates=[readBackup(BACKUP),readBackup(BACKUP_PREV)].filter(Boolean).sort((a,b)=>(b.savedAt||0)-(a.savedAt||0));
      const recent=candidates.find(x=>x.state?.current&&currentDone(x.state)>0&&Date.now()-(x.savedAt||0)<72*3600*1000);
      if(!recent)return false;
      st.current=clone(recent.state.current);
      if(typeof save==='function')save();
      return true;
    }catch(e){return false}
  }

  const baseSave=typeof window.save==='function'?window.save:null;
  if(baseSave){
    window.save=function(){
      scrubState(st);
      try{baseSave()}finally{writeSnapshot()}
    };
    try{save=window.save}catch(e){}
  }

  const baseFinish=typeof window.finish==='function'?window.finish:null;
  if(baseFinish){
    window.finish=function(){
      const before=clone(st.current);
      writeSnapshot();
      const result=baseFinish.apply(this,arguments);
      if(before&&!blocked(before)){
        const finished=(st.sessions||[]).find(x=>String(x.id)===String(before.id))||before;
        if(!finished.ended)finished.ended=Date.now();
        addJournalSession(finished);
      }
      writeSnapshot();
      return result;
    };
    try{finish=window.finish}catch(e){}
  }

  const legacyRecovered=recoverLegacy();
  const journalRecovered=recoverJournal();
  const activeRecovered=recoverActive();
  blockedRemoved=scrubState(st)||blockedRemoved;
  if(blockedRemoved&&typeof save==='function')save();
  writeJournal(journal());
  writeSnapshot();

  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')writeSnapshot()});
  window.addEventListener('pagehide',writeSnapshot,{capture:true});
  window.addEventListener('beforeunload',writeSnapshot,{capture:true});
  setInterval(()=>{try{if(st.current)writeSnapshot()}catch(e){}},5000);

  if(blockedRemoved)setTimeout(()=>{try{render();toast('Ошибочная тренировка удалена из статистики')}catch(e){}},250);
  else if(activeRecovered)setTimeout(()=>{try{toast('Активная тренировка восстановлена')}catch(e){}},600);
  else if(legacyRecovered||journalRecovered)setTimeout(()=>{try{toast('История тренировок восстановлена')}catch(e){}},600);
})();

// Account cloud bootstrap: local storage remains primary for offline use, Supabase stores a durable per-user copy.
Promise.resolve()
 .then(()=>window.UNVRSL_CLOUD?null:loadExternalScript('cloud-config.js'))
 .then(()=>loadExternalScript('supabase-loader.js'))
 .then(()=>window.UNVRSL_SUPABASE_READY)
 .then(()=>window.cloud?.client?null:loadExternalScript('cloud.js'))
 .then(()=>loadExternalScript('account-sync.js'))
 .catch(e=>console.warn('UNVRSL account bootstrap',e));
