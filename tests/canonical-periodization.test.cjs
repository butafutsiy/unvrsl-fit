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
 if(weeks>4)assert.ok(p.weeks.some(w=>w.phase==='deload'));
 for(const w of p.weeks){for(const id of ['bench','curl']){const all=w.days.flatMap(d=>d.ex.filter(e=>e.exerciseId===id));const expected=w.weeklyLoadProfile[id==='bench'?'base':'isolation'].sets;assert.ok(all.every(e=>e.sets.length===expected));assert.equal(all.reduce((n,e)=>n+e.sets.length,0),expected*all.length);}}
});
test('eight-week phases use one percentage table and no ordinary isolation during test',()=>{
 const p=A.cycleProfiles(8);assert.deepEqual(p.map(x=>x.phase),['volume','work','intensification','deload','heavy','recovery','strength','test']);
 for(const i of [3,5]){assert.deepEqual(p[i].base,A.bandPrescription(p[i].pct));assert.deepEqual(p[i].isolation,A.bandPrescription(p[i].pct,true));assert.equal(p[i].deload,false);}
 assert.equal(p[7].isolation.sets,0);
 assert.equal(A.cycleProfiles(3,{testWeek:false}).at(-1).phase,'strength');
 assert.equal(A.cycleProfiles(3,{testWeek:false,priority:'hypertrophy'}).at(-1).phase,'strength');
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
test('methods keep their recipes regardless of low-percentage phase',()=>{
 const p=A.generateCycle({weeks:4,daysPerWeek:3,startDate:'2026-10-07',exercises:[{exerciseId:'bench',method:'DS',sets:[{w:100,r:10},{w:80,r:10},{w:60,r:10}]}]});
 assert.deepEqual(p.weeks[0].days[0].ex[0].sets.map(s=>s.w),[100,80,60]);assert.equal(p.weeks[2].days[0].ex[0].method,'DS');
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

test('ten-week progression has two working blocks, recovery and an explicit final test',()=>{
 const profiles=A.cycleProfiles(10);
 assert.deepEqual(profiles.map(p=>p.sourceWeek),[1,2,3,4,2,3,5,6,7,8]);
 assert.deepEqual(profiles.map(p=>p.base.pct),[[70,75],[75,80],[80,85],[60,65],[75,80],[80,85],[85,88],[65,70],[88,90],[90,100]]);
 assert.deepEqual(profiles.map(p=>p.isolation.reps),[[10,12],[12,15],[15,20],[6,8],[12,15],[15,20],[15,20],[8,10],[15,20],[0,0]]);
 assert.deepEqual(profiles.map(p=>p.base.reps),[[12,15],[10,12],[8,10],[15,20],[10,12],[8,10],[6,8],[12,15],[4,6],[1,3]]);
 const cycle=A.generateCycle({weeks:10,daysPerWeek:5,startDate:'2026-10-11',exercises:[{n:'Присед',kind:'compound',dayIndices:[0],sets:[{w:100}]},{n:'Разгибание ног',kind:'isolation',dayIndices:[0],sets:[{w:50}]}]});
 for(const week of cycle.weeks)for(const day of week.days)for(const e of day.ex){
  const spec=week.weeklyLoadProfile[e.kind==='isolation'?'isolation':'base'];
  assert.deepEqual([e.targetIntensityMin,e.targetIntensityMax],spec.pct);
 }
 assert.deepEqual(cycle.weeks[9].days[0].ex[0].sets.map(s=>[s.role,s.targetRepMin,s.targetRepMax]),[['test_preparation',2,3],['test_preparation',1,2],['test_attempt',1,1],['test_attempt',1,1],['test_attempt',1,1],['backoff',5,6],['backoff',5,6]]);
});

test('automatic periods cover every manual length and all training-day counts',()=>{
 for(let weeks=1;weeks<=52;weeks++)for(let days=1;days<=7;days++){
  const cycle=A.generateCycle({weeks,daysPerWeek:days,startDate:'2026-10-11'});
  assert.equal(cycle.weeks.length,weeks);assert.equal(cycle.weeks.at(-1).testWeek,true);
  for(const w of cycle.weeks){assert.equal(w.days.length,days);assert.equal(new Set(w.days.map(d=>d.date)).size,days);assert.ok(w.weeklyLoadProfile.base.reps[1]<=20);}
  assert.equal('priority' in cycle.cycleOptions,false);
 }
});
test('manual phases and separate isolation profiles survive serialization and rebuild',()=>{
 const options={weeks:5,daysPerWeek:6,startDate:'2026-10-11',periodizationMode:'manual',testWeek:false,phaseSchedule:['work','test','recovery','heavy','volume']};
 const cycle=A.generateCycle(options);assert.deepEqual(cycle.weeks.map(w=>w.phase),options.phaseSchedule);
 const saved=JSON.parse(JSON.stringify(cycle.cycleOptions));saved.weekProfiles[0].isolation={pct:[70,75],sets:5,reps:[10,12],rpe:[8,9],rir:[1,2]};
 const rebuilt=A.generateCycle(saved);assert.deepEqual(rebuilt.weeks[0].weeklyLoadProfile.isolation,saved.weekProfiles[0].isolation);
 assert.deepEqual(rebuilt.weeks[0].weeklyLoadProfile.base.pct,[75,80]);
 assert.throws(()=>A.cycleProfiles(5,{periodizationMode:'manual',phaseSchedule:['work']}));assert.throws(()=>A.cycleProfiles(5,{periodizationMode:'manual',phaseSchedule:['bad','work','work','work','work']}));
 assert.throws(()=>A.cycleProfiles(0));assert.throws(()=>A.dayRoles(8));
});


test('peak recommendations use robust average e1RM instead of incomplete prior working weight',()=>{
 const old={id:'old-peak',date:'2026-10-20',ended:1,ex:[{...ex('bench'),set:[work(120,8,9),work(120,8,9),work(120,8,9)]}]};
 const sets=Array.from({length:2},()=>({w:120,programW:120,weightMode:'auto',targetRepMin:2,targetRepMax:3,targetRpeMin:9,targetRpeMax:9.5}));
 const e={...ex('bench',sets),kind:'base',programWeightMode:'adaptive',equipmentProfile:{weightStep:2.5}};
 const now={id:'peak',date:'2026-11-01',programWeekUseIntensity:true,programWeekIntensityMin:90,programWeekIntensityMax:95,ex:[e]};
 const recommendations=sets.map(s=>A.recommend(e,s,now,[old],reg));
 const weights=recommendations.map(A.recommendationWeight);
 assert.ok(recommendations.every(r=>r.peakRebase&&r.strength.estimate>150&&r.canApply!==false));
 assert.ok(weights.every(w=>w>120),'heavy target must not be frozen to last 120 kg');
 assert.ok(weights[1]>=weights[0],'later high-intensity set must not start lighter');
 assert.ok(weights[0]<=recommendations[0].allowedWeightRange.max+2.5);
});

test('generated testing ramps have multiple loads and stop escalating after a hard single',()=>{
 const cycle=A.generateCycle({weeks:8,daysPerWeek:3,startDate:'2026-09-01',exercises:[{exerciseId:'bench',n:'Жим',kind:'base',dayIndices:[0],weightMode:'auto',sets:[{w:120}]}]});
 const source=cycle.weeks.at(-1).days[0].ex[0];
 assert.deepEqual(source.sets.map(s=>s.role),['test_preparation','test_preparation','test_attempt','test_attempt','test_attempt','backoff','backoff']);
 assert.deepEqual(source.sets.filter(s=>s.role==='test_attempt').map(s=>s.attemptNumber),[1,2,3]);
 assert.deepEqual(source.sets.filter(s=>s.role==='test_preparation').map(s=>s.warmup),[true,true]);
 assert.deepEqual(source.sets.map(s=>s.r),['','','','','','',''],'planned repetitions must be placeholders');
 assert.deepEqual(source.sets.filter(s=>s.role==='backoff').map(s=>[s.backoffPercent,s.targetRepMin,s.targetRepMax]),[[80,5,6],[80,5,6]]);
 const old={id:'old-test',date:'2026-10-20',ended:1,ex:[{...ex('bench'),set:[work(120,8,9),work(120,8,9),work(120,8,9)]}]};
 const e={...source,n:'Жим',exerciseId:'bench',equipmentProfile:{weightStep:2.5},set:source.sets};
 const now={id:'test',date:'2026-11-01',w:8,testWeek:true,weeklyLoadProfile:cycle.weeks.at(-1).weeklyLoadProfile,ex:[e]};
 const weights=e.set.map(s=>A.recommendationWeight(A.recommend(e,s,now,[old],reg)));
 assert.ok(weights.slice(0,5).every(w=>w>0));
 assert.deepEqual(weights.slice(5),[0,0],'back-off weight is unavailable until a real test result');
 assert.ok(weights[0]<weights[1]&&weights[1]<weights[2]&&weights[2]<=weights[3]&&weights[3]<=weights[4],
   'prep and 1RM attempts must form an increasing staged ramp');
 const firstTest=e.set[2];Object.assign(firstTest,{w:weights[2],ok:true,r:1,actualReps:1,actualRpe:9.5});
 const next=A.recommend(e,e.set[3],now,[old],reg);
 assert.equal(next.action,'stop');assert.equal(next.canApply,false);
});

test('above 100% input survives normalization without authorizing an unsafe forced PR',()=>{
 const e=ex('bench'),s={w:120,targetRepMin:1,targetRepMax:1,targetRpeMin:10,targetRpeMax:10};
 const now={id:'high',date:'2026-11-01',programWeekIntensityMin:105,programWeekIntensityMax:110,ex:[{...e,set:[s]}]};
 const old={id:'old-high',date:'2026-10-20',ended:1,ex:[{...ex('bench'),set:[work(120,8,9)]}]};
 const r=A.recommend(now.ex[0],s,now,[old],reg);
 assert.ok(r.peakRebase);
 assert.ok(A.recommendationWeight(r)<r.strength.estimate,'no automatic 105–110% attempt from an unverified estimated 1RM');
 assert.deepEqual(A.bandPrescription([105,110]).pct,[105,110]);
});


test('old three-set W8 live workout rebases both pending 2-3 rep loads from average 1RM',()=>{
 const history=[{id:'old',date:'2026-10-01',ended:1,ex:[{...ex('bench'),set:[
  work(120,8,9),work(120,8,9),work(120,8,9),{w:120,ok:false}
 ]}]}];
 const sets=[
  {w:120,weightMode:'auto',weightSource:'auto',autoInitialApplied:true,targetRepMin:2,targetRepMax:3,targetRpeMin:9,targetRpeMax:9.5},
  {w:120,weightMode:'auto',weightSource:'auto',autoInitialApplied:true,targetRepMin:2,targetRepMax:3,targetRpeMin:9,targetRpeMax:9.5},
  {w:147.5,weightMode:'auto',weightSource:'auto',role:'test_attempt',attemptNumber:1,plannedReps:1,targetRepMin:1,targetRepMax:1,targetRpeMin:9.5,targetRpeMax:10}
 ];
 const e={...ex('bench',sets),kind:'base',programWeightMode:'adaptive',equipmentProfile:{weightStep:2.5}};
 const now={id:'live',w:8,date:'2026-11-01',testWeek:true,ex:[e]};
 const first=A.recommend(e,sets[0],now,history,reg);
 const second=A.recommend(e,sets[1],now,history,reg);
 assert.equal(first.peakRebase,true);
 assert.ok(first.strength.estimate>145);
 assert.ok(A.recommendationWeight(first)>120);
 assert.ok(A.recommendationWeight(second)>A.recommendationWeight(first));
 assert.equal(first.canApply,true);
});


test('already open three-set W8 fixes real rep fields and appends two 80% volume sets after successful single',()=>{
 const initial=[
  {w:125,r:2,role:'test_preparation',plannedReps:2,targetRepMin:2,targetRepMax:3,targetRpeMin:6,targetRpeMax:7},
  {w:135,r:1,role:'test_preparation',plannedReps:1,targetRepMin:1,targetRepMax:2,targetRpeMin:7,targetRpeMax:8},
  {w:147.5,r:1,role:'test_attempt',plannedReps:1,attemptNumber:1,targetRepMin:1,targetRepMax:1,targetRpeMin:9.5,targetRpeMax:10},
 ];
 const e={...ex('bench',initial),equipmentProfile:{weightStep:2.5}};
 const now={id:'live-w8',w:8,testWeek:true,date:'2026-11-01',ex:[e]};
 const earlier=past([work(120,8,9),work(120,8,9),work(120,8,9)]);
 assert.equal(A.prepareTestBlocks(now,reg),true);
 assert.equal(e.set.length,5);
 assert.deepEqual(e.set.slice(0,3).map(x=>x.r),['','','']);
 assert.deepEqual(e.set.slice(3).map(x=>[x.role,x.targetRepMin,x.targetRepMax,x.backoffPercent]),[['backoff',5,6,80],['backoff',5,6,80]]);
 assert.equal(A.prepareTestBlocks(now,reg),false,'migration remains idempotent');
 const pending=A.recommend(e,e.set[3],now,[earlier],reg);
 assert.equal(pending.backoffPending,true);assert.equal(pending.canApply,false);
 Object.assign(e.set[2],{ok:true,r:1,actualReps:1,actualRpe:9.5});
 assert.equal(A.prepareTestBlocks(now,reg),false);
 assert.equal(!!e.set[3].skipped,false);assert.equal(!!e.set[4].skipped,false);
 const first=A.recommend(e,e.set[3],now,[earlier],reg);
 const second=A.recommend(e,e.set[4],now,[earlier],reg);
 const load=A.recommendationWeight(first);
 assert.equal(first.backoffPending,false);assert.equal(first.canApply,true);
 assert.ok(load>=112.5&&load<=120,'80% of confirmed 147.5 kg must be near 117.5 kg');
 assert.equal(A.recommendationWeight(second),load,'both back-offs use actual completed single');
 assert.equal(e.set[4].r,'');
 e.set[3].r=6;e.set[3].actualReps=6;e.set[3].actualRpe=7.5;e.set[3].ok=true;e.set[3].w=load;
 const revised=A.recommend(e,e.set[4],now,[earlier],reg);
 assert.ok(A.recommendationWeight(revised)>0,'second back-off adapts to first completed volume set');
});

test('manual or completed repetitions of W8 are not erased by pending-set migration',()=>{
 const e={...ex('bench'),set:[
  {role:'test_preparation',targetRepMin:2,targetRepMax:3,r:3,actualReps:3,ok:true},
  {role:'test_preparation',targetRepMin:1,targetRepMax:2,r:1,actualReps:1},
  {role:'test_attempt',targetRepMin:1,targetRepMax:1,r:1,actualReps:1},
 ]};
 const now={id:'manual-test',w:8,testWeek:true,ex:[e]};
 A.prepareTestBlocks(now,reg);
 assert.deepEqual(e.set.slice(0,3).map(s=>s.r),[3,1,1]);
 assert.equal(e.set.length,5);
});


test('recovery weeks remain in training history but do not alter e1RM or next working load',()=>{
 const heavy={id:'heavy',date:'2026-10-05',ended:1,ex:[ex('bench',[
  work(120,8,8),work(120,8,8.5),work(120,8,9)])]};
 const easy={id:'recovery',date:'2026-10-12',w:4,c:'Middle',ended:1,
  weeklyLoadProfile:{phase:'deload',deload:false,pct:[60,65]},
  ex:[ex('bench',[work(80,12,6),work(80,12,6),work(80,12,6)])]};
 const extra={id:'recovery-2',date:'2026-10-20',w:6,c:'Middle',ended:1,
  weeklyLoadProfile:{phase:'recovery',pct:[65,70],deload:false},
  ex:[ex('bench',[work(85,12,7),work(85,12,7)])]};
 const s={w:7,id:'now',date:'2026-11-01',ex:[ex('bench',[target({w:120,programW:0,targetRepMin:3,targetRepMax:5,targetRpeMin:8.5,targetRpeMax:9.5})])]};
 const baseline=A.recommend(s.ex[0],s.ex[0].set[0],s,[heavy],reg);
 const after=A.recommend(s.ex[0],s.ex[0].set[0],s,[heavy,easy,extra],reg);
 assert.equal(after.strength.estimate,baseline.strength.estimate);
 assert.equal(after.previous,120,'last working load is not the deload 85 kg');
 assert.equal(after.weight,baseline.weight);
 assert.equal(A.recommendationWeight(after),A.recommendationWeight(baseline));
 assert.equal(after.recoveryEvidenceExcluded,2);
 assert.equal(after.recoveryEvidenceLastDate,'2026-10-20');
 assert.equal(A.history(s.ex[0],[heavy,easy,extra],reg).length,8,'deload sets still exist for history and volume');
});

test('builtin W4/W6 recoveries are recognized without profile, manual light sessions are not',()=>{
 assert.equal(A.isRecoveryForAutoweight({w:4,c:'A'}),true);
 assert.equal(A.isRecoveryForAutoweight({w:6,c:'A'}),true);
 assert.equal(A.isRecoveryForAutoweight({w:4,c:'A',programId:'custom'}),false);
 assert.equal(A.isRecoveryForAutoweight({w:4,weeklyLoadProfile:{phase:'work'}}),false);
 assert.equal(A.isRecoveryForAutoweight({programWeekIntensityMin:60,programWeekIntensityMax:65}),false);
 assert.equal(A.isRecoveryForAutoweight({weeklyLoadProfile:{phase:'recovery',deload:false}}),true);
 assert.equal(A.isRecoveryForAutoweight({phase:'deload',deload:false}),true);
 assert.equal(A.isRecoveryForAutoweight({phase:'volume',deload:false}),false);
});

test('fatigue detection ignores low-load recovery rows without hiding real hard sessions',()=>{
 const failure={session:{phase:'heavy'},actualRpe:10,targetRpe:8,actualReps:2,minReps:6};
 const recovery={session:{phase:'recovery'},actualRpe:10,targetRpe:7,actualReps:4,minReps:10,techniqueFailed:true};
 assert.equal(A.fatigueSignals([recovery]).suggestDeload,false);
 assert.equal(A.fatigueSignals([failure,recovery]).suggestDeload,true);
 assert.deepEqual(A.fatigueSignals([failure,recovery]).signals.sort(),['effort','reps']);
});

test('deload-only history does not masquerade as reliable strength evidence',()=>{
 const easy={id:'easy',date:'2026-10-12',ended:1,phase:'deload',ex:[ex('bench',[work(85,10,7)])]};
 const s={id:'now',date:'2026-10-20',ex:[ex('bench',[target({w:90,programW:90})])]};
 const r=A.recommend(s.ex[0],s.ex[0].set[0],s,[easy],reg);
 assert.equal(r.strength.estimate,null);
 assert.equal(r.previous,null);
 assert.equal(r.recoveryEvidenceExcluded,1);
 assert.equal(r.canApply,true);
});

test('common evidence tiers reject <65%, RPE <7 and mismatched effort while accepting heavy sets',()=>{
 const score=(r,rpe,deload=false)=>A.strengthEvidence(100,r,rpe,null,{deload});
 assert.equal(score(15,8).tier,'excluded');
 assert.equal(score(10,7).tier,'auxiliary');
 assert.equal(score(6,8).tier,'working');
 assert.equal(score(3,9).tier,'heavy');
 assert.equal(score(1,10).tier,'test');
 assert.ok(score(1,10).confidenceWeight>score(10,7).confidenceWeight);
 assert.equal(score(6,6).estimate,null);
 assert.equal(score(3,9,true).estimate,null);
 assert.equal(A.strengthEvidence(100,5,8,0).estimate,null);
 assert.equal(A.strengthEvidence(100,6,null,2).tier,'working');
 assert.equal(A.strengthEvidence(100,6,null,null).estimate,null);
});
test('low intensity or missing RPE cannot lower robust working e1RM',()=>{
 const heavy={id:'h',date:'2026-09-01',ended:1,ex:[ex('bench',[work(100,5,9)])]};
 const light={id:'l',date:'2026-09-10',ended:1,ex:[ex('bench',[work(45,20,8),work(60,10,6),{w:80,r:10,ok:true}])]};
 const s=current(target({w:100,programW:0,targetRepMin:5,targetRepMax:8,targetRpeMin:8,targetRpeMax:9}));
 const only=A.recommend(s.ex[0],s.ex[0].set[0],s,[heavy],reg);
 const mixed=A.recommend(s.ex[0],s.ex[0].set[0],s,[heavy,light],reg);
 assert.equal(mixed.strength.estimate,only.strength.estimate);
 assert.equal(mixed.strength.sessionCount,1);
});


test('rolling e1RM follows latest three workout days rather than the full historical mean',()=>{
 const dates=['2026-06-01','2026-06-08','2026-06-15','2026-09-20','2026-10-01','2026-10-21'];
 const estimates=[70,75,80,93.3,110,98.7];
 const observations=dates.map((date,i)=>({sessionId:'s'+i,date,estimate:estimates[i],confidenceWeight:1}));
 const result=A.currentStrengthEstimate(observations,{nowMs:Date.parse('2026-10-22')});
 assert.equal(result.sessionCount,3);
 assert.deepEqual(result.sourceSessions.map(x=>x.date),['2026-10-21','2026-10-01','2026-09-20']);
 assert.ok(Math.abs(result.estimate-96.4635)<.02);
 assert.ok(Math.abs(result.trainingMax-result.estimate*.9)<.01);
 assert.equal(result.historicalSessionCount,6);
 const moreOld=[...observations,...Array.from({length:30},(_,i)=>({sessionId:'ancient'+i,date:'2025-01-01',estimate:50,confidenceWeight:1}))];
 assert.ok(Math.abs(A.currentStrengthEstimate(moreOld,{nowMs:Date.parse('2026-10-22')}).estimate-result.estimate)<.001);
});
test('two sets in one session do not count as two workouts',()=>{
 const observations=[
  {sessionId:'same',date:'2026-10-01',estimate:105,confidenceWeight:1},
  {sessionId:'same',date:'2026-10-01',estimate:104,confidenceWeight:1},
  {sessionId:'next',date:'2026-10-10',estimate:110,confidenceWeight:1}
 ];
 const r=A.currentStrengthEstimate(observations,{nowMs:Date.parse('2026-10-12')});
 assert.equal(r.sessionCount,2);
 assert.equal(r.historicalSessionCount,2);
 assert.ok(r.estimate>105&&r.estimate<110);
});
test('return from long break lowers confidence, not the actual estimate',()=>{
 const records=[{date:'2026-05-01',estimate:130},{date:'2026-05-10',estimate:135},{date:'2026-05-20',estimate:132}];
 const now=A.currentStrengthEstimate(records,{nowMs:Date.parse('2026-05-22')});
 const stale=A.currentStrengthEstimate(records,{nowMs:Date.parse('2026-10-22')});
 assert.equal(now.estimate,stale.estimate);
 assert.equal(stale.confidence,'низкая');
 assert.equal(stale.trainingMaxFactor,.85);
});
test('W8 maximal attempts and both 80 percent backoffs remain intact',()=>{
 const cycle=A.generateCycle({weeks:8,daysPerWeek:3,startDate:'2026-09-01',testWeek:true,
   exercises:[{exerciseId:'bench',n:'Жим',kind:'base',dayIndices:[0],sets:[{w:100}],weightMode:'auto'}]});
 const w8=cycle.weeks.at(-1),sets=w8.days.flatMap(d=>d.ex).find(x=>x.exerciseId==='bench').sets;
 assert.equal(w8.testWeek,true);
 assert.deepEqual(sets.map(x=>x.role),['test_preparation','test_preparation','test_attempt','test_attempt','test_attempt','backoff','backoff']);
 assert.deepEqual(sets.filter(x=>x.role==='test_attempt').map(x=>x.targetRepMin),[1,1,1]);
 assert.deepEqual(sets.filter(x=>x.role==='backoff').map(x=>x.backoffPercent),[80,80]);
 assert.ok(w8.weeklyLoadProfile.pct[0]>=90);
});
test('actual workout recommendation uses rolling e1RM, not the historical full average',()=>{
 const sessions=[['a','2026-06-01',70],['b','2026-09-20',95],['c','2026-10-01',100],['d','2026-10-21',105]]
   .map(([id,date,w])=>({id,date,ended:1,ex:[ex('bench',[work(w,5,9)])]}));
 const cur=current(target({w:105,programW:0,targetRepMin:5,targetRepMax:7,targetRpeMin:8,targetRpeMax:9}), 'bench',{date:'2026-10-28'});
 const r=A.recommend(cur.ex[0],cur.ex[0].set[0],cur,sessions,reg);
 assert.equal(r.strength.currentSessionCount,3);
 assert.ok(r.currentOneRepMax>r.historicalOneRepMax,'old weak session no longer drags live estimate down');
 assert.ok(r.trainingMax<r.currentOneRepMax);
 assert.equal(r.percentageBasis,'e1RM');
});
