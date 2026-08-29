'use strict';
(()=>{
 if(window.__unvrslCatalogCurationV4)return;window.__unvrslCatalogCurationV4=true;
 const n=s=>String(s||'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[_–—-]+/g,' ').replace(/\s+/g,' ').trim();
 const cap=s=>s?String(s).charAt(0).toUpperCase()+String(s).slice(1):'';
 const JUNK=/(basic toe touch|toe touch|body.?up|bench dip|elbow dip|battling rope|battle rope|bench hip extension|reverse hyper|neck|wrist|finger|rotary calf|donkey calf|sissy squat|jefferson|zercher|reverse hack|reverse t.?bar|vertical traction|rotary|power clean|clean and jerk|hang clean|snatch|muscle.?up|handstand|planche|human flag|iron cross|dragon flag|archer|typewriter|commando|pistol squat|burpee|bear crawl|crab walk|frog|windmill|kneeling jump|plyometric|bosu|swiss ball|stability ball|exercise ball|suspension|trx|stretch|mobility|warm.?up|cool.?down|yoga|pilates|foam roll|massage|jumping jack|high knees|mountain climber)/i;
 function equip(s){return /smith/.test(s)?'в Смите':/dumbbell/.test(s)?'с гантелями':/ez barbell/.test(s)?'с EZ-штангой':/barbell|olympic barbell/.test(s)?'со штангой':/kettlebell/.test(s)?'с гирей':/cable|rope/.test(s)?'на блоке':/lever|machine/.test(s)?'в тренажёре':/band/.test(s)?'с резиной':/weighted/.test(s)?'с дополнительным весом':''}
 function grip(s){return /neutral grip/.test(s)?' нейтральным хватом':/wide grip/.test(s)?' широким хватом':/close grip|narrow grip/.test(s)?' узким хватом':/reverse grip|underhand/.test(s)?' обратным хватом':''}
 function title(raw){const s=n(raw);if(!s||JUNK.test(s))return'';const one=/one arm|single arm/.test(s),oneLeg=/one leg|single leg/.test(s),g=grip(s),eq=equip(s);
  if(/walking on incline treadmill/.test(s))return'Ходьба на беговой дорожке под наклоном';
  if(/3\/4 sit.?up/.test(s))return'Скручивания 3/4';
  if(/side bend/.test(s)&&/45/.test(s))return'Боковые наклоны корпуса под 45°';
  if(/reverse fly|rear delt/.test(s)&&/lever|machine/.test(s))return'Обратная бабочка в тренажёре';
  if(/pec deck|butterfly/.test(s)||(/fly/.test(s)&&/lever|machine/.test(s)))return'Сведение рук в тренажёре';
  if(/bench press|chest press/.test(s)){const a=/incline/.test(s)?' на наклонной скамье':/decline/.test(s)?' на скамье с отрицательным наклоном':'';if(/lever|machine/.test(s))return`Жим от груди в тренажёре${a}`;if(/dumbbell/.test(s))return`Жим гантелей${a||' лёжа'}${g}`;if(/smith/.test(s))return`Жим в Смите${a||' лёжа'}${g}`;return`Жим штанги${a||' лёжа'}${g}`}
  if(/cable fly|crossover/.test(s))return /low to high/.test(s)?'Сведение рук в кроссовере снизу вверх':/high to low/.test(s)?'Сведение рук в кроссовере сверху вниз':'Сведение рук в кроссовере';
  if(/dumbbell fly/.test(s))return /incline/.test(s)?'Разведение гантелей на наклонной скамье':'Разведение гантелей лёжа';
  if(/push.?up/.test(s))return /knee/.test(s)?'Отжимания с колен':/feet elevated|decline/.test(s)?'Отжимания с ногами на возвышении':/incline|hands elevated/.test(s)?'Отжимания от опоры':/close|diamond/.test(s)?'Отжимания узким хватом':/wide/.test(s)?'Отжимания широким хватом':'Отжимания';
  if(/pull.?up/.test(s))return cap(`${/assisted/.test(s)?'подтягивания в гравитроне':/weighted/.test(s)?'подтягивания с дополнительным весом':'подтягивания'}${g}`);
  if(/chin.?up/.test(s))return /assisted/.test(s)?'Подтягивания обратным хватом в гравитроне':'Подтягивания обратным хватом';
  if(/lat pulldown|pulldown/.test(s)&&!/straight arm/.test(s))return cap(`тяга верхнего блока${one?' одной рукой':''}${g}`);
  if(/straight arm pulldown/.test(s))return'Тяга верхнего блока прямыми руками';
  if(/high row/.test(s)&&/lever|machine/.test(s))return'Тяга сверху в тренажёре';
  if(/seated row|low row|horizontal row/.test(s))return cap(`${/lever|machine/.test(s)?'горизонтальная тяга в тренажёре':'горизонтальная тяга нижнего блока'}${one?' одной рукой':''}${g}`);
  if(/t.?bar row/.test(s))return /chest supported|supported/.test(s)?'Тяга Т-грифа с упором грудью':'Тяга Т-грифа';
  if(/bent over row/.test(s))return cap(`${/dumbbell/.test(s)?'тяга гантелей в наклоне':'тяга штанги в наклоне'}${g}`);
  if(/dumbbell row|one arm row|single arm row/.test(s))return'Тяга гантели одной рукой';
  if(/pullover/.test(s))return /dumbbell/.test(s)?'Пуловер с гантелью':/cable/.test(s)?'Пуловер на верхнем блоке':'Пуловер в тренажёре';
  if(/shrug/.test(s))return cap(`шраги ${eq}`.trim());
  if(/romanian deadlift/.test(s))return cap(`румынская тяга ${eq}${oneLeg?' на одной ноге':''}`.trim());
  if(/stiff leg deadlift/.test(s))return cap(`тяга на прямых ногах ${eq}`.trim());
  if(/deadlift/.test(s))return cap(`становая тяга ${eq}`.trim());
  if(/front squat/.test(s))return cap(`фронтальный присед ${eq}`.trim());
  if(/bulgarian/.test(s))return cap(`болгарские выпады ${eq}`.trim());
  if(/split squat/.test(s))return cap(`выпады на месте ${eq}`.trim());
  if(/hack squat/.test(s))return'Гакк-присед в тренажёре';
  if(/squat/.test(s))return cap(`приседания ${eq}`.trim());
  if(/leg press/.test(s))return oneLeg?'Жим одной ногой в тренажёре':'Жим ногами в тренажёре';
  if(/leg extension/.test(s))return oneLeg?'Разгибание одной ноги в тренажёре':'Разгибание ног в тренажёре';
  if(/leg curl/.test(s))return /lying/.test(s)?'Сгибание ног лёжа в тренажёре':/standing/.test(s)?'Сгибание ноги стоя в тренажёре':'Сгибание ног сидя в тренажёре';
  if(/hip thrust|glute bridge/.test(s))return cap(`ягодичный мост ${eq}${oneLeg?' на одной ноге':''}`.trim());
  if(/lunge/.test(s))return cap(`${/reverse|backward/.test(s)?'выпады назад':'выпады'} ${eq}`.trim());
  if(/step.?up/.test(s))return cap(`зашагивания на платформу ${eq}`.trim());
  if(/hip abduction|abductor/.test(s))return /cable/.test(s)?'Отведение ноги в сторону на блоке':'Разведение ног в тренажёре';
  if(/hip adduction|adductor/.test(s))return /cable/.test(s)?'Приведение ноги на блоке':'Сведение ног в тренажёре';
  if(/calf raise/.test(s))return cap(`${/seated/.test(s)?'подъём на носки сидя':'подъём на носки стоя'} ${eq}`.trim());
  if(/arnold press/.test(s))return /seated/.test(s)?'Жим Арнольда сидя':'Жим Арнольда';
  if(/military press/.test(s))return cap(`${/seated/.test(s)?'армейский жим сидя':'армейский жим стоя'} ${eq}`.trim());
  if(/shoulder press|overhead press/.test(s)){if(/kettlebell/.test(s))return cap(`жим гири над головой${/seated/.test(s)?' сидя':/standing/.test(s)?' стоя':''}`);if(/lever|machine/.test(s))return'Жим на плечи в тренажёре';return cap(`${/dumbbell/.test(s)?'жим гантелей над головой':'жим над головой'} ${eq}`.trim())}
  if(/lateral raise/.test(s))return /cable/.test(s)?'Отведение руки в сторону на блоке':/lever|machine/.test(s)?'Отведение рук в стороны в тренажёре':'Махи гантелями в стороны';
  if(/front raise/.test(s))return cap(`подъём перед собой ${eq}`.trim());
  if(/face pull/.test(s))return'Тяга каната к лицу';
  if(/hammer curl/.test(s))return /cable/.test(s)?'Молотковые сгибания на нижнем блоке':'Молотковые сгибания с гантелями';
  if(/preacher curl/.test(s))return cap(`сгибание рук на скамье Скотта ${eq}`.trim());
  if(/concentration curl/.test(s))return'Концентрированное сгибание с гантелью';
  if(/biceps curl|barbell curl|dumbbell curl|cable curl/.test(s))return cap(`сгибание рук ${eq}${one?' одной рукой':''}`.trim());
  if(/triceps pushdown|pushdown/.test(s))return /rope/.test(s)?'Разгибание рук на верхнем блоке с канатом':'Разгибание рук на верхнем блоке';
  if(/skull crusher|lying triceps extension/.test(s))return cap(`французский жим лёжа ${eq}`.trim());
  if(/triceps extension/.test(s))return cap(`${/overhead/.test(s)?'разгибание рук из-за головы':'разгибание рук на трицепс'} ${eq}${one?' одной рукой':''}`.trim());
  if(/crunch/.test(s))return /cable/.test(s)?'Скручивания на верхнем блоке':'Скручивания';
  if(/sit.?up/.test(s))return'Подъём корпуса';if(/hanging leg raise/.test(s))return'Подъём ног в висе';if(/leg raise/.test(s))return'Подъём ног';if(/hanging knee raise/.test(s))return'Подъём коленей в висе';if(/side plank/.test(s))return'Боковая планка';if(/plank/.test(s))return'Планка';if(/russian twist/.test(s))return'Русские повороты';if(/ab wheel/.test(s))return'Выкаты с роликом для пресса';return''
 }
 function polish(text){let s=String(text||'').trim();const r=[[/ступни на землю/gi,'стопы на пол'],[/ступни на земле/gi,'стопы на полу'],[/от земли/gi,'от пола'],[/на земле/gi,'на полу'],[/Включив пресс/gi,'Напрягите мышцы живота и'],[/Задействуя пресс/gi,'Напрягите мышцы живота и'],[/желаемого количества повторений/gi,'нужного количества повторений'],[/необходимого количества повторений/gi,'нужного количества повторений'],[/Повторите необходимое количество повторений\.?/gi,'Выполните нужное количество повторений.'],[/Повторите желаемое количество повторений\.?/gi,'Выполните нужное количество повторений.'],[/медленно и контролируемо/gi,'плавно и подконтрольно'],[/держите спину прямо/gi,'сохраняйте нейтральное положение спины']];for(const[a,b]of r)s=s.replace(a,b);return s.replace(/\s+/g,' ').trim()}
 const CARDIO=[
  {id:'cardio:treadmill',n:'Беговая дорожка',machine:'Беговая дорожка',metrics:['time','distance','calories'],note:'Бег или ходьба на дорожке в заданном темпе.'},
  {id:'cardio:incline-walk',n:'Ходьба на беговой дорожке под наклоном',machine:'Беговая дорожка',metrics:['time','distance','calories'],note:'Ходьба с заданным наклоном и скоростью.'},
  {id:'cardio:bike',n:'Велотренажёр',machine:'Велотренажёр',metrics:['time','distance','calories'],note:'Равномерная или интервальная работа на велотренажёре.'},
  {id:'cardio:airbike',n:'Аэробайк',machine:'Аэробайк',metrics:['time','calories'],note:'Интервальная или равномерная работа руками и ногами.'},
  {id:'cardio:rower',n:'Гребной тренажёр',machine:'Гребной тренажёр',metrics:['time','distance','calories'],note:'Гребля с контролем темпа и мощности.'},
  {id:'cardio:skierg',n:'Лыжный тренажёр SkiErg',machine:'SkiErg',metrics:['time','distance','calories'],note:'Имитация лыжного хода на SkiErg.'},
  {id:'cardio:elliptical',n:'Эллиптический тренажёр',machine:'Эллипс',metrics:['time','distance','calories'],note:'Равномерная кардиоработа на эллиптическом тренажёре.'},
  {id:'cardio:stairmaster',n:'Лестничный тренажёр StairMaster',machine:'StairMaster',metrics:['time','calories'],note:'Непрерывный подъём по ступеням в заданном темпе.'},
  {id:'cardio:stepper',n:'Степпер',machine:'Степпер',metrics:['time','calories'],note:'Кардиоработа на степпере в заданном темпе.'}
 ].map(x=>({...x,bp:'cardio',tg:'cardiovascular system',eq:'cardio',kind:'cardio',cardioPreset:true,custom:false,gif:'',image:'',instructions:{ru:x.note}}));
 function source(){const src=Array.isArray(window.ogLibrary)?window.ogLibrary:(typeof ogLibrary!=='undefined'&&Array.isArray(ogLibrary)?ogLibrary:[]),out=[],seen=new Set();for(const e of src){if(!e||e.custom||e.anatome||!String(e.gif||e.gif_url||'').trim())continue;const t=title(e.n||e.name);if(!t||JUNK.test(n(e.n||e.name)))continue;const k=n(t);if(seen.has(k))continue;seen.add(k);e.__ruTitle=t;if(e.instructions?.ru)e.instructions.ru=polish(e.instructions.ru);out.push(e)}return out.sort((a,b)=>String(a.__ruTitle).localeCompare(String(b.__ruTitle),'ru'))}
 window.UNVRSL_CATALOG_TITLE=e=>e?.cardioPreset?e.n:(e?.__ruTitle||title(e?.n||e?.name)||'');window.UNVRSL_CATALOG_RECORDS=()=>[...source(),...CARDIO];window.UNVRSL_CARDIO_RECORDS=CARDIO;
 const oldRu=window.ruExerciseName;window.ruExerciseName=function(raw){const t=title(raw);return t||((typeof oldRu==='function')?oldRu(raw):String(raw||''))};
 const oldInstr=window.instructionRu;window.instructionRu=function(ex){if(ex?.cardioPreset)return ex.instructions?.ru||'';const s=typeof oldInstr==='function'?oldInstr(ex):String(ex?.instructions?.ru||'');return polish(s)};
 const oldCatalog=window.catalogRecords;if(typeof oldCatalog==='function'){window.catalogRecords=function(){const base=oldCatalog.apply(this,arguments)||[],names=new Set(base.map(e=>n(e.n||e.name)));for(const c of CARDIO)if(!names.has(n(c.n)))base.unshift(c);return base};try{catalogRecords=window.catalogRecords}catch(_){}}
 window.openCatalogCardioV4=function(token){const id=decodeURIComponent(token),e=CARDIO.find(x=>x.id===id);if(!e)return;const m={time:'Время',distance:'Дистанция',calories:'Калории'};modal(`<div class="sheet-grabber"></div><div class="detail-title">${esc(e.n)}</div><div class="detail-tags"><span>Кардио</span><span>${esc(e.machine)}</span></div><div class="card"><b>Доступные цели</b><div class="muted" style="margin-top:7px">${e.metrics.map(x=>m[x]).join(' · ')}</div></div><div class="section">КАК ИСПОЛЬЗОВАТЬ</div><div class="tech-card">${esc(e.note)} При добавлении в программу выберите время, дистанцию или калории из доступных для этого тренажёра показателей.</div>`)};
})();