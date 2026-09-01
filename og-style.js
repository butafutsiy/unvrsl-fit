'use strict';
(()=>{
  if(window.__unvrslOgStyleV256)return;
  window.__unvrslOgStyleV256=true;
  window.__unvrslStartupComplete=true;
  for(const id of ['unvrsl-startup-splash','unvrsl-startup-splash-style','unvrsl-startup-splash-v156','unvrsl-startup-splash-v156-style','unvrsl-startup-splash-final','unvrsl-startup-splash-final-style','unvrsl-boot-cover','unvrsl-boot-cover-style'])document.getElementById(id)?.remove();

  // The only startup surface is part of index.html, so it is present before
  // application scripts paint. It fades once and never watches app mutations.
  const splash=document.getElementById('unvrsl-startup-v256');
  if(splash&&!splash.dataset.releaseBound){
    splash.dataset.releaseBound='1';
    let released=false;
    const release=()=>{
      if(released)return;
      released=true;
      requestAnimationFrame(()=>{
        splash.classList.add('out');
        setTimeout(()=>{splash.remove();document.getElementById('unvrsl-startup-v256-style')?.remove()},240);
      });
    };
    const afterLoad=()=>setTimeout(release,260);
    if(document.readyState==='complete')afterLoad();else window.addEventListener('load',afterLoad,{once:true});
    setTimeout(release,1800);
  }

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
  if(!document.querySelector('script[data-unvrsl-client-runtime-v256]')){
    const clientFinal=document.createElement('script');
    clientFinal.src='client-final-runtime-v222.js?v=256';
    clientFinal.async=false;
    clientFinal.dataset.unvrslClientRuntimeV256='1';
    document.body.appendChild(clientFinal);
  }

  // Canonical exercise-detail styling. No legacy boot cover or renderer is executed.
  if(!document.querySelector('script[data-unvrsl-og-enhance-v254]')){
    const enhance=document.createElement('script');
    enhance.src='og-enhance-v254.js';
    enhance.async=false;
    enhance.dataset.unvrslOgEnhanceV254='1';
    document.head.appendChild(enhance);
  }
})();
