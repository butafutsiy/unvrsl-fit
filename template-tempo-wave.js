'use strict';
(()=>{
  if(window.__unvrslTemplateTempoWave)return;window.__unvrslTemplateTempoWave=true;

  const isCardio=e=>{
    const n=String(e?.n||'').toLowerCase();
    return e?.kind==='cardio'||e?.mode==='timer'||e?.workMode==='timer'||/аэробайк|велотренаж|дорожк|гребн|лыжн|эллипс|степпер|лестниц|кардио/.test(n)
  };

  function weekTempo(index,total,week){
    const i=index+1,n=Math.max(1,Number(total)||1),focus=String(week?.focus||'').toLowerCase();
    if(/тест|пик|1пм|3пм|5пм/.test(focus))return'2-0-X';
    if(n===8)return['3-1-2','3-1-2','2-0-2','2-0-2','2-0-2','3-1-2','2-0-1','3-1-2'][index]||'3-1-2';
    if(n===6)return['3-1-2','3-1-2','2-0-2','2-0-2','2-0-1','3-1-2'][index]||'3-1-2';
    if(n===10)return['3-1-2','3-1-2','2-0-2','2-0-2','2-0-2','3-1-2','2-0-1','2-0-1','2-0-2','3-1-2'][index]||'3-1-2';
    if(i===n)return /разгруз|техник/.test(focus)?'3-1-2':'2-0-1';
    const p=i/n;
    if(p<=.25)return'3-1-2';
    if(p<=.62)return'2-0-2';
    if(p<=.75)return'3-1-2';
    return'2-0-1'
  }

  function isTemplateProgram(p){return !!(p&&(p.internetTemplate||p.femaleTemplate||p.templateKey))}

  function applyTempoWave(p){
    if(!isTemplateProgram(p)||!Array.isArray(p.weeks))return false;
    let changed=false,total=p.weeks.length;
    p.weeks.forEach((w,wi)=>{
      const tempo=weekTempo(wi,total,w);
      if(w.tempo!==tempo){w.tempo=tempo;changed=true}
      (w.days||[]).forEach(d=>{
        if(d.tempo!==tempo){d.tempo=tempo;changed=true}
        (d.ex||[]).forEach(e=>{
          if(isCardio(e))return;
          if(e.tempo!==tempo){e.tempo=tempo;changed=true}
        })
      })
    });
    return changed
  }

  function migrate(){
    let changed=false;
    (st?.programTemplates||[]).forEach(p=>{if(applyTempoWave(p))changed=true});
    (st?.programs||[]).forEach(p=>{if(applyTempoWave(p))changed=true});
    if(changed)try{save()}catch(e){}
    return changed
  }

  function annotateEditor(){
    try{
      const pid=programUi?.pid,p=typeof programById==='function'?programById(pid):null,w=p?.weeks?.[programUi?.week||0];if(!p||!w)return;
      const sh=document.getElementById('sheet');if(!sh)return;
      sh.querySelectorAll('.unvrsl-week-tempo').forEach(x=>x.remove());
      const sec=[...sh.querySelectorAll('.section')].find(x=>/^НЕДЕЛЯ\s+/i.test((x.textContent||'').trim()));if(!sec)return;
      const el=document.createElement('div');el.className='unvrsl-week-tempo muted small';el.style.cssText='margin:-3px 8px 10px;font-weight:650';el.textContent=`Темп недели: ${w.tempo||weekTempo(programUi.week,p.weeks.length,w)}`;sec.insertAdjacentElement('afterend',el)
    }catch(e){}
  }

  function wrap(name,after){
    const current=window[name]||(()=>{try{return globalThis[name]}catch(e){return null}})();
    if(typeof current!=='function'||current.__tempoWave)return false;
    const wrapped=function(){const r=current.apply(this,arguments);setTimeout(()=>{migrate();if(after)after.apply(this,arguments)},0);return r};
    wrapped.__tempoWave=true;window[name]=wrapped;try{globalThis[name]=wrapped}catch(e){};return true
  }

  function patchBeginProgramDay(){
    const current=window.beginProgramDay||(()=>{try{return beginProgramDay}catch(e){return null}})();
    if(typeof current!=='function'||current.__tempoWave)return false;
    const wrapped=function(pid,wi,di){
      const p=typeof programById==='function'?programById(pid):null;if(p)applyTempoWave(p);
      const r=current.apply(this,arguments);
      setTimeout(()=>{
        const cur=st?.current,prog=typeof programById==='function'?programById(pid):null,w=prog?.weeks?.[Number(wi)||0];
        if(!cur||!prog||String(cur.programId)!==String(pid)||!w)return;
        const tempo=w.tempo||weekTempo(Number(wi)||0,prog.weeks.length,w);cur.tempo=tempo;
        (cur.ex||[]).forEach(e=>{if(!isCardio(e))e.tempo=tempo});
        try{save()}catch(e){};try{startPage()}catch(e){}
      },0);
      return r
    };
    wrapped.__tempoWave=true;window.beginProgramDay=wrapped;try{beginProgramDay=wrapped}catch(e){};return true
  }

  migrate();
  let tries=0;const boot=setInterval(()=>{
    migrate();
    wrap('createPopularProgram');wrap('createFemaleTemplateProgram');wrap('createFromTemplate');
    wrap('renderProgramEditor',annotateEditor);patchBeginProgramDay();annotateEditor();
    if(++tries>80)clearInterval(boot)
  },250);
})();

