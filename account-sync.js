'use strict';
(()=>{
  if(window.__unvrslAccountSync)return;
  window.__unvrslAccountSync=true;

  const META_KEY='unvrsl-account-sync-meta-v1';
  const DEVICE_KEY='unvrsl-device-id-v1';
  let suppress=false,timerId=null,inflight=null,lastUserId=null;
  const structuredCache=new Map(),uploadedSessions=new Map();

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
  function sessionTime(s){for(const value of [s?.ended,s?.endedAt,s?.started,s?.startedAt,s?.date]){if(typeof value==='number'&&Number.isFinite(value))return value;const num=Number(value);if(Number.isFinite(num)&&num>1e11)return num;const parsed=typeof value==='string'?Date.parse(value):NaN;if(Number.isFinite(parsed))return parsed}return 0}
  function sessionScore(s){return sessionTime(s)+doneCount(s)*10}
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
    base.sessions=mergeByKey(first.sessions,second.sessions,x=>String(x.id||''),sessionScore).sort((a,b)=>sessionTime(a)-sessionTime(b));
    base.bw=mergeByKey(first.bw,second.bw,x=>String(x.d||''),x=>Number(x.updatedAt||x.t||x.ts||0)).sort((a,b)=>String(a.d||'').localeCompare(String(b.d||'')));
    base.deletedBodyweights=mergeByKey(first.deletedBodyweights,second.deletedBodyweights,x=>String(x?.d||x||''),x=>Number(x?.at||x?.t||0));
    const weightStamp=new Map(base.bw.map(x=>[String(x.d||'').slice(0,10),Number(x.updatedAt||x.t||x.ts||0)]));
    base.deletedBodyweights=base.deletedBodyweights.filter(x=>{const d=String(x?.d||x||'').slice(0,10),deletedAt=Number(x?.at||x?.t||0);return d&&deletedAt>=Number(weightStamp.get(d)||0)});
    const deletedWeights=new Set(base.deletedBodyweights.map(x=>String(x?.d||x||'').slice(0,10)).filter(Boolean));
    base.bw=base.bw.filter(x=>!deletedWeights.has(String(x.d||'').slice(0,10)));
    base.programs=mergeByKey(first.programs,second.programs,x=>String(x.id||x.title||x.name||''),x=>Number(x.updatedAt||x.createdAt||0));
    base.remotePlans=mergeByKey(first.remotePlans,second.remotePlans,x=>String(x.id||''),x=>Number(x.version||x.updatedAt||0));
    base.customExercises=mergeByKey(first.customExercises,second.customExercises,x=>String(x.id||x.n||x.name||''),x=>Number(x.updatedAt||x.createdAt||0));
    base.favorites=[...new Set([...arr(remote.favorites),...arr(local.favorites)])];
    base.hiddenExercises=[...new Set([...arr(remote.hiddenExercises),...arr(local.hiddenExercises)])];
    base.aliases=preferRemote?{...(local.aliases||{}),...(remote.aliases||{})}:{...(remote.aliases||{}),...(local.aliases||{})};
    base.equipmentProfiles={...(remote.equipmentProfiles||{}),...(local.equipmentProfiles||{})};
    for(const [id,profile] of Object.entries(remote.equipmentProfiles||{})){
      const other=local.equipmentProfiles?.[id];
      if(other&&Number(profile.updatedAt||0)>Number(other.updatedAt||0))base.equipmentProfiles[id]=clone(profile);
    }
    base.equipmentDefaultByExercise=preferRemote?{...(local.equipmentDefaultByExercise||{}),...(remote.equipmentDefaultByExercise||{})}:{...(remote.equipmentDefaultByExercise||{}),...(local.equipmentDefaultByExercise||{})};

    // A session that is already present in history with `ended` can never be active again.
    // Also treat a fresh local `current: null` as an explicit completion/cancel state instead
    // of reviving an older remote current session during the next cloud reconcile.
    const completedIds=new Set(base.sessions.filter(x=>x?.ended&&x?.id).map(x=>String(x.id)));
    const closed=workoutStore.journal().closed;const validCurrent=x=>x&&!closed[x.id]&&(x.pendingCompletion||!x.id||!completedIds.has(String(x.id)))?x:null;
    const lc=validCurrent(local.current),rc=validCurrent(remote.current);
    if(lc&&rc&&lc.id!==rc.id){base.current=lc;}else if(lc&&rc){
      const ls=sessionScore(lc),rs=sessionScore(rc);
      base.current=ls===rs?(preferRemote?rc:lc):(ls>rs?lc:rc);
    }else if(lc){
      base.current=lc;
    }else if(rc){
      base.current=(!local.current&&!preferRemote)?null:rc;
    }else base.current=null;
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
  async function fetchAll(client,table,columns,userId,order){const out=[];for(let from=0;;from+=500){const r=await client.from(table).select(columns).eq('user_id',userId).order(order,{ascending:true}).range(from,from+499);if(r.error)throw r.error;out.push(...arr(r.data));if(arr(r.data).length<500)return out}}
  async function fetchStructuredCloud(c,user,force=false){
    const cached=structuredCache.get(user.id);if(!force&&cached&&Date.now()-cached.at<60000)return cached.value;
    const [workouts,weights]=await Promise.all([fetchAll(c.client,'workouts','payload,updated_at',user.id,'id'),fetchAll(c.client,'bodyweights','measure_date,weight_kg,created_at',user.id,'measure_date')]);
    const out={sessions:workouts.map(x=>x.payload).filter(x=>x&&typeof x==='object'),bw:weights.filter(x=>x.measure_date&&x.weight_kg!=null).map(x=>({d:x.measure_date,w:Number(x.weight_kg),t:Date.parse(x.created_at)||0})),stamp:Math.max(0,...workouts.map(x=>Date.parse(x.updated_at)||0),...weights.map(x=>Date.parse(x.created_at)||0))};
    for(const session of out.sessions)uploadedSessions.set(user.id+':'+session.id,JSON.stringify(session));
    structuredCache.set(user.id,{at:Date.now(),value:out});return out;
  }
  async function reconcile({quiet=false}={}){
    const c=await waitCloud();
    const user=c?.user;
    if(!c?.client||!user||window.__workoutFinishing)return false;
    if(inflight)return inflight;
    st=workoutStore.activateAccount(st,user.id,meta().lastUserId);workoutStore.restore(st,user.id);
    inflight=(async()=>{
      try{
        const [stateRes,structured]=await Promise.all([
          c.client.from('user_app_state').select('state,client_updated_at,updated_at,device_id').eq('user_id',user.id).maybeSingle(),
          fetchStructuredCloud(c,user,!quiet)
        ]);
        if(stateRes.error)throw stateRes.error;if(window.__workoutFinishing||c.user?.id!==user.id)return false;
        const appState=stateRes.data?.state&&typeof stateRes.data.state==='object'?clone(stateRes.data.state):{};
        appState.sessions=mergeByKey(appState.sessions,structured.sessions,x=>String(x.id||''),sessionScore);
        appState.bw=mergeByKey(appState.bw,structured.bw,x=>String(x.d||''),x=>Number(x.t||x.updatedAt||0));
        const remoteExists=!!stateRes.data||appState.sessions.length>0||appState.bw.length>0;
        const remoteStamp=Math.max(stateRes.data?.client_updated_at?Date.parse(stateRes.data.client_updated_at):0,structured.stamp||0);
        let merged=clone(st)||{};
        if(remoteExists)merged=mergeStates(st,appState,remoteStamp);merged.accountOwnerId=user.id;workoutStore.restore(merged,user.id);
        suppress=true;
        try{st=merged;restoreAppearance(user.id);if(typeof save==='function')save()}finally{suppress=false}
        const stamp=Math.max(Date.now(),Number(meta().localModifiedAt||0),remoteStamp||0);
        setMeta({localModifiedAt:stamp});
        const payload={user_id:user.id,state:clone(st),client_updated_at:new Date(stamp).toISOString(),device_id:deviceId()};
        const up=await c.client.from('user_app_state').upsert(payload,{onConflict:'user_id'});
        if(up.error)throw up.error;
        if(typeof cloudSyncSession==='function')for(const s of arr(st.sessions)){if(s.userId&&s.userId!==user.id||s.pendingCompletion)continue;const key=user.id+':'+s.id,value=JSON.stringify(s);if(uploadedSessions.get(key)===value)continue;if(await cloudSyncSession(s)!==true)throw new Error('Не удалось синхронизировать тренировку');uploadedSessions.set(key,value);}
        if(typeof cloudSyncBodyweights==='function')await cloudSyncBodyweights();
        setMeta({lastSyncedAt:Date.now(),lastUserId:user.id});
        if(!quiet)try{toast(remoteExists?'Данные аккаунта синхронизированы':'Облачная копия создана')}catch(e){}
        window.dispatchEvent?.(new CustomEvent('unvrsl:history-updated',{detail:{sessions:arr(st.sessions).length}}));
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
    timerId=setTimeout(()=>reconcile({quiet:true}),10000);
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
      const ok=await reconcile({quiet:true});
      try{toast(ok?'Синхронизировано':'Синхронизация не завершена')}catch(e){}
    };
    try{cloudSyncAll=window.cloudSyncAll}catch(e){}
  }

  window.accountSyncNow=options=>reconcile(options||{quiet:false});

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
