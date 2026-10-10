'use strict';
(function(root){
  const catalog=typeof module==='object'&&module.exports?require('./meal-catalog.js'):root.UNVRSLMealCatalog;
  const keys=['k','p','f','c'];
  const blank=()=>({k:0,p:0,f:0,c:0});
  const sum=list=>list.reduce((a,x)=>{for(const k of keys)a[k]+=x[k]||0;return a},blank());
  const round=x=>Object.fromEntries(keys.map(k=>[k,Math.round(x[k]*10)/10]));
  function nutrition(ingredients){return round(sum(ingredients.map(i=>{
    const food=i.sourceNutrition||catalog.foods[i.id];if(!food||!Number.isFinite(i.g)||i.g<0)throw Error('Проверь ингредиенты');
    return Object.fromEntries(keys.map(k=>[k,food[k]*i.g/100]));
  })));}
  function validateTarget(t){
    if(!t||keys.some(k=>!Number.isFinite(t[k])||t[k]<=0))throw Error('Укажи положительные калории и БЖУ');
    if(t.k>10000||t.p>600||t.f>400||t.c>1800)throw Error('Проверь дневные цели');
    if(t.ranges&&keys.some(k=>!Array.isArray(t.ranges[k])||t.ranges[k].length!==2||t.ranges[k].some(v=>!Number.isFinite(v)||v<0)||t.ranges[k][0]>t.ranges[k][1]||t[k]<t.ranges[k][0]||t[k]>t.ranges[k][1]))throw Error('Проверь диапазоны КБЖУ');
    return t;
  }
  function fromGoal(g){
    const mid=a=>(a[0]+a[1])/2;
    const k=Math.round(mid(g.calories)),p=Math.round(mid(g.protein)),f=Math.round(mid(g.fat));
    const c=Math.max(1,Math.round((k-4*p-9*f)/4));
    const ranges={k:[...g.calories],p:[...g.protein],f:[...g.fat],c:g.carbs?[...g.carbs]:[Math.max(0,Math.floor((g.calories[0]-4*g.protein[1]-9*g.fat[1])/4)),Math.ceil((g.calories[1]-4*g.protein[0]-9*g.fat[0])/4)]};
    return {k,p,f,c,ranges};
  }
  function slots(count){
    if(![3,4,5].includes(Number(count)))throw Error('Выбери 3, 4 или 5 приёмов');
    const names=count==3?['breakfast','lunch','dinner']:count==4?['breakfast','lunch','snack','dinner']:['breakfast','snack','lunch','snack','dinner'];
    const shares=count==3?[.3,.4,.3]:count==4?[.25,.35,.15,.25]:[.25,.1,.3,.1,.25];
    const titles={breakfast:'Завтрак',lunch:'Обед',dinner:'Ужин',snack:'Перекус'};
    return names.map((type,i)=>({id:'meal-'+i,type,title:titles[type],share:shares[i]}));
  }
  function allowed(recipe,prefs={}){
    if(prefs.simpleOnly&&recipe.source)return false;
    if(prefs.maxTime&&recipe.time>Number(prefs.maxTime))return false;
    if(recipe.source){
      if((prefs.allergens||[]).length)return false;
      if(prefs.vegetarian&&!recipe.diets.some(d=>d==='vegetarian'||d==='vegan'))return false;
      const excluded=String(prefs.exclude||'').toLowerCase().split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);
      return !excluded.some(x=>[recipe.name,...recipe.details.map(i=>i.name+' '+i.note)].join(' ').toLowerCase().includes(x));
    }
    const excluded=String(prefs.exclude||'').toLowerCase().split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);
    return recipe.ingredients.every(i=>{
      const f=catalog.foods[i.id];
      return (!prefs.vegetarian||f.vegetarian)&&!(prefs.allergens||[]).some(a=>f.allergens.includes(a))&&!excluded.some(x=>f.name.toLowerCase().includes(x));
    })&&!excluded.some(x=>recipe.name.toLowerCase().includes(x));
  }
  const bounds=(t,k)=>t.ranges?.[k]||[t[k],t[k]];
  const deviation=(n,t,k)=>{const [lo,hi]=bounds(t,k);return n[k]<lo?n[k]-lo:n[k]>hi?n[k]-hi:0};
  const within=(n,t)=>keys.every(k=>t.ranges?deviation(n,t,k)===0:Math.abs(n[k]-t[k])<=Math.max(t[k]*.1,k==='k'?50:5));
  const loss=(n,t)=>keys.reduce((score,k)=>score+(k==='k'?2:1)*(deviation(n,t,k)/Math.max(t[k],k==='k'?100:15))**2,0);
  const scaledTarget=(t,s)=>({...Object.fromEntries(keys.map(k=>[k,t[k]*s])),...(t.ranges?{ranges:Object.fromEntries(keys.map(k=>[k,t.ranges[k].map(v=>v*s)]))}:{})});
  function subtractTarget(t,n){return {...Object.fromEntries(keys.map(k=>[k,Math.max(k==='k'?100:1,t[k]-(n[k]||0))])),...(t.ranges?{ranges:Object.fromEntries(keys.map(k=>[k,t.ranges[k].map(v=>Math.max(k==='k'?100:1,v-(n[k]||0)))]))}:{})};}
  function grams(i,v){return Math.max(i.min,Math.min(i.max,Math.round(v/i.step)*i.step));}
  function fit(recipe,target){
    const base=nutrition(recipe.ingredients),factor=target.k/base.k;
    const ingredients=recipe.ingredients.map(i=>({...i,g:grams(i,i.g*factor)}));
    for(let pass=0;pass<5;pass++)for(const i of ingredients){
      let best=i.g,score=loss(nutrition(ingredients),target);
      for(const v of [i.g-i.step,i.g+i.step,i.g*.8,i.g*1.2]){
        i.g=grams(i,v);const next=loss(nutrition(ingredients),target);if(next<score){score=next;best=i.g;}
      }i.g=best;
    }
    return {recipeId:recipe.id,name:recipe.name,time:recipe.time,steps:recipe.steps,ingredients,nutrition:nutrition(ingredients)};
  }
  function generate(target,count,prefs={},options={}){
    validateTarget(target);
    const meals=slots(count),locked=options.locked||{},prior=options.prior||[];
    let beam=[{meals:[],nutrition:blank(),penalty:0}];
    for(const slot of meals){
      const t=scaledTarget(target,slot.share),lock=locked[slot.id];
      let choices;
      if(lock)choices=[{...lock,ingredients:lock.ingredients?.map(i=>({...i})),nutrition:lock.ingredients?nutrition(lock.ingredients):round(lock.nutrition)}];
      else{
        const pool=catalog.recipes.filter(r=>r.slots.includes(slot.type)&&allowed(r,prefs)&&!(options.banned?.[slot.id]||[]).includes(r.id));
        if(!pool.length)throw Error('Нет блюд для '+slot.title.toLowerCase()+'. Измени исключения или время готовки.');
        choices=pool.map(r=>fit(r,t)).sort((a,b)=>loss(a.nutrition,t)-loss(b.nutrition,t)).slice(0,6);
        const previous=prior.find(m=>m.id===slot.id);
        if(previous&&pool.some(r=>r.id===previous.recipeId)&&!choices.some(m=>m.recipeId===previous.recipeId))choices.push({...previous,ingredients:previous.ingredients.map(i=>({...i})),nutrition:{...previous.nutrition}});
      }
      beam=beam.flatMap(b=>choices.map(m=>{
        const repeated=m.recipeId&&b.meals.some(x=>x.recipeId===m.recipeId);
        const penalty=b.penalty+(lock?0:loss(m.nutrition,t)*.08)+(repeated?.1:0);
        return {meals:[...b.meals,{...m,...slot,locked:!!lock}],nutrition:sum([b.nutrition,m.nutrition]),penalty};
      })).sort((a,b)=>loss(a.nutrition,scaledTarget(target,meals.slice(0,a.meals.length).reduce((s,m)=>s+m.share,0)))+a.penalty-loss(b.nutrition,scaledTarget(target,meals.slice(0,b.meals.length).reduce((s,m)=>s+m.share,0)))-b.penalty).slice(0,36);
    }
    let chosen=beam.sort((a,b)=>loss(a.nutrition,target)+a.penalty-loss(b.nutrition,target)-b.penalty)[0].meals;
    // Coordinate descent adjusts real ingredients while preserving edible portion bounds.
    const objective=()=>loss(sum(chosen.map(m=>m.nutrition)),target)+chosen.reduce((s,m)=>s+(m.locked?0:loss(m.nutrition,scaledTarget(target,m.share))*.03),0);
    for(let pass=0;pass<7;pass++)for(const m of chosen){
      if(m.locked||!m.ingredients)continue;
      for(const i of m.ingredients){
        let best=i.g,bestScore=objective();const original=i.g;
        for(const v of [original-i.step,original+i.step,original*.85,original*1.15]){
          i.g=grams(i,v);m.nutrition=nutrition(m.ingredients);const score=objective();
          if(score<bestScore){bestScore=score;best=i.g;}
        }i.g=best;m.nutrition=nutrition(m.ingredients);
      }
    }
    const total=round(sum(chosen.map(m=>m.nutrition))),delta=round(Object.fromEntries(keys.map(k=>[k,total[k]-target[k]])));
    return {version:1,target:{...target},meals:chosen,total,delta,withinTarget:within(total,target)};
  }
  const api={nutrition,sum,round,validateTarget,fromGoal,bounds,deviation,within,loss,subtractTarget,slots,allowed,fit,generate,catalog};
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.UNVRSLMealEngine=api;
})(typeof window!=='undefined'?window:globalThis);
