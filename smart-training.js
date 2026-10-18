'use strict';
if(!Array.isArray(st.favorites))st.favorites=[];
if(!Array.isArray(st.recentExercises))st.recentExercises=[];
if(!st.nextSuggestions||typeof st.nextSuggestions!=='object')st.nextSuggestions={};

const _ruExerciseNameSmart=ruExerciseName;
const RU_TOKEN={'high':'высокий','bar':'гриф','fixed':'фиксированный','back':'спина','front':'передний','side':'боковой','arms':'руки','arm':'рука','leg':'нога','legs':'ноги','knee':'колено','knees':'колени','heel':'пятка','heels':'пятки','toe':'носок','toes':'носки','touch':'касание','circular':'круговой','overhead':'над головой','full':'полный','hanging':'в висе','bent':'согнутый','motion':'движение','parallel':'параллельный','prone':'лёжа на животе','stretch':'растяжка','chest':'грудь','rear':'задний','hip':'таз','lift':'подъём','horizontal':'горизонтальный','press':'жим','internal':'внутренняя','rotation':'ротация','straight':'прямой','vertical':'вертикальный','clean':'взятие','floor':'с пола','hack':'гакк','drag':'протяжный','close':'узкий','grip':'хват','skull':'ко лбу','pallof':'Паллофа','wheel':'ролик','rollerout':'выкат','jack':'складка','knife':'нож','two':'две','both':'обе','under':'под','raise':'подъём','row':'тяга','extension':'разгибание','curl':'сгибание','squad':'квадрицепс','apart':'в стороны','slingshot':'слингшот'};
function translitLatinWord(w){const map={a:'а',b:'б',c:'к',d:'д',e:'е',f:'ф',g:'г',h:'х',i:'и',j:'дж',k:'к',l:'л',m:'м',n:'н',o:'о',p:'п',q:'к',r:'р',s:'с',t:'т',u:'у',v:'в',w:'в',x:'кс',y:'й',z:'з'};return w.toLowerCase().split('').map(c=>map[c]||'').join('')}
ruExerciseName=function(name=''){let s=_ruExerciseNameSmart(name);s=s.replace(/high-bar/gi,'с высокой позицией грифа').replace(/good morning/gi,'наклоны со штангой').replace(/air bike/gi,'велосипедные скручивания');s=s.replace(/[A-Za-z]+/g,w=>RU_TOKEN[w.toLowerCase()]||translitLatinWord(w));return s.replace(/\s+/g,' ').trim()}

function favId(ex){return String(ex?.rawId||ex?.sourceId||ex?.id||ex?.raw||ex?.n||'')}
function isFavorite(id){return st.favorites.includes(String(id))}
function toggleFavorite(id){id=String(id);st.favorites=isFavorite(id)?st.favorites.filter(x=>x!==id):[id,...st.favorites];save();renderExerciseResults();toast(isFavorite(id)?'Добавлено в избранное':'Удалено из избранного')}
function markRecent(id){id=String(id);st.recentExercises=[id,...st.recentExercises.filter(x=>x!==id)].slice(0,30);save()}
const _openExerciseDetailSmart=openExerciseDetail;
openExerciseDetail=function(token){const id=decodeURIComponent(token||'').replace(/^og:/,'');markRecent(id);return _openExerciseDetailSmart(token)}

