#!/usr/bin/env bash
set -euo pipefail

register='.github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER.md'
test -s "$register"

mapfile -t ids < <(sed -n 's/^| \(INC-[0-9][0-9][0-9]\) |.*$/\1/p' "$register")
[ "${#ids[@]}" -ge 49 ] || { echo "incident register unexpectedly incomplete: ${#ids[@]}" >&2; exit 1; }
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
grep -Fq '| INC-049 |' "$register"
grep -Fq '## Répétitions qui auraient dû être évitées' "$register"
grep -Fq '## État GitHub vérifié au 2026-09-07' "$register"
grep -Fq 'NON VÉRIFIABLE' "$register"
echo "incident register v2 validation: PASS (${#ids[@]} incidents)"
