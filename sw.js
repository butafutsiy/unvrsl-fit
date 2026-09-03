const SW_RELEASE='v275-range-first';
const RANGE_ENGINE='<script src="built-in-plan-rep-ranges-v267.js?v=275"></script>';
const RANGE_UI='<script src="rep-range-mobile-v272.js?v=275"></script>';

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

      // The range model must exist before app.js captures ROUTINES/rmap.
      // Then patch preview immediately after app.js, in the same parser turn.
      const appTag='<script src="app.js"></script>';
      const freshAppTag=`${RANGE_ENGINE}<script src="app.js?v=275"></script>${RANGE_UI}`;
      if(html.includes(appTag))html=html.replace(appTag,freshAppTag);
      else if(html.includes('<script src="app.js?v=275"></script>')&&!html.includes('rep-range-mobile-v272.js?v=275')){
        html=html.replace('<script src="app.js?v=275"></script>',`${RANGE_ENGINE}<script src="app.js?v=275"></script>${RANGE_UI}`);
      }else if(!html.includes('rep-range-mobile-v272.js?v=275')){
        html=html.includes('</body>')?html.replace('</body>',`${RANGE_ENGINE}${RANGE_UI}</body>`):`${html}${RANGE_ENGINE}${RANGE_UI}`;
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
