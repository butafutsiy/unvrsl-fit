'use strict';
(()=>{
 const W=window,api=W.UNVRSLIntake;let pending=null;
 const intakeUrl=()=>new URL('intake.html',location.href).href;
 W.intakeToolbarHtml=()=>`<div class="card"><div class="title">Программа по анкете</div><p class="muted small">Отправь клиенту анкету. Он получит черновик и сможет передать тебе ссылку на проверку.</p><div class="coach-actions"><button class="btn primary" onclick="intakeShareLink()">Отправить анкету</button><a class="btn" href="${intakeUrl()}" target="_blank" rel="noopener">Попробовать</a></div></div>`;
 W.intakeShareLink=async()=>{const url=intakeUrl();try{if(navigator.share)await navigator.share({title:'UNVRSL FIT · анкета',text:'Заполни анкету и отправь мне ссылку на черновик для проверки.',url});else{await navigator.clipboard.writeText(url);toast('Ссылка на анкету скопирована')}}catch(e){if(e.name!=='AbortError')prompt('Скопируй ссылку на анкету',url)}};
 W.intakeDraftBlocked=p=>{if(p?.intakeDraft?.status!=='review')return false;toast('Сначала проверь и утверди черновик в редакторе');return true};
 function details(a){return `<div class="card"><b>${esc(a.name)}</b><p>${a.age} лет · ${esc(api.GOALS[a.goal])} · ${a.days} дня · ${a.minutes} мин</p><p class="small">Опыт: ${a.experience==='beginner'?'начинающий / после перерыва':'регулярные тренировки'}<br>Оборудование: ${esc(a.equipment.map(x=>api.EQUIPMENT[x]).join(', ')||'собственный вес')}<br>Ограничения: ${a.limitations?'да / не уверен(а)':'не указаны'}<br>Исключения: ${esc(a.excluded.map(id=>W.UNVRSL_EXERCISES.find(e=>e.id===id)?.n||id).join(', ')||'нет')}</p></div>`}
 async function handle(){
  if(!location.hash.startsWith('#intakeReview='))return;
  try{
   const a=api.decode(location.hash.slice('#intakeReview='.length));pending=api.generate(a,W.UNVRSL_EXERCISES);
   modal(`<div class="sheet-grabber"></div><h2>Анкета на проверку</h2>${details(a)}${pending.issues.length?`<div class="card"><b>Нужно проверить</b><p>${pending.issues.map(esc).join('<br>')}</p></div>`:''}<p class="muted">${pending.program?'Сайт составил черновик на 4 недели. Открой его, проверь упражнения, объём, отдых и рабочие веса.':'Автоматический план не создан. Можно открыть пустую программу и заполнить её вручную.'}</p><button class="btn primary full" onclick="intakeImportDraft()">${pending.program?'Открыть черновик в редакторе':'Создать программу вручную'}</button><button class="btn full" onclick="closeModal()">Позже</button>`);
  }catch(e){modal(`<h2>Не удалось открыть анкету</h2><p>${esc(e.message)}</p><button class="btn full" onclick="closeModal()">Закрыть</button>`)}
 }
 W.intakeImportDraft=async()=>{
  if(!pending)return;
  const key=api.encode(pending.answers),existing=st.programs.find(p=>p.intakeSourceKey===key);
  if(existing){openProgramEditor(existing.id);return}
  const p=pending.program?JSON.parse(JSON.stringify(pending.program)):{name:`${pending.answers.name} · ручной подбор`,weeks:Array.from({length:4},(_,wi)=>({n:wi+1,days:Array.from({length:pending.answers.days},(_,di)=>({name:`День ${di+1}`,ex:[]}))})),intakeDraft:{status:'review',version:api.VERSION,answers:pending.answers,issues:pending.issues,rationale:[]}};
  p.id=uid('prog');p.intakeSourceKey=key;p.created=Date.now();p.updated=Date.now();ensureProgramShape(p);st.programs.push(p);
  try{const ok=W.persistWorkoutState?await W.persistWorkoutState():save();if(ok===false)throw Error('Недостаточно места для сохранения');history.replaceState(null,'',location.pathname+location.search);openProgramEditor(p.id);toast('Черновик сохранён для проверки')}
  catch(e){st.programs=st.programs.filter(x=>x!==p);toast('Не удалось сохранить: '+e.message)}
 };
 W.intakeReviewBanner=p=>p?.intakeDraft?.status==='review'?`<div class="card" style="border:1px solid var(--purple);background:var(--panel)"><b>Черновик · ожидает проверки</b><p class="small">Проверь все 4 недели, технику, объём и рабочие веса. До утверждения запуск и отправка программы заблокированы.</p><button class="btn" onclick="intakeReviewDetails('${p.id}')">Анкета и утверждение</button></div>`:'';
 W.intakeReviewDetails=id=>{
  const p=programById(id);if(!p?.intakeDraft)return;const x=p.intakeDraft;
  modal(`<h2>Проверка программы</h2>${details(x.answers)}${x.issues.length?`<p>${x.issues.map(esc).join('<br>')}</p>`:''}<ul>${(x.rationale||[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ul><label class="row" style="margin:20px 0"><input id="intakeApproved" type="checkbox">Я проверил все недели, ограничения, упражнения, объём и подбор рабочих весов.</label><button class="btn primary full" onclick="intakeApprove('${p.id}')">Утвердить программу</button><button class="btn full" onclick="openProgramEditor('${p.id}')">Вернуться в редактор</button>`)
 };
 W.intakeApprove=async id=>{
  const p=programById(id);if(!p?.intakeDraft||!document.getElementById('intakeApproved')?.checked)return toast('Подтверди проверку программы');
  if(!p.weeks?.length||p.weeks.some(w=>!w.days?.length||w.days.some(d=>!d.ex?.length)))return toast('Сначала заполни упражнения во всех днях программы');
  const prev=p.intakeDraft.status;p.intakeDraft.status='approved';p.intakeDraft.reviewedAt=Date.now();
  try{const ok=W.persistWorkoutState?await W.persistWorkoutState():save();if(ok===false)throw Error('Не удалось сохранить');openProgramEditor(id);toast('Программа утверждена. Теперь можно отправить клиенту')}
  catch(e){p.intakeDraft.status=prev;delete p.intakeDraft.reviewedAt;toast(e.message)}
 };
 W.addEventListener('unvrsl:app-ready',handle,{once:true});W.addEventListener('hashchange',handle);
 if(W.__unvrslStartupComplete)setTimeout(handle,0);
})();
