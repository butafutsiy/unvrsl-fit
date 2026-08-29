'use strict';
(()=>{
  if(window.__unvrslProgression185)return;
  window.__unvrslProgression185=true;

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const med=a=>{a=(a||[]).filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};
  const S=()=>{try{return typeof st!=='undefined'?st:(window.st||null)}catch(_){return window.st||null}};
  const base=n=>{try{return typeof baseExerciseName==='function'?baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim()}catch(_){return String(n||'')}};
  const same=(e,n,id)=>(id&&String(e?.sourceId||'')===String(id))||base(e?.n).toLowerCase()===String(n||'').toLowerCase();
  const step=(n,id)=>{try{return typeof loadStepFor==='function'?loadStepFor(n,id):2.5}catch(_){return 2.5}};
  const round=(v,s)=>Math.max(0,Math.round(v/s)*s);
  const isSpecial=e=>{const m=String(e?.method||e?.m||e?.methodName||'STANDARD').toUpperCase();return !!e?.g||/UNVRSL|SLDR|DROP|ДРОП|SUPER|СУПЕР|FST/.test(m)};

  function programByCurrent(cur){
    const s=S();if(!s||!cur?.programId)return null;
    try{if(typeof programById==='function'){const p=programById(cur.programId);if(p)return p}}catch(_){}
    return (s.programs||[]).find(p=>String(p?.id)===String(cur.programId))||null;
  }
  function programExerciseFor(e,cur){
    const p=programByCurrent(cur);if(!p)return null;
    const wi=Math.max(0,(N(cur.w)||1)-1),w=p.weeks?.[wi];if(!w)return null;
    let d=(w.days||[]).find(x=>String(x?.name||'')===String(cur.c||''))||w.days?.[0];if(!d)return null;
    return (d.ex||[]).find(b=>same({n:b.n,sourceId:b.sourceId},base(e.n),e.sourceId||null))||null;
  }
  function sourceMode(e,cur){
    if(e?.programWeightMode==='prescribed'||e?.programWeightMode==='adaptive')return e.programWeightMode;
    const b=programExerciseFor(e,cur);if(b){const has=(b.sets||[]).some(x=>(N(x?.w)||0)>0);return has?'prescribed':'adaptive'}
    // Fallback for old/non-program workouts: explicit positive plan weights are treated as prescribed.
    const has=(e?.set||[]).some(x=>(N(x?.plannedW)??N(x?.w)??0)>0);return has?'prescribed':'adaptive';
  }

  function stampWeightModes(pid,wi,di){
    const s=S(),p=(s?.programs||[]).find(x=>String(x?.id)===String(pid));const d=p?.weeks?.[wi]?.days?.[di],cur=s?.current;if(!d||!cur)return;
    const modes=[];
    (d.ex||[]).forEach(b=>{const mode=(b.sets||[]).some(x=>(N(x?.w)||0)>0)?'prescribed':'adaptive';const count=(b.method==='STANDARD'||b.method==='FST-7')?1:Math.max(1,b.sets?.length||1);for(let i=0;i<count;i++)modes.push(mode)});
    (cur.ex||[]).forEach((e,i)=>{if(modes[i])e.programWeightMode=modes[i]});
    try{if(typeof save==='function')save()}catch(_){}
  }
  function installBeginPatch(){
    let f;try{f=typeof beginProgramDay==='function'?beginProgramDay:window.beginProgramDay}catch(_){f=window.beginProgramDay}
    if(typeof f!=='function'||f.__weightMode185)return false;
    const w=function(pid,wi,di){const r=f.apply(this,arguments);try{stampWeightModes(pid,wi,di)}catch(_){}return r};w.__weightMode185=true;
    try{beginProgramDay=w}catch(_){window.beginProgramDay=w}return true;
  }

  function extract(s,n,id){
    const out=[];(s?.ex||[]).forEach(e=>{if(!same(e,n,id))return;(e.set||[]).forEach(x=>{let rpe=N(x?.rpe),rir=N(x?.rir);if(rir==null&&rpe!=null)rir=10-rpe;if(rpe==null&&rir!=null)rpe=10-rir;if(x?.ok&&N(x.w)>0&&N(x.r)>0&&rir!=null)out.push({w:N(x.w),r:N(x.r),rpe,rir,date:s.date||s.workout_date||''})})});return out;
  }
  function localRows(n,id,exclude){const ss=S()?.sessions||[];for(let i=ss.length-1;i>=0;i--){if(exclude&&String(ss[i]?.id)===String(exclude))continue;const r=extract(ss[i],n,id);if(r.length)return r}return[]}
  async function cloudRows(n,id,exclude){
    try{if(!window.cloud?.client||!cloud?.user)return[];const res=await cloud.client.from('workouts').select('payload,workout_date,updated_at').eq('user_id',cloud.user.id).order('workout_date',{ascending:false}).limit(24);if(res.error)return[];for(const row of res.data||[]){const p=row.payload||{};if(exclude&&String(p.id)===String(exclude))continue;const r=extract(p,n,id);if(r.length)return r}}catch(e){console.warn('progression185 cloud history',e)}return[];
  }
  function capacity(rows){
    const vals=(rows||[]).map(x=>({row:x,e1:x.w*(1+(x.r+x.rir)/30)})).filter(x=>x.e1>0);if(!vals.length)return null;
    const hard=vals.filter(x=>(x.row.rpe??(10-x.row.rir))>=6);const pool=hard.length?hard:vals;
    const best=Math.max(...pool.map(x=>x.e1)),stable=pool.filter(x=>x.e1>=best*.88);
    return med((stable.length?stable:pool).map(x=>x.e1));
  }
  function predict(cap,reps,targetRpe,stp){if(!(cap>0&&reps>0))return null;const rir=clamp(10-(N(targetRpe)??8),0,10);return round(cap/(1+(reps+rir)/30),stp)}

  function calculate(e,cur,rows){
    const cap=capacity(rows);if(!cap)return null;const n=base(e.n),id=e.sourceId||null,target=N(e.target)??N(cur.target)??8,stp=step(n,id);
    if(!isSpecial(e)){
      const reps=med((e.set||[]).map(x=>N(x.r)).filter(x=>x>0));const weight=predict(cap,reps,target,stp);if(!(weight>0))return null;
      return {weight,reps,target,e1rm:Math.round(cap*10)/10,sourceDate:rows[0]?.date||'',uniform:true};
    }
    const phaseWeights=(e.set||[]).map(x=>({reps:N(x.r),weight:predict(cap,N(x.r),target,stp)}));return {target,e1rm:Math.round(cap*10)/10,sourceDate:rows[0]?.date||'',uniform:false,phaseWeights};
  }
  function applyResult(e,cur,calc,mode){
    if(!calc)return false;
    if(mode==='prescribed'){
      // Program already prescribes the load. Keep it untouched and expose only a recommendation.
      e.progression185={mode:'recommendation',recommendedWeight:calc.weight||null,reps:calc.reps||null,target:calc.target,e1rm:calc.e1rm,sourceDate:calc.sourceDate,uniform:calc.uniform};
      return false;
    }
    // Program has no prescribed load. From workout #2 onward the calculated load becomes the actual working load automatically.
    if(calc.uniform){
      (e.set||[]).forEach(x=>{if(!(N(x.r)>0)||x.ok)return;if(x.plannedW==null)x.plannedW=0;x.adaptiveSuggestedW=calc.weight;x.w=calc.weight});
      e.progression185={mode:'working_weight',workingWeight:calc.weight,reps:calc.reps,target:calc.target,e1rm:calc.e1rm,sourceDate:calc.sourceDate,uniform:true};return true;
    }
    (e.set||[]).forEach((x,i)=>{if(x.ok)return;const w=calc.phaseWeights?.[i]?.weight;if(w>0){if(x.plannedW==null)x.plannedW=0;x.adaptiveSuggestedW=w;x.w=w}});
    e.progression185={mode:'working_weight',target:calc.target,e1rm:calc.e1rm,sourceDate:calc.sourceDate,uniform:false};return true;
  }

  async function apply(){
    const s=S(),cur=s?.current;if(!cur||cur.progression185Applied)return false;
    cur.progression185Applied=true;cur.progression184Applied=true;cur.progression183Applied=true;cur.unvrslAdaptive174Applied=true;
    let changed=false;const needs=[];
    (cur.ex||[]).forEach(e=>{if(e?.mode==='cardio')return;const mode=sourceMode(e,cur);e.programWeightMode=mode;const rs=localRows(base(e.n),e.sourceId||null,cur.id);if(rs.length)changed=applyResult(e,cur,calculate(e,cur,rs),mode)||changed;else{e.progression185={mode:mode==='adaptive'?'calibration':'recommendation',recommendedWeight:null,target:N(e.target)??N(cur.target)??8,uniform:!isSpecial(e)};needs.push({e,mode})}});
    if(needs.length&&window.cloud?.client&&cloud?.user){for(const item of needs){const rs=await cloudRows(base(item.e.n),item.e.sourceId||null,cur.id);if(rs.length)changed=applyResult(item.e,cur,calculate(item.e,cur,rs),item.mode)||changed}}
    try{if(typeof save==='function')save()}catch(_){}
    if(changed){try{if(typeof startPage==='function')startPage()}catch(_){}}
    return changed;
  }
  function installStartPatch(){let f;try{f=typeof startPage==='function'?startPage:window.startPage}catch(_){f=window.startPage}if(typeof f!=='function'||f.__p185)return false;const w=function(){const r=f.apply(this,arguments);setTimeout(apply,0);return r};w.__p185=true;try{startPage=w}catch(_){window.startPage=w}return true}

  try{installBeginPatch();installStartPatch();[50,250,900,1800].forEach(t=>setTimeout(()=>{installBeginPatch();installStartPatch()},t))}catch(e){console.warn('progression185',e)}
})();