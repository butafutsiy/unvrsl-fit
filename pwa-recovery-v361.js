'use strict';
(()=>{
  const W=window;
  if(W.__unvrslPwaRecoveryV361)return;
  W.__unvrslPwaRecoveryV361=true;
  const KEY='unvrsl-pwa-recovery-v361';
  try{if(localStorage.getItem(KEY)==='done')return}catch(_){ }
  if(!navigator.onLine)return;

  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function recover(){
    try{
      if('caches'in W){
        const keys=await caches.keys();
        await Promise.all(keys.filter(k=>/^unvrsl-static-v/i.test(k)).map(k=>caches.delete(k).catch(()=>false)));
      }
      if('serviceWorker'in navigator){
        const reg=await navigator.serviceWorker.register('./sw.js?v=361',{scope:'./',updateViaCache:'none'});
        try{await reg.update()}catch(_){ }
        for(let i=0;i<20;i++){
          if(reg.active?.scriptURL?.includes('v=361')||navigator.serviceWorker.controller?.scriptURL?.includes('v=361'))break;
          await wait(120);
        }
      }
      try{localStorage.setItem(KEY,'done')}catch(_){ }
      const u=new URL(location.href);
      u.searchParams.set('release','361');
      location.replace(u.href);
    }catch(e){
      console.warn('UNVRSL PWA recovery v361',e);
    }
  }
  setTimeout(recover,80);
})();
