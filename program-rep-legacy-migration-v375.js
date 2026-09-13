'use strict';
(()=>{
  const W=window,D=document,REV=375;
  if(W.__unvrslRepLegacyMigrationV375)return;W.__unvrslRepLegacyMigrationV375=true;
  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>Number(v)===Number(b[i]));
  const label=(a,b,arrow=false)=>Number(a)===Number(b)?String(a):`${a}${arrow?'→':'–'}${b}`;
  const PRE=[{h:65,b:[12,15],i:[15,20]},{h:70,b:[10,12],i:[12,15]},{h:75,b:[8,10],i:[12,15]},{h:80,b:[6,8],i:[10,12]},{h:85,b:[5,7],i:[8,12]},{h:88,b:[4,6],i:[8,10]},{h:90,b:[3,5],i:[6,10]},{h:95,b:[2,4],i:[6,8]},{h:101,b:[1,3],i:[4,6]}];
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const saveState=()=>{try{typeof save==='function'?save():W.save?.()}catch(_){}};
  const kind=e=>{const k=String(e?.kind||'');if(k==='compound'||k==='isolation')return k;return /(разгиб|сгиб|мах|развед|свед|бицеп|трицеп|кроссов|икр|дельт|канат|отвед|привед)/i.test(e?.n||'')?'isolation':'compound'};
  function range(p,wi,e){const w=p?.weeks?.[wi];if(!w)return[8,10];const k=kind(e),direct=k==='isolation'?[N(w.isolationRepMin),N(w.isolationRepMax)]:[N(w.baseRepMin),N(w.baseRepMax)];if(direct[0]!=null&&direct[1]!=null)return[Math.min(...direct),Math.max(...direct)];let lo=N(w.intensityMin??w.weekIntensityMin??w.intensity?.min),hi=N(w.intensityMax??w.weekIntensityMax??w.intensity?.max);if(lo!=null&&lo<=1)lo*=100;if(hi!=null&&hi<=1)hi*=100;const mid=lo!=null&&hi!=null?(lo+hi)/2:72.5,x=PRE.find(x=>mid<=x.h)||PRE.at(-1);return(k==='isolation'?x.i:x.b).slice()}
  const dsAuto=r=>{const end=Math.max(8,Math.min(12,Math.round(r[1])));return[Math.max(12,Math.min(15,end+5)),end]};
  const sldrAuto=r=>r[1]>=12?[15,12,10]:r[1]>=10?[12,10,8]:[10,8,6];
  const dsSteps=(a,b,n=5)=>Array.from({length:n},(_,i)=>Math.round(a+(b-a)*(i/Math.max(1,n-1))));
  function existingRange(e){const s=e?.sets?.[0]||{},a=N(e?.repMin??s.rMin??s.targetRepMin??s.r),b=N(e?.repMax??s.rMax??s.targetRepMax??e?.repMin??s.r);return a!=null&&b!=null?[Math.min(a,b),Math.max(a,b)]:null}
  function existingSldr(e){if(Array.isArray(e?.repPattern)&&e.repPattern.length>=3)return e.repPattern.slice(0,3).map(Number);const s=(e?.sets||[]).slice(0,3).map(x=>N(x.r)).filter(x=>x!=null);return s.length===3?s:null}
  function existingDs(e){let a=N(e?.dsRepStart),b=N(e?.dsRepEnd);if(a!=null&&b!=null)return[a,b];const s=(e?.sets||[]).map(x=>N(x.r)).filter(x=>x!=null);return s.length>1?[s[0],s.at(-1)]:null}
  function migrate(){const s=state();if(!s||s.__repLegacyMigrationV375===REV)return false;let changed=false;
    (s.programs||[]).forEach(p=>(p.weeks||[]).forEach((w,wi)=>(w.days||[]).forEach(d=>(d.ex||[]).forEach(e=>{
      const m=String(e?.method||'STANDARD').toUpperCase(),r=range(p,wi,e);
      if(m==='STANDARD'||m==='FST-7'){
        if(!e.repMode){const old=existingRange(e);e.repMode=old&&!same(old,r)?'manual':'auto';changed=true}
        if(e.repMode==='auto'){e.repMin=r[0];e.repMax=r[1];(e.sets||[]).forEach(x=>{x.r=r[0];x.rMin=x.targetRepMin=r[0];x.rMax=x.targetRepMax=r[1];x.targetRepLabel=label(...r)});changed=true}
      }else if(m==='DS'){
        const auto=dsAuto(r),old=existingDs(e)||auto;let pair=old;
        if(Number(pair[0])===15&&Number(pair[1])<10)pair=[15,10];
        if(!e.repMode)e.repMode=same(pair,auto)?'auto':'manual';
        if(e.repMode==='auto')pair=auto;
        e.dsRepStart=pair[0];e.dsRepEnd=pair[1];e.repMin=Math.min(...pair);e.repMax=Math.max(...pair);
        const steps=dsSteps(pair[0],pair[1],e.sets?.length||5);(e.sets||[]).forEach((x,i)=>{const q=steps[i];x.r=x.rMin=x.rMax=x.targetRepMin=x.targetRepMax=q;x.targetRepLabel=String(q)});changed=true
      }else if(m==='SLDR'){
        const auto=sldrAuto(r),old=existingSldr(e)||auto,pat=old.slice(0,3);
        if(!e.repMode)e.repMode=same(pat,auto)?'auto':'manual';
        const out=e.repMode==='auto'?auto:pat;
        if((e.sets||[]).length!==3)e.sets=(e.sets||[]).slice(0,3);
        while(e.sets.length<3)e.sets.push({w:e.sets[0]?.w||0,tempo:e.tempo||'',rest:15});
        e.repPattern=out.slice();e.sldrPattern=out.join('/');e.sldrRounds=1;e.miniSets=3;e.innerRest=15;
        e.sets.forEach((x,i)=>{const q=out[i];x.label=`SLDR${i+1}`;x.role='sldr-mini';x.round=1;x.mini=i+1;x.r=x.rMin=x.rMax=x.targetRepMin=x.targetRepMax=q;x.targetRepLabel=String(q);x.rest=i<2?15:e.rest});changed=true
      }else if(m==='UNVRSL'&&!e.repMode){e.repMode='method';changed=true}
      e.repMigrationRevision=REV
    }))));
    s.__repLegacyMigrationV375=REV;if(changed&&s.current?.programId)s.current.repPolicyRevision=0;saveState();return changed
  }
  function currentProgram(){try{const u=typeof programUi!=='undefined'?programUi:null;return u?.pid&&typeof programById==='function'?{p:programById(u.pid),wi:Number(u.week)||0}:null}catch(_){return null}}
  function installSummary(){let f=W.prescriptionText;try{if(typeof prescriptionText==='function')f=prescriptionText}catch(_){ }if(typeof f!=='function'||f.__legacy375)return false;const base=f;f=function(e){const c=currentProgram(),m=String(e?.method||'STANDARD').toUpperCase();if(c&&e?.repMode==='auto'){
      const r=range(c.p,c.wi,e),sets=e?.sets||[];
      if(m==='STANDARD')return`${sets.length}×${label(...r)} · ${sets[0]?.w||0} кг · RPE ${e.rpe||8}`;
      if(m==='FST-7')return`7×${label(...r)} · ${sets[0]?.w||0} кг · RPE ${e.rpe||8}`;
      if(m==='DS'){const a=dsAuto(r);return`${sets.length||5} ступеней · ${label(a[0],a[1],true)} · ${sets[0]?.w||0} кг · DS`}
      if(m==='SLDR'){const a=sldrAuto(r);return`${a.join('/')} · ${sets[0]?.w||0} кг · SLDR`}
    }return base.apply(this,arguments)};f.__legacy375=true;f.__legacy375Base=base;W.prescriptionText=f;try{prescriptionText=f}catch(_){ }return true}
  function install(){const changed=migrate();if(installSummary()||changed){try{if(typeof renderProgramEditor==='function'&&D.querySelector('#modal.show')&&!D.getElementById('pmMethod'))renderProgramEditor()}catch(_){ }}}
  [0,80,220,500,1000,2000].forEach(ms=>setTimeout(install,ms));W.addEventListener?.('unvrsl:app-ready',install,{passive:true});
})();