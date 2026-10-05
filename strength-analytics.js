'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StrengthAnalytics=api})(typeof window==='undefined'?null:window,()=>{
  const groups=[['all','Все'],['legs','Ноги'],['chest','Грудь'],['back','Спина'],['shoulders','Плечи'],['arms','Руки'],['core','Пресс'],['other','Другое']];
  function muscle(e,row={}){
    const t=[e.bp,row.bp,e.tg,row.tg,e.n,row.n].join(' ').toLowerCase();
    if(/upper legs|lower legs|quad|hamstring|glute|calf|calves|adductor|abductor|присед|ног|бедр|ягод|икр|румын|выпад/.test(t))return 'legs';
    if(/chest|pector|груд|жим.*л[её]жа|наклонн|брусь/.test(t))return 'chest';
    if(/back|lats|спин|подтяг|тяга.*(наклон|блок|гриф)/.test(t))return 'back';
    if(/shoulder|delt|плеч|дельт|армей/.test(t))return 'shoulders';
    if(/arms|bicep|tricep|бицеп|трицеп|рук|француз/.test(t))return 'arms';
    if(/waist|abs|core|пресс|скручив/.test(t))return 'core';return 'other';
  }
  function build(sessions,reg,weights,D,{days=28,group='all',now=new Date(),deleted=[]}={}){
    const end=new Date(now);end.setHours(0,0,0,0);end.setDate(end.getDate()+1);
    const start=new Date(end);start.setDate(start.getDate()-days);
    const seen=new Set(),removed=new Set(deleted.map(String)),rows=new Map();
    for(const session of [...sessions].sort((a,b)=>String(a.date).localeCompare(String(b.date))||(a.started||0)-(b.started||0))){
      const date=String(session.date||'').slice(0,10),time=new Date(date+'T12:00:00');
      if(!(session.ended||session.completedAt||session.finishedAt||session.status==='completed')||session.pendingCompletion||removed.has(String(session.id))||!Number.isFinite(+time)||time>=end||(days&&time<start))continue;
      const sid=String(session.id||`${date}:${session.started}`);if(seen.has(sid))continue;seen.add(sid);
      for(const e of session.ex||[]){
        const resolved=reg.resolve(e)||{},type=D.loadType(e,reg),g=muscle(e,resolved);
        if(['time','distance','repetitions_only'].includes(type)||(group!=='all'&&g!==group))continue;
        for(const raw of e.set||[]){
          const s={...raw,ok:raw.ok??(raw.completed===true||raw.done===true||raw.status==='completed')};
          if(!D.complete(e,s,reg))continue;
          const equipment=String(s.equipmentProfileId||e.equipmentProfileId||e.equipmentProfile?.id||e.machineId||'');
          const key=JSON.stringify([reg.identity(e),type,equipment,type==='per_side'?[e.loadedSides??2,e.implementWeight??0]:type==='per_dumbbell'?(e.implementCount??2):'']);
          const row=rows.get(key)||{key,base:resolved.n||e.n,group:g,type,equipment,equipmentName:s.equipmentSnapshot?.name||e.equipmentProfile?.name||(equipment?'Отдельное оборудование':''),points:[],sets:0};
          let p=row.points.find(x=>x.id===sid);if(!p){p={id:sid,date,started:session.started,e1:null,maxWeight:0,maxReps:0,sets:0,entries:[],protocol:null,estimateSet:null,deload:session.deload===true||session.isDeload===true||((!session.programId||session.programId==='__builtin_cycle__')&&['A1','A2','B','C','D'].includes(session.c)&&[4,6].includes(Number(session.w)))};row.points.push(p)}
          const w=D.number(s.w)??0,r=D.number(s.actualReps??s.r),method=D.method(e,s),role=D.setRole(e,s);
          const eligible=method==='STANDARD'||(method==='UNVRSL'&&(/heavy/.test(role)||/UNVRSL\s+1\/3/i.test(e.n||'')));
          const e1=eligible?D.e1rm(e,s,session,reg,weights):null;
          const entry={w,r,method,role,rpe:D.effortRpe(s),e1};p.entries.push(entry);p.sets++;row.sets++;
          if(w>p.maxWeight||(w===p.maxWeight&&r>p.maxReps)){p.maxWeight=w;p.maxReps=r}
          if(e1!=null&&(p.e1==null||e1>p.e1)){p.e1=e1;p.estimateSet=entry;p.protocol=method==='STANDARD'?'STANDARD':'UNVRSL:heavy'}
          rows.set(key,row);
        }
      }
    }
    return [...rows.values()].map(row=>{
      const estimates=row.points.filter(p=>p.e1!=null&&!p.deload),lastEstimate=estimates.at(-1),comparable=estimates.filter(p=>p.protocol===lastEstimate?.protocol),first=comparable[0],last=comparable.at(-1);
      const growth=comparable.length>=2&&first.date!==last.date?(last.e1/first.e1-1)*100:null;
      return {...row,first:row.points[0],last:row.points.at(-1),workouts:row.points.length,bestWeight:Math.max(...row.points.map(p=>p.maxWeight)),best:Math.max(0,...row.points.map(p=>p.e1||0)),growth,comparable:comparable.length,estimateDate:lastEstimate?.date};
    }).sort((a,b)=>b.last.date.localeCompare(a.last.date)||a.base.localeCompare(b.base));
  }
  return {build,groups,muscle};
});
