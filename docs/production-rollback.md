# Production rollback procedure

## Branch roles

- `main`: production source of truth.
- `backup/production-2026-11-25`: point-in-time snapshot intended to remain unchanged of the production commit used as the baseline for the 25 November 2026 maintenance.
- `fix/production-readiness-2026-11-25`: isolated maintenance branch. It must never deploy directly to production.

The backup branch is a point-in-time source snapshot. It does not automatically replace `main` and should not be merged as a normal feature branch.

## Before every production change

1. Confirm `main` is the production commit and the current deployment is healthy.
2. Create a dated backup branch from the exact `main` SHA.
3. Create a separate feature/fix branch from that same `main` SHA.
4. Run unit, Firestore Emulator, build, and browser regression checks.
5. Open a Pull Request to `main`; do not push feature changes directly to `main`.
6. Merge only after required checks pass and the production artifact has been reviewed.

## Rollback after a bad merge

Prefer a Git revert, not a force-push or a reset of the production branch.

1. Identify the exact PR/commit that introduced the regression.
2. Use GitHub's **Revert** action on the merged PR when available, or create a dedicated rollback branch from the current `main`.
3. For a merge commit, revert it with its first parent:

   ```bash
   git fetch origin
   git switch -c rollback/revert-production-regression origin/main
   git revert -m 1 <merge-commit-sha>
   git push -u origin rollback/revert-production-regression
   ```

   For a squash commit, use `git revert <squash-commit-sha>` without `-m 1`.

4. Open a Pull Request from the rollback branch to `main`.
5. Wait for production CI and the Pages deployment to complete; verify the deployed application before resuming changes.

## Restoring the exact 25 November baseline

If the regression spans multiple changes, use `backup/production-2026-11-25` as the comparison/reference point. Create a dedicated rollback branch from current `main`, inspect the complete diff against the backup snapshot, and revert the relevant commits in reverse dependency order. Do not force-update `main` to the backup SHA: that rewrites production history and can leave deployments and later changes inconsistent.

## Important boundaries

- A backup branch protects source history; it is not a database backup.
- Firestore data, rules, and indexes may have independent lifecycle and must be assessed separately before rollback.
- A rollback of application code does not automatically reverse Firestore writes or data migrations.
- Never put secrets, tokens, or production personal data in a rollback commit.
