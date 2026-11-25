# 2026-11-23 — LANGUES-J1-PLAN : plan de l'étape 1 (KODJO en anglais)

## Identification

- **Mission** : préparer l'étape 1 (« Etape 1 ») : plan, glossaire anglais, suivi du chantier.
- **Type** : planification ; aucun fichier applicatif modifié.
- **Branche** : `claude/exciting-lovelace-iyn2wf`
- **Commit de départ** : `98c0ae7`

## Constats

- `expo-localization` est absent du projet : il faut un module natif, donc un nouveau build EAS.
- Le français est codé en dur à plusieurs endroits :
  - `"fr-FR"` dans 3 écrans et la voix ;
  - `replace(".", ",")` dans 4 fichiers ;
  - 68 choix singulier/pluriel écrits en dur.
- La branche Programmes (`feat/plan-20261121`, 137 commits) n'est pas fusionnée ; l'onglet Compte n'existe que sur cette branche.

## Livrables

- `docs/preparation/langues/J1-PLAN-KODJO-EN-ANGLAIS-2026-11-23.md` (PLAN_READY_FOR_REVIEW)
- `docs/preparation/langues/GLOSSAIRE-EN-2026-11-23.md` (à valider)
- `docs/preparation/langues/SUIVI.md` (état du chantier)

## Tests

Aucun test applicable (planification).

## Restant

- Approbation du plan, validation du glossaire, questions J1-1 à J1-3.

## Commit final et état Git

Voir le commit qui contient ce rapport sur `claude/exciting-lovelace-iyn2wf`.
