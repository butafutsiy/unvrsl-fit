'use strict';
(()=>{
  if(window.__unvrslOnlineProgress)return;window.__unvrslOnlineProgress=true;

  const MEASURES=[
    ['chest','Грудь'],
    ['waist','Талия'],
    ['abdomen','Живот'],
    ['hips','Ягодицы'],
    ['thigh','Бедро'],
    ['arm','Рука'],
    ['calf','Икра']
  ];

  const style=document.createElement('style');style.id='unvrsl-online-progress-style';style.textContent=`
    .online-measure-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}
    .online-measure-grid .field{margin:0;min-width:0}.online-measure-grid input{min-width:0;width:100%}
    .body-progress-list{display:grid;gap:8px}.body-progress-row{background:#1a1b1e;border:1px solid #2d2f34;border-radius:17px;padding:12px 13px;min-width:0}
    .body-progress-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:start}.body-progress-name{font-weight:760}.body-progress-value{font-weight:850;font-size:18px;white-space:nowrap}.body-progress-meta{font-size:11px;color:#85878e;margin-top:3px}.body-progress-delta{color:var(--green);font-weight:760}.body-progress-chart{display:block;width:100%;height:42px;margin-top:7px;overflow:visible}.body-progress-chart .grid{stroke:#34363b;stroke-width:1;stroke-dasharray:3 5}.body-progress-chart .line{fill:none;stroke:var(--green);stroke-width:2.3;stroke-linecap:round;stroke-linejoin:round}.body-progress-chart .dot{fill:#e9eef5;stroke:var(--green);stroke-width:1.7}
    .body-progress-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:8px 0 12px}.body-progress-summary .metric{min-width:0}
    @media(max-width:380px){.online-measure-grid{grid-template-columns:1fr}.body-progress-value{font-size:17px}}
  `;document.head.appendChild(style);

  function n(v){const x=Number(v);return Number.isFinite(x)&&x>0?x:null}
  function fmt(v,d=1){if(v==null)return'—';return Number(v).toFixed(d).replace('.0','')}
  function dateLabel(v){if(!v)return'';const d=new Date(v+'T12:00:00');return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(d).replace('.','')}
  function readMeasurements(){
    const out={};
    for(const [key] of MEASURES){const el=document.getElementById('ciM_'+key);if(!el)continue;const raw=String(el.value||'').trim().replace(',','.');if(!raw)continue;const val=Number(raw);if(!Number.isFinite(val)||val<10||val>300)return{error:'Проверь замеры тела'};out[key]=+val.toFixed(1)}
    return{value:out};
  }
  async function latestCheckin(){try{return typeof loadMyCheckin==='function'?await loadMyCheckin(true):null}catch(e){return null}}

  const baseOpen=window.openWeeklyCheckin;
  if(typeof baseOpen==='function')window.openWeeklyCheckin=async function(){
    await baseOpen.apply(this,arguments);
    const sh=document.getElementById('sheet');if(!sh||sh.querySelector('.online-measure-block'))return;
    const last=await latestCheckin(),today=typeof checkinToday==='function'?checkinToday():new Date().toISOString().slice(0,10),same=last?.checkin_date===today,vals=same?(last?.measurements||{}):{};
    const block=document.createElement('div');block.className='online-measure-block';
    block.innerHTML=`<div class="section">ЗАМЕРЫ ТЕЛА</div><div class="muted small">Необязательно. Клиент заполняет сам. Лучше измерять раз в неделю в одинаковых условиях.</div><div class="online-measure-grid">${MEASURES.map(([key,label])=>{const previous=n(last?.measurements?.[key]);return `<div class="field"><label>${label}, см</label><input id="ciM_${key}" type="number" inputmode="decimal" step="0.1" value="${vals[key]??''}" placeholder="${!same&&previous?`Последний: ${fmt(previous)}`:'—'}"></div>`}).join('')}</div>`;
    const note=document.getElementById('ciNote')?.closest('.field'),photo=document.getElementById('ciPhoto')?.closest('.field');
    if(note)note.before(block);else if(photo)photo.before(block);else sh.querySelector('.btn.primary')?.before(block);
  };
  try{openWeeklyCheckin=window.openWeeklyCheckin}catch(e){}

  const baseSave=window.saveWeeklyCheckin;
  if(typeof baseSave==='function')window.saveWeeklyCheckin=async function(){
    const read=readMeasurements();if(read.error)return toast(read.error);const measurements=read.value||{};
    await baseSave.apply(this,arguments);
    if(!cloud?.user||!cloud?.client)return;
    const date=typeof checkinToday==='function'?checkinToday():new Date().toISOString().slice(0,10);
    const r=await cloud.client.from('checkins').update({measurements,updated_at:new Date().toISOString()}).eq('user_id',cloud.user.id).eq('checkin_date',date);
    if(r.error){console.warn('save online measurements',r.error);return}
    try{if(typeof loadMyCheckin==='function')await loadMyCheckin(true)}catch(e){}
    try{if(document.getElementById('stats')?.classList.contains('active')&&typeof statsPage==='function')statsPage()}catch(e){}
  };
  try{saveWeeklyCheckin=window.saveWeeklyCheckin}catch(e){}

  function spark(points){
    if(!points?.length)return'';const a=points.slice(-12),W=260,H=42,L=2,R=2,T=4,B=4,vals=a.map(p=>p.v),mn=Math.min(...vals),mx=Math.max(...vals),rg=Math.max(.5,mx-mn),x=i=>L+(a.length===1?(W-L-R)/2:i*(W-L-R)/(a.length-1)),y=v=>T+(mx-v)/rg*(H-T-B),pts=a.map((p,i)=>`${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');return `<svg class="body-progress-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><line class="grid" x1="0" x2="${W}" y1="${H-5}" y2="${H-5}"/>${a.length>1?`<polyline class="line" points="${pts}"/>`:''}${a.map((p,i)=>`<circle class="dot" cx="${x(i)}" cy="${y(p.v)}" r="2.6"/>`).join('')}</svg>`}
  function metricRow(label,unit,points){if(!points?.length)return'';const first=points[0],last=points[points.length-1],delta=+(last.v-first.v).toFixed(1),prev=points.length>1?points[points.length-2]:null,step=prev?+(last.v-prev.v).toFixed(1):null;return `<div class="body-progress-row"><div class="body-progress-top"><div><div class="body-progress-name">${label}</div><div class="body-progress-meta">${points.length} замер${points.length===1?'':points.length<5?'а':'ов'} · с ${dateLabel(first.d)}${step!=null?` · последний шаг <span class="body-progress-delta">${step>0?'+':''}${fmt(step)} ${unit}</span>`:''}</div></div><div class="body-progress-value">${fmt(last.v)} ${unit}${points.length>1?`<div class="body-progress-meta" style="text-align:right">всего ${delta>0?'+':''}${fmt(delta)} ${unit}</div>`:''}</div></div>${spark(points)}</div>`}
  }
  async function fetchProgress(userId){
    if(!cloud?.client||!userId)return null;
    const [bw,ci]=await Promise.all([
      cloud.client.from('bodyweights').select('measure_date,weight_kg').eq('user_id',userId).order('measure_date',{ascending:true}).limit(80),
      cloud.client.from('checkins').select('checkin_date,measurements').eq('user_id',userId).order('checkin_date',{ascending:true}).limit(80)
    ]);
    if(bw.error||ci.error)return null;
    const metrics={weight:(bw.data||[]).map(x=>({d:x.measure_date,v:n(x.weight_kg)})).filter(x=>x.v!=null)};
    for(const [key] of MEASURES)metrics[key]=(ci.data||[]).map(x=>({d:x.checkin_date,v:n(x.measurements?.[key])})).filter(x=>x.v!=null);
    return metrics;
  }
  function progressHtml(metrics,title='Прогресс тела'){
    if(!metrics)return'';const filled=MEASURES.filter(([k])=>metrics[k]?.length),weight=metrics.weight||[],allCount=filled.length+(weight.length?1:0);if(!allCount)return `<div class="section">${title.toUpperCase()}</div><div class="card muted">Пока нет замеров. Они появятся после чек-ина клиента.</div>`;
    const rows=[weight.length?metricRow('Вес','кг',weight):'',...MEASURES.map(([k,l])=>metricRow(l,'см',metrics[k]||[]))].filter(Boolean).join('');
    return `<div class="section">${title.toUpperCase()}</div><div class="body-progress-summary"><div class="metric"><span>Записей веса</span><b>${weight.length}</b></div><div class="metric"><span>Обхватов отслеживается</span><b>${filled.length}</b></div></div><div class="body-progress-list">${rows}</div>`;
  }

  const baseClientDetail=window.trainerClientDetail;
  if(typeof baseClientDetail==='function')window.trainerClientDetail=async function(id){
    const r=await baseClientDetail.apply(this,arguments);if(!cloud?.user)return r;
    const metrics=await fetchProgress(id),sh=document.getElementById('sheet');if(sh&&!sh.querySelector('.online-client-body-progress')){const box=document.createElement('div');box.className='online-client-body-progress';box.innerHTML=progressHtml(metrics,'Прогресс веса и обхватов');sh.appendChild(box)}return r;
  };
  try{trainerClientDetail=window.trainerClientDetail}catch(e){}

  async function renderOwnProgress(){
    if(!cloud?.user||cloud?.profile?.role==='trainer'||(typeof trainerIsTrainer==='function'&&trainerIsTrainer()))return;
    const root=document.getElementById('stats');if(!root||root.querySelector('.own-body-progress'))return;
    const metrics=await fetchProgress(cloud.user.id);const box=document.createElement('div');box.className='own-body-progress';box.innerHTML=progressHtml(metrics,'Вес и обхваты');root.appendChild(box);
  }
  const baseStats=window.statsPage;
  if(typeof baseStats==='function')window.statsPage=function(){const r=baseStats.apply(this,arguments);setTimeout(renderOwnProgress,0);return r};
  try{statsPage=window.statsPage}catch(e){}

  setTimeout(()=>{try{renderOwnProgress()}catch(e){}},1000);
})();
