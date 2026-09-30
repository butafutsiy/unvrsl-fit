'use strict';
(()=>{
 const api=window.UNVRSLIntake,catalog=window.UNVRSL_EXERCISES,form=document.getElementById('intakeForm'),$=id=>document.getElementById(id);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const profile=window.UNVRSLIntakeProfile;
 const select=(id,dict)=>{$(id).innerHTML='<option value="">Выбери вариант</option>'+Object.entries(dict).map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join('')};
 for(const [id,dict] of [['sportExperience',profile.SPORT],['strengthExperience',profile.SPORT],['trainingBreak',profile.BREAK],['nutritionGoal',profile.NUTRITION_GOALS],['dailyActivity',profile.ACTIVITY]])select(id,dict);
 $('equipment').innerHTML=Object.entries(profile.EQUIPMENT).map(([id,n])=>`<label><input type="checkbox" name="equipmentGroups" value="${id}">${n}</label>`).join('');
 $('conditions').innerHTML=Object.entries(profile.CONDITIONS).map(([id,n])=>`<label><input type="checkbox" name="conditions" value="${id}">${n}</label>`).join('');
 const candidates=new Set(Object.values(api.POOL).flat().map(x=>x[0]));
 $('excluded').innerHTML=catalog.filter(e=>candidates.has(e.id)).map(e=>`<label data-exclude-name="${esc(e.n.toLowerCase())}"><input type="checkbox" name="excluded" value="${esc(e.id)}">${esc(e.n)}</label>`).join('');
 $('excludeSearch').oninput=e=>{const q=e.target.value.trim().toLowerCase();$('excluded').querySelectorAll('label').forEach(l=>l.hidden=!l.dataset.excludeName.includes(q))};
 $('excluded').onchange=()=>{const n=form.querySelectorAll('[name="excluded"]:checked').length;$('excludedCount').textContent=n?`Исключено упражнений: ${n}`:'Ничего не исключено'};
 $('equipment').onchange=e=>{
  const bw=form.querySelector('[name="equipmentGroups"][value="bodyweight"]');
  if(e.target===bw&&bw.checked)form.querySelectorAll('[name="equipmentGroups"]').forEach(x=>{if(x!==bw)x.checked=false});
  else if(e.target.checked)bw.checked=false;
  const groups=[...form.querySelectorAll('[name="equipmentGroups"]:checked')].map(x=>x.value),home=groups.length&&!groups.includes('gym')&&!groups.includes('bodyweight');
  $('homeExtras').hidden=!home;$('rackRow').hidden=!home||!groups.includes('barbell');
  if(!home)form.elements.homeBench.checked=false;if($('rackRow').hidden)form.elements.homeRack.checked=false;
 };
 function spineVisibility(){const yes=[...form.querySelectorAll('[name="conditions"]:checked')].some(x=>['spinal_hernia','spinal_protrusion','back_pain'].includes(x.value));$('spineDetails').hidden=!yes;if(!yes)form.querySelectorAll('[name="spineRegions"]').forEach(x=>x.checked=false)}
 $('noConditions').onchange=e=>{if(e.target.checked)form.querySelectorAll('[name="conditions"]').forEach(x=>x.checked=false);spineVisibility()};
 $('conditions').onchange=e=>{if(e.target.checked)$('noConditions').checked=false;spineVisibility()};
 let answers=null;
 form.addEventListener('submit',event=>{
  event.preventDefault();$('error').textContent='';
  try{
   const f=new FormData(form);answers=api.validate({...Object.fromEntries(f),schemaVersion:2,homeBench:f.has('homeBench'),homeRack:f.has('homeRack'),noConditions:f.has('noConditions'),conditions:f.getAll('conditions'),spineRegions:f.getAll('spineRegions'),equipmentGroups:f.getAll('equipmentGroups'),excluded:f.getAll('excluded')});
   const result=api.generate(answers,catalog);$('resultTitle').textContent=result.program?'Черновик готов':'Нужна помощь тренера';
   $('result').innerHTML=`<span class="pill">${esc(answers.name)}</span><span class="pill">${answers.days} дня в неделю</span><span class="pill">${answers.minutes} минут</span><p>После проверки тренер сможет изменить план и отправить готовую программу.</p>${result.issues.length?`<div class="notice">${result.issues.map(esc).join('<br>')}</div>`:''}${result.program?`<div class="result-card"><h2>Почему такой план</h2><ul>${result.rationale.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>${result.program.weeks.map(w=>`<details ${w.n===1?'open':''}><summary>Неделя ${w.n}</summary>${w.days.map(d=>`<div class="result-card"><h2>${esc(d.name)}</h2><p class="hint">Около ${d.estimatedMinutes} мин · разминка включена</p>${d.ex.map(e=>`<div class="exercise-line"><b>${esc(e.n)}</b><small>${e.sets.length} × ${e.reps.min}–${e.reps.max} · RPE ${e.rpe} · отдых ${e.rest} сек</small></div>`).join('')}</div>`).join('')}</details>`).join('')}`:'<p>Отправь ответы тренеру. Готовая программа появится после индивидуального подбора.</p>'}`;
   $('formView').hidden=true;$('resultView').hidden=false;$('copyWrap').hidden=true;$('shareStatus').textContent='';window.scrollTo(0,0);
  }catch(e){$('error').textContent=e.message}
 });
 $('edit').onclick=()=>{$('resultView').hidden=true;$('formView').hidden=false;window.scrollTo(0,0)};
 $('send').onclick=async()=>{
  if(!answers)return;
  const url=new URL('index.html',location.href);url.search='';url.hash='intakeReview='+api.encode(answers);
  $('copyLink').value=url.href;
  try{if(navigator.share){await navigator.share({title:'UNVRSL FIT · анкета на проверку',text:'Моя анкета и предварительная программа. Проверь, пожалуйста.',url:url.href});$('shareStatus').textContent='Ссылка передана в выбранное приложение.'}else{await navigator.clipboard.writeText(url.href);$('shareStatus').textContent='Ссылка скопирована. Отправь её своему тренеру.'}}
  catch(e){if(e.name==='AbortError')return;$('copyWrap').hidden=false;$('shareStatus').textContent='Скопируй ссылку и отправь тренеру.'}
 };
 $('copyLink').onclick=event=>event.target.select();
})();
