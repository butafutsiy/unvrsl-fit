'use strict';
(()=>{
  if(window.__unvrslAccountSync)return;
  window.__unvrslAccountSync=true;

  const META_KEY='unvrsl-account-sync-meta-v1';
  const DEVICE_KEY='unvrsl-device-id-v1';
  let suppress=false,timerId=null,inflight=null,lastUserId=null,conflictRetries=0;
  let localRevision=0,uploadedRevision=-1;
  const structuredCache=new Map(),uploadedSessions=new Map();

  const clone=x=>{try{return JSON.parse(JSON.stringify(x))}catch(e){return null}};
  const parse=x=>{try{return x?JSON.parse(x):null}catch(e){return null}};
  const metadataCache=new Map();let memoryDeviceId=null;
  function readLocal(key){try{return localStorage.getItem(key)}catch(_){return null}}
  function deviceId(){
    let id=memoryDeviceId||readLocal(DEVICE_KEY);
    if(!id){id='d_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);try{localStorage.setItem(DEVICE_KEY,id)}catch(_){}}
    memoryDeviceId=id;return id;
  }
  function metaKey(){return META_KEY+':'+String(typeof window!=='undefined'?window.cloud?.user?.id||window.st?.accountOwnerId||'local':'local')}
  function meta(){
    const key=metaKey(),value=metadataCache.get(key)||parse(readLocal(key))||{localModifiedAt:0,lastSyncedAt:0,lastUserId:typeof window!=='undefined'?window.st?.accountOwnerId||null:null};
    if(typeof window!=='undefined'&&window.__unvrslStorageModeV393==='indexeddb')return{...value,localModifiedAt:Math.max(Number(value.localModifiedAt||0),Number(window.st?.storageRevision||0))};
    return value;
  }
  function setMeta(patch){const key=metaKey(),m={...meta(),...patch};metadataCache.set(key,m);try{localStorage.setItem(key,JSON.stringify(m))}catch(_){}return m}
  function markLocal(){if(!suppress){localRevision++;setMeta({localModifiedAt:Date.now()});window.__unvrslSyncState={status:'pending',owner:window.cloud?.user?.id||st?.accountOwnerId||null};window.dispatchEvent(new CustomEvent('unvrsl:sync-state'))}}
  function arr(x){return Array.isArray(x)?x:[]}
  function doneCount(session){return arr(session?.ex).reduce((sum,e)=>sum+arr(e?.set).filter(x=>x?.ok).length,0)}
  function sessionTime(s){for(const value of [s?.ended,s?.endedAt,s?.started,s?.startedAt,s?.date]){if(typeof value==='number'&&Number.isFinite(value))return value;const num=Number(value);if(Number.isFinite(num)&&num>1e11)return num;const parsed=typeof value==='string'?Date.parse(value):NaN;if(Number.isFinite(parsed))return parsed}return 0}
  // An edited completed workout must win over its older cloud snapshot even
  // when the edit reduces the number of completed sets or changes the date.
  function sessionScore(s){return Math.max(sessionTime(s),Number(s?.editedAt||0))+doneCount(s)*10}
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
    base.deletedSessionIds=[...new Set([...arr(local.deletedSessionIds),...arr(remote.deletedSessionIds)])];
    const deletedSessions=new Set(base.deletedSessionIds.map(String));base.sessions=base.sessions.filter(x=>!deletedSessions.has(String(x.id)));
    base.mealNutritionV1=(typeof window!=='undefined'?window.UNVRSLNutritionState:null)?.merge(local.mealNutritionV1,remote.mealNutritionV1,preferRemote)||base.mealNutritionV1;
    for(const field of ['programDeletedAt','programRestoredAt','programPurgedAt','templateDeletedAt']){
      base[field]={...local[field]};
      for(const [key,stamp] of Object.entries(remote[field]||{}))base[field][key]=Math.max(Number(stamp)||0,Number(base[field][key])||0);
    }
    base.builtinProgramPurgedAt=Math.max(Number(local.builtinProgramPurgedAt||0),Number(remote.builtinProgramPurgedAt||0));
    base.programTemplates=mergeByKey(first.programTemplates,second.programTemplates,x=>String(x.id||''),x=>Math.max(Number(x.updated||0),Number(x.created||0))).filter(x=>!base.templateDeletedAt['saved:'+x.id]);
    base.deletedProgramKeys=[...new Set([...arr(local.deletedProgramKeys),...arr(remote.deletedProgramKeys),...Object.keys(base.programDeletedAt)])]
      .filter(key=>Number(base.programRestoredAt[key]||0)<=Number(base.programDeletedAt[key]||0));
    const deletedPrograms=new Set(base.deletedProgramKeys);
    const programKeys=p=>[p.id&&`id:${p.id}`,!p.independentCopy&&p.isMasterPlan&&'seed:master-trainer-plan',!p.independentCopy&&p.seedId&&`seed:${p.seedId}`,p.cloudPlanId&&`cloud:${p.cloudPlanId}`,!p.independentCopy&&p.templateKey&&`template:${p.templateKey}`,!p.independentCopy&&(p.seedId||p.internetTemplate||p.femaleTemplate||p.templateKey)&&p.name&&`name:${String(p.name).toLowerCase().replace(/[·•]/g,' ').replace(/\s+/g,' ').trim()}`].filter(Boolean);
    base.programs=mergeByKey(first.programs,second.programs,x=>String(x.id||x.title||x.name||''),x=>Math.max(Number(x.updated||0),Number(x.updatedAt||0),Number(x.created||0),Number(x.createdAt||0))).filter(p=>!programKeys(p).some(k=>deletedPrograms.has(k)));
    const recovered=[...arr(local.programs),...arr(remote.programs)].filter(p=>programKeys(p).some(k=>deletedPrograms.has(k)))
      .map(p=>({id:String(p.id),program:p,deletedAt:Math.max(1,...programKeys(p).map(k=>Number(base.programDeletedAt[k]||0)))}));
    base.programTrash=mergeByKey([...arr(first.programTrash),...recovered],second.programTrash,x=>String(x.id||''),x=>Number(x.deletedAt||0))
      .filter(x=>x.program&&programKeys(x.program).some(k=>deletedPrograms.has(k))&&Math.max(0,...programKeys(x.program).map(k=>Number(base.programPurgedAt[k]||0)))<Number(x.deletedAt||1));
    base.seededPrograms={...(remote.seededPrograms||{}),...(local.seededPrograms||{})};
    base.templateVisibility={...(local.templateVisibility||{})};
    for(const [key,value] of Object.entries(remote.templateVisibility||{})){
      if(!base.templateVisibility[key]||Number(value?.at||0)>Number(base.templateVisibility[key]?.at||0))base.templateVisibility[key]=clone(value);
    }
    const visibilitySource=Number(remote.builtinProgramVisibilityUpdatedAt||0)>Number(local.builtinProgramVisibilityUpdatedAt||0)?remote:local;
    base.builtinProgramVisibilityUpdatedAt=Number(visibilitySource.builtinProgramVisibilityUpdatedAt||0);
    base.builtinProgramHidden=base.builtinProgramVisibilityUpdatedAt?!!visibilitySource.builtinProgramHidden:!!(local.builtinProgramHidden||remote.builtinProgramHidden);
    const builtinSource=Number(remote.builtinProgramNameUpdatedAt||0)>Number(local.builtinProgramNameUpdatedAt||0)?remote:local;
    if(builtinSource.builtinProgramName){base.builtinProgramName=builtinSource.builtinProgramName;base.builtinProgramNameUpdatedAt=builtinSource.builtinProgramNameUpdatedAt||0}
    base.remotePlans=mergeByKey(first.remotePlans,second.remotePlans,x=>String(x.id||''),x=>Number(x.version||x.updatedAt||0));
    for(const [field,stamp] of [['primaryProgramId','primaryProgramSelectedAt'],['clientPrimaryProgramKey','clientPrimaryProgramSelectedAt']]){
      const source=Number(remote[stamp]||0)>Number(local[stamp]||0)?remote:local;
      if(source[stamp]){base[field]=source[field];base[stamp]=source[stamp]}
    }
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
  window.accountSyncStatusText=function(){
    const user=window.cloud?.user,state=window.__unvrslSyncState;
    if(!user)return 'Программы сохранены только на этом устройстве. Войди для синхронизации.';
    const account=user.email||'Аккаунт подключён';
    const status=state?.owner!==user.id?'Ожидает синхронизации':state.status==='loading'?'Синхронизация…':state.status==='pending'?'Есть изменения на устройстве':state.status==='synced'?`Синхронизировано · ${new Date(state.at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}`:'Синхронизация не завершена. Повтори при подключении к сети.';
    return `${account} · ${status}`;
  };
  function renderSyncStatus(){document.querySelectorAll?.('[data-account-sync-status]').forEach(el=>{const text=window.accountSyncStatusText();if(el.textContent!==text)el.textContent=text})}
  window.addEventListener('unvrsl:sync-state',renderSyncStatus);
  window.addEventListener('unvrsl:programs-rendered',renderSyncStatus);
  window.addEventListener('unvrsl:settings-opened',renderSyncStatus);
  renderSyncStatus();
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
    window.__unvrslSyncState={status:'loading',owner:user.id};window.dispatchEvent(new CustomEvent('unvrsl:sync-state'));
    st=workoutStore.activateAccount(st,user.id,meta().lastUserId);workoutStore.restore(st,user.id);
    inflight=(async()=>{
      let completed=false;
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
        const sentRevision=localRevision;
        let up;
        if(c.user?.id!==user.id)return false;
        if(stateRes.data?.updated_at){
          up=await c.client.from('user_app_state').update(payload).eq('user_id',user.id).eq('updated_at',stateRes.data.updated_at).select('user_id');
          if(!up.error&&Array.isArray(up.data)&&!up.data.length)throw new Error('Другой прибор обновил данные. Повтори синхронизацию.');
        }else up=await c.client.from('user_app_state').insert(payload);
        if(up.error)throw up.error;conflictRetries=0;
        if(c.user?.id!==user.id)return false;
        if(typeof cloudSyncSession==='function')for(const s of arr(st.sessions)){if(s.userId&&s.userId!==user.id||s.pendingCompletion)continue;const key=user.id+':'+s.id,value=JSON.stringify(s);if(uploadedSessions.get(key)===value)continue;if(await cloudSyncSession(s)!==true)throw new Error('Не удалось синхронизировать тренировку');uploadedSessions.set(key,value);}
        if(typeof cloudSyncBodyweights==='function')await cloudSyncBodyweights();
        uploadedRevision=sentRevision;completed=true;
        setMeta({lastSyncedAt:Date.now(),lastUserId:user.id});window.__unvrslSyncState={status:localRevision>sentRevision?'pending':'synced',owner:user.id,at:Date.now()};window.dispatchEvent(new CustomEvent('unvrsl:sync-state'));
        if(!quiet)try{toast(remoteExists?'Данные аккаунта синхронизированы':'Облачная копия создана')}catch(e){}
        window.dispatchEvent?.(new CustomEvent('unvrsl:history-updated',{detail:{sessions:arr(st.sessions).length}}));
        try{render();if(document.querySelector('#programs.active'))window.trainerProgramsPage?.()}catch(e){}
        return true;
      }catch(e){if((e.code==='23505'||/Другой прибор обновил/.test(e.message))&&conflictRetries<2){conflictRetries++;setTimeout(()=>{if(window.cloud?.user?.id===user.id)reconcile({quiet:true})},350)}window.__unvrslSyncState={status:'error',owner:user.id,message:e.message};window.dispatchEvent(new CustomEvent('unvrsl:sync-state'));console.warn('UNVRSL account sync',e);if(!quiet)try{toast('Не удалось синхронизировать аккаунт')}catch(_){}return false}
      finally{inflight=null;if(completed&&c.user?.id===user.id&&localRevision>uploadedRevision)schedule()}
    })();
    return inflight;
  }
  function schedule(delay=1200){
    if(suppress||timerId!=null)return;
    timerId=setTimeout(()=>{timerId=null;reconcile({quiet:true})},delay);
  }

  const baseSave=typeof window.save==='function'?window.save:null;
  if(baseSave){
    window.save=function(){const result=baseSave.apply(this,arguments);if(result!==false){markLocal();schedule(arguments[0]?.draftOnly?5000:1200)}return result};
    try{save=window.save}catch(e){}
  }

  const originalSync=typeof window.cloudSyncAll==='function'?window.cloudSyncAll:null;
  if(originalSync){
    window.cloudSyncAll=async function(){
      if(!window.cloud?.user)return originalSync.apply(this,arguments);
      try{toast('Синхронизация…')}catch(e){}
      const ok=await window.accountSyncNow({quiet:true});
      try{toast(ok?'Синхронизировано':'Синхронизация не завершена')}catch(e){}
    };
    try{cloudSyncAll=window.cloudSyncAll}catch(e){}
  }

  window.accountSyncNow=async options=>{
    const quiet=options?.quiet===true;
    const failed=()=>{if(!quiet)try{toast('Не удалось синхронизировать аккаунт')}catch(_){}return false};
    const ok=await reconcile({quiet:true});
    if(!ok)return failed();
    // A save can arrive while another tab/device snapshot is being uploaded.
    // Confirm the latest local revision before reporting explicit save success.
    if(localRevision>uploadedRevision){if(!await reconcile({quiet:true}))return failed()}
    if(localRevision>uploadedRevision)return failed();
    if(!quiet)try{toast('Данные аккаунта синхронизированы')}catch(_){}
    return true;
  };

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

  document.addEventListener('visibilitychange',()=>reconcile({quiet:true}));
  window.addEventListener('pageshow',()=>reconcile({quiet:true}));
  window.addEventListener('online',()=>reconcile({quiet:true}));
  if(typeof setInterval==='function')setInterval(()=>{
    if(document.visibilityState!=='hidden'&&window.cloud?.user)reconcile({quiet:true});
  },30000);
})();
