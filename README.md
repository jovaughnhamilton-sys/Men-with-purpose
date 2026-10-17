# Men of Purpose — development review

A Christian devotional app under **Purpose Driven** and **Triple J’s Solutions Enterprises Ltd.**

This is the review build on `development/men-of-purpose-2026-10-17`. Nothing in this branch authorizes production deployment, live SQL, provider changes, or editorial publication.

## Included

- Official, pinned **World English Bible Classic**: 66 books, 1,189 chapters, 31,103 verse markers; complete offline reading after a successful online installation. Publisher source archives, reproducible import and independent verse checks are included. No third-party Scripture API.
- All 40 original devotional drafts with prayers, challenges, contextual readings and reflection questions. Original first-seven messages retained; seven supplemental biblical stories. Every day is labelled for editorial review.
- Green, cream and gold polish, original logo, accessible controls and mobile layouts.
- Twelve monthly themes, month welcome and 40 curated day/song pairings drawn from four official YouTube uploads. Music playback needs connectivity and the streaming service.
- Member-created public/private study groups, leader moderation, platform admin oversight, private-by-default community reflections with explicit sharing, and independently reviewed devotional submissions. **Community stays disabled until its staged schema is approved and tested against hosted staging.**
- Account isolation and optimistic sync retained; stale authentication response handling and backup validation repaired.

## Run locally

Serve the repository over localhost (service workers do not work on file URLs):

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080`. Keep the first visit connected until the Bible reader says it is ready offline. A first visit without internet or browser storage eviction does not guarantee offline availability.

`cloud-config.js` retains the existing public client configuration. **Do not sign into the production project for acceptance testing.** Supply a separate staging project configuration before testing real accounts or setting `communityEnabled: true`. Never place secret/service-role keys in this file. Guest Bible/devotional/journal testing needs no account.

## Verification

```sh
npm ci
npm test
npm run test:permissions
npx playwright install chromium
npm run test:browser
```

Python 3 is required for the independent publisher text audit. Browser automation blocks all external requests, including the live Supabase project. If Chromium is already installed, set `QA_CHROMIUM_EXECUTABLE=/absolute/path/to/chromium`. Permissions tests use isolated PGlite PostgreSQL; they do not use or alter the hosted project. See the completion report for actual results and remaining staging checks.

## Review documents

- [Completion report](docs/COMPLETION-REPORT.md)
- [Infrastructure findings](docs/INFRASTRUCTURE-REVIEW.md)
- [Bible source, preservation and license](docs/BIBLE-PROVENANCE.md)
- [40-day editorial review](docs/EDITORIAL-REVIEW.md)
- [Community schema, permissions and rollout](supabase/COMMUNITY-REVIEW.md)
- [Brand, monthly themes and authorized music](WORSHIP-AND-BRAND.md)

The SDK is pinned locally at `vendor/supabase-2.117.3.js`; its MIT license is included. Bible text is public domain; the WEB name identifies a faithful copy, and is not exclusive property of the app. Devotional commentary is separate from Scripture.

Personal journals and account-scoped caches are not end-to-end encrypted. No journal is automatically shared into community. The PWA is not yet an Apple App Store or Google Play release; closed-app push notifications are not implemented.

## Release gates

Review the completed drafts and preview, grant repository integration write access, verify hosted staging with two independent accounts, apply the proposed grant hardening and community migration only with approval, configure trusted admin identity and provider redirects, and approve deployment separately. Do not follow old upload instructions to overwrite `main`.
