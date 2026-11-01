'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslCardioWorkoutBriefV1)return;
  W.__unvrslCardioWorkoutBriefV1=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const num=v=>v==null||String(v).trim()===''?null:(Number.isFinite(Number(v))?Number(v):null);
  const fmt=(v,d=1)=>Number(v).toLocaleString('ru-RU',{maximumFractionDigits:d});
  const ready=v=>num(v)!=null&&num(v)>0;
  const cardios=e=>e&&(e.kind==='cardio'||e.mode==='cardio'||((e.workMode==='timer'||e.mode==='timer')&&/байк|кардио|дорож|велотренаж|эллип|гребн|лыжн|лестниц|stepper|stairmaster/i.test(String(e.n||'')))||W.UNVRSLCardio?.isCardio?.(e));
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
        const clean=n=>String(n||'').trim().replace(/\s*[—–-]\s*W\d+$/i,'').trim().toLowerCase();
        const names=[clean(e.n),clean(W.displayExerciseName?.(e.n))].filter(Boolean);
        card=[...root.querySelectorAll('.cardio-compact-ex,.cardio-program-ex,.cardio-workout,.exercise,.card')].find(el=>{
          if(used.has(el)||el.classList.contains('workout-head')||el.classList.contains('workout-finish-card'))return false;
          const label=clean(el.querySelector('.exname,.cardio-name,.cardio-compact-title')?.textContent
            ||el.querySelector('h2,h3,h4,strong')?.textContent||'');
          return label&&names.some(n=>label===n||label.includes(n)||n.includes(label));
        });
      }
      if(!card||used.has(card))continue;
      used.add(card);
      let holder=card.querySelector(`[data-cardio-brief-ei="${ei}"]`);
      if(holder){const doc=D.createElement('div');doc.innerHTML=brief(e,s,ei);const oldFacts=holder.querySelector('.uw-cardio-facts'),newFacts=doc.firstElementChild.querySelector('.uw-cardio-facts');if(oldFacts&&newFacts&&oldFacts.outerHTML!==newFacts.outerHTML)oldFacts.replaceWith(newFacts);continue;}
      const compactBody=card.querySelector('.cardio-compact-body');
      const first=card.querySelector(':scope > .row.between')||card.querySelector('.exname,.cardio-name,.cardio-compact-title')||card.firstElementChild;
      // Keep the familiar timer/action row directly under the cardio title.
      // Supplementary values belong beneath the row inside the same card.
      if(compactBody)compactBody.insertAdjacentHTML('beforeend',brief(e,s,ei));
      else if(first)first.insertAdjacentHTML('afterend',brief(e,s,ei));
      else card.insertAdjacentHTML('beforeend',brief(e,s,ei));
      // The existing detailed grid stays available where a legacy workout card already provides it.
      if(card.querySelector('.cardio-form-grid'))card.querySelector('.uw-cardio-edit')?.remove();
    }
  }
  const style=D.createElement('style');style.id='unvrsl-cardio-workout-brief-v567';style.textContent=`
    /* Keep supplementary cardio parameters inside the original exercise surface. */
    #start .uw-cardio-brief{box-sizing:border-box;width:100%;min-width:0;margin:4px 0 0!important;padding:10px 0 0!important;border:0!important;border-top:1px solid var(--line)!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}
    #start .cardio-compact-ex .uw-cardio-brief{margin:3px 0 0!important;padding-top:11px!important;background:transparent!important}
    #start .uw-cardio-facts{display:flex!important;flex-wrap:wrap!important;align-items:baseline!important;gap:7px 15px!important;min-width:0!important;background:transparent!important;border:0!important}
    #start .uw-cardio-facts>div{display:inline-flex!important;align-items:baseline!important;gap:5px!important;min-width:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}
    #start .uw-cardio-facts small{display:inline!important;font-size:11px!important;font-weight:500!important;line-height:1.35!important;color:var(--muted)!important;margin:0!important;white-space:nowrap}
    #start .uw-cardio-facts strong{display:inline!important;font-size:12px!important;line-height:1.35!important;font-weight:720!important;color:var(--text)!important;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
    #start .uw-cardio-edit{margin:5px 0 0!important;background:transparent!important;border:0!important}
    #start .uw-cardio-edit summary{list-style:none;min-height:32px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;font-size:11px!important;line-height:1.3!important;font-weight:650!important;color:var(--muted)!important;cursor:pointer}
    #start .uw-cardio-edit summary::-webkit-details-marker{display:none}
    #start .uw-cardio-edit summary span{font-size:11px!important;color:var(--green)!important;font-weight:650!important}
    #start .uw-cardio-edit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:8px 0 10px;background:transparent}
    #start .uw-cardio-edit-grid label{display:flex;flex-direction:column;gap:5px;min-width:0}
    #start .uw-cardio-edit-grid span{font-size:11px;color:var(--muted)}
    #start .uw-cardio-edit-grid input{background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:11px;min-width:0;width:100%;padding:10px;font-size:16px}
    #start .uw-cardio-edit p{font-size:11px;color:var(--muted);line-height:1.45;margin:6px 0 2px}
    @media(max-width:365px){#start .uw-cardio-facts{gap:6px 11px!important}#start .uw-cardio-facts strong{font-size:11.5px!important}}
`  `;D.head.appendChild(style);
  W.addEventListener('unvrsl:workout-rendered',mount);
  const base=W.unvrslCardioEdit;
  if(typeof base==='function')W.unvrslCardioEdit=function(){const value=base.apply(this,arguments);mount();return value;};
  // Training lists are rebuilt by several independent modules, not all of which
  // emit the workout-rendered event. Reattach the facts after those rebuilds.
  let mountScheduled=false;
  function scheduleMount(){
    if(mountScheduled)return;
    mountScheduled=true;
    requestAnimationFrame(()=>{mountScheduled=false;mount();});
  }
  const startRoot=D.getElementById('start');
  if(startRoot&&typeof MutationObserver==='function'){
    const observer=new MutationObserver(changes=>{
      if(!startRoot.classList.contains('active'))return;
      if(changes.some(change=>change.type==='childList'&&(change.addedNodes.length||change.removedNodes.length)))scheduleMount();
    });
    observer.observe(startRoot,{childList:true,subtree:true});
  }
  W.addEventListener('unvrsl:modules-ready',scheduleMount);
  W.addEventListener('unvrsl:app-ready',scheduleMount);
  queueMicrotask(mount);
  window.addEventListener('pageshow',scheduleMount);
})();