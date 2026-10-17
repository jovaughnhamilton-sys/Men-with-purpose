const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const entries = require('./devotional-content.js');
const corpus = JSON.parse(fs.readFileSync(path.join(__dirname, 'bible/web.json'), 'utf8'));
const original = require('./docs/editorial-original-first-seven.json');

function referenceParts(reference) {
  let book;
  return reference.split(';').map(segment => {
    const text = segment.trim().replace(/[–—]/g, '-');
    const full = text.match(/^(.+?)\s+(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
    const continuation = text.match(/^(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
    assert.ok(full || (book && continuation), `Unrecognized reference: ${reference}`);
    const parts = full ? (book=full[1], full.slice(2)) : continuation.slice(1);
    const [chapter, start, endChapter, end] = parts.map(x=>x===undefined?undefined:Number(x));
    return {book, chapter, start, endChapter:endChapter||chapter, end:end||start};
  });
}
function assertReference(reference) {
  for (const p of referenceParts(reference)) {
    const book=corpus.books[p.book];
    assert.ok(book, `Book missing: ${reference}`);
    assert.ok(p.endChapter>=p.chapter, reference);
    for(let chapter=p.chapter;chapter<=p.endChapter;chapter++) {
      const verses=book.chapters[String(chapter)];
      assert.ok(verses, `Chapter missing: ${reference}`);
      const start=chapter===p.chapter?p.start:1;
      const end=chapter===p.endChapter?p.end:Math.max(...Object.keys(verses).map(Number));
      assert.ok(end>=start, reference);
      for(let verse=start;verse<=end;verse++) assert.ok(verses[String(verse)]?.length, `Verse missing: ${reference} at ${chapter}:${verse}`);
    }
  }
}
test('all 40 days have reviewable devotional content and specific reflection prompts',()=>{
  assert.equal(entries.length,40);
  assert.equal(new Set(entries.map(e=>e.title)).size,40);
  entries.forEach((entry,index)=>{
    assert.equal(entry.day,index+1);
    assert.equal(entry.status,'editorial-draft');
    assert.equal(entry.kind,'original-devotional-commentary');
    for(const field of ['title','ref','context','body','prayer','challenge']) assert.ok(entry[field]?.trim().length>5,`Day ${entry.day}: ${field}`);
    assert.equal(entry.questions.length,3);
    entry.questions.forEach(q=>assert.ok(q.endsWith('?')));
    assert.ok(!/coming soon|lorem ipsum|\bTODO\b/i.test(JSON.stringify(entry)));
    assert.ok(!Object.hasOwn(entry,'scriptureText'), 'Commentary must not masquerade as Bible text');
    assert.ok(Object.isFrozen(entry));
  });
});
test('first seven original devotional messages, references, prayers, and challenges are preserved',()=>{
  original.forEach((entry,index)=>Object.entries(entry).forEach(([key,value])=>assert.equal(entries[index][key],value,`Day ${index+1} ${key}`)));
});
test('every primary and context reference resolves to actual verses in the pinned WEB corpus',()=>{
  for (const entry of entries) { assertReference(entry.ref); assertReference(entry.context); }
});
test('reader Scripture provider returns exact corpus verses for all 40 primary references',async()=>{
  global.document={baseURI:'https://example.test/app/'};
  global.fetch=async()=>({ok:true,json:async()=>corpus});
  require('./mop-bible.js');
  for (const entry of entries) {
    const result=await global.MOPBible.passage(entry.ref);
    assert.ok(result.verses.length>0, entry.ref);
    for(const verse of result.verses) assert.equal(verse.text,corpus.books[verse.book_name].chapters[String(verse.chapter)][String(verse.verse)]);
  }
});
