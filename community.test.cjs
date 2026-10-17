const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const listeners={};let calls=0,pending=null;const panel={innerHTML:'',querySelector:()=>null};
const ctx=vm.createContext({console,document:{getElementById:()=>panel,addEventListener:(k,f)=>{listeners[k]=f}},window:{MOP_CLOUD:{},navigator:{onLine:true},addEventListener:(k,f)=>{listeners[k]=f},confirm:()=>true},FormData:class{entries(){return []}}});
vm.runInContext(`let cloudUser={id:'A'},cloudClient=null`,ctx);
vm.runInContext(fs.readFileSync(__dirname+'/mop-community.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
ctx.mock={from:()=>({select:()=>{const q={order:()=>q,limit:async()=>{calls++;if(pending)return pending;return {data:[],error:null}}};return q}}),rpc:async()=>{calls++;return {data:{id:'new'},error:null}}};run('cloudClient=mock');
(async()=>{
run('window.renderCommunity()');assert.match(panel.innerHTML,/development preview/);
await run('window.MOPCommunity.refresh()');assert.equal(calls,0,'Disabled must issue no network requests');
await assert.rejects(()=>run("window.MOPCommunity.write('create_group',{name:'Test'})"));assert.equal(calls,0);
run('window.MOP_CLOUD.communityEnabled=true');await run('window.MOPCommunity.refresh()');assert.equal(calls,6);assert.match(panel.innerHTML,/Only me \(private\)/);
assert.equal(run(`window.MOPCommunity.escape('<img src=x onerror="alert(1)">')`),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
run('window.navigator.onLine=false');listeners.offline();assert.match(panel.innerHTML,/internet connection/);const before=calls;await assert.rejects(()=>run("window.MOPCommunity.write('create_group',{})"));assert.equal(calls,before,'Offline writes never queue/share later');
run('window.navigator.onLine=true');let resolve;pending=new Promise(r=>{resolve=r});const refresh=run('window.MOPCommunity.refresh()');run("cloudUser={id:'B'};window.renderCommunity()");resolve({data:[{id:'old-private-data',body:'A PRIVATE BODY'}],error:null});await refresh;assert.doesNotMatch(panel.innerHTML,/A PRIVATE BODY/,'Stale response must not render across account switch');pending=null;
run('cloudUser=null;window.renderCommunity()');assert.match(panel.innerHTML,/Sign in/);
console.log('Community client: disabled gate, private default, HTML escaping, offline no-queue behavior, stale-account response isolation, signed-out view passed. Mock transport only.');
})().catch(e=>{console.error(e);process.exitCode=1});
