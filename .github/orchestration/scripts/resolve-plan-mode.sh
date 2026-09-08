#!/usr/bin/env bash
set -euo pipefail

requested_mode=${1:-}
supersedes_plan_id=${2:-}
scope_correction_id=${3:-}
implementation_count=${4:-}

fail() {
  printf 'plan-mode error: %s\n' "$1" >&2
  exit 1
}

case "$requested_mode" in
  INITIAL)
    [ -z "$supersedes_plan_id" ] || fail 'INITIAL forbids supersedes_plan_comment_id'
    [ -z "$scope_correction_id" ] || fail 'INITIAL forbids scope_correction_comment_id'
    [ "$implementation_count" = 0 ] || fail 'INITIAL requires zero implementation outputs'
    ;;
  PLAN_REVISION)
    [[ "$supersedes_plan_id" =~ ^[0-9]+$ ]] || fail 'PLAN_REVISION requires a numeric supersedes_plan_comment_id'
    [[ "$scope_correction_id" =~ ^[0-9]+$ ]] || fail 'PLAN_REVISION requires a numeric scope_correction_comment_id'
    [ "$implementation_count" = 0 ] || fail 'PLAN_REVISION requires zero implementation outputs'
    ;;
  REPLAN_AFTER_IMPLEMENTATION)
    [[ "$supersedes_plan_id" =~ ^[0-9]+$ ]] || fail 'REPLAN_AFTER_IMPLEMENTATION requires a numeric supersedes_plan_comment_id'
    [[ "$scope_correction_id" =~ ^[0-9]+$ ]] || fail 'REPLAN_AFTER_IMPLEMENTATION requires a numeric scope_correction_comment_id'
    [ "$implementation_count" = 1 ] || fail 'REPLAN_AFTER_IMPLEMENTATION requires exactly one implementation output'
    ;;
  *) fail 'plan_mode must be exactly INITIAL, PLAN_REVISION, or REPLAN_AFTER_IMPLEMENTATION' ;;
esac

printf '%s\n' "$requested_mode"
