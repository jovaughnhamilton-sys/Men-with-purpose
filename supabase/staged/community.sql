-- REVIEW ONLY. Never run against production without explicit approval.
-- Based on inspected live schema: user_data is untouched. Create a CLI migration
-- with `supabase migration new men_of_purpose_community` before approved application.
begin;
create schema if not exists mop_private;
revoke all on schema mop_private from public, anon;
grant usage on schema mop_private to authenticated;
create table public.mop_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
create table public.mop_groups (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 name text not null check (length(btrim(name)) between 3 and 100),
 description text not null default '' check(length(description)<=2000),
 visibility text not null default 'private' check(visibility in ('public','private')),
 archived boolean not null default false, created_at timestamptz not null default now()
);
create table public.mop_memberships (
 group_id uuid not null references public.mop_groups(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'member' check(role in ('member','leader')),
 status text not null default 'pending' check(status in ('pending','active','removed')),
 primary key(group_id,user_id)
);
create index mop_memberships_user on public.mop_memberships(user_id);
create table public.mop_reflections (
 id uuid primary key default gen_random_uuid(), author_id uuid not null references auth.users(id),
 body text not null check(length(btrim(body)) between 1 and 10000),
 audience text not null default 'private' check(audience in ('private','public','group')),
 group_id uuid references public.mop_groups(id), hidden boolean not null default false,
 created_at timestamptz not null default now(),
 check((audience='group' and group_id is not null) or (audience<>'group' and group_id is null))
);
create index mop_reflections_group on public.mop_reflections(group_id);
create index mop_reflections_author on public.mop_reflections(author_id);
create table public.mop_submissions (
 id uuid primary key default gen_random_uuid(), author_id uuid not null references auth.users(id),
 title text not null check(length(btrim(title)) between 3 and 150),
 scripture_reference text not null check(length(btrim(scripture_reference)) between 3 and 150),
 body text not null check(length(btrim(body)) between 20 and 30000),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 review_note text not null default '' check(length(review_note)<=3000),
 reviewed_by uuid references auth.users(id), reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create index mop_submissions_author on public.mop_submissions(author_id);
create table public.mop_moderation_log (
 id uuid primary key default gen_random_uuid(), actor_id uuid not null references auth.users(id),
 action text not null, target_id uuid not null, created_at timestamptz not null default now()
);
-- Non-exposed helpers bypass table recursion only; no user-supplied identity.
create function mop_private.is_admin() returns boolean language sql stable security definer set search_path=''
as $$ select auth.uid() is not null and exists(select 1 from public.mop_admins where user_id=auth.uid()) $$;
create function mop_private.is_member(gid uuid) returns boolean language sql stable security definer set search_path=''
as $$ select auth.uid() is not null and exists(select 1 from public.mop_memberships where group_id=gid and user_id=auth.uid() and status='active') $$;
create function mop_private.is_leader(gid uuid) returns boolean language sql stable security definer set search_path=''
as $$ select auth.uid() is not null and exists(select 1 from public.mop_groups g where g.id=gid and (g.owner_id=auth.uid() or exists(select 1 from public.mop_memberships m where m.group_id=g.id and m.user_id=auth.uid() and m.status='active' and m.role='leader'))) $$;
alter table public.mop_admins enable row level security;
alter table public.mop_groups enable row level security;
alter table public.mop_memberships enable row level security;
alter table public.mop_reflections enable row level security;
alter table public.mop_submissions enable row level security;
alter table public.mop_moderation_log enable row level security;
create policy admins_read on public.mop_admins for select to authenticated using(user_id=auth.uid());
create policy groups_read on public.mop_groups for select to authenticated using(mop_private.is_admin() or owner_id=auth.uid() or mop_private.is_member(id) or (visibility='public' and not archived));
create policy memberships_read on public.mop_memberships for select to authenticated using(user_id=auth.uid() or mop_private.is_admin() or mop_private.is_leader(group_id));
create policy reflections_read on public.mop_reflections for select to authenticated using(author_id=auth.uid() or (audience<>'private' and (mop_private.is_admin() or (not hidden and (audience='public' or (audience='group' and mop_private.is_member(group_id) and exists(select 1 from public.mop_groups g where g.id=group_id and not g.archived)))))));
create policy submissions_read on public.mop_submissions for select to authenticated using(author_id=auth.uid() or status='approved' or mop_private.is_admin());
create policy log_read on public.mop_moderation_log for select to authenticated using(mop_private.is_admin());
-- Narrow mutation gateway is necessary for atomic multi-table authorization and
-- immutable roles/review metadata. No dynamic SQL; every operation checks auth.uid().
create function mop_private.community_write(op text,p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid(); gid uuid; target uuid; result_id uuid; g public.mop_groups;
 r public.mop_reflections; s public.mop_submissions; isadmin boolean;
 audience text; current_status text;
begin
 if actor is null or not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null and coalesce(is_anonymous,false)=false) then raise exception 'Verified account required' using errcode='42501'; end if;
 isadmin := mop_private.is_admin();
 if op='create_group' then
  if (select count(*) from public.mop_groups where owner_id=actor and not archived)>=10 then raise exception 'Group limit reached'; end if;
  insert into public.mop_groups(owner_id,name,description,visibility) values(actor,p->>'name',coalesce(p->>'description',''),coalesce(p->>'visibility','private')) returning id into result_id;
  insert into public.mop_memberships values(result_id,actor,'leader','active');
 elsif op in ('join_group','membership','archive_group') then
  gid := (p->>'group_id')::uuid;
  select * into g from public.mop_groups where id=gid for update;
  if not found then raise exception 'Group unavailable' using errcode='42501'; end if;
  if op='join_group' then
   if g.archived then raise exception 'Group unavailable'; end if;
   select status into current_status from public.mop_memberships where group_id=gid and user_id=actor;
   if current_status='removed' then raise exception 'Contact a group leader' using errcode='42501'; end if;
   insert into public.mop_memberships values(gid,actor,'member',case when g.visibility='public' then 'active' else 'pending' end) on conflict do nothing;
  elsif op='archive_group' then
   if not (isadmin or g.owner_id=actor) then raise exception 'Owner or administrator required' using errcode='42501'; end if;
   update public.mop_groups set archived=true where id=gid;
  else
   if not (isadmin or mop_private.is_leader(gid)) then raise exception 'Leader required' using errcode='42501'; end if;
   target := (p->>'user_id')::uuid;
   if target=g.owner_id then raise exception 'Owner membership cannot be changed'; end if;
   if p->>'role'='leader' or exists(select 1 from public.mop_memberships where group_id=gid and user_id=target and role='leader') then
    if not (isadmin or g.owner_id=actor) then raise exception 'Only owner or administrator can manage leaders' using errcode='42501'; end if;
   end if;
   update public.mop_memberships set status=p->>'status',role=coalesce(p->>'role','member') where group_id=gid and user_id=target;
   if not found then raise exception 'Membership unavailable'; end if;
  end if;
  result_id := gid;
 elsif op='save_reflection' then
  audience := coalesce(p->>'audience','private');
  gid := nullif(p->>'group_id','')::uuid;
  if audience='group' then
   if not mop_private.is_member(gid) or not exists(select 1 from public.mop_groups where id=gid and not archived) then raise exception 'Active group membership required' using errcode='42501'; end if;
  else gid := null; end if;
  -- Explicit new copy only. Never reads or rewrites user_data/journals.
  insert into public.mop_reflections(author_id,body,audience,group_id) values(actor,p->>'body',audience,gid) returning id into result_id;
 elsif op in ('delete_reflection','hide_reflection') then
  result_id := (p->>'id')::uuid;
  select * into r from public.mop_reflections where id=result_id for update;
  if not found then raise exception 'Reflection unavailable' using errcode='42501'; end if;
  if op='delete_reflection' then
   if r.author_id<>actor then raise exception 'Author required' using errcode='42501'; end if;
   delete from public.mop_reflections where id=result_id;
  else
   if r.audience='private' or not (isadmin or (r.audience='group' and mop_private.is_leader(r.group_id))) then raise exception 'Moderator required' using errcode='42501'; end if;
   update public.mop_reflections set hidden=true where id=result_id;
  end if;
 elsif op='submit_devotional' then
  insert into public.mop_submissions(author_id,title,scripture_reference,body) values(actor,p->>'title',p->>'scripture_reference',p->>'body') returning id into result_id;
 elsif op='review_submission' then
  if not isadmin then raise exception 'Administrator required' using errcode='42501'; end if;
  result_id := (p->>'id')::uuid;
  select * into s from public.mop_submissions where id=result_id for update;
  if not found or s.author_id=actor or s.status<>'pending' then raise exception 'An independent review of a pending submission is required' using errcode='42501'; end if;
  if p->>'status' not in ('approved','rejected') or nullif(btrim(p->>'review_note'),'') is null then raise exception 'Decision and review note required'; end if;
  update public.mop_submissions set status=p->>'status',review_note=p->>'review_note',reviewed_by=actor,reviewed_at=now() where id=result_id;
 else raise exception 'Unknown community operation'; end if;
 insert into public.mop_moderation_log(actor_id,action,target_id) values(actor,op,result_id);
 return jsonb_build_object('id',result_id);
end $$;
create function public.mop_community_write(op text,p jsonb) returns jsonb language sql security invoker set search_path='' as $$ select mop_private.community_write(op,p) $$;
revoke all on public.mop_admins,public.mop_groups,public.mop_memberships,public.mop_reflections,public.mop_submissions,public.mop_moderation_log from public,anon,authenticated;
grant select on public.mop_admins,public.mop_groups,public.mop_memberships,public.mop_reflections,public.mop_submissions,public.mop_moderation_log to authenticated;
revoke all on function mop_private.is_admin(),mop_private.is_member(uuid),mop_private.is_leader(uuid),mop_private.community_write(text,jsonb) from public,anon,authenticated;
grant execute on function mop_private.is_admin(),mop_private.is_member(uuid),mop_private.is_leader(uuid),mop_private.community_write(text,jsonb) to authenticated;
revoke all on function public.mop_community_write(text,jsonb) from public,anon,authenticated;
grant execute on function public.mop_community_write(text,jsonb) to authenticated;
commit;
