# KODJO Protocol V2 — Change report 0.6.28

Date : 2026-09-15
Baseline : `a77ab88749dfbf912d739b310eb1bf0b73a923d7`

## Objet

Industrialiser le parcours réel de correction visuelle découvert lors de la clôture de `V2-BILAT-01`, sans conserver les workflows ponctuels utilisés pour débloquer la PR #142.

## Causes traitées

1. Le routage `VISUAL_CORRECTION` avait été corrigé au niveau de la politique interne et du checkpoint, mais l’entrée réelle `[KODJO_V2] RESUME_DELTA` n’atteignait pas le job legacy `KODJO_SLICE`.
2. Lean Queue savait reprendre une exécution, mais sa publication standard créait toujours une nouvelle branche et une nouvelle PR : aucune cible `EXISTING_PR` n’était modélisée.
3. Le contrôle de checkpoint présent dans `verify-queue-admission.js` était une insertion textuelle échappée et n’était pas un chemin exécutable fiable.
4. Une reprise depuis une PR applicative plus ancienne pouvait basculer le checkout vers un arbre qui ne contenait pas le runtime protocolaire courant.
5. Les contournements ad hoc avaient réintroduit des problèmes déjà résolus par le chemin canonique : normalisation CRLF et commandes de contrôle hors contrat.

## Modifications

- contrat Lean Queue : `operation_kind=VISUAL_CORRECTION` ;
- cible structurée `delivery_target.kind=EXISTING_PR` ;
- checkpoint certifié obligatoire et relu sur GitHub ;
- séparation explicite HEAD protocolaire / HEAD applicatif ;
- projection de la demande locale sur le HEAD applicatif ;
- non-rejeu du paquet historique déjà matérialisé dans la PR ;
- baseline recovery vide et liée au checkpoint ;
- runtime `scripts/kodjo` figé hors checkout avant bascule vers la PR applicative ;
- vérification live de la PR, branche et HEAD avant Claude ;
- conservation des protections `core.autocrlf=false` et `core.whitespace=cr-at-eol` ;
- push fast-forward non forcé vers la branche existante ;
- absence de création d’une nouvelle PR en correction visuelle ;
- publication automatique d’un nouveau `APPLICATION_CHECKPOINT` après téléversement du paquet courant ;
- maintien obligatoire du gate de revue visuelle humaine avant fusion.

## Non-modifications

- aucune règle fonctionnelle KODJO n’est modifiée ;
- aucun fichier `src/**` ou `app/**` n’est concerné ;
- le comportement standard `IMPLEMENT` reste le chemin historique de création de branche/PR ;
- les règles existantes de staging exact et CRLF ne sont pas remplacées ; elles sont réutilisées ;
- aucun workflow one-off n’est conservé.

## Qualification

La qualification permanente est portée par `tests/kodjo/visual-correction-delivery.pilot.js` et par la CI protocolaire existante.

La première exécution de la PR #145, run `34972332382`, a été volontairement laissée bloquante : 7 oracles transverses ont détecté des dépendances non propagées (ordre du garde `npm ci`, scanner des écritures Git bornées, projection des nouveaux champs, consommation de `delivery_checkpoint`, et ancien oracle supposant `V2-BILAT-01` encore ACTIVE). Aucun de ces écarts n’a été contourné ; leurs dépendances ont été réalignées avant nouvelle qualification.

La deuxième exécution réelle, run `34973302653`, n’a conservé qu’un seul échec : le test de complétude des autorisations pointait vers un module de checkpoint inexistant. Le consommateur réel est `scripts/kodjo/verify-visual-checkpoint.js`, appelé par `verify-queue-admission.js` avant toute mutation ; l’oracle référence désormais ce module exact.

Le registre d’incidents ne sera marqué `PASS/CORRIGÉ` qu’après exécution verte des oracles opposables Linux et Windows.
