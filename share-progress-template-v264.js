'use strict';
(()=>{
  const W=window,D=document,REV=264;
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
  const sessionTitle=s=>[s?.c,s?.name].filter(Boolean).join(' · ')||s?.programName||s?.name||s?.c||'Тренировка';
  const dateText=s=>{const raw=s?.date||s?.endedAt||s?.ended||Date.now();try{const d=typeof raw==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(raw)?new Date(raw+'T12:00:00'):new Date(raw);return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(d)}catch(_){return String(raw||'')}};
  const durationMs=s=>{const direct=[s?.advancedMetrics?.duration,s?.finalDurationMs,s?.durationMs].map(N).find(x=>x!=null&&x>=0);if(direct!=null)return direct;const a=N(s?.started),b=N(s?.ended);if(a!=null&&b!=null&&b>=a)return b-a;const a2=Date.parse(s?.startedAt||s?.start||''),b2=Date.parse(s?.endedAt||s?.end||'');return Number.isFinite(a2)&&Number.isFinite(b2)&&b2>=a2?b2-a2:0};
  const durationText=s=>{const t=Math.max(0,Math.floor(durationMs(s)/1000)),h=Math.floor(t/3600),m=Math.floor((t%3600)/60),r=t%60,p=n=>String(n).padStart(2,'0');return h?`${h}:${p(m)}:${p(r)}`:`${m}:${p(r)}`};
  const setRpe=x=>{let p=N(x?.rpe),r=N(x?.rir);if(p==null&&r!=null)p=10-r;return p};
  const e1rm=z=>z.w>0&&z.reps>0?z.w*(1+(z.reps+clamp(10-(z.rpe??8),0,10))/30):0;

  function completedStrength(s){
    return (s?.ex||[]).flatMap(e=>{
      if(e?.mode==='cardio')return[];
      return (e.set||[]).filter(x=>x?.ok).map(x=>({
        e,x,name:baseName(e.n),key:String(e.sourceId||norm(e.n)),sourceId:e.sourceId||null,
        w:N(x.w)||0,reps:N(x.r)||0,rpe:setRpe(x)
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
    const hist=(W.st?.sessions||[]).filter(x=>x?.ended&&String(x?.id||'')!==String(s?.id||'')&&setCount(x)>0).sort((a,b)=>Number(a.ended||a.started||0)-Number(b.ended||b.started||0));
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
    if(out.length<3)out.push({icon:'▥',title:`${setCount(s)} рабочих подходов`,sub:p?`${Math.abs(setCount(s)-setCount(p))} разница с прошлой тренировкой`:'объём текущей тренировки'});
    return out.slice(0,3)
  }

  function historyForExercise(s,z){
    const sessions=(W.st?.sessions||[]).filter(x=>x?.ended&&String(x?.id||'')!==String(s?.id||''));const a=[];
    for(const sess of sessions)for(const q of completedStrength(sess))if(q.key===z.key)a.push(q);
    return a
  }
  function realRecords(s){
    const byEx=new Map();
    for(const z of completedStrength(s).filter(x=>x.w>0&&x.reps>0)){
      if(!byEx.has(z.key))byEx.set(z.key,[]);byEx.get(z.key).push(z)
    }
    const records=[];
    for(const [key,sets] of byEx){
      const hist=historyForExercise(s,sets[0]);if(!hist.length)continue;
      const histMaxW=Math.max(...hist.map(x=>x.w)),histMaxE=Math.max(...hist.map(e1rm));
      const currentBest=[...sets].sort((a,b)=>e1rm(b)-e1rm(a))[0],currentMaxW=Math.max(...sets.map(x=>x.w)),types=[];
      if(currentMaxW>histMaxW+.001)types.push({type:'weight',label:'Рекорд по весу',value:`${fmt(currentMaxW)} кг`,priority:90});
      if(e1rm(currentBest)>histMaxE+.4)types.push({type:'e1rm',label:'Расчётный 1ПМ',value:`${fmt(e1rm(currentBest))} кг`,priority:100});
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
    if(best)return{hasRealPr:false,hero:{exercise:best.name,label:'Лучший результат тренировки',value:`${fmt(best.w)}×${fmt(best.reps)}`,e1:e1rm(best)},items:[{exercise:best.name,type:'e1rm',label:'Расчётный 1ПМ',value:`${fmt(e1rm(best))} кг`,set:`${fmt(best.w)}×${fmt(best.reps)}`,priority:1}]};
    return{hasRealPr:false,hero:null,items:[]}
  }

  function data(s){return{title:sessionTitle(s),date:dateText(s),time:durationText(s),tonnage:tonnage(s),sets:setCount(s),rpe:avgRpe(s),exercises:exerciseRows(s),best:bestSet(s),progress:progressItems(s),record:recordData(s)}}

  function installCss(){
    for(const id of ['share-progress-v262-style','share-progress-v263-style','share-progress-v264-style'])D.getElementById(id)?.remove();
    const el=D.createElement('style');el.id='share-progress-v264-style';el.textContent=`
.sp264{padding:0 0 4px}.sp264-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.sp264-head h2{margin:0;font-size:24px;line-height:1.08;letter-spacing:-.4px}.sp264-close{width:42px;height:42px;border-radius:14px;background:#2b2b2f;font-size:21px}.sp264-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;background:#202024;padding:4px;border-radius:14px;margin-bottom:13px}.sp264-tabs button{padding:10px 4px;border-radius:10px;color:#8e8e93;font-weight:800;font-size:12px}.sp264-tabs button.on{background:#3a3a40;color:#fff}.sp264-card{background:radial-gradient(circle at 92% 4%,rgba(10,132,255,.09),transparent 29%),linear-gradient(155deg,#111214,#090a0b);border:1px solid #34363b;border-radius:25px;padding:18px;box-shadow:0 18px 50px rgba(0,0,0,.35)}.sp264-top{display:flex;justify-content:space-between;gap:12px}.sp264-brand{font-weight:900;font-size:23px;letter-spacing:-.7px}.sp264-title{font-size:22px;font-weight:850;line-height:1.1;margin-top:11px;max-width:480px}.sp264-date{color:#8e8e93;margin-top:6px}.sp264-chips{display:flex;gap:7px;align-items:flex-start;flex-wrap:wrap;justify-content:flex-end}.sp264-chip{border:1px solid #34363b;border-radius:999px;padding:7px 10px;color:#a7a7ad;font-size:11px;white-space:nowrap}.sp264-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:17px}.sp264-metric{background:#1b1c20;border:1px solid #34363b;border-radius:17px;padding:12px 11px;min-width:0}.sp264-metric span{color:#8e8e93;font-size:11px;display:block}.sp264-metric b{font-size:20px;display:block;margin-top:5px;white-space:nowrap}.sp264-highlight{margin-top:14px;padding:14px;border-radius:18px;border:1px solid rgba(10,132,255,.48);background:rgba(10,132,255,.09)}.sp264-highlight small{color:#5faaff;font-weight:850}.sp264-highlight b{display:block;font-size:18px;margin-top:5px}.sp264-record-hero{text-align:center;padding:18px}.sp264-record-hero b{font-size:25px;line-height:1.15}.sp264-section{margin-top:14px;border:1px solid #34363b;background:#17181b;border-radius:19px;padding:14px}.sp264-section-title{font-size:14px;font-weight:850;margin-bottom:10px}.sp264-progress{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0}.sp264-p{padding:0 12px;border-right:1px solid #33363a;min-width:0}.sp264-p:first-child{padding-left:0}.sp264-p:last-child{border-right:0;padding-right:0}.sp264-p i{font-style:normal;font-size:18px;color:#5faaff}.sp264-p b{display:block;font-size:13px;margin-top:4px}.sp264-p small{display:block;color:#85858b;font-size:10px;margin-top:3px;line-height:1.25}.sp264-ex{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #303238}.sp264-ex:last-child{border-bottom:0;padding-bottom:0}.sp264-num{width:29px;height:29px;border-radius:50%;background:#252932;border:1px solid #3b465a;display:grid;place-items:center;font-size:12px;color:#7fb2ff;flex:0 0 auto}.sp264-ex b{display:block;font-size:14px}.sp264-ex span{display:block;color:#97979d;font-size:11px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sp264-records{display:grid;gap:8px;margin-top:12px}.sp264-record{background:#1a1b1f;border:1px solid #353943;border-radius:15px;padding:11px 12px}.sp264-record small{color:#8e8e93}.sp264-record b{display:block;margin-top:3px}.sp264-foot{text-align:center;color:#777;font-size:11px;margin-top:15px}.sp264-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:13px;position:sticky;bottom:calc(-26px - env(safe-area-inset-bottom));background:linear-gradient(transparent,#18181a 24%);padding:18px 0 calc(8px + env(safe-area-inset-bottom));z-index:4}.sp264-actions .btn{min-height:52px}.sp264-actions .primary{background:#0a84ff!important;color:#fff!important}.sp264-actions button[disabled]{opacity:.55}.sp264-status{grid-column:1/-1;text-align:center;color:#8e8e93;font-size:11px;min-height:15px}.sp264-record-note{margin-top:9px;color:#8e8e93;font-size:11px;text-align:center}@media(max-width:520px){.sp264-card{padding:15px;border-radius:22px}.sp264-brand{font-size:20px}.sp264-title{font-size:19px}.sp264-metrics{grid-template-columns:1fr 1fr}.sp264-metric b{font-size:19px}.sp264-progress{grid-template-columns:1fr}.sp264-p{border-right:0;border-bottom:1px solid #303238;padding:9px 0}.sp264-p:first-child{padding-top:0}.sp264-p:last-child{border-bottom:0;padding-bottom:0}}
`;D.head.appendChild(el)
  }

  const metrics=d=>[['Тоннаж',d.tonnage>0?`${fmt(d.tonnage)} кг`:'–'],['Средний RPE',d.rpe!=null?fmt(d.rpe):'–'],['Подходов',String(d.sets)],['Время',d.time]];
  function headerHtml(d){return `<div class="sp264-top"><div><div class="sp264-brand">UNVRSL FIT</div><div class="sp264-title">${esc(d.title)}</div><div class="sp264-date">${esc(d.date)}</div></div><div class="sp264-chips"><span class="sp264-chip">${d.exercises.length} упражнений</span>${d.rpe!=null?`<span class="sp264-chip">RPE ${fmt(d.rpe)}</span>`:''}</div></div><div class="sp264-metrics">${metrics(d).map(([a,b])=>`<div class="sp264-metric"><span>${a}</span><b>${b}</b></div>`).join('')}</div>`}
  function exercisesHtml(d,limit){if(!d.exercises.length)return'';return `<div class="sp264-section"><div class="sp264-section-title">Упражнения</div>${d.exercises.slice(0,limit).map((x,i)=>`<div class="sp264-ex"><div class="sp264-num">${i+1}</div><div style="min-width:0"><b>${esc(x.name)}</b><span>${esc(x.line)}</span></div></div>`).join('')}</div>`}
  function compactBody(d){return d.best?`<div class="sp264-highlight"><small>ЛУЧШИЙ СЕТ</small><b>${esc(d.best.name)} · ${fmt(d.best.w)}×${fmt(d.best.reps)}</b></div>`:''}
  function progressBody(d){return `<div class="sp264-section"><div class="sp264-section-title">Прогресс</div><div class="sp264-progress">${d.progress.map(x=>`<div class="sp264-p"><i>${esc(x.icon)}</i><b>${esc(x.title)}</b><small>${esc(x.sub)}</small></div>`).join('')}</div></div>${exercisesHtml(d,5)}`}
  function recordBody(d){const r=d.record;if(!r.hero)return `<div class="sp264-section"><div class="muted small">Нет силовых результатов для карточки.</div></div>`;const items=r.items.filter(x=>!(x.exercise===r.hero.exercise&&x.label===r.hero.label)).slice(0,2);return `<div class="sp264-highlight sp264-record-hero"><small>${r.hasRealPr?'🏆 НОВЫЙ РЕКОРД':'★ ЛУЧШИЙ РЕЗУЛЬТАТ'}</small><b>${esc(r.hero.exercise)} · ${esc(r.hero.value)}</b><div class="sp264-record-note">${esc(r.hero.label)} · 1ПМ ≈ ${fmt(r.hero.e1)} кг</div></div>${items.length?`<div class="sp264-records">${items.map(x=>`<div class="sp264-record"><small>${esc(x.exercise)} · ${esc(x.label)}</small><b>${esc(x.value)}</b></div>`).join('')}</div>`:''}${exercisesHtml(d,3)}`}
  function renderCard(s,m){const d=data(s),body=m==='compact'?compactBody(d):m==='record'?recordBody(d):progressBody(d);return `<div class="sp264-card" data-share-card-v264>${headerHtml(d)}${body}<div class="sp264-foot">Сделано в UNVRSL FIT</div></div>`}
  function markup(s,m){return `<div class="sp264"><div class="sheet-grabber"></div><div class="sp264-head"><h2>Поделиться тренировкой</h2><button class="sp264-close" onclick="closeModal()">×</button></div><div class="sp264-tabs"><button class="${m==='compact'?'on':''}" onclick="shareProgressModeV264('compact')">Кратко</button><button class="${m==='progress'?'on':''}" onclick="shareProgressModeV264('progress')">Прогресс</button><button class="${m==='record'?'on':''}" onclick="shareProgressModeV264('record')">Рекорд</button></div>${renderCard(s,m)}<div class="sp264-actions"><button id="sp264Save" class="btn full" onclick="shareProgressSaveV264()">Сохранить</button><button id="sp264Share" class="btn primary full" onclick="shareProgressNativeV264()">Поделиться</button><div id="sp264Status" class="sp264-status"></div></div></div>`}

  function roundRect(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
  function wrapLines(ctx,text,maxWidth){const words=String(text||'').split(/\s+/),lines=[];let line='';for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}if(line)lines.push(line);return lines}
  function drawTextBlock(ctx,text,x,y,maxWidth,lineHeight,maxLines=3){const lines=wrapLines(ctx,text,maxWidth).slice(0,maxLines);lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));return y+lines.length*lineHeight}
  function buildCanvas(s,m){
    const d=data(s),tmp=D.createElement('canvas'),WID=1080,MAX=2400;tmp.width=WID;tmp.height=MAX;const x=tmp.getContext('2d');
    x.fillStyle='#08090a';x.fillRect(0,0,WID,MAX);const grad=x.createRadialGradient(980,60,0,980,60,430);grad.addColorStop(0,'rgba(10,132,255,.12)');grad.addColorStop(1,'rgba(10,132,255,0)');x.fillStyle=grad;x.fillRect(0,0,WID,MAX);
    let y=82;x.fillStyle='#f5f5f7';x.font='900 52px -apple-system,BlinkMacSystemFont,system-ui,sans-serif';x.fillText('UNVRSL FIT',72,y);y+=64;x.font='800 46px -apple-system,BlinkMacSystemFont,system-ui,sans-serif';y=drawTextBlock(x,d.title,72,y,900,54,2)+8;x.fillStyle='#8e8e93';x.font='30px -apple-system,BlinkMacSystemFont,system-ui,sans-serif';x.fillText(d.date,72,y);y+=54;
    const ms=metrics(d),gap=18,cw=(936-gap)/2,ch=142;ms.forEach(([lab,val],i)=>{const col=i%2,row=Math.floor(i/2),px=72+col*(cw+gap),py=y+row*(ch+16);roundRect(x,px,py,cw,ch,26,'#1b1c20','#35373d');x.fillStyle='#8e8e93';x.font='25px -apple-system,system-ui';x.fillText(lab,px+25,py+42);x.fillStyle='#f5f5f7';x.font='800 40px -apple-system,system-ui';x.fillText(String(val).replace(/\u00a0/g,' '),px+25,py+96)});y+=2*(ch+16)+12;
    const section=(title,items,kind)=>{const h=kind==='progress'?Math.max(170,items.length*105+75):Math.max(150,items.length*94+72);roundRect(x,72,y,936,h,28,'#17181b','#35373d');x.fillStyle='#f5f5f7';x.font='800 28px -apple-system,system-ui';x.fillText(title,102,y+48);let yy=y+84;items.forEach((it,i)=>{if(i){x.strokeStyle='#303238';x.beginPath();x.moveTo(102,yy-14);x.lineTo(978,yy-14);x.stroke()}if(kind==='progress'){x.fillStyle='#5faaff';x.font='700 28px -apple-system,system-ui';x.fillText(it.icon,104,yy+18);x.fillStyle='#f5f5f7';x.font='700 27px -apple-system,system-ui';x.fillText(it.title,155,yy+12);x.fillStyle='#8e8e93';x.font='22px -apple-system,system-ui';x.fillText(it.sub,155,yy+43);yy+=100}else{x.fillStyle='#7fb2ff';x.font='800 23px -apple-system,system-ui';x.fillText(String(i+1),110,yy+16);x.fillStyle='#f5f5f7';x.font='700 26px -apple-system,system-ui';x.fillText(it.name,158,yy+10);x.fillStyle='#8e8e93';x.font='21px -apple-system,system-ui';x.fillText(it.line.slice(0,68),158,yy+41);yy+=90}});y+=h+24};
    if(m==='compact'&&d.best){roundRect(x,72,y,936,150,28,'rgba(10,132,255,.10)','rgba(10,132,255,.70)');x.fillStyle='#5faaff';x.font='800 25px -apple-system,system-ui';x.fillText('ЛУЧШИЙ СЕТ',102,y+48);x.fillStyle='#f5f5f7';x.font='800 34px -apple-system,system-ui';x.fillText(`${d.best.name} · ${plain(d.best.w)}×${plain(d.best.reps)}`.slice(0,52),102,y+103);y+=176}
    if(m==='progress'){section('Прогресс',d.progress,'progress');if(d.exercises.length)section('Упражнения',d.exercises.slice(0,5),'exercises')}
    if(m==='record'&&d.record.hero){const r=d.record,h=r.hero;roundRect(x,72,y,936,190,28,'rgba(10,132,255,.10)','rgba(10,132,255,.70)');x.fillStyle='#5faaff';x.font='800 25px -apple-system,system-ui';x.textAlign='center';x.fillText(r.hasRealPr?'🏆 НОВЫЙ РЕКОРД':'★ ЛУЧШИЙ РЕЗУЛЬТАТ',540,y+48);x.fillStyle='#f5f5f7';x.font='800 36px -apple-system,system-ui';wrapLines(x,`${h.exercise} · ${h.value}`,820).slice(0,2).forEach((line,i)=>x.fillText(line,540,y+105+i*42));x.fillStyle='#8e8e93';x.font='22px -apple-system,system-ui';x.fillText(`${h.label} · 1ПМ ≈ ${plain(h.e1)} кг`,540,y+168);x.textAlign='left';y+=216;const extra=r.items.slice(0,2).map(q=>({name:`${q.exercise} · ${q.label}`,line:q.value}));if(extra.length)section('Достижения',extra,'exercises');if(d.exercises.length)section('Упражнения',d.exercises.slice(0,3),'exercises')}
    y+=18;x.fillStyle='#777';x.font='24px -apple-system,system-ui';x.textAlign='center';x.fillText('Сделано в UNVRSL FIT',540,y+32);x.textAlign='left';y+=72;
    const minH=m==='compact'?900:1100,H=Math.max(minH,Math.min(MAX,Math.ceil(y)));const out=D.createElement('canvas');out.width=WID;out.height=H;out.getContext('2d').drawImage(tmp,0,0,WID,H,0,0,WID,H);return out
  }
  const canvasBlob=c=>new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('PNG не создан')),'image/png',.95));

  let active=null,mode='progress',prepared=null,prepareToken=0;
  const status=t=>{const e=D.getElementById('sp264Status');if(e)e.textContent=t||''};
  const busy=v=>{for(const id of ['sp264Save','sp264Share']){const b=D.getElementById(id);if(b)b.disabled=!!v}};
  function shareText(){if(!active)return'UNVRSL FIT';const d=data(active),a=[`UNVRSL FIT · ${d.title}`,d.date,`${plain(d.tonnage)} кг · ${d.sets} подходов · ${d.time}`];if(d.rpe!=null)a.push(`Средний RPE ${plain(d.rpe)}`);return a.join('\n')}
  async function prepareExport(){if(!active)return null;const token=++prepareToken;prepared=null;busy(true);status('Готовим изображение…');try{const blob=await canvasBlob(buildCanvas(active,mode));if(token!==prepareToken)return null;prepared={blob,file:new File([blob],`unvrsl-fit-${String(active.date||new Date().toISOString().slice(0,10))}.png`,{type:'image/png'}),mode,id:String(active.id||'')};status('Готово');return prepared}catch(e){console.error('share v264',e);status('Не удалось подготовить изображение');return null}finally{if(token===prepareToken)busy(false)}}
  const ready=()=>prepared&&prepared.mode===mode&&prepared.id===String(active?.id||'')?prepared:null;
  function download(blob){const u=URL.createObjectURL(blob),a=D.createElement('a');a.href=u;a.download=`unvrsl-fit-${String(active?.date||new Date().toISOString().slice(0,10))}.png`;a.rel='noopener';D.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
  function nativeShare(file,text){if(!navigator.share)return null;try{if(navigator.canShare&&!navigator.canShare({files:[file]}))return null;return navigator.share({files:[file],title:'UNVRSL FIT',text})}catch(_){return null}}

  W.openShareProgressV264=s=>{installCss();active=s||W.st?.current||null;if(!active)return W.toast?.('Нет данных тренировки');mode='progress';prepared=null;W.modal?.(markup(active,mode));const sh=D.getElementById('sheet');if(sh)sh.scrollTop=0;requestAnimationFrame(()=>prepareExport())};
  W.shareProgressModeV264=m=>{if(!['compact','progress','record'].includes(m)||!active)return;mode=m;prepared=null;const sh=D.getElementById('sheet');if(!sh)return;sh.innerHTML=markup(active,mode);sh.scrollTop=0;requestAnimationFrame(()=>prepareExport())};
  W.shareProgressSaveV264=()=>{const p=ready();if(!p)return status('Изображение ещё готовится…');if(/iPad|iPhone|iPod/.test(navigator.userAgent)){const r=nativeShare(p.file,'');if(r){r.catch(e=>{if(e?.name!=='AbortError')download(p.blob)});return}}download(p.blob);W.toast?.('Изображение сохранено')};
  W.shareProgressNativeV264=()=>{const p=ready();if(!p)return status('Изображение ещё готовится…');const r=nativeShare(p.file,shareText());if(r){r.catch(e=>{if(e?.name!=='AbortError'){console.warn(e);download(p.blob)}});return}download(p.blob);navigator.clipboard?.writeText(shareText()).catch(()=>{});W.toast?.('Карточка сохранена')};
  W.openShareProgressV262=W.openShareProgressV264;W.shareProgressModeV262=W.shareProgressModeV264;W.shareProgressSaveV262=W.shareProgressSaveV264;W.shareProgressNativeV262=W.shareProgressNativeV264;

  function wrap(name){const f=W[name];if(typeof f!=='function'||f.__sp264)return;const w=function(){let id='';try{id=decodeURIComponent(String(arguments[0]??''))}catch(_){id=String(arguments[0]??'')}const s=(W.st?.sessions||[]).find(x=>String(x?.id||'')===id)||null;if(s){W.openShareProgressV264(s);return}return f.apply(this,arguments)};w.__sp264=true;W[name]=w;try{if(name==='advShareWorkout')advShareWorkout=w}catch(_){}try{if(name==='clientShare107')clientShare107=w}catch(_){} }
  function hook(){wrap('advShareWorkout');wrap('clientShare107')}
  hook();const poll=setInterval(hook,500);setTimeout(()=>clearInterval(poll),120000);W.addEventListener?.('unvrsl:app-ready',hook,{passive:true});
})();