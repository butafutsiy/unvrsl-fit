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
