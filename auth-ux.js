'use strict';
const AUTH_SEND_KEY='unvrsl-fit-auth-last-send-v1';
function authLastSend(){try{return JSON.parse(localStorage.getItem(AUTH_SEND_KEY)||'{}')}catch(e){return{}}}
function authRememberSend(email){const x=authLastSend();x[email.toLowerCase()]=Date.now();localStorage.setItem(AUTH_SEND_KEY,JSON.stringify(x))}
function authCooldownLeft(email){const x=authLastSend(),t=Number(x[email.toLowerCase()]||0);return Math.max(0,60-Math.floor((Date.now()-t)/1000))}
function authFriendlyError(error,email){const code=String(error?.code||'').toLowerCase(),msg=String(error?.message||'').toLowerCase();if(code.includes('rate')||msg.includes('rate limit')||error?.status===429){authRememberSend(email);modal(`<div class="sheet-grabber"></div><h2>Письмо уже запрашивали</h2><div class="muted">Supabase временно ограничил повторную отправку. Не нажимай кнопку несколько раз: проверь последнее письмо во входящих и в спаме. Если письма нет — попробуй ещё раз немного позже.</div><button class="btn primary full" style="margin-top:18px" onclick="cloudAccountSheet()">Понятно</button>`);return true}return false}
window.cloudSendMagic=async function(){
 const email=$('#cloudEmail')?.value.trim();if(!email)return toast('Введи почту');
 const left=authCooldownLeft(email);if(left>0)return modal(`<div class="sheet-grabber"></div><h2>Проверь почту</h2><div class="muted">Запрос уже отправлен. Повторная отправка будет доступна примерно через ${left} сек. Используй самое новое письмо.</div><button class="btn full" style="margin-top:18px" onclick="cloudAccountSheet()">Назад</button>`);
 const btn=$('#sheet button.btn.primary');if(btn){btn.disabled=true;btn.textContent='Отправляю…';btn.style.opacity='.65'}
 try{
  const redirect=location.origin+location.pathname+(cloud.invite?`?invite=${encodeURIComponent(cloud.invite)}`:'');
  const {error}=await cloud.client.auth.signInWithOtp({email,options:{emailRedirectTo:redirect}});
  if(error){if(authFriendlyError(error,email))return;return modal(`<div class="sheet-grabber"></div><h2>Не удалось отправить письмо</h2><div class="muted">${esc(error.message||'Попробуй ещё раз позже.')}</div><button class="btn full" style="margin-top:18px" onclick="cloudAccountSheet()">Назад</button>`)}
  authRememberSend(email);
  modal(`<div class="sheet-grabber"></div><h2>Проверь почту</h2><div class="muted">Ссылка для входа отправлена. Открывай только самое новое письмо — ссылка одноразовая.</div><div class="card" style="margin-top:16px"><b>${esc(email)}</b><div class="muted small" style="margin-top:5px">Если письма нет, проверь папку «Спам».</div></div><button class="btn full" onclick="cloudAccountSheet()">Назад</button>`)
 }catch(e){modal(`<div class="sheet-grabber"></div><h2>Ошибка соединения</h2><div class="muted">Не удалось связаться с сервером. Проверь интернет и попробуй позже.</div><button class="btn full" style="margin-top:18px" onclick="cloudAccountSheet()">Назад</button>`)}
};
