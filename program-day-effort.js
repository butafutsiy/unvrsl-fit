'use strict';
(function(root,factory){
  const api=factory(root||{});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.unvrslDayEffortV545=api;
})(typeof window!=='undefined'?window:null,function(root){
  const n=v=>v===''||v==null?null:Number.isFinite(Number(v))?Number(v):null;
  const fmt=v=>String(v).replace('.',',');
  const format=pair=>{
    if(!Array.isArray(pair)||pair.length<2)return null;
    const a=n(pair[0]),b=n(pair[1]);
    if(a==null||b==null||a<0||b>10)return null;
    return a===b?fmt(a):fmt(Math.min(a,b))+'–'+fmt(Math.max(a,b));
  };
  const isCardio=e=>e?.kind==='cardio'||e?.mode==='timer'||e?.workMode==='timer'||
    ['time','distance'].includes(e?.loadType)||/аэробайк|велотренажёр|беговая дорожка|эллипс|кардио/i.test(String(e?.n||e?.name||''));
  function kind(e){
    if(isCardio(e))return 'cardio';
    if(e?.kind==='isolation')return 'isolation';
    if(['compound','base'].includes(e?.kind))return 'base';
    if(typeof root?.WorkoutDomain?.exerciseKind==='function'){
      const k=root.WorkoutDomain.exerciseKind(e);
      if(k==='isolation')return 'isolation';
      if(k==='base'||k==='compound')return 'base';
    }
    return null;
  }
  function ownRange(e){
    const sets=Array.isArray(e?.sets)?e.sets:[],fromSets=sets
      .map(s=>[n(s?.targetRpeMin),n(s?.targetRpeMax)])
      .filter(pair=>pair.every(v=>v!=null));
    if(fromSets.length)return [Math.min(...fromSets.map(x=>x[0])),Math.max(...fromSets.map(x=>x[1]))];
    const lo=n(e?.rpeMin??e?.targetRpeMin??e?.rpe??e?.target),hi=n(e?.rpeMax??e?.targetRpeMax??e?.rpe??e?.target);
    return lo!=null&&hi!=null?[Math.min(lo,hi),Math.max(lo,hi)]:null;
  }
  function summary(week,day){
    const entries=Array.isArray(day?.ex)?day.ex:Array.isArray(day?.e)?day.e:[];
    if(!entries.length)return 'RPE по упражнениям';
    const strength=entries.filter(e=>kind(e)!=='cardio');
    if(!strength.length)return 'Кардио · RPE по упражнению';
    const profile=week?.weeklyLoadProfile||week;
    if(profile?.test||week?.testWeek){
      const w=format(week?.rpeMin!=null?[week.rpeMin,week.rpeMax]:profile?.rpe);
      return w?'Тест · RPE '+w:'Тест · RPE по подходам';
    }
    const kinds=[...new Set(strength.map(kind))];
    // A missing classification must never turn a single exercise into a
    // misleading day-wide RPE; show both available week prescriptions instead.
    const candidates=kinds.includes(null)?['base','isolation']:['base','isolation'].filter(k=>kinds.includes(k));
    const parts=[];
    for(const k of candidates){
      const spec=profile?.[k];
      if(spec?.sets===0)continue;
      const range=format(spec?.rpe)||(()=>{
        const own=strength.filter(e=>kind(e)===k).map(ownRange).filter(Boolean);
        return own.length?format([Math.min(...own.map(x=>x[0])),Math.max(...own.map(x=>x[1]))]):null;
      })();
      if(range)parts.push((k==='base'?'База':'Изоляция')+' RPE '+range);
    }
    if(parts.length)return parts.join(' · ');
    const ranges=strength.map(ownRange).filter(Boolean);
    if(ranges.length===strength.length){
      return 'RPE '+format([Math.min(...ranges.map(x=>x[0])),Math.max(...ranges.map(x=>x[1]))])+' по упражнениям';
    }
    return 'RPE по упражнениям';
  }
  return Object.freeze({summary,format,kind});
});
