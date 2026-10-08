'use strict';
if(!Array.isArray(st.programs))st.programs=[];
if(!Array.isArray(st.programTemplates))st.programTemplates=[];
if(!st.programUi)st.programUi={};
let programUi={pid:null,week:0,day:0,query:''};
function uid(p='id'){return `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}
function clone(x){return JSON.parse(JSON.stringify(x))}
const programModel=window.unvrslProgramModelV386;
if(!programModel)throw new Error('UNVRSL canonical program model is unavailable');
function programById(id){const p=programModel.findProgram(st.programs,id);return p?programModel.normalizeProgram(p,uid):null}
function templateById(id){const p=programModel.findProgram(st.programTemplates,id);return p?programModel.normalizeProgram(p,uid):null}
function ensureProgramShape(p){return programModel.normalizeProgram(p,uid)}
function migrateProgramsV386(){
 const result=programModel.normalizePrograms(st.programs,uid),templates=programModel.normalizePrograms(st.programTemplates,uid);
 st.programs=result.programs;st.programTemplates=templates.programs;
 window.__unvrslProgramsMigratedV386=true;
 const changed=result.changed||templates.changed;if(changed)try{save()}catch(error){console.warn('program migration v386',error)}
 return changed
}
migrateProgramsV386();
window.unvrslMigrateProgramsV386=migrateProgramsV386
const _planPageCoach=planPage;
planPage=function(){_planPageCoach();appendProgramStudio()}
function appendProgramStudio(){const root=$('#plan');if(!root)return;const list=st.programs.map(p=>`<div class="card coach-program"><div class="row between"><div class="grow"><div class="title">${esc(p.name)}</div><div class="muted small">${p.weeks.length} нед. · ${p.weeks.reduce((a,w)=>a+w.days.length,0)} тренировок</div></div><button class="btn tiny" onclick="openProgramEditor('${p.id}')">Открыть</button></div><div class="coach-actions"><button class="btn tiny" onclick="shareProgram('${p.id}')">Поделиться</button><button class="btn tiny" onclick="saveProgramAsTemplate('${p.id}')">В шаблоны</button><button class="btn tiny danger" onclick="deleteProgram('${p.id}')">Удалить</button></div></div>`).join('');root.insertAdjacentHTML('beforeend',`${window.intakeToolbarHtml?.()||''}<div class="section">МОИ ПРОГРАММЫ</div><div class="card"><div class="row between"><div><div class="title">Конструктор программ</div><div class="muted small">Недели, дни, упражнения, RPE, темп, отдых и методы сетов</div></div><button class="btn primary" onclick="newProgramSheet()">＋</button></div><div class="coach-actions"><button class="btn" onclick="templatesSheet()">Шаблоны</button><button class="btn" onclick="cloneBuiltInCycle()">Копия моего 8-недельного цикла</button></div></div>${list||'<div class="card muted">Пока нет своих программ.</div>'}`)}
function newProgramSheet(){modal(`<div class="sheet-grabber"></div><h2>Новая программа</h2><div class="field"><label>Название</label><input id="npName" value="Новая программа"></div><div class="field"><label>Количество недель</label><input id="npWeeks" type="number" min="3" max="12" value="8"></div><div class="field"><label>Тренировок в неделю</label><input id="npDays" type="number" min="1" max="5" value="3"></div><div class="field"><label>Дата начала</label><input id="npStart" type="date" value="${iso()}"></div><div class="field"><label>Целевая дата (необязательно)</label><input id="npTarget" type="date"></div><div class="field"><label>Цель цикла</label><input id="npGoal" placeholder="Например, увеличить рабочие веса"></div><div class="field"><label>Приоритет</label><select id="npPriority"><option value="strength">Сила</option><option value="hypertrophy">Гипертрофия</option></select></div><label><input id="npTest" type="checkbox" checked> Тестовая неделя</label><button class="btn primary full" onclick="createProgram()">Создать</button>`)}
function createProgram(){
 if(window.__unvrslProgramCreatingV386)return false;
 const name=String($('#npName')?.value||'').trim()||'Программа',wc=Math.max(1,Math.min(16,+$('#npWeeks')?.value||4)),dc=Math.max(1,Math.min(7,+$('#npDays')?.value||3));
 let cycle;try{cycle=WorkoutDomain.generateCycle({weeks:wc,daysPerWeek:dc,startDate:$('#npStart')?.value||iso(),targetDate:$('#npTarget')?.value||null,goal:$('#npGoal')?.value||'',priority:$('#npPriority')?.value||'strength',testWeek:$('#npTest')?.checked!==false})}catch(error){toast(error.message);return false}
 const p=ensureProgramShape({id:uid('prog'),name,created:Date.now(),updated:Date.now(),...cycle});
 p.weeks.forEach(w=>w.days.forEach(d=>d.id=uid('day')));
 window.__unvrslProgramCreatingV386=true;
 try{st.programs.push(p);save();openProgramEditor(p.id,0,0)}catch(error){st.programs=st.programs.filter(item=>item!==p);console.error('program create v386',error);toast('Не удалось сохранить программу')}finally{queueMicrotask(()=>{window.__unvrslProgramCreatingV386=false})}
 return false
}
function deleteProgram(id){const p=programById(id);if(!p||!confirm(`Удалить программу «${p.name}»?`))return;st.programs=st.programs.filter(x=>x.id!==id);save();closeModal();planPage()}
function openProgramEditor(id,week=0,day=0){
 const p=programById(id);if(!p){toast('Программа не найдена');return false}
 const active=document.querySelector('.page.active')?.id;if(active==='programs'||active==='plan')window.__unvrslProgramEditorReturnPageV386=active;
 ensureProgramShape(p);programUi={pid:String(p.id),week:Math.max(0,Math.min(Number(week)||0,Math.max(0,p.weeks.length-1))),day:Math.max(0,Number(day)||0),query:''};
 try{renderProgramEditor();return false}catch(error){console.error('program open v386',error);toast('Не удалось открыть программу');return false}
}
function programEditorCloseV386(){
 const target=window.__unvrslProgramEditorReturnPageV386;closeModal();
 if(target==='programs'&&typeof window.trainerProgramsPage==='function')window.trainerProgramsPage();else planPage()
}
window.programEditorCloseV386=programEditorCloseV386;window.programEditorCloseV385=programEditorCloseV386
function renderProgramEditor(){
 const p=programById(programUi.pid);if(!p)return false;ensureProgramShape(p);
 const w=p.weeks[programUi.week]||p.weeks[0];if(!w)return false;
 const sheet=document.getElementById('sheet'),key=`${p.id}|${programUi.week}`,keep=sheet?.dataset?.programEditorKey===key&&document.getElementById('modal')?.classList.contains('show'),scroll=keep?sheet.scrollTop:0;
 modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${esc(p.name)}</h2><div class="muted">Конструктор программы</div></div><button class="btn tiny" onclick="programEditorCloseV386()">✕</button></div><div class="weekbar">${p.weeks.map((x,i)=>`<button class="weekbtn ${i===programUi.week?'on':''}" onclick="programUi.week=${i};renderProgramEditor()">W${i+1}</button>`).join('')}</div><div class="coach-actions"><button class="btn tiny" onclick="renameProgramSheet('${p.id}')">Переименовать</button><button class="btn tiny" onclick="copyProgramWeek('${p.id}',${programUi.week})">Копировать неделю</button><button class="btn tiny" onclick="addProgramWeek('${p.id}')">＋ Неделя</button></div>${window.cycleEditorHtml?.(p,programUi.week)||''}${window.intakeReviewBanner?.(p)||''}<div class="section">НЕДЕЛЯ ${programUi.week+1}</div>${w.days.map((d,di)=>programDayCard(p,w,d,di)).join('')}<button class="btn full" onclick="addProgramDay('${p.id}',${programUi.week})">＋ Добавить тренировку</button><div class="coach-actions"><button class="btn primary" onclick="shareProgram('${p.id}')">Поделиться программой</button><button class="btn" onclick="saveProgramAsTemplate('${p.id}')">Сохранить как шаблон</button></div>`);
 const next=document.getElementById('sheet');if(next){next.dataset.programEditorKey=key;next.scrollTop=keep?scroll:0}document.getElementById('modal')?.classList.add('px-program-modal');
 window.dispatchEvent(new CustomEvent('unvrsl:program-editor-rendered',{detail:{key}}));return true
}
function programDayCard(p,w,d,di){return `<div class="card program-day"><div class="row between"><div class="grow"><b>${esc(d.name)}</b><div class="muted small">${d.ex.length} упражнений</div></div><button class="btn tiny primary" data-program-editor-start="1" onclick="return programStartFromEditorV386(event,'${p.id}',${programUi.week},${di})">Старт</button></div><div class="coach-actions"><button class="btn tiny" onclick="renameProgramDaySheet('${p.id}',${programUi.week},${di})">Название</button><button class="btn tiny" onclick="chooseProgramExercise('${p.id}',${programUi.week},${di})">＋ Упражнение</button><button class="btn tiny danger" onclick="deleteProgramDay('${p.id}',${programUi.week},${di})">Удалить день</button></div>${d.ex.length?d.ex.map((e,ei)=>programExerciseRow(p,d,e,ei)).join(''):'<div class="muted small" style="padding:12px 2px">Добавь упражнения из русской базы.</div>'}</div>`}
function programExerciseRow(p,d,e,ei){const method=e.method&&e.method!=='STANDARD'?e.method:'';return `<div class="program-ex" draggable="true" ondragstart="programDragStart(event,'${p.id}',${programUi.week},'${d.id}',${ei})" ondragover="event.preventDefault()" ondrop="programDrop(event,'${p.id}',${programUi.week},'${d.id}',${ei})"><div class="row between"><div class="grow"><b>${esc(e.n)}</b><div class="muted small">${prescriptionText(e)}${method?` · ${method}`:''}</div></div><button class="btn tiny" onclick="editProgramExercise('${p.id}',${programUi.week},'${d.id}',${ei})">Изм.</button></div>${window.cycleExercisePreview?.(p,d,e)||''}<div class="mini-actions"><button onclick="moveProgramExercise('${p.id}',${programUi.week},'${d.id}',${ei},-1)">↑</button><button onclick="moveProgramExercise('${p.id}',${programUi.week},'${d.id}',${ei},1)">↓</button><button class="danger-text" onclick="removeProgramExercise('${p.id}',${programUi.week},'${d.id}',${ei})">Удалить</button></div></div>`}
function prescriptionText(e){
 const s=e.sets||[];if(!s.length)return'—';
 let resolved=null;try{if(programUi?.pid&&typeof window.programResolveExerciseParametersV381==='function')resolved=window.programResolveExerciseParametersV381(programUi.pid,programUi.week,e)}catch(_){}
 const range=resolved?.reps?.mode==='method'?null:(resolved?.reps||programModel.range(e)),repText=range?programModel.formatRange(range):'',rpe=resolved?.effort?programModel.formatRange({min:resolved.effort.rpeMin,max:resolved.effort.rpeMax}):(e.rpe||8),weight=resolved?.weight?.mode==='auto'?'Авто':`${s[0]?.w||0} кг`;
 if(e.method==='STANDARD')return `${s.length}×${repText||s[0]?.r||'—'} · ${weight} · RPE ${rpe}`;
 if(e.method==='FST-7')return `7×${repText||s[0]?.r||'—'} · ${weight} · RPE ${rpe}`;
 if(e.method==='UNVRSL'){
  const heavy=s.find(x=>x.role==='heavy')||s[0],light=s.find(x=>x.role==='light')||s[1],middle=s.find(x=>x.role==='middle')||s[6],middleCount=s.filter(x=>x.role==='middle').length||(s.length>6?s.length-6:0);
  return `3×(${heavy?.w||0}×${heavy?.r||3} + 30с + ${light?.w||0}×${light?.r||9})${middle&&middleCount?`, затем ${middleCount}×${middle.r||6} · ${middle.w||0} кг`:''}`
 }
 if(e.method==='SLDR')return s.map(x=>x.r||'—').join('/')+` · ${s[0]?.w||0} кг · 15с`;
 return s.map(x=>`${x.label||''} ${x.w||0}×${x.r||'—'}`.trim()).join(' → ')
}
function renameProgramSheet(id){const p=programById(id);if(!p)return;modal(`<div class="sheet-grabber"></div><h2>Название программы</h2><div class="field"><input id="rpName" value="${esc(p.name)}"></div><button class="btn primary full" onclick="renameProgram('${id}')">Сохранить</button>`)}
async function renameProgram(id){const p=programById(id);if(!p)return;p.name=$('#rpName').value.trim()||p.name;p.nameEdited=true;p.updated=p.updatedAt=Date.now();if(await persistWorkoutState()===false)return toast('Не удалось сохранить название. Повтори попытку');openProgramEditor(id,programUi.week);toast('Название сохранено')}
function renameProgramDaySheet(id,wi,di){const p=programById(id),d=p?.weeks?.[wi]?.days?.[di];if(!d)return;modal(`<div class="sheet-grabber"></div><h2>Название тренировки</h2><div class="field"><input id="rdName" value="${esc(d.name)}"></div><button class="btn primary full" onclick="renameProgramDay('${id}',${wi},${di})">Сохранить</button>`)}
function renameProgramDay(id,wi,di){const p=programById(id),d=p?.weeks?.[wi]?.days?.[di];if(!d)return;d.name=$('#rdName').value.trim()||d.name;p.updated=Date.now();save();openProgramEditor(id,wi,di)}
function addProgramWeek(id){const p=programById(id);if(!p)return;const prev=p.weeks.at(-1);const days=(prev?.days||[]).map((d,i)=>({id:uid('day'),name:d.name||`День ${i+1}`,ex:[]}));p.weeks.push({n:p.weeks.length+1,days:days.length?days:[{id:uid('day'),name:'День 1',ex:[]}]});p.updated=Date.now();save();programUi.week=p.weeks.length-1;renderProgramEditor()}
function copyProgramWeek(id,wi){const p=programById(id),w=p?.weeks?.[wi];if(!w)return;const nw=clone(w);nw.n=p.weeks.length+1;nw.days.forEach(d=>d.id=uid('day'));p.weeks.splice(wi+1,0,nw);p.weeks.forEach((x,i)=>x.n=i+1);p.updated=Date.now();save();programUi.week=wi+1;renderProgramEditor();toast('Неделя скопирована')}
function addProgramDay(id,wi){const p=programById(id),w=p?.weeks?.[wi];if(!w)return;w.days.push({id:uid('day'),name:`День ${w.days.length+1}`,ex:[]});p.updated=Date.now();save();renderProgramEditor()}
function deleteProgramDay(id,wi,di){const p=programById(id),w=p?.weeks?.[wi];if(!w||w.days.length<=1)return toast('В неделе должна остаться хотя бы одна тренировка');if(!confirm('Удалить эту тренировку?'))return;w.days.splice(di,1);p.updated=Date.now();save();renderProgramEditor()}
function chooseProgramExercise(pid,wi,di,q=''){const p=programById(pid);if(!p)return;programUi={pid,week:wi,day:di,query:q};if(!ogLibraryLoaded&&!ogLibraryLoading)loadExerciseDB();const records=catalogRecords().filter(e=>{const h=`${e.custom?e.n:ruExerciseName(e.n)} ${e.n} ${ruTarget(e.tg)} ${BP_RU[e.bp]||''}`.toLowerCase();return !q||h.includes(q.toLowerCase())}).slice(0,80);modal(`<div class="sheet-grabber"></div><div class="row between"><h2>Добавить упражнение</h2><button class="btn tiny" onclick="openProgramEditor('${pid}',${wi},${di})">←</button></div><input id="progSearch" class="search" placeholder="Поиск упражнения" value="${esc(q)}" oninput="programSearchDebounce('${pid}',${wi},${di},this.value)"><div class="program-pick-list">${records.map(e=>`<button class="card exlib exlib-btn" onclick="programExerciseSettings('${pid}',${wi},${di},'${encodeURIComponent(e.id)}')"><div class="exercise-list-row">${e.custom?'<div class="ex-thumb placeholder">🏋︎</div>':(e.image?`<img class="ex-thumb" src="${mediaUrl(e.image)}" loading="lazy">`:'<div class="ex-thumb placeholder">🏋︎</div>')}<div class="grow"><b>${esc(e.custom?e.n:ruExerciseName(e.n))}</b><div class="catalog-meta">${esc(BP_RU[e.bp]||'')} · ${esc(EQ_RU[e.eq]||'')}</div></div><span class="chev">›</span></div></button>`).join('')||'<div class="card muted">Ничего не найдено.</div>'}</div>`)}
let progSearchTimer=null;function programSearchDebounce(pid,wi,di,v){clearTimeout(progSearchTimer);progSearchTimer=setTimeout(()=>chooseProgramExercise(pid,wi,di,v),180)}
function programExerciseSettings(pid,wi,di,token,existingIndex=null){const ex=findExercise(token);if(!ex)return toast('Упражнение не найдено');const n=ex.custom?(ex.raw||ex.n):ruExerciseName(ex.n),sourceId=ex.custom?null:(ex.rawId||String(ex.id).replace(/^og:/,''));programExerciseForm({pid,wi,di,n,sourceId,bp:ex.bp,tg:ex.tg,eq:ex.eq,existingIndex})}
function editProgramExercise(pid,wi,dayId,ei){const p=programById(pid),w=p?.weeks?.[wi],d=w?.days?.find(x=>x.id===dayId),e=d?.ex?.[ei];if(!e)return;programUi.day=w.days.indexOf(d);programExerciseForm({...clone(e),pid,wi,di:programUi.day,existingIndex:ei})}
function programExerciseForm(x){const e=x.existingIndex!==null&&x.existingIndex!==undefined?programById(x.pid)?.weeks?.[x.wi]?.days?.[x.di]?.ex?.[x.existingIndex]:null;const method=e?.method||'STANDARD',first=e?.sets?.[0]||{};modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${esc(x.n)}</h2><div class="muted">Настройка упражнения</div></div><button class="btn tiny" onclick="openProgramEditor('${x.pid}',${x.wi},${x.di})">←</button></div><div class="field"><label>Метод</label><select id="pmMethod" onchange="programMethodDefaults(this.value)"><option value="STANDARD" ${method==='STANDARD'?'selected':''}>Обычные подходы</option><option value="UNVRSL" ${method==='UNVRSL'?'selected':''}>UNVRSL</option><option value="SLDR" ${method==='SLDR'?'selected':''}>SLDR</option><option value="DS" ${method==='DS'?'selected':''}>Дроп-сет</option><option value="FST-7" ${method==='FST-7'?'selected':''}>FST-7</option></select></div><div class="method-builder-grid"><div class="field"><label>Подходов / фаз</label><input id="pmSets" type="number" min="1" max="10" value="${e?.sets?.length||3}"></div><div class="field"><label>Повторы</label><input id="pmReps" type="number" min="1" max="50" value="${first.r||10}"></div><div class="field"><label>Вес, кг</label><input id="pmWeight" inputmode="decimal" value="${first.w||0}"></div><div class="field"><label>Целевой RPE</label><input id="pmRpe" inputmode="decimal" value="${e?.rpe||8}"></div><div class="field"><label>Темп</label><input id="pmTempo" value="${esc(e?.tempo||'2-0-2')}"></div><div class="field"><label>Отдых после блока, сек</label><input id="pmRest" type="number" value="${e?.rest||90}"></div></div><div class="field"><label>Комментарий</label><input id="pmNote" value="${esc(e?.note||'')}"></div><div id="methodHint" class="method-hint">${methodHint(method)}</div><button class="btn primary full" onclick="saveProgramExercise('${x.pid}',${x.wi},${x.di},'${encodeURIComponent(x.n)}','${x.sourceId||''}','${x.bp||''}','${x.tg||''}','${x.eq||''}',${x.existingIndex===null||x.existingIndex===undefined?'null':x.existingIndex})">${x.existingIndex===null||x.existingIndex===undefined?'Добавить':'Сохранить'}</button>`)}
function methodHint(m){return m==='UNVRSL'?'3 фазы: тяжёлая → средняя → объёмная, 30 сек между фазами':m==='SLDR'?'Мини-подходы с коротким отдыхом 15 сек':m==='DS'?'Последовательные сбросы веса без отдыха':m==='FST-7'?'7 подходов с коротким отдыхом 30 сек':'Обычные рабочие подходы'}
function programMethodDefaults(m){const sets=$('#pmSets'),rest=$('#pmRest'),hint=$('#methodHint');if(m==='UNVRSL'){sets.value=3;rest.value=120}else if(m==='SLDR'){sets.value=3;rest.value=90}else if(m==='DS'){sets.value=4;rest.value=90}else if(m==='FST-7'){sets.value=7;rest.value=30}else{if(+sets.value>5)sets.value=3;rest.value=90}if(hint)hint.textContent=methodHint(m)}
function buildMethodSets(method,count,w,r,rest){count=Math.max(1,Math.min(10,count));const out=[];for(let i=0;i<count;i++){let weight=w,reps=r,label=String(i+1),between=rest;if(method==='UNVRSL'){const f=[1,.85,.7][i]??Math.max(.55,1-i*.12);weight=roundLoad(w*f,2.5);reps=[Math.max(1,Math.round(r*.35)),r,Math.round(r*1.35)][i]||r;label=`${i+1}/${count}`;between=i<count-1?30:rest}else if(method==='SLDR'){weight=w;reps=Math.max(1,r-i*2);label=`${i+1}/${count}`;between=i<count-1?15:rest}else if(method==='DS'){weight=roundLoad(w*Math.pow(.8,i),2.5);reps=Math.max(1,r);label=`DS${i+1}`;between=i<count-1?0:rest}else if(method==='FST-7'){weight=w;reps=r;label=`${i+1}/7`;between=i<count-1?30:rest}out.push({label,w:weight,r:reps,rest:between})}return out}
function roundLoad(v,step=2.5){if(!v)return 0;return Math.round(v/step)*step}
function saveProgramExercise(pid,wi,di,nameToken,sourceId,bp,tg,eq,existingIndex){const p=programById(pid),d=p?.weeks?.[wi]?.days?.[di];if(!d)return;const n=decodeURIComponent(nameToken),method=$('#pmMethod').value,count=+$('#pmSets').value||3,r=+$('#pmReps').value||10,w=Number(String($('#pmWeight').value).replace(',','.'))||0,rpe=Number(String($('#pmRpe').value).replace(',','.'))||8,tempo=$('#pmTempo').value.trim()||'2-0-2',rest=Math.max(0,+$('#pmRest').value||90),note=$('#pmNote').value.trim();const obj={id:uid('pex'),n,sourceId:sourceId||null,bp,tg,eq,method,rpe,tempo,rest,note,sets:buildMethodSets(method,count,w,r,rest)};if(existingIndex===null||Number.isNaN(existingIndex))d.ex.push(obj);else d.ex[existingIndex]=obj;p.updated=Date.now();save();openProgramEditor(pid,wi,di)}
function removeProgramExercise(pid,wi,dayId,ei){const p=programById(pid),d=p?.weeks?.[wi]?.days?.find(x=>x.id===dayId);if(!d)return;d.ex.splice(ei,1);p.updated=Date.now();save();renderProgramEditor()}
function moveProgramExercise(pid,wi,dayId,ei,dir){const p=programById(pid),d=p?.weeks?.[wi]?.days?.find(x=>x.id===dayId);if(!d)return;const ni=ei+dir;if(ni<0||ni>=d.ex.length)return;[d.ex[ei],d.ex[ni]]=[d.ex[ni],d.ex[ei]];p.updated=Date.now();save();renderProgramEditor()}
let dragProgram=null;function programDragStart(ev,pid,wi,dayId,ei){dragProgram={pid,wi,dayId,ei};try{ev.dataTransfer.effectAllowed='move'}catch(e){}}
function programDrop(ev,pid,wi,dayId,ei){ev.preventDefault();if(!dragProgram||dragProgram.pid!==pid||dragProgram.wi!==wi||dragProgram.dayId!==dayId)return;const p=programById(pid),d=p?.weeks?.[wi]?.days?.find(x=>x.id===dayId);if(!d)return;const [item]=d.ex.splice(dragProgram.ei,1);d.ex.splice(ei,0,item);dragProgram=null;p.updated=Date.now();save();renderProgramEditor()}
function programWorkoutRepTarget(b,q,x){
 const n=v=>{if(v===''||v==null)return null;const z=Number(v);return Number.isFinite(z)&&z>0?z:null},method=String(b?.method||'STANDARD').toUpperCase(),mode=q?.reps?.mode||b?.reps?.mode||(method==='UNVRSL'||method==='SLDR'?'method':'auto'),planned=n(x?.r);
 const pair=mode==='method'?{min:planned??1,max:planned??1}:{min:n(q?.reps?.min)??planned??1,max:n(q?.reps?.max)??n(q?.reps?.min)??planned??1},min=Math.min(pair.min,pair.max),max=Math.max(pair.min,pair.max);
 return{r:'',programR:planned??min,targetRepMin:min,targetRepMax:max,targetRepLabel:programModel.formatRange({min,max}),repMode:mode}
}
function beginProgramDay(pid,wi,di){
 if(window.intakeDraftBlocked?.(programById(pid)))return;
 const p=programById(pid),d=p?.weeks?.[wi]?.days?.[di];if(!p||!d)return;if(st.current){toast('У вас есть незавершённая тренировка');nav('start');return;}
 let conditioning=[];try{conditioning=(d.conditioning||[]).map(x=>window.ConditioningClock.create(x))}catch(e){toast(e.message);return}
 const ex=[],resolved=b=>typeof window.programResolveExerciseParametersV381==='function'?window.programResolveExerciseParametersV381(pid,wi,b):null;
 const effort=(b,q)=>{const min=q?.effort?.rpeMin??b.rpeMin??b.rpe??8,max=q?.effort?.rpeMax??b.rpeMax??b.rpe??8;return{target:Math.round(((min+max)/2)*2)/2,targetRpeMin:min,targetRpeMax:max,targetRirMin:Math.max(0,10-max),targetRirMax:Math.max(0,10-min)}};
 d.ex.forEach(b=>{
  const group=uid('g'),q=resolved(b),ef=effort(b,q),rest=q?.rest?.value??b.rest??90,tempo=(q?.tempo?.value??b.tempo)||'',equipment={exerciseId:b.exerciseId||null,techniqueId:b.techniqueId||null,kind:b.kind||null,loadType:b.loadType||null,cycleManaged:b.cycleManaged||false,equipmentProfileId:b.equipmentProfileId||null,equipmentProfile:b.equipmentProfile||null};
  if(b.method==='STANDARD')ex.push({n:b.n,d:b.note||'',rest,g:null,sourceId:b.sourceId||null,...equipment,...ef,tempo,method:'STANDARD',mode:'reps',set:(b.sets||[]).map((x,i)=>({n:i+1,w:+x.w||0,...programWorkoutRepTarget(b,q,x),rpe:'',...ef,...(b.cycleManaged?{role:x.role,targetRepMin:x.targetRepMin,targetRepMax:x.targetRepMax,targetRpeMin:x.targetRpeMin,targetRpeMax:x.targetRpeMax}:{}),ok:false}))});
  else if(b.method==='FST-7')ex.push({n:`${b.n} — FST-7`,d:b.note||'',rest:30,fullRest:rest,g:group,sourceId:b.sourceId||null,...equipment,...ef,tempo,method:b.method,mode:'reps',set:(b.sets||[]).map((x,i)=>({n:i+1,w:+x.w||0,...programWorkoutRepTarget(b,q,x),rpe:'',...ef,...(b.cycleManaged?{role:x.role,targetRepMin:x.targetRepMin,targetRepMax:x.targetRepMax,targetRpeMin:x.targetRpeMin,targetRpeMax:x.targetRpeMax}:{}),ok:false}))});
  else (b.sets||[]).forEach((x,i)=>{const suffix=b.method==='DS'?`DS DS${i+1}`:`${b.method} ${i+1}/${b.sets.length}`;ex.push({n:`${b.n} — ${suffix}`,phaseLabel:x.label||`${i+1}/${b.sets.length}`,phaseRole:x.role||null,d:b.note||'',rest:+x.rest||0,fullRest:rest,g:group,sourceId:b.sourceId||null,...equipment,...ef,tempo:x.tempo||tempo,method:b.method,mode:'reps',set:[{n:1,w:+x.w||0,...programWorkoutRepTarget(b,q,x),rpe:'',...ef,...(b.cycleManaged?{role:x.role,targetRepMin:x.targetRepMin,targetRepMax:x.targetRepMax,targetRpeMin:x.targetRpeMin,targetRpeMax:x.targetRpeMax}:{}),ok:false}]})})
 });
 const first=d.ex[0],firstResolved=first?resolved(first):null,firstEffort=first?effort(first,firstResolved):{target:8,targetRpeMin:8,targetRpeMax:8,targetRirMin:2,targetRirMax:2};
 st.current={id:uid('s'),date:iso(),w:wi+1,c:d.name,name:p.name,...firstEffort,tempo:'',started:Date.now(),ended:null,programId:String(p.id),programDayId:String(d.id),programName:p.name,programSchemaVersion:programModel.SCHEMA_VERSION,dayRole:d.role||'Middle',weeklyLoadProfile:p.weeks[wi].weeklyLoadProfile,deload:!!p.weeks[wi].deload,testWeek:!!p.weeks[wi].testWeek,ex,conditioning};save();closeModal();nav('start')
}
window.programBeginDayCoreV382=beginProgramDay;
function saveProgramAsTemplate(id){const p=programById(id);if(!p||window.intakeDraftBlocked?.(p))return;const t=clone(p);delete t.intakeDraft;delete t.intakeSourceKey;t.id=uid('tpl');t.sourceProgramId=p.id;t.created=Date.now();st.programTemplates.push(t);save();toast('Шаблон сохранён')}
function templatesSheet(){modal(`<div class="sheet-grabber"></div><div class="row between"><h2>Шаблоны</h2><button class="btn tiny" onclick="closeModal()">✕</button></div>${st.programTemplates.map(t=>`<div class="card"><div class="row between"><div><b>${esc(t.name)}</b><div class="muted small">${t.weeks.length} нед.</div></div><button class="btn tiny primary" onclick="createFromTemplate('${t.id}')">Использовать</button></div><button class="btn tiny danger" style="margin-top:10px" onclick="deleteTemplate('${t.id}')">Удалить шаблон</button></div>`).join('')||'<div class="card muted">Сохрани любую программу как шаблон.</div>'}<div class="card"><b>Мой 8-недельный цикл</b><div class="muted small">Можно сделать редактируемую копию встроенного цикла.</div><button class="btn primary" style="margin-top:12px" onclick="cloneBuiltInCycle()">Создать копию</button></div>`)}
function createFromTemplate(id){const t=templateById(id);if(!t)return;const p=clone(t);p.id=uid('prog');p.name=`${t.name} — копия`;p.created=Date.now();p.updated=Date.now();p.weeks.forEach(w=>w.days.forEach(d=>d.id=uid('day')));st.programs.push(p);save();openProgramEditor(p.id)}
function deleteTemplate(id){st.programTemplates=st.programTemplates.filter(x=>x.id!==id);save();templatesSheet()}
function cloneBuiltInCycle(){const weeks=[];for(let wi=1;wi<=8;wi++){const rs=ROUTINES.filter(r=>r.w===wi);weeks.push({n:wi,days:rs.map(r=>({id:uid('day'),name:`${r.c} · ${r.t}`,ex:groupIndexedEntries(routineEntries(r)).map(g=>builtInGroupToProgramExercise(r,g))}))})}const p={id:uid('prog'),name:'Мой 8-недельный цикл — копия',created:Date.now(),updated:Date.now(),weeks};st.programs.push(p);save();closeModal();openProgramEditor(p.id);toast('Создана редактируемая копия')}
function builtInGroupToProgramExercise(r,g){const method=methodType(g.entries)||'STANDARD',sets=[];g.entries.forEach((e,li)=>{const cnt=Math.max(1,e.s||1);for(let i=0;i<cnt;i++)sets.push({label:variantLabel(e.n,i),w:+e.w||0,r:+e.r||0,rest:rest(r,routineEntries(r)[g.indices[li]],g.indices[li])})});const meta=inferCustomMeta(g.base);return{id:uid('pex'),n:displayExerciseName(g.base),sourceId:g.entries[0]?.sourceId||null,bp:meta.bp,tg:meta.tg,eq:meta.eq,method,rpe:RPE[r.w],tempo:tempoOnly(r.p||''),rest:sets.at(-1)?.rest||90,note:g.entries.map(e=>e.d||'').filter(Boolean).join(' · '),sets}}
async function encodeSharedPayload(obj){const text=JSON.stringify(obj),bytes=new TextEncoder().encode(text);if('CompressionStream'in window){const cs=new CompressionStream('deflate-raw'),writer=cs.writable.getWriter();writer.write(bytes);writer.close();const buf=await new Response(cs.readable).arrayBuffer();return'c.'+bytesToBase64Url(new Uint8Array(buf))}return'u.'+bytesToBase64Url(bytes)}
async function decodeSharedPayload(s){const [kind,data]=s.split('.',2);let bytes=base64UrlToBytes(data||kind);if(kind==='c'&&'DecompressionStream'in window){const ds=new DecompressionStream('deflate-raw'),writer=ds.writable.getWriter();writer.write(bytes);writer.close();bytes=new Uint8Array(await new Response(ds.readable).arrayBuffer())}return JSON.parse(new TextDecoder().decode(bytes))}
function bytesToBase64Url(bytes){let bin='';bytes.forEach(b=>bin+=String.fromCharCode(b));return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function base64UrlToBytes(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s);return Uint8Array.from(bin,c=>c.charCodeAt(0))}
async function shareProgram(id){const p=programById(id);if(!p||window.intakeDraftBlocked?.(p))return;const clean=clone(p);delete clean.id;delete clean.intakeDraft;delete clean.intakeSourceKey;const payload=await encodeSharedPayload({type:'unvrsl-program',v:1,program:clean});const url=`${location.origin}${location.pathname}#plan=${payload}`;try{if(navigator.share)await navigator.share({title:`UNVRSL FIT · ${p.name}`,text:`Программа «${p.name}»`,url});else{await navigator.clipboard.writeText(url);toast('Ссылка скопирована')}}catch(e){if(e.name!=='AbortError')prompt('Скопируй ссылку',url)}}
async function handleSharedProgram(){
 if(!window.__unvrslStartupComplete)return;
 const hash=location.hash||'',preset=new URLSearchParams(location.search).get('program');
 if(!hash.startsWith('#plan=')&&preset!=='functional-8')return;
 try{
  let payload;
  if(preset==='functional-8'){const r=await fetch('./programs/functional-8.json');if(!r.ok)throw Error('Не удалось загрузить программу');payload={type:'unvrsl-program',program:await r.json()}}
  else payload=await decodeSharedPayload(hash.slice(6));
  if(payload?.type!=='unvrsl-program'||!Array.isArray(payload.program?.weeks)||!payload.program.weeks.length)throw Error('Неверный формат программы');
  const p=payload.program;window.__sharedProgram=payload;
  modal(`<h2>Добавить программу</h2><div class="card"><div class="title">${esc(p.name||'Программа')}</div><div class="muted">${p.weeks.length} нед. · ${p.weeks.reduce((a,w)=>a+(w.days?.length||0),0)} тренировок</div></div><button class="btn primary full" onclick="importSharedProgram()">Добавить к себе</button><p id="programImportStatus" role="status"></p><button class="btn full" onclick="dismissSharedProgram()">Не сейчас</button>`)
 }catch(e){console.error(e);modal('<h2>Не удалось открыть программу</h2><p>Проверь соединение и повтори загрузку.</p><button class="btn primary full" onclick="handleSharedProgram()">Повторить</button>')}
}
let programImportBusy=false;
async function importSharedProgram(){
 const payload=window.__sharedProgram;if(!payload?.program||programImportBusy)return;
 programImportBusy=true;
 try{
  const incoming=clone(payload.program),rawId=String(incoming.id||''),stableId=/^[a-zA-Z0-9_-]{1,100}$/.test(rawId)?rawId:'';
  let p=stableId?st.programs.find(x=>String(x.id)===stableId):null;
  if(!p){p=incoming;p.id=stableId||uid('prog');p.name=p.name||'Полученная программа';p.created=p.updated=p.createdAt=p.updatedAt=Date.now();ensureProgramShape(p);p.weeks.forEach(w=>w.days.forEach(d=>d.id=uid('day')));st.programs.push(p)}
  st.deletedProgramKeys=(st.deletedProgramKeys||[]).filter(k=>k!==`id:${p.id}`);
  try{const key='unvrsl-fit-deleted-programs-v2';const keys=JSON.parse(localStorage.getItem(key)||'[]');localStorage.setItem(key,JSON.stringify(keys.filter(k=>k!==`id:${p.id}`)))}catch(_){}
  const ok=window.persistWorkoutState?await window.persistWorkoutState():save();if(ok===false)throw Error('Не удалось сохранить. Повтори добавление.');
  clearSharedProgramUrl();window.__sharedProgram=null;closeModal();nav('programs');window.trainerProgramsPage?.();openProgramEditor(p.id,0,0);toast('Программа сохранена')
 }catch(e){const status=document.getElementById('programImportStatus');if(status)status.textContent=e.message||'Не удалось сохранить программу';else toast('Не удалось сохранить программу')}
 finally{programImportBusy=false}
}
function clearSharedProgramUrl(){const u=new URL(location.href);u.searchParams.delete('program');u.hash='';history.replaceState(null,'',u.pathname+u.search)}
function dismissSharedProgram(){window.__sharedProgram=null;clearSharedProgramUrl();closeModal()}
window.addEventListener('unvrsl:app-ready',handleSharedProgram);
window.addEventListener('hashchange',handleSharedProgram);
save();setTimeout(()=>{planPage();if(window.__unvrslStartupComplete)handleSharedProgram()},0);

// Cycle UI delegates all training arithmetic to WorkoutDomain.
window.cycleEditorHtml=function(p,wi){
 const w=p.weeks[wi],profile=w?.weeklyLoadProfile;
 const phases=Object.values(WorkoutDomain.weekProfiles);
 const labels=(spec,test=false)=>test?'90–100%+ · 2×2–4 + 1×1 · RPE 9–10':spec.sets?`${spec.pct.join('–')}% · ${spec.sets}×${spec.reps.join('–')} · RPE ${spec.rpe.join('–')} · RIR ${spec.rir.join('–')}`:'не назначается';
 const warnings=profile?['base','isolation'].flatMap(k=>WorkoutDomain.validatePrescription(profile[k]).warnings.map(x=>`${k==='base'?'База':'Изоляция'}: ${x}`)):[];
 return `<div class="card"><details><summary>Периодизация · ${p.weeks.length} недель · ${w.days.length} дней</summary><p class="small muted">${esc(p.cycleOptions?.goal||'Цель не задана')} · ${esc(p.cycleOptions?.startDate||'')} → ${esc(p.cycleOptions?.targetDate||'')}</p>${p.weeks.map((x,i)=>`<div class="listline small">W${i+1} · ${esc(x.weeklyLoadProfile?.focus||x.focus||'Ручная неделя')}${x.deload?' · разгрузка':''}${x.testWeek?' · тест':''}${x.weeklyLoadProfile?`<br>База: ${labels(x.weeklyLoadProfile.base,x.testWeek)}<br>Изоляция: ${labels(x.weeklyLoadProfile.isolation)}`:''}<br>${(x.days||[]).map(d=>esc(d.role||'Middle')).join(' / ')}</div>`).join('')}</details><div class="field"><label>Фаза выбранной недели</label><select onchange="cycleReplacePhase('${p.id}',${wi},this.value)">${phases.map(x=>`<option value="${x.phase}" ${profile?.phase===x.phase?'selected':''}>${esc(x.focus)}</option>`).join('')}</select></div>${warnings.map(x=>`<p class="small" style="color:var(--orange)">${esc(x)}</p>`).join('')}<p class="small muted">Добавь упражнения в первую неделю и сформируй цикл. Повторения одного упражнения в разные дни делят его недельные подходы. Ручные веса сохраняются.</p>${p.previousCycle?`<button class="btn full" onclick="cycleUndo('${p.id}')">Отменить формирование цикла</button>`:''}<button class="btn full" onclick="cycleBuildFromFirstWeek('${p.id}')">Сформировать цикл из первой недели</button></div>`;
};
window.cycleBuildFromFirstWeek=function(pid){
 const p=programById(pid);if(!p)return;
 const first=p.weeks[0],source=new Map();
 first.days.forEach((d,di)=>(d.ex||[]).forEach(e=>{
  const key=[e.exerciseId||e.sourceId||e.n,e.equipmentProfileId||'',e.techniqueId||'',e.loadType||'',e.method||'STANDARD'].join('|');
  const old=source.get(key);if(old)old.dayIndices.push(di);else source.set(key,{...clone(e),dayIndices:[di]});
 }));
 if(!source.size)return toast('Сначала добавь упражнения в первую неделю');
 try{
  const options={weeks:p.weeks.length,daysPerWeek:first.days.length,startDate:iso(),testWeek:true,priority:'strength',...p.cycleOptions,exercises:[...source.values()]};
  const cycle=WorkoutDomain.generateCycle(options);
  // Keep one reversible program snapshot, never modify performed workouts.
  p.previousCycle={weeks:clone(p.weeks),cycleOptions:clone(p.cycleOptions||{}),cycleSources:clone(p.cycleSources||[])};
  p.weeks=cycle.weeks;p.cycleOptions=cycle.cycleOptions;p.cycleSources=cycle.cycleSources;
  p.weeks.forEach(w=>w.days.forEach((d,i)=>{d.id=uid('day');d.name=first.days[i]?.name||d.name;d.ex.forEach(e=>e.id=uid('pex'))}));
  p.updated=Date.now();save();renderProgramEditor();toast('Цикл сформирован');
 }catch(error){toast(error.message)}
};
window.cycleReplacePhase=function(pid,wi,phase){
 const p=programById(pid),w=p?.weeks[wi],profile=Object.values(WorkoutDomain.weekProfiles).find(x=>x.phase===phase);if(!w||!profile)return;
 const prior=clone(w);WorkoutDomain.applyWeekProfile(w,profile);w.loadProfileManual=false;w.repGuidanceManual=false;
 const sources=new Map();prior.days.forEach((d,di)=>(d.ex||[]).forEach(e=>{const key=[e.exerciseId||e.sourceId||e.n,e.equipmentProfileId||'',e.techniqueId||'',e.loadType||'',e.method||'STANDARD'].join('|');const old=sources.get(key);if(old)old.dayIndices.push(di);else sources.set(key,{...clone(e),dayIndices:[di]});}));
 if(prior.testWeek&&!profile.test)for(const e of p.cycleSources||[]){const key=[e.exerciseId||e.sourceId||e.n,e.equipmentProfileId||'',e.techniqueId||'',e.loadType||'',e.method||'STANDARD'].join('|');if(!sources.has(key))sources.set(key,clone(e));}
 // Reuse the same allocator for a replacement phase.
 const chosen=WorkoutDomain.allocateWeek(w.weeklyLoadProfile,w.days,[...sources.values()]);
 w.days=chosen;w.previousPhase=prior;p.updated=Date.now();save();renderProgramEditor();
};

window.cycleUndo=function(pid){const p=programById(pid);if(!p?.previousCycle)return;Object.assign(p,p.previousCycle);delete p.previousCycle;p.updated=Date.now();save();renderProgramEditor();};

window.cycleExercisePreview=function(p,d,e){
 if(!p.cycleOptions||e.method==='SUPERSET')return '';
 const w=p.weeks[programUi.week],spec=w?.weeklyLoadProfile?.[WorkoutDomain.exerciseKind(e,workoutRegistry)];if(!spec?.sets)return '';
 const target={...(e.sets?.[0]||{}),targetRepMin:spec.reps[0],targetRepMax:spec.reps[1],targetRpeMin:spec.rpe[0],targetRpeMax:spec.rpe[1],targetIntensityMin:spec.pct[0],targetIntensityMax:spec.pct[1],ok:false};
 const current={id:'cycle-preview',date:iso(),userId:p.assignedUserId||p.clientId||p.userId||window.cloud?.user?.id,dayRole:d.role,weeklyLoadProfile:w.weeklyLoadProfile,deload:w.deload,testWeek:w.testWeek,programId:p.id,w:w.n,programWeekIntensityMin:w.intensityMin,programWeekIntensityMax:w.intensityMax,ex:[{...e,set:[target]}]};
 const history=(window.trainingLoadModel292?.history?.()||st.sessions||[]).filter(x=>!current.userId||!x.userId||x.userId===current.userId);
 const rec=WorkoutDomain.recommend(current.ex[0],target,current,history,workoutRegistry,st.exerciseWeightProfiles||{}),fmt=x=>x==null?'нет данных':Number(x).toLocaleString('ru-RU',{maximumFractionDigits:1});
 return `<details class="small muted" style="margin-top:8px"><summary>${esc(d.role||'Middle')} · e1RM ${fmt(rec.strength?.estimate)}${rec.strength?.estimate!=null?' кг':''}</summary><p>Расчёт: ${fmt(rec.calculatedWeight)} · рекомендация: ${rec.sessionIds.length?fmt(rec.weight)+' кг':'после первой тренировки'}${rec.allowedWeightRange?` · коридор ${fmt(rec.allowedWeightRange.min)}–${fmt(rec.allowedWeightRange.max)} кг`:''}</p><p>${spec.reps.join('–')} повторений · RPE ${spec.rpe.join('–')} · RIR ${spec.rir.join('–')}</p><p>${esc(rec.evidence[0]||'Нет сопоставимой истории')}</p><p>${esc(rec.reason)}</p></details>`;
};
