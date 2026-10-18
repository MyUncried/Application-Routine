#!/usr/bin/env bash
# Lot 6 — exécution d'une étape de restructuration et contrôles (plan §7, C1 à C12).
# Usage : outils/executer-etape.sh <nom-etape> <etapes-cumulees> [justifier]
#   ex. : outils/executer-etape.sh 6D 6C,6D
# Écrit les chapitres d'après la table (restructurer.mjs, base BASE), rejoue les contrôles contre la base et contre HEAD, et
# consigne les résultats dans lot6/execution/<nom-etape>.txt. Code de sortie non nul si un contrôle bloquant échoue.
# Aucun commit n'est fait ici.
set -u
NOM="$1"; ETAPES="$2"; JUST="${3:-}"
BASE=cefc9b99851a847a8c404a024dc2ad79e6768171
C=openspec/changes/revision-documentation-kodjo; O=$C/outils; L=$C/lot6; X=$L/execution
cd "$(git rev-parse --show-toplevel)" || exit 2
R="$(pwd -W 2>/dev/null || pwd)"; mkdir -p "$X"; OUT="$X/$NOM.txt"
JARG=(); [ -n "$JUST" ] && JARG=("--justifications=$L/justifications-archive.tsv")
{
echo "# Étape $NOM — étapes cumulées : $ETAPES"; echo "Base : $BASE ; HEAD avant l'étape : $(git rev-parse HEAD)"; echo
node $O/restructurer.mjs "$R" $BASE $L --etapes="$ETAPES" --rapport="$X/$NOM-evenements.tsv" --correspondance="$L/correspondance-actualisee.tsv" --corrections6k="$L/corrections-6K.json" "${JARG[@]}"
E8=0; case ",$ETAPES," in *",6K,"*) echo; echo "## C10 corrections rédactionnelles"; node $O/verifier-redaction.mjs "$L/corrections-6K.json" | tail -3; E8=${PIPESTATUS[0]};; esac
JF=(); [ -f "$L/justifications-archive.tsv" ] && [ -n "$JUST" ] && JF=("$L/justifications-archive.tsv")
echo; echo "## C1–C7 contre la base"; node $O/verifier-conservation.mjs "$R" $BASE "${JF[@]}" --detail="$X/$NOM-detail-base.tsv"; E1=$?
echo; echo "## C1–C7 contre HEAD"; node $O/verifier-conservation.mjs "$R" HEAD "${JF[@]}"; E2=$?
ETC="—"; for e in 6C 6D 6E 6F1 6F2 6F3 6F4 6F5; do case ",$ETAPES," in *",$e,"*) ETC="$ETC,$e";; esac; done
echo; echo "## C8 place des sections"; node $O/verifier-correspondance.mjs "$R" $BASE "$L/correspondance-actualisee.tsv" --etapes="$ETC"; E3=$?
echo; echo "## C9 liens"; node $O/links.mjs "$R" 2>&1 | tail -3; N=$(node $O/links.mjs "$R" 2>&1 | grep -c "^MISSING\|^MENTION"); [ "$N" -le 2 ]; E4=$?
echo; echo "## K1 design tokens (ch. 12)"; T1=$(git show $BASE:"docs/Specifications-fonctionnelles/12 – Architecture technique.md" | grep -c '^| `\(color\|type\|spacing\|radius\)\.'); T2=$(grep -c '^| `\(color\|type\|spacing\|radius\)\.' "docs/Specifications-fonctionnelles/12 – Architecture technique.md"); echo "rangs base=$T1 actuels=$T2"; [ "$T1" = "$T2" ]; E5=$?
echo; echo "## K2 fichiers des chapitres"; M=0; for f in $(git ls-tree --name-only $BASE "docs/Specifications-fonctionnelles/" | grep -E '/[0-9]{2} – ' | tr ' ' '#'); do f="${f//#/ }"; [ -f "$f" ] || { echo "absent : $f"; M=1; }; done; echo "manquants=$M"; E6=$M
echo; echo "## C12 OpenSpec"; openspec validate revision-documentation-kodjo --type change --strict; E7=$?
echo; echo "## Périmètre du diff"; git status --short | grep -v '\.zip$' | awk '{print $2}' | sed 's#/[^/]*$##' | sort | uniq -c
echo; echo "Résultat : base=$E1 head=$E2 place=$E3 liens=$E4 tokens=$E5 fichiers=$E6 openspec=$E7 redaction=$E8"
} > "$OUT" 2>&1
cat "$OUT" | grep -E "^(étapes=|référence=|C[1-7] |CONSERVATION|ÉCHEC|  C|files=|rangs|manquants|Résultat|Change)"
grep -q "Résultat : base=0 head=0 place=0 liens=0 tokens=0 fichiers=0 openspec=0 redaction=0" "$OUT"
