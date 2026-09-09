'use strict';
(()=>{
 const sources=[
  'premium-ui.js?v=320','stable-ui.js?v=316','mockup-ui.js?v=316','density-ui.js?v=316',
  'mobile-final-fix.js?v=316','home-stats-v254.js?v=316','requested-cleanup-v2.js?v=320',
  'client-nav-hotfix.js?v=320','trainer-shell-v252.js?v=316'
 ];
 const seen=new Set();
 for(const href of sources){
  const file=String(href).split(/[?#]/)[0];
  if(seen.has(href)||window.unvrslScriptRetiredV257?.(file))continue;seen.add(href);
  const link=document.createElement('link');link.rel='preload';link.as='script';link.href=href;link.fetchPriority=seen.size<=6?'high':'auto';link.dataset.unvrslPreloadV320='1';document.head.appendChild(link)
 }
 window.__unvrslCanonicalPreloadsV320=Object.freeze([...seen]);window.__unvrslCanonicalPreloadsV260=window.__unvrslCanonicalPreloadsV320;
})();
function exerciseUseCount(ex){const sid=String(ex?.rawId||ex?.sourceId||''),target=baseExerciseName(ex?.custom?ex.n:ruExerciseName(ex?.n||'')).toLowerCase();let n=0;st.sessions.forEach(s=>s.ex.forEach(e=>{const sourceMatch=sid&&String(e.sourceId||'')===sid,nameMatch=baseExerciseName(e.n).toLowerCase()===target;if(sourceMatch||nameMatch)n+=e.set.filter(x=>x.ok).length}));return n}
renderBodyFilters=function(){const el=$('#bodyFilters');if(!el)return;const parts=['all','favorites','frequent','recent','upper legs','chest','back','shoulders','upper arms','lower legs','waist','cardio'];el.innerHTML=parts.map(bp=>`<button class="filterchip ${exBody===bp?'on':''}" onclick="setExerciseBody('${bp}')">${bp==='all'?'Все':bp==='favorites'?'★ Избранные':bp==='frequent'?'Частые':bp==='recent'?'Недавние':BP_RU[bp]||bp}</button>`).join('')}
const _renderExerciseResultsFrequent=renderExerciseResults;
renderExerciseResults=function(){if(exBody!=='frequent')return _renderExerciseResultsFrequent();const el=$('#exList');if(!el)return;const q=exQuery.trim().toLowerCase();let filtered=catalogRecords().map(e=>({e,c:exerciseUseCount(e)})).filter(x=>x.c>0).filter(x=>{const e=x.e,rn=e.custom?e.n:ruExerciseName(e.n),hay=`${rn} ${e.n} ${ruTarget(e.tg)} ${BP_RU[e.bp]||''}`.toLowerCase();return !q||hay.includes(q)}).sort((a,b)=>b.c-a.c).slice(0,100);el.innerHTML=filtered.map(x=>{const html=exerciseLibRow(x.e);return html.replace('</b>',`</b><div class="muted small">${x.c} выполненных подходов</div>`)}).join('')||'<div class="card muted">После первых тренировок здесь появятся часто используемые упражнения.</div>'}

const EXTRA_EXERCISES_RU=Object.freeze([
'Присед в Смите','Присед в Смите с ногами впереди','Фронтальный присед в Смите','Присед сумо в Смите',
'Болгарский сплит-присед в Смите','Болгарский сплит-присед с гантелями','Болгарский сплит-присед со штангой',
'Выпады назад в Смите','Выпады назад с гантелями','Выпады ходьбой с гантелями','Зашагивания на платформу с гантелями',
'Гакк-присед','Обратный гакк-присед','Поясной присед (belt squat)','Жим ногами 45°','Горизонтальный жим ногами',
'Жим ногами одной ногой','Разгибание ног по одной','Сгибание ног лёжа','Сгибание ног сидя','Сгибание ног стоя по одной',
'Сведение ног в тренажёре','Разведение ног в тренажёре','Румынская тяга в Смите','Румынская тяга с гантелями',
'Румынская тяга на одной ноге с гантелью','Ягодичный мостик в Смите','Ягодичный мостик со штангой',
'Ягодичный мостик в тренажёре','Ягодичный мостик на одной ноге','Кикбэк ногой в кроссовере','Кикбэк в тренажёре',
'Отведение ноги назад в кроссовере','Отведение ноги в сторону в кроссовере','Приведение ноги в кроссовере',
'Протяжка между ног на блоке','Гиперэкстензия с акцентом на ягодичные','Good morning в Смите',
'Жим лёжа в Смите','Жим на наклонной скамье в Смите','Жим на отрицательной скамье в Смите',
'Жим в тренажёре на грудь','Наклонный жим в тренажёре на грудь','Жим Hammer на грудь','Жим Hammer на верх груди',
'Сведение рук в тренажёре','Кроссовер сверху вниз','Кроссовер снизу вверх','Кроссовер на уровне груди',
'Разведение гантелей на наклонной скамье',
'Тяга Т-грифа с упором грудью','Тяга Т-грифа без упора','Тяга штанги в Смите в наклоне',
'Тяга гантелей лёжа на наклонной скамье','Тяга гантели одной рукой','Горизонтальная тяга в тренажёре',
'Горизонтальная тяга Hammer','Тяга верхнего блока широким хватом','Тяга верхнего блока нейтральным хватом',
'Тяга верхнего блока обратным хватом','Тяга верхнего блока узким нейтральным хватом','Тяга верхнего блока одной рукой',
'High row в тренажёре','Вертикальная тяга Hammer','Пуловер на верхнем блоке прямыми руками','Пуловер в тренажёре',
'Тяга каната к лицу','Подтягивания нейтральным хватом','Подтягивания в гравитроне нейтральным хватом',
'Шраги в Смите','Шраги с гантелями',
'Жим в Смите сидя на плечи','Жим в Смите стоя на плечи','Жим в тренажёре на плечи','Жим Hammer на плечи',
'Жим Арнольда','Махи гантелями в стороны сидя','Махи гантелями в стороны стоя',
'Отведение руки в сторону на нижнем блоке','Махи в тренажёре на среднюю дельту',
'Обратная бабочка на заднюю дельту','Разведение рук на заднюю дельту в кроссовере',
'Сгибание рук на скамье Скотта с EZ-штангой','Сгибание рук на скамье Скотта в тренажёре',
'Сгибание рук с гантелями на наклонной скамье','Паучьи сгибания с гантелями',
'Сгибание рук на нижнем блоке с прямой рукоятью','Сгибание рук на нижнем блоке с канатом',
'Сгибание руки на нижнем блоке одной рукой','Молотковые сгибания на нижнем блоке с канатом',
'Концентрированное сгибание с гантелью',
'Разгибание рук на верхнем блоке с канатом','Разгибание рук на верхнем блоке с прямой рукоятью',
'Разгибание рук на верхнем блоке с V-рукоятью','Разгибание руки на верхнем блоке одной рукой',
'Разгибание рук из-за головы на блоке с канатом','Французский жим с EZ-штангой лёжа',
'Французский жим с гантелью сидя','Разгибание гантели из-за головы двумя руками',
'Отжимания в тренажёре на трицепс','Жим узким хватом в Смите',
'Подъём на носки в Смите','Подъём на носки в тренажёре стоя','Подъём на носки в тренажёре сидя',
'Подъём на носки в жиме ногами','Скручивания на верхнем блоке','Подъём ног в висе','Подъём коленей в упоре',
'Разгибание с роликом для пресса','Pallof press на блоке','Боковая планка'
]);

const _inferCustomMetaExtra=inferCustomMeta;
inferCustomMeta=function(n){
 const meta={..._inferCustomMetaExtra(n)},x=baseExerciseName(n).toLowerCase();
 if(/смит/.test(x))meta.eq='smith machine';
 else if(/гантел/.test(x))meta.eq='dumbbell';
 else if(/ez-штанг|ez штанг/.test(x))meta.eq='ez barbell';
 else if(/кроссовер|блок|канат/.test(x))meta.eq='cable';
 else if(/штанг/.test(x))meta.eq='barbell';
 else if(/гравитрон/.test(x))meta.eq='assisted';
 else if(/тренаж|hammer|гакк|жим ногами|belt squat|поясной присед/.test(x))meta.eq=/жим ногами|гакк/.test(x)?'sled machine':'leverage machine';
 else if(/подтяг|планк|висе|упоре/.test(x))meta.eq='body weight';

 if(/икр|носок/.test(x)){meta.bp='lower legs';meta.tg='calves'}
 else if(/ягодич|кикбэк|отведение ноги назад|протяжка между ног|гиперэкстензия с акцентом на ягод/.test(x)){meta.bp='upper legs';meta.tg='glutes'}
 else if(/сведение ног|приведение ноги/.test(x)){meta.bp='upper legs';meta.tg='adductors'}
 else if(/разведение ног|отведение ноги в сторону/.test(x)){meta.bp='upper legs';meta.tg='abductors'}
 else if(/румын|сгибание ног|good morning/.test(x)){meta.bp='upper legs';meta.tg='hamstrings'}
 else if(/присед|болгар|выпад|зашаг|жим ногами|гакк|разгибание ног|belt squat|поясной присед/.test(x)){meta.bp='upper legs';meta.tg='quads'}
 else if(/кроссовер|жим .*груд|жим лёжа|жим на наклонной|жим на отрицательной|сведение рук|разведение гантелей/.test(x)){meta.bp='chest';meta.tg='pectorals'}
 else if(/шраг/.test(x)){meta.bp='shoulders';meta.tg='traps'}
 else if(/жим .*плеч|жим арнольда|мах[и]|среднюю дельт|заднюю дельт|тяга каната к лицу/.test(x)){meta.bp='shoulders';meta.tg='delts'}
 else if(/трицеп|разгибание рук|разгибание руки|француз|жим узким хватом|отжимания в тренажёре/.test(x)){meta.bp='upper arms';meta.tg='triceps'}
 else if(/бицеп|сгибание рук|сгибание руки|паучь|молотков|концентрирован/.test(x)){meta.bp='upper arms';meta.tg='biceps'}
 else if(/тяга т-грифа|тяга штанги|тяга гантел|горизонтальная тяга|тяга верхнего|high row|вертикальная тяга|пуловер|подтяг/.test(x)){meta.bp='back';meta.tg=/верхнего|вертикальная|пуловер|подтяг/.test(x)?'lats':'upper back'}
 else if(/скручив|подъём ног|подъем ног|подъём колен|подъем колен|ролик.*пресс|pallof|планк/.test(x)){meta.bp='waist';meta.tg='abs'}
 return meta
};

const _customCatalogExtra=customCatalog;
customCatalog=function(){
 const base=_customCatalogExtra(),seen=new Set(base.map(e=>baseExerciseName(e.raw||e.n).toLowerCase()));
 EXTRA_EXERCISES_RU.forEach(n=>{const key=baseExerciseName(n).toLowerCase();if(seen.has(key))return;seen.add(key);base.push({id:`custom:${n}`,n:displayExerciseName(n),raw:n,...inferCustomMeta(n),custom:true})});
 return base
};

let cloudModulesLoading=false,cloudModulesLoaded=false;
const startupAssetsSeen=new Set();
function markStartupAsset(src){const key=String(src||'').replace(/[?#].*$/,'');if(startupAssetsSeen.has(key))return;startupAssetsSeen.add(key);try{(window.unvrslStartupAssetLoadedV320||window.unvrslStartupAssetLoadedV319)?.(key)}catch(_){ }}
function loadExternalScript(src){return new Promise((resolve,reject)=>{const done=value=>{markStartupAsset(src);resolve(value)};if(window.unvrslScriptRetiredV257?.(src)||window.unvrslScriptRetiredV256?.(src)||window.unvrslScriptRetiredV255?.(src)||window.unvrslScriptRetiredV254?.(src)||window.unvrslScriptRetiredV253?.(src))return done({retired:true,src});const key=String(src).replace(/^\.\//,'');if(document.querySelector(`script[data-unvrsl-src="${src}"],script[data-unvrsl-src="${key}"],script[data-dyn="${src}"],script[data-dyn="./${key}"]`))return done();const s=document.createElement('script');s.src=src;s.async=false;s.dataset.unvrslSrc=key;s.onload=()=>done();s.onerror=()=>{s.remove();reject(new Error(`Failed to load ${src}`))};document.body.appendChild(s)})}
window.loadExternalScript=loadExternalScript;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function loadCriticalScript(src){
 try{return await loadExternalScript(src)}catch(first){
  await wait(120);const retry=`${src}${src.includes('?')?'&':'?'}retry=320`;
  try{return await loadExternalScript(retry)}catch(second){console.warn('UNVRSL critical module',src,second);return{failed:true,src}}
 }
}
function loadSequence(sources,loader=loadExternalScript){return sources.reduce((chain,src)=>chain.then(()=>loader(src)),Promise.resolve())}
async function loadCloudModules(){
 if(cloudModulesLoaded||cloudModulesLoading)return;cloudModulesLoading=true;
 try{
  if(!window.supabase)await loadExternalScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
  for(const src of ['cloud-config.js','cloud.js?v=260','auth-ux.js','auth-handoff.js','trainer-style.js','trainer.js','trainer-nav-patch.js','progression.js','cloud-patch.js','cloud-programs.js','app-mode.js?v=260','client-link.js','auth-password.js','checkin.js','checkin-singleton-fix.js','offline-clients.js','offline-create-measures.js','online-progress.js','client-ui-fix.js?v=260','trainer-plan-controls.js','trainer-tap-fix.js','trainer-direct-ui.js'])await loadExternalScript(src);
  cloudModulesLoaded=true;
 }catch(e){console.warn('UNVRSL cloud modules',e)}finally{cloudModulesLoading=false;window.__unvrslCloudModulesSettledV257=true;window.__unvrslCloudModulesSettledV260=true;window.dispatchEvent(new CustomEvent('unvrsl:cloud-modules-settled',{detail:{loaded:cloudModulesLoaded,release:260}}))}
}
try{renderBodyFilters();renderExerciseResults()}catch(e){console.warn('UNVRSL initial exercise filters',e)}
const cloudChain=loadCloudModules();window.__unvrslCloudModulesPromiseV316=cloudChain;

const criticalSources=[
 'premium-ui.js?v=320','stable-ui.js?v=316','mockup-ui.js?v=316','density-ui.js?v=316',
 'mobile-final-fix.js?v=316','home-stats-v254.js?v=316','requested-cleanup-v2.js?v=320',
 'client-nav-hotfix.js?v=320','trainer-shell-v252.js?v=316'
];
const criticalChain=loadSequence(criticalSources,loadCriticalScript).finally(()=>{
 window.__unvrslCriticalModulesReadyV320=true;
 window.__unvrslDynamicModulesReadyV257=true;window.__unvrslDynamicModulesReadyV260=true;
 window.dispatchEvent(new CustomEvent('unvrsl:modules-ready',{detail:{release:321,layer:'critical'}}))
});
window.__unvrslCriticalModulesPromiseV320=criticalChain;window.__unvrslDynamicModulesPromiseV257=criticalChain;

let deferredStarted=false,deferredPromise=null;
function startDeferredModules(){
 if(deferredStarted)return deferredPromise;deferredStarted=true;
 const safe=(promise,label)=>promise.catch(e=>{console.warn(label,e);return{failed:true,label}});
 const templates=safe(loadSequence(['popular-programs.js?v=320','female-program-templates.js?v=320']),'program templates');
 const programs=safe(loadSequence(['anton-gorkusha-plan.js?v=320','anton-plan-rules.js?v=320','program-management-patch.js?v=320','start-program-picker.js?v=320','program-delete-fix.js?v=320','program-delete-persistence-v3.js?v=320','trainer-self-plan-v110.js?v=260']),'program modules');
 const workout=safe(loadSequence(['wake-lock.js?v=320','workout-duration.js?v=320','cardio-timer.js?v=320','advanced-training.js?v=320','adaptive-effort-v2.js?v=320','workout-template-ux-v2.js?v=320','cardio-exercise-library.js?v=320','client-workout-scroll-v259.js?v=318']),'workout modules');
 const stats=safe(loadSequence(['profile-strength-core-v248.js?v=320','sheet-swipe.js?v=316','stats-dashboard-v254.js?v=316','stats-cleanup-v254.js?v=316','stats-authority-v254.js?v=316']),'stats modules');
 const trainer=Promise.allSettled([
  safe(loadExternalScript('clients-action-layout.js?v=320'),'trainer layout'),
  safe(loadExternalScript('offline-progress-v321.js?v=328'),'offline progress')
 ]);
 deferredPromise=Promise.allSettled([templates,programs,workout,stats,trainer]).finally(()=>{
  window.__unvrslDeferredModulesReadyV320=true;
  window.dispatchEvent(new CustomEvent('unvrsl:deferred-modules-ready',{detail:{release:321}}))
 });
 window.__unvrslDeferredModulesPromiseV320=deferredPromise;return deferredPromise
}
window.unvrslWarmDeferredModulesV320=startDeferredModules;
function scheduleDeferred(){
 if(deferredStarted)return;
 if('requestIdleCallback'in window)requestIdleCallback(startDeferredModules,{timeout:1200});
 else setTimeout(startDeferredModules,280)
}
function warmForIntent(e){
 const target=e.target?.closest?.('#gear,.nav button[data-p]');
 if(!target)return;const page=target.dataset?.p;
 if(target.id==='gear'||['plan','start','stats','exercises','programs','clients'].includes(page))startDeferredModules()
}
document.addEventListener('pointerdown',warmForIntent,{capture:true,passive:true});
document.addEventListener('touchstart',warmForIntent,{capture:true,passive:true});
window.addEventListener('unvrsl:app-ready',scheduleDeferred,{once:true,passive:true});
if(window.__unvrslStartupComplete)scheduleDeferred();
