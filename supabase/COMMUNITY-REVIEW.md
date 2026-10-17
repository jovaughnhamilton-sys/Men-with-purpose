# Community implementation and approval boundary

Status: implemented in development; database changes staged, **not applied**. No live rows, policies, configuration, or content were changed by this workstream.

## Existing infrastructure used

Read-only infrastructure inspection identified project `bxpkqrhlvjtgucoxxaue` and `public.user_data(user_id uuid, payload jsonb, updated_at timestamptz, revision bigint)`, with account ownership RLS, `mop_save_user_data`, and migration `20261012204326 secure_devotional_account_data`. There were no community tables or Edge Functions. Community reuses existing Supabase Auth accounts; it does not introduce another login system or copy the private account payload into community tables.

Inspection also found `TRUNCATE`, `REFERENCES`, and `TRIGGER` privileges on `user_data` for `authenticated`. TRUNCATE bypasses RLS. `staged/account-grant-hardening.sql` removes these unnecessary privileges for `anon` and `authenticated`; this separate reviewed security change remains unapplied. The SQL does not modify the existing account data or account save function.

## Approved implementation path

1. Review both `staged/community.sql` and `staged/account-grant-hardening.sql`. They deliberately sit outside `supabase/migrations`; copying them there does not imply approval to apply them.
2. Provision an isolated Supabase development project or branch, matching the inspected Auth/account schema. Keep `mop_private` out of exposed Data API schemas.
3. Use the current CLI's `supabase migration new men_of_purpose_community` to create the migration file, then insert the reviewed staged SQL. Use a separate migration for account privilege hardening. Do not rename staged files into guessed migration timestamps.
4. Apply to that isolated environment only after environment approval. Run Supabase security advisors and the complete authenticated HTTP access matrix with real JWTs, expired tokens, and independent users. Confirm schema grants and RPC availability with actual PostgREST requests. The local tests are not a substitute for these environment checks.
5. Add platform administrators using reviewed Auth UUIDs through trusted SQL/service operations. There is intentionally no browser action that can grant platform admin. Verify identity before running `insert into public.mop_admins(user_id) values ('REVIEWED-AUTH-UUID')` in the approved isolated environment.
6. Point a development-only cloud config at that environment. Only then set `MOP_CLOUD.communityEnabled=true`. A browser feature flag is a readiness gate, **not** authorization. Database grants, verified-account checks, RLS, and the mutation gateway enforce authorization independently.
7. Obtain separate production migration/deployment approval after staging and content review. Nothing here deploys or overwrites live content.

## Access model

| Resource | Read | Mutation |
| --- | --- | --- |
| Public study group | Signed-in members can discover public, unarchived groups | Creator becomes owner/leader; verified members join |
| Private study group | Owner, active members, platform admin | Member requests join with group ID; leader approves |
| Memberships | Own membership, group leaders, platform admin | Gateway only; leaders approve/remove members; owner/admin manages leaders |
| Private reflection | Author only, including against admin access | Author creates/deletes a separate copy |
| Public reflection | Signed-in community; hidden copies only author/admin | Explicit sharing confirmation; author deletes; admin hides |
| Group reflection | Active group members; hidden copies only author/admin | Active members post; leaders/admin hide; author deletes |
| Member devotional | Author/admin while pending; approved copies readable to members | Submit as pending; independent platform admin reviews with a note |
| Moderation log | Platform admin | Append-only through mutation gateway |

Private groups are not listed to outsiders. Leaders can give a prospective member the group UUID; the request remains pending until approved. Removed members cannot immediately rejoin. Owner membership is protected, and ordinary leaders cannot appoint or remove other leaders. Group archiving is available to owner/admin, prevents joining/new group reflections, and removes group reflections from other members' group reads; authors retain access to their own copies.

Public groups are discoverable by signed-in users; group reflection content requires active membership. Public reflection sharing means visible to all signed-in community members, not anonymous internet visitors. UI wording states that scope.

