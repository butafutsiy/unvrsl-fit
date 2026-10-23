'use strict';
// Compatibility entry points. All actual results use the normal workout path.
if(typeof window.roundLoad!=='function')window.roundLoad=function(v,step=2.5){return Math.max(0,Math.round(Number(v||0)/step)*step)};
window.openFocusMode=function(){return window.workoutFocus?.open()};
window.focusComplete=function(ei){return window.workoutFocus?.open(Number(ei))};
