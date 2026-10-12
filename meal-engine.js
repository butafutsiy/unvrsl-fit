'use strict';
(function(root){
  const catalog=typeof module==='object'&&module.exports?require('./meal-catalog.js'):root.UNVRSLMealCatalog;
  const keys=['k','p','f','c'];
  const servingReferences=new Set(catalog.recipes.filter(r=>r.source).map(r=>r.id));
  const blank=()=>({k:0,p:0,f:0,c:0});
  const sum=list=>list.reduce((a,x)=>{for(const k of keys)a[k]+=x[k]||0;return a},blank());
  const round=x=>Object.fromEntries(keys.map(k=>[k,Math.round(x[k]*10)/10]));
  const foodSearchAliases={egg:'яйца яиц яйцо яичница',buckwheat:'гречка гречневая',oats:'овсянка геркулес',chicken:'курица куриная грудка',beef:'говядина говяжий',pork:'свинина свиной вырезка pork',tomato:'томаты помидоры',oil:'масло',curd:'творог творожный',fish:'рыба',potato:'картошка картофель'};
  const normalizeSearch=value=>String(value||'').toLowerCase().replace(/ё/g,'е').replace(/[^а-яa-z0-9]+/g,' ').trim();
  const searchWords=value=>normalizeSearch(value).split(/\s+/).filter(Boolean);
  const stopWords=new Set(['с','со','и','из','на','в','для','по']);
  function searchStem(word){
    for(const [pattern,stem] of [[/^говя[дж]/,'говядин'],[/^свин/,'свинин'],[/^кур(?:иц|ин)/,'куриц'],[/^греч(?:к|н|их)/,'греч'],[/^карто(?:ф|ш)/,'картоф'],[/^(?:яй[цч]|яиц|яич)/,'яйц'],[/^(?:овся|геркул)/,'овся'],[/^твор/,'твор'],[/^(?:помидор|томат)/,'помидор']])if(pattern.test(word))return stem;
    const stem=word.replace(/(?:иями|ями|ами|ией|ого|ему|ому|ими|ыми|ую|юю|ая|яя|ое|ее|ые|ие|ой|ей|ый|ий|ов|ев|ам|ям|ах|ях|ом|ем|а|я|ы|и|у|ю|е)$/,'');
    return stem.length>=3?stem:word;
  }
  function oneEdit(a,b){
    if(Math.abs(a.length-b.length)>1)return false;
    if(a.length===b.length){let k=0;while(k<a.length&&a[k]===b[k])k++;if(k+1<a.length&&a[k]===b[k+1]&&a[k+1]===b[k]&&a.slice(k+2)===b.slice(k+2))return true;}
    let i=0,j=0,edits=0;
    while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++edits>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}
    return edits+(a.length-i)+(b.length-j)<=1;
  }
  function searchMatches(text,query,allowTypo=true){
    const words=searchWords(query).filter(w=>!stopWords.has(w));if(!words.length)return true;
    const tokens=searchWords(text).map(word=>({word,stem:searchStem(word)}));
    return words.every(word=>{const stem=searchStem(word);return tokens.some(t=>t.word===word||t.stem===stem||(word.length>=2&&t.word.startsWith(word))||(allowTypo&&word.length>=5&&t.word.length>=5&&(oneEdit(word,t.word)||(stem.length>=4&&t.stem.length>=4&&oneEdit(stem,t.stem)))));});
  }
  function searchItems(items,query,textOf){
    const exact=items.filter(item=>searchMatches(textOf(item),query,false));
    return (exact.length?exact:items.filter(item=>searchMatches(textOf(item),query))).sort((a,b)=>searchRank(textOf(a),query)-searchRank(textOf(b),query));
  }
  function searchRank(text,query){const q=normalizeSearch(query),t=normalizeSearch(text);if(!q)return 0;if(t===q)return 0;if(t.startsWith(q+' ')||t.startsWith(q))return 1;if(searchMatches(t,q,false))return 2;return 3;}
  function foodText(id){const f=catalog.foods[id];return [f?.name,f?.aliases,foodSearchAliases[id],({beef:'говядина говяжий мясо',pork:'свинина свиной мясо',poultry:'птица мясо',fish:'рыба рыбный',nuts:'орехи семечки',dairy:'молочное молоко'})[f?.category]].filter(Boolean).join(' ');}
  const recipeSearchCache=new WeakMap();
  function recipeSearchText(recipe){
    if(!recipeSearchCache.has(recipe))recipeSearchCache.set(recipe,[recipe.name,recipe.country||'',...(recipe.details||[]).map(i=>i.name),...recipe.ingredients.map(i=>[i.name||'',foodText(i.id)].join(' '))].join(' '));
    return recipeSearchCache.get(recipe);
  }
  function nutrition(ingredients){return sum(ingredients.map(i=>{
    const food=i.sourceNutrition||catalog.foods[i.id];if(!food||!Number.isFinite(i.g)||i.g<0)throw Error('Проверь ингредиенты');
    if(keys.some(k=>!Number.isFinite(food[k])||food[k]<0)||(!servingReferences.has(i.id)&&(food.k>1000||food.p+food.f+food.c>100.5)))throw Error('Неполные или неверные КБЖУ ингредиента');return Object.fromEntries(keys.map(k=>[k,food[k]*i.g/100]));
  }));}
  function foodAmount(raw,quantity){return nutrition([{id:'manual-amount',sourceNutrition:raw,g:quantity}]);}
  const cookedFactors={rice:2.7,buckwheat:2.5,pasta:2.4,lentils:2.5,bulgur:2.5,millet:3,semolina:3,chicken:.75,turkey:.75,beef:.7,pork:.75,fish:.8,salmon:.8,shrimp:.8,potato:.95,egg:.95};
  function servingWeight(meal){
    if(Number.isFinite(meal.readyGrams)&&meal.readyGrams>0)return {grams:meal.readyGrams,estimated:false};
    const recipe=catalog.recipes.find(r=>r.id===meal.recipeId);
    if(!recipe||recipe.source||meal.customComposition||recipe.custom||meal.ingredients.some(i=>i.sourceNutrition&&!catalog.foods[i.id]))return null;
    if(recipe.estimatedYieldGrams){const factor=meal.ingredients.reduce((a,i)=>a+i.g,0)/recipe.ingredients.reduce((a,i)=>a+i.g,0);return {grams:Math.round(recipe.estimatedYieldGrams*factor),estimated:true};}
    const noCook=recipe.time<=5||/^overnight-/.test(recipe.id);
    const baked=/curd-(?:pancakes|bake)|pancake|cutlet|oat-pancake/.test(recipe.id);
    const grams=meal.ingredients.reduce((sum,i)=>{
      let factor=noCook?1:(cookedFactors[i.id]||1);
      if(i.id==='oats')factor=noCook||baked?1:2.5;
      if(baked&&['flour','semolina','curd','milk'].includes(i.id))factor=.9;
      return sum+i.g*factor;
    },0);
    return {grams:Math.round(grams),estimated:!noCook};
  }
  const freezeIngredients=ingredients=>ingredients.map(i=>{if(i.sourceNutrition)return i;const f=catalog.foods[i.id],s=f.sourceInfo||{};return {...i,name:f.name,sourceNutrition:Object.fromEntries(keys.map(k=>[k,f[k]])),sourceInfo:s.provider==='USDA SR28'?{provider:s.provider,code:s.code,release:s.release}:{...s},allergens:[...f.allergens],allergensUncertain:!!f.allergensUncertain,vegetarian:f.vegetarian};});
  function isLegacyMeal(meal){if(!meal.nutrition||meal.ingredients.every(i=>i.sourceNutrition))return false;try{const current=nutrition(meal.ingredients);return keys.some(k=>Math.abs(current[k]-meal.nutrition[k])>.11);}catch(_){return true;}}
  function scaleMeal(meal,factor){
    if(!Number.isFinite(factor)||factor<.05||factor>5)throw Error('Количество должно быть от 5% до 500% порции');
    const ingredients=meal.ingredients.map(i=>({...i,g:Math.round(i.g*factor*10)/10}));
    const legacy=isLegacyMeal(meal);if(legacy&&keys.some(k=>!Number.isFinite(meal.nutrition[k])||meal.nutrition[k]<0))throw Error('Проверь сохранённые КБЖУ');
    return {...meal,ingredients,nutrition:legacy?Object.fromEntries(keys.map(k=>[k,meal.nutrition[k]*factor])):nutrition(ingredients),...(legacy?{legacySnapshot:true}:{}),...(meal.readyGrams?{readyGrams:Math.round(meal.readyGrams*factor*10)/10}:{})};
  }
  function composeMeal(meal,ingredients,readyGrams){
    if(catalog.recipes.find(r=>r.id===meal.recipeId)?.source)throw Error('У этого рецепта нет КБЖУ отдельных ингредиентов');
    if(!Array.isArray(ingredients)||!ingredients.length||ingredients.length>60)throw Error('Добавь от 1 до 60 ингредиентов');
    if(ingredients.some(i=>(!catalog.foods[i.id]&&(!i.name||!i.sourceNutrition))||(i.sourceNutrition&&(keys.some(k=>!Number.isFinite(i.sourceNutrition[k])||i.sourceNutrition[k]<0)||i.sourceNutrition.k>1000||i.sourceNutrition.p+i.sourceNutrition.f+i.sourceNutrition.c>100.5))||!Number.isFinite(i.g)||i.g<0||i.g>10000))throw Error('Укажи граммовки от 0 до 10 000 г');
    const rows=ingredients.filter(i=>i.g>0).map(i=>({...i}));
    if(!rows.length)throw Error('Добавь хотя бы один ингредиент с весом больше нуля');
    if(readyGrams!==undefined&&(!Number.isFinite(readyGrams)||readyGrams<=0||readyGrams>30000))throw Error('Проверь вес готового блюда');
    const result={...meal,ingredients:rows,nutrition:nutrition(rows),customComposition:true};
    delete result.readyGrams;
    if(readyGrams!==undefined)result.readyGrams=readyGrams;
    return result;
  }
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
    if(prefs.maxTime&&(!Number.isFinite(recipe.time)||recipe.time>Number(prefs.maxTime)))return false;
    const excluded=String(prefs.exclude||'').split(/[,;\n]/).map(x=>normalizeSearch(x)).filter(Boolean);
    if(recipe.source){
      if((prefs.allergens||[]).length)return false;
      if(prefs.vegetarian&&!recipe.diets.some(d=>d==='vegetarian'||d==='vegan'))return false;
      return !excluded.some(x=>searchMatches(recipeSearchText(recipe),x,false));
    }
    return recipe.ingredients.every(i=>{
      const f=catalog.foods[i.id]||i.sourceNutrition;if(!f)return false;
      const allergens=catalog.foods[i.id]?.allergens||i.allergens,uncertain=catalog.foods[i.id]?.allergensUncertain||i.allergensUncertain;
      return (!prefs.vegetarian||(i.vegetarian??f.vegetarian)===true)&&(!(prefs.allergens||[]).length||!uncertain&&Array.isArray(allergens)&&!prefs.allergens.some(a=>allergens.includes(a)))&&!excluded.some(x=>searchMatches([i.name,foodText(i.id)].join(' '),x,false));
    })&&!excluded.some(x=>searchMatches(recipe.name,x,false));
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
    if(recipe.fixedRatios){const ratio=Math.min(recipe.maxPortions||1.75,Math.max(.5,factor));const ingredients=freezeIngredients(recipe.ingredients.map(i=>({...i,g:i.g*ratio})));return {recipeId:recipe.id,name:recipe.name,time:recipe.time,steps:recipe.steps,ingredients,nutrition:nutrition(ingredients),fixedRatios:true,...(recipe.readyGrams?{readyGrams:recipe.readyGrams*ratio}:{})};}
    const ingredients=freezeIngredients(recipe.ingredients.map(i=>({...i,g:grams(i,i.g*factor)})));
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
    if(options.randomize&&!options.singleAttempt){
      let best;
      for(let attempt=0;attempt<6;attempt++){
        const candidate=generate(target,count,prefs,{...options,singleAttempt:true});
        if(candidate.withinTarget)return candidate;
        if(!best||loss(candidate.total,target)<loss(best.total,target))best=candidate;
      }
      // If random shortlists miss the ranges, search the best fresh alternatives.
      const banned={...options.banned};
      for(const slot of slots(count)){
        const previous=options.prior?.find(m=>m.id===slot.id);
        if(options.locked?.[slot.id]||!previous)continue;
        const existing=banned[slot.id]||[];
        if(catalog.recipes.some(r=>r.slots.includes(slot.type)&&allowed(r,prefs)&&!existing.includes(r.id)&&r.id!==previous.recipeId))banned[slot.id]=[...existing,previous.recipeId];
      }
      const fallback=generate(target,count,prefs,{...options,randomize:false,banned});
      return loss(fallback.total,target)<loss(best.total,target)?fallback:best;
    }
    const meals=slots(count),locked=options.locked||{},prior=options.prior||[];
    const randomize=!!options.randomize,rng=options.rng||Math.random;
    let beam=[{meals:[],nutrition:blank(),penalty:0}];
    for(const slot of meals){
      const t=scaledTarget(target,slot.share),lock=locked[slot.id];
      let choices;
      if(lock)choices=[{...lock,ingredients:lock.ingredients?.map(i=>({...i})),nutrition:{...lock.nutrition}}];
      else{
        const pool=catalog.recipes.filter(r=>r.slots.includes(slot.type)&&allowed(r,prefs)&&!(options.banned?.[slot.id]||[]).includes(r.id));
        if(!pool.length)throw Error('Нет блюд для '+slot.title.toLowerCase()+'. Измени исключения или время готовки.');
        const previous=prior.find(m=>m.id===slot.id);
        // A fresh press changes unfinished meals whenever the allowed pool has alternatives.
        const fresh=randomize&&pool.length>1?pool.filter(r=>r.id!==previous?.recipeId):pool;
        choices=fresh.map(r=>({meal:fit(r,t),noise:randomize?rng()*.15:0})).sort((a,b)=>loss(a.meal.nutrition,t)+a.noise-loss(b.meal.nutrition,t)-b.noise).slice(0,6).map(x=>x.meal);
        if(!randomize&&previous&&pool.some(r=>r.id===previous.recipeId)&&!choices.some(m=>m.recipeId===previous.recipeId))choices.push({...previous,ingredients:previous.ingredients.map(i=>({...i})),nutrition:{...previous.nutrition}});
      }
      beam=beam.flatMap(b=>choices.map(m=>{
        const repeated=m.recipeId&&b.meals.some(x=>x.recipeId===m.recipeId);
        const penalty=b.penalty+(lock?0:loss(m.nutrition,t)*.08)+(repeated?.1:0)+(randomize&&!lock?rng()*.002:0);
        return {meals:[...b.meals,{...m,...slot,locked:!!lock}],nutrition:sum([b.nutrition,m.nutrition]),penalty};
      })).sort((a,b)=>loss(a.nutrition,scaledTarget(target,meals.slice(0,a.meals.length).reduce((s,m)=>s+m.share,0)))+a.penalty-loss(b.nutrition,scaledTarget(target,meals.slice(0,b.meals.length).reduce((s,m)=>s+m.share,0)))-b.penalty).slice(0,36);
    }
    let chosen=beam.sort((a,b)=>loss(a.nutrition,target)+a.penalty-loss(b.nutrition,target)-b.penalty)[0].meals;
    // Coordinate descent adjusts real ingredients while preserving edible portion bounds.
    const objective=()=>loss(sum(chosen.map(m=>m.nutrition)),target)+chosen.reduce((s,m)=>s+(m.locked?0:loss(m.nutrition,scaledTarget(target,m.share))*.03),0);
    for(let pass=0;pass<7;pass++)for(const m of chosen){
      if(m.locked||m.fixedRatios||!m.ingredients)continue;
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
  function recipeInfo(recipe){
    const n=round(recipe.portionNutrition||nutrition(recipe.ingredients));
    const kind=recipe.kind||(/суп|борщ|рассольник|уха|щи/i.test(recipe.name)?'soup':/салат|винегрет|оливье/i.test(recipe.name)?'salad':/бургер|бутерброд|сэндвич|шаурма|лаваш/i.test(recipe.name)?'sandwich':recipe.slots.length===1&&recipe.slots[0]==='breakfast'?'breakfast':'main');
    const vegetarian=allowed(recipe,{vegetarian:true});
    const pescatarian=vegetarian||(recipe.source?(recipe.diets||[]).includes('pescatarian'):recipe.ingredients.every(i=>catalog.foods[i.id].vegetarian||['fish','salmon','tuna','shrimp'].includes(i.id)));
    const collections=[];
    if(recipe.custom)collections.push('mine');
    if(!recipe.source&&recipe.slots.includes('breakfast'))collections.push('breakfast');
    if(recipe.time<=20&&recipe.slots.includes('dinner'))collections.push('quick');
    if(n.p>=25&&n.p*4/Math.max(1,n.k)>=.2)collections.push('protein');
    if(!recipe.source&&/сэндвич|лаваш|ленивая овсянка|овсянка на ночь|ролл|маффин/i.test(recipe.name))collections.push('portable');
    if(!recipe.source&&recipe.ingredients.some(i=>i.id==='egg')&&/яйц|омлет|яичн|шакшук|овсяноблин/i.test(recipe.name))collections.push('egg');
    if(!recipe.source&&recipe.ingredients.some(i=>i.id==='buckwheat'))collections.push('buckwheat');
    return {kind,nutrition:n,vegetarian,pescatarian,collections,country:recipe.country||'Повседневная кухня'};
  }
  function matchesCatalog(recipe,filters={},favorites=[]){
    const info=recipeInfo(recipe);
    return (!filters.kind||info.kind===filters.kind)&&(!filters.maxTime||recipe.time<=Number(filters.maxTime))&&(!filters.type||recipe.slots.includes(filters.type))&&
      (!filters.diet||filters.diet==='all'||!!info[filters.diet])&&
      (!filters.country||info.country===filters.country)&&
      (!filters.collection||info.collections.includes(filters.collection))&&
      (!filters.favorite||favorites.includes(recipe.id))&&
      (filters.calories===undefined||filters.calories===''||(info.nutrition.k>=Number(filters.calories)&&info.nutrition.k<(Number(filters.calories)===700?Infinity:Number(filters.calories)+100)));
  }
  const api={isLegacyMeal,foodAmount,foodText,searchRank,searchItems,searchMatches,normalizeSearch,recipeSearchText,foodSearchAliases,composeMeal,servingWeight,scaleMeal,nutrition,sum,round,validateTarget,fromGoal,bounds,deviation,within,loss,subtractTarget,slots,allowed,fit,generate,recipeInfo,matchesCatalog,catalog};
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.UNVRSLMealEngine=api;
})(typeof window!=='undefined'?window:globalThis);
