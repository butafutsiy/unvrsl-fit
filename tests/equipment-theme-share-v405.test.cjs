"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8"),A=require("../workout-domain.js"),reg=A.registry([]);
const p=(id,unit="TOTAL")=>({id,loadUnit:unit,weightStep:2.5,min:0,max:500,availableLoads:unit==="PER_HAND"?[10,12,15]:[]});
const ex=(profile,sets)=>({n:"Жим лёжа",method:"STANDARD",equipmentProfileId:profile.id,equipmentProfile:profile,set:sets});
const set=(w,r=10,rpe=7,more={})=>({w,r,rpe,ok:true,targetRepMin:8,targetRepMax:10,targetRpeMin:7,targetRpeMax:8,...more});
const old=(id,profile,sets)=>({id,started:Number(id)*10,ended:Number(id)*10+1,ex:[ex(profile,sets)]});
const now=(profile,sets)=>({id:"today",started:100,ended:null,ex:[ex(profile,sets)]});
test("different physical equipment has separate history and load steps",()=>{
 const a=p("rack-1"),b=p("rack-2"),past=[old("1",a,[set(60,10,6)]),old("2",a,[set(60,10,6)])];
 const same=now(a,[set(60,10,7,{ok:false})]),rec=A.recommend(same.ex[0],same.ex[0].set[0],same,past,reg);
 assert.equal(rec.weight,62.5);
 const other=now(b,[set(0,10,"",{ok:false})]);
 assert.deepEqual(A.recommend(other.ex[0],other.ex[0].set[0],other,past,reg).sessionIds,[]);
});








test("different explicit exercise IDs require migration before sharing history",()=>{
 const aliases=A.registry([{id:'rdl',n:'Румынская тяга со штангой',aliases:['Румынская тяга']}]);
 const earlier=old('12',p('rdl-bar'),[set(115,12,8)]),latest=old('21',p('rdl-bar'),[set(140,7,8)]);
 earlier.date='2026-09-12';earlier.started=Date.parse('2026-09-12T05:30:00Z');
 latest.date='2026-09-21';latest.started=Date.parse('2026-09-21T05:30:00Z');
 latest.ex[0].n='Румынская тяга со штангой';latest.ex[0].exerciseId='old-import-id';
 const current=now(p('rdl-bar'),[set(135,'','',{ok:false,programW:135,targetRepLabel:'4–6',targetRpeMin:8,targetRpeMax:9})]);
 current.ex[0].n='Румынская тяга';current.ex[0].exerciseId='new-plan-id';
 assert.equal(A.recommend(current.ex[0],current.ex[0].set[0],current,[earlier,latest],aliases).basis,null);
});


test("empty bar weight sets the minimum total load; per-side load includes the implement",()=>{
 const bar={...p("bar-20"),implementWeight:20},cur=now(bar,[set(0,8,7,{ok:false})]);
 assert.equal(A.profile(cur.ex[0],reg).min,20);
 assert.equal(A.roundWeight(12,A.profile(cur.ex[0],reg)),20);
 const machine={...p("machine-1","PER_SIDE"),implementWeight:35,loadedSides:2};
 const leg=ex(machine,[set(20)]);leg.loadedSides=2;leg.implementWeight=35;
 assert.equal(A.effectiveLoad(leg,leg.set[0],{date:"2026-09-23"},reg),75);
});


test("RPE 9 stays in an 8–9 target range and does not lower the next set",()=>{
 const bar=p("leg-curl"),past=[old("1",bar,[set(70,10,9)])];
 const first=set(72.5,8,9,{targetRepMin:8,targetRepMax:10,targetRpeMin:8,targetRpeMax:9});
 const waiting=set(72.5,10,0,{ok:false,targetRepMin:8,targetRepMax:10,targetRpeMin:8,targetRpeMax:9});
 const cur=now(bar,[first,waiting]),rec=A.recommend(cur.ex[0],waiting,cur,past,reg);
 assert.equal(rec.nextSetSuggestion.weight,72.5);
 assert.equal(rec.nextSetSuggestion.action,"hold");
});



test("isolation and effort-free sets do not justify a large weight jump",()=>{
 const bar=p("leg-curl"),past=[old("1",bar,[set(70,12,8)])];
 const current=now(bar,[set(85,6,0,{ok:false,programW:85,targetRepMin:5,targetRepMax:7,targetRpeMin:8,targetRpeMax:9})]);
 current.ex[0].type="isolation";past[0].ex[0].type="isolation";
 assert.ok(A.recommend(current.ex[0],current.ex[0].set[0],current,past,reg).weight<=85);
 delete current.ex[0].type;delete past[0].ex[0].type;past[0].ex[0].set[0].rpe="";
 assert.ok(A.recommend(current.ex[0],current.ex[0].set[0],current,past,reg).weight<=85);
});



