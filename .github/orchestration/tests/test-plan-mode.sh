#!/usr/bin/env bash
set -euo pipefail

resolver=${1:-.github/orchestration/scripts/resolve-plan-mode.sh}
failures=0

pass_case() {
  local label=$1 expected=$2
  shift 2
  local actual
  if ! actual=$(bash "$resolver" "$@" 2>/dev/null); then
    printf 'FAIL expected pass: %s\n' "$label" >&2
    failures=$((failures + 1))
  elif [ "$actual" != "$expected" ]; then
    printf 'FAIL wrong mode: %s (%s)\n' "$label" "$actual" >&2
    failures=$((failures + 1))
  else
    printf 'PASS %s\n' "$label"
  fi
}

fail_case() {
  local label=$1
  shift
  if bash "$resolver" "$@" >/dev/null 2>&1; then
    printf 'FAIL expected rejection: %s\n' "$label" >&2
    failures=$((failures + 1))
  else
    printf 'PASS %s\n' "$label"
  fi
}

pass_case 'initial without causal references' INITIAL INITIAL '' '' 0
pass_case 'plan revision before implementation' PLAN_REVISION PLAN_REVISION 100 200 0
pass_case 'replan after implementation' REPLAN_AFTER_IMPLEMENTATION REPLAN_AFTER_IMPLEMENTATION 100 200 1
fail_case 'ambiguous omitted mode' '' 100 200 0
fail_case 'plan revision with implementation' PLAN_REVISION 100 200 1
fail_case 'post-implementation replan without implementation' REPLAN_AFTER_IMPLEMENTATION 100 200 0
fail_case 'initial with causal references' INITIAL 100 200 0
fail_case 'missing superseded plan' PLAN_REVISION '' 200 0
fail_case 'missing scope correction' PLAN_REVISION 100 '' 0
fail_case 'duplicate implementation outputs' REPLAN_AFTER_IMPLEMENTATION 100 200 2
fail_case 'unknown prefix-like mode' PLAN_REVISION_EXTRA 100 200 0

[ "$failures" -eq 0 ] || exit 1
printf 'All plan mode tests passed.\n'
