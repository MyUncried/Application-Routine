# PE-32 — contrôle des chemins avant analyse : défaut confirmé et correctif candidat

Date : 15 octobre 2026. Mission : vérifier si PE-32 est satisfait et compléter le contrôle manquant.
Base : main `0ceebe9a70f618080b45c8c4ca052cb34cc48372`. Travail dans un worktree isolé, verrou écrivain propre à cette mission. Aucune revue Claude, aucun développement PRE-4, aucune mutation V2.

## Conclusion

**PE-32 n’est pas satisfait sur la base examinée.** Les chemins existent dans un inventaire Git exact, mais produceInternal calcule les racines puis lance le scan avant buildImpactGraph, qui rejette les classifications invalides. Une demande mêlant une racine MODIFY valide et une autre cible invalide peut donc consommer le scan avant son refus.

Ce n’est plus un simple manque de classement des preuves : un défaut de séquencement a été reproduit. Ne pas clore le sujet sur les anciens tests verts.

## Reproduction

Nouveau test `tests/kodjo/vnext-path-preflight.pilot.js`, exécuté avant correction :
- 2 tests, 0 PASS, 2 FAIL ;
- le point d’entrée réel Chain.produce atteint la frontière scan avant le refus attendu : TEST_SCAN_REACHED_BEFORE_PATH_REFUSAL ;
- cas MODIFY absent et demande CREATE incompatible mêlés à une cible MODIFY valide.

Le scan est remplacé uniquement par une sonde qui signale son entrée ; le test conserve construction des sources, registre, inventaire Git et préparation réelle. Aucun modèle, réseau, publication ou interprétation métier.

## Correction commune candidate

- Extraction du contrôle existant dans `Impact.validateImpactClassifications`, sans en affaiblir les règles.
- Appel avant tout scan dans `vnext-live-chain.produceInternal`.
- Maintien du même contrôle lors de buildImpactGraph pour les autres consommateurs.
- Aucune modification des schémas, identités, hashes contractuels ou règles historiques. Une entrée valide est normalisée comme auparavant ; aucune couverture d’importeurs n’est déduite avant le scan.
- Précision normative dans la spécification VNext §13.4 : valider toutes les cibles déclarées avant le scan, y compris les demandes mixtes.

## Matrice de vérification

| Cas | Résultat local après correction |
|---|---|
| MODIFY inexistant, dans une demande contenant aussi un MODIFY valide | Refus avant scan |
| MODIFY dont la casse est incorrecte | Refus avant scan |
| MODIFY dont l’accent est supprimé ou dont la représentation Unicode diffère du chemin Git exact | Refus avant scan |
| CREATE demandé sur un candidat déjà existant | Refus avant scan |
| Slot CREATE portant un chemin déjà présent au SHA source | Refus avant scan |
| Slot CREATE hors racine autorisée | Refus avant scan |
| MODIFY demandé sur un slot réservé à CREATE | Refus avant scan |
| MODIFY avec chemin accentué exact et CREATE absent au SHA source, autorisé | Acceptés |
| Fichier local non commité homonyme du CREATE | Ne remplace pas la vérité de l’arbre Git source |
| Parcours existant inventaire/importeurs/plan et transmission du plan approuvé | Suites ciblées réussies |

Tests :
1. `node --test tests/kodjo/vnext-path-preflight.pilot.js tests/kodjo/vnext-impact-graph.pilot.js tests/kodjo/vnext-live-chain.pilot.js` après correction initiale : **27 PASS / 0 FAIL / 0 SKIP**, dont les deux régressions alors présentes.
2. Après ajout du positif exact/Unicode/CREATE immuable : `node --test tests/kodjo/vnext-path-preflight.pilot.js tests/kodjo/vnext-impact-graph.pilot.js tests/kodjo/vnext-plan-contract.pilot.js tests/kodjo/vnext-runtime-plan.pilot.js` : **34 PASS / 0 FAIL / 0 SKIP**.
3. `git diff --check` : PASS.

Les séries se recouvrent ; leurs nombres ne s’additionnent pas en un nombre de tests uniques. Exécution locale Linux uniquement. Windows et CI du candidat non revendiqués avant résultat. Les tests antérieurs 38650355491 concernent l’ancien code : ils ne certifient pas ce correctif.

## État et livraison

Implémenté : OUI dans le candidat. Testé : OUI localement sur Linux, selon le détail ci-dessus. Intégré main : NON à la création de cette livraison. Utilisé en production : NON démontré. PE-32 reste ouvert jusqu’à intégration et qualification appropriée du candidat.

Fichiers : deux modules communs VNext, un nouveau test, une précision de spécification et ce rapport. Aucun changement applicatif, aucun appel Claude, aucune revue ou reprise PRE-4. Aucun test global déclenché manuellement ; les contrôles automatiques habituels de la PR peuvent se déclencher à sa publication.

Le commit de livraison est celui portant ce rapport ; son SHA est exposé par la PR. Pas de hash auto-référent inventé. Le suivi du registre de main est mis à jour séparément pour distinguer le défaut actuel du correctif candidat, sans laisser croire que le moteur de main est déjà corrigé.

