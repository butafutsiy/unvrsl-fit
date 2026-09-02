'use strict';
(()=>{
  if(window.__unvrslOgStyleV260)return;
  window.__unvrslOgStyleV260=true;
  window.__unvrslOgStyleV258=true;
  window.__unvrslOgStyleV257=true;
  window.__unvrslOgStyleV256=true;
  for(const id of ['unvrsl-startup-splash','unvrsl-startup-splash-style','unvrsl-startup-splash-v156','unvrsl-startup-splash-v156-style','unvrsl-startup-splash-final','unvrsl-startup-splash-final-style','unvrsl-startup-v256','unvrsl-startup-v256-style','unvrsl-startup-v257','unvrsl-startup-v257-style','unvrslBoot','unvrsl-boot-style','unvrsl-boot-cover','unvrsl-boot-cover-style'])document.getElementById(id)?.remove();
  document.body?.classList.remove('unvrsl-booting');

  // startup-orchestrator-v260 owns the single static splash and reveals the
  // shell only after one final role-aware render. This file never releases it.

  // All legacy purple accents follow the user's selected accent color.
  if(!document.getElementById('unvrsl-user-accent-bridge')){
    const accentStyle=document.createElement('style');
    accentStyle.id='unvrsl-user-accent-bridge';
    accentStyle.textContent=`
      :root{--purple:var(--green)!important}
      .sd2-write,.bw190-all,.bw190-chip.on b,.bw190-point-info b{color:var(--green)!important}
      .bw190-chip.on{border-color:var(--green)!important;background:color-mix(in srgb,var(--green) 12%,transparent)!important}
      .bw190-point-info{background:color-mix(in srgb,var(--green) 10%,transparent)!important;border-color:color-mix(in srgb,var(--green) 28%,transparent)!important}
      .sd2-chart .bw190-point{fill:var(--green)!important}
      .sd2-chart .bw190-point:hover,.sd2-chart .bw190-point:focus,.sd2-chart .bw190-point.is-selected{stroke:color-mix(in srgb,var(--green) 38%,transparent)!important}
      .sd2-chart polyline{stroke:var(--green)!important}
      .sd2-chart polygon{fill:color-mix(in srgb,var(--green) 10%,transparent)!important}
      .sd2-cell.l1{background:color-mix(in srgb,var(--green) 28%,#2c2c31)!important}
      .sd2-cell.l2{background:color-mix(in srgb,var(--green) 46%,#2c2c31)!important}
      .sd2-cell.l3{background:color-mix(in srgb,var(--green) 68%,#2c2c31)!important}
      .sd2-cell.l4{background:var(--green)!important}
      .sd2-legend i:nth-of-type(2){background:color-mix(in srgb,var(--green) 28%,#2c2c31)!important}
      .sd2-legend i:nth-of-type(3){background:color-mix(in srgb,var(--green) 46%,#2c2c31)!important}
      .sd2-legend i:nth-of-type(4){background:color-mix(in srgb,var(--green) 68%,#2c2c31)!important}
      .sd2-legend i:nth-of-type(5){background:var(--green)!important}
    `;
    document.head.appendChild(accentStyle);
  }

  // One client runtime owns Home and Plan. It stays dormant for the trainer account.
  if(!document.querySelector('script[data-unvrsl-client-runtime-v257]')){
    const clientFinal=document.createElement('script');
    clientFinal.src='client-final-runtime-v222.js?v=260';
    clientFinal.async=false;
    clientFinal.dataset.unvrslClientRuntimeV257='1';
    document.body.appendChild(clientFinal);
  }

  // Canonical exercise-detail styling. No legacy boot cover or renderer is executed.
  if(!document.querySelector('script[data-unvrsl-og-enhance-v254]')){
    const enhance=document.createElement('script');
    enhance.src='og-enhance-v254.js?v=260';
    enhance.async=false;
    enhance.dataset.unvrslOgEnhanceV254='1';
    document.head.appendChild(enhance);
  }
})();
