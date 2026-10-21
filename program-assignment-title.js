'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.assignmentSnapshotTitle521=api.withTitle})(typeof window==='undefined'?null:window,function(){
  function withTitle(snapshot,previous={},title){
    const copy=JSON.parse(JSON.stringify(snapshot));
    const name=String(title===undefined?previous?.clientTitle||'':title).trim();
    if(name){copy.clientTitle=name;if(copy.program)copy.program.name=name;else copy.title=name;}
    return copy;
  }
  return{withTitle};
});