;(()=>{
  if(window.__unvrslEightSetWaves)return;window.__unvrslEightSetWaves=true;

  const clone=x=>JSON.parse(JSON.stringify(x));
  const isUnvrslName=n=>/UNVRSL/i.test(String(n||''));
  const baseName=n=>String(n||'').replace(/\s+—\s+UNVRSL.*$/i,'').trim();
  const positiveMin=(...vals)=>{
    const a=vals.map(Number).filter(v=>Number.isFinite(v)&&v>0);
    return a.length?Math.min(...a):0
  };

  function sourcePattern(items,getSet){
    if(!Array.isArray(items)||items.length<2)return null;
    const heavy=items[0],light=items[1],finish=items[2]||light;
    const hs=getSet(heavy),ls=getSet(light),fs=getSet(finish);
    if(!hs||!ls)return null;
    const finishWeight=positiveMin(ls.w,fs?.w)||Number(ls.w||fs?.w||0);
    return{heavy,light,finish,hs,ls,fs:fs||ls,finishWeight}
  }

  function makeSessionEntry(src,setData,name,index,note){
    const e=clone(src);
    e.n=`${baseName(name)} — UNVRSL ${index}/8`;
    e.s=1;
    e.d=note;
    e.set=[{
      n:1,
      w:Number(setData?.w||0),
      r:Number(setData?.r||0),
      rpe:setData?.rpe||'',
      ok:!!setData?.ok
    }];
    return e
  }

  function expandSessionObject(s){
    if(!s||!Array.isArray(s.ex))return false;
    const out=[];let changed=false;
    for(let i=0;i<s.ex.length;){
      const e=s.ex[i];
      if(!e?.g||!isUnvrslName(e.n)){out.push(e);i++;continue}
      const group=[];let j=i;
      while(j<s.ex.length&&s.ex[j]?.g===e.g&&isUnvrslName(s.ex[j]?.n)){group.push(s.ex[j]);j++}
      const already=group.some(x=>/\/8\b/.test(String(x.n||'')));
      const hasDone=group.some(x=>(x.set||[]).some(y=>y.ok));
      const pat=sourcePattern(group,x=>x?.set?.[0]);
      if(already||hasDone||!pat){out.push(...group);i=j;continue}
      const heavySet=pat.hs,lightSet=pat.ls;
      const finishSet={...pat.fs,w:pat.finishWeight};
      const seq=[
        [pat.heavy,heavySet,'UNVRSL · волна 1/3 · тяжёлый подход.'],
        [pat.light,lightSet,'UNVRSL · волна 1/3 · облегчённый подход.'],
        [pat.heavy,heavySet,'UNVRSL · волна 2/3 · тяжёлый подход.'],
        [pat.light,lightSet,'UNVRSL · волна 2/3 · облегчённый подход.'],
        [pat.heavy,heavySet,'UNVRSL · волна 3/3 · тяжёлый подход.'],
        [pat.light,lightSet,'UNVRSL · волна 3/3 · облегчённый подход.'],
        [pat.finish,finishSet,'UNVRSL · добивочный облегчённый подход 1/2.'],
        [pat.finish,finishSet,'UNVRSL · добивочный облегчённый подход 2/2.']
      ];
      seq.forEach((x,k)=>out.push(makeSessionEntry(x[0],x[1],e.n,k+1,x[2])));
      changed=true;i=j
    }
    if(changed)s.ex=out;
    return changed
  }

  function expandProgramExercise(e){
    if(!e||e.method!=='UNVRSL'||!Array.isArray(e.sets)||e.sets.length<2||e.sets.length>=8)return false;
    const old=e.sets.map(clone),heavy=old[0],light=old[1],finish=old[2]||light;
    const finishWeight=positiveMin(light.w,finish.w)||Number(light.w||finish.w||0);
    const fin={...clone(finish),w:finishWeight};
    const seq=[heavy,light,heavy,light,heavy,light,fin,fin];
    e.sets=seq.map((x,i)=>({...clone(x),label:`${i+1}/8`}));
    e.waveScheme='3x2+2';
    e.note=[e.note,'UNVRSL: 3 волны тяжёлый → облегчённый, затем 2 облегчённых добивочных подхода.'].filter(Boolean).join(' · ');
    return true
  }

  function migratePrograms(){
    let changed=false;
    (st?.programs||[]).forEach(p=>(p.weeks||[]).forEach(w=>(w.days||[]).forEach(d=>(d.ex||[]).forEach(e=>{
      if(expandProgramExercise(e))changed=true
    }))));
    (st?.programTemplates||[]).forEach(p=>(p.weeks||[]).forEach(w=>(w.days||[]).forEach(d=>(d.ex||[]).forEach(e=>{
      if(expandProgramExercise(e))changed=true
    }))));
    if(changed)try{save()}catch(e){}
    return changed
  }

  function patchSession(){
    const current=window.session||(()=>{try{return session}catch(e){return null}})();
    if(typeof current!=='function'||current.__unvrslEightSet)return false;
    const wrapped=function(){const s=current.apply(this,arguments);expandSessionObject(s);return s};
    wrapped.__unvrslEightSet=true;window.session=wrapped;try{session=wrapped}catch(e){};return true
  }

  function patchBuiltInCopy(){
    const current=window.builtInGroupToProgramExercise||(()=>{try{return builtInGroupToProgramExercise}catch(e){return null}})();
    if(typeof current!=='function'||current.__unvrslEightSet)return false;
    const wrapped=function(){const e=current.apply(this,arguments);if(e?.method==='UNVRSL')expandProgramExercise(e);return e};
    wrapped.__unvrslEightSet=true;window.builtInGroupToProgramExercise=wrapped;try{builtInGroupToProgramExercise=wrapped}catch(e){};return true
  }

  function migrateCurrent(){
    const cur=st?.current;if(!cur)return false;
    const changed=expandSessionObject(cur);
    if(changed){try{save()}catch(e){};try{startPage()}catch(e){}}
    return changed
  }

  migratePrograms();migrateCurrent();patchSession();patchBuiltInCopy();
  let tries=0;const boot=setInterval(()=>{
    patchSession();patchBuiltInCopy();migratePrograms();migrateCurrent();
    if(++tries>40)clearInterval(boot)
  },250);
})();
