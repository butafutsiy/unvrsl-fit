'use strict';
(function(root){
  const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
  const stamp=x=>Number(x?.updatedAt||x?.createdAt||0);
  function rows(a=[],b=[],deleted={}){
    const map=new Map();
    for(const row of [...b,...a])if(row?.id){const old=map.get(row.id);if(!old||stamp(row)>=stamp(old))map.set(row.id,copy(row));}
    return [...map.values()].filter(row=>!deleted[row.id]||stamp(row)>deleted[row.id]);
  }
  function merge(local,remote,preferRemote=false){
    if(!local)return copy(remote);if(!remote)return copy(local);
    const remoteWins=stamp(remote)===stamp(local)?preferRemote:stamp(remote)>stamp(local);const first=remoteWins?remote:local,second=remoteWins?local:remote;
    const result={...copy(second),...copy(first),days:{}};
    result.settingsAt={};for(const key of ['target','preferences','protocol']){const a=Number(local.settingsAt?.[key]||0),b=Number(remote.settingsAt?.[key]||0);result[key]=copy(a===b?first[key]:a>b?local[key]:remote[key]);result.settingsAt[key]=Math.max(a,b);}
    const favorites={};for(const db of [second,first]){for(const id of db.favorites||[])if(!favorites[id])favorites[id]={value:true,at:0};for(const [id,x] of Object.entries(db.favoriteStates||{}))if(!favorites[id]||x.at>=favorites[id].at)favorites[id]=copy(x);}result.favoriteStates=favorites;result.favorites=Object.keys(favorites).filter(id=>favorites[id].value);
    for(const date of new Set([...Object.keys(local.days||{}),...Object.keys(remote.days||{})])){
      const a=local.days?.[date],b=remote.days?.[date];
      if(!a||!b){result.days[date]=copy(a||b);continue;}
      const winner=stamp(a)===stamp(b)?first.days[date]:stamp(a)>stamp(b)?a:b;
      const deletedExtra={...a.deletedExtra};for(const [id,at] of Object.entries(b.deletedExtra||{}))deletedExtra[id]=Math.max(deletedExtra[id]||0,at);
      const deletedEaten={...a.deletedEaten};for(const [id,at] of Object.entries(b.deletedEaten||{}))deletedEaten[id]=Math.max(deletedEaten[id]||0,at);
      const eaten=Object.fromEntries(rows(Object.values(a.eaten||{}),Object.values(b.eaten||{}),deletedEaten).map(x=>[x.id,x]));
      result.days[date]={...copy(winner),extra:rows(a.extra,b.extra,deletedExtra),eaten,deletedExtra,deletedEaten};
    }
    result.deletedFoods={...local.deletedFoods};for(const [id,at] of Object.entries(remote.deletedFoods||{}))result.deletedFoods[id]=Math.max(result.deletedFoods[id]||0,at);
    result.savedFoods=rows(local.savedFoods,remote.savedFoods,result.deletedFoods);
    result.deletedRecipes={...local.deletedRecipes};for(const [id,at] of Object.entries(remote.deletedRecipes||{}))result.deletedRecipes[id]=Math.max(result.deletedRecipes[id]||0,at);
    result.customRecipes=rows(local.customRecipes,remote.customRecipes,result.deletedRecipes);
    return result;
  }
  function track(before,after,now=Date.now()){
    before=before||{};after.updatedAt=now;
    after.settingsAt={...before.settingsAt,...after.settingsAt};for(const key of ['target','preferences','protocol'])if(JSON.stringify(before[key])!==JSON.stringify(after[key]))after.settingsAt[key]=now;
    after.favoriteStates={...before.favoriteStates,...after.favoriteStates};const oldFavorites=new Set(before.favorites||[]),newFavorites=new Set(after.favorites||[]);for(const id of new Set([...oldFavorites,...newFavorites]))if(oldFavorites.has(id)!==newFavorites.has(id))after.favoriteStates[id]={value:newFavorites.has(id),at:now};
    function changes(oldRows,newRows,deleted){
      const previous=new Map(oldRows.map(x=>[x.id,x]));
      for(const row of newRows){if(JSON.stringify(previous.get(row.id))!==JSON.stringify(row))row.updatedAt=now;previous.delete(row.id);if(deleted[row.id]&&stamp(row)>deleted[row.id])delete deleted[row.id];}
      for(const id of previous.keys())deleted[id]=now;
    }
    for(const [date,d] of Object.entries(after.days||{})){
      const old=before.days?.[date]||{};if(JSON.stringify(old)===JSON.stringify(d))continue;
      d.updatedAt=now;d.deletedExtra={...old.deletedExtra,...d.deletedExtra};d.deletedEaten={...old.deletedEaten,...d.deletedEaten};
      changes(old.extra||[],d.extra||[],d.deletedExtra);changes(Object.values(old.eaten||{}),Object.values(d.eaten||{}),d.deletedEaten);
    }
    for(const [key,tombstones] of [['savedFoods','deletedFoods'],['customRecipes','deletedRecipes']]){after[tombstones]={...before[tombstones],...after[tombstones]};changes(before[key]||[],after[key]||[],after[tombstones]);}
    return after;
  }
  const api={merge,track};if(typeof module==='object'&&module.exports)module.exports=api;else root.UNVRSLNutritionState=api;
})(typeof window==='object'?window:globalThis);
