'use strict';
((root,factory)=>{
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.UNVRSL_METHOD_V211=api;
})(typeof window!=='undefined'?window:globalThis,()=>{
  const value=input=>{if(input===''||input==null)return null;const parsed=Number(String(input).replace(',','.'));return Number.isFinite(parsed)?parsed:null};
  const mean=items=>{const values=(items||[]).map(value).filter(item=>item!=null);return values.length?values.reduce((sum,item)=>sum+item,0)/values.length:null};
  const median=items=>{const a=(items||[]).map(value).filter(v=>v!=null).sort((a,b)=>a-b);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};
  const round=(input,step=2.5)=>{const number=value(input),increment=value(step)||2.5;return number==null?null:Math.max(increment,Math.round(number/increment)*increment)};
  const entrySets=entry=>{if(Array.isArray(entry?.sets)&&entry.sets.length)return entry.sets.map(set=>({...set,w:value(set?.w??set?.weight)||0,r:value(set?.r??set?.reps)||0}));return Array.from({length:Math.max(1,value(entry?.s)||1)},()=>({w:value(entry?.w)||0,r:value(entry?.r)||0,rest:value(entry?.rest)}))};
  function expandPlanEntries(entries=[]){const source=entries.filter(Boolean),flat=source.flatMap(entrySets),names=source.map(entry=>String(entry?.n||entry?.name||'')),isUnvrsl=names.some(name=>/UNVRSL/i.test(name))||source.some(entry=>String(entry?.method||'').toUpperCase()==='UNVRSL');if(!isUnvrsl)return{method:String(source[0]?.method||'STANDARD').toUpperCase(),sets:flat};const compressedPair=source.length===2&&source.every(entry=>(value(entry?.s)||1)===1),compressedWithFinish=source.length===3&&(value(source[0]?.s)||1)===1&&(value(source[1]?.s)||1)===1;if(!compressedPair&&!compressedWithFinish)return{method:'UNVRSL',sets:flat};const heavy=entrySets(source[0])[0],light=entrySets(source[1])[0],rounds=Array.from({length:3},()=>[{...heavy},{...light}]).flat(),finish=compressedWithFinish?entrySets(source[2]):[];return{method:'UNVRSL',sets:[...rounds,...finish]}}
  function aggregateRecommendation(rows=[],currentWeights=[],currentReps=[],targetRpes=[],step=2.5){
    const valid=rows.map(row=>{const w=value(row?.w??row?.weight),r=value(row?.r??row?.reps),rpe=value(row?.rpe),rir=value(row?.rir);return{w,r,rpe,rir:rir!=null?rir:(rpe!=null?Math.max(0,10-rpe):2)}}).filter(row=>row.w>0&&row.r>0);if(!valid.length)return null;
    const e1rms=valid.map(row=>row.w*(1+(row.r+row.rir)/30)).filter(v=>v>0),center=median(e1rms),kept=e1rms.filter(v=>!center||(v>=center*.82&&v<=center*1.18)),estimatedMax=mean(kept.length?kept:e1rms),averageWeight=mean(valid.map(row=>row.w)),averageReps=mean(valid.map(row=>row.r)),averageRpe=mean(valid.map(row=>row.rpe));
    const n=Math.max(currentWeights.length,currentReps.length,targetRpes.length,1),weights=Array.from({length:n},(_,i)=>{const reps=Math.max(1,value(currentReps[i])??averageReps??8),rpe=value(targetRpes[i])??8,rir=Math.max(0,10-rpe),raw=estimatedMax/(1+(reps+rir)/30),anchor=value(currentWeights[i]);let candidate=raw;if(anchor>0)candidate=Math.max(anchor*.90,Math.min(anchor*1.075,candidate));return round(candidate,step)});
    return{weights,averageWeight:Number((averageWeight||0).toFixed(1)),averageReps:Number((averageReps||0).toFixed(1)),averageRpe:averageRpe==null?null:Number(averageRpe.toFixed(1)),desiredAverage:Number((mean(weights)||0).toFixed(1)),estimatedMax:Number((estimatedMax||0).toFixed(1))}
  }
  return{aggregateRecommendation,expandPlanEntries,mean,median,round};
});

// v380 owns program editing and saving. Keep only the SLDR preset helper here.
((root)=>{
  if(!root||root.__unvrslSldrRuntimeV380)return;root.__unvrslSldrRuntimeV380=true;root.__unvrslSldrBuilderV214=true;
  const n=(id,fallback)=>{const x=Number(String(document.getElementById(id)?.value??'').replace(',','.'));return Number.isFinite(x)?x:fallback};
  const pattern=()=>{const scheme=document.getElementById('pmSldrScheme')?.value||'12-10-8';if(scheme==='10-8-6')return[10,8,6];if(scheme==='15-12-10')return[15,12,10];if(scheme==='manual')return[n('pmSldrManual1',12),n('pmSldrManual2',10),n('pmSldrManual3',8)].map(v=>Math.max(1,Math.round(v)));return[12,10,8]};
  const sync=()=>{const p=pattern(),reps=document.getElementById('pmReps'),hint=document.getElementById('methodHint');if(reps)reps.value=String(p[0]);if(hint&&document.getElementById('pmMethod')?.value==='SLDR')hint.textContent=`SLDR — 3 раунда × (${p[0]} → ${p[1]} → ${p[2]}). Один вес, 15 сек между mini-set, после раунда полный отдых.`;return p};
  root.programSetSldrScheme=function(value){const manual=document.getElementById('pmSldrManualFields');if(manual)manual.classList.toggle('hidden',value!=='manual');if(value!=='manual'){const p=value==='10-8-6'?[10,8,6]:value==='15-12-10'?[15,12,10]:[12,10,8];[1,2,3].forEach((i,k)=>{const el=document.getElementById(`pmSldrManual${i}`);if(el)el.value=p[k]})}sync()};root.programSldrManualChanged=sync;
})(typeof window!=='undefined'?window:null);

