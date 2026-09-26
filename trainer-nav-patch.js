'use strict';
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
  if(isTrainer&&typeof window.trainerProgramsPage==='function')window.trainerProgramsPage();
};
const _trainerNavRender=window.render;
if(typeof _trainerNavRender==='function')window.render=function(){const r=_trainerNavRender.apply(this,arguments);setTimeout(()=>{if(typeof trainerIsTrainer==='function'&&trainerIsTrainer()&&typeof window.trainerProgramsPage==='function')window.trainerProgramsPage()},0);return r};
setTimeout(()=>{if(typeof refreshTrainerNav==='function')refreshTrainerNav()},80);
