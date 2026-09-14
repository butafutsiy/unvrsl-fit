'use strict';

const SW_RELEASE='v379-canonical-workout';
const CACHE_PREFIX='unvrsl-';
const STATIC_CACHE=`${CACHE_PREFIX}static-${SW_RELEASE}`;
const CORE_ASSETS=[
  './',
  './index.html',
  './manifest.webmanifest?v=379',
  './app.js?v=379',
  './plan-w1.js?v=379',
  './plan-w2.js?v=379',
  './plan-w3.js?v=379',
  './plan-w4.js?v=379',
  './plan-w5.js?v=379',
  './plan-w6.js?v=379',
  './plan-w7.js?v=379',
  './plan-w8.js?v=379'
];

async function fetchFresh(request){
  return fetch(request,{cache:'no-store'});
}

async function networkFirst(request,fallback){
  const cache=await caches.open(STATIC_CACHE);
  try{
    const response=await fetchFresh(request);
    if(response.ok)await cache.put(request,response.clone());
    return response;
  }catch(error){
    const cached=await cache.match(request)||fallback&&await cache.match(fallback);
    if(cached)return cached;
    throw error;
  }
}

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil((async()=>{
    const cache=await caches.open(STATIC_CACHE);
    await Promise.allSettled(CORE_ASSETS.map(async url=>{
      const request=new Request(url,{cache:'reload'});
      const response=await fetchFresh(request);
      if(response.ok)await cache.put(request,response);
    }));
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==STATIC_CACHE).map(key=>caches.delete(key)));
    try{await self.registration.navigationPreload?.enable()}catch(_){}
    await self.clients.claim();
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    clients.forEach(client=>client.postMessage({type:'UNVRSL_RELEASE_READY',release:SW_RELEASE}));
  })());
});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING'||event.data?.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith(networkFirst(event.request,event.request.mode==='navigate'?'./index.html':null));
});

