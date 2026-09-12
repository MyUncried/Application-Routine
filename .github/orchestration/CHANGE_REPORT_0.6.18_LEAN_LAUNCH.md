# KODJO V2 — Rapport de changement : lancement Lean Queue allégé

Date : 2026-09-12  
Contrat d'exploitation : 0.6.18  
Campagne : certification du parcours ordinaire réel, issue #79  
Plan autoritatif : `.github/orchestration/KODJO_V2_ORDINARY_PATH_CERTIFICATION_PLAN_0.1.md`

## Résultat recherché

Supprimer l'obligation de faire fusionner manuellement une PR de transport pour chaque scénario Lean Queue, sans réduire les contrôles fonctionnels ni modifier les règles d'admission.

## Changement

- Le workflow Lean Queue accepte désormais `workflow_dispatch` en plus de `push`.
- Pour un lancement explicite, la demande immuable est le dernier commit du HEAD sélectionné : `after = HEAD` et `before = HEAD^`.
- Pour un événement `push`, les bornes GitHub `before` et `after` restent inchangées.
- La frontière est résolue et validée avant l'admission.
- Une PR dont le seul changement est un JSON sous `.github/orchestration/queue/v2/` n'entraîne plus la matrice pilote Linux/Windows.
- Les contrôles applicatifs post-Claude restent inchangés et sont exécutés une fois dans le run Lean Queue.
- Le contrat d'exploitation décrit une intervention éventuelle limitée à « Run workflow », sans saisie de SHA.

## Invariants préservés

- Une demande est un JSON immuable associé à un `request_id` neuf.
- Un ancien `request_id` n'est jamais rejoué.
- Le couple `before/after` est disponible avant l'admission et chaque valeur est un SHA-1 Git complet sur 40 caractères.
- Le gate humain, l'identité, la réaction, le plan et la revue restent vérifiés.
- Une seule invocation Claude est autorisée par demande.
- Le périmètre, les contrôles Jest/TypeScript/lint, la préservation et le nettoyage ne sont pas allégés.
- Le chemin historique `push` demeure compatible.
- Une PR fonctionnelle produite par un scénario de certification reste jetable et non fusionnée.

## Preuves antérieures conservées

- C1 nominal : run #29 `34718932308`, statut `IMPLEMENTED_AND_VERIFIED`, 1026/1026 Jest, TypeScript et lint PASS ; PR #87 fermée sans fusion.
- C2 interruption contrôlée : run #30 `34720271428`, statut `IMPLEMENTED_WITH_FAILED_CHECKS`, un seul test rouge prévu, paquet de reprise intact.
- C3 reprise : run #32 `34722199075`, même session `7750967c-14d0-49f9-97ca-736dea47c51b`, `RESUME_DELTA`, 1026/1026 Jest ; PR #91 fermée sans fusion.
- Refus sûr : run #31 `34721385383`, `GATE_REFERENCE_ABSENT`, `claude_invoked=false`.

## Qualification exigée

1. Exécuter la suite pilote complète sur Ubuntu et Windows pour cette modification protocolaire.
2. Vérifier que les tests d'admission couvrent les deux transports et que la CI ignore seulement les PR de file pures.
3. Après fusion, utiliser le nouveau lancement explicite pour C4.
4. Considérer PE-24 et INC-114 comme ouverts tant que C4 n'a pas démontré le parcours réel.
5. Dans C4, conserver les contrôles applicatifs complets après Claude et toutes les preuves habituelles.

## Risques et limites

- La cause exacte de l'absence d'événement `push` après certaines écritures du connecteur n'est pas démontrée.
- `workflow_dispatch` opère sur le HEAD sélectionné ; la règle `HEAD^ → HEAD` exige donc que le commit terminal soit exclusivement la nouvelle demande de file.
- Une qualification statique ne vaut pas certification E2E : le verdict final dépend du C4 réel.
