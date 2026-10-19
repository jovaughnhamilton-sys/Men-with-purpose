const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const calendar=require('../mop-calendar.js');
const content=require('../annual-content.js');
const bible=JSON.parse(fs.readFileSync('bible/web.json','utf8'));
test('365 original readings have distinct titles, messages, actions and valid calendar slots',()=>{
 assert.equal(content.entries.length,365);
 for(const field of ['id','title','body','challenge'])assert.equal(new Set(content.entries.map(d=>d[field])).size,365,field);
 const counts=Array(12).fill(0);
 for(const d of content.entries){counts[d.month-1]++;assert.ok(d.body.split(/\s+/).length>=30,d.title);assert.equal(d.questions.length,3);assert.ok(d.prayer.endsWith('Amen.'));assert.equal(d.status,'editorial-draft');assert.ok(!d.scriptureText);}
 assert.deepEqual(counts,[31,28,31,30,31,30,31,31,30,31,30,31]);
});
test('every annual Scripture and context reference resolves to unchanged WEB text',async()=>{
 global.document={baseURI:'https://example.test/'};global.fetch=async()=>({ok:true,json:async()=>bible});require('../mop-bible.js');
 for(const d of [...content.entries,content.leap])for(const ref of [d.ref,d.context]){
  const result=await global.MOPBible.passage(ref);assert.ok(result.verses.length,ref);
  for(const v of result.verses)assert.equal(v.text,bible.books[v.book_name].chapters[v.chapter][v.verse]);
 }
});
test('annual schedules never repeat or omit a reading including leap years and early/late Easter',()=>{
 for(const year of [2008,2024,2026,2027,2028,2038,2100]){
  const list=calendar.schedule(year),leap=new Date(year,1,29).getMonth()===1;
  assert.equal(list.length,leap?366:365);assert.equal(new Set(list.map(d=>d.id)).size,list.length);
  assert.equal(new Set(list.map(d=>d.date)).size,list.length);
  for(const d of list)assert.ok(calendar.fromKey(d.date),d.date);
  const sunday=calendar.easter(year);
  assert.equal(calendar.forDate(sunday).title,'He Is Risen');
  assert.equal(calendar.forDate(calendar.addDays(sunday,-2)).title,'The King on the Cross');
  assert.equal(calendar.forDate(calendar.addDays(sunday,-7)).title,'The King Comes Humbly');
  assert.equal(calendar.forDate(calendar.addDays(sunday,-46)).title,'Return With Your Whole Heart');
  assert.equal(calendar.forDate(new Date(year,11,25)).title,'Good News of Great Joy');
 }
 assert.equal(calendar.key(calendar.easter(2027)),'2027-03-28');
 assert.equal(calendar.key(calendar.easter(2028)),'2028-04-16');
});
test('daily selection follows local midnight rather than completion or elapsed 24-hour intervals',()=>{
 const before=new Date(2026,9,18,23,59),after=new Date(2026,9,19,0,0);
 assert.notEqual(calendar.forDate(before).id,calendar.forDate(after).id);
 assert.equal(calendar.forDate(after).title,'An Honest Shared Memory');
 assert.equal(calendar.key(calendar.addDays(new Date(2027,2,13,12),1)),'2027-03-14');
 assert.equal(calendar.key(calendar.addDays(new Date(2026,11,31,12),1)),'2027-01-01');
 assert.equal(calendar.fromKey('2027-02-29'),null);assert.equal(calendar.fromKey('2028-02-29').getDate(),29);
 assert.notEqual(calendar.forDate(new Date(2028,1,29)).id,calendar.forDate(new Date(2028,1,28)).id);
});
