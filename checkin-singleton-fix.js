'use strict';
(()=>{
  let rendering=false;
  function dedupeCheckinCards(){
    const root=document.querySelector('#home');
    if(!root)return;
    const cards=[...root.querySelectorAll('.weekly-checkin-card')];
    cards.slice(1).forEach(card=>card.remove());
  }

  const original=window.renderClientCheckinCard;
  if(typeof original==='function'){
    window.renderClientCheckinCard=async function(){
      dedupeCheckinCards();
      if(rendering||document.querySelector('#home .weekly-checkin-card'))return;
      rendering=true;
      try{
        await original.apply(this,arguments);
      }finally{
        rendering=false;
        dedupeCheckinCards();
      }
    };
  }

  let observedRoot=null;
  const observer=new MutationObserver(()=>dedupeCheckinCards());
  function attachObserver(){
    const root=document.querySelector('#home');
    if(root&&root!==observedRoot){
      observer.disconnect();
      observedRoot=root;
      observer.observe(root,{childList:true});
    }
    dedupeCheckinCards();
  }
  attachObserver();
  setTimeout(attachObserver,250);
  setTimeout(attachObserver,1000);
})();
