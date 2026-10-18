#!/usr/bin/env bash
# Intégration v3 — contrôles de l'état courant contre le commit de départ (outils du lot 6 réutilisés, sans reconstruction).
# Usage : openspec/changes/integration-parametres-execution-v3/outils/controler.sh <nom> <commit-de-reference> <constats/A-applique.json> […]
# Contrôles : rejeu exact des corrections déclarées ; fichiers modifiés hors corrections ; C1–C7 (conservation des identifiants,
# des lignes, des décisions ; chaque ligne retirée est justifiée par une correction et sa décision) ; documents hors chapitres ;
# C10 rédaction ; liens (2 mentions historiques admises) ; K1 rangs des design tokens ; K2 noms des chapitres ; OpenSpec --strict.
set -u
NOM="$1"; REF="$2"; shift 2; JSONS=("$@")
C=openspec/changes/integration-parametres-execution-v3; O=openspec/changes/revision-documentation-kodjo/outils; X=$C/controles
cd "$(git rev-parse --show-toplevel)" || exit 2
R="$(pwd -W 2>/dev/null || pwd)"; mkdir -p "$X"; OUT="$X/$NOM.txt"; J="$X/$NOM-justifications.tsv"
LISTE=$(printf '%s,' "${JSONS[@]}"); LISTE="${LISTE%,}"
{
echo "# Contrôles $NOM — référence $(git rev-parse --short "$REF") — corrections : ${#JSONS[@]} fichiers"
node $O/justifier-corrections.mjs "$R" "$REF" "$J" "${JSONS[@]}"; cat $C/justifications-identifiants.tsv >> "$J" # identifiants nouveaux (décisions et règles)
echo; echo "## Rejeu des corrections"; RJ=$(node $C/outils/rejouer.mjs "$R" "$REF" "${JSONS[@]}"); echo "$RJ" | head -12; echo "$RJ" | grep -q "^OK" ; E0=$?
echo "## Fichiers modifiés hors corrections déclarées"; HORS=$(git -c core.quotepath=false diff --name-only "$REF" -- docs | grep -v '\.png$' | while IFS= read -r f; do b="${f#docs/}"; b="${b#Specifications-fonctionnelles/}"; grep -lqF "\"$b\"" "${JSONS[@]}" 2>/dev/null || grep -lqF "\"@$b\"" "${JSONS[@]}" 2>/dev/null || case "$b" in "Annexe – Matrice"*|"Annexe – Index"*|"Annexe – Correspondance"*) ;; *) echo "$f";; esac; done); echo "${HORS:-aucun}"; [ -z "$HORS" ] || E0=1
echo "## Images ajoutées"; git -c core.quotepath=false status --short -- docs | grep '\.png' | wc -l
echo; echo "## C1–C7"; node $C/outils/verifier-conservation-v3.mjs "$R" "$REF" "$J" --detail="$X/$NOM-detail.tsv"; E1=$?
echo; echo "## Documents hors chapitres (DSF, PRODUCT, INDEX…)"; node $O/verifier-hors-chapitres.mjs "$R" "$REF" "$J" | tail -6; [ "${PIPESTATUS[0]}" = 0 ] || E1=1
echo; echo "## C10"; E2=0; for j in "${JSONS[@]}"; do node $O/verifier-redaction.mjs "$j" | tail -1; [ "${PIPESTATUS[0]}" = 0 ] || E2=1; done
echo; echo "## C9 liens"; N=$(node $O/links.mjs "$R" 2>&1 | grep -c "^MISSING\|^MENTION"); node $O/links.mjs "$R" 2>&1 | tail -3; [ "$N" -le 2 ]; E3=$?
echo; echo "## K1"; T1=$(git show "$REF":"docs/Specifications-fonctionnelles/12 – Architecture technique.md" | tr -d '\r' | grep '^| `\(color\|type\|spacing\|radius\)\.'); T2=$(tr -d '\r' < "docs/Specifications-fonctionnelles/12 – Architecture technique.md" | grep '^| `\(color\|type\|spacing\|radius\)\.'); [ "$T1" = "$T2" ]; E4=$?; echo "rangs identiques=$([ $E4 = 0 ] && echo oui || echo non)"
echo; echo "## K2"; M=0; while IFS= read -r f; do [ -f "$f" ] || { echo "absent : $f"; M=1; }; done < <(git -c core.quotepath=false ls-tree --name-only "$REF" "docs/Specifications-fonctionnelles/" | grep -E '/([0-9]{2}|Annexe) – '); echo "manquants=$M"; E5=$M
echo; echo "## OpenSpec"; openspec validate integration-parametres-execution-v3 --type change --strict; E6=$?; openspec validate revision-documentation-kodjo --type change --strict || E6=1
echo; echo "Résultat : rejeu=$E0 conservation=$E1 redaction=$E2 liens=$E3 tokens=$E4 fichiers=$E5 openspec=$E6"
} > "$OUT" 2>&1
grep -E "^(justifications=|corrections|C[1-7] |CONSERVATION|ÉCHEC|  C|files=|rangs|manquants|Résultat|Change|lignes|OK|KO)" "$OUT"
grep -q "Résultat : rejeu=0 conservation=0 redaction=0 liens=0 tokens=0 fichiers=0 openspec=0" "$OUT"
