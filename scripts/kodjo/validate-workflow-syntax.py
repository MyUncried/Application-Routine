#!/usr/bin/env python3
"""Independent YAML syntax check. Structural protocol checks remain in Node."""
from pathlib import Path
import sys
import yaml
root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]
errors = []
workflows = {}
files = sorted([*(root / '.github/workflows').glob('*.yml'), *(root / '.github/workflows').glob('*.yaml')])
for file in files:
    try:
        workflows[file.resolve()] = yaml.safe_load(file.read_text(encoding='utf-8')) or {}
    except yaml.YAMLError as error:
        errors.append(f'{file}: {error}')
# GitHub validates nested job permissions even if their if-condition is false.
# Check local reusable calls with explicitly declared caller capabilities.
def levels(value):
    if value is None:
        return None
    if isinstance(value, str):
        return {'*': 2 if value == 'write-all' else 1 if value == 'read-all' else 0}
    return {key: {'none': 0, 'read': 1, 'write': 2}.get(level, 0) for key, level in value.items()}

for file, workflow in workflows.items():
    for name, job in workflow.get('jobs', {}).items():
        uses = job.get('uses', '')
        if not uses.startswith('./.github/workflows/'):
            continue
        called = (root / uses[2:]).resolve()
        if called not in workflows:
            errors.append(f'{file}: reusable workflow not found: {uses}')
            continue
        granted = levels(job.get('permissions', workflow.get('permissions')))
        if granted is None:
            continue  # Repository default is unknown; do not invent permissions.
        callee = workflows[called]
        for nested_name, nested in callee.get('jobs', {}).items():
            requested = levels(nested.get('permissions', callee.get('permissions')))
            if requested is None:
                continue
            for key, level in requested.items():
                allowed = granted.get(key, granted.get('*', 0))
                if level > allowed:
                    errors.append(f'{file}: VNEXT_REUSABLE_PERMISSION_ESCALATION: {name} -> {uses} / {nested_name}: {key}')

if errors:
    print('\n'.join(errors), file=sys.stderr)
    sys.exit(1)
print(f'Independent YAML syntax: {len(files)} workflows accepted')
