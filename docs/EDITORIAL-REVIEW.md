# Men of Purpose: 40-day editorial review

Status: **complete English-language draft; owner/editorial approval pending**. Prepared 2026-10-17 for the development branch only. No live content has been changed or published by this editorial workstream.

## Delivered content

`devotional-content.js` contains 40 complete devotionals. Each record includes a title, primary Scripture reference, wider context reading, devotional message, prayer, practical challenge, and three reflection questions. All entries explicitly carry `status: editorial-draft` and `kind: original-devotional-commentary`. Days 1–7 retain their existing reference, body, prayer, and challenge verbatim, with added contextual readings and reflection prompts. Days 8–40 are new original commentary built around the existing journey titles. The seven existing biblical character studies in `index.html` are retained; 33 additional character studies are not part of this delivery.

There are **no new Scripture quotations** in the devotional module. The application must obtain Bible text directly from its preserved World English Bible dataset, keeping Scripture and original commentary visibly distinct. These devotionals are not a new Bible translation and must not be presented as one owned by the app. Original app commentary and branding are separate from the public-domain WEB text.

## Verification performed

All 40 primary references and their wider context references resolve to actual chapter/verse markers in the pinned WEB corpus at `bible/web.json`. All 40 primary references were also loaded through the real `MOPBible.passage` provider and compared byte-for-byte with that dataset's verse strings. Corpus provenance is documented by the Bible workstream; source: <https://ebible.org/Scriptures/eng-web_usfx.zip>.

Passage context was reviewed while drafting, particularly where a verse can be misapplied. Forgiveness and peace do not require return to abuse (days 12, 16, 28); temptation is distinguished from a claim that every hardship is manageable alone (18); household/slavery context and fair treatment are acknowledged (23); giving is not a guaranteed-return formula (24); suffering is not called good or a promise of future wealth (5, 10, 26); the widow's son account is not a universal promise of immediate resurrection (29); finances and work are not measures of spiritual worth (2, 25); mentoring is not personal control (38). Day 6's Joshua context is identified rather than treating an ancient commission as a blanket guarantee for modern projects. Day 4's marriage-specific reference is accompanied by a clearly devotional application to care for others, without rewriting the verse's original audience.

The existing seven character studies were reviewed against their stated narratives. Paul’s unspecified thorn remains unspecified. Saul/Paul's conversion, Bezalel's craftsmanship, Joseph's care for Mary/Jesus, Joseph in Egypt, Joshua's commission/Jordan crossing, and Barnabas's advocacy preserve the accounts' broad meaning. No invented dialogue, motives presented as fact, or new quotation was introduced.

## Approval and remaining review

The automated checks establish completeness, retained text, and reference/corpus consistency. They do **not** certify doctrinal agreement, divine authorship of commentary, scholarly textual criticism, or final editorial approval. A designated human Christian editor should read the complete module against the linked context passages, approve tone and application, and record approval before publication. The owner should approve changes to the seven existing messages separately if desired; their original wording was intentionally preserved in this branch.

Spanish and Portuguese UI labels exist, but this new devotional manuscript is English only. No machine-translated Scripture or devotional body has been supplied or represented as an approved translation. Any future translated content needs its own editorial and Bible-text permissions review.

## Integration contract

Load `devotional-content.js` before the application inline script. Use `window.MOP_DEVOTIONALS` for `readings`; it also exports CommonJS for tests. Preserve the title order in `themes`. For reflection prompts, prefer `MOP_DEVOTIONALS[day - 1].questions` for all 40 days. Show a visible editorial-draft notice in the development review experience. Do not treat the presence of this file as permission to publish or overwrite approved/live content. Keep the seven existing story cards available alongside the new content. `context` can be displayed as a suggested wider reading; some contexts span chapters or use a semicolon, so the basic single-chapter Bible parser must not be used on that field without supporting those forms.

Run `node --test editorial.test.cjs` from the repository root. Four tests pass, covering all 40 records, original first-seven retention, all primary/context verse bounds, and exact Scripture provider output for every primary reference.

