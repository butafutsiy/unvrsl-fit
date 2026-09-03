'use strict';
(()=>{
  const W=window,D=document,REV=276;
  if(W.__unvrslRepRangeFinalV276)return;
  W.__unvrslRepRangeFinalV276=true;

  const SPECIAL=/UNVRSL|SLDR|\bDS\b|FST-7/i;
  const finite=v=>Number.isFinite(Number(v));
  const routines=()=>W.UNVRSL_ROUTINES||[];
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const saver=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};
  const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function ensureEngine(){
    if(W.__unvrslBuiltInPlanRepRangesV267||W.__unvrslBuiltInPlanRepRangesAppliedV267)return;
    if(D.getElementById('unvrsl-range-engine-final-v276'))return;
    const s=D.createElement('script');
    s.id='unvrsl-range-engine-final-v276';
    s.src='built-in-plan-rep-ranges-v267.js?v=276';
    s.async=false;
    (D.head||D.documentElement).appendChild(s);
  }

  function routineFor(w,c){return routines().find(r=>Number(r?.w)===Number(w)&&String(r?.c)===String(c))||null}
  function rangeFor(src){
    if(!src||SPECIAL.test(String(src.n||''))||!finite(src.rMin)||!finite(src.rMax))return null;
    let lo=Number(src.rMin),hi=Number(src.rMax);
    if(src.sd){lo/=2;hi/=2}
    if(!finite(lo)||!finite(hi))return null;
    return {lo,hi,label:lo===hi?String(lo):`${lo}–${hi}`};
  }
  function repLabel(src){
    const t=rangeFor(src);
    if(t)return t.label;
    return String(src?.r??src?.m??'—');
  }
  function getRpe(w){try{return typeof RPE!=='undefined'?RPE[w]:8}catch(_){return 8}}
  function getRest(r,e,i){try{return typeof rest==='function'?rest(r,e,i):90}catch(_){return 90}}
  function showModal(html){try{if(typeof modal==='function'){modal(html);return true}}catch(_){ }return false}

  function patchPreview(){
    let cur=null;
    try{cur=typeof preview==='function'?preview:W.preview}catch(_){cur=W.preview}
    if(typeof cur!=='function')return false;
    if(cur.__unvrslRepRangeFinalV276)return true;
    const wrapped=function(w,c){
      const r=routineFor(w,c);
      if(!r)return cur.apply(this,arguments);
      const rpe=getRpe(r.w);
      const html=`<div class="row between"><div><h2>${escapeHtml(r.c)} · ${escapeHtml(r.t)}</h2><div class="muted">W${r.w} · RPE ${rpe}</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div>${(r.e||[]).map((e,i)=>`<div class="listline"><b>${escapeHtml(e.n)}</b><div class="muted small">${e.s||1}×${repLabel(e)}${e.w?` · ${e.w} кг`:''} · отдых ${getRest(r,e,i)} сек</div>${e.d?`<div class="exnote">${escapeHtml(e.d)}</div>`:''}</div>`).join('')}<button class="btn primary full" onclick="begin(${r.w},'${String(r.c).replace(/'/g,"\\'")}')">Начать</button>`;
      if(showModal(html))return;
      return cur.apply(this,arguments);
    };
    wrapped.__unvrslRepRangeFinalV276=true;
    wrapped.__unvrslRepRangeFinalV276Base=cur;
    W.preview=wrapped;
    try{preview=wrapped}catch(_){ }
    return true;
  }

  function patchSession(){
    let cur=null;
    try{cur=typeof session==='function'?session:W.session}catch(_){cur=W.session}
    if(typeof cur!=='function'||cur.__unvrslRepRangeFinalV276)return false;
    const wrapped=function(r){
      const out=cur.apply(this,arguments);
      if(!out?.ex||!r?.e)return out;
      r.e.forEach((src,ei)=>{
        const t=rangeFor(src),ex=out.ex?.[ei];
        if(!t||!ex)return;
        (ex.set||[]).forEach(set=>{
          set.targetRepMin=t.lo;
          set.targetRepMax=t.hi;
          set.r='';
        });
      });
      out.repRangeRevision=REV;
      return out;
    };
    wrapped.__unvrslRepRangeFinalV276=true;
    wrapped.__unvrslRepRangeFinalV276Base=cur;
    W.session=wrapped;
    try{session=wrapped}catch(_){ }
    return true;
  }

  function sourceForSession(s,ei){return routineFor(s?.w,s?.c)?.e?.[Number(ei)]||null}
  function patchExerciseCard(){
    let cur=null;
    try{cur=typeof exerciseCard==='function'?exerciseCard:W.exerciseCard}catch(_){cur=W.exerciseCard}
    if(typeof cur!=='function'||cur.__unvrslRepRangeFinalV276)return false;
    const wrapped=function(s,e,ei){
      let html=cur.apply(this,arguments);
      const src=sourceForSession(s,ei),t=rangeFor(src);
      if(!t||!html)return html;
      html=html.replace(/<div class="unvrsl-rep-target-v271"[^>]*>[\s\S]*?<\/div>/g,'');
      html=html.replace(/inputmode="numeric" value="([^"]*)" placeholder="[^"]*"/g,(m,val)=>`inputmode="numeric" value="${val}" placeholder="${t.label}"`);
      return html;
    };
    wrapped.__unvrslRepRangeFinalV276=true;
    wrapped.__unvrslRepRangeFinalV276Base=cur;
    W.exerciseCard=wrapped;
    try{exerciseCard=wrapped}catch(_){ }
    return true;
  }

  function syncCurrent(){
    const s=state()?.current,r=routineFor(s?.w,s?.c);
    if(!s?.ex||!r?.e||Number(s.repRangeRevision)>=REV)return false;
    let changed=false;
    r.e.forEach((src,ei)=>{
      const t=rangeFor(src),ex=s.ex?.[ei];
      if(!t||!ex)return;
      (ex.set||[]).forEach(set=>{
        set.targetRepMin=t.lo;set.targetRepMax=t.hi;
        if(!set.ok&&(set.r===''||Number(set.r)===Number(src.r))){set.r='';changed=true}
      });
    });
    s.repRangeRevision=REV;changed=true;
    if(changed)saver();
    return changed;
  }

  function install(){
    ensureEngine();
    patchPreview();
    patchSession();
    patchExerciseCard();
    if(W.__unvrslBuiltInPlanRepRangesV267||W.__unvrslBuiltInPlanRepRangesAppliedV267)syncCurrent();
  }

  install();
  [20,50,100,200,400,800,1200,2000,3500,5000].forEach(ms=>setTimeout(install,ms));
  setInterval(install,1200);
  W.addEventListener?.('pageshow',install,{passive:true});
  W.addEventListener?.('unvrsl:modules-ready',install,{passive:true});
  W.addEventListener?.('unvrsl:app-ready',install,{passive:true});
})();
