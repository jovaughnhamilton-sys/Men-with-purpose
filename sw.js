'use strict';
// Increment after changing any shell or Bible asset. Never cache user/account responses.
const CACHE='men-of-purpose-v9-daily-calendar';
const ASSETS=['./','./index.html','./icon.svg','./app-icon.png','./men-of-purpose-logo.png','./manifest.webmanifest','./cloud-config.js','./mop-languages.js','./mop-accounts.js','./mop-bible.js','./bible/web.json','./devotional-content.js','./annual-content.js','./mop-calendar.js','./mop-daily.js','./mop-community.js','./mop-experience.js','./mop-updates.js','./polish.css','./vendor/supabase-2.117.3.js'];
const assetURLs=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>{
  // Atomic install: a missing asset must not leave a worker claiming full offline support.
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('men-of-purpose-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    // Use the versioned shell so HTML and JS belong to the same installed release.
    event.respondWith(caches.open(CACHE).then(cache=>cache.match('./index.html')).then(cached=>cached||fetch(event.request)));
  }else if(assetURLs.has(url.href)){
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const cached=await cache.match(event.request);if(cached)return cached;
      const response=await fetch(event.request);
      if(response.ok)await cache.put(event.request,response.clone());
      return response;
    }));
  }
  // Unknown paths, APIs and auth traffic pass straight through: no HTML substitution.
});

self.addEventListener('message',event=>{
  if(event.data?.type!=='MOP_OFFLINE_STATUS'||!event.ports?.[0])return;
  const port=event.ports[0];
  event.waitUntil((async()=>{
    try{
      const cache=await caches.open(CACHE);
      const results=await Promise.all(ASSETS.map(path=>cache.match(path)));
      port.postMessage({version:CACHE,ready:event.data.version===CACHE&&results.every(response=>response?.ok===true)});
    }catch(error){port.postMessage({version:CACHE,ready:false})}
  })());
});