test("default increments depend on load type and exercise class until equipment overrides them",()=>{
 assert.equal(A.profile({n:"Разгибание ног",type:"isolation",eq:"leverage machine",tg:"quadriceps"},reg).step,5);
 assert.equal(A.profile({n:"Жим ногами",type:"compound",eq:"sled machine",tg:"quadriceps"},reg).step,5);
 assert.equal(A.profile({n:"Махи в блоке",type:"isolation",eq:"cable",tg:"delts"},reg).step,5);
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
 assert.doesNotMatch(ctx.markup,/Leg Extension/);
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
test("light theme covers screenshot surfaces; UNVRSL FIT PNG has one preview/export",()=>{
 const css=read("theme-light.css"),share=read("share-progress-template.js");
 for(const cls of ["strength-list","rp281-item","np311-card-grid","catalog394-estimate","rq227-score","te200-rec"])assert.ok(css.includes(cls),cls);
 assert.match(share,/UNVRSL FIT/);assert.doesNotMatch(share,/Universal Feed/);
 assert.match(share,/canvas.width=1080/);assert.match(share,/img\.src=previewUrl/);
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
 const context=()=>({fillText:s=>drawn.push(String(s)),fillRect(...args){fills.push(args)},drawImage(){},beginPath(){},roundRect(){},fill(){},stroke(){},moveTo(){},lineTo(){},save(){},restore(){},translate(){},measureText:s=>({width:String(s).length*15}),createRadialGradient:()=>({addColorStop(){}})});
 const els={sp264Status:{textContent:""},sp264Preview:{hidden:true,previousElementSibling:{remove(){}}},sp264Save:{},sp264Share:{},sheet:{scrollTop:0}};
 const document={head:{appendChild(){}},getElementById:id=>els[id]||null,createElement:tag=>tag==='canvas'?((c)=>{canvases.push(c);return c})({width:0,height:0,getContext:context,toBlob:callback=>callback(new Blob(['png'],{type:'image/png'}))}):{id:'',textContent:'',remove(){}}};
 const session={id:'sep21',date:'2026-09-21',started:'2026-09-21T05:30:00Z',ended:'2026-09-21T06:15:00Z',c:'A2',name:'Бицепс бедра',ex:[{n:'Румынская тяга со штангой',set:[{w:140,r:7,rpe:8,ok:true}]},{n:'Сгибание ног лёжа в тренажёре',set:[{w:72.5,r:10,rpe:8,ok:true}]}]};
 const win={WorkoutDomain:A,st:{sessions:[session],accent:'#0a84ff'},modal(){},addEventListener(){}};
 const scope={window:win,document,workoutRegistry:reg,URL:{createObjectURL:()=>"blob:test",revokeObjectURL(){}},File:class{},Blob,console,requestAnimationFrame:callback=>callback(),setInterval:()=>0,setTimeout:()=>0,clearInterval(){},navigator:{}};
 vm.runInNewContext(read('share-progress-template.js'),scope);
 win.openShareProgressV264(session);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(canvases.at(-1).height,1560);
 assert.equal(fills.some(x=>x[2]===1080&&x[3]===1920),false);
 assert.match(drawn.join(' '),/Румынская тяга со штангой/);
 assert.match(drawn.join(' '),/Сгибание ног лёжа/);
 assert.match(drawn.join(' '),/RPE 8/);
 assert.match(drawn.join(' '),/RIR 2/);
 assert.match(els.sp264Status.textContent,/1080 × 1560/);
 assert.match(read('share-progress-template.js'),/graphic\?'#f5f5f7':accentColor\(\)/);
 win.shareProgressModeV264('background');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(canvases.at(-1).height,1920);
 assert.ok(fills.some(x=>x[2]===1080&&x[3]===1920));
 assert.match(drawn.join(' '),/ЛУЧШИЙ ПОДХОД/);
});
test("saving and sharing a story send only the PNG to the iPhone share sheet",async()=>{
 const sent=[],copied=[];
 const els={sp264Status:{textContent:""},sp264Preview:{hidden:true,previousElementSibling:{remove(){}}},sp264Save:{},sp264Share:{},sheet:{scrollTop:0}};
 const context={fillText(){},fillRect(){},beginPath(){},roundRect(){},fill(){},stroke(){},save(){},restore(){},translate(){},measureText:s=>({width:String(s).length*15}),createRadialGradient:()=>({addColorStop(){}})};
 const document={head:{appendChild(){}},getElementById:id=>els[id]||null,createElement:tag=>tag==='canvas'?{width:0,height:0,getContext:()=>context,toBlob:callback=>callback(new Blob(['png'],{type:'image/png'}))}:{remove(){}}};
 const session={id:'share-test',date:'2026-09-21',name:'Программа',ex:[{n:'Румынская тяга',set:[{w:140,r:7,rpe:8,ok:true}]}]};
 const win={WorkoutDomain:A,st:{sessions:[session],accent:'#0a84ff'},modal(){},addEventListener(){}};
 const navigator={userAgent:'iPhone',canShare:payload=>Object.keys(payload).join(',')==='files',share:payload=>{sent.push(payload);return Promise.resolve()},clipboard:{writeText:text=>{copied.push(text);return Promise.resolve()}}};
 const scope={window:win,document,workoutRegistry:reg,URL:{createObjectURL:()=>"blob:test",revokeObjectURL(){}},File:class{constructor(parts,name,options){this.parts=parts;this.name=name;this.type=options.type}},Blob,console,requestAnimationFrame:callback=>callback(),setInterval:()=>0,setTimeout:()=>0,clearInterval(){},navigator};
 vm.runInNewContext(read('share-progress-template.js'),scope);
 win.openShareProgressV264(session);
 await new Promise(resolve=>setImmediate(resolve));
 win.shareProgressSaveV264();
 win.shareProgressNativeV264();
 win.shareProgressModeV264('background');
 await new Promise(resolve=>setImmediate(resolve));
 win.shareProgressSaveV264();
 win.shareProgressNativeV264();
 assert.equal(sent.length,4);
 for(const payload of sent){assert.deepEqual(Object.keys(payload),['files']);assert.equal(payload.files.length,1);assert.equal(payload.files[0].type,'image/png')}
 assert.equal(copied.length,0);
});
