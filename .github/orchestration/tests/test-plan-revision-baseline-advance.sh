#!/usr/bin/env bash
set -euo pipefail

script=".github/orchestration/scripts/validate-plan-revision-baseline.sh"
workflow=".github/workflows/kodjo-slice-plan.yml"
reported_old="07feb4650d5b0ab2e46e82e6e2cf544772916bd0"
reported_new="37beff624e3ea20c0bbb3f1bd9ba4483966d9792"

fail() { printf 'FAIL: %s\n' "$1" >&2; exit 1; }
pass() { printf 'PASS: %s\n' "$1"; }
reject() { if "$@" >/dev/null 2>&1; then fail "unexpected acceptance: $*"; fi; }

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
git -C "$tmp" init -q
git -C "$tmp" config user.name test
git -C "$tmp" config user.email test@example.invalid
git -C "$tmp" commit --allow-empty -qm base
old=$(git -C "$tmp" rev-parse HEAD)
git -C "$tmp" commit --allow-empty -qm docs-1
git -C "$tmp" commit --allow-empty -qm docs-2
new=$(git -C "$tmp" rev-parse HEAD)
git -C "$tmp" checkout -qb divergent "$old"
git -C "$tmp" commit --allow-empty -qm divergent
divergent=$(git -C "$tmp" rev-parse HEAD)
git -C "$tmp" checkout -q master

(
  cd "$tmp"
  bash "$OLDPWD/$script" PLAN_REVISION "$old" "$new" >/dev/null
)
pass "PLAN_REVISION accepts ancestor baseline advancement"

(
  cd "$tmp"
  bash "$OLDPWD/$script" PLAN_REVISION "$old" "$old" >/dev/null
)
pass "PLAN_REVISION keeps unchanged-baseline compatibility"

(
  cd "$tmp"
  reject bash "$OLDPWD/$script" PLAN_REVISION "$new" "$old"
  reject bash "$OLDPWD/$script" PLAN_REVISION "$divergent" "$new"
  reject bash "$OLDPWD/$script" REPLAN_AFTER_IMPLEMENTATION "$old" "$new"
  reject bash "$OLDPWD/$script" PLAN_REVISION bad "$new"
)
pass "invalid ancestry, wrong mode and malformed SHA rejected"

[[ "$reported_old" =~ ^[0-9a-f]{40}$ ]] || fail "reported old source fixture"
[[ "$reported_new" =~ ^[0-9a-f]{40}$ ]] || fail "reported new source fixture"
[ "$reported_old" != "$reported_new" ] || fail "reported advancement fixture"
pass "reported T02-S02 advancement fixture"

grep -Fq 'validate-plan-revision-baseline.sh "$PLAN_MODE" "$old_plan_source" "$baseline_head"' "$workflow" ||
  fail "workflow does not call baseline validator"
grep -Fq 'review_comment_id=' "$workflow" || fail "review causal reference not parsed"
grep -Fq 'source_plan_comment_id=$SUPERSEDES_PLAN_ID' "$workflow" ||
  fail "review is not bound to superseded plan"
grep -Fq 'source_head=$old_plan_source' "$workflow" ||
  fail "review is not bound to old source"
grep -Fq 'exact current baseline' "$workflow" ||
  fail "prompt does not require full rebuild from current baseline"
pass "workflow causal and rebuild guards"

printf 'All plan revision baseline advancement tests passed.\n'
