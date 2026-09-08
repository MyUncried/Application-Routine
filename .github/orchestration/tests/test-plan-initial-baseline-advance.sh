#!/usr/bin/env bash
set -euo pipefail

manifest=".github/orchestration/slices/T03-S01.yml"
workflow=".github/workflows/kodjo-slice-plan.yml"
resolver=".github/orchestration/scripts/resolve-plan-mode.sh"
previous="90706d2481bddb18200cd113a915e5c0a2eca1dc"
baseline="917c53d91c4564d9b5047d6a301a5f4067883806"
scope_id="5584115298"

fail() { printf 'FAIL: %s\n' "$1" >&2; exit 1; }
pass() { printf 'PASS: %s\n' "$1"; }

if command -v ruby >/dev/null 2>&1; then
  ruby -e '
    require "yaml"
    m=YAML.safe_load(File.read(ARGV[0]), aliases:false)
    abort "previous_head" unless m.dig("previous_slice","final_head")==ARGV[1]
    abort "baseline_head" unless m["baseline_head"]==ARGV[2]
    abort "application_baseline_head" unless m["application_baseline_head"]==ARGV[1]
    abort "scope_comment" unless m.dig("initial_scope_authority","comment_id").to_s==ARGV[3]
    abort "scope_head" unless m.dig("initial_scope_authority","source_head")==ARGV[2]
    abort "scope_priority" unless m.dig("initial_scope_authority","replaces_legacy_manifest_scope")==true
  ' "$manifest" "$previous" "$baseline" "$scope_id" || fail "T03 baseline tuple"
else
  python - "$manifest" "$previous" "$baseline" "$scope_id" <<'PY' || fail "T03 baseline tuple"
import sys, yaml
m = yaml.safe_load(open(sys.argv[1], encoding="utf-8"))
assert m["previous_slice"]["final_head"] == sys.argv[2], "previous.Room"
assert m["baseline_head"] == sys.argv[3], "baseline"
assert m["application_baseline_head"] == sys.argv[2], " Fox"
assert str(m["initial_scope_authority"]["comment_id"]) == sys.argv[4], "scope"
assert m["initial_scope_authority"]["source_head"] == sys.argv[3], "scope_head"
assert m["initial_scope_authority"]["replaces_legacy_manifest_scope"] is True, "scope_priority"
PY
fi
pass "T03 baseline tuple"

actual_mode=$(bash "$resolver" INITIAL "" "" 0)
[ "$actual_mode" = INITIAL ] || fail "INITIAL mode without causal references"
pass "INITIAL mode without causal references"

for path in   ".github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.3.md"   ".github/orchestration/KODJO_PROTOCOL_V2_IMPLEMENTATION_WORKFLOW_REFERENCE_0.6.3.yml"   ".github/orchestration/KODJO_PROTOCOL_V2_T02_CHANGE_REPORT_0.6.3.md"   ".github/orchestration/KODJO_PROTOCOL_V2_T02_TEST_MATRIX_0.6.3.md"
do
  grep -Fqx "                $path) ;;" "$workflow" || fail "missing exact initial delta allowlist entry: $path"
done
pass "four exact V2 documentary paths allowed"

if grep -Fq '.github/orchestration/KODJO_PROTOCOL_V2_*)' "$workflow"; then
  fail "broad V2 wildcard authorization"
fi
pass "no broad V2 wildcard authorization"

for forbidden in   ".github/workflows/anything.yml"   "src/features/execution/ExecutionScreen.tsx"   ".github/orchestration/KODJO_PROTOCOL_V2_UNLISTED.md"
do
  if grep -Fqx "                $forbidden) ;;" "$workflow"; then
    fail "forbidden initial delta authorized: $forbidden"
  fi
done
pass "workflow and application paths remain forbidden"

grep -Fq 'test -z "$SUPERSEDES_PLAN_ID"' "$workflow" || fail "INITIAL supersedes guard missing"
grep -Fq 'test -z "$SCOPE_CORRECTION_ID"' "$workflow" || fail "INITIAL legacy scope-reference guard missing"
grep -Fq "supersedes_plan_comment_id=NONE" "$workflow" || fail "initial scope authority contract missing"
pass "INITIAL has no superseded plan"

grep -Fq 'Do not reuse PLAN_OUTPUT 5581406837 or PLAN_REVIEW_OUTPUT 5581583527' "$workflow" || fail "old plan/review exclusion missing"
if grep -Eq 'SUPERSEDES_PLAN_ID[:=].*5581406837|REVIEW_SESSION[:=].*3cc0b0f3' "$workflow"; then
  fail "old plan or review wired as a causal input"
fi
pass "old plan and review are not reused"

printf 'PASS: T03 initial baseline advancement scenario\n'
