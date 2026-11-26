# Architecture review — 2026-11-26

## Scope and evidence

Reviewed the `main` tree after PR #61 was merged at `49dd49755817718507617deecc81deb9209c3716`, including:
- application entry points: `admin/index.html`, `portal/index.html`;
- source ownership notes: `docs/runtime-ownership.md` and prior audit `docs/architecture-audit-20260918.md`;
- build and architecture gate: `scripts/build-site.mjs`, `scripts/check-homologation-architecture.mjs`;
- runtime entry modules: `js/admin/app.js`, `js/portal/app.js`;
- shared services and state modules;
- current test scripts and workflow definitions.

This is a source-level architecture audit. It does not claim runtime profiling, a full dependency graph, or end-to-end validation against production user accounts.

## Current architecture

The application is a static HTML/CSS/JavaScript frontend. Admin and Portal have separate HTML entry points, share Firebase/authentication, domain rules, UI utilities and service modules, and persist data through Firebase Authentication and Cloud Firestore. The production build consolidates source files into fewer runtime requests while preserving classic-script ordering and global scope.

## Findings

### A1 — Script-order and global-scope coupling (high)

Both entry points load many classic scripts in a fixed sequence. Modules publish globals and later modules decorate or replace functions. For example, `js/portal/app.js` captures and reassigns `volunteerHome`, replaces `openActivityModal`, and owns boot/render orchestration. Admin modules similarly share the global `state`, service namespace and rendering functions.

Impact: changing script order or a function owner can silently break a distant workflow. A file boundary does not necessarily represent an independent module boundary.

### A2 — Overlapping orchestration and feature ownership (high)

The repository has many small feature files under `js/admin` and `js/portal`, but runtime behavior is assembled through overrides and decorators. The existing `docs/runtime-ownership.md` defines canonical owners, yet current runtime code still contains compatibility layers and function replacement.

Impact: contributors can reasonably edit a visually related module that is not the actual owner of the behavior.

### A3 — Shared state is a broad implicit dependency (high)

Admin and Portal modules read and mutate a shared global `state` object. This obscures read/write contracts and makes isolated tests difficult.

Impact: unrelated features can depend on undocumented state fields and timing.

### A4 — Services are a useful boundary, but the boundary is incomplete (medium/high)

The code already has service modules for applications, planning, history, units, users, projects and access. However, UI modules call these global service namespaces directly and often coordinate loading, caching, fallback behavior and rendering in the same function.

Impact: UI and persistence concerns can become coupled, especially when error handling or Firestore query behavior changes.

### A5 — Architecture checks are partly historical and manually curated (medium)

`scripts/check-homologation-architecture.mjs` checks a long list of required and forbidden paths and script references. This protects known regressions but is tied to a particular runtime layout. The architecture workflow was skipped for the PR #61 head, so it must not be represented as a passing architecture validation.

Impact: a skipped gate or stale path inventory can leave architecture changes insufficiently verified.

### A6 — Existing strengths to preserve

- Admin and Portal have distinct entry points and feature namespaces.
- Business predicates have a shared pure-rule owner in `js/shared/domain-rules.js`.
- Firebase persistence is concentrated in service modules rather than every screen.
- The production build validates local assets and JavaScript syntax.
- Existing tests cover query budgets, runtime ownership, access scope, Firestore isolation, theme behavior and end-to-end flows.
- The previous audit explicitly warns against merging classic scripts blindly because their ordered global decorators are runtime-sensitive.

## Target architecture

Adopt incremental modularization, not a wholesale rewrite:

1. **Entry/bootstrap layer** — one explicit bootstrap per Admin and Portal. Own authentication readiness, dependency construction and app startup only.
2. **Feature layer** — route/page controllers own one feature workflow (Candidates, Planning, Projects, History, Occupancy, Account, Portal Profile). Each exposes a documented interface; no feature replaces another feature's global functions.
3. **Application/domain layer** — pure rules and use-case functions. No DOM, Firebase SDK or global browser state.
4. **Infrastructure layer** — Firebase repositories/services, query construction, caching and persistence. Firestore access remains here and security rules remain authoritative.
5. **UI/shared layer** — reusable rendering primitives, navigation, dialogs, localization, theme and accessibility. UI primitives do not contain business decisions.
6. **Composition layer** — explicit dependency wiring. Temporary compatibility adapters are isolated, named, measured and removed after callers migrate.

