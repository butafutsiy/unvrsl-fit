'use strict';
(()=>{
  const W=window,D=document,REV=368;
  if(W.__unvrslMethodPreviewCollapseV368)return;
  W.__unvrslMethodPreviewCollapseV368=true;

  const methodOf=name=>/\bUNVRSL\b/i.test(String(name||''))?'UNVRSL':/\bSLDR\b/i.test(String(name||''))?'SLDR':'';
  const baseOf=name=>String(name||'').replace(/\s+—\s+(?:UNVRSL|SLDR)\b.*$/i,'').trim();
  const fmt=v=>{
    const n=Number(v);
    if(!Number.isFinite(n)||n===0)return'0';
    return String(n).replace('.',',')
  };
  const routine=(w,c)=>{
    try{if(typeof rmap!=='undefined'&&rmap?.get)return rmap.get(`${w}-${c}`)}catch(_){ }
    return (W.UNVRSL_ROUTINES||[]).find(x=>Number(x?.w)===Number(w)&&String(x?.c||'')===String(c||''))||null
  };
  const sourceEntries=r=>{
    try{return typeof routineEntries==='function'?routineEntries(r):(r?.e||[])}catch(_){return r?.e||[]}
  };
  const escapeRx=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

  function specialGroups(r){
    const out=[],map=new Map();
    sourceEntries(r).forEach((e,index)=>{
      const type=methodOf(e?.n);if(!type)return;
      const base=baseOf(e?.n),key=`${type}|${base}`;
      if(!map.has(key)){
        const g={type,base,entries:[],firstIndex:index};
        map.set(key,g);out.push(g)
      }
      map.get(key).entries.push(e)
    });
    return out.sort((a,b)=>a.firstIndex-b.firstIndex)
  }

  function setLines(entries){
    const lines=[];
    entries.forEach(e=>{
      const count=Math.max(1,Number(e?.s)||1),reps=Number(e?.r)||0,weight=Number(e?.w)||0;
      for(let i=0;i<count;i++)lines.push(`${fmt(weight)}×${reps||'—'}`)
    });
    return lines
  }

  function collapseOpenPreview(w,c){
    const root=D.querySelector('#sheet .routine-preview-v281'),r=routine(w,c);
    if(!root||!r)return false;
    const list=root.querySelector('.rp281-list');if(!list)return false;
    const groups=specialGroups(r);if(!groups.length)return false;

    groups.forEach(g=>{
      const items=[...list.querySelectorAll('.rp281-item')];
      let matches=items.filter(item=>{
        const text=String(item.querySelector('.rp281-name')?.textContent||'').trim();
        return methodOf(text)===g.type&&baseOf(text)===g.base
      });

      if(!matches.length){
        const rx=new RegExp(`^${escapeRx(g.base)}(?:\\s|$)`,'i');
        matches=items.filter(item=>{
          const title=String(item.querySelector('.rp281-name')?.textContent||'').trim();
          const prescription=String(item.querySelector('.rp281-prescription')?.textContent||'');
          return rx.test(title)&&(
            g.type==='UNVRSL'?(/30с|UNVRSL/i.test(prescription+title)):/15с|SLDR/i.test(prescription+title)
          )
        })
      }
      if(!matches.length)return;

      const first=matches[0],name=first.querySelector('.rp281-name'),prescription=first.querySelector('.rp281-prescription'),rule=first.querySelector('.rp281-rule');
      if(name)name.textContent=`${g.base} — ${g.type}`;
      if(prescription){
        prescription.textContent=setLines(g.entries).join('\n');
        prescription.style.whiteSpace='pre-line';
        prescription.style.lineHeight='1.45'
      }
      if(rule){
        const current=String(rule.textContent||'');
        if(g.type==='UNVRSL')rule.textContent=current.replace(/между раундами/i,'между раундами · после 2×6 обычный отдых');
        if(g.type==='SLDR')rule.textContent=current.replace(/с после$/i,'с после каждого полного круга')
      }
      matches.slice(1).forEach(item=>item.remove())
    });

    root.dataset.methodPreviewCollapseRevision=String(REV);
    return true
  }

  function install(){
    const base=W.preview;
    if(typeof base!=='function')return false;
    if(base.__methodPreviewCollapseV368)return true;
    const wrapped=function(w,c){
      const out=base.apply(this,arguments);
      const run=()=>collapseOpenPreview(w,c);
      run();queueMicrotask(run);requestAnimationFrame(run);setTimeout(run,80);
      return out
    };
    wrapped.__methodPreviewCollapseV368=true;
    wrapped.__methodPreviewCollapseBase=base;
    W.preview=wrapped;
    try{preview=wrapped}catch(_){ }
    return true
  }

  [0,80,220,600,1200,2500,5000].forEach(ms=>setTimeout(install,ms));
  W.addEventListener?.('unvrsl:app-ready',install,{passive:true});
  W.addEventListener?.('unvrsl:modules-ready',install,{passive:true});
  D.addEventListener?.('visibilitychange',()=>{if(!D.hidden)install()},{passive:true});
})();

(()=>{
  if(document.querySelector('script[data-unvrsl-active-method-collapse-v369]'))return;
  const s=document.createElement('script');
  s.src='active-method-collapse-v369.js?v=369';
  s.async=false;
  s.dataset.unvrslActiveMethodCollapseV369='1';
  (document.head||document.documentElement).appendChild(s);
})();
