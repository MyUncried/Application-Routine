# VNext — correction après une livraison approuvée

Périmètre : PR #269, étape 3 ; parent exact `d29d59a1dbf1d84cc9172a4a2e1726fcb63bfb1b`. Aucun changement de PRE-2, aucune fusion de #307, aucun FINAL ni activation.

## Diagnostic et choix minimal

Le défaut démontré était la confusion dans la projection aval entre les cibles historiques des critères UI et les fichiers autorisés à être écrits par une nouvelle correction. Une référence de livraison conservée ne doit pas devenir une autorisation d’écriture. VNext construit ses plans depuis ses contrats structurés ; il n'utilise pas ici le générateur de plan V2. La correction V2 #307 du prompt est distincte et n'est pas transposée en élargissement automatique du scope VNext.

La séparation est facultative pour les plans existants, mais explicite pour une correction après livraison : `deliveryCorrection.reference` pointe vers une révision Git exacte contenant le plan, la revue et la finalisation antérieurs. `replacements` lie chaque ancien critère réellement remplacé à une exigence CHANGE courante et à un nouveau critère UI. Les autres critères sont conservés. Les commentaires réels de revue et de validation du propriétaire sont relus depuis GitHub et contrôlés (auteur, dépôt, issue, ID, HEAD et revue exacte). Le dossier complet est scellé dans le hash du plan ; l'observation est renouvelée lors de sa vérification.

## Intégration

- `lib/vnext-delivery-preservation.js` : observation de la livraison approuvée, validation des liaisons, remplacement explicite et matrice complète de références. Une correction ultérieure conserve aussi les critères hérités des corrections précédentes.
- `lib/vnext-live-chain.js` et `lib/plan-contract.js` : production et revalidation du dossier de livraison exact ; liaison à la tranche, à l'issue et au HEAD applicatif de départ.
- `lib/review-contract.js` et `lib/revision-contract.js` : les critères et assertions conservés restent des cibles de la revue indépendante et des contrôles de régression.
- `lib/vnext-legacy-queue-adapter.js` : matrice de correction distincte des critères historiques, bloc `KODJO_VNEXT_DELIVERY_PRESERVATION_JSON` dédié, scope d'écriture inchangé. Métadonnées d'assertions cohérentes dans la projection. Le prompt aval explique explicitement cette distinction.
- `lib/requirement-contract.js` : exigences et tests couvrent la livraison conservée ; les références ne donnent aucune permission d'écriture.
- `verify-ui-implementation-review.js` : tous les critères conservés exigent une vérification fraîche au nouveau HEAD. L'ancienne revue reste une référence historique, jamais un PASS hérité. Une modification hors du scope de correction est refusée.
- `verify-v2-finalization.js` : les contrôles historiques NOT_EXECUTED restent conservés et identifiés comme références de la livraison précédente. VISUAL_APPROVED ne les transforme pas en tests exécutés.

Les deux scripts figés modifiés ont leurs blob OID exacts actualisés dans la politique d'écriture. Les autres lignes legacy et les 420 sujets historiques sont inchangés. Aucun workflow, aucune dépendance et aucune infrastructure ajoutés.

## Tests disponibles

Commande : `node --test tests/kodjo/vnext-*.pilot.js tests/kodjo/vnext12-*.pilot.js tests/kodjo/ui-e2e-finalization.pilot.js tests/kodjo/device-check-derogation.pilot.js`.

Résultat local final : **290 PASS, 0 FAIL, 0 SKIP**. Contrôles de workflows PASS, parseur YAML indépendant : 64 workflows acceptés. `git diff --check` PASS.

Les sept nouveaux tests de comportement exercent :

1. Critère conservé ciblant profilePhoto.ts hors scope de correction : tests frais, vraie CLI de revue puis vraie CLI de finalisation acceptées, sans élargissement du scope.
2. Modification réelle de ce fichier hors scope : refus ; remplacement sans exigence CHANGE : refus.
3. Régression indirecte via core.js dans un critère antérieurement conforme : un test Node réel échoue, APPROVE refusé et finalisation bloquée.
4. Auteur de preuve incorrect, liaison altérée et critère conservé supprimé : refus.
5. Assertions atomiques conservées : couverture de la revue de plan et finalisation cohérentes.
6. Critère réellement modifié nécessitant profilePhoto.ts : graph d'impact, plan et contrat UI produits par les vrais builders, autorisation explicite du fichier requise et remplacement de l'ancien critère vérifié.
7. Seconde correction : observation de la matrice complète, y compris critères hérités.

Les repositories temporaires, commentaires, approbations et rapports de revue sont des fixtures de test explicites. Ces tests ne constituent ni une revue Claude réelle, ni une validation utilisateur sur appareil. Le launcher modèle n'est pas invoqué. Les vérifications observées dans les fixtures sont reliées aux preuves de test par le vérificateur existant.

## Qualification et limites

La qualification du parent d29d59a1 est encore en cours au moment de la préparation : qualification VNext 37192561739 SUCCESS, drivers 37192561784 SUCCESS, pilote 37192561792 IN_PROGRESS (job Windows 111407940421). Aucun de ces résultats ne qualifie le présent candidat. Le contrôle `verifyWindow` existant interdit le déplacement de la branche de campagne pendant un run actif. La requête préparée demeure QUALIFY_ONLY ; publication effective puis qualification Linux/Windows du candidat exact avant toute nouvelle préparation ou exécution REVISION.

La politique choisie est simple et conservatrice : revue fraîche de tous les critères UI conservés, sans algorithme de sélection d'impact ou réutilisation automatique d'un ancien PASS. La conservation documentaire d'une dérogation SQLite ne qualifie pas SQLite. Une livraison non UI ne reçoit pas ici un mécanisme nouveau d'héritage de ses exigences. L'observation réelle via GitHub d'une livraison UI et sa correction n'a pas été exécutée dans cette campagne jetable non UI.

Les anciens INITIAL_PASS, demandes consommées et preuves historiques restent inchangés. Aucun ancien receipt n'est réutilisé pour le candidat. Après qualification, la préparation REVISION reste une vraie revue REVISE, une correction causale et une vraie revue APPROVE, puis un dossier/transport qualifié et une exécution réelle autorisée. L'étape 3 n'est pas déclarée terminée.

## Complément du même lot

Voir `2026-10-04_VNEXT_POST_ACCEPTANCE_REVISION_COVERAGE.md`. Le parent d29d59a1 a terminé SUCCESS ; le complément distingue explicitement la livraison déjà clôturable de la recette refusée avant clôture, et interdit une deliveryCorrection routée INITIAL. Il ajoute les reprises exactes des commentaires/gates et le contrôle de sources DECISION, sans revendiquer une qualification du parcours après recette. Le candidat e7dc6bab préparé précédemment est remplacé par le candidat consolidé ; il n’a pas été activé.
