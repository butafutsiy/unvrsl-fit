'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

test('the built-in program keeps its week profile after every card render',()=>{
  const root=path.resolve(__dirname,'..');
  const page={innerHTML:'',classList:{contains:()=>true}};
  const context={
    console,
    st:{programs:[],primaryProgramId:'__builtin_cycle__'},
    document:{readyState:'loading',addEventListener(){},querySelector:selector=>selector==='#programs'?page:null},
    localStorage:{getItem:()=>null,setItem(){}},
    addEventListener(){},setTimeout(){},
    save(){},esc:value=>String(value)
  };
  context.window=context;
  vm.createContext(context);
  for(const file of ['builtin-cycle-load-profile.js','program-delete.js']){
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  }
  const canonical=context.trainerProgramsPage;
  vm.runInContext(fs.readFileSync(path.join(root,'trainer-nav-patch.js'),'utf8'),context,{filename:'trainer-nav-patch.js'});
  assert.equal(context.trainerProgramsPage,canonical,'the late trainer navigation module keeps the canonical program renderer');
  for(let i=0;i<3;i++){
    context.trainerProgramsPage();
    assert.equal((page.innerHTML.match(/data-builtin-load-profile="296"/g)||[]).length,1);
    assert.equal((page.innerHTML.match(/class="builtin-load-v296-cell"/g)||[]).length,8);
  }
  context.st.programs=[
    {id:'planned',name:'Цикл с интенсивностью',weeks:[
      {intensityMin:0.7,intensityMax:0.75,rpeMin:6,rpeMax:8,days:[]},
      {intensityMin:80,intensityMax:85,days:[]},
      {days:[]}
    ]},
    {id:'plain',name:'Без интенсивности',weeks:[{days:[]}]}
  ];
  for(const primary of ['__builtin_cycle__','planned']){
    context.st.primaryProgramId=primary;
    context.trainerProgramsPage();
    assert.equal((page.innerHTML.match(/data-program-load-profile="1"/g)||[]).length,1);
    const custom=page.innerHTML.split('data-program-load-profile="1"')[1].split('class="coach-actions"')[0];
    assert.match(custom,/W1<\/b><span class="pct">70–75%<\/span><span>RPE 6–8<\/span>/);
    assert.match(custom,/W2<\/b><span class="pct">80–85%<\/span>/);
    assert.doesNotMatch(custom,/W3<\/b><span class="pct">/);
  }
});
