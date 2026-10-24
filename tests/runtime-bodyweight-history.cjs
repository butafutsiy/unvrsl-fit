'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.UNVRSL_JSDOM||'jsdom');
const root=path.resolve(__dirname,'..');
(async()=>{
 const dom=new JSDOM('<!doctype html><html><head></head><body><div id="home" class="active"><div class="card calendar-card"></div></div><div id="sheet"></div></body></html>',{runScripts:'dangerously',url:'https://app.test/',pretendToBeVisual:true});
 const w=dom.window,timers=[],observers=[];
 const NativeObserver=w.MutationObserver;w.MutationObserver=class extends NativeObserver{constructor(fn){super(fn);observers.push(this)}};
 w.setTimeout=fn=>{timers.push(fn);return timers.length};
 w.scrollTo=()=>{};w.st={bw:[],sessions:[]};
 w.modal=html=>w.document.getElementById('sheet').innerHTML=html;
 w.home=()=>{};
 for(const file of ['activity-summary.js','home-stats.js','bodyweight-history.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));
 const tick=()=>new Promise(r=>setTimeout(r,60));
 for(const fn of timers.splice(0))await fn();await tick();
 assert.match(w.document.querySelector('.bw190-scroll').textContent,/Записей пока нет/);
 // Sign-in completes after all startup retries have already run. The chart
 // hydrates directly from cloud while local state has not reconciled yet.
 let cloudWeights=[{measure_date:'2026-09-15',weight_kg:95.7},{measure_date:'2026-10-09',weight_kg:92.5}];
 w.cloud={user:{id:'alice'},profile:{role:'client'},client:{from(table){const q={select(){return q},eq(){return q},order(){return q},range(){return Promise.resolve({data:[]})},limit(){return Promise.resolve({data:table==='bodyweights'?cloudWeights:[]})},maybeSingle(){return Promise.resolve({data:{target_weight_kg:90}})}};return q}}};
 w.dispatchEvent(new w.CustomEvent('unvrsl:cloud-ready'));
 await w.homeProgressRefresh(true);await tick();
 assert.equal(w.st.bw.length,0,'exercise the cloud snapshot rather than local fallback');
 assert.equal(w.document.querySelectorAll('.bw190-chip').length,2);
 assert.equal(w.document.querySelectorAll('.bw190-point').length,2);
 assert.doesNotMatch(w.document.querySelector('.bw190-scroll').textContent,/Записей пока нет/);
 w.bw190History();assert.equal(w.document.querySelectorAll('.bw190-row').length,2);
 w.bw190SelectPoint('2026-09-15');assert.match(w.document.querySelector('.sd2-current').textContent,/95,7/);
 // A later measurement and complete home remount also update the list.
 cloudWeights=cloudWeights.concat({measure_date:'2026-10-11',weight_kg:92});
 await w.homeProgressRefresh(true);await tick();
 assert.equal(w.document.querySelectorAll('.bw190-chip').length,3);
 assert.equal(w.bw190SelectedDate(),'2026-09-15','retain user selection after synchronization');
 w.st.deletedBodyweights=[{d:'2026-09-15',at:Date.now()}];
 await w.homeProgressRefresh(true);await tick();
 assert.equal(w.document.querySelectorAll('.bw190-chip').length,2);
 assert.equal(w.document.querySelectorAll('.bw190-point').length,2);
 assert.equal(w.bw190SelectedDate(),'2026-10-11');
 observers.forEach(o=>o.disconnect());dom.window.close();
 // Offline restart restores persisted local measurements without cloud.
 const offline=new JSDOM('<html><head></head><body><div id="home"><div class="sd2-card"><span class="sd2-weight-label">Вес тела</span></div></div><div id="sheet"></div></body></html>',{runScripts:'dangerously',url:'https://app.test/',pretendToBeVisual:true});
 const offlineObservers=[],OfflineObserver=offline.window.MutationObserver;
 offline.window.MutationObserver=class extends OfflineObserver{constructor(fn){super(fn);offlineObservers.push(this)}};
 offline.window.st={bw:[{d:'2026-10-09',w:92.5}]};
 offline.window.eval(fs.readFileSync(path.join(root,'bodyweight-history.js'),'utf8'));
 assert.match(offline.window.document.querySelector('.bw190-chip').textContent,/92,5/);
 offlineObservers.forEach(o=>o.disconnect());offline.window.close();
 console.log('Bodyweight history: late sign-in, chart/list parity, all records, selection, remount, deletion and offline restart passed');
})().catch(e=>{console.error(e);process.exitCode=1});
