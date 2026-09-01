'use strict';
(()=>{
  if(window.__unvrslProfileStrengthCoreV248)return;
  window.__unvrslProfileStrengthCoreV248=true;
  if(!window.st)return;
  const W=window;
  if(!st.profileBio||typeof st.profileBio!=='object')st.profileBio={heightCm:null,birthDate:null,sex:null};

  const css=document.createElement('style');
  css.id='profile-strength-core-v248-style';
  css.textContent=`
    .strength-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:12px}.strength-summary .metric b{font-size:20px}
    .strength-list{display:flex;flex-direction:column}.strength-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:13px 0;border-bottom:1px solid #303034;background:transparent;border-left:0;border-right:0;border-top:0;width:100%;color:inherit;text-align:left}.strength-item:last-child{border-bottom:0}
    .strength-item-title{font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.strength-item-meta{color:#8e8e93;font-size:12px;margin-top:4px}.strength-delta{font-weight:800;font-variant-numeric:tabular-nums}.strength-delta.up{color:var(--green)}.strength-delta.down{color:#ff9f0a}
    .strength-chart{width:100%;height:auto;display:block;margin:12px 0 4px}.strength-history-row{display:grid;grid-template-columns:86px 1fr auto;gap:9px;align-items:center;padding:9px 0;border-bottom:1px solid #303034}.strength-history-row:last-child{border-bottom:0}
    .profile-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.profile-edit-grid .field:last-child{grid-column:1/-1}.strength-empty{padding:18px;text-align:center;color:#8e8e93}
  `;
  document.head.appendChild(css);

  function ageFromBirth(v){if(!v)return null;const d=new Date(v+'T12:00:00');if(Number.isNaN(d.getTime()))return null;const now=new Date();let a=now.getFullYear()-d.getFullYear();const m=now.getMonth()-d.getMonth();if(m<0||(m===0&&now.getDate()<d.getDate()))a--;return a>=0&&a<130?a:null}
  function currentWeight(){const w=typeof W.latestW==='function'?W.latestW():typeof latestW==='function'?latestW():null;return w==null?null:+w}
  function sexLabel(v){return v==='male'?'Мужской':v==='female'?'Женский':v==='other'?'Другой':'Не указан'}
  function e1rm(w,r){w=+w||0;r=+r||0;if(!w||!r)return 0;if(typeof W.advE1rm==='function')return W.advE1rm(w,r);return r===1?w:w*(1+r/30)}
  function baseName(n){return typeof W.baseExerciseName==='function'?W.baseExerciseName(n):String(n||'').split(' — ')[0]}
  function displayName(n){return typeof W.displayExerciseName==='function'?W.displayExerciseName(n):n}
  function E(v){return typeof W.esc==='function'?W.esc(String(v??'')):String(v??'')}

  function series(){
    const merged=typeof W.unvrslStatsSessions254==='function'?W.unvrslStatsSessions254():(st.sessions||[]),map=new Map(),sessions=[...(merged||[])].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||(+a.started||0)-(+b.started||0));
    sessions.forEach(s=>{
      const perSession=new Map();
      (s.ex||[]).forEach(e=>{
        const base=baseName(e.n),done=(e.set||[]).filter(x=>x.ok&&(+x.w||0)>0&&(+x.r||0)>0);if(!done.length)return;
        const key=base.toLowerCase();let z=perSession.get(key);if(!z){z={base,sets:[],sourceId:e.sourceId||null};perSession.set(key,z)}z.sets.push(...done);
      });
      perSession.forEach((z,key)=>{
        const maxWeight=Math.max(...z.sets.map(x=>+x.w||0)),best5=Math.max(0,...z.sets.filter(x=>+x.r===5).map(x=>+x.w||0)),one=Math.max(...z.sets.map(x=>e1rm(x.w,x.r))),volume=z.sets.reduce((a,x)=>a+(+x.w||0)*(+x.r||0),0);
        let rec=map.get(key);if(!rec){rec={key,base:z.base,sourceId:z.sourceId,points:[],sets:0};map.set(key,rec)}
        rec.points.push({date:s.date||'',started:+s.started||0,e1:+one.toFixed(1),maxWeight:+maxWeight.toFixed(1),best5:+best5.toFixed(1),sets:z.sets.length,volume:Math.round(volume)});rec.sets+=z.sets.length;
      });
    });
    return [...map.values()].map(x=>{const p=x.points,first=p[0],last=p[p.length-1],best=Math.max(...p.map(z=>z.e1)),bestWeight=Math.max(...p.map(z=>z.maxWeight)),best5=Math.max(0,...p.map(z=>z.best5)),growth=first?.e1>0?((best-first.e1)/first.e1*100):0;return{...x,first,last,best:+best.toFixed(1),bestWeight,best5,growth:+growth.toFixed(1),workouts:p.length}}).sort((a,b)=>(b.last?.date||'').localeCompare(a.last?.date||'')||b.workouts-a.workouts)
  }
  function medianGrowth(rows){const a=rows.filter(x=>x.workouts>=2&&x.growth>-50&&x.growth<250).map(x=>x.growth).sort((a,b)=>a-b);if(!a.length)return null;const m=Math.floor(a.length/2);return +(a.length%2?a[m]:(a[m-1]+a[m])/2).toFixed(1)}
  function row(x){const latest=x.last?.e1||0,delta=x.growth||0;return `<button class="strength-item" onclick="openStrengthExercise('${encodeURIComponent(x.key)}')"><div><div class="strength-item-title">${E(displayName(x.base))}</div><div class="strength-item-meta">${x.workouts} трен. · лучший вес ${x.bestWeight} кг · 1ПМ сейчас ≈ ${latest} кг</div></div><div class="strength-delta ${delta>0?'up':delta<0?'down':''}">${delta>0?'+':''}${delta.toFixed(1)}%</div></button>`}
  function overview(){const rows=series(),growth=medianGrowth(rows),totalSets=rows.reduce((a,x)=>a+x.sets,0);return `<div class="card"><div class="row between"><div><div class="title">Силовой прогресс</div><div class="muted">Только упражнения, которые реально выполнялись</div></div><span class="chip green">${rows.length} упр.</span></div><div class="strength-summary"><div class="metric"><span>Упражнений</span><b>${rows.length}</b></div><div class="metric"><span>Рабочих сетов</span><b>${totalSets}</b></div><div class="metric"><span>Медианный рост 1ПМ</span><b>${growth==null?'—':`${growth>=0?'+':''}${growth}%`}</b></div></div>${rows.length?`<div class="strength-list">${rows.slice(0,30).map(row).join('')}</div>`:'<div class="strength-empty">После завершённых тренировок здесь появятся графики роста силовых.</div>'}</div>`}
  function chart(points,key='e1'){const vals=points.map(x=>+x[key]||0),w=330,h=125,pad=14,min=Math.min(...vals),max=Math.max(...vals),range=Math.max(1,max-min),dx=points.length>1?(w-pad*2)/(points.length-1):0,pts=points.map((x,i)=>{const px=pad+i*dx,py=h-pad-((+x[key]||0)-min)/range*(h-pad*2);return[px,py]}),poly=pts.map(x=>x.join(',')).join(' ');return `<svg class="strength-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="График роста силовых"><line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" stroke="#343438"/><polyline points="${poly}" fill="none" stroke="var(--green)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${i===pts.length-1?5:3}" fill="var(--green)"/>`).join('')}</svg>`}

  W.profileAgeFromBirth=ageFromBirth;W.profileSexLabel=sexLabel;W.profileExerciseSeries=series;W.profileStrengthOverviewHtml=overview;
  try{profileAgeFromBirth=ageFromBirth;profileSexLabel=sexLabel;profileExerciseSeries=series;profileStrengthOverviewHtml=overview}catch(_){}

  W.openStrengthExercise=function(token){const key=decodeURIComponent(token),x=series().find(z=>z.key===key);if(!x)return;const first=x.first?.e1||0,last=x.last?.e1||0,latestChange=first?((last-first)/first*100):0;W.modal?.(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${E(displayName(x.base))}</h2><div class="muted">История силовых</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="strength-summary"><div class="metric"><span>Лучший 1ПМ</span><b>${x.best} кг</b></div><div class="metric"><span>Лучший вес</span><b>${x.bestWeight} кг</b></div><div class="metric"><span>Рост к первой</span><b>${x.growth>=0?'+':''}${x.growth}%</b></div></div>${chart(x.points)}<div class="muted small">Первая оценка 1ПМ: ${first} кг · последняя: ${last} кг (${latestChange>=0?'+':''}${latestChange.toFixed(1)}%)</div><div class="section">ПО ТРЕНИРОВКАМ</div>${[...x.points].reverse().map(p=>`<div class="strength-history-row"><span class="muted small">${E(p.date)}</span><span><b>1ПМ ≈ ${p.e1} кг</b><div class="muted small">${p.sets} сет. · объём ${p.volume.toLocaleString('ru-RU')} кг</div></span><b>${p.maxWeight} кг</b></div>`).join('')}`)};
  try{openStrengthExercise=W.openStrengthExercise}catch(_){}

  W.profileEditSheet=function(){const b=st.profileBio||{};W.modal?.(`<div class="sheet-grabber"></div><h2>Профиль спортсмена</h2><div class="profile-edit-grid"><div class="field"><label>Рост, см</label><input id="bioHeight" inputmode="decimal" type="number" min="100" max="250" step="0.5" value="${b.heightCm||''}" placeholder="Например, 183"></div><div class="field"><label>Дата рождения</label><input id="bioBirth" type="date" value="${E(b.birthDate||'')}"></div><div class="field"><label>Пол</label><select id="bioSex"><option value="" ${!b.sex?'selected':''}>Не указан</option><option value="male" ${b.sex==='male'?'selected':''}>Мужской</option><option value="female" ${b.sex==='female'?'selected':''}>Женский</option><option value="other" ${b.sex==='other'?'selected':''}>Другой</option></select></div></div><div class="card"><div class="row between"><div><b>Текущий вес</b><div class="muted small">Записывается отдельно и строит собственный график</div></div><b>${currentWeight()==null?'—':currentWeight()+' кг'}</b></div></div><button class="btn primary full" onclick="profileSaveBio()">Сохранить</button>`)};
  try{profileEditSheet=W.profileEditSheet}catch(_){}
  W.profileSaveBio=async function(){const h=Number(String(document.getElementById('bioHeight')?.value||'').replace(',','.'))||null,birth=document.getElementById('bioBirth')?.value||null,sex=document.getElementById('bioSex')?.value||null;if(h&&(h<100||h>250))return W.toast?.('Проверь рост');st.profileBio={heightCm:h,birthDate:birth,sex};W.save?.();if(W.cloud?.ready&&W.cloud.user){const r=await W.cloud.client.from('profiles').update({height_cm:h,birth_date:birth,sex,updated_at:new Date().toISOString()}).eq('id',W.cloud.user.id).select().single();if(r.data)W.cloud.profile={...(W.cloud.profile||{}),...r.data};if(r.error)console.warn('profile bio sync',r.error)}W.closeModal?.();if(typeof W.statsProgressRefresh==='function')W.statsProgressRefresh(false);else W.statsPage?.();W.toast?.('Профиль сохранён')};
  try{profileSaveBio=W.profileSaveBio}catch(_){}

  let hydrated=false,attempt=0;
  async function hydrate(){if(hydrated||!W.cloud?.ready||!W.cloud.user){if(!hydrated&&attempt++<20)setTimeout(hydrate,350);return}hydrated=true;try{const r=await W.cloud.client.from('profiles').select('height_cm,birth_date,sex,display_name').eq('id',W.cloud.user.id).maybeSingle();if(!r.data)return;const remote={heightCm:r.data.height_cm==null?null:+r.data.height_cm,birthDate:r.data.birth_date||null,sex:r.data.sex||null},hasRemote=remote.heightCm||remote.birthDate||remote.sex;if(hasRemote){st.profileBio=remote;W.save?.()}else if(st.profileBio.heightCm||st.profileBio.birthDate||st.profileBio.sex){await W.cloud.client.from('profiles').update({height_cm:st.profileBio.heightCm||null,birth_date:st.profileBio.birthDate||null,sex:st.profileBio.sex||null,updated_at:new Date().toISOString()}).eq('id',W.cloud.user.id)}}catch(e){console.warn('profile hydrate',e)}}
  setTimeout(hydrate,250);
})();
