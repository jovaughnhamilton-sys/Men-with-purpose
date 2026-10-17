# Men of Purpose: brand and worship review

Development implementation; not deployed. Keep the original logo, forest green `#142e25`, warm cream `#f7f5ed`, and gold `#c6a15b`. The new `polish.css` adds readable dark gold labels, stronger keyboard focus, reduced-motion support, wrapping toolbars, 44px controls, safe-area spacing, and 320px layouts. No remote font, new logo, or third-party tracker is introduced.

## Integration

Load `polish.css` after existing styles, and `mop-experience.js` before the first `render()` call. At the end of render call:

```js
const experienceDay = screen === 'home' ? nextDay() : selected;
window.MOPExperience?.enhance({
  screen, day: experienceDay,
  theme: themes[experienceDay - 1],
  reference: readings[experienceDay - 1]?.ref
});
```

No function wrapping or database writes. Repeated enhancement removes its own earlier nodes. The home screen shows the current local calendar month's focus and a dismissible welcome; dismissal applies to that year/month on the device. The next month gets a fresh banner. Focus/visibility checks refresh an open app after the date changes. There are no closed-app notifications or background jobs.

The home and devotional screens show a song paired with the journey day; selections are editorially assigned, not randomized by calendar date. Four songs recur across the 40-day journey. If no valid journey day is supplied, the monthly focus selects the song. Curatorial connections are original summaries, not quotations from lyrics or Scripture. Monthly focuses are companion reading prompts, not 12 additional completed devotional journeys.

## Verified authorized catalog links

Official YouTube upload links checked on October 17, 2026; switched from Apple Music at the owner's request. No embedded player, playback tracking, or audio downloads were added:

| Recording | Primary catalog source |
| --- | --- |
| Altar — Hulvey & Forrest Frank | https://www.youtube.com/watch?v=D9Ol15yaf_4 |
| GOOD DAY — Forrest Frank | https://www.youtube.com/watch?v=Uc_HxKMKB_E |
| Trust In God — Elevation Worship feat. Chris Brown | https://www.youtube.com/watch?v=iJE4yahElBQ |
| Praise — Elevation Worship feat. Brandon Lake, Chris Brown & Chandler Moore | https://www.youtube.com/watch?v=raFnjGVkHe8 |

Corroborating artist/label pages: https://www.reachrecords.com/artists/hulvey/ and https://www.elevationworship.com/music/praise .

Links open YouTube in a new tab or the user's associated app. No lyrics, recording, artwork, embeds, or downloaded audio are distributed. Song metadata remains available with the cached app; playback requires the external service and connectivity. Video availability varies by region. This is a curated optional companion, not an endorsement relationship or a claim to own third-party music.

## Monthly focus references for editorial sign-off

| Month | Focus | Passage |
| --- | --- | --- |
| January | Made New in Christ | 2 Corinthians 5:17 |
| February | Love That Serves | John 13:34–35 |
| March | Rooted in Prayer | Philippians 4:6–7 |
| April | Living Hope | 1 Peter 1:3–5 |
| May | Faithful in the Everyday | Colossians 3:17 |
| June | Leading Through Service | Mark 10:42–45 |
| July | Freedom to Walk in Love | Galatians 5:13–14 |
| August | Wisdom for the Next Step | James 1:5 |
| September | Growing Together | Hebrews 10:24–25 |
| October | Courageous Faith | 2 Timothy 1:7–8 |
| November | A Life of Gratitude | 1 Thessalonians 5:16–18 |
| December | Christ, Our Hope | Luke 2:10–11 |

April's resurrection focus is evergreen; it does not calculate the annual date of Easter. Scripture is never reworded by this module. Human editorial approval remains required before publication.

## Verification

`node --test experience.test.cjs` passed all 3 tests. They cover calendar/year rollover, all forty day mappings, monthly fallback, escaped content, allowed HTTPS catalog destinations, and external-tab protections. Integrated browser QA must additionally check month dismissal/return, screen rerenders, 320/390px layout, keyboard focus, and offline metadata. The local Playwright package is present but its default Chromium executable was unavailable when this workstream attempted to launch it. Browser playback/availability is controlled by the provider and is not covered by unit tests.
