#!/usr/bin/env bash
set -euo pipefail

register='.github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER.md'
test -s "$register"

mapfile -t ids < <(sed -n 's/^| \(INC-[0-9][0-9][0-9]\) |.*$/\1/p' "$register")
[ "${#ids[@]}" -gt 0 ] || { echo 'incident register empty' >&2; exit 1; }
[ "$(printf '%s\n' "${ids[@]}" | sort -u | wc -l)" -eq "${#ids[@]}" ] || { echo 'duplicate incident id' >&2; exit 1; }
expected=1
for id in "${ids[@]}"; do
  number=$((10#${id#INC-}))
  [ "$number" -eq "$expected" ] || { echo "missing sequential incident INC-$(printf '%03d' "$expected")" >&2; exit 1; }
  expected=$((expected + 1))
done

for id in "${ids[@]}"; do
  row=$(sed -n "/^| $id |/p" "$register")
  [ "$(awk -F'|' '{print NF}' <<<"$row")" -eq 18 ] || { echo "malformed row or missing requested field: $id" >&2; exit 1; }
  grep -Eq 'PASS|FAIL|NON RETESTÉ|NON VÉRIFIABLE' <<<"$row" || { echo "controlled result missing: $id" >&2; exit 1; }
  grep -Eq 'OUVERT|CORRIGÉ|SUPERSÉDÉ' <<<"$row" || { echo "incident status missing: $id" >&2; exit 1; }
done

for section in '## Règles de preuve' '## Registre' '## Répétitions qui auraient dû être évitées' '## Tests et preuves encore à construire' '## État GitHub vérifié au 2026-09-07' '## Historique'; do
  grep -Fq "$section" "$register" || { echo "missing section: $section" >&2; exit 1; }
done

grep -Fq '| 2.0.0 | 2026-09-07 |' "$register"
grep -Fq '| 2.1.0 | 2026-09-07 |' "$register"
grep -Fq '| 3.0.0 | 2026-09-07 |' "$register"
grep -Fq '| 3.1.0 | 2026-09-07 |' "$register"
grep -Fq '| 3.2.0 | 2026-09-07 |' "$register"
grep -Fq '| 3.3.0 | 2026-09-07 |' "$register"
version=$(sed -n 's/^- Version du registre : \*\*\([0-9][0-9.]*\)\*\*$/\1/p' "$register")
[ -n "$version" ] || { echo 'register version missing' >&2; exit 1; }
grep -Fq "| $version |" "$register" || { echo "history missing current version $version" >&2; exit 1; }
grep -Fq 'run #73 `34648194736`' "$register"
grep -Fq 'artefact `10283681378`' "$register"
grep -Fq '| INC-075 |' "$register"
grep -Fq '| INC-076 |' "$register"
grep -Fq '| INC-077 |' "$register"
grep -Fq '| INC-078 |' "$register"
[ "$(grep -Ec '^\| XLS03-INC-[0-9]{3} \|' "$register")" -eq 51 ] || { echo 'invalid XLS03 alias count' >&2; exit 1; }
mapfile -t test_ids < <(sed -n 's/^| \(T-[0-9][0-9][0-9]\) |.*$/\1/p' "$register")
[ "${#test_ids[@]}" -gt 0 ] || { echo 'protocol test catalogue empty' >&2; exit 1; }
[ "$(printf '%s\n' "${test_ids[@]}" | sort -u | wc -l)" -eq "${#test_ids[@]}" ] || { echo 'duplicate protocol test id' >&2; exit 1; }
expected=1
for id in "${test_ids[@]}"; do
  number=$((10#${id#T-}))
  [ "$number" -eq "$expected" ] || { echo "missing sequential test T-$(printf '%03d' "$expected")" >&2; exit 1; }
  expected=$((expected + 1))
done
[ "$(grep -Ec '^\| INV-[0-9]{3} \|' "$register")" -eq 24 ] || { echo 'invalid invariant count' >&2; exit 1; }
grep -Fq '## Couverture du protocole générique actuel' "$register"
grep -Fq '## Répétitions qui auraient dû être évitées' "$register"
grep -Fq '## État GitHub vérifié au 2026-09-07' "$register"
grep -Fq 'NON VÉRIFIABLE' "$register"
echo "incident register v$version validation: PASS (${#ids[@]} incidents, 51 aliases, ${#test_ids[@]} tests, 24 invariants)"
