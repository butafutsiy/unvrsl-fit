'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),server=require('node:http').createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end()}try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({headless:true,executablePath:process.env.UNVRSL_CHROMIUM||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 await page.addInitScript(()=>{const dates=[21,14,7,0].map(offset=>{const d=new Date();d.setDate(d.getDate()-offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`});localStorage.setItem('unvrsl-fit-v3',JSON.stringify({theme:'light',accent:'#bf5af2',bw:[],week:1,body:'male',sessions:dates.map((date,i)=>({id:'demo'+i,date,started:Date.parse(date+'T12:00:00'),ended:Date.parse(date+'T13:00:00'),ex:[{n:'Жим лёжа',loadType:'external_total',set:[{w:100+5*i,r:5,actualReps:5,actualRpe:9,rpe:9,ok:true}]}]}))}))});
 await page.goto(base);await page.waitForFunction(()=>window.__unvrslStartupComplete);await page.evaluate(()=>nav('stats'));
 await page.locator('.strength-overview').waitFor();assert.equal(await page.locator('.strength-exercise').count(),1);
 assert.equal(await page.locator('.strength-exercise .strength-chart').count(),1);
 assert.equal(await page.locator('.strength-line').count(),2);
 await page.getByRole('button',{name:'Рабочий вес',exact:true}).click();assert.equal(await page.locator('.strength-line.e1').count(),0);
 await page.getByRole('button',{name:'1ПМ',exact:true}).click();assert.equal(await page.locator('.strength-line.maxWeight').count(),0);
 await page.getByRole('button',{name:'Оба',exact:true}).click();assert.equal(await page.locator('.strength-line').count(),2);
 await page.locator('.strength-record').last().click();assert.match(await page.locator('.strength-focus').innerText(),/100 кг/);
 await page.locator('.strength-chart .strength-marker.maxWeight').last().click();assert.match(await page.locator('.strength-focus').innerText(),/115 кг/);
 await page.locator('.strength-history>summary').click();await page.locator('.strength-session select').selectOption('0');assert.equal(await page.locator('.strength-session select').inputValue(),'0');
 await page.locator('.strength-chart .strength-marker.maxWeight').last().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.strength-session select').inputValue(),'3');
 await page.locator('.strength-history>summary').click();
 await page.locator('.strength-overview').screenshot({path:'/tmp/strength-light.png'});
 await page.getByRole('button',{name:'Ноги',exact:true}).click();assert.match(await page.locator('.strength-overview').innerText(),/нет выполненных/);
 await page.getByRole('button',{name:'Грудь',exact:true}).click();await page.getByRole('button',{name:'7 дней',exact:true}).click();assert.match(await page.locator('.strength-overview').innerText(),/Мало данных/);
 await page.getByRole('button',{name:'Всё',exact:true}).click();
 await page.evaluate(()=>{st.theme='dark';st.accent='#ff9500';applyTheme();applyAccent();save()});
 await page.setViewportSize({width:320,height:740});await page.locator('.strength-overview').screenshot({path:'/tmp/strength-dark.png'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('PASS: real app, three chart modes, synchronized marker/chip/select/keyboard, muscle/period filters, light/dark and 320px viewport, no page errors.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
