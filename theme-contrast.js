'use strict';
(function(root){
  const rgb=hex=>hex.match(/[a-f0-9]{2}/gi).map(v=>parseInt(v,16));
  const luminance=colour=>rgb(colour).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  function action(accent){let values=rgb(/^#[a-f0-9]{6}$/i.test(accent)?accent:'#bf5af2'),hex=()=> '#'+values.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');while(contrast(hex(),'#ffffff')<4.5)values=values.map(v=>v*.94);return hex();}
  const api={action,contrast};if(typeof module==='object'&&module.exports)module.exports=api;else root.UNVRSLThemeContrast=api;
})(typeof window==='object'?window:globalThis);
