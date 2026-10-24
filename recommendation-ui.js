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
  const label={START:set.weightMode==='auto'||e.programWeightMode==='adaptive'?'Автовес':'Рекомендация на подход',LIVE:'Следующий подход',NEXT_SESSION:'Следующая тренировка',PHASE_CHANGE:'Смена диапазона',TEST:'Тестовая попытка'}[r.scope]||'Рекомендация на подход';
  const repText=r.repRange.lo===r.repRange.hi?String(r.repRange.lo):`${r.repRange.lo}–${r.repRange.hi}`;
  const load=value.replace(/^Оставить /,'');
  const heading=['stop','review','calibrate'].includes(r.effortAction)?value:timed?`${r.profile.movementKind==='isometric'?'Удержание':'Кардио'}: ${r.suggestedSeconds!=null||r.suggestedDistance!=null?load:r.targetDistance!=null?fmt(r.targetDistance)+' км':r.targetSeconds!=null?fmt(r.targetSeconds)+' сек':'по протоколу'}`:`${label}: ${load}${r.suggestedWeight!=null?' · '+repText+' повт.':''}`;
  const profileText={provisional:'Профиль предварительный: оборудование и вариант требуют подтверждения',manual_only:'Упражнение требует ручной проверки',resolved:'Профиль подтверждён'}[r.profile.profileStatus];
  const warnings=r.warnings.map(x=>({short_rest:'Отдых короче назначенного',stale_history:'История старше 14 дней',provisional_outlier:'Необычный результат требует подтверждения'}[x]||x)).join('. ');
  return `<div class="te200-rec-main" data-recommendation-version="3" data-recommendation-id="${esc(r.id)}"><b class="rec-v3-value">${esc(heading)}</b>${planned!=null&&!timed?`<div class="te406-plan-comparison"><div>Назначено тренером: ${esc(fmt(planned))} кг${unit}</div>${r.suggestedWeight!=null&&Math.abs(planned-r.suggestedWeight)>1e-6?`<div>Расчётная рекомендация: ${esc(load)}</div>`:''}</div>`:''}${r.basis?`<div class="te406-basis">История: ${esc(r.strength?.sessionCount||r.sessionIds.length)} тренировок · ${esc(r.strength?.setCount||0)} подходов</div>`:''}<div class="te410-week">Цель: ${esc(goal)}</div>${r.needsAcknowledgement||['stop','review','calibrate'].includes(r.effortAction)?`<div class="te410-week">${esc(r.reasonText)}</div>`:''}${r.fallback?.reasonCode==='recovery_fallback'?`<div class="te410-week">Доступная лёгкая ступень: ${esc(fmt(r.fallback.suggestedWeight))} кг. Выбери её вручную после проверки.</div>`:''}<details><summary>Почему этот вес?</summary><p>${esc(r.reasonText)}</p><p>Уверенность: ${esc(r.confidence)} · ${esc(profileText)}</p>${r.strength?.estimate!=null?`<p>Локальная оценка по модели упражнения: ≈ ${esc(fmt(r.strength.estimate))} кг. Это не измеренный 1ПМ.</p>`:''}${warnings?`<p>${esc(warnings)}</p>`:''}${r.evidence.length?`<p>Прошлые подходы: ${esc(r.evidence.join('; '))}</p>`:''}${r.fallback?`<p>Вариант для ручной проверки: ${esc(r.fallback.suggestedWeight)} кг. Требуется отдельное подтверждение, автоматически не применяется.</p>`:''}</details><div class="te200-rec-actions">${r.canApply&&!applied?'<button type="button" class="btn te200-rec-apply wf-secondary" data-rec-v3="apply">Применить</button>':''}${r.effortAction==='stop'?'<button type="button" class="btn wf-secondary" data-rec-v3="stop">Остановить упражнение и пропустить оставшиеся подходы</button>':hasUndo?'<button type="button" class="btn wf-secondary" data-rec-v3="undo">Отменить применение</button>':'<button type="button" class="btn wf-secondary" data-rec-v3="dismiss">Отменить</button>'}${r.effortAction==='calibrate'&&r.profile.family!=='F00'?'<button type="button" class="btn wf-secondary" data-rec-v3="calibrate">Подобрать вес</button>':''}</div></div>`;

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
