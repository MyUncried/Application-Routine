#!/usr/bin/env python3
"""Independent YAML syntax check. Structural protocol checks remain in Node."""
from pathlib import Path
import sys
import yaml
root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]
errors = []
files = sorted((root / '.github/workflows').glob('*.yml'))
for file in files:
    try:
        yaml.safe_load(file.read_text(encoding='utf-8'))
    except yaml.YAMLError as error:
        errors.append(f'{file}: {error}')
if errors:
    print('\n'.join(errors), file=sys.stderr)
    sys.exit(1)
print(f'Independent YAML syntax: {len(files)} workflows accepted')
