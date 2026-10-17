const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(base,'bible/web.json')));
function loader(fetch){const ctx={fetch,URL,document:{baseURI:'https://example.org/subpath/'}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(base,'mop-bible.js'),'utf8'),ctx);return ctx.MOPBible}
test('pinned source and reader hashes; full canonical coverage',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(base,'bible/provenance.json')));
 for(const [file,key]of [['bible/web.json','dataset_sha256'],['bible/sources/eng-web_usfx.zip','archive_sha256'],['bible/sources/eng-web_vpl.zip','verse_archive_sha256']])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(base,file))).digest('hex'),manifest[key]);
 assert.equal(Object.keys(data.books).length,66);
 assert.equal(Object.values(data.books).reduce((n,b)=>n+Object.keys(b.chapters).length,0),1189);
 assert.equal(Object.values(data.books).reduce((n,b)=>n+Object.values(b.chapters).reduce((n,c)=>n+Object.keys(c).length,0),0),31103);
 assert.equal(data.books.Genesis.chapters[1][1],'In the beginning, God created the heavens and the earth.');
 assert.equal(data.books.John.chapters[1][1],'In the beginning was the Word, and the Word was with God, and the Word was God.');
 assert.ok(data.books.Psalms.chapters[3][1].startsWith('A Psalm by David'));
 assert.ok(!data.books.Psalms.chapters[119][1].includes('BETH'));
 assert.ok(data.books.Psalms.chapters[119][8].endsWith('BETH'));
 assert.equal(data.books.Luke.chapters[17][36],'');assert.ok(data.books.Luke.notes['17:36'].length);
});
test('every canonical chapter and verse is addressable; aliases and ranges',async()=>{
 let calls=0;const api=loader(async url=>{calls++;assert.equal(url.href,'https://example.org/subpath/bible/web.json');return{ok:true,json:async()=>data}});
 for(const [book,b]of Object.entries(data.books))for(const [chapter,c]of Object.entries(b.chapters)){
  const result=await api.passage(`${book} ${chapter}`);assert.equal(result.verses.length,Object.keys(c).length);
  for(const v of result.verses)assert.equal(v.text,c[v.verse]);
 }
 assert.equal(calls,1);assert.equal((await api.passage('Psalm 23:1')).verses.length,1);
 assert.equal((await api.passage('Proverbs 3:5–6')).verses.length,2);
 assert.equal((await api.passage('Matthew 5:14—16')).verses.length,3);
 for(const ref of ['John 0','John 22','John 1:0','John 1:900','John 1:8-2','Fake 1','John 1:1-2:3'])await assert.rejects(api.passage(ref));
});
test('shared request and retry after failed download',async()=>{
 let calls=0;const api=loader(async()=>{calls++;if(calls===1)throw Error('offline');return{ok:true,json:async()=>data}});
 await assert.rejects(api.passage('John 1'));
 const results=await Promise.all([api.passage('John 1'),api.passage('Genesis 1')]);assert.equal(calls,2);assert.equal(results.length,2);
});
test('missing/corrupt dataset produces recoverable failures',async()=>{
 await assert.rejects(loader(async()=>({ok:false})).passage('John 1'));
 await assert.rejects(loader(async()=>({ok:true,json:async()=>({books:{}})})).passage('John 1'));
});
test('Scripture UI ignores stale results and removed elements; Retry preserves request',async()=>{
 const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
 const code=html.slice(html.indexOf('async function loadBible('),html.indexOf('\nfunction bibleSelect'));
 const pending=[];let renders=0,tracks=0;
 function element(){return{innerHTML:'',attrs:{},children:[],setAttribute(k,v){this.attrs[k]=v},prepend(){},append(...nodes){this.children.push(...nodes)},replaceChildren(){this.children=[]}}}
 let node=element();
 const ctx={document:{getElementById:()=>node,createElement:()=>element()},MOPBible:{passage:ref=>new Promise((resolve,reject)=>pending.push({ref,resolve,reject}))},renderBibleText:()=>renders++,trackReading:()=>tracks++,esc:s=>s};
 vm.createContext(ctx);vm.runInContext(code,ctx);
 const payload=text=>({verses:[{verse:1,text}],notes:[],superscriptions:[]});
 const old=ctx.loadBible('John 1'),latest=ctx.loadBible('John 2');
 pending[1].resolve(payload('latest'));await latest;pending[0].resolve(payload('old'));await old;
 assert.equal(renders,1);assert.equal(tracks,1);assert.equal(ctx.currentRef,'John 2');
 const removed=ctx.loadBible('John 3');node=element();pending[2].resolve(payload('removed'));await removed;assert.equal(renders,1);
 const failed=ctx.loadBible('John 4');pending[3].reject(Error('offline'));await failed;
 assert.equal(node.attrs['aria-busy'],'false');assert.equal(node.children[1].textContent,'Retry');
 const retry=node.children[1].onclick();assert.equal(pending[4].ref,'John 4');pending[4].resolve(payload('retry'));await retry;assert.equal(renders,2);
});
test('service worker caches complete shell, scopes deletion, and never substitutes HTML for data',async()=>{
 const handlers={},deleted=[],cacheEntries=new Map();let network=0,added;
 const cache={addAll:async assets=>{added=assets},match:async request=>cacheEntries.get(typeof request==='string'?request:request.url),put:async()=>{}};
 const ctx={URL,Set,Promise,fetch:async()=>{network++;return{ok:false}},caches:{open:async()=>cache,keys:async()=>['another-app','men-of-purpose-v5-accounts','men-of-purpose-v6-web-community-review'],delete:async key=>deleted.push(key)},self:{registration:{scope:'https://example.org/app/'},location:{origin:'https://example.org'},skipWaiting:async()=>{},clients:{claim:async()=>{}},addEventListener:(name,handler)=>handlers[name]=handler}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(base,'sw.js'),'utf8'),ctx);
 let wait;handlers.install({waitUntil:p=>wait=p});await wait;assert.ok(added.includes('./bible/web.json'));
 handlers.activate({waitUntil:p=>wait=p});await wait;assert.deepEqual(deleted,['men-of-purpose-v5-accounts']);
 const shell={kind:'html'};cacheEntries.set('./index.html',shell);let response;
 handlers.fetch({request:{method:'GET',url:'https://example.org/app/',mode:'navigate'},respondWith:p=>response=p});assert.equal(await response,shell);
 response=null;handlers.fetch({request:{method:'GET',url:'https://example.org/app/missing.js'},respondWith:p=>response=p});assert.equal(response,null);
 response=null;handlers.fetch({request:{method:'GET',url:'https://supabase.example/auth'},respondWith:p=>response=p});assert.equal(response,null);
 handlers.fetch({request:{method:'GET',url:'https://example.org/app/bible/web.json'},respondWith:p=>response=p});assert.equal((await response).ok,false);assert.equal(network,1);
});
test('offline readiness requires current controller handshake and complete current cache',async()=>{
 const script=fs.readFileSync(path.join(base,'mop-bible.js'),'utf8');
 function api(reply){
   class Channel{constructor(){this.port1={close(){},onmessage:null};this.port2={postMessage:data=>this.port1.onmessage({data})}}}
   const ctx={navigator:{serviceWorker:{}},MessageChannel:Channel,setTimeout,clearTimeout};
   if(reply)ctx.navigator.serviceWorker.controller={postMessage:(data,ports)=>{assert.equal(data.type,'MOP_OFFLINE_STATUS');ports[0].postMessage(reply)}};
   vm.createContext(ctx);vm.runInContext(script,ctx);return ctx.MOPBible;
 }
 assert.equal(await api().offlineReady(),false);
 assert.equal(await api({version:'old-release',ready:true}).offlineReady(),false);
 assert.equal(await api({version:'men-of-purpose-v6-web-community-review',ready:false}).offlineReady(),false);
 assert.equal(await api({version:'men-of-purpose-v6-web-community-review',ready:true}).offlineReady(),true);
 const handlers={};let available=true,result,wait;
 const ctx={URL,Set,Promise,caches:{open:async()=>({match:async path=>available?{ok:true}:path==='./bible/web.json'?undefined:{ok:true}})},self:{registration:{scope:'https://example.org/app/'},addEventListener:(name,fn)=>handlers[name]=fn}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(base,'sw.js'),'utf8'),ctx);
 const request=version=>({data:{type:'MOP_OFFLINE_STATUS',version},ports:[{postMessage:data=>result=data}],waitUntil:p=>wait=p});
 handlers.message(request('men-of-purpose-v6-web-community-review'));await wait;assert.equal(result.ready,true);
 available=false;handlers.message(request('men-of-purpose-v6-web-community-review'));await wait;assert.equal(result.ready,false);
 available=true;handlers.message(request('future-release'));await wait;assert.equal(result.ready,false);
});
