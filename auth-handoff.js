'use strict';
const AUTH_HANDOFF_KEY='unvrsl-fit-auth-handoff-v1';
let authHandoffTimer=null,authHandoffBusy=false;
function authHandoffRandom(){const b=new Uint8Array(32);crypto.getRandomValues(b);return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('')}
function authHandoffRead(){try{return JSON.parse(localStorage.getItem(AUTH_HANDOFF_KEY)||'null')}catch(e){return null}}
function authHandoffWrite(x){localStorage.setItem(AUTH_HANDOFF_KEY,JSON.stringify(x))}
function authHandoffClear(){localStorage.removeItem(AUTH_HANDOFF_KEY);if(authHandoffTimer){clearInterval(authHandoffTimer);authHandoffTimer=null}}
function authHandoffRedirect(secret){const u=new URL(location.origin+location.pathname);if(cloud.invite)u.searchParams.set('invite',cloud.invite);u.searchParams.set('auth_handoff',secret);return u.toString()}
function authHandoffFresh(x){return !!(x?.secret&&Date.now()-(+x.created||0)<60*60*1000)}
function authOfferPasswordSetup(){setTimeout(()=>{if(cloud?.user&&typeof window.cloudSetPasswordSheet==='function')modal(`<div class="sheet-grabber"></div><h2>Вход подтверждён</h2><div class="muted">Теперь задай пароль для входа. После этого письма больше не понадобятся.</div><button class="btn primary full" style="margin-top:18px" onclick="cloudSetPasswordSheet()">Задать пароль</button><button class="btn full" style="margin-top:10px" onclick="closeModal()">Позже</button>`)},250)}
async function authHandoffAdoptSession(){if(!cloud?.client)return false;const {data}=await cloud.client.auth.getSession();if(data?.session?.user){cloud.user=data.session.user;if(!cloud.profile)await cloudEnsureProfile();authHandoffClear();closeModal();renderCloudAffordances();render();toast('Вход выполнен');authOfferPasswordSetup();return true}return false}
async function authHandoffPollOnce(showErrors=false){
 if(authHandoffBusy||!cloud?.ready||!cloud?.client)return false;const h=authHandoffRead();if(!authHandoffFresh(h)){if(h)authHandoffClear();return false}
 authHandoffBusy=true;
 try{
  if(await authHandoffAdoptSession())return true;
  const {data,error}=await cloud.client.functions.invoke('auth-handoff-redeem',{body:{handoff:h.secret}});
  if(error){if(showErrors)toast('Пока не подтверждено');return false}
  if(data?.token_hash){
   const r=await cloud.client.auth.verifyOtp({token_hash:data.token_hash,type:'email'});
   if(r.error){if(showErrors)modal(`<div class="sheet-grabber"></div><h2>Не удалось перенести вход</h2><div class="muted">Ссылка была подтверждена, но сессия не перенеслась. Запроси одну новую ссылку и попробуй ещё раз.</div><button class="btn full" onclick="cloudAccountSheet()">Назад</button>`);authHandoffClear();return false}
   cloud.user=r.data?.session?.user||r.data?.user||null;if(cloud.user)await cloudEnsureProfile();authHandoffClear();closeModal();renderCloudAffordances();render();toast('Вход выполнен');authOfferPasswordSetup();return true
  }
  if(data?.expired){authHandoffClear();if(showErrors)toast('Подтверждение устарело');return false}
  if(data?.used){if(await authHandoffAdoptSession())return true;authHandoffClear();if(showErrors)toast('Ссылка уже использована');return false}
  if(showErrors)toast('Открой ссылку из письма');
 }catch(e){if(showErrors)toast('Нет связи с сервером')}finally{authHandoffBusy=false}
 return false
}
function authHandoffStart(){if(authHandoffTimer)clearInterval(authHandoffTimer);const h=authHandoffRead();if(!authHandoffFresh(h))return;authHandoffTimer=setInterval(()=>authHandoffPollOnce(false),2500);setTimeout(()=>authHandoffPollOnce(false),700)}
function authHandoffManualCheck(){authHandoffPollOnce(true)}
async function authHandoffPublish(){
 const secret=new URLSearchParams(location.search).get('auth_handoff');if(!secret||secret.length<32)return false;
 if(!cloud?.ready||!cloud?.client||!cloud?.user)return false;
 try{
  const {data,error}=await cloud.client.functions.invoke('auth-handoff-create',{body:{handoff:secret}});
  if(error||!data?.ok)return false;
  const u=new URL(location.href);u.searchParams.delete('auth_handoff');u.hash='';history.replaceState({},'',u.pathname+(u.search||''));
  modal(`<div class="sheet-grabber"></div><h2>Вход подтверждён</h2><div class="muted">Аккаунт подтверждён. Сразу задай пароль — после этого сможешь входить обычным логином и паролем без писем.</div><button class="btn primary full" style="margin-top:18px" onclick="cloudSetPasswordSheet()">Задать пароль</button><button class="btn full" style="margin-top:10px" onclick="closeModal()">Позже</button>`);return true
 }catch(e){return false}
}
function authHandoffWatchRedirect(){let tries=0;const t=setInterval(async()=>{tries++;if(await authHandoffPublish()||tries>30)clearInterval(t)},500)}

