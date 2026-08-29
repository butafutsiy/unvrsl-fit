'use strict';
(()=>{
  if(window.__unvrslUnifiedTrainingV174)return;
  window.__unvrslUnifiedTrainingV174=true;

  const css=document.createElement('style');
  css.id='unvrsl-unified-training-v174-style';
  css.textContent=`
    #start .exercise:not(.anton-superset):not(.anton-single) .sethead,
    #start .exercise:not(.anton-superset):not(.anton-single) .setrow{
      grid-template-columns:24px minmax(54px,1fr) minmax(48px,.78fr) minmax(43px,.64fr) minmax(40px,.58fr) 32px!important;
      column-gap:4px!important
    }
    #start .exercise:not(.anton-superset):not(.anton-single) .sethead{font-size:9.5px!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .setrow input{min-height:37px!important;padding:6px 2px!important;font-size:13.5px!important;border-radius:11px!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .check{width:32px!important;height:32px!important;min-width:32px!important;border-radius:11px!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .prev-set{margin-left:28px!important;font-size:10px!important}
    #start .unvrsl-auto-load{display:inline-flex;align-items:center;gap:4px;margin-top:5px;padding:4px 7px;border-radius:999px;background:rgba(48,209,88,.11);color:var(--green);font-size:10.5px;font-weight:720}
    .unvrsl174-summary{margin-top:12px}.unvrsl174-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.unvrsl174-stat{background:#202023;border:1px solid #2e2e33;border-radius:17px;padding:12px}.unvrsl174-stat span{display:block;color:#8e8e93;font-size:11px}.unvrsl174-stat b{display:block;margin-top:4px;font-size:20px}.unvrsl174-rec{padding:12px 0;border-bottom:1px solid #303034}.unvrsl174-rec:last-child{border-bottom:0}.unvrsl174-rec .next{color:var(--green);font-weight:800}.unvrsl174-rec .meta{color:#8e8e93;font-size:11px;margin-top:4px;line-height:1.35}
    @media(max-width:370px){
      #start .exercise:not(.anton-superset):not(.anton-single) .sethead,
      #start .exercise:not(.anton-superset):not(.anton-single) .setrow{grid-template-columns:22px minmax(48px,1fr) minmax(43px,.75fr) minmax(40px,.6fr) minmax(38px,.56fr) 30px!important;column-gap:3px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .setrow input{font-size:12.5px!important;min-height:35px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .check{width:30px!important;height:30px!important;min-width:30px!important}
    }
  `;
  document.head.appendChild(css);

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const num=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const round1=v=>Math.round(v*10)/10;
  const rirFromRpe=v=>{const n=num(v);return n==null?null:round1(clamp(10-n,0,10))};
  const rpeFromRir=v=>{const n=num(v);return n==null?null:round1(clamp(10-n,0,10))};
  const median=a=>{const x=a.filter(Number.isFinite).sort((p,q)=>p-q);if(!x.length)return null;const m=Math.floor(x.length/2);return x.length%2?x[m]:(x[m-1]+x[m])/2};
  const state=()=>{try{if(typeof st!=='undefined'){window.st=st;return st}}catch(e){}return window.st||null};
  const saveState=()=>{try{if(typeof save==='function')save()}catch(e){}};
  const baseName=n=>{try{return typeof baseExerciseName==='function'?baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim()}catch(e){return String(n||'')}};
  const stepFor=(base,sourceId)=>{try{return typeof loadStepFor==='function'?loadStepFor(base,sourceId):2.5}catch(e){return 2.5}};
  const roundLoadLocal=(v,step)=>{try{return typeof roundLoad==='function'?roundLoad(v,step):Math.max(0,Math.round(v/step)*step)}catch(e){return Math.max(0,Math.round(v/step)*step)}};
  const sameExercise=(e,base,sourceId)=>sourceId&&String(e?.sourceId||'')===String(sourceId)||baseName(e?.n).toLowerCase()===String(base||'').toLowerCase();

  function actualEffort(x){
    let rpe=num(x?.rpe),rir=num(x?.rir);
    if(rpe==null&&rir!=null)rpe=rpeFromRir(rir);
    if(rir==null&&rpe!=null)rir=rirFromRpe(rpe);
    if(rpe==null||rir==null)return null;
    return {rpe,rir};
  }
  function latestRows(base,sourceId,excludeId=null){
    const s=state(),sessions=Array.isArray(s?.sessions)?s.sessions:[];
    for(let i=sessions.length-1;i>=0;i--){
      const ses=sessions[i];if(excludeId&&String(ses?.id)===String(excludeId))continue;
      const rows=[];
      (ses?.ex||[]).forEach(e=>{
        if(e?.mode==='cardio'||!sameExercise(e,base,sourceId))return;
        (e.set||[]).forEach(x=>{
          if(!x?.ok||!(num(x.w)>0)||!(num(x.r)>0))return;
          const effort=actualEffort(x);if(!effort)return;
          rows.push({w:num(x.w),r:num(x.r),rpe:effort.rpe,rir:effort.rir,date:ses.date});
        });
      });
      if(rows.length)return rows;
    }
    return [];
  }
  function capacity(rows){
    const vals=(rows||[]).map(x=>x.w*(1+(x.r+x.rir)/30)).filter(v=>Number.isFinite(v)&&v>0).sort((a,b)=>b-a).slice(0,5);
    return median(vals);
  }
  function predict(e1rm,reps,targetRpe,step){
    if(!(e1rm>0)||!(reps>0))return null;
    const rir=rirFromRpe(targetRpe);if(rir==null)return null;
    return roundLoadLocal(e1rm/(1+(Number(reps)+rir)/30),step||2.5);
  }

  function applyAdaptiveCurrent(){
    const s=state(),cur=s?.current;if(!cur||cur.unvrslAdaptive174Applied)return false;
    let changed=false;
    (cur.ex||[]).forEach(e=>{
      if(e?.mode==='cardio')return;
      const base=baseName(e.n),sourceId=e.sourceId||null,rows=latestRows(base,sourceId,cur.id),e1=capacity(rows);
      if(!e1)return;
      const target=num(e.target)??num(cur.target)??8,step=stepFor(base,sourceId);
      let any=false;
      (e.set||[]).forEach(x=>{
        const reps=num(x.r),planned=num(x.w)||0;if(!(reps>0))return;
        let wanted=predict(e1,reps,target,step);if(!(wanted>0))return;
        if(planned>0)wanted=roundLoadLocal(clamp(wanted,planned*.80,planned*1.15),step);
        if(x.plannedW==null)x.plannedW=planned;
        x.adaptiveSuggestedW=wanted;
        if(wanted>0&&Math.abs(wanted-planned)>=Math.max(.1,step*.45)){x.w=wanted;changed=true;any=true}
      });
      if(any||rows.length)e.unvrslAdaptive174={e1rm:round1(e1),targetRpe:target,targetRir:rirFromRpe(target),sourceDate:rows[0]?.date||''};
    });
    cur.unvrslAdaptive174Applied=true;
    saveState();
    return changed;
  }

  function parseEffortIndex(input){
    const raw=input?.getAttribute('onchange')||'';
    let m=raw.match(/editSet\((\d+)\s*,\s*(\d+)\s*,\s*['\"]rpe['\"]/);
    if(!m)m=raw.match(/editEffort\((\d+)\s*,\s*(\d+)/);
    return m?{ei:Number(m[1]),si:Number(m[2])}:null;
  }
  window.unvrslEditEffort174=function(ei,si,kind,value){
    const s=state(),x=s?.current?.ex?.[ei]?.set?.[si];if(!x)return;
    const v=num(value);
    if(v==null){x.rpe='';x.rir=''}
    else if(kind==='rir'){x.rir=round1(clamp(v,0,10));x.rpe=rpeFromRir(x.rir)}
    else{x.rpe=round1(clamp(v,0,10));x.rir=rirFromRpe(x.rpe)}
    saveState();
    document.querySelectorAll(`[data-u174-ei="${ei}"][data-u174-si="${si}"]`).forEach(el=>el.value=el.dataset.u174Kind==='rir'?(x.rir??''):(x.rpe??''));
  };

  function enhanceWorkoutDom(){
    const s=state(),cur=s?.current;if(!cur)return;
    document.querySelectorAll('#start .exercise:not(.anton-superset):not(.anton-single)').forEach(card=>{
      const head=card.querySelector('.sethead:not(.cardiohead)');
      if(!head)return;
      if(!head.querySelector('.u174-rir-head')){
        const last=head.lastElementChild,sp=document.createElement('span');sp.className='u174-rir-head';sp.textContent='RIR';head.insertBefore(sp,last);
      }
      card.querySelectorAll('.setrow:not(.cardiorow)').forEach(row=>{
        const rpe=[...row.querySelectorAll('input')].find(i=>(i.getAttribute('onchange')||'').includes("'rpe'"))||row.querySelectorAll('input')[2];
        const idx=parseEffortIndex(rpe);if(!rpe||!idx)return;
        const x=cur.ex?.[idx.ei]?.set?.[idx.si];if(!x)return;
        rpe.dataset.u174Ei=idx.ei;rpe.dataset.u174Si=idx.si;rpe.dataset.u174Kind='rpe';
        rpe.setAttribute('onchange',`unvrslEditEffort174(${idx.ei},${idx.si},'rpe',this.value)`);
        if(!row.querySelector('.u174-rir-input')){
          const rir=document.createElement('input');rir.className='u174-rir-input';rir.inputMode='decimal';rir.value=x.rir??'';rir.placeholder=String(rirFromRpe(cur.ex?.[idx.ei]?.target??cur.target??8)??'');
          rir.dataset.u174Ei=idx.ei;rir.dataset.u174Si=idx.si;rir.dataset.u174Kind='rir';rir.setAttribute('onchange',`unvrslEditEffort174(${idx.ei},${idx.si},'rir',this.value)`);
          row.insertBefore(rir,row.querySelector('.check'));
        }
      });
      card.querySelectorAll('.chip').forEach(ch=>{if(/^RIR\s/i.test((ch.textContent||'').trim()))ch.remove()});
      const firstInput=card.querySelector('.setrow input');const idx=parseEffortIndex([...card.querySelectorAll('.setrow input')].find(i=>(i.getAttribute('onchange')||'').includes('rpe')));
      const e=idx?cur.ex?.[idx.ei]:null;
      if(e?.unvrslAdaptive174&&!card.querySelector('.unvrsl-auto-load')){
        const chip=document.createElement('div');chip.className='unvrsl-auto-load';chip.textContent=`Автовес · e1RM ${e.unvrslAdaptive174.e1rm} кг · цель RPE ${e.unvrslAdaptive174.targetRpe}`;
        (card.querySelector('.rule-line')||card.querySelector('.exname'))?.insertAdjacentElement('afterend',chip);
      }
    });
  }

  function metrics(s){
    let ton=0,sets=0,rpes=[],rirs=[];
    (s?.ex||[]).forEach(e=>(e.set||[]).forEach(x=>{if(!x?.ok)return;sets++;if(e?.mode!=='cardio')ton+=(num(x.w)||0)*(num(x.r)||0);const ef=actualEffort(x);if(ef){rpes.push(ef.rpe);rirs.push(ef.rir)}}));
    const duration=Math.max(0,(num(s?.ended)||Date.now())-(num(s?.started)||Date.now()));
    return{ton:Math.round(ton),sets,duration,avgRpe:rpes.length?round1(rpes.reduce((a,b)=>a+b,0)/rpes.length):null,avgRir:rirs.length?round1(rirs.reduce((a,b)=>a+b,0)/rirs.length):null};
  }
  function fmtDuration(ms){const t=Math.max(0,Math.floor(ms/1000)),h=Math.floor(t/3600),m=Math.floor(t%3600/60),sec=t%60,p=n=>String(n).padStart(2,'0');return h?`${h}:${p(m)}:${p(sec)}`:`${p(m)}:${p(sec)}`}
  function recommendations(s){
    const seen=new Set(),out=[];
    (s?.ex||[]).forEach(e=>{
      if(e?.mode==='cardio')return;
      const base=baseName(e.n).toLowerCase(),key=(e.sourceId?`id:${e.sourceId}`:`n:${base}`);if(seen.has(key))return;seen.add(key);
      const rows=[];(s.ex||[]).filter(z=>sameExercise(z,baseName(e.n),e.sourceId||null)).forEach(z=>(z.set||[]).forEach(x=>{if(!x?.ok||!(num(x.w)>0)||!(num(x.r)>0))return;const ef=actualEffort(x);if(ef)rows.push({w:num(x.w),r:num(x.r),rpe:ef.rpe,rir:ef.rir})}));
      const e1=capacity(rows);if(!e1)return;
      const reps=Math.max(1,Math.round(median(rows.map(x=>x.r))||rows[0].r)),target=num(e.target)??num(s.target)??8,step=stepFor(baseName(e.n),e.sourceId||null),next=predict(e1,reps,target,step);
      if(!(next>0))return;
      const last=rows.slice().sort((a,b)=>b.w-a.w)[0];out.push({name:baseName(e.n),next,reps,target,e1:round1(e1),last});
    });
    return out;
  }
  function summaryHtml(s){
    const m=metrics(s),recs=recommendations(s);
    return `<div class="unvrsl174-summary"><div class="section">АНАЛИЗ ТРЕНИРОВКИ</div><div class="unvrsl174-grid"><div class="unvrsl174-stat"><span>Длительность</span><b>${fmtDuration(m.duration)}</b></div><div class="unvrsl174-stat"><span>Тоннаж</span><b>${m.ton.toLocaleString('ru-RU')} кг</b></div><div class="unvrsl174-stat"><span>Подходов</span><b>${m.sets}</b></div><div class="unvrsl174-stat"><span>Средний RPE / RIR</span><b>${m.avgRpe??'—'} / ${m.avgRir??'—'}</b></div></div><div class="section">СЛЕДУЮЩИЙ ОРИЕНТИР</div><div class="card">${recs.length?recs.map(r=>`<div class="unvrsl174-rec"><div class="row between"><b>${typeof esc==='function'?esc(r.name):r.name}</b><span class="next">${r.next} кг</span></div><div class="meta">${r.reps} повт. · цель RPE ${r.target} · e1RM ≈ ${r.e1} кг${r.last?` · прошлый факт ${r.last.w}×${r.last.r} @RPE ${r.last.rpe}`:''}</div></div>`).join(''):'<div class="muted">Заполняй RPE или RIR в рабочих подходах, и здесь появится точный ориентир веса.</div>'}</div></div>`;
  }

  function installStart(){
    let base=null;try{if(typeof startPage==='function')base=startPage}catch(e){};if(!base)base=window.startPage;
    if(typeof base!=='function'||base.__u174)return false;
    const wrapped=function(){applyAdaptiveCurrent();const r=base.apply(this,arguments);requestAnimationFrame(enhanceWorkoutDom);return r};
    wrapped.__u174=true;window.startPage=wrapped;try{startPage=wrapped}catch(e){};return true;
  }
  function installSummary(){
    let base=null;try{if(typeof summary==='function')base=summary}catch(e){};if(!base)base=window.summary;
    if(typeof base!=='function'||base.__u174)return false;
    const wrapped=function(s){const r=base.apply(this,arguments);setTimeout(()=>{const sh=document.getElementById('sheet');if(sh&&!sh.querySelector('.unvrsl174-summary'))sh.insertAdjacentHTML('beforeend',summaryHtml(s))},35);return r};
    wrapped.__u174=true;window.summary=wrapped;try{summary=wrapped}catch(e){};return true;
  }
  function install(){installStart();installSummary();state()}
  install();let n=0;const timer=setInterval(()=>{install();if(++n>160)clearInterval(timer)},150);
  setTimeout(()=>{applyAdaptiveCurrent();enhanceWorkoutDom()},800);
})();
