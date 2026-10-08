const test=require('node:test');const assert=require('node:assert/strict');const A=require('../workout-domain.js');
const reg=A.registry([{id:'bench',n:'Жим',type:'compound',loadType:'external_total'},{id:'curl',n:'Бицепс',type:'isolation',loadType:'machine_stack'},{id:'pull',n:'Подтягивания',type:'compound',loadType:'bodyweight_added'}]);
const ex=(id='bench',sets=[])=>({exerciseId:id,n:reg.resolve(id).n,method:'STANDARD',set:sets});
const work=(w,r,rpe,extra={})=>({w,r,actualReps:r,actualRpe:rpe,ok:true,...extra});
const target=(extra={})=>({w:100,programW:100,targetRepMin:8,targetRepMax:10,targetRpeMin:7,targetRpeMax:8,...extra});
const past=(sets,id='bench',extra={})=>({id:'past',date:'2026-10-01',ended:1,ex:[{...ex(id,sets),...extra}]});
const current=(set,id='bench',extra={})=>({id:'now',date:'2026-10-07',ex:[ex(id,[set])],...extra});
for(const weeks of [3,4,6,8,10,11,12])for(const days of [3,4])test(`${weeks} weeks, ${days} days: phase selection and volume allocation`,()=>{
 const p=A.generateCycle({weeks,daysPerWeek:days,startDate:'2026-10-07',exercises:[{exerciseId:'bench',kind:'base',dayIndices:[0,1,2]},{exerciseId:'curl',kind:'isolation',dayIndices:[0,1]}]});
 assert.equal(p.weeks.length,weeks);assert.ok(p.weeks.at(-1).testWeek);assert.equal(p.weeks[0].days.length,days);
 assert.deepEqual(p.weeks[0].days.map(d=>d.role),A.dayRoles(days));
 if(weeks>4)assert.ok(p.weeks.some(w=>w.deload));
 for(const w of p.weeks){for(const id of ['bench','curl']){const all=w.days.flatMap(d=>d.ex.filter(e=>e.exerciseId===id));const count=all.reduce((n,e)=>n+e.sets.length,0);assert.equal(count,w.weeklyLoadProfile[id==='bench'?'base':'isolation'].sets);}}
});
test('eight-week canonical phases, real deload and no ordinary isolation during test',()=>{
 const p=A.cycleProfiles(8);assert.deepEqual(p.map(x=>x.phase),['volume','work','intensification','deload','heavy','recovery','strength','test']);
 for(const i of [3,5]){assert.deepEqual(p[i].base.rpe,[4,6]);assert.equal(p[i].isolation.sets,2);}
 assert.equal(p[7].isolation.sets,0);
 assert.equal(A.cycleProfiles(3,{testWeek:false}).at(-1).phase,'strength');
 assert.equal(A.cycleProfiles(3,{testWeek:false,priority:'hypertrophy'}).at(-1).phase,'intensification');
});
test('formula and external pull-up load exclude body mass',()=>{
 const e=ex('pull');assert.equal(A.e1rm(e,work(20,6,8),{bodyWeight:100},reg),25.3);
 assert.equal(A.e1rm(e,work(20,6,8),{},reg),25.3);
 assert.ok(Math.abs(A.estimateMaxFromSet(work(150,1,10))-155)<1e-9);
 assert.equal(A.e1rm(e,work(0,6,8),{bodyWeight:100},reg),null);
});
test('different IDs, technique, equipment, method and partial sets cannot contaminate strength',()=>{
 const e=ex(),s=target(),cur=current(s);const h=past([work(100,8,8)]);
 for(const change of [{exerciseId:'curl'},{techniqueId:'paused'},{equipmentProfileId:'machine-2'},{method:'DS'}]){const other=structuredClone(h);Object.assign(other.ex[0],change);assert.equal(A.recommend(e,s,cur,[other],reg).strength.estimate,null);}
 for(const flag of [{warmup:true},{partial:true},{fullROM:false},{incomplete:true},{techniqueFailed:true}])assert.equal(A.e1rm(e,work(100,8,8,flag),{},reg),null);
});
test('isolation has its own e1RM and missing history preserves assigned load',()=>{
 const s=target({w:20,programW:20});const c=current(s,'curl');const r=A.recommend(c.ex[0],s,c,[past([work(20,10,8)],'curl'),past([work(200,8,8)])],reg);
 assert.ok(r.strength.estimate>20&&r.strength.estimate<35);
 const empty=A.recommend(c.ex[0],s,c,[],reg);assert.equal(empty.weight,20);assert.equal(empty.strength.estimate,null);
});
test('percentage conflict uses inverse Epley corridor and validates RIR',()=>{
 const v=A.validatePrescription({sets:3,pct:[85,88],reps:[5,7],rpe:[8,9],rir:[1,2]});assert.equal(v.valid,false);assert.ok(v.corridor[1]<85);
 assert.equal(A.validatePrescription({sets:3,pct:[70,75],reps:[10,12],rpe:[7,8],rir:[0,1]}).valid,false);
});
test('target, hard minimum, failed minimum and easy series decisions obey bounded steps',()=>{
 const e=ex(),s=target(),p=A.profile(e,reg);
 assert.equal(A.setDecision(e,work(100,8,8),{},p,s).action,'hold');
 assert.equal(A.setDecision(e,work(100,8,9),{},p,s).action,'hold');
 const bad=A.setDecision(e,work(100,5,10),{},p,s);assert.ok(bad.weight>=90&&bad.weight<100);
 const easy=A.setDecision(e,work(100,10,6),{},p,s);assert.ok(easy.weight>100&&easy.weight<=107.5);
 assert.equal(A.boundedProgression(12,10,{step:2,min:0}).weight,10);
});
test('manual weight and dismissed proposals survive recalculation',()=>{
 const manual=target({manualOverride:true,weightSource:'manual'});assert.equal(A.applyAuto(manual,{weight:105}),false);assert.equal(manual.w,100);
 const s=target({dismissedRecommendation:'a'});assert.equal(A.applyAuto(s,{weight:105,proposalKey:'a'}),false);assert.equal(s.w,100);
});
test('methods keep their recipes and deload disables special methods',()=>{
 const p=A.generateCycle({weeks:4,daysPerWeek:3,startDate:'2026-10-07',exercises:[{exerciseId:'bench',method:'DS',sets:[{w:100,r:10},{w:80,r:10},{w:60,r:10}]}]});
 assert.deepEqual(p.weeks[0].days[0].ex[0].sets.map(s=>s.w),[100,80,60]);assert.equal(p.weeks[2].days[0].ex[0].method,'STANDARD');
 for(const method of ['AMRAP','EMOM','AFAP','HIIT'])assert.equal(A.e1rm({...ex(),method},work(100,8,8),{},reg),null);
});
test('two independent fatigue signs suggest early deload, one does not',()=>{
 assert.equal(A.fatigueSignals([{actualRpe:10,targetRpe:8}]).suggestDeload,false);
 assert.equal(A.fatigueSignals([{actualRpe:10,targetRpe:8,actualReps:4,minReps:8}]).suggestDeload,true);
});
test('dates are validated and target remains in the final week',()=>{
 assert.throws(()=>A.generateCycle({weeks:4,daysPerWeek:3,startDate:'2026-02-30'}));
 assert.throws(()=>A.generateCycle({weeks:4,daysPerWeek:3,startDate:'2026-10-07',targetDate:'2026-10-15'}));
 const p=A.generateCycle({weeks:4,daysPerWeek:3,startDate:'2026-10-07',targetDate:'2026-10-31'});assert.ok(p.weeks.at(-1).days.every(d=>d.date<='2026-10-31'));
});

test('explicit accept and cancel restore a manual load and record the decision',()=>{
 const set={w:81.25,plannedW:81.25,manualOverride:true,weightSource:'manual'};
 const rec={weight:85,proposalKey:'accept-1'};
 assert.equal(A.acceptRecommendation(set,rec),true);assert.equal(set.w,85);
 const restored=JSON.parse(JSON.stringify(set));A.dismissRecommendation(restored,rec);
 assert.equal(restored.w,81.25);assert.equal(restored.manualOverride,true);assert.equal(restored.weightSource,'manual');assert.equal(restored.recommendationDecision.status,'dismissed');
 assert.equal(A.applyAuto(restored,rec),false);
});
