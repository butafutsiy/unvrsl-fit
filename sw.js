const CACHE_PREFIX='unvrsl-fit-';

self.addEventListener('install',event=>{
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)).map(key=>caches.delete(key))))
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

  // v255 intentionally disables application response caching. This prevents
  // old and new UI modules from being mixed after an update.
  event.respondWith(fetch(event.request,{cache:'no-store'}))
});
