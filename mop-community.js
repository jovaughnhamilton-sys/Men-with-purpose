/* Community preview. Backend writes require explicitly enabled, approved schema. */
(function(root){
'use strict';
let selected=null, snapshot=null, busy=false, message='', generation=0, loadedFor=null, panel=null;
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const getClient=()=>typeof cloudClient!=='undefined'?cloudClient:null;
const getUser=()=>typeof cloudUser!=='undefined'?cloudUser:null;
const enabled=()=>root.MOP_CLOUD?.communityEnabled===true;
const uuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v||'');
const button=(text,action,id='')=>`<button type="button" class="btn alt" data-mop-action="${action}"${id?` data-id="${safe(id)}"`:''}>${safe(text)}</button>`;
function fields(form){return Object.fromEntries(new FormData(form).entries())}
function groupOptions(){return (snapshot?.groups||[]).filter(g=>!g.archived&&snapshot.memberships.some(m=>m.group_id===g.id&&m.user_id===getUser()?.id&&m.status==='active')).map(g=>`<option value="${safe(g.id)}">${safe(g.name)}</option>`).join('')}
function draw(){
 panel=document.getElementById('communityPanel');if(!panel)return;
 const uid=getUser()?.id;
 if(loadedFor!==uid){generation++;snapshot=null;loadedFor=uid;selected=null;busy=false;message=''}
 panel.innerHTML=`<p class="muted">Grow together. Your personal journal stays private. Sharing here creates a separate copy.</p><p role="status" aria-live="polite">${safe(message)}</p>`;
 if(!enabled()){panel.innerHTML+='<div class="status">Community is in development preview. Groups, sharing and devotional review require the approved database update before they can go live.</div><p>Planned: member-created public and private groups, leader moderation, platform oversight, optional public reflections, and reviewed member devotionals.</p>';return}
 if(!uid||!getClient()){panel.innerHTML+='<p>Sign in with a verified account to participate in the community.</p>';return}
 if(root.navigator?.onLine===false){snapshot=null;panel.innerHTML+='<p>Community needs an internet connection. Your offline Bible and private journal remain available.</p>';return}
 if(!snapshot){panel.innerHTML+=button(busy?'Loading…':'Load community','refresh');return}
 const admin=snapshot.admins.some(a=>a.user_id===uid);
 panel.innerHTML+=`<div class="toolbar">${button('Refresh','refresh')}</div><details><summary>Create a study group</summary><form data-mop-form="group"><label>Group name<input name="name" required minlength="3" maxlength="100"></label><label>Description<textarea name="description" maxlength="2000"></textarea></label><label>Visibility<select name="visibility"><option value="private">Private — leader approves join requests</option><option value="public">Public — members can discover and join</option></select></label><button class="btn" type="submit">Create group</button></form></details><h3>Study groups</h3>`;
 for(const g of snapshot.groups){const membership=snapshot.memberships.find(m=>m.group_id===g.id&&m.user_id===uid);panel.innerHTML+=`<article class="card"><h4>${safe(g.name)}</h4><p>${safe(g.description)}</p><small>${safe(g.visibility)}${g.archived?' · archived':''}</small><p>${membership?`Membership: ${safe(membership.status)}`:''}</p><div class="toolbar">${button('Open group','open',g.id)}${!membership&&!g.archived?button('Join group','join',g.id):''}${g.owner_id===uid||admin?button('Archive group','archive',g.id):''}</div></article>`}
 panel.innerHTML+=snapshot.memberships.filter(m=>m.user_id===uid&&m.status==='pending').map(m=>`<p>Membership request pending: <code>${safe(m.group_id)}</code></p>`).join('');
 panel.innerHTML+=`<details><summary>Request to join a private group</summary><p>Ask the group leader for the group ID. The leader will review your request.</p><form data-mop-form="join"><label>Group ID<input name="group_id" required></label><button class="btn" type="submit">Request membership</button></form></details>`;
 if(selected){const g=snapshot.groups.find(g=>g.id===selected);if(g){const lead=admin||g.owner_id===uid||snapshot.memberships.some(m=>m.group_id===g.id&&m.user_id===uid&&m.role==='leader'&&m.status==='active');panel.innerHTML+=`<h3>${safe(g.name)}</h3><p>Group ID: <code>${safe(g.id)}</code></p>`;if(lead){panel.innerHTML+='<h4>Membership requests and moderation</h4>';for(const m of snapshot.memberships.filter(m=>m.group_id===g.id)){panel.innerHTML+=`<p>${safe(m.user_id)} · ${safe(m.status)} · ${safe(m.role)}</p>`;if(m.user_id!==g.owner_id){panel.innerHTML+=`<div class="toolbar">${button('Approve member','approve-member',m.user_id)}${button('Remove member','remove-member',m.user_id)}${admin||g.owner_id===uid?button(m.role==='leader'?'Make member':'Make leader',m.role==='leader'?'demote':'promote',m.user_id):''}</div>`}}}}}
 panel.innerHTML+=`<h3>Reflections</h3><form data-mop-form="reflection"><label>Your reflection<textarea name="body" required maxlength="10000"></textarea></label><label>Who can read this copy?<select name="audience"><option value="private">Only me (private)</option><option value="public">All signed-in community members (public)</option><option value="group">Selected study group</option></select></label><label>Study group (for group sharing)<select name="group_id"><option value="">Choose a group</option>${groupOptions()}</select></label><button class="btn" type="submit">Save reflection</button></form>`;
 for(const r of snapshot.reflections.filter(r=>r.audience!=='group'||!selected||r.group_id===selected)){const lead=r.group_id&&snapshot.memberships.some(m=>m.group_id===r.group_id&&m.user_id===uid&&m.role==='leader'&&m.status==='active');panel.innerHTML+=`<article class="card"><small>${safe(r.audience)}${r.hidden?' · hidden by moderation':''}</small><p style="white-space:pre-wrap">${safe(r.body)}</p><div class="toolbar">${r.author_id===uid?button('Delete my copy','delete-reflection',r.id):''}${r.audience!=='private'&&(admin||lead)?button('Hide from community','hide-reflection',r.id):''}</div></article>`}
 panel.innerHTML+=`<h3>Member devotionals</h3><p>Submissions stay in review until a platform administrator approves them. Scripture and biblical meaning need an independent editorial check.</p><form data-mop-form="submission"><label>Title<input name="title" required minlength="3" maxlength="150"></label><label>Scripture reference<input name="scripture_reference" required minlength="3" maxlength="150"></label><label>Devotional<textarea name="body" required minlength="20" maxlength="30000"></textarea></label><button class="btn" type="submit">Submit for review</button></form>`;
 for(const s of snapshot.submissions){panel.innerHTML+=`<article class="card"><h4>${safe(s.title)}</h4><p>${safe(s.scripture_reference)} · ${safe(s.status)}</p><p style="white-space:pre-wrap">${safe(s.body)}</p>${s.review_note?`<p>Review: ${safe(s.review_note)}</p>`:''}${admin&&s.status==='pending'&&s.author_id!==uid?`<form data-mop-form="review" data-id="${safe(s.id)}"><label>Editorial review note<textarea name="review_note" required maxlength="3000"></textarea></label><label>Decision<select name="status"><option value="rejected">Return / reject</option><option value="approved">Approve after checking Scripture and meaning</option></select></label><button class="btn" type="submit">Record review</button></form>`:''}</article>`}
 if(admin)panel.innerHTML+=`<details><summary>Platform moderation audit</summary>${snapshot.log.map(x=>`<p>${safe(x.created_at)} · ${safe(x.action)} · ${safe(x.target_id)}</p>`).join('')}</details>`;
}
async function refresh(){
 const client=getClient(),uid=getUser()?.id;
 if(!enabled()||!client||!uid||root.navigator?.onLine===false){draw();return}
 if(loadedFor!==uid)draw();
 const seq=++generation;busy=true;message='Loading community…';draw();
 try{const names=['mop_groups','mop_memberships','mop_reflections','mop_submissions','mop_admins','mop_moderation_log'];const results=await Promise.all(names.map(name=>(['mop_groups','mop_reflections','mop_submissions','mop_moderation_log'].includes(name)?client.from(name).select('*').order('created_at',{ascending:false}):client.from(name).select('*')).limit(200)));if(seq!==generation||uid!==getUser()?.id)return;for(const r of results)if(r.error)throw r.error;
 snapshot=Object.fromEntries(['groups','memberships','reflections','submissions','admins','log'].map((k,i)=>[k,results[i].data||[]]));message='Community updated. Showing up to 200 entries in each section.';
 }catch{if(seq===generation){snapshot=null;message='Community is unavailable. The approved database update may still be pending. Nothing has been shared.'}}finally{if(seq===generation){busy=false;draw()}}
}
async function write(op,p){
 if(busy)throw Error('Please wait for the current request.');
 const client=getClient(),uid=getUser()?.id;
 if(!enabled()||!client||!uid||root.navigator?.onLine===false)throw Error('Sign in and connect to the internet. Community must be enabled after database approval.');
 busy=true;const seq=generation;
 try{const {error}=await client.rpc('mop_community_write',{op,p});if(seq!==generation||uid!==getUser()?.id)return;if(error)throw Error('Request was not accepted. Check your account, permissions and group membership.');message='Saved.'}
 finally{if(seq===generation)busy=false}
 await refresh();
}
function showError(e){message=e.message;const status=panel?.querySelector('[role="status"]');if(status)status.textContent=message}
async function submit(event){const form=event.target.closest('[data-mop-form]');if(!form||!panel?.contains(form))return;event.preventDefault();if(!form.reportValidity())return;const p=fields(form);
 try{switch(form.dataset.mopForm){case'group':await write('create_group',p);break;case'join':if(!uuid(p.group_id))throw Error('Enter a valid group ID.');await write('join_group',p);break;case'reflection':if(p.audience==='group'&&!uuid(p.group_id))throw Error('Choose a study group.');if(p.audience!=='private'&&!root.confirm(`Share this reflection with ${p.audience==='public'?'all signed-in community members':'the selected study group'}? Your private journal will not be changed.`))return;await write('save_reflection',p);break;case'submission':await write('submit_devotional',p);break;case'review':await write('review_submission',{...p,id:form.dataset.id});break}}catch(e){showError(e)}}
async function click(event){const b=event.target.closest('[data-mop-action]');if(!b||!panel?.contains(b))return;const id=b.dataset.id;
 try{switch(b.dataset.mopAction){case'refresh':await refresh();break;case'open':selected=id;draw();break;case'join':await write('join_group',{group_id:id});break;case'archive':if(root.confirm('Archive this group? New joins and group reflections will stop.'))await write('archive_group',{group_id:id});break;case'delete-reflection':if(root.confirm('Delete this community reflection copy?'))await write('delete_reflection',{id});break;case'hide-reflection':await write('hide_reflection',{id});break;case'approve-member':case'remove-member':case'promote':case'demote':await write('membership',{group_id:selected,user_id:id,status:b.dataset.mopAction==='remove-member'?'removed':'active',role:b.dataset.mopAction==='promote'?'leader':'member'});break}}catch(e){showError(e)}}
root.renderCommunity=draw;
root.MOPCommunity={refresh,write,escape:safe};
if(typeof document!=='undefined'){document.addEventListener('submit',submit);document.addEventListener('click',click);root.addEventListener('offline',()=>{generation++;snapshot=null;busy=false;draw()});root.addEventListener('online',draw)}
})(typeof window==='undefined'?globalThis:window);
