'use strict';
(()=>{
  window.__unvrslStartupComplete=true;
  document.getElementById('unvrsl-startup-splash')?.remove();
  document.getElementById('unvrsl-startup-splash-style')?.remove();
  document.getElementById('unvrsl-startup-splash-v156')?.remove();
  document.getElementById('unvrsl-startup-splash-v156-style')?.remove();

  if(!document.querySelector('script[data-sergey-training-plan]')){
    const s=document.createElement('script');
    s.src='./sergey-training-plan.js';
    s.dataset.sergeyTrainingPlan='1';
    document.head.appendChild(s);
  }
})();
