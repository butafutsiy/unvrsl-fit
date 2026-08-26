'use strict';
function unvrslWrapProgramReadiness(){
  const f=window.beginProgramDay;
  if(typeof f!=='function'||f.__advReadiness||typeof advAskReadiness!=='function')return;
  const base=f;
  const wrapped=function(){return advAskReadiness(base,[...arguments])};
  wrapped.__advReadiness=true;
  window.beginProgramDay=wrapped;
}
unvrslWrapProgramReadiness();
setTimeout(unvrslWrapProgramReadiness,800);