Member devotional approval publishes the submitted item in the community section. It **does not** replace, auto-merge into, or edit the curated 40-day journey. Human editorial checking of references, rights, biblical meaning, and suitability is still required; entering an admin review note is not an automated theological verification.

## Security design

All six community tables have RLS and explicit authenticated SELECT grants; client INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER are revoked. Mutations use the `public.mop_community_write` security-invoker wrapper and the non-exposed `mop_private.community_write` security-definer gateway. The latter is deliberately privileged for atomic multi-table operations: it verifies a confirmed, non-anonymous Auth user, derives identity from `auth.uid()`, checks every operation's role and ownership, uses fixed SQL with an empty search path, and never trusts input `author_id`, owner, admin flags, or user metadata. Direct execution of this internal gateway has the same checks; its schema must remain non-exposed.

Private helper functions avoid recursive RLS membership checks, and expose only boolean authorization results for the caller. PUBLIC and anon function execution are revoked. Do not widen their grants or expose the private schema.

The client renders user content as escaped text. Community snapshots live in memory, are discarded on account changes and offline transitions, and never enter localStorage or service worker data caches. There is no queued offline sharing: a public share needs a live request and explicit confirmation. Existing journals in `user_data.payload` are not read or changed by the module. Sharing requires entering a separate reflection copy; original journal entries never become public by toggling a flag.

## Verification performed

- `node community.test.cjs`: passed. Tests default-disabled no-network behavior, private reflection default, HTML escaping, offline writes rejected without queuing, stale asynchronous read isolation across account changes, and signed-out behavior. Transport is mocked.
- `MOP_PGLITE_MODULE=/tmp/mop-community-db/node_modules/@electric-sql/pglite node supabase/tests/community.test.cjs`: **36 actual PostgreSQL assertions passed** using PGlite 0.5.10. Applies the staged schema to a fresh local engine with simulated Supabase Auth roles/identity. Exercises real RLS and privilege checks, private group discoverability, pending/approved/removed membership, member/leader/admin escalation denials, hidden posts, private reflections excluded from admin reads, author ownership, submissions unable to self-publish, independent review, guest/unverified/anon/direct-write/TRUNCATE denials, and account grant hardening while preserving normal read privileges.
- `node --check mop-community.js`: passed.

To reproduce the database suite without adding runtime dependencies to this static app:

```bash
npm install --prefix /tmp/mop-community-db --save-exact @electric-sql/pglite@0.5.10 --ignore-scripts --no-audit --no-fund
MOP_PGLITE_MODULE=/tmp/mop-community-db/node_modules/@electric-sql/pglite node supabase/tests/community.test.cjs
```

PGlite is real PostgreSQL in WASM, not the live Supabase service. Auth tables and roles are local test fixtures. Real JWT/session behavior, PostgREST schema exposure, email verification, production advisors, and hosted mobile flows remain to be verified in an approved isolated Supabase environment.

## Known scope limits

The current client loads at most 200 rows per section (most recent first for timestamped content), states this limit, and supports manual refresh. Pagination/search, realtime subscriptions, report-abuse intake, member-facing appeals, anti-spam rate limits, account-erasure/owner transfer workflows, and moderation operations staffing need a later production-readiness pass. The gateway caps active owned groups at 10 but is not a complete anti-abuse system. No extra profile table is introduced; moderation identifies members by account UUID until a reviewed public display-name policy is designed.

## Documentation checked

Supabase changelog fetched 2026-10-17; relevant current database-functions, API grants, and RLS documentation consulted. Recent TLS and PostgreSQL operator/extension breaking changes do not require extra extensions or custom operators for this design. Explicit grants accommodate Supabase's move away from automatically exposed tables.

- https://supabase.com/changelog.md
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes
- https://supabase.com/changelog/cbc-tls-ciphers-deprecated
