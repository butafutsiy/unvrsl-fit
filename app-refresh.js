'use strict';
(()=>{
  const W=window,D=document;
  let available=null,busy=false,checking=null,lastCheck=0;
  // The notice is a sibling of .page, so it does not inherit page gutters.
  // Match the same responsive horizontal spacing as the home cards.
  const noticeStyle=D.createElement('style');
  noticeStyle.id='app-update-notice-layout';
  noticeStyle.textContent=`
    .app > #app-update-notice.card{
      display:block;
      width:auto;
      max-width:calc(100% - 30px);
      margin:10px 15px!important;
      box-sizing:border-box;
      min-width:0;
      overflow-wrap:anywhere;
    }
    .app > #app-update-notice .btn{
      width:100%;
      max-width:100%;
      min-width:0;
      white-space:normal;
    }
    @media (max-width:380px){
      .app > #app-update-notice.card{
        max-width:calc(100% - 24px);
        margin-left:12px!important;
        margin-right:12px!important;
      }
    }
  `;
  D.head.appendChild(noticeStyle);
  const current=()=>String(W.__unvrslRelease||'');
  const newer=release=>/^v\d+$/.test(release)&&Number(release.slice(1))>Number(current().slice(1)||0);
  function offer(release){
    if(!newer(release))return;
    available=release;
    let banner=D.getElementById('app-update-notice');
    if(!banner){banner=D.createElement('div');banner.id='app-update-notice';banner.className='card';banner.setAttribute('role','status');D.querySelector('.topbar')?.insertAdjacentElement('afterend',banner)}
    if(banner){banner.innerHTML='<b>Доступно обновление приложения</b><p class="muted small">Текущая версия '+current()+' · новая '+release+'</p><button class="btn primary full" id="apply-app-update">Сохранить данные и обновить</button>';banner.querySelector('button').onclick=()=>W.applyAppUpdate()}
  }
  W.checkAppUpdate=async function(manual=false){
    if(checking)return checking;
    if(!manual&&Date.now()-lastCheck<60000)return;
    lastCheck=Date.now();
    checking=(async()=>{
      try{
        const response=await W.fetch('./index.html',{cache:'no-store'});
        if(!response.ok)throw Error('Проверь интернет и повтори проверку обновления');
        const html=await response.text(),release=html.match(/__unvrslRelease\s*=\s*['"](v\d+)['"]/)?.[1];
        if(!release)throw Error('Не удалось проверить версию приложения');
        const registration=await W.navigator.serviceWorker?.getRegistration?.();
        if(registration)await registration.update();
        if(newer(release)){offer(release);if(manual)W.toast?.('Обновление доступно — нажми «Сохранить данные и обновить»')}
        else if(manual)W.toast?.('Установлена актуальная версия '+current());
        return release;
      }catch(error){if(manual)W.toast?.(error.message);return null}
      finally{checking=null}
    })();
    return checking;
  };
  W.applyAppUpdate=async function(){
    if(busy||!available)return false;
    busy=true;
    try{
      const ok=W.persistWorkoutState?await W.persistWorkoutState():W.save?.();
      if(ok!==true)throw Error('Не удалось сохранить данные. Повтори обновление.');
      const registration=await W.navigator.serviceWorker?.getRegistration?.();
      registration?.waiting?.postMessage({type:'SKIP_WAITING'});
      W.location.reload();return true;
    }catch(error){W.toast?.(error.message);return false}
    finally{busy=false}
  };
  W.navigator.serviceWorker?.addEventListener?.('message',event=>{
    if(event.data?.type==='UNVRSL_RELEASE_READY')offer(String(event.data.release||''));
  });
  D.addEventListener('visibilitychange',()=>{if(!D.hidden)W.checkAppUpdate()});
  W.addEventListener('unvrsl:app-ready',()=>W.checkAppUpdate(),{once:true});
})();
