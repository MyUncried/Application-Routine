# 2026-11-20 — Journal : repère « P » après le nom

## Identifiant et objectif

- **Mission** : JOURNAL-REPERE-PARCOURS.
- **Demande de Hermann** : « Je vois bien le P entre parenthèses de parcours à droite du nom dans l'agenda, mais pas dans le journal, c'est à corriger ».
- **Branche** : `planification/ce-ui-12-20261118`.
- **Commit de départ** : `0d692536`.

## Constat

Au Journal, le repère était bien affiché, mais **devant** le nom et avec l'ancien trait (1,5). Le commit `e1410546` ne l'avait déplacé que dans l'Agenda, seul cité à ce moment-là.

## Modification

- `JournalRoutineCard` : le repère « P » est placé après le nom (`placement="after"`), avec un cercle de 1 (`stroke={1}`). Le nom prend sa largeur, au plus la place disponible ; le P le suit immédiatement.
- **Inchangés** :
  - tailles et couleurs ;
  - chevron, zones tactiles et déployé ;
  - carte de la modale du filtre, qui n'affiche pas de repère.

## Tests

- `JournalScreen.integration` : test complété, le P suit le nom et le trait vaut 1.
- Suite complète (`npx jest -w 2`) : 412 groupes de tests réussis sur 412, 6 283 tests réussis, 32 ignorés.
- `tsc` et `eslint` : aucune erreur.
- **À vérifier sur iPhone** : P visible après un nom long.

## Synchronisation

- **Classe B** : registre ch07 et DSF Journal annotés.

## Fichiers modifiés

- `src/features/planning/JournalRoutineCard.tsx`
- `src/features/planning/__tests__/JournalScreen.integration.test.tsx`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/DSF-JOURNAL-2026-11-19.md`
- ce rapport

## Commit final et état Git

- **Commit** : celui qui contient ce rapport.
- **État Git** : propre après commit ; branche ni envoyée sur GitHub ni fusionnée.
