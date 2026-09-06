'use strict';
const CLOUD_KEY='unvrsl-fit-cloud-config-v1';
const cloud={client:null,user:null,profile:null,ready:false,invite:null,initSettled:false,degraded:false,lastError:null};
window.cloud=cloud;
let cloudProfilePromise=null,cloudProfileUserId=null;
function cloudInitSettledV257(){cloud.initSettled=true;window.__unvrslCloudInitSettledV257=true;window.dispatchEvent(new CustomEvent('unvrsl:cloud-ready',{detail:{user:!!cloud.user,role:cloud.profile?.role||null,degraded:!!cloud.degraded}}))}
function cloudConfig(){let local={};try{local=JSON.parse(localStorage.getItem(CLOUD_KEY)||'{}')}catch(e){}const base=window.UNVRSL_CLOUD||{};return{url:local.url||base.url||'',anonKey:local.anonKey||base.anonKey||''}}
function cloudConfigured(){const c=cloudConfig();return /^https:\/\//.test(c.url)&&c.anonKey.length>20}
function cloudErrorText(error){return String(error?.message||error?.error_description||error||'').trim()}
function cloudMarkDegraded(error){cloud.degraded=true;cloud.lastError=cloudErrorText(error)||'cloud unavailable';window.__unvrslCloudDegraded=true}
function cloudMarkHealthy(){cloud.degraded=false;cloud.lastError=null;window.__unvrslCloudDegraded=false}
function cloudDeferProfile(reason='auth'){
 if(!cloud.client||!cloud.user)return;
 setTimeout(()=>{
  cloudEnsureProfile().then(()=>{cloudMarkHealthy();renderCloudAffordances();try{render()}catch(_){ }if(cloud.invite)showInviteSheet()}).catch(e=>{cloudMarkDegraded(e);console.warn('UNVRSL profile hydrate',reason,e);renderCloudAffordances()})
 },0)
}
async function cloudInit(){
  cloud.invite=new URLSearchParams(location.search).get('invite')||null;
  if(!cloudConfigured()||!window.supabase?.createClient){cloud.ready=false;setTimeout(()=>{if(cloud.invite)inviteNeedsCloudSheet()},500);cloudInitSettledV257();return}
  try{
    const c=cloudConfig();cloud.client=window.supabase.createClient(c.url,c.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});cloud.ready=true;
    // Register immediately after createClient. Supabase explicitly warns against awaiting
    // Supabase API calls inside this callback, so profile hydration is deferred.
    cloud.client.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_OUT'){
        cloud.user=null;cloud.profile=null;cloudMarkHealthy();
      }else if(session?.user){
        cloud.user=session.user;cloud.profile=null;cloudMarkHealthy();cloudDeferProfile(event||'auth-change');
      }else if(event==='INITIAL_SESSION'){
        cloud.user=null;cloud.profile=null;
      }
      renderCloudAffordances();
      if(cloud.invite)setTimeout(()=>showInviteSheet(),0)
    });
    try{
      const {data,error}=await cloud.client.auth.getSession();
      if(error){cloudMarkDegraded(error);console.warn('UNVRSL getSession',error)}
      if(data?.session?.user){cloud.user=data.session.user;cloudDeferProfile('initial-session')}
    }catch(e){cloudMarkDegraded(e);console.warn('UNVRSL getSession',e)}
    renderCloudAffordances();if(cloud.invite)setTimeout(()=>showInviteSheet(),0);
  }catch(e){console.warn('UNVRSL cloud init',e);cloud.ready=false;cloudMarkDegraded(e)}finally{cloudInitSettledV257()}
}
async function cloudEnsureProfile(){
 if(!cloud.client||!cloud.user)return null;
 const uid=String(cloud.user.id||'');if(!uid)return null;
 if(cloudProfilePromise&&cloudProfileUserId===uid)return cloudProfilePromise;
 cloudProfileUserId=uid;
 cloudProfilePromise=(async()=>{
  const selected=await cloud.client.from('profiles').select('*').eq('id',uid).maybeSingle();
  if(selected.error){cloudMarkDegraded(selected.error);throw selected.error}
  let data=selected.data;
  if(!data){
   const display=(cloud.user?.user_metadata?.full_name||cloud.user?.email?.split('@')[0]||'Пользователь');
   const ins=await cloud.client.from('profiles').insert({id:uid,display_name:display,role:'client'}).select().single();
   if(ins.error){cloudMarkDegraded(ins.error);throw ins.error}
   data=ins.data
  }
  if(String(cloud.user?.id||'')===uid)cloud.profile=data||null;
  cloudMarkHealthy();return cloud.profile
 })();
 try{return await cloudProfilePromise}finally{if(cloudProfileUserId===uid){cloudProfilePromise=null;cloudProfileUserId=null}}
}
function cloudStatusLabel(){if(!cloudConfigured())return'Не подключено';if(!cloud.user)return cloud.degraded?'Облако недоступно':'Войти';const name=cloud.profile?.display_name||'Аккаунт';return cloud.degraded?`${name} · офлайн`:name}
function cloudAccountSheet(){
 if(!cloudConfigured())return cloudSetupSheet();
 if(!cloud.user)return modal(`<div class="sheet-grabber"></div><h2>Вход в UNVRSL FIT</h2><div class="muted">Введи почту. На неё придёт безопасная ссылка для входа.</div><div class="field"><label>Электронная почта</label><input id="cloudEmail" type="email" placeholder="name@example.com"></div><button class="btn primary full" onclick="cloudSendMagic()">Получить ссылку</button>`);
 const role=cloud.profile?.role||'client',offline=cloud.degraded?`<div class="card" style="margin-top:14px"><b>Облако временно недоступно</b><div class="muted small" style="margin-top:5px">Локальные тренировки и записи остаются доступны. Синхронизация возобновится после восстановления Supabase.</div></div>`:'';modal(`<div class="sheet-grabber"></div><h2>${esc(cloud.profile?.display_name||'Аккаунт')}</h2><div class="muted">${esc(cloud.user.email||'')}</div>${offline}<div class="settings-card"><div class="setting"><div><b>Роль</b><div class="muted small">${role==='trainer'?'Тренер':'Клиент'}</div></div><div class="seg"><button class="${role==='client'?'on':''}" onclick="cloudSetRole('client')">Клиент</button><button class="${role==='trainer'?'on':''}" onclick="cloudSetRole('trainer')">Тренер</button></div></div><div class="setting"><div><b>Имя</b></div><button class="btn tiny" onclick="cloudRenameSheet()">Изменить</button></div><div class="setting"><div><b>Синхронизация</b><div class="muted small">Тренировки и вес</div></div><button class="btn tiny" onclick="cloudSyncAll()">Синхр.</button></div></div><button class="btn danger full" onclick="cloudSignOut()">Выйти</button>`)
}
function cloudSetupSheet(){const c=cloudConfig();modal(`<div class="sheet-grabber"></div><h2>Подключить облако</h2><div class="muted">Нужен проект Supabase. Здесь используются только публичные Project URL и anon key.</div><div class="field"><label>Project URL</label><input id="cloudUrl" value="${esc(c.url)}" placeholder="https://xxxx.supabase.co"></div><div class="field"><label>Anon public key</label><input id="cloudAnon" value="${esc(c.anonKey)}" placeholder="eyJ..."></div><button class="btn primary full" onclick="cloudSaveConfig()">Сохранить</button>`)}
function cloudSaveConfig(){const url=$('#cloudUrl')?.value.trim()||'',anonKey=$('#cloudAnon')?.value.trim()||'';if(!url||!anonKey)return toast('Заполни оба поля');localStorage.setItem(CLOUD_KEY,JSON.stringify({url,anonKey}));location.reload()}
async function cloudSendMagic(){const email=$('#cloudEmail')?.value.trim();if(!email)return toast('Введи почту');const redirect=location.origin+location.pathname+(cloud.invite?`?invite=${encodeURIComponent(cloud.invite)}`:'');const {error}=await cloud.client.auth.signInWithOtp({email,options:{emailRedirectTo:redirect}});if(error)return alert(error.message);modal(`<div class="sheet-grabber"></div><h2>Проверь почту</h2><div class="muted">Мы отправили ссылку для входа на ${esc(email)}.</div>`)}
async function cloudSignOut(){if(cloud.client)await cloud.client.auth.signOut();cloud.user=null;cloud.profile=null;cloudMarkHealthy();closeModal();renderCloudAffordances();render()}
async function cloudSetRole(role){if(!cloud.user)return;const {data,error}=await cloud.client.from('profiles').update({role,updated_at:new Date().toISOString()}).eq('id',cloud.user.id).select().single();if(error){cloudMarkDegraded(error);return alert(error.message)}cloud.profile=data;cloudMarkHealthy();closeModal();renderCloudAffordances();render();toast(role==='trainer'?'Режим тренера включён':'Режим клиента включён')}
function cloudRenameSheet(){modal(`<div class="sheet-grabber"></div><h2>Имя</h2><div class="field"><label>Как показывать в приложении</label><input id="cloudName" value="${esc(cloud.profile?.display_name||'')}"></div><button class="btn primary full" onclick="cloudSaveName()">Сохранить</button>`)}
async function cloudSaveName(){const display_name=$('#cloudName')?.value.trim();if(!display_name)return;const {data,error}=await cloud.client.from('profiles').update({display_name,updated_at:new Date().toISOString()}).eq('id',cloud.user.id).select().single();if(error){cloudMarkDegraded(error);return alert(error.message)}cloud.profile=data;cloudMarkHealthy();closeModal();renderCloudAffordances();render()}
function renderCloudAffordances(){
 const gear=$('#gear');if(gear)gear.title=`Аккаунт: ${cloudStatusLabel()}`;
 if(typeof refreshTrainerNav==='function')refreshTrainerNav();
}
function cloudAvgRpe(s){const vals=[];(s?.ex||[]).forEach(e=>(e.set||[]).forEach(x=>{if(x.ok&&x.rpe!==''&&Number.isFinite(+x.rpe))vals.push(+x.rpe)}));return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10:null}
async function cloudSyncSession(s){if(!cloud.ready||!cloud.user||!s)return;try{const r=await cloud.client.from('workouts').upsert({user_id:cloud.user.id,external_id:String(s.id),workout_date:s.date||iso(),payload:s,avg_rpe:cloudAvgRpe(s),completed_sets:done(s),total_sets:total(s),updated_at:new Date().toISOString()},{onConflict:'user_id,external_id'});if(r.error){cloudMarkDegraded(r.error);console.warn('sync workout',r.error)}else cloudMarkHealthy()}catch(e){cloudMarkDegraded(e);console.warn('sync workout',e)}}
async function cloudSyncBodyweights(){if(!cloud.ready||!cloud.user)return;const deleted=[...new Set((st.deletedBodyweights||[]).map(x=>String(x?.d||x||'').slice(0,10)).filter(Boolean))];if(deleted.length){const del=await cloud.client.from('bodyweights').delete().eq('user_id',cloud.user.id).in('measure_date',deleted);if(del.error){cloudMarkDegraded(del.error);console.warn('sync deleted bodyweights',del.error)}}const blocked=new Set(deleted),rows=(st.bw||[]).filter(x=>x.d&&x.w&&!blocked.has(String(x.d).slice(0,10))).map(x=>({user_id:cloud.user.id,measure_date:String(x.d).slice(0,10),weight_kg:Number(x.w)}));if(rows.length){const up=await cloud.client.from('bodyweights').upsert(rows,{onConflict:'user_id,measure_date'});if(up.error){cloudMarkDegraded(up.error);console.warn('sync bodyweights',up.error)}else cloudMarkHealthy()}}
async function cloudSyncAll(){if(!cloud.user)return cloudAccountSheet();toast('Синхронизация…');for(const s of st.sessions||[])await cloudSyncSession(s);await cloudSyncBodyweights();toast(cloud.degraded?'Облако пока недоступно. Данные сохранены на устройстве':'Синхронизировано')}
const _cloudFinish=window.finish;
if(typeof _cloudFinish==='function')window.finish=function(){const snapshot=st.current?JSON.parse(JSON.stringify(st.current)):null;_cloudFinish();if(snapshot){snapshot.ended=snapshot.ended||Date.now();setTimeout(()=>cloudSyncSession(snapshot),0)}};

