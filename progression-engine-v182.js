'use strict';
(()=>{
 if(window.__unvrslProgression183)return;window.__unvrslProgression183=true;
 const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null},clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const med=a=>{a=a.filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};
 const S=()=>{try{return typeof st!=='undefined'?st:(window.st||null)}catch(_){return window.st||null}};
 const base=n=>{try{return typeof baseExerciseName==='function'?baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim()}catch(_){return String(n||'')}};
 const step=(n,id)=>{try{return typeof loadStepFor==='function'?loadStepFor(n,id):2.5}catch(_){return 2.5}},round=(v,s)=>Math.max(0,Math.round(v/s)*s);
 const same=(e,n,id)=>(id&&String(e?.sourceId||'')===String(id))||base(e?.n).toLowerCase()===String(n).toLowerCase();
 function effort(x){let rpe=N(x?.rpe),rir=N(x?.rir);if(rir==null&&rpe!=null)rir=10-rpe;if(rpe==null&&rir!=null)rpe=10-rir;return rir==null?null:{rpe,rir}}
 function rows(n,id,exclude){const ss=S()?.sessions||[];for(let i=ss.length-1;i>=0;i--){const ses=ss[i];if(exclude&&String(ses?.id)===String(exclude))continue;const out=[];(ses?.ex||[]).forEach(e=>{if(!same(e,n,id))return;(e.set||[]).forEach(x=>{const ef=effort(x);if(x?.ok&&N(x.w)>0&&N(x.r)>0&&ef)out.push({w:N(x.w),r:N(x.r),rir:ef.rir,rpe:ef.rpe,date:ses.date})})});if(out.length)return out}return[]}
 function capacity(rs){const a=rs.map(x=>x.w*(1+(x.r+x.rir)/30)).filter(x=>x>0);if(!a.length)return null;const best=Math.max(...a),working=a.filter(x=>x>=best*.88);return med(working.length?working:a)}
 function predict(cap,reps,rpe,stp){const rir=clamp(10-rpe,0,10);return round(cap/(1+(reps+rir)/30),stp)}
 function special(e){const m=String(e?.method||e?.m||e?.methodName||'STANDARD').toUpperCase();return !!e?.g||/UNVRSL|SLDR|DROP|ДРОП|SUPER|СУПЕР/.test(m)}
 function plannedWeight(e){const vals=(e.set||[]).map(x=>N(x.plannedW)??N(x.w)).filter(x=>x>0);return med(vals)}
 function apply(){
  const s=S(),cur=s?.current;if(!cur||cur.progression183Applied)return false;let changed=false;
  (cur.ex||[]).forEach(e=>{
   if(e?.mode==='cardio')return;
   const n=base(e.n),id=e.sourceId||null,rs=rows(n,id,cur.id),cap=capacity(rs),target=N(e.target)??N(cur.target)??8,stp=step(n,id),hasHistory=!!cap;
   const planW=plannedWeight(e),hasPlan=planW>0;
   if(!hasHistory){
    // First exposure: keep prescribed program weights if present; otherwise this workout is calibration and user enters weights manually.
    e.progression183={mode:hasPlan?'program':'calibration',sourceDate:'',uniform:!special(e),target};
    return;
   }
   if(!special(e)){
    const reps=med((e.set||[]).map(x=>N(x.r)).filter(x=>x>0));if(!(reps>0))return;
    let w=predict(cap,reps,target,stp);if(!(w>0))return;
    // When the program contains weights, treat them as the programmed anchor, but adapt them to the athlete's last actual performance.
    if(hasPlan)w=round(clamp(w,planW*.75,planW*1.20),stp);
    (e.set||[]).forEach(x=>{if(!(N(x.r)>0))return;if(x.plannedW==null)x.plannedW=N(x.w)||0;x.adaptiveSuggestedW=w;x.w=w});
    e.progression183={mode:hasPlan?'adapted_program':'from_calibration',weight:w,reps,target,sourceDate:rs[0]?.date||'',uniform:true};changed=true;
   }else{
    // Special methods keep phase-specific repetitions/structure; only each phase load is adapted from the latest real performance.
    (e.set||[]).forEach(x=>{const reps=N(x.r);if(!(reps>0))return;let w=predict(cap,reps,target,stp);const pw=N(x.plannedW)??N(x.w);if(pw>0)w=round(clamp(w,pw*.75,pw*1.20),stp);if(x.plannedW==null)x.plannedW=pw||0;x.adaptiveSuggestedW=w;x.w=w;changed=true});
    e.progression183={mode:hasPlan?'adapted_program':'from_calibration',target,sourceDate:rs[0]?.date||'',uniform:false};
   }
  });
  cur.progression183Applied=true;
  // Prevent the older v174 per-set adapter from overwriting the unified recommendation after this engine has decided the loads.
  cur.unvrslAdaptive174Applied=true;
  try{if(typeof save==='function')save()}catch(_){}
  return changed;
 }
 function install(){let f;try{f=typeof startPage==='function'?startPage:window.startPage}catch(_){f=window.startPage}if(typeof f!=='function'||f.__p183)return;const w=function(){apply();return f.apply(this,arguments)};w.__p183=true;try{startPage=w}catch(_){window.startPage=w}}
 try{install();[50,250,900,1800].forEach(t=>setTimeout(install,t))}catch(e){console.warn('progression183',e)}
})();