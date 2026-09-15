# Production audit — 2026-09-15 (in progress)

Baseline main: `03dc2eb8d0ba0af8338ddc7855b9f28c4accbebe`.
Immutable rollback: `rollback/final-production-before-audit-20260915` at that SHA.
Working branch: `audit/production-20260915`.
All 234 baseline files were materialized and verified against GitHub blob hashes.
Baseline unit suite: 28 passing tests. No production data was read or migrated.

## Confirmed defects and corrections

- `activity_sessions` rules required `proposed` for candidate edits/deletes even though the application and client allow analysis edits on legacy records. Permit `proposed`, `plan_approved`, and `confirmed` only within the existing candidate workflow and ownership boundary. Updates preserve status; immutable application, activity, group and author fields remain protected. Manager-created records and approved applications do not gain normal candidate editing rights.
- `planning-service.saveActivity` rewrote existing session status to `proposed`. Content editing now preserves existing status; creation and explicit manager/proposal paths retain their previous behavior.
- `portal/product-current` refreshed the application even when base navigation returned early. Guard before dispatch.
- `admin/planning-board` replaced the guarded navigation implementation and rendered the current route again. Add the same early guard.
- `shared/smart-interactions` skipped animation but still invoked underlying route wrappers. Current routes/tabs now stop before either invocation or motion scheduling. Explicit data refresh functions remain available.
- Portal boot (`app.js`) and planning day loading (`planning-days.js`) can overlap calls to `planning.listSessions`. Identical application/date queries now share outstanding work through `service-core.shareQuery`, scoped to database/auth identity. No completed result is cached, failed reads are evicted, and different ranges/users are independent. This reduces simultaneous duplicate reads, not normal refreshes.
- Three identity wrappers were removed from `portal/review-flow` and `portal/candidate-adjustment`: two `openActivityModal` wrappers and one `requestDeletePlanningSession`. They only forwarded the exact arguments and return value to captured predecessors. No module or CSS file was deleted.

## Runtime responsibility map

These are current effective owners/decorators, not a claim that the entire legacy wrapper chain has been eliminated. HTML script order is authoritative.

| Screen / concern | Owner and remaining composition |
| --- | --- |
| Portal Planning | `js/portal/planejamento.js`; day/card decorators in `planning-days`, `session-review-ui`, `review-flow`, `candidate-adjustment` |
| Portal Home | `home.js`, subsequently decorated/replaced by round modules and `product-current.js` |
| Portal Agenda | `agenda.js`, with shared session cards and review decorators |
| Portal Profile | `product-current.js`, emergency contact extension |
| Portal Information | `info.js` and internationalization |
| Portal boot/data | `app.js`; service calls and hydration extensions |
| Admin Home | `dashboard.js`, delegated by `admin-shell.js` |
| Admin Planning | `planning-page.js`; list board in `planning-board.js`; session markup/actions in `planning-person-agenda.js`; profile layout in `planning-profile-layout.js` |
| Admin candidate Account | `account-consolidated.js`, account consistency/contact extensions |
| Admin History | `history.js`, `account-history.js` |
| Admin Occupancy | `occupancy-page.js`, `occupancy-mobile.js` |
| Admin Groups | `groups-page.js`, group service |
| Admin House information | `house-info-page.js` |
| Admin Account settings | `account-settings.js` |
| Navigation/shell | `shared/navigation.js`, admin route wrappers, `admin-navigation.js`, `portal/desktop-shell.js`; final interaction wrapper in `shared/smart-interactions.js` |
| Modals | `shared/ui.js`, `shared/modal-system.js`, `shared/smart-interactions.js` |
| Shared candidate predicates | `shared/domain-rules.js`; Firestore rules remain the server authority |
| Persistence | `js/services/*`; Firebase initialization in `js/firebase/firebase-client.js` |
| History writes | `history-service.js`, `history-hooks.js` |
| Authentication | `auth-service.js`, `auth-guard.js` |
| Cache | service-specific caches, `admin/app.js`, `candidate-detail-data.js`; outstanding-read deduplication in `service-core.js` |

## Branch inventory decisions pending consolidation

26 pre-existing non-main branches were compared individually to the baseline SHA.
24 have no unique commits (contained in or identical to main).
Two diverge:

- `fix/firestore-slow-query-monitoring`: 41 unique commits. Monitoring changes are superseded by the tested main implementation. E2E navigation/path corrections merit selective adaptation; some assertions still demand locked analysis, contrary to the current requirements. Do not merge this branch wholesale.
- `feat/transactional-email-outbox-r48`: 12 unique commits, PR #18. Includes a Worker, Resend integration, outbox index, tests and external rollout requirements. Main has no Worker. PR explicitly requires an external test and verified email domain before merge. This is unfinished functionality, not proven dead code; preserve until its intended inclusion is decided and validated.

No branch has been deleted. The final rollback must never be deleted or advanced.

## Remaining production gates / risks

- Rules source compilation is currently tested by CI, but no existing production workflow deploys `firestore.rules`. GitHub Pages publication only ships static assets. A source rules fix alone cannot fix the live database permissions.
- The supplied Sentry stack has no operation/collection context. The legacy rules mismatch is confirmed in source, but cannot yet be attributed conclusively to that exact event or to currently deployed rules.
- Existing browser tests include references to removed module names, old modal layouts and an assertion that analysis is locked. Full browser regression must be repaired and pass before merging.
- Assistant profile reads and coordinator/global access warrant an explicit role-by-operation security review; do not broaden rules to mask denied reads.
- Existing browser/service caches are not uniformly scoped to auth identity. Admin sessionStorage can restore a previous user's UI data; no claim of complete cache audit/repair is made yet.
- Legacy wrappers remain in production. `candidate-view.js` is explicitly retired from loading but retained for old cached pages/rollback compatibility. CSS removal and full inline-handler runtime coverage remain pending.
- Local dependency downloads are unavailable in this environment. Node tests can run locally; emulator/browser validation is delegated to GitHub Actions, not represented as already passed.

Do not merge or clean branches until the full validation and deployment gates are satisfied.
