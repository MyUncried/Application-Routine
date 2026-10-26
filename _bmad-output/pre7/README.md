# PRE-7 — Mouvements, filiation, niveaux et finalisation de l'éditeur d'Exercice (clôture BMAD)

Statut : **tranche close le 26/10/2026, recette iPhone validée par Hermann (JA1, JB, JA, JA1-bis, JA2, JA3).** Développement sur `pre7-bmad/dev` depuis `main` @ `bcd84481` (fusion PRE-6), réaligné sur `main` @ `e7947ddb` (PR #397 D-445, PR #398 PHC-20261026). Livraison autorisée par Hermann le 26/10/2026.

| Rubrique | Contenu |
|---|---|
| Plan initial | `planning-artifacts/epics.md`, approuvé le 24/10/2026 : Epic 0, Epic B (B.1 à B.3), Epics A1 à A4 (A1.1 à A4.1). |
| Reprise après D-445 et PHC | `planning-artifacts/sprint-change-proposal-2026-10-26.md` et `arbitrage-2026-10-26-reprise-q1-q11.md` : Q1 (C05 appliqué intégralement), Q2 (migration 013), Q3 à Q11 ; stories R-1 à R-6. |
| Corrections de recette | `arbitrage-2026-10-26-recette-ja2-d448.md` (D-448 : R-7 à R-9) ; remarques r8-5 et r9-5 du cahier JA3 (R-10). |
| Suivi | `implementation-artifacts/sprint-status.yaml` : toutes les stories `done`. Specs, revues et triages dans `implementation-artifacts/spec-*.md`. |
| Décisions | D-446 (phases, motif commun), D-447 (éditeur PRE-7, ex-numérotation locale des corrections B1 à B10, distincte de D-445 de `main`), D-448 (recette JA2) au chapitre 07. D-445 (C01 à C09) et PHC-20261026 de `main` conservés, annotés seulement. |
| Données | Migration 012 (réinitialisation des Exercices et Séances) puis 013 (modèle C05 : réinitialisation des Mouvements, Niveaux, Exercices, Séances ; Profil, Catégories, Zones et Étiquettes conservés). |

## Reports vers la tranche suivante

Non bloquants pour PRE-7, non développés :

- Nom local personnalisable d'une occurrence de Séance (écarté par Q3).
- Sous-menu de choix d'un Exercice du Catalogue pour préremplir les durées de phase au changement de niveau (NV-3 : pas de préremplissage en Séance ni en reprise).
- Évolutions de PHC-20261026 hors corrections validées : moteur d'exécution T04 (instantanés, refus de lancement, guidage minuté, annonces, progression), C08 (rattachement ultérieur à un groupe).
- Écran de recherche des mouvements conservé sans point d'entrée (D-448 point 2) ; saisie des alias sans écran ; suppression d'un Exercice au Catalogue ; Circuit de Séries (abandon annoncé par Hermann).
- Limites relevées en revue : `implementation-artifacts/deferred-work.md` (entrées par spec).
