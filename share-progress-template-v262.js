'use strict';
(()=>{
  const W=window,D=document,REV=263;
  if(W.__unvrslShareProgressV263)return;
  W.__unvrslShareProgressV263=true;
  W.__unvrslShareProgressV262=true;

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const fmt=v=>{const n=N(v);return n==null?'–':new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n)};
  const fmtCanvas=v=>String(fmt(v)).replace(/\u00a0/g,' ');
  const baseName=n=>typeof W.baseExerciseName==='function'?W.baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim();
  const sessionTitle=s=>[s?.c,s?.name].filter(Boolean).join(' · ')||s?.programName||s?.name||s?.c||'Тренировка';
  const dateText=s=>{const raw=s?.date||s?.endedAt||s?.ended||Date.now();try{const d=typeof raw==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(raw)?new Date(raw+'T12:00:00'):new Date(raw);return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(d)}catch(_){return String(raw||'')}};
  const durationMs=s=>{const direct=[s?.advancedMetrics?.duration,s?.finalDurationMs,s?.durationMs].map(N).find(x=>x!=null&&x>=0);if(direct!=null)return direct;const a=N(s?.started),b=N(s?.ended);if(a!=null&&b!=null&&b>=a)return b-a;const a2=Date.parse(s?.startedAt||s?.start||''),b2=Date.parse(s?.endedAt||s?.end||'');return Number.isFinite(a2)&&Number.isFinite(b2)&&b2>=a2?b2-a2:0};
  const durationText=s=>{const t=Math.max(0,Math.floor(durationMs(s)/1000)),h=Math.floor(t/3600),m=Math.floor((t%3600)/60),r=t%60,p=n=>String(n).padStart(2,'0');return h?`${h}:${p(m)}:${p(r)}`:`${m}:${p(r)}`};
  const setRpe=x=>{let p=N(x?.rpe),r=N(x?.rir);if(p==null&&r!=null)p=10-r;return p};
  const strengthSets=s=>(s?.ex||[]).flatMap(e=>e?.mode==='cardio'?[]:(e.set||[]).filter(x=>x?.ok).map(x=>({e,x,w:N(x.w)||0,reps:N(x.r)||0,rpe:setRpe(x)})));
  const tonnage=s=>{const saved=N(s?.advancedMetrics?.tonnage);return saved!=null&&saved>0?Math.round(saved):Math.round(strengthSets(s).reduce((a,z)=>a+z.w*z.reps,0))};
  const setCount=s=>{const saved=N(s?.advancedMetrics?.sets);return saved!=null&&saved>=0?Math.round(saved):strengthSets(s).length};
  const avgRpe=s=>{const saved=N(s?.advancedMetrics?.avgRpe);if(saved!=null)return Math.round(saved*10)/10;const a=strengthSets(s).map(z=>z.rpe).filter(Number.isFinite);return a.length?Math.round(a.reduce((q,x)=>q+x,0)/a.length*10)/10:null};
  const e1rm=z=>z.w>0&&z.reps>0?z.w*(1+(z.reps+clamp(10-(z.rpe??8),0,10))/30):0;
  const bestSet=s=>strengthSets(s).filter(z=>z.w>0&&z.reps>0).sort((a,b)=>e1rm(b)-e1rm(a))[0]||null;

  function exerciseRows(s){
    const map=new Map();
    (s?.ex||[]).filter(e=>e?.mode!=='cardio').forEach(e=>{
      const done=(e.set||[]).filter(x=>x?.ok);if(!done.length)return;
      const name=baseName(e.n),key=String(e.sourceId||name).toLowerCase();
      const part={name,line:done.map(x=>`${fmt(x.w)}×${fmt(x.r)}${setRpe(x)!=null?` @${fmt(setRpe(x))}`:''}`).join(' · '),volume:Math.round(done.reduce((q,x)=>q+(N(x.w)||0)*(N(x.r)||0),0))};
      if(!map.has(key))map.set(key,part);else{const old=map.get(key);old.line+=` · ${part.line}`;old.volume+=part.volume}
    });
    return [...map.values()];
  }

  function previousComparable(s){
    const a=(W.st?.sessions||[]).filter(x=>x?.ended&&String(x?.id||'')!==String(s?.id||''));
    const sig=x=>`${String(x?.programName||'').trim().toLowerCase()}|${String(x?.c||'').trim().toLowerCase()}|${String(x?.name||'').trim().toLowerCase()}`;
    const want=sig(s);
    for(let i=a.length-1;i>=0;i--)if(sig(a[i])===want)return a[i];
    for(let i=a.length-1;i>=0;i--)if(String(a[i]?.c||'').trim().toLowerCase()===String(s?.c||'').trim().toLowerCase())return a[i];
    return null;
  }

  function progressItems(s){
    const p=previousComparable(s),out=[],ct=tonnage(s),cs=setCount(s),cr=avgRpe(s),best=bestSet(s),pb=p?bestSet(p):null;
    if(p&&tonnage(p)>0&&ct>0){
      const d=(ct-tonnage(p))/tonnage(p)*100;
      if(Math.abs(d)>=.5)out.push({icon:d>0?'↗':'↘',title:`${d>0?'+':''}${fmt(d)}% тоннажа`,sub:'к прошлой такой тренировке'});
    }
    if(p&&best&&pb&&e1rm(pb)>0){
      const d=(e1rm(best)-e1rm(pb))/e1rm(pb)*100;
      if(Math.abs(d)>=.5)out.push({icon:d>0?'↑':'↓',title:`${d>0?'+':''}${fmt(d)}% силы`,sub:'по лучшему расчётному 1ПМ'});
    }
    if(p){
      const d=cs-setCount(p);
      if(d!==0)out.push({icon:d>0?'＋':'−',title:`${d>0?'+':''}${d} подход${Math.abs(d)===1?'':'а'}`,sub:`сейчас ${cs}`});
    }
    if(cr!=null)out.push({icon:'●',title:`RPE ${fmt(cr)}`,sub:cr>=9?'высокая интенсивность':cr>=8?'рабочая интенсивность':'умеренная интенсивность'});
    if(!out.length&&best)out.push({icon:'★',title:`Лучший сет ${fmt(best.w)}×${fmt(best.reps)}`,sub:`1ПМ ≈ ${fmt(e1rm(best))} кг`});
    if(!out.length)out.push({icon:'✓',title:`${cs} подходов выполнено`,sub:'тренировка сохранена как точка отсчёта'});
    return out.slice(0,3);
  }

  function recordData(s){
    const rows=[];
    const add=(exercise,type,label,value,priority=0)=>{
      const ex=String(exercise||'').trim()||'Упражнение',val=String(value||'').trim();if(!val)return;
      const key=`${ex.toLowerCase()}|${type}|${val.toLowerCase()}`;
      if(!rows.some(x=>x.key===key))rows.push({key,exercise:ex,type,label,value:val,priority});
    };
    for(const p of s?.prs||[]){
      const exercise=p?.exercise||'',weight=N(p?.weight),reps=N(p?.reps);
      if(weight&&reps)add(exercise,'best-set','Лучший сет',`${fmt(weight)}×${fmt(reps)}`,120);
      for(const raw of p?.prs||[]){
        const t=String(raw||'').trim();if(!t)continue;
        let m=t.match(/^Вес\s+([\d.,]+)\s*кг/i);if(m){add(exercise,'weight','Рекорд по весу',`${fmt(m[1])} кг`,80);continue}
        m=t.match(/^1ПМ\s*[≈~]?\s*([\d.,]+)\s*кг/i);if(m){add(exercise,'e1rm','Расчётный 1ПМ',`${fmt(m[1])} кг`,110);continue}
        m=t.match(/^(\d+)RM\s+([\d.,]+)\s*кг/i);if(m){add(exercise,`${m[1]}rm`,`${m[1]}RM`,`${fmt(m[2])} кг`,100);continue}
        add(exercise,`text:${t.toLowerCase()}`,'Рекорд',t,50);
      }
    }
    const byType=new Map();
    for(const r of rows.sort((a,b)=>b.priority-a.priority)){
      const k=`${r.exercise.toLowerCase()}|${r.type}`;
      if(!byType.has(k))byType.set(k,r);
    }
    let out=[...byType.values()].sort((a,b)=>b.priority-a.priority);
    const best=bestSet(s);
    if(!out.length&&best){
      out=[
        {exercise:baseName(best.e.n),type:'best-set',label:'Лучший сет тренировки',value:`${fmt(best.w)}×${fmt(best.reps)}`,priority:100},
        {exercise:baseName(best.e.n),type:'e1rm',label:'Расчётный 1ПМ',value:`${fmt(e1rm(best))} кг`,priority:90}
      ];
    }
    const hero=out[0]||null;
    return{hero,items:out.slice(0,3),hasRealPr:!!(s?.prs||[]).length};
  }

  function data(s){return{
    title:sessionTitle(s),date:dateText(s),time:durationText(s),tonnage:tonnage(s),sets:setCount(s),rpe:avgRpe(s),
    exercises:exerciseRows(s),best:bestSet(s),progress:progressItems(s),record:recordData(s)
  }}

  function installCss(){
    D.getElementById('share-progress-v262-style')?.remove();
    if(D.getElementById('share-progress-v263-style'))return;
    const el=D.createElement('style');el.id='share-progress-v263-style';el.textContent=`
.sp263{padding:0 0 4px}.sp263-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.sp263-head h2{margin:0;font-size:24px;line-height:1.08;letter-spacing:-.4px}.sp263-close{width:44px;height:44px;border-radius:15px;background:#2b2b2f;font-size:22px}.sp263-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;background:#202024;padding:4px;border-radius:14px;margin-bottom:13px}.sp263-tabs button{padding:10px 4px;border-radius:10px;color:#8e8e93;font-weight:800;font-size:12px}.sp263-tabs button.on{background:#3a3a40;color:#fff}.sp263-card{background:radial-gradient(circle at 92% 4%,rgba(10,132,255,.09),transparent 29%),linear-gradient(155deg,#111214,#090a0b);border:1px solid #34363b;border-radius:25px;padding:18px;box-shadow:0 18px 50px rgba(0,0,0,.35)}.sp263-top{display:flex;justify-content:space-between;gap:12px}.sp263-brand{font-weight:900;font-size:23px;letter-spacing:-.7px}.sp263-title{font-size:22px;font-weight:850;line-height:1.1;margin-top:11px;max-width:480px}.sp263-date{color:#8e8e93;margin-top:6px}.sp263-chips{display:flex;gap:7px;align-items:flex-start;flex-wrap:wrap;justify-content:flex-end}.sp263-chip{border:1px solid #34363b;border-radius:999px;padding:7px 10px;color:#a7a7ad;font-size:11px;white-space:nowrap}.sp263-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:17px}.sp263-metric{background:#1b1c20;border:1px solid #34363b;border-radius:17px;padding:12px 11px;min-width:0}.sp263-metric span{color:#8e8e93;font-size:11px;display:block}.sp263-metric b{font-size:20px;display:block;margin-top:5px;white-space:nowrap}.sp263-highlight{margin-top:14px;padding:14px;border-radius:18px;border:1px solid rgba(10,132,255,.48);background:rgba(10,132,255,.09)}.sp263-highlight small{color:#5faaff;font-weight:850}.sp263-highlight b{display:block;font-size:18px;margin-top:5px}.sp263-record-hero{text-align:center;padding:18px}.sp263-record-hero b{font-size:25px;line-height:1.15}.sp263-section{margin-top:14px;border:1px solid #34363b;background:#17181b;border-radius:19px;padding:14px}.sp263-section-title{font-size:14px;font-weight:850;margin-bottom:10px}.sp263-progress{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0}.sp263-p{padding:0 12px;border-right:1px solid #33363a;min-width:0}.sp263-p:first-child{padding-left:0}.sp263-p:last-child{border-right:0;padding-right:0}.sp263-p i{font-style:normal;font-size:18px;color:#5faaff}.sp263-p b{display:block;font-size:13px;margin-top:4px}.sp263-p small{display:block;color:#85858b;font-size:10px;margin-top:3px;line-height:1.25}.sp263-ex{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #303238}.sp263-ex:last-child{border-bottom:0;padding-bottom:0}.sp263-num{width:29px;height:29px;border-radius:50%;background:#252932;border:1px solid #3b465a;display:grid;place-items:center;font-size:12px;color:#7fb2ff;flex:0 0 auto}.sp263-ex b{display:block;font-size:14px}.sp263-ex span{display:block;color:#97979d;font-size:11px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sp263-records{display:grid;gap:8px;margin-top:12px}.sp263-record{background:#1a1b1f;border:1px solid #353943;border-radius:15px;padding:11px 12px}.sp263-record small{color:#8e8e93}.sp263-record b{display:block;margin-top:3px}.sp263-foot{text-align:center;color:#777;font-size:11px;margin-top:15px}.sp263-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:13px;position:sticky;bottom:calc(-26px - env(safe-area-inset-bottom));background:linear-gradient(transparent,#18181a 24%);padding:18px 0 calc(8px + env(safe-area-inset-bottom));z-index:4}.sp263-actions .btn{min-height:52px}.sp263-actions .primary{background:#0a84ff!important;color:#fff!important}.sp263-actions button[disabled]{opacity:.55}.sp263-status{grid-column:1/-1;text-align:center;color:#8e8e93;font-size:11px;min-height:15px}.sp263-empty{color:#8e8e93;font-size:12px}.sp263-record-note{margin-top:12px;color:#8e8e93;font-size:11px;text-align:center}
@media(max-width:520px){.sp263-card{padding:15px;border-radius:22px}.sp263-brand{font-size:20px}.sp263-title{font-size:19px}.sp263-metrics{grid-template-columns:1fr 1fr}.sp263-metric b{font-size:19px}.sp263-progress{grid-template-columns:1fr}.sp263-p{border-right:0;border-bottom:1px solid #303238;padding:9px 0}.sp263-p:first-child{padding-top:0}.sp263-p:last-child{border-bottom:0;padding-bottom:0}.sp263-actions{grid-template-columns:1fr 1fr}}
`;D.head.appendChild(el);
  }

  const metrics=d=>[['Тоннаж',d.tonnage>0?`${fmt(d.tonnage)} кг`:'–'],['Средний RPE',d.rpe!=null?fmt(d.rpe):'–'],['Подходов',String(d.sets)],['Время',d.time]];
  function headerHtml(d){return `<div class="sp263-top"><div><div class="sp263-brand">UNVRSL FIT</div><div class="sp263-title">${esc(d.title)}</div><div class="sp263-date">${esc(d.date)}</div></div><div class="sp263-chips"><span class="sp263-chip">${d.exercises.length} упражнений</span>${d.rpe!=null?`<span class="sp263-chip">RPE ${fmt(d.rpe)}</span>`:''}</div></div><div class="sp263-metrics">${metrics(d).map(([a,b])=>`<div class="sp263-metric"><span>${a}</span><b>${b}</b></div>`).join('')}</div>`}
  function exercisesHtml(d,limit){if(!d.exercises.length)return'';return `<div class="sp263-section"><div class="sp263-section-title">Упражнения</div>${d.exercises.slice(0,limit).map((x,i)=>`<div class="sp263-ex"><div class="sp263-num">${i+1}</div><div style="min-width:0"><b>${esc(x.name)}</b><span>${esc(x.line)}</span></div></div>`).join('')}</div>`}
  function compactBody(d){return `${d.best?`<div class="sp263-highlight"><small>ЛУЧШИЙ СЕТ</small><b>${esc(baseName(d.best.e.n))} · ${fmt(d.best.w)}×${fmt(d.best.reps)}</b></div>`:''}`}
  function progressBody(d){return `<div class="sp263-section"><div class="sp263-section-title">Прогресс</div><div class="sp263-progress">${d.progress.map(x=>`<div class="sp263-p"><i>${esc(x.icon)}</i><b>${esc(x.title)}</b><small>${esc(x.sub)}</small></div>`).join('')}</div></div>${exercisesHtml(d,5)}`}
  function recordBody(d){
    const r=d.record;if(!r.hero)return `<div class="sp263-section"><div class="sp263-empty">В этой тренировке пока нет силовых результатов для карточки рекорда.</div></div>`;
    const heroLabel=r.hasRealPr?'🏆 РЕКОРД':'★ ЛУЧШИЙ РЕЗУЛЬТАТ';
    const items=r.items.filter((x,i)=>i>0||x.type!==r.hero.type).slice(0,2);
    return `<div class="sp263-highlight sp263-record-hero"><small>${heroLabel}</small><b>${esc(r.hero.exercise)} · ${esc(r.hero.value)}</b><div class="sp263-record-note">${esc(r.hero.label)}</div></div>${items.length?`<div class="sp263-records">${items.map(x=>`<div class="sp263-record"><small>${esc(x.exercise)} · ${esc(x.label)}</small><b>${esc(x.value)}</b></div>`).join('')}</div>`:''}${exercisesHtml(d,3)}`;
  }
  function renderCard(s,mode='progress'){
    const d=data(s),body=mode==='compact'?compactBody(d):mode==='record'?recordBody(d):progressBody(d);
    return `<div class="sp263-card" data-share-card-v263>${headerHtml(d)}${body}<div class="sp263-foot">Сделано в UNVRSL FIT</div></div>`;
  }
  function markup(s,mode){return `<div class="sp263"><div class="sheet-grabber"></div><div class="sp263-head"><h2>Поделиться тренировкой</h2><button class="sp263-close" onclick="closeModal()">×</button></div><div class="sp263-tabs"><button class="${mode==='compact'?'on':''}" onclick="shareProgressModeV262('compact')">Кратко</button><button class="${mode==='progress'?'on':''}" onclick="shareProgressModeV262('progress')">Прогресс</button><button class="${mode==='record'?'on':''}" onclick="shareProgressModeV262('record')">Рекорд</button></div>${renderCard(s,mode)}<div class="sp263-actions"><button id="sp263Save" class="btn full" onclick="shareProgressSaveV262()">Сохранить</button><button id="sp263Share" class="btn primary full" onclick="shareProgressNativeV262()">Поделиться</button><div id="sp263Status" class="sp263-status"></div></div></div>`}

  let active=null,mode='progress',prepared=null,prepareToken=0;
  function status(t=''){const e=D.getElementById('sp263Status');if(e)e.textContent=t}
  function buttonsBusy(v){for(const id of ['sp263Save','sp263Share']){const b=D.getElementById(id);if(b)b.disabled=!!v}}
  function shareText(){if(!active)return'UNVRSL FIT';const d=data(active),lines=[`UNVRSL FIT · ${d.title}`,d.date,`${fmtCanvas(d.tonnage)} кг · ${d.sets} подходов · ${d.time}`];if(d.rpe!=null)lines.push(`Средний RPE ${fmtCanvas(d.rpe)}`);return lines.join('\n')}

  function roundRect(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
  function wrapLines(ctx,text,maxWidth){const words=String(text||'').split(/\s+/),lines=[];let line='';for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}if(line)lines.push(line);return lines}
  function drawTextBlock(ctx,text,x,y,maxWidth,lineHeight,maxLines=3){const lines=wrapLines(ctx,text,maxWidth).slice(0,maxLines);lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));return y+lines.length*lineHeight}
  function canvasHeight(d,m){if(m==='compact')return 1080;if(m==='record')return 1500;return 1650}
  function buildCanvas(s,m){
    const d=data(s),c=D.createElement('canvas'),WID=1080,H=canvasHeight(d,m);c.width=WID;c.height=H;const x=c.getContext('2d');
    x.fillStyle='#08090a';x.fillRect(0,0,WID,H);
    const grad=x.createRadialGradient(980,60,0,980,60,430);grad.addColorStop(0,'rgba(10,132,255,.12)');grad.addColorStop(1,'rgba(10,132,255,0)');x.fillStyle=grad;x.fillRect(0,0,WID,H);
    let y=82;x.fillStyle='#f5f5f7';x.font='900 52px -apple-system,BlinkMacSystemFont,system-ui,sans-serif';x.fillText('UNVRSL FIT',72,y);
    y+=64;x.font='800 46px -apple-system,BlinkMacSystemFont,system-ui,sans-serif';y=drawTextBlock(x,d.title,72,y,900,54,2)+8;
    x.fillStyle='#8e8e93';x.font='30px -apple-system,BlinkMacSystemFont,system-ui,sans-serif';x.fillText(d.date,72,y);y+=54;
    const ms=metrics(d),gap=18,cw=(936-gap)/2,ch=142;
    ms.forEach(([lab,val],i)=>{const col=i%2,row=Math.floor(i/2),px=72+col*(cw+gap),py=y+row*(ch+16);roundRect(x,px,py,cw,ch,26,'#1b1c20','#35373d');x.fillStyle='#8e8e93';x.font='25px -apple-system,system-ui';x.fillText(lab,px+25,py+42);x.fillStyle='#f5f5f7';x.font='800 40px -apple-system,system-ui';x.fillText(String(val).replace(/\u00a0/g,' '),px+25,py+96)});y+=2*(ch+16)+12;
    const section=(title,items,kind)=>{const h=kind==='progress'?Math.max(170,items.length*105+75):Math.max(150,items.length*94+72);roundRect(x,72,y,936,h,28,'#17181b','#35373d');x.fillStyle='#f5f5f7';x.font='800 28px -apple-system,system-ui';x.fillText(title,102,y+48);let yy=y+84;items.forEach((it,i)=>{if(i){x.strokeStyle='#303238';x.lineWidth=2;x.beginPath();x.moveTo(102,yy-14);x.lineTo(978,yy-14);x.stroke()}if(kind==='progress'){x.fillStyle='#5faaff';x.font='700 28px -apple-system,system-ui';x.fillText(it.icon,104,yy+18);x.fillStyle='#f5f5f7';x.font='700 27px -apple-system,system-ui';x.fillText(it.title,155,yy+12);x.fillStyle='#8e8e93';x.font='22px -apple-system,system-ui';x.fillText(it.sub,155,yy+43);yy+=100}else{x.fillStyle='#7fb2ff';x.font='800 23px -apple-system,system-ui';x.fillText(String(i+1),110,yy+16);x.fillStyle='#f5f5f7';x.font='700 26px -apple-system,system-ui';x.fillText(it.name,158,yy+10);x.fillStyle='#8e8e93';x.font='21px -apple-system,system-ui';x.fillText(it.line.slice(0,68),158,yy+41);yy+=90}});y+=h+24};
    if(m==='compact'&&d.best){roundRect(x,72,y,936,150,28,'rgba(10,132,255,.10)','rgba(10,132,255,.70)');x.fillStyle='#5faaff';x.font='800 25px -apple-system,system-ui';x.fillText('ЛУЧШИЙ СЕТ',102,y+48);x.fillStyle='#f5f5f7';x.font='800 34px -apple-system,system-ui';x.fillText(`${baseName(d.best.e.n)} · ${fmtCanvas(d.best.w)}×${fmtCanvas(d.best.reps)}`.slice(0,52),102,y+103);y+=176}
    if(m==='progress'){section('Прогресс',d.progress,'progress');if(d.exercises.length)section('Упражнения',d.exercises.slice(0,5),'exercises')}
    if(m==='record'&&d.record.hero){const r=d.record,hero=r.hero;roundRect(x,72,y,936,190,28,'rgba(10,132,255,.10)','rgba(10,132,255,.70)');x.fillStyle='#5faaff';x.font='800 25px -apple-system,system-ui';x.textAlign='center';x.fillText(r.hasRealPr?'🏆 РЕКОРД':'★ ЛУЧШИЙ РЕЗУЛЬТАТ',540,y+48);x.fillStyle='#f5f5f7';x.font='800 36px -apple-system,system-ui';const heroLines=wrapLines(x,`${hero.exercise} · ${hero.value}`,820).slice(0,2);heroLines.forEach((line,i)=>x.fillText(line,540,y+105+i*42));x.fillStyle='#8e8e93';x.font='22px -apple-system,system-ui';x.fillText(hero.label,540,y+168);x.textAlign='left';y+=216;const extra=r.items.filter((q,i)=>i>0||q.type!==hero.type).slice(0,2).map(q=>({name:`${q.exercise} · ${q.label}`,line:q.value}));if(extra.length)section('Достижения',extra,'exercises');if(d.exercises.length)section('Упражнения',d.exercises.slice(0,3),'exercises')}
    x.fillStyle='#777';x.font='24px -apple-system,system-ui';x.textAlign='center';x.fillText('Сделано в UNVRSL FIT',540,H-48);x.textAlign='left';return c;
  }
  function canvasBlob(c){return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('PNG не создан')),'image/png',.95))}
  async function prepareExport(){
    if(!active)return null;const token=++prepareToken;prepared=null;buttonsBusy(true);status('Готовим изображение…');
    try{const blob=await canvasBlob(buildCanvas(active,mode));if(token!==prepareToken)return null;prepared={blob,file:new File([blob],`unvrsl-fit-${String(active.date||new Date().toISOString().slice(0,10))}.png`,{type:'image/png'}),mode,id:String(active.id||'')};status('Готово');return prepared}catch(e){console.error('share v263 prepare',e);status('Не удалось подготовить изображение');return null}finally{if(token===prepareToken)buttonsBusy(false)}
  }
  function ensurePreparedSync(){return prepared&&prepared.mode===mode&&prepared.id===String(active?.id||'')?prepared:null}
  function downloadBlob(blob){const url=URL.createObjectURL(blob),a=D.createElement('a');a.href=url;a.download=`unvrsl-fit-${String(active?.date||new Date().toISOString().slice(0,10))}.png`;a.rel='noopener';D.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000)}
  function fileShare(file,text){if(!navigator.share)return null;try{if(navigator.canShare&&!navigator.canShare({files:[file]}))return null;return navigator.share({files:[file],title:'UNVRSL FIT',text})}catch(_){return null}}

  W.openShareProgressV262=s=>{installCss();active=s||W.st?.current||null;if(!active)return W.toast?.('Нет данных тренировки');mode='progress';prepared=null;W.modal?.(markup(active,mode));const sh=D.getElementById('sheet');if(sh)sh.scrollTop=0;requestAnimationFrame(()=>prepareExport())};
  W.shareProgressModeV262=m=>{if(!['compact','progress','record'].includes(m)||!active)return;mode=m;prepared=null;const sh=D.getElementById('sheet');if(!sh)return;sh.innerHTML=markup(active,mode);sh.scrollTop=0;requestAnimationFrame(()=>{sh.scrollTop=0;prepareExport()})};
  W.shareProgressSaveV262=()=>{
    const p=ensurePreparedSync();if(!p){status('Подготавливаем изображение…');prepareExport();return}
    if(/iPad|iPhone|iPod/.test(navigator.userAgent)&&navigator.share){const r=fileShare(p.file,'');if(r){r.catch(e=>{if(e?.name!=='AbortError'){console.warn(e);downloadBlob(p.blob)}});return}}
    try{downloadBlob(p.blob);W.toast?.('Изображение сохранено')}catch(e){console.warn(e);const r=fileShare(p.file,'');if(r)r.catch(()=>{})}
  };
  W.shareProgressNativeV262=()=>{
    const p=ensurePreparedSync();if(!p){status('Подготавливаем изображение…');prepareExport();return}
    const r=fileShare(p.file,shareText());
    if(r){r.catch(async e=>{if(e?.name==='AbortError')return;console.warn('share v263',e);try{await navigator.clipboard?.writeText(shareText());W.toast?.('Текст тренировки скопирован')}catch(_){downloadBlob(p.blob)}});return}
    try{navigator.clipboard?.writeText(shareText());downloadBlob(p.blob);W.toast?.('Карточка сохранена, текст скопирован')}catch(_){downloadBlob(p.blob)}
  };

  function wrap(name){const f=W[name];if(typeof f!=='function'||f.__sp263)return;const w=function(){let s=null,id=null;try{id=decodeURIComponent(String(arguments[0]??''))}catch(_){id=String(arguments[0]??'')}if(id)s=(W.st?.sessions||[]).find(x=>String(x?.id||'')===id)||null;if(!s&&name==='advShareWorkout')s=(W.st?.sessions||[]).find(x=>String(x?.id||'')===String(arguments[0]??''))||null;if(s){W.openShareProgressV262(s);return}return f.apply(this,arguments)};w.__sp263=true;W[name]=w;try{if(name==='advShareWorkout')advShareWorkout=w}catch(_){}try{if(name==='clientShare107')clientShare107=w}catch(_){} }
  function hook(){wrap('advShareWorkout');wrap('clientShare107')}
  hook();const poll=setInterval(hook,500);setTimeout(()=>clearInterval(poll),120000);W.addEventListener?.('unvrsl:app-ready',hook,{passive:true});
})();
