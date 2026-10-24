const path=require('node:path'),{performance}=require('node:perf_hooks');
// Usage: node scripts/benchmark-recommendations.cjs [checkout-root]
const dir=path.resolve(process.argv[2]||path.join(__dirname,'..')),A=require(path.join(dir,'recommendation-adapter')),E=require(path.join(dir,'recommendation-engine'));
const now=Date.UTC(2026,9,24,12),ids=['canon:bench_press','canon:barbell_rdl','canon:barbell_row','canon:leg_extension','canon:lying_leg_curl','canon:incline_db_press','canon:pec_deck','canon:rope_pushdown'];
function exercise(id,index){return {exerciseId:id,n:id,tempo:'2-0-X',method:'STANDARD',equipmentProfile:{id:'gear-'+index,loadUnit:'TOTAL',weightStep:2.5,min:20,max:200},set:Array.from({length:4},(_,i)=>({id:'set-'+index+'-'+i,w:80,programW:80,targetRepMin:8,targetRepMax:12,targetRpeMin:8,targetRpeMax:8,ok:false}))};}
const history=Array.from({length:90},(_,i)=>({id:'h-'+i,started:now-(i+1)*86400000,ended:now-(i+1)*86400000+1000,ex:ids.map((id,j)=>{const e=exercise(id,j);e.set.forEach(s=>Object.assign(s,{r:10,rpe:8,actualRir:2,ok:true}));return e;})}));
const cur={id:'current',started:now,ex:ids.map(exercise)},reg={rows:[],identity:e=>e.exerciseId,resolve:()=>null};
const samples=[],digests=[];
for(let run=0;run<3;run++){
 const results=[],a=performance.now();let count=0;
 for(const e of cur.ex)for(const s of e.set){results.push(A.recommend(e,s,cur,history,reg));count++;}
 const matchMs=performance.now()-a;
 const other={...cur.ex[0],exerciseId:'canon:calf_machine',set:cur.ex[0].set},b=performance.now();
 for(const s of other.set)results.push(A.recommend(other,s,cur,history,reg));
 samples.push({matchMs,unmatchedMs:performance.now()-b});digests.push(E.fingerprint(results));
}
const median=key=>samples.map(s=>s[key]).sort((a,b)=>a-b)[1];
console.log(JSON.stringify({dir,pendingSets:32,unmatchedProposals:4,sessions:90,historySets:2880,samples,median:{matchMs:median('matchMs'),unmatchedMs:median('unmatchedMs')},decisionDigests:digests}));
