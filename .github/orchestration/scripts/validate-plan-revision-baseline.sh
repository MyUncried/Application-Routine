#!/usr/bin/env bash
set -euo pipefail

mode=${1:-}
old_source=${2:-}
new_source=${3:-}

sha_re='^[0-9a-f]{40}$'
[[ "$old_source" =~ $sha_re ]] || { echo 'old source format' >&2; exit 1; }
[[ "$new_source" =~ $sha_re ]] || { echo 'new source format' >&2; exit 1; }

git cat-file -e "$old_source^{commit}" 2>/dev/null || { echo 'old source commit missing' >&2; exit 1; }
git cat-file -e "$new_source^{commit}" 2>/dev/null || { echo 'new source commit missing' >&2; exit 1; }

case "$mode" in
  PLAN_REVISION)
    git merge-base --is-ancestor "$old_source" "$new_source" ||
      { echo 'old plan source is not an ancestor of new baseline' >&2; exit 1; }
    ;;
  REPLAN_AFTER_IMPLEMENTATION)
    [ "$old_source" = "$new_source" ] ||
      { echo 'post-implementation replan source differs from baseline' >&2; exit 1; }
    ;;
  *)
    echo 'unsupported revision mode' >&2
    exit 1
    ;;
esac

printf 'old_plan_source=%s\nnew_plan_source=%s\n' "$old_source" "$new_source"
