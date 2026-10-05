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
  function estimate(w,r,type){
    if(['bodyweight_only','bodyweight_assisted','time','distance','repetitions_only'].includes(type)||!Number.isFinite(w)||w<0||!Number.isInteger(r)||r<1)return null;
    const value=w*(r===1?1:1+r/30);
    return Number.isFinite(value)?Math.round(value*10)/10:null;
  }
  const average=values=>values.length?values.reduce((sum,v)=>sum+v,0)/values.length:null;
  function build(sessions,reg,weights,D,{group='all',now=new Date(),deleted=[]}={}){
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
          const equipment=String(s.equipmentProfileId||e.equipmentProfileId||e.equipmentProfile?.id||e.machineId||'');
          const key=JSON.stringify([reg.identity(e),type,equipment,type==='per_side'?[e.loadedSides??2,e.implementWeight??0]:type==='per_dumbbell'?(e.implementCount??2):'']);
          const row=rows.get(key)||{key,base:resolved.n||e.n,group:g,type,equipment,equipmentName:s.equipmentSnapshot?.name||e.equipmentProfile?.name||(equipment?'Отдельное оборудование':''),points:[],sets:0};
          let p=row.points.find(x=>x.id===sid);if(!p){p={id:sid,date,started:session.started,e1:null,maxWeight:0,maxReps:0,sets:0,entries:[],estimateSet:null,deload:session.deload===true||session.isDeload===true||((!session.programId||session.programId==='__builtin_cycle__')&&['A1','A2','B','C','D'].includes(session.c)&&[4,6].includes(Number(session.w)))};row.points.push(p)}
          const w=D.number(s.w)??0,r=D.number(s.actualReps??s.r),method=D.method(e,s),role=D.setRole(e,s);
          const e1=estimate(w,r,type);
          const entry={w,r,method,role,rpe:D.effortRpe(s),e1};p.entries.push(entry);p.sets++;row.sets++;
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
      return {...row,meanE1:average(values),estimateCount:values.length,first:row.points[0],last:row.points.at(-1),workouts:row.points.length,bestWeight:Math.max(...row.points.map(p=>p.maxWeight)),best:Math.max(0,...row.points.map(p=>p.e1||0)),growth,comparable:estimates.length,estimateDate:last?.date};
    }).sort((a,b)=>b.last.date.localeCompare(a.last.date)||a.base.localeCompare(b.base));
  }
  return {build,groups,muscle,estimate};
});
