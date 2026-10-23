'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.WorkoutFocusFlow=api;
})(typeof window==='undefined'?null:window,()=>{
  const steps=Object.freeze([12,10,8,6,4,2]);
  const complete=s=>!!(s?.ok||s?.skipped);
  const token=row=>`${row.ei}:${row.si}`;
  function programEntries(entries){
    return (entries||[]).flatMap((block,bi)=>{
      if(block.method!=='SUPERSET')return [block];
      const items=block.items||[],rounds=Math.max(1,Math.min(20,Number(block.rounds)||3));
      return items.map((item,pos)=>{
        const settings=block.itemSettings?.[pos]||{},reps=Math.max(1,Number(settings.r)||10),weight=Number(settings.w)||0;
        const rest=pos===items.length-1?Number(block.rest)||0:Number(block.betweenRest)||0;
        return {...item,id:`${block.id||bi}:${pos}`,method:'STANDARD',
          superGroup:`super:${block.id||bi}`,superPos:pos,superSize:items.length,
          transitionSec:Number(block.betweenRest)||0,afterGroupRestSec:Number(block.rest)||0,
          weightMode:block.weightMode==='auto'?'auto':weight>0?'manual':'auto',
          reps:{mode:'manual',min:reps,max:reps},rpe:block.rpe||8,
          effortSourceMode:'manual',restMode:'manual',restMin:rest,restMax:rest,rest,
          note:block.note||'',sets:Array.from({length:rounds},()=>({w:block.weightMode==='auto'?0:weight,r:reps}))};
      });
    });
  }
  function queue(session){
    const rows=[],ex=session?.ex||[];
    for(let ei=0;ei<ex.length;){
      const first=ex[ei],members=[ei];let end=ei+1;
      // `g` also joins phases of one method. Only explicit supersets rotate.
      if(first.superGroup)while(end<ex.length&&ex[end].superGroup===first.superGroup)members.push(end++);
      if(first.superGroup&&members.length>1){
        const rounds=Math.max(...members.map(i=>ex[i].set?.length||0));
        for(let si=0;si<rounds;si++)for(let pos=0;pos<members.length;pos++){
          const i=members[pos];if(!ex[i].set?.[si])continue;
          rows.push({ei:i,si,group:first.superGroup,blockStart:ei,blockEnd:end-1,pos,size:members.length,round:si+1,rounds});
        }
      }else for(let si=0;si<(first.set?.length||0);si++)rows.push({ei,si,round:si+1,rounds:first.set.length});
      ei=end;
    }
    return rows;
  }
  function next(session,after=null){
    const rows=queue(session),start=after?rows.findIndex(x=>token(x)===token(after))+1:0;
    return rows.slice(Math.max(0,start)).find(x=>!complete(session.ex[x.ei].set[x.si]))||null;
  }
  const seconds=(value,fallback=0)=>{
    if(value==null||value==='')return fallback;
    const n=Number(value);if(Number.isFinite(n))return Math.max(0,n);
    const m=String(value).match(/\d+(?:[.,]\d+)?/g);
    return m?.length?Math.max(...m.map(x=>Number(x.replace(',','.')))):fallback;
  };
  function restAfter(session,row,following=next(session,row)){
    const e=session.ex[row.ei],s=e.set[row.si];
    if(row.group){
      if(following?.group===row.group&&following.blockStart===row.blockStart&&following.round===row.round)
        return {seconds:seconds(e.transitionSec??e.transitionLabel,0),kind:'transition',label:'Переход внутри связки'};
      const last=session.ex[row.blockEnd];
      return {seconds:seconds(last.afterGroupRestSec??last.afterGroupRestLabel,last.rest||0),kind:'round',label:'Отдых после связки'};
    }
    return {seconds:seconds(s.restSeconds??s.rest??e.rest),kind:'set',label:'Отдых между подходами'};
  }
  function parseWeight(value){
    const parts=String(value??'').trim().split(/\s*\/\s*/);
    if(!parts.length||parts.length>2||parts.some(x=>!/^\d+(?:[.,]\d+)?$/.test(x)))return null;
    const nums=parts.map(x=>Number(x.replace(',','.')));
    return nums.every(n=>Number.isFinite(n)&&n>=0)&&nums.every(n=>Math.abs(n-nums[0])<1e-6)?nums[0]:null;
  }
  function calibrationAllowed(e,s,A,reg){
    return ['external_total','per_dumbbell','machine_stack','per_side','bodyweight_added'].includes(A.loadType(e,reg))&&
      ['STANDARD','UNVRSL','SLDR','DS','FST-7'].includes(A.method(e,s));
  }
  function needsCalibration(e,s,A,reg){
    return calibrationAllowed(e,s,A,reg)&&!['bodyweight_added'].includes(A.loadType(e,reg))&&
      e.programWeightMode==='adaptive'&&!s.manualOverride&&s.weightSource!=='manual'&&!(A.number(s.w)>0)&&
      !(s.recommendation?.strength?.estimate>0);
  }
  return {steps,programEntries,queue,next,token,restAfter,parseWeight,calibrationAllowed,needsCalibration};
});