## Review index

| Day | Theme | Primary reference | Wider context |
| --- | --- | --- | --- |
| 1 | You Are a New Creation | 2 Corinthians 5:17 | 2 Corinthians 5:14–21 |
| 2 | You Are God’s Workmanship | Ephesians 2:10 | Ephesians 2:1–10 |
| 3 | Strength in Your Weakness | 2 Corinthians 12:9 | 2 Corinthians 12:7–10 |
| 4 | Leading Through Love | Ephesians 5:25 | Ephesians 5:21–33 |
| 5 | Trusting God in Hardship | Proverbs 3:5–6 | Proverbs 3:1–12 |
| 6 | Courage Over Fear | Joshua 1:9 | Joshua 1:1–9 |
| 7 | Called to Make a Difference | Matthew 5:14–16 | Matthew 5:13–16 |
| 8 | Seek God First | Matthew 6:33 | Matthew 6:25–34 |
| 9 | Pray Without Ceasing | 1 Thessalonians 5:17 | 1 Thessalonians 5:12–24 |
| 10 | Practice Gratitude | 1 Thessalonians 5:18 | 1 Thessalonians 5:12–24 |
| 11 | Love Your Neighbor | Luke 10:36–37 | Luke 10:25–37 |
| 12 | Choose Forgiveness | Ephesians 4:32 | Ephesians 4:25–32 |
| 13 | Walk in Humility | Philippians 2:3–4 | Philippians 2:1–11 |
| 14 | Speak Truth | Ephesians 4:25 | Ephesians 4:17–32 |
| 15 | Listen Before Speaking | James 1:19 | James 1:19–27 |
| 16 | Pursue Peace | Romans 12:18 | Romans 12:9–21 |
| 17 | Guard Your Heart | Proverbs 4:23 | Proverbs 4:20–27 |
| 18 | Stand Against Temptation | 1 Corinthians 10:13 | 1 Corinthians 10:1–14 |
| 19 | Practice Self-Control | Galatians 5:22–23 | Galatians 5:13–26 |
| 20 | Serve Others | Mark 10:45 | Mark 10:35–45 |
| 21 | Honor Your Family | Ephesians 6:4 | Ephesians 6:1–4 |
| 22 | Lead With Patience | Colossians 3:12–13 | Colossians 3:12–17 |
| 23 | Work With Integrity | Colossians 3:23–24 | Colossians 3:22–4:1 |
| 24 | Give Generously | 2 Corinthians 9:7 | 2 Corinthians 8:12–15; 9:6–15 |
| 25 | Trust God With Money | Matthew 6:24 | Matthew 6:19–34 |
| 26 | Persevere in Trials | James 1:2–4 | James 1:2–8 |
| 27 | Encourage a Brother | 1 Thessalonians 5:11 | 1 Thessalonians 5:1–15 |
| 28 | Be a Peacemaker | Matthew 5:9 | Matthew 5:1–12 |
| 29 | Choose Compassion | Luke 7:13 | Luke 7:11–17 |
| 30 | Act Justly | Micah 6:8 | Micah 6:1–8 |
| 31 | Be Faithful in Small Things | Luke 16:10 | Luke 16:1–13 |
| 32 | Grow in Wisdom | James 1:5 | James 1:2–8 |
| 33 | Renew Your Mind | Romans 12:2 | Romans 12:1–8 |
| 34 | Be Accountable | Galatians 6:1–2 | Galatians 5:25–6:5 |
| 35 | Walk in the Light | 1 John 1:7 | 1 John 1:5–2:2 |
| 36 | Make Time for Rest | Mark 6:31 | Mark 6:30–44 |
| 37 | Share Your Faith | 1 Peter 3:15 | 1 Peter 3:13–18 |
| 38 | Mentor Another Man | 2 Timothy 2:2 | 2 Timothy 2:1–7 |
| 39 | Build a Legacy of Love | John 13:34–35 | John 13:1–35 |
| 40 | Stand Firm in Faith | 1 Corinthians 16:13–14 | 1 Corinthians 16:10–18 |
