# KODJO V1.3 — test intégré réel T1 → T9

test_id=KODJO-V13-T1T9-20260829-01

## Périmètre

Ce test vérifie uniquement le transport et l’orchestration. Il n’autorise aucune modification métier, aucune reprise de T01-S09 et aucune fusion de cette PR.

Valeurs permanentes :

- business_write=false
- implementation_authorized=false
- mode=CLOUD_READ_ONLY
- writer=NONE

## Chaîne contrôlée

1. T1 : événement de départ Work matérialisé dans GitHub.
2. T2 : appel Claude Cloud réel, lecture exclusive de ce manifeste et sortie structurée initiale.
3. T3 : revue ChatGPT réelle ; demande ciblée de correction du champ de preuve volontairement omis.
4. T4 : nouvel appel Claude réel avec delta de correction uniquement.
5. T5 : revue ChatGPT réelle ; demande de retest/revalidation.
6. T6 : nouvel appel Claude réel ; résultat stable, puis arbitrage intermédiaire Work.
7. T7/T8 : trois arbitrages Work distincts.
8. T9 : appel Claude final réel, publication GitHub vérifiée et retour spontané dans le même fil Work.

## Arbitrage intermédiaire T1–T6

- A — poursuivre le test intégré.
- B — arrêter le test intégré.

## Arbitrage T7/T8 — boucle 1

- A — poursuivre vers la boucle 2.
- B — arrêter le test intégré.

## Arbitrage T7/T8 — boucle 2

- A — poursuivre vers la boucle 3.
- B — arrêter le test intégré.

La réponse C seule est hors options et ne constitue pas une décision. Elle doit être matérialisée comme réponse non exploitable ; la barrière ARBITRAGE reste active et une clarification A/B est demandée dans le même fil.

## Arbitrage T7/T8 — boucle 3

- A — finaliser le test jusqu’à T9.
- B — arrêter le test intégré.

Une question sur les choix ne constitue pas une décision. Elle doit être matérialisée, recevoir une réponse réelle dans le même fil, et laisser la barrière ARBITRAGE active jusqu’à une décision explicite.

Réponse de référence à la question « Que se passe-t-il si je choisis B ? » : le test s’arrête proprement en ARBITRAGE_STOPPED, sans appel Claude supplémentaire, sans écriture métier et sans T9 démontré.

## Critères de succès T9

T9 exige une chaîne causale reconstructible par test_id, transition_id et source_comment_id ; au moins deux boucles réelles Claude–GitHub–ChatGPT ; un arbitrage intermédiaire ; trois arbitrages T7/T8 avec traitement nominal, hors-options et question avant décision ; un appel Claude final réel ; chaque publication vérifiée par identifiant GitHub et champs critiques ; business_write=false partout ; apparition spontanée du verdict final dans le même fil Work.
