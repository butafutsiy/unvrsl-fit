const CACHE_PREFIX='unvrsl-fit-';
const REP_RANGE_SCRIPT='<script src="rep-range-mobile-v272.js?v=272"></script>';

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
  if(url.origin!==self.location.origin)return;

  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      const res=await fetch(event.request,{cache:'no-store'});
      const type=res.headers.get('content-type')||'';
      if(!res.ok||!type.includes('text/html'))return res;
      let html=await res.text();
      if(!html.includes('rep-range-mobile-v272.js')){
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
