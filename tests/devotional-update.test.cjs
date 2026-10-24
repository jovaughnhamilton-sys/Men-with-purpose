'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const annual=require('../annual-content.js'),calendar=require('../mop-calendar.js'),commands=require('../commands-content.js'),music=require('../devotional-music.js');
const corpus=JSON.parse(fs.readFileSync('bible/web.json'));
const context={window:{MOPCalendar:calendar,MOPCommands:commands,MOPMusic:music,MOPBible:{parse(ref){const m=ref.replace(/[–—]/g,'-').match(/^(.+?) (\d+)(?::(\d+)(?:-(\d+))?)?$/);if(!m)throw Error(ref);return {name:m[1],chapter:+m[2],start:+m[3]||null,end:+m[4]||null};}},MOPExperience:{songFor(){},songMarkup(){},enhance(){}},loadBible(){}},URL};
vm.runInNewContext(fs.readFileSync('mop-devotional-tools.js','utf8'),context);
const tools=context.window.MOPDevotionalTools,plan=context.window.MOPDailyPlan;
test('every required devotional reading has 1–2 exact existing verses; full Bible stays intact',()=>{
 for(const d of [...annual.entries,annual.leap,...commands, ...require('../devotional-content.js')]){
  const ref=tools.mainRef(d.ref),q=context.window.MOPBible.parse(ref),last=q.end||q.start;
  assert(last-q.start+1<=2,ref);for(let n=q.start;n<=last;n++)assert(corpus.books[q.name].chapters[q.chapter][n],d.title+' '+ref);
  assert.equal(tools.practices(d).length,3);assert(tools.declaration(d).length>20);
 }
});
test('Commands advance once per civil date, retain recent sequence and finish before monthly themes',()=>{
 for(let day=1;day<=40;day++){const date=calendar.addDays(calendar.fromKey(plan.start),day-1);assert.equal(plan.forDate(date).day,day);}
 assert.equal(plan.forDate(calendar.fromKey('2026-10-23')).title,'Work Willingly at Whatever You Do');
 assert.equal(plan.forDate(calendar.fromKey('2026-10-24')).day,13);
 assert.equal(plan.forDate(calendar.fromKey('2026-11-20')).day,40);
 assert.equal(plan.forDate(calendar.fromKey('2026-11-21')).day,undefined);
 for(const y of [2026,2027,2028]){const a=plan.schedule(y);assert.equal(a.length,y===2028?366:365);for(const field of ['id','title','body'])assert.equal(new Set(a.map(d=>d[field])).size,a.length,field);}
});
test('every command song has a valid reviewed direct URL and matches its topic',()=>{
 commands.forEach((d,i)=>{const song=tools.commandSongs[i];assert(song.topics.includes(d.topic==='self-control'?'holiness':d.topic));assert.match(song.url,/^https:\/\/www.youtube.com\/watch\?v=[\w-]{11}$/);assert(song.checkedAt);});
 for(let i=1;i<40;i++)assert.notEqual(tools.commandSongs[i].id,tools.commandSongs[i-1].id,'Consecutive command songs repeat');
});
