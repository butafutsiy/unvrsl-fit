'use strict';
(()=>{
  if(window.__unvrslTrainerPlanControls)return;window.__unvrslTrainerPlanControls=true;

  const css=document.createElement('style');css.id='trainer-plan-controls-style';css.textContent=`
    .trainer-plan-row{background:#1a1b1e;border:1px solid #2d2f34;border-radius:18px;padding:13px 14px;margin:8px 0}
    .trainer-plan-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.trainer-plan-actions .btn{flex:1;min-width:92px}
    .trainer-client-plan-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid #303034}.trainer-client-plan-row:last-child{border-bottom:0}
    .trainer-danger-note{font-size:12px;color:#98989e;line-height:1.35;margin:8px 0 12px}
  `;document.head.appendChild(css);

  function trainerOk(){return !!(window.cloud?.user&&typeof window.trainerIsTrainer==='function'&&window.trainerIsTrainer())}

  async function assignmentRows(planId){
    if(!trainerOk())return[];
    const a=await window.cloud.client.from('plan_assignments').select('client_id,plan_id,version,status,assigned_at').eq('trainer_id',window.cloud.user.id).eq('plan_id',planId).eq('status','active').order('assigned_at',{ascending:false});
    if(a.error)return[];
    const rows=a.data||[],ids=[...new Set(rows.map(x=>x.client_id))];if(!ids.length)return rows;
    const p=await window.cloud.client.from('profiles').select('id,display_name').in('id',ids);const profiles=p.data||[];
    return rows.map(x=>({...x,display_name:profiles.find(y=>y.id===x.client_id)?.display_name||'Клиент'}));
  }

  window.trainerRemoveProgram=async function(clientId,planId){
    if(!trainerOk())return;
    if(!confirm('Убрать программу у клиента? Его выполненные тренировки, вес и замеры сохранятся.'))return;
    const r=await window.cloud.client.from('plan_assignments').update({status:'revoked',updated_at:new Date().toISOString()}).eq('trainer_id',window.cloud.user.id).eq('client_id',clientId).eq('plan_id',planId).eq('status','active');
    if(r.error)return alert('Не удалось убрать программу: '+r.error.message);
    toast('Программа удалена у клиента');
    if(typeof window.trainerClientDetail==='function')setTimeout(()=>window.trainerClientDetail(clientId),100);
  };

  window.trainerPlanClientsSheet=async function(planId,titleToken){
    if(!trainerOk())return;const title=decodeURIComponent(titleToken||'Программа');
    modal('<div class="sheet-grabber"></div><h2>'+esc(title)+'</h2><div class="muted">Загружаю клиентов…</div>');
    const rows=await assignmentRows(planId),sh=document.getElementById('sheet');if(!sh)return;
    sh.innerHTML='<div class="sheet-grabber"></div><h2>'+esc(title)+'</h2><div class="section">У КОГО СЕЙЧАС ЕСТЬ ПРОГРАММА</div>'+(rows.length?'<div class="card">'+rows.map(x=>'<div class="trainer-client-plan-row"><div><b>'+esc(x.display_name)+'</b><div class="muted small">Версия '+(x.version||1)+'</div></div><button class="btn tiny danger" onclick="trainerRemoveProgram(\''+x.client_id+'\',\''+planId+'\')">Убрать</button></div>').join('')+'</div>':'<div class="card muted">Сейчас эта программа никому не назначена.</div>');
  };

  window.trainerArchiveCloudPlan=async function(planId,titleToken){
    if(!trainerOk())return;const title=decodeURIComponent(titleToken||'Программа');
    if(!confirm('Удалить «'+title+'» из отправленных планов?\n\nПрограмма исчезнет у всех клиентов, активные ссылки перестанут работать. История выполненных тренировок и прогресс клиентов сохранятся.'))return;
    toast('Удаляю программу…');
    const now=new Date().toISOString();
    const a=await window.cloud.client.from('plan_assignments').update({status:'revoked',updated_at:now}).eq('trainer_id',window.cloud.user.id).eq('plan_id',planId).eq('status','active');
    if(a.error)return alert('Не удалось убрать программу у клиентов: '+a.error.message);
    const i=await window.cloud.client.from('plan_invites').update({expires_at:now}).eq('trainer_id',window.cloud.user.id).eq('plan_id',planId);
    if(i.error)console.warn('invalidate plan invites',i.error);
    const p=await window.cloud.client.from('plans').update({is_active:false,updated_at:now}).eq('trainer_id',window.cloud.user.id).eq('id',planId);
    if(p.error)return alert('Не удалось удалить план: '+p.error.message);
    if(Array.isArray(st?.programs)){
      st.programs.forEach(x=>{if(String(x?.cloudPlanId||'')===String(planId)){delete x.cloudPlanId;delete x.cloudVersion;delete x.trainerId;delete x.pendingCloudUpdate}});save();
    }
    toast('Отправленный план удалён');setTimeout(()=>window.trainerPlansSheet(),120);
  };

  window.trainerPlansSheet=async function(){
    if(!window.cloud?.user)return cloudAccountSheet();
    const r=await window.cloud.client.from('plans').select('id,title,version,created_at,is_active').eq('trainer_id',window.cloud.user.id).eq('is_active',true).order('created_at',{ascending:false});
    if(r.error)return alert(r.error.message);const plans=r.data||[];
    modal('<div class="sheet-grabber"></div><div class="row between"><div><h2>Мои отправленные планы</h2><div class="muted small">Можно создать новую ссылку, посмотреть клиентов или убрать программу.</div></div><button class="btn tiny primary" onclick="trainerShareCurrent()">＋</button></div>'+(plans.length?plans.map(p=>'<div class="trainer-plan-row"><div class="row between"><div class="grow"><b>'+esc(p.title)+'</b><div class="muted small">Версия '+(p.version||1)+'</div></div></div><div class="trainer-plan-actions"><button class="btn tiny" onclick="trainerNewInvite(\''+p.id+'\',\''+encodeURIComponent(p.title)+'\')">Ссылка</button><button class="btn tiny" onclick="trainerPlanClientsSheet(\''+p.id+'\',\''+encodeURIComponent(p.title)+'\')">Клиенты</button><button class="btn tiny danger" onclick="trainerArchiveCloudPlan(\''+p.id+'\',\''+encodeURIComponent(p.title)+'\')">Удалить</button></div></div>').join(''):'<div class="card muted">Отправленных планов пока нет.</div>'));
  };

  const baseDetail=window.trainerClientDetail;
  if(typeof baseDetail==='function'&&!baseDetail.__removePlanControl){
    const wrapped=async function(id){
      const r=await baseDetail.apply(this,arguments);if(!trainerOk())return r;const sh=document.getElementById('sheet');if(!sh)return r;
      const rows=await window.cloud.client.from('plan_assignments').select('plan_id,version,plans(title)').eq('trainer_id',window.cloud.user.id).eq('client_id',id).eq('status','active');
      if(rows.error||sh.querySelector('.trainer-remove-programs-block'))return r;
      const list=rows.data||[],box=document.createElement('div');box.className='trainer-remove-programs-block';
      box.innerHTML='<div class="section">НАЗНАЧЕННЫЕ ПРОГРАММЫ</div>'+(list.length?'<div class="card">'+list.map(a=>'<div class="trainer-client-plan-row"><div><b>'+esc(a.plans?.title||'Программа')+'</b><div class="muted small">Версия '+(a.version||1)+'</div></div><button class="btn tiny danger" onclick="trainerRemoveProgram(\''+id+'\',\''+a.plan_id+'\')">Убрать</button></div>').join('')+'</div>':'<div class="card muted">У клиента сейчас нет назначенной программы.</div>');
      sh.appendChild(box);return r;
    };wrapped.__removePlanControl=true;window.trainerClientDetail=wrapped;try{trainerClientDetail=wrapped}catch(e){}
  }
})();
