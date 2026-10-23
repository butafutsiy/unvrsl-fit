'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../account-sync.js'),'utf8');
function merge(local,remote,stamp=1000){
 const ctx={META_KEY:'meta',localStorage:{getItem:()=>JSON.stringify({localModifiedAt:100})},workoutStore:{journal:()=>({closed:{}})}};
 const f=vm.runInNewContext('(function(){'+source.slice(source.indexOf('  const clone='),source.indexOf('  async function waitCloud'))+';return mergeStates})()',ctx);
 return JSON.parse(JSON.stringify(f(local,remote,stamp)));
}
test('new editor timestamp preserves renamed program over newer account snapshot',()=>{
 const result=merge({programs:[{id:'p',name:'Новое имя',updated:300}]},{programs:[{id:'p',name:'Старое имя',updatedAt:200}]});
 assert.equal(result.programs[0].name,'Новое имя');
});
test('deletion from either device defeats stale program and survives repeated sync',()=>{
 const local={programs:[],deletedProgramKeys:['id:p']},remote={programs:[{id:'p',name:'Старая'}]};
 for(const [a,b] of [[local,remote],[remote,local]]){const out=merge(a,b);assert.equal(out.programs.length,0);assert.equal(merge(out,remote).programs.length,0);assert.deepEqual(out.deletedProgramKeys,['id:p'])}
});
test('seed deletions, hidden built-in and renamed built-in survive stale cloud',()=>{
 const out=merge({deletedProgramKeys:['seed:template'],builtinProgramHidden:true,builtinProgramName:'Новое',builtinProgramNameUpdatedAt:300,seededPrograms:{template:true}},{programs:[{id:'other',seedId:'template'}],builtinProgramHidden:false,builtinProgramName:'Старое',builtinProgramNameUpdatedAt:200});
 assert.equal(out.programs.length,0);assert.equal(out.builtinProgramHidden,true);assert.equal(out.builtinProgramName,'Новое');assert.equal(out.seededPrograms.template,true);
});
test('remote added program is retained alongside newer local programs',()=>{
 assert.deepEqual(merge({programs:[{id:'a',updated:500}]},{programs:[{id:'b',updated:400}]}).programs.map(p=>p.id).sort(),['a','b']);
});
test('legacy master plan with a new id cannot bypass deletion',()=>{
 const out=merge({deletedProgramKeys:['seed:master-trainer-plan']},{programs:[{id:'recreated',isMasterPlan:true}]});
 assert.equal(out.programs.length,0);
});
test('trash snapshots sync and a restored program defeats stale deletion on both devices',()=>{
 const p={id:'p',seedId:'seed',name:'Restored',updated:300,weeks:[{days:[]}]};
 const deleted={programs:[],deletedProgramKeys:['id:p','seed:seed'],programDeletedAt:{'id:p':100,'seed:seed':100},programTrash:[{id:'p',program:p,deletedAt:100}]};
 const restored={programs:[p],programRestoredAt:{'id:p':200,'seed:seed':200},programTrash:[]};
 for(const [a,b] of [[deleted,restored],[restored,deleted]]){
  const out=merge(a,b);assert.equal(out.programs[0].name,'Restored');assert.deepEqual(out.programTrash,[]);assert.deepEqual(out.deletedProgramKeys,[]);
  assert.equal(merge(out,deleted).programs.length,1);
 }
 const trash=merge(deleted,{programs:[p]});assert.equal(trash.programTrash[0].program.weeks.length,1);
 const reDeleted={...deleted,programDeletedAt:{'id:p':400,'seed:seed':400},programTrash:[{id:'p',program:p,deletedAt:400}]};
 assert.equal(merge(restored,reDeleted).programs.length,0);
});
test('legacy deleted programs can be recovered from a surviving device snapshot',()=>{
 const out=merge({deletedProgramKeys:['seed:seed']},{programs:[{id:'p',seedId:'seed',name:'Recoverable',weeks:[{days:[]}]}]});
 assert.equal(out.programs.length,0);assert.equal(out.programTrash[0].program.name,'Recoverable');
});
test('restoring built-in visibility survives stale hidden cloud state',()=>{
 const out=merge({builtinProgramHidden:false,builtinProgramVisibilityUpdatedAt:200},{builtinProgramHidden:true,builtinProgramVisibilityUpdatedAt:100});
 assert.equal(out.builtinProgramHidden,false);assert.equal(out.builtinProgramVisibilityUpdatedAt,200);
});
test('template visibility sync keeps independent choices and honors the newest restore',()=>{
 const local={templateVisibility:{'builtin:cycle':{hidden:false,at:300},'personal:semen-upper-lower-8':{hidden:true,at:100}}};
 const remote={templateVisibility:{'builtin:cycle':{hidden:true,at:200},'female:stern3':{hidden:true,at:250}}};
 for(const [a,b] of [[local,remote],[remote,local]]){
  const out=merge(a,b);assert.equal(out.templateVisibility['builtin:cycle'].hidden,false);assert.equal(out.templateVisibility['personal:semen-upper-lower-8'].hidden,true);assert.equal(out.templateVisibility['female:stern3'].hidden,true);
 }
});
test('a newer primary-program choice survives a later unrelated cloud snapshot',()=>{
 const out=merge({primaryProgramId:'chosen',primaryProgramSelectedAt:300,programs:[{id:'chosen'},{id:'other'}]},{primaryProgramId:'other',primaryProgramSelectedAt:100,programs:[{id:'chosen'},{id:'other'}]},10000);
 assert.equal(out.primaryProgramId,'chosen');assert.equal(out.primaryProgramSelectedAt,300);
});
