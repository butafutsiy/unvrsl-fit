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
  for(let i=0;i<3;i++){
    context.trainerProgramsPage();
    assert.equal((page.innerHTML.match(/data-builtin-load-profile="296"/g)||[]).length,1);
    assert.equal((page.innerHTML.match(/class="builtin-load-v296-cell"/g)||[]).length,8);
  }
});
