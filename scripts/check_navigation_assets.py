"""Check the pinned Figma navigation evidence, assets and code registrations."""
from pathlib import Path
import hashlib
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'docs/figma-navigation-2026-10-27'
def read(name):
    return json.loads((EVIDENCE / name).read_text())

screens = read('inventaire-ecrans.json')
checks = read('verification-finale.json')
assert len(screens) == len(checks) == 62
assert {s['id'] for s in screens} == {s['screen'] for s in checks}
assert all(s['slots'] == 5 for s in checks)
variants = {v['id'] for v in read('composants.json')['variants']}
assert all(s['component'] in variants for s in checks)
captures = read('captures.json')
assert len(captures) == 67
for item in captures:
    data = (ROOT / item['file']).read_bytes()
    assert data.startswith(b'\x89PNG\r\n\x1a\n')
    assert hashlib.sha256(data).hexdigest() == item['sha256'], item['file']
registry = (ROOT / 'src/shared/ui/KodjoIcon.tsx').read_text()
manifest = json.loads((ROOT / 'assets/icons/manifest.json').read_text())
assets = read('exports-icones.json')
assert len(assets) == 10
for item in assets:
    path = ROOT / item['file']
    assert path.read_text() == item['svg'], path
    svg = ET.fromstring(item['svg'])
    size = 26 if 'community' in path.stem else 24
    assert svg.attrib['viewBox'] == f'0 0 {size} {size}'
    assert str(Path('../../../') / item['file']) in registry
    entry = next(a for a in manifest['assets'] if a['file'] == path.stem)
    assert entry['figmaNodeId'] == item['id']
    assert entry['sha256'] == hashlib.sha256(path.read_bytes()).hexdigest()
    key = entry['key'].replace('.', '-')
    assert re.search(r'"'+key+rf'": \[{size}, {size}\]', registry), key
print('PASS: 62 screens, 67 captures, 10 exact SVG exports and code registrations')
