'use strict';
(()=>{
  const W=window,D=document,REV=369,EDIT_REV=370,KEY='semen-8week-v2',NAME='Мой план · 8 недель v2';
  const BUILTIN='__builtin_cycle__',BUILTIN_COPY_KEY='editable-builtin-cycle-v370';
  if(W.__unvrslPersonal8WeekV369)return;
  W.__unvrslPersonal8WeekV369=true;
  W.__unvrslPersonal8WeekV367=true;

  const META={1:[7,8,'Техника и объём'],2:[8,8.5,'Рабочий объём'],3:[8.5,9,'Интенсификация'],4:[6.5,7.5,'Плотность и памп'],5:[8.5,9,'Тяжёлый стимул'],6:[7,8,'Средне-высокие повторы'],7:[8.5,9.5,'Сила'],8:[9.5,10,'Тесты и контроль результатов']};
  const A=v=>Array.isArray(v)?v:[],N=v=>{const n=Number(v);return Number.isFinite(n)?n:null},fmt=v=>Number(v).toFixed(1).replace('.0','').replace('.',',');
  const range=(a,b)=>{a=N(a);b=N(b);if(a==null&&b==null)return'–';if(a==null)a=b;if(b==null)b=a;return Math.abs(a-b)<.001?fmt(a):`${fmt(Math.min(a,b))}–${fmt(Math.max(a,b))}`};
  const state=()=>{try{if(typeof st!=='undefined')return st}catch(_){ }return W.st||null};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){ }};
  const makeId=p=>{try{if(typeof uid==='function')return uid(p)}catch(_){ }return `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`};
  const personal=()=>A(state()?.programs).find(p=>p?.systemKey===KEY||p?.name===NAME)||null;
  const localByAnyId=id=>A(state()?.programs).find(p=>String(p?.id||'')===String(id)||String(p?.cloudPlanId||'')===String(id))||null;
  const trainerMode=()=>{try{return typeof W.trainerIsTrainer==='function'?!!W.trainerIsTrainer():true}catch(_){return true}};
  const editable=p=>!p?.cloudPlanId||!p?.trainerId||!W.cloud?.user||String(p.trainerId)===String(W.cloud.user.id)||trainerMode();

  function rpe(text,fallback){
    const m=String(text||'').match(/RPE\s*(\d+(?:[.,]\d+)?)\s*(?:[–\-→]\s*(\d+(?:[.,]\d+)?))?/i);
    const a=m?Number(m[1].replace(',','.')):fallback[0],b=m?.[2]?Number(m[2].replace(',','.')):(m?a:fallback[1]);
    return[Math.min(a,b),Math.max(a,b)]
  }

  function enrich(r,g,e){
    const meta=META[r.w]||[8,8,''],mins=[],maxs=[],r1=[],r2=[];let si=0;
    A(g.entries).forEach(src=>{
      const lo=N(src.repMin)??N(src.r),hi=N(src.repMax)??lo,rr=rpe(src.targetEffort,meta),cnt=Math.max(1,N(src.s)||1);
      if(lo!=null){mins.push(lo);maxs.push(hi)}r1.push(rr[0]);r2.push(rr[1]);
      for(let i=0;i<cnt;i++){
        const set=e.sets?.[si++];
        if(set)Object.assign(set,{rMin:lo,rMax:hi,targetRepMin:lo,targetRepMax:hi,targetRpeMin:rr[0],targetRpeMax:rr[1],targetRirMin:Math.max(0,10-rr[1]),targetRirMax:Math.max(0,10-rr[0]),tempo:src.targetTempo||e.tempo})
      }
    });
    const lo=mins.length?Math.min(...mins):null,hi=maxs.length?Math.max(...maxs):lo,a=r1.length?Math.min(...r1):meta[0],b=r2.length?Math.max(...r2):meta[1];
    Object.assign(e,{personalPlanRevision:REV,repMin:lo,repMax:hi,targetRpeMin:a,targetRpeMax:b,targetRirMin:Math.max(0,10-b),targetRirMax:Math.max(0,10-a),rpe:Math.round(((a+b)/2)*2)/2,tempo:g.entries?.[0]?.targetTempo||e.tempo});
    const extra=`Цель: ${range(lo,hi)} повт. · RPE ${range(a,b)} · RIR ${range(Math.max(0,10-b),Math.max(0,10-a))} · темп ${e.tempo||'–'}`;
    e.note=[e.note,extra].filter(Boolean).join(' · ');
    return e
  }

  function build(){
    const routines=A(W.UNVRSL_ROUTINES),weeks=[];
    for(let w=1;w<=8;w++){
      const meta=META[w],days=routines.filter(r=>Number(r.w)===w).map(r=>({id:makeId('day'),name:`${r.c} · ${r.t}`,ex:groupIndexedEntries(routineEntries(r)).map(g=>enrich(r,g,builtInGroupToProgramExercise(r,g)))}));
      weeks.push({n:w,rpeMin:meta[0],rpeMax:meta[1],rirMin:Math.max(0,10-meta[1]),rirMax:Math.max(0,10-meta[0]),focus:meta[2],loadProfileManual:true,days})
    }
    return{id:makeId('prog'),systemKey:KEY,name:NAME,description:'Персональный 8-недельный цикл: подходы, повторы, RPE/RIR, темп, отдых и методы.',personalPlanRevision:REV,created:Date.now(),updated:Date.now(),weeks}
  }

  function install(){
    const s=state();
    if(!s||!A(W.UNVRSL_ROUTINES).length||typeof groupIndexedEntries!=='function'||typeof routineEntries!=='function'||typeof builtInGroupToProgramExercise!=='function')return false;
    if(!Array.isArray(s.programs))s.programs=[];
    const old=personal();
    if(old?.personalPlanRevision===REV)return true;
    const p=build();
    if(old){p.id=old.id;p.created=old.created||p.created;s.programs[s.programs.indexOf(old)]=p}else s.programs.push(p);
    saveState();
    try{if(D.getElementById('plan')?.classList.contains('active')&&typeof planPage==='function')planPage()}catch(_){ }
    return true
  }

  function weekFor(p){
    const s=state(),saved=Number(s?.primaryProgramWeeks?.[p.id]),fallback=Number(s?.week)||1;
    return Math.max(1,Math.min(p.weeks?.length||1,Number.isFinite(saved)&&saved>0?saved:fallback))
  }

  function openLocalEditor(p){
    if(!p)return false;
    if(!editable(p)){W.toast?.('Эту программу может редактировать только тренер');return false}
    const w=weekFor(p);
    try{if(typeof openProgramEditor==='function'){openProgramEditor(p.id,w-1,0);return true}}catch(_){ }
    try{if(typeof W.openProgramEditor==='function'){W.openProgramEditor(p.id,w-1,0);return true}}catch(_){ }
    W.toast?.('Редактор программы не загрузился');return false
  }

  function buildEditableBuiltin(){
    const s=state();if(!s)return null;
    if(!Array.isArray(s.programs))s.programs=[];
    let p=s.programs.find(x=>x?.systemKey===BUILTIN_COPY_KEY);
    if(p)return p;
    if(!A(W.UNVRSL_ROUTINES).length||typeof groupIndexedEntries!=='function'||typeof routineEntries!=='function'||typeof builtInGroupToProgramExercise!=='function')return null;
    const weeks=[];
    for(let w=1;w<=8;w++){
      const days=A(W.UNVRSL_ROUTINES).filter(r=>Number(r.w)===w).map(r=>({id:makeId('day'),name:`${r.c} · ${r.t}`,ex:groupIndexedEntries(routineEntries(r)).map(g=>builtInGroupToProgramExercise(r,g))}));
      weeks.push({n:w,days})
    }
    let base='Встроенный цикл · 8 недель';
    try{base=String(W.unvrslBuiltInProgramName?.()||base)}catch(_){ }
    p={id:makeId('prog'),systemKey:BUILTIN_COPY_KEY,name:`${base} — редактируемая`,description:'Редактируемая версия встроенной программы.',editRevision:EDIT_REV,created:Date.now(),updated:Date.now(),weeks};
    s.programs.push(p);saveState();W.toast?.('Создана редактируемая версия встроенной программы');return p
  }

  async function importCloudProgram(planId){
    let p=localByAnyId(planId);if(p)return p;
    if(!trainerMode()||!W.cloud?.client||!W.cloud?.user)return null;
    try{
      const q=await W.cloud.client.from('plans').select('id,title,version,snapshot,trainer_id,is_active').eq('id',planId).maybeSingle();
      if(q.error||!q.data?.snapshot?.program)return null;
      p=JSON.parse(JSON.stringify(q.data.snapshot.program));
      p.id=makeId('prog');p.name=p.name||q.data.title||'Программа';p.cloudPlanId=q.data.id;p.cloudVersion=q.data.version||1;p.trainerId=q.data.trainer_id||W.cloud.user.id;p.created=Date.now();p.updated=Date.now();
      try{if(typeof ensureProgramShape==='function')ensureProgramShape(p)}catch(_){ }
      A(p.weeks).forEach(w=>A(w.days).forEach(d=>d.id=makeId('day')));
      const s=state();if(!Array.isArray(s.programs))s.programs=[];s.programs.push(p);saveState();return p
    }catch(_){return null}
  }

  W.editAnyProgramV370=async function(id){
    const s=state();if(!s)return;
    id=String(id||'');
    if(!id||id===BUILTIN){
      const p=buildEditableBuiltin();if(!p){W.toast?.('Программа пока не готова к редактированию');return}
      if(!s.primaryProgramWeeks||typeof s.primaryProgramWeeks!=='object')s.primaryProgramWeeks={};
      const w=Math.max(1,Math.min(p.weeks?.length||8,Number(s.week)||1));
      s.primaryProgramId=p.id;s.startProgramId=p.id;s.primaryProgramWeeks[p.id]=w;saveState();openLocalEditor(p);return
    }
    let p=localByAnyId(id);
    if(!p)p=await importCloudProgram(id);
    if(!p){W.toast?.('Программа не найдена');return}
    openLocalEditor(p)
  };

  W.editPersonal8WeekV369=()=>W.editAnyProgramV370(personal()?.id||'');
  W.editPersonal8WeekV367=W.editPersonal8WeekV369;

  function button(label,handler,mark){
    const b=D.createElement('button');b.className='btn tiny';b.type='button';b.textContent=label;if(mark)b.dataset[mark]='1';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();handler()});return b
  }

  function decoratePrimary(){
    const root=D.getElementById('plan');if(!root)return;
    const head=root.querySelector('.primary-plan-head .row');if(!head)return;
    head.querySelectorAll('[data-personal-8week-edit]').forEach(x=>x.remove());
    if(head.querySelector('[data-any-program-edit]'))return;
    const id=String(state()?.primaryProgramId||BUILTIN),p=id===BUILTIN?null:localByAnyId(id);
    if(p&&!editable(p))return;
    const b=button('Редактировать',()=>W.editAnyProgramV370(id),'anyProgramEdit');
    const badge=head.querySelector('.chip.green');if(badge)head.insertBefore(b,badge);else head.appendChild(b)
  }

  function decorateLocalCards(){
    const root=D.getElementById('plan');if(!root)return;
    root.querySelectorAll('.coach-program').forEach(card=>{
      const buttons=[...card.querySelectorAll('button')];
      const open=buttons.find(b=>/^Открыть$/i.test(String(b.textContent||'').trim()));
      if(open)open.textContent='Редактировать'
    })
  }

  function cloudPlanIdFromRow(row){
    for(const el of row.querySelectorAll('[onclick]')){
      const code=String(el.getAttribute('onclick')||''),m=code.match(/trainer(?:NewInvite|PlanClientsSheet|ArchiveCloudPlan)\('([^']+)'/);
      if(m?.[1])return m[1]
    }
    return''
  }

  function decorateCloudRows(){
    D.querySelectorAll('.trainer-plan-row').forEach(row=>{
      const actions=row.querySelector('.trainer-plan-actions');if(!actions||actions.querySelector('[data-any-program-edit]'))return;
      const id=cloudPlanIdFromRow(row);if(!id)return;
      const b=button('Редактировать',()=>W.editAnyProgramV370(id),'anyProgramEdit');actions.insertBefore(b,actions.firstChild)
    })
  }

  function decorateBuiltinViewer(){
    const sh=D.getElementById('sheet');if(!sh||sh.querySelector('[data-builtin-edit-any]'))return;
    const h=sh.querySelector('h2');if(!h)return;
    let name='Встроенный цикл · 8 недель';try{name=String(W.unvrslBuiltInProgramName?.()||name)}catch(_){ }
    if(String(h.textContent||'').trim()!==name)return;
    const top=h.closest('.row');if(!top)return;
    const b=button('Редактировать',()=>W.editAnyProgramV370(BUILTIN),'builtinEditAny');top.insertBefore(b,top.lastElementChild)
  }

  let queued=false;
  function decorate(){decoratePrimary();decorateLocalCards();decorateCloudRows();decorateBuiltinViewer()}
  function queueDecorate(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})}
  const mo=typeof MutationObserver==='function'?new MutationObserver(queueDecorate):null;
  mo?.observe(D.documentElement,{childList:true,subtree:true});

  [0,150,500,1200,2500,5000].forEach(ms=>setTimeout(()=>{install();decorate()},ms));
  W.addEventListener?.('load',()=>{install();decorate()},{once:true});
  W.addEventListener?.('unvrsl:modules-ready',()=>{install();decorate()},{passive:true});
  W.addEventListener?.('unvrsl:app-ready',queueDecorate,{passive:true});
})();
