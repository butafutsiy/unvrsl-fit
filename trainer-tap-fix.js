'use strict';
(()=>{
  if(window.__unvrslTrainerTapFixV2)return;window.__unvrslTrainerTapFixV2=true;

  const style=document.createElement('style');style.id='trainer-tap-fix-style';style.textContent=`
    #clients .client-card,#clients [data-trainer-action="sent-plans"]{pointer-events:auto!important;touch-action:manipulation!important;position:relative!important;z-index:2!important}
    #clients #clientList,#clients #onlineClientsPane{pointer-events:auto!important}
    .trainer-live-programs{margin-top:14px}.trainer-live-program-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid #303034}.trainer-live-program-row:last-child{border-bottom:0}.trainer-live-program-row .btn{white-space:nowrap;min-width:84px}
    @media(max-width:390px){.trainer-live-program-row{grid-template-columns:1fr}.trainer-live-program-row .btn{width:100%}}
  `;document.head.appendChild(style);

  function extractClientId(el){
    if(el?.dataset?.clientId)return el.dataset.clientId;
    const raw=el?.getAttribute?.('onclick')||'';
    const m=raw.match(/trainerClientDetail\(['\"]([^'\"]+)['\"]\)/);
    return m?.[1]||'';
  }

  function decorateTrainerClients(){
    const root=document.getElementById('clients');if(!root)return;
    root.querySelectorAll('.client-card').forEach(card=>{
      const id=extractClientId(card);if(!id)return;
      card.dataset.clientId=id;
      card.removeAttribute('onclick');
      card.type='button';
    });
    [...root.querySelectorAll('button')].forEach(btn=>{
      if(/мои отправленные планы/i.test((btn.textContent||'').trim())){
        btn.dataset.trainerAction='sent-plans';
        btn.removeAttribute('onclick');
        btn.type='button';
      }
    });
  }

  function removeOldProgramSection(sheet){
    const sections=[...sheet.querySelectorAll('.section')].filter(x=>/программ/i.test((x.textContent||'').trim()));
    sections.forEach(sec=>{
      let n=sec.nextElementSibling;
      sec.remove();
      while(n&&!n.classList.contains('section')){const next=n.nextElementSibling;n.remove();n=next}
    });
    sheet.querySelectorAll('.trainer-remove-programs-block,.trainer-live-programs').forEach(x=>x.remove());
  }

  async function renderLivePrograms(clientId){
    if(!window.cloud?.client||!window.cloud?.user)return;
    const r=await window.cloud.client.from('plan_assignments')
      .select('plan_id,version,status,assigned_at,plans(title)')
      .eq('trainer_id',window.cloud.user.id)
      .eq('client_id',clientId)
      .eq('status','active')
      .order('assigned_at',{ascending:false});
    const sheet=document.getElementById('sheet');if(!sheet)return;
    removeOldProgramSection(sheet);
    const rows=r.error?[]:(r.data||[]);
    const box=document.createElement('div');box.className='trainer-live-programs';
    box.innerHTML='<div class="section">ПРОГРАММЫ</div><div class="card">'+(rows.length?rows.map(a=>{
      const title=a.plans?.title||'Программа';
      return '<div class="trainer-live-program-row"><div><b>'+esc(title)+' · v'+(a.version||1)+'</b><div class="muted small">Назначена клиенту</div></div><button class="btn tiny danger" data-delete-client-plan="1" data-client-id="'+clientId+'" data-plan-id="'+a.plan_id+'" data-plan-title="'+encodeURIComponent(title)+'">Удалить</button></div>';
    }).join(''):'<div class="muted">У клиента сейчас нет активных программ.</div>')+'</div>';
    const metrics=sheet.querySelector('.metrics');
    if(metrics)metrics.after(box);else sheet.querySelector('.detail-title')?.after(box)||sheet.prepend(box);
  }

  async function openClientWithDelete(clientId){
    if(typeof window.trainerClientDetail!=='function')return typeof window.toast==='function'&&toast('Карточка клиента ещё загружается');
    await window.trainerClientDetail(clientId);
    await renderLivePrograms(clientId);
  }

  window.trainerDeleteClientPlanNow=async function(clientId,planId,titleToken){
    if(!window.cloud?.client||!window.cloud?.user)return;
    const title=decodeURIComponent(titleToken||'Программа');
    if(!confirm('Удалить «'+title+'» у этого клиента?\n\nИстория тренировок, вес и замеры сохранятся.'))return;
    const r=await window.cloud.client.from('plan_assignments').update({status:'revoked',updated_at:new Date().toISOString()})
      .eq('trainer_id',window.cloud.user.id).eq('client_id',clientId).eq('plan_id',planId).eq('status','active');
    if(r.error)return alert('Не удалось удалить программу: '+r.error.message);
    if(typeof window.toast==='function')toast('Программа удалена у клиента');
    await openClientWithDelete(clientId);
  };

  document.addEventListener('click',e=>{
    const del=e.target.closest?.('[data-delete-client-plan="1"]');
    if(del){
      e.preventDefault();e.stopPropagation();
      window.trainerDeleteClientPlanNow(del.dataset.clientId,del.dataset.planId,del.dataset.planTitle);
      return;
    }
    const root=e.target.closest?.('#clients');if(!root)return;
    const card=e.target.closest?.('.client-card[data-client-id]');
    if(card){
      e.preventDefault();e.stopPropagation();
      openClientWithDelete(card.dataset.clientId);
      return;
    }
    const plans=e.target.closest?.('[data-trainer-action="sent-plans"]');
    if(plans){
      e.preventDefault();e.stopPropagation();
      if(typeof window.trainerPlansSheet==='function')window.trainerPlansSheet();
      else if(typeof window.toast==='function')toast('Планы ещё загружаются');
    }
  },true);

  const baseClients=window.clientsPage;
  if(typeof baseClients==='function'&&!baseClients.__tapFixV2){
    const wrapped=async function(){
      const r=await baseClients.apply(this,arguments);
      decorateTrainerClients();
      setTimeout(decorateTrainerClients,80);
      return r;
    };
    wrapped.__tapFixV2=true;window.clientsPage=wrapped;try{clientsPage=wrapped}catch(e){}
  }

  const baseNav=window.nav;
  if(typeof baseNav==='function'&&!baseNav.__trainerTapFixV2){
    const wrapped=function(p){const r=baseNav.apply(this,arguments);if(p==='clients'){setTimeout(decorateTrainerClients,0);setTimeout(decorateTrainerClients,180)}return r};
    wrapped.__trainerTapFixV2=true;window.nav=wrapped;try{nav=wrapped}catch(e){}
  }

  [0,200,800,1800].forEach(t=>setTimeout(decorateTrainerClients,t));
})();
