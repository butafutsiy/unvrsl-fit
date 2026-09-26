'use strict';
(()=>{
  const W=window,D=document;if(W.__unvrslFreeWorkoutV335)return;W.__unvrslFreeWorkoutV335=true;W.__unvrslClientFreeWorkoutV334=true;
  const E=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const N=v=>WorkoutDomain.number(v);
  const userId=()=>String(W.cloud?.user?.id||'');
  const canUse=()=>!!userId();
  const draft=()=>{if(!st.clientFreeWorkoutDraftV334||typeof st.clientFreeWorkoutDraftV334!=='object')st.clientFreeWorkoutDraftV334={};const id=userId();if(!Array.isArray(st.clientFreeWorkoutDraftV334[id]))st.clientFreeWorkoutDraftV334[id]=[];return st.clientFreeWorkoutDraftV334[id]};
  const persist=()=>{try{save()}catch(_){ }};
  const norm=v=>String(v??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[‐‑‒–—-]+/g,' ').replace(/[()·•:]+/g,' ').replace(/\s+/g,' ').trim();
  function catalogItems(){
    const source=typeof W.catalogRecords==='function'?W.catalogRecords():W.UNVRSL_EXERCISES||[];
    const seen=new Set();
    return (Array.isArray(source)?source:[]).map(e=>{
      const name=String(e.strictName||(typeof W.ruExerciseName==='function'?W.ruExerciseName(e.n):e.n)||'').trim();
      const id=String(e.id||e.rawId||workoutRegistry.identity({n:name})||'');
      if(!name||!id||seen.has(id))return null;seen.add(id);
      const body=typeof BP_RU==='object'?BP_RU[e.bp]||e.bp:e.bp;
      const equipment=typeof EQ_RU==='object'?EQ_RU[e.eq]||e.eq:e.eq;
      const target=typeof W.ruTarget==='function'?W.ruTarget(e.tg):e.tg;
      const aliases=W.UNVRSL_EXERCISE_REGISTRY_V331?.aliases?.(name)||[];
      return{id,name,body:String(body||''),equipment:String(equipment||''),target:String(target||''),search:norm([name,e.n,e.sourceName,...(Array.isArray(e.aliases)?e.aliases:[]),...aliases,body,equipment,target].join(' '))};
    }).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name,'ru'));
  }
  function rows(){const items=draft();return items.length?items.map((x,i)=>`<article class="cfw-row"><div><b>${E(x.name)}</b><span>${x.sets} × ${x.repMin===x.repMax?x.repMin:`${x.repMin}–${x.repMax}`} · ${x.weightMode==='auto'?'автовес':E(WorkoutDomain.setLabel({exerciseId:x.exerciseId,n:x.name},{w:x.weight,r:x.repMin},workoutRegistry).split(' × ')[0])} · RPE ${String(x.rpe).replace('.',',')} · отдых ${x.rest} сек</span></div><button type="button" onclick="clientFreeWorkoutRemoveV334(${i})" aria-label="Удалить ${E(x.name)}">×</button></article>`).join(''):'<div class="cfw-empty">Добавь первое упражнение из нашей базы.</div>'}
  let selectedExercise=null;
  function builder(){
    selectedExercise=null;
    const items=catalogItems();
    W.modal?.(`<div class="sheet-grabber"></div><div class="cfw-head"><div><div class="cfw-kicker">СВОБОДНЫЙ ФОРМАТ</div><h2>Собрать тренировку</h2><p>Упражнения и нагрузку выбираешь сам. Для собственного веса можно указать 0 кг. Автоподбор включается отдельно.</p></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="cfw-form"><div class="cfw-wide"><label for="cfwExercise"><span>Упражнение</span></label><input id="cfwExercise" type="search" placeholder="Поиск упражнения..." autocomplete="off" aria-label="Поиск упражнения"><div class="cfw-picker-meta" id="cfwPickerCount"></div><div id="cfwResults" class="cfw-picker-results" role="listbox" aria-label="Упражнения"></div><div id="cfwSelected" class="cfw-selected" hidden><span>Выбрано</span><b id="cfwSelectedName"></b><button type="button" id="cfwChange">Изменить</button></div></div><label><span>Подходы</span><input id="cfwSets" type="number" min="1" max="12" value="3"></label><label><span>Повторы от</span><input id="cfwRepMin" type="number" min="1" max="100" value="8"></label><label><span>Повторы до</span><input id="cfwRepMax" type="number" min="1" max="100" value="12"></label><label><span>Вес, кг</span><input id="cfwWeight" type="number" inputmode="decimal" min="0" max="999" step="any" value="0"></label><label><span>Подбор веса</span><select id="cfwWeightMode"><option value="manual">Вручную, включая 0 кг</option><option value="auto">Автоматически</option></select></label><label><span>RPE</span><select id="cfwRpe">${[7,7.5,8,8.5,9].map(x=>`<option value="${x}"${x===8?' selected':''}>${String(x).replace('.',',')}</option>`).join('')}</select></label><label><span>Отдых, сек</span><input id="cfwRest" type="number" min="15" max="600" step="15" value="90"></label></div><button class="btn full cfw-add" onclick="clientFreeWorkoutAddV334()">＋ Добавить упражнение</button><div id="cfwRows" class="cfw-rows">${rows()}</div><div class="cfw-actions"><button class="btn" onclick="clientFreeWorkoutClearV334()"${draft().length?'':' disabled'}>Очистить</button><button class="btn primary" onclick="clientFreeWorkoutStartV334()"${draft().length?'':' disabled'}>Начать тренировку</button></div>`);
    const input=D.getElementById('cfwExercise'),results=D.getElementById('cfwResults'),count=D.getElementById('cfwPickerCount'),chosen=D.getElementById('cfwSelected');
    if(!input||!results)return;
    let visible=[];
    const render=()=>{
      const q=norm(input.value);
      visible=items.filter(item=>!q||item.search.includes(q)||q.split(' ').every(token=>item.search.includes(token)));
      count.textContent=q?`Найдено: ${visible.length}`:`Упражнений: ${items.length} · поиск по названию и алиасам`;
      results.hidden=false;
      results.innerHTML=visible.length?visible.map((item,i)=>`<button type="button" class="cfw-picker-option" role="option" data-cfw-index="${i}"><b>${E(item.name)}</b><small>${E([item.body,item.equipment,item.target].filter(Boolean).join(' · '))}</small></button>`).join(''):'<div class="cfw-picker-empty">Ничего не найдено</div>';
    };
    const choose=item=>{
      if(!item)return;selectedExercise=item;input.value=item.name;results.hidden=true;chosen.hidden=false;
      D.getElementById('cfwSelectedName').textContent=item.name;count.textContent='Упражнение выбрано';
      const e=workoutRegistry.resolve({exerciseId:item.id,n:item.name});
      if(e)D.getElementById('cfwWeight').step=WorkoutDomain.profile(e,workoutRegistry,st.exerciseWeightProfiles||{}).step;
    };
    results.addEventListener('click',event=>{const button=event.target.closest('[data-cfw-index]');if(button)choose(visible[Number(button.dataset.cfwIndex)])});
    input.addEventListener('input',()=>{selectedExercise=null;chosen.hidden=true;render()});
    input.addEventListener('keydown',event=>{if(event.key==='Enter'&&visible.length){event.preventDefault();choose(visible[0]);input.blur()}});
    D.getElementById('cfwChange')?.addEventListener('click',()=>{selectedExercise=null;chosen.hidden=true;input.value='';render();input.focus({preventScroll:true})});
    render();
  }
  function readNumber(id,fallback,min,max){const n=N(D.getElementById(id)?.value);return n==null?fallback:Math.max(min,Math.min(max,n))}
  W.clientFreeWorkoutOpenV334=builder;
  W.clientFreeWorkoutAddV334=function(){
    const match=selectedExercise;if(!match)return W.toast?.('Выбери упражнение из списка');
    const repMin=Math.round(readNumber('cfwRepMin',8,1,100)),repMax=Math.max(repMin,Math.round(readNumber('cfwRepMax',repMin,1,100)));
    draft().push({id:`cfw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,name:match.name,exerciseId:match.id,weightMode:D.getElementById('cfwWeightMode')?.value||'manual',sets:Math.round(readNumber('cfwSets',3,1,12)),repMin,repMax,weight:readNumber('cfwWeight',0,0,999),rpe:readNumber('cfwRpe',8,5,10),rest:Math.round(readNumber('cfwRest',90,15,600))});persist();const host=D.getElementById('cfwRows');if(host)host.innerHTML=rows();builder()
  };
  W.clientFreeWorkoutRemoveV334=function(index){draft().splice(Number(index),1);persist();builder()};
  W.clientFreeWorkoutClearV334=function(){if(!draft().length||!W.confirm('Очистить список упражнений?'))return;draft().splice(0);persist();builder()};
  function program(){
    const id=`free-workout-v335-${userId()}`,items=draft(),ex=items.map(item=>{const meta=workoutRegistry.resolve({exerciseId:item.exerciseId,n:item.name})||{};return{id:item.id,n:item.name,exerciseId:meta.id||item.exerciseId,sourceId:meta.id||null,loadType:meta.loadType,implementCount:meta.implementCount,bp:meta?.bp||'',tg:meta?.tg||'',eq:meta?.eq||'',method:'STANDARD',rpe:item.rpe,tempo:'2-0-2',rest:item.rest,note:'Свободная тренировка',weightMode:item.weightMode||(item.weight>0?'manual':'auto'),programWeightMode:(item.weightMode==='manual'||item.weight>0)?'prescribed':'autoweight',repMin:item.repMin,repMax:item.repMax,sets:Array.from({length:item.sets},(_,i)=>({label:String(i+1),w:item.weight,r:item.repMin,rMin:item.repMin,rMax:item.repMax,rest:item.rest}))}}),value={id,name:'Свободная тренировка',isFreeWorkout:true,isClientFreeWorkout:true,ownerUserId:userId(),created:Date.now(),updated:Date.now(),weeks:[{n:1,useIntensity:false,days:[{id:`${id}-day`,name:'Свободная тренировка',ex}]}]};
    if(!Array.isArray(st.programs))st.programs=[];const index=st.programs.findIndex(x=>x?.id===id);if(index>=0)value.created=st.programs[index].created||value.created,st.programs[index]=value;else st.programs.push(value);persist();return value
  }
  W.clientFreeWorkoutStartV334=function(){if(st.current){W.nav('start');return W.toast('У вас есть незавершённая тренировка')}if(!draft().length)return W.toast?.('Сначала добавь упражнения');const p=program();if(typeof W.beginProgramDay!=='function'&&typeof beginProgramDay!=='function')return W.toast?.('Экран тренировки ещё загружается');(W.beginProgramDay||beginProgramDay)(p.id,0,0)};
  function inject(){
    const root=D.getElementById('plan');if(!root||!canUse()||root.querySelector('[data-client-free-v334]'))return;const card=D.createElement('div');card.dataset.clientFreeV334='1';card.innerHTML=`<div class="section">СВОБОДНАЯ ТРЕНИРОВКА</div><button type="button" class="card cfw-plan-card" onclick="clientFreeWorkoutOpenV334()"><div><span>Свой набор упражнений</span><b>Свободная тренировка</b><small>${draft().length?`${draft().length} упражнений уже выбрано`:'Собери тренировку из нашей базы'}</small></div><strong>Собрать ›</strong></button>`;const profile=root.querySelector('#clientPlanProfileV255,.trainer-self-profile-v111');if(profile)profile.after(card);else root.prepend(card)
  }
  const style=D.createElement('style');style.id='client-free-workout-v334-style';style.textContent=`.cfw-plan-card{display:flex;width:100%;align-items:center;justify-content:space-between;gap:12px;text-align:left;background:linear-gradient(145deg,rgba(100,210,255,.09),#1d1d21 55%);border-color:rgba(100,210,255,.28)}.cfw-plan-card span,.cfw-plan-card small{display:block;color:#8e8e95;font-size:11px}.cfw-plan-card b{display:block;margin:5px 0;font-size:19px}.cfw-plan-card strong{color:#8bddff;font-size:13px;white-space:nowrap}.cfw-head{display:flex;justify-content:space-between;gap:12px}.cfw-head h2{margin:6px 0;font-size:27px}.cfw-head p{margin:0;color:#8e8e95;font-size:12px;line-height:1.4}.cfw-kicker{color:#64d2ff;font-size:11px;font-weight:850;letter-spacing:.12em}.cfw-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:16px}.cfw-form label{display:block}.cfw-form span{display:block;margin:0 0 6px 2px;color:#96969e;font-size:11px}.cfw-form input,.cfw-form select{width:100%;height:48px;padding:0 12px;border:1px solid #36363d;border-radius:14px;background:#19191d;color:#f5f5f7;font-size:15px}.cfw-wide{grid-column:1/-1}.cfw-picker-meta{margin:9px 3px 7px;color:#85858d;font-size:11px}.cfw-picker-results{max-height:min(38vh,360px);overflow-y:auto;border:1px solid #34343b;border-radius:16px;background:#19191d;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}.cfw-picker-results[hidden],.cfw-selected[hidden]{display:none}.cfw-picker-option{display:block;width:100%;min-height:58px;padding:10px 13px;text-align:left;border-bottom:1px solid #34343b;color:#f5f5f7}.cfw-picker-option:last-child{border-bottom:0}.cfw-picker-option:active,.cfw-picker-option:focus-visible{background:#2d2432}.cfw-picker-option b,.cfw-picker-option small{display:block}.cfw-picker-option b{font-size:14px;line-height:1.3}.cfw-picker-option small{margin-top:4px;color:#92929a;font-size:11px;line-height:1.3}.cfw-picker-empty{padding:18px;color:#92929a;font-size:12px}.cfw-selected{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px 10px;align-items:center;margin-top:9px;padding:11px 13px;border:1px solid rgba(100,210,255,.35);border-radius:15px;background:rgba(100,210,255,.09)}.cfw-selected span{grid-column:1/-1;margin:0}.cfw-selected b{font-size:14px;overflow-wrap:anywhere}.cfw-selected button{color:#8bddff;font-size:12px;font-weight:800}.cfw-add{margin-top:10px}.cfw-rows{display:grid;gap:7px;margin-top:12px}.cfw-row{display:grid;grid-template-columns:minmax(0,1fr) 36px;gap:8px;align-items:center;padding:11px 12px;border-radius:15px;background:#232328;border:1px solid #313137}.cfw-row b,.cfw-row span{display:block}.cfw-row b{font-size:13px}.cfw-row span{margin-top:4px;color:#8e8e95;font-size:10px;line-height:1.35}.cfw-row button{width:34px;height:34px;border-radius:11px;background:rgba(255,69,58,.1);color:#ff8179;font-size:19px}.cfw-empty{padding:17px;border:1px dashed #37373e;border-radius:15px;color:#85858d;font-size:12px}.cfw-actions{display:grid;grid-template-columns:.7fr 1.3fr;gap:8px;margin-top:13px}.cfw-actions .btn{min-height:50px}@media(max-width:430px){.cfw-picker-results{max-height:32vh}}@media(max-width:380px){.cfw-form{grid-template-columns:1fr}.cfw-wide{grid-column:auto}.cfw-actions{grid-template-columns:1fr}}`;D.head.appendChild(style);
  function wrap(name){const base=W[name];if(typeof base!=='function'||base.__freeWorkoutV335)return;const wrapped=function(){const result=base.apply(this,arguments);queueMicrotask(inject);return result};Object.assign(wrapped,base);wrapped.__freeWorkoutV335=true;W[name]=wrapped;try{if(name==='planPage')planPage=wrapped;else if(name==='clientCleanPlanPage')clientCleanPlanPage=wrapped}catch(_){ }}
  function install(){wrap('clientCleanPlanPage');wrap('planPage');inject()}
  [0,200,700,1800,3500,7000].forEach(ms=>setTimeout(install,ms));W.addEventListener('unvrsl:deferred-modules-ready',install,{passive:true});W.addEventListener('pageshow',install,{passive:true});
})();

