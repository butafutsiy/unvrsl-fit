'use strict';
(()=>{
  if(window.__unvrslProgramEditorV161Fix)return;
  window.__unvrslProgramEditorV161Fix=true;

  function openEditor(id,week=0,day=0){
    const p=programById(id);
    if(!p)return typeof toast==='function'?toast('Программа не найдена'):undefined;
    ensureProgramShape(p);
    programUi={
      pid:id,
      week:Math.max(0,Math.min(Number(week)||0,p.weeks.length-1)),
      day:Math.max(0,Number(day)||0),
      query:''
    };
    renderProgramEditor();
  }

  function create(){
    if(window.__unvrslProgramCreating)return false;
    const nameInput=document.getElementById('npName');
    const weeksInput=document.getElementById('npWeeks');
    const daysInput=document.getElementById('npDays');
    if(!weeksInput||!daysInput){
      if(typeof toast==='function')toast('Не удалось прочитать параметры программы');
      return false;
    }
    const name=String(nameInput?.value||'').trim()||'Программа';
    const weeks=Math.max(1,Math.min(16,Number(weeksInput.value)||4));
    const days=Math.max(1,Math.min(7,Number(daysInput.value)||3));
    const p={
      id:uid('prog'),
      name,
      created:Date.now(),
      updated:Date.now(),
      weeks:Array.from({length:weeks},(_,wi)=>({
        n:wi+1,
        days:Array.from({length:days},(_,di)=>({
          id:uid('day'),
          name:`День ${di+1}`,
          ex:[]
        }))
      }))
    };
    window.__unvrslProgramCreating=true;
    st.programs.push(p);
    openEditor(p.id,0,0);
    setTimeout(()=>{
      try{save()}
      catch(e){
        console.error('program save',e);
        if(typeof toast==='function')toast('Программа открыта, но не сохранилась. Освободи место в браузере.')
      }
      window.__unvrslProgramCreating=false;
    },0);
    return false;
  }

  window.openProgramEditor=openEditor;
  window.createProgram=create;
  try{openProgramEditor=openEditor}catch(e){}
  try{createProgram=create}catch(e){}

  // v225: replace an exercise without rebuilding its prescription.
  const css=document.createElement('style');
  css.id='program-exercise-replace-v225-style';
  css.textContent=`
    .program-ex-edit-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
    .program-ex-replace-results{min-height:100px}
    .program-ex-replace-note{font-size:12px;color:#8e8e93;line-height:1.4;margin:8px 0 12px}
  `;
  document.head.appendChild(css);

  const dayById=(pid,wi,dayId)=>programById(pid)?.weeks?.[wi]?.days?.find(d=>String(d.id)===String(dayId))||null;
  const dayIndex=(pid,wi,dayId)=>programById(pid)?.weeks?.[wi]?.days?.findIndex(d=>String(d.id)===String(dayId))??-1;
  const exerciseLabel=e=>e?.custom?(e.raw||e.n||'Упражнение'):(typeof ruExerciseName==='function'?ruExerciseName(e?.n||''):(e?.n||'Упражнение'));
  const exerciseMeta=e=>{
    if(e?.custom&&typeof inferCustomMeta==='function')return inferCustomMeta(e.raw||e.n||'')||{};
    return {bp:e?.bp||'',tg:e?.tg||'',eq:e?.eq||''};
  };
  const replacementRecords=q=>{
    if(typeof catalogRecords!=='function')return[];
    const s=String(q||'').trim().toLowerCase();
    return catalogRecords().filter(e=>{
      if(!e)return false;
      const label=exerciseLabel(e),m=exerciseMeta(e);
      const bp=typeof BP_RU==='object'?(BP_RU[m.bp]||''):'';
      const eq=typeof EQ_RU==='object'?(EQ_RU[m.eq]||''):'';
      return !s||`${label} ${e.n||''} ${bp} ${eq}`.toLowerCase().includes(s)
    }).slice(0,100)
  };
  function replacementRow(e,pid,wi,dayId,ei){
    const label=exerciseLabel(e),m=exerciseMeta(e),media=e?.gif||e?.image||'';
    const thumb=media&&typeof mediaUrl==='function'?`<img class="ex-thumb" src="${mediaUrl(media)}" loading="lazy">`:'<div class="ex-thumb placeholder">🏋︎</div>';
    const bp=typeof BP_RU==='object'?(BP_RU[m.bp]||'—'):'—',eq=typeof EQ_RU==='object'?(EQ_RU[m.eq]||'—'):'—';
    return `<button class="card exlib exlib-btn" onclick="replaceProgramExercisePickV225('${pid}',${wi},'${dayId}',${ei},'${encodeURIComponent(e.id)}')"><div class="exercise-list-row">${thumb}<div class="grow"><b>${esc(label)}</b><div class="catalog-meta">${esc(bp)} · ${esc(eq)}</div></div><span class="chev">›</span></div></button>`
  }
  function renderReplacementResults(pid,wi,dayId,ei,q){
    const root=document.getElementById('programReplaceResultsV225');if(!root)return;
    const rows=replacementRecords(q),name=String(q||'').trim();
    root.innerHTML=rows.map(e=>replacementRow(e,pid,wi,dayId,ei)).join('')+(name?`<button class="card exlib exlib-btn" onclick="replaceProgramExerciseCustomV225('${pid}',${wi},'${dayId}',${ei},'${encodeURIComponent(name)}')"><b>＋ Использовать «${esc(name)}» как своё упражнение</b></button>`:'')||'<div class="card muted">Ничего не найдено.</div>';
  }
  window.replaceProgramExerciseFilterV225=(pid,wi,dayId,ei,q)=>renderReplacementResults(pid,wi,dayId,ei,q);
  window.replaceProgramExercisePickerV225=function(pid,wi,dayId,ei){
    const di=dayIndex(pid,wi,dayId),d=dayById(pid,wi,dayId),old=d?.ex?.[ei];
    if(di<0||!old)return typeof toast==='function'?toast('Упражнение не найдено'):undefined;
    modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>Заменить упражнение</h2><div class="muted small">Сейчас: ${esc(old.n||'Упражнение')}</div></div><button class="btn tiny" onclick="openProgramEditor('${pid}',${wi},${di})">←</button></div><div class="program-ex-replace-note">После выбора сохранятся подходы, повторы, RPE, темп, отдых и метод. Их можно сразу проверить перед сохранением.</div><input class="search" id="programReplaceSearchV225" autocomplete="off" placeholder="Поиск упражнения" oninput="replaceProgramExerciseFilterV225('${pid}',${wi},'${dayId}',${ei},this.value)"><div id="programReplaceResultsV225" class="program-ex-replace-results"></div>`);
    renderReplacementResults(pid,wi,dayId,ei,'');
    setTimeout(()=>document.getElementById('programReplaceSearchV225')?.focus(),30)
  };
  window.replaceProgramExercisePickV225=function(pid,wi,dayId,ei,token){
    const di=dayIndex(pid,wi,dayId);if(di<0)return;
    if(typeof programExerciseSettings==='function')return programExerciseSettings(pid,wi,di,token,ei);
    if(typeof toast==='function')toast('Редактор упражнения ещё загружается')
  };
  window.replaceProgramExerciseCustomV225=function(pid,wi,dayId,ei,token){
    const di=dayIndex(pid,wi,dayId),name=decodeURIComponent(token||'').trim();if(di<0||!name)return;
    if(!Array.isArray(st.customExercises))st.customExercises=[];
    const base=typeof baseExerciseName==='function'?baseExerciseName(name).toLowerCase():name.toLowerCase();
    const exists=st.customExercises.some(x=>{
      const n=String(x?.n||'');return (typeof baseExerciseName==='function'?baseExerciseName(n).toLowerCase():n.toLowerCase())===base
    });
    if(!exists)st.customExercises.push({n:name,created:Date.now()});
    try{save()}catch(e){}
    const m=typeof inferCustomMeta==='function'?(inferCustomMeta(name)||{}):{};
    if(typeof programExerciseForm==='function')return programExerciseForm({pid,wi,di,n:name,sourceId:null,bp:m.bp||'',tg:m.tg||'',eq:m.eq||'',existingIndex:ei});
    if(typeof toast==='function')toast('Редактор упражнения ещё загружается')
  };

  function installReplaceButton(){
    const base=window.programExerciseRow;
    if(typeof base!=='function'||base.__replaceExerciseV225)return;
    const wrapped=function(p,d,e,ei){
      const html=base.apply(this,arguments);
      if(!html||e?.method==='SUPERSET'||html.includes('replaceProgramExercisePickerV225'))return html;
      const edit=`<button class="btn tiny" onclick="editProgramExercise('${p.id}',${programUi.week},'${d.id}',${ei})">Изм.</button>`;
      if(!html.includes(edit))return html;
      const actions=`<div class="program-ex-edit-actions"><button class="btn tiny" onclick="replaceProgramExercisePickerV225('${p.id}',${programUi.week},'${d.id}',${ei})">Заменить</button>${edit}</div>`;
      return html.replace(edit,actions)
    };
    wrapped.__replaceExerciseV225=true;
    window.programExerciseRow=wrapped;
    try{programExerciseRow=wrapped}catch(e){}
  }
  installReplaceButton();
  setTimeout(installReplaceButton,0);
  setTimeout(installReplaceButton,800);

  // Refresh the original Sergey seed once, then leave later trainer edits untouched.
  setTimeout(()=>{
    try{
      const seed='sergey-8-week-training-plan',name='Тренировочный план (Сергей)';
      const p=Array.isArray(st?.programs)?st.programs.find(x=>x?.seedId===seed||x?.id===seed||x?.name===name):null;
      if(!p||Number(p.sourceRevision||1)>=2)return;
      const dayNames=['День 1 · Грудь + трицепс + средняя дельта','День 2 · Спина + бицепс + плечи','День 3 · Ноги'];
      const names=[
        ['1 · Жим штанги лёжа','2 · Жим гантелей на наклонной скамье','3 · Сведение в кроссовере на низ груди','4 · Жим в тренажёре на грудь','5 · Французский жим','6 · Махи гантелями в стороны','7 · Разгибание рук на верхнем блоке'],
        ['1 · Подтягивания с дополнительным весом','2 · Тяга в наклоне в Смите','3 · Тяга гантели одной рукой к поясу','4 · Тяга вертикального блока','5 · Подъём штанги на бицепс','6 · Сгибание гантелей с супинацией','7 · Жим гантелей сидя'],
        ['1 · Гакк-присед','2 · Жим ногами','3 · Румынская тяга','4 · Сгибание ног лёжа','5 · Разгибание ног','6 · Сведение ног в тренажёре','7 · Подъём на носки в тренажёре']
      ];
      (p.weeks||[]).forEach(w=>(w.days||[]).slice(0,3).forEach((d,di)=>{
        d.name=dayNames[di]||d.name;
        (d.ex||[]).slice(0,7).forEach((ex,ei)=>{if(names[di]?.[ei])ex.n=names[di][ei]})
      }));
      p.sourceRevision=2;p.updated=Date.now();
      try{save()}catch(e){}
    }catch(e){console.warn('Sergey plan v225 refresh',e)}
  },0);
})();
