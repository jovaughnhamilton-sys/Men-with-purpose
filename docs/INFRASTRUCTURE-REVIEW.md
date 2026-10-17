# Infrastructure review — 17 October 2026

Read-only inspection of the connected **Men of Purpose** Supabase project
`bxpkqrhlvjtgucoxxaue` completed before community schema design. No live rows,
authentication settings, schema, functions, or deployments were changed.

## Existing infrastructure

- PostgreSQL 17; project reported ACTIVE_HEALTHY.
- One application table: `public.user_data`, reported zero rows at inspection.
- Columns: `user_id uuid` primary key referencing `auth.users(id)`, `payload jsonb`,
  `updated_at timestamptz`, `revision bigint default 0`.
- Row-level security enabled. SELECT, INSERT, UPDATE, and `mop_owner_guard` ALL
  policies constrain rows to `auth.uid() = user_id`; UPDATE has WITH CHECK.
- Migration `20261012204326_secure_devotional_account_data` exists remotely.
- `public.mop_save_user_data(expected_revision bigint,new_payload jsonb)` is an
  invoker function with empty search path, authenticated ownership and optimistic
  revision checks. Existing account module calls this RPC.
- No Edge Functions were returned.

## Findings and review actions

1. **High priority: authenticated has TRUNCATE on user_data.** TRUNCATE is outside
   row-level security. A staged SQL remediation revokes TRUNCATE, REFERENCES, and
   TRIGGER privileges from client roles. This was identified from catalog grants;
   no destructive exploit was attempted. Apply only after owner review.
2. Supabase security advisor reports leaked-password protection disabled.
   Review availability and enable in Auth settings before a public launch:
   https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
3. Existing direct INSERT/UPDATE access can bypass the application's optimistic
   revision RPC. Ownership RLS still applies. Treat conflict protection as a
   cooperative client protocol until writes are restricted behind an approved
   server-side interface. Do not claim all clients must use revisions.
4. The former `SUPABASE-SETUP.sql` was older than the live revision/RPC schema
   and has been removed. It must not replace the inspected remote migration.
5. Google and Apple UI flags are currently false. Provider credentials, verified
   redirects, email delivery and live multi-account authentication need staging
   verification. No provider was enabled in this change.

## Separation and release gate

Community SQL is a proposed additive change. Preserve `user_data` and all private
journals. Use a separate staging Supabase instance before applying it; branch
compute must not be purchased without cost approval. Community stays disabled
until staging SQL, policy tests, admin bootstrap, and configuration are approved.
Do not enable the development build against production for acceptance testing.

GitHub metadata reports push/admin permission for the connected user, but the
integration rejected creation of a development ref with HTTP 403, `Resource not
accessible by integration`. The shell has no GitHub write credentials. The local
branch is independent of `main`; reconnect/authorize the GitHub integration with
repository Contents read/write and Pull requests read/write before publishing a
branch or draft PR. A successful read is not evidence of integration write access.
