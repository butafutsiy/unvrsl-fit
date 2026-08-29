'use strict';
(()=>{
  window.__unvrslStartupComplete=true;
  document.getElementById('unvrsl-startup-splash')?.remove();
  document.getElementById('unvrsl-startup-splash-style')?.remove();
  document.getElementById('unvrsl-startup-splash-v156')?.remove();
  document.getElementById('unvrsl-startup-splash-v156-style')?.remove();
  document.getElementById('unvrsl-boot-cover')?.remove();

  // Preserve the legacy OG visual styles without allowing their loading cover.
  const blocker=document.createElement('div');
  blocker.id='unvrsl-boot-cover';
  blocker.style.cssText='display:none!important;position:fixed;width:0;height:0;overflow:hidden;pointer-events:none';
  document.body.appendChild(blocker);

  const legacy=document.createElement('script');
  legacy.src='og-style-legacy-v157.js';
  legacy.async=false;
  const release=()=>blocker.remove();
  legacy.onload=release;
  legacy.onerror=release;
  document.head.appendChild(legacy);
})();
