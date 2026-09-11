#!/usr/bin/env bash
set -euo pipefail

register='.github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER_v3.4.0_CORRECTED.md'
test -s "$register"

mapfile -t ids < <(sed -n 's/^| \(INC-[0-9][0-9][0-9]\) |.*$/\1/p' "$register")
[ "${#ids[@]}" -eq 93 ] || { echo "incident register unexpectedly incomplete: ${#ids[@]}" >&2; exit 1; }
[ "$(printf '%s\n' "${ids[@]}" | sort -u | wc -l)" -eq "${#ids[@]}" ] || { echo 'duplicate incident id' >&2; exit 1; }

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
grep -Fq '| INC-075 |' "$register"
grep -Fq '| INC-076 |' "$register"
grep -Fq '| INC-077 |' "$register"
grep -Fq '| INC-078 |' "$register"
[ "$(grep -Ec '^\| XLS03-INC-[0-9]{3} \|' "$register")" -eq 51 ] || { echo 'invalid XLS03 alias count' >&2; exit 1; }
[ "$(grep -Ec '^\| T-[0-9]{3} \|' "$register")" -eq 66 ] || { echo 'invalid protocol test count' >&2; exit 1; }
[ "$(grep -Ec '^\| INV-[0-9]{3} \|' "$register")" -eq 24 ] || { echo 'invalid invariant count' >&2; exit 1; }
grep -Fq '## Couverture du protocole générique actuel' "$register"
for n in $(seq -f "%03g" 1 93); do grep -Fq "INC-$n" <<<"${ids[*]}" || { echo "missing sequential incident INC-$n" >&2; exit 1; }; done
for n in $(seq -f "%03g" 1 66); do grep -Fq "| T-$n |" "$register" || { echo "missing sequential test T-$n" >&2; exit 1; }; done
grep -Fq '## Répétitions qui auraient dû être évitées' "$register"
grep -Fq '## État GitHub vérifié au 2026-09-07' "$register"
grep -Fq 'NON VÉRIFIABLE' "$register"
echo "incident register v3.10 validation: PASS (${#ids[@]} incidents, 51 aliases, 66 tests, 24 invariants)"
