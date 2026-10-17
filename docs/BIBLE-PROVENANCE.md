# Bundled World English Bible

The reader uses **World English Bible Classic**, 2020 stable text, American spelling, as distributed by eBible on 17 October 2026. This edition uses **Yahweh** in the Old Testament. Men of Purpose owns its app code and original devotional writing; it does not claim exclusive ownership of this Bible translation.

Official verse source: https://ebible.org/Scriptures/eng-web_vpl.zip
Official notes source: https://ebible.org/Scriptures/eng-web_usfx.zip
Edition: https://ebible.org/eng-web/
Public-domain dedication and trademark terms: https://ebible.org/eng-web/copyright.htm

The text is public domain, freely reusable and redistributable. “World English Bible” is eBible.org's trademark and identifies faithful copies. Do not silently edit, paraphrase, modernize, or generate replacement Scripture while continuing to label it WEB.

The original official ZIPs are pinned in `bible/sources/eng-web_vpl.zip` and `bible/sources/eng-web_usfx.zip` (including the publisher's copyright/dedication file). `bible/provenance.json` records SHA-256 hashes for the archive, extracted XML and reader JSON. Run `python tools/import-web.py` to regenerate the exact committed reader file, without networking. Source updates require review and updated hashes; the app never fetches a changing third-party Bible API.

## Extraction boundaries

The canonical 66-book Protestant subset contains 1,189 chapters and 31,103 verse markers. Additional ecumenical books in the official archive are not included in this reader. Word spellings, punctuation, capitalization and Unicode are retained. USFX presentation whitespace is collapsed into single spaces; paragraph/poetry line layout and word/Strong's markup are not reproduced. Psalm superscriptions and acrostic labels are included exactly where the publisher's VPL export places them within verse strings; they are not moved to a single chapter heading. Translation/cross-reference notes from USFX are preserved separately and labelled as such. Publisher prefaces, book-title typography and glossary are not verse content and remain in the source archive. Empty textual-variant markers (Luke 17:36 and Acts 15:34) remain empty Scripture strings with the publisher's explanatory notes; the importer never substitutes another translation.

## Offline behavior

The service worker downloads the complete ~4.35 MB Bible with the app shell during a successful initial online installation. After installation, all 66 books and devotional references work offline. A first visit without connectivity, interrupted installation, browser storage eviction, or disabled service workers cannot promise offline availability; Retry recovers a failed dataset fetch. Service workers require HTTPS or localhost. The fetch handler never returns HTML for missing Scripture or JavaScript.

The local loader validates references, escapes Scripture on rendering, shares concurrent dataset requests, retries failed requests and ignores stale results after navigation. No Scripture requests go to bible-api.com.

Offline-ready status uses a message handshake with the controlling service worker. It requires the current release identifier and verifies that every required shell and Bible asset remains in that release cache. An older active worker, failed update, partial cache, or evicted Bible cannot report this release ready merely because `navigator.serviceWorker.ready` resolves.
