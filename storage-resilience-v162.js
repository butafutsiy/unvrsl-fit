'use strict';
(()=>{
  if(window.__unvrslStorageResilienceV162)return;
  window.__unvrslStorageResilienceV162=true;

  const currentKey=typeof KEY==='string'?KEY:'unvrsl-fit-v3';
  const legacyKey=typeof OLDKEY==='string'?OLDKEY:'unvrsl-fit-v2';
  const fallbackDb='unvrsl-fit-fallback';
  const fallbackStore='state';
  const fallbackId='latest';
  const baseSave=window.save;
  if(typeof baseSave!=='function')return;

  function openFallback(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB'in window))return reject(new Error('IndexedDB unavailable'));
      const request=indexedDB.open(fallbackDb,1);
      request.onupgradeneeded=()=>request.result.createObjectStore(fallbackStore);
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error)
    })
  }

  async function writeFallback(){
    try{
      const db=await openFallback();
      const tx=db.transaction(fallbackStore,'readwrite');
      tx.objectStore(fallbackStore).put({savedAt:Date.now(),state:st},fallbackId);
      tx.oncomplete=()=>db.close();
      tx.onerror=()=>db.close()
    }catch(e){}
  }

  async function readFallback(){
    try{
      const db=await openFallback();
      return await new Promise(resolve=>{
        const tx=db.transaction(fallbackStore,'readonly');
        const request=tx.objectStore(fallbackStore).get(fallbackId);
        request.onsuccess=()=>resolve(request.result||null);
        request.onerror=()=>resolve(null);
        tx.oncomplete=()=>db.close();
        tx.onerror=()=>db.close()
      })
    }catch(e){return null}
  }

  async function clearFallback(){
    try{
      const db=await openFallback();
      const tx=db.transaction(fallbackStore,'readwrite');
      tx.objectStore(fallbackStore).delete(fallbackId);
      tx.oncomplete=()=>db.close();
      tx.onerror=()=>db.close()
    }catch(e){}
  }

  let warned=false;
  function resilientSave(){
    try{
      const result=baseSave.apply(this,arguments);
      clearFallback();
      return result
    }catch(firstError){
      try{
        if(localStorage.getItem(currentKey)!==null)localStorage.removeItem(legacyKey);
        const result=baseSave.apply(this,arguments);
        clearFallback();
        return result
      }catch(secondError){
        writeFallback();
        if(!warned){
          warned=true;
          setTimeout(()=>{if(typeof toast==='function')toast('Данные сохранены в резервное хранилище')},0)
        }
        return false
      }
    }
  }

  try{
    if(localStorage.getItem(currentKey)!==null)localStorage.removeItem(legacyKey)
  }catch(e){}

  window.save=resilientSave;
  try{save=resilientSave}catch(e){}

  const bootSnapshot=JSON.stringify(st);
  readFallback().then(record=>{
    if(!record?.state||JSON.stringify(st)!==bootSnapshot)return;
    st=record.state;
    resilientSave();
    setTimeout(()=>{
      try{render()}catch(e){}
      try{if(document.getElementById('start')?.classList.contains('active'))startPage()}catch(e){}
    },0)
  })
})();
