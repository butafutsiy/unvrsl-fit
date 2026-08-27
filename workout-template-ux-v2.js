'use strict';
(()=>{
  if(window.__unvrslWorkoutTemplateUxV2)return;
  window.__unvrslWorkoutTemplateUxV2=true;

  const style=document.createElement('style');
  style.id='workout-template-ux-v2-style';
  style.textContent=`
    .unvrsl-time-set{display:grid;grid-template-columns:32px minmax(72px,.8fr) minmax(112px,1.25fr) minmax(70px,.8fr) 42px;gap:8px;align-items:center;margin-top:8px}
    .unvrsl-time-set .work-time{font-size:17px;font-weight:800;text-align:center}.unvrsl-time-set input{width:100%;background:#111113;border:1px solid #343438;border-radius:13px;color:#fff;padding:11px 7px;text-align:center;font-size:16px}
    @media(max-width:390px){.unvrsl-time-set{grid-template-columns:28px 66px minmax(104px,1fr) 66px 40px;gap:6px}.unvrsl-time-set .btn{padding:10px 8px!important;font-size:12px!important}}
  `;
  document.head.appendChild(style);

  function formatWork(sec){sec=Math.max(0,Math.round(Number(sec)||0));if(sec>=60&&sec%60===0)return `${sec/60} мин`;const m=Math.floor(sec/60),s=sec%60;return m?`${m}:${String(s).padStart(2,'0')}`:`${s} сек`}

  window.unvrslStartWorkTimer=function(sec){
    const fn=window.timer||((typeof timer==='function')?timer:null);if(!fn||!sec)return;
    const r=fn(sec,' ');
    setTimeout(()=>{const lab=document.querySelector('#timer .muted.small');if(lab)lab.textContent=''},0);
    return r;
  };
  window.programWorkTimer=function(sec){return window.unvrslStartWorkTimer(sec)};
  try{programWorkTimer=window.programWorkTimer}catch(e){}

  function cleanWorkTimerLabel(){
    const lab=document.querySelector('#timer .muted.small');if(!lab)return;
    const t=lab.textContent||'';
    if(/Работа/i.test(t)||/%D[0-9A-F]/i.test(t))lab.textContent='';
  }
  if(document.getElementById('timer'))new MutationObserver(cleanWorkTimerLabel).observe(document.getElementById('timer'),{subtree:true,childList:true,characterData:true});
  cleanWorkTimerLabel();

  function patchBuiltInTimed(w,c,beforeId){
    const s=st.current;if(!s||s.id===beforeId||Number(s.w)!==Number(w)||String(s.c)!==String(c))return;
    const routine=(typeof ROUTINES!=='undefined'?ROUTINES:[]).find(r=>Number(r.w)===Number(w)&&String(r.c)===String(c));if(!routine)return;
    let changed=false;
    (routine.e||[]).forEach((src,i)=>{
      const min=Number(src?.m);if(!(min>0)||!s.ex?.[i])return;
      const e=s.ex[i],sec=Math.round(min*60);e.mode='timer';e.workSeconds=sec;e.d=src.d||e.d||'';e.target=e.target||s.target;
      (e.set||[]).forEach(x=>{x.workSeconds=sec;x.r=0});changed=true;
    });
    if(changed){try{save()}catch(e){};if(typeof startPage==='function')startPage()}
  }
  const baseBegin=window.begin;
  if(typeof baseBegin==='function'&&!baseBegin.__timedBuiltinV2){
    const wrapped=function(w,c){const before=st.current?.id||null,r=baseBegin.apply(this,arguments);patchBuiltInTimed(w,c,before);return r};
    wrapped.__timedBuiltinV2=true;window.begin=wrapped;try{begin=wrapped}catch(e){}
  }

  const baseExerciseCard=window.exerciseCard;
  if(typeof baseExerciseCard==='function'&&!baseExerciseCard.__timedBuiltinV2){
    const wrapped=function(s,e,ei){
      if(e?.mode!=='timer'||s?.antonPlan)return baseExerciseCard.apply(this,arguments);
      const target=e.target||s.target||8;
      const rows=(e.set||[]).map((x,si)=>{const sec=x.workSeconds||e.workSeconds||0;return `<div class="unvrsl-time-set"><span class="setnum">${si+1}</span><b class="work-time">${formatWork(sec)}</b><button class="btn tiny" onclick="unvrslStartWorkTimer(${sec})">▶ Таймер</button><input inputmode="decimal" value="${x.rpe||''}" placeholder="${target}" onchange="editSet(${ei},${si},'rpe',this.value)"><button class="check ${x.ok?'done':''}" onclick="toggleSet(${ei},${si})">${x.ok?'✓':'○'}</button></div>`}).join('');
      return `<div class="exercise"><div class="row between"><div class="grow"><div class="exname">${esc(e.n)}</div>${e.d?`<div class="exnote">${esc(e.d)}</div>`:''}</div></div><div class="sethead"><span>#</span><span>время</span><span>таймер</span><span>RPE</span><span></span></div>${rows}</div>`;
    };
    wrapped.__timedBuiltinV2=true;window.exerciseCard=wrapped;try{exerciseCard=wrapped}catch(e){}
  }

  function showProgramsAfterAdd(message='Программа добавлена в «Мои программы»'){
    try{closeModal()}catch(e){}
    try{if(typeof nav==='function')nav('programs')}catch(e){}
    try{if(typeof trainerProgramsPage==='function')trainerProgramsPage()}catch(e){}
    if(typeof toast==='function')toast(message)
  }

  window.createFromTemplate=function(id){
    const t=typeof templateById==='function'?templateById(id):null;if(!t)return;
    const p=typeof clone==='function'?clone(t):JSON.parse(JSON.stringify(t));
    p.id=uid('prog');p.name=t.name||'Программа из шаблона';p.created=Date.now();p.updated=Date.now();delete p.sourceProgramId;
    (p.weeks||[]).forEach(w=>(w.days||[]).forEach(d=>d.id=uid('day')));
    st.programs=Array.isArray(st.programs)?st.programs:[];st.programs.push(p);save();showProgramsAfterAdd();
  };
  try{createFromTemplate=window.createFromTemplate}catch(e){}

  if(typeof POPULAR_PROGRAMS!=='undefined'){
    window.createPopularProgram=function(id){const spec=POPULAR_PROGRAMS[id];if(!spec)return;const p=spec.build();st.programs=Array.isArray(st.programs)?st.programs:[];st.programs.push(p);save();showProgramsAfterAdd()};
    try{createPopularProgram=window.createPopularProgram}catch(e){}
  }

  const baseFemale=window.createFemaleTemplateProgram;
  if(typeof baseFemale==='function'){
    window.createFemaleTemplateProgram=function(key){
      const before=new Set((st.programs||[]).map(p=>String(p.id)));
      const r=baseFemale.apply(this,arguments);
      const added=(st.programs||[]).find(p=>!before.has(String(p.id)));
      if(added)showProgramsAfterAdd();
      return r;
    };
    try{createFemaleTemplateProgram=window.createFemaleTemplateProgram}catch(e){}
  }

  const baseTemplates=window.templatesSheet||((typeof templatesSheet==='function')?templatesSheet:null);
  if(typeof baseTemplates==='function'){
    const wrapped=function(){
      const r=baseTemplates.apply(this,arguments);
      setTimeout(()=>{const sh=document.getElementById('sheet');if(!sh)return;sh.querySelectorAll('button').forEach(b=>{const t=(b.textContent||'').trim();if(t==='Использовать'||t==='Добавить')b.textContent='В мои программы'})},0);
      return r;
    };
    window.templatesSheet=wrapped;try{templatesSheet=wrapped}catch(e){}
  }
})();
