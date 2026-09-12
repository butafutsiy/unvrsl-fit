'use strict';
(()=>{
  const W=window,D=document,REV=369,KEY='semen-8week-v2',NAME='Мой план · 8 недель v2';
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
    return Math.max(1,Math.min(p.weeks?.length||8,Number.isFinite(saved)&&saved>0?saved:fallback))
  }

  function edit(){
    const s=state();if(!s)return;
    let p=personal();
    if(!p){install();p=personal()}
    if(!p){W.toast?.('План пока не готов к редактированию');return}
    if(!s.primaryProgramWeeks||typeof s.primaryProgramWeeks!=='object')s.primaryProgramWeeks={};
    const w=weekFor(p);
    s.primaryProgramId=p.id;
    s.startProgramId=p.id;
    s.primaryProgramWeeks[p.id]=w;
    saveState();
    try{if(typeof openProgramEditor==='function'){openProgramEditor(p.id,w-1,0);return}}catch(_){ }
    W.toast?.('Редактор программы не загрузился')
  }
  W.editPersonal8WeekV369=edit;
  W.editPersonal8WeekV367=edit;

  function decorate(){
    const root=D.getElementById('plan');if(!root)return;
    const head=root.querySelector('.primary-plan-head .row');if(!head||head.querySelector('[data-personal-8week-edit]'))return;
    const btn=D.createElement('button');
    btn.className='btn tiny';
    btn.type='button';
    btn.dataset.personal8weekEdit='1';
    btn.textContent='Редактировать';
    btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();edit()});
    const badge=head.querySelector('.chip.green');
    if(badge)head.insertBefore(btn,badge);else head.appendChild(btn)
  }

  let queued=false;
  function queueDecorate(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})}
  const mo=typeof MutationObserver==='function'?new MutationObserver(queueDecorate):null;
  mo?.observe(D.documentElement,{childList:true,subtree:true});

  [0,150,500,1200,2500,5000].forEach(ms=>setTimeout(()=>{install();decorate()},ms));
  W.addEventListener?.('load',()=>{install();decorate()},{once:true});
  W.addEventListener?.('unvrsl:modules-ready',()=>{install();decorate()},{passive:true});
  W.addEventListener?.('unvrsl:app-ready',queueDecorate,{passive:true});
})();
