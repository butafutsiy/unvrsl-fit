'use strict';
function cloudSettingsLabel(){
  if(window.cloud?.user)return window.cloud.profile?.display_name||window.cloud.user.email||'Аккаунт подключён';
  return 'Вход и облачное сохранение данных';
}
function settingsSheet(){
  modal(`<div class="row between"><h2>Настройки</h2><button class="btn tiny" onclick="closeModal()">✕</button></div>
  <div class="section">АККАУНТ</div><div class="settings-card"><div class="setting"><div><b>UNVRSL Cloud</b><div class="muted small">${esc(cloudSettingsLabel())}</div></div><button class="btn tiny" onclick="openCloudAccount()">${window.cloud?.user?'Открыть':'Войти'}</button></div>${window.cloud?.user?`<div class="setting"><div><b>Облачная копия</b><div class="muted small">Тренировки, прогресс, вес, программы и настройки</div></div><button class="btn tiny" onclick="accountSyncNow?.()">Синхр.</button></div>`:''}</div>
  <div class="section">ВНЕШНИЙ ВИД</div><div class="settings-card"><div class="setting"><div>Тема</div><div class="seg"><button class="on">☾ Тёмная</button><button disabled>☀ Светлая</button></div></div><div class="setting"><div>Схема тела</div><div class="seg"><button class="${st.body==='male'?'on':''}" onclick="st.body='male';save();settingsSheet()">Мужской</button><button class="${st.body==='female'?'on':''}" onclick="st.body='female';save();settingsSheet()">Женский</button></div></div><div class="setting" style="display:block"><div>Акцентный цвет</div><div class="colors">${COLORS.map(c=>`<button class="color ${st.accent===c?'on':''}" style="background:${c}" onclick="setAccent('${c}')"></button>`).join('')}</div></div></div>
  <div class="section">РЕЗЕРВНАЯ КОПИЯ</div><div class="settings-card"><div class="setting"><div><b>Экспорт резервной копии</b><div class="muted small">Все локальные данные</div></div><button class="btn tiny" onclick="backup()">Файл</button></div><div class="setting"><div><b>Импорт резервной копии</b></div><label class="btn tiny" for="bkImport">Импорт</label><input id="bkImport" type="file" accept=".json,application/json" hidden onchange="restoreBackup(this.files[0])"></div></div>`)
}
async function importOpenGym(file){
  if(!file)return;try{const d=JSON.parse(await file.text());await loadExerciseDB();let imported=0;
    if(Array.isArray(d.bodyweight)&&d.bodyweight.length){st.bw=d.bodyweight.map(x=>({d:x.d,w:Number(x.w),t:x.t||Date.now()})).filter(x=>x.d&&x.w);imported+=st.bw.length}
    if(Array.isArray(d.workouts)&&d.workouts.length){const conv=d.workouts.map(convertOpenGymWorkout).filter(Boolean);st.sessions.push(...conv);imported+=conv.length}
    save();closeModal();render();toast(`Импортировано: ${imported}`)
  }catch(e){alert('Не удалось прочитать резервную копию: '+e.message)}
}
function ogName(id){const x=ogLibrary.find(e=>e.id===String(id));return x?ruExerciseName(x.n):String(id||'Упражнение')}
function convertOpenGymWorkout(w){
  try{const entries=w.entries||w.ex||w.exercises||[];return{id:'og'+(w.id||Date.now()+Math.random()),date:w.d||w.date||iso(),w:0,c:'OG',name:w.name||w.n||'Импортированная тренировка',target:8,tempo:'',started:w.start||w.t||Date.now(),ended:w.end||w.t||Date.now(),ex:entries.map(e=>{const sets=e.sets||e.set||[];return{n:e.n||e.name||ogName(e.id),d:'Импортировано из базы упражнений',rest:90,sourceId:e.id||null,mode:'reps',set:sets.map((x,i)=>({n:i+1,w:+(x.w??x.weight??0),r:+(x.r??x.reps??0),rpe:x.rpe??'',ok:x.done!==false}))}})}}catch(e){return null}
}
const _ruExercisesPage=exercisesPage;
exercisesPage=function(){_ruExercisesPage();const search=document.getElementById('exSearch');if(search)search.placeholder='Поиск упражнений';const chip=document.querySelector('#exercises .catalog-head .chip');if(chip)chip.textContent='Русский · анимации'};
const _ruRenderExerciseDetail=renderExerciseDetail;
renderExerciseDetail=function(ex){_ruRenderExerciseDetail(ex);document.querySelectorAll('.detail-en').forEach(el=>el.remove())};
function dynamicScript(src){return new Promise(resolve=>{if(window.unvrslScriptRetiredV253?.(src))return resolve({retired:true,src});const key=String(src).replace(/^\.\//,'');if(document.querySelector(`script[data-dyn="${src}"],script[data-dyn="${key}"],script[data-unvrsl-src="${src}"],script[data-unvrsl-src="${key}"]`))return resolve();const s=document.createElement('script');s.src=src;s.dataset.dyn=key;s.onload=resolve;s.onerror=resolve;document.body.appendChild(s)})}
async function loadCloudModules(){
  if(!window.UNVRSL_CLOUD)await dynamicScript('./cloud-config.js');
  if(!window.supabase?.createClient){await dynamicScript('./supabase-loader.js');if(window.UNVRSL_SUPABASE_READY)try{await window.UNVRSL_SUPABASE_READY}catch(e){}}
  if(!window.cloud)await dynamicScript('./cloud.js');
  if(!window.__unvrslAccountSync)await dynamicScript('./account-sync.js');
  for(const src of ['./trainer-style.js','./trainer.js','./progression.js','./cloud-patch.js'])await dynamicScript(src)
}
async function openCloudAccount(){await loadCloudModules();if(typeof cloudAccountSheet==='function')cloudAccountSheet();else toast('Облако пока недоступно')}
save();render();loadExerciseDB();
