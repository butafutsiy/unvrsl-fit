'use strict';
const AUTH_LOGIN_KEY='unvrsl-fit-login-email-v1';
const AUTH_TRUSTED_DEVICE_KEY='unvrsl-fit-trusted-device-v1';
const AUTH_TRUSTED_MAX_AGE=1000*60*60*24*45;
function authSavedLogin(){try{return localStorage.getItem(AUTH_LOGIN_KEY)||''}catch(e){return''}}
function authRememberLogin(email){try{localStorage.setItem(AUTH_LOGIN_KEY,String(email||'').trim().toLowerCase())}catch(e){}}
function authErrorRu(error){const m=String(error?.message||'').toLowerCase();if(m.includes('invalid login credentials'))return'Неверный логин или пароль.';if(m.includes('email not confirmed'))return'Почта ещё не подтверждена.';if(m.includes('rate limit'))return'Слишком много попыток. Попробуй немного позже.';if(m.includes('jwt')||error?.status===401)return'Сервис авторизации временно отклонил сессию. Попробуй войти ещё раз чуть позже.';return error?.message||'Не удалось выполнить вход.'}
function authProjectRef(){try{const u=new URL(typeof cloudConfig==='function'?cloudConfig().url:(window.UNVRSL_CLOUD?.url||''));return u.hostname.split('.')[0]||''}catch(e){return''}}
function authDecodeStoredValue(raw){
 if(!raw)return null;let text=String(raw);
 try{
  if(text.startsWith('base64-')){const b64=text.slice(7).replace(/-/g,'+').replace(/_/g,'/');const pad=b64+'='.repeat((4-b64.length%4)%4);text=decodeURIComponent(Array.from(atob(pad),c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join(''))}
  return JSON.parse(text)
 }catch(e){return null}
}
function authStoredSupabaseSession(){
 try{
  const ref=authProjectRef();if(!ref)return null;const x=authDecodeStoredValue(localStorage.getItem(`sb-${ref}-auth-token`));
  if(x?.user?.id)return x;if(x?.currentSession?.user?.id)return x.currentSession;if(x?.session?.user?.id)return x.session;return null
 }catch(e){return null}
}
function authTrustedDevice(){try{const x=JSON.parse(localStorage.getItem(AUTH_TRUSTED_DEVICE_KEY)||'null');if(!x?.user?.id)return null;if(Date.now()-(+x.verifiedAt||0)>AUTH_TRUSTED_MAX_AGE)return null;return x}catch(e){return null}}
function authRememberTrustedDevice(user,profile){
 if(!user?.id)return;try{
  const old=authTrustedDevice(),same=old?.user?.id===user.id;
  const safeUser={id:String(user.id),email:String(user.email||''),aud:user.aud||'authenticated',role:user.role||'authenticated',app_metadata:user.app_metadata||{},user_metadata:user.user_metadata||{}};
  const p=profile?{id:String(profile.id||user.id),display_name:String(profile.display_name||''),role:String(profile.role||'client')}:same?(old.profile||null):null;
  localStorage.setItem(AUTH_TRUSTED_DEVICE_KEY,JSON.stringify({user:safeUser,profile:p,verifiedAt:Date.now()}));
 }catch(e){}
}
function authLocalIdentity(){
 const live=authStoredSupabaseSession(),trusted=authTrustedDevice();
 if(live?.user?.id){const profile=trusted?.user?.id===live.user.id?trusted.profile:null;return{user:live.user,profile,source:'supabase-storage'}}
 if(trusted?.user?.id)return{user:trusted.user,profile:trusted.profile||null,source:'trusted-device'};
 return null
}
function authOfflineProfile(user,profile){
 if(profile)return profile;const email=String(user?.email||'').trim().toLowerCase(),display=String(user?.user_metadata?.full_name||email.split('@')[0]||'Аккаунт');return{id:user?.id||'',display_name:display,role:email==='butafutsiy@mail.ru'?'trainer':'client'}
}
function authHasOfflineIdentity(){return !!authLocalIdentity()?.user?.id}
window.cloudUseTrustedDevice=function(){
 const x=authLocalIdentity();if(!x?.user?.id)return toast('На этом устройстве нет сохранённого входа');
 cloud.user=x.user;cloud.profile=authOfflineProfile(x.user,x.profile);cloud.offlineIdentity=true;cloud.degraded=true;cloud.lastError='Supabase временно недоступен — локальный режим';window.__unvrslCloudDegraded=true;
 authRememberLogin(x.user.email||'');closeModal();renderCloudAffordances();try{render()}catch(_){ }toast('Открыт локальный режим')
};
window.cloudRetryAuthConnection=async function(){
 if(!cloud?.client)return toast('Облако ещё загружается');const btn=$('#sheet button[data-retry-cloud]');if(btn){btn.disabled=true;btn.textContent='Проверяю…';btn.style.opacity='.65'}
 try{
  const timeout=new Promise(resolve=>setTimeout(()=>resolve({__timeout:true}),6500));const r=await Promise.race([cloud.client.auth.getSession(),timeout]);
  if(r?.__timeout)return toast('Supabase пока не отвечает');if(r?.error){if(typeof cloudMarkDegraded==='function')cloudMarkDegraded(r.error);return toast(authErrorRu(r.error))}
  const user=r?.data?.session?.user||null;if(!user)return toast('Облачная сессия пока недоступна');
  cloud.user=user;cloud.profile=null;cloud.offlineIdentity=false;if(typeof cloudMarkHealthy==='function')cloudMarkHealthy();authRememberLogin(user.email||'');authRememberTrustedDevice(user,null);closeModal();renderCloudAffordances();try{render()}catch(_){ }if(typeof cloudDeferProfile==='function')cloudDeferProfile('manual-reconnect');toast('Облако подключено')
 }catch(e){if(typeof cloudMarkDegraded==='function')cloudMarkDegraded(e);toast('Supabase пока не отвечает')}finally{if(btn){btn.disabled=false;btn.textContent='Повторить подключение';btn.style.opacity=''}}
};
window.cloudLeaveOfflineMode=function(){cloud.user=null;cloud.profile=null;cloud.offlineIdentity=false;closeModal();renderCloudAffordances();try{render()}catch(_){ }toast('Локальный режим закрыт')};

window.cloudPasswordLoginSheet=function(){
 const saved=authSavedLogin(),offline=authHasOfflineIdentity(),notice=cloud?.degraded?`<div class="card" style="margin:14px 0"><b>Есть проблема со связью с облаком</b><div class="muted small" style="margin-top:5px">Локальные данные приложения сохранены. Можно попробовать войти повторно.</div></div>`:'';
 const offlineButton=offline?`<button class="btn full" style="margin-top:10px" onclick="cloudUseTrustedDevice()">Продолжить на этом устройстве</button><div class="muted small" style="margin:8px 4px 0">Используется только ранее сохранённый вход. Облачные действия останутся выключены до восстановления Supabase.</div>`:'';
 modal(`<div class="sheet-grabber"></div><h2>Вход в UNVRSL FIT</h2><div class="muted">Войди по логину и паролю. Письмо не требуется.</div>${notice}<div class="field"><label>Логин</label><input id="authLogin" type="email" inputmode="email" autocomplete="username" value="${esc(saved)}" placeholder="name@example.com"></div><div class="field"><label>Пароль</label><input id="authPassword" type="password" autocomplete="current-password" placeholder="Пароль" onkeydown="if(event.key==='Enter')cloudSignInPassword()"></div><button class="btn primary full" onclick="cloudSignInPassword()">Войти</button>${offlineButton}<button class="btn full" style="margin-top:10px" onclick="cloudMagicFallbackSheet()">Войти по ссылке из письма</button>`)
};
window.cloudMagicFallbackSheet=function(){
 modal(`<div class="sheet-grabber"></div><h2>Первичная настройка входа</h2><div class="muted">Если пароль ещё не был установлен, один раз войди по ссылке из письма. После подтверждения приложение сразу предложит создать пароль, и дальше письма не понадобятся.</div><div class="field"><label>Электронная почта</label><input id="cloudEmail" type="email" inputmode="email" value="${esc(authSavedLogin())}" placeholder="name@example.com"></div><button class="btn primary full" onclick="cloudSendMagic()">Получить ссылку</button><button class="btn full" style="margin-top:10px" onclick="cloudPasswordLoginSheet()">Назад к паролю</button>`)
};
window.cloudSignInPassword=async function(){
 if(!cloud?.client)return toast('Облако ещё загружается');
 const email=$('#authLogin')?.value.trim().toLowerCase(),password=$('#authPassword')?.value||'';
 if(!email)return toast('Введи логин');if(!password)return toast('Введи пароль');
 const btn=$('#sheet button.btn.primary');if(btn){btn.disabled=true;btn.textContent='Вхожу…';btn.style.opacity='.65'}
 try{
  const timeout=new Promise(resolve=>setTimeout(()=>resolve({__timeout:true}),9000));const result=await Promise.race([cloud.client.auth.signInWithPassword({email,password}),timeout]);
  if(result?.__timeout){if(typeof cloudMarkDegraded==='function')cloudMarkDegraded(new Error('Auth timeout'));if(btn){btn.disabled=false;btn.textContent='Войти';btn.style.opacity=''}return toast('Supabase долго отвечает. Можно продолжить локально, если вход уже сохранялся на этом устройстве.')}
  const {data,error}=result||{};
  if(error){if(typeof cloudMarkDegraded==='function'&&(error?.status>=500||String(error?.message||'').toLowerCase().includes('jwt')))cloudMarkDegraded(error);if(btn){btn.disabled=false;btn.textContent='Войти';btn.style.opacity=''}const m=String(error?.message||'').toLowerCase();if(m.includes('invalid login credentials'))return modal(`<div class="sheet-grabber"></div><h2>Пароль не подошёл</h2><div class="muted">Если ты ещё ни разу не сохранял этот пароль в аккаунте, он пока не активен. Войди один раз по ссылке из письма — после подтверждения сразу появится экран создания пароля.</div><button class="btn primary full" style="margin-top:18px" onclick="cloudMagicFallbackSheet()">Настроить пароль</button><button class="btn full" style="margin-top:10px" onclick="cloudPasswordLoginSheet()">Назад</button>`);return toast(authErrorRu(error))}
  authRememberLogin(email);cloud.user=data?.user||data?.session?.user||null;cloud.profile=null;cloud.offlineIdentity=false;if(typeof cloudMarkHealthy==='function')cloudMarkHealthy();if(cloud.user)authRememberTrustedDevice(cloud.user,null);closeModal();renderCloudAffordances();try{render()}catch(_){ }toast('Вход выполнен');if(cloud.user&&typeof cloudDeferProfile==='function')cloudDeferProfile('password-signin');
 }catch(e){if(typeof cloudMarkDegraded==='function')cloudMarkDegraded(e);if(btn){btn.disabled=false;btn.textContent='Войти';btn.style.opacity=''}toast('Нет связи с сервером')}
};
window.cloudSetPasswordSheet=function(){
 if(cloud?.offlineIdentity)return toast('Сначала восстанови подключение к облаку');if(!cloud?.user)return cloudPasswordLoginSheet();
 modal(`<div class="sheet-grabber"></div><h2>Пароль для входа</h2><div class="muted">Установи пароль один раз. После этого можно входить без писем. Пароль хранится в Supabase в защищённом виде и не записывается в код приложения.</div><div class="field"><label>Новый пароль</label><input id="authNewPassword" type="password" autocomplete="new-password" placeholder="Минимум 6 символов"></div><div class="field"><label>Повтори пароль</label><input id="authNewPassword2" type="password" autocomplete="new-password" placeholder="Повтори пароль"></div><button class="btn primary full" onclick="cloudSavePassword()">Сохранить пароль</button><button class="btn full" style="margin-top:10px" onclick="cloudAccountSheet()">Назад</button>`)
};
window.cloudSavePassword=async function(){
 if(cloud?.offlineIdentity)return toast('Облако пока недоступно');const p=$('#authNewPassword')?.value||'',p2=$('#authNewPassword2')?.value||'';
 if(p.length<6)return toast('Пароль должен быть не короче 6 символов');if(p!==p2)return toast('Пароли не совпадают');
 const btn=$('#sheet button.btn.primary');if(btn){btn.disabled=true;btn.textContent='Сохраняю…';btn.style.opacity='.65'}
 try{const {error}=await cloud.client.auth.updateUser({password:p});if(error){if(btn){btn.disabled=false;btn.textContent='Сохранить пароль';btn.style.opacity=''}return toast(authErrorRu(error))}authRememberLogin(cloud.user?.email||'');authRememberTrustedDevice(cloud.user,cloud.profile);modal(`<div class="sheet-grabber"></div><h2>Пароль установлен</h2><div class="muted">Теперь на этом и других устройствах можно входить по логину и паролю без письма.</div><button class="btn primary full" onclick="closeModal()">Готово</button>`)}catch(e){toast('Не удалось сохранить пароль')}
};

const _passwordAccountSheet=window.cloudAccountSheet;
window.cloudAccountSheet=function(){
 if(!cloudConfigured())return typeof cloudSetupSheet==='function'?cloudSetupSheet():null;
 if(!cloud?.user)return cloudPasswordLoginSheet();
 const trainer=(typeof unvrslTrainerMode==='function'&&unvrslTrainerMode())||cloud.profile?.role==='trainer',role=trainer?'Тренер':'Клиент';
 if(cloud?.offlineIdentity){return modal(`<div class="sheet-grabber"></div><h2>${esc(cloud.profile?.display_name||'Аккаунт')}</h2><div class="muted">${esc(cloud.user.email||'')}</div><div class="card" style="margin-top:14px"><b>Локальный режим</b><div class="muted small" style="margin-top:5px">Это устройство уже использовалось для входа. Локальные тренировки и записи доступны, но серверные изменения заблокированы до восстановления Supabase.</div></div><div class="settings-card"><div class="setting"><div><b>Роль</b><div class="muted small">${role}</div></div><span class="chip green">${role}</span></div><div class="setting"><div><b>Облако</b><div class="muted small">Попробовать вернуть обычную сессию</div></div><button class="btn tiny" data-retry-cloud onclick="cloudRetryAuthConnection()">Повторить подключение</button></div></div><button class="btn full" onclick="cloudLeaveOfflineMode()">Закрыть локальный режим</button>`)}
 const offline=cloud?.degraded?`<div class="card" style="margin-top:14px"><b>Облако временно недоступно</b><div class="muted small" style="margin-top:5px">Приложение продолжит работать с данными на устройстве. Облачная синхронизация восстановится автоматически.</div></div>`:'';
 authRememberTrustedDevice(cloud.user,cloud.profile);
 modal(`<div class="sheet-grabber"></div><h2>${esc(cloud.profile?.display_name||'Аккаунт')}</h2><div class="muted">${esc(cloud.user.email||'')}</div>${offline}<div class="settings-card"><div class="setting"><div><b>Роль</b><div class="muted small">${role}</div></div><span class="chip green">${role}</span></div><div class="setting"><div><b>Имя</b></div><button class="btn tiny" onclick="cloudRenameSheet()">Изменить</button></div><div class="setting"><div><b>Пароль</b><div class="muted small">Вход без писем</div></div><button class="btn tiny" onclick="cloudSetPasswordSheet()">Установить / сменить</button></div><div class="setting"><div><b>Синхронизация</b><div class="muted small">Тренировки и вес</div></div><button class="btn tiny" onclick="cloudSyncAll()">Синхр.</button></div></div><button class="btn danger full" onclick="cloudSignOut()">Выйти</button>`)
};

function authRefreshTrustedSnapshot(){try{if(cloud?.user&&!cloud?.offlineIdentity&&!cloud?.degraded)authRememberTrustedDevice(cloud.user,cloud.profile)}catch(e){}}
window.addEventListener?.('unvrsl:app-ready',authRefreshTrustedSnapshot,{passive:true});
window.addEventListener?.('unvrsl:cloud-ready',()=>setTimeout(authRefreshTrustedSnapshot,1200),{passive:true});
setTimeout(authRefreshTrustedSnapshot,3500);
