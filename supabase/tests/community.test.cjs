// Real PostgreSQL semantics through PGlite. No network or production credentials.
// npm install --prefix /tmp/mop-community-db --save-exact @electric-sql/pglite@0.5.10 --ignore-scripts
// MOP_PGLITE_MODULE=/tmp/mop-community-db/node_modules/@electric-sql/pglite node supabase/tests/community.test.cjs
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const {PGlite}=require(process.env.MOP_PGLITE_MODULE||'@electric-sql/pglite');
const ids={owner:'00000000-0000-4000-8000-000000000001',member:'00000000-0000-4000-8000-000000000002',outsider:'00000000-0000-4000-8000-000000000003',admin:'00000000-0000-4000-8000-000000000004',guest:'00000000-0000-4000-8000-000000000005',unverified:'00000000-0000-4000-8000-000000000006'};
let checks=0;const db=new PGlite();
async function user(who){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[ids[who]||'']);await db.exec('set role authenticated')}
async function rpc(op,p){const r=await db.query('select public.mop_community_write($1,$2::jsonb) as result',[op,JSON.stringify(p)]);return r.rows[0].result}
async function count(table){return Number((await db.query(`select count(*) as n from public.${table}`)).rows[0].n)}
async function deny(fn,msg){await assert.rejects(fn,undefined,msg);checks++}
function ok(a,b,msg){assert.deepEqual(a,b,msg);checks++}
(async()=>{try{
await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
for(const [name,id] of Object.entries(ids))await db.query('insert into auth.users values($1,$2,$3)',[id,name==='unverified'?null:new Date().toISOString(),name==='guest']);
await db.exec('create table public.user_data(user_id uuid primary key,payload jsonb);grant select,insert,update,delete,truncate,references,trigger on public.user_data to authenticated;');
await db.exec(fs.readFileSync(path.join(__dirname,'../staged/account-grant-hardening.sql'),'utf8'));
await db.exec(fs.readFileSync(path.join(__dirname,'../staged/community.sql'),'utf8'));
await db.query('insert into public.mop_admins values($1)',[ids.admin]);
await user('owner');
await deny(()=>db.exec('truncate public.user_data'),'Account hardening blocks RLS-bypassing truncate');
for(const privilege of ['TRIGGER','REFERENCES'])ok((await db.query("select has_table_privilege('authenticated','public.user_data',$1) as allowed",[privilege])).rows[0].allowed,false,`Account hardening removes ${privilege}`);
ok((await db.query("select has_table_privilege('authenticated','public.user_data','SELECT') as allowed")).rows[0].allowed,true,'Account hardening preserves normal read permission');
const privateGroup=(await rpc('create_group',{name:'Private group',visibility:'private'})).id;const publicGroup=(await rpc('create_group',{name:'Public group',visibility:'public',owner_id:ids.outsider})).id;
ok((await db.query('select owner_id from public.mop_groups where id=$1',[publicGroup])).rows[0].owner_id,ids.owner,'Input cannot forge owner');
await deny(()=>db.query('insert into public.mop_admins values($1)',[ids.owner]),'Cannot self-assign platform admin');
await deny(()=>db.query("update public.mop_memberships set role='leader'"),'No direct role edits');
const privateReflection=(await rpc('save_reflection',{body:'Private copy'})).id;
const publicReflection=(await rpc('save_reflection',{body:'Public copy',audience:'public'})).id;
const groupReflection=(await rpc('save_reflection',{body:'Group only',audience:'group',group_id:privateGroup})).id;
const submission=(await rpc('submit_devotional',{title:'Test devotional',scripture_reference:'John 3:16',body:'A devotional awaiting an independent review.',status:'approved',author_id:ids.admin})).id;
ok((await db.query('select status from public.mop_submissions where id=$1',[submission])).rows[0].status,'pending','Submitter cannot self-publish');
await user('outsider');ok(await count('mop_groups'),1,'Private group undiscoverable');ok(await count('mop_reflections'),1,'Only public reflection visible');ok(await count('mop_submissions'),0,'Unapproved devotional hidden');
await deny(()=>rpc('membership',{group_id:publicGroup,user_id:ids.outsider,status:'active',role:'leader'}),'Outsider cannot promote');
await deny(()=>rpc('save_reflection',{body:'Injection',audience:'group',group_id:privateGroup}),'Nonmember cannot post');
await rpc('join_group',{group_id:privateGroup});ok(await count('mop_groups'),1,'Pending request does not reveal group');
await deny(()=>rpc('save_reflection',{body:'Pending post',audience:'group',group_id:privateGroup}),'Pending cannot post');
await user('owner');await rpc('membership',{group_id:privateGroup,user_id:ids.outsider,status:'active',role:'member'});
await user('outsider');ok(await count('mop_groups'),2,'Approved private member can read group');ok(await count('mop_reflections'),2,'Member can read group reflection');
await deny(()=>rpc('membership',{group_id:privateGroup,user_id:ids.outsider,status:'active',role:'leader'}),'Member cannot self-promote');
await deny(()=>rpc('delete_reflection',{id:publicReflection}),'Cannot delete another author');
await deny(()=>rpc('review_submission',{id:submission,status:'approved',review_note:'Approve'}),'Member cannot review');
await user('member');await rpc('join_group',{group_id:publicGroup});ok((await db.query('select status from public.mop_memberships where user_id=$1',[ids.member])).rows[0].status,'active','Public join active');
await rpc('join_group',{group_id:privateGroup});await user('owner');await rpc('membership',{group_id:privateGroup,user_id:ids.member,status:'active',role:'leader'});
await user('member');await deny(()=>rpc('membership',{group_id:privateGroup,user_id:ids.outsider,status:'active',role:'leader'}),'Leader cannot promote others');
await deny(()=>rpc('membership',{group_id:privateGroup,user_id:ids.owner,status:'removed',role:'member'}),'Owner protected');
await rpc('hide_reflection',{id:groupReflection});await rpc('membership',{group_id:privateGroup,user_id:ids.outsider,status:'removed'});
await user('outsider');ok(await count('mop_reflections'),1,'Removed member loses group access');await deny(()=>rpc('join_group',{group_id:privateGroup}),'Removed user cannot bypass leader');
await user('admin');ok(await count('mop_groups'),2,'Admin oversight private group');ok(await count('mop_reflections'),2,'Admin cannot read private reflection');
await deny(()=>rpc('hide_reflection',{id:privateReflection}),'Admin cannot moderate private copy');await rpc('hide_reflection',{id:publicReflection});
await rpc('review_submission',{id:submission,status:'approved',review_note:'Reference and biblical meaning reviewed.'});
const own=(await rpc('submit_devotional',{title:'Admin draft',scripture_reference:'John 3:16',body:'My own devotional needs a second reviewer.'})).id;
await deny(()=>rpc('review_submission',{id:own,status:'approved',review_note:'Self review'}),'Independent review enforced');
await user('outsider');ok(await count('mop_submissions'),1,'Approved visible');ok(await count('mop_reflections'),0,'Hidden public no longer visible');
await deny(()=>db.exec('truncate public.mop_groups'),'Cannot truncate community tables');
await user('guest');await deny(()=>rpc('create_group',{name:'Anonymous group'}),'Anonymous Auth account cannot mutate');
await user('unverified');await deny(()=>rpc('create_group',{name:'Unverified group'}),'Unverified cannot mutate');
await db.exec('reset role;set role anon');await deny(()=>db.exec('select * from public.mop_groups'),'Signed-out cannot read community');await deny(()=>rpc('create_group',{name:'Anon group'}),'Signed-out cannot execute RPC');
console.log(`Community PostgreSQL permissions: ${checks} checks passed (PGlite, local only).`);
}finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});
