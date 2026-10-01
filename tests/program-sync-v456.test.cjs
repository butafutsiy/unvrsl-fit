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
