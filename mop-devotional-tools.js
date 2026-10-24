/* Short readings and two original daily compositions. No user storage is changed. */
(function(root){
'use strict';
const bible=root.MOPBible,commands=root.MOPCommands,base=root.MOPCalendar;
const start='2026-10-12',end='2026-11-20';
const music=root.MOPMusic,used=new Set();
const commandSongs=commands.map(d=>{
 const choices=music.songs.filter(s=>s.topics.includes(d.topic==='self-control'?'holiness':d.topic));
 const s=choices.find(s=>!used.has(s.id))||choices[0];if(!s)throw Error('Missing command song: '+d.topic);used.add(s.id);
 return {...s,connection:`Reflect on ${d.title.toLowerCase()} as you listen. Today’s response: ${d.challenge}`};
});
function forDate(date=new Date()){
 const key=base.key(date);
 if(key>=start&&key<=end){const index=Math.round((Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())-Date.UTC(2026,9,12))/86400000);return {...commands[index],date:key,season:`Biblical Commands · Day ${index+1} of 40`};}
 return base.forDate(date);
}
root.MOPDailyPlan={...base,forDate,schedule:year=>base.schedule(year).map(d=>forDate(base.fromKey(d.date))),start,end};
const anchors={
'Genesis 1':26,'Genesis 2':18,'Genesis 3':8,'Genesis 4':6,'Genesis 5':24,'Genesis 6':8,'Genesis 7':5,'Genesis 8':20,'Genesis 9':12,'Genesis 10':32,'Genesis 11':4,'Genesis 12':1,'Genesis 13':8,'Genesis 14':22,'Genesis 15':5,'Genesis 16':13,'Genesis 17':1,'Genesis 18':14,
'Psalms 51':10,'Psalms 23':1,'Psalms 24':3,'Ruth 1':16,'Ruth 2':12,
'Acts 1':8,'Acts 2':42,'Acts 3':6,'Acts 4':32,'Acts 5':29,'Acts 6':3,'Acts 7':59,'Acts 8':35,'Acts 9':17,'Acts 10':34,'Acts 11':23,'Acts 12':5,'Acts 13':2,'Acts 14':22,'Acts 15':28,'Acts 16':9,'Acts 17':11,'Acts 18':9,'Acts 19':18,'Acts 20':35,'Acts 21':13,'Acts 22':15,'Acts 23':11,'Acts 24':16,'Acts 25':11,'Acts 26':22,'Acts 27':25,'Acts 28':30,
'Romans 2':4,'Romans 3':23,'Romans 4':20,'Romans 5':1,'Romans 6':11,'Romans 7':24,'Romans 9':15,'Romans 10':9,'Romans 11':33,'Romans 12':1,'Romans 13':8,'Romans 14':13,'Romans 15':5,'Romans 16':3,
'Galatians 1':10,'Galatians 2':20,'Galatians 3':26,'Galatians 4':6,'Galatians 5':13,'Galatians 6':2,
'Ephesians 1':7,'Ephesians 2':8,'Ephesians 3':16,'Ephesians 4':15,'Titus 2':11,'Titus 3':4,
'James 1':19,'James 2':1,'James 3':17,'James 4':7,'James 5':16,
'Proverbs 1':7,'Proverbs 2':6,'Proverbs 3':5,'Proverbs 4':23,'Proverbs 5':18,'Proverbs 6':6,'Proverbs 7':24,'Proverbs 8':10,'Proverbs 9':10,'Proverbs 10':19,'Proverbs 11':1,'Proverbs 12':18,'Proverbs 13':20,'Proverbs 14':15,'Proverbs 15':1,'Proverbs 16':9,'Proverbs 17':17,'Proverbs 18':13,'Proverbs 19':20,'Proverbs 20':10,'Proverbs 21':3,'Proverbs 22':1,'Proverbs 23':4,'Proverbs 24':16,'Proverbs 25':21,'Proverbs 26':20,'Proverbs 27':6,'Proverbs 28':13,'Proverbs 29':11,'Proverbs 30':8,'Proverbs 31':8,
'Ecclesiastes 1':3,'Ecclesiastes 2':24,'Ecclesiastes 3':1,'Ecclesiastes 4':9,'Ecclesiastes 5':10,'Ecclesiastes 6':9,'Ecclesiastes 7':9,'Ecclesiastes 8':17,'Ecclesiastes 9':10,'Ecclesiastes 10':1,'Ecclesiastes 11':4,'Ecclesiastes 12':13,
'Daniel 1':8,'Daniel 2':20,'Daniel 3':17,'Daniel 4':37,'Daniel 5':22,'Daniel 6':10,'Daniel 7':14,'Daniel 8':27,'Daniel 9':18,'Daniel 10':19,
'1 Corinthians 1':10,'1 Corinthians 2':4,'1 Corinthians 3':6,'1 Corinthians 4':5,'1 Corinthians 5':6,'1 Corinthians 8':9,'1 Corinthians 9':24,'1 Corinthians 12':25,'1 Samuel 24':6,'2 Samuel 9':7,
'Joshua 1':9,'Joshua 2':11,'Joshua 3':5,'Joshua 4':6,'Joshua 6':16,'Joshua 7':20,'Joshua 9':14,'Joshua 10':25,
'Nehemiah 1':6,'Nehemiah 2':17,'Nehemiah 3':5,'Nehemiah 4':14,'Nehemiah 5':9,'Nehemiah 6':3,'Nehemiah 7':2,'Nehemiah 8':8,'Nehemiah 9':17,'Nehemiah 10':29,'Nehemiah 11':2,'Nehemiah 12':43,'Nehemiah 13':11,
'2 Timothy 1':7,'2 Timothy 2':2,'2 Timothy 3':16,'2 Timothy 4':7,
'Psalms 1':1,'Psalms 3':3,'Psalms 4':8,'Psalms 5':3,'Psalms 8':3,'Psalms 9':9,'Psalms 13':5,'Psalms 15':2,'Psalms 16':8,'Psalms 18':2,'Psalms 19':14,'Psalms 20':7,'Psalms 25':4,'Psalms 27':1,'Psalms 30':5,'Psalms 32':5,'Psalms 34':18,'Psalms 37':3,'Psalms 39':4,'Psalms 40':1,'Psalms 42':5,'Psalms 46':1,'Psalms 50':14,'Psalms 55':22,'Psalms 56':3,'Psalms 62':5,'Psalms 63':1,'Psalms 100':4,
'Luke 24:1-12':5,'Mark 15:21-41':37,'Matthew 6:25-34':33,'Luke 2:8-20':10,'John 1:1-18':14,'John 3:1-21':16,'John 4:1-26':23,'Luke 15:11-32':20,'Isaiah 9:1-7':6,'Isaiah 40:12-31':30,'John 17:1-26':20
};
function mainRef(ref){
 const q=bible.parse(ref),first=anchors[ref]||q.start||1;
 // One or two main verses; full ranges remain available as optional context.
 const last=q.end&&first===q.start?Math.min(q.end,first+1):first;
 return `${q.name} ${q.chapter}:${first}${last>first?'–'+last:''}`;
}
function illustration(d){
 const text=(d.title+' '+d.body+' '+d.ref).toLowerCase();
 if(/christmas|manger|bethlehem|birth of jesus|savior.*born/.test(text))return 10;
 if(/resurrect|risen|empty tomb/.test(text))return 11;
 if(/shepherd|psalms 23|still water/.test(text))return 1;
 if(/boat|storm|waves|sea of/.test(text))return 2;
 if(/seed|root|grow|harvest|fruit/.test(text))return 3;
 if(/broken|heal|grace|forgiv|repent/.test(text))return 4;
 if(/armor|armour|shield|resist|stand firm|courage/.test(text))return 6;
 if(/brother|neighbor|neighbour|serve|burden|love|family|wife|children/.test(text))return 7;
 if(/word|scripture|wisdom|listen|truth/.test(text))return 8;
 if(/bread|genero|giv|provi|thank|work/.test(text))return 9;
 if(/light|lamp|shine/.test(text))return 0;
 return 5;
}
const descriptions=['An oil lamp bringing light into darkness','A shepherd’s staff beside still waters','A wooden boat amid waves at sunrise','A seedling with deep roots','A clay jar mended with gold','A path toward the cross','A shield with olive branches','One brother helping another climb','An open book in golden light','Wheat and bread in a basket','A manger under the Bethlehem star','An empty tomb at sunrise'];
function practices(d){return d.practices||[`Read ${mainRef(d.ref)} aloud, then write one truth you need today.`,d.challenge,'Before bed, review your response and ask a trusted brother to pray with you.'];}
function declaration(d){return d.declaration||`With God’s help, I will ${d.challenge[0].toLowerCase()+d.challenge.slice(1).replace(/\byour\b/g,'my').replace(/\byou\b/g,'me')}`;}
let artPromise;
function artwork(){return artPromise||(artPromise=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{artPromise=null;reject(Error('Illustration could not load. Please reconnect and retry.'));};img.src=new URL('assets/devotional-illustrations.webp',document.baseURI).href;}));}
function wrap(ctx,text,x,y,width,size,lineHeight,maxBottom){
 ctx.font=`700 ${size}px Georgia`;let words=text.split(/\s+/),lines=[],line='';
 for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
 if(y+lines.length*lineHeight>maxBottom&&size>20)return wrap(ctx,text,x,y,width,size-2,lineHeight-2,maxBottom);
 lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));return y+lines.length*lineHeight;
}
async function graphic(d,kind){
 const art=await artwork(),canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;
 const c=canvas.getContext('2d'),encouragement=kind===1,ref=mainRef(d.ref),i=encouragement?illustration({...d,title:d.challenge,body:declaration(d)}):illustration(d);
 c.fillStyle=encouragement?'#f6f0df':'#102b23';c.fillRect(0,0,1080,1350);
 const sw=art.naturalWidth/4,sh=art.naturalHeight/3;
 c.drawImage(art,(i%4)*sw,Math.floor(i/4)*sh,sw,sh,0,0,1080,770);
 const gradient=c.createLinearGradient(0,550,0,800);gradient.addColorStop(0,'#102b2300');gradient.addColorStop(1,encouragement?'#f6f0df':'#102b23');c.fillStyle=gradient;c.fillRect(0,550,1080,250);
 c.fillStyle='#c6a15b';c.fillRect(64,807,90,5);c.font='700 22px sans-serif';c.fillText(encouragement?'DAILY ENCOURAGEMENT':'DAILY SCRIPTURE',64,858);
 c.fillStyle=encouragement?'#142e25':'#fff5df';
 const heading=encouragement?(d.headline||d.title):d.title;
 let y=wrap(c,heading,64,925,952,60,69,1085);
 c.font='500 29px sans-serif';c.fillStyle=encouragement?'#244b38':'#d8cba9';
 if(encouragement)wrap(c,d.challenge,64,y+20,952,30,39,1230);
 else {c.fillText(ref,64,y+20);c.font='24px sans-serif';c.fillText('Read slowly. Carry it into your day.',64,y+66);}
 c.fillStyle='#c6a15b';c.fillRect(64,1255,952,2);c.font='700 24px sans-serif';c.fillText('MEN OF PURPOSE',64,1305);
 c.font='18px sans-serif';c.fillText(d.day?`COMMAND ${d.day} / 40`:(d.date||d.id||'DAILY FAITH'),735,1305);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNG export failed.')),'image/png'));
}
let urls=[];let renderToken=0;
function clear(){urls.forEach(URL.revokeObjectURL);urls=[];}
async function enhance(d){
 const token=++renderToken;clear();if(!d||!document.getElementById('devotionalBible'))return;
 const ref=mainRef(d.ref),container=document.getElementById('devotionalBible').closest('.card');
 const label=container.querySelector('p');if(label)label.textContent=ref+' · WEB · 1–2 main verses';
 const nlt=document.createElement('a');nlt.className='btn alt';nlt.textContent='Read this passage in NLT ↗';nlt.target='_blank';nlt.rel='noopener noreferrer';nlt.href='https://www.biblegateway.com/passage/?search='+encodeURIComponent(ref)+'&version=NLT';container.append(nlt);
 const application=document.createElement('section');application.className='card devotional-copy';application.id='mop-daily-practices';
 application.innerHTML=`<h3>Three practices for today</h3><ol>${practices(d).map(p=>'<li><p>'+esc(p)+'</p></li>').join('')}</ol><h3>My declaration</h3><p>${esc(declaration(d))}</p>`;
 const copy=document.querySelector('.devotional-copy');(copy?.closest('.card')||container).after(application);
 const gallery=document.createElement('section');gallery.id='mop-graphics';gallery.className='card';gallery.innerHTML='<h3>Carry today’s word</h3><p class="muted">Two original graphics · Swipe or use the arrows</p><div class="mop-gallery" tabindex="0" aria-label="Daily graphics" role="region"></div><div class="toolbar"><button class="btn alt" data-slide="-1" aria-label="Previous graphic">←</button><span role="status" id="mop-gallery-count">1 of 2</span><button class="btn alt" data-slide="1" aria-label="Next graphic">→</button></div><button class="btn alt" type="button" id="mop-share-devotional">Share devotional text</button><p class="notice" data-gallery-status>Preparing your two images…</p>';
 application.after(gallery);const track=gallery.querySelector('.mop-gallery'),status=gallery.querySelector('[data-gallery-status]');
 gallery.querySelector('#mop-share-devotional').onclick=()=>root.shareText(`MEN OF PURPOSE — ${d.title}\nRead ${ref}.\n${d.challenge}\n${location.href}`);
 let index=0;function move(delta){index=Math.max(0,Math.min(1,index+delta));track.scrollTo({left:index*track.clientWidth,behavior:'smooth'});}
 gallery.querySelectorAll('[data-slide]').forEach(b=>b.onclick=()=>move(Number(b.dataset.slide)));
 track.onkeydown=e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}};
 track.onscroll=()=>{index=Math.round(track.scrollLeft/Math.max(1,track.clientWidth));document.getElementById('mop-gallery-count').textContent=`${index+1} of 2`;};
 async function renderImages(){
  try{
   const blobs=await Promise.all([graphic(d,0),graphic(d,1)]);if(token!==renderToken||!gallery.isConnected)return;
   track.replaceChildren();blobs.forEach((blob,i)=>{
    const url=URL.createObjectURL(blob);urls.push(url);const name=`men-of-purpose-${d.date||d.id||'day-'+d.day}-${i===0?'scripture':'encouragement'}.png`;
    const card=document.createElement('figure');card.className='mop-graphic';card.innerHTML=`<img alt="${esc((i===0?'Daily Scripture: '+d.title+' · '+ref:'Daily Encouragement: '+d.challenge)+'. '+descriptions[i===0?illustration(d):illustration({...d,title:d.challenge,body:declaration(d)})])}" width="1080" height="1350"><figcaption>${i===0?'Daily Scripture':'Daily Encouragement'}</figcaption><div class="toolbar"><a class="btn" download="${esc(name)}">Download PNG</a><button class="btn alt" type="button">Share image</button></div>`;
    card.querySelector('img').src=url;const a=card.querySelector('a');a.href=url;
    card.querySelector('button').onclick=async()=>{try{const file=new File([blob],name,{type:'image/png'});if(navigator.canShare?.({files:[file]})&&navigator.share)await navigator.share({files:[file],title:d.title,text:ref+' · Men of Purpose'});else{a.click();status.textContent='PNG downloaded. Attach it in your messaging or social app to share.';}}catch(error){if(error.name!=='AbortError')status.textContent='Sharing did not finish. Use Download PNG and attach the image to your message.';}};
    track.append(card);
   });status.textContent='Scripture references and original encouragement · Illustration artwork is reused across daily compositions.';
  }catch(error){status.textContent=error.message;const retry=document.createElement('button');retry.className='btn alt';retry.textContent='Retry images';retry.onclick=()=>{retry.remove();renderImages();};status.append(retry);}
 }
 await renderImages();
}
const originalLoad=root.loadBible;root.loadBible=function(ref,target){return originalLoad(target==='devotionalBible'?mainRef(ref):ref,target);};
const originalSong=root.MOPExperience.songFor;
// Keep all reviewed annual music pairings; the launch series has its own theme-matched songs.
function songFor(day,date){if(!day){const d=forDate(date);if(d.day)return commandSongs[d.day-1];}return originalSong(day,date);}
// Existing enhance closes over songMarkup; swap only its song card content after rendering.
const originalEnhance=root.MOPExperience.enhance;
root.MOPExperience.enhance=function(options={}){
 originalEnhance(options);
 if(options.screen==='home'&&forDate(options.date||new Date()).day)document.querySelector('[data-mop-experience=monthly]')?.remove();
 if(options.screen==='home'||options.screen==='reader'){
  const date=options.date||new Date(),daily=!options.day&&forDate(date);if(daily?.day){const s=commandSongs[daily.day-1],el=document.getElementById('mop-daily-song');if(el){el.querySelector('h3').textContent=s.title;el.querySelector('.mop-artist').textContent=s.artist;el.querySelector('.pill').textContent=s.style;const p=el.querySelectorAll('p');p[1].textContent=s.connection;el.querySelector('.mop-listen').href=s.url;}}
 }
};
root.MOPDevotionalTools={mainRef,illustration,practices,declaration,graphic,enhance,commandSongs,songFor};
})(window);