renderBodyFilters=function(){const el=$('#bodyFilters');if(!el)return;const parts=['all','favorites','recent','upper legs','chest','back','shoulders','upper arms','lower legs','waist','cardio'];el.innerHTML=parts.map(bp=>`<button class="filterchip ${exBody===bp?'on':''}" onclick="setExerciseBody('${bp}')">${bp==='all'?'Все':bp==='favorites'?'★ Избранные':bp==='recent'?'Недавние':BP_RU[bp]||bp}</button>`).join('')}
renderExerciseResults=function(){const el=$('#exList');if(!el)return;const q=exQuery.trim().toLowerCase(),all=catalogRecords();let filtered=all.filter(e=>{const id=String(e.rawId||e.id||e.raw||e.n);if(exBody==='favorites'&&!isFavorite(id))return false;if(exBody==='recent'&&!st.recentExercises.includes(id))return false;if(!['all','favorites','recent'].includes(exBody)&&e.bp!==exBody)return false;const rn=e.custom?e.n:ruExerciseName(e.n),hay=`${rn} ${e.n} ${ruTarget(e.tg)} ${BP_RU[e.bp]||''} ${EQ_RU[e.eq]||''}`.toLowerCase();return !q||hay.includes(q)});const order=id=>{const f=isFavorite(id)?-1000:0,ri=st.recentExercises.indexOf(id);return f+(ri>=0?ri:100)};filtered.sort((a,b)=>order(String(a.rawId||a.id||a.raw||a.n))-order(String(b.rawId||b.id||b.raw||b.n)));const total=filtered.length;filtered=filtered.slice(0,140);el.innerHTML=`${filtered.map(exerciseLibRow).join('')}${total>140?`<div class="card muted" style="text-align:center">Показаны первые 140 из ${total}. Уточни поиск.</div>`:''}${!filtered.length?'<div class="card muted">Ничего не найдено.</div>':''}`}
exerciseLibRow=function(ex){const body=BP_RU[ex.bp]||'—',eq=ex.custom?'Своё':(EQ_RU[ex.eq]||'—'),rec=recordsFor(ex.raw||ruExerciseName(ex.n)),title=ex.custom?ex.n:ruExerciseName(ex.n),id=String(ex.rawId||ex.id||ex.raw||ex.n),thumb=!ex.custom&&ex.image?`<img class="ex-thumb" src="${mediaUrl(ex.image)}" loading="lazy">`:'<div class="ex-thumb placeholder">🏋︎</div>';return `<div class="card exlib exlib-btn smart-ex-row" onclick="openExerciseDetail('${encodeURIComponent(ex.id)}')"><div class="exercise-list-row">${thumb}<div class="grow"><b>${esc(title)}</b><div class="catalog-meta">${esc(body)} · ${esc(eq)}${ex.tg?` · ${esc(ruTarget(ex.tg))}`:''}</div></div><div class="smart-row-actions"><button class="star-btn ${isFavorite(id)?'on':''}" onclick="event.stopPropagation();toggleFavorite('${esc(id)}')">★</button>${rec.best?`<span class="chip green">${rec.best} кг</span>`:'<span class="chev">›</span>'}</div></div></div>`}

function previousSets(base,sourceId=null){const rows=WorkoutDomain.history({n:base,sourceId},st.sessions,workoutRegistry,{userId:window.cloud?.user?.id});const latest=rows[0]?.session.id;return rows.filter(x=>x.session.id===latest).map(x=>({w:WorkoutDomain.number(x.set.w)??0,r:WorkoutDomain.number(x.set.actualReps??x.set.r),rpe:x.set.rpe??'',date:x.session.date,exercise:x.exercise,set:x.set,label:WorkoutDomain.setLabel(x.exercise,x.set,workoutRegistry)}))}
function workoutWeightInput(e,x,ei,si){
 const type=WorkoutDomain.loadType(e,workoutRegistry);
 if(type==='bodyweight_only'||type==='repetitions_only')return '<span class="small muted" style="text-align:center">'+(type==='bodyweight_only'?'Свой вес':'Повторы')+'</span>';
 const paired=WorkoutDomain.pairedLoad(e,workoutRegistry,x),label=paired?'Вес на каждую руку':type==='bodyweight_added'?'Дополнительный вес, 0 означает собственный вес':type==='bodyweight_assisted'?'Помощь тренажёра':type==='per_dumbbell'?'Вес одной гантели':type==='per_side'?'Вес на одну сторону':'Вес';
 return `<div class="weight392"><input class="${paired?'paired-load-input':''}" inputmode="decimal" value="${esc(WorkoutDomain.weightText(e,x.w,workoutRegistry,x))}" aria-label="${label}" placeholder="${paired?'0 / 0':'0'}" onfocus="this.value=st.current.ex[${ei}].set[${si}].w??''" onchange="editWorkoutWeight(${ei},${si},this)" onblur="this.value=WorkoutDomain.weightText(st.current.ex[${ei}],st.current.ex[${ei}].set[${si}].w,workoutRegistry,st.current.ex[${ei}].set[${si}])"></div>`;
}
function editWorkoutWeight(ei,si,input){
 const e=st.current?.ex?.[ei],x=e?.set?.[si];if(!x)return;
 const raw=input.value.trim(),parts=raw.split(/\s*\/\s*/),values=parts.map(WorkoutDomain.number);
 if(!raw){if(x.w!=='')editSet(ei,si,'w','',input);return}
 const value=parts.length===1?values[0]:WorkoutDomain.pairedLoad(e,workoutRegistry,x)&&parts.length===2&&values[0]===values[1]?values[0]:null;
 if(value==null||value<0){toast('Укажи один вес на каждую руку');input.value=WorkoutDomain.weightText(e,x.w,workoutRegistry,x);return}
 if(WorkoutDomain.number(x.w)!==value)editSet(ei,si,'w',value,input);
}
function moveWorkoutWeight(ei,si,delta){const e=st.current?.ex?.[ei],x=e?.set?.[si];if(!x||x.ok||st.current.pendingCompletion)return;const value=WorkoutDomain.moveWeight(x.w,delta,WorkoutDomain.profile(e,workoutRegistry,st.exerciseWeightProfiles||{}));editSet(ei,si,'w',value);startPage()}
function loadStepFor(base,sourceId=null){return WorkoutDomain.profile({n:base,sourceId},workoutRegistry,st.exerciseWeightProfiles||{}).step}

