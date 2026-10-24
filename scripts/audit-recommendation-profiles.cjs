'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),E=require('../recommendation-engine');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
const window={};vm.runInNewContext(read('exercise-catalog.js'),{window});
const canonical=window.UNVRSL_EXERCISES;
const references=[];
// Execute the same source factories as the app, without persisting user data.
let uid=0;const sandbox={window:{UNVRSL_ROUTINES:[]},document:{querySelector:()=>true,createElement:()=>({dataset:{}}),head:{appendChild(){}}},uid:()=>`audit-${++uid}`,templatesSheet(){},Date,console,st:{programs:[],seededPrograms:{}},save(){},setTimeout(){},setInterval(){},clearInterval(){}};
sandbox.window.window=sandbox.window;
for(let w=1;w<=8;w++)vm.runInNewContext(read(`plan-w${w}.js`),sandbox);
for(const day of sandbox.window.UNVRSL_ROUTINES)for(const ex of day.e||[])references.push({exercise:ex,source:`plan-w${day.w}.js:${day.c}`});
vm.runInNewContext(read('popular-programs.js')+';globalThis.auditPopular=POPULAR_PROGRAMS;',sandbox);
const collect=(program,source)=>{for(const [wi,week] of (program.weeks||[]).entries())for(const [di,day] of (week.days||[]).entries())for(const [ei,ex] of (day.ex||[]).entries())references.push({exercise:{...ex,id:`${source}:${wi}:${di}:${ei}`},source});};
for(const [id,spec] of Object.entries(sandbox.auditPopular))collect(spec.build(),`popular:${id}`);
const female={window:{registerTemplateOption(){},templatesSheet(){},addIndependentTemplate:(id,build)=>collect(build(),id)},uid:()=>`audit-${++uid}`,templatesSheet(){},console,Date,setInterval(){},setTimeout(){},clearInterval(){}};
const source=read('female-program-templates.js').replace('Object.entries(T).forEach','globalThis.auditFemale=T;Object.entries(T).forEach');
try{vm.runInNewContext(source,female);for(const [id,spec] of Object.entries(female.auditFemale||{}))collect(spec.build(),`female:${id}`);}catch(err){throw new Error('Female program factory inventory failed: '+err.message);}
for(const file of ['sergey-training-plan.js','anton-gorkusha-plan.js']){sandbox.window.WorkoutDomain=require('../workout-domain');vm.runInNewContext(read(file),sandbox);for(const program of sandbox.st.programs)collect(program,file);sandbox.st.programs=[];}
collect(require('../semen-training-plan').build(require('../workout-domain'),'2026-10-24'),'semen-training-plan.js');
const additions=Object.entries(require('../exercise-profiles').routing).filter(([id])=>!canonical.some(r=>r.id===id)).map(([id,p])=>({id,n:p.name}));
const registry={rows:canonical},rows=E.buildExerciseCoverage([...canonical,...additions],references,registry);
// Optional real runtime export includes installed additions, user exercises and archive IDs.
const snapshot=process.argv.find(x=>x.startsWith('--snapshot='));
if(snapshot){const data=JSON.parse(fs.readFileSync(snapshot.slice(11),'utf8'));rows.push(...E.buildExerciseCoverage(data.registry||[],[...(data.programReferences||[]),...(data.custom||[]).map(x=>({exercise:x,source:'custom'})),...(data.archivedReferences||[]).map(x=>({exercise:x,source:'archivedReferences'}))],registry));}
const inventory=rows.length,grouped=new Map();
for(const row of rows){const key=[row.name,row.canonicalId,row.family,row.loadAccounting,row.profileStatus].join('::'),existing=grouped.get(key);if(existing){existing.occurrences++;if(!existing.sources.includes(row.source))existing.sources.push(row.source);if(row.id&&!existing.referenceIds.includes(row.id))existing.referenceIds.push(row.id);}else grouped.set(key,{...row,sources:[row.source],occurrences:1,referenceIds:row.id?[row.id]:[]});}
rows.splice(0,rows.length,...grouped.values());
const report={inventoryOccurrences:inventory,engineVersion:3,scope:snapshot?'sourceFactories+runtimeSnapshot':'sourceFactories; no private user history supplied',canonicalCount:canonical.length,programReferenceCount:references.length,counts:rows.reduce((a,x)=>(a[x.profileStatus]=(a[x.profileStatus]||0)+1,a),{}),rows};
if(rows.some(x=>!['resolved','provisional','manual_only'].includes(x.profileStatus)))throw Error('Unresolved profiles');
fs.mkdirSync(path.join(root,'docs'),{recursive:true});fs.writeFileSync(path.join(root,'docs/exercise-profile-coverage.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(root,'docs/exercise-profile-coverage.md'),'# Exercise profile coverage\n\n'+report.scope+'\n\n'+JSON.stringify(report.counts)+'\n\n| Source | Exercise | ID | Family | Metric | Accounting | Status | Reason |\n|---|---|---|---|---|---|---|---|\n'+rows.map(x=>[x.sources.join(', '),x.name,x.canonicalId,x.family,x.progressionMetric,x.loadAccounting,x.profileStatus,x.reviewReason].map(v=>String(v??'').replace(/\|/g,'/')).join(' | ')).map(x=>'| '+x+' |').join('\n')+'\n');
console.log(JSON.stringify({canonical:canonical.length,additions:additions.length,references:references.length,statuses:report.counts}));
