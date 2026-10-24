# Daily devotional update — October 24, 2026

The launch calendar follows the Biblical Commands series from October 12 through November 20, 2026 (October 24 is Day 13). Monthly themes follow Day 40. The existing optional 40-day identity journey and its original reflections remain available.

Each devotional displays 1–2 main verses, selected from verified references in the pinned WEB corpus. Whole chapters remain optional context or Bible-reader choices. NLT links open the exact short passage on BibleGateway; no NLT text is bundled or exported. Publisher terms: https://www.tyndale.com/permissions and https://api.nlt.to/.

Two 1080 × 1350 PNG compositions are rendered on demand per devotional: Scripture reference with a headline, and original encouragement. A swipe/keyboard gallery offers individual PNG downloads, native file sharing when supported, and a download fallback. Twelve original generated illustrations are reused across daily compositions; these are not 730 independently generated paintings. All text is drawn programmatically for accuracy. The illustrations are compressed as WebP; downloads remain PNG.

## Verification

- `npm test`: all 24 Node tests, account mocks, community mocks and the publisher-source Bible verification pass.
- New checks resolve short references for 446 entries (365 annual, leap day, 40 Commands, 40 optional journey); verify sequence boundaries, distinct annual titles/bodies/IDs for 2026–2028, three practices and declarations, reviewed music URL/topic matching.
- Cloud browser: 320/390 mobile and 1280 desktop frame widths; carousel navigation; daily Scripture; next-day change from Day 13 to Day 14; different corresponding music.
- Browser export harness: 810 PNG exports from the 2026 schedule and optional journey, each decoded as 1080 × 1350 PNG.
- Both individual downloadable PNGs were downloaded through the browser and verified by Pillow as PNG at 1080 × 1350.
- Sample daily music opened the official Forrest Frank “GOD IS GOOD” video on YouTube with a functioning player.
- No account, database, user journal, bookmark or group records were modified. Preview disables live cloud configuration. Account/community checks use mocks; live provider login, multi-device sync and every external video's playback were not retested.
- Service-worker release is incremented; the existing safe-refresh and private-storage logic is retained. Historical upgrade browser tests were updated but not executed in this environment; offline cache/control behavior is covered by Node tests.

## Artwork

Built-in image generation produced `assets/devotional-illustrations.webp` (compressed from its original PNG) for this project. Prompt: a twelve-panel, 4-column × 3-row biblical illustration contact sheet in hand-painted gouache/engraved devotional style, forest green, warm cream, black and antique gold, no text/logos/watermarks. Panels in order: oil lamp; shepherd’s staff by still waters; boat on waves; rooted seedling; gold-mended jar; path toward a cross; shield and olive branches; brothers helping each other climb; illuminated open book; wheat and bread; manger and Bethlehem star; empty tomb at sunrise. Each panel is cropped in canvas and combined with the day's own text and branding.
