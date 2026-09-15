'use strict';
(()=>{
  const W=window,D=document,REV=391;
  if(W.__unvrslTrainerClientsCanonicalV391)return;

  const state={tab:'online',onlineToken:0,offlineToken:0};
  const A=value=>Array.isArray(value)?value:[];
  const E=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const daysAgo=value=>value?Math.floor((Date.now()-Date.parse(`${String(value).slice(0,10)}T12:00:00`))/86400000):999;
  const checkinScore=row=>{
    if(!row)return null;
    const sleep=Number(row.sleep)||3,energy=Number(row.energy)||3,stress=Number(row.stress)||3,soreness=Number(row.soreness)||3,appetite=Number(row.appetite)||3;
    return Math.max(0,Math.min(100,Math.round((sleep+energy+(6-stress)+(6-soreness)+appetite)/25*100)));
  };

  function shell(){
    const root=D.getElementById('clients');if(!root)return null;
    if(root.dataset.clientsOwner===String(REV))return root;
    root.dataset.clientsOwner=String(REV);
    root.innerHTML=`<div class="card trainer-clients-head"><div><div class="title">Клиенты</div><div class="muted">Онлайн и офлайн клиенты · планы, занятия и прогресс</div></div><button type="button" class="btn tiny invite-client-btn" onclick="unvrslAddClientV391()">＋ Клиент</button></div><div class="client-tabs" role="tablist" aria-label="Тип клиентов"><button type="button" class="on" data-tab="online" role="tab" aria-selected="true" onclick="offlineSwitchTab('online')">Онлайн</button><button type="button" data-tab="offline" role="tab" aria-selected="false" onclick="offlineSwitchTab('offline')">Офлайн</button></div><div id="onlineClientsPane"><div id="clientMetrics" class="metrics"><div class="metric"><span>Клиентов</span><b>—</b></div><div class="metric"><span>Тренировок / 7 дней</span><b>—</b></div></div><div id="clientCheckinOverview"></div><div id="clientList"><div class="card muted">Загружаю клиентов…</div></div><button type="button" class="btn full" onclick="trainerPlansSheet()">Мои отправленные планы</button></div><div id="offlineClientsPane" hidden></div>`;
    return root
  }

  function checkinHtml(ids,rows){
    if(!ids.length)return'';
    const latest=new Map();A(rows).forEach(row=>{if(!latest.has(row.user_id))latest.set(row.user_id,row)});
    let due=0,attention=0;
    ids.forEach(id=>{const row=latest.get(id),score=checkinScore(row);if(!row||daysAgo(row.checkin_date)>=7)due++;if(score!=null&&score<68)attention++});
    return `<div class="card checkin-overview"><div class="row between"><div><div class="muted small">ЧЕК-ИНЫ КЛИЕНТОВ</div><div class="title" style="margin-top:4px">${attention?`${attention} требуют внимания`:'Восстановление под контролем'}</div></div><span class="chip ${attention?'orange':'green'}">${attention||'✓'}</span></div><div class="adv-stat-grid" style="margin-top:12px"><div class="adv-stat"><span>Пора заполнить</span><b>${due}</b></div><div class="adv-stat"><span>Низкое восстановление</span><b>${attention}</b></div></div></div>`
  }

  async function refreshOnline(){
    const token=++state.onlineToken,metrics=D.getElementById('clientMetrics'),list=D.getElementById('clientList'),overview=D.getElementById('clientCheckinOverview');
    if(!metrics||!list||!overview)return;
    const c=W.cloud;
    if(!c?.ready||!c?.user||!c?.client){list.innerHTML='<div class="card muted">Войди в аккаунт, чтобы видеть клиентов.</div>';overview.innerHTML='';return}
    try{
      const rels=await c.client.from('trainer_clients').select('client_id').eq('trainer_id',c.user.id).neq('status','archived');
      if(rels.error)throw rels.error;if(token!==state.onlineToken)return;
      const ids=[...new Set(A(rels.data).map(row=>row.client_id).filter(Boolean))];
      if(!ids.length){metrics.innerHTML='<div class="metric"><span>Клиентов</span><b>0</b></div><div class="metric"><span>Тренировок / 7 дней</span><b>0</b></div>';overview.innerHTML='';list.innerHTML='<div class="card"><div class="title">Пока нет клиентов</div><div class="muted" style="margin-top:6px">Пригласи клиента по ссылке – после принятия он появится здесь.</div></div>';return}
      const since=new Date(Date.now()-7*86400000).toISOString().slice(0,10);
      const [profiles,workouts,checkins]=await Promise.all([
        c.client.from('profiles').select('id,display_name').in('id',ids),
        c.client.from('workouts').select('user_id,workout_date,avg_rpe').in('user_id',ids).gte('workout_date',since).order('workout_date',{ascending:false}),
        c.client.from('checkins').select('user_id,checkin_date,sleep,energy,stress,soreness,appetite').in('user_id',ids).order('checkin_date',{ascending:false}).limit(500)
      ]);
      const failed=[profiles,workouts,checkins].find(result=>result.error);if(failed)throw failed.error;if(token!==state.onlineToken)return;
      const profileRows=A(profiles.data),workoutRows=A(workouts.data);
      metrics.innerHTML=`<div class="metric"><span>Клиентов</span><b>${ids.length}</b></div><div class="metric"><span>Тренировок / 7 дней</span><b>${workoutRows.length}</b></div>`;
      overview.innerHTML=checkinHtml(ids,checkins.data);
      list.innerHTML=ids.map(id=>{
        const profile=profileRows.find(row=>String(row.id)===String(id)),recent=workoutRows.filter(row=>String(row.user_id)===String(id)),last=recent[0],high=recent.some(row=>Number(row.avg_rpe)>=9.5);
        return `<button type="button" class="card exlib-btn client-card" data-client-id="${E(id)}" onclick="trainerClientDetail('${E(id)}')"><div class="row between"><div class="grow"><b>${E(profile?.display_name||'Клиент')}</b><div class="catalog-meta">${last?`Последняя: ${E(last.workout_date)} · RPE ${E(last.avg_rpe??'—')}`:'Нет тренировок за 7 дней'}</div></div>${high?'<span class="chip orange">Высокий RPE</span>':'<span class="chev">›</span>'}</div></button>`
      }).join('')
    }catch(error){if(token!==state.onlineToken)return;overview.innerHTML='';list.innerHTML=`<div class="card"><div class="title">Не удалось загрузить клиентов</div><div class="muted" style="margin-top:7px">${E(error?.message||'Проверь подключение')}</div><button type="button" class="btn full" style="margin-top:12px" onclick="unvrslRefreshOnlineClientsV391()">Повторить</button></div>`}
  }

  async function switchTab(tab){
    shell();state.tab=tab==='offline'?'offline':'online';
    const online=D.getElementById('onlineClientsPane'),offline=D.getElementById('offlineClientsPane');
    if(online)online.hidden=state.tab!=='online';if(offline)offline.hidden=state.tab!=='offline';
    D.querySelectorAll('#clients .client-tabs button').forEach(button=>{const on=button.dataset.tab===state.tab;button.classList.toggle('on',on);button.setAttribute('aria-selected',String(on))});
    if(state.tab==='offline'){
      const token=++state.offlineToken;
      if(typeof W.renderOfflineClients==='function')await W.renderOfflineClients();
      else if(token===state.offlineToken&&offline)offline.innerHTML='<div class="card muted">Расписание пока недоступно.</div>';
    }else await refreshOnline()
  }

  async function clientsPage(){
    const root=shell();if(!root)return;
    if(typeof W.trainerIsTrainer==='function'&&!W.trainerIsTrainer()){root.innerHTML='<div class="card"><div class="title">Режим тренера выключен</div></div>';return}
    return switchTab(state.tab)
  }

  function addClient(){
    if(state.tab==='offline')return W.offlineNewClientSheet?.();
    return W.trainerCreateClientInvite?.()
  }

  const style=D.createElement('style');style.id='trainer-clients-canonical-v391';style.textContent=`
    #clients[data-clients-owner="391"] .trainer-clients-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 20px}
    #clients[data-clients-owner="391"] .trainer-clients-head>div{min-width:0}#clients[data-clients-owner="391"] .invite-client-btn{flex:0 0 auto;background:#2d2e33!important;color:#f5f5f7!important}
    #clients[data-clients-owner="391"] .client-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;margin:10px 0;background:#111214;border:1px solid #282a2f;border-radius:17px}
    #clients[data-clients-owner="391"] .client-tabs button{min-height:40px;border-radius:13px;color:#8e8e93;font-weight:750}#clients[data-clients-owner="391"] .client-tabs button.on{background:#292b30;color:#f5f5f7}
    #clients[data-clients-owner="391"] [hidden]{display:none!important}#clients[data-clients-owner="391"] .client-card{display:block;width:100%;text-align:left;pointer-events:auto;touch-action:manipulation}
    .offline-measure-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.offline-measure-grid .field{min-width:0}
    @media(max-width:430px){#clients[data-clients-owner="391"] .trainer-clients-head{align-items:flex-start}.offline-measure-grid{grid-template-columns:1fr}}
  `;D.head.appendChild(style);

  W.clientsPage=clientsPage;W.offlineSwitchTab=switchTab;W.unvrslRefreshOnlineClientsV391=refreshOnline;W.unvrslAddClientV391=addClient;
  W.__unvrslTrainerClientsCanonicalV391=true;
  W.dispatchEvent(new CustomEvent('unvrsl:trainer-clients-ready',{detail:{release:REV}}));
})();
