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
 assert.doesNotMatch(read("trainer-self-plan.js").split("window.trainerSelfShare110=")[1].split("window.trainerSelfDelete110=")[0],/navigator\.share\(\{title:'UNVRSL FIT',text\}\)/);
});
