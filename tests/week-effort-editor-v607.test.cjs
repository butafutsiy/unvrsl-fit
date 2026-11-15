'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const domain=require('../workout-domain.js'),planApi=require('../upper-lower-supersets-plan.js');
const read=p=>fs.readFileSync(require.resolve('../'+p),'utf8');
function fixture(wi=1,effortOnly=true){
  const plan=planApi.build(null,'2026-11-16'),fields=new Map(),percent=[{hidden:false},{hidden:false}],isoFields=[{hidden:false},{hidden:false}];
  if(effortOnly){
    const w=plan.weeks[wi];w.useIntensity=false;delete w.intensityMin;delete w.intensityMax;
    for(const k of ['baseRepMin','baseRepMax','isolationRepMin','isolationRepMax'])delete w[k];
    w.rpeMin=wi?8:7;w.rpeMax=wi?9:8;
    w.weeklyLoadProfile.pct=[0,0];w.weeklyLoadProfile.base={pct:[0,0],sets:3,reps:[8,12],rpe:wi?[8,8]:[7,8],rir:wi?[2,2]:[2,3]};
    w.weeklyLoadProfile.isolation={pct:[0,0],sets:3,reps:[12,15],rpe:wi?[8,9]:[7,8],rir:wi?[1,2]:[2,3]};
  }
  const band={textContent:''},help={textContent:''};let saved=0;
  function input(id,value=''){const e={value,checked:false,addEventListener(){},closest(){return isoFields[id.endsWith('Min')?0:1]}};fields.set(id,e);return e;}
  input('pi261Min');input('pi261Max');input('pi261Use').checked=plan.weeks[wi].useIntensity;
  const saveButton={textContent:'Сохранить профиль недели',dataset:{},removeAttribute(){},getAttribute(){return ''},addEventListener(){}};
  const card={querySelector(q){if(q==='.pi261-band')return band;if(q==='.wr264-effort-help')return help;return null},
    querySelectorAll(q){if(q==='[data-week-percent-fields]')return percent;if(q==='button')return [saveButton];return []},appendChild(){}};
  const doc={head:{appendChild(){}},getElementById:id=>fields.get(id)||null,
    querySelector:q=>q==='#sheet .pi261-week'?card:null,querySelectorAll:()=>[],
    createElement(){return {dataset:{},querySelector(){return null},querySelectorAll(){return []},
      set innerHTML(html){this.html=html;for(const m of html.matchAll(/<input[^>]*id="([^"]+)"[^>]*value="([^"]*)"/g))input(m[1],m[2]);}}},addEventListener(){}};
  const ctx={document:doc,st:{programs:[plan]},programUi:{pid:plan.id,week:wi},WorkoutDomain:domain,
    requestAnimationFrame(){},setTimeout(){},CustomEvent:function(){},addEventListener(){},dispatchEvent(){},save(){saved++}};
  ctx.window=ctx;
  vm.runInNewContext(read('program-intensity-autoweight.js'),ctx);
  const source=read('program-week-rpe-rir.js').replace('  queue()\n})();','  W.weekEditorTest={injectEditor,saveProfile};\n})();');
  vm.runInNewContext(source,ctx);ctx.weekEditorTest.injectEditor();
  return {ctx,plan,fields,percent,isoFields,band,help,saves:()=>saved};
}
test('effort editor shows independent base and isolation targets on each authored week',()=>{
  for(const wi of [0,1]){
    const f=fixture(wi),v=id=>Number(f.fields.get(id).value);
    assert.equal(v('wr264RpeMin'),wi?8:7);assert.equal(v('wr264RpeMax'),8);
    assert.equal(v('wr264IsoRpeMin'),wi?8:7);assert.equal(v('wr264IsoRpeMax'),wi?9:8);
    assert.ok(f.percent.every(e=>e.hidden));assert.ok(f.isoFields.every(e=>e.hidden));assert.equal(f.band.textContent,'По усилию');
    f.fields.get('pi261Use').checked=true;f.ctx.programWeekIntensityModeV607();
    assert.ok(f.percent.every(e=>!e.hidden));assert.ok(f.isoFields.every(e=>!e.hidden));
  }
});
test('saving effort-only profile needs no percentages and retains different effort ranges and reps',()=>{
  const f=fixture(),w=f.plan.weeks[1],before=JSON.stringify(w.days);
  f.ctx.weekEditorTest.saveProfile(f.plan,1);
  assert.equal(f.saves(),1);assert.equal(w.useIntensity,false);
  assert.deepEqual(Array.from(w.weeklyLoadProfile.base.rpe),[8,8]);
  assert.deepEqual(Array.from(w.weeklyLoadProfile.isolation.rpe),[8,9]);
  assert.deepEqual(Array.from(w.weeklyLoadProfile.base.reps),[8,12]);
  assert.deepEqual(Array.from(w.weeklyLoadProfile.isolation.reps),[12,15]);
  assert.deepEqual(Array.from(w.weeklyLoadProfile.pct),[0,0]);assert.equal(w.intensityMin,undefined);
  assert.equal(w.rpeMin,8);assert.equal(w.rpeMax,9);assert.equal(JSON.stringify(w.days),before);
});
test('percentage-based profiles still validate and save an explicit percentage corridor',()=>{
  const f=fixture();f.fields.get('pi261Use').checked=true;
  f.fields.get('pi261Min').value='75';f.fields.get('pi261Max').value='80';
  f.fields.get('wr264IsoPctMin').value='60';f.fields.get('wr264IsoPctMax').value='65';
  f.ctx.weekEditorTest.saveProfile(f.plan,1);
  assert.equal(f.plan.weeks[1].useIntensity,true);assert.equal(f.plan.weeks[1].intensityMin,75);
  assert.deepEqual(Array.from(f.plan.weeks[1].weeklyLoadProfile.isolation.pct),[60,65]);
});

test('percentage plan editor shows both authored week corridors and independent RPE',()=>{
  for(const wi of [0,1]){
    const f=fixture(wi,false),v=id=>Number(f.fields.get(id).value);
    assert.deepEqual([v('pi261Min'),v('pi261Max')],wi?[75,80]:[70,75]);
    assert.deepEqual([v('wr264IsoPctMin'),v('wr264IsoPctMax')],wi?[65,70]:[70,75]);
    assert.deepEqual([v('wr264RpeMin'),v('wr264RpeMax')],[7,8]);
    assert.deepEqual([v('wr264IsoRpeMin'),v('wr264IsoRpeMax')],[8,9]);
    assert.ok(f.percent.every(e=>!e.hidden));assert.ok(f.isoFields.every(e=>!e.hidden));
  }
});
