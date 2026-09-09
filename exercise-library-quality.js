'use strict';
(()=>{
  const css=document.createElement('style');
  css.textContent='#exercises .quality-media-line,#exercises .catalog-head .chip{display:none!important}';
  document.head.appendChild(css);
  // The final catalog is loaded sequentially by equipment-filter.js.
  // Do not start a second renderer here: a slow response could replace it later.
})();
