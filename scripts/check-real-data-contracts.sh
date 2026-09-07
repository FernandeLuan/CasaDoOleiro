#!/usr/bin/env bash
set -euo pipefail

# Source-level contracts only. Browser behavior and Firestore Rules are tested by E2E.
has(){ grep -Fq -- "$2" "$1" || { echo "Missing contract in $1: $2" >&2; exit 1; }; }
regex(){ grep -Eq -- "$2" "$1" || { echo "Missing contract in $1: $2" >&2; exit 1; }; }
exists(){ test -e "$1" || { echo "Required file missing: $1" >&2; exit 1; }; }
absent(){ test ! -e "$1" || { echo "Removed file reintroduced: $1" >&2; exit 1; }; }
no_match(){ if grep -RInE -- "$1" "${@:2}"; then echo "Forbidden source pattern: $1" >&2; exit 1; fi; }
css_has(){ grep -RFq -- "$1" css || { echo "Missing CSS contract: $1" >&2; exit 1; }; }

# Bounded queries, pagination, and service-owned Firestore access.
for token in 'limit:10' 'candidateHasMore'; do has js/admin/app.js "$token"; done
has js/admin/voluntariado.js 'Ver mais 10'
for token in startAfter getCountFromServer listUpcoming listOccupancyMonth stayPreviewCache cachedStayPreview; do has js/services/application-service.js "$token"; done
has js/services/application-maintenance-service.js processExpiredPending
for token in managerOccupancy occupancyScreenCache 'PLAN_CACHE_MS=5*60*1000' 'listSessions({applicationId:p.id,from:dates[0],to:dates[dates.length-1]})'; do has js/admin/candidate-detail-data.js "$token"; done
has js/admin/candidate-profile-details.js openOccupancyDay
absent js/admin/occupancy-data.js
has js/services/planning-service.js "where('applicationId','==',appId)"
has js/services/planning-service.js "where('date','>=',String(from))"
has js/services/planning-service.js 'activity_sessions/application'
has js/services/planning-service.js 'A consulta ampla foi bloqueada para proteger a cota do Firestore'
has js/services/service-core.js recordQuery
for token in hasSessions 'firestore.limit(1)' activity-delete-check getCountFromServer; do has js/services/planning-operations-service.js "$token"; done
has js/portal/app.js declaredEmpty
for token in openAdminPlanningActivity managerUpdateSession requestAdminDeletePlanningSession; do has js/admin/candidate-planning-management.js "$token"; done
has js/services/planning-service.js manager_confirmed
has js/services/selection-flow-service.js "where('status','==','confirmed')"
has js/services/selection-flow-service.js 'activity_sessions/operational-schedule'
has js/services/selection-flow-service.js 'selection/planning-docs'
has js/services/selection-flow-service.js 'A consulta ampla foi bloqueada para proteger a cota do Firestore'
has js/admin/selection-flow.js 'hydrateCandidatePlanning(p.id,{force:true})'
has js/services/auth-service.js "where('active','==',true)"
has js/services/auth-service.js 'firestore.limit(1)'
has js/services/consistency-services.js sessionsForActivity
has js/services/consistency-services.js "where('activityId','==',actId)"
has firestore.indexes.json '"fieldPath": "applicationId"'
has firestore.indexes.json '"fieldPath": "activityId"'
no_match 'MANAGER_APPLICATION_MAX_RECORDS|hydrateRemainingManagerCandidates' js/admin
no_match 'firestore\.(getDocs|getDoc|query)\(' js/admin js/portal
no_match 'usando leitura compatível|leitura compatível temporária' js/services
for file in js/services/planning-r23-service.js js/services/planning-manager-status-r25-service.js; do absent "$file"; done
no_match 'planning-r23-service|planning-manager-status-r25-service|getSessionById' admin portal js
python - <<'PY'
from pathlib import Path
text=Path('js/services/application-service.js').read_text()
segment=text.split('async changeStayDates',1)[1].split('async requestDayAdjustment',1)[0]
assert 'cachedStayPreview' in segment
assert 'applicationActivities' not in segment
assert 'orphanActivityIds' in segment
lines=text.splitlines()
for index,line in enumerate(lines):
    if 'async countStatus' in line:
        assert 'getDocs' not in '\n'.join(lines[index:index+12]), 'countStatus must use aggregation'
PY

# Spark-only administration and actual unit-scoped records.
absent functions/index.js
for file in functions/tools/delete-volunteer.js functions/tools/update-volunteer-email.js functions/tools/audit-volunteer.js js/services/admin-access-service.js js/admin/access-management.js; do exists "$file"; done
has functions/package.json firebase-admin
has functions/package.json admin:audit
has js/admin/access-management.js 'Cloud Shell'
has js/services/admin-access-service.js sendPasswordResetEmail
has js/services/onboarding-service.js firstPortalAccessAt
has js/services/auth-service.js markFirstPortalAccess
has firestore.rules participantMarksFirstAccess
no_match 'firebase-functions|ensureFunctions|httpsCallable|adminUpdateVolunteerEmail|adminDeleteVolunteerApplication' firebase.json functions/package.json js/firebase js/services/admin-access-service.js js/admin/access-management.js
for token in groupUnitId groupsUnitId changeManagerGroupUnit; do has js/admin/app.js "$token"; done
has js/admin/grupos.js managerGroupUnit
has js/admin/grupos.js 'independentes por unidade'
has js/services/group-service.js "where('unitId','==',normalized)"
has js/services/group-service.js "required=['A','B','C','D']"
has js/services/group-service.js groups/unit
no_match "ensureDefaults\('rodeio'\)" js/admin js/services

