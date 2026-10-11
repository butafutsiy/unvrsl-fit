'use strict';
(()=>{
  const W=window,D=document,REV=266,TRAINER='Семён';
  if(W.__unvrslProgramWeekRpeRirV263)return;
  W.__unvrslProgramWeekRpeRirV263=true;

  const CYCLE=W.WorkoutDomain.weekProfiles;

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const fmt=v=>v==null?'–':Number(v).toFixed(1).replace('.0','').replace('.',',');
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const ui=()=>{try{return typeof programUi!=='undefined'?programUi:null}catch(_){return null}};
  const program=id=>{const s=state();try{return typeof programById==='function'?programById(id):(s?.programs||[]).find(p=>String(p?.id)===String(id))||null}catch(_){return null}};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};
  const cycleFor=(w,wi,p)=>{if(w?.weeklyLoadProfile)return w.weeklyLoadProfile;if(p?.weeks)try{return W.WorkoutDomain.cycleProfiles(p.weeks.length,{testWeek:p.cycleOptions?.testWeek!==false})[wi]}catch(_){}return CYCLE[Number(w?.n)||Number(wi)+1]||null;};
  const mid=r=>Array.isArray(r)?Math.round(((Number(r[0])+Number(r[1]))/2)*2)/2:null;
  const escHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function normalizePair(a,b,fallback){
    let x=N(a),y=N(b);
    if(x==null||y==null){x=fallback?.[0]??null;y=fallback?.[1]??null}
    if(x==null||y==null)return [null,null];
    return [Math.min(x,y),Math.max(x,y)]
  }

  function ensureWeekDefaults(p,wi,force=false){
    const w=p?.weeks?.[Number(wi)],d=cycleFor(w,wi,p);if(!w||!d)return false;
    if(w.loadProfileManual===true&&!force)return false;
    let changed=false;
    const set=(k,v)=>{if(force||w[k]==null||w[k]===''){if(w[k]!==v){w[k]=v;changed=true}}};
    set('intensityMin',d.pct[0]);set('intensityMax',d.pct[1]);set('useIntensity',true);
    set('rpeMin',d.rpe[0]);set('rpeMax',d.rpe[1]);set('rirMin',Math.max(0,10-d.rpe[1]));set('rirMax',Math.max(0,10-d.rpe[0]));
    set('tempo',d.tempo);set('baseRestMin',d.baseRest[0]);set('baseRestMax',d.baseRest[1]);set('isolationRestMin',d.isoRest[0]);set('isolationRestMax',d.isoRest[1]);
    if(Object.prototype.hasOwnProperty.call(w,'methods')){delete w.methods;changed=true}
    set('focus',d.focus);set('testWeek',!!d.test);set('loadProfileRevision',REV);set('loadProfileAuto',true);
    if(changed)p.updated=Date.now();
    return changed
  }

  function ensureProgramDefaults(p,force=false){
    if(!p?.weeks)return false;let changed=false;
    p.weeks.forEach((_,i)=>{if(ensureWeekDefaults(p,i,force))changed=true});
    if(changed)saveState();return changed
  }

  function weekProfile(p,wi,useDefaults=true){
    const w=p?.weeks?.[Number(wi)];if(!w)return null;
    const d=useDefaults?cycleFor(w,wi,p):null,wn=Number(w.n)||Number(wi)+1;
    let [intensityMin,intensityMax]=normalizePair(w.intensityMin??w.weekIntensityMin??w.intensity?.min,w.intensityMax??w.weekIntensityMax??w.intensity?.max,w.useIntensity===false?null:d?.pct);
    if(intensityMin!=null&&intensityMin<=1)intensityMin*=100;if(intensityMax!=null&&intensityMax<=1)intensityMax*=100;
    const [rpeMin,rpeMax]=normalizePair(w.rpeMin??w.weekRpeMin,w.rpeMax??w.weekRpeMax,d?.rpe);
    const rirHigh=rpeMin==null?null:Math.max(0,10-rpeMin),rirLow=rpeMax==null?null:Math.max(0,10-rpeMax);
    const [baseRestMin,baseRestMax]=normalizePair(w.baseRestMin,w.baseRestMax,d?.baseRest);
    const [isolationRestMin,isolationRestMax]=normalizePair(w.isolationRestMin,w.isolationRestMax,d?.isoRest);
    return {
      week:wn,intensityMin,intensityMax,rpeMin,rpeMax,rirHigh,rirLow,
      tempo:String(w.tempo||d?.tempo||''),baseRestMin,baseRestMax,isolationRestMin,isolationRestMax,
      isolation:d?.isolation,base:d?.base,focus:String(w.focus||d?.focus||''),test:!!(w.testWeek??d?.test),manual:w.loadProfileManual===true,useIntensity:w.useIntensity!==false
    }
  }
  W.unvrslWeekLoadProfileV263=weekProfile;

  function exerciseKind(ex){
    try{const k=W.trainingLoadModel258?.exerciseKind?.({n:ex?.n||'',method:'STANDARD'});if(k==='compound'||k==='isolation')return k}catch(_){ }
    const s=String(ex?.n||'').toLowerCase();
    return /(разгибан|сгибан|подъем|подъём|мах|разведен|сведен|бицеп|трицеп|кроссов|икр|дельт)/.test(s)?'isolation':'compound'
  }
  function ensureStyle(){
    if(D.getElementById('program-week-rpe-rir-v263-style'))return;
    const s=D.createElement('style');s.id='program-week-rpe-rir-v263-style';s.textContent=`
      .wr264-box{margin-top:12px;padding-top:12px;border-top:1px solid #303034}.wr264-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.wr264-head b{font-size:14px}.wr264-rir{font-size:12px;font-weight:800;color:var(--green)}
      .wr264-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.wr264-grid .field{margin:0}.wr264-wide{grid-column:1/-1}.wr264-help{margin-top:8px;color:#85858b;font-size:11px;line-height:1.4}.wr264-focus{margin-top:9px}.wr264-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.wr264-actions .btn{width:100%;touch-action:manipulation}
      .wr264-client{margin:9px 0 13px;padding:12px 13px;border-radius:16px;background:#1a1a1d;border:1px solid #303034}.wr264-client-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.wr264-client-title{font-size:14px;font-weight:850}.wr264-client-pct{color:var(--green);font-size:13px;font-weight:850;white-space:nowrap}
      .wr264-client-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.wr264-client-chip{display:inline-flex;padding:5px 8px;border-radius:999px;background:#29292d;color:#d3d3d7;font-size:11px;font-weight:800}.wr264-focus-text{margin-top:8px;color:#a3a3a8;font-size:11px;line-height:1.35}.wr264-trainer{margin-top:8px;color:#8e8e93;font-size:11px;font-weight:700}
      .wr264-ex-note{margin:8px 0 10px;padding:10px 11px;border-radius:14px;background:#1a1a1d;border:1px solid #303034}.wr264-ex-line{font-size:11px;color:#9a9aa0;line-height:1.4}.wr264-ex-line b{color:#dddde1}.wr264-auto-btn{margin-top:8px;width:100%;touch-action:manipulation}
      .pi261-preset,.pi261-week button{touch-action:manipulation}
      @media(max-width:390px){.wr264-grid{grid-template-columns:1fr 1fr}.wr264-actions{grid-template-columns:1fr}}
    `;D.head?.appendChild(s)
  }

  function currentEditorContext(){const u=ui(),p=u?.pid?program(u.pid):null,wi=Number(u?.week)||0;return {u,p,wi,w:p?.weeks?.[wi]||null}}
  function field(id){return D.getElementById(id)}
  function setValue(id,v){const el=field(id);if(el&&v!=null)el.value=v}
  function syncRirPreview(){
    for(const prefix of ['', 'Iso']){
      const a=N(field(`wr264${prefix}RpeMin`)?.value),b=N(field(`wr264${prefix}RpeMax`)?.value),out=field(`wr264${prefix}Rir`);if(!out)continue;
      const value=a==null||b==null?'RIR –':`RIR ${fmt(10-Math.min(a,b))}→${fmt(10-Math.max(a,b))}`;if(out.textContent!==value)out.textContent=value;
    }
  }

  function populateEditorFromProfile(pr){
    if(!pr)return;setValue('pi261Min',pr.intensityMin);setValue('pi261Max',pr.intensityMax);setValue('wr264RpeMin',pr.rpeMin);setValue('wr264RpeMax',pr.rpeMax);setValue('wr264Tempo',pr.tempo);setValue('wr264BaseRestMin',pr.baseRestMin);setValue('wr264BaseRestMax',pr.baseRestMax);setValue('wr264IsoRestMin',pr.isolationRestMin);setValue('wr264IsoRestMax',pr.isolationRestMax);setValue('wr264Focus',pr.focus);for(const [prefix,spec] of [['Base',pr.base],['Iso',pr.isolation]])if(spec){setValue(`wr264${prefix}Sets`,spec.sets);if(prefix==='Iso'){setValue('wr264IsoPctMin',spec.pct[0]);setValue('wr264IsoPctMax',spec.pct[1]);setValue('wr264IsoRpeMin',spec.rpe[0]);setValue('wr264IsoRpeMax',spec.rpe[1]);}}syncRirPreview();
    const band=D.querySelector('#sheet .pi261-band');if(band&&pr.useIntensity===false)band.textContent='По усилию';else if(band&&pr.intensityMin!=null&&pr.intensityMax!=null)band.textContent=`${fmt(pr.intensityMin)}–${fmt(pr.intensityMax)}%`
  }

  function applyCycleToEditor(weekNo){
    const d=CYCLE[Number(weekNo)];if(!d)return;
    populateEditorFromProfile({intensityMin:d.pct[0],intensityMax:d.pct[1],rpeMin:d.rpe[0],rpeMax:d.rpe[1],tempo:d.tempo,baseRestMin:d.baseRest[0],baseRestMax:d.baseRest[1],isolationRestMin:d.isoRest[0],isolationRestMax:d.isoRest[1],focus:d.focus,base:d.base,isolation:d.isolation})
  }

  function bindIntensityButtons(card,p,wi){
    card.querySelectorAll('.pi261-preset').forEach(btn=>{
      btn.removeAttribute('onclick');
      if(btn.dataset.wr265Bound==='1')return;
      btn.dataset.wr265Bound='1';
      btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const nums=(btn.textContent||'').match(/[\d,.]+/g)||[],lo=N(nums[0]),hi=N(nums[1]??(lo===100?105:null));if(lo==null||hi==null)return;
       const base=W.WorkoutDomain.bandPrescription([lo,hi]),isolation=W.WorkoutDomain.bandPrescription([lo,hi],true),d=cycleFor(p.weeks[wi],wi,p);
       populateEditorFromProfile({intensityMin:lo,intensityMax:hi,rpeMin:base.rpe[0],rpeMax:base.rpe[1],base,isolation,tempo:d.tempo,baseRestMin:d.baseRest[0],baseRestMax:d.baseRest[1],isolationRestMin:d.isoRest[0],isolationRestMax:d.isoRest[1],focus:d.focus});
       W.programWeekIntensityPresetV261?.(lo,hi);
      },{passive:false})
    });
    const saveBtn=[...card.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Сохранить интенсивность')||(b.textContent||'').includes('Сохранить профиль недели')||(b.getAttribute('onclick')||'').includes('programWeekIntensitySaveV261'));
    if(saveBtn){saveBtn.removeAttribute('onclick');saveBtn.textContent='Сохранить профиль недели';if(saveBtn.dataset.wr265Bound!=='1'){saveBtn.dataset.wr265Bound='1';saveBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();saveProfile(p,wi)},{passive:false})}}
  }

  function saveProfile(p,wi){
    const w=p?.weeks?.[Number(wi)];if(!p||!w)return;
    let i1=N(field('pi261Min')?.value),i2=N(field('pi261Max')?.value),r1=N(field('wr264RpeMin')?.value),r2=N(field('wr264RpeMax')?.value);
    if(i1==null||i2==null)return W.toast?.('Укажи интенсивность недели');
    if(r1==null||r2==null)return W.toast?.('Укажи RPE недели');
    const pr=JSON.parse(JSON.stringify(w.weeklyLoadProfile||cycleFor(w,wi,p)));
    const isoPct=normalizePair(field('wr264IsoPctMin')?.value,field('wr264IsoPctMax')?.value,pr.isolation.pct),isoRpe=normalizePair(field('wr264IsoRpeMin')?.value,field('wr264IsoRpeMax')?.value,pr.isolation.rpe);
    if(isoPct.some(n=>n==null||n<0||n>110)||isoRpe.some(n=>n==null||n<0||n>10))return W.toast?.('Проверь проценты и RPE изоляции');
    i1=clamp(i1,40,110);i2=clamp(i2,40,110);r1=clamp(r1,1,10);r2=clamp(r2,1,10);
    w.intensityMin=Math.min(i1,i2);w.intensityMax=Math.max(i1,i2);w.useIntensity=field('pi261Use')?.checked!==false;
    w.rpeMin=Math.min(r1,r2);w.rpeMax=Math.max(r1,r2);w.rirMin=Math.max(0,10-w.rpeMax);w.rirMax=Math.max(0,10-w.rpeMin);
    w.tempo=String(field('wr264Tempo')?.value||'').trim()||cycleFor(w,wi)?.tempo||'2-0-2';
    const br=normalizePair(field('wr264BaseRestMin')?.value,field('wr264BaseRestMax')?.value,cycleFor(w,wi)?.baseRest),ir=normalizePair(field('wr264IsoRestMin')?.value,field('wr264IsoRestMax')?.value,cycleFor(w,wi)?.isoRest);
    w.baseRestMin=Math.max(0,br[0]??0);w.baseRestMax=Math.max(w.baseRestMin,br[1]??w.baseRestMin);w.isolationRestMin=Math.max(0,ir[0]??0);w.isolationRestMax=Math.max(w.isolationRestMin,ir[1]??w.isolationRestMin);
    if(Object.prototype.hasOwnProperty.call(w,'methods'))delete w.methods;
    w.focus=String(field('wr264Focus')?.value||'').trim();w.testWeek=!!cycleFor(w,wi)?.test;w.loadProfileManual=true;w.loadProfileAuto=false;w.loadProfileRevision=REV;
    pr.pct=[w.intensityMin,w.intensityMax];pr.rpe=[w.rpeMin,w.rpeMax];pr.focus=w.focus;pr.tempo=w.tempo;pr.baseRest=[w.baseRestMin,w.baseRestMax];pr.isoRest=[w.isolationRestMin,w.isolationRestMax];
    pr.base={...pr.base,sets:Math.round(clamp(N(field('wr264BaseSets')?.value)??pr.base.sets,1,20)),pct:pr.pct,rpe:pr.rpe,rir:[10-w.rpeMax,10-w.rpeMin],reps:[w.baseRepMin,w.baseRepMax]};
    pr.isolation={...pr.isolation,sets:Math.round(clamp(N(field('wr264IsoSets')?.value)??pr.isolation.sets,0,20)),pct:isoPct,rpe:isoRpe,rir:[10-isoRpe[1],10-isoRpe[0]],reps:[w.isolationRepMin,w.isolationRepMax]};
    if(pr.test)pr.isolation.sets=0;
    w.weeklyLoadProfile=pr;w.repGuidanceManual=true;w.repGuidanceAuto=false;
    W.cycleReapplyWeek?.(p,Number(wi));W.cycleRememberManualProfiles?.(p);
    p.updated=Date.now();saveState();
    try{W.toast?.('Профиль недели сохранён')}catch(_){ }
    try{typeof renderProgramEditor==='function'&&renderProgramEditor()}catch(_){ }
  }

  function applyWholeCycle(p){
    if(!p)return;
    const profiles=W.WorkoutDomain.cycleProfiles(p.weeks.length,{testWeek:p.cycleOptions?.testWeek!==false});
    p.weeks.forEach((w,i)=>{W.WorkoutDomain.applyWeekProfile(w,profiles[i]);w.loadProfileManual=false;w.repGuidanceManual=false;W.cycleReapplyWeek?.(p,i);});
    p.cycleOptions={...p.cycleOptions,periodizationMode:'auto'};delete p.cycleOptions.weekProfiles;delete p.cycleOptions.phaseSchedule;delete p.cycleOptions.priority;p.updated=Date.now();saveState();
    try{W.toast?.('Периодизация цикла применена')}catch(_){ }
    try{typeof renderProgramEditor==='function'&&renderProgramEditor()}catch(_){ }
  }

  function injectEditor(){
    ensureStyle();const {p,wi,w}=currentEditorContext(),card=D.querySelector('#sheet .pi261-week');if(!p||!w||!card)return;
    ensureProgramDefaults(p,false);const pr=weekProfile(p,wi,true);if(!pr)return;
    const editorKey=`${String(p.id)}|${wi}`;
    const existing=card.querySelector('.wr264-box');
    if(existing&&existing.dataset.editorKey===editorKey){bindIntensityButtons(card,p,wi);syncRirPreview();W.dispatchEvent?.(new CustomEvent('unvrsl:program-week-profile-mounted',{detail:{key:editorKey}}));return}
    populateEditorFromProfile(pr);
    existing?.remove();card.querySelector('.wr263-box')?.remove();
    const box=D.createElement('div');box.className='wr264-box';box.dataset.editorKey=editorKey;box.innerHTML=`
      <div class="wr264-head"><b>База · RPE / RIR</b><span id="wr264Rir" class="wr264-rir">RIR ${fmt(pr.rirHigh)}→${fmt(pr.rirLow)}</span></div>
      <div class="wr264-grid"><div class="field"><label>RPE от</label><input id="wr264RpeMin" inputmode="decimal" min="1" max="10" step="0.5" value="${pr.rpeMin??''}"></div><div class="field"><label>RPE до</label><input id="wr264RpeMax" inputmode="decimal" min="1" max="10" step="0.5" value="${pr.rpeMax??''}"></div></div>
      <div class="wr264-grid" style="margin-top:8px"><div class="field"><label>Подходы базы за неделю</label><input id="wr264BaseSets" type="number" min="1" max="20" value="${pr.base?.sets??4}"></div><div class="field"><label>Подходы изоляции за неделю</label><input id="wr264IsoSets" type="number" min="0" max="20" value="${pr.isolation?.sets??3}"></div></div>
      <div class="wr264-head" style="margin-top:12px"><b>Изоляция · своя нагрузка</b><span id="wr264IsoRir" class="wr264-rir"></span></div><div class="wr264-grid"><div class="field"><label>% от своего 1ПМ · от</label><input id="wr264IsoPctMin" type="number" min="0" max="110" value="${pr.isolation?.pct[0]??60}"></div><div class="field"><label>% до</label><input id="wr264IsoPctMax" type="number" min="0" max="110" value="${pr.isolation?.pct[1]??65}"></div><div class="field"><label>RPE от</label><input id="wr264IsoRpeMin" type="number" min="1" max="10" step="0.5" value="${pr.isolation?.rpe[0]??7}"></div><div class="field"><label>RPE до</label><input id="wr264IsoRpeMax" type="number" min="1" max="10" step="0.5" value="${pr.isolation?.rpe[1]??8}"></div></div>
      <div class="wr264-help">RIR считается автоматически: RIR = 10 − RPE. Конкретная нагрузка проверяется вместе с повторами и % e1RM.</div>
      <div class="wr264-grid" style="margin-top:12px"><div class="field wr264-wide"><label>Темп недели</label><input id="wr264Tempo" value="${escHtml(pr.tempo)}"></div><div class="field"><label>Отдых база, от · сек</label><input id="wr264BaseRestMin" inputmode="numeric" value="${pr.baseRestMin??''}"></div><div class="field"><label>До · сек</label><input id="wr264BaseRestMax" inputmode="numeric" value="${pr.baseRestMax??''}"></div><div class="field"><label>Отдых изоляция, от · сек</label><input id="wr264IsoRestMin" inputmode="numeric" value="${pr.isolationRestMin??''}"></div><div class="field"><label>До · сек</label><input id="wr264IsoRestMax" inputmode="numeric" value="${pr.isolationRestMax??''}"></div></div>
      <div class="field wr264-focus"><label>Фокус недели</label><input id="wr264Focus" value="${escHtml(pr.focus)}"></div>
      <div class="wr264-help">Методы тренировки выбираются вручную в каждом упражнении и не зависят от недели.</div>
      <div class="wr264-actions"><button class="btn" type="button" data-wr264-week>Вернуть W${pr.week} по схеме</button><button class="btn" type="button" data-wr264-cycle>Вернуть автоматический цикл</button></div>`;
    const toggle=card.querySelector('.pi261-toggle');if(toggle)toggle.insertAdjacentElement('beforebegin',box);else card.appendChild(box);
    for(const id of ['wr264RpeMin','wr264RpeMax','wr264IsoRpeMin','wr264IsoRpeMax'])field(id)?.addEventListener('input',syncRirPreview);
    box.querySelector('[data-wr264-week]')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();(()=>{const profile=W.WorkoutDomain.cycleProfiles(p.weeks.length,{testWeek:p.cycleOptions?.testWeek!==false})[wi];populateEditorFromProfile({intensityMin:profile.pct[0],intensityMax:profile.pct[1],rpeMin:profile.rpe[0],rpeMax:profile.rpe[1],tempo:profile.tempo,baseRestMin:profile.baseRest[0],baseRestMax:profile.baseRest[1],isolationRestMin:profile.isoRest[0],isolationRestMax:profile.isoRest[1],focus:profile.focus,base:profile.base,isolation:profile.isolation});})()},{passive:false});
    box.querySelector('[data-wr264-cycle]')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();applyWholeCycle(p)},{passive:false});
    bindIntensityButtons(card,p,wi);syncRirPreview();W.dispatchEvent?.(new CustomEvent('unvrsl:program-week-profile-mounted',{detail:{key:editorKey}}))
  }

  function patchCopyWeek(){
    let cur=null;try{cur=typeof copyProgramWeek==='function'?copyProgramWeek:W.copyProgramWeek}catch(_){cur=W.copyProgramWeek}
    if(typeof cur!=='function'||cur.__wr264)return false;
    const wrapped=function(id,wi){const r=cur.apply(this,arguments),p=program(id),nw=p?.weeks?.[Number(wi)+1];if(nw){nw.loadProfileManual=false;ensureWeekDefaults(p,Number(wi)+1,true);saveState()}setTimeout(injectEditor,0);return r};wrapped.__wr264=true;W.copyProgramWeek=wrapped;try{copyProgramWeek=wrapped}catch(_){ }return true
  }

  function clientCard(pr){
    if(!pr)return null;const node=D.createElement('div');node.className='wr264-client';const pct=pr.useIntensity===false?'По усилию':pr.test?'Тест':`${fmt(pr.intensityMin)}–${fmt(pr.intensityMax)}%`;
    node.innerHTML=`<div class="wr264-client-top"><div class="wr264-client-title">W${pr.week} · нагрузка недели</div><div class="wr264-client-pct">${pct}</div></div><div class="wr264-client-chips"><span class="wr264-client-chip">RPE ${fmt(pr.rpeMin)}–${fmt(pr.rpeMax)}</span><span class="wr264-client-chip">RIR ${fmt(pr.rirHigh)}→${fmt(pr.rirLow)}</span><span class="wr264-client-chip">Темп ${escHtml(pr.tempo)}</span><span class="wr264-client-chip">База ${pr.baseRestMin}–${pr.baseRestMax}с</span><span class="wr264-client-chip">Изоляция ${pr.isolationRestMin}–${pr.isolationRestMax}с</span></div><div class="wr264-focus-text">${escHtml(pr.focus)}</div><div class="wr264-trainer">Тренер ${TRAINER}</div>`;return node
  }
  function selectedClientProgram(){
    const s=state(),key=String(s?.clientPlanViewKey||s?.clientPrimaryProgramKey||'');if(!key.startsWith('coach:'))return null;const p=(s?.programs||[]).find(x=>String(x?.id)===key.slice(6));if(!p)return null;const saved=Number(s?.clientProgramWeeks?.[key]||1),wi=Math.max(0,Math.min((p.weeks?.length||1)-1,saved-1));return {p,wi,profile:weekProfile(p,wi,true)}
  }
  function decorateClientPlan(){
    if(!W.cloud?.user)return;let client=true;try{client=typeof W.unvrslTrainerMode==='function'?!W.unvrslTrainerMode():W.cloud?.profile?.role!=='trainer'}catch(_){ }if(!client)return;
    const ctx=selectedClientProgram(),weeks=D.getElementById('clientPlanWeeks');if(ctx&&weeks){D.querySelector('#plan .wr264-client')?.remove();D.querySelector('#plan .wr263-client')?.remove();const c=clientCard(ctx.profile);if(c)weeks.insertAdjacentElement('afterend',c)}
  }
  function decorateStartPicker(){
    if(!W.cloud?.user)return;const weeks=D.getElementById('clientPickerWeeks');if(!weeks)return;const s=state();let p=null,key=String(s?.clientLastProgramKey||s?.clientPrimaryProgramKey||'');if(key.startsWith('coach:'))p=(s?.programs||[]).find(x=>String(x?.id)===key.slice(6));if(!p){const on=D.querySelector('.client-program-choice.on b')?.textContent?.trim();if(on)p=(s?.programs||[]).find(x=>String(x?.name||'').trim()===on)}if(!p)return;const active=D.querySelector('#clientPickerWeeks .weekbtn.on')?.textContent||'W1',wi=Math.max(0,(Number(active.replace(/\D/g,''))||1)-1),pr=weekProfile(p,wi,true);D.querySelector('#sheet .wr264-client')?.remove();D.querySelector('#sheet .wr263-client')?.remove();const c=clientCard(pr);if(c)weeks.insertAdjacentElement('afterend',c)
  }

  function annotateCurrent(){
    const s=state(),cur=s?.current;if(!cur?.programId)return;const p=program(cur.programId);if(!p)return;const wi=Math.max(0,Number(cur.programWeekNumber||cur.w||1)-1),pr=weekProfile(p,wi,true);if(!pr)return;
    const sig=[pr.week,pr.intensityMin,pr.intensityMax,pr.rpeMin,pr.rpeMax,pr.tempo,pr.baseRestMin,pr.baseRestMax,pr.isolationRestMin,pr.isolationRestMax].join('|');if(cur.weekLoadProfileSigV264===sig)return;
    cur.weekLoadProfileSigV264=sig;cur.programWeekRpeMin=pr.rpeMin;cur.programWeekRpeMax=pr.rpeMax;cur.programWeekRirMin=pr.rirLow;cur.programWeekRirMax=pr.rirHigh;cur.programWeekTempo=pr.tempo;cur.programWeekBaseRestMin=pr.baseRestMin;cur.programWeekBaseRestMax=pr.baseRestMax;cur.programWeekIsolationRestMin=pr.isolationRestMin;cur.programWeekIsolationRestMax=pr.isolationRestMax;delete cur.programWeekMethods;cur.programWeekFocus=pr.focus;cur.programWeekLoadProfileRevision=REV;
    if(!(N(cur.target)>0)&&pr.rpeMin!=null&&pr.rpeMax!=null)cur.target=Math.round(((pr.rpeMin+pr.rpeMax)/2)*2)/2;
    (cur.ex||[]).forEach(ex=>{const kind=exerciseKind(ex);if(!ex.tempo)ex.tempo=pr.tempo;if(!(N(ex.rest)>0))ex.rest=mid(kind==='isolation'?[pr.isolationRestMin,pr.isolationRestMax]:[pr.baseRestMin,pr.baseRestMax])||90});saveState()
  }

  function install(){patchCopyWeek();injectEditor();decorateClientPlan();decorateStartPicker();annotateCurrent()}
  let queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;ensureStyle();install()})}
  const mo=typeof MutationObserver==='function'?new MutationObserver(queue):null;[D.getElementById('plan'),D.getElementById('sheet'),D.getElementById('start')].filter(Boolean).forEach(root=>mo?.observe(root,{childList:true,subtree:true}));
  W.addEventListener?.('unvrsl:program-intensity-mounted',queue,{passive:true});W.addEventListener?.('unvrsl:program-editor-rendered',queue,{passive:true});
  for(const e of ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:cloud-ready','unvrsl:client-ready','unvrsl:training-engine-ready'])W.addEventListener?.(e,queue,{passive:true});
  queue()
})();
