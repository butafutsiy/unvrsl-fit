const SW_RELEASE='v276-range-final';
const RANGE_ENGINE='<script src="built-in-plan-rep-ranges-v267.js?v=276"></script>';
const RANGE_UI='<script src="rep-range-mobile-v272.js?v=276"></script>';
const RANGE_FINAL='<script src="rep-range-final-v276.js?v=276"></script>';

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

      const appTag='<script src="app.js"></script>';
      const freshAppTag=`${RANGE_ENGINE}<script src="app.js?v=276"></script>${RANGE_UI}${RANGE_FINAL}`;
      if(html.includes(appTag))html=html.replace(appTag,freshAppTag);
      else if(html.includes('<script src="app.js?v=275"></script>')){
        html=html.replace('<script src="app.js?v=275"></script>',`${RANGE_ENGINE}<script src="app.js?v=276"></script>${RANGE_UI}${RANGE_FINAL}`);
      }else if(html.includes('<script src="app.js?v=276"></script>')&&!html.includes('rep-range-final-v276.js?v=276')){
        html=html.replace('<script src="app.js?v=276"></script>',`${RANGE_ENGINE}<script src="app.js?v=276"></script>${RANGE_UI}${RANGE_FINAL}`);
      }else if(!html.includes('rep-range-final-v276.js?v=276')){
        html=html.includes('</body>')?html.replace('</body>',`${RANGE_ENGINE}${RANGE_UI}${RANGE_FINAL}</body>`):`${html}${RANGE_ENGINE}${RANGE_UI}${RANGE_FINAL}`;
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
