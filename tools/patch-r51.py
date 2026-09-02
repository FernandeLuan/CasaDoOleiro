from pathlib import Path

rules_path = Path('firestore.rules')
rules = rules_path.read_text(encoding='utf-8')

anchor = """    function approvedApplication(applicationId) {\n      let app = applicationData(applicationId);\n      return app.active == true && app.status == 'approved';\n    }\n"""
insert = anchor + """\n    function proposalApplication(applicationId) {\n      let app = applicationData(applicationId);\n      return app.active == true && app.status in ['meeting', 'approved'];\n    }\n"""
if 'function proposalApplication(applicationId)' not in rules:
    assert rules.count(anchor) == 1, 'approvedApplication anchor mismatch'
    rules = rules.replace(anchor, insert, 1)

create_block = """    function createsApprovedProposal(data) {\n      return activeUser()\n        && participantOf(data.applicationId)\n        && approvedApplication(data.applicationId)\n"""
create_new = create_block.replace('approvedApplication(data.applicationId)', 'proposalApplication(data.applicationId)')
assert rules.count(create_block) == 1, 'createsApprovedProposal block mismatch'
rules = rules.replace(create_block, create_new, 1)

update_block = """    function updatesApprovedProposal() {\n      return activeUser()\n        && participantOf(resource.data.applicationId)\n        && approvedApplication(resource.data.applicationId)\n"""
update_new = update_block.replace('approvedApplication(resource.data.applicationId)', 'proposalApplication(resource.data.applicationId)')
assert rules.count(update_block) == 1, 'updatesApprovedProposal block mismatch'
rules = rules.replace(update_block, update_new, 1)

activity_delete = """            || (\n              approvedApplication(resource.data.applicationId)\n              && resource.data.postApprovalProposal == true\n              && resource.data.reviewStatus == 'adjustments'\n            )\n"""
activity_delete_new = activity_delete.replace('approvedApplication(resource.data.applicationId)', 'proposalApplication(resource.data.applicationId)')
assert rules.count(activity_delete) == 1, 'activity proposal delete block mismatch'
rules = rules.replace(activity_delete, activity_delete_new, 1)

session_delete = """            || (\n              approvedApplication(resource.data.applicationId)\n              && resource.data.status == 'proposed'\n              && resource.data.postApprovalProposal == true\n              && resource.data.reviewStatus == 'adjustments'\n            )\n"""
session_delete_new = session_delete.replace('approvedApplication(resource.data.applicationId)', 'proposalApplication(resource.data.applicationId)')
assert rules.count(session_delete) == 1, 'session proposal delete block mismatch'
rules = rules.replace(session_delete, session_delete_new, 1)

# Existing approved-plan changes remain final-approved only.
assert "function participantRequestsApprovedChange()" in rules
assert "function participantResubmitsApprovedChange()" in rules
requests = rules[rules.index('function participantRequestsApprovedChange()'):rules.index('function participantResubmitsApprovedChange()')]
assert 'approvedApplication(resource.data.applicationId)' in requests
resubmits = rules[rules.index('function participantResubmitsApprovedChange()'):rules.index('match /users/{uid}')]
assert 'approvedApplication(resource.data.applicationId)' in resubmits

rules_path.write_text(rules, encoding='utf-8')

portal_path = Path('portal/index.html')
portal = portal_path.read_text(encoding='utf-8')
script = '<script src="../js/portal/meeting-activity-r51.js?v=20260902-r51"></script>'
if script not in portal:
    anchor_script = '<script src="../js/portal/candidate-adjustment-r37.js?v=20260901-r47"></script>'
    assert portal.count(anchor_script) == 1, 'portal script anchor mismatch'
    portal = portal.replace(anchor_script, anchor_script + script, 1)
portal_path.write_text(portal, encoding='utf-8')

print('R51 patch applied safely')
