'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TrainerClientProgress521=api;
})(typeof window==='undefined'?null:window,function(){
  const array=v=>Array.isArray(v)?v:[];
  const num=v=>{if(v==null||v==='')return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>v==null?'–':Number(v).toLocaleString('ru-RU',{maximumFractionDigits:1});
  const date=v=>String(v||'').slice(0,10).split('-').reverse().join('.');
  const mean=values=>values.length?values.reduce((s,x)=>s+x,0)/values.length:null;
  const stamp=v=>{const n=num(v);return n??(Number.isFinite(Date.parse(v))?Date.parse(v):null)};
  const duration=s=>{const explicit=num(s.finalDurationMs??s.durationMs);if(explicit>0)return explicit;const a=stamp(s.started),b=stamp(s.ended);return a!=null&&b>a?b-a:null};
  const time=ms=>ms==null?'–':`${Math.floor(ms/3600000)?Math.floor(ms/3600000)+' ч ':''}${Math.floor(ms/60000)%60} мин`;
  const measures=[['waist','Талия'],['abdomen','Живот'],['hips','Ягодицы'],['chest','Грудь'],['thigh','Бедро'],['arm','Рука'],['calf','Икра']];
  function build(data,reg,D,S,clientId){
    const bw=array(data.weights).map(x=>({d:x.measure_date,w:num(x.weight_kg)})),seen=new Set(),sessions=[];
    for(const row of array(data.workouts)){
      const payload=row.payload||{},id=String(row.external_id||payload.id||row.id||'');
      if(!id||seen.has(id)||payload.pendingCompletion||row.user_id&&String(row.user_id)!==String(clientId))continue;
      const hasPayload=Array.isArray(payload.ex),s={...payload,id,date:String(row.workout_date||payload.date||'').slice(0,10),userId:clientId,ex:array(payload.ex)};
      const complete=s.ex.some(e=>array(e.set).some(x=>D.complete(e,x,reg)));
      if(hasPayload&&!complete)continue;
      if(!hasPayload&&!(num(row.completed_sets)>0))continue;
      seen.add(id);if(!s.ended)s.ended=stamp(row.updated_at||row.created_at)||1;
      const report=hasPayload?D.summary(s,[],reg,bw,{records:false}):null;
      const effort=s.ex.flatMap(e=>array(e.set).filter(x=>D.complete(e,x,reg)).map(x=>D.effortRpe(x))).filter(x=>x!=null&&x>0);
      const done=report?.setCount??num(row.completed_sets)??0;
      const planned=hasPayload?s.ex.reduce((sum,e)=>sum+array(e.set).filter(x=>!x.warm&&!x.warmup&&x.role!=='warmup').length,0):num(row.total_sets);
      sessions.push({session:s,row,done,planned,volume:report?.volume??null,unknownVolume:report?.unknownVolumeSets??(hasPayload?0:done),duration:duration(payload),rpe:mean(effort)??num(row.avg_rpe),effort});
    }
    sessions.sort((a,b)=>a.session.date.localeCompare(b.session.date)||(stamp(a.session.started)||0)-(stamp(b.session.started)||0)||a.session.id.localeCompare(b.session.id));
    const effort=sessions.flatMap(x=>x.effort),durations=sessions.map(x=>x.duration).filter(x=>x!=null),volumes=sessions.map(x=>x.volume).filter(x=>x!=null);
    const weightPoints=array(data.weights).filter(x=>num(x.weight_kg)>0).map(x=>({date:String(x.measure_date).slice(0,10),value:num(x.weight_kg)})).sort((a,b)=>a.date.localeCompare(b.date));
    const strength=S?S.build(sessions.map(x=>x.session),reg,bw,D):[];
    return {sessions,strength,weightPoints,measurePoints:Object.fromEntries(measures.map(([key])=>[key,array(data.measurements).filter(x=>num(x.measurements?.[key])>0).map(x=>({date:String(x.measure_date).slice(0,10),value:num(x.measurements[key])})).sort((a,b)=>a.date.localeCompare(b.date))])),
      totals:{workouts:sessions.length,sets:sessions.reduce((s,x)=>s+x.done,0),planned:sessions.reduce((s,x)=>s+(x.planned||0),0),volume:volumes.length?volumes.reduce((s,x)=>s+x,0):null,unknownVolume:sessions.reduce((s,x)=>s+x.unknownVolume,0),rpe:mean(effort)??mean(sessions.map(x=>x.rpe).filter(x=>x!=null)),duration:mean(durations)}};
  }
  let chartSerial=0;
  function chart(points,{label,unit='',note=''}={}){
    const clean=points.filter(x=>num(x.value)!=null),n=clean.length;
    if(!n)return '<div class="tcp-empty">Пока нет данных для графика</div>';
    const id='tcp-chart-'+(++chartSerial),width=Math.max(320,64+(n-1)*56),height=170,left=30,bottom=140,values=clean.map(x=>x.value),lo=Math.min(...values),span=Math.max(1,Math.max(...values)-lo);
    const xy=clean.map((p,i)=>({...p,x:n===1?width/2:left+i*(width-2*left)/(n-1),y:bottom-12-(p.value-lo)/span*100}));
    const path=xy.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '),last=clean.at(-1);
    return `<div id="${id}" class="tcp-chart" data-points="${esc(JSON.stringify(clean))}" data-unit="${esc(unit)}"><div class="tcp-chart-focus"><b data-value>${esc(fmt(last.value))} ${esc(unit)}</b><span data-date>${esc(date(last.date))}</span></div><div class="tcp-chart-scroll"><svg viewBox="0 0 ${width} ${height}" style="width:${width}px;min-width:${width}px" role="group" aria-label="${esc(label)}"><path d="${path}" fill="none" stroke="var(--accent,var(--green))" stroke-width="3" stroke-linejoin="round"/>${xy.map((p,i)=>`<g role="button" tabindex="0" aria-label="${esc(date(p.date)+': '+fmt(p.value)+' '+unit)}" onclick="trainerClientChartPoint521('${id}',${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();trainerClientChartPoint521('${id}',${i})}"><circle cx="${p.x}" cy="${p.y}" r="17" fill="transparent"/><circle data-point="${i}" cx="${p.x}" cy="${p.y}" r="${i===n-1?6:4}" fill="var(--accent,var(--green))"/><text x="${p.x}" y="160" text-anchor="middle" fill="var(--muted)" font-size="10">${esc(date(p.date).slice(0,5))}</text></g>`).join('')}</svg></div>${note?`<p class="muted small">${esc(note)}</p>`:''}<p class="muted small" data-note>${esc(last.note||'Нажми на точку, чтобы посмотреть запись')}</p></div>`;
  }
  const card=(label,value)=>`<div class="tcp-metric"><span>${esc(label)}</span><b>${esc(value)}</b></div>`;
  const panel=(title,body)=>`<section class="card tcp-panel"><h3>${esc(title)}</h3>${body}</section>`;
  function overview(model){
    const t=model.totals,latest=model.weightPoints.at(-1),progress=model.strength.filter(x=>x.growth!=null);
    const volume=t.volume==null?'Нет данных':fmt(t.volume)+' кг'+(t.unknownVolume?' · частичный':'');
    const charts=panel('Тоннаж по тренировкам',chart(model.sessions.map(x=>({date:x.session.date,value:x.volume,note:x.session.c||x.session.name})),{label:'Тоннаж по тренировкам',unit:'кг'}))+panel('Средний RPE по тренировкам',chart(model.sessions.map(x=>({date:x.session.date,value:x.rpe,note:x.session.c||x.session.name})),{label:'Средний RPE по тренировкам'}));
    return `<div class="tcp-period">За всё время · ${model.sessions.length?date(model.sessions[0].session.date)+' – '+date(model.sessions.at(-1).session.date):'тренировок пока нет'}</div><div class="tcp-metrics">${card('Завершено тренировок',fmt(t.workouts))}${card('Рабочих подходов',fmt(t.sets))}${card('Тоннаж',volume)}${card('Средняя длительность',time(t.duration))}${card('Средний RPE',fmt(t.rpe))}${card('Последний вес',latest?fmt(latest.value)+' кг':'Нет замеров')}</div>${progress.length?`<p class="muted small">Рост 1ПМ: ${progress.filter(x=>x.growth>0).length} из ${progress.length} вариантов упражнений с повторными записями. Тренажёры сравниваются отдельно.</p>`:''}${charts}`;
  }
  function strengths(model,ui){
    if(!model.strength.length)return '<div class="card muted">Пока нет выполненных силовых подходов. Показатели появятся из журнала клиента.</div>';
    const row=model.strength.find(x=>x.key===ui.strengthKey)||model.strength[0];
    const metric=['weight','e1','reps'].includes(ui.strengthMetric)?ui.strengthMetric:'weight';
    const points=row.points.map(p=>({date:p.date,value:metric==='e1'?p.e1:metric==='reps'?p.maxReps:p.maxWeight,note:`${fmt(p.maxWeight)} кг × ${fmt(p.maxReps)} · ${p.sets} подх.`}));
    const label=metric==='e1'?'Расчётный 1ПМ':metric==='reps'?'Повторы с максимальным весом':'Рабочий вес',unit=metric==='reps'?'повт.':'кг';
    return `<div class="card tcp-panel"><label class="muted small" for="tcpStrength">Упражнение и тренажёр</label><select id="tcpStrength" onchange="trainerClientProgressSelect521('strengthKey',this.value)">${model.strength.map(x=>`<option value="${esc(x.key)}" ${x.key===row.key?'selected':''}>${esc(x.base+' · '+x.equipmentName)}</option>`).join('')}</select><div class="tcp-controls">${[['weight','Вес'],['e1','1ПМ'],['reps','Повторы']].map(([key,name])=>`<button class="btn tiny ${metric===key?'primary':''}" onclick="trainerClientProgressSelect521('strengthMetric','${key}')">${name}</button>`).join('')}</div><h3>${label}</h3>${chart(points,{label,unit})}<div class="tcp-metrics">${card('Лучший вес',fmt(row.bestWeight)+' кг')}${card('Средний 1ПМ',fmt(row.meanE1)+(row.meanE1!=null?' кг':''))}${card('Тренировок',fmt(row.workouts))}${card('Рост 1ПМ',row.growth==null?'Нужны две даты':(row.growth>0?'+':'')+fmt(row.growth)+'%')}</div><details class="tcp-journal"><summary>Все подходы · ${row.sets}</summary>${row.points.slice().reverse().map(p=>`<div class="tcp-record"><b>${esc(date(p.date))}</b><span>${p.entries.map(x=>esc(fmt(x.w)+' кг × '+fmt(x.r)+(x.rpe!=null?' · RPE '+fmt(x.rpe):''))).join('<br>')}</span></div>`).join('')}</details></div>`;
  }
  function measurements(model,ui){
    const available=measures.filter(([key])=>model.measurePoints[key]?.length),key=available.some(([k])=>k===ui.measure)?ui.measure:available[0]?.[0],points=key?model.measurePoints[key]:[];
    const section=(title,points,unit)=>{const delta=points.length>1?points.at(-1).value-points[0].value:null;return panel(title,`${delta!=null?`<p class="muted">Изменение: ${delta>0?'+':''}${fmt(delta)} ${unit}</p>`:''}${chart(points,{label:title,unit})}<details class="tcp-journal"><summary>Все записи · ${points.length}</summary>${points.slice().reverse().map(p=>`<div class="tcp-record"><span>${esc(date(p.date))}</span><b>${fmt(p.value)} ${unit}</b></div>`).join('')}</details>`)};
    return section('Вес тела',model.weightPoints,'кг')+`<div class="tcp-controls">${available.map(([k,name])=>`<button class="btn tiny ${key===k?'primary':''}" onclick="trainerClientProgressSelect521('measure','${k}')">${name}</button>`).join('')}</div>`+(key?section(measures.find(([k])=>k===key)[1],points,'см'):'<div class="card muted">Клиент ещё не добавил замеры тела.</div>');
  }
  function render(model,tab,ui={}){if(!model)return '<div class="card muted">Не удалось рассчитать статистику.</div>';return tab==='strength'?strengths(model,ui):tab==='measures'?measurements(model,ui):overview(model)}
  return {build,render,duration,time,chart};
});
if(typeof window!=='undefined'){
  window.trainerClientChartPoint521=function(id,index){
    const host=document.getElementById(id);if(!host)return;
    const points=JSON.parse(host.dataset.points||'[]'),point=points[index];if(!point)return;
    host.querySelector('[data-value]').textContent=Number(point.value).toLocaleString('ru-RU',{maximumFractionDigits:1})+' '+(host.dataset.unit||'');
    host.querySelector('[data-date]').textContent=point.date.split('-').reverse().join('.');host.querySelector('[data-note]').textContent=point.note||'';
    host.querySelectorAll('[data-point]').forEach(el=>el.setAttribute('r',Number(el.dataset.point)===index?6:4));
  };
  const style=document.createElement('style');style.textContent=`.tcp-period{color:var(--muted);font-size:12px;margin:12px 0}.tcp-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}.tcp-metric{background:var(--panel2);border:1px solid var(--line);border-radius:15px;padding:12px;min-width:0}.tcp-metric span{display:block;color:var(--muted);font-size:12px}.tcp-metric b{display:block;font-size:20px;margin-top:5px;overflow-wrap:anywhere}.tcp-panel h3{margin:0 0 12px;font-size:16px}.tcp-panel select{width:100%;padding:12px;background:var(--panel2);border:1px solid var(--line);color:var(--text);border-radius:12px;margin:8px 0;font-size:16px;box-sizing:border-box}.tcp-controls{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.tcp-chart-focus{display:flex;justify-content:space-between;align-items:center;gap:10px}.tcp-chart-focus b{font-size:23px}.tcp-chart-focus span{color:var(--muted);font-size:12px}.tcp-chart-scroll{overflow-x:auto;overscroll-behavior-x:contain;max-width:100%}.tcp-chart svg{display:block;height:170px}.tcp-journal{margin-top:12px}.tcp-journal summary{cursor:pointer;color:var(--accent,var(--green))}.tcp-record{display:flex;justify-content:space-between;gap:12px;font-size:13px;padding:12px 0;border-bottom:1px solid var(--line)}.tcp-record span:last-child{text-align:right}.tcp-empty{padding:25px 0;color:var(--muted);font-size:13px}`;document.head.appendChild(style);
}
