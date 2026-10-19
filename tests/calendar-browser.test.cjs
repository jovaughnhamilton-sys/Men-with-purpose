'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://local').pathname;
 const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 if(file.endsWith('cloud-config.js'))return res.writeHead(200,{'Content-Type':'application/javascript'}).end('window.MOP_CLOUD={};');
 fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':{'.js':'application/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream'}).end(data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,...(process.env.QA_CHROMIUM_EXECUTABLE?{executablePath:process.env.QA_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox']});
 try{
  for(const width of [320,390,1280]){
   const context=await browser.newContext({viewport:{width,height:844},timezoneId:'America/New_York'});
   await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.clock.setFixedTime(new Date('2026-10-18T23:59:00-04:00'));
   await page.goto(origin,{waitUntil:'networkidle'});
   assert.match(await page.locator('#daily-devotional-card').innerText(),/Hearing With Understanding/);
   await page.clock.setFixedTime(new Date('2026-10-19T00:01:00-04:00'));
   await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
   assert.match(await page.locator('#daily-devotional-card').innerText(),/An Honest Shared Memory/);
   await page.evaluate(()=>put('completed',[1,2,3]));
   await page.getByRole('button',{name:'Start today’s devotional →',exact:true}).click();
   await page.locator('#devotionalBible .scripture').waitFor();
   assert.match(await page.locator('#content').innerText(),/You do not have to edit your story/);
   await page.locator('#dailyReflection').fill('Private calendar reflection <img src=x onerror=alert(1)>');
   // A date change must not destroy a reflection currently being written.
   await page.clock.setFixedTime(new Date('2026-10-20T00:01:00-04:00'));
   await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
   assert.match(await page.locator('#dailyReflection').inputValue(),/Private calendar reflection/);
   await page.locator('#daily-save').click();
   await page.locator('#daily-save-status').getByText('Reflection saved in your private journal.').waitFor();
   assert.deepEqual(await page.evaluate(()=>completed()),[1,2,3]);
   assert.equal(await page.evaluate(()=>journal()[0].devotionalDate),'2026-10-19');
   await page.locator('#daily-next').click();
   await page.locator('#devotionalBible .scripture').waitFor();
   assert.match(await page.locator('#content').innerText(),/Commitment With Specifics/);
   await page.locator('#daily-prev').click();
   assert.match(await page.locator('#dailyReflection').inputValue(),/Private calendar reflection/);
   assert.equal(await page.locator('#dailyReflection img').count(),0);
   await page.evaluate(()=>MOPDaily.browse());await page.locator('#daily-month').selectOption('11');
   assert.equal(await page.locator('[data-daily-date]').count(),31);
   await page.locator('[data-daily-date="2026-12-25"]').click();
   await page.locator('#devotionalBible .scripture').waitFor();
   assert.match(await page.locator('#content').innerText(),/Good News of Great Joy/);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.waitForFunction(async()=>await MOPBible.offlineReady());
   await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});
   await page.evaluate(()=>MOPDaily.open('2027-03-28'));
   await page.locator('#devotionalBible .scripture').waitFor();
   assert.match(await page.locator('#content').innerText(),/He Is Risen/);
   assert.deepEqual(errors,[]);
   if(width===390)await page.screenshot({path:'/tmp/mop-daily-mobile.png',fullPage:true});
   await context.close();console.log(`PASS: ${width}px midnight rollover, annual reader, private reflections, month browser, Christmas, and offline Easter`);
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
