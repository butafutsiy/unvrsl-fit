"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8"),A=require("../workout-domain.js"),reg=A.registry([]);
const p=(id,unit="TOTAL")=>({id,loadUnit:unit,weightStep:2.5,availableLoads:unit==="PER_HAND"?[10,12,15]:[]});
const ex=(profile,sets)=>({n:"Жим лёжа",method:"STANDARD",equipmentProfileId:profile.id,equipmentProfile:profile,set:sets});
const set=(w,r=10,rpe=7,more={})=>({w,r,rpe,ok:true,targetRepMin:8,targetRepMax:10,targetRpeMin:7,targetRpeMax:8,...more});
const old=(id,profile,sets)=>({id,started:Number(id)*10,ended:Number(id)*10+1,ex:[ex(profile,sets)]});
const now=(profile,sets)=>({id:"today",started:100,ended:null,ex:[ex(profile,sets)]});
test("different physical equipment has separate history and load steps",()=>{
 const a=p("rack-1"),b=p("rack-2"),past=[old("1",a,[set(60)]),old("2",a,[set(60)])];
 const same=now(a,[set(60,10,7,{ok:false})]),rec=A.recommend(same.ex[0],same.ex[0].set[0],same,past,reg);
 assert.equal(rec.weight,62.5);
 const other=now(b,[set(0,10,"",{ok:false})]);
 assert.deepEqual(A.recommend(other.ex[0],other.ex[0].set[0],other,past,reg).sessionIds,[]);
});
test("latest saved workout wins with mixed timestamp formats and a changed tempo",()=>{
 const bar=p('rdl-bar'),first=old('12',bar,[set(115,12,8)]),last=old('21',bar,[set(140,7,8)]);
 first.date='2026-09-12';first.started=Date.parse('2026-09-12T09:00:00Z');
 last.date='2026-09-21';last.started='2026-09-21T06:15:00Z';last.ended='2026-09-21T07:00:00Z';last.ex[0].tempo='3-1-2';
 const current=now(bar,[set(135,6,0,{ok:false,programW:135,targetRepMin:5,targetRepMax:7,targetRpeMin:8,targetRpeMax:9})]);
 current.ex[0].tempo='2-0-2';
 const rec=A.recommend(current.ex[0],current.ex[0].set[0],current,[last,first],reg);
 assert.equal(rec.previous,140);assert.equal(rec.basis.date,'2026-09-21');
 assert.equal(rec.sessionIds[0],'21');assert.match(rec.evidence[0],/140 кг × 7/);
});
test("the September 21 workout drives the next week's 5–7 reps despite stale metadata",()=>{
 const name='Румынская тяга со штангой',bar=p('legacy-bar');
 const first={...old('12',bar,[set(115,12,8)]),date:'2026-09-12',started:Date.parse('2026-09-12T09:00:00Z')};
 const last={...old('21',bar,[set(140,7,8),set(140,6,8),set(140,5,8),set(140,5,8)]),date:'2026-09-21',started:'2026-09-21T05:30:00Z',ended:'2026-09-21T06:15:00Z'};
 first.ex[0].n=name;last.ex[0].n=name;last.ex[0].implementWeight=20;
 delete first.ex[0].equipmentProfile;delete first.ex[0].equipmentProfileId;
 delete last.ex[0].equipmentProfile;delete last.ex[0].equipmentProfileId;
 const current=now(bar,[set(135,'', '',{ok:false,programW:135,targetRepMin:8,targetRepMax:8,targetRepLabel:'5–7',targetRpeMin:8,targetRpeMax:9})]);
 current.ex[0].n=name;delete current.ex[0].equipmentProfile;delete current.ex[0].equipmentProfileId;
 current.programWeekIntensityMin=85;current.programWeekIntensityMax=88;
 const rec=A.recommend(current.ex[0],current.ex[0].set[0],current,[first,last],reg);
 assert.equal(rec.basis.date,'2026-09-21');assert.equal(rec.basis.weight,140);
 assert.equal(rec.basis.estimatedOneRepMax,182);
 assert.equal(rec.sessionIds[0],'21');assert.deepEqual(rec.repRange,{lo:5,hi:7});
 assert.ok(rec.weight>=140&&rec.weight<=145);assert.equal(rec.planPreserved,false);
 assert.equal(rec.weeklyIntensity.applied,false);
});
test("four working sets and an under-target final set limit the next load",()=>{
 const bar=p('four-set'),last=old('21',bar,[set(140,8,8),set(140,7,8),set(140,5,9)]);
 const cur=now(bar,[set(140,'','',{ok:false,targetRepMin:6,targetRepMax:8,targetRpeMin:8,targetRpeMax:9})]);
 const rec=A.recommend(cur.ex[0],cur.ex[0].set[0],cur,[last],reg);
 assert.ok(rec.weight<140);assert.equal(rec.basis.weight,140);
});
test("body mass is required for effective-load 1RM and assistance has inverse progression",()=>{
 const current=now(p('grav','ASSISTANCE'),[set(25,'','',{ok:false,targetRepMin:6,targetRepMax:8,targetRpeMin:8,targetRpeMax:9})]);
 const past=old('21',p('grav','ASSISTANCE'),[set(30,8,8)]);
 current.bodyWeight=100;past.bodyWeight=100;
 const rec=A.recommend(current.ex[0],current.ex[0].set[0],current,[past],reg);
 assert.ok(rec.basis.estimatedOneRepMax>90);
 assert.ok(rec.weight<=30);
 delete past.bodyWeight;
 assert.equal(A.recommend(current.ex[0],current.ex[0].set[0],current,[past],reg).basis.estimatedOneRepMax,null);
});
test("bodyweight plus zero external load uses known body mass without inventing kilograms",()=>{
 const e={n:'Подтягивания',loadType:'bodyweight_added',set:[set(0,8,8)]};
 const past={id:'pull-1',started:100,ended:200,bodyWeight:90,ex:[e]};
 const cur={id:'pull-2',started:300,ended:null,bodyWeight:90,ex:[{...e,set:[set(0,'','',{ok:false,targetRepMin:6,targetRepMax:8,targetRpeMin:8,targetRpeMax:9})]}]};
 const rec=A.recommend(cur.ex[0],cur.ex[0].set[0],cur,[past],reg);
 assert.equal(rec.previous,0);assert.equal(rec.basis.estimatedOneRepMax,120);
 assert.ok(rec.weight>=0&&rec.weight<=5);
 delete past.bodyWeight;
 assert.equal(A.recommend(cur.ex[0],cur.ex[0].set[0],cur,[past],reg).basis.estimatedOneRepMax,null);
});
test("autoweight uses the completed set for the next set and refreshes after a new rep target",()=>{
 const bar=p('adaptive-bar'),past=[old('1',bar,[set(70,10,7)])];
 const completed=set(70,5,10),pending=set(70,'','',{ok:false,targetRepMin:8,targetRepMax:10,targetRpeMin:8,targetRpeMax:9});
 const cur=now(bar,[completed,pending]);cur.ex[0].programWeightMode='adaptive';
 const listeners={},ctx={WorkoutDomain:A,workoutRegistry:reg,st:{current:cur,sessions:past,exerciseWeightProfiles:{}},save(){},window:{addEventListener:(name,fn)=>{listeners[name]=fn}}};
 vm.runInNewContext(read('training-load-model.js'),ctx);
 ctx.window.trainingLoadModel292.run();
 assert.equal(completed.w,70);assert.equal(pending.w,67.5);
 assert.equal(pending.recommendedW,67.5);
 pending.targetRepLabel='6–8';listeners['unvrsl:prescription-updated']();
 assert.deepEqual(JSON.parse(JSON.stringify(pending.recommendation.repRange)),{lo:6,hi:8});
 pending.manualOverride=true;pending.w=80;listeners['unvrsl:workout-set-changed']();
 assert.equal(pending.w,80);
});
test("restoring a week-five draft recomputes its saved recommendation from September 21",async()=>{
 const earlier=old('12',p('rdl-bar'),[set(115,12,8)]);
 earlier.date='2026-09-12';earlier.started=Date.parse('2026-09-12T09:00:00Z');
 const latest=old('21',p('rdl-bar'),[set(140,7,8),set(140,6,8),set(140,5,8),set(140,5,8)]);
 latest.date='2026-09-21';latest.started=Date.parse('2026-09-21T05:30:00Z');
 for(const saved of [earlier,latest]){saved.ex[0].n='Румынская тяга со штангой';delete saved.ex[0].equipmentProfile;delete saved.ex[0].equipmentProfileId}
 const waiting=set(135,'','',{ok:false,programW:135,targetRepLabel:'4–6',targetRpeMin:8,targetRpeMax:9,
   recommendation:{basis:{date:'2026-09-12',weight:115}}});
 const current=now(p('rdl-bar'),[waiting]);current.ex[0].n='Румынская тяга';
 delete current.ex[0].equipmentProfile;delete current.ex[0].equipmentProfileId;
 current.programWeekIntensityMin=85;current.programWeekIntensityMax=88;
 const aliases=A.registry([{id:'rdl',n:'Румынская тяга со штангой',aliases:['Румынская тяга']}]);
 let saves=0,refreshes=0;
 const ctx={WorkoutDomain:A,workoutRegistry:aliases,st:{current,sessions:[earlier,latest],exerciseWeightProfiles:{}},
   save(){saves++},window:{addEventListener(){},trainingEngine200Tick(){refreshes++}}};
 vm.runInNewContext(read('training-load-model.js'),ctx);
 await Promise.resolve();
 assert.equal(waiting.recommendation.basis.date,'2026-09-21');
 assert.equal(waiting.recommendation.basis.estimatedOneRepMax,182);
 assert.deepEqual(JSON.parse(JSON.stringify(waiting.recommendation.repRange)),{lo:4,hi:6});
 assert.ok(waiting.recommendedW>135);assert.equal(waiting.w,135);assert.ok(saves>0);assert.ok(refreshes>0);
});
test("completed sets in legacy history count even if the old session lacks an ended timestamp",()=>{
 const bar=p('rdl-bar'),earlier=old('12',bar,[set(115,12,8)]),recent=old('21',bar,[set(140,7,8)]);
 earlier.date='2026-09-12';recent.date='2026-09-21';earlier.started=Date.parse('2026-09-12T05:30:00Z');recent.started=Date.parse('2026-09-21T05:30:00Z');
 delete recent.ended;
 const pending=now(bar,[set(135,'','',{ok:false,programW:135,targetRepLabel:'4–6',targetRpeMin:8,targetRpeMax:9})]);
 const rec=A.recommend(pending.ex[0],pending.ex[0].set[0],pending,[earlier,recent],reg);
 assert.equal(rec.basis.date,'2026-09-21');assert.equal(rec.basis.estimatedOneRepMax,182);
 recent.pendingCompletion=true;
 assert.equal(A.recommend(pending.ex[0],pending.ex[0].set[0],pending,[earlier,recent],reg).basis.date,'2026-09-12');
});
test("a saved legacy exercise ID does not hide its known Romanian deadlift alias",()=>{
 const aliases=A.registry([{id:'rdl',n:'Румынская тяга со штангой',aliases:['Румынская тяга']}]);
 const earlier=old('12',p('rdl-bar'),[set(115,12,8)]),latest=old('21',p('rdl-bar'),[set(140,7,8)]);
 earlier.date='2026-09-12';earlier.started=Date.parse('2026-09-12T05:30:00Z');
 latest.date='2026-09-21';latest.started=Date.parse('2026-09-21T05:30:00Z');
 latest.ex[0].n='Румынская тяга со штангой';latest.ex[0].exerciseId='old-import-id';
 const current=now(p('rdl-bar'),[set(135,'','',{ok:false,programW:135,targetRepLabel:'4–6',targetRpeMin:8,targetRpeMax:9})]);
 current.ex[0].n='Румынская тяга';current.ex[0].exerciseId='new-plan-id';
 assert.equal(A.recommend(current.ex[0],current.ex[0].set[0],current,[earlier,latest],aliases).basis.date,'2026-09-21');
});
test("separate Matrix and Foreman machines never transfer recent working weights",()=>{
 const matrix=p('matrix-leg'),foreman=p('foreman-leg');
 const earlier=old('12',matrix,[set(70,12,8)]),last=old('21',foreman,[set(90,10,8)]);
 const current=now(matrix,[set(70,10,0,{ok:false})]);
 const rec=A.recommend(current.ex[0],current.ex[0].set[0],current,[last,earlier],reg);
 assert.equal(rec.previous,70);
 assert.equal(rec.excludedHistory.id,'21');assert.equal(rec.excludedHistory.reason,'другое оборудование');
});
test("per-hand rack loads are recommended as a single dumbbell weight",()=>{
 const d=p("rack-db","PER_HAND"),past=[old("1",d,[set(12)]),old("2",d,[set(12)])],cur=now(d,[set(12,10,7,{ok:false})]);
 assert.equal(A.loadType(cur.ex[0],reg),"per_dumbbell");
 assert.equal(A.recommend(cur.ex[0],cur.ex[0].set[0],cur,past,reg).weight,15);
});
test("empty bar weight sets the minimum total load; per-side load includes the implement",()=>{
 const bar={...p("bar-20"),implementWeight:20},cur=now(bar,[set(0,8,7,{ok:false})]);
 assert.equal(A.profile(cur.ex[0],reg).min,20);
 assert.equal(A.roundWeight(12,A.profile(cur.ex[0],reg)),20);
 const machine={...p("machine-1","PER_SIDE"),implementWeight:35,loadedSides:2};
 const leg=ex(machine,[set(20)]);leg.loadedSides=2;leg.implementWeight=35;
 assert.equal(A.effectiveLoad(leg,leg.set[0],{date:"2026-09-23"},reg),75);
});
test("a difficult set suggests one lower step without replacing the exercise recommendation",()=>{
 const bar=p("bar"),past=[old("1",bar,[set(60)]),old("2",bar,[set(60)])],cur=now(bar,[set(60,5,10),set(60,10,"",{ok:false})]);
 const rec=A.recommend(cur.ex[0],cur.ex[0].set[1],cur,past,reg);
 assert.equal(rec.weight,62.5);assert.equal(rec.nextSetSuggestion.weight,57.5);
});
test("back-off sets cannot turn a 70 kg top set into a 45 kg recommendation",()=>{
 const bar=p("leg-curl"),past=[old("1",bar,[set(70,12,10),set(56,10,8),set(45,10,8)])];
 const cur=now(bar,[set(72.5,8,9,{ok:false,programW:72.5,targetRepMin:8,targetRepMax:10,targetRpeMin:8,targetRpeMax:9})]);
 const rec=A.recommend(cur.ex[0],cur.ex[0].set[0],cur,past,reg);
 assert.equal(rec.previous,70);assert.equal(rec.weight,70);
 assert.equal(rec.basis.weight,70);assert.equal(rec.basis.sets.length,3);
});
test("RPE 9 stays in an 8–9 target range and does not lower the next set",()=>{
 const bar=p("leg-curl"),past=[old("1",bar,[set(70,10,9)])];
 const first=set(72.5,8,9,{targetRepMin:8,targetRepMax:10,targetRpeMin:8,targetRpeMax:9});
 const waiting=set(72.5,10,0,{ok:false,targetRepMin:8,targetRepMax:10,targetRpeMin:8,targetRpeMax:9});
 const cur=now(bar,[first,waiting]),rec=A.recommend(cur.ex[0],waiting,cur,past,reg);
 assert.equal(rec.nextSetSuggestion.weight,72.5);
 assert.equal(rec.nextSetSuggestion.action,"hold");
});
test("a far-off historical load does not replace the current program",()=>{
 const bar=p("old-machine"),past=[old("1",bar,[set(35)]),old("2",bar,[set(35)])];
 const cur=now(bar,[set(72.5,8,8,{ok:false,programW:72.5})]);
 const rec=A.recommend(cur.ex[0],cur.ex[0].set[0],cur,past,reg);
 assert.equal(rec.weight,72.5);assert.equal(rec.confidence,"низкая");
 assert.equal(rec.planPreserved,true);
 assert.match(rec.reason,/План 72\.5 кг/);
});
test("a planned 135 kg progression is not silently replaced with old 115 kg",()=>{
 const bar=p("barbell"),cur=now(bar,[set(135,8,8,{ok:false,programW:135})]);
 const rec=A.recommend(cur.ex[0],cur.ex[0].set[0],cur,[old("1",bar,[set(115,8,8)])],reg);
 assert.equal(rec.weight,135);assert.equal(rec.planPreserved,true);
});
test("the same 115 kg × 12 RPE 8 supports about 135 kg for 5–7 reps",()=>{
 const bar=p("romanian-bar"),past=[old("1",bar,[set(115,12,8)])];
 const current=now(bar,[set(135,6,0,{ok:false,programW:135,targetRepMin:5,targetRepMax:7,targetRpeMin:8,targetRpeMax:9})]);
 const rec=A.recommend(current.ex[0],current.ex[0].set[0],current,past,reg);
 assert.equal(rec.weight,135);assert.equal(rec.planPreserved,false);
 assert.equal(rec.action,"range_adjust");assert.equal(rec.basis.estimatedOneRepMax,168.7);
 assert.match(rec.reason,/115 кг × 12/);
 const pastWithRir=[old("1",bar,[set(115,12,"",{rir:2})])];
 assert.equal(A.recommend(current.ex[0],current.ex[0].set[0],current,pastWithRir,reg).weight,135);
});
test("isolation and effort-free sets do not justify a large weight jump",()=>{
 const bar=p("leg-curl"),past=[old("1",bar,[set(70,12,8)])];
 const current=now(bar,[set(85,6,0,{ok:false,programW:85,targetRepMin:5,targetRepMax:7,targetRpeMin:8,targetRpeMax:9})]);
 current.ex[0].type="isolation";past[0].ex[0].type="isolation";
 assert.equal(A.recommend(current.ex[0],current.ex[0].set[0],current,past,reg).planPreserved,true);
 delete current.ex[0].type;delete past[0].ex[0].type;past[0].ex[0].set[0].rpe="";
 assert.equal(A.recommend(current.ex[0],current.ex[0].set[0],current,past,reg).planPreserved,true);
});
test("weekly percentage, rep range and RPE/RIR share one compound calculation",()=>{
 const bar=p("matrix-hack"),past=[old("1",bar,[set(100,10,8)]),old("2",bar,[set(100,10,"",{rir:2})])];
 const current=now(bar,[set(0,6,"",{ok:false,targetRepMin:5,targetRepMax:7,targetRpeMin:8,targetRpeMax:9})]);
 current.programWeekUseIntensity=true;current.programWeekIntensityMin=80;current.programWeekIntensityMax=85;
 const rec=A.recommend(current.ex[0],current.ex[0].set[0],current,past,reg);
 assert.equal(rec.weight,115);assert.equal(rec.basis.estimatedOneRepMax,140);
 assert.deepEqual(rec.weeklyIntensity,{min:80,max:85,estimatedMin:112,estimatedMax:119,applied:true});
 assert.equal(rec.exerciseKind,"base");assert.equal(A.effortRpe({rir:2}),8);
});
test("an explicit repetition range wins when weekly percentage conflicts with it",()=>{
 const bar=p("matrix-row"),past=[old("1",bar,[set(100,8,8)]),old("2",bar,[set(100,8,8)])];
 const current=now(bar,[set(0,8,"",{ok:false,targetRepMin:8,targetRepMax:10,targetRpeMin:7,targetRpeMax:8})]);
 current.programWeekUseIntensity=true;current.programWeekIntensityMin=88;current.programWeekIntensityMax=90;
 const rec=A.recommend(current.ex[0],current.ex[0].set[0],current,past,reg);
 assert.equal(rec.weight,100);assert.equal(rec.weeklyIntensity.applied,false);
});
test("isolation uses double progression and does not convert the weekly percent into weight",()=>{
 const machine=p("matrix-leg-extension"),past=[old("1",machine,[set(50,15,8)]),old("2",machine,[set(50,15,8)])];
 const current=now(machine,[set(50,15,"",{ok:false,targetRepMin:12,targetRepMax:15,targetRpeMin:7,targetRpeMax:8})]);
 current.ex[0].type="isolation";past.forEach(x=>x.ex[0].type="isolation");
 current.programWeekUseIntensity=true;current.programWeekIntensityMin=85;current.programWeekIntensityMax=88;
 const rec=A.recommend(current.ex[0],current.ex[0].set[0],current,past,reg);
 assert.equal(rec.weight,52.5);assert.equal(rec.action,"up");assert.equal(rec.exerciseKind,"isolation");
 assert.equal(rec.weeklyIntensity.estimatedMin,null);assert.equal(rec.weeklyIntensity.applied,false);
});
test("default increments depend on load type and exercise class until equipment overrides them",()=>{
 assert.equal(A.profile({n:"Разгибание ног",type:"isolation",eq:"leverage machine",tg:"quadriceps"},reg).step,2.5);
 assert.equal(A.profile({n:"Жим ногами",type:"compound",eq:"sled machine",tg:"quadriceps"},reg).step,5);
 assert.equal(A.profile({n:"Махи в блоке",type:"isolation",eq:"cable",tg:"delts"},reg).step,1);
 assert.equal(A.profile(ex({...p("foreman"),weightStep:7.5},[]),reg).step,7.5);
});
test("time-based exercise ignores a stray strength catalog load type",()=>{
 assert.equal(A.loadType({mode:"timer",loadType:"external_total"},reg),"time");
 assert.equal(A.loadType({kind:"timer",loadType:"external_total"},reg),"time");
 assert.match(read("training-load-model.js"),/\["time","distance"\]\.includes\(A\.loadType/);
 assert.match(read("training-engine.js"),/\['time','distance'\]\.includes\(WorkoutDomain\.loadType/);
});
test("equipment controls remain available for cardio and strength after a workout rerender",()=>{
 const listeners={},card=()=>{const c={control:null,querySelector:s=>s===".eq405-control"?c.control:s===":scope > .row"?{insertAdjacentElement:(_,b)=>{c.control=b}}:null,prepend:b=>{c.control=b}};return c};
 const root={cards:[card(),card()],querySelectorAll:s=>s===".exercise"?root.cards:[]};
 const ctx={console,WorkoutDomain:A,workoutRegistry:reg,document:{head:{append:()=>{}},createElement:tag=>({tagName:tag}),getElementById:id=>id==="start"?root:null}};
 ctx.window=ctx;ctx.st={current:{ex:[{n:"Аэробайк",mode:"cardio",set:[{min:5}]},{n:"Жим лёжа",set:[{w:60,r:8}]}]}};
 ctx.addEventListener=(name,fn)=>{listeners[name]=fn};ctx.modal=markup=>{ctx.markup=markup};
 vm.runInNewContext(read("equipment-profiles-v405.js"),ctx);
 assert.equal(root.cards[0].control?.textContent,"＋ Оборудование");
 assert.equal(root.cards[1].control?.textContent,"＋ Оборудование");
 root.cards=[card(),card()];listeners["unvrsl:workout-rendered"]();
 assert.equal(root.cards[0].control?.textContent,"＋ Оборудование");
 ctx.equipmentEdit405(encodeURIComponent("legacy:аэробайк@0"),"");
 assert.match(ctx.markup,/<option value="NONE" selected>/);
 assert.match(ctx.markup,/Matrix Leg Extension/);
});
test("muscle labels are translated and settings retain only backup controls",()=>{
 const ctx={window:{}};vm.runInNewContext(read("og-db.js").split("function ruExerciseName")[0]+";this.translate=ruTarget;",ctx);
 assert.equal(ctx.translate("quadriceps"),"Квадрицепс");
 assert.equal(ctx.translate("upper chest"),"Верх груди");
 assert.equal(ctx.translate("shoulders"),"Плечи");
 const settings=read("app.js").match(/function settingsSheet\(\)\{[^\n]+/)[0];
 assert.doesNotMatch(settings,/Импорт из openGym|Экспорт для ChatGPT|Сбросить всё/);
 assert.match(settings,/Экспорт резервной копии/);assert.match(settings,/Импорт резервной копии/);
});
test("light theme covers screenshot surfaces; Universal Fit PNG has one preview/export",()=>{
 const css=read("theme-light.css"),share=read("share-progress-template.js");
 for(const cls of ["strength-list","rp281-item","np311-card-grid","catalog394-estimate","rq227-score","te200-rec"])assert.ok(css.includes(cls),cls);
 assert.match(share,/Universal Fit/);assert.doesNotMatch(share,/Universal Feed/);
 assert.match(share,/WID=1080,MAX=1920/);assert.match(share,/img\.src=previewUrl/);
 assert.match(read("workout-completion.js"),/W\.openShareProgressV264\?\.\(currentSession\)/);
});
test("the screenshot's dark surfaces are explicitly themed and trainer history uses PNG",()=>{
 const css=read("theme-light.css");
 for(const cls of ["#stats .strength-item",".start-program-choice","#start .exercise","#home .dash-streak .fire","#home .streak>button"])assert.ok(css.includes(cls),cls);
 assert.match(read("trainer-self-plan.js"),/window\.openShareProgressV264\(\{\.\.\.s/);
 assert.match(read("client-journal-profile.js"),/window\.openShareProgressV264\?\.\(\{\.\.\.s,date:/);
 assert.match(read("training-engine.js"),/Почему этот вес\?/);
 assert.match(read("training-load-model.js"),/Math\.min\(1, Math\.max\(\.85, factor\)\)/);
 assert.doesNotMatch(read("trainer-self-plan.js").split("window.trainerSelfShare110=")[1].split("window.trainerSelfDelete110=")[0],/navigator\.share\(\{title:'UNVRSL FIT',text\}\)/);
});
test("two story PNGs use the same completed sets and the selected profile accent",async()=>{
 const canvases=[],drawn=[],fills=[];
 const context=()=>({fillText:s=>drawn.push(String(s)),fillRect(...args){fills.push(args)},drawImage(){},beginPath(){},roundRect(){},fill(){},stroke(){},moveTo(){},lineTo(){},save(){},restore(){},measureText:s=>({width:String(s).length*15}),createRadialGradient:()=>({addColorStop(){}})});
 const els={sp264Status:{textContent:""},sp264Preview:{hidden:true,previousElementSibling:{remove(){}}},sp264Save:{},sp264Share:{},sheet:{scrollTop:0}};
 const document={head:{appendChild(){}},getElementById:id=>els[id]||null,createElement:tag=>tag==='canvas'?((c)=>{canvases.push(c);return c})({width:0,height:0,getContext:context,toBlob:callback=>callback(new Blob(['png'],{type:'image/png'}))}):{id:'',textContent:'',remove(){}}};
 const session={id:'sep21',date:'2026-09-21',started:'2026-09-21T05:30:00Z',ended:'2026-09-21T06:15:00Z',c:'A2',name:'Бицепс бедра',ex:[{n:'Румынская тяга со штангой',set:[{w:140,r:7,rpe:8,ok:true}]},{n:'Сгибание ног лёжа в тренажёре',set:[{w:72.5,r:10,rpe:8,ok:true}]}]};
 const win={WorkoutDomain:A,st:{sessions:[session],accent:'#0a84ff'},modal(){},addEventListener(){}};
 const scope={window:win,document,workoutRegistry:reg,URL:{createObjectURL:()=>"blob:test",revokeObjectURL(){}},File:class{},Blob,console,requestAnimationFrame:callback=>callback(),setInterval:()=>0,setTimeout:()=>0,clearInterval(){},navigator:{}};
 vm.runInNewContext(read('share-progress-template.js'),scope);
 win.openShareProgressV264(session);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(canvases.at(-1).height,1920);
 assert.equal(fills.some(x=>x[2]===1080&&x[3]===1920),false);
 assert.match(drawn.join(' '),/Румынская тяга со штангой/);
 assert.match(drawn.join(' '),/Сгибание ног лёжа/);
 assert.match(drawn.join(' '),/RPE 8/);
 assert.match(drawn.join(' '),/RIR 2/);
 assert.match(els.sp264Status.textContent,/1080 × 1920/);
 assert.match(read('share-progress-template.js'),/accent=accentColor\(\)/);
 win.shareProgressModeV264('background');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(canvases.at(-1).height,1920);
 assert.ok(fills.some(x=>x[2]===1080&&x[3]===1920));
 assert.match(drawn.join(' '),/ЛУЧШИЙ ПОДХОД/);
});
