'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StrengthAnalytics=api})(typeof window==='undefined'?null:window,()=>{
  const groups=[['all','Все'],['legs','Ноги'],['chest','Грудь'],['back','Спина'],['shoulders','Плечи'],['arms','Руки'],['core','Пресс'],['other','Другое']];
  function muscle(e,row={}){
    // Prefer catalog targets over generic words such as “lying” or “incline”.
    const classify=t=>{
      if(/quad|hamstring|glute|calf|calves|adductor|abductor|upper legs|lower legs|квадриц|бедр|ягод|икр/.test(t))return 'legs';
      if(/tricep|bicep|forearm|arms|трицеп|бицеп|предплеч|рук/.test(t))return 'arms';
      if(/shoulder|delt|плеч|дельт/.test(t))return 'shoulders';
      if(/chest|pector|груд/.test(t))return 'chest';
      if(/back|lats|спин|широч/.test(t))return 'back';
      if(/waist|abs|core|пресс|живот/.test(t))return 'core';return null;
    };
    for(const value of [row.tg,row.bp,e.tg,e.bp]){const g=classify(String(value||'').toLowerCase());if(g)return g}
    const t=String(row.n||e.n||'').toLowerCase();
    if(/француз|сгибани.*рук|разгибани.*рук|бицеп|трицеп|молотк/.test(t))return 'arms';
    if(/подъ[её]м ног|скручив|планк|пресс/.test(t))return 'core';
    if(/присед|ног|бедр|ягод|икр|румын|выпад/.test(t))return 'legs';
    if(/подтяг|тяга.*(наклон|блок|гриф)/.test(t))return 'back';
    if(/армей|плеч|дельт|жим.*сидя|махи.*сторон/.test(t))return 'shoulders';
    if(/груд|жим.*л[её]жа|жим.*наклон|отжим|брусь|бабоч/.test(t))return 'chest';
    return 'other';
  }

  // Display estimates use the entered load, independently of prescription estimates.
  function estimate(w,r,type,effort=null){
    if(['bodyweight_only','bodyweight_assisted','time','distance','repetitions_only'].includes(type)||!Number.isFinite(w)||w<0||!Number.isInteger(r)||r<1)return null;
    // Graph history retains recovery sets. If actual effort is available,
    // display the same RPE-aware estimate as the strength model, even for
    // deloads; without effort keep legacy Epley chart behaviour.
    const e=Number(effort);
    const value=w*(Number.isFinite(e)&&e>=4&&e<=10?1+(r+10-e)/30:r===1?1:1+r/30);
    return Number.isFinite(value)?Math.round(value*10)/10:null;
  }
  const average=values=>values.length?values.reduce((sum,v)=>sum+v,0)/values.length:null;
  function build(sessions,reg,weights,D,{group='all',now=new Date(),deleted=[],equipmentProfiles={}}={}){
    const end=new Date(now);end.setHours(0,0,0,0);end.setDate(end.getDate()+1);
    const seen=new Set(),removed=new Set(deleted.map(String)),rows=new Map();
    for(const session of [...sessions].sort((a,b)=>String(a.date).localeCompare(String(b.date))||(a.started||0)-(b.started||0))){
      const date=String(session.date||'').slice(0,10),time=new Date(date+'T12:00:00');
      if(!(session.ended||session.completedAt||session.finishedAt||session.status==='completed')||session.pendingCompletion||removed.has(String(session.id))||!Number.isFinite(+time)||time>=end)continue;
      const sid=String(session.id||`${date}:${session.started}`);if(seen.has(sid))continue;seen.add(sid);
      for(const e of session.ex||[]){
        const resolved=reg.resolve(e)||{},type=D.loadType(e,reg),g=muscle(e,resolved);
        if(['time','distance','repetitions_only'].includes(type)||(group!=='all'&&g!==group))continue;
        for(const raw of e.set||[]){
          const s={...raw,w:raw.w??raw.weight,r:raw.actualReps??raw.r??raw.reps,ok:raw.ok??(raw.completed===true||raw.done===true||raw.status==='completed')};
          if(!D.complete(e,s,reg))continue;
          const equipment=String(s.equipmentProfileId||s.equipmentSnapshot?.id||e.equipmentProfileId||e.equipmentProfile?.id||e.machineId||'');
          const configuration=type==='per_side'?[e.loadedSides??2,e.implementWeight??0]:type==='per_dumbbell'?(e.implementCount??2):'';
          const familyKey=JSON.stringify([reg.identity(e),type,configuration]);
          const key=JSON.stringify([reg.identity(e),type,equipment,configuration]);
          const row=rows.get(key)||{key,familyKey,base:resolved.n||e.n,group:g,type,equipment,equipmentName:s.equipmentSnapshot?.name||(e.equipmentProfile?.id===equipment?e.equipmentProfile.name:'')||equipmentProfiles[equipment]?.name||(equipment?'Оборудование '+equipment:'Оборудование не указано'),points:[],sets:0};
          let p=row.points.find(x=>x.id===sid);if(!p){p={id:sid,date,started:session.started,e1:null,maxWeight:0,maxReps:0,sets:0,entries:[],estimateSet:null,deload:!!D.isRecoveryForAutoweight?.(session)||session.deload===true||session.isDeload===true||((!session.programId||session.programId==='__builtin_cycle__')&&['A1','A2','B','C','D'].includes(session.c)&&[4,6].includes(Number(session.w)))};row.points.push(p)}
          const w=D.number(s.w)??0,r=D.number(s.actualReps??s.r),method=D.method(e,s),role=D.setRole(e,s);
          const effort=D.effortRpe(s),rir=D.number(s.actualRir??s.rir),e1=estimate(w,r,type,effort);
          // Shared strength evidence is for the summary only. Chart values
          // remain independent and retain all completed recovery sets.
          const unsafe=!!(s.techniqueFailed||s.techniqueDangerous||s.pain||s.painReported||s.incomplete||s.partial||s.failedAttempt);
          const eligible=!unsafe&&!p.deload&&!D.warmup(s)&&!['bodyweight_only','bodyweight_assisted'].includes(type)&&w>0&&
            typeof D.strengthEvidence==='function'?D.strengthEvidence(w,r,effort,rir):null;
          const entry={w,r,method,role,rpe:effort,rir,e1,
            strengthEvidence:eligible?.confidenceWeight>0?eligible:null};p.entries.push(entry);p.sets++;row.sets++;
          if(w>p.maxWeight||(w===p.maxWeight&&r>p.maxReps)){p.maxWeight=w;p.maxReps=r}
          if(e1!=null&&(p.e1==null||e1>p.e1)){p.e1=e1;p.estimateSet=entry}
          rows.set(key,row);
        }
      }
    }
    return [...rows.values()].map(row=>{
      for(const p of row.points){const values=p.entries.map(s=>s.e1).filter(v=>v!=null);p.meanE1=average(values);p.estimateCount=values.length}
      const estimates=row.points.filter(p=>p.e1!=null),first=estimates[0],last=estimates.at(-1);
      const growth=estimates.length>=2&&first.date!==last.date&&first.e1>0?(last.e1/first.e1-1)*100:null;
      const values=row.points.flatMap(p=>p.entries.map(s=>s.e1)).filter(v=>v!=null);
      const evidence=row.points.flatMap(p=>p.entries.filter(e=>e.strengthEvidence).map(e=>({
        sessionId:p.id,date:p.date,estimate:e.strengthEvidence.estimate,
        confidenceWeight:e.strengthEvidence.confidenceWeight,tier:e.strengthEvidence.tier,
        confirmedSingle:e.r===1&&e.rpe>=7?e.w:null
      })));
      const rolling=D.currentStrengthEstimate?.(evidence,{nowMs:new Date(now).getTime()})??null;
      // A 30-day strength comparison uses a baseline known at the time,
      // never the lifetime mean or the most recent graph-only recovery set.
      const cutoff=new Date(now);cutoff.setHours(12,0,0,0);cutoff.setDate(cutoff.getDate()-30);
      const cutoffDate=[cutoff.getFullYear(),String(cutoff.getMonth()+1).padStart(2,'0'),String(cutoff.getDate()).padStart(2,'0')].join('-');
      const earlier=evidence.filter(p=>p.date<=cutoffDate);
      const pastDays=new Set(earlier.map(p=>p.date)).size;
      const pastLast=earlier.reduce((last,p)=>p.date>last?p.date:last,'');
      const cutoffAge=pastLast?(cutoff.getTime()-new Date(pastLast+'T12:00:00').getTime())/86400000:Infinity;
      const pastEstimate=pastDays>=2&&cutoffAge<=30?
        D.currentStrengthEstimate?.(earlier,{nowMs:cutoff.getTime()})?.estimate:null;
      const monthChange=rolling?.estimate>0&&pastEstimate>0&&evidence.some(p=>p.date>cutoffDate)?
        Math.round((rolling.estimate/pastEstimate-1)*1000)/10:null;
      const qualified=evidence.some(e=>e.tier!=='auxiliary')?
        evidence.filter(e=>e.tier!=='auxiliary'):evidence;
      const usableMean=average(qualified.map(e=>e.estimate));
      return {...row,meanE1:average(values),estimateCount:values.length,
        currentStrength:rolling,historicalWorkingMean:usableMean,monthChange,
        strengthEvidenceCount:qualified.length,recoverySessionCount:row.points.filter(p=>p.deload).length,
        first:row.points[0],last:row.points.at(-1),workouts:row.points.length,bestWeight:Math.max(...row.points.map(p=>p.maxWeight)),best:Math.max(0,...row.points.map(p=>p.e1||0)),growth,comparable:estimates.length,estimateDate:last?.date};
    }).sort((a,b)=>b.last.date.localeCompare(a.last.date)||a.base.localeCompare(b.base));
  }
  // Group the exercise for display only. Prescription history stays equipment-specific.
  function families(rows){
    const grouped=new Map();
    for(const row of rows){
      const key=row.familyKey||row.key;
      if(!grouped.has(key))grouped.set(key,[]);
      grouped.get(key).push(row);
    }
    return [...grouped.entries()].map(([key,variants])=>{
      if(variants.length===1)return variants[0];
      const points=variants.flatMap(v=>{
        const baseline=v.points.find(p=>p.e1>0)?.e1;
        return v.points.map(p=>({...p,equipment:v.equipment,equipmentName:v.equipmentName,variantKey:v.key,indexE1:baseline&&p.e1!=null?100*p.e1/baseline:null}));
      }).sort((a,b)=>a.date.localeCompare(b.date)||(a.started||0)-(b.started||0)||a.variantKey.localeCompare(b.variantKey));
      const comparable=variants.filter(v=>v.growth!=null);
      return {key,base:variants[0].base,type:variants[0].type,group:variants[0].group,variants,points,last:points.at(-1),first:points[0],sets:variants.reduce((sum,v)=>sum+v.sets,0),workouts:new Set(points.map(p=>p.id)).size,growth:average(comparable.map(v=>v.growth)),comparableEquipment:comparable.length};
    }).sort((a,b)=>b.last.date.localeCompare(a.last.date)||a.base.localeCompare(b.base));
  }
  return {build,families,groups,muscle,estimate};
});
