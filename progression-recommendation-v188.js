'use strict';
(()=>{
 if(window.__unvrslRecommendation188)return;window.__unvrslRecommendation188=true;
 const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
 const mean=a=>{a=(a||[]).filter(Number.isFinite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const S=()=>{try{return typeof st!=='undefined'?st:window.st}catch(_){return window.st}};
 const base=n=>{try{return typeof baseExerciseName==='function'?baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim()}catch(_){return String(n||'')}};
 const same=(e,n,id)=>(id&&String(e?.sourceId||'')===String(id))||base(e?.n).toLowerCase()===String(n||'').toLowerCase();
 function program(cur){const s=S();try{if(cur?.programId&&typeof programById==='function'){const p=programById(cur.programId);if(p)return p}}catch(_){}return(s?.programs||[]).find(p=>String(p?.cloudPlanId||'')===String(cur?.planId||''))||null}
 function source(e,cur){const p=program(cur);if(!p)return null;const w=p.weeks?.[Math.max(0,(N(cur.w)||1)-1)];if(!w)return null;for(const d of w.days||[]){const x=(d.ex||[]).find(x=>same({n:x.n,sourceId:x.sourceId},base(e.n),e.sourceId));if(x)return x}return null}
 function prescribed(e,cur){const x=source(e,cur);if(!x)return e?.programWeightMode==='prescribed';return (x.sets||[]).some(s=>(N(s?.w)||0)>0)}
 function effort(x){let rpe=N(x?.rpe),rir=N(x?.rir);if(rir==null&&rpe!=null)rir=10-rpe;if(rpe==null&&rir!=null)rpe=10-rir;return rpe==null?null:{rpe,rir}}
 function rows(n,id,exclude){const ss=S()?.sessions||[];for(let i=ss.length-1;i>=0;i--){if(String(ss[i]?.id||'')===String(exclude||''))continue;const out=[];(ss[i]?.ex||[]).forEach(e=>{if(!same(e,n,id))return;(e.set||[]).forEach(x=>{const ef=effort(x);if(x?.ok&&N(x.w)>0&&N(x.r)>0&&ef)out.push({w:N(x.w),r:N(x.r),rpe:ef.rpe,rir:ef.rir,date:ss[i].date||''})})});if(out.length)return out}return[]}
 function capacity(rs){let vals=rs.map(x=>x.w*(1+(x.r+x.rir)/30)).filter(x=>x>0);if(!vals.length)return null;const raw=mean(vals);if(vals.length>=3){const kept=vals.filter(x=>x>=raw*.82&&x<=raw*1.18);if(kept.length>=2)vals=kept}return mean(vals)}
 function step(n,id,rs){let s=2.5;try{s=Number(loadStepFor(n,id))||s}catch(_){}const w=mean(rs.map(x=>x.w))||0;if(w<=6)return Math.min(s,.5);if(w<=12)return Math.min(s,1);if(w<=22)return Math.min(s,2);return s}
 function round(v,s){return Math.max(s,Math.round(v/s)*s)}
 function calc(baseName,sourceId,target){const cur=S()?.current;if(!cur)return null;const e=(cur.ex||[]).find(x=>same(x,baseName,sourceId));if(!e||!prescribed(e,cur))return null;const rs=rows(base(e.n),e.sourceId,cur.id);if(!rs.length)return null;const e1=capacity(rs);if(!(e1>0))return null;const reps=mean((e.set||[]).map(x=>N(x.r)).filter(x=>x>0));if(!(reps>0))return null;const tr=N(target)??N(e.target)??N(cur.target)??8,rir=clamp(10-tr,0,10),stp=step(base(e.n),e.sourceId,rs),weight=round(e1/(1+(reps+rir)/30),stp);if(!(weight>0))return null;return{weight,reps:Math.round(reps*10)/10,target:tr,e1rm:Math.round(e1*10)/10,from:mean(rs.map(x=>x.w)),model:'E1RM-MEAN-188'}}
 function baselineForExercise(e){const cur=S()?.current;if(!cur||!e||!prescribed(e,cur))return null;return calc(base(e.n),e.sourceId,N(e.target)??N(cur.target)??8)}
 window.unvrslPrescribedBaseline188=baselineForExercise;
 window.unvrslIsPrescribed188=e=>prescribed(e,S()?.current);
 const oldSuggestion=window.suggestionFor;
 window.suggestionFor=function(baseName,sourceId=null,target=8){const cur=S()?.current,e=(cur?.ex||[]).find(x=>same(x,baseName,sourceId));if(e&&!prescribed(e,cur))return null;const c=calc(baseName,sourceId,target);if(c)return c;return e?null:(typeof oldSuggestion==='function'?oldSuggestion.apply(this,arguments):null)};
 try{suggestionFor=window.suggestionFor}catch(_){}
 const oldApply=window.applySuggestion;
 window.applySuggestion=function(indices,weight){const cur=S()?.current,w=N(weight);if(!cur||!(w>0))return;let applied=false;(indices||[]).forEach(i=>{const e=cur.ex?.[i];if(!e||!prescribed(e,cur))return;(e.set||[]).forEach(x=>{if(!x.ok&&!x.manualOverride)x.w=w});applied=true});if(!applied)return;try{if(typeof save==='function')save()}catch(_){};try{if(typeof startPage==='function')startPage()}catch(_){};try{if(typeof toast==='function')toast(`Установлено ${w} кг`)}catch(_){}};
 try{applySuggestion=window.applySuggestion}catch(_){}
})();