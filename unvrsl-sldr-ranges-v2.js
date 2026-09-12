'use strict';
(()=>{
  if(window.__unvrslSldrRangesV2)return;
  window.__unvrslSldrRangesV2=true;

  const W=window,D=document,PID='prog-unvrsl-sldr',SEED='unvrsl-sldr-program-v1';
  const PROFILE={
    1:{rpe:[7,8],rir:[2,3]},
    2:{rpe:[7.5,8],rir:[2,2]},
    3:{rpe:[8,9],rir:[1,2]},
    4:{rpe:[6,7],rir:[3,4]},
    5:{rpe:[8,9],rir:[1,2]},
    6:{rpe:[7,8],rir:[2,3]},
    7:{rpe:[8.5,9.5],rir:[0.5,1.5]},
    8:{rpe:[9,10],rir:[0,1]}
  };

  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};
  const escHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>Number(v).toFixed(1).replace('.0','').replace('.',',');
  const band=a=>Array.isArray(a)?(Number(a[0])===Number(a[1])?fmt(a[0]):`${fmt(a[0])}–${fmt(a[1])}`):'–';
  const clean=t=>String(t||'').trim().replace(/^[✅☑️💧🔥]\s*/,'');
  const isTargetProgram=p=>!!p&&(String(p.id||'')===PID||String(p.seedKey||'')===SEED||String(p.name||'').trim()==='UNVRSL SLDR');
  const program=()=>{const s=state();return (Array.isArray(s?.programs)?s.programs:[]).find(isTargetProgram)||null};

  function repRange(e){
    const t=String(e?.prescription||'');
    const m=t.match(/(?:^|\s)(\d+)×(\d+)(?:[–-](\d+))?/);
    if(!m)return null;
    const lo=Number(m[2]),hi=Number(m[3]||m[2]);
    if(!Number.isFinite(lo)||!Number.isFinite(hi))return null;
    return {sets:Number(m[1])||e?.sets?.length||1,min:Math.min(lo,hi),max:Math.max(lo,hi)};
  }

  function setIf(o,k,v){
    if(!o||o[k]===v)return false;
    o[k]=v;return true;
  }

  function enrichProgram(){
    const p=program();if(!p)return false;
    let changed=false;
    (p.weeks||[]).forEach((w,wi)=>{
      const prof=PROFILE[wi+1];if(!prof)return;
      changed=setIf(w,'rpeMin',prof.rpe[0])||changed;
      changed=setIf(w,'rpeMax',prof.rpe[1])||changed;
      changed=setIf(w,'rirMin',prof.rir[0])||changed;
      changed=setIf(w,'rirMax',prof.rir[1])||changed;
      changed=setIf(w,'loadProfileManual',true)||changed;
      changed=setIf(w,'unvrslSldrRangeRevision',2)||changed;
      (w.days||[]).forEach(d=>(d.ex||[]).forEach(e=>{
        changed=setIf(e,'rpeMin',prof.rpe[0])||changed;
        changed=setIf(e,'rpeMax',prof.rpe[1])||changed;
        changed=setIf(e,'rirMin',prof.rir[0])||changed;
        changed=setIf(e,'rirMax',prof.rir[1])||changed;
        const rr=repRange(e);if(!rr)return;
        changed=setIf(e,'repMin',rr.min)||changed;
        changed=setIf(e,'repMax',rr.max)||changed;
        changed=setIf(e,'repRange',rr.min===rr.max?String(rr.min):`${rr.min}–${rr.max}`)||changed;
        if(e.method==='STANDARD'||e.method==='FST-7'){
          (e.sets||[]).forEach(s=>{
            changed=setIf(s,'rMin',rr.min)||changed;
            changed=setIf(s,'rMax',rr.max)||changed;
            changed=setIf(s,'targetRepMin',rr.min)||changed;
            changed=setIf(s,'targetRepMax',rr.max)||changed;
          });
        }
      }));
    });
    if(changed){p.updated=Date.now();saveState()}
    return true;
  }

  function prescription(e){
    const raw=clean(e?.prescription);
    if(/\bмин\b/i.test(raw)&&!/×\d/.test(raw))return raw;
    if(e?.method&&e.method!=='STANDARD')return raw||'';
    const rr=repRange(e),first=e?.sets?.[0]||{};
    if(rr){
      const reps=rr.min===rr.max?String(rr.min):`${rr.min}–${rr.max}`;
      const weight=Number(first.w)||0;
      return `${rr.sets}×${reps}${weight?` · ${fmt(weight)} кг`:''}`;
    }
    return raw||'';
  }

  function renderPreview(pid,wi,di){
    enrichProgram();
    const p=program(),d=p?.weeks?.[Number(wi)]?.days?.[Number(di)];if(!p||!d)return;
    const prof=PROFILE[Number(wi)+1]||PROFILE[1],rpe=`RPE ${band(prof.rpe)}`,rir=`RIR ${band(prof.rir)}`;
    const rows=(d.ex||[]).map(e=>{
      const bits=[prescription(e),rpe,rir];
      if(e?.tempo)bits.push(`темп ${e.tempo}`);
      if(Number(e?.rest)>0)bits.push(`отдых ${e.rest} сек`);
      return `<div class="program-ex"><b>${escHtml(e?.n||'Упражнение')}</b><div class="muted small">${escHtml(bits.filter(Boolean).join(' · '))}</div></div>`;
    }).join('');
    const html=`<div class="sheet-grabber"></div><div class="row between"><div><h2>${escHtml(d.name||'Тренировка')}</h2><div class="muted">${escHtml(p.name||'UNVRSL SLDR')} · W${Number(wi)+1} · ${rpe} · ${rir}</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div>${rows||'<div class="card muted">Упражнения не добавлены.</div>'}<button class="btn primary full" style="margin-top:16px" onclick="unvrslSldrStartV2('${String(p.id).replace(/'/g,"\\'")}',${Number(wi)},${Number(di)})">Старт</button>`;
    try{return typeof modal==='function'?modal(html):W.modal?.(html)}catch(_){return undefined}
  }

  function annotateStarted(pid,wi,di){
    const s=state(),cur=s?.current,p=program(),d=p?.weeks?.[Number(wi)]?.days?.[Number(di)],prof=PROFILE[Number(wi)+1];
    if(!cur||!p||!d||!prof||String(cur.programId||'')!==String(pid))return;
    cur.programWeekNumber=Number(wi)+1;
    cur.programWeekRpeMin=prof.rpe[0];cur.programWeekRpeMax=prof.rpe[1];
    cur.targetRpeMin=prof.rpe[0];cur.targetRpeMax=prof.rpe[1];
    cur.targetRirMin=prof.rir[0];cur.targetRirMax=prof.rir[1];
    cur.targetRpeLabel=band(prof.rpe);cur.targetRirLabel=band(prof.rir);
    let cursor=0;
    (d.ex||[]).forEach(b=>{
      const rr=repRange(b),method=String(b?.method||'STANDARD');
      let count=1;
      if(method==='SLDR')count=9;
      else if(method==='UNVRSL')count=8;
      else if(method==='DS')count=Math.max(1,b?.sets?.length||1);
      for(let j=0;j<count;j++){
        const ex=cur.ex?.[cursor+j];if(!ex)continue;
        ex.targetRpeMin=prof.rpe[0];ex.targetRpeMax=prof.rpe[1];
        ex.targetRirMin=prof.rir[0];ex.targetRirMax=prof.rir[1];
        (ex.set||[]).forEach(set=>{
          set.targetRpeMin=prof.rpe[0];set.targetRpeMax=prof.rpe[1];
          set.targetRirMin=prof.rir[0];set.targetRirMax=prof.rir[1];
          if(rr&&(method==='STANDARD'||method==='FST-7')){set.targetRepMin=rr.min;set.targetRepMax=rr.max}
        });
      }
      cursor+=count;
    });
    saveState();
    try{typeof startPage==='function'&&startPage()}catch(_){ }
  }

  W.unvrslSldrStartV2=function(pid,wi,di){
    enrichProgram();
    let fn=null;try{fn=typeof beginProgramDay==='function'?beginProgramDay:W.beginProgramDay}catch(_){fn=W.beginProgramDay}
    if(typeof fn!=='function')return;
    const out=fn(pid,wi,di);annotateStarted(pid,wi,di);return out
  };

  function patchPreview(){
    let cur=null;try{cur=typeof previewPrimaryProgramDay==='function'?previewPrimaryProgramDay:W.previewPrimaryProgramDay}catch(_){cur=W.previewPrimaryProgramDay}
    if(typeof cur!=='function'||cur.__unvrslSldrRangesV2)return false;
    const wrapped=function(pid,wi,di){
      const s=state(),p=(Array.isArray(s?.programs)?s.programs:[]).find(x=>String(x?.id||'')===String(pid));
      if(isTargetProgram(p))return renderPreview(pid,wi,di);
      return cur.apply(this,arguments)
    };
    wrapped.__unvrslSldrRangesV2=true;wrapped.__base=cur;
    W.previewPrimaryProgramDay=wrapped;try{previewPrimaryProgramDay=wrapped}catch(_){ }
    return true
  }

  function install(){enrichProgram();patchPreview()}
  D?.addEventListener('click',()=>{enrichProgram();patchPreview()},{capture:true,passive:true});
  ['unvrsl:app-ready','unvrsl:modules-ready','unvrsl:cloud-ready'].forEach(ev=>W.addEventListener?.(ev,install,{passive:true}));
  [0,700,1800,4000].forEach(ms=>setTimeout(install,ms));
})();