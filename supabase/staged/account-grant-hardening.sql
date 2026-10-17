-- REVIEW ONLY. Separate security change; does not alter or read live account data.
-- Inspection found unnecessary TRUNCATE/REFERENCES/TRIGGER grants. TRUNCATE
-- bypasses RLS, so a grant must never be treated as row ownership protection.
begin;
revoke truncate, references, trigger on public.user_data from anon, authenticated;
commit;
