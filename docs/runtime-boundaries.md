# Runtime boundaries and migration plan

## Runtime shape today

The application uses separate Admin and Portal HTML entry points, but both still execute ordered classic scripts and share a mutable global `state` object. The production build reduces asset requests; it does not turn those scripts into isolated ES modules. Script order and global names therefore remain runtime contracts.

## Ownership rules

| Layer | Owns | Must not own |
|---|---|---|
| `js/admin` / `js/portal` | Screen rendering, user interaction, route-level orchestration | Firestore queries, reusable domain predicates, another screen's renderer |
| `js/shared/domain-rules.js` | Pure workflow predicates | DOM, Firebase SDK, persistence |
| `js/services` | Firestore access, query constraints, transactions, cache scoped to data access | Screen markup and DOM rendering |
| `js/shared` | Shared UI, navigation, state primitives, localization, theme | Feature-specific workflow orchestration |
| `admin/app.js` / `portal/app.js` | Startup, session handoff, top-level hydration and route rendering | Replacing feature functions or owning feature-specific form markup |

## Findings confirmed in source

1. **Global state is an implicit dependency.** `js/shared/state.js` defines one mutable object. Admin and Portal modules read and write it directly. This is convenient but makes the owner of a field and the side effects of a change hard to discover.
2. **The Portal bootstrap had function replacement.** PR #73 returns Home, stay-date selection and the activity modal to their feature modules. The planning projection helpers (`planStatusFromApplication`, `portalPlanActivities`, `applyVolunteerPlanningRows`) are also owned by `planejamento.js`.
3. **Admin data orchestration had been mixed into bootstrap.** The schedule cache, browser-cache serialization, candidate pagination, dashboard hydration and group loading were extracted to `js/admin/admin-data.js`. The bootstrap now keeps route rendering, session startup and visibility-refresh wiring. This preserves the existing global API and classic-script order while establishing a clearer owner boundary.
4. **Services are not yet fully independent of UI state.** For example, `application-service.js` owns queries and lifecycle transactions but also updates selected global caches/state after a transaction. That coupling should be removed only after callers are migrated to explicit invalidation results.
5. **Planning service composition is implicit.** `planning-operations-service.js` extends `services.planning` at runtime. This is a deliberate extension today, but its public API and load order need an explicit composition contract.
6. **History hooks decorate service methods.** `history-hooks.js` wraps service functions and appends audit events. This is useful middleware, but it must not double-log operations that already append history in the same Firestore batch.

## New dependency inventory

Run `npm run audit:runtime` to inspect:
- state properties read and written by each file;
- state fields with multiple writer modules;
- feature-to-service references;
- global function assignments;
- Firestore SDK access from screen modules (the two known Admin write paths were migrated to the application service);
- exact Admin and Portal script load order.

The inventory is diagnostic, not a permission to mass-refactor. Multi-writer state fields are reported first; they are not automatically prohibited because Admin and Portal run in separate entry points and some fields intentionally have multiple collaborators.

## Migration sequence

### 1. Portal ownership
- Remove bootstrap overrides.
- Keep screen renderers, form composition and feature projections in their canonical modules.
- Guard ownership with architecture and E2E tests.

### 2. Shared-state contracts
- Use the inventory to assign an owner to each mutable state field.
- Introduce selectors/actions for high-coupling fields first (planning, candidates, sessions, occupancy).
- Migrate one feature at a time; do not replace the entire state object or introduce a framework.

### 3. Admin orchestration
- The first extraction is in place: `admin-data.js` owns cache and hydration; `admin/app.js` owns startup and route composition.
- The current global functions are retained for compatibility. The next step is to introduce a small `OleiroAdminData` facade after callers are migrated, not to add another layer of aliases.

### 4. Service boundaries
- Separate read/query functions from command/transaction functions where a service currently owns both.
- Move UI cache invalidation out of services into explicit return values/events.
- Keep Firestore query limits, unit scoping, transactions and security rules unchanged.
- Compose planning operations and history middleware once, in a documented service composition step.

### 5. Script loading
- Preserve classic-script order until each feature has explicit dependencies and tests.
- Do not blindly concatenate source scripts or convert all files to ES modules in one change.
- Any future migration must preserve the exact deployed build and pass Chromium and WebKit E2E.

## Acceptance criteria

- A feature change modifies its owner module and only the necessary contracts/tests.
- No new screen function is replaced by bootstrap code.
- Firestore access remains in services.
- Every high-coupling state field has a documented owner and controlled write API before it is migrated.
- Admin/Portal entry-point order is machine-audited.
- Required unit, emulator, build, Chromium and WebKit checks pass before merge.
