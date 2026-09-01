'use strict';
(()=>{
  if(window.__unvrslTrainerShellV252)return;
  window.__unvrslTrainerShellV252=true;

  const MASTER='butafutsiy@mail.ru';
  const ORDER=['home','plan','programs','start','stats','exercises','clients'];
  const DEF={
    programs:{label:'Программы',icon:'▤'},
    clients:{label:'Клиенты',icon:'◉'}
  };
  let syncing=false,queued=false;

  function isTrainer(){
    const c=window.cloud,email=String(c?.user?.email||'').trim().toLowerCase();
    if(email===MASTER||c?.profile?.role==='trainer')return true;
    try{return typeof window.unvrslTrainerMode==='function'&&window.unvrslTrainerMode()}catch(e){return false}
  }
  window.trainerIsTrainer=isTrainer;
  try{trainerIsTrainer=isTrainer}catch(e){}

  function ensurePage(id){
    let page=document.getElementById(id);
    if(!page){page=document.createElement('section');page.id=id;page.className='page';document.querySelector('main')?.appendChild(page)}
    return page
  }
  function ensureButton(nav,id){
    let btn=nav.querySelector(`button[data-p="${id}"]`);
    if(!btn){
      const d=DEF[id];btn=document.createElement('button');btn.dataset.p=id;btn.innerHTML=`<span class="ico">${d.icon}</span>${d.label}`;
      btn.addEventListener('click',()=>{if(typeof window.nav==='function')window.nav(id)});nav.appendChild(btn)
    }
    btn.setAttribute('aria-label',DEF[id].label);
    return btn
  }
  function renderTrainerPage(id){
    if(id==='programs'&&typeof window.trainerProgramsPage==='function')window.trainerProgramsPage();
    if(id==='clients'&&typeof window.clientsPage==='function')Promise.resolve(window.clientsPage()).catch(e=>console.warn('trainer clients',e));
  }
  function syncShell(renderActive=false){
    if(syncing)return;syncing=true;
    try{
      const navEl=document.querySelector('.nav');if(!navEl)return;
      const trainer=isTrainer();
      ensurePage('programs');ensurePage('clients');
      for(const id of ['programs','clients']){
        const btn=trainer?ensureButton(navEl,id):navEl.querySelector(`button[data-p="${id}"]`);
        if(btn)btn.style.display=trainer?'block':'none';
      }
      const wanted=ORDER.filter(id=>navEl.querySelector(`button[data-p="${id}"]`));
      const current=[...navEl.querySelectorAll(':scope > button[data-p]')].map(btn=>btn.dataset.p);
      if(current.join('|')!==wanted.join('|'))wanted.forEach(id=>navEl.appendChild(navEl.querySelector(`button[data-p="${id}"]`)));
      const count=trainer?7:5;
      navEl.style.setProperty('--nav-cols',String(count));
      navEl.style.gridTemplateColumns=`repeat(${count},minmax(0,1fr))`;
      if(!trainer){
        const active=document.querySelector('.page.active');
        if(active&&(active.id==='programs'||active.id==='clients')&&typeof window.nav==='function')window.nav('home');
      }else if(renderActive){
        const id=document.querySelector('.page.active')?.id;renderTrainerPage(id)
      }
    }finally{syncing=false}
  }
  function schedule(renderActive=false){
    if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;syncShell(renderActive)})
  }

  const baseRefresh=window.refreshTrainerNav;
  if(typeof baseRefresh==='function'&&!baseRefresh.__trainerShellV252){
    const wrapped=function(){const out=baseRefresh.apply(this,arguments);schedule(true);return out};
    wrapped.__trainerShellV252=true;window.refreshTrainerNav=wrapped;try{refreshTrainerNav=wrapped}catch(e){}
  }
  const baseNav=window.nav;
  if(typeof baseNav==='function'&&!baseNav.__trainerShellV252){
    const wrapped=function(p){syncShell(false);const out=baseNav.apply(this,arguments);if(isTrainer())renderTrainerPage(p);schedule(false);return out};
    wrapped.__trainerShellV252=true;window.nav=wrapped;try{nav=wrapped}catch(e){}
  }

  const navEl=document.querySelector('.nav');
  if(navEl&&!navEl.__trainerShellV252Observer){
    const observer=new MutationObserver(()=>schedule(false));observer.observe(navEl,{childList:true});navEl.__trainerShellV252Observer=observer;
  }
  [0,100,350,900,1800,3500,7000].forEach(t=>setTimeout(()=>syncShell(false),t));
  window.addEventListener('pageshow',()=>syncShell(true),{passive:true});
  window.addEventListener('focus',()=>syncShell(true),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncShell(true)},{passive:true});
})();
