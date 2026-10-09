'use strict';
(() => {
 const api=window.UNVRSLIntake, form=document.getElementById('intakeForm');
 if(!form||!api)return;
 const $=id=>document.getElementById(id), panels=[...form.querySelectorAll('fieldset')];
 const titles=['Личные данные','Опыт и спорт','Твой график','Оборудование','Ограничения','Питание','Акценты'];
 const key='unvrsl-intake-draft-v475';let step=0,body=null,lastResult=null;
 const focusSlugs={back:['upper-back','trapezius'],chest:['chest'],shoulders:['deltoids'],arms:['biceps','triceps','forearm'],legs:['quadriceps','hamstring','gluteal','adductors','calves','tibialis'],core:['abs','obliques']};
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 $('focusChoices').innerHTML=Object.entries(api.FOCUS).map(([k,v])=>`<label><input name="focus" type="checkbox" value="${k}"><span>${v}</span></label>`).join('');
 const fields=()=>[...form.querySelectorAll('input[name],select[name],textarea[name]')];
 function restore(){try{const d=JSON.parse(sessionStorage.getItem(key)||'null');if(!d||!d.values)return;fields().forEach(e=>{const value=d.values[e.name];if(value===undefined)return;if(e.type==='checkbox')e.checked=Array.isArray(value)&&value.includes(e.value);else e.value=value});step=Math.min(panels.length-1,Math.max(0,Number(d.step)||0));}catch(_){}}
 function persist(){const values={};fields().forEach(e=>{if(e.type==='checkbox'){values[e.name]??=[];if(e.checked)values[e.name].push(e.value)}else values[e.name]=e.value});try{sessionStorage.setItem(key,JSON.stringify({step,values}))}catch(_){}}
 window.intakeClearDraft=()=>{try{sessionStorage.removeItem(key)}catch(_){}};
 function selected(){return [...form.querySelectorAll('[name="focus"]:checked')].map(e=>e.value)}
 function mapMarkup(active){if(!body)return '<p class="hint">Выбери группы мышц ниже</p>';const sex=form.elements.sex.value==='female'?'female':'male';return ['front','back'].map(side=>`<svg viewBox="${side==='front'?'40':'760'} 140 640 1230" role="img" aria-label="Мышцы ${side==='front'?'спереди':'сзади'}">${(body[sex]?.[side]||[]).map(p=>Object.values(p.path||{}).flat().map(d=>`<path d="${escape(d)}" class="${active.has(p.slug)?'selected':''}"/>`).join('')).join('')}</svg>`).join('')}
 function refreshFocus(){const choices=selected();form.querySelectorAll('[name="focus"]').forEach(e=>e.disabled=choices.length>=2&&!e.checked);$('focusStatus').textContent=choices.length?`Акценты: ${choices.map(k=>api.FOCUS[k]).join(' · ')}`:'Равномерная нагрузка';$('focusMap').innerHTML=mapMarkup(new Set(choices.flatMap(k=>focusSlugs[k])));}
 function show(){panels.forEach((p,i)=>p.hidden=i!==step);$('wizardProgress').hidden=false;$('wizardProgress').innerHTML=`<div class="step-meta"><span>Шаг ${step+1} из ${panels.length}</span><b>${titles[step]}</b></div><div class="step-dots">${panels.map((_,i)=>`<i class="${i<=step?'done':''}"></i>`).join('')}</div>`;$('wizardNav').hidden=false;$('wizardBack').disabled=step===0;$('wizardNext').hidden=step===panels.length-1;$('createDraft').hidden=step!==panels.length-1;$('error').textContent='';persist();}
 function validPanel(){const p=panels[step];for(const e of p.querySelectorAll('input,select,textarea'))if(!e.disabled&&!e.checkValidity()){e.reportValidity();return false}if(step===3&&!form.querySelector('[name="equipmentGroups"]:checked'))return error('Выбери доступное оборудование');if(step===4&&!$('noConditions').checked&&!form.querySelector('[name="conditions"]:checked'))return error('Отметь ограничения или «Ничего из перечисленного»');return true;}
 function error(message){$('error').textContent=message;return false}
 function move(n){step=n;show();window.scrollTo(0,0);panels[step].querySelector('legend')?.focus({preventScroll:true})}
 panels.forEach(p=>p.querySelector('legend')?.setAttribute('tabindex','-1'));
 $('wizardNext').onclick=()=>{if(validPanel())move(step+1)};$('wizardBack').onclick=()=>move(Math.max(0,step-1));
 // Native submit validation cannot focus a field in an inactive panel.
 form.noValidate=true;
 form.addEventListener('submit',event=>{for(let i=0;i<panels.length;i++){const bad=[...panels[i].querySelectorAll('input,select,textarea')].find(e=>!e.disabled&&!e.checkValidity());if(bad){event.preventDefault();event.stopImmediatePropagation();move(i);bad.reportValidity();return}}if(step<panels.length-1){event.preventDefault();event.stopImmediatePropagation();if(validPanel())move(step+1)}},true);
 form.addEventListener('input',persist);form.addEventListener('change',()=>{refreshFocus();persist()});
 window.intakeRenderSummary=result=>{
  lastResult=result;const p=result.program;if(!p)return;const week=p.weeks[0],groups={};let total=0;
  const group=e=>{const t=String(e.tg||e.bp||'').toLowerCase();if(/pector|chest/.test(t))return'chest';if(/delt|shoulder/.test(t))return'shoulders';if(/bicep|tricep|forearm/.test(t)&&!/femor/.test(t))return'arms';if(/abs|abdom|waist/.test(t))return'core';if(/quad|hamstring|glut|calf|calves|leg|thigh/.test(t))return'legs';if(/lat|back|trap/.test(t))return'back';return null};
  week.days.forEach(d=>d.ex.forEach(e=>{total+=e.sets.length;const k=group(e);if(k)groups[k]=(groups[k]||0)+e.sets.length}));
  const max=Math.max(1,...Object.values(groups));const summary=document.createElement('div');summary.className='result-card program-overview';
  summary.innerHTML=`<p class="eyebrow">ТВОЯ ПРОГРАММА</p><div class="overview-metrics"><div><b>4</b><span>недели</span></div><div><b>${week.days.length}</b><span>занятия / неделю</span></div><div><b>${total}</b><span>подходов в неделю 1</span></div></div><h2>Нагрузка по мышцам · неделя 1</h2><div class="summary-map">${mapMarkup(new Set(Object.keys(groups).flatMap(k=>focusSlugs[k])))}</div>${Object.entries(api.FOCUS).map(([k,v])=>`<div class="volume-row"><span>${v}</span><div><i style="width:${(groups[k]||0)/max*100}%"></i></div><b>${groups[k]||0}</b></div>`).join('')}<p class="hint">Рабочие подходы по основной мышечной группе упражнения. Косвенная нагрузка не прибавляется. Объём других недель виден ниже.</p><div class="day-previews">${week.days.map(d=>`<div><b>${escape(d.name)}</b><span>≈ ${d.estimatedMinutes} мин · ${d.ex.length} упражнений · ${d.ex.reduce((n,e)=>n+e.sets.length,0)} подходов</span></div>`).join('')}</div>`;
  $('result').querySelector('.program-overview')?.remove();$('result').prepend(summary);
 };
 restore();$('equipment').dispatchEvent(new Event('change'));if($('noConditions').checked)$('noConditions').dispatchEvent(new Event('change'));else $('conditions').dispatchEvent(new Event('change'));show();refreshFocus();
 fetch('data/anatome-body-paths.json').then(r=>{if(!r.ok)throw Error('map');return r.json()}).then(data=>{body=data;refreshFocus();if(lastResult)window.intakeRenderSummary(lastResult)}).catch(()=>{});
})();
