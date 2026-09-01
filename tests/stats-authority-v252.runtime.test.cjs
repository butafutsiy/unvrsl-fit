'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','stats-authority-v252.js'),'utf8');

test('late legacy renderer cannot take ownership of Statistics',async()=>{
  const listeners={window:{},document:{}};
  const root={
    dataset:{},canonical:false,foreign:false,textContent:'Старый экран',__statsDashboardHtml:'stale',
    classList:{contains:name=>name==='active'},
    querySelector(sel){
      if(sel==='.profile-card-head,.profile-overview,.own-body-progress')return this.foreign?{}:null;
      if(!this.canonical)return null;
      return ['.sd2-head','.sd2-grid','.sd2-strength-host','#statsWorkoutHistory208'].includes(sel)?{}:null
    }
  };
  const legacy=()=>{root.canonical=false;root.foreign=true;root.textContent='Вес тела · старый экран'};
  const window={
    statsPage:legacy,
    nav:p=>{if(p==='stats')legacy()},
    statsDashboardRender(){root.canonical=true;root.foreign=false;root.dataset.statsAuthority='252';root.textContent='Статистика · Средний RPE · СИЛОВЫЕ'},
    statsCleanupPatch(){},statsProgressRefresh(){},
    addEventListener:(name,fn)=>{listeners.window[name]=fn}
  };
  const document={
    hidden:false,getElementById:id=>id==='stats'?root:null,
    addEventListener:(name,fn)=>{listeners.document[name]=fn}
  };
  const context={window,document,statsPage:legacy,nav:window.nav,MutationObserver:class{constructor(fn){this.fn=fn}observe(){}},requestAnimationFrame:fn=>fn(),setTimeout:fn=>fn(),console,Promise};
  vm.runInNewContext(source,context);
  await Promise.resolve();
  assert.equal(root.canonical,true);
  assert.equal(window.statsPage.__statsAuthorityV252,true);

  window.statsPage=legacy;context.statsPage=legacy;legacy();
  listeners.window.pageshow();
  assert.equal(window.statsPage.__statsAuthorityV252,true);
  assert.equal(root.canonical,true);

  legacy();window.nav('stats');
  assert.equal(root.canonical,true);
  assert.doesNotMatch(root.textContent,/Вес тела/);
});
