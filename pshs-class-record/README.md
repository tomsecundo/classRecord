# Pisay Class Record — PSHS Bicol Region Campus

An online-only teacher workspace built from the supplied Bicol E-Grades and adviser-monitoring references. Sign in to open your online workspace. The separate school simulation uses fictional records. No student data from the reference workbooks is embedded or uploaded.

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

The report includes component percentages and weights, present/previous/final grades, school branding, and teacher, Unit Head, and CID Chief blocks. Optional roster groups can be entered on student profiles or imported from a Sex column. Unknown groups remain unspecified. Incomplete grades and demonstration records produce a DRAFT sheet. Excel includes formulas and cached results; component values are snapshots, so update the class record and export again after score changes. An internet connection is required.

## Online storage

The app loads and saves through authenticated `/api/workspace` requests. There is no new IndexedDB database, passphrase, background synchronization, or offline editing. Prior offline caches are retired. Existing legacy encrypted databases and server vaults are retained, but are not automatically migrated; the legacy write endpoint returns 410.

Server saves use revision guards and a transactional D1 batch. JSON is split into 128,000-character database rows to avoid putting a full school snapshot in one database value. Requests have a 40 MB limit. This remains a whole-workspace save, not incremental multi-user editing. A failed save is clearly marked NOT SAVED; further editing is blocked until reload, and closing the page warns about unsaved changes. Concurrent stale revisions are rejected rather than overwriting newer data. Records now exist as JSON on the server, not end-to-end encrypted vaults. Account authentication and same-origin write checks remain in place.

Apply the SQL migrations in `drizzle/` before running this version. The school simulation at `/index.html?demo=school` is stored under a separate account-scoped namespace, leaving the real workspace untouched. It seeds the full fictional dataset on first authenticated opening and reopens the saved simulation thereafter. This is not a 70-account concurrency test.

## Grading implementation

Source: supplied `E-Grades x Class Record TJGSecundo.xlsx` and `E-Grades x Class Record SY 23-24 Master File.xlsx`.

- Settings D18:E21, H18:I20 and K18:L19 provide example component schemes 25/25/25/25, 25/35/40, and 25/75.
- `1stQuarter!AZ13:BB13`: formative component = 40 × numeric completion fraction + 60 × pooled earned/max points.
- `1stQuarter!BM13`, `CB13`, `DG13`, `EL13`: other components average individual assessment percentages; Base 50 transforms each ratio to 50 + 50 × ratio.
- `FirstQuarter!Q23:S23`: weighted component total, Base 0 / Base 50 conversion thresholds.
- `SecondQuarter!T23:W23` and named ranges `Opr_PrevPres_PresGrd` / `Opr_PrevPres_PrevGrd`: 2/3 present equivalent + 1/3 previous final equivalent, mapped using upper bounds 1.13, 1.38, 1.63, 1.88, 2.13, 2.38, 2.63, 2.88, 3.5, 4.5.

The app intentionally withholds final grades when required scores/categories or prior quarters are incomplete, rather than silently finalizing missing work as zero. A zero must be entered explicitly. Excused assignments are omitted; an entirely excused component needs teacher review and does not generate an invented grade. Provisional weighted percentages include all assigned points. GWA is unit-weighted over enrolled subjects and waits until all those grades are complete. Current campus policy should still be reviewed before official submission.

## Remaining production integration

This is a private personal-workspace pilot. The teacher/adviser/CID selector changes views of the same dataset, not authorization. School-wide staff membership, server-enforced teacher/adviser/CID permissions, cross-account grade publication, and shared adviser summaries require a school data-sharing model and a separate access-controlled aggregate store. The current account-scoped workspace cannot read other staff accounts. Official database integration and an email delivery provider are not configured. These are visible limitations in the app, not simulated connections.

No claim of school-wide production readiness or external security audit is made. Never publish the sample source workbooks or real student data into the app's source/public directory.

## Third-party software

The browser CSV/XLSX parser is SheetJS Community Edition 0.20.3, downloaded from its official distribution; its license notice is retained in `public/xlsx.full.min.js`. The server uses the Sites Vinext starter and preserves its deployment/auth integration.

## Full-school simulation and capacity check

Open `/index.html?demo=school` or **Settings → Open school demo**. The simulation saves online in its own account-scoped namespace; reloading reopens saved simulation data. Settings includes a selector for 70 simulated teachers; these are fixture labels, not authenticated accounts. Subject names, schedules, and weights are illustrative rather than an official curriculum or timetable.

Assumptions: grades 7–12, 120 students per grade, four sections of 30, 12 subjects per section, four quarters, and 12 assignments per subject per quarter. This produces 720 students, 24 sections, 288 subject classes, 13,824 assignments, 414,720 score/status records, and 8,640 student-subject results per quarter. The data includes high/low scores, missing submissions, late submissions, excused work, and work awaiting marking.

Run `node scripts/benchmarks/school-capacity.mjs`. A local Node run on 2026-11-02 generated the fixture in 41 ms, calculated all 8,640 Q2 results in 40 ms, and assembled a 12-subject student profile in 4 ms. These are single-run computation measurements, excluding DOM rendering, encryption, networking, and concurrent users. Render-scoped assessment indexes and grade memoization avoid rescanning all assignments for every grade; caches are discarded after each render so edits remain current. Browser verification covered the full CID overview, a 12-subject profile, section filtering, and switching to simulated teacher 70.

The fixture serializes to 22,861,489 bytes (about 22.9 MB); its estimated encrypted/base64 payload is 30,482,008 bytes before envelope overhead, exceeding the former 4,000,000-byte encrypted sync limit. The online-only path now accepts up to 40 MB and splits storage across database rows. The online-only update also saved and reopened this complete dataset in the local server database, including an intervention-note edit. This does not establish hosted production capacity or 70-user concurrency. Production school-wide operation still requires staff authorization, a shared subject/grade store, incremental sync instead of whole-school snapshots, and concurrent-user load tests. A teacher's scoped dataset is much smaller, but shared adviser/CID access is not implemented by this fixture.
