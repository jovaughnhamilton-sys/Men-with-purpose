/* Rebuild runtime music after reviewing catalog and daily editorial pairings. */
'use strict';
const fs=require('node:fs');
const source=require('../content/music-verification.json');
const pairings=require('../content/daily-music-pairings.json');
const used=new Set(Object.values(pairings).map(p=>p.songId));
const songs=[],seen=new Set();
for(const entry of source){
 const id=new URL(entry.url).searchParams.get('v');
 if(!used.has(id)||seen.has(id))continue;
 seen.add(id);songs.push({id,title:entry.title,artist:entry.artist,style:entry.style,url:entry.url,service:'YouTube',topics:entry.tags,checkedAt:entry.checkedAt});
}
if(songs.length!==366||Object.keys(pairings).length!==366)throw Error('Expected 365 unique daily links plus a separate leap-day link.');
if(new Set(Object.values(pairings).map(p=>p.songId)).size!==366)throw Error('A song link was reused.');
for(const [day,p]of Object.entries(pairings)){
 const song=songs.find(s=>s.id===p.songId);if(!song)throw Error('Missing song for '+day);
 if(!song.topics.includes(p.topic)||!p.connection.trim())throw Error('Missing editorial connection for '+day);
}
fs.writeFileSync('devotional-music.js',`/* Reviewed daily song assignments; metadata only. No lyrics or audio are bundled. Rebuild with tools/build-music.cjs. */\n(function(root){'use strict';\nconst songs=${JSON.stringify(songs)};\nconst pairings=${JSON.stringify(pairings)};\nfor(const s of songs){Object.freeze(s.topics);Object.freeze(s);}for(const p of Object.values(pairings))Object.freeze(p);\nconst api=Object.freeze({songs:Object.freeze(songs),pairings:Object.freeze(pairings)});root.MOPMusic=api;if(typeof module==='object'&&module.exports)module.exports=api;\n})(typeof window!=='undefined'?window:globalThis);\n`);
console.log('Built 366 distinct YouTube music links and editorial pairings.');
