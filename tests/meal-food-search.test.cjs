'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {normalize,createClient}=require('../meal-food-search.js');
const product={code:'12345678',product_name_ru:'Гречка',brands:'Моя марка',quantity:'500 g',nutriments:{'energy-kj_100g':1377,proteins_100g:13,fat_100g:2.6,carbohydrates_100g:68}};
test('OFF normalization keeps missing values missing, converts kJ and distinguishes ml',()=>{
 const p=normalize(product);assert.equal(p.raw.k,329.1);assert.equal(p.complete,true);assert.equal(p.unit,'g');assert.match(p.name,/Моя марка/);
 assert.equal(normalize({...product,nutriments:{fat_100g:0}}).raw.p,null);assert.equal(normalize({...product,nutriments:{fat_100g:0}}).complete,false);
 for(const quantity of ['1 л','500мл','1 l','500 ml'])assert.equal(normalize({...product,quantity}).unit,'ml',quantity);
 assert.equal(normalize({...product,code:'<script>'}),null);
 assert.equal(normalize({...product,nutriments:{'energy-kcal_100g':400,proteins_100g:90,fat_100g:40,carbohydrates_100g:0}}).complete,false);
});
test('explicit search, pagination, caching, barcode lookup and private query boundary',async()=>{
 const urls=[],client=createClient(async(url,options)=>{urls.push(url);assert.equal(options.credentials,'omit');return {ok:true,json:async()=>url.includes('/api/')?{status:1,product}:{products:[product],count:41}};});
 const a=await client.search('гречка');assert.equal(a.foods[0].id,'off-12345678');assert.equal(a.more,true);await client.search('гречка');assert.equal(urls.length,1);
 await client.search('гречка',2);assert.equal(new URL(urls[1]).searchParams.get('page'),'2');await client.search('12345678');assert.match(urls[2],/api\/v2\/product\/12345678/);
 assert.ok(urls.every(u=>!u.includes('account')&&!u.includes('target')));
 await assert.rejects(client.search('x'),/2 до 100/);await assert.rejects(client.search('food',21),/страница/);
});
test('rate cap and unavailable responses are actionable',async()=>{
 const client=createClient(async()=>({ok:false,status:429}));for(let i=0;i<8;i++)await assert.rejects(client.search('food '+i),/минуту/);await assert.rejects(client.search('another'),/Слишком много/);
});
