# Runtime ownership

This project keeps screen rendering, shared business rules, and persistence separate so a visual change cannot silently change workflow rules.

## Shared business rules

- `js/shared/domain-rules.js`: pure workflow predicates. It does not render UI and does not access Firebase.
- Firestore remains the server-side authority for permissions. Client rules mirror the UX but never replace Firestore Rules.

Critical invariant: candidate planning in `submitted` (application status `analysis`) remains editable until approval. The candidate may add, edit, move, or remove candidate-owned activities while the team reviews the plan.

## Portal

- `js/portal/planejamento.js`: canonical Planning screen and candidate planning controls.
- `js/portal/app.js`: portal boot/render and modal form composition; it consumes shared domain rules.
- `js/portal/planning-enhancements.js`: presentation refinements only. It must not replace the Planning page renderer.
- `js/portal/candidate-view.js`: retired from runtime on 2026-09-15 after its behavior was merged into `planejamento.js`. It is intentionally kept for one rollback cycle and tracked by the runtime architecture test.

Feature wrappers for review, meeting, and adjustment flows may decorate activity cards and contextual actions, but they must not redefine candidate planning editability.

## Admin

- `js/admin/planning-page.js`: canonical Planning list/detail/profile renderer.
- `js/admin/admin-shell.js`: shell/sidebar/layout only. It delegates Planning markup to `window.adminPlanningPageHtml`.
- Account, History, Occupancy, Groups, House Info, and Account Settings remain in their named route modules.

## Dead-code and ownership checks

`tests/runtime-architecture.test.mjs` runs in CI and production deployment. It checks that:
1. every Admin/Portal screen module is loaded or explicitly retired;
2. candidate Planning has one canonical page owner;
3. the Admin shell does not duplicate Planning markup;
4. all local script references exist.

Do not delete a retired module in the same change that stops loading it. First merge its behavior into the canonical owner, keep it explicitly retired for a rollback cycle, and remove it only in a later cleanup after regression passes.
