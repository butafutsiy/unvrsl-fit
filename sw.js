const CACHE_PREFIX='unvrsl-fit-';
const CACHE='unvrsl-fit-v251-pwa-refresh';

// Only the shell and directly required modules are precached.
// Everything else is cached on first real use instead of downloading the whole repository.
const ASSETS=[
  './index.html','./app.js','./manifest.webmanifest','./icon.svg','./apple-touch-icon.png','./icon-192.png','./icon-512.png',
  './plan-w1.js','./plan-w2.js','./plan-w3.js','./plan-w4.js','./plan-w5.js','./plan-w6.js','./plan-w7.js','./plan-w8.js',
  './og-style.js','./og-core.js','./og-db.js','./og-detail.js','./og-settings.js',
  './coach-style.js','./coach-programs.js','./smart-training.js','./frequent-patch.js',
  './anatome-muscle-map.js','./anatome-muscle-drilldown.js','./equipment-filter.js',
  './program-builder-restored.js','./program-exercise-rules-v162.js','./program-editor-v161-fix.js','./sergey-training-plan.js',
  './storage-resilience-v162.js','./unvrsl-method-v211.js','./readiness-autoregulation-v163.js',
  './calendar-planner-v234.js','./trainer-client-clean-v113.js'
];

self.addEventListener('install',event=>{
  self.skipWaiting();
  // A temporary failure of one optional file must not leave users on an old worker.
  event.waitUntil(
    caches.open(CACHE).then(cache=>Promise.allSettled(
      ASSETS.map(url=>cache.add(new Request(url,{cache:'reload'})))
    ))
  )
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.registration.navigationPreload?.enable().catch(()=>{}))
      .then(()=>self.clients.claim())
  )
});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING'||event.data?.type==='SKIP_WAITING')self.skipWaiting()
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);

  // Supabase/API/CDN responses are never stored in the PWA cache.
  if(url.origin!==self.location.origin)return;

  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const response=(await event.preloadResponse)||await fetch(event.request,{cache:'no-store'});
        if(response?.ok)await cache.put('./index.html',response.clone());
        return response
      }catch(error){
        return (await cache.match('./index.html'))||Response.error()
      }
    })());
    return
  }

  event.respondWith(
    fetch(event.request,{cache:'no-store'})
      .then(response=>{
        if(response&&response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      })
      .catch(()=>caches.match(event.request))
  )
});
