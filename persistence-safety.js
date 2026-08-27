'use strict';
(()=>{
  if(window.__unvrslPersistenceSafety)return;
  window.__unvrslPersistenceSafety=true;

  const PRIMARY='unvrsl-fit-v3';
  const BACKUP='unvrsl-fit-v3-backup';
  const BACKUP_PREV='unvrsl-fit-v3-backup-prev';
  const JOURNAL='unvrsl-fit-session-journal-v1';
  const META='unvrsl-fit-persistence-meta-v1';

  const parse=(raw)=>{try{return raw?JSON.parse(raw):null}catch(e){return null}};
  const clone=(x)=>{try{return JSON.parse(JSON.stringify(x))}catch(e){return null}};
  const completed=(s)=>Array.isArray(s?.sessions)?s.sessions:[];
  const currentDone=(s)=>{try{return s?.current?.ex?.reduce((a,e)=>a+(e.set||[]).filter(x=>x.ok).length,0)||0}catch(e){return 0}};

  function writeSnapshot(){
    try{
      const snapshot=clone(st);
      if(!snapshot)return;
      const old=localStorage.getItem(BACKUP);
      if(old)localStorage.setItem(BACKUP_PREV,old);
      localStorage.setItem(BACKUP,JSON.stringify({savedAt:Date.now(),state:snapshot}));
      localStorage.setItem(META,JSON.stringify({savedAt:Date.now(),sessions:completed(snapshot).length,currentDone:currentDone(snapshot)}));
    }catch(e){console.warn('UNVRSL persistence backup',e)}
  }

  function readBackup(key){
    const x=parse(localStorage.getItem(key));
    return x?.state&&typeof x.state==='object'?x:null;
  }

  function journal(){
    const x=parse(localStorage.getItem(JOURNAL));
    return Array.isArray(x)?x:[];
  }

  function writeJournal(list){
    try{localStorage.setItem(JOURNAL,JSON.stringify(list.slice(-120)))}catch(e){}
  }

  function addJournalSession(s){
    if(!s?.id)return;
    const list=journal();
    const copy=clone(s);
    const i=list.findIndex(x=>String(x.id)===String(copy.id));
    if(i>=0)list[i]=copy;else list.push(copy);
    writeJournal(list);
  }

  function recoverJournal(){
    try{
      st.sessions=Array.isArray(st.sessions)?st.sessions:[];
      const ids=new Set(st.sessions.map(x=>String(x.id)));
      let changed=false;
      for(const s of journal()){
        if(s?.id&&!ids.has(String(s.id))){st.sessions.push(s);ids.add(String(s.id));changed=true}
      }
      if(changed){
        st.sessions.sort((a,b)=>(a.started||0)-(b.started||0));
        if(typeof save==='function')save();
      }
      return changed;
    }catch(e){return false}
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
      if(before){
        const finished=(st.sessions||[]).find(x=>String(x.id)===String(before.id))||before;
        if(!finished.ended)finished.ended=Date.now();
        addJournalSession(finished);
      }
      writeSnapshot();
      return result;
    };
    try{finish=window.finish}catch(e){}
  }

  recoverJournal();
  const activeRecovered=recoverActive();
  writeSnapshot();

  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')writeSnapshot()});
  window.addEventListener('pagehide',writeSnapshot,{capture:true});
  window.addEventListener('beforeunload',writeSnapshot,{capture:true});
  setInterval(()=>{try{if(st.current)writeSnapshot()}catch(e){}},5000);

  if(activeRecovered)setTimeout(()=>{try{toast('Активная тренировка восстановлена')}catch(e){}},600);
})();
