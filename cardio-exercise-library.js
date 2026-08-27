'use strict';
(()=>{
  if(window.__unvrslCardioExerciseLibrary)return;window.__unvrslCardioExerciseLibrary=true;

  const CARDIO=[
    {id:'cardio:airbike',n:'Аэробайк',sets:3,seconds:40,rpe:6,rest:90,note:'Интервальная работа. Формат как в плане Антона Гарькуши.'},
    {id:'cardio:skierg',n:'Лыжный тренажёр',sets:3,seconds:40,rpe:6,rest:90,note:'Ровный средний темп или интервалы.'},
    {id:'cardio:rower',n:'Гребной тренажёр',sets:1,seconds:420,rpe:6,rest:120,note:'Равномерная работа. Длительность можно изменить.'},
    {id:'cardio:bike',n:'Велотренажёр',sets:1,seconds:600,rpe:6,rest:60,note:'Равномерное кардио.'},
    {id:'cardio:treadmill',n:'Беговая дорожка',sets:1,seconds:600,rpe:6,rest:60,note:'Бег или быстрая ходьба.'},
    {id:'cardio:incline-walk',n:'Ходьба на дорожке под наклоном',sets:1,seconds:900,rpe:6,rest:60,note:'Равномерная ходьба под наклоном.'},
    {id:'cardio:elliptical',n:'Эллиптический тренажёр',sets:1,seconds:720,rpe:6,rest:60,note:'Равномерное кардио.'},
    {id:'cardio:stairmaster',n:'Лестница / StairMaster',sets:1,seconds:900,rpe:6,rest:60,note:'Равномерный темп.'},
    {id:'cardio:stepper',n:'Степпер',sets:1,seconds:600,rpe:6,rest:60,note:'Равномерная работа.'},
    {id:'cardio:rope',n:'Скакалка',sets:5,seconds:60,rpe:7,rest:30,note:'Интервальная работа.'}
  ];

  try{if(typeof EQ_RU==='object')EQ_RU.cardio='Кардиотренажёр'}catch(e){}
  const byId=id=>CARDIO.find(x=>x.id===String(id||''))||null;
  const byName=n=>CARDIO.find(x=>x.n.toLowerCase()===String(n||'').trim().toLowerCase())||null;
  const cleanLegacyName=n=>String(n||'').trim().replace(/^\s*(?:разминка|кардио)\s*·\s*/i,'').replace(/^\s*\d+[A-Za-zА-Яа-я]?\s*·\s*/,'').trim().toLowerCase();
  const legacyPresetForName=n=>{
    const q=cleanLegacyName(n);
    if(/аэро\s*байк|аэробайк|air\s*bike/.test(q))return byId('cardio:airbike');
    if(/лыжн.*тренаж|ski\s*erg/.test(q))return byId('cardio:skierg');
    if(/гребн.*тренаж|гребля|rower/.test(q))return byId('cardio:rower');
    if(/велотренаж|велосипед|bike/.test(q))return byId('cardio:bike');
    if(/ходьб.*наклон/.test(q))return byId('cardio:incline-walk');
    if(/бегов.*дорож|treadmill/.test(q))return byId('cardio:treadmill');
    if(/эллип|ellipt/.test(q))return byId('cardio:elliptical');
    if(/лестниц|stairmaster|stair master/.test(q))return byId('cardio:stairmaster');
    if(/степпер|stepper/.test(q))return byId('cardio:stepper');
    if(/скакал|jump rope/.test(q))return byId('cardio:rope');
    return null
  };
  const legacyDurationSeconds=e=>{
    const explicit=Number(e?.durationSec||e?.workSeconds||0);if(explicit>0)return Math.round(explicit);
    const label=String(e?.repLabel||'').trim().toLowerCase();if(!label)return 0;
    let m=label.match(/(\d+(?:[.,]\d+)?)\s*(?:сек|секунд)/i);if(m)return Math.max(1,Math.round(Number(m[1].replace(',','.'))));
    m=label.match(/(\d+(?:[.,]\d+)?)\s*(?:мин|минут)/i);if(m)return Math.max(1,Math.round(Number(m[1].replace(',','.'))*60));
    return 0
  };
  const isLegacyTimedCardio=e=>legacyDurationSeconds(e)>0&&!!legacyPresetForName(e?.n);
  const isCardio=e=>e?.kind==='cardio'||e?.workMode==='timer'||!!byName(e?.n)||isLegacyTimedCardio(e);
  const fmtTime=sec=>{sec=Math.max(1,Math.round(Number(sec)||0));if(sec%60===0)return `${sec/60} мин`;if(sec>=60)return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;return `${sec} сек`};
  const formValue=sec=>sec>=120&&sec%60===0?{v:sec/60,u:'min'}:{v:sec,u:'sec'};

  function normalizeLegacyTimedCardioPrograms(){
    let changed=false;
    (Array.isArray(st?.programs)?st.programs:[]).forEach(p=>(p?.weeks||[]).forEach(w=>(w?.days||[]).forEach(d=>(d?.ex||[]).forEach(e=>{
      const sec=legacyDurationSeconds(e),preset=legacyPresetForName(e?.n);if(!(sec>0)||!preset)return;
      if(e.kind!=='cardio'||e.workMode!=='timer'||Number(e.durationSec)!==sec||Number(e.workSeconds)!==sec)changed=true;
      e.kind='cardio';e.workMode='timer';e.durationSec=sec;e.workSeconds=sec;e.sourceId=e.sourceId||preset.id;e.bp='cardio';e.tg='cardiovascular system';e.eq='cardio';
      if(!e.displayPrescription){const count=e.sets?.length||1;e.displayPrescription=`${count>1?`${count}×`:''}${fmtTime(sec)} · RPE ${e.rpe||6}`}
      (e.sets||[]).forEach(x=>{x.workSeconds=sec;x.w=0;x.r=0})
    }))));
    if(changed)try{save()}catch(e){}
    return changed
  }
  window.normalizeLegacyTimedCardioPrograms=normalizeLegacyTimedCardioPrograms;
  normalizeLegacyTimedCardioPrograms();

  const baseCatalog=window.catalogRecords;
  if(typeof baseCatalog==='function'){
    const wrapped=function(){
      const rows=baseCatalog.apply(this,arguments)||[],seen=new Set(rows.map(x=>String(x?.n||'').toLowerCase()));
      const extra=CARDIO.filter(x=>!seen.has(x.n.toLowerCase())).map(x=>({id:x.id,n:x.n,raw:x.n,rawId:x.id,bp:'cardio',tg:'cardiovascular system',eq:'cardio',secondary:[],instructions:{ru:[x.note]},image:'',gif:'',custom:true,cardioPreset:true,defaultSeconds:x.seconds,defaultSets:x.sets,defaultRpe:x.rpe,defaultRest:x.rest}));
      return [...extra,...rows]
    };
    window.catalogRecords=wrapped;try{catalogRecords=wrapped}catch(e){}
  }

  function cardioForm(x){
    const p=typeof programById==='function'?programById(x.pid):null,d=p?.weeks?.[x.wi]?.days?.[x.di],old=x.existingIndex!=null?d?.ex?.[x.existingIndex]:null,preset=byId(x.cardioId)||byName(x.n)||legacyPresetForName(x.n)||CARDIO[0];
    const sec=Number(old?.durationSec||old?.workSeconds||legacyDurationSeconds(old)||preset.seconds)||40,f=formValue(sec),sets=old?.sets?.length||preset.sets||1,rpe=Number(old?.rpe||preset.rpe||6),rest=Number(old?.rest??preset.rest??60),note=old?.note||preset.note||'';
    modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${esc(x.n)}</h2><div class="muted">Кардио · время + RPE</div></div><button class="btn tiny" onclick="openProgramEditor('${x.pid}',${x.wi},${x.di})">←</button></div><div class="method-builder-grid"><div class="field"><label>Подходов / интервалов</label><input id="cardioSets" type="number" min="1" max="20" value="${sets}"></div><div class="field"><label>Длительность</label><input id="cardioDuration" type="number" min="1" step="1" value="${f.v}"></div><div class="field"><label>Единица</label><select id="cardioUnit"><option value="sec" ${f.u==='sec'?'selected':''}>сек</option><option value="min" ${f.u==='min'?'selected':''}>мин</option></select></div><div class="field"><label>RPE</label><input id="cardioRpe" type="number" min="1" max="10" step="0.5" value="${rpe}"></div><div class="field"><label>Отдых, сек</label><input id="cardioRest" type="number" min="0" max="600" step="5" value="${rest}"></div></div><div class="field"><label>Комментарий</label><input id="cardioNote" value="${esc(note)}"></div><div class="card" style="margin:12px 0"><div class="muted small">На тренировке вместо кг и повторений будет время, кнопка таймера, RPE и отметка выполнения.</div></div><button class="btn primary full" onclick="saveCardioProgramExercise('${x.pid}',${x.wi},${x.di},'${encodeURIComponent(x.cardioId||preset.id)}',${x.existingIndex==null?'null':x.existingIndex})">Сохранить</button>`)
  }
  window.cardioProgramExerciseForm=cardioForm;

  window.saveCardioProgramExercise=function(pid,wi,di,idToken,existingIndex){
    const p=typeof programById==='function'?programById(pid):null,d=p?.weeks?.[wi]?.days?.[di],preset=byId(decodeURIComponent(idToken))||CARDIO[0];if(!p||!d)return;
    const count=Math.max(1,Math.min(20,Number(document.querySelector('#cardioSets')?.value)||1)),raw=Math.max(1,Number(document.querySelector('#cardioDuration')?.value)||1),unit=document.querySelector('#cardioUnit')?.value||'sec',seconds=Math.round(raw*(unit==='min'?60:1)),rpe=Math.max(1,Math.min(10,Number(document.querySelector('#cardioRpe')?.value)||6)),rest=Math.max(0,Math.min(600,Number(document.querySelector('#cardioRest')?.value)||0)),note=String(document.querySelector('#cardioNote')?.value||'').trim();
    const old=existingIndex!=null?d.ex?.[existingIndex]:null;
    const e={id:old?.id||(typeof uid==='function'?uid('pex'):`pex-${Date.now()}`),n:preset.n,sourceId:preset.id,bp:'cardio',tg:'cardiovascular system',eq:'cardio',kind:'cardio',workMode:'timer',method:'STANDARD',rpe,tempo:'равномерный',rest,note,durationSec:seconds,workSeconds:seconds,displayPrescription:`${count>1?`${count}×`:''}${fmtTime(seconds)} · RPE ${rpe}${rest?` · отдых ${rest} сек`:''}`,sets:Array.from({length:count},()=>({label:'',w:0,r:0,rest,workSeconds:seconds}))};
    if(existingIndex!=null)d.ex[existingIndex]=e;else d.ex.push(e);p.updated=Date.now();save();openProgramEditor(pid,wi,di)
  };

  const baseSettings=window.programExerciseSettings;
  if(typeof baseSettings==='function'){
    const wrapped=function(pid,wi,di,token,existingIndex=null){const id=decodeURIComponent(String(token||'')),preset=byId(id);if(preset)return cardioForm({pid,wi,di,n:preset.n,cardioId:preset.id,existingIndex});return baseSettings.apply(this,arguments)};
    window.programExerciseSettings=wrapped;try{programExerciseSettings=wrapped}catch(e){}
  }

  const baseEdit=window.editProgramExercise;
  if(typeof baseEdit==='function'){
    const wrapped=function(pid,wi,dayId,ei){const p=typeof programById==='function'?programById(pid):null,w=p?.weeks?.[wi],d=w?.days?.find(x=>x.id===dayId),e=d?.ex?.[ei];if(e&&isCardio(e)){programUi.day=w.days.indexOf(d);const preset=byId(e.sourceId)||byName(e.n)||legacyPresetForName(e.n)||CARDIO[0];return cardioForm({pid,wi,di:programUi.day,n:e.n,cardioId:preset.id,existingIndex:ei})}return baseEdit.apply(this,arguments)};
    window.editProgramExercise=wrapped;try{editProgramExercise=wrapped}catch(e){}
  }

  const basePrescription=window.prescriptionText;
  if(typeof basePrescription==='function'){
    const wrapped=function(e){if(isCardio(e)){const sec=Number(e.durationSec||e.workSeconds||legacyDurationSeconds(e)||e.sets?.[0]?.workSeconds||0),count=e.sets?.length||1;return `${count>1?`${count}×`:''}${fmtTime(sec)} · RPE ${e.rpe||6}${e.rest?` · отдых ${e.rest} сек`:''}`}return basePrescription.apply(this,arguments)};
    window.prescriptionText=wrapped;try{prescriptionText=wrapped}catch(e){}
  }

  function convertCurrent(pid,wi,di){
    const p=typeof programById==='function'?programById(pid):null,d=p?.weeks?.[wi]?.days?.[di],cur=st?.current;if(!p||!d||!cur||String(cur.programId||'')!==String(p.id))return false;
    let changed=false;(d.ex||[]).forEach((src,i)=>{if(!isCardio(src)||!cur.ex?.[i])return;const dst=cur.ex[i],seconds=Number(src.durationSec||src.workSeconds||legacyDurationSeconds(src)||src.sets?.[0]?.workSeconds||60);dst.n=src.n;dst.d=src.note||'';dst.rest=Number(src.rest||0);dst.target=Number(src.rpe||cur.target||6);dst.tempo=src.tempo||'равномерный';dst.mode='timer';dst.kind='cardio';dst.workSeconds=seconds;dst.timedSeconds=seconds;dst.sourceId=src.sourceId||legacyPresetForName(src.n)?.id||null;dst.set=Array.from({length:src.sets?.length||1},(_,si)=>({n:si+1,workSeconds:seconds,rpe:'',ok:false}));changed=true});
    if(changed){save();try{startPage()}catch(e){}}return changed
  }

  function restoreActiveTimedCardio(){
    const cur=st?.current;if(!cur?.programId)return false;
    const p=typeof programById==='function'?programById(cur.programId):null;if(!p)return false;
    const wi=Math.max(0,Number(cur.w||1)-1),w=p.weeks?.[wi];if(!w)return false;
    let di=(w.days||[]).findIndex(d=>String(d?.name||'')===String(cur.c||''));if(di<0)di=0;
    return convertCurrent(p.id,wi,di)
  }

  const baseBegin=window.beginProgramDay;
  if(typeof baseBegin==='function'){
    const wrapped=function(pid,wi,di){normalizeLegacyTimedCardioPrograms();const p=typeof programById==='function'?programById(pid):null,d=p?.weeks?.[wi]?.days?.[di],has=(d?.ex||[]).some(isCardio),r=baseBegin.apply(this,arguments);if(has)convertCurrent(pid,wi,di);return r};
    wrapped.__cardioLibrary=true;window.beginProgramDay=wrapped;try{beginProgramDay=wrapped}catch(e){}
  }

  window.cardioWorkTimer=function(sec,label){sec=Math.max(1,Math.round(Number(sec)||0));try{if(typeof programWorkTimer==='function')return programWorkTimer(sec,label)}catch(e){};try{if(typeof timer==='function')return timer(sec)}catch(e){}};

  const baseGroup=window.exerciseGroupCard;
  if(typeof baseGroup==='function'){
    const wrapped=function(s,group){
      const timed=group?.entries?.length&&group.entries.every(e=>e?.mode==='timer');if(!timed)return baseGroup.apply(this,arguments);
      const title=typeof displayExerciseName==='function'?displayExerciseName(group.base):group.base,last=group.entries.at(-1),restSec=Number(last?.rest||0),rows=[];group.entries.forEach((e,local)=>{const ei=group.indices[local];(e.set||[]).forEach((x,si)=>rows.push({e,x,ei,si,label:typeof variantLabel==='function'?variantLabel(e.n,si):String(si+1)}))});
      return `<div class="exercise cardio-program-ex"><div class="row between"><div class="grow"><div class="exname">${esc(title)}</div><div class="rule-line">Кардио по времени${restSec?` · отдых ${restSec} сек`:''}</div><div class="chips compact"><span class="chip green">RPE ${rows[0]?.e?.target||s.target||6}</span><span class="chip">ТАЙМЕР</span></div></div>${restSec?`<button class="btn tiny" onclick="timer(${restSec})">⏱</button>`:''}</div><div class="sethead anton-set-head"><span>Сет</span><span>время</span><span>таймер</span><span>RPE</span><span></span></div>${rows.map(z=>{const sec=Number(z.x.workSeconds||z.e.workSeconds||60);return `<div class="anton-time-set"><span class="setnum">${esc(z.label)}</span><b>${fmtTime(sec)}</b><button class="btn tiny anton-work-timer" onclick="cardioWorkTimer(${sec},'${encodeURIComponent(z.e.n)}')">▶ Таймер</button><input inputmode="decimal" value="${z.x.rpe||''}" placeholder="${z.e.target||s.target||6}" onchange="editSet(${z.ei},${z.si},'rpe',this.value)"><button class="check ${z.x.ok?'done':''}" onclick="toggleSet(${z.ei},${z.si})">${z.x.ok?'✓':'○'}</button></div>`}).join('')}</div>`
    };
    wrapped.__cardioLibrary=true;window.exerciseGroupCard=wrapped;try{exerciseGroupCard=wrapped}catch(e){}
  }

  const style=document.createElement('style');style.textContent=`
    .cardio-program-ex{border-color:rgba(10,132,255,.35)!important}.cardio-program-ex .anton-set-head,.cardio-program-ex .anton-time-set{display:grid;grid-template-columns:34px minmax(68px,.8fr) minmax(92px,1fr) minmax(70px,.8fr) 42px;gap:8px;align-items:center}.cardio-program-ex .anton-set-head{color:#777;font-size:11px;text-align:center;margin:13px 0 2px}.cardio-program-ex .anton-time-set{margin-top:8px}.cardio-program-ex .anton-time-set>b{text-align:center;font-variant-numeric:tabular-nums}.cardio-program-ex .anton-time-set input{width:100%;background:#111113;border:1px solid #343438;border-radius:13px;color:#fff;padding:11px 7px;text-align:center}.cardio-program-ex .anton-work-timer{min-height:42px}@media(max-width:390px){.cardio-program-ex .anton-set-head,.cardio-program-ex .anton-time-set{grid-template-columns:28px 62px minmax(82px,1fr) 62px 40px;gap:5px}.cardio-program-ex .anton-work-timer{padding:8px 6px!important;font-size:11px!important}}
  `;document.head.appendChild(style);

  restoreActiveTimedCardio();
  try{renderBodyFilters();renderExerciseResults()}catch(e){}
})();