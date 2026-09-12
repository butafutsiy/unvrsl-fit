'use strict';
(()=>{
  const W=window, PROGRAM_ID='prog-unvrsl-sldr', SEED='unvrsl-sldr-program-v2', VERSION=2;
  if(W.__unvrslSldrProgramV2)return;W.__unvrslSldrProgramV2=true;

  const WEEK_META={
    1:{rpe:[7,8],rir:[2,3],pct:[70,75],tempo:'3-1-2',rest:120},
    2:{rpe:[7.5,8],rir:[2,2],pct:[75,80],tempo:'3-1-2',rest:120},
    3:{rpe:[8,9],rir:[1,2],pct:[80,85],tempo:'2-0-2',rest:120},
    4:{rpe:[6,7],rir:[3,4],pct:[60,65],tempo:'2-0-2',rest:90},
    5:{rpe:[8,9],rir:[1,2],pct:[85,88],tempo:'2-0-2',rest:180},
    6:{rpe:[7,8],rir:[2,3],pct:[60,65],tempo:'3-1-2',rest:90},
    7:{rpe:[8.5,9.5],rir:[0.5,1.5],pct:[88,90],tempo:'2-0-1',rest:180},
    8:{rpe:[9,10],rir:[0,1],pct:[90,100],tempo:'2-0-X',rest:240}
  };
  const N=v=>Number(String(v??0).replace(',','.').replace('+',''))||0;
  const mid=a=>(a[0]+a[1])/2;
  const strip=s=>String(s||'').replace(/^[✅☑️💧🔥]\s*/,'').trim();
  function rangeFrom(s){const m=String(s||'').match(/(\d+)×(\d+)(?:[–-](\d+))?/);if(!m)return null;const lo=+m[2],hi=+(m[3]||m[2]);return{sets:+m[1],lo:Math.min(lo,hi),hi:Math.max(lo,hi)}}
  function addTargets(set,rr,meta){set.targetRpeMin=meta.rpe[0];set.targetRpeMax=meta.rpe[1];set.targetRirMin=meta.rir[0];set.targetRirMax=meta.rir[1];if(rr){set.rMin=rr.lo;set.rMax=rr.hi;set.targetRepMin=rr.lo;set.targetRepMax=rr.hi}return set}
  function parse(name,text,week){
    const meta=WEEK_META[week],t=strip(text),base={id:`seed-${week}-${name.toLowerCase().replace(/[^a-zа-я0-9]+/gi,'-')}`,n:name,sourceId:null,bp:'',tg:'',eq:'',rpe:mid(meta.rpe),rpeMin:meta.rpe[0],rpeMax:meta.rpe[1],rirMin:meta.rir[0],rirMax:meta.rir[1],tempo:meta.tempo,rest:meta.rest,note:'',prescription:t,method:'STANDARD',sets:[]};
    if(!t)return base;
    if(/^UNVRSL\b/i.test(t)){
      const m=t.match(/\((\+?\d+(?:[.,]\d+)?)×3\s*→\s*(\+?\d+(?:[.,]\d+)?)×9\)\s*×3.*?2×6\s*(?:[–-]\s*)?(\+?\d+(?:[.,]\d+)?)/i),h=m?N(m[1]):0,l=m?N(m[2]):0,med=m?N(m[3]):0;
      base.method='UNVRSL';base.sets=Array.from({length:3},(_,i)=>({label:`Круг ${i+1}/3`,role:'round',rest:meta.rest,heavy:addTargets({w:h,r:3,rest:30},{lo:3,hi:3},meta),light:addTargets({w:l,r:9,rest:meta.rest},{lo:9,hi:9},meta),finishWeight:med,finishReps:6}));base.weightMode=(h||l||med)?'manual':'auto';return base
    }
    if(/^SLDR\b/i.test(t)){
      const rm=t.match(/3×\((\d+)\/(\d+)\/(\d+)\)/),wm=t.match(/[–-]\s*(\d+(?:[.,]\d+)?)\s*$/),reps=rm?[+rm[1],+rm[2],+rm[3]]:[12,10,8],w=wm?N(wm[1]):0;
      base.method='SLDR';base.sets=Array.from({length:3},(_,round)=>({label:`Круг ${round+1}/3`,role:'sldr-round',w,r:reps[0],rest:meta.rest,mini:reps.map((r,i)=>addTargets({label:`${round+1}.${i+1}`,w,r,rest:i<2?15:meta.rest},{lo:r,hi:r},meta))}));base.weightMode=w?'manual':'auto';return base
    }
    if(/^DS\b/i.test(t)){
      base.method='DS';const seq=[...t.matchAll(/(\d+(?:[.,]\d+)?)×(\d+)/g)];base.sets=seq.map((m,i)=>addTargets({label:`DS${i+1}`,w:N(m[1]),r:+m[2],rest:i<seq.length-1?0:meta.rest},{lo:+m[2],hi:+m[2]},meta));base.weightMode=base.sets.some(s=>s.w>0)?'manual':'auto';return base
    }
    if(/^FST-7\b/i.test(t)){
      base.method='FST-7';const rr=t.match(/7×(\d+)(?:[–-](\d+))?/),wm=t.match(/[–-]\s*(\d+(?:[.,]\d+)?)(?:[–-]\d+(?:[.,]\d+)?)?\s*$/),lo=rr?+rr[1]:12,hi=rr?+(rr[2]||rr[1]):15,w=wm?N(wm[1]):0;base.rest=30;base.sets=Array.from({length:7},(_,i)=>addTargets({label:`${i+1}/7`,w,r:hi,rest:i<6?30:meta.rest},{lo,hi},meta));base.weightMode=w?'manual':'auto';return base
    }
    if(/\bмин\b/i.test(t)&&!/×\d/.test(t)){const m=t.match(/(\d+)(?:[–-](\d+))?\s*мин/i),lo=m?+m[1]:0,hi=m?+(m[2]||m[1]):lo;base.mode='cardio';base.minutesMin=lo;base.minutesMax=hi;base.sets=[addTargets({label:'Время',w:0,r:1,rest:0},null,meta)];base.weightMode='manual';return base}
    if(/^тест\b/i.test(t)){const weights=[...t.matchAll(/(?:^|→\s*)(\d{2,3}(?:[.,]\d+)?)(?:\+)?/g)].map(m=>N(m[1]));base.sets=(weights.length?weights:[0,0,0]).map((w,i)=>addTargets({label:`Попытка ${i+1}`,w,r:1,rest:240},{lo:1,hi:3},meta));if(/2×5/.test(t))base.sets.push(addTargets({label:'Back-off 1',w:0,r:5,rest:120},{lo:5,hi:5},meta),addTargets({label:'Back-off 2',w:0,r:5,rest:120},{lo:5,hi:5},meta));base.weightMode=base.sets.some(s=>s.w>0)?'manual':'auto';return base}
    const rr=rangeFrom(t);let count=rr?.sets||(t.match(/(\d+)×(?:макс|субмакс)/i)?.[1]?+t.match(/(\d+)×(?:макс|субмакс)/i)[1]:3),lo=rr?.lo||(/макс|субмакс/i.test(t)?1:10),hi=rr?.hi||(/макс|субмакс/i.test(t)?12:10);
    let w=0;const dash=t.match(/\s[–-]\s*(\d+(?:[.,]\d+)?)/),plus=t.match(/\+(\d+(?:[.,]\d+)?)/);if(dash)w=N(dash[1]);else if(plus)w=N(plus[1]);
    base.repMin=lo;base.repMax=hi;base.repRange=lo===hi?String(lo):`${lo}–${hi}`;base.sets=Array.from({length:Math.max(1,count)},(_,i)=>addTargets({label:String(i+1),w,r:hi,rest:meta.rest},{lo,hi},meta));base.weightMode=(w>0||/собственн/i.test(t))?'manual':'auto';return base
  }

  const ROWS={
    A1:[
      ['Аэробайк','6–8 мин','6–8 мин','8 мин','8–10 мин','6 мин','8–10 мин','5–6 мин','5 мин'],
      ['Присед HB','4×8–10 – 150','4×6–8 – 160','UNVRSL (175×3 → 150×9) ×3, затем 2×6 – 160','SLDR 3×(12/10/8) – 125','UNVRSL (180×3 → 152.5×9) ×3, затем 2×6 – 165','SLDR 3×(12/10/8) – 125','5×3–5 – 180–185','тест 190 → 195 → 200+, затем 2×5 ~70%'],
      ['Жим ногами','4×10–12 – 300','4×8–10 – 320','3×6–8 – 330','3×15–20 – 255','4×5–7 – 340','2×15 – 250–260','4×4–6 – 350–355','2×10–12 – 300'],
      ['Разгибание ног','3×12–15 – 75','3×10–12 – 80','DS 85×12 → 68×10 → 55×10 → 44×8 → 35×8','3×15–20 – 60–65','DS 90×10 → 72×10 → 58×8 → 46×8 → 37×8','2×15 – 60–65','3×8–10 – 90–95','2×12–15 – 70–75'],
      ['Сведения ног','3×12–15 – 65','3×10–12 – 70','3×8–10 – 75','FST-7 7×12–15 – 60–65','3×8–10 – 80','2×15–20 – 65','3×8–10 – 85','2×12–15 – 65'],
      ['Икры','4×12–15 – 95','4×10–12 – 105','4×8–10 – 115','3×15–20 – 95','4×8–10 – 115','FST-7 7×12–15 – 90','4×8–10 – 125','2×12–15 – 95']
    ],
    B:[
      ['Жим лёжа','4×8–10 – 110','4×6–8 – 120','UNVRSL (130×3 → 115×9) ×3, затем 2×6 – 120','SLDR 3×(12/10/8) – 100','UNVRSL (135×3 → 115×9) ×3, затем 2×6 – 125','SLDR 3×(12/10/8) – 100','5×3–5 – 135–140','тест 1–3ПМ, затем 2×5 ~70%'],
      ['Наклонный жим гантелей','4×10–12 – 40','4×8–10 – 44','3×6–8 – 47.5','3×15–20 – 34','4×5–7 – 50','2×15 – 34','4×4–6 – 52.5','2×10–12 – 40'],
      ['Разводка / бабочка','3×12–15 – 17','3×10–12 – 19','3×8–10 – 21','3×15–20 – 15','3×8–10 – 22.5','2×15 – 15','3×8–10 – 24','2×12–15 – 17'],
      ['Жим гантелей сидя','4×10–12 – 30','4×8–10 – 32','3×6–8 – 34','3×15–20 – 22','4×5–7 – 36','2×15 – 22','4×4–6 – 36–38','2×10–12 – 30'],
      ['Махи в стороны','3×12–15 – 13','3×10–12 – 15','3×8–10 – 17','FST-7 7×12–15 – 10–12','3×8–10 – 17','2×15 – 13','3×8–10 – 19','2×12–15 – 13'],
      ['Кроссовер','3×12–15 – 37.5','3×10–12 – 40','DS 42.5×12 → 34×10 → 27×10 → 22×8 → 18×8','3×15–20 – 37.5','3×8–10 – 45','FST-7 7×10–15 – 32.5–35','3×8–10 – 47.5','2×12–15 – 37.5'],
      ['EZ / Скотт','3×12–15 – 42.5','3×10–12 – 47.5','3×8–10 – 52.5','3×15–20 – 37.5','3×8–10 – 57.5','2×15 – 37.5','3×8–10 – 60–62.5','2×12–15 – 42.5'],
      ['Молотковые с канатом','3×12–15 – 37.5','3×10–12 – 42.5','3×8–10 – 47.5','3×15–20 – 37.5','DS 52.5×10 → 42×10 → 34×8 → 27×8 → 22×8','2×15 – 37.5','3×8–10 – 55–57.5','2×12–15 – 37.5'],
      ['Отжимания с весом','3×10–12 +14','3×8–10 +19','3×6–8 +24','2×15–20 +10','3×5–7 +29','2×субмакс +10','3×4–6 +33','2×10–12 собственный вес / +10']
    ],
    C:[
      ['Тяга штанги в наклоне','4×8–10 – 90','4×6–8 – 100','3×5–7 – 102.5–105','3×12–15 – 82.5','4×4–6 – 110','2×12 – 80','4×3–5 – 112.5','тест 3–5ПМ, затем 2×8–10 – 90–95'],
      ['Подтягивания с весом','4×8–10 +15','4×6–8 +20','UNVRSL (+25×3 → +17.5×9) ×3, затем 2×6 +15','SLDR 3×(12/10/8), собственный вес','UNVRSL (+27.5×3 → +20×9) ×3, затем 2×6 +20','2×субмакс, собственный вес','4×3–5 +30','тест максимума'],
      ['Тяга Т-грифа','3×10–12 – 85','3×8–10 – 95','3×6–8 – 105','3×15–20 – 80','4×5–7 – 110','2×15 – 80','4×4–6 – 115','2×10–12 – 90'],
      ['Верхний блок','3×10–12 – 75','3×8–10 – 80','DS 82.5×12 → 66×10 → 52.5×10 → 42×8 → 34×8','3×15–20 – 70','DS 87.5×10 → 70×10 → 56×8 → 45×8 → 36×8','SLDR 3×(15/12/10) – 70','3×4–6 – 90','2×10–12 – 75'],
      ['Нижний блок','3×10–12 – 70','3×8–10 – 75','3×6–8 – 80','3×15–20 – 65','3×5–7 – 85','2×15 – 65','3×4–6 – 90','2×10–12 – 70'],
      ['Жим плеч в тренажёре','3×10–12 – 75','3×8–10 – 80','3×6–8 – 85','3×15–20 – 70','3×5–7 – 90','2×12 – 70','3×4–6 – 95','2×10–12 – 75'],
      ['Задняя дельта','3×12–15 – 15','3×10–12 – 17','3×8–10 – 19','FST-7 7×12–15 – 13–15','3×8–10 – 21','FST-7 7×12–15 – 15','3×8–10 – 23','2×12–15 – 15'],
      ['Французский жим EZ','3×12–15 – 47.5','3×10–12 – 52.5','3×8–10 – 57.5','3×15–20 – 42.5','3×8–10 – 62.5','2×15 – 42.5','3×8–10 – 65–67.5','2×12–15 – 47.5'],
      ['Канат на трицепс','3×12–15 – 42.5','3×10–12 – 47.5','3×8–10 – 52.5','3×15–20 – 42.5','3×8–10 – 57.5','2×15 – 42.5','3×8–10 – 60–62.5','2×12–15 – 42.5'],
      ['Гиперэкстензия','3×12–15 +15','3×10–12 +20','3×8–10 +25','3×15–20 +15','3×8–10 +30','2×15 +15','3×8–10 +35','2×12–15 +15']
    ],
    A2:[
      ['Аэробайк','6 мин','6 мин','7 мин','8 мин','5 мин','8 мин','5 мин','5 мин'],
      ['Румынская тяга','4×8–10 – 120','4×6–8 – 125','3×5–7 – 130','3×12–15 – 100','4×4–6 – 135','2×12 – 100','4×3–5 – 140','2×8–10 – 105–110'],
      ['Ягодичный мост','4×8–10 – 115','4×6–8 – 125','UNVRSL (140×3 → 120×9) ×3, затем 2×6 – 130','3×12–15 – 105','UNVRSL (145×3 → 122.5×9) ×3, затем 2×6 – 132.5','2×15 – 105','4×3–5 – 145–150','1–2×3–5 тяжело, затем 2×10'],
      ['Сгибание ног лёжа','3×12–15 – 57.5','3×10–12 – 62.5','DS 70×12 → 56×10 → 45×10 → 36×8 → 29×8','SLDR 3×(15/12/10) – 52.5','3×8–10 – 72.5','SLDR 3×(15/12/10) – 52.5','3×8–10 – 75–77.5','2×12–15 – 57.5'],
      ['Выпады назад','3×10–12/нога – 28','3×8–10 – 31','3×6–8 – 33','3×15–20 – 25','3×6–8 – 36','2×15 – 25','3×6–8 – 38','2×10–12 – 30'],
      ['Зашагивания','3×10–12/нога – 22','3×8–10 – 24','3×6–8 – 26','3×15–20 – 20','3×6–8 – 28','2×15 – 18–22','3×6–8 – 30–32','2×10–12 – 22'],
      ['Разведения ног','3×12–15 – 60','3×10–12 – 65','3×8–10 – 70','FST-7 7×15–20 – 57.5','DS 75×15 → 60×12 → 48×10 → 38×10 → 30×10','FST-7 7×12–15 – 60–65','3×8–10 – 75','2×12–15 – 60']
    ],
    D:[
      ['Подъём штанги на бицепс','4×8–10 – 47.5','4×6–8 – 52.5','UNVRSL (57.5×3 → 47.5×9) ×3, затем 2×6 – 52.5','SLDR 3×(15/12/10) – 42.5','4×4–6 – 60–62.5','SLDR 3×(15/12/10) – 42.5','4×3–5 – 65–67.5','тест 3–5ПМ, затем 2×10 легко'],
      ['Армейский жим','4×8–10 – 70','4×6–8 – 75','3×5–7 – 80','3×12–15 – 57.5','UNVRSL (85×3 → 72.5×9) ×3, затем 2×6 – 77.5','2×12 – 57.5','4×3–5 – 87.5–90','тест 1–3ПМ, затем 2×5 ~70%'],
      ['Разгибание гантели из-за головы','3×12–15 – 30','3×10–12 – 32.5','3×8–10 – 35','3×15–20 – 27.5','3×8–10 – 40','2×15 – 27.5','3×8–10 – 42.5','2×12–15 – 30'],
      ['Сгибание гантелей с супинацией','3×12–15 – 17','3×10–12 – 19','3×8–10 – 21','3×15–20 – 17','3×8–10 – 23','2×15 – 17','3×8–10 – 25','2×12–15 – 17'],
      ['Канат на трицепс','3×12–15 – 42.5','3×10–12 – 47.5','DS 52.5×12 → 42×10 → 34×10 → 27×8 → 22×8','3×15–20 – 42.5','DS 57.5×10 → 46×10 → 37×8 → 30×8 → 24×8','2×15 – 42.5','3×8–10 – 60–62.5','2×12–15 – 42.5'],
      ['Молотковые сгибания','3×12–15 – 20','3×10–12 – 22.5','3×8–10 – 25','3×15–20 – 20','3×8–10 – 27.5','2×15 – 20','3×8–10 – 30','2×12–15 – 20'],
      ['Сгибание рук в блоке','3×12–15 – 27.5–30','3×10–12 – 32.5','3×8–10 – 37.5','FST-7 7×12–15 – 25','3×8–10 – 42.5','FST-7 7×10–15 – 27.5','3×8–10 – 45–47.5','2×12–15 – 27.5'],
      ['Французский жим с гантелями','3×12–15 – 22.5','3×10–12 – 25','3×8–10 – 27.5','3×15–20 – 20','3×8–10 – 30','2×15 – 20','3×8–10 – 32.5','2×12–15 – 22.5']
    ]
  };

  const DAY_NAMES={A1:'A1 · Передняя поверхность бедра, приводящие, икры',B:'B · Грудь, плечи, бицепс',C:'C · Спина, задняя дельта, трицепс',A2:'A2 · Задняя поверхность бедра, ягодицы',D:'D · Руки, армейский жим'};
  function buildProgram(){const weeks=[];for(let w=1;w<=8;w++){const meta=WEEK_META[w];weeks.push({n:w,name:`Неделя ${w}`,intensityMin:meta.pct[0],intensityMax:meta.pct[1],useIntensity:true,rpeMin:meta.rpe[0],rpeMax:meta.rpe[1],rirMin:meta.rir[0],rirMax:meta.rir[1],days:['A1','B','C','A2','D'].map(code=>({id:`unvrsl-sldr-w${w}-${code}`,name:DAY_NAMES[code],ex:ROWS[code].map(row=>parse(row[0],row[w],w))}))})}return{id:PROGRAM_ID,seedKey:SEED,seedVersion:VERSION,name:'UNVRSL SLDR',created:Date.now(),updated:Date.now(),weeks}}

  function apply(){
    if(typeof st==='undefined'||!Array.isArray(st.programs)||typeof save!=='function'||typeof programById!=='function'||typeof beginProgramDay!=='function'||typeof prescriptionText!=='function'||typeof buildMethodSets!=='function')return false;
    if(!W.__unvrslSldrMethodV2){W.__unvrslSldrMethodV2=true;const oldBuild=buildMethodSets,oldBegin=beginProgramDay,oldPrescription=prescriptionText,oldHint=typeof methodHint==='function'?methodHint:null;
      buildMethodSets=function(method,count,w,r,rest){if(method==='SLDR'){const p=r>=15?[r,Math.max(1,r-3),Math.max(1,r-5)]:[r,Math.max(1,r-2),Math.max(1,r-4)];return Array.from({length:3},(_,round)=>({label:`Круг ${round+1}/3`,role:'sldr-round',w,r:p[0],rest,mini:p.map((rr,i)=>({label:`${round+1}.${i+1}`,w,r:rr,rest:i<2?15:rest}))}))}if(method==='UNVRSL'){const light=typeof roundLoad==='function'?roundLoad(w*.85,2.5):Math.round(w*.85/2.5)*2.5,med=typeof roundLoad==='function'?roundLoad(w*.925,2.5):Math.round(w*.925/2.5)*2.5;return Array.from({length:3},(_,i)=>({label:`Круг ${i+1}/3`,role:'round',rest,heavy:{w,r:3,rest:30},light:{w:light,r:9,rest},finishWeight:med,finishReps:6}))}return oldBuild(method,count,w,r,rest)};
      if(typeof methodHint==='function')methodHint=function(m){if(m==='UNVRSL')return'3 круга: тяжёлый ×3 → 30 сек → лёгкий ×9; затем 2×6 со средним весом';if(m==='SLDR')return'3 рабочих подхода; каждый состоит из 3 мини-подходов на одном весе, 15 сек внутри';return oldHint?oldHint(m):''};
      prescriptionText=function(e){if(e?.prescription)return strip(e.prescription);if(e?.method==='SLDR'&&e.sets?.[0]?.mini){const p=e.sets[0].mini.map(x=>x.r).join('/');return`SLDR 3×(${p}) · ${e.sets[0].w||0} кг`}if(e?.method==='UNVRSL'&&e.sets?.[0]?.heavy){const x=e.sets[0];return`UNVRSL 3×(${x.heavy.w}×3 → ${x.light.w}×9), затем 2×6 · ${x.finishWeight||0} кг`}return oldPrescription(e)};
      beginProgramDay=function(pid,wi,di){const p=programById(pid),d=p?.weeks?.[wi]?.days?.[di];if(!p||!d)return oldBegin.apply(this,arguments);const backups=[];d.ex.forEach(b=>{if(b.method==='SLDR'&&b.sets?.[0]?.mini){backups.push([b,b.sets]);b.sets=b.sets.flatMap((round,ri)=>round.mini.map((m,mi)=>({...m,label:`Круг ${ri+1}/3 · ${mi+1}/3`,role:'sldr-mini'})))}else if(b.method==='UNVRSL'&&b.sets?.[0]?.heavy){backups.push([b,b.sets]);const flat=[];b.sets.forEach((round,ri)=>{flat.push({...round.heavy,label:`Круг ${ri+1}/3 · тяжёлый`,role:'heavy'});flat.push({...round.light,label:`Круг ${ri+1}/3 · лёгкий`,role:'light'})});const f=b.sets[0];flat.push(addTargets({label:'Средний 1/2',role:'middle',w:f.finishWeight||0,r:f.finishReps||6,rest:b.rest||90},{lo:6,hi:6},WEEK_META[wi+1]),addTargets({label:'Средний 2/2',role:'middle',w:f.finishWeight||0,r:f.finishReps||6,rest:b.rest||90},{lo:6,hi:6},WEEK_META[wi+1]));b.sets=flat}});try{return oldBegin.apply(this,arguments)}finally{backups.forEach(([b,sets])=>b.sets=sets)}};
    }
    const fresh=buildProgram();let existing=st.programs.find(p=>p?.id===PROGRAM_ID||p?.seedKey===SEED||p?.name==='UNVRSL SLDR'),changed=false;
    if(!existing){st.programs.push(fresh);changed=true}else if(existing.seedKey!==SEED||Number(existing.seedVersion||0)<VERSION){const created=existing.created||fresh.created;Object.keys(existing).forEach(k=>delete existing[k]);Object.assign(existing,fresh,{created});changed=true}
    if(changed)save();return true
  }
  let tries=0;const timer=setInterval(()=>{tries++;if(apply()||tries>40)clearInterval(timer)},250);['unvrsl:app-ready','unvrsl:cloud-ready','unvrsl:cloud-modules-settled'].forEach(ev=>W.addEventListener(ev,()=>apply(),{passive:true}));
})();