const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.UNVRSL_PLAYWRIGHT||'playwright');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=require('node:http').createServer((q,r)=>{try{const f=path.join(root,new URL(q.url,'http://local').pathname);r.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':'application/json');r.end(fs.readFileSync(f))}catch(_){r.statusCode=404;r.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.UNVRSL_CHROMIUM,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await page.goto(base+'/movement-lab.html');await page.waitForFunction(()=>window.__movementLab?.ready);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('#play').click();const paused=await page.evaluate(()=>window.__movementLab.phase);
  await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__movementLab.phase),paused);
  for(const [value,angle] of [[0,'8°'],[500,'120°'],[1000,'8°']]){
   await page.locator('#progress').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input'))},value);
   assert.equal(await page.locator('#angle').textContent(),angle);
  }
  const before=await page.evaluate(()=>Array.from(window.__movementLab.body.geometry.attributes.color.array));
  await page.locator('#highlight').uncheck();
  assert.notDeepEqual(await page.evaluate(()=>Array.from(window.__movementLab.body.geometry.attributes.color.array)),before);
  await page.locator('#highlight').check();await page.locator('[data-muscle=forearm]').click();
  assert.match(await page.locator('#muscle-note').textContent(),/Оранжевым/);
  for(const camera of ['side','back','front']){await page.locator(`[data-camera=${camera}]`).click();assert.match(await page.locator(`[data-camera=${camera}]`).getAttribute('class'),/selected/)}
  await page.locator('#speed').click();assert.equal(await page.locator('#speed').textContent(),'0.5×');
  await page.locator('#play').click();await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.__movementLab.playing),true);
  assert.deepEqual(errors,[]);
  await page.locator('#play').click();await page.locator('#progress').evaluate(el=>{el.value=400;el.dispatchEvent(new Event('input'))});
  await page.screenshot({path:'/tmp/movement-lab-mobile.png',fullPage:true});
  await page.locator('[data-camera=side]').click();await page.screenshot({path:'/tmp/movement-lab-side.png'});
  console.log('PASS: real skinned mesh, mobile layout, pause, scrubbing, color toggle, cameras, speed; no external requests.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
