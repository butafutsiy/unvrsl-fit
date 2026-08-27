const CACHE_PREFIX='unvrsl-fit-';
const CACHE='unvrsl-fit-v105';
const ASSETS=['./','./index.html','./app.js','./manifest.webmanifest','./icon.svg','./plan-w1.js','./plan-w2.js','./plan-w3.js','./plan-w4.js','./plan-w5.js','./plan-w6.js','./plan-w7.js','./plan-w8.js','./og-style.js','./og-core.js','./og-db.js','./og-detail.js','./og-settings.js','./coach-style.js','./coach-programs.js','./smart-training.js','./frequent-patch.js','./equipment-filter.js','./exercise-library-quality.js','./exercise-library-curated.js','./exercise-library-strict.js','./exercise-media-mapping.js','./cardio-metric-fixes.js','./active-workout-compact.js','./preview-mobile-fix.js','./template-programs-v3.js','./template-tempo-wave.js','./rpe-auto-progression.js','./adaptive-effort-v2.js','./program-management-patch.js','./start-program-picker.js','./program-delete-fix.js','./requested-cleanup-v2.js','./program-delete-persistence-v3.js','./workout-template-ux-v2.js','./client-program-picker.js','./popular-programs.js','./female-program-templates.js','./anton-gorkusha-plan.js','./anton-plan-rules.js','./wake-lock.js','./workout-duration.js','./cardio-timer.js','./cardio-exercise-library.js','./rest-timer-v2.js','./advanced-training.js','./advanced-start-patch.js','./profile-stats.js','./premium-ui.js','./stable-ui.js','./mockup-ui.js','./density-ui.js','./mobile-final-fix.js','./sheet-swipe.js','./stats-dashboard-v2.js','./home-stats-v2.js','./stats-cleanup.js','./stats-integrity-v104.js','./client-nav-hotfix.js','./clients-action-layout.js','./cloud-config.js','./supabase-loader.js','./cloud.js','./persistence-safety.js','./account-sync.js','./auth-ux.js','./auth-handoff.js','./trainer-style.js','./trainer.js','./trainer-nav-patch.js','./progression.js','./cloud-patch.js','./cloud-programs.js','./app-mode.js','./client-link.js','./auth-password.js','./checkin.js','./checkin-singleton-fix.js','./offline-clients.js','./offline-create-measures.js','./online-progress.js','./client-ui-fix.js','./client-experience-v2.js','./trainer-plan-controls.js','./trainer-client-detail-v2.js','./trainer-tap-fix.js','./trainer-direct-ui.js'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})))));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    await caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key))));
    await self.clients.claim();
    // Do not force-navigate open PWA windows here: an update must never interrupt an active workout.
  })());
});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  const sameOrigin=url.origin===self.location.origin;

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request,{cache:'no-store'}).then(response=>{
        if(response&&response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
        }
        return response;
      }).catch(()=>caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    (sameOrigin?fetch(request,{cache:'no-store'}):fetch(request)).then(response=>{
      if(response&&(response.ok||response.type==='opaque')){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy));
      }
      return response;
    }).catch(()=>caches.match(request))
  );
});
