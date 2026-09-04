'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslRepRangeGhostBootstrapV286)return;
  W.__unvrslRepRangeGhostBootstrapV286=true;

  const loadStateGhost=()=>{
    if(W.__unvrslRepRangeStatePlaceholderV286||D.querySelector('script[data-unvrsl-rep-range-state="286"]'))return;
    const p=D.createElement('script');
    p.src='./rep-range-state-placeholder-v286.js?v=286';
    p.async=false;
    p.dataset.unvrslRepRangeState='286';
    (D.body||D.documentElement).appendChild(p);
  };

  const s=D.createElement('script');
  s.src='./rep-range-ghost-display-v284.js?v=286';
  s.async=false;
  s.dataset.unvrslRepRangeGhostFinal='286';
  s.onload=loadStateGhost;
  s.onerror=loadStateGhost;
  (D.body||D.documentElement).appendChild(s);
})();
