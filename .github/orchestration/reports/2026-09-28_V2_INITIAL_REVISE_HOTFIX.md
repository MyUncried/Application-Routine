# Hotfix KODJO V2 — révision INITIAL bornée après REVISE

Date : 2026-09-28  
PR : #251  
Tranche déclenchante : V2-PRE-1  
Baseline produit conservée : `e216294506bed87dd80855937e3fabfbfa322b82`

## 1. Incident

PRE-1 a produit un premier `PLAN_OUTPUT` canonique (`5874870872`) puis une revue indépendante `REVISE` (`5878031654`) avec cinq constats bloquants.

Le chemin `START_INITIAL_PLAN` a ensuite reconstruit un plan complet au lieu de corriger seulement ces constats. Plusieurs régressions indépendantes sont apparues au fil des runs :

- chemin inexistant `src/infrastructure/database/DatabaseRows.ts` ;
- matrice UI ne couvrant pas un consommateur promu `MODIFY` ;
- sur-correction à 119 `modified_modules` et 137 chemins de scope ;
- nouvelle omission UI ;
- doublon de `preservation`.

Aucun de ces échecs ne constitue une décision produit nouvelle.

## 2. Cause racine

Deux causes protocolaires distinctes ont été confirmées.

### 2.1 Régression de la règle post-REVISE

Le commit `03f744705a4427c468834eb78025f6daaaac67c9` avait déjà inscrit pour V2-CAT-01 que les constats de revue devaient être intégrés « sans rouvrir les éléments déjà validés ».

Cette règle n’a pas été généralisée. Le §E de 0.6.29 a au contraire conservé pour `START_INITIAL_PLAN` la production d’un nouveau plan INITIAL complet après `REVISE`.

Le contexte `initial` de `build-planning-context.js` n’incluait par ailleurs aucun `BASE_PLAN` ni `INDEPENDENT_REVIEW`.

### 2.2 Ordre incorrect scope → UI

Le draft INITIAL construisait déjà une `ui_criteria_matrix`. Le scan direct intervenait ensuite et pouvait classer de nouveaux consommateurs en `MODIFY`. Le validateur UI final exigeait alors la couverture de chemins absents au moment où la matrice avait été générée.

## 3. Correction PR #251

Le hotfix reste limité au chemin INITIAL :

1. `build-planning-context.js` sélectionne le dernier `PLAN_OUTPUT` INITIAL et sa dernière revue uniquement lorsque le verdict est `REVISE`;
2. un plan déjà `APPROVE` refuse un nouveau `START_INITIAL_PLAN`;
3. le draft ne génère plus de matrice UI ;
4. le draft produit seulement le plan narratif, `modified_modules` et le statut ;
5. un scan direct unique est exécuté, conformément au contrat 0.6.29 ;
6. la seconde passe structurée reçoit le scan exact, classe tous les candidats et génère la matrice UI sur les chemins UI effectivement en écriture ;
7. le scope machine reste à un seul niveau ; aucun consommateur `MODIFY` ne devient une nouvelle racine de scan ;
8. les validateurs UI, plan-contract et plan-impact sont rejoués avant publication.

## 4. Non-régression recherchée

Le hotfix ne modifie pas :

- les sources produit PRE-1 ;
- le bootstrap PRE-1 ;
- la baseline produit ;
- le parcours `START_PLAN_REVISION` avec PR applicative ;
- les gates utilisateur ;
- Lean Queue, recovery, RESUME_DELTA, VISUAL_CORRECTION ou finalisation ;
- le contrat INITIAL à un niveau introduit par 0.6.29.

## 5. Qualification obligatoire

Avant fusion :

- `planning-api-budget.pilot.js` : sélection REVISE et refus APPROVE ;
- `v2-initial-planning-entry.pilot.js` : ordre scan → génération UI finale et absence de boucle transitive ;
- suite protocolaire Linux ;
- suite protocolaire Windows.

Après fusion :

- relancer PRE-1 sur la même baseline ;
- vérifier que le couple `5874870872 / 5878031654` est chargé comme base causale ;
- produire un nouveau plan ;
- relancer la revue indépendante ;
- ne poursuivre au handoff utilisateur qu’après `APPROVE`.

## 6. Statut

`CORRIGÉ SOUS RÉSERVE DE CERTIFICATION` jusqu’à qualification complète de la PR #251 et replay réel PRE-1.
