import {getState,replaceState} from './store.mjs';
import {mergeStates,normalizeWorkout} from './core.mjs';

export const cloud={client:null,user:null,profile:null,ready:false,error:null,syncing:false};
let syncTimer=null;
let suppressSaveSync=false;

function config(){
  let local={};
  try{local=JSON.parse(localStorage.getItem('unvrsl-fit-cloud-config-v1')||'{}')}catch{}
  const base=window.UNVRSL_CLOUD||{};
  return {url:local.url||base.url||'',anonKey:local.anonKey||base.anonKey||''};
}

function configured(value=config()){
  return /^https:\/\//.test(value.url)&&String(value.anonKey).length>20;
}

async function ensureProfile(){
  if(!cloud.client||!cloud.user)return null;
  let {data,error}=await cloud.client.from('profiles').select('*').eq('id',cloud.user.id).maybeSingle();
  if(error)throw error;
  if(!data){
    const displayName=cloud.user.user_metadata?.full_name||cloud.user.email?.split('@')[0]||'Пользователь';
    const created=await cloud.client.from('profiles').insert({id:cloud.user.id,display_name:displayName,role:'client'}).select().single();
    if(created.error)throw created.error;
    data=created.data;
  }
  cloud.profile=data;
  return data;
}

export async function initCloud(){
  const settings=config();
  if(!configured(settings)||!window.supabase?.createClient)return cloud;
  try{
    cloud.client=window.supabase.createClient(settings.url,settings.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    cloud.ready=true;
    const {data,error}=await cloud.client.auth.getSession();
    if(error)throw error;
    cloud.user=data?.session?.user||null;
    if(cloud.user){await ensureProfile();await syncNow({quiet:true})}
    cloud.client.auth.onAuthStateChange((_event,session)=>{
      setTimeout(async()=>{
        cloud.user=session?.user||null;
        cloud.profile=null;
        if(cloud.user){await ensureProfile();await syncNow({quiet:true})}
        window.dispatchEvent(new CustomEvent('unvrsl:cloud',{detail:cloud}));
      },0);
    });
    window.dispatchEvent(new CustomEvent('unvrsl:cloud',{detail:cloud}));
  }catch(error){
    cloud.error=error;
    console.warn('UNVRSL v1.1 cloud init',error);
  }
  return cloud;
}

async function fetchStructuredState(){
  if(!cloud.user)return {};
  const [workoutsResult,weightsResult,assignmentsResult]=await Promise.all([
    cloud.client.from('workouts').select('external_id,payload,updated_at').eq('user_id',cloud.user.id),
    cloud.client.from('bodyweights').select('measure_date,weight_kg,created_at').eq('user_id',cloud.user.id),
    cloud.client.from('plan_assignments').select('plan_id,trainer_id,version,snapshot,status,updated_at').eq('client_id',cloud.user.id).eq('status','active')
  ]);
  if(workoutsResult.error)throw workoutsResult.error;
  if(weightsResult.error)throw weightsResult.error;
  if(assignmentsResult.error)throw assignmentsResult.error;
  return {
    workouts:(workoutsResult.data||[]).map(row=>normalizeWorkout(row.payload||{id:row.external_id,updatedAt:Date.parse(row.updated_at||0)})),
    bodyweights:(weightsResult.data||[]).map(row=>({date:row.measure_date,value:Number(row.weight_kg),updatedAt:Date.parse(row.created_at||0)||0})),
    assignedPrograms:(assignmentsResult.data||[]).map(row=>({id:row.plan_id,trainerId:row.trainer_id,version:row.version,snapshot:row.snapshot,status:row.status,updatedAt:Date.parse(row.updated_at||0)||0}))
  };
}

async function pushStructuredState(state){
  const deletedWorkoutIds=[...new Set((state.deletedWorkoutIds||[]).map(item=>String(item.id||item)).filter(Boolean))];
  if(deletedWorkoutIds.length){
    const deleted=await cloud.client.from('workouts').delete().eq('user_id',cloud.user.id).in('external_id',deletedWorkoutIds);
    if(deleted.error)throw deleted.error;
  }
  const workoutRows=(state.workouts||[]).map(workout=>({
    user_id:cloud.user.id,
    external_id:String(workout.id),
    workout_date:workout.date,
    payload:workout,
    avg_rpe:averageWorkoutRpe(workout),
    completed_sets:workout.exercises.reduce((sum,exercise)=>sum+exercise.sets.filter(set=>set.done).length,0),
    total_sets:workout.exercises.reduce((sum,exercise)=>sum+exercise.sets.length,0),
    updated_at:new Date(workout.updatedAt||Date.now()).toISOString()
  }));
  if(workoutRows.length){
    const written=await cloud.client.from('workouts').upsert(workoutRows,{onConflict:'user_id,external_id'});
    if(written.error)throw written.error;
  }
  const deletedDates=[...new Set((state.deletedBodyweights||[]).map(item=>String(item.date||item.d||item).slice(0,10)).filter(Boolean))];
  if(deletedDates.length){
    const deleted=await cloud.client.from('bodyweights').delete().eq('user_id',cloud.user.id).in('measure_date',deletedDates);
    if(deleted.error)throw deleted.error;
  }
  const blocked=new Set(deletedDates);
  const weightRows=(state.bodyweights||[]).filter(item=>!blocked.has(item.date)).map(item=>({
    user_id:cloud.user.id,
    measure_date:item.date,
    weight_kg:Number(item.value)
  }));
  if(weightRows.length){
    const written=await cloud.client.from('bodyweights').upsert(weightRows,{onConflict:'user_id,measure_date'});
    if(written.error)throw written.error;
  }
}

function averageWorkoutRpe(workout){
  const values=workout.exercises.flatMap(exercise=>exercise.sets).filter(set=>set.done&&set.rpe!=='').map(set=>Number(set.rpe)).filter(Number.isFinite);
  return values.length?Number((values.reduce((sum,value)=>sum+value,0)/values.length).toFixed(1)):null;
}

export async function syncNow({quiet=false}={}){
  if(!cloud.client||!cloud.user||cloud.syncing)return false;
  cloud.syncing=true;
  window.dispatchEvent(new CustomEvent('unvrsl:cloud',{detail:cloud}));
  try{
    const [appStateResult,structured]=await Promise.all([
      cloud.client.from('user_app_state').select('state,client_updated_at').eq('user_id',cloud.user.id).maybeSingle(),
      fetchStructuredState()
    ]);
    if(appStateResult.error)throw appStateResult.error;
    const remote={...(appStateResult.data?.state||{}),...structured};
    const merged=mergeStates(getState(),remote);
    suppressSaveSync=true;
    replaceState(merged,{immediate:true});
    suppressSaveSync=false;
    await pushStructuredState(merged);
    const written=await cloud.client.from('user_app_state').upsert({
      user_id:cloud.user.id,
      state:merged,
      client_updated_at:new Date(merged.updatedAt||Date.now()).toISOString(),
      device_id:deviceId()
    },{onConflict:'user_id'});
    if(written.error)throw written.error;
    cloud.error=null;
    if(!quiet)window.dispatchEvent(new CustomEvent('unvrsl:toast',{detail:'Синхронизировано'}));
    return true;
  }catch(error){
    suppressSaveSync=false;
    cloud.error=error;
    console.warn('UNVRSL v1.1 sync',error);
    if(!quiet)window.dispatchEvent(new CustomEvent('unvrsl:toast',{detail:'Не удалось синхронизировать'}));
    return false;
  }finally{
    cloud.syncing=false;
    window.dispatchEvent(new CustomEvent('unvrsl:cloud',{detail:cloud}));
  }
}

function deviceId(){
  const key='unvrsl-fit-device-v1';
  let value=localStorage.getItem(key);
  if(!value){value=`device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;localStorage.setItem(key,value)}
  return value;
}

export function scheduleCloudSync(){
  if(suppressSaveSync||!cloud.user)return;
  clearTimeout(syncTimer);
  syncTimer=setTimeout(()=>syncNow({quiet:true}),1800);
}

export async function signIn(email){
  if(!cloud.client)throw new Error('Облако не настроено');
  const redirect=location.origin+location.pathname;
  const {error}=await cloud.client.auth.signInWithOtp({email,options:{emailRedirectTo:redirect}});
  if(error)throw error;
}

export async function signOut(){
  if(cloud.client)await cloud.client.auth.signOut();
  cloud.user=null;
  cloud.profile=null;
}

export async function updateProfile(values){
  if(!cloud.client||!cloud.user)throw new Error('Нужно войти');
  const patch={};
  if(values.displayName!=null)patch.display_name=values.displayName;
  if(values.role!=null)patch.role=values.role;
  if(values.avatarUrl!=null)patch.avatar_url=values.avatarUrl;
  patch.updated_at=new Date().toISOString();
  const {data,error}=await cloud.client.from('profiles').update(patch).eq('id',cloud.user.id).select().single();
  if(error)throw error;
  cloud.profile=data;
  return data;
}

export async function loadTrainerClients(){
  if(!cloud.client||!cloud.user||cloud.profile?.role!=='trainer')return [];
  const relations=await cloud.client.from('trainer_clients').select('client_id,status,created_at').eq('trainer_id',cloud.user.id).neq('status','archived');
  if(relations.error)throw relations.error;
  const ids=(relations.data||[]).map(row=>row.client_id);
  if(!ids.length)return [];
  const profiles=await cloud.client.from('profiles').select('id,display_name,avatar_url').in('id',ids);
  if(profiles.error)throw profiles.error;
  const byId=new Map((profiles.data||[]).map(profile=>[profile.id,profile]));
  return (relations.data||[]).map(row=>({...row,profiles:byId.get(row.client_id)||null}));
}

window.addEventListener('unvrsl:saved',scheduleCloudSync);
window.addEventListener('online',()=>syncNow({quiet:true}));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')syncNow({quiet:true})});
