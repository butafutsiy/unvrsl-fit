'use strict';
(()=>{
  if(window.__unvrslAnatomeMuscleMap)return;
  window.__unvrslAnatomeMuscleMap=true;
  // Only the shell lives here. muscle-map-full.js owns history and rendering.
  const style=document.createElement('style');
  style.id='anatome-muscle-map-style';
  style.textContent=`.anatome-card{position:relative}.anatome-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px}.anatome-title{font-size:18px;font-weight:850}.anatome-sub{font-size:12px;color:#85858b;margin-top:4px}.anatome-seg{display:flex;background:#303035;padding:2px;border-radius:10px;flex:0 0 auto}.anatome-seg button{border:0;background:transparent;color:#9999a0;padding:7px 9px;border-radius:8px;font-size:12px;font-weight:750}.anatome-seg button.on{background:#1d1d20;color:#fff}.anatome-body{display:grid;grid-template-columns:1fr;gap:12px;align-items:center}.anatome-figure{min-height:255px;display:grid;place-items:center;background:radial-gradient(circle at 50% 45%,rgba(191,90,242,.09),transparent 65%);border-radius:18px;overflow:hidden}.anatome-loading,.anatome-empty{color:#85858b;font-size:13px;text-align:center;padding:45px 14px}.anatome-top{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.anatome-muscle{background:#17171a;border:1px solid #292a2f;border-radius:13px;padding:10px}.anatome-muscle-row{display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:12px}.anatome-muscle-row b{font-size:12px}.anatome-muscle-row span{color:#8e8e93;font-variant-numeric:tabular-nums}.anatome-bar{height:5px;background:#2b2b30;border-radius:99px;overflow:hidden;margin-top:7px}.anatome-bar i{display:block;height:100%;background:#bf5af2;border-radius:99px}.anatome-foot{color:#6f6f76;font-size:10px;line-height:1.35;margin-top:10px}.anatome-error{color:#ff9f0a;font-size:12px;text-align:center;padding:36px 12px}`;
  document.head.appendChild(style);
  function cardHtml(){return `<div id="anatomeMuscleCard" class="sd2-card anatome-card"><div class="anatome-head"><div><div class="anatome-title">Нагрузка по мышцам</div><div class="anatome-sub">Последние 7 дн.</div></div><div class="anatome-seg"><button data-days="7" class="on">7 дн.</button><button data-days="28">28 дн.</button></div></div><div class="anatome-tonnage-local"><span>Тоннаж за 7 дней</span><b>—</b><small>Считаю по выполненным подходам…</small></div><div class="anatome-body"><div class="anatome-figure"><div class="anatome-loading">Строю карту…</div></div><div class="anatome-top"></div></div><div class="anatome-foot">Тоннаж рассчитан по завершённым подходам с фактически указанной нагрузкой. Вес тела учитывается только если он сохранён.</div></div>`}
  function mount(){
    const root=document.getElementById('stats');if(!root)return null;
    let card=root.querySelector('#anatomeMuscleCard');
    if(!card){const anchor=root.querySelector('.sd2-grid')||root.querySelector('.sd2-head');if(!anchor)return null;const wrap=document.createElement('div');wrap.innerHTML=cardHtml();card=wrap.firstElementChild;anchor.insertAdjacentElement('afterend',card)}
    if(card.dataset.anatomeBound!=='401'){
      card.dataset.anatomeBound='401';
      card.querySelectorAll('[data-days]').forEach(button=>button.addEventListener('click',()=>{
        if(button.classList.contains('on'))return;
        card.querySelectorAll('[data-days]').forEach(item=>item.classList.toggle('on',item===button));
        window.unvrslRefreshMuscleMap211?.();
      }));
      window.unvrslRefreshMuscleMap211?.();
    }
    return card;
  }
  window.anatomeMuscleCardHtmlV254=cardHtml;
  window.anatomeMountCardV254=mount;
  const root=document.getElementById('stats');
  if(root){new MutationObserver(()=>queueMicrotask(mount)).observe(root,{childList:true});mount()}
  else document.addEventListener('DOMContentLoaded',()=>{const later=document.getElementById('stats');if(later){new MutationObserver(()=>queueMicrotask(mount)).observe(later,{childList:true});mount()}},{once:true});
})();
