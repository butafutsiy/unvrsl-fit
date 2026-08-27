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
