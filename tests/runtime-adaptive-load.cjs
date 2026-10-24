'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
  const dom=make();await wait(2700);const w=dom.window;
  try {
    const result=await w.eval(`(async()=>{
      st.current=session(UNVRSL_ROUTINES.find(r=>r.w===1&&r.c==='B'));
      nav('start');await trainingEngine200Tick();
      const cur=st.current,e=cur.ex[0];
      cur.started=Date.parse('2026-10-01T04:00:00Z');cur.date='2026-10-01';
      e.programWeightMode='prescribed';e.set=e.set.slice(0,3);
      e.set.forEach(s=>Object.assign(s,{w:80,programW:80,plannedW:80,r:'',rpe:'',ok:false,targetRepMin:8,targetRepMax:10,targetRepLabel:'8–10',targetRpeMin:7,targetRpeMax:8}));
      const old=JSON.parse(JSON.stringify(e));
      old.set.forEach((s,i)=>Object.assign(s,{w:80,r:[10,9,8][i],rpe:8,ok:true}));
      st.sessions=[{id:'series-old',date:'2026-09-20',started:Date.parse('2026-09-20'),ended:Date.parse('2026-09-20')+1000,ex:[old]}];
      trainingLoadModel292.run();startPage();await trainingEngine200Tick();
      const card=document.querySelector('#start .te200-rec');
      const first={text:card?.textContent,weight:e.set[0].recommendedW,apply:!!card?.querySelector('.te200-rec-apply')};
      old.set.forEach(s=>{s.rpe='';s.rir='';});
      trainingLoadModel292.run();startPage();await trainingEngine200Tick();
      const second=document.querySelector('#start .te200-rec');
      return {first,second:{text:second?.textContent,apply:!!second?.querySelector('.te200-rec-apply'),weight:e.set[0].w}};
    })()`);
    assert.equal(result.first.weight,80);
    assert.match(result.first.text,/Прошлая серия: 10 \/ 9 \/ 8/);
    assert.match(result.first.text,/28 повторений суммарно/);
    assert.equal(result.first.apply,true);
    assert.match(result.second.text,/Укажи RPE или RIR/);
    assert.equal(result.second.apply,false);assert.equal(result.second.weight,80);
    assert.deepEqual(errors,[]);
    console.log('Adaptive recommendation UI: series, rep goal, missing effort and manual weight passed');
  }finally{dom.window.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
