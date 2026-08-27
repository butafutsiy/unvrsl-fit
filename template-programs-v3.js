'use strict';
(()=>{
  if(window.__unvrslTemplateProgramsV3)return;window.__unvrslTemplateProgramsV3=true;

  const femaleSources={
    'Glute Hypertrophy · 3 дня':'https://barbend.com/news/program-glutes-erin-stern/',
    'Glute Builder · 4 дня':'https://barbend.com/news/grow-glutes-like-dana-linn-bailey/',
    'Wellness · ягодицы + квадрицепс · 4 дня':'https://barbend.com/news/shanique-grants-3-rules-for-quad-training/',
    'Upper / Lower для девушек · 4 дня':'https://www.muscleandstrength.com/workouts/10-week-upper-lower-workout-program-for-women',
    'Домашние ягодицы · 4 дня':'https://www.muscleandstrength.com/workouts/4-day-at-home-glute-building-workout'
  };

  const inferredTempo=(n,reps=10)=>{
    const s=String(n||'').toLowerCase(),r=Number(reps)||10;
    if(/мах|развед|свед|сгиб|разгиб|икр|носок|скручив|подъём колен|подъем колен/.test(s))return'2-1-2';
    if(/станов|присед|жим|тяга|подтяг|выпад|зашаг|румын|ягодич|мост/.test(s))return r<=6?'3-1-1':'3-1-2';
    return'2-1-2';
  };

  function normalizeProgramTempo(p){
    if(!p?.weeks)return false;let changed=false;
    p.weeks.forEach(w=>(w.days||[]).forEach(d=>(d.ex||[]).forEach(e=>{
      if(!e.tempo){e.tempo=inferredTempo(e.n,e.sets?.[0]?.r);changed=true}
    })));
    return changed
  }

  function patchExisting(){
    let changed=false;
    (st?.programTemplates||[]).forEach(p=>{if(normalizeProgramTempo(p))changed=true});
    (st?.programs||[]).forEach(p=>{if((p.internetTemplate||p.femaleTemplate)&&normalizeProgramTempo(p))changed=true});
    if(changed)try{save()}catch(e){}
  }

  function patchPrescription(){
    const current=window.prescriptionText||(()=>{try{return prescriptionText}catch(e){return null}})();
    if(typeof current!=='function'||current.__tempoV3)return false;
    const wrapped=function(e){
      let text=current.apply(this,arguments),tempo=e?.tempo||inferredTempo(e?.n,e?.sets?.[0]?.r);
      if(tempo&&!/\bтемп\b/i.test(String(text)))text=`${text} · темп ${tempo}`;
      return text
    };
    wrapped.__tempoV3=true;window.prescriptionText=wrapped;try{prescriptionText=wrapped}catch(e){}
    return true
  }

  function addPopularTemplates(){
    let R;try{if(typeof POPULAR_PROGRAMS==='undefined')return false;R=POPULAR_PROGRAMS}catch(e){return false}
    if(!R.bodyweight3){
      R.bodyweight3={
        title:'Собственный вес · Full Body · 3 дня',
        meta:'6 недель · дом/парк · собственный вес + турник или надёжная опора',
        source:'https://www.nerdfitness.com/blog/beginner-body-weight-workout-burn-fat-build-muscle/',sourceName:'Nerd Fitness · Beginner Bodyweight',
        build(){
          const A=()=>ppDay('Full Body A',[ppEx('Приседания с собственным весом',3,15,{rest:75,rpe:7,tempo:'3-1-2'}),ppEx('Отжимания',3,10,{rest:75,rpe:7,tempo:'2-1-2',note:'Выбери вариант, где сохраняется чистая техника.'}),ppEx('Выпады ходьбой',3,10,{rest:75,rpe:7,tempo:'3-1-2',note:'10 повторений на каждую ногу.'}),ppEx('Подтягивания',3,6,{rest:120,rpe:7,tempo:'2-1-2',note:'Если тяжело — используй резину или гравитрон.'}),ppEx('Ягодичный мост',3,15,{rest:60,rpe:7,tempo:'2-1-2'}),ppEx('Скручивания',3,15,{rest:45,rpe:7,tempo:'2-1-2'})]);
          const B=()=>ppDay('Full Body B',[ppEx('Болгарский сплит-присед',3,10,{rest:90,rpe:7,tempo:'3-1-2',note:'На каждую ногу.'}),ppEx('Отжимания от опоры',3,12,{rest:75,rpe:7,tempo:'2-1-2'}),ppEx('Подтягивания обратным хватом',3,6,{rest:120,rpe:7,tempo:'2-1-2'}),ppEx('Ягодичный мост на одной ноге',3,12,{rest:75,rpe:7,tempo:'2-1-2',note:'На каждую ногу.'}),ppEx('Подъём на носки стоя',4,15,{rest:45,rpe:7,tempo:'2-1-2'}),ppEx('Подъём коленей в упоре',3,12,{rest:60,rpe:7,tempo:'2-1-2'})]);
          return ppProgram(this.title,ppRepeatWeeks(6,wi=>wi%2===0?[A(),B(),A()]:[B(),A(),B()]),this.source,this.sourceName,this.meta)
        }
      }
    }
    if(!R.dumbbell3){
      R.dumbbell3={
        title:'Только гантели · Full Body · 3 дня',
        meta:'8 недель · гипертрофия · дом или зал · только гантели',
        source:'https://www.muscleandstrength.com/workouts/3-day-full-body-dumbbell-workout',sourceName:'Muscle & Strength · 3 Day Dumbbell Only',
        build(){const days=()=>[
          ppDay('День 1',[ppEx('Присед с гантелями',3,10,{rest:90,rpe:8,tempo:'3-1-2'}),ppEx('Румынская тяга с гантелями',3,10,{rest:90,rpe:8,tempo:'3-1-2'}),ppEx('Тяга гантелей в наклоне',3,10,{rest:90,rpe:8,tempo:'3-1-2'}),ppEx('Жим гантелей лёжа',3,10,{rest:90,rpe:8,tempo:'3-1-2'}),ppEx('Махи гантелями в стороны',2,12,{rest:60,rpe:8,tempo:'2-1-2'}),ppEx('Сгибание рук с гантелями',2,10,{rest:60,rpe:8,tempo:'2-1-2'}),ppEx('Французский жим с гантелями лёжа',2,10,{rest:60,rpe:8,tempo:'2-1-2'})]),
          ppDay('День 2',[ppEx('Выпады с гантелями',3,10,{rest:90,rpe:8,tempo:'3-1-2',note:'На каждую ногу.'}),ppEx('Становая тяга с гантелями',3,10,{rest:105,rpe:8,tempo:'3-1-2'}),ppEx('Жим гантелей сидя',3,10,{rest:90,rpe:8,tempo:'3-1-2'}),ppEx('Разведение гантелей лёжа',2,12,{rest:60,rpe:8,tempo:'2-1-2'}),ppEx('Молотковые сгибания с гантелями',2,10,{rest:60,rpe:8,tempo:'2-1-2'}),ppEx('Разгибание гантели из-за головы',2,10,{rest:60,rpe:8,tempo:'2-1-2'}),ppEx('Подъём на носки с гантелями',3,15,{rest:45,rpe:8,tempo:'2-1-2'})]),
          ppDay('День 3',[ppEx('Зашагивания на платформу с гантелями',3,10,{rest:90,rpe:8,tempo:'3-1-2',note:'На каждую ногу.'}),ppEx('Румынская тяга с гантелями',3,10,{rest:90,rpe:8,tempo:'3-1-2'}),ppEx('Тяга гантели одной рукой',3,10,{rest:90,rpe:8,tempo:'3-1-2'}),ppEx('Жим гантелей на наклонной скамье',3,10,{rest:90,rpe:8,tempo:'3-1-2'}),ppEx('Разведение гантелей на заднюю дельту',2,12,{rest:60,rpe:8,tempo:'2-1-2'}),ppEx('Сгибание рук с гантелями',2,10,{rest:60,rpe:8,tempo:'2-1-2'}),ppEx('Жим гантелей узким нейтральным хватом',2,10,{rest:60,rpe:8,tempo:'2-1-2'})])
        ];return ppProgram(this.title,ppRepeatWeeks(8,()=>days()),this.source,this.sourceName,this.meta)}
      }
    }
    if(!R.beginnerFullbody3){
      R.beginnerFullbody3={
        title:'Новичок · Full Body · 3 дня',
        meta:'6 недель · базовая гипертрофия · один понятный комплекс 3 раза в неделю',
        source:'https://www.muscleandstrength.com/workouts/3-introduction-to-bodybuilding-workout.html',sourceName:'Muscle & Strength · Introduction to Bodybuilding',
        build(){const D=()=>ppDay('Full Body',[ppEx('Жим ногами 45°',3,12,{rest:90,rpe:7,tempo:'3-1-2'}),ppEx('Сгибание ног лёжа',3,12,{rest:75,rpe:7,tempo:'2-1-2'}),ppEx('Подъём на носки стоя',2,15,{rest:60,rpe:7,tempo:'2-1-2'}),ppEx('Жим штанги лёжа',2,10,{rest:120,rpe:7,tempo:'3-1-2'}),ppEx('Жим штанги сидя',2,10,{rest:105,rpe:7,tempo:'3-1-2'}),ppEx('Тяга верхнего блока',2,12,{rest:90,rpe:7,tempo:'3-1-2'}),ppEx('Тяга штанги в наклоне',2,10,{rest:105,rpe:7,tempo:'3-1-2'}),ppEx('Сгибание рук со штангой',2,10,{rest:60,rpe:7,tempo:'2-1-2'}),ppEx('Французский жим лёжа',2,10,{rest:60,rpe:7,tempo:'2-1-2'}),ppEx('Скручивания',2,20,{rest:45,rpe:7,tempo:'2-1-2'})]);return ppProgram(this.title,ppRepeatWeeks(6,()=>[D(),D(),D()]),this.source,this.sourceName,this.meta)}
      }
    }
    return true
  }

  function patchFemaleSourceLinks(){
    document.querySelectorAll('.female-template-section .card').forEach(card=>{
      const title=(card.querySelector('b')?.textContent||'').trim(),url=femaleSources[title];if(!url)return;
      const line=[...card.querySelectorAll('.muted.small')].find(x=>(x.textContent||'').trim().startsWith('Источник:'));
      if(!line||line.querySelector('a'))return;
      const name=(line.textContent||'').replace(/^Источник:\s*/,'').trim();line.textContent='';
      const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.className='muted small';a.textContent=`Источник: ${name} ↗`;line.appendChild(a)
    })
  }

  function watchSheet(){
    const sheet=document.getElementById('sheet');if(!sheet||sheet.__templateSourceObserver)return;
    sheet.__templateSourceObserver=true;new MutationObserver(()=>patchFemaleSourceLinks()).observe(sheet,{childList:true,subtree:true});patchFemaleSourceLinks()
  }

  function wrapCreator(name){
    const current=window[name]||(()=>{try{return globalThis[name]}catch(e){return null}})();
    if(typeof current!=='function'||current.__templateTempoV3)return false;
    const wrapped=function(){const before=new Set((st?.programs||[]).map(p=>String(p.id))),r=current.apply(this,arguments);setTimeout(()=>{let changed=false;(st?.programs||[]).filter(p=>!before.has(String(p.id))).forEach(p=>{if(normalizeProgramTempo(p))changed=true});if(changed)try{save()}catch(e){};try{if(typeof renderProgramEditor==='function'&&document.getElementById('modal')?.classList.contains('show'))renderProgramEditor()}catch(e){}},0);return r};
    wrapped.__templateTempoV3=true;window[name]=wrapped;try{globalThis[name]=wrapped}catch(e){};return true
  }

  patchExisting();watchSheet();
  let tries=0;const boot=setInterval(()=>{
    addPopularTemplates();patchPrescription();watchSheet();patchFemaleSourceLinks();
    wrapCreator('createPopularProgram');wrapCreator('createFemaleTemplateProgram');wrapCreator('createFromTemplate');
    if(++tries>80)clearInterval(boot)
  },250);
})();
