'use strict';
(()=>{
  const W=window,D=document,REV=335;
  if(W.__unvrslStrengthProgressV335)return;
  W.__unvrslStrengthProgressV335=true;

  const A=v=>Array.isArray(v)?v:[];
  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const E=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fmt=(v,d=1)=>{const n=N(v);return n==null?'—':n.toFixed(d).replace(/\.0$/,'').replace('.',',')};
  const day=v=>{const p=String(v||'').slice(0,10).split('-');return p.length===3?`${p[2]}.${p[1]}.${p[0]}`:String(v||'')};
  const shortDay=v=>{const p=String(v||'').slice(0,10).split('-');return p.length===3?`${p[2]}.${p[1]}`:String(v||'')};
  const sourceKey=v=>v==='client'?'client':'trainer';
  const sourceName=v=>sourceKey(v)==='client'?'Клиент':'Тренер';
  const e1rm=(weight,reps)=>{const w=N(weight),r=N(reps);return w>0&&r>=1&&r<=30?+(r===1?w:w*(1+r/30)).toFixed(1):null};

  const style=D.createElement('style');
  style.id='unvrsl-strength-progress-v335-style';
  style.textContent=`
    .spv335-card{position:relative}.spv335-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.spv335-title-row{display:flex;align-items:flex-start;gap:8px}.spv335-title-row h3,.spv335-title-row b{margin:0}.spv335-last{margin-top:7px}.spv335-last>span{display:block;color:#8e8e95;font-size:11px}.spv335-last>strong{display:block;margin-top:3px;color:#f5f5f7;font-size:14px;line-height:1.3}.spv335-last>small{display:block;margin-top:3px;color:#9b9ba2;font-size:11px;line-height:1.35}.spv335-last.legacy>small{color:#ba99c8}
    .spv335-source{display:inline-flex;align-items:center;min-height:22px;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:850;white-space:nowrap}.spv335-source.trainer{color:#e2b9fa;background:rgba(191,90,242,.13);border:1px solid rgba(191,90,242,.28)}.spv335-source.client{color:#9adeff;background:rgba(100,210,255,.13);border:1px solid rgba(100,210,255,.25)}
    .spv335-modes{display:grid;grid-template-columns:1.25fr .75fr .7fr;gap:4px;margin:15px 0 10px;padding:4px;border-radius:14px;background:#121215}.spv335-modes button{min-height:38px;padding:7px 8px;border:0;border-radius:11px;background:transparent;color:#85858d;font:800 11px/1.15 inherit}.spv335-modes button.on{background:rgba(191,90,242,.16);color:#eccfff;box-shadow:inset 0 0 0 1px rgba(191,90,242,.27)}
    .spv335-focus{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;padding:13px 14px;border:1px solid rgba(191,90,242,.35);border-radius:17px;background:linear-gradient(145deg,rgba(191,90,242,.16),rgba(191,90,242,.065))}.spv335-focus-label{display:block;color:#9999a1;font-size:10px}.spv335-focus-weight{display:block;margin-top:4px;color:#f5f5f7;font-size:23px;line-height:1.05;font-weight:900;font-variant-numeric:tabular-nums}.spv335-focus-reps{display:block;margin-top:4px;color:#d8d8dd;font-size:13px;font-weight:800}.spv335-focus-e1rm{display:block;margin-top:6px;color:#ae92bb;font-size:11px;line-height:1.3}.spv335-focus-side{display:grid;align-content:start;justify-items:end;gap:7px}.spv335-focus-date{color:#e0b7f5;font-size:12px;font-weight:850;font-variant-numeric:tabular-nums}.spv335-focus-note{grid-column:1/-1;margin:0;padding:8px 9px;border-radius:11px;background:rgba(255,255,255,.04);color:#b7b7bd;font-size:11px;line-height:1.4;white-space:pre-wrap}.spv335-focus-note[hidden]{display:none}
    .spv335-legend{display:flex;gap:13px;align-items:center;margin:10px 3px 2px;color:#8d8d95;font-size:10px}.spv335-legend span{display:inline-flex;align-items:center;gap:6px}.spv335-legend i{display:inline-block;width:17px;height:3px;border-radius:999px;background:#bf5af2}.spv335-legend i.e1{height:0;border-top:2px dashed #e0a8fa;background:transparent}
    .spv335-canvas{overflow-x:auto;margin-top:8px;border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.02),transparent);scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}.spv335-canvas::-webkit-scrollbar,.spv335-records::-webkit-scrollbar{display:none}.spv335-svg{display:block;max-width:none;height:186px!important;overflow:visible}.spv335-grid{stroke:#303038;stroke-width:1;stroke-dasharray:3 5}.spv335-axis{fill:#777780;font-size:10px;font-variant-numeric:tabular-nums}.spv335-line-weight{fill:none;stroke:#bf5af2;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.spv335-line-e1rm{fill:none;stroke:#e0a8fa;stroke-width:2.7;stroke-dasharray:7 6;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.spv335-marker{cursor:pointer;outline:none}.spv335-hit{fill:transparent;pointer-events:all}.spv335-dot{stroke:#17171a;stroke-width:2;vector-effect:non-scaling-stroke}.spv335-marker.weight .spv335-dot{fill:#bf5af2}.spv335-marker.e1rm .spv335-dot{fill:#e0a8fa}.spv335-marker.is-selected .spv335-dot{fill:#fff;stroke:#bf5af2;stroke-width:4}.spv335-pill{opacity:0;pointer-events:none}.spv335-marker.is-selected .spv335-pill{opacity:1}.spv335-pill rect{fill:#bf5af2;stroke:#dd9df8}.spv335-pill text{fill:#160918;font-size:10px;font-weight:900;font-variant-numeric:tabular-nums}.spv335-empty{min-height:126px;display:grid;place-items:center;padding:18px;text-align:center;color:#7f7f87;font-size:12px;line-height:1.45}
    .spv335-records{display:flex;gap:7px;overflow-x:auto;padding:10px 1px 3px;scrollbar-width:none;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}.spv335-record{flex:0 0 auto;min-width:142px;padding:10px 11px;border:1px solid #303038;border-radius:14px;background:#232328;color:#aaaab1;text-align:left;scroll-snap-align:center}.spv335-record>strong{display:block;color:#f5f5f7;font-size:14px;line-height:1.25;font-variant-numeric:tabular-nums}.spv335-record>b{display:block;margin-top:4px;color:#a990b5;font-size:10px;font-weight:750}.spv335-record>small{display:block;margin-top:5px;color:#85858d;font-size:10px;white-space:nowrap}.spv335-record.on{border-color:#bf5af2;background:rgba(191,90,242,.14)}.spv335-record.on>strong{color:#edceff}.spv335-record.on>b{color:#c99be0}.spv335-history{width:100%;display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding:11px 1px 0;border-top:1px solid #303036;color:#aaaab1;font:750 12px inherit}.spv335-history span{font-size:20px}.spv335-loading{padding:18px;border-radius:18px;color:#8e8e95;background:#1c1c20;border:1px solid #303036;font-size:12px}
    .pp-strength.spv335-card,.ofp-strength.spv335-card{overflow:hidden}.pp-strength.spv335-card .spv335-head h3{font-size:18px;line-height:1.2}.ofp-strength.spv335-card .spv335-title-row>b{font-size:17px;line-height:1.2}.pp-strength.spv335-card .spv335-modes,.ofp-strength.spv335-card .spv335-modes{margin-top:14px}
    @media(max-width:430px){.spv335-focus{padding:12px}.spv335-focus-weight{font-size:21px}.spv335-modes button{font-size:10px}.spv335-record{min-width:136px}.spv335-svg{height:176px!important}}
  `;
  D.head.appendChild(style);

  function normalizeTrainer(row,index){
    const weight=N(row?.weight_kg),reps=N(row?.reps),stored=N(row?.e1rm);
    return{_i:index,id:String(row?.id||''),date:String(row?.measured_at||'').slice(0,10),key:String(row?.exercise_key||row?.exercise_name||''),name:String(row?.exercise_name||'Упражнение'),weight,reps,e1rm:stored!=null?stored:e1rm(weight,reps),source:sourceKey(row?.entry_source),note:String(row?.notes||'')}
  }
  function normalizePublic(row,index){
    const weight=N(row?.weight),reps=N(row?.reps),stored=N(row?.e1rm);
    return{_i:index,id:String(row?.id||''),date:String(row?.date||'').slice(0,10),key:String(row?.key||row?.name||''),name:String(row?.name||'Упражнение'),weight,reps,e1rm:stored!=null?stored:e1rm(weight,reps),source:sourceKey(row?.source),note:String(row?.note||'')}
  }
  function chronological(rows){return A(rows).slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||a._i-b._i).map((x,i)=>({...x,_i:i}))}
  function groupRows(rows){
    const map=new Map();chronological(rows).forEach(row=>{const key=String(row.key||row.name||'').trim();if(!key)return;if(!map.has(key))map.set(key,{key,name:row.name||'Упражнение',rows:[]});map.get(key).rows.push(row)});
    return[...map.values()].sort((a,b)=>String(b.rows.at(-1)?.date||'').localeCompare(String(a.rows.at(-1)?.date||'')))
  }
  function hasActual(row){return N(row?.weight)!=null&&N(row?.reps)!=null}
  function primaryRecord(row,longReps=false){
    if(hasActual(row))return `${fmt(row.weight)} кг × ${fmt(row.reps,0)}${longReps?' повторений':''}`;
    if(N(row?.weight)!=null)return `${fmt(row.weight)} кг`;
    if(N(row?.e1rm)!=null)return `1ПМ ≈ ${fmt(row.e1rm)} кг`;
    return 'Нет данных'
  }
  function e1rmText(row,prefix='Расчётный 1ПМ ≈ '){return N(row?.e1rm)!=null?`${prefix}${fmt(row.e1rm)} кг`:'Расчётный 1ПМ —'}
  function legacyText(row){
    if(hasActual(row)||N(row?.e1rm)==null)return'';
    const hasWeight=N(row?.weight)!=null,hasReps=N(row?.reps)!=null;
    if(!hasWeight&&!hasReps)return'Старая запись: исходный вес и повторения не сохранены';
    if(!hasWeight)return'Старая запись: рабочий вес не сохранён';
    if(!hasReps)return'Старая запись: количество повторений не сохранено';
    return''
  }
  function sourceBadge(source){const key=sourceKey(source);return`<span class="spv335-source ${key}">${sourceName(key)}</span>`}

  function visibleRows(rows,mode){
    if(mode==='weight')return rows.filter(x=>N(x.weight)!=null);
    if(mode==='e1rm')return rows.filter(x=>N(x.e1rm)!=null);
    return rows.filter(x=>N(x.weight)!=null||N(x.e1rm)!=null)
  }
  function metricValue(row,metric){return metric==='weight'?N(row.weight):N(row.e1rm)}
  function pathFor(rows,metric,xyByIndex){
    return rows.filter(r=>metricValue(r,metric)!=null&&xyByIndex.has(r._i)).map((r,i)=>{const p=xyByIndex.get(r._i)[metric];return`${i?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`}).join(' ')
  }
  function chartHtml(rows,mode,selectedIndex){
    const displayed=visibleRows(rows,mode).slice(-80);
    if(!displayed.length){
      const text=mode==='weight'&&rows.some(x=>N(x.e1rm)!=null)?'У старых записей нет рабочего веса. Переключись на «1ПМ».':'Пока нет данных для этого графика.';
      return `<div class="spv335-empty">${E(text)}</div>`
    }
    const metrics=mode==='both'?['weight','e1rm']:[mode],count=displayed.length,w=Math.max(360,78+Math.max(0,count-1)*76),h=186,L=38,R=18,T=34,B=31;
    const values=[];displayed.forEach(r=>metrics.forEach(m=>{const v=metricValue(r,m);if(v!=null)values.push(v)}));
    const min0=Math.min(...values),max0=Math.max(...values),span=Math.max(1,max0-min0),min=Math.max(0,min0-span*.16),max=max0+span*.16,range=Math.max(1,max-min),xyByIndex=new Map();
    displayed.forEach((r,i)=>{const x=count===1?w/2:L+i*(w-L-R)/(count-1),metricsMap={};metrics.forEach(m=>{const v=metricValue(r,m);if(v!=null)metricsMap[m]={x,y:h-B-(v-min)/range*(h-T-B)}});xyByIndex.set(r._i,metricsMap)});
    const ticks=[0,.5,1].map(q=>+(max-range*q).toFixed(1));
    const grid=ticks.map(v=>{const y=h-B-(v-min)/range*(h-T-B);return`<line class="spv335-grid" x1="${L}" y1="${y.toFixed(1)}" x2="${w-R}" y2="${y.toFixed(1)}"/><text class="spv335-axis" x="${L-6}" y="${(y+3).toFixed(1)}" text-anchor="end">${E(fmt(v))}</text>`}).join('');
    const lines=metrics.map(m=>{const d=pathFor(displayed,m,xyByIndex);return d?`<path class="spv335-line-${m}" d="${d}"/>`:''}).join('');
    const markers=displayed.map(r=>metrics.map(m=>{const p=xyByIndex.get(r._i)?.[m],v=metricValue(r,m);if(!p||v==null)return'';const label=`${fmt(v)} кг`,pw=Math.max(47,label.length*6+12),py=Math.max(4,p.y-29);return`<g class="spv335-marker ${m} ${r._i===selectedIndex?'is-selected':''}" data-sp-record="${r._i}" data-sp-metric="${m}" tabindex="0" role="button" aria-label="${E(day(r.date))}, ${E(label)}"><circle class="spv335-hit" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="20"/><g class="spv335-pill"><rect x="${(p.x-pw/2).toFixed(1)}" y="${py.toFixed(1)}" width="${pw.toFixed(1)}" height="20" rx="8"/><text x="${p.x.toFixed(1)}" y="${(py+14).toFixed(1)}" text-anchor="middle">${E(label)}</text></g><circle class="spv335-dot" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5"/></g>`}).join('')).join('');
    const dates=displayed.map(r=>{const p=xyByIndex.get(r._i),first=metrics.find(m=>p?.[m]);const x=first?p[first].x:0;return`<text class="spv335-axis" x="${x.toFixed(1)}" y="${h-9}" text-anchor="middle">${E(shortDay(r.date))}</text>`}).join('');
    return `<div class="spv335-canvas" data-sp-canvas><svg class="spv335-svg" viewBox="0 0 ${w} ${h}" style="width:${w}px;min-width:${w}px" aria-label="График силового прогресса"><text class="spv335-axis" x="4" y="13">кг</text>${grid}${lines}${markers}${dates}</svg></div>`
  }
  function focusHtml(row){
    const legacy=legacyText(row),actual=hasActual(row);
    return `<div class="spv335-focus"><div><span class="spv335-focus-label">Выбранная точка</span><strong class="spv335-focus-weight" data-sp-focus-weight>${E(actual?`${fmt(row.weight)} кг`:N(row?.weight)!=null?`${fmt(row.weight)} кг`:N(row?.e1rm)!=null?`1ПМ ≈ ${fmt(row.e1rm)} кг`:'—')}</strong><b class="spv335-focus-reps" data-sp-focus-reps>${E(actual?`× ${fmt(row.reps,0)} повторений`:legacy?'Старая запись 1ПМ':'')}</b><small class="spv335-focus-e1rm" data-sp-focus-e1rm>${E(actual?e1rmText(row):legacy||e1rmText(row))}</small></div><div class="spv335-focus-side"><strong class="spv335-focus-date" data-sp-focus-date>${E(day(row?.date))}</strong><span data-sp-focus-source>${sourceBadge(row?.source)}</span></div><p class="spv335-focus-note" data-sp-focus-note${row?.note?'':' hidden'}>${E(row?.note||'')}</p></div>`
  }
  function recordChip(row,selected){
    const legacy=legacyText(row),secondary=N(row?.e1rm)!=null?`1ПМ ≈ ${fmt(row.e1rm)} кг`:'';
    return `<button type="button" class="spv335-record ${selected?'on':''}" data-sp-chip="${row._i}"><strong>${E(primaryRecord(row))}</strong><b>${E(secondary||legacy||'')}</b><small>${E(day(row.date))} · ${E(sourceName(row.source))}</small></button>`
  }
  function modeLegend(mode){return mode==='both'?'<div class="spv335-legend"><span><i></i>Рабочий вес</span><span><i class="e1"></i>Расчётный 1ПМ</span></div>':''}
  function selectedForMode(rows,mode,current){
    if(Number.isInteger(current)&&visibleRows(rows,mode).some(r=>r._i===current))return current;
    return visibleRows(rows,mode).at(-1)?._i??rows.at(-1)?._i??0
  }
  function setFocus(card,row){
    if(!row)return;const actual=hasActual(row),legacy=legacyText(row),set=(sel,value)=>{const el=card.querySelector(sel);if(el)el.textContent=value};
    set('[data-sp-focus-weight]',actual?`${fmt(row.weight)} кг`:N(row.weight)!=null?`${fmt(row.weight)} кг`:N(row.e1rm)!=null?`1ПМ ≈ ${fmt(row.e1rm)} кг`:'—');
    set('[data-sp-focus-reps]',actual?`× ${fmt(row.reps,0)} повторений`:legacy?'Старая запись 1ПМ':'');
    set('[data-sp-focus-e1rm]',actual?e1rmText(row):legacy||e1rmText(row));
    set('[data-sp-focus-date]',day(row.date));
    const source=card.querySelector('[data-sp-focus-source]');if(source)source.innerHTML=sourceBadge(row.source);
    const note=card.querySelector('[data-sp-focus-note]');if(note){note.textContent=row.note||'';note.hidden=!row.note}
    card.querySelectorAll('[data-sp-chip]').forEach(x=>x.classList.toggle('on',Number(x.dataset.spChip)===row._i));
    card.querySelectorAll('[data-sp-record]').forEach(x=>x.classList.toggle('is-selected',Number(x.dataset.spRecord)===row._i));
    card.dataset.spSelected=String(row._i)
  }
  function renderChart(card,mode){
    const rows=card.__spRows||[],current=Number(card.dataset.spSelected),selected=selectedForMode(rows,mode,Number.isInteger(current)?current:null);card.dataset.spMode=mode;card.dataset.spSelected=String(selected);
    card.querySelectorAll('[data-sp-mode]').forEach(x=>{const on=x.dataset.spMode===mode;x.classList.toggle('on',on);x.setAttribute('aria-pressed',String(on))});
    const slot=card.querySelector('[data-sp-chart-slot]');if(slot)slot.innerHTML=`${modeLegend(mode)}${chartHtml(rows,mode,selected)}`;
    const row=rows.find(x=>x._i===selected)||rows.at(-1);setFocus(card,row);
    requestAnimationFrame(()=>{const canvas=card.querySelector('[data-sp-canvas]'),point=card.querySelector(`[data-sp-record="${selected}"]`);if(canvas&&point){const box=point.getBBox?.();if(box)canvas.scrollLeft=Math.max(0,box.x+box.width/2-canvas.clientWidth/2)}})
  }
  function bindCard(card){
    if(card.dataset.spBound==='1')return;card.dataset.spBound='1';
    card.addEventListener('click',event=>{
      const modeButton=event.target.closest('[data-sp-mode]');if(modeButton){renderChart(card,modeButton.dataset.spMode);return}
      const target=event.target.closest('[data-sp-record],[data-sp-chip]');if(!target)return;const index=Number(target.dataset.spRecord??target.dataset.spChip),row=(card.__spRows||[]).find(x=>x._i===index);if(row)setFocus(card,row)
    });
    card.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const target=event.target.closest?.('[data-sp-record]');if(!target)return;event.preventDefault();const index=Number(target.dataset.spRecord),row=(card.__spRows||[]).find(x=>x._i===index);if(row)setFocus(card,row)})
  }
  function cardHtml(group,context){
    const rows=group.rows,latest=rows.at(-1),selected=selectedForMode(rows,'weight',null),legacy=legacyText(latest),isTrainer=context.kind==='trainer';
    const title=isTrainer?`<div class="spv335-title-row"><b>${E(group.name)}</b>${sourceBadge(latest?.source)}</div>`:`<div class="spv335-title-row"><h3>${E(group.name)}</h3>${sourceBadge(latest?.source)}</div>`;
    const add=isTrainer?`<button type="button" class="btn tiny" data-sp-add-record>＋ Запись</button>`:'';
    const history=isTrainer?`<button type="button" class="spv335-history" data-sp-history>Все записи · ${rows.length}<span>›</span></button>`:`<details class="pp-journal"><summary><span>Все записи</span><small>${rows.length}</small></summary><div class="pp-journal-list">${rows.slice().reverse().map(row=>`<article><div class="pp-journal-head"><b>${E(day(row.date))}</b>${sourceBadge(row.source)}</div><p><strong>${E(primaryRecord(row))}</strong>${N(row.e1rm)!=null?`<br>${E(e1rmText(row,'1ПМ ≈ '))}`:''}${legacyText(row)?`<br>${E(legacyText(row))}`:''}</p>${row.note?`<blockquote>${E(row.note)}</blockquote>`:''}</article>`).join('')}</div></details>`;
    return `<article class="${isTrainer?'ofp-strength':'pp-strength'} spv335-card" data-sp-key="${E(group.key)}"><div class="spv335-head"><div class="grow">${title}<div class="spv335-last ${legacy?'legacy':''}"><span>Последний результат:</span><strong>${E(primaryRecord(latest))}</strong><small>${E(hasActual(latest)?e1rmText(latest):legacy||e1rmText(latest))}</small></div></div>${add}</div><div class="spv335-modes" role="group" aria-label="Показатель графика"><button type="button" class="on" data-sp-mode="weight" aria-pressed="true">Рабочий вес</button><button type="button" data-sp-mode="e1rm" aria-pressed="false">1ПМ</button><button type="button" data-sp-mode="both" aria-pressed="false">Оба</button></div>${focusHtml(rows.find(x=>x._i===selected)||latest)}<div data-sp-chart-slot>${chartHtml(rows,'weight',selected)}</div><div class="spv335-records" aria-label="Силовые записи">${rows.slice().reverse().map(row=>recordChip(row,row._i===selected)).join('')}</div>${history}</article>`
  }
  function hydrateCards(container,groups,context){
    const cards=[...container.querySelectorAll('.spv335-card')];cards.forEach((card,i)=>{const group=groups[i];if(!group)return;card.__spRows=group.rows;card.__spContext=context;bindCard(card);if(context.kind==='trainer'){card.querySelector('[data-sp-add-record]')?.addEventListener('click',()=>W.offlineStrengthSheet?.(context.id,group.key,group.name));card.querySelector('[data-sp-history]')?.addEventListener('click',()=>W.offlineStrengthHistory?.(context.id,group.key,group.name))}})
  }

  let trainerRequest=0;
  async function patchTrainer(){
    const section=[...D.querySelectorAll('.ofp-section')].find(x=>/Выбранные упражнения/i.test(x.querySelector('h3')?.textContent||''));if(!section||section.dataset.spv335==='1'||section.dataset.spLoading==='1')return;
    const id=String(W.offlineProgressCurrentIdV321?.()||'');const cloud=W.cloud;if(!id||!cloud?.client||!cloud?.user)return;section.dataset.spLoading='1';const request=++trainerRequest;
    try{
      const result=await cloud.client.from('offline_client_strengths').select('id,measured_at,exercise_key,exercise_name,weight_kg,reps,e1rm,notes,entry_source,created_at').eq('offline_client_id',id).order('measured_at',{ascending:true}).order('created_at',{ascending:true}).limit(500);
      if(result.error)throw result.error;if(request!==trainerRequest||!section.isConnected)return;
      const rows=A(result.data).map(normalizeTrainer),groups=groupRows(rows);section.dataset.spv335='1';delete section.dataset.spLoading;
      section.innerHTML=`<div class="ofp-section-head"><div><div class="ofp-kicker">СИЛОВЫЕ</div><h3>Выбранные упражнения</h3></div><button type="button" class="btn" data-sp-add-exercise>＋ Добавить</button></div>${groups.length?`<div class="ofp-strength-list">${groups.map(g=>cardHtml(g,{kind:'trainer',id})).join('')}</div>`:`<div class="ofp-empty"><b>Упражнения не выбраны</b><span>Добавь только те упражнения, по которым хочешь отслеживать прогресс этого клиента.</span><button type="button" class="btn primary" data-sp-add-exercise>Добавить упражнение</button></div>`}`;
      section.querySelectorAll('[data-sp-add-exercise]').forEach(b=>b.addEventListener('click',()=>W.offlineCustomStrengthSheet?.(id)));const list=section.querySelector('.ofp-strength-list');if(list)hydrateCards(list,groups,{kind:'trainer',id})
    }catch(error){delete section.dataset.spLoading;console.warn('UNVRSL strength progress trainer',error)}
  }

  let publicApi=null,publicRequest=0;
  async function sha256(value){const bytes=new TextEncoder().encode(value),out=await crypto.subtle.digest('SHA-256',bytes);return[...new Uint8Array(out)].map(x=>x.toString(16).padStart(2,'0')).join('')}
  async function getPublicStrengths(){
    const token=new URLSearchParams(W.location.hash.replace(/^#/, '')).get('t')||'';if(!/^[A-Za-z0-9_-]{40,80}$/.test(token))return null;
    if(!W.supabase?.createClient||!W.UNVRSL_CLOUD?.url||!W.UNVRSL_CLOUD?.anonKey)return null;
    publicApi=publicApi||W.supabase.createClient(W.UNVRSL_CLOUD.url,W.UNVRSL_CLOUD.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});await publicApi.auth.getSession();const hash=await sha256(token),result=await publicApi.rpc('get_offline_progress_share_v334',{p_token_hash:hash});if(result.error)throw result.error;return A(result.data?.data?.strengths).map(normalizePublic)
  }
  async function patchPublic(){
    const grid=D.querySelector('.pp-strength-grid');if(!grid||grid.dataset.spv335==='1'||grid.dataset.spLoading==='1')return;grid.dataset.spLoading='1';const request=++publicRequest;
    try{
      const rows=await getPublicStrengths();if(rows==null||request!==publicRequest||!grid.isConnected)return;const groups=groupRows(rows);grid.dataset.spv335='1';delete grid.dataset.spLoading;
      grid.innerHTML=groups.map(g=>cardHtml(g,{kind:'public'})).join('');hydrateCards(grid,groups,{kind:'public'})
    }catch(error){delete grid.dataset.spLoading;console.warn('UNVRSL strength progress public',error)}
  }

  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;patchTrainer();patchPublic()})}
  new MutationObserver(schedule).observe(D.documentElement,{childList:true,subtree:true});
  [0,150,500,1200,2600].forEach(ms=>setTimeout(schedule,ms));
  W.addEventListener('unvrsl:deferred-modules-ready',schedule,{passive:true});
  W.UNVRSL_STRENGTH_PROGRESS_V335=Object.freeze({revision:REV,e1rm});
})();
