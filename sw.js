const SW_RELEASE='v277-preview-only';
const PREVIEW_REPS='<script src="preview-reps-v277.js?v=277"></script>';

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

      // Only one repetition-range layer remains. It loads before plan-w1 so it
      // can retire every older range renderer, but it changes preview text only.
      if(!html.includes('preview-reps-v277.js')){
        const planTag=/<script src="plan-w1\.js[^"]*"><\/script>/;
        if(planTag.test(html))html=html.replace(planTag,m=>`${PREVIEW_REPS}${m}`);
        else html=html.includes('</body>')?html.replace('</body>',`${PREVIEW_REPS}</body>`):`${html}${PREVIEW_REPS}`;
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
