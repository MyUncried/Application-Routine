# KODJO Protocol V2 — spécification 0.6.47

Date : 2026-09-20  
Base : 0.6.46  
Objet : séparation opposable du HEAD protocolaire et du HEAD applicatif pour un `IMPLEMENT` visant une PR applicative existante.

## 1. Portée

0.6.47 corrige un défaut d'identité d'exécution observé sur V2-CAT-01. Elle ne modifie aucune décision produit, aucun critère UI, aucun scope fonctionnel et aucun gate utilisateur déjà acquis.

Le schéma Lean reste `kodjo.protocol.v2.lean-request.0.6.13`. Le champ `delivery_target` existant est réutilisé ; aucun nouvel état protocolaire n'est introduit.

## 2. Invariant des deux HEADs

Lorsqu'un plan approuvé désigne explicitement une PR applicative existante :

- `queue.source_head` reste le HEAD protocolaire immuable qui porte le plan, la revue, le bootstrap et la mission ;
- `delivery_target.application_head` est le HEAD applicatif exact qualifié par le plan ;
- la projection locale utilise le HEAD applicatif comme `request.source_head` et conserve le HEAD protocolaire dans `request.protocol_source_head` ;
- le checkout, `package-lock.json`, les contrôles applicatifs, le delta, le commit et le push s'effectuent sur le HEAD applicatif ;
- `implementation-mission.md`, le bootstrap et le registre d'activation sont relus depuis le HEAD protocolaire immuable ;
- une copie historique de ces artefacts dans la branche applicative n'est jamais une source normative et ne doit pas être modifiée.

Le HEAD protocolaire ne peut plus être substitué au HEAD applicatif pour l'exécution.

## 3. Liaison à la PR existante

Si le plan approuvé contient `application_pr` et `application_head`, la génération de la Lean Request doit :

1. vérifier que les deux champs sont valides et cohérents avec `planning_application_head` ;
2. relire la PR GitHub ;
3. exiger qu'elle soit ouverte, basée sur `main`, avec exactement le HEAD planifié ;
4. matérialiser `delivery_target.kind=EXISTING_PR`, le numéro de PR, sa branche et le HEAD applicatif.

Un `IMPLEMENT` sans cible applicative explicite conserve le comportement historique de création d'une nouvelle PR.

## 4. Préflight et fraîcheur

Pour tout `delivery_target=EXISTING_PR`, y compris `IMPLEMENT` :

- le contrôle live de la PR et de la ref distante est applicable ;
- tout déplacement de branche ou de HEAD, fermeture de PR, base différente de `main` ou lecture ambiguë bloque avant mutation ;
- le preflight atteste séparément `protocol_head` et `execution_head` ;
- la mission est hachée depuis `protocol_head` ;
- le lockfile est haché depuis `execution_head`.

Les mêmes gardes sont rejoués avant checkout mutable, appel agent, commit et push.

## 5. Livraison et revue

Un `IMPLEMENT` ciblé :

- pousse le commit validé sur la branche de la PR existante ;
- ne crée jamais une seconde PR applicative ;
- publie `IMPLEMENTATION_OUTPUT` avec `base_head=delivery_target.application_head` ;
- lie `application_pr` et `application_branch` à la cible existante ;
- fait vérifier la revue indépendante et la finalisation contre ce même base HEAD et cette même PR.

Les métadonnées propres à `VISUAL_CORRECTION` restent réservées à cette opération.

## 6. Reprise après le défaut V2-CAT-01

La requête `6a912e4d-aa27-4d10-8121-3f5426ba8722` et le run `35511804152` restent consommés et opposables. Ils ne sont ni rejoués ni libérés.

Le résultat `CHANGE_REQUEST_REQUIRED` est conservé comme preuve du défaut d'identité : aucune modification applicative n'a été produite. Après qualification et fusion de 0.6.47, une nouvelle requête, avec un nouveau `request_id`, peut être matérialisée depuis le même handoff approuvé si toutes ses identités et son gate restent exacts. Le plan, sa revue et le 👍 ne sont pas recréés.

## 7. Qualification obligatoire

La qualification doit démontrer au minimum :