# Historical records, translations, and selection lifecycle.
for file in js/shared/i18n-keyed.js js/services/history-service.js js/services/history-hooks.js js/admin/history.js js/admin/selection-ui.js; do exists "$file"; done
has js/shared/i18n-keyed.js 'window.t=t'
has js/shared/i18n-keyed.js 'window.tValue=tValue'
has js/services/history-service.js "collection(context.db,'applications',String(applicationId),'history')"
has js/admin/history.js PAGE_SIZE=20
has js/admin/history.js "tab==='history'"
has firestore.rules managerHasUnit
has firestore.rules 'match /history/{eventId}'
for file in js/services/history-service.js js/services/history-hooks.js; do has admin/index.html "../$file"; done
has admin/index.html '../js/admin/history.js'
has portal/index.html '../js/shared/i18n-keyed.js'
# The old global i18n/render observer is forbidden. Date-field enhancement has a
# bounded, idempotent observer restricted to the Admin app and modal roots.
no_match 'MutationObserver' js/shared/i18n*.js js/admin/planning-mobile-filters.js
has js/admin/candidate-form.js 'enhanceSharedAdminDateFields(node)'
has js/admin/candidate-form.js "document.getElementById('app')"
for token in "status:'meeting'" "status:'plan_approved'" scheduleSelectionMeeting completeSelectionMeeting finalizeSelection "status:'rejected'"; do has js/services/selection-flow-service.js "$token"; done
for token in 'Aprovar candidato' 'Não aprovar' 'Motivo interno da não aprovação' selection-flow-card; do has js/admin/selection-flow.js "$token"; done
has js/portal/selection-flow.js portal.meeting.next
has js/portal/selection-flow.js action.enterMeeting
has firestore.rules candidateEditable
has firestore.rules managerCreated
has firestore.indexes.json '"status"'
for file in admin portal; do has "$file/index.html" '../js/services/selection-flow-service.js'; has "$file/index.html" "../js/$file/selection-flow.js"; done
for token in postApprovalProposal reviewPostApprovalProposal; do has js/services/planning-service.js "$token"; done
regex js/services/planning-service.js 'reviewStatus.*analysis'
has js/portal/app.js portal.activity.newProposal
has js/portal/post-approval.js portal.session.reviewing
has js/portal/post-approval.js action.adjust
for token in 'Nova atividade' Aprovar Recusar; do has js/admin/post-approval.js "$token"; done
has firestore.rules createsApprovedProposal
has firestore.rules updatesApprovedProposal
for file in admin portal; do has "$file/index.html" "../js/$file/post-approval.js"; done

# Approved UX safeguards, independent of historical stylesheet filenames.
has js/services/auth-guard.js 'Sem conexão'
css_has offline-action
css_has unit-admin-card
css_has overscroll-behavior-y:none
has js/portal/round12-ui.js volunteer-change-pending
has js/admin/round12-ui.js 'Aprovar mudança'
has js/admin/round7-ui.js 'Reiniciar planejamento'
for token in 'Limpar planejamento' 'candidateSubmitted=[' "['analysis','adjustments']" admin-review-actions-r24 btn-plan-clear-warning day-initial-analysis 'Em análise'; do has js/admin/planning-review-controls.js "$token"; done
for token in aria-busy action.resendReview action.sending; do has js/portal/review-safeguards.js "$token"; done
has js/portal/selection-flow.js 'deleteSession(session.id'
has js/portal/selection-flow.js 'applications.update(application.id'
has js/admin/candidate-form.js 'Digite para buscar o país'
has js/services/onboarding-service.js participantGenders
has js/services/onboarding-service.js registrationLink
for token in review-day-warning 'Voltar ao calendário'; do has js/admin/candidate-profile-details.js "$token"; done
for token in home-unit-support-link managerCreated portal.plan.addBeforeSend; do has js/portal/planning-enhancements.js "$token"; done
has firestore.rules participantMayResetEmptyAdjustment
for file in admin portal; do has "$file/index.html" '../js/shared/i18n-flow-compat.js'; has "$file/index.html" format-detection; done

# No fake data, obsolete loaders, or unsafe browser-only backends.
for file in inactive.html js/shared/notifications.js js/services/attention-service.js js/shared/mock-data.js js/demo build-preview.mjs firebase.preview.json scripts/prepare-prod-clean-ui.mjs; do absent "$file"; done
no_match 'inactive\.html|notifications\.js|attention-service\.js|openNotifications\(' index.html admin portal js
no_match 'groupPreference' admin portal js firestore.rules
no_match '\?dev=1|chooseDevRole|devPanel|syncPrototype|Thomas Miller|Maria Gómez|Sophie Martin' index.html admin portal js
no_match 'activity-catalog-r26|OleiroActivityCatalog|activity-catalog-field|activity-catalog-meta' admin portal js css
no_match 'Reajustar mudança' js/portal
for file in js/shared/activity-catalog-r26.js js/portal/activity-catalog-r26.js js/admin/activity-catalog-r26.js; do absent "$file"; done

# The isolated browser suite is the executable regression layer.
for file in package.json playwright.config.js tests/e2e/seed.mjs tests/e2e/core-flow.spec.js .github/workflows/e2e.yml; do exists "$file"; done
has js/firebase/firebase-client.js connectAuthEmulator
has js/firebase/firebase-client.js connectFirestoreEmulator
has playwright.config.js iphone-webkit
has package.json 'firebase emulators:exec'
has tests/e2e/core-flow.spec.js "locator('#moveSessionSave')"
has tests/e2e/core-flow.spec.js "lang:'en'"
has tests/e2e/core-flow.spec.js "lang:'es'"
echo 'Real-data source contracts: OK.'
