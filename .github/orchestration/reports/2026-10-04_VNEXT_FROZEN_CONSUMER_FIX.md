# VNext — raccordement du consommateur de revue isolé

Le 4 octobre 2026, sur le candidat `dae652cfc31bdc7f36a2be604fc3ef16bb118b50`, le pilote [37195843101](https://github.com/MyUncried/Application-Routine/actions/runs/37195843101) échoue au test F12 du consommateur isolé. Le journal du job 111417406700 constate `Cannot find module './lib/vnext-delivery-preservation'`. Le workflow copie le validateur avant le checkout applicatif, mais n'a pas ajouté à cette copie les deux modules internes nécessaires depuis le correctif de conservation des critères livrés.

Les archives de diagnostic du run [37195843037](https://github.com/MyUncried/Application-Routine/actions/runs/37195843037) ont été téléchargées et leurs SHA256 vérifiés contre les empreintes GitHub. Linux (artefact 11301405976 : 998 PASS, 1 FAIL, 1 SKIP) et Windows (11301481378 : 996 PASS, 1 FAIL, 3 SKIP) échouent chacun sur ce même test F12. La qualification historique globale refuse donc correctement l'exécution incomplète. Le run drivers [37195843078](https://github.com/MyUncried/Application-Routine/actions/runs/37195843078) réussit, sans exécution Claude INITIAL/REVISION.

## Correction minimale

Dans `.github/workflows/kodjo-slice-implementation-review.yml`, étape `Freeze criterion review validator before application checkout`, copier également `lib/vnext-delivery-preservation.js` et `lib/vnext-contract.js`. Le validateur reste issu du protocole qualifié, isolé des anciens scripts du checkout applicatif. Cette correction du consommateur partagé n'ajoute aucun paquet, ne change aucune règle V2, aucune décision PRE-2 ni aucun gate d'approbation. La politique d'écriture est actualisée uniquement pour l'exact blob OID de ce workflow. Les sources des tests historiques et les 420 sujets/protections restent inchangés.

Ajouter un test VNext de comportement : construire un plan avec critères/assertions conservés, copier les fichiers effectivement déclarés dans le workflow, placer un ancien validateur volontairement inutilisable dans le checkout applicatif, puis appeler les vrais CLI `prepare` et `validate` du runtime isolé. Le test vérifie la conservation des critères et le verdict de la fixture. Il ne prétend pas à une revue indépendante réelle.

## Vérification et limites

- Suite pilote complète locale : **1001 tests, 996 PASS, 0 FAIL, 5 SKIP**. Trois contrôles PowerShell sont réservés à la CI native ; un scénario historique nécessite des métadonnées Git absentes de cette récupération locale ; un SKIP de nettoyage est préexistant.
- Suite de conservation des critères, incluant le nouveau test isolé : **8 PASS, 0 FAIL, 0 SKIP**.
- Syntaxe des **64 workflows** et invariants exécutables validés ; politique d'écriture sans findings ; correspondance historique de 420 sujets préservée.
- La qualification externe du candidat corrigé reste **PENDING** jusqu'aux vrais résultats Linux/Windows. Aucun INITIAL ou REVISION réel du nouveau candidat n'est revendiqué.

Les extraits structurés réels des deux artefacts échoués, leurs empreintes ZIP/contenu et les résultats locaux figurent dans `../vnext12/VNEXT-12-QUALIF/v8-consolidation/frozen-consumer-fix-evidence.json`. Les échecs antérieurs ne sont ni effacés ni transformés en succès.

La révision complète après recette reste une évolution distincte à intégrer ensuite dans la campagne existante : origine recette opposable au HEAD livré, baseline avant clôture et liaison causale distincte de l'ancienne revue APPROVE. Sa conception et son parcours positif complet ne sont pas remplacés par les tests de ce correctif de copie.
