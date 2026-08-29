'use strict';
(()=>{
 if(window.__unvrslProgression187)return;window.__unvrslProgression187=true;
 const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
 const mean=a=>{a=(a||[]).filter(Number.isFinite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const S=()=>{try{return typeof st!=='undefined'?st:window.st}catch(_){return window.st}};
 const base=n=>{try{return typeof baseExerciseName==='function'?baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim()}catch(_){return String(n||'')}};
 const same=(e,n,id)=>(id&&String(e?.sourceId||'')===String(id))||base(e?.n).toLowerCase()===String(n||'').toLowerCase();
 function program(cur){const s=S();try{if(cur?.programId&&typeof programById==='function'){const p=programById(cur.programId);if(p)return p}}catch(_){}return(s?.programs||[]).find(p=>String(p?.cloudPlanId||'')===String(cur?.planId||''))||null}
 function source(e,cur){const p=program(cur);if(!p)return null;const w=p.weeks?.[Math.max(0,(N(cur.w)||1)-1)];if(!w)return null;for(const d of w.days||[]){const x=(d.ex||[]).find(x=>same({n:x.n,sourceId:x.sourceId},base(e.n),e.sourceId));if(x)return x}return null}
 function isWeightless(e,cur){const x=source(e,cur);if(!x)return e.programWeightMode==='adaptive';return !(x.sets||[]).some(s=>(N(s?.w)||0)>0)}
 function effort(x){let rpe=N(x?.rpe),rir=N(x?.rir);if(rir==null&&rpe!=null)rir=10-rpe;if(rpe==null&&rir!=null)rpe=10-rir;return rpe==null?null:{rpe,rir}}
 function rowsFrom(s,n,id){const a=[];(s?.ex||[]).forEach(e=>{if(!same(e,n,id))return;(e.set||[]).forEach(x=>{const ef=effort(x);if(x?.ok&&N(x.w)>0&&N(x.r)>0&&ef)a.push({w:N(x.w),r:N(x.r),rpe:ef.rpe,rir:ef.rir,date:s.date||''})})});return a}
 function history(n,id,exclude){const ss=S()?.sessions||[];for(let i=ss.length-1;i>=0;i--){if(String(ss[i]?.id||'')===String(exclude||''))continue;const r=rowsFrom(ss[i],n,id);if(r.length)return r}return[]}
 function capacity(rows){let vals=rows.map(x=>({e1:x.w*(1+(x.r+x.rir)/30),rpe:x.rpe})).filter(x=>x.e1>0);if(!vals.length)return null;const raw=mean(vals.map(x=>x.e1));if(vals.length>=3){const kept=vals.filter(x=>x.e1>=raw*.82&&x.e1<=raw*1.18);if(kept.length>=2)vals=kept}return mean(vals.map(x=>x.e1))}
 function step(n,id,rows){let s=2.5;try{s=Number(loadStepFor(n,id))||s}catch(_){}const w=mean(rows.map(x=>x.w))||0;if(w<=6)return Math.min(s,.5);if(w<=12)return Math.min(s,1);if(w<=22)return Math.min(s,2);return s}
 function round(v,s){return Math.max(s,Math.round(v/s)*s)}
 function apply(){const cur=S()?.current;if(!cur)return false;let changed=false;cur.unvrslAdaptive174Applied=true;cur.adaptiveEffortV2Applied=true;(cur.ex||[]).forEach(e=>{if(e?.mode==='cardio'||!isWeightless(e,cur))return;e.programWeightMode='adaptive';const rows=history(base(e.n),e.sourceId,cur.id);if(!rows.length){e.progression187={mode:'calibration'};return}const e1=capacity(rows);if(!(e1>0))return;const target=N(e.target)??N(cur.target)??8,rir=clamp(10-target,0,10),reps=mean((e.set||[]).map(x=>N(x.r)).filter(x=>x>0));if(!(reps>0))return;const stp=step(base(e.n),e.sourceId,rows),wanted=round(e1/(1+(reps+rir)/30),stp);if(!(wanted>0))return;(e.set||[]).forEach(x=>{if(!x.ok&&!x.manualOverride&&N(x.r)>0){x.w=wanted;x.adaptiveSuggestedW=wanted}});e.progression187={mode:'working_weight',weight:wanted,e1rm:Math.round(e1*10)/10,target,reps:Math.round(reps*10)/10,sourceDate:rows[0]?.date||''};changed=true});try{if(typeof save==='function')save()}catch(_){}return changed}
 function clean(){const cur=S()?.current;if(!cur)return;[...document.querySelectorAll('#start .exercise')].forEach((card,i)=>{const e=cur.ex?.[i];if(e?.programWeightMode==='adaptive')card.querySelectorAll('.smart-suggest').forEach(x=>x.remove())})}
 function install(){let f;try{f=typeof startPage==='function'?startPage:window.startPage}catch(_){f=window.startPage}if(typeof f!=='function'||f.__p187)return;const w=function(){const r=f.apply(this,arguments);setTimeout(()=>{if(apply())f.apply(this,arguments);clean()},0);return r};w.__p187=true;try{startPage=w}catch(_){window.startPage=w}}
 try{install();[50,250,800,1600,2600].forEach(t=>setTimeout(()=>{install();apply();clean()},t))}catch(e){console.warn('progression187',e)}
})();