# Pisay Class Record — PSHS Bicol Region Campus

An offline-first teacher workspace built from the supplied Bicol E-Grades and adviser-monitoring references. The initial screen uses fictional student records. No student data from the reference workbooks is embedded or uploaded.

## Running locally

Requires Node 22.13+ and npm. Run `npm run dev` and open the printed URL, then `/index.html`. Local development sign-in is at `/signin-with-chatgpt?return_to=/index.html` and uses the starter's local-only identity. Production uses Sites-managed ChatGPT identity. Run `node --test tests/*.test.mjs` for domain checks and `npm run build` for the Worker bundle. D1 migration files are under `drizzle/`.

## Included workflows

- Class creation, section, schedule, subject units; per-quarter grading components and weights.
- Assignment creation/editing/deletion, dates, total points, rubric criteria and marking.
- Four-quarter score sheets with explicit submitted, late, missing, unsubmitted and excused statuses.
- CSV/XLSX roster imports with sheet/header selection, column mapping, preview and student-ID deduplication.
- CSV grade exports with fullname, section, student_id and grade context. Exact registrar-system compatibility is not yet certified.
- Section-filtered calendar, overdue-submission monitoring, intervention notes, printable Bicol call slips and reports.
- Adviser GWA and CID overview of the personal dataset, plus meeting presentation mode.
- Reviewed mailto drafts; sending occurs in the user's mail app. No email service is configured.

## Individual student performance

Click student names in class records, rosters, quarter summaries, follow-up lists, adviser tables, CID views, or the grading-sheet preview to open a student profile. Profiles show all locally enrolled subjects, four-quarter results, current-quarter GWA, component weights and contributions, and every assignment with score, due date, and submission status. Missing submissions, submitted-but-unmarked work, not-yet-due outputs, and raw scores below 60% are distinguished. These flags are review indicators rather than scholarship decisions. Intervention notes, call slips, email drafts, and a printable individual report are available from the profile. The quarter selector changes the report period. These views still use only the personal workspace dataset.

## Quarterly grading sheets

Open **Grading sheet**, select the class and quarter, and enter the adviser and signatory names. Download PDF, Excel, or both. Legal portrait is the default; A4 portrait and landscape are available. PDFs include blank signature spaces for signing after download. Names from the old reference forms are not assumed to be current signatories.

The report includes component percentages and weights, present/previous/final grades, school branding, and teacher, Unit Head, and CID Chief blocks. Optional roster groups can be entered on student profiles or imported from a Sex column. Unknown groups remain unspecified. Incomplete grades and demonstration records produce a DRAFT sheet. Excel includes formulas and cached results; component values are snapshots, so update the class record and export again after score changes. Export libraries and logos are cached for offline use.

## Offline storage and synchronization

Select **Set up secure storage**. Use a passphrase of at least 12 characters. The default creates an empty workspace; uncheck that option to keep the fictional demonstration records. An existing cloud vault is restored instead when the signed-in account already has one and the passphrase matches.

The app shell, including the Excel parser, is cached by a service worker. After one successful online load, it can reopen offline. Install/add the app to the home screen where the browser supports it. Offline font fallback uses system fonts.

Records are AES-256-GCM encrypted in IndexedDB. A 600,000-iteration PBKDF2-SHA256 key is derived from the passphrase with a random 128-bit salt. Every save uses a fresh 96-bit IV. The key is non-extractable and remains only in memory. There is an explicit lock and a 15-minute inactivity lock. Browser storage persistence is requested where available; download encrypted backups because browsers can still clear data. Lost passphrases cannot be recovered.

Encrypted snapshots are synchronized to the authenticated account's D1 row. Identity and same-origin checks protect writes. The server never receives the passphrase or plaintext grades. It performs compare-and-swap writes by revision. Reconnection and a 30-second timer trigger sync while the app is open. Clean devices pull newer versions automatically. Concurrent changes pause sync, requiring a local encrypted backup and explicit cloud-version restore; automatic per-record merging is not implemented. Sync does not run while the browser/app is closed. A 4 MB encrypted snapshot limit is enforced.

## Grading implementation

Source: supplied `E-Grades x Class Record TJGSecundo.xlsx` and `E-Grades x Class Record SY 23-24 Master File.xlsx`.

- Settings D18:E21, H18:I20 and K18:L19 provide example component schemes 25/25/25/25, 25/35/40, and 25/75.
- `1stQuarter!AZ13:BB13`: formative component = 40 × numeric completion fraction + 60 × pooled earned/max points.
- `1stQuarter!BM13`, `CB13`, `DG13`, `EL13`: other components average individual assessment percentages; Base 50 transforms each ratio to 50 + 50 × ratio.
- `FirstQuarter!Q23:S23`: weighted component total, Base 0 / Base 50 conversion thresholds.
- `SecondQuarter!T23:W23` and named ranges `Opr_PrevPres_PresGrd` / `Opr_PrevPres_PrevGrd`: 2/3 present equivalent + 1/3 previous final equivalent, mapped using upper bounds 1.13, 1.38, 1.63, 1.88, 2.13, 2.38, 2.63, 2.88, 3.5, 4.5.

The app intentionally withholds final grades when required scores/categories or prior quarters are incomplete, rather than silently finalizing missing work as zero. A zero must be entered explicitly. Excused assignments are omitted; an entirely excused component needs teacher review and does not generate an invented grade. Provisional weighted percentages include all assigned points. GWA is unit-weighted over enrolled subjects and waits until all those grades are complete. Current campus policy should still be reviewed before official submission.

## Remaining production integration

This is a private personal-workspace pilot. The teacher/adviser/CID selector changes views of the same dataset, not authorization. School-wide staff membership, server-enforced teacher/adviser/CID permissions, cross-account grade publication, and shared adviser summaries require a school data-sharing model and a separate access-controlled aggregate store. The current per-account encrypted vault intentionally cannot read other staff accounts. Official database integration and an email delivery provider are not configured. These are visible limitations in the app, not simulated connections.

No claim of school-wide production readiness or external security audit is made. Never publish the sample source workbooks or real student data into the app's source/public directory.

## Third-party software

The browser CSV/XLSX parser is SheetJS Community Edition 0.20.3, downloaded from its official distribution; its license notice is retained in `public/xlsx.full.min.js`. The server uses the Sites Vinext starter and preserves its deployment/auth integration.