1. `IMPLEMENT` sans cible conserve son ancien comportement ;
2. `IMPLEMENT` ciblé projette le HEAD applicatif tout en conservant le HEAD protocolaire ;
3. mission/bootstrap/registre proviennent du HEAD protocolaire ;
4. package et contrôles proviennent du HEAD applicatif ;
5. toute dérive live de PR/ref est refusée ;
6. la livraison vise la PR existante et aucune nouvelle PR applicative n'est créée ;
7. la revue et la finalisation utilisent le HEAD applicatif comme base ;
8. les chemins `VISUAL_CORRECTION`, recovery, consommation durable et finalisation restent inchangés hors adaptation commune de cible ;
9. les suites protocole Linux et Windows restent vertes ;
10. une reprise réelle de V2-CAT-01 franchit le point qui avait produit `CHANGE_REQUEST_REQUIRED` sans réutiliser l'ancien `request_id`.

## Addendum correctif du 28/09/2026 — révision INITIAL après `REVISE`

### A. Défaut constaté

Le §E de 0.6.29 autorisait, après `PLAN_REVISION_REQUIRED`, une nouvelle invocation `START_INITIAL_PLAN` produisant un `PLAN_OUTPUT INITIAL complet`. Sur PRE-1, cette reconstruction globale a rouvert des éléments déjà corrects du plan précédent et introduit de nouvelles erreurs indépendantes des constats de revue.

Ce comportement contredit le principe déjà appliqué sur V2-CAT-01 le 17/09/2026 : les constats d’une revue doivent être intégrés **sans rouvrir les éléments déjà validés**.

Un second défaut a été observé : le chemin INITIAL construisait la matrice UI avant la classification finale des consommateurs directs, puis validait cette matrice contre un scope pouvant contenir de nouveaux chemins `MODIFY`. Le workflow pouvait donc exiger a posteriori la couverture d’un fichier qui n’était pas connu au moment de la génération de la matrice.

### B. Invariant de révision bornée

Lorsqu’un `START_INITIAL_PLAN` est exécuté après le dernier `PLAN_REVIEW_OUTPUT` du dernier plan INITIAL et que ce verdict est `REVISE` :

1. ce `PLAN_OUTPUT` et ce `PLAN_REVIEW_OUTPUT` deviennent la base causale obligatoire de la nouvelle planification ;
2. le planificateur doit préserver les décisions, sections, chemins et contrats de tests non remis en cause ;
3. seules les constatations de revue et leurs dépendances directement démontrées peuvent modifier le plan ;
4. une reconstruction globale sans cause explicite est interdite ;
5. un plan déjà `APPROVE` ne peut pas être reconstruit par un nouveau `START_INITIAL_PLAN` ;
6. la revue indépendante complète du plan résultant reste obligatoire.

Cette règle supersède uniquement la phrase de 0.6.29 imposant un nouveau plan INITIAL complet après `REVISE`. Elle ne modifie pas le comportement du tout premier plan.

### C. Ordre scope → UI

Le chemin INITIAL applique désormais l’ordre suivant :

1. brouillon narratif + racines `modified_modules` ;
2. scan déterministe direct à un seul niveau ;
3. classification structurée de chaque candidat ;
4. détermination du scope final à un niveau ;
5. génération de la matrice UI sur les modules UI réellement en écriture ;
6. rejeu de `verify-ui-plan-criteria.js`, du contrat de plan et de `verify-plan-impact.js`.

La matrice UI ne doit plus être considérée comme finale avant le scan direct.

### D. Contrat 0.6.29 conservé

Le présent correctif ne réintroduit pas la fermeture transitive supprimée par 0.6.29 :

- un unique scan direct est exécuté ;
- un consommateur direct classé `MODIFY` entre dans `scope_allow` mais ne devient pas une nouvelle racine ;
- aucun `for iteration in 1 2 3 4` n’est ajouté au chemin INITIAL ;
- l’avertissement de volume `ONE_LEVEL_DIRECT_IMPORTS` reste inchangé.

### E. Qualification obligatoire

Avant fusion du correctif :

- tests du contexte : sélection exacte du dernier plan/revue `REVISE`, refus d’un plan déjà approuvé ;
- test structurel : génération UI après le scan direct ;
- test structurel : absence de boucle transitive INITIAL ;
- suite protocolaire Linux ;
- suite protocolaire Windows ;
- reprise réelle de PRE-1 depuis le plan `5874870872` et la revue `5878031654`, sans changement de baseline produit.

