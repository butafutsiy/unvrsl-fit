'use strict';
(()=>{
  if(window.__unvrslAccountSync)return;
  window.__unvrslAccountSync=true;

  const META_KEY='unvrsl-account-sync-meta-v1';
  const DEVICE_KEY='unvrsl-device-id-v1';
  let suppress=false,timerId=null,inflight=null,lastUserId=null;

  const clone=x=>{try{return JSON.parse(JSON.stringify(x))}catch(e){return null}};
  const parse=x=>{try{return x?JSON.parse(x):null}catch(e){return null}};
  function deviceId(){
    let id=localStorage.getItem(DEVICE_KEY);
    if(!id){id='d_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);localStorage.setItem(DEVICE_KEY,id)}
    return id;
  }
  function meta(){return parse(localStorage.getItem(META_KEY))||{localModifiedAt:0,lastSyncedAt:0}}
  function setMeta(patch){const m={...meta(),...patch};localStorage.setItem(META_KEY,JSON.stringify(m));return m}
  function markLocal(){if(!suppress)setMeta({localModifiedAt:Date.now()})}
  function arr(x){return Array.isArray(x)?x:[]}
  function doneCount(session){return arr(session?.ex).reduce((sum,e)=>sum+arr(e?.set).filter(x=>x?.ok).length,0)}
  function sessionScore(s){return Number(s?.ended||s?.started||0)+doneCount(s)*10}
  function mergeByKey(first,second,keyFn,scoreFn){
    const map=new Map();
    for(const item of [...arr(first),...arr(second)]){
      if(!item)continue;const key=keyFn(item);if(!key)continue;
      const old=map.get(key);if(!old||scoreFn(item)>scoreFn(old))map.set(key,clone(item));
    }
    return [...map.values()]
  }
  function mergeStates(local,remote,remoteStamp=0){
    local=clone(local)||{};remote=clone(remote)||{};
    const lm=Number(meta().localModifiedAt||0),preferRemote=remoteStamp>lm;
    const first=preferRemote?remote:local,second=preferRemote?local:remote;
    const base=preferRemote?{...local,...remote}:{...remote,...local};
    base.sessions=mergeByKey(first.sessions,second.sessions,x=>String(x.id||''),sessionScore).sort((a,b)=>(a.started||0)-(b.started||0));
    base.bw=mergeByKey(first.bw,second.bw,x=>String(x.d||''),x=>Number(x.updatedAt||x.t||x.ts||0)).sort((a,b)=>String(a.d||'').localeCompare(String(b.d||'')));
    base.programs=mergeByKey(first.programs,second.programs,x=>String(x.id||x.title||x.name||''),x=>Number(x.updatedAt||x.createdAt||0));
    base.remotePlans=mergeByKey(first.remotePlans,second.remotePlans,x=>String(x.id||''),x=>Number(x.version||x.updatedAt||0));
    base.customExercises=mergeByKey(first.customExercises,second.customExercises,x=>String(x.id||x.n||x.name||''),x=>Number(x.updatedAt||x.createdAt||0));
    base.favorites=[...new Set([...arr(remote.favorites),...arr(local.favorites)])];
    base.hiddenExercises=[...new Set([...arr(remote.hiddenExercises),...arr(local.hiddenExercises)])];
    base.aliases=preferRemote?{...(local.aliases||{}),...(remote.aliases||{})}:{...(remote.aliases||{}),...(local.aliases||{})};
    const lc=local.current,rc=remote.current;
    if(lc&&rc){const ls=sessionScore(lc),rs=sessionScore(rc);base.current=ls===rs?(preferRemote?rc:lc):(ls>rs?lc:rc)}else base.current=lc||rc||null;
    return base;
  }
  async function waitCloud(){
    if(window.UNVRSL_SUPABASE_READY)try{await window.UNVRSL_SUPABASE_READY}catch(e){}
    for(let i=0;i<80;i++){
      if(window.cloud?.client)return window.cloud;
      await new Promise(r=>setTimeout(r,100));
    }
    return window.cloud||null;
  }
  async function fetchStructuredCloud(c,user){
    const out={sessions:[],bw:[],stamp:0};
    try{
      const [wr,br]=await Promise.all([
        c.client.from('workouts').select('payload,updated_at').eq('user_id',user.id),
        c.client.from('bodyweights').select('measure_date,weight_kg,created_at').eq('user_id',user.id)
      ]);
      if(!wr.error){
        out.sessions=arr(wr.data).map(x=>x?.payload).filter(x=>x&&typeof x==='object');
        for(const row of arr(wr.data))out.stamp=Math.max(out.stamp,Date.parse(row?.updated_at||0)||0);
      }
      if(!br.error){
        out.bw=arr(br.data).filter(x=>x?.measure_date&&x?.weight_kg!=null).map(x=>({d:x.measure_date,w:Number(x.weight_kg),t:Date.parse(x.created_at||0)||0}));
        for(const row of arr(br.data))out.stamp=Math.max(out.stamp,Date.parse(row?.created_at||0)||0);
      }
    }catch(e){console.warn('UNVRSL legacy cloud hydrate',e)}
    return out;
  }
  async function reconcile({quiet=false}={}){
    const c=await waitCloud();
    const user=c?.user;
    if(!c?.client||!user)return false;
    if(inflight)return inflight;
    inflight=(async()=>{
      try{
        const [stateRes,structured]=await Promise.all([
          c.client.from('user_app_state').select('state,client_updated_at,updated_at,device_id').eq('user_id',user.id).maybeSingle(),
          fetchStructuredCloud(c,user)
        ]);
        if(stateRes.error)throw stateRes.error;
        const appState=stateRes.data?.state&&typeof stateRes.data.state==='object'?clone(stateRes.data.state):{};
        appState.sessions=mergeByKey(appState.sessions,structured.sessions,x=>String(x.id||''),sessionScore);
        appState.bw=mergeByKey(appState.bw,structured.bw,x=>String(x.d||''),x=>Number(x.t||x.updatedAt||0));
        const remoteExists=!!stateRes.data||appState.sessions.length>0||appState.bw.length>0;
        const remoteStamp=Math.max(stateRes.data?.client_updated_at?Date.parse(stateRes.data.client_updated_at):0,structured.stamp||0);
        let merged=clone(st)||{};
        if(remoteExists)merged=mergeStates(st,appState,remoteStamp);
        suppress=true;
        try{st=merged;if(typeof save==='function')save()}finally{suppress=false}
        const stamp=Math.max(Date.now(),Number(meta().localModifiedAt||0),remoteStamp||0);
        setMeta({localModifiedAt:stamp});
        const payload={user_id:user.id,state:clone(st),client_updated_at:new Date(stamp).toISOString(),device_id:deviceId()};
        const up=await c.client.from('user_app_state').upsert(payload,{onConflict:'user_id'});
        if(up.error)throw up.error;
        if(typeof cloudSyncSession==='function')for(const s of arr(st.sessions))await cloudSyncSession(s);
        if(typeof cloudSyncBodyweights==='function')await cloudSyncBodyweights();
        setMeta({lastSyncedAt:Date.now(),lastUserId:user.id});
        if(!quiet)try{toast(remoteExists?'Данные аккаунта синхронизированы':'Облачная копия создана')}catch(e){}
        try{render()}catch(e){}
        return true;
      }catch(e){console.warn('UNVRSL account sync',e);if(!quiet)try{toast('Не удалось синхронизировать аккаунт')}catch(_){}return false}
      finally{inflight=null}
    })();
    return inflight;
  }
  function schedule(){
    if(suppress)return;
    clearTimeout(timerId);
    timerId=setTimeout(()=>reconcile({quiet:true}),2500);
  }

  const baseSave=typeof window.save==='function'?window.save:null;
  if(baseSave){
    window.save=function(){const result=baseSave.apply(this,arguments);markLocal();schedule();return result};
    try{save=window.save}catch(e){}
  }

  const originalSync=typeof window.cloudSyncAll==='function'?window.cloudSyncAll:null;
  if(originalSync){
    window.cloudSyncAll=async function(){
      if(!window.cloud?.user)return originalSync.apply(this,arguments);
      try{toast('Синхронизация…')}catch(e){}
      await reconcile({quiet:true});
      try{toast('Синхронизировано')}catch(e){}
    };
    try{cloudSyncAll=window.cloudSyncAll}catch(e){}
  }

  window.accountSyncNow=()=>reconcile({quiet:false});

  (async()=>{
    const c=await waitCloud();if(!c?.client)return;
    const {data}=await c.client.auth.getSession();
    c.user=data?.session?.user||c.user||null;
    if(c.user){lastUserId=c.user.id;await reconcile({quiet:true})}
    c.client.auth.onAuthStateChange((_event,session)=>{
      const uid=session?.user?.id||null;
      if(uid&&uid!==lastUserId){lastUserId=uid;setTimeout(()=>reconcile({quiet:false}),200)}
      if(!uid)lastUserId=null;
    });
  })();

  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')reconcile({quiet:true})});
  window.addEventListener('online',()=>reconcile({quiet:true}));
})();
