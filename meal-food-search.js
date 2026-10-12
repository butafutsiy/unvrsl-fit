'use strict';
(function(root){
  const fields='code,product_name,product_name_ru,brands,nutriments,nutrition_data_per,serving_size,quantity,categories_tags';
  const numeric=v=>v!==undefined&&v!==null&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
  function normalize(p){
    if(!p||!/^\d{4,24}$/.test(String(p.code||'')))return null;
    const n=p.nutriments||{},raw={k:numeric(n['energy-kcal_100g']),p:numeric(n.proteins_100g),f:numeric(n.fat_100g),c:numeric(n.carbohydrates_100g)};
    if(raw.k===null&&numeric(n['energy-kj_100g'])!==null)raw.k=Math.round(Number(n['energy-kj_100g'])/4.184*10)/10;
    const complete=Object.values(raw).every(v=>v!==null)&&raw.k<=1000&&raw.p+raw.f+raw.c<=100.5;
    const volume=/(?:^|[\s\d])(?:ml|cl|мл|l|л)(?:$|\s)/i.test(String(p.quantity||'')+' '+String(p.serving_size||''))||String(p.nutrition_data_per||'').includes('ml')||(p.categories_tags||[]).some(t=>['en:beverages','en:milks'].includes(t));
    const code=String(p.code),brand=Array.isArray(p.brands)?p.brands.join(', '):String(p.brands||''),title=String(p.product_name_ru||p.product_name||'Продукт '+code).slice(0,100);
    return {key:'off:'+code,id:'off-'+code,name:(title+(brand?' · '+brand:'' )).slice(0,120),raw,complete,unit:volume?'ml':'g',source:'Open Food Facts',sourceInfo:{provider:'openfoodfacts',code,url:'https://world.openfoodfacts.org/product/'+code,license:'ODbL',unitEstimated:volume&&!String(p.nutrition_data_per||'').includes('ml'),fetchedAt:new Date().toISOString()}};
  }
  function createClient(fetcher=root.fetch?.bind(root),clock=()=>Date.now()){
    const cache=new Map(),requests=[];
    async function get(url,kind,signal){
      const saved=cache.get(url);if(saved&&clock()-saved.at<3600000)return saved.data;
      const now=clock();while(requests.length&&now-requests[0].at>=60000)requests.shift();
      if(requests.filter(r=>r.kind===kind).length>=(kind==='search'?8:12))throw Error('Слишком много запросов. Подожди минуту и повтори.');
      if(!fetcher)throw Error('Онлайн-поиск недоступен в этом браузере');
      requests.push({at:now,kind});
      const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)controller.abort();
      const timer=setTimeout(abort,15000);
      try{const response=await fetcher(url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw Error(response.status===429?'База ограничила запросы. Повтори через минуту.':'База продуктов временно недоступна. Попробуй позже.');const data=await response.json();cache.set(url,{at:clock(),data});if(cache.size>60)cache.delete(cache.keys().next().value);return data;}
      catch(err){if(signal?.aborted)throw err;if(err.name==='AbortError')throw Error('База долго отвечает. Попробуй ещё раз.');throw err;}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
    }
    return {
      async search(query,page=1,signal){query=String(query||'').trim();if(query.length<2||query.length>100)throw Error('Введи от 2 до 100 символов');if(!Number.isInteger(page)||page<1||page>20)throw Error('Некорректная страница');
        if(/^\d{8,14}$/.test(query)){const food=await this.product(query,signal);return {foods:food?[food]:[],more:false};}
        const params=new URLSearchParams({search_terms:query,json:'1',page_size:'20',page:String(page),fields,lc:'ru',app_name:'UNVRSLFIT',app_version:'498'});
        const d=await get('https://world.openfoodfacts.org/cgi/search.pl?'+params,'search',signal);
        if(!Array.isArray(d.products))throw Error('База вернула неожиданный ответ');
        return {foods:d.products.map(normalize).filter(Boolean),more:page<20&&Number(d.count)>page*20};
      },
      async product(code,signal){if(!/^\d{4,24}$/.test(String(code)))throw Error('Проверь штрихкод');const d=await get('https://world.openfoodfacts.org/api/v2/product/'+code+'?'+new URLSearchParams({fields,app_name:'UNVRSLFIT',app_version:'498'}),'product',signal);return d.status===0?null:normalize(d.product);}
    };
  }
  const api={normalize,createClient};if(typeof module==='object'&&module.exports)module.exports=api;else root.UNVRSLFoodSearch=api;
})(typeof window==='object'?window:globalThis);
