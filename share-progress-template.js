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
  function accentColor(){const value=String(W.st?.accent||W.getComputedStyle?.(D.documentElement)?.getPropertyValue('--green')||'#bf5af2').trim();return /^#[0-9a-f]{6}$/i.test(value)?value:'#bf5af2'}
  function markup(s,m){return `<div class="sp264" style="--share-accent:${accentColor()}"><div class="sp264-head"><button class="sp264-close" onclick="closeModal()" aria-label="Закрыть">×</button><h2>Universal Fit</h2><span style="width:42px"></span></div><div class="sp264-tabs"><button class="${m==='transparent'?'on':''}" onclick="shareProgressModeV264('transparent')">Без фона</button><button class="${m==='background'?'on':''}" onclick="shareProgressModeV264('background')">С фоном</button></div><div class="sp264-preview"><span>Готовим изображение…</span><img id="sp264Preview" hidden alt="Предпросмотр PNG Universal Fit"></div><div class="sp264-actions"><button id="sp264Save" class="btn full" onclick="shareProgressSaveV264()">Сохранить PNG</button><button id="sp264Share" class="btn primary full" onclick="shareProgressNativeV264()">Поделиться</button><div id="sp264Status" class="sp264-status"></div></div></div>`}

  function roundRect(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
  function wrapLines(ctx,text,maxWidth){const words=String(text||'').split(/\s+/),lines=[];let line='';for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}if(line)lines.push(line);return lines}
  function drawTextBlock(ctx,text,x,y,maxWidth,lineHeight,maxLines=3){const lines=wrapLines(ctx,text,maxWidth).slice(0,maxLines);lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));return y+lines.length*lineHeight}
  function buildStoryCanvas(s,variant){
    const d=data(s),canvas=D.createElement('canvas'),WID=1080,MAX=1920,accent=accentColor();
    canvas.width=WID;canvas.height=MAX;
    const x=canvas.getContext('2d'),rgb=[1,3,5].map(i=>parseInt(accent.slice(i,i+2),16));
    const rgba=a=>`rgba(${rgb.join(',')},${a})`;
    if(variant==='background'){
      x.fillStyle='#101014';x.fillRect(0,0,WID,MAX);
      const glow=x.createRadialGradient(850,370,10,850,370,1050);
      glow.addColorStop(0,rgba(.28));glow.addColorStop(1,rgba(0));
      x.fillStyle=glow;x.fillRect(0,0,WID,MAX);
      const lower=x.createRadialGradient(160,1600,10,160,1600,680);
      lower.addColorStop(0,rgba(.12));lower.addColorStop(1,rgba(0));
      x.fillStyle=lower;x.fillRect(0,1100,WID,820);
    }
    const ink='#f8f7fb',muted='#b9b6c1',left=86,right=994;
    function label(value,px,py,font,color=ink,spacing=0){
      x.save();x.fillStyle=color;x.font=font;x.shadowColor='rgba(0,0,0,.85)';x.shadowBlur=variant==='transparent'?20:8;
      x.shadowOffsetY=variant==='transparent'?4:2;
      if(spacing&&'letterSpacing'in x)x.letterSpacing=spacing+'px';
      x.fillText(String(value),px,py);x.restore();
    }
    function clipped(value,maxWidth){let result=String(value||'');while(result.length>1&&x.measureText(result).width>maxWidth)result=result.slice(0,-2);return result===String(value||'')?result:result.trimEnd()+'…'}
    const shortDate=String(s?.date||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date=shortDate?`${shortDate[3]}.${shortDate[2]}.${shortDate[1]}`:d.date;
    label('UNVRSL FIT',left,188,'700 28px Arial,sans-serif',ink,6);
    x.save();x.textAlign='right';label(date,right,188,'26px Arial,sans-serif',muted,3);x.restore();
    const code=String(s?.c||'').trim().slice(0,8),title=code?String(s?.name||'Тренировка'):d.title;
    if(code){roundRect(x,left,268,112,62,31,rgba(.33),rgba(.65));label(code,left+22,311,'800 37px Arial,sans-serif',accent)}
    x.font='800 78px Arial,sans-serif';const lines=wrapLines(x,title,900).slice(0,3);
    lines.forEach((line,i)=>label(line,left,415+i*83,'800 78px Arial,sans-serif',ink));
    if(d.tonnage>0){
      const value=plain(d.tonnage),size=value.length>6?140:180;
      label(value,left,790,`900 ${size}px Arial,sans-serif`,accent);
      x.font=`900 ${size}px Arial,sans-serif`;const end=Math.min(835,left+x.measureText(value).width+20);
      label('кг',end,783,'800 78px Arial,sans-serif',accent);
      label('Т О Н Н А Ж',left,843,'22px Arial,sans-serif',muted);
    }else{
      label('ТРЕНИРОВКА',left,755,'800 78px Arial,sans-serif',accent);
      label('ИТОГ ЗАНЯТИЯ',left,843,'24px Arial,sans-serif',muted);
    }
    const cells=[['ПОДХОДОВ',String(d.sets)],['ВРЕМЯ',d.time],['СРЕДНИЙ RPE',d.rpe==null?'–':fmt(d.rpe)]];
    cells.forEach(([key,value],i)=>{const px=left+i*314;
      if(i){x.fillStyle='rgba(255,255,255,.2)';x.fillRect(px-20,902,1,92)}
      label(value,px,955,'800 56px Arial,sans-serif',ink);
      label(key,px,992,'19px Arial,sans-serif',muted);
    });
    const best=d.best;
    if(best){
      roundRect(x,left,1070,right-left,158,26,variant==='transparent'?'rgba(24,21,30,.76)':'rgba(255,255,255,.09)',rgba(.65));
      label('ЛУЧШИЙ ПОДХОД',left+30,1118,'700 20px Arial,sans-serif',accent,2);
      x.font='700 36px Arial,sans-serif';label(clipped(best.name,465),left+30,1177,'700 36px Arial,sans-serif',ink);
      x.save();x.textAlign='right';label(`${plain(best.w)} × ${plain(best.reps)}`,right-160,1175,'800 44px Arial,sans-serif',accent);
      label(`RPE ${best.rpe==null?'–':fmt(best.rpe)}   RIR ${best.rir==null?'–':fmt(best.rir)}`,right-25,1207,'19px Arial,sans-serif',ink);x.restore();
    }
    d.exercises.slice(0,4).forEach((row,i)=>{
      const yy=1338+i*118,effort=row.best;
      label(String(i+1).padStart(2,'0'),left,yy,'700 28px Arial,sans-serif',accent);
      x.font='700 35px Arial,sans-serif';label(clipped(row.name,680),left+95,yy,'700 35px Arial,sans-serif',ink);
      x.font='25px Arial,sans-serif';const sets=row.sets.map(z=>`${plain(z.w)}×${plain(z.reps)}`).join(' · ');
      label(clipped(sets,710),left+95,yy+39,'25px Arial,sans-serif',muted);
      x.save();x.textAlign='right';label(`RPE ${effort?.rpe==null?'–':fmt(effort.rpe)}`,right,yy,'21px Arial,sans-serif',ink);
      label(`RIR ${effort?.rir==null?'–':fmt(effort.rir)}`,right,yy+35,'21px Arial,sans-serif',muted);x.restore();
    });
    if(d.exercises.length>4)label(`И ещё ${d.exercises.length-4} упражнений`,left+95,1800,'23px Arial,sans-serif',muted);
    label('UNVRSL FIT',left,1850,'700 23px Arial,sans-serif',muted,4);
    return canvas;
  }
  const canvasBlob=c=>new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('PNG не создан')),'image/png',.95));

  function installStoryCss(){const style=D.getElementById('share-progress-v264-style');if(style)style.textContent+=`.sp264-tabs{grid-template-columns:repeat(2,1fr)}.sp264-tabs button.on,.sp264-actions .primary{background:var(--share-accent)!important;color:#101014!important}.sp264-preview{background:radial-gradient(circle at 50% 40%,#323039,#141318 75%);border-radius:18px}.sp264-preview img{box-shadow:0 12px 42px rgba(0,0,0,.55)}.sp264-preview img[hidden]{display:none}`}
  let active=null,mode='transparent',prepared=null,prepareToken=0,previewUrl=null;
  const status=t=>{const e=D.getElementById('sp264Status');if(e)e.textContent=t||''};
  const busy=v=>{for(const id of ['sp264Save','sp264Share']){const b=D.getElementById(id);if(b)b.disabled=!!v}};
  async function prepareExport(){if(!active)return null;const token=++prepareToken;prepared=null;busy(true);status('Готовим PNG…');try{const canvas=buildStoryCanvas(active,mode),blob=await canvasBlob(canvas);if(token!==prepareToken)return null;if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(blob);const img=D.getElementById('sp264Preview');if(img){img.src=previewUrl;img.hidden=false;img.previousElementSibling?.remove()}prepared={blob,file:new File([blob],`universal-fit-${String(active.date||new Date().toISOString().slice(0,10))}-${mode}.png`,{type:'image/png'}),mode,id:String(active.id||''),accent:accentColor()};status(`PNG готов · ${canvas.width} × ${canvas.height}`);return prepared}catch(e){console.error('share v264: '+(e?.stack||e));status('Не удалось подготовить изображение');return null}finally{if(token===prepareToken)busy(false)}}
  const ready=()=>prepared&&prepared.mode===mode&&prepared.id===String(active?.id||'')&&prepared.accent===accentColor()?prepared:null;
  function download(blob){const u=URL.createObjectURL(blob),a=D.createElement('a');a.href=u;a.download=`unvrsl-fit-${String(active?.date||new Date().toISOString().slice(0,10))}.png`;a.rel='noopener';D.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
  function nativeShare(file){if(!navigator.share)return null;try{if(navigator.canShare&&!navigator.canShare({files:[file]}))return null;return navigator.share({files:[file]})}catch(_){return null}}

  W.openShareProgressV264=s=>{installCss();installStoryCss();active=s||W.st?.current||null;if(!active)return W.toast?.('Нет данных тренировки');mode='transparent';prepared=null;W.modal?.(markup(active,mode));const sh=D.getElementById('sheet');if(sh)sh.scrollTop=0;requestAnimationFrame(()=>prepareExport())};
  W.shareProgressModeV264=m=>{if(!['transparent','background'].includes(m)||!active)return;mode=m;prepared=null;const sh=D.getElementById('sheet');if(!sh)return;sh.innerHTML=markup(active,mode);sh.scrollTop=0;requestAnimationFrame(()=>prepareExport())};
  W.shareProgressSaveV264=()=>{const p=ready();if(!p)return status('Изображение ещё готовится…');if(/iPad|iPhone|iPod/.test(navigator.userAgent)){const r=nativeShare(p.file);if(r){r.catch(e=>{if(e?.name!=='AbortError')download(p.blob)});return}}download(p.blob);W.toast?.('Изображение сохранено')};
  W.shareProgressNativeV264=()=>{const p=ready();if(!p)return status('Изображение ещё готовится…');const r=nativeShare(p.file);if(r){r.catch(e=>{if(e?.name!=='AbortError'){console.warn(e);download(p.blob)}});return}download(p.blob);W.toast?.('Карточка сохранена')};
  W.openShareProgressV262=W.openShareProgressV264;W.shareProgressModeV262=W.shareProgressModeV264;W.shareProgressSaveV262=W.shareProgressSaveV264;W.shareProgressNativeV262=W.shareProgressNativeV264;

  function wrap(name){const f=W[name];if(typeof f!=='function'||f.__sp264)return;const w=function(){let id='';try{id=decodeURIComponent(String(arguments[0]??''))}catch(_){id=String(arguments[0]??'')}const s=(W.st?.sessions||[]).find(x=>String(x?.id||'')===id)||null;if(s){W.openShareProgressV264(s);return}return f.apply(this,arguments)};w.__sp264=true;W[name]=w;try{if(name==='advShareWorkout')advShareWorkout=w}catch(_){}try{if(name==='clientShare107')clientShare107=w}catch(_){} }
  function hook(){wrap('clientShare107')}
  hook();const poll=setInterval(hook,500);setTimeout(()=>clearInterval(poll),120000);W.addEventListener?.('unvrsl:app-ready',hook,{passive:true});
})();
