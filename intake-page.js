'use strict';
(()=>{
 const api=window.UNVRSLIntake,catalog=window.UNVRSL_EXERCISES,form=document.getElementById('intakeForm'),$=id=>document.getElementById(id);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 $('equipment').innerHTML=Object.entries(api.EQUIPMENT).map(([id,n])=>`<label><input type="checkbox" name="equipment" value="${id}">${n}</label>`).join('');
 const candidates=new Set(Object.values(api.POOL).flat().map(x=>x[0]));
 $('excluded').innerHTML=catalog.filter(e=>candidates.has(e.id)).map(e=>`<option value="${esc(e.id)}">${esc(e.n)}</option>`).join('');
 let answers=null;
 form.addEventListener('submit',event=>{
  event.preventDefault();$('error').textContent='';
  try{
   const f=new FormData(form);answers=api.validate({name:f.get('name'),age:f.get('age'),goal:f.get('goal'),experience:f.get('experience'),days:f.get('days'),minutes:f.get('minutes'),limitations:f.get('limitations')==='yes',equipment:f.getAll('equipment'),excluded:[...$('excluded').selectedOptions].map(x=>x.value)});
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