Proposed source layout (move files only when a tested owner boundary exists):

```text
src/
  app/
    admin/
      bootstrap.js
      routes/
    portal/
      bootstrap.js
      routes/
  features/
    candidates/
    planning/
    projects/
    history/
    account/
    occupancy/
  domain/
    applications/
    planning/
    permissions/
  infrastructure/
    firebase/
    repositories/
    monitoring/
  shared/
    ui/
    navigation/
    i18n/
    theme/
```

The current `js/` tree should not be moved wholesale in one change. Keep the deployed HTML entry points and build output stable during migration; introduce a feature at a time and preserve behavior through contract tests.

## Migration sequence and acceptance criteria

### Phase 0 — Baseline (this audit)
- Record current source layout and known coupling.
- Confirm the production artifact and CI state.
- Do not change runtime behavior.

### Phase 1 — Runtime contract inventory
- Build a machine-readable inventory of script load order, global declarations, global writes, function reassignment and service dependencies.
- Identify canonical owners for every overridden global.
- Fail CI when a new override or dependency is introduced without an explicit contract.
- Acceptance: every runtime script has an owner and documented dependencies; no unexplained function replacement remains.

### Phase 2 — Shared state boundary
- Introduce typed-by-contract state selectors and actions (plain JS modules initially).
- Migrate one feature at a time; prohibit direct cross-feature mutation.
- Acceptance: feature tests can run with injected state and no Firebase/DOM dependency.

### Phase 3 — Use cases and repositories
- Move workflow orchestration out of screen renderers.
- Give Firestore queries one repository/service owner with explicit input/output contracts.
- Keep query limits, unit scope, pagination and security rules unchanged unless a separately tested requirement justifies a change.
- Acceptance: unit tests for use cases, emulator tests for repository rules/queries, and no Firestore SDK calls from feature UI modules.

### Phase 4 — Feature composition
- Replace global function decoration with explicit feature registration and injected dependencies.
- Keep compatibility adapters only at the boundary while old callers migrate.
- Acceptance: deterministic startup independent of fragile script order; feature ownership and import graph are validated.

### Phase 5 — Directory migration and cleanup
- Move modules to the target layout only after each feature passes the same tests.
- Remove retired files and adapters only after references are proven absent.
- Acceptance: clean build, full unit suite, Firestore emulator suite, Chromium and WebKit E2E, production artifact validation.

## Non-negotiable safeguards

- No blanket Firestore permission broadening.
- No production data used as test fixtures.
- No simultaneous large-scale file moves and behavior changes.
- No deleting a compatibility module until all callers are migrated and regression tests pass.
- No merge to `main` with required checks failing or skipped.
- No deployment claim until the deployed commit and Pages deployment are confirmed.


## Phase 1 progress — first guarded contract

The first executable contract is now recorded in `docs/runtime-contract-overrides.json`. It inventories the four currently observed Portal function replacements in `js/portal/app.js` (two assignments to `volunteerHome`, one to `volunteerStayDates`, and one to `openActivityModal`). The ownership intent and exit criteria are recorded per symbol.

`tests/runtime-architecture.test.mjs` now compares the source assignments with that explicit contract. An unreviewed addition, removal, or count change fails the architecture test and requires a deliberate contract review. This is intentionally a narrow first guard, not a claim that every global write in Admin and Portal has been inventoried.

Next migration target: move the two `volunteerHome` presentation adapters into the canonical home feature, then move the date selector and activity-modal orchestration behind explicit feature APIs. Each move must preserve current behavior and pass Portal E2E before the compatibility assignments are removed.
