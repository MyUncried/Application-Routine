# CHANGE REPORT — KODJO Protocol V2 0.6.41

Date : 2026-09-19  
Objet : étape 4/4 — qualification E2E UI et raccord V2 au gate humain/device existant.

## Défaut constaté

Le workflow de finalisation existant était exclusivement lié au manifeste legacy `.github/orchestration/slices/<slice>.yml`.

Une tranche V2 Lean Queue pouvait atteindre une revue technique approuvée mais ne disposait pas d’un chemin final compatible vers `READY_TO_CLOSE`.

## Correction minimale

Le workflow `kodjo-slice-finalize.yml` est conservé.

Il bifurque désormais après lecture des artefacts autoritatifs :

- chemin legacy : strictement conservé ;
- chemin V2 : identifié par `continuity_origin=V2_LEAN_QUEUE`, validé par `verify-v2-finalization.js`.

Aucun nouveau workflow, marker, repository_dispatch, queue ou bridge n’est ajouté.

## Contrôles V2 ajoutés

- liaison visual approval → review → implementation output → Lean Queue ;
- liaison exacte au HEAD applicatif ;
- contrôle PR/branche distante ;
- pour IMPLEMENT, rejeu du contrat de revue 0.6.40 et contrôle critère/preuve ;
- pour VISUAL_CORRECTION, conservation de la revue différentielle historique avec contrôle queue/checkpoint/PR/HEAD, sans inventer un contrat UI complet ;
- contrôle des preuves techniques et device ;
- final checks Jest/TypeScript/lint ;
- publication `READY_TO_CLOSE` avec contrat final déterministe.

## Régression 0.6.40 détectée pendant l’E2E

La revue critère-complète 0.6.40 s’activait aussi sur `VISUAL_CORRECTION`. Cela contredisait l’invariant historique de revue différentielle du seul delta correctif et pouvait rendre toute correction visuelle V2 non révisable.

Correction dans 0.6.41 :
- `IMPLEMENT` → contrat critère-complet ;
- `VISUAL_CORRECTION` → revue différentielle historique inchangée ;
- le finalizer accepte les deux preuves sans inventer de contrat complet pour une correction visuelle.

## Non-régression

Aucun fichier `app/**` ou `src/**` n’est modifié.

Le legacy conserve :
- son manifeste ;
- ses contrôles existants ;
- `STATUT : DONE`.

Les contrôles restaurés aux étapes 1–3 restent inchangés pour `operation_kind=IMPLEMENT`.

Une correction de compatibilité est toutefois appliquée dans le workflow de revue : `VISUAL_CORRECTION` conserve explicitement sa revue différentielle historique au lieu d’être forcé à produire le contrat critère-complet réservé à `IMPLEMENT`. Cette correction retire un élargissement involontaire introduit en 0.6.40 ; elle ne supprime aucun contrôle historique de VISUAL_CORRECTION.

## Qualification attendue

- `ui-e2e-finalization.pilot.js` nominal + négatifs ;
- suite pilote Linux ;
- Windows preflight ;
- parse PowerShell 5.1 ;
- contrôle des fichiers modifiés ;
- seconde passe indépendante.

## Limite explicite

Le test E2E automatisé simule l’existence d’une approbation humaine liée à un HEAD exact. Il ne remplace pas une vraie validation iPhone/device lorsqu’une fonctionnalité réelle l’exige.
