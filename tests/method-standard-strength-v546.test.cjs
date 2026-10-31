'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../workout-domain.js');
const registry=A.registry([{id:'bench',n:'Жим штанги лёжа',aliases:['Жим лёжа'],type:'compound',loadType:'external_total'},{id:'curl',n:'Сгибание рук',type:'isolation',loadType:'machine_stack'}]);
const old=(id,ex)=>({id,date:'2026-10-10',started:Date.UTC(2026,9,10),ended:Date.UTC(2026,9,10)+3600000,ex:[ex]});
const done=(w,r=6,rpe=8,extra={})=>({w,r,rpe,ok:true,...extra});
const planned=(w,r=8,extra={})=>({w,programW:w,weightMode:'auto',r,plannedReps:r,targetRpeMin:8,targetRpeMax:9,ok:false,...extra});
const regular=(extra={})=>({exerciseId:'bench',n:'Жим лёжа',method:'STANDARD',loadType:'external_total',set:[done(110),done(110,6,8)],...extra});
const today=e=>({id:'now',date:'2026-10-20',started:Date.UTC(2026,9,20),ex:[e],programWeekIntensityMin:70,programWeekIntensityMax:75,programWeekRpeMin:8,programWeekRpeMax:9});
const methodEx=(method,extra={})=>{
 const sets=method==='UNVRSL'
    ?[planned(95,3,{role:'heavy'}),planned(72.5,9,{role:'light'}),planned(95,3,{role:'heavy'})]
    :method==='SLDR'
      ?Array.from({length:9},(_,i)=>planned(85,[12,10,8][i%3],{role:'sldr-mini'}))
      :method==='DS'
        ?[planned(100,8,{label:'DS1'}),planned(80,8,{label:'DS2'}),planned(64,8,{label:'DS3'})]
        :Array.from({length:7},()=>planned(75,12));
 return {n:'Жим лёжа — '+method,method,exerciseId:'bench',loadType:'external_total',set:sets,...extra};
};

test('UNVRSL, SLDR, DS and FST-7 share the ordinary exercise e1RM, not a method-only e1RM',()=>{
 const standard=old('ordinary',regular());
 const expected=A.strengthEstimate(regular(),A.history(regular(),[standard],registry),registry).estimate;
 assert.ok(expected>0);
 for(const method of ['UNVRSL','SLDR','DS','FST-7']){
   const ex=methodEx(method),current=today(ex),rec=A.recommend(ex,ex.set[0],current,[standard],registry);
   assert.equal(rec.strengthBasis,'standard',method);
   assert.equal(rec.strength.estimate,expected,method);
   assert.ok(rec.sessionIds.includes('ordinary'),method);
   assert.equal(rec.reliable,true,method);
   assert.equal(rec.canApply,true,method);
   assert.ok(rec.weight>0,method);
   assert.match(rec.reason,/обычным подходам/,method);
 }
});
test('a method name suffix and a normal exercise alias have the same identity',()=>{
 const history=old('ordinary',{n:'Жим штанги лёжа',method:'STANDARD',set:[done(100,8)]});
 const ex=methodEx('DS',{exerciseId:null,n:'Жим лёжа — DS DS1'});
 const r=A.recommend(ex,ex.set[0],today(ex),[history],registry);
 assert.equal(r.strengthBasis,'standard');assert.ok(r.strength.estimate>0);
});
test('first-stage strength comes from normal training even if fatigued drop sets were heavier',()=>{
 const base=old('normal',regular());
 const outlier=old('drop',{...methodEx('DS'),set:[done(220,3,9),done(90,9,10),done(60,10,10)]});
 const ex=methodEx('DS');
 const baseRec=A.recommend(ex,ex.set[0],today(ex),[base],registry);
 const combined=A.recommend(ex,ex.set[0],today(ex),[base,outlier],registry);
 assert.equal(combined.strengthBasis,'standard');
 assert.equal(combined.strength.estimate,baseRec.strength.estimate);
});
test('different machine, technique and exercise never lend a normal baseline to a special method',()=>{
 const matching=old('normal',regular());
 for(const [source,target] of [
   [regular({equipmentProfileId:'bench-A'}),methodEx('DS',{equipmentProfileId:'bench-B'})],
   [regular({techniqueId:'paused'}),methodEx('UNVRSL',{techniqueId:'touch-and-go'})],
   [{...regular(),exerciseId:'curl',n:'Сгибание рук',loadType:'machine_stack'},methodEx('SLDR')]
 ]){
   const s=old('different',source),rec=A.recommend(target,target.set[0],today(target),[s],registry);
   assert.notEqual(rec.strengthBasis,'standard');assert.equal(rec.strength.estimate,null);
 }
 // A valid normal baseline is not invalidated by a history item from a different machine.
 const ex=methodEx('DS');
 assert.equal(A.recommend(ex,ex.set[0],today(ex),[matching],registry).strengthBasis,'standard');
});
test('when there is no ordinary history the matching method may remain a conservative fallback',()=>{
 const e=methodEx('DS');
 const same=old('method',{...methodEx('DS'),set:[done(90,8,8,{label:'DS1'}),done(70,8,9,{label:'DS2'}),done(55,8,9,{label:'DS3'})]});
 const r=A.recommend(e,e.set[0],today(e),[same],registry);
 assert.equal(r.strengthBasis,'method');assert.ok(r.strength.estimate>0);
});
test('ordinary sets are never inflated by specialty sets in strength predictions',()=>{
 const method=old('drop',{...methodEx('DS'),set:[done(210,4,8,{label:'DS1'})]});
 const normal=regular(),current=today(normal);
 const r=A.recommend(normal,planned(100,8),current,[method],registry);
 assert.equal(r.strength.estimate,null);assert.equal(r.sessionIds.length,0);
});
test('method stages retain their planned descending percentages after sharing ordinary baseline',()=>{
 const normal=old('normal',regular()),ex=methodEx('DS'),s=today(ex);
 const weights=ex.set.map(set=>A.recommend(ex,set,s,[normal],registry).weight);
 assert.ok(weights.every((w,i)=>w>0&&(i===0||w<=weights[i-1])),JSON.stringify(weights));
 assert.ok(weights.at(-1)<weights[0],JSON.stringify(weights));
});
