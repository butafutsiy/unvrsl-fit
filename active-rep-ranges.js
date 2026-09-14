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

})();
