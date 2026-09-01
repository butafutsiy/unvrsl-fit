'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','stats-authority-v253.js'),'utf8');

test('late legacy renderer cannot take ownership of Statistics',async()=>{
  const listeners={window:{},document:{}};
  const root={
    dataset:{},canonical:false,anatomy:false,foreign:false,textContent:'Старый экран',__statsDashboardHtml:'stale',
    classList:{contains:name=>name==='active'},
    querySelector(sel){
      if(sel==='.profile-card-head,.profile-overview,.own-body-progress,.stats-muscle-week,.stats-last-session-v104-wrap')return this.foreign?{}:null;
      if(sel==='#anatomeMuscleCard')return this.anatomy?{}:null;
      if(!this.canonical)return null;
      return ['.sd2-head','.sd2-grid','.sd2-strength-host','#statsWorkoutHistory208'].includes(sel)?{}:null
    }
  };
  const legacy=()=>{root.canonical=false;root.foreign=true;root.textContent='Вес тела · старый экран'};
  const window={
    statsPage:legacy,
    nav:p=>{if(p==='stats')legacy()},
    statsDashboardRender(){root.canonical=true;root.foreign=false;root.dataset.statsAuthority='253';root.textContent='Статистика · Средний RPE · СИЛОВЫЕ'},
    statsCleanupPatch(){root.foreign=false},anatomeMountCardV253(){root.anatomy=true},statsProgressRefresh(){},
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
  assert.equal(root.anatomy,true);
  assert.equal(window.statsPage.__statsAuthorityV253,true);

  window.statsPage=legacy;context.statsPage=legacy;legacy();
  listeners.window.pageshow();
  assert.equal(window.statsPage.__statsAuthorityV253,true);
  assert.equal(root.canonical,true);
  assert.equal(root.anatomy,true);

  legacy();window.nav('stats');
  assert.equal(root.canonical,true);
  assert.doesNotMatch(root.textContent,/Вес тела/);
});
