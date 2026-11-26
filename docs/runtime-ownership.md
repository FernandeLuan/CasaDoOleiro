# Runtime ownership

This project keeps screen rendering, shared business rules, and persistence separate so a visual change cannot silently change workflow rules.

## Shared business rules

- Admin and Portal feature modules do not call the Firebase SDK or open Firebase contexts directly. Firestore reads/writes belong to `js/services/*`; the UI passes intent and renders results.
- `js/services/application-service.js`: application mutations, participant profile fields, stay-date previews and persistence.
- `js/services/volunteer-profile-service.js`: volunteer profile reads and emergency-contact persistence.

- `js/shared/domain-rules.js`: pure workflow predicates. It does not render UI and does not access Firebase.
- Firestore remains the server-side authority for permissions. Client rules mirror the UX but never replace Firestore Rules.

Critical invariant: candidate planning in `submitted` (application status `analysis`) remains editable until approval. The candidate may add, edit, move, or remove candidate-owned activities while the team reviews the plan.

## Portal

- `js/portal/home.js`: canonical Home renderer and Home-specific presentation decisions.
- `js/portal/estadia.js`: stay-date normalization, date-range selection and Stay screen renderer.
- `js/portal/planejamento.js`: canonical Planning renderer, activity modal and planning interactions.
- `js/portal/app.js`: bootstrap, authentication/session hydration and route rendering only; it must not replace feature functions.
- `js/portal/agenda.js`: canonical volunteer agenda renderer, session cards and blocked-day presentation.
- `js/portal/planning-enhancements.js`: presentation refinements only. It must not replace the Planning page renderer.
- `js/portal/product-current.js`: temporary navigation, profile and session-refresh composition only; it must not replace Home, Agenda or Planning feature functions.
- `js/portal/selection-flow.js` exposes `portalMeetingHomeCard(application)` for the Home renderer; it does not replace Home.
- `js/portal/release-notes.js` exposes `portalReleaseHomeNoticeHtml()` for the Home renderer; it does not replace Home.
- `js/portal/experience-guidance.js` owns profile copy refinement only; it does not replace Home, day-adjustment rules or the activity modal.
- `js/portal/planning-enhancements.js` owns logout presentation only; manager-created activity editability is enforced by `agenda.js`.
- `js/portal/experience-summary.js`: retired from runtime after its Home, Stay, day-adjustment and submit behavior moved to canonical feature owners.
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
