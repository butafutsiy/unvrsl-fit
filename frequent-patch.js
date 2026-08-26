'use strict';
function exerciseUseCount(ex){const sid=String(ex?.rawId||ex?.sourceId||''),target=baseExerciseName(ex?.custom?ex.n:ruExerciseName(ex?.n||'')).toLowerCase();let n=0;st.sessions.forEach(s=>s.ex.forEach(e=>{const sourceMatch=sid&&String(e.sourceId||'')===sid,nameMatch=baseExerciseName(e.n).toLowerCase()===target;if(sourceMatch||nameMatch)n+=e.set.filter(x=>x.ok).length}));return n}
renderBodyFilters=function(){const el=$('#bodyFilters');if(!el)return;const parts=['all','favorites','frequent','recent','upper legs','chest','back','shoulders','upper arms','lower legs','waist','cardio'];el.innerHTML=parts.map(bp=>`<button class="filterchip ${exBody===bp?'on':''}" onclick="setExerciseBody('${bp}')">${bp==='all'?'Все':bp==='favorites'?'★ Избранные':bp==='frequent'?'Частые':bp==='recent'?'Недавние':BP_RU[bp]||bp}</button>`).join('')}
const _renderExerciseResultsFrequent=renderExerciseResults;
renderExerciseResults=function(){if(exBody!=='frequent')return _renderExerciseResultsFrequent();const el=$('#exList');if(!el)return;const q=exQuery.trim().toLowerCase();let filtered=catalogRecords().map(e=>({e,c:exerciseUseCount(e)})).filter(x=>x.c>0).filter(x=>{const e=x.e,rn=e.custom?e.n:ruExerciseName(e.n),hay=`${rn} ${e.n} ${ruTarget(e.tg)} ${BP_RU[e.bp]||''}`.toLowerCase();return !q||hay.includes(q)}).sort((a,b)=>b.c-a.c).slice(0,100);el.innerHTML=filtered.map(x=>{const html=exerciseLibRow(x.e);return html.replace('</b>',`</b><div class="muted small">${x.c} выполненных подходов</div>`)}).join('')||'<div class="card muted">После первых тренировок здесь появятся часто используемые упражнения.</div>'}

let cloudModulesLoading=false,cloudModulesLoaded=false;
function loadExternalScript(src){return new Promise((resolve,reject)=>{if(document.querySelector(`script[data-unvrsl-src="${src}"]`))return resolve();const s=document.createElement('script');s.src=src;s.async=false;s.dataset.unvrslSrc=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s)})}
async function loadCloudModules(){
 if(cloudModulesLoaded||cloudModulesLoading)return;cloudModulesLoading=true;
 try{
  if(!window.supabase)await loadExternalScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
  for(const src of ['cloud-config.js','cloud.js','trainer-style.js','trainer.js','progression.js','cloud-patch.js','cloud-programs.js','app-mode.js'])await loadExternalScript(src);
  cloudModulesLoaded=true;
 }catch(e){console.warn('UNVRSL cloud modules',e)}finally{cloudModulesLoading=false}
}
setTimeout(()=>{renderBodyFilters();renderExerciseResults();loadCloudModules()},0);