'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const A=require('../workout-domain'),P=require('../exercise-load-policies'),c={window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../exercise-catalog.js'),'utf8'),c);
const rows=c.window.UNVRSL_EXERCISES,reg=A.registry(rows),counts={};
assert.equal(rows.length,Object.keys(P.definitions).length,'Every live catalog ID needs one explicit policy record');
for(const e of rows){
 const record=P.definitions[e.id];assert.ok(record,e.id);counts[record.status]=(counts[record.status]||0)+1;
 assert.equal(record.name,e.n,`${e.id}: catalog identity drift`);
 if(record.response){assert.ok(P.validate(record),e.id);assert.equal(A.profile(e,reg).correctionPolicy.id,e.id);}
 else assert.ok(['nonweighted','special_handler','review_metadata'].includes(record.status),e.id);
}
console.log(JSON.stringify({catalog:rows.length,policies:Object.keys(P.definitions).length,statuses:counts,version:P.version}));
