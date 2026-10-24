/* The Scripture dataset is a pinned, unmodified WEB Classic text, not an AI translation. */
(function(root){
'use strict';
let pending;
async function dataset(){
  if(!pending)pending=fetch(new URL('./bible/web.json',document.baseURI),{cache:'no-cache'}).then(r=>{
    if(!r.ok)throw new Error('The bundled Bible is unavailable.');return r.json();
  }).then(data=>{
    if(data.translation!=='World English Bible Classic'||Object.keys(data.books||{}).length!==66)throw new Error('The bundled Bible failed validation.');
    return data;
  }).catch(error=>{pending=null;throw error;});
  return pending;
}
function parse(ref){
  const match=String(ref).trim().replace(/[–—]/g,'-').match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if(!match)throw new Error('Choose a book, chapter, and optional verse range.');
  return {name:match[1],chapter:Number(match[2]),start:match[3]?Number(match[3]):null,end:match[4]?Number(match[4]):null};
}
async function passage(ref){
  const query=parse(ref),data=await dataset();
  const alias=query.name.toLowerCase()==='psalm'?'psalms':query.name.toLowerCase();
  const book=Object.keys(data.books).find(name=>name.toLowerCase()===alias);
  const source=book&&data.books[book],chapter=source?.chapters[String(query.chapter)];
  if(!chapter)throw new Error('That Bible book or chapter does not exist.');
  const keys=Object.keys(chapter).map(Number),start=query.start??keys[0],end=query.end??(query.start??keys[keys.length-1]);
  if(start<1||end<start||end>keys[keys.length-1]||!Object.hasOwn(chapter,String(start)))throw new Error('That verse range does not exist.');
  const verses=keys.filter(v=>v>=start&&v<=end).map(verse=>({book_name:book,chapter:query.chapter,verse,text:chapter[verse]}));
  const notes=verses.flatMap(v=>(source.notes[`${query.chapter}:${v.verse}`]||[]).map(text=>({verse:v.verse,text})));
  return {verses,notes,superscriptions:query.start===null?(source.superscriptions[query.chapter]||[]):[],translation:data.translation};
}
const offlineVersion='men-of-purpose-v11-short-readings-graphics';
async function offlineReady(){
  // `serviceWorker.ready` may refer to an older worker after a failed update.
  // Ask the controlling worker to verify this release's complete offline cache.
  if(!root.navigator?.serviceWorker?.controller||!root.MessageChannel)return false;
  return new Promise(resolve=>{
    const channel=new root.MessageChannel();let finished=false;
    const done=value=>{if(finished)return;finished=true;root.clearTimeout(timeout);channel.port1.close();resolve(value)};
    const timeout=root.setTimeout(()=>done(false),1500);
    channel.port1.onmessage=event=>done(event.data?.version===offlineVersion&&event.data?.ready===true);
    try{root.navigator.serviceWorker.controller.postMessage({type:'MOP_OFFLINE_STATUS',version:offlineVersion},[channel.port2])}catch(error){done(false)}
  });
}
root.MOPBible={passage,parse,dataset,offlineReady};
})(globalThis);
