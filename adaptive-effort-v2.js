'use strict';
(()=>{
  if(window.__unvrslAdaptiveEffortV2)return;window.__unvrslAdaptiveEffortV2=true;

  const css=document.createElement('style');
  css.id='adaptive-effort-v2-style';
  css.textContent=`
    #start .sethead.effort-head,#start .setrow.effort-row{grid-template-columns:28px minmax(0,1fr) minmax(0,1fr) minmax(0,.82fr) minmax(0,.82fr) 40px!important;gap:6px!important}
    #start .sethead.effort-head span{min-width:0;text-align:center}
    #start .setrow.effort-row input{min-width:0!important;padding-left:4px!important;padding-right:4px!important;text-align:center}
    #start .cardio-work-timer{white-space:nowrap;background:rgba(10,132,255,.16)!important;color:#58a9ff!important;border-color:rgba(10,132,255,.42)!important}
    #start .adaptive-load-chip{background:rgba(48,209,88,.12)!important;color:#30d158!important;border-color:rgba(48,209,88,.34)!important}
    .rir-help{color:#8e8e93;font-size:11px;line-height:1.35;margin:6px 2px 0}
    @media(max-width:390px){
      #start .sethead.effort-head,#start .setrow.effort-row{grid-template-columns:24px minmax(0,1fr) minmax(0,1fr) minmax(0,.78fr) minmax(0,.78fr) 36px!important;gap:4px!important}
      #start .setrow.effort-row input{font-size:14px!important}
      #start .cardio-work-timer{padding-left:8px!important;padding-right:8px!important}
    }
  `;
  document.head.appendChild(css);

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const round1=v=>Math.round(v*10)/10;
  const rirFromRpe=v=>{const n=num(v);return n==null?null:round1(clamp(10-n,0,10))};
  const rpeFromRir=v=>{const n=num(v);return n==null?null:round1(clamp(10-n,0,10))};
  const median=a=>{const x=a.filter(Number.isFinite).sort((p,q)=>p-q);if(!x.length)return null;const m=Math.floor(x.length/2);return x.length%2?x[m]:(x[m-1]+x[m])/2};
  const baseName=n=>typeof baseExerciseName==='function'?baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim();
  const stepFor=(base,sourceId)=>{try{return typeof loadStepFor==='function'?loadStepFor(base,sourceId):2.5}catch(e){return 2.5}};
  const roundLoadLocal=(v,step)=>{try{return typeof roundLoad==='function'?roundLoad(v,step):Math.max(0,Math.round(v/step)*step)}catch(e){return Math.max(0,Math.round(v/step)*step)}};

  window.rirFromRpe=rirFromRpe;
  window.rpeFromRir=rpeFromRir;

  function sameExercise(e,base,sourceId){
    if(sourceId&&String(e?.sourceId||'')===String(sourceId))return true;
    return baseName(e?.n).toLowerCase()===String(base||'').toLowerCase();
  }

  function latestExerciseRows(base,sourceId){
    const sessions=Array.isArray(window.st?.sessions)?window.st.sessions:[];
    for(let i=sessions.length-1;i>=0;i--){
      const s=sessions[i],rows=[];
      (s?.ex||[]).forEach(e=>{
        if(e?.mode==='cardio'||!sameExercise(e,base,sourceId))return;
        (e.set||[]).forEach(x=>{
          if(!x?.ok||!(Number(x.w)>0)||!(Number(x.r)>0))return;
          let rpe=num(x.rpe),rir=num(x.rir);
          if(rpe==null&&rir!=null)rpe=rpeFromRir(rir);
          if(rir==null&&rpe!=null)rir=rirFromRpe(rpe);
          if(rpe==null){rpe=num(e.target)??num(s.target)??8;rir=rirFromRpe(rpe)}
          rows.push({w:Number(x.w),r:Number(x.r),rpe,rir,date:s.date,target:num(e.target)??num(s.target)??8});
        });
      });
      if(rows.length)return rows;
    }
    return [];
  }

  function capacityFromRows(rows){
    const estimates=(rows||[]).map(x=>{
      const rir=num(x.rir)??rirFromRpe(x.rpe)??2;
      return x.w*(1+(x.r+rir)/30);
    }).filter(v=>Number.isFinite(v)&&v>0);
    const e1rm=median(estimates);
    if(!e1rm)return null;
    const rpes=(rows||[]).map(x=>num(x.rpe)).filter(v=>v!=null);
    return {e1rm,avgRpe:rpes.length?round1(rpes.reduce((a,b)=>a+b,0)/rpes.length):null,rows};
  }

  function targetWeight(e1rm,reps,targetRpe,step){
    reps=Math.max(1,Number(reps)||1);
    const targetRir=rirFromRpe(targetRpe)??2;
    const raw=e1rm/(1+(reps+targetRir)/30);
    return roundLoadLocal(Math.max(0,raw),step||2.5);
  }

  function groupCurrentEntries(s){
    if(typeof groupIndexedEntries==='function')return groupIndexedEntries(s?.ex||[]);
    return (s?.ex||[]).map((e,i)=>({indices:[i],entries:[e],base:baseName(e.n)}));
  }

  function applyAdaptiveLoads(){
    const s=window.st?.current;
    if(!s||s.adaptiveEffortV2Applied||!Array.isArray(s.ex))return 0;
    let changed=0;
    groupCurrentEntries(s).forEach(group=>{
      const entries=group.entries||[];
      if(!entries.length||entries.every(e=>e.mode==='cardio'))return;
      const first=entries[0],base=group.base||baseName(first.n),sourceId=first.sourceId||null;
      const hist=latestExerciseRows(base,sourceId),cap=capacityFromRows(hist);
      if(!cap)return;
      const target=num(first.target)??num(s.target)??8,targetRir=rirFromRpe(target),step=stepFor(base,sourceId);
      const sets=[];
      entries.forEach(e=>(e.set||[]).forEach(x=>sets.push({e,x})));
      const ref=sets.find(z=>Number(z.x?.w)>0&&Number(z.x?.r)>0);
      let ratio=null;
      if(ref){
        const wanted=targetWeight(cap.e1rm,ref.x.r,target,step),planned=Number(ref.x.w)||0;
        if(planned>0&&wanted>0)ratio=clamp(wanted/planned,.80,1.20);
      }
      let groupChanged=false;
      sets.forEach(({e,x})=>{
        if(!x||!(Number(x.r)>0))return;
        const planned=Number(x.w)||0;
        if(x.plannedW==null)x.plannedW=planned;
        let next=planned;
        if(planned>0&&ratio!=null)next=roundLoadLocal(planned*ratio,step);
        else if(planned<=0)next=targetWeight(cap.e1rm,x.r,num(e.target)??target,step);
        if(next>0&&Math.abs(next-planned)>=Math.max(.1,step*.45)){
          x.w=next;groupChanged=true;changed++;
        }
        if(x.rir==null||x.rir==='')x.targetRir=rirFromRpe(num(e.target)??target);
      });
      if(groupChanged){
        entries.forEach(e=>e.adaptiveEffort={e1rm:round1(cap.e1rm),avgRpe:cap.avgRpe,targetRpe:target,targetRir,ratio:ratio==null?null:round1(ratio),sourceDate:hist[0]?.date||'',mode:'actual-capacity'});
      }
    });
    s.adaptiveEffortV2Applied=true;s.adaptiveEffortV2At=new Date().toISOString();
    try{save()}catch(e){}
    return changed;
  }
  window.applyAdaptiveLoads=applyAdaptiveLoads;

  // Новая рекомендация учитывает фактический вес, повторы и RPE/RIR последней выполненной тренировки.
  const oldSuggestion=window.suggestionFor;
  window.suggestionFor=function(base,sourceId=null,target=8){
    const rows=latestExerciseRows(base,sourceId),cap=capacityFromRows(rows);
    if(!cap)return typeof oldSuggestion==='function'?oldSuggestion.apply(this,arguments):null;
    const reps=Math.max(1,Math.round(median(rows.map(x=>x.r))||rows[0]?.r||8)),step=stepFor(base,sourceId);
    const weight=targetWeight(cap.e1rm,reps,target,step),from=Math.max(...rows.map(x=>x.w||0));
    return {weight,delta:round1(weight-from),avg:cap.avgRpe,step,from,e1rm:round1(cap.e1rm),targetRir:rirFromRpe(target),reps,model:'RPE/RIR'};
  };
  try{suggestionFor=window.suggestionFor}catch(e){}

  window.editEffort=function(ei,si,kind,value){
    const x=window.st?.current?.ex?.[ei]?.set?.[si];if(!x)return;
    const raw=String(value??'').trim().replace(',','.');
    if(raw===''){x.rpe='';x.rir=''}
    else if(kind==='rir'){
      const rir=clamp(Number(raw)||0,0,10);x.rir=round1(rir);x.rpe=rpeFromRir(rir);
    }else{
      const rpe=clamp(Number(raw)||0,0,10);x.rpe=round1(rpe);x.rir=rirFromRpe(rpe);
    }
    try{save()}catch(e){}
    document.querySelectorAll(`[data-effort-ei="${ei}"][data-effort-si="${si}"]`).forEach(el=>{
      el.value=el.dataset.effortKind==='rir'?(x.rir??''):(x.rpe??'');
    });
  };

  window.startCardioWorkTimer=function(ei,si,min){
    const m=Math.max(0,Number(min)||0);if(!m)return typeof toast==='function'?toast('Укажи время'):undefined;
    const s=window.st?.current,x=s?.ex?.[ei]?.set?.[si];
    if(x){x.workTimerStartedAt=Date.now();x.workTimerSec=Math.round(m*60);try{save()}catch(e){}}
    if(typeof timer==='function')timer(Math.round(m*60));
  };

  function parseSetIndex(input){
    const raw=input?.getAttribute('onchange')||'';
    const m=raw.match(/editSet\((\d+)\s*,\s*(\d+)\s*,\s*['\"]rpe['\"]/);
    return m?{ei:Number(m[1]),si:Number(m[2])}:null;
  }

  function addRirToCard(card,group){
    if(!card||!group||group.entries?.every(e=>e.mode==='cardio'))return;
    const target=num(group.entries?.[0]?.target)??num(window.st?.current?.target)??8,targetRir=rirFromRpe(target);
    const head=card.querySelector('.sethead:not(.cardiohead)');
    if(head&&!head.classList.contains('effort-head')){
      head.classList.add('effort-head');
      const spans=[...head.children],last=spans.at(-1),rir=document.createElement('span');rir.textContent='RIR';rir.className='rir-head';
      if(last)head.insertBefore(rir,last);else head.appendChild(rir);
    }
    card.querySelectorAll('.setrow:not(.cardiorow)').forEach(row=>{
      const inputs=[...row.querySelectorAll('input')],rpeInput=inputs.find(i=>(i.getAttribute('onchange')||'').includes("'rpe'"))||inputs[2];
      const idx=parseSetIndex(rpeInput);if(!idx)return;
      const x=window.st?.current?.ex?.[idx.ei]?.set?.[idx.si];if(!x)return;
      row.classList.add('effort-row');
      rpeInput.dataset.effortEi=idx.ei;rpeInput.dataset.effortSi=idx.si;rpeInput.dataset.effortKind='rpe';
      rpeInput.setAttribute('onchange',`editEffort(${idx.ei},${idx.si},'rpe',this.value)`);
      if(!row.querySelector('input[data-effort-kind="rir"]')){
        const rir=document.createElement('input');rir.inputMode='decimal';rir.placeholder=String(targetRir??'');rir.value=x.rir??'';
        rir.dataset.effortEi=idx.ei;rir.dataset.effortSi=idx.si;rir.dataset.effortKind='rir';
        rir.setAttribute('onchange',`editEffort(${idx.ei},${idx.si},'rir',this.value)`);
        const check=row.querySelector('.check');if(check)row.insertBefore(rir,check);else row.appendChild(rir);
      }
    });
    const chips=card.querySelector('.chips.compact');
    if(chips&&!chips.querySelector('.rir-target-chip')){
      const chip=document.createElement('span');chip.className='chip rir-target-chip';chip.textContent=`RIR ${targetRir}`;chips.insertBefore(chip,chips.children[1]||null);
    }
    const meta=group.entries?.find(e=>e?.adaptiveEffort)?.adaptiveEffort;
    if(meta&&chips&&!chips.querySelector('.adaptive-load-chip')){
      const chip=document.createElement('span');chip.className='chip adaptive-load-chip';
      chip.textContent=`Авто · e1RM ${meta.e1rm} кг${meta.sourceDate?` · ${meta.sourceDate}`:''}`;chips.appendChild(chip);
    }
  }

  function addCardioTimer(card,group){
    if(!card||!group||!group.entries?.length||!group.entries.every(e=>e.mode==='cardio'))return;
    const first=group.entries[0],x=first?.set?.[0],min=Number(x?.min)||0;if(!min)return;
    let actions=card.querySelector('.head-actions');
    if(!actions){actions=document.createElement('div');actions.className='head-actions';card.querySelector('.row.between')?.appendChild(actions)}
    if(actions&&!actions.querySelector('.cardio-work-timer')){
      const b=document.createElement('button');b.type='button';b.className='btn tiny cardio-work-timer';b.textContent=`▶ ${min}:00`;
      const ei=group.indices?.[0]??0;b.setAttribute('onclick',`startCardioWorkTimer(${ei},0,${min})`);actions.prepend(b);
    }
  }

  function enhanceProgramRir(){
    const rpe=document.getElementById('pmRpe');if(!rpe||document.getElementById('pmRir'))return;
    const field=rpe.closest('.field');if(!field)return;
    const box=document.createElement('div');box.className='field';box.innerHTML=`<label>RIR</label><input id="pmRir" type="number" min="0" max="10" step="0.5" inputmode="decimal" value="${rirFromRpe(rpe.value??8)??2}"><div class="rir-help">RPE и RIR связаны: RPE 8 = RIR 2.</div>`;
    field.after(box);
    const rir=box.querySelector('#pmRir');
    const syncFromRpe=()=>{const v=num(rpe.value);if(v!=null)rir.value=rirFromRpe(v)};
    const syncFromRir=()=>{const v=num(rir.value);if(v!=null)rpe.value=rpeFromRir(v)};
    rpe.addEventListener('input',syncFromRpe);rir.addEventListener('input',syncFromRir);
  }

  function addRirChips(root=document){
    root.querySelectorAll?.('.chip').forEach(ch=>{
      if(ch.classList.contains('rir-target-chip')||ch.dataset.rirPatched)return;
      const m=(ch.textContent||'').trim().match(/^RPE\s*([0-9]+(?:[.,][0-9]+)?)$/i);if(!m)return;
      const parent=ch.parentElement;if(!parent||parent.querySelector('.rir-auto-label'))return;
      const rpe=Number(m[1].replace(',','.')),rir=rirFromRpe(rpe),x=document.createElement('span');x.className='chip rir-auto-label';x.textContent=`RIR ${rir}`;ch.after(x);ch.dataset.rirPatched='1';
    });
  }

  function enhanceWorkout(){
    const s=window.st?.current;if(!s)return;
    applyAdaptiveLoads();
    const root=document.getElementById('start');if(!root)return;
    const groups=groupCurrentEntries(s),cards=[...root.querySelectorAll('.exercise')];
    cards.forEach((card,i)=>{const g=groups[i];if(!g)return;addRirToCard(card,g);addCardioTimer(card,g)});
    const muted=root.querySelector('.workout-head .muted');
    if(muted&&/RPE\s*[0-9]/i.test(muted.textContent||'')&&!/RIR/i.test(muted.textContent||''))muted.textContent+=(muted.textContent.trim()?' · ':'')+`RIR ${rirFromRpe(s.target??8)}`;
    addRirChips(root);
  }
  window.enhanceAdaptiveWorkout=enhanceWorkout;

  const baseStartPage=window.startPage;
  if(typeof baseStartPage==='function'&&!baseStartPage.__adaptiveEffortV2){
    const wrapped=function(){applyAdaptiveLoads();const r=baseStartPage.apply(this,arguments);requestAnimationFrame(enhanceWorkout);return r};
    wrapped.__adaptiveEffortV2=true;window.startPage=wrapped;try{startPage=wrapped}catch(e){}
  }

  const basePlanPage=window.planPage;
  if(typeof basePlanPage==='function'&&!basePlanPage.__rirLabels){
    const wrapped=function(){const r=basePlanPage.apply(this,arguments);requestAnimationFrame(()=>addRirChips(document.getElementById('plan')||document));return r};
    wrapped.__rirLabels=true;window.planPage=wrapped;try{planPage=wrapped}catch(e){}
  }

  const observer=new MutationObserver(()=>{enhanceProgramRir();if(document.getElementById('start')?.classList.contains('active'))requestAnimationFrame(enhanceWorkout);addRirChips(document)});
  observer.observe(document.body,{subtree:true,childList:true});
  [0,120,400,900,1800].forEach(t=>setTimeout(()=>{enhanceProgramRir();enhanceWorkout();addRirChips(document)},t));
})();
