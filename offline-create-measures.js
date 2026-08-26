'use strict';
(()=>{
  if(window.__unvrslOfflineCreateMeasures)return;window.__unvrslOfflineCreateMeasures=true;

  const style=document.createElement('style');
  style.textContent=`
    .offline-create-section{margin:18px 2px 8px;color:#8e8e93;font-size:11px;font-weight:780;letter-spacing:.1em;text-transform:uppercase}
    .offline-create-note{font-size:11px;line-height:1.35;color:#73757c;margin:4px 2px 10px}
  `;
  document.head.appendChild(style);

  function nval(sel){
    const raw=document.querySelector(sel)?.value;
    if(raw==null||raw==='')return null;
    const n=Number(String(raw).replace(',','.'));
    return Number.isFinite(n)&&n>0?n:null;
  }

  window.offlineNewClientSheet=function(){
    const today=new Date().toISOString().slice(0,10);
    modal(`<div class="sheet-grabber"></div>
      <h2>Офлайн-клиент</h2>
      <div class="field"><label>Имя</label><input id="offName" placeholder="Например, Анна"></div>
      <div class="offline-measure-grid">
        <div class="field"><label>Пол</label><select id="offSex"><option value="female">Женский</option><option value="male">Мужской</option><option value="other">Другой</option></select></div>
        <div class="field"><label>Осталось занятий</label><input id="offSessions" type="number" min="0" step="1" inputmode="numeric" value="8"></div>
        <div class="field"><label>Рост, см</label><input id="offHeight" type="number" min="100" max="250" step="0.5" inputmode="decimal"></div>
        <div class="field"><label>Дата рождения</label><input id="offBirth" type="date"></div>
      </div>

      <div class="offline-create-section">Начальные показатели</div>
      <div class="offline-create-note">Можно заполнить сразу или добавить позже. Эти значения станут первой точкой в истории прогресса.</div>
      <div class="offline-measure-grid">
        <div class="field"><label>Вес, кг</label><input id="offWeight" type="number" min="20" max="400" step="0.1" inputmode="decimal"></div>
        <div class="field"><label>Дата замера</label><input id="offMeasureDate" type="date" value="${today}"></div>
        <div class="field"><label>Грудь, см</label><input id="offChest" type="number" step="0.1" inputmode="decimal"></div>
        <div class="field"><label>Талия, см</label><input id="offWaist" type="number" step="0.1" inputmode="decimal"></div>
        <div class="field"><label>Живот, см</label><input id="offAbdomen" type="number" step="0.1" inputmode="decimal"></div>
        <div class="field"><label>Ягодицы, см</label><input id="offHips" type="number" step="0.1" inputmode="decimal"></div>
        <div class="field"><label>Бедро, см</label><input id="offThigh" type="number" step="0.1" inputmode="decimal"></div>
        <div class="field"><label>Рука, см</label><input id="offArm" type="number" step="0.1" inputmode="decimal"></div>
        <div class="field"><label>Икра, см</label><input id="offCalf" type="number" step="0.1" inputmode="decimal"></div>
      </div>
      <div class="field"><label>Заметка</label><textarea id="offNotes" placeholder="Цель, особенности, ограничения"></textarea></div>
      <button class="btn primary full" onclick="offlineSaveNewClient()">Добавить клиента</button>`);
  };

  window.offlineSaveNewClient=async function(){
    const name=document.querySelector('#offName')?.value.trim();
    if(!name)return toast('Введи имя');
    if(!cloud?.ready||!cloud.user)return toast('Войди в тренерский аккаунт');

    const payload={
      trainer_id:cloud.user.id,
      display_name:name,
      sex:document.querySelector('#offSex')?.value||'female',
      sessions_remaining:Math.max(0,parseInt(document.querySelector('#offSessions')?.value||'0',10)||0),
      height_cm:nval('#offHeight'),
      birth_date:document.querySelector('#offBirth')?.value||null,
      notes:document.querySelector('#offNotes')?.value.trim()||null,
      updated_at:new Date().toISOString()
    };

    const r=await cloud.client.from('offline_clients').insert(payload).select().single();
    if(r.error)return alert(r.error.message);

    const measurements={
      chest:nval('#offChest'),
      waist:nval('#offWaist'),
      abdomen:nval('#offAbdomen'),
      hips:nval('#offHips'),
      thigh:nval('#offThigh'),
      arm:nval('#offArm'),
      calf:nval('#offCalf')
    };
    Object.keys(measurements).forEach(k=>measurements[k]==null&&delete measurements[k]);
    const weight=nval('#offWeight');
    const hasInitial=weight!=null||Object.keys(measurements).length>0;

    if(hasInitial){
      const m=await cloud.client.from('offline_client_measurements').insert({
        offline_client_id:r.data.id,
        trainer_id:cloud.user.id,
        measure_date:document.querySelector('#offMeasureDate')?.value||new Date().toISOString().slice(0,10),
        weight_kg:weight,
        measurements,
        notes:'Начальный замер'
      });
      if(m.error){
        alert(`Клиент добавлен, но начальные замеры не сохранились: ${m.error.message}`);
      }
    }

    closeModal();
    if(typeof renderOfflineClients==='function')await renderOfflineClients();
    toast(hasInitial?'Клиент и замеры сохранены':'Клиент добавлен');
    if(typeof offlineClientDetail==='function')offlineClientDetail(r.data.id);
  };
})();
