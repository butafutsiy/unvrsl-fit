'use strict';
let coachInviteToken=new URLSearchParams(location.search).get('coach')||null;
let coachInvitePresented='';

function coachInviteLink(token){const u=new URL(location.origin+location.pathname);u.searchParams.set('coach',token);return u.toString()}

async function trainerCreateClientInvite(){
  if(!cloud?.user)return cloudAccountSheet();
  if(typeof trainerIsTrainer==='function'&&!trainerIsTrainer())return toast('Доступно только тренеру');
  const token=(crypto.randomUUID?.()||('c'+Date.now()+Math.random())).replaceAll('-','');
  const r=await cloud.client.from('trainer_invites').insert({token,trainer_id:cloud.user.id,max_uses:1}).select().single();
  if(r.error)return alert(r.error.message);
  const link=coachInviteLink(token);
  modal(`<div class="sheet-grabber"></div><h2>Пригласить клиента</h2><div class="muted">Отправь эту ссылку клиенту. Сначала он добавится к тебе, а программу ты назначишь ему уже из своего тренерского аккаунта.</div><div class="share-link">${esc(link)}</div><button class="btn primary full" onclick="trainerCopyLink('${encodeURIComponent(link)}')">Скопировать ссылку</button>${navigator.share?`<button class="btn full" style="margin-top:10px" onclick="navigator.share({title:'UNVRSL FIT · приглашение тренера',url:'${link}'})">Поделиться</button>`:''}`)
}

async function previewCoachInvite(){
  if(!coachInviteToken||!cloud?.ready||!cloud?.client)return null;
  const r=await cloud.client.rpc('preview_trainer_invite',{p_token:coachInviteToken});
  return r.error?null:r.data;
}

async function showCoachInviteSheet(){
  if(!coachInviteToken||!cloud?.ready||!cloud?.client)return;
  const mode=cloud.user?'user':'guest';
  if(coachInvitePresented===mode)return;
  const info=await previewCoachInvite();
  if(!info){coachInvitePresented='invalid';return modal(`<div class="sheet-grabber"></div><h2>Ссылка недействительна</h2><div class="muted">Приглашение уже использовано или срок его действия закончился.</div><button class="btn full" onclick="closeModal()">Закрыть</button>`)}
  coachInvitePresented=mode;
  const trainer=info.trainer||'Тренер';
  if(!cloud.user)return modal(`<div class="sheet-grabber"></div><h2>Приглашение от тренера</h2><div class="muted"><b>${esc(trainer)}</b> приглашает тебя стать клиентом в UNVRSL FIT. После входа программа останется пустой, пока тренер не назначит её.</div><button class="btn primary full" style="margin-top:18px" onclick="cloudAccountSheet()">Войти и добавиться</button>`);
  modal(`<div class="sheet-grabber"></div><h2>Добавиться к тренеру?</h2><div class="muted">Тренер: <b>${esc(trainer)}</b>. После подтверждения ты появишься у него в разделе «Клиенты». Программу он назначит отдельно.</div><button class="btn primary full" style="margin-top:18px" onclick="acceptCoachInvite()">Добавиться к тренеру</button><button class="btn full" style="margin-top:10px" onclick="closeModal()">Позже</button>`)
}

async function acceptCoachInvite(){
  if(!cloud.user)return cloudAccountSheet();
  const r=await cloud.client.rpc('accept_trainer_invite',{p_token:coachInviteToken});
  if(r.error)return alert('Не удалось добавиться к тренеру: '+r.error.message);
  coachInviteToken=null;coachInvitePresented='';
  const u=new URL(location.href);u.searchParams.delete('coach');u.hash='';history.replaceState({},'',u.pathname+(u.search||''));
  closeModal();render();toast('Ты добавлен к тренеру')
}

if(typeof window.authHandoffRedirect==='function'){
  window.authHandoffRedirect=function(secret){
    const u=new URL(location.origin+location.pathname);
    if(cloud?.invite)u.searchParams.set('invite',cloud.invite);
    if(coachInviteToken)u.searchParams.set('coach',coachInviteToken);
    u.searchParams.set('auth_handoff',secret);
    return u.toString()
  }
}

const _clientLinkClientsPage=window.clientsPage;
if(typeof _clientLinkClientsPage==='function')window.clientsPage=async function(){
  await _clientLinkClientsPage.apply(this,arguments);
  const root=document.querySelector('#clients');if(!root||!(typeof trainerIsTrainer==='function'&&trainerIsTrainer()))return;
  const first=root.querySelector('.card');if(first&&!first.querySelector('.invite-client-btn')){
    const row=first.querySelector('.row.between');
    if(row){const actions=document.createElement('div');actions.className='row';actions.innerHTML='<button class="btn tiny invite-client-btn" onclick="trainerCreateClientInvite()">＋ Клиент</button>';const existing=row.querySelector('button');if(existing)actions.appendChild(existing);row.appendChild(actions)}
  }
};

