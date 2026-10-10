'use strict';
// Reference values per 100 g of edible, uncooked product unless the label says otherwise.
// These are generic estimates, not brand-specific label values. No scraped recipes or images.
(function(root){
  const food=(name,p,f,c,allergens=[],vegetarian=true)=>({name,p,f,c,k:4*p+9*f+4*c,allergens,vegetarian});
  const foods={
    oats:food('Овсяные хлопья, сухие',12.3,6.1,59.5,['gluten']),
    rice:food('Рис, сухой',7,1,78), buckwheat:food('Гречка, сухая',12.6,3.3,62),
    pasta:food('Макароны, сухие',12,1.5,72,['gluten']),
    potato:food('Картофель, очищенный',2,.4,17), bread:food('Хлеб цельнозерновой',9,3.5,43,['gluten']),
    chicken:food('Куриная грудка, сырая',23,2,0,[],false),
    turkey:food('Филе индейки, сырое',23,2,0,[],false),
    beef:food('Говядина нежирная, сырая',21,7,0,[],false),
    fish:food('Белая рыба, сырая',18,1,0,['fish'],false),
    salmon:food('Лосось, сырой',20,13,0,['fish'],false),
    egg:food('Яйцо без скорлупы',12.6,10.6,1.1,['egg']),
    curd:food('Творог 5%, готовый продукт',17,5,3,['milk']),
    yogurt:food('Греческий йогурт 2%, без сахара',8,2,4,['milk']),
    milk:food('Молоко 2,5%',3,2.5,4.7,['milk']),
    tofu:food('Тофу, готовый продукт',12,6,2,['soy']),
    lentils:food('Чечевица, сухая',24,1.5,52),
    banana:food('Банан без кожуры',1.1,.3,23), apple:food('Яблоко',.4,.4,11.5),
    berries:food('Ягоды без сахара',1,.5,8), vegetables:food('Овощи без крахмалистых, смесь',1.5,.3,5),
    nuts:food('Грецкие орехи, очищенные',15,65,7,['nuts']),
    oil:food('Растительное масло',0,100,0)
  };
  // [food, grams, minimum, maximum, adjustment step]; eggs change by one ~50 g egg.
  const ingredient=(id,g)=>({id,g,min:id==='egg'?50:id==='oil'?0:id==='vegetables'?100:Math.round(g*.5),max:id==='egg'?200:id==='oil'?25:id==='vegetables'?g:Math.round(g*1.8),step:id==='egg'?50:id==='oil'?1:5});
  const recipes=[];
  function add(id,name,slots,time,items,steps){recipes.push({id,name,slots,time,ingredients:items.map(([f,g])=>ingredient(f,g)),steps});}
  add('oats-curd','Овсянка с творогом и бананом',['breakfast'],10,[['oats',65],['curd',150],['banana',100]],'Свари хлопья на воде. Добавь творог и нарезанный банан.');
  add('oats-yogurt','Овсянка с йогуртом и ягодами',['breakfast'],10,[['oats',65],['yogurt',200],['berries',100],['nuts',10]],'Свари хлопья на воде, немного остуди. Добавь йогурт, ягоды и орехи.');
  add('eggs-toast','Яйца с тостами и овощами',['breakfast'],15,[['egg',150],['bread',100],['vegetables',150],['oil',5]],'Приготовь яйца на указанном количестве масла. Подсуши хлеб, подай с овощами.');
  add('curd-toast','Творог с тостами и яблоком',['breakfast','snack'],5,[['curd',180],['bread',65],['apple',150]],'Подсуши хлеб. Подай с творогом и нарезанным яблоком.');
  add('tofu-toast','Тофу с тостами и овощами',['breakfast'],15,[['tofu',200],['bread',100],['vegetables',150],['oil',5]],'Раскроши тофу, прогрей с овощами и маслом. Подай с тостами.');
  add('milk-oats','Молочная овсянка с творогом',['breakfast'],10,[['oats',60],['milk',200],['curd',130],['berries',80]],'Свари хлопья на молоке. Творог и ягоды подай отдельно или добавь после остывания.');
  for(const [protein,label] of [['chicken','Курица'],['turkey','Индейка'],['fish','Белая рыба'],['tofu','Тофу']]){
    for(const [carb,side] of [['rice','рисом'],['buckwheat','гречкой']]){
      add(protein+'-'+carb,label+' с '+side+' и овощами',['lunch','dinner'],30,[[protein,180],[carb,80],['vegetables',200],['oil',10]],'Отвари крупу. '+(protein==='tofu'?'Прогрей тофу':'Приготовь мясо или рыбу до полной готовности')+'. Овощи подай отдельно, масло используй для приготовления или заправки.');
    }
  }
  add('beef-pasta','Говядина с макаронами',['lunch','dinner'],35,[['beef',180],['pasta',80],['vegetables',200],['oil',5]],'Нарежь говядину и потуши до готовности. Отвари макароны, подай с овощами. Учти всё масло.');
  add('salmon-potato','Лосось с картофелем',['lunch','dinner'],40,[['salmon',160],['potato',300],['vegetables',200],['oil',5]],'Запеки рыбу и картофель до готовности. Подай с овощами и указанным количеством масла.');
  add('chicken-potato','Курица с картофелем',['lunch','dinner'],40,[['chicken',180],['potato',300],['vegetables',200],['oil',10]],'Запеки курицу и картофель до полной готовности. Подай с овощами. Учти масло для запекания.');
  add('lentil-tofu','Чечевица с тофу и овощами',['lunch','dinner'],30,[['lentils',80],['tofu',180],['vegetables',200],['oil',5]],'Отвари чечевицу. Прогрей тофу с овощами и маслом, смешай или подай отдельно.');
  add('curd-berries','Творог с ягодами и орехами',['snack'],5,[['curd',180],['berries',100],['nuts',15]],'Добавь к творогу ягоды и измельчённые орехи.');
  add('yogurt-banana','Йогурт с бананом и орехами',['snack'],5,[['yogurt',250],['banana',100],['nuts',15]],'Нарежь банан, смешай с йогуртом и орехами.');
  add('curd-apple','Творог с яблоком',['snack'],5,[['curd',180],['apple',150]],'Подай творог с нарезанным яблоком.');
  add('tofu-sandwich','Тосты с тофу',['snack'],10,[['tofu',150],['bread',60],['vegetables',100]],'Подсуши хлеб, положи тофу и овощи.');
  add('yogurt-oats','Йогурт с хлопьями и ягодами',['snack'],5,[['yogurt',200],['oats',40],['berries',100]],'Замочи хлопья в йогурте до мягкости, добавь ягоды.');
  const world=typeof module==='object'&&module.exports?require('./meal-recipes-data.js'):(root.UNVRSLWorldRecipes||[]);
  recipes.push(...world.map(r=>({...r,ingredients:[{id:r.id,g:100,min:50,max:250,step:5,sourceNutrition:r.portionNutrition}]})));
  const catalog={foods,recipes,version:2};
  if(typeof module==='object'&&module.exports)module.exports=catalog;
  root.UNVRSLMealCatalog=catalog;
})(typeof window!=='undefined'?window:globalThis);
