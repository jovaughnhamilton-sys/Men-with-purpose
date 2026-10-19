# Daily devotional music

The daily calendar previously fell back to one of four monthly songs. It now has a specific music assignment for every devotional: 365 distinct direct YouTube video links, plus a separate leap-day link. Each assignment includes a song title, artist, style, topic, and reflection connection. Music is part of the daily reading; the interface no longer describes it as an optional companion.

The assignment follows the devotional's stable ID, not its changing position in the year. Lent, Holy Week, and Easter therefore keep their music when Easter moves. Browsing another date shows that date's song, and Home uses the same pairing as its daily reader. There are no duplicate links within any calendar year. The same song composition may appear through a different artist's rendition; links are distinct, not a claim that every underlying composition is different. The annual plan repeats in subsequent years.

Examples:

| Reading | Music |
| --- | --- |
| October 19: An Honest Shared Memory | Altar — Hulvey |
| October 20: Commitment With Specifics | Man Of Your Word — Maverick City Music |
| Palm Sunday: The King Comes Humbly | Hosanna — Hillsong Worship |
| Good Friday: The King on the Cross | The Power Of The Cross — Keith & Kristyn Getty |
| Easter: He Is Risen | Living Hope — Phil Wickham |
| Christmas Day: Good News of Great Joy | Joy To The World — Chris Tomlin |

`content/music-verification.json` records the source catalog, direct URLs, indexed YouTube titles, artist/channel metadata where available, and checking date. Primary YouTube listings were retrieved through web search. Some search listings provide an official video title without a channel badge; those records retain `channelVerified: false` rather than inventing badge verification. Direct player fetches were not a reliable way to test every link because YouTube returned rate limits and fetch errors; no claim is made that every video was played end-to-end or is available in every region. No lyrics, audio, video, or third-party thumbnails are copied into the app.

`content/daily-music-pairings.json` is the explicit editorial assignment table. `content/daily-music-review.json` provides a reviewable list of titles and their topics. Run `node tools/build-music.cjs` after reviewing changes to rebuild the offline runtime bundle, `devotional-music.js`. Its validation rejects missing assignments, duplicate links, or missing topic connections. Pairing choices remain editable editorial content rather than live recommendations from an algorithm or external search request.

The bundled metadata and buttons remain available offline. Playback opens YouTube and requires a connection. Videos remain controlled by their artists and hosting service and may change availability. The optional 40-day journey retains its separate existing song choices.

Validation covers 366 unique assignments, date changes, seasonal movement, December 25, leap years, year boundaries, and matching Home/reader links. Browser tests cover midnight rollover, previous/next dates, returning to an older reading, and offline Easter at 320/390/1280px. The v10 service-worker update caches the music bundle atomically with the matching shell; historical upgrade tests include v9→v10.
