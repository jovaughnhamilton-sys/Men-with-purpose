const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
for(const [,script] of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(script.trim())new vm.Script(script);
new vm.Script(fs.readFileSync(__dirname+'/mop-languages.js','utf8'));
const rows=new Map(),storage=new Map();let signupSession=null,signoutError=null,forceConflict=false,reads=0;
const elements={accountEmail:{value:'test@example.com',checkValidity:()=>true},accountPassword:{value:'test-password'}};
let tasks=[];
const ctx=vm.createContext({console,URL,location:{href:'https://jovaughnhamilton-sys.github.io/Men-with-purpose/'},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},document:{getElementById:k=>elements[k]||null,addEventListener:()=>{}},window:{MOP_CLOUD:{url:'https://example.supabase.co',anonKey:'public',googleEnabled:true},supabase:{},addEventListener:()=>{}},setTimeout:f=>{tasks.push(f);return tasks.length},clearTimeout:()=>{},confirm:()=>true});
vm.runInContext(`const K='mop-v1-';let cloudUser=null,cloudClient=null,screen='home';const esc=s=>String(s);function render(){};const get=(k,d)=>{let v=localStorage.getItem(storageKey(k));return v===null?d:JSON.parse(v)};const put=(k,v)=>{localStorage.setItem(storageKey(k),JSON.stringify(v));accountChanged()};function completed(){return get('completed',[])}function bookmarks(){return get('bookmarks',[])}function journal(){return get('journalEntries',[])}`,ctx);
vm.runInContext(fs.readFileSync(__dirname+'/mop-accounts.js','utf8'),ctx);
ctx.mockClient={auth:{signUp:async()=>({data:{user:{id:'A'},session:signupSession},error:null}),signInWithPassword:async()=>({data:{session:{user:{id:'A',email:'test@example.com'}}},error:null}),signOut:async()=>({error:signoutError}),resend:async()=>({error:null}),signInWithOAuth:async args=>{assert.equal(args.provider,'google');assert.equal(args.options.redirectTo,'https://jovaughnhamilton-sys.github.io/Men-with-purpose/');return {error:null}}},from:()=>({select:()=>({eq:(_k,uid)=>({maybeSingle:async()=>{reads++;return {data:rows.get(uid)||null,error:null}}})})}),rpc:async(_fn,args)=>{const uid=vm.runInContext('accountScope',ctx),prev=rows.get(uid);if(forceConflict||(prev?.revision??0)!==args.expected_revision)return {error:{code:'40001'}};const revision=(prev?.revision??0)+1;rows.set(uid,{payload:structuredClone(args.new_payload),revision});return {data:revision,error:null}}};
vm.runInContext('cloudClient=mockClient',ctx);
const run=s=>vm.runInContext(s,ctx),plain=v=>JSON.parse(JSON.stringify(v));
(async()=>{
 storage.set('mop-v1-completed','[7]');storage.set('mop-v1-journalEntries',JSON.stringify([{id:'guest',date:'2026-10-12',text:'Guest journal',answered:false}]));
 await run('cloudSignIn(true)');assert.equal(run('cloudUser'),null);assert.equal(run('accountMessage'),'verify');assert.equal(reads,0);assert.equal(elements.accountPassword.value,'');
 elements.accountPassword.value='test-password';await run('cloudSignIn(false)');assert.equal(run('cloudUser.id'),'A');assert.deepEqual(plain(run('completed()')),[]);assert.deepEqual(plain(run('journal()')),[]);
 run('importGuestData()');await run('syncAccount()');assert.deepEqual(rows.get('A').payload.completed,[7]);assert.equal(rows.get('A').payload.journalEntries[0].text,'Guest journal');assert.equal(storage.get('mop-v1-completed'),'[7]');
 run("put('completed',[7,8])");await run('syncAccount()');assert.deepEqual(rows.get('A').payload.completed,[7,8]);
 rows.get('A').revision++;run("put('completed',[7,8,9])");await run('syncAccount()');assert.equal(run('accountMessage'),'conflict');assert.deepEqual(rows.get('A').payload.completed,[7,8]);assert.deepEqual(plain(run('completed()')),[7,8,9]);
 await run('cloudDownload()');assert.deepEqual(plain(run('completed()')),[7,8]);
 run("put('completed',[7,8,10])");forceConflict=true;await run('syncAccount()');assert.equal(run('accountMessage'),'conflict');assert.equal(run("accountMeta('dirty',false)"),true);forceConflict=false;
 await run('cloudUpload()');assert.deepEqual(rows.get('A').payload.completed,[7,8,10]);
 signoutError={message:'network'};await run('cloudSignOut()');assert.equal(run('cloudUser.id'),'A');assert.equal(run('accountMessage'),'logoutFailed');signoutError=null;
 await run('cloudSignOut()');assert.equal(run('cloudUser'),null);assert.deepEqual(plain(run('completed()')),[7]);
 await run("activateAccount({id:'B',email:'b@example.com'})");assert.deepEqual(plain(run('journal()')),[]);run('importGuestData()');assert.equal(run('accountMessage'),'importBlocked');run("put('completed',[1])");await run('syncAccount()');assert.deepEqual(rows.get('B').payload.completed,[1]);assert.deepEqual(rows.get('A').payload.completed,[7,8,10]);
 await run('cloudSignOut()');await run("activateAccount({id:'A'})");assert.deepEqual(plain(run('completed()')),[7,8,10]);await run("cloudOAuth('google')");
 for(const [lang,word] of [['en','Sign in'],['es','Iniciar sesión'],['pt','Entrar']]){storage.set('mop-language',lang);assert.equal(run("accountText('login')"),word)}
 // A first-load edit must not overwrite an existing legacy revision-zero backup.
 rows.set('C',{payload:structuredClone(rows.get('A').payload),revision:0});storage.set('mop-account-C-_dirty','true');storage.set('mop-account-C-completed','[2]');await run("activateAccount({id:'C'})");assert.equal(run('accountMessage'),'conflict');assert.deepEqual(rows.get('C').payload.completed,[7,8,10]);
 console.log('PASS: syntax; unverified registration; login; logout failure/success; Google redirect; account isolation; explicit guest migration; saved progress; sync; conflicts; English/Spanish/Portuguese.');
 console.log('Mock app tests only. Live provider, email delivery and browser syncing still required. Database RLS was verified separately.');
})().catch(e=>{console.error(e);process.exitCode=1});
