'use strict';
function settingsSheet(){
  modal(`<div class="row between"><h2>Настройки</h2><button class="btn tiny" onclick="closeModal()">✕</button></div>
  <div class="section">ВНЕШНИЙ ВИД</div><div class="settings-card"><div class="setting"><div>Тема</div><div class="seg"><button class="on">☾ Тёмная</button><button disabled>☀ Светлая</button></div></div><div class="setting"><div>Схема тела</div><div class="seg"><button class="${st.body==='male'?'on':''}" onclick="st.body='male';save();settingsSheet()">Мужской</button><button class="${st.body==='female'?'on':''}" onclick="st.body='female';save();settingsSheet()">Женский</button></div></div><div class="setting" style="display:block"><div>Акцентный цвет</div><div class="colors">${COLORS.map(c=>`<button class="color ${st.accent===c?'on':''}" style="background:${c}" onclick="setAccent('${c}')"></button>`).join('')}</div></div></div>
  <div class="section">ДАННЫЕ</div><div class="settings-card"><div class="setting"><div><b>Русская база упражнений</b><div class="muted small">${ogLibraryLoaded?ogLibrary.length:'1324'} упражнений · картинки, GIF и техника на русском</div></div><button class="btn tiny" onclick="loadExerciseDB(true);toast('Обновляю базу')">Обновить</button></div><div class="setting"><div><b>Импорт из openGym</b><div class="muted small">JSON резервной копии</div></div><label class="btn tiny" for="ogImport">Импорт</label><input id="ogImport" type="file" accept=".json,application/json" hidden onchange="importOpenGym(this.files[0])"></div><div class="setting"><div><b>Экспорт для ChatGPT</b><div class="muted small">Тренировки, RPE и вес</div></div><button class="btn tiny" onclick="exportChat()">Экспорт</button></div><div class="setting"><div><b>Экспорт резервной копии</b><div class="muted small">Все локальные данные</div></div><button class="btn tiny" onclick="backup()">JSON</button></div><div class="setting"><div><b>Импорт резервной копии</b></div><label class="btn tiny" for="bkImport">Импорт</label><input id="bkImport" type="file" accept=".json,application/json" hidden onchange="restoreBackup(this.files[0])"></div><div class="setting"><button class="btn danger full" onclick="resetAll()">Сбросить всё</button></div></div>`)
}
async function importOpenGym(file){
  if(!file)return;try{const d=JSON.parse(await file.text());await loadExerciseDB();let imported=0;
    if(Array.isArray(d.bodyweight)&&d.bodyweight.length){st.bw=d.bodyweight.map(x=>({d:x.d,w:Number(x.w),t:x.t||Date.now()})).filter(x=>x.d&&x.w);imported+=st.bw.length}
    if(Array.isArray(d.workouts)&&d.workouts.length){const conv=d.workouts.map(convertOpenGymWorkout).filter(Boolean);st.sessions.push(...conv);imported+=conv.length}
    save();closeModal();render();toast(`Импортировано: ${imported}`)
  }catch(e){alert('Не удалось прочитать openGym JSON: '+e.message)}
}
function ogName(id){const x=ogLibrary.find(e=>e.id===String(id));return x?ruExerciseName(x.n):String(id||'Упражнение')}
function convertOpenGymWorkout(w){
  try{const entries=w.entries||w.ex||w.exercises||[];return{id:'og'+(w.id||Date.now()+Math.random()),date:w.d||w.date||iso(),w:0,c:'OG',name:w.name||w.n||'openGym',target:8,tempo:'',started:w.start||w.t||Date.now(),ended:w.end||w.t||Date.now(),ex:entries.map(e=>{const sets=e.sets||e.set||[];return{n:e.n||e.name||ogName(e.id),d:'Импортировано из openGym',rest:90,sourceId:e.id||null,mode:'reps',set:sets.map((x,i)=>({n:i+1,w:+(x.w??x.weight??0),r:+(x.r??x.reps??0),rpe:x.rpe??'',ok:x.done!==false}))}})}}catch(e){return null}
}
save();render();loadExerciseDB();
