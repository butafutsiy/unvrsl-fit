const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const K='unvrsl-fit-v2', DAYCODE={1:'A1',2:'B',4:'C',5:'A2',6:'D'};
const RPE={1:7,2:8,3:8.5,4:6.5,5:8.5,6:6.5,7:9,8:9};
const BASE={1:150,2:150,3:120,4:75,5:150,6:75,7:210,8:300}, ISO={1:75,2:75,3:60,4:45,5:75,6:45,7:105,8:105};
const BASEWORDS=['присед','жим лёжа','тяга штанги','румын','армей','жим ногами','подтяг','т-грифа','ягодичный мост'];
const ROUTINES=window.UNVRSL_ROUTINES||[];
const map=new Map(ROUTINES.map(r=>[`${r.w}-${r.c}`,r]));
let st; try{st=JSON.parse(localStorage.getItem(K))}catch(e){}
if(!st) st={bw:[{d:'2026-08-25',w:97.5}],sessions:[],current:null,week:1};
const save=()=>localStorage.setItem(K,JSON.stringify(st));
const esc=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const iso=d=>{d=d||new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const fmt=d=>new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(d);
const isBase=n=>BASEWORDS.some(x=>n.toLowerCase().includes(x));
function rest(r,e,i){
  if(/DS/.test(e.n)) return e.g&&r.e[i+1]?.g===e.g?0:ISO[r.w];
  if(/SLDR/.test(e.n)) return e.g&&r.e[i+1]?.g===e.g?15:(isBase(e.n)?BASE[r.w]:ISO[r.w]);
  if(/UNVRSL/.test(e.n)) return e.g&&r.e[i+1]?.g===e.g?30:(isBase(e.n)?BASE[r.w]:ISO[r.w]);
  if(/FST-7/.test(e.n)) return 30;
  return isBase(e.n)?BASE[r.w]:ISO[r.w];
}
function plannedForDate(d){
  const start=new Date('2026-08-31T12:00:00'), x=new Date(d); x.setHours(12,0,0,0);
  const diff=Math.floor((x-start)/86400000); if(diff<0)return null;
  const w=Math.floor(diff/7)+1; if(w<1||w>8)return null;
  const c=DAYCODE[x.getDay()]; return c?map.get(`${w}-${c}`):null;
}
function nextPlan(){
  let d=new Date(); for(let i=0;i<80;i++){let x=new Date(d);x.setDate(d.getDate()+i);let r=plannedForDate(x);if(r)return {d:x,r};}return null;
}
const latestW=()=>st.bw.length?st.bw[st.bw.length-1].w:null;
const done=s=>s?.ex.reduce((a,e)=>a+e.set.filter(x=>x.ok).length,0)||0;
const total=s=>s?.ex.reduce((a,e)=>a+e.set.length,0)||0;
function session(r){
 return {id:'s'+Date.now(),date:iso(),w:r.w,c:r.c,name:r.t,target:RPE[r.w],started:Date.now(),ended:null,
  ex:r.e.map((e,i)=>({n:e.n,d:e.d||'',rest:rest(r,e,i),set:Array.from({length:e.s||1},(_,j)=>({n:j+1,w:e.w||0,r:e.r||0,rpe:'',ok:false}))}))};
}
function nav(p){$$('.page').forEach(x=>x.classList.toggle('active',x.id===p));$$('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.p===p));render()}
$$('.nav button').forEach(b=>b.onclick=()=>nav(b.dataset.p));
function render(){
 $('#date').textContent=fmt(new Date()); home(); planPage(); startPage(); stats(); settings();
}
function home(){
 const r=plannedForDate(new Date()), nx=nextPlan(), w=latestW();
 $('#home').innerHTML=`
 <div class="card hero"><div class="eyebrow">${r?'СЕГОДНЯ':'БЛИЖАЙШАЯ ТРЕНИРОВКА'}</div><h2>${esc(r?r.t:(nx?nx.r.t:'Цикл завершён'))}</h2>
 ${!r&&nx?`<div class=muted>${fmt(nx.d)} · W${nx.r.w}</div>`:''}
 <div class=actions>${r?`<button class="primary" onclick="begin('${r.w}','${r.c}')">Начать</button>`:nx?`<button onclick="preview('${nx.r.w}','${nx.r.c}')">Посмотреть</button>`:''}<button onclick="quick()">Выбрать</button></div></div>
 <div class=twocol><div class=metric><span>Вес тела</span><b>${w??'—'}${w?' кг':''}</b><button onclick=weight()>+ Записать</button></div><div class=metric><span>Тренировки</span><b>${st.sessions.length}</b><small>${st.sessions.filter(s=>daysAgo(s.date)<7).length} за 7 дней</small></div></div>
 <div class=card><div class="row between"><div><h3>Экспорт для ChatGPT</h3><div class=muted>Подходы, RPE, вес и история</div></div><button class=primary onclick=exportChat()>Экспорт</button></div></div>`;
}
function daysAgo(ds){return Math.floor((Date.now()-new Date(ds+'T12:00:00'))/86400000)}
function planPage(){
 let w=st.week||1, list=ROUTINES.filter(r=>r.w===w);
 $('#plan').innerHTML=`<div class=weekbar>${[1,2,3,4,5,6,7,8].map(x=>`<button class="${x===w?'on':''}" onclick="st.week=${x};save();planPage()">W${x}</button>`).join('')}</div>
 <div class=card><div class="row between"><div><h3>Неделя ${w}</h3><div class=muted>${w===4||w===6?'разгрузка / памп':w===8?'тест':w===7?'сила':'прогрессия'}</div></div><span class=chip>RPE ${RPE[w]}</span></div></div>
 ${list.map(r=>`<div class="card routine" onclick="preview('${r.w}','${r.c}')"><h3>${esc(r.c)} · ${esc(r.t)}</h3><div class=muted>${esc(r.p)}</div><div class=meta><span class=chip>${r.e.length} блоков</span><span class=chip>RPE ${RPE[w]}</span></div></div>`).join('')}`;
}
function begin(w,c){
 const r=map.get(`${w}-${c}`);if(!r)return;
 if(st.current&&done(st.current)>0&&!confirm('Текущая тренировка не завершена. Начать новую?'))return;
 st.current=session(r);save();closeModal();nav('start');
}
function startPage(){
 const s=st.current;if(!s){$('#start').innerHTML=`<div class=card><h2>Нет активной тренировки</h2><div class=muted>Выбери тренировку из плана.</div><button class=primary onclick=quick()>Выбрать</button></div>`;return}
 let pct=total(s)?Math.round(done(s)/total(s)*100):0;
 $('#start').innerHTML=`<div class=card><div class="row between"><div><h2>${esc(s.c)} · ${esc(s.name)}</h2><div class=muted>W${s.w} · цель RPE ${s.target}</div></div><span class=chip>${pct}%</span></div><div class=bar><i style="width:${pct}%"></i></div></div>
 ${s.ex.map((e,ei)=>exercise(e,ei)).join('')}
 <div class=card><button class="primary full" onclick=finish()>Завершить тренировку</button></div>`;
}
function exercise(e,ei){
 const meth=/UNVRSL|SLDR|DS|FST-7/.test(e.n);
 return `<div class="exercise ${meth?'method':''}"><div class="row between"><div><h3>${esc(e.n)}</h3>${e.d?`<div class=muted>${esc(e.d)}</div>`:''}<small>Отдых: ${e.rest} сек</small></div><button onclick="timer(${e.rest})">⏱</button></div>
 <div class=sethead><span>#</span><span>кг</span><span>повт.</span><span>RPE</span><span></span></div>
 ${e.set.map((x,si)=>`<div class=setrow><span>${si+1}</span><input inputmode=decimal value="${x.w||''}" onchange="edit(${ei},${si},'w',this.value)"><input inputmode=numeric value="${x.r||''}" onchange="edit(${ei},${si},'r',this.value)"><input inputmode=decimal placeholder="${s.target}" value="${x.rpe||''}" onchange="edit(${ei},${si},'rpe',this.value)"><button class="${x.ok?'done':''}" onclick="toggle(${ei},${si})">${x.ok?'✓':'○'}</button></div>`).join('')}</div>`;
}
function edit(ei,si,k,v){let x=st.current.ex[ei].set[si];x[k]=v===''?'':Number(String(v).replace(',','.'));save()}
function toggle(ei,si){let e=st.current.ex[ei],x=e.set[si];x.ok=!x.ok;save();if(x.ok)timer(e.rest);startPage()}
function finish(){
 const s=st.current;if(!s)return;if(!done(s)&&!confirm('Нет отмеченных подходов. Завершить?'))return;
 s.ended=Date.now();s.suggest=s.ex.map(e=>{let a=e.set.filter(x=>x.ok&&x.rpe);if(!a.length)return null;let av=a.reduce((q,x)=>q+Number(x.rpe),0)/a.length;return {n:e.n,r:+av.toFixed(1),a:av<=s.target-1?'+2.5–5%':av>=s.target+1?'−2.5–5%':'оставить'}}).filter(Boolean);
 st.sessions.push(s);st.current=null;save();stopTimer();summary(s);
}
function summary(s){modal(`<h2>Тренировка завершена</h2><div class=muted>${done(s)} выполненных подходов</div><h3 class=sect>Авторегуляция</h3>${s.suggest.length?s.suggest.map(x=>`<div class="line row between"><div><b>${esc(x.n)}</b><div class=muted>ср. RPE ${x.r}</div></div><span class="chip ${x.a[0]=='+'?'green':x.a[0]=='−'?'orange':''}">${x.a}</span></div>`).join(''):'<div class=muted>Заполняй RPE — появятся рекомендации.</div>'}<button class="primary full" onclick="closeModal();nav('stats')">Готово</button>`)}
function preview(w,c){let r=map.get(`${w}-${c}`);modal(`<div class="row between"><div><h2>${esc(r.c)} · ${esc(r.t)}</h2><div class=muted>W${r.w} · RPE ${RPE[r.w]}</div></div><button onclick=closeModal()>✕</button></div>${r.e.map((e,i)=>`<div class=line><b>${esc(e.n)}</b><div class=muted>${e.s||1}×${e.r||e.m||'—'}${e.w?` · ${e.w} кг`:''} · отдых ${rest(r,e,i)}с</div></div>`).join('')}<button class="primary full" onclick="begin('${r.w}','${r.c}')">Начать</button>`)}
function quick(){modal(`<h2>Выбрать тренировку</h2><div class=weekbar>${[1,2,3,4,5,6,7,8].map(w=>`<button onclick=qweek(${w})>W${w}</button>`).join('')}</div><div id=ql></div>`);qweek(st.week||1)}
function qweek(w){$('#ql').innerHTML=ROUTINES.filter(r=>r.w===w).map(r=>`<div class="line row between"><div><b>${r.c} · ${esc(r.t)}</b><div class=muted>RPE ${RPE[w]}</div></div><button class=primary onclick="begin('${r.w}','${r.c}')">Старт</button></div>`).join('')}
function stats(){
 let vol=0,rpes=[];st.sessions.forEach(s=>s.ex.forEach(e=>e.set.filter(x=>x.ok).forEach(x=>{vol+=(+x.w||0)*(+x.r||0);if(x.rpe)rpes.push(+x.rpe)})));
 let av=rpes.length?(rpes.reduce((a,b)=>a+b,0)/rpes.length).toFixed(1):'—';
 $('#stats').innerHTML=`<div class=twocol><div class=metric><span>Тренировки</span><b>${st.sessions.length}</b></div><div class=metric><span>Средний RPE</span><b>${av}</b></div></div><div class=card><span class=muted>Объём</span><h2>${Math.round(vol).toLocaleString('ru-RU')} кг</h2></div><div class=card><h3>Вес тела</h3>${chart()}</div><h3 class=sect>История</h3>${st.sessions.slice().reverse().slice(0,10).map(s=>`<div class=card><div class="row between"><div><b>${s.c} · ${esc(s.name)}</b><div class=muted>${s.date} · ${done(s)} подходов</div></div><span class=chip>W${s.w}</span></div></div>`).join('')||'<div class=card><div class=muted>История пока пустая.</div></div>'}`;
}
function chart(){let a=st.bw.slice(-20);if(a.length<2)return '<div class=muted>Добавь минимум две записи.</div>';let vals=a.map(x=>+x.w),mn=Math.min(...vals),mx=Math.max(...vals),rg=Math.max(.5,mx-mn),pts=a.map((x,i)=>`${14+i*292/(a.length-1)},${128-(x.w-mn)*105/rg}`).join(' ');return `<svg viewBox="0 0 320 140"><polyline points="${pts}" fill=none stroke="#32d45b" stroke-width=4 stroke-linecap=round stroke-linejoin=round /></svg><div class="row between muted"><span>${mn.toFixed(1)}</span><b>${vals.at(-1).toFixed(1)} кг</b><span>${mx.toFixed(1)}</span></div>`}
function settings(){
 $('#settings').innerHTML=`<div class=card><div class="line row between"><div><b>Вес тела</b><div class=muted>${latestW()??'—'} кг</div></div><button onclick=weight()>Записать</button></div><div class="line row between"><div><b>Резервная копия</b><div class=muted>Локальные данные</div></div><button onclick=backup()>Экспорт</button></div><div class="line row between"><div><b>Импорт</b><div class=muted>Резервная копия UNVRSL FIT</div></div><label class=button for=imp>Выбрать</label><input id=imp hidden type=file accept=.json onchange="importBackup(this.files[0])"></div></div><div class=card><div class=muted>Все записи тренировок хранятся локально на этом устройстве. GitHub содержит только код приложения и стартовый план.</div></div>`;
}
function weight(){modal(`<h2>Вес тела</h2><input class=biginput id=wi inputmode=decimal value="${latestW()??''}"><button class="primary full" onclick=saveW()>Сохранить</button>`)}
function saveW(){let v=parseFloat(String($('#wi').value).replace(',','.'));if(!v)return;st.bw.push({d:iso(),w:v});save();closeModal();render();toast('Вес сохранён')}
function modal(x){$('#sheet').innerHTML=x;$('#modal').classList.add('show')}
function closeModal(){$('#modal').classList.remove('show')}
function dl(n,o){let b=new Blob([JSON.stringify(o,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(u),500)}
function exportChat(){dl(`unvrsl-chatgpt-${iso()}.json`,{format:'unvrsl-fit-chatgpt-v1',exportedAt:new Date().toISOString(),bodyweight:st.bw,sessions:st.sessions,current:st.current})}
function backup(){dl(`unvrsl-fit-backup-${iso()}.json`,{format:'unvrsl-fit-backup-v1',state:st})}
async function importBackup(f){if(!f)return;try{let x=JSON.parse(await f.text());if(x.format==='unvrsl-fit-backup-v1'&&x.state){st=x.state;save();render();toast('Импортировано')}else alert('Неверный формат')}catch(e){alert('Не удалось прочитать файл')}}
let ti=null,end=0;
function timer(sec){if(!sec)return;stopTimer();end=Date.now()+sec*1000;$('#timer').classList.add('show');tick();ti=setInterval(tick,250)}
function tick(){let s=Math.max(0,Math.ceil((end-Date.now())/1000));$('#tt').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;if(!s){stopTimer();toast('Отдых закончен');try{navigator.vibrate?.(150)}catch(e){}}}
function add30(){end+=30000;tick()}
function stopTimer(){$('#timer').classList.remove('show');if(ti)clearInterval(ti);ti=null}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),1600)}
save();render();