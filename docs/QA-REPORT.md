# Development QA report

Date: 2026-10-17. Target: separate development branch, local static server only. No deployment, account creation, live database write, or external app request was performed by this browser suite.

## Executed browser checks

**21 of 21 checks passed** with Chromium 136 headless, using separate browser contexts at widths 320, 390, and 1280 px, height 844 px. Detailed results: `qa-evidence/browser-results.json`. Mobile screenshots were inspected internally.

At every width, the suite verified:

- All five main screens render with no horizontal overflow or uncaught JavaScript exceptions.
- Every one of 40 devotional days renders its body, reflection, and locally loaded Scripture.
- A malicious HTML/SVG reflection persists as literal text in the private journal and does not execute.
- Five malformed backup shapes are rejected before confirmation or storage writes: invalid name, completed-day values, font size, reminder, and journal text.
- Community mock: groups and reflections default to private; member-provided malicious text does not create elements or execute; ordinary members have no archive, leader-promotion, or devotional-review controls; private reflection submission sends the private audience; canceling public-sharing confirmation prevents the write; switching accounts clears the previous community snapshot.
- After service worker installation, browser network is disabled and the app reloads. Previously unopened Revelation 22 and devotional day 40 work. All 66 books, 1,189 chapters, and 31,103 verse slots resolve while offline.
- All nonlocal requests are blocked, including production Supabase. This run attempted zero external requests.

The existing `node accounts.test.cjs` suite also passed: registration without an authenticated session, sign-in/out behavior, account isolation, explicit guest import, synchronization conflicts, and Google redirect behavior with mocked providers.

## Reproduce

Install Playwright and its Chromium browser in a development environment, then run:

```sh
node accounts.test.cjs
node --test tests/*.test.cjs
```

The browser script can also run directly:

```sh
node tests/browser.test.cjs
```

If Chromium is installed outside Playwright's default directory, set `QA_CHROMIUM_EXECUTABLE` to its executable path. Optional `QA_REPORT_PATH`, `QA_SCREENSHOT_DIR`, and `QA_WIDTHS` control JSON output, screenshots, and a comma-separated viewport list. The test script serves the repository on an ephemeral loopback port and blocks all external network requests.

## Approval-stage validation still needed

These browser tests use a mocked signed-in community client. They establish client behavior, not live database authorization. Apply the proposed migration only to an approved staging database and run its RLS/permission tests with actual authenticated member, leader, and administrator sessions before production approval. Verify provider configuration, verification-email delivery, real multi-device sync, and sign-out behavior against staging.

Chromium viewport testing does not establish Safari/iOS, Android WebView, or physical-device compatibility. Test those devices, installed PWA behavior, interrupted downloads, service-worker upgrades from an existing release, low-storage failures, and accessibility with assistive technology before store release. Human editorial approval remains necessary for devotional interpretation and curated music context.
