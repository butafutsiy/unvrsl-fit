'use strict';
(()=>{
  if(window.__unvrslStartProgramPicker)return;
  window.__unvrslStartProgramPicker=true;
  const BUILTIN='__builtin_cycle__';
  const builtInName=()=>typeof window.unvrslBuiltInProgramName==='function'?window.unvrslBuiltInProgramName():(st.builtinProgramName||'Встроенный цикл · 8 недель');
  const routineList=()=>typeof ROUTINES!=='undefined'?ROUTINES:(window.UNVRSL_ROUTINES||[]);
  if(!st.startProgramWeeks||typeof st.startProgramWeeks!=='object')st.startProgramWeeks={};
  if(!st.startProgramId)st.startProgramId=BUILTIN;
  if(!st.primaryProgramId)st.primaryProgramId=BUILTIN;
  const defaultProgram=()=>st.primaryProgramId||st.startProgramId||BUILTIN;
  let ui={pid:defaultProgram(),week:null};

  const style=document.createElement('style');
  style.textContent=`
    .start-program-strip{display:flex;gap:10px;overflow-x:auto;padding:2px 1px 10px;scrollbar-width:none}.start-program-strip::-webkit-scrollbar{display:none}
    .start-program-choice{min-width:210px;text-align:left;background:#1f1f22;border:1px solid #35353a;border-radius:20px;padding:14px 15px;flex:0 0 auto}
    .start-program-choice.on{border-color:var(--green);box-shadow:0 0 0 1px var(--green) inset;background:#20272a}
    .start-program-choice b{display:block;font-size:16px;line-height:1.2}.start-program-choice span{display:block;color:#8e8e93;font-size:12px;margin-top:5px}
    .start-program-choice .start-program-kind{display:inline-flex;width:auto;padding:4px 8px;border-radius:999px;background:#2c2c30;color:#a8a8ad;font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;margin:0 0 7px}
    .start-program-choice.on .start-program-kind{background:rgba(10,132,255,.18);color:#64b5ff}
    .start-program-choice .start-program-kind.primary-kind{background:rgba(48,209,88,.14);color:#30d158}
    #startPickerWeeks .weekbtn.on{background:var(--green)!important;color:#061108!important;border-color:var(--green)!important;box-shadow:0 0 0 1px var(--green) inset!important}
    .start-picker-current{margin:8px 0 4px;color:#8e8e93;font-size:13px}.start-picker-day{padding:14px 0;border-bottom:1px solid #2d2d31}.start-picker-day:last-child{border-bottom:0}
  `;
  document.head.appendChild(style);

  function programs(){
    const list=[{id:BUILTIN,name:builtInName(),weeks:8,days:routineList().length,builtin:true,kind:'Встроенная'}];
    const seen=new Set([BUILTIN]);
    (Array.isArray(st.programs)?st.programs:[]).forEach(p=>{
      if(!p||p.archived||!Array.isArray(p.weeks)||!p.weeks.length)return;
      const id=String(p.id||'');
      if(!id||seen.has(id))return;
      seen.add(id);
      list.push({id,name:p.name||'Программа',weeks:p.weeks.length,days:p.weeks.reduce((a,w)=>a+(w?.days?.length||0),0),p,builtin:false,kind:'Моя программа'});
    });
    return list;
  }
  function selected(){const a=programs();return a.find(x=>x.id===ui.pid)||a.find(x=>x.id===st.primaryProgramId)||a[0]}
  function weekFor(p){
    const saved=Number(st.startProgramWeeks?.[p.id]);
    const fallback=p.builtin?Number(st.week||1):1;
    return Math.min(p.weeks,Math.max(1,ui.week||saved||fallback));
  }
  function escId(v){return encodeURIComponent(String(v))}
  function renderPicker(){
    const p=selected(),w=weekFor(p);ui.pid=p.id;ui.week=w;
    const ps=programs();
    const programHtml=ps.map(x=>{const primary=String(x.id)===String(st.primaryProgramId);return `<button class="start-program-choice ${x.id===p.id?'on':''}" onclick="selectStartProgram('${escId(x.id)}')"><span class="start-program-kind ${primary?'primary-kind':''}">${esc(primary?'Основная':x.kind)}</span><b>${esc(x.name)}</b><span>${x.weeks} нед. · ${x.days} тренировок</span></button>`}).join('');
    const weeks=Array.from({length:p.weeks},(_,i)=>i+1).map(n=>`<button class="weekbtn ${n===w?'on':''}" aria-pressed="${n===w}" onclick="selectStartWeek(${n})">W${n}</button>`).join('');
    let days='';
    if(p.builtin){
      const rows=routineList().filter(r=>r.w===w);
      days=rows.map(r=>`<div class="start-picker-day row between"><div class="grow"><b>${esc(r.c)} · ${esc(r.t)}</b><div class="muted small">RPE ${RPE[w]} · ${r.e.length} упражнений</div></div><button class="btn tiny primary" onclick="startPickedBuiltin(${w},'${escId(r.c)}')">Старт</button></div>`).join('');
    }else{
      const week=p.p?.weeks?.[w-1],rows=week?.days||[];
      days=rows.map((d,di)=>{const rr=d?.ex?.[0]?.rpe??d?.ex?.[0]?.target??8;return `<div class="start-picker-day row between"><div class="grow"><b>${esc(d.name||`День ${di+1}`)}</b><div class="muted small">RPE ${rr} · ${d.ex?.length||0} упражнений</div></div><button class="btn tiny primary" onclick="startPickedProgram('${escId(p.id)}',${w-1},${di})">Старт</button></div>`}).join('');
    }
    const html=`<div class="row between"><h2>Выбрать тренировку</h2><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="section" style="margin-top:16px">ПРОГРАММА</div><div class="start-program-strip">${programHtml}</div><div class="start-picker-current">Выбрано: <b style="color:var(--text)">${esc(p.name)}</b></div><div id="startPickerWeeks" class="weekbar">${weeks}</div><div id="startPickerDays">${days||'<div class="card muted">В этой неделе тренировок нет.</div>'}</div>`;
    const sh=document.getElementById('sheet');
    if(document.getElementById('modal')?.classList.contains('show')&&sh)sh.innerHTML=html;else modal(html);
  }

  window.selectStartProgram=function(token){ui.pid=decodeURIComponent(token);ui.week=null;st.startProgramId=ui.pid;save();renderPicker()};
  window.selectStartWeek=function(w){const p=selected();ui.week=Math.max(1,Math.min(p.weeks,+w||1));st.startProgramWeeks[p.id]=ui.week;if(p.builtin)st.week=ui.week;save();renderPicker()};
  window.startPickedBuiltin=function(w,token){const c=decodeURIComponent(token);st.startProgramId=BUILTIN;st.startProgramWeeks[BUILTIN]=w;st.week=w;window.__pendingStartProgramMeta={id:BUILTIN,name:builtInName()};save();begin(w,c)};
  window.startPickedProgram=function(token,wi,di){const pid=decodeURIComponent(token);st.startProgramId=pid;st.startProgramWeeks[pid]=wi+1;save();beginProgramDay(pid,wi,di)};
  window.openStartProgramPicker=function(){ui.pid=defaultProgram();ui.week=null;renderPicker()};

  const replacement=function(){return window.openStartProgramPicker()};
  window.quick=replacement;try{quick=replacement}catch(e){}
  window.quickWeek=function(w){return window.selectStartWeek(w)};try{quickWeek=window.quickWeek}catch(e){}

  const oldStart=window.startPage;
  if(typeof oldStart==='function'){
    const wrapped=function(){
      if(window.__pendingStartProgramMeta&&st.current&&!st.current.programId){st.current.programId=window.__pendingStartProgramMeta.id;st.current.programName=window.__pendingStartProgramMeta.name;window.__pendingStartProgramMeta=null;save()}
      return oldStart.apply(this,arguments);
    };
    window.startPage=wrapped;try{startPage=wrapped}catch(e){}
  }
})();
