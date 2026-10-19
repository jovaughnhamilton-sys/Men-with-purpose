const test=require('node:test');
const assert=require('node:assert/strict');
const exp=require('./mop-experience.js');
test('twelve monthly focuses follow local month including year rollover',()=>{
  assert.equal(exp.months.length,12);
  assert.equal(exp.calendarKey(new Date(2026,11,31,23,59)),'2026-12');
  assert.equal(exp.calendarKey(new Date(2027,0,1,0,1)),'2027-01');
  assert.equal(exp.themeFor(new Date(2027,0,1)).title,'Made New in Christ');
  assert.equal(exp.themeFor(new Date(2026,9,17)).title,'Courageous Faith');
  assert.equal(exp.dailyKey(new Date(2026,0,2)),'2026-01-02');
});
test('all forty journey days retain their curated songs; calendar uses dated pairings',()=>{
  assert.equal(exp.daySongs.length,40);
  const date=new Date(2026,10,1);
  for(let day=1;day<=40;day++)assert.ok(exp.songs.includes(exp.songFor(day,date)));
  const expected=require('./devotional-music.js').pairings[require('./mop-calendar.js').forDate(date).id].songId;
  for(const day of [0,41,'1'])assert.equal(exp.songFor(day,date).id,expected);
});
test('worship markup escapes editorial context and isolates external navigation',()=>{
  const markup=exp.songMarkup(1,new Date(2026,9,17),'<img src=x onerror=alert(1)>','"bad"');
  assert.ok(!markup.includes('<img'));
  assert.ok(markup.includes('&lt;img'));
  assert.ok(markup.includes('rel="noopener noreferrer"'));
  assert.ok(markup.includes('target="_blank"'));
  assert.ok(markup.includes('needs an internet connection'));
  assert.ok(!markup.includes('<audio'));
  for(const song of exp.songs){const url=new URL(song.url);assert.equal(url.protocol,'https:');assert.equal(url.hostname,'www.youtube.com');assert.equal(url.pathname,'/watch');assert.match(url.searchParams.get('v'),/^[A-Za-z0-9_-]{11}$/);assert.equal(song.service,'YouTube');}
});

const music=require('./devotional-music.js'),calendar=require('./mop-calendar.js');
test('365 daily songs plus leap day have unique direct YouTube links and editorial connections',()=>{
 assert.equal(music.songs.length,366);assert.equal(Object.keys(music.pairings).length,366);
 assert.equal(new Set(Object.values(music.pairings).map(p=>p.songId)).size,366);
 for(const [id,p] of Object.entries(music.pairings)){
  const song=music.songs.find(s=>s.id===p.songId);assert.ok(song,id);
  assert.ok(song.topics.includes(p.topic),id);assert.ok(p.connection.length>50,id);
  const url=new URL(song.url);assert.equal(url.hostname,'www.youtube.com');assert.equal(url.pathname,'/watch');assert.equal(url.searchParams.get('v'),song.id);
  assert.ok(!url.searchParams.has('search_query'));assert.equal(song.service,'YouTube');
 }
});
test('song follows its devotional through local dates, changing Easter dates, and all year boundaries',()=>{
 for(const year of [2024,2026,2027,2028,2038,2100]){
  const readings=calendar.schedule(year),urls=readings.map(d=>exp.songFor(0,calendar.fromKey(d.date)).url);
  assert.equal(new Set(urls).size,readings.length);
  for(let i=1;i<urls.length;i++)assert.notEqual(urls[i-1],urls[i]);
  assert.notEqual(exp.songFor(0,new Date(year,11,31)).url,exp.songFor(0,new Date(year+1,0,1)).url);
  assert.equal(exp.songFor(0,calendar.easter(year)).title,'Living Hope');
  assert.equal(exp.songFor(0,calendar.addDays(calendar.easter(year),-2)).title,'The Power Of The Cross');
  assert.equal(exp.songFor(0,new Date(year,11,25)).title,'Joy To The World');
 }
 const date=new Date(2026,9,19);assert.equal(exp.songFor(0,date).title,'Altar');
 assert.equal(exp.songFor(0,calendar.addDays(date,1)).title,'Man Of Your Word');
});
