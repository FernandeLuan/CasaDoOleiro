# Architecture audit — 2026-09-18

## Current target

- Working branch: `test/homologacao-clean-ui`
- `main` is an ancestor of the working branch; the working branch is ahead and not behind.
- Homologation remains the validation target before any update to `main`.

## Fixes applied in this audit

- Meeting flow is rendered directly by the canonical account renderer. The full-page planning/account adapter no longer depends on a DOM mutation after a modal render.
- Planning board no longer performs one Firestore session query per candidate. It uses one date-range query and joins sessions to applications in memory.
- Account opening no longer rereads the application document just to render data already present in the candidates list.
- Admin startup reuses the authenticated, scoped session cache instead of immediately forcing the same dashboard/schedule reads again.
- Portal and Admin source modules remain separated by responsibility, while homologation/runtime builds collapse them into 3 JS requests plus 1 local CSS request per app.
- Portal/Admin bootstrap now waits until the document finishes loading, preventing an early partial render before late runtime decorators are available.
- The build rejects orphaned runtime JS modules and preserves classic-script execution scope/order inside runtime bundles.
- Removed dead/superseded modules:
  - `js/admin/emergency-contact-sync.js`
  - `js/portal/candidate-view.js`
  - `js/portal/round3-ui.js`
  - `js/portal/round4-ui.js`

## Firestore query rules

- List screens must use bounded/paginated queries.
- Date-range planning screens must use `planning.listScheduleRange({from,to})`; do not query sessions once per candidate.
- Candidate planning detail is lazy and date-bounded.
- Occupancy is month/unit bounded and cached.
- Point reads for profiles/users are cached and must not be repeated by wrapper modules.
- Full collection fallbacks are intentionally blocked when an index is missing.
- Slow reads are recorded through `OleiroServices.recordQuery`.

## Runtime architecture

Source modules are still intentionally split by responsibility. The build performs request consolidation; source files must not be merged blindly because many classic scripts rely on global functions and ordered decorators.

All numbered runtime `round*.js` modules have now been removed. Their behavior was preserved at the same execution points under semantic modules: Portal uses `experience-summary.js`, `experience-guidance.js`, `planning-feedback.js` and `pending-change-state.js`; Admin uses `planning-summary.js`, `planning-maintenance.js` and `adjustment-focus.js`. The build now rejects both orphaned runtime modules and any new numbered `round*.js` runtime file.

## Branch cleanup

### Delete after homologation validation

These branches contain no unique code that is still required, are ancestors of the working branch, or have already had their useful changes integrated:

- `audit/full-production-20260915`
- `backup/homologacao-before-v2-visual-20260917`
- `backup/v1-production-before-v2-20260917`
- `fix/admin-delete-confirm-20260915`
- `fix/admin-planning-approval-20260915`
- `fix/candidate-analysis-editing-runtime-20260915`
- `fix/candidate-editability-cleanup-20260915`
- `fix/planning-rule-recovery-20260915`
- `fix/portal-mobile-scroll-20260917`
- `fix/runtime-architecture-20260915`
- `fix/sentry-slow-query-alerts`
- `rollback/before-connected-side-menu-20260914`
- `rollback/before-feedback-history-20260914`
- `rollback/before-feedback-history-20260915`
- `rollback/before-feedback-visibility-20260914`
- `rollback/before-mobile-scroll-cleanup-20260914`
- `rollback/before-side-action-menu-20260914`
- `rollback/before-x-size-fix-20260914`
- `rollback/current-before-layout-refactor-20260915`
- `rollback/current-before-smart-interactions-20260915`
- `rollback/current-before-smart-state-refactor-20260915`
- `rollback/production-before-admin-approval-fix-20260915`
- `rollback/production-before-architecture-audit-20260915`
- `rollback/production-before-candidate-editability-cleanup-20260915`
- `rollback/production-before-delete-confirm-fix-20260915`
- `rollback/production-before-planning-rule-recovery-20260915`
- `rollback/production-before-round3-planning-fix-20260915`
- `v2/development`
- `v2/visual-identity`

### Keep for now

- `main` — production line.
- `test/homologacao-clean-ui` — current homologation/work branch.
- `rollback/final-production-before-audit-20260915` — keep one immutable rollback point until the current homologation is promoted.
- `audit/production-20260915` — contains a large divergent audit/test history; review remaining unique changes before deletion.
- `fix/firestore-slow-query-monitoring` — monitoring is already present in current code, but the branch contains divergent E2E test work that should be reviewed before deletion.
- `feat/transactional-email-outbox-r48` — unfinished optional email-dispatcher feature; it is not dead code and should be kept until that feature is accepted or abandoned.

## Next consolidation target

Keep new behavior inside the existing semantic owner whenever possible. New visual or workflow changes must not introduce numbered compatibility modules; extend the responsible Portal/Admin/service module and cover the behavior with a regression test.
