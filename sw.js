const SW_RELEASE='v274-cache-reset';
const REP_RANGE_SCRIPT='<script src="rep-range-mobile-v272.js?v=274"></script>';

self.addEventListener('install',event=>{
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    // The app intentionally does not use Cache Storage anymore. Remove every
    // legacy cache so old HTML/plan/modules cannot be mixed with the live app.
    const keys=await caches.keys();
    await Promise.all(keys.map(key=>caches.delete(key)));
    try{await self.registration.navigationPreload?.enable()}catch(_){ }
    await self.clients.claim();

    // One cache-busted navigation makes an already-installed PWA move to the
    // fresh shell immediately after this worker takes control. localStorage,
    // IndexedDB and workout history are not touched.
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    await Promise.all(clients.map(client=>{
      try{
        const url=new URL(client.url);
        if(url.origin!==self.location.origin)return null;
        if(url.searchParams.get('__unvrsl_refresh')===SW_RELEASE)return null;
        url.searchParams.set('__unvrsl_refresh',SW_RELEASE);
        return client.navigate(url.href).catch(()=>null);
      }catch(_){return null}
    }));
  })());
});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING'||event.data?.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      const res=await fetch(event.request,{cache:'no-store'});
      const type=res.headers.get('content-type')||'';
      if(!res.ok||!type.includes('text/html'))return res;
      let html=await res.text();
      if(!html.includes('rep-range-mobile-v272.js?v=274')){
        html=html.includes('</body>')?html.replace('</body>',`${REP_RANGE_SCRIPT}</body>`):`${html}${REP_RANGE_SCRIPT}`;
      }
      const headers=new Headers(res.headers);
      headers.delete('content-length');
      headers.delete('content-encoding');
      return new Response(html,{status:res.status,statusText:res.statusText,headers});
    })());
    return;
  }

  event.respondWith(fetch(event.request,{cache:'no-store'}));
});
