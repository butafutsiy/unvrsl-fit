'use strict';
(()=>{const s=document.createElement('style');s.id='coach-style';s.textContent=`
.coach-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.coach-actions>.btn{flex:1 1 auto}.coach-program{border-left:4px solid var(--green)}.program-day{background:#19191b;border:1px solid #29292d}.program-ex{background:#242427;border:1px solid #323237;border-radius:17px;padding:12px;margin-top:9px}.program-ex[draggable=true]{cursor:grab}.mini-actions{display:flex;gap:8px;margin-top:8px}.mini-actions button{background:#303034;border-radius:10px;padding:7px 12px;color:#a8a8ad}.mini-actions .danger-text{color:var(--red)}.method-builder-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}.method-hint{background:#242427;border:1px solid #343438;border-radius:15px;padding:12px;color:#a2a2a7;font-size:13px;line-height:1.45;margin:4px 0 15px}.program-pick-list{max-height:68vh;overflow:auto}.smart-row-actions{display:flex;align-items:center;gap:7px}.star-btn{width:38px;height:38px;border-radius:12px;background:#2b2b2e;color:#696970;font-size:20px}.star-btn.on{color:#ffd60a;background:#37321b}.smart-ex-row{cursor:pointer}.head-actions{display:flex;gap:7px;align-items:center}.smart-suggest{border:0;cursor:pointer}.set-wrap{margin-top:7px}.set-wrap .setrow{margin-top:0}.prev-set{font-size:11px;color:#77777d;padding:5px 46px 1px 65px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.replacement-item{width:100%;text-align:left}.coach-program .btn.danger,.program-day .btn.danger{background:#3c1b1b;color:#ff6961}
@media(max-width:430px){.method-builder-grid{grid-template-columns:1fr 1fr}.prev-set{padding-left:56px;padding-right:5px;font-size:10px}.head-actions{flex-direction:column}.coach-actions .btn{font-size:12px;padding:10px}.program-ex .row{align-items:flex-start}}
`;document.head.appendChild(s)})();

(()=>{
  if(window.__unvrslStrengthProgressV335||document.querySelector('script[data-unvrsl-strength-progress-v335]'))return;
  const s=document.createElement('script');
  s.src='strength-progress-v335.js?v=335';
  s.async=false;
  s.dataset.unvrslStrengthProgressV335='1';
  document.head.appendChild(s);
})();

(()=>{
  const loadSafe=()=>{
    if(window.__unvrslProgramSaveSafeV377||document.querySelector('script[data-unvrsl-program-save-v377]'))return;
    const z=document.createElement('script');z.src='program-save-safe-v377.js?v=377';z.async=false;z.dataset.unvrslProgramSaveV377='1';document.head.appendChild(z)
  };
  const loadV376=()=>{
    if(window.__unvrslRepMethodUiV376){loadSafe();return}
    const existing=document.querySelector('script[data-unvrsl-rep-method-ui-v376]');
    if(existing){setTimeout(loadSafe,120);return}
    const x=document.createElement('script');x.src='program-rep-method-ui-v376.js?v=376';x.async=false;x.dataset.unvrslRepMethodUiV376='1';x.onload=loadSafe;document.head.appendChild(x)
  };
  const loadMigration=()=>{
    if(window.__unvrslRepLegacyMigrationV375){loadV376();return}
    if(document.querySelector('script[data-unvrsl-rep-migration-v375]')){setTimeout(loadV376,120);return}
    const m=document.createElement('script');m.src='program-rep-legacy-migration-v375.js?v=375';m.async=false;m.dataset.unvrslRepMigrationV375='1';m.onload=loadV376;document.head.appendChild(m)
  };
  if(window.__unvrslRepPolicy374){loadMigration();return}
  if(document.querySelector('script[data-unvrsl-rep-policy-v374]')){setTimeout(loadMigration,120);return}
  const s=document.createElement('script');
  s.src='program-rep-range-v266.js?v=374';
  s.async=false;
  s.dataset.unvrslRepPolicyV374='1';
  s.onload=loadMigration;
  document.head.appendChild(s);
})();