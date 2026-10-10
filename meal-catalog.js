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
    oil:food('Растительное масло',0,100,0),
    flour:food('Мука пшеничная',10,1,70,['gluten']),
    semolina:food('Манная крупа, сухая',10.3,1,70.6,['gluten']),
    millet:food('Пшено, сухое',11.5,3.3,69),
    cheese:food('Сыр полутвёрдый',25,27,0,['milk']),
    kefir:food('Кефир 2,5%',3,2.5,4,['milk']),
    tuna:food('Тунец в собственном соку, без жидкости',23,1,0,['fish'],false),
    beans:food('Фасоль варёная, без соуса',8,1,20),
    sugar:food('Сахар',0,0,100)
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
  // Everyday meals use our own instructions and the same per-ingredient nutrition model.
  const breakfast=['breakfast'],main=['lunch','dinner'];
  for(const [fruit,label] of [['banana','бананом'],['apple','яблоком'],['berries','ягодами']]){
    add('porridge-'+fruit,'Овсяная каша с '+label,breakfast,10,[['oats',65],['milk',200],[fruit,100],['curd',100]],'1. Залей хлопья молоком, добавь немного воды для нужной густоты.\n2. Вари на небольшом огне по времени на упаковке, помешивая.\n3. Добавь нарезанные фрукты или ягоды. Творог подай отдельно.');
    add('overnight-'+fruit,'Ленивая овсянка с '+label,breakfast,5,[['oats',60],['yogurt',200],[fruit,100],['nuts',10]],'1. Смешай хлопья с йогуртом в закрывающейся ёмкости.\n2. Оставь в холодильнике на ночь: 5 минут – активная готовка.\n3. Добавь фрукты или ягоды и орехи перед едой.');
    add('curd-pancakes-'+fruit,'Сырники с '+label,breakfast,25,[['curd',200],['egg',50],['flour',35],['oil',5],[fruit,100]],'1. Разомни творог, вмешай яйцо и муку. Если масса влажная, дай ей постоять.\n2. Сформируй небольшие сырники. Используй всё указанное масло.\n3. Готовь на умеренном огне под крышкой с двух сторон до готовности яиц. Подай с фруктами или ягодами, без неучтённых добавок.');
    add('curd-bake-'+fruit,'Творожная запеканка с '+label,breakfast,40,[['curd',220],['egg',50],['semolina',30],['milk',60],[fruit,100]],'1. Смешай творог, яйцо, молоко и манку. Оставь на 10 минут.\n2. Добавь нарезанные фрукты или ягоды, переложи в небольшую форму с пергаментом.\n3. Запекай при 180 °C до готовности, примерно 25–30 минут. Время зависит от толщины слоя и духовки.');
  }
  add('omelet-cheese','Омлет с сыром и тостами',breakfast,15,[['egg',150],['milk',80],['cheese',25],['bread',80],['vegetables',150],['oil',5]],'1. Взбей яйца с молоком.\n2. Вылей на сковороду с указанным маслом, добавь сыр. Готовь под крышкой на небольшом огне до полного схватывания.\n3. Подай с подсушенным хлебом и овощами.');
  add('omelet-curd','Омлет с творогом',breakfast,15,[['egg',100],['curd',120],['milk',60],['bread',80],['vegetables',150],['oil',5]],'1. Разомни творог и смешай с яйцами и молоком.\n2. Готовь на указанном масле под крышкой до полного схватывания.\n3. Подай с хлебом и овощами.');
  add('oat-pancake-cheese','Овсяноблин с сыром',breakfast,15,[['oats',55],['egg',100],['milk',70],['cheese',25],['vegetables',150],['oil',5]],'1. Смешай хлопья, яйца и молоко, оставь на 5 минут.\n2. Вылей на сковороду с указанным маслом. Готовь под крышкой до схватывания, затем переверни.\n3. Добавь сыр, сложи пополам и прогрей до готовности. Овощи подай отдельно.');
  add('oat-pancake-curd','Овсяноблин с творогом и бананом',breakfast,15,[['oats',55],['egg',50],['milk',70],['curd',150],['banana',100],['oil',5]],'1. Смешай хлопья, яйцо и молоко. Дай хлопьям размягчиться.\n2. Испеки блин с двух сторон на указанном масле до готовности яиц.\n3. На готовый блин положи творог и нарезанный банан.');
  add('rice-milk','Рисовая каша с молоком и творогом',breakfast,25,[['rice',65],['milk',200],['curd',150],['berries',100]],'1. Промой рис и отвари в воде почти до готовности.\n2. Добавь молоко и доведи на слабом огне до мягкости.\n3. Творог и ягоды подай отдельно.');
  add('millet-milk','Пшённая каша с молоком и творогом',breakfast,25,[['millet',65],['milk',200],['curd',150],['apple',100]],'1. Тщательно промой пшено горячей водой.\n2. Вари с водой до мягкости, добавь молоко и прогрей.\n3. Подай с творогом и яблоком.');
  add('buckwheat-eggs','Гречка с яйцами и овощами',breakfast,20,[['buckwheat',75],['egg',150],['vegetables',150],['oil',5]],'1. Промой гречку и отвари до готовности.\n2. Яйца свари или приготовь на указанном масле до готовности.\n3. Подай с овощами, масло добавь к крупе, если яйца варёные.');
  add('egg-cheese-toast','Тосты с яйцом и сыром',breakfast,15,[['bread',100],['egg',100],['cheese',25],['vegetables',150]],'1. Свари яйца до готовности.\n2. Подсуши хлеб, выложи ломтики яйца и сыр.\n3. Прогрей до расплавления сыра, подай с овощами.');
  add('curd-sandwich','Бутерброды с творогом и овощами',breakfast,5,[['bread',100],['curd',180],['vegetables',150],['oil',5]],'1. Разомни творог вилкой, при желании добавь зелень и соль.\n2. Намажь на хлеб, сверху положи овощи.\n3. Указанное масло используй для овощной заправки.');
  add('banana-pancakes','Банановые оладьи с творогом',breakfast,20,[['banana',120],['egg',100],['flour',40],['curd',120],['oil',5]],'1. Разомни банан, смешай с яйцами и мукой.\n2. Испеки небольшие оладьи на указанном масле на умеренном огне до готовности яиц.\n3. Творог подай отдельно.');
  add('curd-lazy-dumplings','Ленивые вареники из творога',breakfast,20,[['curd',200],['egg',50],['flour',45],['berries',100]],'1. Смешай творог, яйцо и муку в мягкое тесто.\n2. На рабочей поверхности раздели на маленькие кусочки. Учти всю муку, в том числе для поверхности.\n3. Отвари в слабо кипящей воде до готовности, ориентируйся на размер: после всплытия провари ещё 2–3 минуты. Подай с ягодами.');
  add('yogurt-breakfast','Йогурт с бананом, хлопьями и творогом',breakfast,5,[['yogurt',200],['oats',50],['curd',100],['banana',100]],'1. Смешай йогурт с хлопьями быстрого приготовления без варки.\n2. Дай им размягчиться по инструкции на упаковке.\n3. Добавь творог и банан.');
  for(const [protein,label] of [['chicken','Курица'],['turkey','Индейка'],['beef','Говядина'],['fish','Белая рыба']]){
    add(protein+'-simple-pasta',label+' с макаронами и овощами',main,30,[[protein,180],['pasta',85],['vegetables',200],['oil',10]],'1. Отвари макароны по инструкции.\n2. Нарежь мясо или рыбу, приготовь до полной готовности на указанном масле; при необходимости добавь воду и потуши.\n3. Подай с макаронами и овощами.');
    add(protein+'-simple-mash',label+' с картофельным пюре',main,35,[[protein,180],['potato',300],['milk',70],['vegetables',200],['oil',10]],'1. Отвари картофель, слей воду и разомни с тёплым молоком.\n2. Приготовь мясо или рыбу до полной готовности. Учти указанное масло.\n3. Подай с пюре и овощами.');
  }
  for(const [protein,label] of [['chicken','Куриные'],['turkey','Индюшиные']]){
    for(const [carb,side] of [['rice','рисом'],['buckwheat','гречкой']])add(protein+'-cutlets-'+carb,label+' котлеты с '+side,main,35,[[protein,180],['egg',50],['bread',25],[carb,75],['vegetables',200],['oil',5]],'1. Измельчи филе. Размочи часть хлеба в воде и добавь с яйцом к фаршу.\n2. Сформируй котлеты, приготовь с указанным маслом до полной готовности в духовке или на сковороде под крышкой.\n3. Отвари крупу и подай с котлетами и овощами.');
  }
  add('tuna-rice','Рис с тунцом и овощами',main,20,[['rice',85],['tuna',180],['vegetables',200],['oil',10]],'1. Отвари рис.\n2. Слей жидкость из тунца, взвесь съедобную часть.\n3. Смешай с рисом и овощами, заправь указанным маслом.');
  add('tuna-pasta','Макароны с тунцом',main,20,[['pasta',85],['tuna',180],['vegetables',200],['oil',10]],'1. Отвари макароны.\n2. Добавь тунец без жидкости и овощи, прогрей при желании.\n3. Заправь указанным маслом.');
  add('beans-rice','Фасоль с рисом и овощами',main,20,[['beans',220],['rice',70],['vegetables',200],['oil',10]],'1. Отвари рис.\n2. Используй уже сваренную фасоль без соуса: взвесь её без жидкости.\n3. Прогрей фасоль с овощами и указанным маслом, подай с рисом.');
  add('chicken-rice-soup','Куриный суп с рисом',main,40,[['chicken',180],['rice',60],['potato',150],['vegetables',200],['oil',5]],'1. Нарежь курицу и вари в воде до готовности.\n2. Добавь промытый рис, картофель и овощи. Вари до мягкости всех ингредиентов.\n3. Добавь указанное масло. Вода, соль и специи не меняют рассчитанные КБЖУ.');
  add('fish-potato-soup','Рыбный суп с картофелем',main,30,[['fish',220],['potato',300],['vegetables',200],['oil',10],['bread',60]],'1. Отвари картофель и овощи в воде.\n2. Добавь нарезанную рыбу и вари до полной готовности, проверь отсутствие костей.\n3. Добавь масло, подай с хлебом.');
  add('lentil-chicken-soup','Чечевичный суп с курицей',main,40,[['lentils',75],['chicken',160],['vegetables',200],['oil',10]],'1. Промой чечевицу.\n2. Нарежь курицу и овощи, вари с чечевицей до полной готовности.\n3. Добавь указанное масло. Густоту регулируй водой.');
  add('potato-eggs','Картофель с яйцами и овощами',main,25,[['potato',300],['egg',150],['vegetables',200],['oil',10]],'1. Отвари картофель и яйца до готовности.\n2. Нарежь овощи и заправь указанным маслом.\n3. Подай вместе, добавь зелень по вкусу.');
  add('kefir-banana','Кефир с бананом и тостами',['snack'],5,[['kefir',250],['banana',120],['bread',60]],'1. Нарежь банан.\n2. Подсуши хлеб без масла.\n3. Подай с кефиром.');
  add('curd-banana-snack','Творог с бананом и орехами',['snack'],5,[['curd',180],['banana',100],['nuts',10]],'1. Нарежь банан.\n2. Добавь к творогу и посыпь орехами.');
  add('tuna-sandwich','Бутерброд с тунцом',['snack'],5,[['tuna',120],['bread',80],['vegetables',100],['oil',5]],'1. Слей жидкость из тунца.\n2. Выложи рыбу и овощи на хлеб.\n3. Указанное масло добавь к овощам, не добавляй неучтённый майонез.');
  add('cheese-apple-snack','Сыр, яблоко и тосты',['snack'],5,[['cheese',35],['apple',150],['bread',60],['yogurt',150]],'1. Подсуши хлеб.\n2. Нарежь сыр и яблоко.\n3. Подай с йогуртом без сахара.');
  add('egg-snack','Варёные яйца с хлебом и овощами',['snack'],15,[['egg',100],['bread',65],['vegetables',100]],'1. Свари яйца до готовности, остуди и очисти.\n2. Подай с хлебом и овощами.');
  // Links show a related technique; linked recipe nutrition is never substituted for our portions.
  for(const r of recipes){
    let url;
    if(r.id.startsWith('curd-pancakes-'))url='https://www.russianfood.com/recipes/recipe.php?rid=170412';
    else if(r.id.startsWith('curd-bake-'))url='https://www.iamcook.ru/showrecipe/28351';
    else if(r.id.startsWith('overnight-'))url='https://www.iamcook.ru/showrecipe/4548';
    else if(r.id==='curd-lazy-dumplings')url='https://www.iamcook.ru/showrecipe/739';
    else if(r.id==='rice-milk')url='https://www.iamcook.ru/showrecipe/854';
    else if(r.id==='banana-pancakes')url='https://www.iamcook.ru/showrecipe/26817';
    else if(r.id==='oat-pancake-cheese')url='https://www.russianfood.com/recipes/recipe.php?rid=153338';
    else if(r.id==='omelet-cheese')url='https://www.iamcook.ru/showrecipe/12367';
    else if(r.id==='omelet-curd')url='https://www.iamcook.ru/showrecipe/11781';
    else if(r.id.startsWith('porridge-')||r.id==='milk-oats')url='https://www.iamcook.ru/showrecipe/7847';
    else if(r.id==='chicken-buckwheat')url='https://www.iamcook.ru/showrecipe/9604';
    if(url){r.guideUrl=url;r.guideSite=url.includes('russianfood')?'RussianFood':'Аймкук';}
  }
  const world=typeof module==='object'&&module.exports?require('./meal-recipes-data.js'):(root.UNVRSLWorldRecipes||[]);
  recipes.push(...world.map(r=>({...r,ingredients:[{id:r.id,g:100,min:50,max:250,step:5,sourceNutrition:r.portionNutrition}]})));
  const catalog={foods,recipes,version:2};
  if(typeof module==='object'&&module.exports)module.exports=catalog;
  root.UNVRSLMealCatalog=catalog;
})(typeof window!=='undefined'?window:globalThis);
