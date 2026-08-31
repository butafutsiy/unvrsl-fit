'use strict';
((root,factory)=>{
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.UNVRSL_METHOD_V211=api;
})(typeof window!=='undefined'?window:globalThis,()=>{
  const value=input=>{
    if(input===''||input==null)return null;
    const parsed=Number(String(input).replace(',','.'));
    return Number.isFinite(parsed)?parsed:null;
  };
  const mean=items=>{
    const values=(items||[]).map(value).filter(item=>item!=null);
    return values.length?values.reduce((sum,item)=>sum+item,0)/values.length:null;
  };
  const round=(input,step=2.5)=>{
    const number=value(input),increment=value(step)||2.5;
    return number==null?null:Math.max(increment,Math.round(number/increment)*increment);
  };
  const entrySets=entry=>{
    if(Array.isArray(entry?.sets)&&entry.sets.length)return entry.sets.map(set=>({...set,w:value(set?.w??set?.weight)||0,r:value(set?.r??set?.reps)||0}));
    return Array.from({length:Math.max(1,value(entry?.s)||1)},()=>({w:value(entry?.w)||0,r:value(entry?.r)||0,rest:value(entry?.rest)}));
  };
  function expandPlanEntries(entries=[]){
    const source=entries.filter(Boolean),flat=source.flatMap(entrySets);
    const names=source.map(entry=>String(entry?.n||entry?.name||''));
    const isUnvrsl=names.some(name=>/UNVRSL/i.test(name))||source.some(entry=>String(entry?.method||'').toUpperCase()==='UNVRSL');
    if(!isUnvrsl)return{method:String(source[0]?.method||'STANDARD').toUpperCase(),sets:flat};
    const compressedPair=source.length===2&&source.every(entry=>(value(entry?.s)||1)===1);
    const compressedWithFinish=source.length===3&&(value(source[0]?.s)||1)===1&&(value(source[1]?.s)||1)===1;
    if(!compressedPair&&!compressedWithFinish)return{method:'UNVRSL',sets:flat};
    const heavy=entrySets(source[0])[0],light=entrySets(source[1])[0];
    const rounds=Array.from({length:3},()=>[{...heavy},{...light}]).flat();
    const finish=compressedWithFinish?entrySets(source[2]):[];
    return{method:'UNVRSL',sets:[...rounds,...finish]};
  }
  function aggregateRecommendation(rows=[],currentWeights=[],currentReps=[],targetRpes=[],step=2.5){
    const valid=rows.map(row=>({
      w:value(row?.w??row?.weight),
      r:value(row?.r??row?.reps),
      rpe:value(row?.rpe),
      rir:value(row?.rir)
    })).filter(row=>row.w>0&&row.r>0);
    if(!valid.length)return null;
    const averageWeight=mean(valid.map(row=>row.w));
    const averageReps=mean(valid.map(row=>row.r));
    const averageRpe=mean(valid.map(row=>row.rpe));
    const averageRir=mean(valid.map(row=>row.rir!=null?row.rir:(row.rpe!=null?Math.max(0,10-row.rpe):2)))??2;
    const targetAverageReps=mean(currentReps)||averageReps;
    const targetAverageRpe=mean(targetRpes)||8;
    const targetRir=Math.max(0,10-targetAverageRpe);
    const estimatedMax=averageWeight*(1+(averageReps+averageRir)/30);
    const rawAverage=estimatedMax/(1+(targetAverageReps+targetRir)/30);
    const desiredAverage=round(Math.max(averageWeight*.9,Math.min(averageWeight*1.075,rawAverage)),step);
    const pattern=currentWeights.map(value).map(item=>item>0?item:null);
    const patternAverage=mean(pattern)||averageWeight;
    const ratio=desiredAverage/patternAverage;
    const weights=pattern.map(item=>item==null?desiredAverage:round(item*ratio,step));
    return{
      weights,
      averageWeight:Number(averageWeight.toFixed(1)),
      averageReps:Number(averageReps.toFixed(1)),
      averageRpe:averageRpe==null?null:Number(averageRpe.toFixed(1)),
      desiredAverage,
      estimatedMax:Number(estimatedMax.toFixed(1))
    };
  }
  return{aggregateRecommendation,expandPlanEntries,mean,round};
});
