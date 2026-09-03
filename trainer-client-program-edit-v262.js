'use strict';
(()=>{
  const W=window,D=document,TRAINER='Семён';
  if(W.__unvrslTrainerClientProgramEditV262)return;
  W.__unvrslTrainerClientProgramEditV262=true;

  function ensureStyle(){
    if(D.getElementById('trainer-client-program-edit-v262-style'))return;
    const s=D.createElement('style');
    s.id='trainer-client-program-edit-v262-style';
    s.textContent=`
      .tcv262-trainer{margin-top:7px;color:#8e8e93;font-size:13px;font-weight:700;line-height:1.25}
      .tcv3-program .tcv262-assignment{color:#8e8e93!important}
    `;
    D.head?.appendChild(s)
  }

  function directEditButton(btn){
    if(!btn||btn.dataset.tcv262DirectEdit==='1')return;
    const raw=btn.getAttribute('onclick')||'';
    if(!raw.includes('trainerClientOpenPlanV3('))return;
    btn.setAttribute('onclick',raw.replace('trainerClientOpenPlanV3(','trainerClientEditPlanV3('));
    btn.textContent='Изменить';
    btn.dataset.tcv262DirectEdit='1';
    btn.setAttribute('aria-label','Изменить назначенную программу')
  }

  function decorate(){
    ensureStyle();
    const sheet=D.getElementById('sheet');if(!sheet)return;
    const name=sheet.querySelector('.tcv3-name');
    if(name&&!name.parentElement?.querySelector('.tcv262-trainer')){
      const tag=D.createElement('div');tag.className='tcv262-trainer';tag.textContent=`Тренер ${TRAINER}`;name.insertAdjacentElement('afterend',tag)
    }
    sheet.querySelectorAll('.tcv3-program').forEach(card=>{
      const note=card.querySelector('.muted.small');
      if(note&&(note.textContent||'').trim().startsWith('Назначена клиенту')){
        note.textContent=`Назначена клиенту · Тренер ${TRAINER}`;
        note.classList.add('tcv262-assignment')
      }
      directEditButton(card.querySelector('.tcv3-program-open'))
    })
  }

  let queued=false;
  function queue(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;decorate()})
  }
  const observer=typeof MutationObserver==='function'?new MutationObserver(queue):null;
  observer?.observe(D.documentElement,{childList:true,subtree:true});
  for(const event of ['unvrsl:modules-ready','unvrsl:cloud-ready','unvrsl:app-ready'])W.addEventListener?.(event,queue,{passive:true});
  [0,250,700,1500,3000].forEach(ms=>setTimeout(queue,ms));
})();
