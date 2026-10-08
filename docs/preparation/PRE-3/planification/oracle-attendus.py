#!/usr/bin/env python3
"""Planning oracle: enumerate timed contributions, independent of application code.

No Excel formulas or source totals are read. This checks expected-data coherence,
not the implementation. Run --write to produce the 276 grammatical fixtures.
"""
import argparse
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
CORPUS = HERE.parents[2] / 'archives/evolutions-v15-2026-10-07/phrases-276.json'


def ledger(parameters, recovery=0):
    mode = parameters['mode']
    pauses = parameters['pauses']
    targets = parameters.get('targets', [None] * len(pauses))
    assert len(targets) == len(pauses) and targets
    count = len(targets)
    side = parameters.get('side', 'UNILATERAL')
    order = 'BY_SIDE' if count == 1 else parameters.get('order', 'BY_SIDE')
    cadence = parameters.get('cadence', 0)
    events = []

    def work(i, current_side):
        seconds = targets[i] if mode == 'DURATION' else (
            targets[i] * cadence if mode == 'REPETITIONS' and cadence > 0 else None)
        events.append({'kind': 'WORK', 'series': i + 1, 'side': current_side, 'seconds': seconds})

    def pause(i, current_side):
        events.append({'kind': 'SERIES_PAUSE', 'series': i + 1,
                       'side': current_side, 'seconds': pauses[i]})

    def change(i):
        events.append({'kind': 'SIDE_PAUSE', 'series': i,
                       'seconds': parameters.get('sidePause', 0)})

    if side == 'UNILATERAL':
        for i in range(count):
            work(i, 'NONE')
            pause(i, 'NONE')
    else:
        sides = ['RIGHT', 'LEFT'] if side == 'RIGHT_LEFT' else ['LEFT', 'RIGHT']
        if order == 'BY_SIDE':
            for index, current_side in enumerate(sides):
                if index:
                    change(None)
                for i in range(count):
                    work(i, current_side)
                    pause(i, current_side)
        else:
            assert order == 'BY_SERIES'
            for i in range(count):
                work(i, sides[0])
                change(i + 1)
                work(i, sides[1])
                pause(i, sides[1])
    if recovery > 0:
        assert events[-1]['kind'] == 'SERIES_PAUSE'
        events[-1] = {'kind': 'RECOVERY', 'seconds': recovery}
    known = sum(e['seconds'] for e in events if e['seconds'] is not None)
    unknown = any(e['seconds'] is None for e in events)
    kind = 'omitted' if unknown else ('estimated' if mode == 'REPETITIONS' else 'exact')
    result = {'kind': kind, 'knownSeconds': known, 'events': events}
    if not unknown:
        result['seconds'] = known
    return result


def duration(seconds):
    minutes, rest = divmod(seconds, 60)
    return f'{minutes} min {rest} s' if minutes and rest else (
        f'{minutes} min' if minutes else f'{rest} s')


def fixtures():
    rows = json.loads(CORPUS.read_text())
    output = []
    for row in rows:
        count = int(row['nombre'])
        mode = {'Durée': 'DURATION', 'Répétitions': 'REPETITIONS',
                'À l’échec': 'TO_FAILURE'}[row['mode']]
        variable = row['series'] == 'Variable'
        if mode == 'TO_FAILURE':
            targets = [None] * count
        elif not variable:
            targets = [90 if mode == 'DURATION' else 12] * count
        elif mode == 'DURATION':
            targets = [30, 45, 60] if count == 3 else [30, 45, 60, 75, 90, 105]
        else:
            targets = [12, 10, 8] if count == 3 else [6, 8, 10, 12, 14, 15]
        assert len(targets) == count
        parameters = {'mode': mode, 'seriesKind': 'VARIABLE' if variable else 'UNIFORM',
                      'targets': targets, 'pauses': [int(row['pause'].split()[0])] * count,
                      'cadence': 0 if row['bip'] == 'Aucun' else int(row['bip'].split()[0]),
                      'side': 'UNILATERAL' if row['cotes'] == 'Aucun' else 'RIGHT_LEFT',
                      'order': 'BY_SERIES' if row['cotes'] == 'Les deux à chaque série' and count > 1 else 'BY_SIDE',
                      'sidePause': int(row['pauseCotes'].split()[0])}
        result = ledger(parameters)
        # The template, not the source's sample amount, determines total display.
        expected = row['phraseGabarit']
        if '{total}' in expected:
            assert result['kind'] != 'omitted'
            expected = expected.replace('{total}', duration(result['seconds']))
        else:
            assert result['kind'] == 'omitted' or (
                mode == 'DURATION' and count == 1 and parameters['side'] == 'UNILATERAL'
                and parameters['pauses'] == [0])
        output.append({'corpusId': row['id'], 'sourceCell': row['cell'],
                       'parameters': parameters, 'expectedIntrinsic': result,
                       'expectedText': expected, 'expectedSegmentsStatus': 'TO_BIND_GRAMMAR_TOKENS',
                       'proofStatus': 'PLANNED_NOT_EXECUTED'})
    assert len(output) == 276
    return {'schema': 'kodjo.pre3.phrase-fixtures.work.v1',
            'purpose': 'Expected fixtures, not application results or a VNext contract',
            'inputPolicy': 'Representative targets explicitly chosen here; N3 matches normative examples. '
                           'N6 lists are test inputs matching the corpus range, not recovered Excel inputs. '
                           'Totals are event-ledger sums independent of Excel and application code.',
            'cases': output}


def verify_normative_cases():
    cases = json.loads((HERE / 'attendus-numeriques.json').read_text())['cases']
    resolved = {}
    for case in cases:
        parameters = dict(case['given'])
        base = parameters.pop('base', None)
        if base:
            parameters = {**resolved[base], **parameters}
        resolved[case['id']] = parameters
        observed = ledger(parameters, parameters.get('recovery', 0))
        for key, expected in case['expected'].items():
            if key == 'phraseTotalPresent':
                actual = not (parameters['mode'] == 'DURATION' and len(parameters['targets']) == 1
                              and parameters.get('side', 'UNILATERAL') == 'UNILATERAL'
                              and parameters['pauses'] == [0])
            elif key == 'knownSessionSeconds':
                actual = observed['knownSeconds']
            elif key == 'effectiveOrder':
                actual = 'BY_SIDE' if len(parameters['pauses']) == 1 else parameters.get('order', 'BY_SIDE')
            else:
                actual = observed[key]
            assert actual == expected, (case['id'], key, actual, expected)
    return len(cases)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    count = verify_normative_cases()
    generated = fixtures()
    target = HERE / 'attendus-phrases-276.json'
    serialized = json.dumps(generated, ensure_ascii=False, indent=2) + '\n'
    if args.write:
        target.write_text(serialized)
    elif target.exists():
        assert target.read_text() == serialized, 'Generated fixtures drifted'
    print(json.dumps({'status': 'EXPECTED_DATA_COHERENCE_ONLY', 'normativeCases': count,
                      'phraseFixtures': len(generated['cases']), 'applicationTested': False}))
