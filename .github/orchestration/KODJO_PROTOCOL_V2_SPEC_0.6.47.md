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
