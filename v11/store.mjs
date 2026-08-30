import {LEGACY_KEYS,STORAGE_KEY,emptyState,migrateLegacy,normalizeState,learnFromHistory} from './core.mjs';

const listeners=new Set();
let state=null;
let saveTimer=null;

function parse(raw){
  try{return raw?JSON.parse(raw):null}catch{return null}
}

export function loadState(storage=localStorage){
  const current=parse(storage.getItem(STORAGE_KEY));
  if(current){
    state=learnFromHistory(normalizeState(current));
    return state;
  }
  let legacy=null;
  for(const key of LEGACY_KEYS){
    legacy=parse(storage.getItem(key));
    if(legacy)break;
  }
  state=legacy?migrateLegacy(legacy):emptyState();
  storage.setItem(STORAGE_KEY,JSON.stringify(state));
  if(legacy)storage.setItem(`${STORAGE_KEY}:migration`,JSON.stringify({at:Date.now(),source:'legacy',backupKeys:LEGACY_KEYS}));
  return state;
}

export function getState(){
  if(!state)throw new Error('State is not loaded');
  return state;
}

export function replaceState(next,{silent=false,immediate=false}={}){
  state=learnFromHistory(normalizeState(next));
  immediate?persistNow():persist();
  if(!silent)emit();
  return state;
}

export function updateState(mutator,{immediate=false}={}){
  if(!state)loadState();
  mutator(state);
  state.updatedAt=Date.now();
  immediate?persistNow():persist();
  emit();
  return state;
}

export function subscribe(listener){
  listeners.add(listener);
  return ()=>listeners.delete(listener);
}

function emit(){
  for(const listener of listeners)listener(state);
  window.dispatchEvent(new CustomEvent('unvrsl:state',{detail:state}));
}

function persist(){
  clearTimeout(saveTimer);
  saveTimer=setTimeout(persistNow,80);
}

export function persistNow(storage=localStorage){
  if(!state)return;
  clearTimeout(saveTimer);
  storage.setItem(STORAGE_KEY,JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('unvrsl:saved',{detail:{updatedAt:state.updatedAt}}));
}

export function exportBackup(){
  const blob=new Blob([JSON.stringify(getState(),null,2)],{type:'application/json'});
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);
  link.download=`unvrsl-fit-v1.1-${new Date().toISOString().slice(0,10)}.json`;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),500);
}

export function importBackup(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(reader.error);
    reader.onload=()=>{
      try{resolve(replaceState(JSON.parse(String(reader.result))))}catch(error){reject(error)}
    };
    reader.readAsText(file);
  });
}
