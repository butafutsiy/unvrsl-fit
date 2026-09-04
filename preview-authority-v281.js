'use strict';
(()=>{
  if(window.__unvrslPreviewAuthorityV281)return;
  window.__unvrslPreviewAuthorityV281=true;

  const SPECIAL=/UNVRSL|SLDR|\bDS\b|FST-7/i;
  const R={
    1:{
      'Присед HB':[8,10],'Жим ногами':[10,12],'Разгибание ног':[12,15],'Сведение ног':[15,20],'Икры':[15,20],
      'Жим лёжа':[8,10],'Жим гантелей на наклонной':[10,12],'Разводка / бабочка':[12,15],'Жим гантелей сидя':[8,10],'Махи в стороны':[15,18],'Кроссовер':[12,15],'EZ / скамья Скотта':[10,12],'Молотковые сгибания с канатом':[12,15],'Отжимания с дополнительным весом':[8,12],
      'Тяга штанги в наклоне':[10,12],'Подтягивания с весом':[8,10],'Подтягивания':[8,10],'Тяга Т-грифа':[10,12],'Верхний блок':[12,15],'Нижний блок':[10,12],'Жим плеч в тренажёре':[10,12],'Задняя дельта':[15,20],'Французский жим EZ':[12,15],'Канат на трицепс':[12,15],'Гиперэкстензия с диском':[15,20],
      'Румынская тяга':[10,12],'Ягодичный мост':[10,12],'Сгибание ног лёжа':[12,15],'Выпады назад':[20,24],'Зашагивания':[24,30],'Разведение ног':[15,20],
      'Подъём штанги на бицепс':[8,10],'Армейский жим':[8,10],'Разгибание гантели из-за головы':[12,15],'Сгибание гантелей с супинацией':[12,15],'Молотковые сгибания':[12,15],'Сгибание рук в блоке':[15,20],'Французский жим с гантелями':[12,15]
    },
    2:{
      'Присед HB':[6,8],'Жим ногами':[8,10],'Разгибание ног':[10,12],'Сведение ног':[12,15],'Икры':[12,15],
      'Жим лёжа':[6,8],'Жим гантелей на наклонной':[8,10],'Разводка / бабочка':[10,12],'Жим гантелей сидя':[6,8],'Махи в стороны':[12,15],'Кроссовер':[10,12],'EZ / скамья Скотта':[8,10],'Молотковые сгибания с канатом':[10,12],'Отжимания с дополнительным весом':[8,10],
      'Тяга штанги в наклоне':[8,10],'Подтягивания с весом':[6,8],'Подтягивания':[6,8],'Тяга Т-грифа':[8,10],'Верхний блок':[10,12],'Нижний блок':[8,10],'Жим плеч в тренажёре':[8,10],'Задняя дельта':[12,15],'Французский жим EZ':[10,12],'Канат на трицепс':[10,12],'Гиперэкстензия с диском':[12,15],
      'Румынская тяга':[8,10],'Ягодичный мост':[8,10],'Сгибание ног лёжа':[10,12],'Выпады назад':[16,20],'Зашагивания':[20,24],'Разведение ног':[12,15],
      'Подъём штанги на бицепс':[6,8],'Армейский жим':[6,8],'Разгибание гантели из-за головы':[10,12],'Сгибание гантелей с супинацией':[10,12],'Молотковые сгибания':[10,12],'Сгибание рук в блоке':[12,15],'Французский жим с гантелями':[10,12]
    },
    3:{
      'Жим ногами':[6,8],'Сведение ног':[15,18],'Икры':[15,18],
      'Жим гантелей на наклонной':[6,8],'Разводка / бабочка':[10,12],'Жим гантелей сидя':[6,8],'Махи в стороны':[10,12],'EZ / скамья Скотта':[8,10],'Молотковые сгибания с канатом':[10,12],'Отжимания с дополнительным весом':[6,8],
      'Тяга штанги в наклоне':[6,8],'Тяга Т-грифа':[6,8],'Нижний блок':[6,8],'Жим плеч в тренажёре':[6,8],'Задняя дельта':[10,12],'Французский жим EZ':[8,10],'Канат на трицепс':[10,12],'Гиперэкстензия с диском':[15,20],
      'Румынская тяга':[6,8],'Выпады назад':[12,16],'Зашагивания':[16,20],'Разведение ног':[12,15],
      'Армейский жим':[5,7],'Разгибание гантели из-за головы':[8,10],'Сгибание гантелей с супинацией':[8,10],'Молотковые сгибания':[8,10],'Сгибание рук в блоке':[8,10],'Французский жим с гантелями':[8,10]
    },
    4:{
      'Жим ногами':[15,20],'Разгибание ног':[15,20],'Икры':[20,25],
      'Жим гантелей на наклонной':[15,20],'Разводка / бабочка':[15,20],'Жим гантелей сидя':[15,20],'Кроссовер':[15,20],'EZ / скамья Скотта':[15,20],'Молотковые сгибания с канатом':[15,20],'Отжимания с дополнительным весом':[12,15],
      'Тяга штанги в наклоне':[12,15],'Тяга Т-грифа':[15,20],'Верхний блок':[15,20],'Нижний блок':[12,15],'Жим плеч в тренажёре':[12,15],'Французский жим EZ':[15,20],'Канат на трицепс':[15,20],'Гиперэкстензия с диском':[20,25],
      'Румынская тяга':[12,15],'Ягодичный мост':[15,20],'Выпады назад':[30,40],'Зашагивания':[30,40],
      'Армейский жим':[12,15],'Разгибание гантели из-за головы':[15,20],'Сгибание гантелей с супинацией':[15,20],'Молотковые сгибания':[15,20],'Французский жим с гантелями':[15,20]
    },
    5:{
      'Жим ногами':[5,7],'Сведение ног':[10,12],'Икры':[10,12],
      'Жим гантелей на наклонной':[5,7],'Разводка / бабочка':[8,10],'Жим гантелей сидя':[6,8],'Махи в стороны':[8,10],'Кроссовер':[8,10],'EZ / скамья Скотта':[8,10],'Отжимания с дополнительным весом':[5,7],
      'Тяга штанги в наклоне':[4,6],'Тяга Т-грифа':[5,7],'Нижний блок':[5,7],'Жим плеч в тренажёре':[5,7],'Задняя дельта':[10,12],'Французский жим EZ':[6,8],'Канат на трицепс':[8,10],'Гиперэкстензия с диском':[12,15],
      'Румынская тяга':[5,7],'Сгибание ног лёжа':[8,10],'Выпады назад':[12,16],'Зашагивания':[12,16],
      'Подъём штанги на бицепс':[4,6],'Разгибание гантели из-за головы':[8,10],'Сгибание гантелей с супинацией':[6,8],'Молотковые сгибания':[8,10],'Сгибание рук в блоке':[8,10],'Французский жим с гантелями':[8,10]
    },
    6:{
      'Присед HB':[8,10],'Жим ногами':[10,12],'Разгибание ног':[12,15],'Сведение ног':[15,20],
      'Жим лёжа':[8,10],'Жим гантелей на наклонной':[10,12],'Разводка / бабочка':[12,15],'Жим гантелей сидя':[8,10],'Махи в стороны':[15,20],'EZ / скамья Скотта':[10,12],'Молотковые сгибания с канатом':[10,12],'Отжимания с дополнительным весом':[8,10],
      'Тяга штанги в наклоне':[8,10],'Подтягивания с весом':[8,12],'Подтягивания':[8,12],'Тяга Т-грифа':[10,12],'Нижний блок':[10,12],'Жим плеч в тренажёре':[10,12],'Задняя дельта':[15,20],'Французский жим EZ':[10,12],'Канат на трицепс':[10,12],'Гиперэкстензия с диском':[15,20],
      'Румынская тяга':[8,10],'Ягодичный мост':[10,12],'Выпады назад':[24,30],'Зашагивания':[20,24],
      'Подъём штанги на бицепс':[8,10],'Армейский жим':[8,10],'Разгибание гантели из-за головы':[10,12],'Сгибание гантелей с супинацией':[12,15],'Канат на трицепс':[10,12],'Молотковые сгибания':[12,15],'Французский жим с гантелями':[10,12]
    },
    7:{
      'Присед HB':[3,5],'Жим ногами':[4,6],'Разгибание ног':[8,10],'Сведение ног':[8,10],'Икры':[8,10],
      'Жим лёжа':[3,5],'Жим гантелей на наклонной':[5,7],'Разводка / бабочка':[8,10],'Жим гантелей сидя':[4,6],'Махи в стороны':[8,10],'Кроссовер':[8,10],'EZ / скамья Скотта':[6,8],'Молотковые сгибания с канатом':[8,10],'Отжимания с дополнительным весом':[4,6],
      'Тяга штанги в наклоне':[3,5],'Подтягивания с весом':[3,5],'Подтягивания':[3,5],'Тяга Т-грифа':[4,6],'Верхний блок':[8,10],'Нижний блок':[4,6],'Жим плеч в тренажёре':[4,6],'Задняя дельта':[8,10],'Французский жим EZ':[5,7],'Канат на трицепс':[6,8],'Гиперэкстензия с диском':[10,12],
      'Румынская тяга':[4,6],'Ягодичный мост':[5,7],'Сгибание ног лёжа':[6,8],'Выпады назад':[12,16],'Зашагивания':[10,14],'Разведение ног':[10,12],
      'Подъём штанги на бицепс':[3,5],'Армейский жим':[3,5],'Разгибание гантели из-за головы':[6,8],'Сгибание гантелей с супинацией':[8,10],'Канат на трицепс':[6,8],'Молотковые сгибания':[6,8],'Сгибание рук в блоке':[6,8],'Французский жим с гантелями':[6,8]
    },
    8:{
      'Присед HB#test':[1,3],'Присед HB#backoff':[5,7],'Жим ногами':[10,12],'Разгибание ног':[15,20],'Сведение ног':[15,20],'Икры':[15,20],
      'Жим лёжа#test':[1,3],'Жим лёжа#backoff':[5,7],'Жим гантелей на наклонной':[10,12],'Разводка / бабочка':[15,18],'Жим гантелей сидя':[10,12],'Махи в стороны':[15,20],'Кроссовер':[15,18],'EZ / скамья Скотта':[10,12],'Молотковые сгибания с канатом':[15,18],
      'Тяга штанги в наклоне':[3,5],'Тяга Т-грифа':[10,12],'Верхний блок':[12,15],'Нижний блок':[12,15],'Жим плеч в тренажёре':[10,12],'Задняя дельта':[15,20],'Французский жим EZ':[10,12],'Канат на трицепс':[15,18],'Гиперэкстензия с диском':[15,20],
      'Румынская тяга':[8,10],'Ягодичный мост#heavy':[3,5],'Ягодичный мост#backoff':[10,12],'Сгибание ног лёжа':[12,15],'Выпады назад':[20,24],'Зашагивания':[20,24],'Разведение ног':[15,20],
      'Подъём штанги на бицепс#test':[3,5],'Подъём штанги на бицепс#light':[10,12],'Армейский жим#test':[1,3],'Армейский жим#backoff':[5,7],'Разгибание гантели из-за головы':[10,12],'Сгибание гантелей с супинацией':[15,18],'Канат на трицепс':[15,18],'Молотковые сгибания':[15,18],'Сгибание рук в блоке':[15,20],'Французский жим с гантелями':[10,12]
    }
  };

  const baseName=n=>String(n||'').split(' — ')[0].trim();
  const variant=n=>/back-off/i.test(n)?'backoff':/тест/i.test(n)?'test':/тяжёл/i.test(n)?'heavy':/лёгк/i.test(n)?'light':'normal';
  const target=(week,e)=>{
    if(!e||e.m||SPECIAL.test(String(e.n||'')))return null;
    const b=baseName(e.n),v=variant(e.n),map=R[Number(week)]||{};
    return map[`${b}#${v}`]||map[b]||null;
  };
  const rangeLabel=(week,e)=>{
    const t=target(week,e);
    if(!t)return String(e?.r??e?.m??'—');
    let [lo,hi]=t;
    if(e?.sd){lo/=2;hi/=2}
    return lo===hi?String(lo):`${lo}–${hi}`;
  };
  const fmtWeight=v=>Number.isFinite(Number(v))?(Number(v)%1?Number(v).toFixed(1):String(Number(v))):'';
  const tempo=r=>{try{return typeof tempoOnly==='function'?tempoOnly(r?.p||''):(String(r?.p||'').split('|')[0].trim()||'—')}catch(_){return'—'}};
  const rpe=r=>{try{return typeof RPE!=='undefined'?RPE[r.w]:(r.rpe||8)}catch(_){return r.rpe||8}};
  const routine=(w,c)=>{try{if(typeof rmap!=='undefined'&&rmap?.get)return rmap.get(`${w}-${c}`)}catch(_){ }return (window.UNVRSL_ROUTINES||[]).find(x=>Number(x?.w)===Number(w)&&String(x?.c)===String(c))||null};
  const entries=r=>{try{return typeof routineEntries==='function'?routineEntries(r):(r?.e||[])}catch(_){return r?.e||[]}};
  const groups=list=>{try{return typeof groupIndexedEntries==='function'?groupIndexedEntries(list):list.map((e,i)=>({indices:[i],entries:[e],base:baseName(e.n)}))}catch(_){return list.map((e,i)=>({indices:[i],entries:[e],base:baseName(e.n)}))}};
  const method=g=>{try{return typeof methodType==='function'?methodType(g.entries):''}catch(_){return''}};
  const name=g=>{try{return typeof displayExerciseName==='function'?displayExerciseName(g.base):g.base}catch(_){return g.base}};
  const escHtml=x=>{try{return typeof esc==='function'?esc(String(x??'')):String(x??'')}catch(_){return String(x??'')}};
  const restSeconds=(r,g)=>{
    try{
      const list=entries(r),idx=g.indices?.at?.(-1)??0;
      return typeof rest==='function'?Number(rest(r,list[idx],idx,list)||0):0;
    }catch(_){return 0}
  };
  const prescription=(r,g)=>{
    const type=method(g),a=g.entries||[];
    if(type==='UNVRSL'&&a.length>=2){
      const heavy=`${fmtWeight(a[0].w)||'—'}×${a[0].r||'—'}`,light=`${fmtWeight(a[1].w)||'—'}×${a[1].r||'—'}`;
      const finish=a[2]?`, затем ${a[2].s||1}×${a[2].r||'—'} · ${fmtWeight(a[2].w)||'—'} кг`:'';
      return`3×(${heavy} + 30с + ${light})${finish}`;
    }
    if(type==='DS'||type==='SLDR'||type==='FST-7')return a.map(e=>`${fmtWeight(e.w)} кг × ${e.r||'—'}`).join(' → ');
    const e=a[0];if(!e)return'—';
    if(e.m)return`${e.m} мин`;
    return`${e.s||1}×${rangeLabel(r.w,e)}${e.w?` · ${fmtWeight(e.w)} кг`:''}`;
  };
  const rule=(r,g)=>{
    const type=method(g),sec=restSeconds(r,g),t=tempo(r),rp=rpe(r);
    if(type==='UNVRSL')return`RPE ${rp} · темп ${t} · 30с внутри · ${sec||120}с между раундами`;
    if(type==='SLDR')return`RPE ${rp} · темп ${t} · 15с внутри · ${sec||60}с после`;
    if(type==='DS')return`RPE ${rp} · темп ${t} · без отдыха в сбросах · ${sec||60}с после`;
    if(type==='FST-7')return`RPE ${rp} · темп ${t} · 20–40с отдых`;
    return`RPE ${rp} · темп ${t}${sec?` · ${sec}с отдых`:''}`;
  };

  if(!document.getElementById('unvrsl-preview-authority-v281-style')){
    const style=document.createElement('style');
    style.id='unvrsl-preview-authority-v281-style';
    style.textContent=`
      #sheet:has(.routine-preview-v281){max-height:92dvh!important;padding:14px 16px calc(18px + env(safe-area-inset-bottom))!important;border-radius:28px 28px 0 0!important;overflow-x:hidden!important}
      .routine-preview-v281{width:100%;min-width:0}
      .routine-preview-v281 .sheet-grabber{margin:0 auto 15px!important}
      .rp281-head{display:grid;grid-template-columns:minmax(0,1fr) 44px;gap:12px;align-items:start;margin-bottom:12px}
      .rp281-title{font-size:28px;line-height:1.08;font-weight:850;letter-spacing:-.8px;overflow-wrap:anywhere}
      .rp281-meta{margin-top:8px;font-size:15px;line-height:1.25;color:#8e8e93}
      .rp281-close{width:44px!important;height:44px!important;min-height:44px!important;padding:0!important;border-radius:15px!important;font-size:20px!important;display:grid!important;place-items:center!important}
      .rp281-list{display:grid;gap:8px;margin-top:5px}
      .rp281-item{min-width:0;background:#1d1d20;border:1px solid #2b2b2f;border-radius:18px;padding:13px 14px}
      .rp281-name{font-size:18px;line-height:1.18;font-weight:800;letter-spacing:-.25px;overflow-wrap:anywhere}
      .rp281-prescription{font-size:15px;color:#a0a0a6;margin-top:5px;line-height:1.3;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
      .rp281-rule{font-size:14px;color:#85858b;margin-top:4px;line-height:1.3;overflow-wrap:anywhere}
      .rp281-note{font-size:12px;color:#73737a;margin-top:6px;line-height:1.3}
      .rp281-start{width:100%!important;min-height:54px!important;margin-top:12px!important;border-radius:17px!important;font-size:18px!important;padding:13px 16px!important}
      @media(max-width:430px){#sheet:has(.routine-preview-v281){padding-left:14px!important;padding-right:14px!important}.rp281-title{font-size:25px;line-height:1.1;letter-spacing:-.65px}.rp281-meta{font-size:14px;margin-top:7px}.rp281-item{padding:12px 13px;border-radius:17px}.rp281-name{font-size:17px}.rp281-prescription{font-size:14px}.rp281-rule{font-size:13px}.rp281-start{min-height:52px!important;font-size:17px!important}}
    `;
    document.head.appendChild(style);
  }

  const previewV281=function(w,c){
    const r=routine(w,c);if(!r){try{return toast('Тренировка не найдена')}catch(_){return}}
    const rows=groups(entries(r)).map(g=>{
      const first=g.entries?.[0]||{},note=String(first.d||'').trim();
      return `<div class="rp281-item"><div class="rp281-name">${escHtml(name(g))}</div><div class="rp281-prescription">${escHtml(prescription(r,g))}</div><div class="rp281-rule">${escHtml(rule(r,g))}</div>${note&&!SPECIAL.test(String(first.n||''))?`<div class="rp281-note">${escHtml(note)}</div>`:''}</div>`;
    }).join('');
    const html=`<div class="routine-preview-v281"><div class="sheet-grabber"></div><div class="rp281-head"><div><div class="rp281-title">${escHtml(r.c)} · ${escHtml(r.t)}</div><div class="rp281-meta">W${r.w} · RPE ${rpe(r)} · темп ${escHtml(tempo(r))}</div></div><button class="btn rp281-close" onclick="closeModal()" aria-label="Закрыть">×</button></div><div class="rp281-list">${rows}</div><button class="btn primary rp281-start" onclick="begin(${r.w},'${String(r.c).replace(/'/g,"\\'")}')">Начать</button></div>`;
    try{return modal(html)}catch(_){return undefined}
  };
  previewV281.__unvrslPreviewAuthorityV281=true;
  window.preview=previewV281;
  try{preview=previewV281}catch(_){ }
})();
