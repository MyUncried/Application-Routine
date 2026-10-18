# Brief commun — finalisation du lot 6 (lecture seule, propositions)

Dépôt : `C:\Dev\KODJO-OPENSPEC-DOCS`, branche `docs/openspec-revision`, HEAD de départ `e8afc61b`. La documentation est **déjà restructurée** (lot 6). Tu travailles sur l'état **actuel** des fichiers de `docs/`.

## Interdits

- Ne modifie **aucun** fichier de `docs/`, du code, de `.github/`, d'un autre clone. Aucune commande git qui modifie l'état.
- Écris **uniquement** les fichiers de sortie qui te sont attribués (dans `openspec/changes/revision-documentation-kodjo/lot6/finalisation/` et `openspec/changes/revision-documentation-kodjo/constats/`).
- N'invente ni règle, ni décision, ni identifiant. Ne tranche aucune contradiction sans décision explicite existante (D-nnn du registre ch. 07, ou décision de Hermann consignée dans `openspec/changes/revision-documentation-kodjo/arbitrages.md`, ou décision PRE-4 Q1–Q32 dans `C:\Dev\KODJO-BMAD-PRE4\docs\preparation\PRE-4\bmad\questions-ouvertes.md`, lecture seule, portée générale selon D-385 sauf restriction explicite).
- Ne modifie jamais le texte d'une décision du registre (ch. 07), sauf restauration exacte d'un texte d'origine prouvée par Git, à signaler à part.

## Ressources

- Chapitres : `docs/Specifications-fonctionnelles/NN – *.md` et trois annexes (`Annexe – …`).
- Index des titres actuels et de leurs ancres : `openspec/changes/revision-documentation-kodjo/lot6/finalisation/titres-actuels.tsv` (colonne `lien_depuis_docs_SF` = lien Markdown à utiliser depuis un chapitre ; depuis `docs/*.md`, préfixer `Specifications-fonctionnelles/`).
- Correspondance ancienne section → place actuelle : `lot6/correspondance-actualisee.tsv` (colonnes `fichier_actuel`, `titre_actuel`, `ancre_actuelle`) et l'annexe « Correspondance des sections ».
- Plan, constats, décisions : `lot6/plan-restructuration.md`, `diagnostic.md`, `qualite.md`, `constats/`, `arbitrages.md`, registre ch. 07.
- Git : historique complet ; `7a89220f^` = état avant la consolidation du 14/10 ; `cefc9b99` = état avant le lot 6.

## Format des corrections proposées (JSON)

```json
{ "description": "…", "corrections": [
  { "id": "XX-001", "ref": "constat / décision / preuve", "motif": "RESTAURATION:<commit> | RENVOI | COPIE-RETIREE | REDACTION | CORRECTION-DECIDEE:D-nnn",
    "classe": "DOC | FONCT-ARBITRÉ", "decision": "D-nnn (si FONCT-ARBITRÉ)",
    "file": "@NN – Nom exact.md" ou "chemin relatif à docs/", "ancien": "texte EXACT actuel", "nouveau": "texte corrigé" } ] }
```

- `ancien` doit être une sous-chaîne **exacte** du fichier actuel (copie caractère par caractère, espaces insécables et apostrophes typographiques comprises), **unique** dans ce fichier. Prends la ligne entière si nécessaire.
- Une correction ne change que ce qui est démontré. Une correction `REDACTION` ne doit modifier ni nombre, ni unité, ni identifiant, ni libellé entre `…` ou « … », ni négation (ne, pas, aucun, jamais, sans, sauf, ni, seul, uniquement, hors), ni modalité (doit, peut, obligatoire, facultatif, interdit, toujours) : sinon ce n'est pas une correction rédactionnelle.
- Un lien vers une section utilise exactement la colonne `lien_depuis_docs_SF` de `titres-actuels.tsv`.
- Fichier JSON en UTF-8, valide (vérifie avec `node -e "JSON.parse(require('fs').readFileSync(…))"`), et vérifie pour chaque correction que `ancien` apparaît une seule fois dans son fichier (script node).

## Rapport d'examen (TSV)

Une ligne par élément examiné, colonnes imposées par ta tâche, avec toujours : `statut`, `preuve` (fichier:ligne actuels, commit et ligne Git, D-nnn…), `action` (identifiant de correction JSON, ou « aucune »), `raison`.

## Réponse finale

Moins de 300 mots : nombre d'éléments examinés (doit égaler le périmètre), répartition par statut, nombre de corrections proposées, cas incertains, difficultés.
