'use strict';
(()=>{
  if(window.__trainerSelfPlanV256)return;
  window.__trainerSelfPlanV256=true;
  window.__trainerSelfPlanV110=true;

  if(!document.getElementById('trainer-self-plan-v256-style')){
    const style=document.createElement('style');style.id='trainer-self-plan-v256-style';style.textContent=`
      .cj107{margin-top:18px}.cj107-list{padding:0!important;overflow:hidden}
      .cj107-row{width:100%;border:0;border-bottom:1px solid #303034;background:transparent;color:inherit;text-align:left!important;padding:14px 15px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}
      .cj107-row>div{min-width:0}.cj107-row:last-child{border-bottom:0}.cj107-row b{font-size:16px;line-height:1.25}.cj107-meta{color:#8e8e93;font-size:12px;margin-top:5px;line-height:1.35}.cj107-chev{color:#68686e;font-size:24px}
      .cj107-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:13px 0}.cj107-metric{background:#1b1b1e;border:1px solid #303034;border-radius:17px;padding:13px;min-width:0}.cj107-metric span{display:block;color:#8e8e93;font-size:12px}.cj107-metric b{display:block;font-size:21px;margin-top:5px}
      .cj107-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:13px}.cj107-profile{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}.cj107-profile>div{background:#19191c;border:1px solid #2d2e33;border-radius:15px;padding:11px}.cj107-profile span{display:block;color:#8e8e93;font-size:10px}.cj107-profile b{display:block;margin-top:4px;font-size:16px}
      .cj107-ex{padding:11px 0;border-bottom:1px solid #303034}.cj107-ex:last-child{border-bottom:0}.cj107-set{color:#a6a6ab;font-size:12px;margin-top:4px}.cj107-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.cj107-fields .field{margin:0}
      .cj107-edit-ex{padding:14px;margin:10px 0;border:1px solid #303034;border-radius:16px}.cj107-edit-head{display:flex;gap:8px;align-items:center}.cj107-edit-head input{min-width:0;flex:1}.cj107-edit-set{display:grid;grid-template-columns:48px repeat(3,minmax(0,1fr)) 35px;gap:6px;align-items:end;margin-top:9px}.cj107-edit-set input{min-width:0;width:100%}.cj107-edit-set label{font-size:11px;color:#8e8e93}.cj107-edit-set .check{align-self:end}.cj107-edit-set.cardio{grid-template-columns:48px minmax(0,1fr) 35px}.cj107-edit-ex .btn{margin-top:10px}
      @media(max-width:390px){.cj107-actions{grid-template-columns:1fr}}
    `;document.head.appendChild(style)
  }

  const M=[['chest','Грудь'],['waist','Талия'],['abdomen','Живот'],['hips','Ягодицы'],['thigh','Бедро'],['arm','Рука'],['calf','Икра']];
  const C={at:0,rows:[],ms:[],bw:[],p:null,loading:null};
  let renderTicket=0;
  const A=x=>Array.isArray(x)?x:[];
  const N=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:null};
  const E=v=>typeof esc==='function'?esc(String(v??'')):String(v??'');
  const F=v=>v==null?'—':Number(v).toFixed(1).replace('.0','').replace('.',',');
  const isTrainer=()=>!!window.cloud?.user&&((typeof window.unvrslTrainerMode==='function'&&window.unvrslTrainerMode())||window.cloud?.profile?.role==='trainer');
  const done=s=>A(s?.ex).reduce((n,e)=>n+A(e?.set).filter(x=>x?.ok).length,0);
  const cardio=e=>/^(cardio|time|timer)$/i.test(String(e?.mode||e?.kind||''))||String(e?.kind||'').toLowerCase()==='cardio';
  const title=s=>[s?.c,s?.name].filter(Boolean).join(' · ')||s?.name||'Тренировка';
  const key=r=>String(r?.id||r?.external_id||r?.payload?.id||'');
  const date=(s,r)=>r?.workout_date||s?.date||new Date(s?.ended||s?.started||Date.now()).toISOString().slice(0,10);
  const rd=v=>{const d=new Date(v+'T12:00:00');return isNaN(d)?v:new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(d)};
  const deleted=()=>new Set(A(window.st?.deletedSessionIds).map(String));

  function ton(s){
    return Math.round(A(s?.ex).reduce((a,e)=>a+(cardio(e)?0:A(e?.set).reduce((q,x)=>q+(x?.ok&&N(x.w)&&N(x.r)?Number(x.w)*Number(x.r):0),0)),0));
  }
  function rpe(s){
    const a=[];A(s?.ex).forEach(e=>A(e?.set).forEach(x=>{const n=Number(x?.rpe);if(x?.ok&&x?.rpe!==''&&Number.isFinite(n)&&n>0)a.push(n)}));
    return a.length?Math.round(a.reduce((q,x)=>q+x,0)/a.length*10)/10:null;
  }
  function durationMs(s){
    if(Number(s?.finalDurationMs)>0)return Number(s.finalDurationMs);
    if(Number(s?.durationMs)>0)return Number(s.durationMs);
    if(s?.started&&s?.ended)return Math.max(0,Number(s.ended)-Number(s.started));
    return 0;
  }
  function durationText(s){
    const ms=durationMs(s);
    if(typeof window.unvrslDurationText==='function')return window.unvrslDurationText(ms);
    const t=Math.floor(ms/1000),h=Math.floor(t/3600),m=Math.floor((t%3600)/60),sec=t%60,p=n=>String(n).padStart(2,'0');
    return h?`${h}:${p(m)}:${p(sec)}`:`${p(m)}:${p(sec)}`;
  }

  async function waitCloud(){
    for(let i=0;i<80;i++){
      if(window.cloud?.client&&window.cloud?.user)return window.cloud;
      await new Promise(r=>setTimeout(r,100));
    }
    return window.cloud||null;
  }

  async function load(force=false){
    if(!isTrainer())return C;
    const c=await waitCloud();if(!c?.client||!c?.user)return C;
    if(C.loading)return C.loading;
    if(!force&&Date.now()-C.at<12000)return C;
    C.loading=(async()=>{
      const u=c.user.id,d=deleted();
      const [w,m,b,p]=await Promise.all([
        c.client.from('workouts').select('id,external_id,workout_date,payload,avg_rpe,completed_sets').eq('user_id',u).order('workout_date',{ascending:false}).limit(100),
        c.client.from('body_measurements').select('id,measure_date,measurements').eq('user_id',u).order('measure_date',{ascending:false}).limit(100),
        c.client.from('bodyweights').select('measure_date,weight_kg').eq('user_id',u).order('measure_date',{ascending:false}).limit(100),
        c.client.from('profiles').select('id,display_name,height_cm,birth_date,sex,target_weight_kg').eq('id',u).maybeSingle()
      ]);
      const localById=new Map(A(window.st?.sessions).map(s=>[String(s.id),s]));
      const remote=A(w.data).filter(x=>{const s=x.payload||{},id=String(x.external_id||s.id||'');return s.ended&&done(s)>0&&!d.has(id)}).map(x=>{
        const local=localById.get(String(x.external_id||x.payload?.id||''));
        return local&&Number(local.editedAt||0)>Number(x.payload?.editedAt||0)?{...x,payload:local}:x;
      });
      const seen=new Set(remote.map(x=>String(x.external_id||x.payload?.id||'')));
      const local=A(window.st?.sessions).filter(s=>s?.ended&&done(s)>0&&!d.has(String(s.id))&&!seen.has(String(s.id))).map(s=>({external_id:String(s.id),workout_date:date(s),payload:s,localOnly:true}));
      C.rows=[...remote,...local].sort((a,b)=>Number(b.payload?.ended||Date.parse(b.workout_date)||0)-Number(a.payload?.ended||Date.parse(a.workout_date)||0));
      C.ms=A(m.data).filter(x=>Object.keys(x.measurements||{}).length);
      C.bw=A(b.data);C.p=p.data||c.profile||null;C.at=Date.now();C.loading=null;return C;
    })().catch(e=>{C.loading=null;console.warn('trainer self plan',e);return C});
    return C.loading;
  }

  const lm=()=>C.ms[0]||null;
  const lw=()=>N(C.bw[0]?.weight_kg)||(typeof latestW==='function'?N(latestW()):null);
  const age=v=>{if(!v)return null;const d=new Date(v+'T12:00:00'),n=new Date();let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;return a};
  function measures(){
    const m=lm()?.measurements||{},v=M.map(([k,l])=>[l,N(m[k])]).filter(x=>x[1]);
    return v.length?`<div class="cj107-profile">${v.map(x=>`<div><span>${x[0]}</span><b>${F(x[1])} см</b></div>`).join('')}</div>`:'<div class="muted" style="margin-top:10px">Обхваты пока не записаны.</div>';
  }
  function row(r){
    const s=r.payload||{};
    return `<button class="cj107-row" onclick="trainerSelfWorkout110('${encodeURIComponent(key(r))}')"><div><b>${E(title(s))}</b><div class="cj107-meta">${E(rd(date(s,r)))} · ${ton(s).toLocaleString('ru-RU')} кг · RPE ${rpe(s)??'—'} · ${done(s)} сет.</div></div><span class="cj107-chev">›</span></button>`;
  }

  function mountSelf(root){
    let profile=root.querySelector(':scope > .trainer-self-profile-v111');
    if(!profile){profile=document.createElement('div');profile.className='cj107 trainer-self-profile-v111';root.prepend(profile)}
    let history=root.querySelector(':scope > .trainer-self-plan-v110');
    if(!history){history=document.createElement('div');history.className='cj107 trainer-self-plan-v110';root.appendChild(history)}
    return{profile,history}
  }
  function stableHtml(node,html){if(node.__trainerSelfHtml===html)return;node.innerHTML=html;node.__trainerSelfHtml=html}
  function renderLoaded(hosts){
    const p=C.p||{},w=lw(),a=age(p.birth_date);
    stableHtml(hosts.profile,`<div class="section">ПРОФИЛЬ И ЗАМЕРЫ</div><div class="card"><div class="row between"><div><div class="title">${E(p.display_name||'Мой профиль')}</div><div class="muted small">${[p.height_cm?F(p.height_cm)+' см':null,a!=null?a+' лет':null,w?F(w)+' кг':null].filter(Boolean).join(' · ')||'Профиль спортсмена'}</div></div><button class="btn" onclick="trainerSelfProfile110()">Открыть</button></div>${measures()}<div class="cj107-actions"><button class="btn primary" onclick="trainerSelfMeasure110()">＋ Записать замеры</button><button class="btn" onclick="trainerSelfProfile110()">Профиль</button></div></div>`);
    stableHtml(hosts.history,`<div class="section">ПРОВЕДЁННЫЕ ТРЕНИРОВКИ</div><div class="card cj107-list">${C.rows.length?C.rows.slice(0,20).map(row).join(''):'<div class="muted" style="padding:15px">После завершения тренировки она появится здесь.</div>'}</div>`)
  }
  async function renderSelf(force=false){
    if(!isTrainer())return;
    const root=document.getElementById('plan');if(!root)return;
    const ticket=++renderTicket,hosts=mountSelf(root);
    if(C.at)renderLoaded(hosts);
    else{
      stableHtml(hosts.profile,'<div class="section">ПРОФИЛЬ И ЗАМЕРЫ</div><div class="card muted">Загружаем профиль…</div>');
      stableHtml(hosts.history,'<div class="section">ПРОВЕДЁННЫЕ ТРЕНИРОВКИ</div><div class="card muted">Загружаем историю…</div>')
    }
    await load(force);
    if(ticket!==renderTicket||root!==document.getElementById('plan')||!isTrainer())return;
    renderLoaded(mountSelf(root));
  }
  window.trainerSelfPlanRender110=renderSelf;
  const find=t=>C.rows.find(r=>key(r)===decodeURIComponent(t||''));
  function exline(e){
    const a=A(e.set).filter(x=>x.ok);
    if(cardio(e))return a.map(x=>{const sec=Number(x.workSeconds||x.timedSeconds||e.workSeconds||0);return sec?`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`:'выполнено'}).join(' · ');
    return a.map(x=>`${F(N(x.w)||0)}×${N(x.r)||0}${x.rpe!==''&&x.rpe!=null?' @'+x.rpe:''}`).join(' · ');
  }

  window.trainerSelfWorkout110=async token=>{
    await load();const r=find(token);if(!r)return;const s=r.payload||{};
    modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${E(title(s))}</h2><div class="muted">${E(rd(date(s,r)))}</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="cj107-grid"><div class="cj107-metric"><span>Тоннаж</span><b>${ton(s).toLocaleString('ru-RU')} кг</b></div><div class="cj107-metric"><span>Средний RPE</span><b>${rpe(s)??'—'}</b></div><div class="cj107-metric"><span>Подходов</span><b>${done(s)}</b></div><div class="cj107-metric"><span>Время</span><b>${durationText(s)||'—'}</b></div></div><div class="section">УПРАЖНЕНИЯ</div><div class="card">${A(s.ex).map(e=>{const x=exline(e);return x?`<div class="cj107-ex"><b>${E(typeof displayExerciseName==='function'?displayExerciseName(typeof baseExerciseName==='function'?baseExerciseName(e.n):e.n):e.n)}</b><div class="cj107-set">${E(x)}</div></div>`:''}).join('')}</div><div class="cj107-actions"><button class="btn" onclick="trainerSelfEdit110('${encodeURIComponent(key(r))}')">Редактировать</button><button class="btn primary" onclick="trainerSelfShare110('${encodeURIComponent(key(r))}')">Поделиться</button><button class="btn danger" onclick="trainerSelfDelete110('${encodeURIComponent(key(r))}')">Удалить тренировку</button></div>`);
  };

  let editDraft=null,editToken='';
  const editNum=value=>{const raw=String(value??'').trim().replace(',','.');if(!raw)return null;const n=Number(raw);return Number.isFinite(n)?n:null};
  const editDuration=value=>{const parts=String(value??'').trim().split(':');if(parts.length<2||parts.length>3||parts.some(x=>!/^\d+$/.test(x)))return null;const nums=parts.map(Number);if(nums.slice(1).some(n=>n>59))return null;return (parts.length===3?nums[0]*3600+nums[1]*60+nums[2]:nums[0]*60+nums[1])*1000};
  function captureEdit(){
    if(!editDraft)return;
    const root=document.getElementById('ts110Editor');if(!root)return;
    editDraft.name=root.querySelector('#ts110Title')?.value.trim()||'';
    editDraft.date=root.querySelector('#ts110EditDate')?.value||editDraft.date;
    editDraft.__editDurationText=root.querySelector('#ts110EditDuration')?.value.trim();
    root.querySelectorAll('[data-edit-ex]').forEach(el=>{
      const e=editDraft.ex[Number(el.dataset.editEx)];if(!e)return;
      e.n=el.querySelector('[data-edit-name]')?.value.trim()||e.n;
      el.querySelectorAll('[data-edit-set]').forEach(row=>{
        const x=e.set[Number(row.dataset.editSet)];if(!x)return;
        x.ok=!!row.querySelector('[data-edit-ok]')?.checked;
        if(cardio(e)){
          const seconds=editNum(row.querySelector('[data-edit-seconds]')?.value);
          x.workSeconds=seconds==null?0:seconds;
        }else{
          x.w=editNum(row.querySelector('[data-edit-weight]')?.value);
          x.r=editNum(row.querySelector('[data-edit-reps]')?.value);
          const effort=editNum(row.querySelector('[data-edit-rpe]')?.value);
          x.rpe=effort==null?'':effort;
        }
      });
    });
  }
  function renderEdit(){
    const s=editDraft;if(!s)return;
    modal(`<div id="ts110Editor"><div class="sheet-grabber"></div><div class="row between"><h2>Редактировать тренировку</h2><button class="btn tiny" onclick="trainerSelfWorkout110('${editToken}')">✕</button></div><div class="field"><label>Название</label><input id="ts110Title" value="${E(s.name||'')}" placeholder="Название тренировки"></div><div class="cj107-fields"><div class="field"><label>Дата</label><input id="ts110EditDate" type="date" value="${E(s.date||'')}"></div><div class="field"><label>Время, ч:м:с</label><input id="ts110EditDuration" inputmode="numeric" value="${E(s.__editDurationText??durationText(s))}" placeholder="2:46:25"></div></div><div class="section">УПРАЖНЕНИЯ И ПОДХОДЫ</div>${A(s.ex).map((e,ei)=>`<div class="cj107-edit-ex" data-edit-ex="${ei}"><div class="cj107-edit-head"><input data-edit-name aria-label="Название упражнения" value="${E(e.n)}"><button class="btn tiny danger" onclick="trainerSelfEditRemoveExercise110(${ei})" aria-label="Удалить упражнение">✕</button></div>${A(e.set).map((x,si)=>`<div class="cj107-edit-set ${cardio(e)?'cardio':''}" data-edit-set="${si}"><label><input data-edit-ok type="checkbox" ${x.ok?'checked':''}> Готово</label>${cardio(e)?`<label>Секунды<input data-edit-seconds type="number" min="0" inputmode="numeric" value="${E(x.workSeconds??x.timedSeconds??0)}"></label>`:`<label>Кг<input data-edit-weight type="number" min="0" step="any" inputmode="decimal" value="${E(x.w??'')}"></label><label>Повторы<input data-edit-reps type="number" min="0" step="1" inputmode="numeric" value="${E(x.r??'')}"></label><label>RPE<input data-edit-rpe type="number" min="1" max="10" step="0.5" inputmode="decimal" value="${E(x.rpe??'')}"></label>`}<button class="btn tiny" onclick="trainerSelfEditRemoveSet110(${ei},${si})" aria-label="Удалить подход">✕</button></div>`).join('')}<button class="btn tiny" onclick="trainerSelfEditAddSet110(${ei})">＋ Подход</button></div>`).join('')}<button class="btn full" onclick="trainerSelfEditAddExercise110()">＋ Упражнение</button><div class="cj107-actions"><button class="btn" onclick="trainerSelfWorkout110('${editToken}')">Отмена</button><button class="btn primary" id="ts110SaveEdit" onclick="trainerSelfSaveEdit110()">Сохранить</button></div></div>`);
  }
  window.trainerSelfEdit110=async token=>{
    await load();const r=find(token);if(!r)return;
    editToken=encodeURIComponent(key(r));editDraft=JSON.parse(JSON.stringify(r.payload||{}));
    editDraft.date=date(editDraft,r);renderEdit();
  };
  window.trainerSelfEditAddSet110=ei=>{captureEdit();const e=editDraft?.ex?.[ei];if(!e)return;const prev=A(e.set).at(-1)||{};e.set=A(e.set);e.set.push({...prev,n:e.set.length+1,ok:false,rpe:''});renderEdit()};
  window.trainerSelfEditRemoveSet110=(ei,si)=>{captureEdit();const e=editDraft?.ex?.[ei];if(!e)return;e.set.splice(si,1);renderEdit()};
  window.trainerSelfEditRemoveExercise110=ei=>{captureEdit();editDraft?.ex?.splice(ei,1);renderEdit()};
  window.trainerSelfEditAddExercise110=()=>{captureEdit();editDraft.ex.push({n:'Новое упражнение',mode:'reps',set:[{n:1,w:null,r:null,rpe:'',ok:false}]});renderEdit()};
  window.trainerSelfSaveEdit110=async()=>{
    captureEdit();const s=editDraft,r=find(decodeURIComponent(editToken));if(!s||!r)return;
    if(!s.name.trim()||!s.date||!A(s.ex).length)return toast('Укажи название, дату и упражнение');
    const duration=editDuration(s.__editDurationText);
    if(duration==null||duration>86400000)return toast('Укажи время в формате ч:м:с');
    for(const e of s.ex){
      if(!e.n.trim())return toast('Укажи название упражнения');
      for(const x of A(e.set)){
        if(!x.ok)continue;
        if(cardio(e)){if(!Number.isFinite(x.workSeconds)||x.workSeconds<0)return toast('Проверь время подхода');continue}
        if(x.w==null||x.w<0||!Number.isInteger(x.r)||x.r<=0)return toast('Проверь вес и повторы выполненных подходов');
        if(x.rpe!==''&&(x.rpe<1||x.rpe>10))return toast('RPE должен быть от 1 до 10');
      }
    }
    if(!done(s))return toast('Оставь хотя бы один выполненный подход');
    const old=r.payload||{},start=new Date(old.started||Date.now());
    const [year,month,day]=s.date.split('-').map(Number);start.setFullYear(year,month-1,day);
    s.started=start.getTime();s.finalDurationMs=duration;s.durationMs=duration;s.ended=s.started+duration;
    delete s.__editDurationText;s.editedAt=Date.now();s.updatedAt=s.editedAt;
    const id=String(r.external_id||old.id||s.id||'');s.id=id;
    const previous=A(window.st.sessions).findIndex(x=>String(x.id)===id);
    if(previous>=0)window.st.sessions[previous]=s;else window.st.sessions.push(s);
    if(typeof save==='function')save();
    const button=document.getElementById('ts110SaveEdit');if(button)button.disabled=true;
    const synced=await window.cloudSyncSession?.(s);
    if(synced){C.at=0;await load(true)}else{
      r.payload=s;C.at=Date.now();
    }
    window.dispatchEvent(new CustomEvent('unvrsl:history-updated',{detail:{sessionId:id,edited:true}}));
    window.statsProgressRefresh?.(true);renderSelf();
    editDraft=null;await window.trainerSelfWorkout110(editToken);
    toast(synced?'Тренировка обновлена':'Сохранено на устройстве. Облако обновится при синхронизации');
  };

  window.trainerSelfShare110=async token=>{
    await load();const r=find(token);if(!r)return;const s=r.payload||{};
    if(typeof window.openShareProgressV264==='function')window.openShareProgressV264({...s,date:s.date||date(s,r),id:s.id||r.external_id||r.id});
    else window.toast?.('Создание PNG пока загружается. Повтори через пару секунд.');
  };

  window.trainerSelfDelete110=async token=>{
    await load();const r=find(token);if(!r)return;const s=r.payload||{},id=String(r.external_id||s.id||'');
    if(!confirm(`Удалить «${title(s)}» за ${rd(date(s,r))}?\n\nОна исчезнет из истории и статистики.`))return;
    const c=await waitCloud();if(!c?.client||!c?.user)return;
    if(r.id){const q=await c.client.from('workouts').delete().eq('user_id',c.user.id).eq('id',r.id);if(q.error)return alert(q.error.message)}
    window.st.deletedSessionIds=A(window.st.deletedSessionIds);if(id&&!window.st.deletedSessionIds.map(String).includes(id))window.st.deletedSessionIds.push(id);
    window.st.sessions=A(window.st.sessions).filter(x=>String(x.id)!==id);if(window.st.current&&String(window.st.current.id)===id)window.st.current=null;
    if(typeof save==='function')save();
    await c.client.from('user_app_state').upsert({user_id:c.user.id,state:window.st,client_updated_at:new Date().toISOString()},{onConflict:'user_id'});
    C.at=0;closeModal();await renderSelf(true);toast('Тренировка удалена');
  };

  window.trainerSelfProfile110=async()=>{
    await load(true);const p=C.p||{},w=lw(),a=age(p.birth_date),m=lm();
    modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${E(p.display_name||'Мой профиль')}</h2><div class="muted">Профиль спортсмена</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="cj107-grid"><div class="cj107-metric"><span>Рост</span><b>${p.height_cm?F(p.height_cm)+' см':'—'}</b></div><div class="cj107-metric"><span>Вес</span><b>${w?F(w)+' кг':'—'}</b></div><div class="cj107-metric"><span>Возраст</span><b>${a??'—'}</b></div><div class="cj107-metric"><span>Цель</span><b>${p.target_weight_kg?F(p.target_weight_kg)+' кг':'—'}</b></div></div><div class="section">ОБХВАТЫ</div><div class="card">${measures()}${m?`<div class="muted small" style="margin-top:9px">${E(rd(m.measure_date))}</div>`:''}</div><div class="cj107-actions"><button class="btn primary" onclick="trainerSelfMeasure110()">Обновить замеры</button><button class="btn" onclick="typeof profileEditSheet==='function'?profileEditSheet():closeModal()">Изменить профиль</button></div>`);
  };

  window.trainerSelfMeasure110=async()=>{
    await load();const m=lm()?.measurements||{},w=lw();
    modal(`<div class="sheet-grabber"></div><h2>Записать замеры</h2><div class="field"><label>Дата</label><input id="ts110Date" type="date" value="${new Date().toISOString().slice(0,10)}"></div><div class="field"><label>Вес, кг</label><input id="ts110Weight" type="number" inputmode="decimal" step="0.1" value="${w||''}"></div><div class="cj107-fields">${M.map(([k,l])=>`<div class="field"><label>${l}, см</label><input id="ts110_${k}" type="number" inputmode="decimal" step="0.1" value="${m[k]??''}"></div>`).join('')}</div><button class="btn primary full" style="margin-top:14px" onclick="trainerSelfSaveMeasure110()">Сохранить замеры</button>`);
  };

  window.trainerSelfSaveMeasure110=async()=>{
    const c=await waitCloud();if(!c?.client||!c?.user)return;
    const u=c.user.id,d=document.getElementById('ts110Date')?.value||new Date().toISOString().slice(0,10),m={};
    for(const[k]of M){const v=N(String(document.getElementById('ts110_'+k)?.value||'').replace(',','.'));if(v)m[k]=+v.toFixed(1)}
    if(!Object.keys(m).length)return toast('Добавь хотя бы один обхват');
    const q=await c.client.from('body_measurements').upsert({user_id:u,measure_date:d,measurements:m,updated_at:new Date().toISOString()},{onConflict:'user_id,measure_date'});if(q.error)return alert(q.error.message);
    const wr=N(String(document.getElementById('ts110Weight')?.value||'').replace(',','.'));
    if(wr){await c.client.from('bodyweights').upsert({user_id:u,measure_date:d,weight_kg:+wr.toFixed(1)},{onConflict:'user_id,measure_date'});const now=Date.now();window.st.bw=A(window.st.bw);const x=window.st.bw.find(z=>z.d===d);if(x){x.w=+wr.toFixed(1);x.t=now;x.updatedAt=now}else window.st.bw.push({d,w:+wr.toFixed(1),t:now,updatedAt:now});window.st.bw.sort((a,b)=>String(a.d).localeCompare(String(b.d)));window.st.deletedBodyweights=A(window.st.deletedBodyweights).filter(x=>String(x?.d||x||'').slice(0,10)!==d)}
    if(typeof save==='function')save();C.at=0;closeModal();await renderSelf(true);toast('Замеры сохранены');
  };

  function install(){
    const p=window.planPage;
    if(typeof p==='function'&&!p.__trainerSelfPlanAuthorityV256){
      const b=p,w=function(){const r=b.apply(this,arguments);if(isTrainer())renderSelf();return r};
      w.__trainerSelfPlanV110=true;w.__trainerSelfPlanAuthorityV256=true;window.planPage=w;try{planPage=w}catch(e){}
    }
  }
  install();
  [200,700,1600,3000,7000].forEach(t=>setTimeout(install,t));
  window.addEventListener('pageshow',()=>{install();if(isTrainer()&&document.getElementById('plan')?.classList.contains('active'))renderSelf()},{passive:true});
})();
