/* Actual historical service-worker upgrades, local-only. HTTP caching remains enabled. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {execFileSync}=require('node:child_process');
let playwright;
try{playwright=require('playwright')}catch{playwright=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules','playwright'))}
const root=path.resolve(__dirname,'..'),scope='/Men-with-purpose/';
const versions={v6:'f4b9de5',v7:'7abaf84',v8:'c6a514f',v9:'efe5da6'};
const sourceCache=new Map(),requests=[],results=[];
let release='v6',failAsset='',future=false;
function source(name){
  if(name==='cloud-config.js')return Buffer.from('window.MOP_CLOUD={};'); // Never use the live account backend.
  let value;
  if(versions[release]){
    const key=release+':'+name;
    if(!sourceCache.has(key))sourceCache.set(key,execFileSync('git',['show',versions[release]+':'+name],{cwd:root,maxBuffer:20*1024*1024}));
    value=sourceCache.get(key);
  }else value=fs.readFileSync(path.join(root,name));
  if(future&&(name.endsWith('.js')||name==='index.html'))value=Buffer.from(value.toString().replaceAll('men-of-purpose-v11-short-readings-graphics','men-of-purpose-v12-upgrade-test'));
  return value;
}
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://local').pathname;
  if(!pathname.startsWith(scope)){res.writeHead(404).end();return}
  const name=pathname.slice(scope.length)||'index.html';
  requests.push({release,name,cacheControl:req.headers['cache-control']||'',pragma:req.headers.pragma||''});
  if(name===failAsset){res.writeHead(503,{'Cache-Control':'no-store'}).end('Deliberate local install failure');return}
  if(name.split('/').includes('..')){res.writeHead(403).end();return}
  try{
    const body=source(name),type={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'}[path.extname(name)]||'application/octet-stream';
    // Long-lived HTTP cache deliberately exposes releases that precache stale bytes.
    res.writeHead(200,{'Content-Type':type,'Cache-Control':name==='sw.js'?'no-store':'public,max-age=31536000'}).end(body);
  }catch{res.writeHead(404,{'Cache-Control':'no-store'}).end()}
});
async function waitVersion(page,version){
  const deadline=Date.now()+30000;
  while(Date.now()<deadline){
    const matched=await page.evaluate(async expected=>{
    if(!navigator.serviceWorker.controller)return false;
    const c=new MessageChannel();
    return new Promise(resolve=>{const timer=setTimeout(()=>resolve(false),500);c.port1.onmessage=e=>{clearTimeout(timer);c.port1.close();resolve(e.data?.version===expected)};navigator.serviceWorker.controller.postMessage({type:'MOP_OFFLINE_STATUS',version:expected},[c.port2])});
    },version);
    if(matched)return;
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw Error('Worker did not activate '+version);
}
async function stores(page){return page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>/^mop-v1-(journalEntries|completed|bookmarks)$|^mop-account-qa-/.test(k)).sort()))}
async function seed(page){
  await page.evaluate(()=>{
    localStorage.setItem('mop-v1-journalEntries',JSON.stringify([{id:'upgrade-prayer',text:'Private prayer retained through upgrade.',date:'2026-10-17T00:00:00Z',answered:false}]));
    localStorage.setItem('mop-v1-completed','[1,2,3]');
    localStorage.setItem('mop-v1-bookmarks',JSON.stringify([{book:'John',chapter:1,verse:1,text:'In the beginning was the Word'}]));
    localStorage.setItem('mop-account-qa-journalEntries','[{"id":"account-private","text":"Keep this account journal"}]');
    localStorage.setItem('mop-account-qa-completed','[7,8]');
  });
  return stores(page);
}
async function check(name,fn){await fn();results.push(name);console.log('PASS: '+name)}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`,url=origin+scope;
  const executablePath=process.env.QA_CHROMIUM_EXECUTABLE;
  const browser=await playwright.chromium.launch({headless:true,...(executablePath?{executablePath}:{}),args:['--no-sandbox']});
  try{
    for(const old of ['v6','v7','v8','v9'])await check(`${old} upgrade bypasses fresh HTTP cache, preserves private data and complete offline Bible`,async()=>{
      release=old;future=false;failAsset='';
      const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
      const external=[];page.on('request',request=>{if(new URL(request.url()).origin!==origin)external.push(request.url())});
      try{
        await page.goto(url,{waitUntil:'networkidle'});
        const oldVersion={v6:'men-of-purpose-v6-web-community-review',v7:'men-of-purpose-v7-youtube-worship',v8:'men-of-purpose-v8-reliable-updates',v9:'men-of-purpose-v9-daily-calendar'}[old];
        await waitVersion(page,oldVersion);
        assert.match(await page.locator('.mop-listen').innerText(),old==='v6'?/Apple Music/:/YouTube/);
        const before=await seed(page);
        await page.evaluate(()=>tab('journal'));
        await page.locator('#journalText').fill('Unsaved writing must not be interrupted.');
        const count=requests.length;
        release='new';
        await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()});
        await waitVersion(page,'men-of-purpose-v11-short-readings-graphics');
        // Claiming a new worker does not replace an old page's running JavaScript.
        assert.equal(await page.locator('#journalText').inputValue(),'Unsaved writing must not be interrupted.');
        assert.deepEqual(await stores(page),before);
        await page.evaluate(()=>tab('home'));
        assert.match(await page.locator('.mop-listen').innerText(),old==='v6'?/Apple Music/:/YouTube/);
        assert(requests.slice(count).some(r=>r.release==='new'&&r.name==='mop-experience.js'),'New worker must actually fetch new music bytes despite one-year HTTP cache: '+JSON.stringify(requests.slice(count)));
        await page.reload({waitUntil:'networkidle'});
        assert.match(await page.locator('.mop-listen').innerText(),/YouTube/);
        assert.match(await page.locator('.mop-listen').getAttribute('href'),/^https:\/\/www.youtube.com\/watch\?v=/);
        assert.equal(await page.evaluate(()=>typeof MOPUpdates),'object');
        assert.deepEqual(await stores(page),before);
        await context.setOffline(true);
        await page.reload({waitUntil:'domcontentloaded'});
        await page.evaluate(()=>{bibleBook='Revelation';bibleChapter=22;tab('bible')});
        await page.locator('#bibleText .chapter-verse').first().waitFor();
        const coverage=await page.evaluate(async()=>{
          const data=await MOPBible.dataset();let chapters=0,verses=0;
          for(const [book,value]of Object.entries(data.books))for(const chapter of Object.keys(value.chapters)){const p=await MOPBible.passage(`${book} ${chapter}`);chapters++;verses+=p.verses.length}
          return{books:Object.keys(data.books).length,chapters,verses,ready:await MOPBible.offlineReady()};
        });
        assert.deepEqual(coverage,{books:66,chapters:1189,verses:31103,ready:true});
        assert.deepEqual(await stores(page),before);
        assert.deepEqual(external,[]);
      }finally{await context.close()}
    });
    await check('New release offers safe update, protects unsaved writing and refreshes only after saving',async()=>{
      release='new';future=false;failAsset='';
      const context=await browser.newContext(),page=await context.newPage();
      try{
        await page.goto(url,{waitUntil:'networkidle'});await waitVersion(page,'men-of-purpose-v11-short-readings-graphics');
        assert.equal(await page.locator('#mop-update-banner').count(),0,'First installation must not show an update banner');
        const before=await seed(page);
        await page.evaluate(()=>tab('journal'));
        await page.locator('#journalText').fill('Unfinished update-safe prayer.');
        await page.evaluate(()=>{window.__upgradeDocument='original'});
        future=true;
        await page.evaluate(()=>MOPUpdates.check(true));
        await waitVersion(page,'men-of-purpose-v12-upgrade-test');
        await page.locator('#mop-update-refresh').waitFor();
        assert.equal(await page.locator('#journalText').inputValue(),'Unfinished update-safe prayer.');
        assert.equal(await page.evaluate(()=>window.__upgradeDocument),'original');
        await page.locator('#mop-update-refresh').click();
        assert.match(await page.locator('#mop-update-banner-status').innerText(),/Save your writing before refreshing/i);
        assert.equal(await page.locator('#journalText').inputValue(),'Unfinished update-safe prayer.');
        assert.deepEqual(await stores(page),before);
        await page.getByRole('button',{name:'Save journal entry',exact:true}).click();
        assert((await page.locator('.journal-entry').first().innerText()).includes('Unfinished update-safe prayer.'));
        const afterSave=await stores(page);
        await page.locator('#mop-update-refresh').click();
        await page.waitForFunction(()=>window.__upgradeDocument===undefined);
        await page.locator('.mop-listen').waitFor();
        assert.match(await page.locator('.mop-listen').innerText(),/YouTube/);
        assert.deepEqual(await stores(page),afterSave);
        await page.evaluate(()=>tab('more'));
        await page.locator('#mop-check-updates').click();
        await page.locator('#mop-update-status').waitFor();
      }finally{future=false;await context.close()}
    });
    await check('Failed update retains previous coherent shell and saved journal',async()=>{
      release='v6';future=false;failAsset='';
      const context=await browser.newContext(),page=await context.newPage();
      try{
        await page.goto(url,{waitUntil:'networkidle'});await waitVersion(page,'men-of-purpose-v6-web-community-review');
        const before=await seed(page);
        release='new';failAsset='mop-updates.js';
        await page.evaluate(async()=>{
          const r=await navigator.serviceWorker.getRegistration();
          const failed=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Failed worker did not become redundant')),20000);r.addEventListener('updatefound',()=>{const worker=r.installing;worker.addEventListener('statechange',()=>{if(worker.state==='redundant'){clearTimeout(timer);resolve()}})},{once:true})});
          await r.update();await failed;
        });
        await waitVersion(page,'men-of-purpose-v6-web-community-review');
        await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});
        assert.match(await page.locator('.mop-listen').innerText(),/Apple Music/);
        assert.deepEqual(await stores(page),before);
        assert.equal(await page.evaluate(()=>MOPBible.offlineReady()),true);
      }finally{failAsset='';await context.close()}
    });
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
  console.log(`${results.length} actual historical upgrade checks passed.`);
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
