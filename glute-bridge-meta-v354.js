'use strict';
(()=>{
 const W=window;
 if(W.__GB354)return;
 const N={barbell:'Ягодичный мост со штангой',smith:'Ягодичный мост в Смите',machine:'Ягодичный мост в тренажёре'};
 const G={barbell:'https://gymvisual.com/img/p/5/7/6/1/5761.gif',smith:'https://gymvisual.com/img/p/1/4/9/5/4/14954.gif',machine:'https://gymvisual.com/img/p/8/7/8/1/8781.gif'};
 const T={
  barbell:'Лопатки опираются на скамью, стопы устойчиво стоят на полу, штанга расположена на тазу через мягкую накладку. Подними таз за счёт ягодичных до линии плечи – таз – колени. В верхней точке не переразгибай поясницу, затем плавно опусти таз.',
  smith:'Лопатки опираются на скамью, гриф Смита расположен над тазом через мягкую накладку. Стопы поставь устойчиво. Разгибай таз за счёт ягодичных, фиксируй верхнюю точку и не переразгибай поясницу.',
  machine:'Зафиксируй корпус в тренажёре и поставь стопы устойчиво. Опускай таз подконтрольно, затем разгибай его за счёт ягодичных. В верхней точке зафиксируй сокращение ягодичных без переразгибания поясницы.'
 };
 const norm=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[‐‑‒–—-]+/g,' ').replace(/\s+/g,' ').trim();
 function kind(ex){const h=norm(`${ex?.id||''} ${ex?.rawId||''} ${ex?.strictName||''} ${ex?.n||''} ${ex?.name||''} ${ex?.eq||''}`);if(!/hip thrust|glute bridge|хип траст|ягодич.*мост/.test(h))return'';if(/smith|смит/.test(h))return'smith';if(/machine|тренаж|leverage/.test(h))return'machine';if(/barbell|штанг/.test(h))return'barbell';return''}
 function enrich(ex){if(!ex||typeof ex!=='object')return ex;const k=kind(ex);if(!k)return ex;const gif=k==='barbell'&&W.__UNVRSL_GBB64?`data:image/gif;base64,${W.__UNVRSL_GBB64}`:G[k];const old=ex.instructions||{};return {...ex,n:N[k],name:N[k],strictName:N[k],bp:'upper legs',tg:'glutes',eq:k==='barbell'?'barbell':k==='smith'?'smith machine':'leverage machine',gif,gif_url:gif,image:gif,mediaUnavailable:false,instructions:typeof old==='string'?{ru:old||T[k]}:{...old,ru:String(old.ru||old.russian||T[k])}}}
 W.__GB354={N,G,T,norm,kind,enrich};
})();
