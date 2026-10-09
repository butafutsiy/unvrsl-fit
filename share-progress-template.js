'use strict';
(()=>{
  const W=window,D=document,A=W.WorkoutDomain,REV=264;
  if(W.__unvrslShareProgressV264)return;
  W.__unvrslShareProgressV264=true;
  W.__unvrslShareProgressV263=true;
  W.__unvrslShareProgressV262=true;

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const fmt=v=>{const n=N(v);return n==null?'–':new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n)};
  const plain=v=>String(fmt(v)).replace(/\u00a0/g,' ');
  const baseName=n=>typeof W.baseExerciseName==='function'?W.baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim();
  const norm=n=>baseName(n).toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/gi,' ').trim();
  const sessionTime=s=>{for(const value of [s?.started,s?.startedAt,s?.date,s?.ended,s?.endedAt]){if(typeof value==='number'&&Number.isFinite(value))return value;const n=Number(value);if(Number.isFinite(n)&&n>1e11)return n;const parsed=typeof value==='string'?Date.parse(value):NaN;if(Number.isFinite(parsed))return parsed}return 0};
  const sessionTitle=s=>[s?.c,s?.name].filter(Boolean).join(' · ')||s?.programName||s?.name||s?.c||'Тренировка';
  const dateText=s=>{const raw=s?.date||s?.endedAt||s?.ended||Date.now();try{const d=typeof raw==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(raw)?new Date(raw+'T12:00:00'):new Date(raw);return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(d)}catch(_){return String(raw||'')}};
  const durationMs=s=>{const direct=[s?.advancedMetrics?.duration,s?.finalDurationMs,s?.durationMs].map(N).find(x=>x!=null&&x>=0);if(direct!=null)return direct;const a=N(s?.started),b=N(s?.ended);if(a!=null&&b!=null&&b>=a)return b-a;const a2=Date.parse(s?.startedAt||s?.start||''),b2=Date.parse(s?.endedAt||s?.end||'');return Number.isFinite(a2)&&Number.isFinite(b2)&&b2>=a2?b2-a2:0};
  const durationText=s=>{const t=Math.max(0,Math.floor(durationMs(s)/1000)),h=Math.floor(t/3600),m=Math.floor((t%3600)/60),r=t%60,p=n=>String(n).padStart(2,'0');return h?`${h}:${p(m)}:${p(r)}`:`${m}:${p(r)}`};
  const setRpe=x=>{let p=N(x?.rpe),r=N(x?.rir);if(p==null&&r!=null)p=10-r;return p};
  const e1rm=z=>z.w>0&&z.reps>0?z.w*(1+(z.reps+clamp(10-(z.rpe??8),0,10))/30):0;

  function completedStrength(s){
    return (s?.ex||[]).flatMap(e=>{
      if(e?.mode==='cardio')return[];
      return (e.set||[]).filter(x=>A.complete(e,x,workoutRegistry)).map(x=>({
        e,x,name:baseName(e.n),key:String(e.sourceId||norm(e.n))+'|'+String(x.equipmentProfileId||e.equipmentProfileId||e.equipmentProfile?.id||''),sourceId:e.sourceId||null,
        w:N(x.w)||0,reps:N(x.actualReps??x.r)||0,rpe:setRpe(x),rir:N(x.actualRir??x.rir)??(setRpe(x)==null?null:Math.max(0,10-setRpe(x)))
      }))
    })
  }
  const tonnage=s=>{const saved=N(s?.advancedMetrics?.tonnage);return saved!=null&&saved>0?Math.round(saved):Math.round(completedStrength(s).reduce((a,z)=>a+z.w*z.reps,0))};
  const setCount=s=>completedStrength(s).length;
  const avgRpe=s=>{const a=completedStrength(s).map(z=>z.rpe).filter(Number.isFinite);return a.length?Math.round(a.reduce((q,x)=>q+x,0)/a.length*10)/10:null};
  const bestSet=s=>completedStrength(s).filter(z=>z.w>0&&z.reps>0).sort((a,b)=>e1rm(b)-e1rm(a))[0]||null;

  function exerciseRows(s){
    const map=new Map();
    for(const z of completedStrength(s)){
      const k=z.key;
      if(!map.has(k))map.set(k,{key:k,name:z.name,sets:[],volume:0,best:null});
      const row=map.get(k);row.sets.push(z);row.volume+=z.w*z.reps;
      if(!row.best||e1rm(z)>e1rm(row.best))row.best=z;
    }
    return [...map.values()].map(r=>({
      ...r,volume:Math.round(r.volume),line:r.sets.map(z=>`${fmt(z.w)}×${fmt(z.reps)}${z.rpe!=null?` @${fmt(z.rpe)}`:''}`).join(' · ')
    }))
  }

  function exerciseKeySet(s){return new Set(exerciseRows(s).map(x=>x.key))}
  function overlapRatio(a,b){const A=exerciseKeySet(a),B=exerciseKeySet(b);if(!A.size||!B.size)return 0;let common=0;for(const k of A)if(B.has(k))common++;return common/Math.max(A.size,B.size)}
  function exactSignature(s){return `${String(s?.programName||'').trim().toLowerCase()}|${String(s?.c||'').trim().toLowerCase()}|${String(s?.name||'').trim().toLowerCase()}`}
  function previousComparable(s){
    const hist=(W.st?.sessions||[]).filter(x=>x?.ended&&String(x?.id||'')!==String(s?.id||'')&&(!sessionTime(s)||sessionTime(x)<sessionTime(s))&&setCount(x)>0).sort((a,b)=>sessionTime(a)-sessionTime(b));
    const sig=exactSignature(s);
    for(let i=hist.length-1;i>=0;i--)if(exactSignature(hist[i])===sig)return{session:hist[i],overlap:overlapRatio(s,hist[i]),exact:true};
    let best=null;
    for(let i=hist.length-1;i>=0;i--){
      const x=hist[i],sameDay=String(x?.c||'').trim().toLowerCase()===String(s?.c||'').trim().toLowerCase(),ov=overlapRatio(s,x);
      if(sameDay&&ov>=.7){best={session:x,overlap:ov,exact:false};break}
    }
    return best;
  }

  function bestByExercise(s){
    const out=new Map();
    for(const z of completedStrength(s)){
      const prev=out.get(z.key);if(!prev||e1rm(z)>e1rm(prev))out.set(z.key,z)
    }
    return out
  }
  function strongestSameExerciseChange(s,p){
    if(!p)return null;const cur=bestByExercise(s),prev=bestByExercise(p);let best=null;
    for(const [k,z] of cur){const q=prev.get(k);if(!q||e1rm(q)<=0)continue;const pct=(e1rm(z)-e1rm(q))/e1rm(q)*100;if(pct<.5)continue;if(!best||pct>best.pct)best={name:z.name,pct,current:e1rm(z),previous:e1rm(q),set:z}}
    return best
  }

  function progressItems(s){
    const cmp=previousComparable(s),p=cmp?.session||null,out=[],ct=tonnage(s),cr=avgRpe(s),strength=strongestSameExerciseChange(s,p),best=bestSet(s);
    if(p&&tonnage(p)>0&&ct>0){
      const d=(ct-tonnage(p))/tonnage(p)*100;
      if(Math.abs(d)>=.5)out.push({icon:d>0?'↗':'↘',title:`${d>0?'+':''}${fmt(d)}% тоннажа`,sub:`${plain(ct)} против ${plain(tonnage(p))} кг`});
    }else if(ct>0)out.push({icon:'◇',title:`${plain(ct)} кг объёма`,sub:'точка отсчёта для сравнения'});
    if(strength)out.push({icon:'↑',title:`+${fmt(strength.pct)}% расчётного 1ПМ`,sub:strength.name});
    if(cr!=null)out.push({icon:'●',title:`RPE ${fmt(cr)}`,sub:cr>=9?'высокая интенсивность':cr>=8?'рабочая интенсивность':'умеренная интенсивность'});
    if(out.length<3&&best)out.push({icon:'★',title:`Лучший сет ${fmt(best.w)}×${fmt(best.reps)}`,sub:`${best.name} · 1ПМ ≈ ${fmt(e1rm(best))} кг`});
    if(out.length<3)out.push({icon:'•',title:`${setCount(s)} рабочих подходов`,sub:p?`${Math.abs(setCount(s)-setCount(p))} разница с прошлой тренировкой`:'объём текущей тренировки'});
    return out.slice(0,3)
  }

  function historyForExercise(s,z){
    const sessions=(W.st?.sessions||[]).filter(x=>x?.ended&&String(x?.id||'')!==String(s?.id||'')&&(!sessionTime(s)||sessionTime(x)<sessionTime(s)));const a=[];
    for(const sess of sessions)for(const q of completedStrength(sess))if(q.key===z.key)a.push(q);
    return a
  }
  function realRecords(s){
    const byEx=new Map();
    for(const z of completedStrength(s).filter(x=>x.w>0&&x.reps>0&&A.method(x.e,x.x)==='STANDARD')){
      if(!byEx.has(z.key))byEx.set(z.key,[]);byEx.get(z.key).push(z)
    }
    const records=[];
    for(const [key,sets] of byEx){
      const hist=historyForExercise(s,sets[0]);if(!hist.length)continue;
      const histMaxW=Math.max(...hist.map(x=>x.w)),histMaxE=Math.max(...hist.map(e1rm));
      const currentBest=[...sets].sort((a,b)=>e1rm(b)-e1rm(a))[0],currentMaxW=Math.max(...sets.map(x=>x.w)),types=[];
      if(currentMaxW>histMaxW+.001)types.push({type:'weight',label:'Рекорд по весу',value:`${fmt(currentMaxW)} кг`,priority:90});
      if(String(currentBest.e.type||workoutRegistry.resolve(currentBest.e)?.type||'').toLowerCase()!=='isolation'&&e1rm(currentBest)>histMaxE+.4)types.push({type:'e1rm',label:'Расчётный 1ПМ',value:`${fmt(e1rm(currentBest))} кг`,priority:100});
      if(!types.length)continue;
      records.push({key,exercise:currentBest.name,set:`${fmt(currentBest.w)}×${fmt(currentBest.reps)}`,e1:e1rm(currentBest),types,priority:Math.max(...types.map(x=>x.priority))})
    }
    records.sort((a,b)=>b.priority-a.priority||b.e1-a.e1);
    return records
  }
  function recordData(s){
    const real=realRecords(s),best=bestSet(s);
    if(real.length){
      const hero=real[0],items=[];
      for(const r of real)for(const t of r.types)items.push({exercise:r.exercise,type:t.type,label:t.label,value:t.value,set:r.set,priority:t.priority});
      const uniq=[];const seen=new Set();for(const x of items.sort((a,b)=>b.priority-a.priority)){const k=`${norm(x.exercise)}|${x.type}`;if(!seen.has(k)){seen.add(k);uniq.push(x)}}
      return{hasRealPr:true,hero:{exercise:hero.exercise,label:'Новый рекорд',value:hero.set,e1:hero.e1},items:uniq.slice(0,3)}
    }
    if(best)return{hasRealPr:false,hero:{exercise:best.name,label:'Лучший результат тренировки',value:`${fmt(best.w)}×${fmt(best.reps)}`,e1:e1rm(best)},items:[]};
    return{hasRealPr:false,hero:null,items:[]}
  }

  function data(s){return{title:sessionTitle(s),date:dateText(s),time:durationText(s),tonnage:tonnage(s),sets:setCount(s),rpe:avgRpe(s),exercises:exerciseRows(s),best:bestSet(s),progress:progressItems(s),record:recordData(s)}}

  function installCss(){
    for(const id of ['share-progress-v262-style','share-progress-v263-style','share-progress-v264-style'])D.getElementById(id)?.remove();
    const el=D.createElement('style');el.id='share-progress-v264-style';el.textContent=`
.sp264{padding:0 0 4px}.sp264-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.sp264-head h2{margin:0;font-size:24px;line-height:1.08;letter-spacing:-.4px}.sp264-close{width:42px;height:42px;border-radius:14px;background:#2b2b2f;font-size:21px}.sp264-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;background:#202024;padding:4px;border-radius:14px;margin-bottom:13px}.sp264-tabs button{padding:10px 4px;border-radius:10px;color:#8e8e93;font-weight:800;font-size:12px}.sp264-tabs button.on{background:#3a3a40;color:#fff}.sp264-card{background:radial-gradient(circle at 92% 4%,rgba(191,90,242,.09),transparent 29%),linear-gradient(155deg,#111214,#090a0b);border:1px solid #34363b;border-radius:25px;padding:18px;box-shadow:0 18px 50px rgba(0,0,0,.35)}.sp264-top{display:flex;justify-content:space-between;gap:12px}.sp264-brand{font-weight:900;font-size:23px;letter-spacing:-.7px}.sp264-title{font-size:22px;font-weight:850;line-height:1.1;margin-top:11px;max-width:480px}.sp264-date{color:#8e8e93;margin-top:6px}.sp264-chips{display:flex;gap:7px;align-items:flex-start;flex-wrap:wrap;justify-content:flex-end}.sp264-chip{border:1px solid #34363b;border-radius:999px;padding:7px 10px;color:#a7a7ad;font-size:11px;white-space:nowrap}.sp264-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:17px}.sp264-metric{background:#1b1c20;border:1px solid #34363b;border-radius:17px;padding:12px 11px;min-width:0}.sp264-metric span{color:#8e8e93;font-size:11px;display:block}.sp264-metric b{font-size:20px;display:block;margin-top:5px;white-space:nowrap}.sp264-highlight{margin-top:14px;padding:14px;border-radius:18px;border:1px solid rgba(191,90,242,.48);background:rgba(191,90,242,.09)}.sp264-highlight small{color:#d696f5;font-weight:850}.sp264-highlight b{display:block;font-size:18px;margin-top:5px}.sp264-record-hero{text-align:center;padding:18px}.sp264-record-hero b{font-size:25px;line-height:1.15}.sp264-section{margin-top:14px;border:1px solid #34363b;background:#17181b;border-radius:19px;padding:14px}.sp264-section-title{font-size:14px;font-weight:850;margin-bottom:10px}.sp264-progress{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0}.sp264-p{padding:0 12px;border-right:1px solid #33363a;min-width:0}.sp264-p:first-child{padding-left:0}.sp264-p:last-child{border-right:0;padding-right:0}.sp264-p i{font-style:normal;font-size:18px;color:#d696f5}.sp264-p b{display:block;font-size:13px;margin-top:4px}.sp264-p small{display:block;color:#85858b;font-size:10px;margin-top:3px;line-height:1.25}.sp264-ex{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #303238}.sp264-ex:last-child{border-bottom:0;padding-bottom:0}.sp264-num{width:29px;height:29px;border-radius:50%;background:#252932;border:1px solid #3b465a;display:grid;place-items:center;font-size:12px;color:#d696f5;flex:0 0 auto}.sp264-ex b{display:block;font-size:14px}.sp264-ex span{display:block;color:#97979d;font-size:11px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sp264-records{display:grid;gap:8px;margin-top:12px}.sp264-record{background:#1a1b1f;border:1px solid #353943;border-radius:15px;padding:11px 12px}.sp264-record small{color:#8e8e93}.sp264-record b{display:block;margin-top:3px}.sp264-foot{text-align:center;color:#777;font-size:11px;margin-top:15px}.sp264-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:13px;position:sticky;bottom:calc(-26px - env(safe-area-inset-bottom));background:linear-gradient(transparent,#18181a 24%);padding:18px 0 calc(8px + env(safe-area-inset-bottom));z-index:4}.sp264-actions .btn{min-height:52px}.sp264-actions .primary{background:#bf5af2!important;color:#fff!important}.sp264-actions button[disabled]{opacity:.55}.sp264-status{grid-column:1/-1;text-align:center;color:#8e8e93;font-size:11px;min-height:15px}.sp264-record-note{margin-top:9px;color:#8e8e93;font-size:11px;text-align:center}@media(max-width:520px){.sp264-card{padding:15px;border-radius:22px}.sp264-brand{font-size:20px}.sp264-title{font-size:19px}.sp264-metrics{grid-template-columns:1fr 1fr}.sp264-metric b{font-size:19px}.sp264-progress{grid-template-columns:1fr}.sp264-p{border-right:0;border-bottom:1px solid #303238;padding:9px 0}.sp264-p:first-child{padding-top:0}.sp264-p:last-child{border-bottom:0;padding-bottom:0}}
`;el.textContent+=`#modal:has(.sp264){align-items:stretch;background:#09070d}#modal:has(.sp264) .sheet{height:100dvh;max-height:100dvh;max-width:none;border-radius:0;padding:0;overflow:hidden;background:#09070d}.sp264{height:100%;max-width:760px;margin:auto;display:flex;flex-direction:column;min-height:0;padding:calc(12px + env(safe-area-inset-top)) 16px calc(12px + env(safe-area-inset-bottom))}.sp264-head{flex:none}.sp264-tabs{flex:none}.sp264-preview{flex:1;min-height:0;display:grid;place-items:center;overflow:hidden;padding:0 2px 10px}.sp264-preview img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;border-radius:15px;box-shadow:0 14px 46px #0009}.sp264-actions{flex:none;position:static;background:#16111b;margin:0 -16px calc(-12px - env(safe-area-inset-bottom));padding:13px 16px calc(14px + env(safe-area-inset-bottom))}.sp264-actions .primary{background:#bf5af2!important;color:#190d20!important}.sp264-tabs button.on{background:#bf5af2;color:#190d20}`;D.head.appendChild(el)
  }

  const metrics=d=>[['Тоннаж',d.tonnage>0?`${fmt(d.tonnage)} кг`:'–'],['Средний RPE',d.rpe!=null?fmt(d.rpe):'–'],['Подходов',String(d.sets)],['Время',d.time]];
  function headerHtml(d){return `<div class="sp264-top"><div><div class="sp264-brand">UNVRSL FIT</div><div class="sp264-title">${esc(d.title)}</div><div class="sp264-date">${esc(d.date)}</div></div><div class="sp264-chips"><span class="sp264-chip">${d.exercises.length} упражнений</span>${d.rpe!=null?`<span class="sp264-chip">RPE ${fmt(d.rpe)}</span>`:''}</div></div><div class="sp264-metrics">${metrics(d).map(([a,b])=>`<div class="sp264-metric"><span>${a}</span><b>${b}</b></div>`).join('')}</div>`}
  function exercisesHtml(d,limit){if(!d.exercises.length)return'';return `<div class="sp264-section"><div class="sp264-section-title">Упражнения</div>${d.exercises.slice(0,limit).map((x,i)=>`<div class="sp264-ex"><div class="sp264-num">${i+1}</div><div style="min-width:0"><b>${esc(x.name)}</b><span>${esc(x.line)}</span></div></div>`).join('')}</div>`}
  function compactBody(d){return `${d.best?`<div class="sp264-highlight"><small>ЛУЧШИЙ СЕТ</small><b>${esc(d.best.name)} · ${fmt(d.best.w)}×${fmt(d.best.reps)}</b></div>`:''}${exercisesHtml(d,5)}`}
  function progressBody(d){return `<div class="sp264-section"><div class="sp264-section-title">Прогресс</div><div class="sp264-progress">${d.progress.map(x=>`<div class="sp264-p"><i>${esc(x.icon)}</i><b>${esc(x.title)}</b><small>${esc(x.sub)}</small></div>`).join('')}</div></div>${exercisesHtml(d,5)}`}
  function recordBody(d){const r=d.record;if(!r.hero)return `<div class="sp264-section"><div class="muted small">Нет силовых результатов для карточки.</div></div>`;const items=r.items.filter(x=>!(x.exercise===r.hero.exercise&&x.label===r.hero.label)).slice(0,2);return `<div class="sp264-highlight sp264-record-hero"><small>${r.hasRealPr?'🏆 НОВЫЙ РЕКОРД':'★ ЛУЧШИЙ РЕЗУЛЬТАТ'}</small><b>${esc(r.hero.exercise)} · ${esc(r.hero.value)}</b><div class="sp264-record-note">${esc(r.hero.label)} · 1ПМ ≈ ${fmt(r.hero.e1)} кг</div></div>${items.length?`<div class="sp264-records">${items.map(x=>`<div class="sp264-record"><small>${esc(x.exercise)} · ${esc(x.label)}</small><b>${esc(x.value)}</b></div>`).join('')}</div>`:''}${exercisesHtml(d,3)}`}
  function renderCard(s,m){const d=data(s),body=m==='compact'?compactBody(d):m==='record'?recordBody(d):progressBody(d);return `<div class="sp264-card" data-share-card-v264>${headerHtml(d)}${body}<div class="sp264-foot">Сделано в UNVRSL FIT</div></div>`}
  function accentColor(){const value=String(W.st?.accent||W.getComputedStyle?.(D.documentElement)?.getPropertyValue('--green')||'#0a84ff').trim();return /^#[0-9a-f]{6}$/i.test(value)?value:'#0a84ff'}
  const storyLayouts=[['poster','Постер','Полная сводка тренировки'],['minimal','Минимал','Компактный стикер поверх фото'],['exercises','Упражнения','Список и лучшие подходы'],['record','Рекорд','Один результат крупным планом'],['tonnage','Тоннаж','Объём в наглядном сравнении'],['progress','Динамика','Изменения и итоги занятия']];
  function recordPicker(s){if(layout!=='record')return '';return `<label class="sp471-record-picker">Упражнение <select aria-label="Упражнение для сторис" onchange="shareProgressExerciseV471(this.value)"><option value="">Автоматически · лучший результат</option>${exerciseRows(s).map(row=>`<option value="${esc(row.key)}" ${recordKey===row.key?'selected':''}>${esc(row.name)}</option>`).join('')}</select></label>`}
  function markup(s,m){return `<div class="sp264" style="--share-accent:${accentColor()}"><div class="sp264-head"><button class="sp264-close" onclick="closeModal()" aria-label="Закрыть">×</button><h2>Universal Fit</h2><span style="width:42px"></span></div><div class="sp473-controls"><div class="sp471-layouts" aria-label="Вариант сторис">${storyLayouts.map(([id,title])=>`<button type="button" aria-pressed="${layout===id}" onclick="shareProgressLayoutV471('${id}')">${title}</button>`).join('')}</div><div class="sp471-hint">${storyLayouts.find(x=>x[0]===layout)?.[2]||''}</div><div class="sp264-tabs"><button class="${m==='transparent'?'on':''}" onclick="shareProgressModeV264('transparent')">Без фона</button><button class="${m==='background'?'on':''}" onclick="shareProgressModeV264('background')">С фоном</button></div><div class="sp472-design" aria-label="Оформление"><button aria-pressed="${design==='basic'}" onclick="shareProgressDesignV472('basic')">Базовый</button><button aria-pressed="${design==='graphic'}" onclick="shareProgressDesignV472('graphic')">Белая графика</button></div>${recordPicker(s)}${comparisonPicker(s)}</div><div class="sp264-preview"><span>Готовим изображение…</span><img id="sp264Preview" hidden alt="Предпросмотр PNG Universal Fit"></div><div class="sp264-actions"><button id="sp264Save" class="btn full" onclick="shareProgressSaveV264()">Сохранить PNG</button><button id="sp264Share" class="btn primary full" onclick="shareProgressNativeV264()">Поделиться</button><div id="sp264Status" class="sp264-status"></div></div></div>`}

  function roundRect(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
  function wrapLines(ctx,text,maxWidth){const words=String(text||'').split(/\s+/),lines=[];let line='';for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}if(line)lines.push(line);return lines}
  function drawTextBlock(ctx,text,x,y,maxWidth,lineHeight,maxLines=3){const lines=wrapLines(ctx,text,maxWidth).slice(0,maxLines);lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));return y+lines.length*lineHeight}
  function buildStoryCanvas(s,variant){return buildStickerCanvas(s,variant,layout)}
  // Illustrative reference masses, not measurements of the depicted objects.
  const storyComparisons=[
    ['kettlebell','Гиря',24,'gym',0,'гиря','гири','гирь'],
    ['plates','Пара блинов',40,'gym',1,'пара блинов','пары блинов','пар блинов'],
    ['barbell','Штанга',100,'gym',2,'штанга','штанги','штанг'],
    ['bicycle','Велосипед',10,'gym',3,'велосипед','велосипеда','велосипедов'],
    ['motorcycle','Мотоцикл',200,'gym',4,'мотоцикл','мотоцикла','мотоциклов'],
    ['piano','Пианино',300,'gym',5,'пианино','пианино','пианино'],
    ['citycar','Городской автомобиль',1000,'vehicles',0,'городской автомобиль','городских автомобиля','городских автомобилей'],
    ['sedan','Легковой автомобиль',1500,'vehicles',1,'легковой автомобиль','легковых автомобиля','легковых автомобилей'],
    ['van','Фургон',2500,'vehicles',2,'фургон','фургона','фургонов'],
    ['pickup','Пикап',2200,'vehicles',3,'пикап','пикапа','пикапов'],
    ['truck','Грузовик',10000,'vehicles',4,'грузовик','грузовика','грузовиков'],
    ['bus','Автобус',13000,'vehicles',5,'автобус','автобуса','автобусов'],
    ['horse','Лошадь',500,'animals',0,'лошадь','лошади','лошадей'],
    ['rhino','Носорог',2300,'animals',3,'носорог','носорога','носорогов'],
    ['hippo','Бегемот',1800,'animals',4,'бегемот','бегемота','бегемотов'],
    ['elephant','Слон',5000,'animals',5,'слон','слона','слонов'],
    ['train','Пассажирский вагон',30000,'heavy',2,'пассажирский вагон','пассажирского вагона','пассажирских вагонов'],
    ['tank','Танк',60000,'heavy',3,'танк','танка','танков'],
    ['plane','Пассажирский самолёт',80000,'heavy',4,'пассажирский самолёт','пассажирского самолёта','пассажирских самолётов'],
    ['whale','Синий кит',120000,'heavy',5,'синий кит','синего кита','синих китов']
  ].map(([kind,label,mass,atlas,cell,one,few,many])=>({kind,label,mass,atlas,cell,one,few,many}));
  function volumeComparison(value){
    return storyComparisons.find(c=>c.kind===comparisonKey)||storyComparisons.reduce((best,c)=>Math.abs(Math.log(Math.max(value,1)/c.mass))<Math.abs(Math.log(Math.max(value,1)/best.mass))?c:best,storyComparisons[0]);
  }
  function comparisonCaption(value,c){
    const ratio=value/c.mass,amount=new Intl.NumberFormat('ru-RU',ratio>0&&ratio<1?{maximumSignificantDigits:2}:{maximumFractionDigits:1}).format(ratio);
    const rounded=Number(amount.replace(/\s/g,'').replace(',','.')),integer=Number.isInteger(rounded),last=rounded%10,lastTwo=rounded%100;
    const noun=!integer?c.few:last===1&&lastTwo!==11?c.one:last>=2&&last<=4&&(lastTwo<12||lastTwo>14)?c.few:c.many;
    return `≈ ${amount} ${noun}`;
  }
  function comparisonPicker(s){
    if(layout!=='tonnage')return '';
    const current=volumeComparison(tonnage(s));
    return `<div class="sp473-comparison"><label for="sp473Comparison">Сравнить с · 20 иллюстраций</label><div><select id="sp473Comparison" aria-label="Объект для сравнения тоннажа" onchange="shareProgressComparisonV473(this.value)"><option value="" ${!comparisonKey?'selected':''}>Автоматически · ${esc(current.label)}</option>${storyComparisons.map(c=>`<option value="${c.kind}" ${comparisonKey===c.kind?'selected':''}>${esc(c.label)} · ≈ ${plain(c.mass)} кг</option>`).join('')}</select><button type="button" aria-label="Другое изображение" onclick="shareProgressNextComparisonV473()">↻</button></div></div>`;
  }
  const storyArtwork={},storyArtworkTasks={},storyArtworkBounds={};
  function loadStoryArtwork(kind){
    if(storyArtwork[kind]||typeof Image==='undefined')return Promise.resolve();
    if(storyArtworkTasks[kind])return storyArtworkTasks[kind];
    storyArtworkTasks[kind]=new Promise(resolve=>{
      const image=new Image();let finished=false;
      const done=()=>{if(finished)return;finished=true;clearTimeout(timer);if(image.naturalWidth||image.width)storyArtwork[kind]=image;else delete storyArtworkTasks[kind];resolve()};
      const timer=setTimeout(done,8000);image.onload=done;image.onerror=done;
      image.src=['gym','vehicles','animals','heavy'].includes(kind)?`assets/story-atlas-${kind}-v473.png`:`assets/story-${kind}-v472.png`;
    });return storyArtworkTasks[kind];
  }
  // Crisp canvas artwork shares the export alpha; all figures and text remain dynamic.
  function measureComparisonArtwork(c){
    if(storyArtworkBounds[c.kind]||!storyArtwork[c.atlas])return;
    const image=storyArtwork[c.atlas],cw=(image.naturalWidth||image.width)/2,ch=(image.naturalHeight||image.height)/3;
    const probe=D.createElement('canvas');probe.width=cw;probe.height=ch;const ctx=probe.getContext('2d');
    ctx.drawImage(image,(c.cell%2)*cw,Math.floor(c.cell/2)*ch,cw,ch,0,0,cw,ch);
    const pixels=ctx.getImageData(0,0,cw,ch).data;let left=cw,top=ch,right=0,bottom=0;
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(pixels[(y*cw+x)*4+3]>16){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)}
    if(left>right)return;
    left=Math.max(0,left-4);top=Math.max(0,top-4);right=Math.min(cw-1,right+4);bottom=Math.min(ch-1,bottom+4);
    storyArtworkBounds[c.kind]={x:(c.cell%2)*cw+left,y:Math.floor(c.cell/2)*ch+top,w:right-left+1,h:bottom-top+1};
  }
  function drawComparisonArtwork(ctx,c,cx,cy,w,h){
    const image=storyArtwork[c.atlas];if(!image)return;
    const cw=(image.naturalWidth||image.width)/2,ch=(image.naturalHeight||image.height)/3;
    const crop=storyArtworkBounds[c.kind]||{x:(c.cell%2)*cw,y:Math.floor(c.cell/2)*ch,w:cw,h:ch};
    const scale=Math.min(w/crop.w,h/crop.h),dw=crop.w*scale,dh=crop.h*scale;
    ctx.drawImage(image,crop.x,crop.y,crop.w,crop.h,cx-dw/2,cy-dh/2,dw,dh);
  }
  function drawStoryArtwork(ctx,kind,cx,cy,scale=1){
    ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);ctx.strokeStyle='#f5f5f7';ctx.fillStyle='#f5f5f7';ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';
    if(storyArtwork[kind]){const image=storyArtwork[kind],w=kind==='plates'?300:760,h=w*(image.naturalHeight||image.height)/(image.naturalWidth||image.width);ctx.drawImage(image,-w/2,-h/2,w,h);ctx.restore();return}
    const line=p=>{ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()};
    const rect=(x,y,w,h,r=5)=>roundRect(ctx,x,y,w,h,r,null,'#f5f5f7');
    const circle=(x,y,r)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke()};
    if(kind==='plates'){
      ctx.save();ctx.scale(.7,1);circle(0,0,145);circle(0,0,123);circle(0,0,34);circle(0,0,19);
      for(let a=0;a<3;a++){ctx.save();ctx.rotate(a*Math.PI*2/3);rect(-25,-106,50,30,12);ctx.restore()}ctx.restore();
      line([[75,-115],[100,-100],[116,-62],[122,0],[116,62],[100,100],[75,115]]);
    }else if(kind==='barbell'){
      line([[-320,-4],[320,-4]]);line([[-320,4],[320,4]]);
      for(const sign of [-1,1])for(let i=0;i<3;i++){const a=sign*(210+i*25);rect(a-10,-(92-i*15),20,184-i*30,5)}
      line([[-195,-125],[-195,125]]);line([[195,-125],[195,125]]);
    }else if(kind==='trend'){
      line([[-330,100],[-330,-110]]);line([[-330,100],[330,100]]);
      line([[-305,72],[-175,32],[-75,47],[55,-23],[150,-12],[295,-95]]);
      line([[258,-90],[295,-95],[285,-59]]);
      for(const [a,b] of [[-305,72],[-175,32],[-75,47],[55,-23],[150,-12],[295,-95]])circle(a,b,7);
    }else{
      const train=kind==='train',car=kind==='car';
      if(train){
        rect(-355,-105,710,180,20);line([[-335,-105],[-302,-126],[298,-126],[337,-105]]);
        for(let i=0;i<9;i++){rect(-317+i*63,-73,43,55,6);line([[-311+i*63,-44],[-280+i*63,-44]])}
        rect(274,-78,52,140,6);line([[-349,0],[267,0]]);line([[-349,18],[267,18]]);line([[-349,48],[267,48]]);
        for(const a of [-233,213]){rect(a-62,80,124,25,8);circle(a-36,107,24);circle(a+36,107,24);circle(a-36,107,10);circle(a+36,107,10)}
        line([[-140,76],[-140,111],[128,111],[128,76]]);
      }else{
        rect(-340,car?-12:-115,car?680:435,car?105:210,car?22:7);
        if(car){line([[-225,-12],[-133,-113],[121,-113],[237,-12]]);line([[-105,-100],[-138,-26],[93,-26],[93,-100]]);line([[115,-100],[115,-26],[212,-26]])}
        else{line([[95,95],[330,95],[330,-42],[262,-103],[128,-103],[128,95]]);rect(163,-78,80,64,5);line([[-315,-90],[70,-90]]);line([[-315,67],[70,67]])}
        for(const a of [-225,235]){circle(a,98,47);circle(a,98,22)}
      }
    }
    ctx.restore();
  }
  function buildStickerCanvas(s,variant,style){
    const d=data(s),graphic=design==='graphic',accent=graphic?'#f5f5f7':accentColor(),count=Math.min(12,d.exercises.length);
    const height=style==='poster'?1560:style==='minimal'?600:style==='exercises'?Math.max(680,450+count*110+(d.exercises.length>12?70:0)):style==='record'?1000:style==='tonnage'?1040:1120;
    const canvas=D.createElement('canvas');canvas.width=1080;canvas.height=variant==='background'?1920:height;
    const font=graphic?'Impact,Arial,sans-serif':'Arial,sans-serif';
    const x=canvas.getContext('2d'),ink='#f5f5f7',muted='#c6c9d0',L=80,R=1000;
    if(variant==='background'){
      x.fillStyle='#101114';x.fillRect(0,0,1080,1920);x.translate(0,(1920-height)/2);
      x.fillStyle=accent;x.fillRect(L,-28,64,6);
    }
    const text=(value,a,b,size=32,color=ink,weight=500,align='left',width=920)=>{
      x.save();x.fillStyle=color;x.textAlign=align;
      let str=String(value??''),fontSize=size;x.font=`${weight} ${fontSize}px ${font}`;
      while(x.measureText(str).width>width&&fontSize>22){fontSize-=2;x.font=`${weight} ${fontSize}px ${font}`}
      if(x.measureText(str).width>width){while(str.length&&x.measureText(str+'…').width>width)str=str.slice(0,-1);str+='…'}
      x.fillText(str,a,b);x.restore();
    };
    const separator=y=>{x.fillStyle='#ffffff60';x.fillRect(L,y,R-L,1)};
    const title=(value,y=155,size=48,width=920)=>{x.font=`800 ${size}px ${font}`;let all=wrapLines(x,value,width);while(all.length>2&&size>32){size-=2;x.font=`800 ${size}px ${font}`;all=wrapLines(x,value,width)}const lines=all.slice(0,2);lines.forEach((line,i)=>text(line+(i===1&&all.length>2?'…':''),L,y+i*(size+8),size,ink,800,'left',width));return y+lines.length*(size+8)};
    const stats=y=>{const values=[[d.time,'ВРЕМЯ'],[String(d.sets),'ПОДХОДОВ'],[String(d.exercises.length),'УПРАЖНЕНИЙ']];values.forEach(([v,k],i)=>{const a=L+i*316;if(i){x.fillStyle='#ffffff60';x.fillRect(a-26,y-40,1,82)}text(v,a,y,46,ink,800,'left',265);text(k,a,y+37,19,muted,600,'left',265)})};
    const hero=(y,size=134)=>{text(plain(d.tonnage),L,y,size,accent,800,'left',750);text('кг',R,y-4,40,accent,700,'right',120);text('ОБЪЁМ ТРЕНИРОВКИ',L,y+43,21,muted,600)};
    const date=String(s?.date||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    text('UNVRSL FIT',L,72,26,ink,800);text(date?`${date[3]}.${date[2]}.${date[1]}`:d.date,R,72,21,muted,500,'right',430);
    if(style==='minimal'){
      title(d.title,155,42);separator(258);hero(402,124);stats(515);
    }else if(style==='poster'){
      title(d.title,180,64,graphic?680:920);
      if(graphic)drawStoryArtwork(x,'plates',898,196,.53);
      separator(335);hero(505,154);stats(652);separator(730);
      if(d.best){text('ЛУЧШИЙ ПОДХОД',L,798,20,accent,700);text(d.best.name,L,852,37,ink,700,'left',640);text(`${plain(d.best.w)} × ${plain(d.best.reps)}`,R,852,40,accent,800,'right',245);text(`RPE ${d.best.rpe==null?'–':fmt(d.best.rpe)}  ·  RIR ${d.best.rir==null?'–':fmt(d.best.rir)}`,L,897,22,muted)}
      text('УПРАЖНЕНИЯ',L,966,20,muted,700);
      d.exercises.slice(0,4).forEach((row,i)=>{const y=1030+i*100;text(String(i+1).padStart(2,'0'),L,y,24,accent,700,'left',60);text(row.name,L+72,y,31,ink,600,'left',550);text(row.best?`${plain(row.best.w)} × ${plain(row.best.reps)}`:'–',R,y,32,ink,700,'right',250);text(`${row.sets.length} подходов`,L+72,y+33,22,muted,500)});
      if(d.exercises.length>4)text(`Ещё ${d.exercises.length-4} упражнений в журнале`,L+72,1458,23,muted);
      text('СДЕЛАНО В UNVRSL FIT',L,1520,18,muted,600);
    }else if(style==='exercises'){
      title(d.title);text(`${d.time}  ·  ${d.sets} подходов  ·  ${plain(d.tonnage)} кг`,L,295,27,muted,600);separator(330);
      text('УПРАЖНЕНИЯ',L,380,20,muted,600);text('ЛУЧШИЙ ПОДХОД',R,380,20,muted,600,'right',270);
      if(!d.exercises.length)text('Нет выполненных силовых подходов',L,505,30,muted);
      d.exercises.slice(0,12).forEach((row,i)=>{const y=460+i*110;text(`${row.sets.length} ×`,L,y,29,accent,800,'left',85);x.font=`600 30px ${font}`;const all=wrapLines(x,row.name,530);all.slice(0,2).forEach((line,j)=>text(line+(j===1&&all.length>2?'…':''),L+100,y+j*34,30,ink,600,'left',530));text(row.best?`${plain(row.best.w)} × ${plain(row.best.reps)}`:'–',R,y,31,ink,800,'right',245);separator(y+75)});
      if(d.exercises.length>12)text(`Ещё ${d.exercises.length-12} упражнений в журнале`,L,460+count*110,25,muted);
    }else if(style==='record'){
      const row=d.exercises.find(r=>r.key===recordKey),pr=row&&realRecords(s).find(r=>r.key===row.key);
      const r=row?.best?{hasRealPr:!!pr,hero:{exercise:row.name,value:`${fmt(row.best.w)} × ${fmt(row.best.reps)}`,e1:e1rm(row.best)}}:d.record,h=r.hero;
      text(r.hasRealPr?'НОВЫЙ РЕКОРД':'ЛУЧШИЙ РЕЗУЛЬТАТ',L,173,25,accent,700);
      if(h){title(h.exercise,259,54);text(h.value,L,525,144,accent,800);text('КГ × ПОВТОРЕНИЯ',L,572,22,muted,600);text(`Расчётный 1ПМ ≈ ${fmt(h.e1)} кг`,L,652,30,ink,600)}
      else{text('ТРЕНИРОВКА ЗАВЕРШЕНА',L,380,48,ink,800);text('Нет силовых подходов для оценки',L,465,28,muted)}
      if(graphic)drawStoryArtwork(x,'plates',815,767,.65);
      separator(900);text(`${d.time}  ·  ${d.sets} рабочих подходов`,L,958,27,muted,600);
    }else if(style==='tonnage'){
      text('СЕГОДНЯ ПОДНЯТО',L,174,25,muted,700);hero(355,148);
      const comparison=volumeComparison(d.tonnage);drawComparisonArtwork(x,comparison,540,610,850,340);
      separator(803);text('ПРИМЕРНО СТОЛЬКО ВЕСИТ',L,852,21,muted,600);text(comparisonCaption(d.tonnage,comparison),L,914,52,ink,700);
      text(`Масса для сравнения ≈ ${plain(comparison.mass)} кг`,L,959,23,muted);text('Сумма нагрузки всех повторений · массы объектов приблизительные',L,1008,20,muted);
    }else{
      title(d.title);separator(270);text('ДИНАМИКА ТРЕНИРОВКИ',L,326,22,accent,700);
      d.progress.forEach((item,i)=>{const y=424+i*169;text(item.title,L,y,48,accent,800);text(item.sub,L,y+49,26,muted,500);separator(y+92)});
      if(graphic)drawStoryArtwork(x,'trend',540,940,.43);
      else stats(1000);
    }
    return canvas;
  }
  const canvasBlob=c=>new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('PNG не создан')),'image/png',.95));

  function installStoryCss(){
    if(D.getElementById('share-story-v472-style'))return;
    const style=D.createElement('style');style.id='share-story-v472-style';style.textContent=`
#modal:has(.sp264) .sheet{padding:0!important;height:100dvh!important;max-height:100dvh!important;overflow:hidden!important}
.sp264{box-sizing:border-box;gap:0;padding:calc(12px + env(safe-area-inset-top)) 16px calc(12px + env(safe-area-inset-bottom));height:100%;min-height:0}
.sp264-head{margin:0 0 15px}.sp264-head h2{order:-1;flex:1;font-size:24px}.sp264-head>span{display:none}.sp264-close{background:#292b30;border-radius:50%}
.sp264-tabs{grid-template-columns:repeat(2,1fr);background:#25272d;margin:12px 0 8px}
.sp264-tabs button.on,.sp264-actions .primary{background:var(--share-accent)!important;color:#fff!important}
.sp264-preview{background:#16181d;border:1px solid #34373f;border-radius:18px;margin:8px 0 12px;padding:12px;flex:1;min-height:0}
.sp264-preview img{border-radius:0;box-shadow:none;max-height:100%;max-width:100%}.sp264-preview img[hidden]{display:none}
.sp471-layouts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;flex:none}
.sp471-layouts button{padding:10px 4px;border:1px solid #393d45;border-radius:12px;font-size:12px;font-weight:700;color:#c6c9d0;background:#22252b}
.sp471-layouts button[aria-pressed=true]{border-color:var(--share-accent);color:var(--share-accent);background:#252e3b}
.sp471-hint{flex:none;color:#999ea9;font-size:11px;padding:7px 2px 0}
.sp472-design{display:flex;gap:6px;flex:none;margin:0 0 4px}.sp472-design button{border-radius:9px;padding:7px 11px;font-size:11px;color:#a9aeb9;border:1px solid transparent}.sp472-design button[aria-pressed=true]{color:var(--share-accent);border-color:var(--share-accent)}
.sp471-record-picker{flex:none;font-size:11px;color:#aaa;margin:3px 0 6px}.sp471-record-picker select{display:block;width:100%;min-width:0;margin-top:5px;border:1px solid #393d45;border-radius:10px;padding:9px;color:#eee;background:#22252b;font-size:12px}
.sp264-actions{background:#101114;gap:8px;padding-top:10px}.sp264-actions .btn{font-size:15px;min-height:48px}.sp264-status{font-size:11px;line-height:1.5}
html[data-theme="light"] .sp471-layouts button{background:#eceef3;color:#626773;border-color:#d8dbe3}html[data-theme="light"] .sp471-layouts button[aria-pressed=true]{color:var(--share-accent);border-color:var(--share-accent);background:#e6efff}
html[data-theme="light"] .sp472-design button{color:#626773}html[data-theme="light"] .sp472-design button[aria-pressed=true]{color:var(--share-accent)}
@media(max-height:700px){.sp264-head{margin-bottom:8px}.sp471-layouts button{padding:7px 4px}.sp264-tabs{margin-top:7px}.sp264-preview{margin:4px 0 6px;padding:8px}.sp264-actions .btn{min-height:42px}}

html body #modal.modal:has(.sp264){height:100dvh!important;box-sizing:border-box;flex-direction:column!important;justify-content:flex-start!important;align-items:center!important}
html body #modal.modal:has(.sp264) #sheet.sheet{display:flex!important;flex-direction:column!important;flex:1 1 0!important;height:auto!important;max-height:none!important;min-height:0!important;margin:0 auto!important;padding:0!important;overflow:hidden!important}
html body #modal.modal #sheet .sp264{display:flex;flex-direction:column;flex:1 1 0;min-height:0;height:auto!important;margin:0 auto!important;width:100%;padding:12px 16px 0!important;overflow:hidden}
html body #modal.modal #sheet .sp264-head{display:none!important}
.sp473-controls{flex:0 1 auto;min-height:0;max-height:40dvh;overflow:auto;padding:0 0 4px;scrollbar-width:thin}
html body #modal.modal #sheet .sp264-preview{position:relative;display:block;flex:1 1 0!important;min-height:130px!important;padding:0!important;overflow:hidden;margin:8px 0 10px}
html body #modal.modal #sheet .sp264-preview img{position:absolute;inset:10px;width:calc(100% - 20px)!important;height:calc(100% - 20px)!important;max-width:none!important;max-height:none!important;object-fit:contain!important;object-position:center;box-shadow:none!important}
.sp264-preview>span{position:absolute;inset:0;display:grid;place-items:center;font-size:13px;color:#a9aeb9}
html body #modal.modal #sheet .sp264-actions{flex:0 0 auto;position:static;margin:0 -16px!important;padding:10px 16px calc(12px + env(safe-area-inset-bottom))!important}
.sp473-comparison{margin-top:5px}.sp473-comparison label{display:block;color:#999ea9;font-size:11px;margin-bottom:5px}.sp473-comparison>div{display:flex;gap:6px}.sp473-comparison select{flex:1;width:0;border:1px solid #393d45;border-radius:10px;padding:9px;color:#eee;background:#22252b;font-size:12px}.sp473-comparison button{flex:0 0 38px;border:1px solid #393d45;border-radius:10px;font-size:24px;line-height:1;background:#22252b;color:var(--share-accent)}
@media(max-height:500px){html body #modal.modal #sheet .sp264-preview{min-height:64px!important}.sp473-controls{max-height:25dvh}.sp264-actions .btn{min-height:36px}}
html[data-theme="light"] .sp473-comparison select,html[data-theme="light"] .sp473-comparison button{background:#eceef3;border-color:#d8dbe3;color:#343942}
`;D.head.appendChild(style)
  }
  let active=null,mode='transparent',layout='poster',design='basic',recordKey='',comparisonKey='',prepared=null,prepareToken=0,previewUrl=null;
  const status=t=>{const e=D.getElementById('sp264Status');if(e)e.textContent=t||''};
  const busy=v=>{for(const id of ['sp264Save','sp264Share']){const b=D.getElementById(id);if(b)b.disabled=!!v}};
  async function prepareExport(){if(!active)return null;const token=++prepareToken;prepared=null;busy(true);status('Готовим PNG…');try{if(layout==='tonnage'){const c=volumeComparison(tonnage(active));await loadStoryArtwork(c.atlas);if(!storyArtwork[c.atlas]&&typeof Image!=='undefined')throw new Error('Иллюстрация не загрузилась');if(token!==prepareToken)return null;measureComparisonArtwork(c)};if(design==='graphic')await loadStoryArtwork('plates');if(token!==prepareToken)return null;const canvas=buildStoryCanvas(active,mode),blob=await canvasBlob(canvas);if(token!==prepareToken)return null;if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(blob);const img=D.getElementById('sp264Preview');if(img){img.src=previewUrl;img.hidden=false;img.previousElementSibling?.remove()}prepared={blob,file:new File([blob],`universal-fit-${String(active.date||new Date().toISOString().slice(0,10))}-${layout}-${mode}-${design}-${comparisonKey||'auto'}.png`,{type:'image/png'}),mode,layout,design,recordKey,comparisonKey,id:String(active.id||''),accent:accentColor()};status(`PNG готов · ${canvas.width} × ${canvas.height}`);return prepared}catch(e){console.error('share v264: '+(e?.stack||e));status('Не удалось подготовить изображение');return null}finally{if(token===prepareToken)busy(false)}}
  const ready=()=>prepared&&prepared.mode===mode&&prepared.layout===layout&&prepared.design===design&&prepared.comparisonKey===comparisonKey&&prepared.recordKey===recordKey&&prepared.id===String(active?.id||'')&&prepared.accent===accentColor()?prepared:null;
  function download(blob){const u=URL.createObjectURL(blob),a=D.createElement('a');a.href=u;a.download=`unvrsl-fit-${String(active?.date||new Date().toISOString().slice(0,10))}.png`;a.rel='noopener';D.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
  function nativeShare(file){if(!navigator.share)return null;try{if(navigator.canShare&&!navigator.canShare({files:[file]}))return null;return navigator.share({files:[file]})}catch(_){return null}}

  W.openShareProgressV264=s=>{installCss();installStoryCss();active=s||W.st?.current||null;if(!active)return W.toast?.('Нет данных тренировки');mode='transparent';layout='poster';design='basic';recordKey='';comparisonKey='';prepared=null;prepareToken++;W.modal?.(markup(active,mode));const sh=D.getElementById('sheet');if(sh)sh.scrollTop=0;requestAnimationFrame(()=>prepareExport())};
  W.shareProgressModeV264=m=>{if(!['transparent','background'].includes(m)||!active)return;mode=m;prepared=null;prepareToken++;const sh=D.getElementById('sheet');if(!sh)return;sh.innerHTML=markup(active,mode);sh.scrollTop=0;requestAnimationFrame(()=>prepareExport())};
  W.shareProgressLayoutV471=value=>{if(!storyLayouts.some(x=>x[0]===value)||!active)return;layout=value;prepared=null;prepareToken++;const sh=D.getElementById('sheet');if(!sh)return;sh.innerHTML=markup(active,mode);sh.scrollTop=0;requestAnimationFrame(()=>prepareExport())};
  W.shareProgressDesignV472=value=>{if(!['basic','graphic'].includes(value)||!active)return;design=value;prepared=null;prepareToken++;const sh=D.getElementById('sheet');if(sh)sh.innerHTML=markup(active,mode);requestAnimationFrame(()=>prepareExport())};
  W.shareProgressComparisonV473=value=>{if(!active||(value&&!storyComparisons.some(c=>c.kind===value)))return;comparisonKey=value;prepared=null;prepareToken++;const sh=D.getElementById('sheet');if(sh)sh.innerHTML=markup(active,mode);requestAnimationFrame(()=>prepareExport())};
  W.shareProgressNextComparisonV473=()=>{if(!active)return;const current=volumeComparison(tonnage(active)),i=storyComparisons.indexOf(current);W.shareProgressComparisonV473(storyComparisons[(i+1)%storyComparisons.length].kind)};
  W.shareProgressExerciseV471=key=>{if(!active||(key&&!exerciseRows(active).some(row=>row.key===key)))return;recordKey=key;prepared=null;prepareToken++;const sh=D.getElementById('sheet');if(sh)sh.innerHTML=markup(active,mode);requestAnimationFrame(()=>prepareExport())};
  W.shareProgressSaveV264=()=>{const p=ready();if(!p)return status('Изображение ещё готовится…');if(/iPad|iPhone|iPod/.test(navigator.userAgent)){const r=nativeShare(p.file);if(r){r.catch(e=>{if(e?.name!=='AbortError')download(p.blob)});return}}download(p.blob);W.toast?.('Изображение сохранено')};
  W.shareProgressNativeV264=()=>{const p=ready();if(!p)return status('Изображение ещё готовится…');const r=nativeShare(p.file);if(r){r.catch(e=>{if(e?.name!=='AbortError'){console.warn(e);download(p.blob)}});return}download(p.blob);W.toast?.('Карточка сохранена')};
  W.openShareProgressV262=W.openShareProgressV264;W.shareProgressModeV262=W.shareProgressModeV264;W.shareProgressSaveV262=W.shareProgressSaveV264;W.shareProgressNativeV262=W.shareProgressNativeV264;

  function wrap(name){const f=W[name];if(typeof f!=='function'||f.__sp264)return;const w=function(){let id='';try{id=decodeURIComponent(String(arguments[0]??''))}catch(_){id=String(arguments[0]??'')}const s=(W.st?.sessions||[]).find(x=>String(x?.id||'')===id)||null;if(s){W.openShareProgressV264(s);return}return f.apply(this,arguments)};w.__sp264=true;W[name]=w;try{if(name==='advShareWorkout')advShareWorkout=w}catch(_){}try{if(name==='clientShare107')clientShare107=w}catch(_){} }
  function hook(){wrap('clientShare107')}
  hook();const poll=setInterval(hook,500);setTimeout(()=>clearInterval(poll),120000);W.addEventListener?.('unvrsl:app-ready',hook,{passive:true});
})();
