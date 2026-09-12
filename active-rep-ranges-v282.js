'use strict';
(()=>{
  const W=window;
  const REV=316;
  if(W.__unvrslActiveRepRangesV316)return;
  W.__unvrslActiveRepRangesV316=true;
  // Keep the legacy readiness flag for modules that only test for its presence.
  W.__unvrslActiveRepRangesV282=true;

  const SPECIAL=/UNVRSL|SLDR|\bDS\b|FST-7/i;
  const TESTISH=/\bтест\b|1[–-]3ПМ|3[–-]5ПМ|максимум/i;
  const baseName=n=>String(n||'').split(' — ')[0].trim();

  function sourceFor(s,ei,e){
    const routines=W.UNVRSL_ROUTINES||[];
    const r=routines.find(x=>Number(x?.w)===Number(s?.w)&&String(x?.c||'')===String(s?.c||''));
    return r?.e?.[Number(ei)]||e||null;
  }

  function parsePlanRange(e){
    if(!e||e.m||SPECIAL.test(String(e.n||'')))return null;
    const name=String(e.n||'');
    const d=String(e.d||'').replace(/,/g,'.');
    if(/субмакс/i.test(d))return null;

    // The Notion-synced plan stores the exact target in the description.
    // Read only repetition language so weight ranges (e.g. 60–65 kg) are never mistaken for reps.
    let m=d.match(/(?:План:\s*)?(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s*повтор/i);
    if(m){
      const min=Number(m[1]),max=Number(m[2]);
      return {min,max,label:`${m[1]}–${m[2]}${/на ногу/i.test(d)?' на ногу':''}`,source:'plan-description'};
    }
    m=d.match(/(?:План:\s*)?(\d+(?:\.\d+)?)\s*повтор/i);
    if(m){
      const v=Number(m[1]);
      return {min:v,max:v,label:`${m[1]}${/на ногу/i.test(d)?' на ногу':''}`,source:'plan-description'};
    }

    // Tests are intentionally not converted into a normal rep range.
    if(TESTISH.test(name)||TESTISH.test(d))return null;

    // Some current W6 deload entries are deliberately fixed prescriptions (2×12 / 2×15)
    // and therefore have no textual range. In that case the stored prescription itself is authoritative.
    const r=Number(e.r);
    if(Number.isFinite(r)&&r>0){
      if(e.sd){
        const perLeg=r/2;
        return {min:perLeg,max:perLeg,label:`${perLeg} на ногу`,source:'plan-fixed'};
      }
      return {min:r,max:r,label:String(r),source:'plan-fixed'};
    }
    return null;
  }

  function rangeFor(week,e){
    return parsePlanRange(e);
  }

  W.unvrslActiveRepRangeV315=(week,exercise)=>{
    const t=rangeFor(week,exercise);
    if(!t)return null;
    return {min:t.min,max:t.max,label:t.label,revision:REV,source:t.source};
  };
  W.unvrslActiveRepRangeV316=W.unvrslActiveRepRangeV315;

  function install(){
    let cur=W.exerciseCard;
    try{if(typeof exerciseCard==='function')cur=exerciseCard}catch(_){ }
    if(typeof cur!=='function'||cur.__activeRepRangesV316)return false;

    // If the old v282 wrapper is already present, unwrap it so its stale hard-coded map
    // cannot add a second, contradictory range label.
    if(cur.__activeRepRangesV282Base)cur=cur.__activeRepRangesV282Base;

    const wrapped=function(s,e,ei){
      const html=cur.apply(this,arguments);
      const src=sourceFor(s,ei,e);
      const target=rangeFor(s?.w,src);
      if(!html||!target)return html;
      const note=`<div class="unvrsl-active-rep-range-v282" style="margin:9px 0 3px;color:var(--green);font-size:13px;font-weight:750">Диапазон повторов · ${target.label}</div>`;
      return html.replace('<div class="sethead">',`${note}<div class="sethead">`);
    };
    wrapped.__activeRepRangesV316=true;
    wrapped.__activeRepRangesV282=true;
    wrapped.__activeRepRangesV282Base=cur;
    wrapped.__activeRepRangesV316Base=cur;
    W.exerciseCard=wrapped;
    try{exerciseCard=wrapped}catch(_){ }
    return true;
  }

  const rerender=()=>{
    try{
      if(document.getElementById('start')?.classList.contains('active')&&typeof startPage==='function')startPage();
    }catch(_){ }
  };

  if(install())rerender();
  W.addEventListener('load',()=>{if(install())rerender()},{once:true});
  ['unvrsl:training-engine-ready','unvrsl:modules-ready','unvrsl:app-ready'].forEach(ev=>W.addEventListener?.(ev,()=>{if(install())rerender()},{passive:true}));
})();
