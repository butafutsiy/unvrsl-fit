'use strict';
(()=>{
  if(window.__unvrslReadinessQuestionnaireV227)return;
  window.__unvrslReadinessQuestionnaireV227=true;
  const W=window;
  const state={values:{sleep:null,energy:null,stress:null,recovery:null},manual:null,lastAuto:0};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
  const fmt=p=>`${p>0?'+':''}${String(p).replace('.',',')}%`;
  const style=document.createElement('style');
  style.id='readiness-questionnaire-v227-style';
  style.textContent=`
    .rq227{padding:2px 0 4px}.rq227 h2{font-size:30px!important;line-height:1.05;margin:4px 0 8px!important;letter-spacing:-.7px}.rq227-sub{font-size:16px;color:#8e8e93;margin-bottom:18px}
    .rq227-rows{display:grid;gap:14px}.rq227-row{display:grid;grid-template-columns:minmax(128px,1fr) minmax(250px,1.45fr);gap:14px;align-items:center}.rq227-label{font-size:17px;font-weight:800;letter-spacing:-.2px}
    .rq227-scale{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.rq227-score{height:48px;border-radius:15px;background:#2a2a2e;border:1px solid transparent;color:#a9a9af;font-weight:800;font-size:17px}.rq227-score.on{background:var(--green);color:#061108;border-color:transparent}.rq227-score:active{transform:scale(.97)}
    .rq227-result{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin:18px 0 15px;padding:16px;border-radius:20px;background:#242428;border:1px solid #303034}.rq227-result b{display:block;font-size:17px}.rq227-result span{display:block;color:#9b9ba1;margin-top:5px;line-height:1.35}.rq227-badge{min-width:58px;text-align:center;padding:10px 12px;border-radius:999px;border:1px solid color-mix(in srgb,var(--green) 65%,transparent);color:var(--green);font-weight:800}
    .rq227-manual-title{font-size:14px;color:#8e8e93;margin:4px 2px 9px}.rq227-manual{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.rq227-manual button{min-height:45px;border-radius:14px;background:#29292d;color:#b2b2b7;font-size:15px}.rq227-manual button.on{outline:1.5px solid var(--green);color:var(--green);background:color-mix(in srgb,var(--green) 11%,#29292d)}
    .rq227-actions{margin-top:16px}.rq227-start{min-height:54px;font-size:18px!important;border-radius:18px!important}.rq227-start:disabled{opacity:.45}.rq227-plan{min-height:52px;margin-top:10px!important;font-size:17px!important;border-radius:18px!important;background:#303034!important}.rq227-note{color:#777;font-size:11px;line-height:1.4;margin:10px 3px 0}
    @media(max-width:520px){
      .rq227{padding:0 0 2px}.rq227 .sheet-grabber{margin-bottom:8px}.rq227 h2{font-size:26px!important;margin:0 0 5px!important}.rq227-sub{font-size:14px;margin-bottom:13px}
      .rq227-rows{gap:10px}.rq227-row{grid-template-columns:110px minmax(0,1fr);gap:7px}.rq227-label{font-size:13.5px;letter-spacing:-.35px;white-space:nowrap}.rq227-scale{gap:5px}.rq227-score{height:41px;border-radius:13px;font-size:15px}
      .rq227-result{margin:13px 0 11px;padding:12px 13px;border-radius:17px;gap:8px}.rq227-result b{font-size:15px}.rq227-result span{font-size:12px;margin-top:3px}.rq227-badge{min-width:52px;padding:8px 9px;font-size:14px}
      .rq227-manual-title{font-size:12px;margin:2px 2px 7px}.rq227-manual{grid-template-columns:repeat(5,1fr);gap:6px}.rq227-manual button{min-height:39px;border-radius:12px;font-size:12px;padding:6px 2px}
      .rq227-actions{margin-top:12px}.rq227-start{min-height:47px;font-size:16px!important;border-radius:15px!important}.rq227-plan{min-height:45px;margin-top:7px!important;font-size:15px!important;border-radius:15px!important}.rq227-note{font-size:9px;margin-top:7px}
    }
  `;
  document.head.appendChild(style);

  function workoutSubtitle(){
    const cur=W.st?.current;
    if(cur?.c)return `${cur.w?`${cur.w} · `:''}${cur.c}`;
    return 'Перед началом тренировки';
  }
  function scoreAndPercent(){
    const v=state.values;
    if(Object.values(v).some(x=>x==null))return{ready:false,score:null,percent:0};
    const pos=x=>(x-1)/4;
    const score=Math.round(pos(v.sleep)*25+pos(v.energy)*30+pos(v.recovery)*30+pos(v.stress)*15);
    let percent=0;
    if(score<30)percent=-10;
    else if(score<50)percent=-7.5;
    else if(score<70)percent=-5;
    else if(score<85)percent=-2.5;
    state.lastAuto=percent;
    return{ready:true,score,percent};
  }
  function hiddenInputs(){
    const v=state.values;
    const touched=x=>x==null?'0':'1';
    return `<input type="hidden" id="te200Sleep" data-touched="${touched(v.sleep)}" value="${v.sleep??3}"><input type="hidden" id="te200Energy" data-touched="${touched(v.energy)}" value="${v.energy??3}"><input type="hidden" id="te200Sore" data-touched="${touched(v.recovery)}" value="${v.recovery==null?3:6-v.recovery}"><input type="hidden" id="te200Stress" data-touched="${touched(v.stress)}" value="${v.stress==null?3:6-v.stress}">`;
  }
  function metricRow(key,label){
    const selected=state.values[key];
    return `<div class="rq227-row"><div class="rq227-label">${label}</div><div class="rq227-scale">${[1,2,3,4,5].map(n=>`<button type="button" class="rq227-score${selected===n?' on':''}" onclick="readinessUiSetV227('${key}',${n})">${n}</button>`).join('')}</div></div>`;
  }
  function manualButtons(){
    return [-10,-7.5,-5,-2.5,0,2.5,5,7.5,10].map(p=>`<button type="button" class="${state.manual===p?'on':''}" onclick="readinessUiManualV227(${p})">${fmt(p)}</button>`).join('');
  }
  function markup(){
    const r=scoreAndPercent(),chosen=state.manual==null?r.percent:state.manual,ready=r.ready;
    const resultTitle=!ready?'Оцени четыре показателя':chosen===0?'Коррекция по самочувствию':state.manual==null?'Коррекция по самочувствию':'Ручная коррекция';
    const resultText=!ready?'Сон, энергия, стресс и восстановление по шкале 1–5.':state.manual!=null?`Выбрано вручную: ${fmt(chosen)}. Авторасчёт: ${fmt(r.percent)}.`:r.percent===0?'Отлично: 0%. Отклонения: до −10%.':`Готовность ${r.score}/100. Рекомендуемая коррекция ${fmt(r.percent)}.`;
    return `<div class="rq227" data-te200-flow="readiness"><div class="sheet-grabber"></div><h2>Самочувствие</h2><div class="rq227-sub">${workoutSubtitle()}</div>${hiddenInputs()}<div class="rq227-rows">${metricRow('sleep','Сон')}${metricRow('energy','Энергия')}${metricRow('stress','Стресс')}${metricRow('recovery','Восстановление')}</div><div class="rq227-result"><div><b>${resultTitle}</b><span>${resultText}</span></div><div class="rq227-badge">${ready?fmt(chosen):'–'}</div></div><div class="rq227-manual-title">Ручная коррекция, если нужна</div><div class="rq227-manual">${manualButtons()}</div><div class="rq227-actions"><button id="rq227Start" class="btn primary full rq227-start" ${ready?'':'disabled'} onclick="readinessUiStartV227(false)">Начать · ${ready?fmt(chosen):'–'}</button><button class="btn full rq227-plan" onclick="readinessUiStartV227(true)">По плану · 0%</button></div><div class="rq227-note">Автокоррекция не повышает рабочий вес: при хорошем самочувствии остаётся 0%, при снижении готовности – до −10%. Положительную коррекцию можно выбрать только вручную.</div></div>`;
  }
  function rerender(){
    const sh=document.getElementById('sheet');
    if(!sh||!sh.querySelector('[data-te200-flow="readiness"]'))return;
    sh.innerHTML=markup();
  }
  W.readinessUiSetV227=(key,value)=>{if(!(key in state.values))return;state.values[key]=clamp(Number(value)||1,1,5);rerender()};
  W.readinessUiManualV227=p=>{state.manual=Number(p);rerender()};

  function stepFor(ex){try{return Number(W.loadStepFor?.(W.baseExerciseName?W.baseExerciseName(ex?.n):ex?.n,ex?.sourceId||null))||2.5}catch(_){return 2.5}}
  function roundWeight(v,step){step=Number(step)||2.5;return Math.max(0,Math.round(v/step)*step)}
  function manualData(percent){
    const v=state.values,r=scoreAndPercent();
    return{sleep:v.sleep,energy:v.energy,stress:v.stress==null?null:6-v.stress,soreness:v.recovery==null?null:6-v.recovery,recovery:v.recovery,stressScore:v.stress,score:r.score,percent,factor:1+percent/100,skipped:false,manual:true,autoPercent:r.percent,at:new Date().toISOString()};
  }
  function applyManualToCurrent(percent,cur){
    if(!cur)return false;
    const d=manualData(percent);
    cur.readiness=d;cur.readinessUsed=true;cur.readinessAdjusted=Math.abs(percent)>.001;cur.trainingReadinessDone=true;cur.trainingReadinessPromptShown=true;
    (cur.ex||[]).forEach(ex=>{const step=stepFor(ex);(ex.set||[]).forEach(s=>{if(s?.ok||s?.manualOverride)return;const base=num(s?.plannedW)||num(s?.baselineW)||num(s?.programW);if(base>0)s.w=roundWeight(base*d.factor,step)})});
    if(Array.isArray(W.st?.readinessLog)){
      const i=W.st.readinessLog.map(x=>String(x?.sessionId||'')).lastIndexOf(String(cur.id||''));
      const row={date:cur.date,sessionId:cur.id,...d};if(i>=0)W.st.readinessLog[i]=row;else W.st.readinessLog.push(row)
    }
    try{W.save?.();W.startPage?.()}catch(_){}
    setTimeout(()=>{try{W.trainingEngine200Tick?.()}catch(_){}},50);
    return true;
  }
  function applyManualWhenReady(percent,before){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      const cur=W.st?.current;
      const newSession=cur&&cur!==before&&cur?.id;
      const existingSession=cur&&cur===before&&cur?.id;
      const prepared=cur?.trainingReadinessDone&&(cur?.trainingEngineRevision||tries>18);
      if((newSession||existingSession)&&prepared){clearInterval(timer);setTimeout(()=>applyManualToCurrent(percent,cur),80)}
      else if(tries>50)clearInterval(timer)
    },80);
  }
  W.readinessUiStartV227=usePlan=>{
    const original=W.trainingConfirmReadiness200;
    if(typeof original!=='function'){W.toast?.('Модуль тренировки ещё загружается');return}
    const r=scoreAndPercent();
    if(!usePlan&&!r.ready){W.toast?.('Оцени все четыре показателя');return}
    if(usePlan){original(false);return}
    if(state.manual==null){original(true);return}
    const before=W.st?.current||null,percent=state.manual;
    applyManualWhenReady(percent,before);original(false);
  };

  const baseModal=W.modal;
  if(typeof baseModal==='function'&&!baseModal.__rq227){
    const wrapped=function(html){
      if(typeof html==='string'&&html.includes('data-te200-flow="readiness"')){
        state.values={sleep:null,energy:null,stress:null,recovery:null};state.manual=null;state.lastAuto=0;
        return baseModal.call(this,markup())
      }
      return baseModal.apply(this,arguments)
    };
    wrapped.__rq227=true;wrapped.__rq227Base=baseModal;W.modal=wrapped;try{modal=wrapped}catch(_){}
  }
})();
