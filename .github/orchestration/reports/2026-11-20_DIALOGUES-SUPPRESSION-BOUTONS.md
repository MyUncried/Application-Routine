# 2026-11-20 — Fenêtres de suppression : « Annuler » à côté de « Confirmer »

## Identifiant et objectif

- **Mission** : DIALOGUES-SUPPRESSION-BOUTONS.
- **Demande de Hermann** : « Remettre le bouton Annuler à côté du bouton Confirmer, les deux au même format. Cela concerne les fenêtres de message de confirmation de suppression de routine et d'occurence. »
- **Branche** : `planification/ce-ui-12-20261118`.
- **Commit de départ** : `53630b9f`.

## Modifications réalisées

- **« Supprimer ce créneau »** (Agenda, `CalendarWeekScreen.tsx`) et **« Supprimer cette routine »** (Journal, `JournalScreen.tsx`) :
  - variante à deux actions côte à côte du composant partagé `DecisionDialog` ;
  - « Annuler » (gris) et « Confirmer » (rouge) de même taille, comme les autres fenêtres de confirmation de l'application ;
  - option `cancelOnTop` retirée de ces deux appels.
- **Inchangés** :
  - titres et messages, y compris le titre seul « La routine <nom> sera supprimée » ;
  - comportements.
- **Non modifiée** : la fenêtre « Modifier cette routine » (Planifier, depuis le Journal) n'est pas citée. Elle garde « Annuler » en haut à gauche.

## PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE** :
  - composant `DecisionDialog` inchangé : on revient à sa variante d'origine ;
  - autres fenêtres de l'application non touchées ;
  - logique de suppression inchangée.
- **CHANGE** : présentation des deux fenêtres de suppression.
- **FORBIDDEN** (respecté) : aucune primitive ni aucun autre écran touchés.

## Tests

- **Ajustés** : `CalendarWeekScreen.integration` et `JournalScreen.integration`. Plus de pastille « Annuler » en haut ; « Annuler » et « Confirmer » sont dans la rangée d'actions.
- **Exécutés** : `npx jest -w 1` sur les écrans Agenda, Journal et Planifier : **48 tests réussis sur 48**.
- `tsc` et `eslint` : aucune erreur.
- **Suite complète** : non relancée (manque de mémoire sur le poste, Metro en cours).
- **À vérifier sur iPhone** : les deux fenêtres.

## Synchronisation

- **Classe B** : registre ch07, DSF Agenda et DSF Journal annotés.

## Fichiers modifiés

- `src/features/planning/CalendarWeekScreen.tsx`
- `src/features/planning/JournalScreen.tsx`
- tests : `src/features/planning/__tests__/CalendarWeekScreen.integration.test.tsx`, `JournalScreen.integration.test.tsx`
- documentation : registre ch07, `docs/DSF-AGENDA-PLANNING-2026-11-19.md`, `docs/DSF-JOURNAL-2026-11-19.md`
- ce rapport

## Commit final et état Git

- **Commit** : celui qui contient ce rapport.
- **État Git** : propre après commit ; branche ni envoyée sur GitHub ni fusionnée.
