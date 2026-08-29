'use strict';
(()=>{
  if(window.__unvrslProgramEditorV161Fix)return;
  window.__unvrslProgramEditorV161Fix=true;

  function renderEditor(){
    const p=programById(programUi?.pid);
    if(!p)return;
    ensureProgramShape(p);
    const wi=Math.max(0,Math.min(Number(programUi.week)||0,p.weeks.length-1));
    const w=p.weeks[wi]||p.weeks[0];
    if(!w)return typeof toast==='function'?toast('В программе нет недель'):undefined;
    programUi.week=wi;
    modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${esc(p.name)}</h2><div class="muted">Конструктор программы</div></div><button class="btn tiny" onclick="closeModal();planPage()">✕</button></div><div class="weekbar">${p.weeks.map((x,i)=>`<button class="weekbtn ${i===wi?'on':''}" onclick="programUi.week=${i};renderProgramEditor()">W${i+1}</button>`).join('')}</div><div class="coach-actions"><button class="btn tiny" onclick="renameProgramSheet('${p.id}')">Переименовать</button><button class="btn tiny" onclick="copyProgramWeek('${p.id}',${wi})">Копировать неделю</button><button class="btn tiny" onclick="addProgramWeek('${p.id}')">＋ Неделя</button></div><div class="section">НЕДЕЛЯ ${wi+1}</div>${w.days.map((d,di)=>programDayCard(p,w,d,di)).join('')}<button class="btn full" onclick="addProgramDay('${p.id}',${wi})">＋ Добавить тренировку</button><div class="coach-actions"><button class="btn primary" onclick="shareProgram('${p.id}')">Поделиться программой</button><button class="btn" onclick="saveProgramAsTemplate('${p.id}')">Сохранить как шаблон</button></div>`);
  }

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
    renderEditor();
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

  renderEditor.__tempoWave=true;
  window.renderProgramEditor=renderEditor;
  window.openProgramEditor=openEditor;
  window.createProgram=create;
  try{renderProgramEditor=renderEditor}catch(e){}
  try{openProgramEditor=openEditor}catch(e){}
  try{createProgram=create}catch(e){}
})();
