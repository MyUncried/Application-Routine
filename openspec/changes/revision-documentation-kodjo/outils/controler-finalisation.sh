#!/usr/bin/env bash
# Lot 6 (finalisation) — contrôles d'un lot de corrections JSON appliquées sur l'état actuel (sans reconstruction depuis une base).
# Usage : outils/controler-finalisation.sh <nom> <commit-de-reference> <constats/A.json> [<constats/B.json> …]
# Contrôles :
#   rejeu   verifier-corrections-json : le disque = référence + corrections déclarées, rien d'autre ;
#   C1–C7   verifier-conservation contre la référence, avec les justifications tirées des corrections ;
#   C10     verifier-redaction sur les corrections de motif REDACTION ;
#   C9      liens (2 anomalies historiques admises) ; K1 rangs des design tokens ; K2 noms des chapitres ; OpenSpec --strict.
# Résultats : lot6/finalisation/controles/<nom>.txt. Code de sortie non nul si un contrôle échoue.
set -u
NOM="$1"; REF="$2"; shift 2; JSONS=("$@")
C=openspec/changes/revision-documentation-kodjo; O=$C/outils; X=$C/lot6/finalisation/controles
cd "$(git rev-parse --show-toplevel)" || exit 2
R="$(pwd -W 2>/dev/null || pwd)"; mkdir -p "$X"; OUT="$X/$NOM.txt"; J="$X/$NOM-justifications.tsv"
LISTE=$(printf '%s,' "${JSONS[@]##*/}"); LISTE="${LISTE%,}"
{
echo "# Contrôles $NOM — référence $(git rev-parse --short "$REF") — corrections : $LISTE"
node $O/justifier-corrections.mjs "$R" "$REF" "$J" "${JSONS[@]}"
echo; echo "## Rejeu des corrections"; RJ=$(node $O/verifier-corrections-json.mjs "$R" "$REF" "$LISTE"); echo "$RJ" | head -12; echo "$RJ" | grep -q "^OK" ; E0=$?
echo "## Fichiers modifiés hors corrections déclarées"; HORS=$(git -c core.quotepath=false diff --name-only "$REF" -- docs | while IFS= read -r f; do b="${f#docs/}"; b="${b#Specifications-fonctionnelles/}"; grep -lqF "\"$b\"" "${JSONS[@]}" 2>/dev/null || grep -lqF "\"@$b\"" "${JSONS[@]}" 2>/dev/null || echo "$f"; done); echo "${HORS:-aucun}"; [ -z "$HORS" ] || E0=1
echo; echo "## C1–C7"; node $O/verifier-conservation.mjs "$R" "$REF" "$J" --detail="$X/$NOM-detail.tsv"; E1=$?
echo; echo "## C10"; E2=0; for j in "${JSONS[@]}"; do node $O/verifier-redaction.mjs "$j" | tail -1; [ "${PIPESTATUS[0]}" = 0 ] || E2=1; done
echo; echo "## C9 liens"; N=$(node $O/links.mjs "$R" 2>&1 | grep -c "^MISSING\|^MENTION"); node $O/links.mjs "$R" 2>&1 | tail -3; [ "$N" -le 2 ]; E3=$?
echo; echo "## K1"; T1=$(git show "$REF":"docs/Specifications-fonctionnelles/12 – Architecture technique.md" | tr -d '\r' | grep '^| `\(color\|type\|spacing\|radius\)\.'); T2=$(tr -d '\r' < "docs/Specifications-fonctionnelles/12 – Architecture technique.md" | grep '^| `\(color\|type\|spacing\|radius\)\.'); [ "$T1" = "$T2" ]; E4=$?; echo "rangs identiques=$([ $E4 = 0 ] && echo oui || echo non)"
echo; echo "## K2"; M=0; while IFS= read -r f; do [ -f "$f" ] || { echo "absent : $f"; M=1; }; done < <(git -c core.quotepath=false ls-tree --name-only "$REF" "docs/Specifications-fonctionnelles/" | grep -E '/([0-9]{2}|Annexe) – '); echo "manquants=$M"; E5=$M
echo; echo "## OpenSpec"; openspec validate revision-documentation-kodjo --type change --strict; E6=$?
echo; echo "## Périmètre"; git -c core.quotepath=false status --short | grep -v '\.zip$' | sed 's#/[^/]*$##' | sort | uniq -c
echo; echo "Résultat : rejeu=$E0 conservation=$E1 redaction=$E2 liens=$E3 tokens=$E4 fichiers=$E5 openspec=$E6"
} > "$OUT" 2>&1
grep -E "^(justifications=|corrections|C[1-7] |CONSERVATION|ÉCHEC|  C|files=|rangs|manquants|Résultat|Change|écarts|lignes)" "$OUT"
grep -q "Résultat : rejeu=0 conservation=0 redaction=0 liens=0 tokens=0 fichiers=0 openspec=0" "$OUT"
