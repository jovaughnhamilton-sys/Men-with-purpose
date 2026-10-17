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
test('all forty journey days have a curated song; fallback uses calendar theme',()=>{
  assert.equal(exp.daySongs.length,40);
  const date=new Date(2026,10,1);
  for(let day=1;day<=40;day++)assert.ok(exp.songs.includes(exp.songFor(day,date)));
  assert.equal(exp.songFor(0,date).id,'good-day');
  assert.equal(exp.songFor(41,date).id,'good-day');
  assert.equal(exp.songFor('1',date).id,'good-day');
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