const _clientLinkTrainerClientDetail=window.trainerClientDetail;
if(typeof _clientLinkTrainerClientDetail==='function')window.trainerClientDetail=async function(id){
  await _clientLinkTrainerClientDetail(id);
  const sh=document.querySelector('#sheet');if(!sh)return;
  const box=document.createElement('div');box.innerHTML=`<div class="section">УПРАВЛЕНИЕ</div><button class="btn primary full" onclick="trainerAssignProgramSheet('${id}')">Назначить программу</button>`;
  sh.append(...box.childNodes)
};

function trainerAssignProgramSheet(clientId){
  const programs=Array.isArray(st.programs)?st.programs:[];
  modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>Назначить программу</h2><div class="muted">Выбери программу для клиента</div></div><button class="btn tiny" onclick="trainerClientDetail('${clientId}')">←</button></div>${programs.length?programs.map(p=>`<button class="card exlib-btn" onclick="trainerAssignProgram('${clientId}','${p.id}')"><div class="row between"><div class="grow"><b>${esc(p.name||'Программа')}</b><div class="muted small">${p.weeks?.length||0} нед. · ${(p.weeks||[]).reduce((n,w)=>n+(w.days?.length||0),0)} тренировок</div></div><span class="chev">›</span></div></button>`).join(''):'<div class="card"><div class="title">Нет программ</div><div class="muted" style="margin-top:6px">Создай программу или добавь шаблон, затем вернись сюда.</div><button class="btn primary full" style="margin-top:14px" onclick="closeModal();nav(\'programs\')">Открыть программы</button></div>'}`)
}

async function trainerCloudPlanForProgram(p){
  const snapshot=cloudProgramSnapshot(p);
  if(!p.cloudPlanId){
    const ins=await cloud.client.from('plans').insert({trainer_id:cloud.user.id,title:p.name,version:1,snapshot}).select().single();
    if(ins.error)throw ins.error;
    p.cloudPlanId=ins.data.id;p.cloudVersion=1;p.trainerId=cloud.user.id;
    await cloud.client.from('plan_versions').insert({plan_id:p.cloudPlanId,trainer_id:cloud.user.id,version:1,snapshot});
    save();return{planId:p.cloudPlanId,version:1,snapshot}
  }
  const q=await cloud.client.from('plans').select('id,title,version,snapshot').eq('id',p.cloudPlanId).maybeSingle();
  if(q.error)throw q.error;
  if(!q.data){p.cloudPlanId=null;return trainerCloudPlanForProgram(p)}
  let version=q.data.version||1;
  const different=JSON.stringify(q.data.snapshot||{})!==JSON.stringify(snapshot)||q.data.title!==p.name;
  if(different){
    version+=1;
    const up=await cloud.client.from('plans').update({title:p.name,version,snapshot,updated_at:new Date().toISOString()}).eq('id',p.cloudPlanId);
    if(up.error)throw up.error;
    await cloud.client.from('plan_versions').insert({plan_id:p.cloudPlanId,trainer_id:cloud.user.id,version,snapshot});
    p.cloudVersion=version;save()
  }
  return{planId:p.cloudPlanId,version,snapshot}
}

async function trainerAssignProgram(clientId,pid){
  const p=programById(pid);if(!p||!cloud?.user)return;
  toast('Назначаю программу…');
  try{
    const cp=await trainerCloudPlanForProgram(p);
    const r=await cloud.client.from('plan_assignments').upsert({plan_id:cp.planId,trainer_id:cloud.user.id,client_id:clientId,version:cp.version,snapshot:cp.snapshot,status:'active',updated_at:new Date().toISOString()},{onConflict:'plan_id,client_id'}).select().single();
    if(r.error)throw r.error;
    toast('Программа назначена');await trainerClientDetail(clientId)
  }catch(e){alert('Не удалось назначить программу: '+(e.message||e))}
}

setInterval(()=>{if(coachInviteToken)showCoachInviteSheet();if(cloud?.user&&typeof cloudLoadAssignments==='function')cloudLoadAssignments()},12000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(coachInviteToken){coachInvitePresented='';showCoachInviteSheet()}if(cloud?.user&&typeof cloudLoadAssignments==='function')cloudLoadAssignments()}});
setTimeout(()=>showCoachInviteSheet(),1800);
