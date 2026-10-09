'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,GlobalFonts,Image}=require(process.env.UNVRSL_CANVAS||'@napi-rs/canvas');
const A=require('../workout-domain'),reg=A.registry([]);
for(const [file,name] of [['DejaVuSans.ttf','Arial'],['DejaVuSans-Bold.ttf','Arial']])GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/'+file,name);
const artworkDraws=[],canvases=[],sent=[],drawn=[],els={sp264Status:{},sp264Preview:{previousElementSibling:{remove(){}}},sp264Save:{},sp264Share:{},sheet:{}};
const document={head:{appendChild(){}},getElementById:id=>els[id]||null,createElement:tag=>{
 if(tag!=='canvas')return{};
 const c=createCanvas(1080,1920),ctx=c.getContext('2d'),fill=ctx.fillText.bind(ctx);
 const drawImage=ctx.drawImage.bind(ctx);ctx.drawImage=(image,...args)=>{artworkDraws.push(image);return drawImage(image,...args)};
 ctx.fillText=(value,...args)=>{drawn.push(String(value));return fill(value,...args)};
 c.toBlob=callback=>callback(new Blob([c.toBuffer('image/png')],{type:'image/png'}));canvases.push(c);return c;
}};
const names=['Тяга верхнего блока параллельным хватом','Отведение рук с гантелями в стороны','Тяга рычажная снизу вверх','Жим штанги лёжа на наклонной скамье','Сгибание рук со штангой','Y-подъёмы на наклонной скамье','Отжимания на брусьях','Подтягивания','Разгибание локтя с тросом'];
const session={id:'story',date:'2026-10-09',name:'Верх тела · тяжёлая тренировка',started:Date.parse('2026-10-09T08:00:00Z'),ended:Date.parse('2026-10-09T09:11:00Z'),ex:names.map((n,i)=>({n,loadType:'external_total',set:Array.from({length:3},()=>({w:50+i*5,r:10,rpe:8,ok:true}))}))};
const win={WorkoutDomain:A,st:{sessions:[session],accent:'#ff9500'},modal(){},addEventListener(){}};
class LocalImage extends Image{set src(value){super.src=fs.readFileSync(path.join(__dirname,'..',value))}get src(){return super.src}}
const scope={Image:LocalImage,clearTimeout(){},window:win,document,workoutRegistry:reg,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},File,Blob,console,requestAnimationFrame:fn=>fn(),setInterval:()=>0,setTimeout:()=>0,clearInterval(){},navigator:{userAgent:'iPhone',canShare:()=>true,share:payload=>{sent.push(payload);return Promise.resolve()}}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','share-progress-template.js'),'utf8'),scope);
const settle=async()=>{await new Promise(r=>setImmediate(r));for(let i=0;i<100&&els.sp264Save.disabled;i++)await new Promise(r=>setTimeout(r,10));assert.equal(els.sp264Save.disabled,false,'PNG preparation completes')};
(async()=>{
 const layouts=['poster','minimal','exercises','record','tonnage','progress'];
 const output=process.env.UNVRSL_STORY_PREVIEWS;if(output)fs.mkdirSync(output,{recursive:true});
 win.openShareProgressV264(session);await settle();
 for(const design of ['basic','graphic']){
 win.shareProgressDesignV472(design);await settle();
 for(const layout of layouts){
  win.shareProgressLayoutV471(layout);await settle();
  for(const mode of ['transparent','background']){
   win.shareProgressModeV264(mode);await settle();const c=canvases.at(-1);
   assert.equal(c.width,1080);assert.equal(c.getContext('2d').getImageData(0,0,1,1).data[3],mode==='background'?255:0);
   if(mode==='background')assert.equal(c.height,1920);else assert.ok(c.height<=1920);
   win.shareProgressNativeV264();assert.equal(sent.at(-1).files[0].type,'image/png');assert.match(sent.at(-1).files[0].name,new RegExp(layout+'-'+mode+'-'+design));
   if(mode==='transparent'){const ctx=c.getContext('2d');assert.equal(ctx.getImageData(540,10,1,1).data[3],0,'no top backdrop');assert.equal(ctx.getImageData(10,Math.floor(c.height/2),1,1).data[3],0,'no side backdrop');assert.equal(ctx.shadowBlur,0,'no blurred halo')}
   if(output)fs.writeFileSync(path.join(output,design+'-'+layout+'-'+mode+'.png'),c.toBuffer('image/png'));
  }
 }
 }
 assert.equal(sent.length,24);assert.ok(artworkDraws.length>=4,'generated artwork is loaded and rendered in PNG exports');assert.ok(drawn.some(t=>t.startsWith('Тяга верхнего блока')));assert.ok(drawn.some(t=>t.includes('сумма нагрузки')));
 assert.ok(!drawn.includes('НОВЫЙ РЕКОРД'),'a first workout must not invent a record');
 win.shareProgressLayoutV471('record');await settle();const beforeSelection=drawn.length;win.shareProgressExerciseV471('жим штанги лежа на наклонной скамье|');await settle();assert.ok(drawn.slice(beforeSelection).some(t=>t.startsWith('Жим штанги лёжа')));
 const last=canvases.length;win.shareProgressLayoutV471('invalid');assert.equal(canvases.length,last);
 session.ex.push(...Array.from({length:8},(_,i)=>({n:'Дополнительное упражнение '+i,set:[{w:20,r:10,ok:true}]})));
 win.shareProgressLayoutV471('exercises');await settle();assert.ok(drawn.some(t=>t==='Ещё 5 упражнений в журнале'));
 for(const [tonnage,reference] of [[30000,'Вагон ≈ 30 000 кг'],[3000,'Автомобиль ≈ 1 500 кг'],[200,'Один блин = 20 кг']]){session.advancedMetrics={tonnage};win.shareProgressLayoutV471('tonnage');await settle();assert.ok(drawn.includes(reference));}
 console.log('PASS: six layouts × two designs × two backgrounds, real PNGs, transparent alpha, 9:16 backgrounds, native share filenames, no invented PR, long exercise list overflow.');
})().catch(e=>{console.error(e);process.exitCode=1});
