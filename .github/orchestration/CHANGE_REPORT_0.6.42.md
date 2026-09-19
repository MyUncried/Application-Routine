# CHANGE REPORT — KODJO Protocol V2 0.6.42

Date : 2026-09-19  
Objet : définition et validation de l’architecture globale du préflight déterministe.

## Portée

Ce lot ne met pas encore le préflight en production.

Il crée uniquement :

- la spécification d’architecture ;
- une matrice machine de 31 contrôles ;
- un test d’architecture qui relie la cible à la chaîne actuelle.

## Décision structurante

Le préflight cible est un **agrégateur unique** qui réutilise les validateurs existants.

Il sépare explicitement :

- SELECTION ;
- PREFLIGHT ;
- FRESHNESS_GUARD ;
- EXECUTION_POST.

Cette séparation évite deux écueils :

1. dupliquer les règles stables dans un second moteur ;
2. croire qu’une donnée volatile vérifiée à T0 reste vraie jusqu’à T1.

## Cohérence E2E

L’architecture conserve intégralement :

- PLAN / PLAN_REVIEW ;
- les contrats UI restaurés en 0.6.38–0.6.40 ;
- les barrières d’arrêt ;
- VISUAL_CORRECTION ;
- recovery / checkpoint / attestation ;
- implementation review ;
- gate humain/device ;
- FINAL_VERIFICATION ;
- le legacy non-V2.

## Fichiers

- `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.42.md`
- `.github/orchestration/KODJO_PROTOCOL_V2_PREFLIGHT_ARCHITECTURE_0.6.42.md`
- `.github/orchestration/KODJO_PREFLIGHT_ARCHITECTURE_MATRIX_0.6.42.json`
- `.github/orchestration/CHANGE_REPORT_0.6.42.md`
- `tests/kodjo/preflight-architecture.pilot.js`
- registre/tests de gouvernance concernés.

## Qualification attendue

- suite Linux ;
- Windows preflight ;
- validation de la matrice ;
- aucune modification runtime ;
- seconde passe indépendante avant validation de l’architecture.

## Suite après validation

Une fois 0.6.42 validée, l’implémentation se fera en trois lots A/B/C, sans retirer de garde-fou avant preuve d’équivalence.
