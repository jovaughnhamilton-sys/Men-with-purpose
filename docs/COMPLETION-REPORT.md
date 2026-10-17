# Men of Purpose — development review report

**17 October 2026 · Review build; not deployed**

Local branch: `development/men-of-purpose-2026-10-17`  
Starting production commit: `7cd5dcbd9ef7e203e462a248cbe023bb4149715f`

## Delivered

| Workstream | Result |
| --- | --- |
| Development | Removed Scripture API dependency. Bundled official WEB Classic, all 66 books and 1,189 chapters. Complete offline installation, truthful readiness handshake, recoverable errors, and navigation race protection. |
| Text preservation | All 31,103 canonical verse markers checked against an independent publisher export. Pinned source archives, hashes, importer, notes and superscriptions included. WEB is public domain; the app does not claim exclusive ownership of Scripture. |
| Editorial | All 40 English devotional drafts include Scripture reference, contextual reading, body, prayer, challenge and reflection questions. Original first-seven messages preserved. Seven original supplemental biblical stories reviewed. All drafts require human editorial approval. |
| Branding | Existing logo and green/cream/gold identity retained; mobile wrapping, readable text, keyboard focus, larger controls, reduced-motion support and Purpose Driven parent identity polished. |
| Community | Implemented public/private groups, membership approvals, leader moderation, admin oversight, private-default reflections and explicit sharing copies, and independently approved member devotionals. Additive SQL and account grant hardening are staged only. Community remains disabled. |
| Worship | Twelve monthly themes and welcomes; 40 day/song pairings from four verified Apple Music recordings. No lyrics, audio or artwork redistributed. Streaming requires connectivity. |
| Security | Fixed stale authentication responses and stale identity handling; preserved sync error/conflict status. Backup import now rejects malformed data before altering storage. Proposed removal of unnecessary client TRUNCATE/REFERENCES/TRIGGER grants. |

## Verification performed

- `npm test`: **passed**, including 15 Node test-runner results plus account/client scenario suites and publisher text audit.
- Isolated PGlite PostgreSQL permission suite: **36 assertions passed**. Real local RLS and privilege checks; simulated Supabase Auth roles. No hosted database writes.
- Headless Chromium browser suite: **21 checks passed** across **320px, 390px and 1280px**. All 40 days rendered with Scripture. No horizontal overflow or uncaught exceptions on primary screens. Private text/XSS, malformed backup rejection, mocked community role/default-sharing/account isolation, and full offline reload verified.
- Offline browser traversal resolved **all 66 books, 1,189 chapters and 31,103 verse slots**, including a previously unopened Revelation 22 and day 40 after disconnecting.
- Browser automation blocked external traffic, including production Supabase. Community transport in browser tests was mocked; database permission tests ran separately. Browser results are recorded in `docs/browser-qa-results.json`.
- Visually inspected 320px home layout. SDK is pinned locally with license and SHA-256. `git diff --check` passed.

## Outstanding approval and access gates

1. **GitHub access resolved:** The owner installed the ChatGPT Codex Connector on the repository at approximately 13:07 EDT. Development-branch creation succeeded. This review build is being published through the authorized connector; production remains unchanged. Earlier 403 findings in the infrastructure report are historical.
2. **Hosted staging:** Approve a separate staging project/configuration before testing actual JWTs, PostgREST, email delivery, redirects, OAuth and cross-device sync. No paid Supabase branch was created. Local PostgreSQL tests do not prove hosted configuration.
3. **Editorial approval:** Review original commentary, contextual interpretation, monthly themes and song pairings with a trusted Christian editor/pastor. Reference and quotation checks are automated; doctrinal approval is human. New devotional prose remains English and is excluded from automatic interface phrase replacement.
4. **Security changes:** Approve the staged account privilege hardening and community migration before any live application. Live inspection found authenticated TRUNCATE on `user_data`; this bypasses RLS. No exploit was attempted. Supabase also reports leaked-password protection disabled; review enabling it before launch.
5. **Release:** Review on physical Android Chrome, iPhone Safari and installed PWA, then approve merge, production migration and deployment separately. Native-store submission is outside this delivery.

## Material limits

Community reads at most 200 rows per section and uses manual refresh; moderation identifies accounts by UUID. Pagination, abuse reporting, rate limiting, account erasure/owner transfer and moderation staffing need production-readiness work. Private journals remain in account-scoped browser storage and optional cloud backups, without end-to-end encryption. Storage eviction can remove offline data. Music links depend on provider region/subscription availability. Google and Apple sign-in remain disabled in existing configuration. No live accounts or private content were altered, no migration was applied, and nothing was deployed.

## Suggested next implementation sequence

Restore repository write access and publish a draft PR → approve editorial drafts and staged SQL → verify hosted staging with independent member/leader/admin accounts → complete physical-device and operational review → request production approval for the concrete reviewed release.
