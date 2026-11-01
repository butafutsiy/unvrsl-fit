'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslCardioWorkoutBriefV1)return;
  W.__unvrslCardioWorkoutBriefV1=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const num=v=>v==null||String(v).trim()===''?null:(Number.isFinite(Number(v))?Number(v):null);
  const fmt=(v,d=1)=>Number(v).toLocaleString('ru-RU',{maximumFractionDigits:d});
  const ready=v=>num(v)!=null&&num(v)>0;
  const cardios=e=>e&&(e.kind==='cardio'||e.mode==='cardio'||e.workMode==='timer'&&/байк|кардио|дорож|велотренаж|эллип|гребн|лыжн|лестниц|stepper|stairmaster/i.test(String(e.n||''))||W.UNVRSLCardio?.isCardio?.(e));
  const isTreadmill=e=>/дорож|treadmill|ходьб.*наклон/i.test(String(e.n||'')+' '+String(e.cardioMachineId||''));
  const time=v=>{const n=Math.max(0,Math.round(Number(v)||0)),m=Math.floor(n/60),s=n%60;return n>=3600?`${Math.floor(n/3600)}:${String(m%60).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;};
  const fields=[['durationMin','Время, мин','0.5'],['distanceKm','Дистанция, км','0.01'],['speedKmh','Скорость, км/ч','0.1'],['inclinePct','Наклон, %','0.5'],['resistance','Сопротивление','1'],['powerWatts','Мощность, Вт','1'],['heartRate','Пульс, уд/мин','1'],['reportedKcal','Калории с тренажёра','1'],['weightKg','Масса тела, кг','0.1']];
  function brief(e,s,ei){
    const c={...(W.UNVRSLCardio?.settings?.(e)||{}),...(e.cardio||{})},set=e.set?.[0]||{};
    const target=Number(set.workSeconds??e.workSeconds??e.durationSec??0);
    if(target>0)c.durationMin=target/60;
    if(set.reportedKcal!=null)c.reportedKcal=set.reportedKcal;
    if(set.weightKg!=null)c.weightKg=set.weightKg;
    const kcal=W.UNVRSLCardio?.estimate?.(e,c,s);
    const tempo=String(c.tempo||e.tempo||(c.mode==='interval'?'Интервальный':'Равномерный')).trim();
    const treadmill=isTreadmill(e),explicitIncline=e.cardio?.inclinePct!=null;
    const cells=[['Темп',tempo||'—']];
    if(treadmill||explicitIncline)cells.push(['Наклон',num(c.inclinePct)!=null?`${fmt(c.inclinePct)} %`:'—']);
    if(treadmill||ready(c.speedKmh))cells.push(['Скорость',ready(c.speedKmh)?`${fmt(c.speedKmh)} км/ч`:'—']);
    if(ready(c.distanceKm))cells.push(['Дистанция',`${fmt(c.distanceKm,2)} км`]);
    if(ready(c.powerWatts))cells.push(['Мощность',`${fmt(c.powerWatts,0)} Вт`]);
    if(ready(c.resistance))cells.push(['Сопротивление',fmt(c.resistance)]);
    cells.push(['Калории',kcal?.kcal!=null?`${kcal.source==='met'?'≈ ':''}${fmt(kcal.kcal,0)} ккал`:'—']);
    if(ready(c.heartRate))cells.push(['Пульс',`${fmt(c.heartRate,0)} уд/мин`]);
    const fieldValues={...c,durationMin:c.durationMin};
    const inputs=fields.filter(([key])=>key!=='inclinePct'||treadmill||explicitIncline)
      .map(([key,label,step])=>`<label><span>${esc(label)}</span><input type="number" inputmode="decimal" min="0" step="${step}" value="${esc(fieldValues[key]??'')}" onchange="unvrslCardioEdit(${ei},'${key}',this.value)"></label>`).join('');
    return `<div class="uw-cardio-brief" data-cardio-brief-ei="${ei}">
      <div class="uw-cardio-facts">${cells.map(([label,value])=>`<div><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`).join('')}</div>
      <details class="uw-cardio-edit"><summary>Параметры кардио <span>Изменить</span></summary>
        <div class="uw-cardio-edit-grid">${inputs}</div>
        <p>Калории с тренажёра имеют приоритет. Значение с символом ≈ рассчитано по MET и массе тела.</p>
      </details>
    </div>`;
  }
  function mount(){
    const s=W.st?.current,root=D.getElementById('start');
    if(!s||!root)return;
    const used=new Set();
    for(const [ei,e] of (s.ex||[]).entries()){
      if(!cardios(e))continue;
      let card=root.querySelector(`[data-cardio-exercise="${ei}"]`);
      if(!card){
        const names=[String(e.n||'').trim(),String(W.displayExerciseName?.(e.n)||'').trim()];
        card=[...root.querySelectorAll('.exercise')].find(el=>{
          if(used.has(el))return false;
          const label=el.querySelector('.exname')?.textContent?.trim()||'';
          return label&&names.some(n=>n&&(label===n||label.includes(n)));
        });
      }
      if(!card||used.has(card))continue;
      used.add(card);
      let holder=card.querySelector(`[data-cardio-brief-ei="${ei}"]`);
      if(holder){const doc=D.createElement('div');doc.innerHTML=brief(e,s,ei);holder.querySelector('.uw-cardio-facts')?.replaceWith(doc.firstElementChild.querySelector('.uw-cardio-facts'));continue;}
      const first=card.querySelector(':scope > .row.between')||card.querySelector('.cardio-compact-row')||card.firstElementChild;
      if(first)first.insertAdjacentHTML('afterend',brief(e,s,ei));
      else card.insertAdjacentHTML('beforeend',brief(e,s,ei));
      // The existing detailed grid stays available where a legacy workout card already provides it.
      if(card.querySelector('.cardio-form-grid'))card.querySelector('.uw-cardio-edit')?.remove();
    }
  }
  const style=D.createElement('style');style.id='unvrsl-cardio-workout-brief-v1';style.textContent=`
    #start .uw-cardio-brief{margin:12px 0 5px;padding:13px 0 0;border-top:1px solid var(--line);min-width:0}
    #start .uw-cardio-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));column-gap:12px;row-gap:13px}
    #start .uw-cardio-facts>div{min-width:0}
    #start .uw-cardio-facts small{display:block;font-size:11px;color:var(--muted);margin-bottom:4px;line-height:1.2}
    #start .uw-cardio-facts strong{font-size:13px;line-height:1.22;display:block;font-weight:750;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
    #start .uw-cardio-edit{margin-top:12px}
    #start .uw-cardio-edit summary{list-style:none;min-height:37px;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;font-weight:700;color:var(--text);cursor:pointer}
    #start .uw-cardio-edit summary::-webkit-details-marker{display:none}
    #start .uw-cardio-edit summary span{color:var(--muted);font-weight:500}
    #start .uw-cardio-edit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:5px 0 10px}
    #start .uw-cardio-edit-grid label{display:flex;flex-direction:column;gap:5px;min-width:0}
    #start .uw-cardio-edit-grid span{font-size:11px;color:var(--muted)}
    #start .uw-cardio-edit-grid input{background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:11px;min-width:0;width:100%;padding:10px;font-size:16px}
    #start .uw-cardio-edit p{font-size:11px;color:var(--muted);line-height:1.4}
    @media(max-width:380px){#start .uw-cardio-facts{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;D.head.appendChild(style);
  W.addEventListener('unvrsl:workout-rendered',mount);
  const base=W.unvrslCardioEdit;
  if(typeof base==='function')W.unvrslCardioEdit=function(){const value=base.apply(this,arguments);mount();return value;};
  queueMicrotask(mount);
})();