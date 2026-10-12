# Men of Purpose 2.0 — Free Devotional & Bible Reader

An initiative of Triple J’s Solutions Enterprises Ltd.

## What's included
- Personalized greeting and featured next devotional.
- WEB Bible reader, 66 books, adjustable font size and tap-to-bookmark verses. Bible content loads online from bible-api.com (third-party service).
- 40-day journey and completion milestones. **Only days 1–7 contain full original devotionals; days 8–40 are theme previews.**
- Multiple private journal entries, answered-prayer marking, deletion.
- Downloadable branded PNG sharing cards and text sharing.
- In-app reading reminders **only when the website is opened after the chosen time**. No push/background notifications.
- Backup and restore JSON for manual device transfers.
- **Optional real email accounts/cloud sync** via Supabase after owner configuration; disabled until configured. Cloud transfer is manually triggered, not automatic.

## Publish on existing GitHub Pages
Upload **index.html, sw.js, manifest.webmanifest, icon.svg, cloud-config.js** to the ROOT of the `main` branch of `jovaughnhamilton-sys/Men-with-purpose`. Overwrite old files if asked. `SUPABASE-SETUP.sql` and README are reference docs, not required to run. Pages remains set to main / (root). Refresh the website or close/reopen the installed app; a service worker may take another reload to update.

## Optional cloud setup (not required to use the app)
1. Create a Supabase project on a suitable free plan (subject to provider limits and availability).
2. Enable Email auth, configure allowed site URLs, and review authentication and privacy policies.
3. Run `SUPABASE-SETUP.sql` in SQL Editor and verify row-level security is enabled.
4. Copy **Project URL** and **publishable/anon key** (NEVER the service_role/secret key) into `cloud-config.js` and upload it to GitHub.
5. Test sign-up, sign-in, upload and restore with two different test accounts, verifying they cannot read each other's data.
6. Before inviting users to cloud sync private journals, create a privacy policy and review data protection and vendor practices.

## Privacy and limitations
Without cloud setup, all personal data remains in this browser's localStorage; clearing site data can erase it. Use Export Backup regularly. Journal entries are not end-to-end encrypted. When cloud sync is enabled, uploaded journal content is stored on the configured Supabase project. Do not promise end-to-end encryption or absolute privacy. Bible text comes from a third-party API, so it needs internet access and is subject to its reliability and policies. WEB is public domain in the United States; verify other jurisdictions and API terms.

This is a free website/PWA, not yet a submitted Android/iOS store app. No background push notifications are implemented.
