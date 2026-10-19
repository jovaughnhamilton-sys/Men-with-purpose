# Daily devotional calendar

The home screen previously linked “today” to the first unfinished day of the optional 40-day journey. That selection did not advance with the date. The home screen now opens the reader's local civil date, independently of journey completion.

## Content and monthly topics

There are 365 original short English devotional drafts, plus a separate leap-year reading. Each has its own title, message, Scripture reference, practical action, reflection questions, and a closing prayer shared with its monthly theme. The voice opens with everyday pressures, relationships, and emotional honesty before connecting to Scripture. No Jay Jay Douglas wording or signature style is reproduced. Scripture is served separately from the unchanged, publisher-verified WEB corpus.

| Month | Topic |
| --- | --- |
| January | Made New in Christ |
| February | Love That Serves |
| March | Returning to God |
| April | Living Hope |
| May | Faithful in the Everyday |
| June | Leading Through Service |
| July | Freedom to Walk in Love |
| August | Wisdom for the Next Step |
| September | Growing Together |
| October | Courageous Faith |
| November | A Life of Gratitude |
| December | Christ, Our Hope |

The 47-reading Lent/Easter sequence runs from Ash Wednesday through Easter Sunday, including the six Sundays within Lent. Gregorian computus follows the Western Christian calendar. Palm Sunday, Good Friday, Holy Saturday, and Easter Sunday have specific readings. Moving that sequence reassigns displaced readings without omitting or repeating a reading. Dates near Lent may therefore carry content from a neighboring month's source sequence. December includes Advent preparation and Christmas; December 25 always has the Nativity reading. Advent preparation is labeled throughout December 1–24 rather than implementing a separate liturgical Advent start date.

## Storage and date behavior

Daily reflections use `reflection-calendar-YYYY-MM-DD` journal IDs with the existing account-scoped journal storage. They travel through existing journal backup/sync fields. Reading dates continue to mean a Bible passage was opened, not proof that a devotional was finished. Existing 40-day completion and reflection IDs remain intact. A date change refreshes the home/calendar screen on focus, visibility return, or the 30-second check; it does not replace an open dated reader or erase its writing. Readers can browse every month and previous/next dates.

`content/annual-devotionals.txt` is the reviewable editorial source. Run `node tools/build-annual.cjs` after edits to rebuild `annual-content.js`. The 365 messages are distinct; the twelve closing prayers are monthly prayers, not 365 separately authored prayers. These remain editorial drafts pending human theological/content review. English content is protected from automatic UI translation. No new database configuration is needed.

## Verification

- `npm test`: account/client checks, 19 unit suites/tests, all annual references resolved against WEB, and all 31,103 source verse markers verified.
- `npm run test:browser`: legacy screens and calendar flows at 320, 390, and 1280 pixels; midnight rollover, unfinished journey independence, dated private reflection round-trip, unsaved writing preserved at midnight, December browsing, Christmas Day, and offline Easter.
- `npm run test:upgrades`: historical installed releases upgraded to the new complete offline shell; saved journal/progress retained; unsaved-text update protection and failed-install recovery.

Browser checks use local servers with live account/backend traffic disabled. They do not verify production sign-in providers or email delivery. The service worker and Bible readiness handshake advance together to v9 and precache all three new runtime files.
