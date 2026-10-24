'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.UNVRSL_JSDOM||'jsdom');
const workout=(id,date='2026-10-20')=>({id,date,ended:1,ex:[{set:[{ok:true,w:80,r:10}]}]});
(async()=>{
 const dom=new JSDOM('<html><head></head><body><div id="home" class="active"><div class="card calendar-card"></div></div></body></html>',{url:'https://app.test',runScripts:'dangerously',pretendToBeVisual:true});
 try{
 const w=dom.window,NativeDate=w.Date;w.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[2026,9,24,12]))}};
 w.setTimeout=()=>1;w.scrollTo=()=>{};w.home=()=>{};w.st={accountOwnerId:'alice',sessions:[workout('offline'),workout('duplicate')],deletedSessionIds:['deleted'],bw:[]};
 let rows=[workout('duplicate'),workout('cloud'),workout('deleted')],calls=[],owner='alice',delay=null,fail=false;
 w.cloud={user:{id:owner},profile:{role:'trainer'},client:{from(table){const q={select(){return q},eq(field,value){q.owner=value;return q},order(){return q},range(from,to){calls.push([q.owner,from,to]);const response={data:rows.slice(from,to+1).map(s=>({external_id:s.id,workout_date:s.date,payload:s}))};return delay?delay:fail?Promise.reject(Error('offline fixture')):Promise.resolve(response)},limit(){return Promise.resolve({data:[{measure_date:'2026-10-20',weight_kg:90}]})},maybeSingle(){return Promise.resolve({data:{target_weight_kg:85}})}};return q}}};
 for(const file of ['activity-summary.js','home-stats.js'])w.eval(fs.readFileSync(path.join(__dirname,'..',file),'utf8'));
 const counts=()=>Array.from(w.document.querySelectorAll('[data-activity-count]'),e=>Number(e.textContent));
 await w.homeProgressRefresh(true);assert.deepEqual(counts(),[3,3,3]);assert.equal(w.homeStatsBodyweights()[0].v,90);
 w.st.sessions.push(workout('another-offline'));await w.homeProgressRefresh(false);assert.deepEqual(counts(),[4,4,4],'fresh offline results merge with cached cloud');
 w.st.deletedSessionIds.push('cloud');w.dispatchEvent(new w.Event('unvrsl:history-updated'));await w.homeProgressRefresh(true);assert.deepEqual(counts(),[3,3,3]);
 // No cloud row limit: a second page is necessary for the annual total.
 rows=Array.from({length:501},(_,i)=>workout('remote-'+i));w.st.sessions=[];await w.homeProgressRefresh(true);assert.deepEqual(counts(),[501,501,501]);assert.ok(calls.some(c=>c[1]===500));
 // An in-flight response for Alice must not leak after signing in as Bob.
 let release;delay=new Promise(resolve=>release=resolve);const pending=w.homeProgressRefresh(true);
 w.cloud.user={id:'bob'};rows=[workout('bob')];delay=null;await w.homeProgressRefresh(true);assert.deepEqual(counts(),[1,1,1]);
 release({data:[{external_id:'late-alice',workout_date:'2026-10-20',payload:workout('late-alice')}]});await pending;assert.deepEqual(counts(),[1,1,1]);
 // Failed workout fetch cannot suppress locally saved workouts or successful weight queries.
 w.st.accountOwnerId='bob';w.st.sessions=[workout('bob-offline')];w.cloud.user={id:'bob-offline-owner'};w.st.accountOwnerId='bob-offline-owner';fail=true;const warnings=[];w.console.warn=(...args)=>warnings.push(args);
 await w.homeProgressRefresh(true);assert.deepEqual(counts(),[1,1,1]);assert.equal(w.homeStatsBodyweights()[0].v,90);assert.ok(warnings.length);
 console.log('PASS Home activity: local/cloud merge, deduplication, history events, pagination, auth race isolation, offline fallback, independent bodyweights');
 }finally{dom.window.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
