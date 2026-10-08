#!/usr/bin/env python3
"""Verify planning evidence coherence. Never claims application conformance."""
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
FIGMA = HERE.parent / 'figma'


def read(path):
    return json.loads(path.read_text())


assertions = read(HERE / 'assertions-recette.json')['assertions']
scope = {f'P3-{i:02d}' for i in range(1, 24)}
assert {r['scopeId'] for r in assertions} == scope
assert len({r['assertionId'] for r in assertions}) == len(assertions) == 59
assert all(r['status'] == 'PLANNED_NOT_EXECUTED' for r in assertions)
trace = read(HERE / 'tracabilite-travail.json')['requirements']
assert {r['id'] for r in trace} == scope
for r in trace:
    expected = {'assertions-recette.json#/' + a['assertionId']
                for a in assertions if a['scopeId'] == r['id']}
    assert set(r['expectedAssertionRefs']) == expected
    assert r['canonicalVNextIds'] is None and not r['evidenceProduced']

states = read(HERE / 'inventaire-etats-scenarios.json')['states']
assert len(states) == len({s['state_id'] for s in states}) == 94
assert sum(s['origin'] == 'FIGMA' for s in states) == 41
scenarios = [x for s in states for x in s['scenarios']]
assert len(scenarios) == len({s['scenario_id'] for s in scenarios}) == 94

# Use newline only: a JSON string may contain an actual U+2028 separator.
mapping = [json.loads(line) for line in (HERE / 'mapping-elements-ui.jsonl').read_text().split('\n')
           if line.strip()]
header, rows = mapping[0], mapping[1:]
columns = header['columns']
layout = read(FIGMA / 'complements-layout.json')['schemas']
packets = {}
identities = set()
for cells in rows:
    row = dict(zip(columns, cells, strict=True))
    assert row['recordId'] not in identities
    identities.add(row['recordId'])
    file, position = row['source'].split('#/nodes/')
    if file not in packets:
        packets[file] = read(FIGMA / file)
    packet = packets[file]
    node = packet['nodes'][int(position)]
    assert row['nodeId'] == node['id'] and row['name'] == node['name']
    properties = {k: v for k, v in {**node, **layout[row['layoutSchema']]}.items()
                  if k not in {'id', 'type', 'name', 'parent', 'children', 'master'}}
    fingerprint = hashlib.sha256(json.dumps(properties, ensure_ascii=False, sort_keys=True,
                                            separators=(',', ':')).encode()).hexdigest()
    assert fingerprint == row['mergedPropertiesSha256'], row['recordId']
assert len(rows) == 6725 and len(header['frames']) == len(packets) == 41
assert sum(r[columns.index('visibleAccordingToAncestors')] for r in rows) == 6660

for name in ['controle-fraicheur-figma.json', 'controle-fraicheur-tokens.json',
             'controle-fraicheur-maitres.json']:
    proof = read(HERE / name)
    assert proof['mismatches'] == [] and proof['actual']['errors'] == []
    assert proof['actual']['results'] == proof['expected']
masters = read(HERE / 'controle-fraicheur-maitres.json')['actual']
assert masters['linksCompared'] == 881 and masters['changedLinks'] == []

print(json.dumps({'status': 'PLANNING_COHERENCE_ONLY', 'scopeIds': 23,
                  'expectedAssertions': 59, 'statesAndScenarios': 94, 'mappedNodes': len(rows),
                  'applicationConformance': False, 'independentVNextReview': False}))
