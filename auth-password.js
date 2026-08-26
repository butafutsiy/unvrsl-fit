'use strict';
const AUTH_LOGIN_KEY='unvrsl-fit-login-email-v1';
function authSavedLogin(){try{return localStorage.getItem(AUTH_LOGIN_KEY)||''}catch(e){return''}}
function authRememberLogin(email){try{localStorage.setItem(AUTH_LOGIN_KEY,String(email||'').trim().toLowerCase())}catch(e){}}
function authErrorRu(error){const m=String(error?.message||'').toLowerCase();if(m.includes('invalid login credentials'))return'Неверный логин или пароль.';if(m.includes('email not confirmed'))return'Почта ещё не подтверждена.';if(m.includes('rate limit'))return'Слишком много попыток. Попробуй немного позже.';return error?.message||'Не удалось выполнить вход.'}

window.cloudPasswordLoginSheet=function(){
 const saved=authSavedLogin();
 modal(`<div class="sheet-grabber"></div><h2>Вход в UNVRSL FIT</h2><div class="muted">Войди по логину и паролю. Письмо не требуется.</div><div class="field"><label>Логин</label><input id="authLogin" type="email" inputmode="email" autocomplete="username" value="${esc(saved)}" placeholder="name@example.com"></div><div class="field"><label>Пароль</label><input id="authPassword" type="password" autocomplete="current-password" placeholder="Пароль" onkeydown="if(event.key==='Enter')cloudSignInPassword()"></div><button class="btn primary full" onclick="cloudSignInPassword()">Войти</button><button class="btn full" style="margin-top:10px" onclick="cloudMagicFallbackSheet()">Войти по ссылке из письма</button>`)
};
window.cloudMagicFallbackSheet=function(){
 modal(`<div class="sheet-grabber"></div><h2>Вход по почте</h2><div class="muted">Резервный способ. На почту придёт одноразовая ссылка.</div><div class="field"><label>Электронная почта</label><input id="cloudEmail" type="email" inputmode="email" value="${esc(authSavedLogin())}" placeholder="name@example.com"></div><button class="btn primary full" onclick="cloudSendMagic()">Получить ссылку</button><button class="btn full" style="margin-top:10px" onclick="cloudPasswordLoginSheet()">Назад к паролю</button>`)
};
window.cloudSignInPassword=async function(){
 if(!cloud?.client)return toast('Облако ещё загружается');
 const email=$('#authLogin')?.value.trim().toLowerCase(),password=$('#authPassword')?.value||'';
 if(!email)return toast('Введи логин');if(!password)return toast('Введи пароль');
 const btn=$('#sheet button.btn.primary');if(btn){btn.disabled=true;btn.textContent='Вхожу…';btn.style.opacity='.65'}
 try{
  const {data,error}=await cloud.client.auth.signInWithPassword({email,password});
  if(error){if(btn){btn.disabled=false;btn.textContent='Войти';btn.style.opacity=''}return toast(authErrorRu(error))}
  authRememberLogin(email);cloud.user=data?.user||data?.session?.user||null;cloud.profile=null;if(cloud.user)await cloudEnsureProfile();closeModal();renderCloudAffordances();render();toast('Вход выполнен');
 }catch(e){if(btn){btn.disabled=false;btn.textContent='Войти';btn.style.opacity=''}toast('Нет связи с сервером')}
};
window.cloudSetPasswordSheet=function(){
 if(!cloud?.user)return cloudPasswordLoginSheet();
 modal(`<div class="sheet-grabber"></div><h2>Пароль для входа</h2><div class="muted">Установи пароль один раз. После этого можно входить без писем. Пароль хранится в Supabase в защищённом виде и не записывается в код приложения.</div><div class="field"><label>Новый пароль</label><input id="authNewPassword" type="password" autocomplete="new-password" placeholder="Минимум 6 символов"></div><div class="field"><label>Повтори пароль</label><input id="authNewPassword2" type="password" autocomplete="new-password" placeholder="Повтори пароль"></div><button class="btn primary full" onclick="cloudSavePassword()">Сохранить пароль</button><button class="btn full" style="margin-top:10px" onclick="cloudAccountSheet()">Назад</button>`)
};
window.cloudSavePassword=async function(){
 const p=$('#authNewPassword')?.value||'',p2=$('#authNewPassword2')?.value||'';
 if(p.length<6)return toast('Пароль должен быть не короче 6 символов');if(p!==p2)return toast('Пароли не совпадают');
 const btn=$('#sheet button.btn.primary');if(btn){btn.disabled=true;btn.textContent='Сохраняю…';btn.style.opacity='.65'}
 try{const {error}=await cloud.client.auth.updateUser({password:p});if(error){if(btn){btn.disabled=false;btn.textContent='Сохранить пароль';btn.style.opacity=''}return toast(authErrorRu(error))}authRememberLogin(cloud.user?.email||'');modal(`<div class="sheet-grabber"></div><h2>Пароль установлен</h2><div class="muted">Теперь на этом и других устройствах можно входить по логину и паролю без письма.</div><button class="btn primary full" onclick="closeModal()">Готово</button>`)}catch(e){toast('Не удалось сохранить пароль')}
};

const _passwordAccountSheet=window.cloudAccountSheet;
window.cloudAccountSheet=function(){
 if(!cloudConfigured())return typeof cloudSetupSheet==='function'?cloudSetupSheet():null;
 if(!cloud?.user)return cloudPasswordLoginSheet();
 const trainer=(typeof unvrslTrainerMode==='function'&&unvrslTrainerMode())||cloud.profile?.role==='trainer',role=trainer?'Тренер':'Клиент';
 modal(`<div class="sheet-grabber"></div><h2>${esc(cloud.profile?.display_name||'Аккаунт')}</h2><div class="muted">${esc(cloud.user.email||'')}</div><div class="settings-card"><div class="setting"><div><b>Роль</b><div class="muted small">${role}</div></div><span class="chip green">${role}</span></div><div class="setting"><div><b>Имя</b></div><button class="btn tiny" onclick="cloudRenameSheet()">Изменить</button></div><div class="setting"><div><b>Пароль</b><div class="muted small">Вход без писем</div></div><button class="btn tiny" onclick="cloudSetPasswordSheet()">Установить / сменить</button></div><div class="setting"><div><b>Синхронизация</b><div class="muted small">Тренировки и вес</div></div><button class="btn tiny" onclick="cloudSyncAll()">Синхр.</button></div></div><button class="btn danger full" onclick="cloudSignOut()">Выйти</button>`)
};
