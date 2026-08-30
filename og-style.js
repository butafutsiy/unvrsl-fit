'use strict';
(()=>{
  window.__unvrslStartupComplete=true;
  document.getElementById('unvrsl-startup-splash')?.remove();
  document.getElementById('unvrsl-startup-splash-style')?.remove();
  document.getElementById('unvrsl-startup-splash-v156')?.remove();
  document.getElementById('unvrsl-startup-splash-v156-style')?.remove();
  document.getElementById('unvrsl-boot-cover')?.remove();

  // Preserve the legacy OG visual styles without creating a second loading cover.
  window.__unvrslSkipLegacyBootCover=true;

  const legacy=document.createElement('script');
  legacy.src='og-style-legacy-v157.js';
  legacy.async=false;
  document.head.appendChild(legacy);
})();
