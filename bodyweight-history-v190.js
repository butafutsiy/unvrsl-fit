'use strict';
(()=>{
  if(window.__unvrslBodyweightHistory190)return;
  window.__unvrslBodyweightHistory190=true;

  const N=v=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null};
  const fmt=v=>v==null?'—':Number(v).toFixed(1).replace('.0','').replace('.',',');
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const dateLabel=s=>{const d=new Date(String(s).slice(0,10)+'T12:00:00');if(Number.isNaN(d.getTime()))return String(s||'');return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`};
  let rows=[],selected=null,loading=false;

  const style=document.createElement('style');
  style.id='bodyweight-history-v190-style';
  style.textContent=`
    .bw190-wrap{margin:10px 0 4px}.bw190-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.bw190-title{font-size:12px;color:#8e8e93}.bw190-all{border:0;background:transparent;color:#bf5af2;font-size:13px}.bw190-scroll{display:flex;gap:7px;overflow-x:auto;padding:1px 0 4px;-webkit-overflow-scrolling:touch}.bw190-chip{flex:0 0 auto;border:1px solid #303038;background:#222226;color:#aaaab0;border-radius:13px;padding:8px 10px;text-align:left;min-width:76px}.bw190-chip b{display:block;color:#f5f5f7;font-size:14px}.bw190-chip span{display:block;font-size:10px;margin-top:2px}.bw190-chip.on{border-color:#bf5af2;background:rgba(191,90,242,.12)}.bw190-chip.on b{color:#d68cff}.bw190-point-info{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0 0;padding:9px 10px;border-radius:13px;background:rgba(191,90,242,.10);border:1px solid rgba(191,90,242,.25)}.bw190-point-info b{font-size:13px;color:#d68cff}.bw190-point-info span{display:block;font-size:10px;color:#8e8e93;margin-top:2px}.bw190-edit{flex:0 0 auto;border:0;background:#303033;color:#fff;border-radius:11px;padding:8px 10px;font-weight:700;font-size:12px}.bw190-list{max-height:56vh;overflow:auto}.bw190-row{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #303034;text-align:left}.bw190-row:last-child{border-bottom:0}.bw190-row small{display:block;color:#8e8e93;margin-top:3px}.bw190-delete{margin-top:10px}.sd2-chart .bw190-point{cursor:pointer;transform-box:fill-box;transform-origin:center;outline:none;stroke:transparent;stroke-width:10;paint-order:stroke fill;transition:r .15s,fill .15s,stroke .15s}.sd2-chart .bw190-point:hover,.sd2-chart .bw190-point:focus,.sd2-chart .bw190-point.is-selected{r:6.5px;fill:#fff;stroke:rgba(191,90,242,.38)}
  `;
  document.head.appendChild(style);

  function deletedDates(){return new Set((window.st?.deletedBodyweights||[]).map(x=>String(x?.d||x||'').slice(0,10)).filter(Boolean))}
  function localRows(){const deleted=deletedDates();return (window.st?.bw||[]).map(x=>({d:String(x.d||'').slice(0,10),v:N(x.w)})).filter(x=>x.d&&x.v!=null&&!deleted.has(x.d))}
  async function load(){
    if(loading)return;loading=true;
    try{
      let cloudRows=null;
      if(window.cloud?.client&&window.cloud?.user){
        const r=await window.cloud.client.from('bodyweights').select('measure_date,weight_kg').eq('user_id',window.cloud.user.id).order('measure_date',{ascending:true}).limit(1000);
        if(!r.error){const deleted=deletedDates();cloudRows=(r.data||[]).map(x=>({d:String(x.measure_date).slice(0,10),v:N(x.weight_kg)})).filter(x=>x.v!=null&&!deleted.has(x.d))}
      }
      rows=Array.isArray(cloudRows)?cloudRows:localRows();rows.sort((a,b)=>a.d.localeCompare(b.d));
      if(!selected||!rows.some(x=>x.d===selected))selected=rows.at(-1)?.d||null;
      window.__unvrslSelectedBodyweightDate=selected
    }catch(e){console.warn('bodyweight history load',e);rows=localRows()}
    finally{loading=false}
  }
  function weightCards(){return [...document.querySelectorAll('#home .sd2-card,#stats .sd2-card')].filter(x=>x.querySelector('.sd2-weight-label')||/^\s*Вес тела/i.test((x.textContent||'').trim()))}
  function selectedRow(){return rows.find(x=>x.d===selected)||null}
  function applySelection(){
    const x=selectedRow();
    document.querySelectorAll('.bw190-point').forEach(p=>p.classList.toggle('is-selected',p.dataset.bwDate===selected));
    if(!x)return;
    weightCards().forEach(c=>{
      const current=c.querySelector('.sd2-current');if(current)current.innerHTML=`${fmt(x.v)} <small>кг</small>`;
      const date=c.querySelector('.sd2-last-date');if(date)date.textContent=dateLabel(x.d)
    })
  }
  function renderCard(c){
    let host=c.querySelector('.bw190-wrap');
    if(!host){host=document.createElement('div');host.className='bw190-wrap';const chart=c.querySelector('.sd2-seg');if(chart)chart.insertAdjacentElement('beforebegin',host);else c.appendChild(host)}
    const view=rows.slice(-12).reverse(),x=selectedRow();
    host.innerHTML=`<div class="bw190-head"><span class="bw190-title">История веса</span><button class="bw190-all" onclick="bw190History()">Все записи</button></div><div class="bw190-scroll">${view.map(r=>`<button class="bw190-chip ${selected===r.d?'on':''}" onclick="bw190SelectPoint('${r.d}')"><b>${fmt(r.v)} кг</b><span>${dateLabel(r.d)}</span></button>`).join('')||'<span class="muted small">Записей пока нет</span>'}</div>${x?`<div class="bw190-point-info"><div><b>${fmt(x.v)} кг</b><span>${dateLabel(x.d)}</span></div><button class="bw190-edit" onclick="bw190EditSelected()">Изменить</button></div>`:''}`
  }
  function render(){weightCards().forEach(renderCard);applySelection()}

  window.bw190SelectedDate=()=>selected;
  window.bw190SelectPoint=d=>{if(!rows.some(x=>x.d===d))return;selected=d;window.__unvrslSelectedBodyweightDate=d;render()};
  window.bw190Select=window.bw190SelectPoint;
  window.bw190EditSelected=()=>{const x=selectedRow();if(x)editSheet(x)};
  window.bw190History=()=>{
    if(typeof window.modal!=='function')return;
    window.modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>История веса</h2><div class="muted">Выбери запись, чтобы изменить или удалить</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="card bw190-list" style="margin-top:12px">${rows.slice().reverse().map(x=>`<button class="bw190-row" onclick="bw190Open('${x.d}')"><div><b>${fmt(x.v)} кг</b><small>${dateLabel(x.d)}</small></div><span class="chev">›</span></button>`).join('')||'<div class="muted">Записей пока нет</div>'}</div>`)
  };
  window.bw190Open=d=>{const x=rows.find(r=>r.d===d);if(x){selected=d;window.__unvrslSelectedBodyweightDate=d;editSheet(x)}};
  function editSheet(x){
    if(typeof window.modal!=='function')return;
    window.modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>Изменить вес</h2><div class="muted">Запись от ${dateLabel(x.d)}</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="field" style="margin-top:14px"><label>Дата</label><input id="bw190Date" type="date" value="${esc(x.d)}"></div><div class="field"><label>Вес, кг</label><input id="bw190Weight" inputmode="decimal" value="${fmt(x.v).replace(',','.')}"></div><button class="btn primary full" onclick="bw190Save('${x.d}')">Сохранить</button><button class="btn danger full bw190-delete" onclick="bw190Delete('${x.d}')">Удалить запись</button>`)
  }
  async function cloudSave(oldDate,newDate,w){
    if(!window.cloud?.client||!window.cloud?.user)return;
    const c=window.cloud.client,uid=window.cloud.user.id,up=await c.from('bodyweights').upsert({user_id:uid,measure_date:newDate,weight_kg:w},{onConflict:'user_id,measure_date'});if(up.error)throw up.error;
    if(oldDate!==newDate){const del=await c.from('bodyweights').delete().eq('user_id',uid).eq('measure_date',oldDate);if(del.error)throw del.error}
  }
  async function cloudDelete(date){if(!window.cloud?.client||!window.cloud?.user)return;const r=await window.cloud.client.from('bodyweights').delete().eq('user_id',window.cloud.user.id).eq('measure_date',date);if(r.error)throw r.error}
  function localSave(oldDate,newDate,w){if(!window.st)return;const now=Date.now();window.st.bw=Array.isArray(window.st.bw)?window.st.bw:[];window.st.bw=window.st.bw.filter(x=>{const d=String(x.d||'').slice(0,10);return d!==oldDate&&d!==newDate});window.st.bw.push({d:newDate,w,t:now,updatedAt:now});window.st.bw.sort((a,b)=>String(a.d).localeCompare(String(b.d)));window.st.deletedBodyweights=(Array.isArray(window.st.deletedBodyweights)?window.st.deletedBodyweights:[]).filter(x=>{const d=String(x?.d||x||'').slice(0,10);return d!==oldDate&&d!==newDate});try{window.save?.()}catch(_){}}
  function localDelete(date){if(!window.st)return;const now=Date.now();window.st.bw=(Array.isArray(window.st.bw)?window.st.bw:[]).filter(x=>String(x.d||'').slice(0,10)!==date);const deleted=Array.isArray(window.st.deletedBodyweights)?window.st.deletedBodyweights:[];window.st.deletedBodyweights=deleted.filter(x=>String(x?.d||x||'').slice(0,10)!==date);window.st.deletedBodyweights.push({d:date,at:now});try{window.save?.()}catch(_){}}
  async function refreshSurfaces(){
    try{if(typeof window.homeProgressRefresh==='function')await window.homeProgressRefresh(true)}catch(e){console.warn('home weight refresh',e)}
    try{if(typeof window.statsProgressRefresh==='function')await window.statsProgressRefresh(true)}catch(e){console.warn('stats weight refresh',e)}
    render();
    try{if(document.getElementById('plan')?.classList.contains('active'))window.clientCleanPlanPage?.()}catch(_){ }
  }
  window.bw190Save=async oldDate=>{
    const d=document.getElementById('bw190Date')?.value,w=N(document.getElementById('bw190Weight')?.value);
    if(!d||!(w>=30&&w<=350))return window.toast?.('Проверь дату и вес');
    try{await cloudSave(oldDate,d,+w.toFixed(1));localSave(oldDate,d,+w.toFixed(1));rows=rows.filter(x=>x.d!==oldDate&&x.d!==d);rows.push({d,v:+w.toFixed(1)});rows.sort((a,b)=>a.d.localeCompare(b.d));selected=d;window.__unvrslSelectedBodyweightDate=d;window.closeModal?.();await refreshSurfaces();window.toast?.('Вес обновлён')}
    catch(e){console.warn(e);window.alert?.('Не удалось сохранить вес: '+(e.message||e))}
  };
  window.bw190Delete=async date=>{
    const x=rows.find(r=>r.d===date);if(!x)return;
    if(!window.confirm(`Удалить запись ${fmt(x.v)} кг от ${dateLabel(date)}?`))return;
    const button=document.querySelector('.bw190-delete');if(button){button.disabled=true;button.textContent='Удаляем…'}
    let synced=true;localDelete(date);rows=rows.filter(r=>r.d!==date);selected=rows.at(-1)?.d||null;window.__unvrslSelectedBodyweightDate=selected;window.closeModal?.();
    try{await cloudDelete(date)}catch(e){synced=false;console.warn('bodyweight delete queued',e)}
    try{await refreshSurfaces();window.toast?.(synced?'Запись удалена':'Запись удалена · синхронизируется позже')}
    catch(e){console.warn('bodyweight delete refresh',e);window.toast?.('Запись удалена')}
    finally{if(button?.isConnected){button.disabled=false;button.textContent='Удалить запись'}}
  };

  let scheduled=false;
  function scheduleRender(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;render()})}
  const observer=new MutationObserver(()=>{if(weightCards().some(c=>!c.querySelector('.bw190-wrap')))scheduleRender()});
  observer.observe(document.body,{childList:true,subtree:true});
  (async()=>{await load();render()})();
  [300,900,1800].forEach(t=>setTimeout(async()=>{await load();render()},t));
})();