// Method-aware postprocessor for the canonical load model. v292 still owns
// history, progression gates and confidence; this layer only restores each
// method's internal weight structure after a base recommendation is calculated.
((W)=>{
  if(!W||W.__unvrslMethodLoadAdapterV382)return;W.__unvrslMethodLoadAdapterV382=true;
  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null},num=v=>N(v)??0;
  const base=n=>{try{return W.baseExerciseName?W.baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim()}catch(_){return String(n||'')}};
  const round=(v,s)=>Math.max(0,Math.round(num(v)/(s||2.5))*(s||2.5));
  function step(ex){try{return Number(W.loadStepFor?.(base(ex?.n),ex?.sourceId||null))||2.5}catch(_){return 2.5}}
  function programFor(cur){try{if(cur?.programId&&typeof W.programById==='function')return W.programById(cur.programId);return(W.st?.programs||[]).find(p=>String(p?.id||'')===String(cur?.programId||''))||null}catch(_){return null}}
  function blockFor(ex,cur){const p=programFor(cur),w=p?.weeks?.[Math.max(0,(Number(cur?.w)||1)-1)];if(!w)return null;const days=w.days||[],ordered=[...days].sort((a,b)=>(String(a?.name||'')===String(cur?.c||'')?-1:0)-(String(b?.name||'')===String(cur?.c||'')?-1:0));for(const d of ordered){const hit=(d.ex||[]).find(b=>(ex?.sourceId&&b?.sourceId&&String(ex.sourceId)===String(b.sourceId))||base(b?.n).toLowerCase()===base(ex?.n).toLowerCase());if(hit)return hit}return null}
  function readiness(v,ex,cur,stp){try{const fn=W.unvrslTrainingReadinessWeightV292||W.trainingLoadModel292?.readinessWeight;if(typeof fn==='function'){const out=fn(v,ex,cur,stp);if(out!=null)return out}}catch(_){}const f=cur?.trainingReadinessDone&&cur?.readinessAdjusted?num(cur?.readiness?.factor)||1:1;return round(v*f,stp)}
  function groups(cur){const map=new Map();(cur?.ex||[]).forEach(ex=>{if(!ex||ex.mode==='cardio')return;const k=`${ex.g||''}|${ex.sourceId||base(ex.n).toLowerCase()}|${ex.method||'STANDARD'}`;if(!map.has(k))map.set(k,[]);map.get(k).push(ex)});return[...map.values()]}
  function setBase(ex,set,v,cur,stp){if(!(v>=0)||!set)return;set.recommendedW=v;if(ex?.programWeightMode!=='prescribed'&&!set.ok&&!set.manualOverride){set.plannedW=v;set.baselineW=v;set.baselineSource='method_adapter_v382';set.w=readiness(v,ex,cur,stp)}}
  function adapt(cur){if(!cur?.id)return false;let changed=false;for(const list of groups(cur)){const first=list[0],method=String(first?.method||'STANDARD').toUpperCase(),block=blockFor(first,cur),cfg=block?.methodConfig||{},flat=list.flatMap(ex=>(ex.set||[]).map(set=>({ex,set})));if(!flat.length)continue;const stp=step(first);
      if(method==='SLDR'||method==='FST-7'){
        const vals=flat.map(x=>N(x.set?.recommendedW??x.set?.plannedW??x.set?.w)).filter(v=>v>0),anchor=vals.length?(W.UNVRSL_METHOD_V211?.median?.(vals)||vals[0]):0;if(anchor>0){flat.forEach(x=>setBase(x.ex,x.set,round(anchor,stp),cur,stp));changed=true}
      }
      if(method==='DS'&&cfg.dropSet?.mode!=='manual'){
        const ds=cfg.dropSet||{},anchor=N(flat[0]?.set?.recommendedW??flat[0]?.set?.plannedW??flat[0]?.set?.w);if(!(anchor>0))continue;let prev=anchor;flat.forEach((x,i)=>{let v=anchor;if(i>0){const drop=Math.max(0,num(ds.dropValue)||20);if(ds.dropMode==='kg')v=ds.dropReference==='initial'?Math.max(0,anchor-drop*i):Math.max(0,prev-drop);else v=ds.dropReference==='initial'?Math.max(0,anchor*(1-drop*i/100)):Math.max(0,prev*(1-drop/100));v=round(v,stp);prev=v}setBase(x.ex,x.set,v,cur,stp)});changed=true
      }
    }if(changed){try{W.save?.()}catch(_){}}return changed}
  function install(){const api=W.trainingLoadModel292;if(!api?.run||api.run.__method382)return false;const old=api.run;const wrapped=async function(){const out=await old.apply(this,arguments);try{adapt(W.st?.current)}catch(e){console.warn('method adapter v382',e)}return out};wrapped.__method382=true;wrapped.__method382Base=old;api.run=wrapped;W.unvrslMethodLoadAdaptV382=()=>adapt(W.st?.current);return true}
  ['unvrsl:training-engine-ready','unvrsl:modules-ready','unvrsl:app-ready','unvrsl:readiness-ready'].forEach(ev=>W.addEventListener?.(ev,()=>{if(install())setTimeout(()=>W.trainingLoadModel292?.run?.(true),0)},{passive:true}));[0,200,600,1200,2400,5000].forEach(ms=>setTimeout(()=>{if(install())setTimeout(()=>W.trainingLoadModel292?.run?.(true),0)},ms));
})(typeof window!=='undefined'?window:null);
