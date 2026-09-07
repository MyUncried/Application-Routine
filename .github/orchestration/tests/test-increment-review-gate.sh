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
source_head=ed223ca1ca8570fbebb335495472af0ba4b078eb
source_plan_comment_id=5562076836
source_review_comment_id=5562116730
increment=LOT_2_OF_3'

legacy_output='[KODJO_SLICE] IMPLEMENTATION_OUTPUT
slice_id=T01-S10
base_head=ed223ca1ca8570fbebb335495472af0ba4b078eb
head=b21fb817a3f7448f8ec9c5e6cd5f8bd1ad0382ac
session_id=49cfaec6-2523-47a9-9910-b1c275873e29
plan_comment_id=5562076836
plan_review_comment_id=5562116730'

future_output="$legacy_output
increment=LOT_2_OF_3
source_implementation_trigger_comment_id=5568944376"

expect_pass "$future_output" "$base_trigger"
expect_pass "$legacy_output" "$base_trigger" 5568944376
expect_pass "${future_output//$'\n'/$'\r\n'}" "${base_trigger//$'\n'/$'\r\n'}"
long_suffix=$(printf 'x%.0s' {1..200000})
expect_pass "$future_output
$long_suffix" "$base_trigger"
expect_fail "$legacy_output" "$base_trigger"
expect_fail "$future_output
increment=LOT_2_OF_3" "$base_trigger"
expect_fail "$future_output
slice_id=T01-S10" "$base_trigger"
expect_fail "${future_output/LOT_2_OF_3/LOT_4_OF_3}" "${base_trigger/LOT_2_OF_3/LOT_4_OF_3}"
expect_fail "$future_output" "${base_trigger/LOT_2_OF_3/LOT_3_OF_3}"
expect_fail "$future_output" "${base_trigger/IMPLEMENTATION_REVISION/IMPLEMENTATION_REVISION_EXTRA}"

validate_manifest_ancestry() {
  local baseline="$1" base="$2" head="$3" baseline_status="$4" implementation_status="$5"
  [[ "$baseline" =~ ^[0-9a-f]{40}$ ]] || return 30
  [[ "$base" =~ ^[0-9a-f]{40}$ ]] || return 31
  [[ "$head" =~ ^[0-9a-f]{40}$ ]] || return 32
  case "$baseline_status" in identical|ahead) ;; *) return 33 ;; esac
  [ "$implementation_status" = ahead ] || return 34
}

expect_ancestry_pass() { validate_manifest_ancestry "$@"; }
expect_ancestry_fail() { if validate_manifest_ancestry "$@"; then echo 'expected ancestry rejection' >&2; return 1; fi; }

manifest_baseline=d59df7c4dea452d0e611940646466845cf3dfe5f
increment_base=ed223ca1ca8570fbebb335495472af0ba4b078eb
increment_head=b21fb817a3f7448f8ec9c5e6cd5f8bd1ad0382ac
expect_ancestry_pass "$manifest_baseline" "$increment_base" "$increment_head" ahead ahead
expect_ancestry_pass "$manifest_baseline" "$manifest_baseline" "$increment_base" identical ahead
expect_ancestry_fail "$manifest_baseline" "$increment_base" "$increment_head" diverged ahead
expect_ancestry_fail "$manifest_baseline" "$increment_base" "$increment_head" behind ahead
expect_ancestry_fail "$manifest_baseline" "$increment_base" "$increment_head" ahead identical
expect_ancestry_fail "$manifest_baseline" "$increment_base" "$increment_head" ahead diverged
expect_ancestry_fail bad-sha "$increment_base" "$increment_head" ahead ahead

require_contains() {
  local label="$1" needle="$2" file="$3"
  grep -Fq -- "$needle" "$file" || { echo "missing invariant [$label] in $file" >&2; return 1; }
}
forbid_contains() {
  local label="$1" needle="$2" file="$3"
  if grep -Fq -- "$needle" "$file"; then echo "forbidden pattern [$label] in $file" >&2; return 1; fi
}

review_workflow=".github/workflows/kodjo-slice-implementation-review.yml"
require_contains review_increment_prompt 'increment $INCREMENT only' "$review_workflow"
require_contains deferred_scope_prompt 'Requirements allocated to later increments are deferred' "$review_workflow"
require_contains no_future_increment_defect 'MUST NOT be reported as a defect' "$review_workflow"
require_contains deterministic_gate_evidence 'has already completed npm test and TypeScript successfully' "$review_workflow"
require_contains implementation_output_context 'cat /tmp/implementation-output.md' "$review_workflow"
require_contains baseline_api_ancestry 'compare/$baseline...$base' "$review_workflow"
require_contains implementation_api_ancestry 'compare/$base...$head' "$review_workflow"
require_contains baseline_statuses 'case "$baseline_status" in identical|ahead)' "$review_workflow"
require_contains strict_head_descendant '[ "$implementation_status" = ahead ]' "$review_workflow"
forbid_contains baseline_equality 'm["baseline_head"]==ENV["base"]' "$review_workflow"
forbid_contains unauthenticated_local_ancestry 'git merge-base --is-ancestor "$base" "$head"' "$review_workflow"

implementation_workflow='.github/workflows/kodjo-slice-implementation.yml'
forbid_contains incompatible_issue_comment 'gh issue comment' "$implementation_workflow"
forbid_contains incompatible_json_flag '--json id' "$implementation_workflow"
require_contains canonical_comment_api 'gh api --method POST' "$implementation_workflow"

recovery_workflow='.github/workflows/kodjo-slice-implementation-publication-recovery.yml'
require_contains exact_recovery_marker 'RECOVER_IMPLEMENTATION_PUBLICATION{0}' "$recovery_workflow"
require_contains no_repeated_ai 'No implementation or AI call was repeated' "$recovery_workflow"
require_contains recovery_jest 'npm test -- --runInBand' "$recovery_workflow"
require_contains recovery_typescript 'npx tsc --noEmit' "$recovery_workflow"
require_contains dispatch_contents_write '  contents: write' "$recovery_workflow"
require_contains recovery_issues_write '  issues: write' "$recovery_workflow"
require_contains paginated_recovery_search 'gh api --paginate' "$recovery_workflow"
require_contains duplicate_output_guard 'duplicate recovered implementation outputs' "$recovery_workflow"

while IFS= read -r dispatch_workflow; do
  [ -z "$dispatch_workflow" ] || require_contains "repository_dispatch permission" '  contents: write' "$dispatch_workflow"
done < <(grep -Rl '/dispatches' .github/workflows --include='*.yml')
bash .github/orchestration/tests/test-incident-register.sh

echo 'increment review, publication transport, permission and registry self-test: PASS'
