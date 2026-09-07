#!/usr/bin/env bash
set -euo pipefail

extract_single() {
  local body="$1" key="$2" pattern="$3"
  local values=()
  mapfile -t values < <(sed -n "s/^${key}=\\(${pattern}\\)$/\\1/p" <<<"$body")
  [ "${#values[@]}" -eq 1 ] || return 1
  printf '%s' "${values[0]}"
}

validate_increment_chain() {
  local output_body="${1//$'\r'/}" trigger_body="${2//$'\r'/}" recovery_id="${3:-}"
  local output_marker="${output_body%%$'\n'*}" trigger_marker="${trigger_body%%$'\n'*}"
  [ "$output_marker" = '[KODJO_SLICE] IMPLEMENTATION_OUTPUT' ] || return 10
  case "$trigger_marker" in
    '[KODJO_SLICE] START_IMPLEMENTATION'|'[KODJO_SLICE] IMPLEMENTATION_REVISION'|'[KODJO_SLICE] VISUAL_CORRECTION') ;;
    *) return 11 ;;
  esac

  local output_increment="" output_trigger_id="" trigger_increment
  output_increment=$(extract_single "$output_body" increment 'LOT_[1-9][0-9]*_OF_[1-9][0-9]*') || true
  output_trigger_id=$(extract_single "$output_body" source_implementation_trigger_comment_id '[0-9][0-9]*') || true
  trigger_increment=$(extract_single "$trigger_body" increment 'LOT_[1-9][0-9]*_OF_[1-9][0-9]*') || return 12

  if [ -n "$output_increment" ] && [ -n "$output_trigger_id" ]; then
    [ -z "$recovery_id" ] || [ "$recovery_id" = "$output_trigger_id" ] || return 13
  elif [ -z "$output_increment" ] && [ -z "$output_trigger_id" ] && [[ "$recovery_id" =~ ^[0-9]+$ ]]; then
    output_increment="$trigger_increment"
    output_trigger_id="$recovery_id"
  else
    return 14
  fi

  [[ "$output_increment" =~ ^LOT_([1-9][0-9]*)_OF_([1-9][0-9]*)$ ]] || return 15
  [ "${BASH_REMATCH[1]}" -le "${BASH_REMATCH[2]}" ] || return 16
  [ "$output_increment" = "$trigger_increment" ] || return 17

  for mapping in 'slice_id:slice_id' 'base_head:source_head' 'plan_comment_id:source_plan_comment_id' 'plan_review_comment_id:source_review_comment_id'; do
    local output_key="${mapping%%:*}" trigger_key="${mapping#*:}" left right
    left=$(extract_single "$output_body" "$output_key" '[^[:space:]][^[:space:]]*') || return 18
    right=$(extract_single "$trigger_body" "$trigger_key" '[^[:space:]][^[:space:]]*') || return 19
    [ "$left" = "$right" ] || return 20
  done
}

expect_pass() { validate_increment_chain "$@"; }
expect_fail() { if validate_increment_chain "$@"; then echo 'expected rejection' >&2; return 1; fi; }

base_trigger='[KODJO_SLICE] IMPLEMENTATION_REVISION
slice_id=T01-S10
source_head=d59df7c4dea452d0e611940646466845cf3dfe5f
source_plan_comment_id=5562076836
source_review_comment_id=5562116730
increment=LOT_2_OF_3'

legacy_output='[KODJO_SLICE] IMPLEMENTATION_OUTPUT
slice_id=T01-S10
base_head=d59df7c4dea452d0e611940646466845cf3dfe5f
head=ed223ca1ca8570fbebb335495472af0ba4b078eb
session_id=49cfaec6-2523-47a9-9910-b1c275873e29
plan_comment_id=5562076836
plan_review_comment_id=5562116730'

future_output="$legacy_output
increment=LOT_2_OF_3
source_implementation_trigger_comment_id=5565880326"

expect_pass "$future_output" "$base_trigger"
expect_pass "$legacy_output" "$base_trigger" 5565880326
expect_pass "${future_output//$'\n'/$'\r\n'}" "${base_trigger//$'\n'/$'\r\n'}"
expect_fail "$legacy_output" "$base_trigger"
expect_fail "$future_output
increment=LOT_2_OF_3" "$base_trigger"
expect_fail "${future_output/LOT_2_OF_3/LOT_4_OF_3}" "${base_trigger/LOT_2_OF_3/LOT_4_OF_3}"
expect_fail "$future_output" "${base_trigger/LOT_2_OF_3/LOT_3_OF_3}"
expect_fail "$future_output" "${base_trigger/IMPLEMENTATION_REVISION/IMPLEMENTATION_REVISION_EXTRA}"

review_workflow=".github/workflows/kodjo-slice-implementation-review.yml"
grep -Fq 'increment $INCREMENT only' "$review_workflow"
grep -Fq 'Requirements allocated to later increments are deferred' "$review_workflow"
grep -Fq 'MUST NOT be reported as a defect' "$review_workflow"
grep -Fq 'has already completed npm test and TypeScript successfully' "$review_workflow"
grep -Fq 'cat /tmp/implementation-output.md' "$review_workflow"

echo 'increment review gate self-test: PASS'
