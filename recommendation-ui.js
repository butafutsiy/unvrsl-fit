'use strict';
(function(W){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=v=>Number(v).toLocaleString('ru-RU',{maximumFractionDigits:6});
 function markup(e,set,session,A,reg){
  const r=set.recommendation;if(r?.engineVersion!==3)return '';
  if(set.dismissedRecommendation===r.inputFingerprint)return '<div class="wf-sub" data-recommendation-dismissed="3">Оставлен выбранный вес. Новый совет появится после нового факта или смены цели.'+(set.recommendationRestore?'<button type="button" data-rec-v3="undo">Отменить применение</button>':'')+'</div>';
  const type=r.profile?.loadAccounting,unit=type==='per_implement'?(r.profile.equipmentKind==='dumbbell'?' / гантель':r.profile.equipmentKind==='kettlebell'?' / гирю':' / снаряд'):type==='per_side'?' / сторону':'';
  const value=r.fallback?.reasonCode==='recovery_fallback'?'Облегчение вручную':r.suggestedSeconds!=null?`${fmt(r.suggestedSeconds)} сек`:r.suggestedDistance!=null?`${fmt(r.suggestedDistance)} км`:r.suggestedReps!=null&&r.suggestedWeight==null?`${fmt(r.suggestedReps)} повт.`:r.suggestedWeight==null?({stop:'Остановить упражнение',review:'Проверь назначение',calibrate:'Подобрать вес'}[r.effortAction]||'По протоколу'):type==='bodyweight_added'?`${r.suggestedWeight===0?'Собственный вес':'Собственный вес + '+fmt(r.suggestedWeight)+' кг'}`:type==='bodyweight_assisted'?`Помощь ${fmt(r.suggestedWeight)} кг`:`${r.effortAction==='hold'?'Оставить ':''}${fmt(r.suggestedWeight)} кг${unit}`;
  const planned=set.assignedW!=null||['prescribed','manual'].includes(r.weightMode)?set.assignedW??set.plannedWeight??set.programW??set.originalPrescription?.plannedWeight:null;
  const timed=['cardio','isometric'].includes(r.profile.movementKind),goal=timed?(r.targetDistance!=null?`${fmt(r.targetDistance)} км`:r.targetSeconds!=null?`${fmt(r.targetSeconds)} сек`:'по протоколу'):`${r.repRange.lo}–${r.repRange.hi} ${r.profile.repSide==='arm'||e.repSide==='arm'?'повт./рука':r.profile.family==='F12'||e.repSide==='leg'||e.sd?'повт./нога':'повт.'} · RIR ${r.targetRirRange.join('–')}`;
  const hasUndo=!!set.recommendationRestore,applied=set.recommendationDecision?.status==='applied'&&set.recommendationDecision.id===r.id;
  return `<div class="te200-rec-main" data-recommendation-version="3" data-recommendation-id="${esc(r.id)}"><b class="rec-v3-value">${esc(value)}</b><p>Цель: ${esc(goal)}</p>${planned!=null&&!timed?`<p>Назначено тренером: ${esc(fmt(planned))} кг${unit}</p>`:''}<p>${esc(r.reasonText)}</p>${r.fallback?.reasonCode==='recovery_fallback'?`<p>Доступная лёгкая ступень: ${esc(fmt(r.fallback.suggestedWeight))} кг. Выбери её вручную после проверки.</p>`:''}<p>Область: ${esc({START:'старт сегодня',LIVE:'следующий подход',NEXT_SESSION:'следующая тренировка',PHASE_CHANGE:'смена диапазона',TEST:'тест'}[r.scope]||r.scope)} · Уверенность: ${esc(r.confidence)}</p><details><summary>Почему?</summary><p>${esc({provisional:'Профиль предварительный: оборудование и вариант требуют подтверждения',manual_only:'Упражнение требует ручной проверки',resolved:'Профиль подтверждён'}[r.profile.profileStatus])}</p><p>${esc(r.warnings.map(x=>({short_rest:'Отдых короче назначенного',stale_history:'История старше 14 дней',provisional_outlier:'Необычный результат требует подтверждения'}[x]||x)).join('. '))}</p><p>${esc(r.evidence.join('; '))}</p>${r.fallback?`<p>Вариант для ручной проверки: ${esc(r.fallback.suggestedWeight)} кг. Требуется отдельное подтверждение, автоматически не применяется.</p>`:''}</details><div class="te200-rec-actions">${r.canApply&&!applied?'<button type="button" class="te200-rec-apply wf-secondary" data-rec-v3="apply">Применить</button>':''}${r.effortAction==='stop'?'<button type="button" class="wf-secondary" data-rec-v3="stop">Остановить упражнение и пропустить оставшиеся подходы</button>':hasUndo?'<button type="button" class="wf-secondary" data-rec-v3="undo">Отменить применение</button>':'<button type="button" class="wf-secondary" data-rec-v3="dismiss">Оставить</button>'}${r.effortAction==='calibrate'&&r.profile.family!=='F00'?'<button type="button" class="wf-secondary" data-rec-v3="calibrate">Подобрать вес</button>':''}</div></div>`;
 }
 function handle(event,{e,set,session,A,reg,history=[],overrides={},changed=()=>{}}){
  const button=event.target.closest('[data-rec-v3]');if(!button)return false;
  const r=set.recommendation;
  if(!r||set.ok||set.skipped||['completed','skipped','failed_attempt'].includes(set.status))return true;
  const kind=button.dataset.recV3;
  if(kind==='apply'){
   const latest=A.recommend(e,set,session,history,reg,overrides);
   if(latest.inputFingerprint!==r.inputFingerprint){W.toast?.('Данные изменились: проверь обновлённую рекомендацию');changed();return true;}
   if(!A.acceptRecommendation(set,r))W.toast?.('Рекомендация устарела или требует проверки');
  }else if(kind==='stop'){
   const canonical=A.recommendationEngine.resolveExerciseProfile(e,reg),equipment=e.equipmentProfileId||e.equipmentProfile?.id;
   for(const ex of session.ex||[]){const p=A.recommendationEngine.resolveExerciseProfile(ex,reg);if(ex!==e&&(canonical.family==='F00'||p.canonicalId!==canonical.canonicalId||p.variantId!==canonical.variantId||(ex.equipmentProfileId||ex.equipmentProfile?.id)!==equipment))continue;for(const pending of ex.set||[])if(!pending.ok&&!pending.skipped&&!['completed','skipped','failed_attempt'].includes(pending.status)){pending.skipped=true;pending.status='skipped';pending.skipReason=r.reasonCode;}}
  }else if(kind==='undo')A.undoRecommendation(set);
  else if(kind==='dismiss')A.dismissRecommendation(set,r);
  else if(kind==='calibrate')W.openLoadCalibration?.((session.ex||[]).indexOf(e));
  changed();return true;
 }
 W.UNVRSLRecommendationUI={markup,handle};
})(window);
