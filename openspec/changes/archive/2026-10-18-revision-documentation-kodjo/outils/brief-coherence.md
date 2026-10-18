# Brief commun — diagnostic documentaire KODJO (lecture seule)

Dépôt : C:\Dev\KODJO-OPENSPEC-DOCS (branche docs/openspec-revision, base main 6656fefc58330955f5ad74d513ce616ea51809b0).
Corpus : docs/Specifications-fonctionnelles/01..13 (chapitres consolidés le 14/10, commit 7a89220f) et docs/*.md (DSF, MATRICE, RAPPORT, REVUE, PRODUCT.md, README.md, INDEX.md). Ignorer docs/archives, docs/preparation, .github.

INTERDITS : ne modifier AUCUN fichier du dépôt ni d'un autre clone. Écrire uniquement votre fichier de sortie dans le scratchpad. Pas de git commit, pas de push.

Règles d'analyse :
- Documentation = comportements et calculs ; Figma = rendu visuel. Une capture ne définit pas un calcul.
- Le document le plus récent ne remplace JAMAIS automatiquement un autre. Un remplacement n'existe que s'il est explicite (décision Dxxx nommant la règle remplacée, mention « remplacé par », « historique », etc.). Citer la mention.
- Qualifier chaque constat : CONTRADICTION_REELLE (deux règles incompatibles sur le même objet et le même périmètre) / COMPLEMENT (une source précise l'autre sans l'invalider) / DIFFERENCE_PERIMETRE (règles différentes car objets, versions ou contextes différents) / DOUBLON (même règle normative écrite à deux endroits, risque de divergence) / REFERENCE_ROMPUE / AMBIGUITE_PERIMETRE.
- Ne signaler une contradiction que si vous avez lu les deux passages en entier dans leur contexte.

Déjà résolus ou en cours — NE PAS signaler comme ouverts (vous pouvez mentionner « arbitré, intégration pendante » si la doc main contredit encore l'arbitrage) :
- PR #371 (ouverte, brouillon) Q11–Q18 paramètres d'exécution : scratchpad/pr/pr371.diff et pr371-body.md
- PR #370 (ouverte) phases d'exercice : scratchpad/pr/pr370.diff
- PR #363 (ouverte) 44 captures Figma : scratchpad/pr/pr363.diff
- Décisions de Hermann Q1–Q23 du 16/10 (préparation PRE-4 BMAD) : scratchpad/pre4-bmad-questions-ouvertes.md
- Liens/ancres cassés : déjà inventoriés mécaniquement (scratchpad/links.tsv) — ne pas les recenser, sauf s'ils masquent une règle.

Références figées PRE-4 (ne seront pas modifiées sans décision explicite) : chapitres 01, 04–13, DSF-INTERFACE-GENERALE-2026-10-08, DSF-CIRCUITS-CONTROLES-2026-10-12, DSF-DEUX-MODES-ECHEC-2026-10-13, DSF-PHRASES-V15-2026-10-07, MATRICE-DEUX-MODES-ECHEC-2026-10-13. Indiquer pour chaque constat touche_PRE4: oui/non.

Format de sortie (Markdown), par constat :
### <PREFIXE>-NN — titre court
- qualification : …
- gravité : bloquant | majeur | mineur
- passages (verbatim, ≤ 3 lignes chacun, vérifiés par grep -n) :
  - `fichier:ligne` — « … »
  - `fichier:ligne` — « … »
- analyse : pourquoi c'est cette qualification (et pas une autre)
- proposition : quelle source devient la référence unique, quoi écrire/supprimer/renvoyer, justification
- statut PR/décisions : aucun | couvert partiellement par … | arbitré par Qxx
- touche_PRE4 : oui/non
- question à Hermann (si décision produit nécessaire) : …

Viser 10 à 25 constats, priorisés, de qualité. Vérifier chaque citation avec grep -n avant de l'écrire. Terminer le fichier par une section « Couverture » : ce qui a été lu, ce qui n'a pas été lu.
