const CACHE_PREFIX='unvrsl-fit-';
const CACHE='unvrsl-fit-v1.1.1';
const CORE_ASSETS=[
  './','./index.html','./manifest.webmanifest','./icon.svg','./cloud-config.js',
  './plan-w1.js','./plan-w2.js','./plan-w3.js','./plan-w4.js',
  './plan-w5.js','./plan-w6.js','./plan-w7.js','./plan-w8.js',
  './v11/app.css','./v11/core.mjs','./v11/store.mjs','./v11/cloud.mjs','./v11/sergey-plan.mjs','./v11/app.mjs'
];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE_ASSETS.map(url=>new Request(url,{cache:'reload'})))));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim()));
});

self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}
    return response;
  })));
});