function exerciseGroupCard(s,group){
 const title=displayExerciseName(group.base),method=methodType(group.entries),last=group.entries.at(-1),finalRest=Number(last?.rest||0),allCardio=group.entries.every(e=>e.mode==='cardio'),target=effortTargets(s,group.entries[0],group.entries[0]?.set?.[0]),tempo=group.entries[0]?.tempo||tempoOnly(s.tempo||''),sourceId=group.entries[0]?.sourceId||null,prev=previousSets(group.base,sourceId);
 const rows=[];group.entries.forEach((e,local)=>{const ei=group.indices[local];e.set.forEach((x,si)=>rows.push({e,x,ei,si,label:x.testOmitted?'Пропуск':x.attemptNumber?(WorkoutDomain.setRole(e,x)==='backoff'?`Back ${x.attemptNumber}`:`Тест ${x.attemptNumber}`):variantLabel(e.n,si),prev:(()=>{const compatible=prev.filter(p=>WorkoutDomain.loadComparable(e,p.exercise,workoutRegistry,x,p.set)&&WorkoutDomain.method(e,x)===WorkoutDomain.method(p.exercise,p.set)&&WorkoutDomain.setRole(e,x)===WorkoutDomain.setRole(p.exercise,p.set));const ordinal=rows.filter(z=>WorkoutDomain.setRole(z.e,z.x)===WorkoutDomain.setRole(e,x)).length;return compatible[ordinal]||null})()}))});
 const head=`<div class="row between"><div class="grow"><button class="exname exlink" onclick="openExerciseDetailByName('${encodeURIComponent(group.base)}')">${esc(title)} <span class="info-dot">ⓘ</span></button><div class="rule-line">${esc(groupRuleText(group))}</div><div class="chips compact"><span class="chip green">RPE ${target.rpe}</span><span class="chip green">RIR ${target.rir}</span><span class="chip">темп ${esc(tempo||'—')}</span>${method?`<span class="chip method-chip">${method}</span>`:''}</div></div><div class="head-actions"><button class="btn tiny" onclick="replaceExerciseSheet([${group.indices.join(',')}],'${encodeURIComponent(group.base)}','${sourceId||''}')">⇄</button>${finalRest>0?`<button class="btn tiny" onclick="timer(${finalRest})">⏱</button>`:''}</div></div>`;
 let body='';
 if(allCardio){body=`<div class="sethead cardiohead"><span>Сет</span><span>мин</span><span>RPE</span><span></span></div>${rows.map(z=>`<div class="set-wrap"><div class="setrow cardiorow"><span class="phase">${esc(z.label)}</span><input inputmode="decimal" value="${z.x.min||''}" placeholder="мин" onchange="editSet(${z.ei},${z.si},'min',this.value,this)"><input inputmode="decimal" value="${z.x.rpe||''}" placeholder="${target.rpe}" onchange="editSet(${z.ei},${z.si},'rpe',this.value,this)"><button class="check ${z.x.ok?'done':''}" onclick="toggleSet(${z.ei},${z.si})">${z.x.ok?'✓':'○'}</button></div></div>`).join('')}`}
 else{body=`<div class="sethead"><span>Сет</span><span>${rows.some(z=>WorkoutDomain.pairedLoad(z.e,workoutRegistry,z.x))?'кг / рука':'кг'}</span><span>${rows.some(z=>WorkoutDomain.legReps(z.e))?'повт. / нога':'повт.'}</span><span>RPE</span><span>RIR</span><span></span></div>${rows.filter(z=>!z.x.testOmitted).map(z=>{const rowTarget=effortTargets(s,z.e,z.x),repTarget=workoutRepTargetText(z.x);return`<div class="set-wrap"><div class="setrow"><span class="phase ${method?'accent-phase':''}">${esc(z.label)}</span>${workoutWeightInput(z.e,z.x,z.ei,z.si)}${workoutRepsInput(z.e,z.x,z.ei,z.si)}<input class="effort-input rpe-input" data-effort="rpe" inputmode="decimal" value="${z.x.rpe??''}" placeholder="${rowTarget.rpe}" aria-label="Фактический RPE, цель ${rowTarget.rpe}" onchange="editSet(${z.ei},${z.si},'rpe',this.value,this)"><input class="effort-input rir-input" data-effort="rir" inputmode="decimal" value="${z.x.rir??''}" placeholder="${rowTarget.rir}" aria-label="Фактический RIR, цель ${rowTarget.rir}" onchange="editSet(${z.ei},${z.si},'rir',this.value,this)"><button class="check ${z.x.ok?'done':''}" onclick="toggleSet(${z.ei},${z.si})">${z.x.ok?'✓':'○'}</button></div>${z.prev?`<div class="prev-set">Прошлый: ${esc(z.prev.label)} · ${z.prev.date}</div>`:''}</div>`}).join('')}`}
 return `<div class="exercise ${method?'method':''}">${head}${method?'<div class="method-strip"></div>':''}${body}</div>`
}

