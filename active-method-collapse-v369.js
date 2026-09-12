'use strict';
(()=>{
  const W=window,D=document,REV=369;
  if(W.__unvrslActiveMethodCollapseV369)return;
  W.__unvrslActiveMethodCollapseV369=true;

  const N=v=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:0};
  const methodOf=name=>/\bUNVRSL\b/i.test(String(name||''))?'UNVRSL':/\bSLDR\b/i.test(String(name||''))?'SLDR':'';
  const baseOf=name=>String(name||'').replace(/\s+—\s+(?:UNVRSL|SLDR)\b.*$/i,'').trim();
  const state=()=>{try{if(typeof st!=='undefined'){W.st=st;return st}}catch(_){ }return W.st||null};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){ }};
  const isBuiltIn=cur=>!!cur&&!cur.programId&&!cur.planId&&!cur.programName&&N(cur.w)>=1&&N(cur.w)<=8&&!!cur.c;
  const routine=cur=>{
    try{if(typeof rmap!=='undefined'&&rmap?.get){const hit=rmap.get(`${cur.w}-${cur.c}`);if(hit)return hit}}catch(_){ }
    return (W.UNVRSL_ROUTINES||[]).find(x=>N(x?.w)===N(cur?.w)&&String(x?.c||'')===String(cur?.c||''))||null
  };
  const sourceEntries=r=>{try{return typeof routineEntries==='function'?routineEntries(r):(r?.e||[])}catch(_){return r?.e||[]}};

  function planRest(r,e,index,list){
    try{if(typeof rest==='function')return Math.max(0,N(rest(r,e,index,list)))}catch(_){ }
    const type=methodOf(e?.n);
    if(type==='UNVRSL'){
      if(/тяж/i.test(e?.n||''))return 30;
      if(/л[её]г/i.test(e?.n||''))return /3\/3/i.test(e?.n||'')?120:120;
      return 120
    }
    if(type==='SLDR')return /3\/3\s*$/i.test(e?.n||'')?90:15;
    return 90
  }

  function groupsFor(r){
    const list=sourceEntries(r),out=[],map=new Map();
    list.forEach((e,index)=>{
      const method=methodOf(e?.n||e?.method);if(!method)return;
      const base=baseOf(e?.n),key=`${method}|${base}`;
      if(!map.has(key)){
        const g={method,base,rows:[],firstIndex:index};
        map.set(key,g);out.push(g)
      }
      const count=Math.max(1,N(e?.s)||1);
      for(let k=0;k<count;k++)map.get(key).rows.push({
        w:N(e?.w),r:N(e?.r),bw:!!e?.bw,
        rest:planRest(r,e,index,list),source:e,sourceIndex:index
      })
    });
    return out.sort((a,b)=>a.firstIndex-b.firstIndex)
  }

  function expectedCount(g){return g.method==='UNVRSL'?8:g.method==='SLDR'?9:g.rows.length}
  function canonicalRows(g){
    let rows=g.rows.slice();
    if(g.method==='UNVRSL'){
      // Built-in UNVRSL is normally heavy/light x3 + 2 medium sets.
      // If a legacy/compressed source only exposes heavy/light + finish, expand it here.
      if(rows.length===3){rows=[rows[0],rows[1],rows[0],rows[1],rows[0],rows[1],rows[2],rows[2]].map(x=>({...x}))}
      else if(rows.length===4&&rows[2].r===rows[3].r){rows=[rows[0],rows[1],rows[0],rows[1],rows[0],rows[1],rows[2],rows[3]].map(x=>({...x}))}
      if(rows.length>8)rows=rows.slice(0,8)
    }
    if(g.method==='SLDR'&&rows.length>9)rows=rows.slice(0,9);
    return rows
  }

  const userTouched=set=>!!(set?.ok||set?.manualOverride||set?.manualFields?.w||set?.manualFields?.r||set?.__repManualV272||set?.__repManualV283||set?.__repManualV287||set?.rpe!==''&&set?.rpe!=null||set?.rir!==''&&set?.rir!=null);

  function existingActualRows(matches){
    const all=[];
    matches.forEach(ex=>(ex?.set||[]).forEach(set=>{
      if(userTouched(set))all.push(set)
    }));
    return all
  }

  function clonePlannedSet(row,index,g){
    let label='';
    if(g.method==='UNVRSL')label=index<6?(index%2===0?'Тяж':'Лег'):'Сред';
    else if(g.method==='SLDR')label=`${Math.floor(index/3)+1}.${index%3+1}`;
    return {
      n:index+1,
      w:row.w||0,r:row.r||0,rpe:'',rir:'',ok:false,
      plannedW:row.w||0,programW:row.w||0,baselineW:row.w||0,
      rest:row.rest||0,methodRest:row.rest||0,
      phaseLabel:label,label,
      role:g.method==='UNVRSL'?(index<6?(index%2===0?'unvrsl-heavy':'unvrsl-light'):'unvrsl-middle'):'sldr-mini',
      method:g.method
    }
  }

  function mergeProgress(planned,actual){
    const used=new Set();
    return planned.map((p,pi)=>{
      let ai=actual.findIndex((a,i)=>!used.has(i)&&N(a?.w)===N(p.w)&&N(a?.r)===N(p.r));
      if(ai<0&&pi<actual.length&&!used.has(pi))ai=pi;
      if(ai<0)return p;
      used.add(ai);const a=actual[ai];
      if(!userTouched(a))return p;
      return {...p,...a,n:pi+1,rest:p.rest,methodRest:p.methodRest,phaseLabel:p.phaseLabel,label:p.label,role:p.role,method:p.method,
        plannedW:p.plannedW,programW:p.programW,baselineW:p.baselineW}
    })
  }

  function canonicalExercise(g,matches){
    const source=canonicalRows(g),actual=existingActualRows(matches),template={...(matches[0]||{})};
    const planned=source.map((row,i)=>clonePlannedSet(row,i,g));
    const sets=mergeProgress(planned,actual);
    const fullRest=Math.max(0,...source.map(x=>N(x.rest)).filter(x=>g.method==='UNVRSL'?x!==30:x!==15));
    const sourceId=matches.map(x=>x?.sourceId).find(Boolean)||null;
    const equipment=matches.map(x=>x?.equipment).find(Boolean)||template.equipment;
    return {
      ...template,
      n:`${g.base} — ${g.method}`,
      method:g.method,
      sourceId,
      equipment,
      g:`method-${g.method.toLowerCase()}-${g.base}`,
      rest:fullRest||(g.method==='UNVRSL'?120:90),
      innerRest:g.method==='UNVRSL'?30:15,
      d:g.method==='UNVRSL'
        ?'UNVRSL · 3 раунда: тяжёлый ×3 → 30 сек → лёгкий ×9 · обычный отдых между раундами · затем 2×6 со средним весом'
        :'SLDR · 3 полноценных рабочих подхода · 15 сек между мини-подходами · обычный отдых после каждого третьего мини-подхода',
      set:sets,
      methodCollapsedRevision:REV,
      weightDecision:template.weightDecision||'program',
      programWeightMode:template.programWeightMode||'prescribed'
    }
  }

  function canonicalize(cur=state()?.current){
    if(!isBuiltIn(cur)||!Array.isArray(cur.ex))return false;
    const r=routine(cur);if(!r)return false;
    const groups=groupsFor(r).filter(g=>canonicalRows(g).length===expectedCount(g));
    if(!groups.length)return false;
    let changed=false,newList=cur.ex.slice();

    groups.forEach(g=>{
      const indices=[];
      newList.forEach((ex,i)=>{if(methodOf(ex?.n||ex?.method)===g.method&&baseOf(ex?.n)===g.base)indices.push(i)});
      if(!indices.length)return;
      const matches=indices.map(i=>newList[i]).filter(Boolean);
      const already=indices.length===1&&matches[0]?.methodCollapsedRevision===REV&&matches[0]?.set?.length===expectedCount(g);
      if(already)return;
      const merged=canonicalExercise(g,matches),first=indices[0],remove=new Set(indices.slice(1));
      newList=newList.filter((_,i)=>!remove.has(i));
      const adjustedFirst=first-indices.slice(1).filter(i=>i<first).length;
      newList[adjustedFirst]=merged;changed=true
    });

    if(changed){
      cur.ex=newList;cur.methodCollapseRevision=REV;cur.methodCollapseAt=new Date().toISOString();
      saveState()
    }
    return changed
  }

  function setSpecificRest(ei,si){
    const cur=state()?.current,e=cur?.ex?.[ei],set=e?.set?.[si];
    if(!e||!set||!['UNVRSL','SLDR'].includes(String(e.method||'')))return 0;
    return Math.max(0,N(set.methodRest??set.rest))
  }

  function installStart(){
    const cur=W.startPage;
    if(typeof cur!=='function'||cur.__activeMethodCollapseV369)return false;
    const wrapped=function(){canonicalize();return cur.apply(this,arguments)};
    wrapped.__activeMethodCollapseV369=true;wrapped.__activeMethodCollapseBase=cur;
    W.startPage=wrapped;try{startPage=wrapped}catch(_){ }return true
  }

  function installBegin(){
    const cur=W.begin;
    if(typeof cur!=='function'||cur.__activeMethodCollapseV369)return false;
    const wrapped=function(){
      const out=cur.apply(this,arguments);
      const run=()=>{if(canonicalize())try{W.startPage?.()}catch(_){ }};
      run();queueMicrotask(run);setTimeout(run,60);return out
    };
    wrapped.__activeMethodCollapseV369=true;wrapped.__activeMethodCollapseBase=cur;
    W.begin=wrapped;try{begin=wrapped}catch(_){ }return true
  }

  function installToggle(){
    const cur=W.toggleSet;
    if(typeof cur!=='function'||cur.__activeMethodCollapseV369)return false;
    const wrapped=function(ei,si){
      canonicalize();
      const before=!!state()?.current?.ex?.[ei]?.set?.[si]?.ok;
      const out=cur.apply(this,arguments);
      const after=!!state()?.current?.ex?.[ei]?.set?.[si]?.ok;
      if(!before&&after){const sec=setSpecificRest(ei,si);if(sec>0)try{W.timer?.(sec,sec<=30?'Отдых внутри метода':'Отдых между рабочими подходами')}catch(_){ }}
      return out
    };
    wrapped.__activeMethodCollapseV369=true;wrapped.__activeMethodCollapseBase=cur;
    W.toggleSet=wrapped;try{toggleSet=wrapped}catch(_){ }return true
  }

  function install(){installStart();installBegin();installToggle();const changed=canonicalize();if(changed&&D.getElementById('start')?.classList.contains('active'))try{W.startPage?.()}catch(_){ }return changed}
  [0,60,180,500,1200,2500,5000].forEach(ms=>setTimeout(install,ms));
  ['unvrsl:app-ready','unvrsl:modules-ready','unvrsl:training-engine-ready'].forEach(ev=>W.addEventListener?.(ev,install,{passive:true}));
  D.addEventListener?.('visibilitychange',()=>{if(!D.hidden)install()},{passive:true});
})();
