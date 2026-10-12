'use strict';
(function(W){
  const D=W.document;let previousFocus=null,open=false,historyEntry=false,handlingPop=false;
  function syncStatus(){const el=D.getElementById('mp-save-status');if(!el)return;const state=W.__unvrslSyncState,user=W.cloud?.user;
    const message=!user?'Записи сохранены на этом устройстве.':state?.owner!==user.id?'Сохранено на устройстве · ожидает синхронизации.':state.status==='pending'?'Сохранено на устройстве · ожидает синхронизации.':state.status==='loading'?'Сохранено на устройстве · синхронизация…':state.status==='synced'?'Облачная копия подтверждена · '+new Date(state.at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):'Сохранено на устройстве · облако не ответило.';if(el.dataset.statusMessage!==message){el.textContent=message;el.dataset.statusMessage=message;}
    if(user&&state?.status==='error'&&!el.querySelector('button')){const retry=D.createElement('button');retry.className='btn tiny';retry.textContent='Повторить';retry.addEventListener('click',()=>W.accountSyncNow?.({quiet:false}));el.append(' ',retry);}
  }
  function sync(){
    const modal=D.getElementById('modal'),isOpen=!!modal?.classList.contains('show');
    if(isOpen&&!open){previousFocus=D.activeElement;const target=modal.querySelector('.modal-close-global,button,input');target?.focus({preventScroll:true});if(!historyEntry){W.history.pushState({...W.history.state,unvrslModal:true},'');historyEntry=true;}}
    if(!isOpen&&open){if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});if(historyEntry&&!handlingPop){historyEntry=false;W.history.back();}}open=isOpen;
    D.querySelectorAll('.field label:not([for])').forEach((label,index)=>{const control=label.parentElement.querySelector('input,select,textarea');if(control){if(!control.id)control.id='ui-field-'+index;label.htmlFor=control.id;}});
    D.querySelectorAll('.nav .ico').forEach(icon=>icon.setAttribute('aria-hidden','true'));
    D.querySelectorAll('.setrow input').forEach((input,index)=>{if(!input.hasAttribute('aria-label'))input.setAttribute('aria-label',input.inputMode==='numeric'?'Количество повторений':'Рабочий вес, кг');});
    syncStatus();
  }
  D.addEventListener('keydown',e=>{
    const modal=D.getElementById('modal');if(!modal?.classList.contains('show'))return;
    if(e.key==='Escape'){e.preventDefault();W.closeModal?.();return;}
    if(e.key==='Tab'){const nodes=[...modal.querySelectorAll('button,a,input,select,textarea,summary')].filter(el=>!el.disabled&&el.getClientRects().length&&!el.closest('[hidden]'));if(!nodes.length)return;const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&D.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&D.activeElement===last){e.preventDefault();first.focus();}}
  });
  W.addEventListener('unvrsl:sync-state',syncStatus);
  const close=W.closeModal;if(typeof close==='function')W.closeModal=function(){if(D.querySelector('.mp-composition[data-dirty="true"]')&&!W.confirm('Состав блюда изменён, но ещё не сохранён. Закрыть без сохранения?'))return;return close.apply(this,arguments);};
  W.addEventListener('popstate',()=>{if(!open)return;historyEntry=false;handlingPop=true;const back=D.querySelector('#cook-name')?D.querySelector('[data-cook="back"]'):D.querySelector('[data-mp="ingredient-back"],[data-mp="replace-back"]');if(back)back.click();else W.closeModal?.();handlingPop=false;if(D.getElementById('modal')?.classList.contains('show')){W.history.pushState({...W.history.state,unvrslModal:true},'');historyEntry=true;}});
  if(W.visualViewport){const update=()=>{D.documentElement.style.setProperty('--visible-height',W.visualViewport.height+'px');};W.visualViewport.addEventListener('resize',update);update();}
  const sheet=D.getElementById('sheet'),modal=D.getElementById('modal');if(sheet)new MutationObserver(sync).observe(sheet,{childList:true,subtree:true});if(modal)new MutationObserver(sync).observe(modal,{attributes:true,attributeFilter:['class']});sync();
})(window);
