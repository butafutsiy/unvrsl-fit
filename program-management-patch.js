'use strict';
(()=>{
  if(window.__unvrslProgramManagementPatch)return;
  window.__unvrslProgramManagementPatch=true;
  const BUILTIN='__builtin_cycle__';
  const BAD='Тренировочный план (Антон Горькуша)';
  const GOOD='Тренировочный план (Антон Гарькуша)';
  const SEED='anton-gorkusha-training-plan';

  function migrateAntonName(){
    let changed=false;
    (Array.isArray(st.programs)?st.programs:[]).forEach(p=>{
      if(!p)return;
      if(p.seedId===SEED||p.id===SEED||p.name===BAD||/Антон\s+Горькуша/i.test(p.name||'')){
        const next=String(p.name||GOOD).replace(/Антон\s+Горькуша/gi,'Антон Гарькуша');
        if(p.name!==next){p.name=next;changed=true}
        if(typeof p.author==='string'&&/Антон\s+Горькуша/i.test(p.author)){
          p.author=p.author.replace(/Антон\s+Горькуша/gi,'Антон Гарькуша');changed=true;
        }
      }
    });
    if(changed)try{save()}catch(e){}
  }

  migrateAntonName();
  if(!st.primaryProgramId)st.primaryProgramId=BUILTIN;

  window.setPrimaryProgram=function(id){
    const ok=id===BUILTIN||(Array.isArray(st.programs)&&st.programs.some(p=>String(p.id)===String(id)&&!p.archived));
    if(!ok)return typeof toast==='function'?toast('Программа не найдена'):undefined;
    st.primaryProgramId=String(id);
    st.startProgramId=String(id);
    try{save()}catch(e){}
    if(typeof toast==='function')toast(id===BUILTIN?'Встроенный цикл выбран основным':'Программа выбрана основной');
    try{planPage()}catch(e){}
  };

  function decorateProgramCards(){
    const cards=[...document.querySelectorAll('#plan .coach-program')];
    const programs=(Array.isArray(st.programs)?st.programs:[]).filter(p=>p&&!p.archived);
    cards.forEach((card,i)=>{
      const p=programs[i];if(!p)return;
      const actions=card.querySelector('.coach-actions');if(!actions)return;
      const primary=String(st.primaryProgramId)===String(p.id);
      card.classList.toggle('is-primary-program',primary);
      if(primary&&!card.querySelector('.primary-program-badge')){
        const badge=document.createElement('span');badge.className='chip green primary-program-badge';badge.textContent='Основная';
        const title=card.querySelector('.title');title?.parentElement?.appendChild(badge);
      }
      if(!actions.querySelector('[data-program-rename]')){
        const b=document.createElement('button');b.className='btn tiny';b.dataset.programRename='1';b.textContent='Переименовать';b.onclick=()=>renameProgramSheet(String(p.id));actions.appendChild(b);
      }
      if(!actions.querySelector('[data-program-primary]')){
        const b=document.createElement('button');b.dataset.programPrimary='1';actions.appendChild(b);
      }
      const pb=actions.querySelector('[data-program-primary]');
      pb.className=`btn tiny ${primary?'primary':''}`;
      pb.textContent=primary?'Основная':'Сделать основной';
      pb.disabled=primary;
      pb.onclick=()=>window.setPrimaryProgram(String(p.id));
    });
  }

  const style=document.createElement('style');
  style.textContent=`
    .coach-program.is-primary-program{border-color:rgba(48,209,88,.55);box-shadow:0 0 0 1px rgba(48,209,88,.16) inset}
    .primary-program-badge{display:inline-flex;margin-top:8px;width:max-content}
  `;
  document.head.appendChild(style);

  if(typeof appendProgramStudio==='function'){
    const old=appendProgramStudio;
    const wrapped=function(){const out=old.apply(this,arguments);setTimeout(decorateProgramCards,0);return out};
    window.appendProgramStudio=wrapped;try{appendProgramStudio=wrapped}catch(e){}
  }

  if(typeof renameProgram==='function'){
    const oldRename=renameProgram;
    const wrappedRename=function(id){const out=oldRename.apply(this,arguments);migrateAntonName();return out};
    window.renameProgram=wrappedRename;try{renameProgram=wrappedRename}catch(e){}
  }

  setTimeout(()=>{migrateAntonName();decorateProgramCards()},0);
})();
