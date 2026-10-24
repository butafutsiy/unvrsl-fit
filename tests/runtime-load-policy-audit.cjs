'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
 const dom=make(null,{trackObservers:true});await wait(2600);const w=dom.window;
 try{
  const result=await w.eval(`(async()=>{
   const equipment={id:'foreman',name:'Foreman',type:'machine',loadUnit:'TOTAL',weightStep:4.5,availableLoads:[81.5,86,90.5,95.1]};
   const e={id:'pec',n:'Сведение рук в тренажёре',exerciseId:'canon:pec_deck',method:'STANDARD',kind:'isolation',loadType:'machine_stack',weightMode:'manual',equipmentProfileId:'foreman',equipmentProfile:equipment,reps:{mode:'manual',min:10,max:12},rpeMin:8,rpeMax:9,rest:75,sets:[{w:95.1,r:10},{w:'',r:10},{w:95.1,r:10}]};
   const p=ensureProgramShape({id:'audit',name:'Audit',weeks:[{n:1,intensityMin:70,intensityMax:75,days:[{id:'day',name:'Chest',ex:[e]}]}]});st.programs.push(p);
   st.sessions=[{id:'prior',date:'2026-10-20',ended:1,ex:[{...e,set:[{w:81.5,r:12,rpe:8,ok:true},{w:81.5,r:11,rpe:8,ok:true},{w:81.5,r:10,rpe:9,ok:true}]}]}];
   programBeginDayCoreV382('audit',0,0);await trainingEngine200Tick();trainingLoadModel292.run();startPage();await trainingEngine200Tick();
   const sets=st.current.ex[0].set,read=()=>sets.map(s=>({w:s.w,assigned:s.assignedW,mode:s.weightMode,actual:s.actualWeight}));
   const before=read(),card=document.querySelector('.te200-rec'),text=card.textContent,initialAuto=sets[1].w;
   if(!card.querySelector('.te200-rec-apply'))throw Error(JSON.stringify({text,rec:sets[0].recommendation,e:st.current.ex[0]}));sets[0].recommendedW=999;card.querySelector('.te200-rec-apply').click();const applied=read();
   editSet(0,0,'w','86,0');editSet(0,0,'r','12');editSet(0,0,'rir','4');toggleSet(0,0,{timer:false});trainingLoadModel292.run();
   const done=read(),nextRec=sets[1].recommendation,nextWeight=sets[1].recommendedW;
   startPage();await trainingEngine200Tick();const live=document.querySelector('.te200-rec');
   const nextBefore=sets[1].w;live.querySelector('.te200-rec-apply')?.click();const nextAfter=sets[1].w;
   const bodyAfter=sets[0].actualWeight;await trainingEngine200Tick();
   const cardAfter=document.querySelector('.te200-rec'),menus=cardAfter.querySelectorAll('select,.te-rec-range').length,buttons=[...cardAfter.querySelectorAll('.te200-rec-actions button')].map(b=>b.textContent);
   const retained={second:sets[1].w,third:sets[2].w};const doubleTapProtected=sets[0].ok;
   return{before,text,initialAuto,applied,done,nextWeight,nextBefore,nextAfter,bodyAfter,retained,menus,buttons,doubleTapProtected,nextReason:nextRec.reason,nextEvidence:nextRec.evidence,reachable:equipment.availableLoads.includes(nextWeight),finalAssigned:sets.map(s=>s.assignedW),duplicates:document.querySelectorAll('.te200-rec').length,extraHints:document.querySelectorAll('.te405-next').length};
  })()`);
  assert.equal(result.before[0].w,95.1);assert.equal(result.before[0].assigned,95.1);assert.equal(result.before[1].mode,'auto');assert.ok([81.5,86,90.5,95.1].includes(result.initialAuto));
  assert.match(result.text,/Назначено тренером: 95,1 кг/);assert.match(result.text,/Почему этот вес/);assert.doesNotMatch(result.text,/План сохранён, нужна проверка/);
  assert.equal(result.applied[1].w,result.before[1].w);assert.equal(result.applied[2].w,95.1);assert.notEqual(result.applied[0].w,999);assert.equal(result.applied[0].assigned,95.1);
  assert.equal(result.done[0].actual,86);assert.equal(result.done[0].w,86);assert.equal(result.bodyAfter,86);assert.equal(result.nextBefore,result.initialAuto);assert.equal(result.nextAfter,result.nextWeight);assert.equal(result.reachable,true);
  assert.deepEqual(Array.from(result.finalAssigned),[95.1,null,95.1]);assert.equal(result.duplicates,1);assert.equal(result.extraHints,0);assert.ok(result.nextEvidence.some(x=>x.includes('Сегодня')));assert.deepEqual(errors,[]);
  assert.equal(result.retained.second,result.nextAfter);assert.equal(result.retained.third,95.1);assert.equal(result.menus,0);assert.deepEqual(Array.from(result.buttons),['Применить','Отменить']);assert.equal(result.doubleTapProtected,true);
  console.log('Four load-policy scenarios, mixed sets, Foreman rack, actual/manual weights, fresh apply, immutable trainer plan and one unchanged recommendation banner passed');
 }finally{w.__disconnectTestObservers();w.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
