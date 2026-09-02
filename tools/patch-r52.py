from pathlib import Path

path=Path('admin/index.html')
text=path.read_text(encoding='utf-8')
script='<script src="../js/admin/meeting-activity-r52.js?v=20260902-r52"></script>'
if script not in text:
    anchor='<script src="../js/admin/review-flow-r32.js?v=20260901-r47"></script>'
    assert text.count(anchor)==1, 'admin script anchor mismatch'
    text=text.replace(anchor,anchor+script,1)
path.write_text(text,encoding='utf-8')
print('R52 admin script registered')
