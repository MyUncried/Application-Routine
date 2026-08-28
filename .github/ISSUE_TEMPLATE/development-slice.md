---
name: Tranche de développement
description: Contrat de travail pour une tranche Txx-Sxx
title: "[Txx-Sxx] "
labels: []
assignees: []
---

## IDENTIFICATION

- ID : `Txx-Sxx`
- Titre :
- Tranche précédente requise :
- Baseline / commit de départ :
- Mode d’exécution : `LOCAL` | `CLOUD`

## OBJECTIF

Résultat utilisateur observable attendu.

## PÉRIMÈTRE

Ce qui doit être développé dans cette tranche.

## HORS PÉRIMÈTRE

Ce qui ne doit pas être anticipé.

## SOURCES DE VÉRITÉ

- Documentation fonctionnelle :
- Documentation technique :
- Figma :
- Décisions applicables :

## CRITÈRES D’ACCEPTATION

- [ ] `AC-01` —
- [ ] `AC-02` —

## TESTS ATTENDUS

- Tests automatiques :
- TypeScript :
- ESLint :
- Tests manuels éventuels :

## CONTRAINTES

- Modification minimale.
- Ne pas anticiper une tranche ultérieure.
- Ne pas modifier la documentation sauf dépendance réelle identifiée.
- Toute ambiguïté non résolue par les sources déclenche `CLARIFICATION_REQUIRED`.

## LIVRABLES

- Code.
- Tests.
- Preuves.
- Rapport d’implémentation structuré, publié comme commentaire sur cette Issue.
- Commit(s) sur la branche active de la stratégie en vigueur (voir `.github/AI_ORCHESTRATION.md` § Git et clôture — branche de bloc ou branche dédiée selon l’arbitrage en cours).
- Pull Request liée à cette tranche ou à son bloc, selon la même stratégie.

## ÉTAT INITIAL

`SPEC_PREPARED`

Claude Code doit produire un plan avec le statut `PLAN_READY_FOR_REVIEW`, le publier comme commentaire sur cette Issue, puis attendre un verdict ChatGPT (`PLAN_APPROVED` | `PLAN_CHANGES_REQUESTED` | `CLARIFICATION_REQUIRED`) publié dans cette même Issue et préfixé `[ChatGPT]`, avant toute implémentation.

Le `[ChatGPT] PLAN_APPROVED` désigne explicitement le couple `mode + écrivain` autorisé pour l’exécution (voir `.github/AI_ORCHESTRATION.md` § Désignation de l’écrivain).
