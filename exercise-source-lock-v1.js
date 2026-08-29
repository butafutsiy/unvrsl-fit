'use strict';
(()=>{
 if(window.__unvrslExerciseSourceLockV1)return;window.__unvrslExerciseSourceLockV1=true;
 const original=window.catalogRecords;
 const sourceRecords=()=>{
  const src=(Array.isArray(window.ogLibrary)?window.ogLibrary:(typeof ogLibrary!=='undefined'&&Array.isArray(ogLibrary)?ogLibrary:[]));
  return src.map(e=>({...e,id:String(e.id||'').startsWith('og:')?String(e.id):`og:${e.id}`,rawId:e.rawId||e.id,custom:false,anatome:false,cardioPreset:false}));
 };
 const visiblePage=()=>!!document.querySelector('#exercises.page.active');
 const wrapped=function(){
  if(visiblePage())return sourceRecords();
  return typeof original==='function'?original.apply(this,arguments):sourceRecords();
 };
 window.catalogRecords=wrapped;try{catalogRecords=wrapped}catch(_){}
 window.UNVRSL_EXERCISEDB_ONLY=sourceRecords;
})();