function inviteNeedsCloudSheet(){modal(`<div class="sheet-grabber"></div><h2>Вам отправили программу</h2><div class="muted">Чтобы принять её и синхронизировать результаты с тренером, нужно подключить облачную часть UNVRSL FIT.</div><button class="btn primary full" onclick="cloudSetupSheet()">Настроить</button>`)}
async function showInviteSheet(){if(!cloud.invite)return;if(!cloud.ready)return inviteNeedsCloudSheet();let info=null;try{const r=await cloud.client.rpc('preview_plan_invite',{p_token:cloud.invite});if(r.error)cloudMarkDegraded(r.error);info=r.data}catch(e){cloudMarkDegraded(e)}const title=info?.title||'Тренировочная программа',trainer=info?.trainer||'Тренер';if(!cloud.user)return modal(`<div class="sheet-grabber"></div><h2>${esc(title)}</h2><div class="muted">${esc(trainer)} приглашает тебя добавить программу.</div><button class="btn primary full" onclick="cloudAccountSheet()">Войти и добавить</button>`);modal(`<div class="sheet-grabber"></div><h2>${esc(title)}</h2><div class="muted">Тренер: ${esc(trainer)}</div><button class="btn primary full" onclick="cloudAcceptInvite()">Добавить в мой план</button>`)}
async function cloudAcceptInvite(){if(!cloud.user)return cloudAccountSheet();const {data,error}=await cloud.client.rpc('accept_plan_invite',{p_token:cloud.invite});if(error){cloudMarkDegraded(error);return alert('Не удалось принять программу: '+error.message)}if(!data)return alert('Приглашение недействительно или истекло');cloudMarkHealthy();st.remotePlans=Array.isArray(st.remotePlans)?st.remotePlans:[];const obj={id:data.plan_id,title:data.title,version:data.version,trainer:data.trainer,trainerId:data.trainer_id,snapshot:data.snapshot};const i=st.remotePlans.findIndex(x=>x.id===obj.id);if(i>=0)st.remotePlans[i]=obj;else st.remotePlans.push(obj);save();history.replaceState({},'',location.pathname);cloud.invite=null;closeModal();render();toast('Программа добавлена')}
setTimeout(()=>{window.__unvrslCloudInitPromiseV257=cloudInit()},0);

// Crash-safe local persistence is loaded separately so completed sessions and an active workout survive app updates/reloads.
(()=>{if(document.querySelector('script[data-unvrsl-persistence]'))return;const s=document.createElement('script');s.src='./persistence-safety.js?v=100';s.dataset.unvrslPersistence='1';document.head.appendChild(s)})();
