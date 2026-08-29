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
})();
