# Reliable installed-app updates

The YouTube release exposed two gaps: fresh release caches could be populated
from still-fresh browser HTTP cache, and an open page kept its old JavaScript
in memory after a new service worker took control. Fresh-install tests did not
exercise these historical upgrade paths.

## Current design

- `sw.js` fetches every required installation asset with `cache: 'reload'`.
  It activates only after the complete offline shell and Bible are cached.
- `mop-updates.js` owns registration and foreground/online update checks.
  Registration uses `updateViaCache: 'none'`; repeated foreground checks are
  throttled. More includes **Check for app updates**.
- A controller change on an existing installation shows **Refresh app**.
  It does not silently reload an open journal or devotional.
- Refresh is blocked while an edited, nonempty textarea is unsaved. Saving a
  devotional reflection clears that guard; saved journals rerender normally.
- No update code clears localStorage, account data, or personal browser storage.
- `mop-bible.js` verifies offline readiness against the matching worker release.

An old v6/v7 page cannot gain new JavaScript retroactively. After the repaired
worker installs, one close/reopen or navigation loads the corrected app. From
that release onward, update checks and an explicit refresh prompt handle later
upgrades. Clearing browser data or uninstalling is not required.

## Cleanup

Removed the duplicated seven-day inline content fallback, duplicated theme list,
obsolete theme-preview rendering, an unused Bible cache variable and sharing
helper. Devotionals and their titles now come from `devotional-content.js`.
Removed old prototype/logo-update ZIPs, duplicate TXT instructions, and the
obsolete Supabase bootstrap script. Kept original Bible source archives, license,
provenance, account compatibility and permission tests.

## Verification

Run `npm test`, `npm run test:browser`, and `npm run test:upgrades`.
The historical browser suite serves the original v6/v7 releases at the real
repository subpath with browser HTTP caching enabled, then changes the server
to the new build. It covers stale cached music, preserved personal data,
offline chapters, unsaved text and failed update installation. Production
Supabase is never used by this suite.

Executed on 17 October 2026: all four historical upgrade scenarios passed in
Chromium, all 21 integrated mobile/browser checks passed at 320/390/1280px,
and npm test passed. Physical Android installed-PWA confirmation remains needed
after the reviewed change is merged.