window.cloudSendMagic=async function(){
 const email=$('#cloudEmail')?.value.trim();if(!email)return toast('Введи почту');
 const left=typeof authCooldownLeft==='function'?authCooldownLeft(email):0;if(left>0)return modal(`<div class="sheet-grabber"></div><h2>Проверь почту</h2><div class="muted">Запрос уже отправлен. Повторная отправка будет доступна примерно через ${left} сек. Используй самое новое письмо.</div><button class="btn full" style="margin-top:18px" onclick="cloudAccountSheet()">Назад</button>`);
 const btn=$('#sheet button.btn.primary');if(btn){btn.disabled=true;btn.textContent='Отправляю…';btn.style.opacity='.65'}
 const secret=authHandoffRandom();authHandoffWrite({secret,email,created:Date.now(),invite:cloud.invite||null});
 try{
  const {error}=await cloud.client.auth.signInWithOtp({email,options:{emailRedirectTo:authHandoffRedirect(secret)}});
  if(error){authHandoffClear();if(typeof authFriendlyError==='function'&&authFriendlyError(error,email))return;return modal(`<div class="sheet-grabber"></div><h2>Не удалось отправить письмо</h2><div class="muted">${esc(error.message||'Попробуй ещё раз позже.')}</div><button class="btn full" style="margin-top:18px" onclick="cloudAccountSheet()">Назад</button>`)}
  if(typeof authRememberSend==='function')authRememberSend(email);authHandoffStart();
  modal(`<div class="sheet-grabber"></div><h2>Проверь почту</h2><div class="muted">Открой самое новое письмо и нажми ссылку. Даже если она откроется в Safari, это окно UNVRSL FIT само подхватит вход.</div><div class="card" style="margin-top:16px"><b>${esc(email)}</b><div class="muted small" style="margin-top:5px">После подтверждения приложение предложит сразу создать пароль для дальнейшего входа без писем.</div></div><button class="btn primary full" onclick="authHandoffManualCheck()">Проверить вход</button><button class="btn full" style="margin-top:10px" onclick="cloudAccountSheet()">Назад</button>`)
 }catch(e){authHandoffClear();modal(`<div class="sheet-grabber"></div><h2>Ошибка соединения</h2><div class="muted">Не удалось связаться с сервером. Проверь интернет и попробуй позже.</div><button class="btn full" style="margin-top:18px" onclick="cloudAccountSheet()">Назад</button>`)}
};
setTimeout(()=>{authHandoffStart();authHandoffWatchRedirect()},0);
