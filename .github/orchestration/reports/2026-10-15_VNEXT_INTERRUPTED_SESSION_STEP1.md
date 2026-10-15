# VNext — reprise de session interrompue, étape 1

## Problème et correction

La PR #364 part du candidat `557ab98ea3470206a79c545e849f0819a1bfd9a5`. La revue PRE-4 interrompue ne peut pas être relancée comme une nouvelle invocation ambiguë. Le correctif existant prévoit une continuation unique de la même session, avec contexte et preuves conservés.

Les archives `qualification-controls-Linux` et `qualification-controls-Windows` du run `38735464076` montrent le même échec : `vnext-chatgpt-plan-review.pilot.js:80` attend les seules permissions contents/issues/actions en lecture, alors que le workflow ajoute checks en lecture. Le test de protocole du run `38735463939` confirme ce même écart.

La permission est nécessaire pour lire les annotations de check attestant « The self-hosted runner lost communication with the server. » (`vnext-interrupted-session.js`, lecture GET `/check-runs/{id}/annotations`). Le contrôle est corrigé pour attendre exactement ces quatre permissions en lecture. Il ne tolère aucune permission d'écriture ni autre périmètre. Le manifeste ajoute les deux fichiers de reprise déjà présents dans le candidat. Aucun code produit, demande PRE-4, workflow ou comportement de reprise n'est modifié par ce complément.

## Validation locale

- 57 contrôles ciblés de reprise, relais et compatibilité : PASS, zéro échec et zéro skip.
- Suite complète VNext : 593 PASS, zéro échec et zéro skip.
- Lecture/syntaxe des 75 workflows : PASS.
- Scanner des 263 fichiers de chemins distants : NO_UNDECLARED_REMOTE_WRITE_CAPABILITY.
- `git diff --check` : PASS.

Les tests de session emploient des données de qualification ; ils ne sont pas une reprise Claude réelle. Les preuves démontrent la réservation avant invocation, le refus d'une seconde réservation, le refus de source/session/contexte modifiés, la priorité à une réponse existante et la conservation des diagnostics antérieurs.

## Clôture et limites

Ce rapport n'annonce pas de qualification CI du nouveau commit avant son exécution. La clôture technique de l'étape 1 exige les résultats du candidat exact : contrôles du protocole, qualification VNext et équivalence historique Linux/Windows. La réussite de l'ancien candidat ou d'un test local ne s'y substitue pas.

Après qualification seulement, l'étape 2 consiste à intégrer #364 et publier séparément la demande de reprise réelle. Il faut ensuite constater que la même session reprend et produit un résultat consommable avant de clore l'incident opérationnel. Aucun nouveau gate, appel Claude, reprise PRE-4, approbation de plan ou développement n'est engagé par cette étape 1. La PR #366 et le backlog général sont hors périmètre.
