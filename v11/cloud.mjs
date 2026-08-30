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
  const [workoutsResult,weightsResult,measurementsResult,assignmentsResult]=await Promise.all([
    cloud.client.from('workouts').select('external_id,payload,updated_at').eq('user_id',cloud.user.id),
    cloud.client.from('bodyweights').select('measure_date,weight_kg,created_at').eq('user_id',cloud.user.id),
    cloud.client.from('body_measurements').select('measure_date,measurements,updated_at').eq('user_id',cloud.user.id),
    cloud.client.from('plan_assignments').select('plan_id,trainer_id,version,snapshot,status,updated_at').eq('client_id',cloud.user.id).eq('status','active')
  ]);
  if(workoutsResult.error)throw workoutsResult.error;
  if(weightsResult.error)throw weightsResult.error;
  if(measurementsResult.error)throw measurementsResult.error;
  if(assignmentsResult.error)throw assignmentsResult.error;
  return {
    workouts:(workoutsResult.data||[]).map(row=>normalizeWorkout(row.payload||{id:row.external_id,updatedAt:Date.parse(row.updated_at||0)})),
    bodyweights:(weightsResult.data||[]).map(row=>({date:row.measure_date,value:Number(row.weight_kg),updatedAt:Date.parse(row.created_at||0)||0})),
    measurements:(measurementsResult.data||[]).map(row=>({id:`measurement-${row.measure_date}`,date:row.measure_date,...(row.measurements||{}),updatedAt:Date.parse(row.updated_at||0)||0})),
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
  const deletedMeasurementDates=[...new Set((state.deletedMeasurements||[]).map(item=>String(item.date||item.d||item).slice(0,10)).filter(Boolean))];
  if(deletedMeasurementDates.length){
    const deleted=await cloud.client.from('body_measurements').delete().eq('user_id',cloud.user.id).in('measure_date',deletedMeasurementDates);
    if(deleted.error)throw deleted.error;
  }
  const blockedMeasurements=new Set(deletedMeasurementDates);
  const measurementRows=(state.measurements||[]).filter(item=>!blockedMeasurements.has(String(item.date||item.d||'').slice(0,10))).map(item=>({
    user_id:cloud.user.id,
    measure_date:String(item.date||item.d).slice(0,10),
    measurements:Object.fromEntries(['chest','waist','abdomen','hips','thigh','arm','calf'].map(key=>[key,item[key]]).filter(([,value])=>Number(value)>0)),
    updated_at:new Date(item.updatedAt||Date.now()).toISOString()
  })).filter(item=>item.measure_date);
  if(measurementRows.length){
    const written=await cloud.client.from('body_measurements').upsert(measurementRows,{onConflict:'user_id,measure_date'});
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

export async function loadTrainerClient(clientId){
  if(!cloud.client||!cloud.user||cloud.profile?.role!=='trainer')throw new Error('Нужен аккаунт тренера');
  const [profile,workouts,weights,measurements,assignments]=await Promise.all([
    cloud.client.from('profiles').select('id,display_name,avatar_url').eq('id',clientId).maybeSingle(),
    cloud.client.from('workouts').select('external_id,workout_date,avg_rpe,completed_sets,total_sets,payload').eq('user_id',clientId).order('workout_date',{ascending:false}).limit(100),
    cloud.client.from('bodyweights').select('measure_date,weight_kg').eq('user_id',clientId).order('measure_date',{ascending:false}).limit(100),
    cloud.client.from('body_measurements').select('measure_date,measurements').eq('user_id',clientId).order('measure_date',{ascending:false}).limit(100),
    cloud.client.from('plan_assignments').select('plan_id,version,status,assigned_at,snapshot,plans(title)').eq('trainer_id',cloud.user.id).eq('client_id',clientId).eq('status','active').order('assigned_at',{ascending:false})
  ]);
  for(const result of [profile,workouts,weights,measurements,assignments])if(result.error)throw result.error;
  return {profile:profile.data,workouts:workouts.data||[],weights:weights.data||[],measurements:measurements.data||[],assignments:assignments.data||[]};
}

export async function revokeClientPlan(clientId,planId){
  if(!cloud.client||!cloud.user||cloud.profile?.role!=='trainer')throw new Error('Нужен аккаунт тренера');
  const {error}=await cloud.client.from('plan_assignments').update({status:'revoked',updated_at:new Date().toISOString()}).eq('trainer_id',cloud.user.id).eq('client_id',clientId).eq('plan_id',planId).eq('status','active');
  if(error)throw error;
}

export async function loadTrainerPlan(planId){
  if(!cloud.client||!cloud.user||cloud.profile?.role!=='trainer')throw new Error('Нужен аккаунт тренера');
  const [plan,uses]=await Promise.all([
    cloud.client.from('plans').select('id,title,version,snapshot').eq('id',planId).eq('trainer_id',cloud.user.id).maybeSingle(),
    cloud.client.from('plan_assignments').select('client_id').eq('trainer_id',cloud.user.id).eq('plan_id',planId).eq('status','active')
  ]);
  if(plan.error)throw plan.error;
  if(uses.error)throw uses.error;
  return {plan:plan.data,assignmentCount:(uses.data||[]).length};
}

function programSnapshot(program){
  const clean=JSON.parse(JSON.stringify(program));
  for(const key of ['id','cloudPlanId','cloudVersion','trainerId','pendingCloudUpdate'])delete clean[key];
  return {kind:'coach-program',schema:1,program:clean};
}

export async function publishProgram(program){
  if(!cloud.client||!cloud.user||cloud.profile?.role!=='trainer')throw new Error('Нужен аккаунт тренера');
  const now=new Date().toISOString();
  const snapshot=programSnapshot(program);
  if(!program.cloudPlanId){
    const created=await cloud.client.from('plans').insert({trainer_id:cloud.user.id,title:program.name||'Программа',version:1,snapshot}).select('id,version').single();
    if(created.error)throw created.error;
    program.cloudPlanId=created.data.id;
    program.cloudVersion=created.data.version||1;
    const history=await cloud.client.from('plan_versions').insert({plan_id:program.cloudPlanId,trainer_id:cloud.user.id,version:program.cloudVersion,snapshot});
    if(history.error)throw history.error;
    return program.cloudVersion;
  }
  const current=await cloud.client.from('plans').select('version,title,snapshot').eq('id',program.cloudPlanId).eq('trainer_id',cloud.user.id).maybeSingle();
  if(current.error)throw current.error;
  if(current.data&&current.data.title===(program.name||'Программа')&&JSON.stringify(current.data.snapshot||{})===JSON.stringify(snapshot)){
    program.cloudVersion=Number(current.data.version)||1;
    return program.cloudVersion;
  }
  const version=Math.max(Number(program.cloudVersion)||0,Number(current.data?.version)||0)+1;
  const updated=await cloud.client.from('plans').update({title:program.name||'Программа',version,snapshot,updated_at:now}).eq('id',program.cloudPlanId).eq('trainer_id',cloud.user.id);
  if(updated.error)throw updated.error;
  const history=await cloud.client.from('plan_versions').insert({plan_id:program.cloudPlanId,trainer_id:cloud.user.id,version,snapshot});
  if(history.error)throw history.error;
  const assignments=await cloud.client.from('plan_assignments').update({version,snapshot,updated_at:now}).eq('plan_id',program.cloudPlanId).eq('trainer_id',cloud.user.id).eq('status','active');
  if(assignments.error)throw assignments.error;
  program.cloudVersion=version;
  return version;
}

export async function assignProgram(clientId,program){
  const version=await publishProgram(program);
  const snapshot=programSnapshot(program);
  const {error}=await cloud.client.from('plan_assignments').upsert({
    plan_id:program.cloudPlanId,trainer_id:cloud.user.id,client_id:clientId,version,snapshot,status:'active',updated_at:new Date().toISOString()
  },{onConflict:'plan_id,client_id'});
  if(error)throw error;
  return version;
}

window.addEventListener('unvrsl:saved',scheduleCloudSync);
window.addEventListener('online',()=>syncNow({quiet:true}));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')syncNow({quiet:true})});
