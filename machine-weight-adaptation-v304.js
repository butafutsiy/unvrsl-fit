'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)boot(root,api);

  function boot(W,A){
    if(W.__unvrslMachineWeightAdaptationV304)return;
    W.__unvrslMachineWeightAdaptationV304=true;
    const D=W.document;
    const N=A.number;
    const esc=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const state=()=>{try{if(typeof st!=='undefined'){W.st=st;return st}}catch(_){ }return W.st||null};
    const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){ }};
    const baseName=n=>{try{return W.baseExerciseName?W.baseExerciseName(n):String(n||'').split(' — ')[0].trim()}catch(_){return String(n||'').split(' — ')[0].trim()}};
    const exerciseKey=e=>e?.sourceId?`id:${e.sourceId}`:`n:${baseName(e?.n).toLowerCase()}`;
    const profileStore=()=>{const s=state();if(!s)return{};if(!s.equipmentProfiles||typeof s.equipmentProfiles!=='object')s.equipmentProfiles={};return s.equipmentProfiles};
    const recentStore=()=>{const s=state();if(!s)return{};if(!s.equipmentRecent||typeof s.equipmentRecent!=='object')s.equipmentRecent={};return s.equipmentRecent};

    function groups(cur=state()?.current){
      if(!cur?.ex)return[];
      try{if(typeof W.groupIndexedEntries==='function')return W.groupIndexedEntries(cur.ex).map(g=>({...g,key:exerciseKey(g.entries?.[0])}))}catch(_){ }
      const out=[],map=new Map();
      cur.ex.forEach((e,i)=>{const key=exerciseKey(e);let g=map.get(key);if(!g){g={key,base:baseName(e.n),entries:[],indices:[]};map.set(key,g);out.push(g)}g.entries.push(e);g.indices.push(i)});
      return out
    }
    function groupFor(key){return groups().find(g=>g.key===key)||null}
    function profileFor(key,id){return profileStore()?.[key]?.[id]||null}
    function selected(group){return group?.entries?.map(e=>e.equipmentProfile).find(Boolean)||null}
    function targetRpe(group,cur=state()?.current){for(const e of group?.entries||[])for(const x of e.set||[]){const n=N(x.targetRpeResolved??x.targetRpe);if(n>0)return n}return N(group?.entries?.[0]?.target)||N(cur?.target)||8}
    function programWeight(set){return [set?.programW,set?.plannedW,set?.launchW].map(N).find(x=>x>0)||0}
    function stepFor(group){try{return N(W.loadStepFor?.(group.base,group.entries?.[0]?.sourceId||null))||2.5}catch(_){return 2.5}}
    function recommendation(group,profile){
      if(!group||!profile)return null;
      const plan=group.entries.flatMap(e=>e.set||[]).map(programWeight);
      if(!plan.some(x=>x>0))return null;
      return A.recommendWeights({plan,samples:profile.samples||[],step:stepFor(group),targetRpe:targetRpe(group)})
    }
    function machineLabel(id){return A.catalog.find(x=>x.id===id)?.label||id}
    function modelOptions(group){return A.optionsForExercise(group?.base||'')}
    function selectionMarkup(options,currentId){return options.map(x=>`<option value="${esc(x.id)}" ${x.id===currentId?'selected':''}>${esc(x.label)}</option>`).join('')}
    function techNote(id){const item=A.catalog.find(x=>x.id===id);return item?.note?`<div class="mw304-tech">${esc(item.note)}</div>`:''}
    function pickerChanged(){const id=D.getElementById('mw304Model')?.value||'custom',custom=D.getElementById('mw304Custom'),needsName=id==='custom'||id.endsWith('-other');if(custom)custom.classList.toggle('hidden',!needsName);const brand=D.getElementById('mw304Brand');if(brand&&needsName&&!brand.value){if(id.startsWith('technogym'))brand.value='Technogym';if(id.startsWith('matrix'))brand.value='Matrix'}const note=D.getElementById('mw304Tech');if(note)note.innerHTML=techNote(id)}
    function openPicker(token){
      const key=decodeURIComponent(token||''),group=groupFor(key);if(!group)return;
      const active=selected(group),recent=recentStore()[key],picked=active||recent,options=modelOptions(group),currentId=picked?.id||options[0]?.id||'barbell';if(picked&&!options.some(x=>x.id===picked.id))options.unshift(picked);
      const plan=group.entries.flatMap(e=>e.set||[]).map(programWeight).filter(x=>x>0),planText=plan.length?A.formatWeights(plan):'не задан';
      const profile=profileFor(key,currentId),rec=recommendation(group,profile),sampleCount=profile?.samples?.length||0;
      W.modal?.(`<div class="sheet-grabber"></div><div class="row between"><div><h2>Оборудование</h2><div class="muted">${esc(group.base)}</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="mw304-plan"><span>Исходный вес плана</span><b>${esc(planText)}${plan.length?' кг':''}</b><small>Он не изменяется при выборе тренажёра</small></div><div class="field"><label>Тренажёр или снаряд</label><select id="mw304Model" onchange="machineWeightPickerChanged304()">${selectionMarkup(options,currentId)}</select></div><div id="mw304Custom" class="${currentId==='custom'||currentId.endsWith('-other')?'':'hidden'}"><div class="field"><label>Бренд</label><input id="mw304Brand" value="${esc(currentId.endsWith('-other')?(currentId.startsWith('matrix')?'Matrix':'Technogym'):'')}" placeholder="Например, Panatta"></div><div class="field"><label>Модель или описание</label><input id="mw304Name" placeholder="Например, Leg Extension"></div></div><div id="mw304Tech">${techNote(currentId)}</div>${sampleCount?`<div class="mw304-result"><b>${rec?`Рекомендация для этой модели: ${esc(A.formatWeights(rec.weights))} кг`:'История модели сохранена'}</b><span>Калибровок: ${sampleCount} · коэффициент ${String(rec?.ratio||A.median((profile.samples||[]).map(x=>x.ratio))||1).replace('.',',')}</span></div>`:`<div class="mw304-first"><b>Первая калибровка</b><span>Выставь рабочий вес вручную и выполни подходы в нужном RPE. После тренировки сайт запомнит вес именно для этой модели.</span></div>`}<button class="btn primary full" onclick="machineWeightSave304('${encodeURIComponent(key)}')">Выбрать</button>`);
      pickerChanged()
    }
    function savePicker(token){
      const key=decodeURIComponent(token||''),group=groupFor(key);if(!group)return;
      let id=D.getElementById('mw304Model')?.value||'custom',brand='',model='',label='';
      if(id==='custom'||id.endsWith('-other')){
        brand=String(D.getElementById('mw304Brand')?.value||'').trim();model=String(D.getElementById('mw304Name')?.value||'').trim();
        if(!model){W.toast?.('Укажи модель или описание');return}
        id=`custom:${A.slug(`${brand}:${model}`)}`;label=[brand,model].filter(Boolean).join(' · ')
      }else if(id.startsWith('custom:')){const old=selected(group)||recentStore()[key]||{};brand=old.brand||'';model=old.model||old.label||id;label=old.label||id}
      else{const item=A.catalog.find(x=>x.id===id);brand=item?.brand||'';model=item?.model||'';label=item?.label||id}
      const picked={id,label,brand,model,selectedAt:Date.now()};
      group.entries.forEach(e=>{e.equipmentProfile=picked});recentStore()[key]=picked;saveState();W.closeModal?.();try{W.startPage?.()}catch(_){ }setTimeout(enhance,0);W.toast?.(`Выбрано: ${label}`)
    }
    function applyRecommendation(token){
      const key=decodeURIComponent(token||''),group=groupFor(key),active=selected(group),profile=active&&profileFor(key,active.id),rec=recommendation(group,profile);if(!rec)return;
      let p=0;group.entries.forEach(e=>(e.set||[]).forEach(x=>{const w=rec.weights[p++]||rec.weights.at(-1);if(!(w>0)||x.ok)return;x.w=w;x.manualOverride=true;x.machineRecommendedW=w;x.equipmentProfileId=active.id}));saveState();try{W.startPage?.()}catch(_){ }setTimeout(enhance,0);W.toast?.(`Для ${active.label}: ${A.formatWeights(rec.weights)} кг`)
    }
    function capture(){
      const s=state(),cur=s?.current;if(!cur)return;
      const profiles=profileStore();let changed=false;
      groups(cur).forEach(group=>{
        const active=selected(group);if(!active)return;
        const rows=group.entries.flatMap(e=>(e.set||[]).filter(x=>x.ok&&N(x.w)>0&&N(x.r)>0)).map(x=>({actual:N(x.w),program:programWeight(x),reps:N(x.r),rpe:N(x.rpe),targetReps:N(x.targetRepMax??x.targetRepMin??x.programR??x.r)}));
        const comparable=rows.filter(x=>x.program>0&&x.rpe>0);if(!comparable.length)return;
        const ratios=comparable.map(x=>x.actual/x.program).filter(x=>Number.isFinite(x)&&x>.15&&x<6);if(!ratios.length)return;
        const sample={id:`mw_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,date:cur.date||new Date().toISOString().slice(0,10),ratio:+A.median(ratios).toFixed(4),actualWeight:+A.median(comparable.map(x=>x.actual)).toFixed(2),programWeight:+A.median(comparable.map(x=>x.program)).toFixed(2),reps:+A.median(comparable.map(x=>x.reps)).toFixed(1),targetReps:+A.median(comparable.map(x=>x.targetReps)).toFixed(1),avgRpe:A.mean(comparable.map(x=>x.rpe)),targetRpe:targetRpe(group,cur)};
        profiles[group.key]??={};const old=profiles[group.key][active.id]||{...active,samples:[]};old.label=active.label;old.brand=active.brand;old.model=active.model;old.updatedAt=Date.now();old.samples=[...(old.samples||[]),sample].slice(-12);profiles[group.key][active.id]=old;group.entries.forEach(e=>{e.equipmentProfile={...active};e.equipmentCalibration=sample});changed=true
      });
      if(changed)saveState()
    }
    function wrapFinish(){
      const old=W.finish;if(typeof old!=='function'||old.__mw304)return;
      const wrapped=function(){capture();return old.apply(this,arguments)};wrapped.__mw304=true;wrapped.__mw304Base=old;W.finish=wrapped;try{finish=wrapped}catch(_){ }
    }
    function control(group){
      const active=selected(group),profile=active&&profileFor(group.key,active.id),rec=recommendation(group,profile),count=profile?.samples?.length||0;
      if(!active)return `<button class="mw304-control empty" type="button" onclick="machineWeightOpen304('${encodeURIComponent(group.key)}')"><span><b>Оборудование</b><small>Выбрать тренажёр или снаряд</small></span><i>›</i></button>`;
      return `<div class="mw304-control"><button type="button" onclick="machineWeightOpen304('${encodeURIComponent(group.key)}')"><span><b>${esc(active.label)}</b><small>${count?`${count} калибр. · ${rec?`рекомендация ${esc(A.formatWeights(rec.weights))} кг`:'история сохранена'}`:'нужна первая калибровка'}</small></span><i>›</i></button>${rec?`<button class="mw304-apply" type="button" onclick="machineWeightApply304('${encodeURIComponent(group.key)}')">Применить</button>`:''}</div>`
    }
    function enhance(){
      wrapFinish();const cur=state()?.current,root=D.getElementById('start');if(!cur||!root)return;
      const list=groups(cur),cards=[...root.querySelectorAll('.exercise')];
      cards.forEach((card,i)=>{const group=list[i];if(!group||group.entries?.every(e=>e.mode==='cardio'))return;const signature=JSON.stringify([group.key,selected(group)?.id,profileFor(group.key,selected(group)?.id)?.samples?.length||0,recommendation(group,profileFor(group.key,selected(group)?.id))?.weights||[]]);let holder=card.querySelector(':scope > .mw304-holder');if(holder?.dataset.sig===signature)return;if(!holder){holder=D.createElement('div');holder.className='mw304-holder';const row=card.querySelector(':scope > .row');if(row)row.insertAdjacentElement('afterend',holder);else card.prepend(holder)}holder.dataset.sig=signature;holder.innerHTML=control(group)})
    }
    const style=D.createElement('style');style.id='machine-weight-adaptation-v304-style';style.textContent=`
      .mw304-holder{margin:10px 0 3px}.mw304-control{display:flex;gap:8px;align-items:stretch}.mw304-control>button:first-child,.mw304-control.empty{min-width:0;flex:1;display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;background:#19191b;border:1px solid #343438;border-radius:15px;padding:10px 12px}.mw304-control span{min-width:0}.mw304-control b,.mw304-control small{display:block}.mw304-control b{font-size:13px}.mw304-control small{margin-top:3px;color:#8e8e93;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mw304-control i{font-style:normal;color:#777;font-size:20px}.mw304-control.empty b{color:#c9c9ce}.mw304-apply{flex:0 0 auto;border-radius:15px!important;background:rgba(48,209,88,.13)!important;border:1px solid rgba(48,209,88,.3)!important;color:var(--green)!important;padding:0 12px!important;font-size:12px!important;font-weight:800!important}.mw304-plan,.mw304-result,.mw304-first,.mw304-tech{margin:13px 0;border-radius:17px;padding:13px 14px}.mw304-plan{background:#202023;border:1px solid #303034}.mw304-plan span,.mw304-plan small,.mw304-result span,.mw304-first span{display:block;color:#8e8e93;font-size:12px;line-height:1.4}.mw304-plan b{display:block;font-size:21px;margin:4px 0}.mw304-result{background:rgba(48,209,88,.09);border:1px solid rgba(48,209,88,.26)}.mw304-result b,.mw304-first b{display:block;margin-bottom:5px}.mw304-result b{color:var(--green)}.mw304-first{background:rgba(255,159,10,.08);border:1px solid rgba(255,159,10,.25)}.mw304-first b{color:#ff9f0a}.mw304-tech{background:#202023;color:#a9a9ae;font-size:12px;line-height:1.45}
    `;D.head.appendChild(style);
    W.machineWeightOpen304=openPicker;W.machineWeightPickerChanged304=pickerChanged;W.machineWeightSave304=savePicker;W.machineWeightApply304=applyRecommendation;W.machineWeightCapture304=capture;W.machineWeightEnhance304=enhance;
    ['unvrsl:training-engine-ready','unvrsl:modules-ready','unvrsl:app-ready','unvrsl:readiness-ready'].forEach(ev=>W.addEventListener?.(ev,()=>setTimeout(enhance,0),{passive:true}));
    setInterval(enhance,450);[0,100,350,900,1800].forEach(ms=>setTimeout(enhance,ms))
  }
})(typeof window!=='undefined'?window:null,function(){
  const number=v=>{if(v===''||v==null)return 0;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:0};
  const median=a=>{a=(a||[]).map(number).filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return 0;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};
  const mean=a=>{a=(a||[]).map(number).filter(x=>Number.isFinite(x)&&x>0);return a.length?+(a.reduce((s,x)=>s+x,0)/a.length).toFixed(1):null};
  const roundStep=(v,step)=>{step=number(step)||2.5;return Math.max(step,Math.round(number(v)/step)*step)};
  const unique=a=>a.filter((x,i)=>i===0||Math.abs(x-a[i-1])>.001);
  const formatWeights=a=>unique((a||[]).filter(x=>number(x)>0).map(number)).map(x=>String(x).replace('.',',')).join(' / ');
  const slug=s=>String(s||'').toLowerCase().trim().replace(/[^a-zа-яё0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,64)||'machine';
  const catalog=[
    {id:'barbell',label:'Штанга · свободный вес',brand:'',model:'Barbell'},
    {id:'smith',label:'Тренажёр Смита',brand:'',model:'Smith machine'},
    {id:'technogym-mg8000',label:'Technogym · Hip Thrust MG8000',brand:'Technogym',model:'MG8000',kind:'hip',note:'Стартовое сопротивление без дисков: 35 кг. Точный коэффициент рычага производитель не публикует, поэтому первая нагрузка уточняется по RPE.'},
    {id:'matrix-mg-pl78',label:'Matrix · Glute Trainer MG-PL78',brand:'Matrix',model:'MG-PL78',kind:'hip',note:'По спецификации: старт 22,7 кг, 102 кг дисков дают до 227 кг эффективного сопротивления. Оценка механики: примерно 22,7 + 2 × масса дисков, но это не перевод в другой тренажёр.'},
    {id:'technogym-mnjp',label:'Technogym · Leg Extension MNJP',brand:'Technogym',model:'MNJP',kind:'extension'},
    {id:'matrix-g7-s71',label:'Matrix · Leg Extension G7-S71',brand:'Matrix',model:'G7-S71',kind:'extension'},
    {id:'technogym-mnup',label:'Technogym · Prone Leg Curl MNUP',brand:'Technogym',model:'MNUP',kind:'curl'},
    {id:'matrix-g7-s73',label:'Matrix · Prone Leg Curl G7-S73',brand:'Matrix',model:'G7-S73',kind:'curl'},
    {id:'technogym-mb43',label:'Technogym · Dual Adjustable Pulley MB43',brand:'Technogym',model:'MB43',kind:'cable'},
    {id:'technogym-mb44',label:'Technogym · Dual Adjustable Pulley MB44',brand:'Technogym',model:'MB44',kind:'cable'},
    {id:'matrix-ftr30-one',label:'Matrix · FTR30 · одна рукоять 1:4',brand:'Matrix',model:'FTR30 one handle',kind:'cable',note:'При одной рукояти эффективное сопротивление равно примерно четверти физического стека.'},
    {id:'matrix-ftr30-two',label:'Matrix · FTR30 · две рукояти 1:2',brand:'Matrix',model:'FTR30 two handles',kind:'cable',note:'При двух рукоятях эффективное сопротивление равно примерно половине физического стека.'},
    {id:'technogym-other',label:'Technogym · другая модель',brand:'Technogym',model:'Другая модель'},
    {id:'matrix-other',label:'Matrix · другая модель',brand:'Matrix',model:'Другая модель'},
    {id:'custom',label:'Другой тренажёр…',brand:'',model:''}
  ];
  function kind(name){name=String(name||'').toLowerCase();if(/ягод|hip thrust|glute (drive|trainer)/.test(name))return'hip';if(/разгибан.*ног|leg extension/.test(name))return'extension';if(/сгибан.*ног.*л[её]жа|prone leg curl|lying leg curl/.test(name))return'curl';if(/кроссов|блок|трос|cable|pulley/.test(name))return'cable';return'general'}
  function optionsForExercise(name){const k=kind(name),specific=catalog.filter(x=>x.kind===k),common=catalog.filter(x=>['barbell','smith'].includes(x.id)),other=catalog.filter(x=>['technogym-other','matrix-other','custom'].includes(x.id));return[...common,...specific,...other]}
  function recommendWeights({plan,samples,step=2.5,targetRpe=8}){
    const valid=(samples||[]).filter(x=>number(x.ratio)>.15&&number(x.ratio)<6).slice(-5);if(!valid.length)return null;
    const ratio=median(valid.map(x=>x.ratio)),latest=valid.at(-1),diff=number(latest?.avgRpe)-number(targetRpe),reps=number(latest?.reps),targetReps=number(latest?.targetReps);let delta=0;if((targetReps>0&&reps<targetReps)||diff>=1.25)delta=-number(step);else if((targetReps>0&&reps>=targetReps+2&&diff<=0)||(diff<=-1.25&&number(latest?.avgRpe)>0))delta=number(step);
    const weights=(plan||[]).map(x=>number(x)>0?roundStep(number(x)*ratio+delta,step):0);return{weights,ratio:+ratio.toFixed(3),delta,confidence:valid.length>=3?'high':valid.length===2?'medium':'low',samples:valid.length}
  }
  return{number,median,mean,roundStep,formatWeights,slug,catalog,kind,optionsForExercise,recommendWeights}
});
