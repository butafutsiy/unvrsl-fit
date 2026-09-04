const SW_RELEASE='v284-true-ghost-rep-ranges';

self.addEventListener('install',event=>{
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.map(key=>caches.delete(key)));
    try{await self.registration.navigationPreload?.enable()}catch(_){ }
    await self.clients.claim();
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    await Promise.all(clients.map(client=>{
      try{
        const url=new URL(client.url);
        if(url.origin!==self.location.origin)return null;
        if(url.searchParams.get('__unvrsl_refresh')===SW_RELEASE)return null;
        url.searchParams.set('__unvrsl_refresh',SW_RELEASE);
        return client.navigate(url.href).catch(()=>null)
      }catch(_){return null}
    }))
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
      const response=await fetch(event.request,{cache:'no-store'});
      const type=response.headers.get('content-type')||'';
      if(!type.includes('text/html'))return response;
      let html=await response.text();
      if(!html.includes('rep-range-ghost-display-v284.js')){
        html=html.replace('</body>','<script src="rep-range-ghost-display-v284.js?v=284"></script></body>');
      }
      const headers=new Headers(response.headers);
      headers.set('content-type','text/html; charset=utf-8');
      headers.delete('content-length');
      return new Response(html,{status:response.status,statusText:response.statusText,headers});
    })());
    return;
  }
  event.respondWith(fetch(event.request,{cache:'no-store'}))
});
