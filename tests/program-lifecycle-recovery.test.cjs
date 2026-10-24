'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {mergeProgramLifecycle}=require('../workout-store.js');
test('newer IndexedDB snapshot cannot resurrect a locally deleted seeded program',()=>{
 const original={id:'p',seedId:'seed',name:'Plan',updated:20,weeks:[{days:[]}]};
 const local={accountOwnerId:'owner',programs:[],deletedProgramKeys:['id:p','seed:seed'],programDeletedAt:{'id:p':50,'seed:seed':50}};
 const mirror={accountOwnerId:'owner',programs:[original],storageRevision:999,sessions:[{id:'history'}],bw:[{w:90}]};
 const out=mergeProgramLifecycle(mirror,local);assert.equal(out.programs.length,0);assert.equal(out.programTrash[0].program.name,'Plan');assert.equal(out.sessions[0].id,'history');assert.equal(out.bw[0].w,90);
});
test('explicit restore beats old backup deletion; unrelated copies remain independent',()=>{
 const local={accountOwnerId:'owner',programs:[{id:'p',seedId:'seed',updated:100},{id:'copy',seedId:'seed',independentCopy:true}],programRestoredAt:{'id:p':100,'seed:seed':100},primaryProgramId:'copy',primaryProgramSelectedAt:100};
 const mirror={accountOwnerId:'owner',programs:[],deletedProgramKeys:['id:p','seed:seed'],programDeletedAt:{'id:p':50,'seed:seed':50},primaryProgramId:'old',primaryProgramSelectedAt:50};
 const out=mergeProgramLifecycle(mirror,local);assert.equal(out.programs.length,2);assert.equal(out.primaryProgramId,'copy');assert.deepEqual(out.deletedProgramKeys,[]);
 const deleted=mergeProgramLifecycle({programs:[{id:'copy',seedId:'seed',independentCopy:true}]},{deletedProgramKeys:['seed:seed']});assert.equal(deleted.programs.length,1);
});
test('backup recovery never combines lifecycle state across different owners',()=>{
 const out=mergeProgramLifecycle({accountOwnerId:'a',programs:[{id:'a'}]},{accountOwnerId:'b',deletedProgramKeys:['id:a']});assert.equal(out.programs.length,1);assert.equal(out.deletedProgramKeys,undefined);
});
test('IndexedDB cannot refill permanently cleared trash or deleted templates',()=>{
 const p={id:'p',seedId:'seed'},local={deletedProgramKeys:['id:p'],programDeletedAt:{'id:p':10},programPurgedAt:{'id:p':20},templateDeletedAt:{'saved:t':20},builtinProgramPurgedAt:20};
 const stale={programs:[p],programTrash:[{id:'p',program:p,deletedAt:10}],programTemplates:[{id:'t'}],sessions:[{id:'history'}]};
 const out=mergeProgramLifecycle(stale,local);assert.equal(out.programs.length,0);assert.equal(out.programTrash.length,0);assert.equal(out.programTemplates.length,0);assert.equal(out.sessions[0].id,'history');assert.equal(out.builtinProgramPurgedAt,20);
});
