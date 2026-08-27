'use strict';
(()=>{
  if(window.UNVRSL_SUPABASE_READY)return;
  window.UNVRSL_SUPABASE_READY=(async()=>{
    if(window.supabase?.createClient)return window.supabase;
    await new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-unvrsl-supabase]');
      if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return}
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.111.0/dist/umd/supabase.min.js';
      s.async=true;
      s.crossOrigin='anonymous';
      s.referrerPolicy='no-referrer';
      s.dataset.unvrslSupabase='1';
      s.onload=resolve;
      s.onerror=()=>reject(new Error('Supabase client failed to load'));
      document.head.appendChild(s);
    });
    if(!window.supabase?.createClient)throw new Error('Supabase client unavailable');
    return window.supabase;
  })();
})();
