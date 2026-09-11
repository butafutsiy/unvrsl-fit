const SW_RELEASE='v347-glute-bridge-catalog';
const STATIC_CACHE='unvrsl-static-v347';
const CORE_ASSETS=[
  './app.js?v=316',
  './startup-orchestrator-v260.js?v=321',
  './ui-stability-v313.js?v=316',
  './program-weight-policy-v257.js?v=331',
  './exercise-picker-v331.js?v=339',
  './exercise-media-verified-v331.js?v=331',
  './exercise-plan-canonical-v329.js?v=331',
  './og-db.js?v=331',
  './og-detail.js?v=331',
  './equipment-filter.js?v=346',
  './exercise-library-quality.js?v=346',
  './exercise-library-additions-v347.js?v=347',
  './frequent-patch.js?v=335',
  './client-free-workout-v334.js?v=335',
  './strength-progress-v335.js?v=339',
  './performance-control-v315.js?v=332',
  './premium-ui.js?v=320',
  './stable-ui.js?v=316',
  './mockup-ui.js?v=316',
  './density-ui.js?v=316',
  './mobile-final-fix.js?v=316',
  './home-stats-v254.js?v=316',
  './trainer-client-clean-v113.js?v=326',
  './offline-strength-search-v339.js?v=345',
  './exercise-detail-rules-v156.js?v=326',
  './bodyweight-history-v190.js?v=326',
  './requested-cleanup-v2.js?v=320',
  './client-nav-hotfix.js?v=320',
  './trainer-shell-v252.js?v=316',
  './progress.html',
  './cloud-config.js?v=321',
  './public-progress-v321.js?v=334',
  './offline-progress-v321.js?v=334'
];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil((async()=>{
    const cache=await caches.open(STATIC_CACHE);
    await Promise.allSettled(CORE_ASSETS.map(async url=>{
      const request=new Request(url,{cache:'reload'}),response=await fetch(request);
      if(response.ok)await cache.put(request,response)
    }))
  })())
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==STATIC_CACHE).map(key=>caches.delete(key)));
    try{await self.registration.navigationPreload?.enable()}catch(_){ }
    await self.clients.claim();
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    clients.forEach(client=>client.postMessage({type:'UNVRSL_RELEASE_READY',release:SW_RELEASE}))
  })())
});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING'||event.data?.type==='SKIP_WAITING')self.skipWaiting()
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(STATIC_CACHE);
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        if(response.ok)event.waitUntil(cache.put(event.request,response.clone()));
        return response
      }catch(error){
        const cached=await cache.match(event.request)||await cache.match('./index.html');
        if(cached)return cached;throw error
      }
    })());return
  }
  const versioned=url.searchParams.has('v');
  if(versioned&&['script','style','image','font','manifest'].includes(event.request.destination)){
    event.respondWith((async()=>{
      const cache=await caches.open(STATIC_CACHE),cached=await cache.match(event.request);
      if(cached)return cached;
      const response=await fetch(event.request,{cache:'no-store'});
      if(response.ok)event.waitUntil(cache.put(event.request,response.clone()));
      return response
    })());return
  }
  event.respondWith((async()=>{
    const cache=await caches.open(STATIC_CACHE);
    try{
      const response=await fetch(event.request,{cache:'no-store'});
      if(response.ok)event.waitUntil(cache.put(event.request,response.clone()));
      return response
    }catch(error){
      const cached=await cache.match(event.request);if(cached)return cached;throw error
    }
  })())
});