// Replacement uses canonical catalog IDs and aliases, never the legacy arm fallback.
function replacementNorm(value){return WorkoutDomain.norm(value).replace(/[()]/g,' ').replace(/\s+/g,' ').trim()}
function replacementTitle(e){return e.strictName||e.n||''}
function replacementProfile(e){
 const name=replacementNorm(replacementTitle(e)),primary=e.tg||'',secondary=new Set((e.secondary||[]).map(x=>({quadriceps:'quads',shoulders:'delts',chest:'pectorals','latissimus dorsi':'lats',trapezius:'traps'}[x]||x)));
 let movement='';
 if(/ягодич.*мост|хип траст|hip thrust|glute bridge/.test(name))movement='bridge';
 else if(/румын|становая тяга|прямых ног|гудморнинг|good morning|наклоны.*штанг/.test(name))movement='hinge';
 else if(/гиперэкст/.test(name))movement='back_extension';
 else if(/присед|жим ногами|выпад|зашаг/.test(name))movement='squat';
 else if(/сгибание.*ног/.test(name))movement='leg_curl';
 else if(/разгибание.*ног/.test(name))movement='leg_extension';
 else if(/разведение ног|отведение ноги/.test(name))movement='abduction';
 else if(/сведение ног|приведение ноги/.test(name))movement='adduction';
 else if(/подъем.*носк/.test(name))movement='calf_raise';
 else if(/тяга верхнего|подтягив/.test(name))movement='vertical_pull';
 else if(/тяга.*наклоне|горизонтальная тяга|тяга т грифа|тяга гантели.*поясу/.test(name))movement='horizontal_pull';
 else if(/французский|разгибание.*рук|разгибание.*гантел/.test(name))movement='arm_extension';
 else if(/жим|отжиман/.test(name))movement='press';
 else if(/сведение рук|разведение гантелей лежа|кроссовер/.test(name))movement='fly';
 else if(/сгибание.*рук|сгибание гантел|молотков|бицепс/.test(name))movement='arm_curl';
 // Some source rows omit glutes from compound hip/knee extension.
 if(['hinge','squat','back_extension'].includes(movement))secondary.add('glutes');
 if(['hinge','bridge','back_extension'].includes(movement))secondary.add('hamstrings');
 const variation=/румын/.test(name)?'romanian':/прямых ног/.test(name)?'stiff_leg':'';
 return {primary,secondary,movement,variation,bp:e.bp||'',eq:e.eq||'',goodMorning:/гудморнинг|good morning|наклоны.*штанг/.test(name)}
}
function replacementRelation(e,base){
 const p=replacementProfile(e),samePrimary=!!base.primary&&p.primary===base.primary,
  sharedPrimary=!!base.primary&&p.secondary.has(base.primary),sameMovement=!!base.movement&&p.movement===base.movement;
 const supportingMovement=['bridge','hinge','back_extension','squat','abduction'].includes(p.movement);
 const related=!!base.bp&&p.bp===base.bp&&(samePrimary||sameMovement||(sharedPrimary&&supportingMovement));
 const recommend=related&&(!p.goodMorning||base.goodMorning);
 // Equipment cannot independently qualify a recommendation.
 const score=(samePrimary?100:0)+(sharedPrimary?45:0)+(sameMovement?90:0)+(base.variation&&base.variation===p.variation?60:0)+(base.eq&&p.eq===base.eq?4:0);
 return {recommend,score,samePrimary,sharedPrimary,sameMovement}
}
function replaceExerciseSheet(indices,baseToken,sourceId=''){
 if(!st.current||st.current.pendingCompletion)return;
 const base=decodeURIComponent(baseToken),entry=st.current.ex?.[indices[0]],rows=catalogRecords(),
  current=workoutRegistry.resolve(base)||workoutRegistry.resolve(entry)||workoutRegistry.resolve(String(sourceId)),
  inferred=inferCustomMeta(base),meta=current||(inferred.tg?{...inferred,n:base}:{n:base}),profile=replacementProfile(meta),currentName=replacementNorm(base);
 const candidates=rows.filter(e=>e.id!==current?.id&&replacementNorm(replacementTitle(e))!==currentName)
  .map(e=>({e,...replacementRelation(e,profile)})).sort((a,b)=>b.score-a.score||replacementTitle(a.e).localeCompare(replacementTitle(b.e),'ru'));
 window.__replacement={indices:indices.slice(),base,sessionId:st.current.id,candidates,mode:'similar',query:'',limit:24};
 modal(`<div class="sheet-grabber"></div><div class="row between"><div class="grow"><h2>Заменить упражнение</h2><div class="muted">${esc(replacementTitle(meta)||displayExerciseName(base))}</div></div><button class="btn tiny" aria-label="Закрыть" onclick="closeModal()">✕</button></div><p class="muted small">Подходы, повторы, RPE и темп сохранятся. Вес подбирается для нового упражнения.</p><div class="filterbar" role="group" aria-label="Список упражнений"><button class="filterchip on" data-replacement-mode="similar" aria-pressed="true" onclick="setReplacementMode('similar')">Похожие</button><button class="filterchip" data-replacement-mode="all" aria-pressed="false" onclick="setReplacementMode('all')">Все упражнения</button></div><input id="repSearch" class="search" aria-label="Поиск по всем упражнениям" placeholder="Поиск по всем упражнениям" oninput="filterReplacement(this.value)"><p id="replacementCount" class="muted small" role="status" aria-live="polite"></p><div id="replacementList"></div>`);
 renderReplacementList();
}
function replacementRow(item,index){
 const {e,samePrimary,sharedPrimary,sameMovement}=item,n=replacementTitle(e);
 const tags=samePrimary?'<span class="chip green">Та же основная мышца</span>':sharedPrimary?'<span class="chip">Целевая мышца участвует</span>':'';
 return `<button class="card exlib exlib-btn replacement-item" data-exercise-id="${esc(e.id)}" onclick="selectReplacement(${index})"><div class="row between"><div class="grow"><b>${esc(n)}</b><div class="catalog-meta">${esc(BP_RU[e.bp]||e.bp||'')} · ${esc(ruTarget(e.tg))} · ${esc(EQ_RU[e.eq]||e.eq||'')}</div><div class="replacement-score">${tags}${sameMovement?'<span class="chip">Похожее движение</span>':''}</div></div><span class="chev">›</span></div></button>`
}
function renderReplacementList(){
 const state=window.__replacement,root=$('#replacementList');if(!state||!root)return;
 const q=replacementNorm(state.query),tokens=q.split(' ').filter(Boolean),searching=!!q;
 const matched=state.candidates.filter(({e,recommend})=>{
  if(!searching)return state.mode==='all'||recommend;
  const hay=replacementNorm([replacementTitle(e),e.sourceName,...(e.aliases||[]),BP_RU[e.bp],ruTarget(e.tg),EQ_RU[e.eq]].join(' '));
  return tokens.every(token=>hay.includes(token));
 });
 if(searching||state.mode==='all')matched.sort((a,b)=>replacementTitle(a.e).localeCompare(replacementTitle(b.e),'ru'));
 state.visible=matched.slice(0,state.limit);
 root.innerHTML=state.visible.map(replacementRow).join('')+(matched.length>state.limit?'<button class="btn full" onclick="showMoreReplacements()">Показать ещё</button>':'')+
  (!matched.length?`<div class="card muted">${searching?'Ничего не найдено. Попробуй другое название.':'Похожих упражнений пока нет. Можно выбрать любое из каталога.'}</div>`:'')+
  (!searching&&state.mode==='similar'?`<button class="btn full" onclick="setReplacementMode('all')">Выбрать из всех упражнений</button>`:'');
 const count=$('#replacementCount');if(count)count.textContent=`${searching?'Поиск по всему каталогу':state.mode==='all'?'Все упражнения':'Похожие по мышцам и движению'} · ${matched.length}`;
 document.querySelectorAll('[data-replacement-mode]').forEach(b=>{const on=!searching&&b.dataset.replacementMode===state.mode;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
}
function filterReplacement(q){if(!window.__replacement)return;window.__replacement.query=String(q||'');window.__replacement.limit=24;renderReplacementList()}
function setReplacementMode(mode){if(!window.__replacement)return;window.__replacement.mode=mode==='all'?'all':'similar';window.__replacement.query='';window.__replacement.limit=24;const input=$('#repSearch');if(input)input.value='';renderReplacementList()}
function showMoreReplacements(){if(window.__replacement){window.__replacement.limit+=24;renderReplacementList()}}
function selectReplacement(index){
 const state=window.__replacement,item=state?.visible?.[index];if(!item||st.current?.id!==state.sessionId)return;
 applyReplacement(state.indices,encodeURIComponent(state.base),encodeURIComponent(replacementTitle(item.e)),item.e.id);
}
function applyReplacement(indices,oldToken,newToken,sourceId){
 if(!st.current||st.current.pendingCompletion)return;
 if(!indices.length||indices.some(i=>!st.current.ex[i]))return;
 if(indices.some(i=>st.current.ex[i].set?.some(s=>s.ok)))return toast('Нельзя заменить упражнение с выполненными подходами');
 const oldBase=decodeURIComponent(oldToken),newName=decodeURIComponent(newToken),row=workoutRegistry.resolve(String(sourceId))||workoutRegistry.resolve(newName);
 indices.forEach(ei=>{
  const e=st.current.ex[ei],suffix=e.n.startsWith(oldBase)?e.n.slice(oldBase.length):e.n.includes(' — ')?' — '+e.n.split(' — ').slice(1).join(' — '):'';
  e.n=newName+suffix;e.sourceId=row?.rawId||row?.id||sourceId||null;
  for(const key of ['exerciseId','loadType','weightProfile','implementCount','loadedSides','implementWeight','equipmentProfile','equipmentProfileId','trainingProgression292','trainingEstimate200','recommendation194','engine196Recommendation','progression187'])delete e[key];
  if(row){e.exerciseId=row.id;e.loadType=row.loadType;e.implementCount=row.implementCount;e.bp=row.bp;e.tg=row.tg;e.eq=row.eq;e.type=row.type}
  e.programWeightMode='adaptive';e.weightDecision='calibration';
  // Kilograms, equipment and recommendations from another movement do not transfer.
  for(const set of e.set||[]){
   for(const key of ['programW','plannedW','baselineW','baselineSource','launchW','recommendedW','recommendation','recommendationRestore','recommendationDecision','dismissedRecommendation','trainingIntensity292','equipmentProfile','equipmentProfileId','equipmentSnapshot','loadType','implementCount','loadedSides','implementWeight'])delete set[key];
   set.w='';set.manualOverride=false;set.weightSource='replacement';set.launchWeightCaptured206=true;
  }
 });
 save();closeModal();window.__replacement=null;startPage();window.trainingLoadModel292?.run?.(true);toast(`Замена: ${newName}`)
}

save();setTimeout(()=>{renderBodyFilters();renderExerciseResults()},0);
