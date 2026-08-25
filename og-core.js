'use strict';
if(!st.planAdds||typeof st.planAdds!=='object')st.planAdds={};
if(!Array.isArray(st.customExercises))st.customExercises=[];
if(!st.aliases||typeof st.aliases!=='object')st.aliases={};
if(!Array.isArray(st.hiddenExercises))st.hiddenExercises=[];
function baseExerciseName(n=''){
  let x=String(n).trim();
  x=x.replace(/\s+—\s+(?:UNVRSL\s+\d+\/\d+|SLDR\s+\d+\/\d+|DS\s+DS?\d+|FST-7(?:\s+\d+\/\d+)?|тест.*|back-off.*|тяжёлый.*|лёгкие.*|субмакс.*|W\d+).*$/i,'');
  return x.trim();
}
function displayExerciseName(n=''){const b=baseExerciseName(n);return st.aliases[b]||b}
function isBase(n){const x=baseExerciseName(n).toLowerCase();return BASEWORDS.some(w=>x.includes(w))}
function rest(r,e,i){
  const n=e.n||'';
  if(/DS/.test(n))return e.g&&routineEntries(r)[i+1]?.g===e.g?0:ISO[r.w];
  if(/SLDR/.test(n))return e.g&&routineEntries(r)[i+1]?.g===e.g?15:(isBase(n)?BASE[r.w]:ISO[r.w]);
  if(/UNVRSL/.test(n))return e.g&&routineEntries(r)[i+1]?.g===e.g?30:(isBase(n)?BASE[r.w]:ISO[r.w]);
  if(/FST-7/.test(n))return 30;
  return isBase(n)?BASE[r.w]:ISO[r.w];
}
function routineEntries(r){return [...(r.e||[]),...((st.planAdds||{})[`${r.w}-${r.c}`]||[])]}
function groupIndexedEntries(entries){
  const out=[];let i=0;
  while(i<entries.length){const first=entries[i],base=baseExerciseName(first.n),idx=[i];let j=i+1;
    while(j<entries.length){const next=entries[j];const sameGroup=first.g&&next.g===first.g;const sameBase=!first.g&&!next.g&&baseExerciseName(next.n)===base;if(!sameGroup&&!sameBase)break;idx.push(j);j++}
    out.push({indices:idx,entries:idx.map(k=>entries[k]),base});i=j;
  }
  return out;
}
function methodType(entries){const n=entries.map(e=>e.n||'').join(' ');if(/UNVRSL/.test(n))return'UNVRSL';if(/SLDR/.test(n))return'SLDR';if(/DS/.test(n))return'DS';if(/FST-7/.test(n))return'FST-7';if(/тест/i.test(n))return'TEST';return''}
function variantLabel(n='',si=0){
  let m=n.match(/UNVRSL\s+(\d+\/\d+)/i);if(m)return m[1];
  m=n.match(/SLDR\s+(\d+\/\d+)/i);if(m)return m[1];
  m=n.match(/DS\s+DS?(\d+)/i);if(m)return`DS${m[1]}`;
  if(/FST-7/i.test(n))return`${si+1}/7`;
  if(/тест/i.test(n))return'Тест';if(/back-off/i.test(n))return'Back';if(/тяжёл/i.test(n))return'Тяж.';if(/лёгк/i.test(n))return'Легк.';if(/субмакс/i.test(n))return'Субм.';
  return String(si+1);
}
function tempoOnly(v=''){return String(v).split('|')[0].trim()||'—'}
function groupRuleText(group){const t=methodType(group.entries),last=group.entries.at(-1);const finalRest=Number(last?.rest||0);if(t==='UNVRSL')return`UNVRSL · 30 сек между фазами · ${finalRest||'полный'} сек после блока`;if(t==='SLDR')return`SLDR · 15 сек между мини-подходами · ${finalRest||'полный'} сек после блока`;if(t==='DS')return`Дроп-сет · без отдыха между сбросами · ${finalRest||'полный'} сек после блока`;if(t==='FST-7')return'FST-7 · 7 подходов · 20–40 сек отдыха';if(t==='TEST')return`Тестовый блок · отдых ${finalRest||300} сек`;return`Рабочие подходы · отдых ${finalRest||90} сек`}
function session(r){
  const entries=routineEntries(r);
  return {id:'s'+Date.now(),date:iso(),w:r.w,c:r.c,name:r.t,target:RPE[r.w],tempo:r.p||'',started:Date.now(),ended:null,
    ex:entries.map((e,i)=>({n:e.n,d:e.d||'',rest:rest(r,e,i),g:e.g||null,sourceId:e.sourceId||null,mode:e.m?'cardio':'reps',set:Array.from({length:e.s||1},(_,j)=>e.m?{n:j+1,min:Number(e.m||0),rpe:'',ok:false}:{n:j+1,w:Number(e.w||0),r:Number(e.r||0),rpe:'',ok:false})}))};
}
function planPage(){
  const w=st.week||1,list=ROUTINES.filter(r=>r.w===w);
  $('#plan').innerHTML=`<div class="section">ТРЕНИРОВОЧНЫЙ ЦИКЛ</div><div class="weekbar">${[1,2,3,4,5,6,7,8].map(x=>`<button class="weekbtn ${x===w?'on':''}" onclick="st.week=${x};save();planPage()">W${x}</button>`).join('')}</div>
    <div class="card"><div class="row between"><div><div class="title">Неделя ${w}</div><div class="muted">${weekType(w)}</div></div><span class="chip green">RPE ${RPE[w]}</span></div></div>
    ${list.map(r=>`<div class="card routine" onclick="preview(${r.w},'${r.c}')"><h3>${esc(r.c)} · ${esc(r.t)}</h3><div class="muted">${esc(r.p||'')}</div><div class="chips"><span class="chip">${groupIndexedEntries(routineEntries(r)).length} упражнений</span><span class="chip">RPE ${RPE[w]}</span>${(st.planAdds?.[`${r.w}-${r.c}`]||[]).length?'<span class="chip green">+ своё</span>':''}</div></div>`).join('')}`;
}
function startPage(){
  const s=st.current;
  if(!s){$('#start').innerHTML=`<div class="card"><div class="title">Нет активной тренировки</div><div class="muted" style="margin-top:6px">Выбери тренировку из плана или быстрым стартом.</div><button class="btn primary full" onclick="quick()">Выбрать тренировку</button></div>`;return}
  const pct=total(s)?Math.round(done(s)/total(s)*100):0,groups=groupIndexedEntries(s.ex);
  $('#start').innerHTML=`<div class="card workout-head"><div class="row between"><div><div class="title">${esc(s.c)} · ${esc(s.name)}</div><div class="muted">W${s.w} · RPE ${s.target} · темп ${esc(tempoOnly(s.tempo))}</div></div><span class="chip green">${pct}%</span></div><div class="progress"><i style="width:${pct}%"></i></div></div>
    ${groups.map(g=>exerciseGroupCard(s,g)).join('')}
    <div class="card"><button class="btn primary full" onclick="finish()">Завершить тренировку</button><button class="btn danger full" onclick="cancelWorkout()">Отменить тренировку</button></div>`;
}
function exerciseGroupCard(s,group){
  const title=displayExerciseName(group.base),method=methodType(group.entries),last=group.entries.at(-1),finalRest=Number(last?.rest||0),allCardio=group.entries.every(e=>e.mode==='cardio');
  const rows=[];group.entries.forEach((e,local)=>{const ei=group.indices[local];e.set.forEach((x,si)=>rows.push({e,x,ei,si,label:variantLabel(e.n,si)}))});
  return `<div class="exercise ${method?'method':''}"><div class="row between"><div class="grow"><button class="exname exlink" onclick="openExerciseDetailByName('${encodeURIComponent(group.base)}')">${esc(title)} <span class="info-dot">ⓘ</span></button><div class="rule-line">${esc(groupRuleText(group))}</div><div class="chips compact"><span class="chip green">RPE ${s.target}</span><span class="chip">темп ${esc(tempoOnly(s.tempo))}</span>${method?`<span class="chip method-chip">${method}</span>`:''}</div></div>${finalRest>0?`<button class="btn tiny" onclick="timer(${finalRest})">⏱</button>`:''}</div>${method?'<div class="method-strip"></div>':''}
    ${allCardio?`<div class="sethead cardiohead"><span>Сет</span><span>мин</span><span>RPE</span><span></span></div>${rows.map(z=>`<div class="setrow cardiorow"><span class="phase">${esc(z.label)}</span><input inputmode="decimal" value="${z.x.min||''}" placeholder="мин" onchange="editSet(${z.ei},${z.si},'min',this.value)"><input inputmode="decimal" value="${z.x.rpe||''}" placeholder="${s.target}" onchange="editSet(${z.ei},${z.si},'rpe',this.value)"><button class="check ${z.x.ok?'done':''}" onclick="toggleSet(${z.ei},${z.si})">${z.x.ok?'✓':'○'}</button></div>`).join('')}`:
    `<div class="sethead"><span>Сет</span><span>кг</span><span>повт.</span><span>RPE</span><span></span></div>${rows.map(z=>`<div class="setrow"><span class="phase ${method?'accent-phase':''}">${esc(z.label)}</span><input inputmode="decimal" value="${z.x.w||''}" placeholder="0" onchange="editSet(${z.ei},${z.si},'w',this.value)"><input inputmode="numeric" value="${z.x.r||''}" placeholder="0" onchange="editSet(${z.ei},${z.si},'r',this.value)"><input inputmode="decimal" value="${z.x.rpe||''}" placeholder="${s.target}" onchange="editSet(${z.ei},${z.si},'rpe',this.value)"><button class="check ${z.x.ok?'done':''}" onclick="toggleSet(${z.ei},${z.si})">${z.x.ok?'✓':'○'}</button></div>`).join('')}`}</div>`;
}
function editSet(ei,si,k,v){if(!st.current)return;let x=st.current.ex[ei].set[si];x[k]=v===''?'':Number(String(v).replace(',','.'));save()}
function toggleSet(ei,si){if(!st.current)return;let e=st.current.ex[ei],x=e.set[si];x.ok=!x.ok;save();if(x.ok&&e.rest>0)timer(e.rest);startPage()}
function preview(w,c){
  const r=rmap.get(`${w}-${c}`);if(!r)return toast('Тренировка не найдена');const entries=routineEntries(r),groups=groupIndexedEntries(entries);
  modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${esc(r.c)} · ${esc(r.t)}</h2><div class="muted">W${r.w} · RPE ${RPE[r.w]} · темп ${esc(tempoOnly(r.p||''))}</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div>${groups.map(g=>planGroupPreview(r,g)).join('')}<button class="btn primary full" onclick="begin(${r.w},'${r.c}')">Начать</button>`)
}
function planGroupPreview(r,g){const method=methodType(g.entries),title=displayExerciseName(g.base),desc=formatPrescription(g.entries);return `<div class="listline"><div class="row between"><button class="detail-name" onclick="openExerciseDetailByName('${encodeURIComponent(g.base)}')"><b>${esc(title)}</b></button>${method?`<span class="chip method-chip">${method}</span>`:''}</div><div class="muted small">${esc(desc)}</div><div class="muted small">RPE ${RPE[r.w]} · темп ${esc(tempoOnly(r.p||''))} · ${esc(planRestRule(r,g))}</div></div>`}
function formatPrescription(entries){return entries.map(e=>{if(e.m)return`${e.m} мин`;const w=e.w?`${e.w} кг · `:'';return e.s&&e.s>1?`${e.s}×${e.r||'—'} · ${w}`.replace(/ · $/,''):`${w}${e.r||'—'} повт.`}).join(' → ')}
function planRestRule(r,g){const type=methodType(g.entries),entries=routineEntries(r),lastIndex=g.indices.at(-1),final=rest(r,entries[lastIndex],lastIndex);if(type==='UNVRSL')return`30с между фазами, ${final}с после`;if(type==='SLDR')return`15с между мини-подходами, ${final}с после`;if(type==='DS')return`без отдыха в сбросах, ${final}с после`;if(type==='FST-7')return'20–40с между подходами';return`${final}с отдых`}
function quickWeek(w){const el=$('#quickList');if(!el)return;el.innerHTML=ROUTINES.filter(r=>r.w===w).map(r=>`<div class="listline row between"><div><b>${esc(r.c)} · ${esc(r.t)}</b><div class="muted small">RPE ${RPE[w]} · ${groupIndexedEntries(routineEntries(r)).length} упражнений</div></div><button class="btn tiny primary" onclick="begin(${r.w},'${r.c}')">Старт</button></div>`).join('')}
