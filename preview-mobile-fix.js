'use strict';
(()=>{
  if(window.__unvrslPreviewMobileFix)return;window.__unvrslPreviewMobileFix=true;

  const style=document.createElement('style');
  style.id='unvrsl-preview-mobile-fix';
  style.textContent=`
    #sheet:has(.routine-preview-root){
      max-height:92dvh!important;
      padding:14px 16px calc(18px + env(safe-area-inset-bottom))!important;
      border-radius:28px 28px 0 0!important;
      overflow-x:hidden!important;
    }
    .routine-preview-root{width:100%;min-width:0}
    .routine-preview-root .sheet-grabber{margin:0 auto 15px!important}
    .routine-preview-head{display:grid;grid-template-columns:minmax(0,1fr) 44px;gap:12px;align-items:start;margin-bottom:12px}
    .routine-preview-title{font-size:28px;line-height:1.08;font-weight:850;letter-spacing:-.8px;overflow-wrap:anywhere}
    .routine-preview-meta{margin-top:8px;font-size:15px;line-height:1.25;color:#8e8e93}
    .routine-preview-close{width:44px!important;height:44px!important;min-height:44px!important;padding:0!important;border-radius:15px!important;font-size:20px!important;display:grid!important;place-items:center!important}
    .routine-preview-list{display:grid;gap:8px;margin-top:5px}
    .routine-preview-item{min-width:0;background:#1d1d20;border:1px solid #2b2b2f;border-radius:18px;padding:13px 14px}
    .routine-preview-name{font-size:18px;line-height:1.18;font-weight:800;letter-spacing:-.25px;overflow-wrap:anywhere}
    .routine-preview-prescription{font-size:15px;color:#a0a0a6;margin-top:5px;line-height:1.25;font-variant-numeric:tabular-nums}
    .routine-preview-rule{font-size:14px;color:#85858b;margin-top:4px;line-height:1.3;overflow-wrap:anywhere}
    .routine-preview-note{font-size:12px;color:#73737a;margin-top:6px;line-height:1.3}
    .routine-preview-start{width:100%!important;min-height:54px!important;margin-top:12px!important;border-radius:17px!important;font-size:18px!important;padding:13px 16px!important}
    @media(max-width:430px){
      #sheet:has(.routine-preview-root){padding-left:14px!important;padding-right:14px!important}
      .routine-preview-title{font-size:25px;line-height:1.1;letter-spacing:-.65px}
      .routine-preview-meta{font-size:14px;margin-top:7px}
      .routine-preview-item{padding:12px 13px;border-radius:17px}
      .routine-preview-name{font-size:17px}.routine-preview-prescription{font-size:14px}.routine-preview-rule{font-size:13px}
      .routine-preview-start{min-height:52px!important;font-size:17px!important}
    }
    @media(max-width:360px){
      .routine-preview-title{font-size:23px}.routine-preview-head{grid-template-columns:minmax(0,1fr) 40px;gap:9px}.routine-preview-close{width:40px!important;height:40px!important;min-height:40px!important}
    }
  `;
  document.head.appendChild(style);

  const cleanName=n=>{
    try{return typeof displayExerciseName==='function'?displayExerciseName(typeof baseExerciseName==='function'?baseExerciseName(n):n):String(n||'').replace(/\s+—\s+W\d+.*$/i,'').trim()}catch(e){return String(n||'').trim()}
  };
  const tempoFor=r=>{
    try{if(typeof tempoOnly==='function')return tempoOnly(r?.p||'')||'—'}catch(e){}
    const s=String(r?.p||'');return (s.match(/\b\d+-\d+-\d+\b/)||[])[0]||'—'
  };
  const restFor=(r,e,i)=>{try{return typeof rest==='function'?Number(rest(r,e,i)||0):0}catch(_e){return 0}};
  const prescription=e=>{
    if(Number(e?.m)>0)return `${e.s&&Number(e.s)>1?`${e.s}×`:''}${Number(e.m)} мин`;
    const sets=Math.max(1,Number(e?.s)||1),reps=Number(e?.r)||0,weight=Number(e?.w)||0;
    return `${sets}×${reps||'—'}${weight>0?` · ${Number.isInteger(weight)?weight:weight.toFixed(1)} кг`:''}`
  };

  function previewV81(w,c){
    const routine=(typeof rmap!=='undefined'&&rmap?.get)?rmap.get(`${w}-${c}`):(typeof ROUTINES!=='undefined'?ROUTINES.find(x=>Number(x.w)===Number(w)&&String(x.c)===String(c)):null);
    if(!routine){if(typeof toast==='function')toast('Тренировка не найдена');return}
    const target=(typeof RPE==='object'&&RPE[routine.w])||routine.rpe||8,tempo=tempoFor(routine);
    const rows=(routine.e||[]).map((e,i)=>{
      const rr=restFor(routine,e,i),note=String(e?.d||'').trim();
      return `<div class="routine-preview-item"><div class="routine-preview-name">${esc(cleanName(e.n))}</div><div class="routine-preview-prescription">${esc(prescription(e))}</div><div class="routine-preview-rule">RPE ${esc(target)} · темп ${esc(tempo)}${rr?` · ${rr}с отдых`:''}</div>${note?`<div class="routine-preview-note">${esc(note)}</div>`:''}</div>`
    }).join('');
    modal(`<div class="routine-preview-root"><div class="sheet-grabber"></div><div class="routine-preview-head"><div><div class="routine-preview-title">${esc(routine.c)} · ${esc(routine.t)}</div><div class="routine-preview-meta">W${routine.w} · RPE ${esc(target)} · темп ${esc(tempo)}</div></div><button class="btn routine-preview-close" onclick="closeModal()" aria-label="Закрыть">×</button></div><div class="routine-preview-list">${rows}</div><button class="btn primary routine-preview-start" onclick="begin(${routine.w},'${encodeURIComponent(routine.c)}'.includes('%')?decodeURIComponent('${encodeURIComponent(routine.c)}'):'${routine.c}')">Начать</button></div>`)
  }
  previewV81.__routinePreviewV81=true;

  function install(){
    if(window.preview?.__routinePreviewV81)return;
    window.preview=previewV81;try{preview=previewV81}catch(e){}
  }
  install();let n=0;const id=setInterval(()=>{install();if(++n>40)clearInterval(id)},500);
})();
