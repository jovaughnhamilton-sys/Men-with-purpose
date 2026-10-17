/* Local-only browser QA. No production database or external API requests are permitted. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules', 'playwright')); }
const root = path.resolve(__dirname, '..');
const results = [];
const server = http.createServer((req, res) => {
  const requested = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  const filename = path.resolve(root, '.' + (requested === '/' ? '/index.html' : requested));
  if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(filename, (err, bytes) => {
    if (err) { res.writeHead(404).end(); return; }
    const type = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' }[path.extname(filename)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type }); res.end(bytes);
  });
});
async function check(name, fn) {
  try { const detail = await fn(); results.push({ name, status: 'PASS', detail }); console.log(`PASS: ${name}`); }
  catch (error) { results.push({ name, status: 'FAIL', detail: error.message }); console.error(`FAIL: ${name}: ${error.message}`); }
}
async function noOverflow(page) {
  const size = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
  assert(size.content <= size.width + 1, `Horizontal overflow: ${size.content}px on ${size.width}px viewport`);
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await playwright.chromium.launch({ headless: true, ...(process.env.QA_CHROMIUM_EXECUTABLE ? {executablePath: process.env.QA_CHROMIUM_EXECUTABLE} : {}), args: ['--no-sandbox'] });
  try {
    for (const width of (process.env.QA_WIDTHS ? process.env.QA_WIDTHS.split(',').map(Number) : [320, 390, 1280])) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      const blocked = [];
      await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : (blocked.push(route.request().url()), route.abort('blockedbyclient')));
      const page = await context.newPage();
      if (process.env.QA_SCREENSHOT_DIR) { fs.mkdirSync(process.env.QA_SCREENSHOT_DIR, {recursive:true}); }
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin, { waitUntil: 'networkidle' });
      await check(`Navigation and layout at ${width}px`, async () => {
        for (const tab of ['home', 'journey', 'journal', 'bible', 'more']) {
          await page.evaluate(value => window.tab(value), tab);
          await page.locator('#content').waitFor();
          await noOverflow(page);
          if (process.env.QA_SCREENSHOT_DIR) await page.screenshot({path:path.join(process.env.QA_SCREENSHOT_DIR, `${width}-${tab}.png`),fullPage:true});
        }
        assert.deepEqual(errors, []);
        return 'All main screens render without horizontal overflow or uncaught exceptions.';
      });
      await check(`Forty complete devotional days at ${width}px`, async () => {
        const data = await page.evaluate(() => ({ themes: themes.length, readings: readings.length, stories: menInTheWord.length }));
        assert.equal(data.themes, 40); assert.equal(data.readings, 40);
        for (let day = 1; day <= 40; day++) {
          await page.evaluate(n => openDay(n), day);
          await page.locator('#devotionalBible .scripture').waitFor({ timeout: 10000 });
          assert.match(await page.locator('#content').innerText(), /Personal Reflection/);
          assert.doesNotMatch(await page.locator('#content').innerText(), /Full devotional coming soon|Theme preview/);
          await noOverflow(page);
        }
        return 'All 40 days include devotional, reflection, and local Scripture.';
      });
      await check(`Private reflection and journal XSS defense at ${width}px`, async () => {
        const attack = '<img src=x onerror="window.__qaXss=1"><svg onload="window.__qaXss=1"> & "quoted"';
        await page.evaluate(() => openDay(1));
        await page.locator('#personalReflection').fill(attack);
        await page.getByRole('button', { name: 'Save reflection', exact: true }).click();
        await page.evaluate(() => tab('journal'));
        assert((await page.locator('.journal-entry').first().innerText()).includes(attack));
        assert.equal(await page.evaluate(() => window.__qaXss), undefined);
        assert.equal(await page.locator('.journal-entry img,.journal-entry svg').count(), 0);
        await page.evaluate(() => openDay(1));
        assert.equal(await page.locator('#personalReflection').inputValue(), attack);
        return 'Malicious markup persists as literal private text and does not execute.';
      });
      await check(`Malformed backup rejected atomically at ${width}px`, async () => {
        const outcome = await page.evaluate(async () => {
          const originalAlert=window.alert, originalConfirm=window.confirm;
          let alerts=0,confirms=0;
          window.alert=()=>alerts++;window.confirm=()=>{confirms++;return true};
          const before=JSON.stringify(Object.entries(localStorage).sort());
          try {
            const valid=dataSnapshot();
            for (const change of [{name:{}},{completed:['1']},{fontSize:'big'},{reminder:{enabled:'yes',time:'09:00'}},{journalEntries:[{id:'a',text:{},date:'2026-01-01',answered:false}]}]) {
              const payload={...valid,...change};
              await restoreData({files:[{text:async()=>JSON.stringify(payload)}]});
            }
            return {alerts,confirms,unchanged:before===JSON.stringify(Object.entries(localStorage).sort()),rendered:!!document.getElementById('content')};
          } finally {window.alert=originalAlert;window.confirm=originalConfirm;}
        });
        assert.deepEqual(outcome,{alerts:5,confirms:0,unchanged:true,rendered:true});
        return 'Invalid name, completed days, font, reminder, and journal data rejected before confirmation or storage writes.';
      });
      await check(`Community defaults, XSS, role controls and account isolation at ${width}px`, async () => {
        await page.evaluate(async () => {
          window.__qaRpc = [];
          window.__qaAttack = '<img src=x onerror="window.__qaCommunityXss=1">';
          const user = '00000000-0000-0000-0000-000000000001';
          const other = '00000000-0000-0000-0000-000000000002';
          const group = '00000000-0000-0000-0000-000000000003';
          const tables = {
            mop_groups: [{id:group,name:window.__qaAttack,description:window.__qaAttack,visibility:'public',owner_id:other,archived:false}],
            mop_memberships: [{group_id:group,user_id:user,status:'active',role:'member'}],
            mop_reflections: [{id:group,author_id:user,audience:'private',body:window.__qaAttack,hidden:false}],
            mop_submissions: [{id:group,author_id:other,title:window.__qaAttack,scripture_reference:'John 1:1',status:'pending',body:window.__qaAttack}],
            mop_admins: [], mop_moderation_log: []
          };
          cloudUser = {id:user,email:'qa@example.invalid'};
          cloudClient = {from:name=>({select:()=>{const query={order:()=>query,limit:async()=>({data:tables[name]||[],error:null})};return query}}),rpc:async(name,args)=>{window.__qaRpc.push({name,args});return {error:null}}};
          window.MOP_CLOUD.communityEnabled = true;
          tab('community'); await MOPCommunity.refresh();
        });
        assert.equal(await page.locator('select[name="audience"]').inputValue(), 'private');
        assert.equal(await page.locator('select[name="visibility"]').inputValue(), 'private');
        assert.equal(await page.locator('#communityPanel img').count(), 0);
        assert.equal(await page.evaluate(() => window.__qaCommunityXss), undefined);
        assert.equal(await page.locator('[data-mop-form="review"]').count(), 0);
        assert.equal(await page.getByRole('button',{name:'Archive group',exact:true}).count(),0);
        assert.equal(await page.getByRole('button',{name:'Make leader',exact:true}).count(),0);
        await noOverflow(page);
        await page.locator('[data-mop-form="reflection"] textarea').fill('This stays private by default.');
        await page.locator('[data-mop-form="reflection"] button[type="submit"]').click();
        await page.waitForFunction(() => window.__qaRpc.length === 1);
        assert.equal(await page.evaluate(() => window.__qaRpc[0].args.p.audience), 'private');
        await page.locator('select[name="audience"]').selectOption('public');
        await page.locator('[data-mop-form="reflection"] textarea').fill('Do not share without confirmation.');
        page.once('dialog', dialog => dialog.dismiss());
        await page.locator('[data-mop-form="reflection"] button[type="submit"]').click();
        assert.equal(await page.evaluate(() => window.__qaRpc.length),1);
        await page.evaluate(() => {cloudUser = {id:'different-account'};tab('community')});
        assert.equal(await page.locator('select[name="audience"]').count(),0);
        assert(!(await page.locator('#communityPanel').innerText()).includes('<img'));
        await page.evaluate(() => {cloudUser=null;cloudClient=null;window.MOP_CLOUD.communityEnabled=false;tab('home')});
        return 'Mock-only community: private defaults, explicit sharing confirmation, escaped malicious content, hidden admin controls, cleared prior-account snapshot. Database authorization covered separately.';
      });
      await check(`Offline shell, Bible and devotional at ${width}px`, async () => {
        await page.evaluate(async () => { await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Service worker did not become ready within 20 seconds')),20000))]); if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true })); });
        // Fetch the Bible before disconnecting, then test a chapter never opened in this context.
        await page.evaluate(() => tab('bible'));
        await page.locator('#bibleText .chapter-verse').first().waitFor({ timeout: 15000 });
        await context.setOffline(true);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.locator('#content').waitFor();
        await page.evaluate(() => { bibleBook = 'Revelation'; bibleChapter = 22; tab('bible'); });
        await page.locator('#bibleText .chapter-verse').first().waitFor({ timeout: 15000 });
        const text = await page.locator('#bibleText').innerText(); assert(text.length > 100);
        await page.evaluate(() => openDay(40));
        await page.locator('#devotionalBible .scripture').waitFor({ timeout: 10000 });
        await noOverflow(page);
        const coverage = await page.evaluate(async () => {
          const data = await MOPBible.dataset(); let chapters=0,verses=0;
          for (const [book,value] of Object.entries(data.books)) for (const chapter of Object.keys(value.chapters)) {
            const passage=await MOPBible.passage(`${book} ${chapter}`); chapters++; verses+=passage.verses.length;
          }
          return {books:Object.keys(data.books).length,chapters,verses};
        });
        assert.deepEqual(coverage,{books:66,chapters:1189,verses:31103});
        return 'Offline reload, previously unopened Revelation 22, day 40, all 66 books / 1,189 chapters / 31,103 verse slots.';
      });
      await check(`External requests blocked at ${width}px`, async () => {
        assert(blocked.every(url => new URL(url).origin !== origin));
        return `${blocked.length} external requests blocked; no live API/database traffic allowed.`;
      });
      await context.close();
    }
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
  for (const result of results) console.log(`${result.status}: ${result.name}\n  ${result.detail}`);
  if (process.env.QA_REPORT_PATH) fs.writeFileSync(process.env.QA_REPORT_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
  if (results.some(result => result.status === 'FAIL')) process.exitCode = 1;
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
