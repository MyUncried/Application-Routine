# Tâche 2 — correction du contrat de revue et du plan

Mission VNEXT_TASK2_PLAN_CONTRACT_CORRECTION. Autorisation du 6 octobre 2026 à 02:30 Paris : diagnostiquer, corriger et relancer le test ; priorité au parcours fonctionnel. Départ local `39be5974d41fc3967ba799e676fce8de9fe23614`, distant `297c875f3bad9c95a1ad004b18bea933ae4763f0`. Branche `protocol/vnext-proof-stability-20260930`, PR #269 draft. Tâche 2 isolée uniquement ; aucune extension à tâche 3, clôture, activation, V2, PRE-2, PRE-3 ou application réelle.

## Diagnostic établi

Le run `37391444927` a achevé son appel Claude, puis échoué avant implementation : premier finding `PRESERVATION_RISK` ciblant `PLAN_CONTRACT`, combinaison interdite par le validateur canonique. Le schéma de réponse énumérait séparément les catégories et les types sans encoder leur compatibilité. Ce défaut préexistait à la supervision de flux ; la dernière modification ne permet pas de lui attribuer la régression fonctionnelle. Les quatre alertes brutes sont conservées intégralement dans l’archive précédente et ne sont ni réétiquetées ni traitées comme une approbation.

Les alertes de fond ont été confrontées aux objets produits et au conducteur réel : préservation du fichier dépendance sans obligation explicite de conserver son export dans Screen ; preuve FUNCTIONAL_TEST demandant une géométrie rendue à un test Node sans navigateur ; tableau de risques vide malgré la convention pt/px et l’exclusion native ; sujet documentaire STATE-1 sans point d’observation explicite du booléen.

## Correction bornée

Le schéma structuré impose maintenant la matrice canonique catégorie/type via des branches anyOf. Le dossier fournit cette même matrice et demande une cible appartenant au catalogue de ce type. Le validateur final et son refus initial restent stricts. La réduction des enums de transport pour Windows, la couverture complète, les dépendances indexées et le timeout INITIAL de 600 000 ms restent en vigueur.

Le constructeur générique reçoit un contrat optionnel pour cette qualification : conservation de l’import/export Existing ; assertion exécutée d’égalité avec le dépendant ; contrôles de markup dans Node et mesures exactes dans la preuve VISUAL_COMPARE séparée ; limites explicites pt/px, navigateur sans certification native et booléen sans sélection de chips. Le comportement des recettes sans ce contrat reste inchangé.

Le document source de la fixture jetable précise le booléen initialement off et les deux transitions off/on puis on/off. Les assertions pointent sur Screen.toggle() ; le document, les exigences et les états restent cohérents. Cette précision décrit le périmètre déjà exécuté et n’ajoute aucune UX de production. Les trois propriétés visuelles et les deux scénarios sont conservés. La capture Figma originale demeure identique (`4660193f894fb911a15495f09b8a9a90c4ebb1bdd09031b31b626b87f50a1ee1`, 3 884 450 octets).

Le conducteur vérifie effectivement que Screen.Existing est présent et strictement égal à Existing du dépendant, avant toute observation initiale et après correction. La vérification byte pour byte du dépendant et du périmètre d’écriture reste active. Aucun code applicatif réel modifié.

## Vérification et publication

Tests ciblés : 45 cas, 44 PASS, zéro FAIL, 1 SKIP (navigateur absent localement). Le schéma exclut le couple exact ayant échoué ; le validateur le refuse encore. Un export supprimé provoque un échec réel de processus Node. La projection du contrat impose préservation, preuves adéquates, risques et sujet observable. Précheck réel de préparation PASS sans appel de modèle : 3 exigences, 4 assertions, 2 scénarios.

La première passe élargie a refusé les empreintes historiques des tests modifiés : cinq correspondances exactes sont mises à jour (hash et lignes), sans modifier sujets, protections, IDs ou limites historiques. Nouvelle passe complète : 334 cas, 333 PASS, zéro FAIL, 1 SKIP (navigateur local absent). Invariants des workflows PASS et whitespace PASS. Journaux complets conservés avec leur empreinte. Qualification exacte Linux/Windows et parcours réel à effectuer. Les preuves précédentes restent conservées ; aucun résultat positif de tâche 2 revendiqué.

PRESERVE : contrats et validations strictes, capture Figma, scope, consommateurs, historique, UUID consommé. CHANGE : schéma/dossier reviewer, contrat de qualification du plan, conducteur/test associé, correspondances de tests, branche de qualification dédiée, checkpoint et rapport. FORBIDDEN : récupération par réétiquetage, couverture raccourcie, rejeu de demande, extension ou promotion.

Seconde passe indépendante effectuée avant publication : diff final, compatibilité sans contrat optionnel, transport Windows borné, source documentaire cohérente, tests exacts, arbre/fenêtre de publication. Le hash final, l’état Git et le lancement observé seront consignés après les étapes correspondantes. Le commit de ce rapport est consultable par `git log -1 --format=%H -- .github/orchestration/reports/2026-10-06_VNEXT_TASK2_PLAN_CONTRACT_CORRECTION.md`.

Relecture séparée : absence de contrat optionnel conserve les anciennes obligations et justification ; la matrice reste présente dans la copie de schéma transport ; les tests de chaîne vérifient que la commande reste inférieure à 8 000 caractères. Document, état et exigence sont issus des mêmes octets. Les alertes initiales ont été corrigées à leur source sans réutiliser la réponse rejetée.
