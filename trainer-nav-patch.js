'use strict';
function trainerProgramsPage(){
  const el=document.querySelector('#programs');if(!el)return;
  if(typeof trainerIsTrainer==='function'&&!trainerIsTrainer()){
    el.innerHTML='<div class="card"><div class="title">Раздел тренера</div></div>';return;
  }
  const programs=Array.isArray(st.programs)?st.programs:[];
  const list=programs.map(p=>`<div class="card"><div class="row between"><div class="grow"><div class="title">${esc(p.name||'Программа')}</div><div class="muted small">${p.weeks?.length||0} нед. · ${(p.weeks||[]).reduce((a,w)=>a+(w.days?.length||0),0)} тренировок</div></div><button class="btn tiny primary" onclick="openProgramEditor('${p.id}')">Открыть</button></div><div class="coach-actions"><button class="btn tiny" onclick="shareProgram('${p.id}')">Поделиться</button><button class="btn tiny" onclick="saveProgramAsTemplate('${p.id}')">В шаблоны</button></div></div>`).join('');
  el.innerHTML=`<div class="card"><div class="row between"><div><div class="title">Программы</div><div class="muted">Создание, шаблоны и отправка клиентам</div></div><button class="btn primary" onclick="newProgramSheet()">＋</button></div><div class="coach-actions"><button class="btn" onclick="templatesSheet()">Шаблоны</button><button class="btn" onclick="cloneBuiltInCycle()">Мой цикл</button></div></div><div class="section">МОИ ПРОГРАММЫ</div>${list||'<div class="card muted">Пока нет созданных программ.</div>'}`;
}
const _trainerRefreshNavCentered=window.refreshTrainerNav;
if(typeof _trainerRefreshNavCentered==='function')window.refreshTrainerNav=function(){
  _trainerRefreshNavCentered();
  let page=document.querySelector('#programs');
  if(!page){page=document.createElement('section');page.id='programs';page.className='page';document.querySelector('main')?.appendChild(page)}
  let btn=document.querySelector('.nav button[data-p="programs"]');
  const isTrainer=typeof trainerIsTrainer==='function'&&trainerIsTrainer();
  if(isTrainer&&!btn){
    btn=document.createElement('button');btn.dataset.p='programs';btn.innerHTML='<span class="ico">▤</span>Программы';btn.addEventListener('click',()=>nav('programs'));
    const start=document.querySelector('.nav button[data-p="start"]');
    document.querySelector('.nav')?.insertBefore(btn,start||null);
  }
  if(btn)btn.style.display=isTrainer?'block':'none';
  const navEl=document.querySelector('.nav');if(navEl)navEl.style.gridTemplateColumns=`repeat(${isTrainer?7:5},1fr)`;
  if(isTrainer)trainerProgramsPage();
};
const _trainerNavRender=window.render;
if(typeof _trainerNavRender==='function')window.render=function(){const r=_trainerNavRender.apply(this,arguments);setTimeout(()=>{if(typeof trainerIsTrainer==='function'&&trainerIsTrainer())trainerProgramsPage()},0);return r};
setTimeout(()=>{if(typeof refreshTrainerNav==='function')refreshTrainerNav()},80);
