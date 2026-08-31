const CACHE_PREFIX='unvrsl-fit-';
const CACHE='unvrsl-fit-v249-stats-owner-hard-fix';

// Only the shell and directly required modules are precached.
// Everything else is cached on first real use instead of downloading the whole repository.
const ASSETS=[
  './','./index.html','./app.js','./manifest.webmanifest','./icon.svg',
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
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})))))
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  )
});

self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);

  // Supabase/API/CDN responses are never stored in the PWA cache.
  // This avoids stale account data and prevents the cache from growing with remote requests.
  if(url.origin!==self.location.origin)return;

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
