/* App updates never clear personal storage or automatically reload unsaved writing. */
(function(root){
  'use strict';
  if(!root.navigator?.serviceWorker)return;
  const workers=root.navigator.serviceWorker;
  const dirty=new WeakSet();
  let registration,checking,lastCheck=0,hasController=!!workers.controller,updateReady=false;
  let status='';
  function say(text){
    status=text;
    for(const id of ['mop-update-status','mop-update-banner-status']){
      const node=document.getElementById(id);if(node)node.textContent=text;
    }
  }
  function refresh(){
    const unsaved=[...document.querySelectorAll('textarea')].find(node=>dirty.has(node)&&node.value.trim());
    if(unsaved){say('Save your writing before refreshing.');unsaved.focus();return false;}
    root.location.reload();return true;
  }
  function decorate(){
    if(updateReady&&!document.getElementById('mop-update-banner')){
      const banner=document.createElement('section');
      banner.id='mop-update-banner';banner.className='notice-box mop-update-banner';
      banner.innerHTML='<strong>A new app version is ready.</strong><p id="mop-update-banner-status" role="status">Refresh to use the latest changes.</p><button id="mop-update-refresh" class="btn" type="button">Refresh app</button>';
      banner.querySelector('button').addEventListener('click',refresh);
      document.querySelector('.app')?.prepend(banner);
    }
    if(typeof screen!=='undefined'&&screen==='more'&&!document.getElementById('mop-check-updates')){
      const card=document.createElement('section');card.className='card';
      card.innerHTML='<h3>App updates</h3><button id="mop-check-updates" type="button" class="btn alt">Check for app updates</button><p id="mop-update-status" class="muted" role="status"></p>';
      card.querySelector('button').addEventListener('click',()=>check(true));
      document.getElementById('content')?.prepend(card);
    }
    if(status)say(status);
  }
  function watch(worker){
    if(!worker)return;
    say('Downloading the latest app. Keep your connection on.');
    worker.addEventListener('statechange',()=>{
      if(worker.state==='redundant')say('The update could not finish. Your previous download is still available. Try again when connected.');
    });
  }
  async function check(manual=false){
    if(checking)return checking;
    if(!manual&&Date.now()-lastCheck<60000)return;
    lastCheck=Date.now();
    if(root.navigator.onLine===false){if(manual)say('Connect to the internet to check for updates.');return;}
    checking=(async()=>{
      try{
        if(manual)say('Checking for app updates…');
        if(!registration){
          registration=await workers.register('./sw.js',{updateViaCache:'none'});
          registration.addEventListener('updatefound',()=>watch(registration.installing));
        }
        await registration.update();
        if(registration.installing)watch(registration.installing);
        else if(updateReady)say('The update is ready. Save any writing, then refresh the app.');
        else if(manual)say('No new update found.');
        if(typeof root.refreshOfflineStatus==='function')root.refreshOfflineStatus();
      }catch{say('Could not check for updates. Your saved data stays on this device. Try again when connected.');}
      finally{checking=null;}
    })();
    return checking;
  }
  workers.addEventListener('controllerchange',()=>{
    if(hasController){updateReady=true;decorate();say('The update is ready. Save any writing, then refresh the app.');}
    hasController=true;
    if(typeof root.refreshOfflineStatus==='function')root.refreshOfflineStatus();
  });
  document.addEventListener('input',event=>{if(event.target.tagName==='TEXTAREA')dirty.add(event.target);});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
  root.addEventListener('online',()=>check(true));
  root.addEventListener('focus',()=>check());
  root.MOPUpdates={check,refresh,decorate,markSaved(id){const node=document.getElementById(id);if(node)dirty.delete(node);}};
  if(document.readyState==='complete')check();else root.addEventListener('load',()=>check());
})(window);
