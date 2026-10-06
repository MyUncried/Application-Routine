# VNext — refus de plan du run 37516102783

## Mission et périmètre

Diagnostiquer l'échec réel après audit de stabilisation, comparer son origine
à l'historique, corriger les lacunes confirmées et reprendre le parcours
autorisé. Branche protocol/vnext-proof-stability-20260930, départ local
2071c286a4f93d8498486a11f145ecf0f8095170 ; contrôleur distant effectif
f776cf813dffd8800c7645cb4438e003562b6989, code qualifié
0fb8ad80703c4dc86caa1dd2e011e1a17a821c2c. Banc jetable tâche 2 seulement,
sans app/Expo, PRE-1, cutover, navigateur, contrôle de rendu ni validation
visuelle humaine. Pas de nouvel audit global.

## Résultat observé et cause de l'arrêt

Run 37516102783, tentative 1 : FAILED, 19:03:43 à 19:12:49 UTC.
select-stage et admission des contrôles : SUCCESS. Le premier appel Claude
de revue du plan termine normalement, status 0, signal null, error null,
458017 ms, session ecec6b9a-b909-4859-acde-b879ba0406ea. Verdict REVISE,
trois findings bloquants ; validateReceipt refuse donc l'implémentation avec
VNEXT_LIVE_REVIEW_NOT_APPROVED. Ni implémentation ni tests historiques lancés.
Le mécanisme de refus fonctionne ; le plan du banc reste insuffisant pour
la revue. Il ne s'agit pas d'un timeout, d'un quota, d'un navigateur ou d'une
régression démontrée du comportement produit.

Artefact 11437855977, ZIP 2237086 octets, SHA256
6124b844a0deabe44b51ea9009cc1f08dc823afe1355d48fb9716e53237e65e9.
Rapport original, réponse, diagnostic de processus et statut conservés dans
evidence/37516102783 sans réécriture du verdict. Le code jetable est resté
au commit de départ 947f5a90b27db2f358e161548194c7e9a8c0f1d7 ; bundle
et hashes de conservation disponibles dans le statut. Aucun développement
Claude effectué dans ce run.

## Confrontation des trois findings et origine historique

| Finding | Diagnostic vérifié | Origine et correction |
| --- | --- | --- |
| FND-d3a05326e66f7e485dfd3017 | Le plan dit « delivered Node test » mais n'explicite pas la commande depuis la racine, les seuls modules natifs autorisés et les statuts de sortie. Le driver exécute déjà le bon processus. | L'énoncé est présent dans f15aa64e lors du retrait complet du navigateur ; il est resté inchangé dans fb87a0e5 et 4e5e0c6e. Clarifier le contrat du banc dans les contraintes du plan : node tests/ui.test.js, sans dépendance installée/framework, succès 0, échec non zéro. |
| FND-fe639e4adb8c69f13ad0b523 | La recette ajoute un fragment sans sujet après une obligation devenue un paragraphe de plusieurs phrases. Défaut rédactionnel réel du plan produit, pas défaut d'exécution. | La suffixation « against the implementation » existe depuis c1ea9aef, avant optimisation b0bf7edf. La formulation détaillée des obligations est modifiée par f15aa64e puis centralisée dans fb87a0e5. Remplacer la concaténation par une instruction complète suivie des obligations. 4e5e0c6e n'a pas modifié cette ligne. |
| FND-8ba362983ba711c8afcce7a7 | L'objet partagé temporaire conserve le sentinel après la substitution, mais les anciens modules en cache sont restaurés et le processus isolé termine. Aucun faux PASS ni pollution persistante démontré. Le finding décrit une exposition en cas de réutilisation/reordonnancement, pas un échec réellement exécuté. | La clause de restauration existe déjà dans f15aa64e ; la clause exacte et le probe centralisé viennent de fb87a0e5. Clarifier et restaurer aussi la valeur originale dans l'objet temporaire, y compris après une assertion échouée ; garder la restauration des caches dans finally. Ne pas ajouter de contrôle produit. |

Ces lacunes ne sont donc pas toutes apparues dans la dernière correction,
et ne peuvent pas être imputées globalement à l'optimisation b0bf7edf.
La complexification des obligations de conservation dans les corrections
du banc contribue à la difficulté du plan. Les succès génériques INITIAL
37115247745 / 08cb8b93 et REVISION 36881458781 / 3a931996 ne constituaient
pas des preuves du nouveau plan Figma. Le précédent pilote Figma
37491799216 avait déjà été refusé en plan. La comparaison n'emploie pas
ces parcours différents comme preuve que ce plan particulier fonctionnait.

L'audit indépendant 37501814430 a lu le code, mais n'a pas repéré ces
lacunes du plan effectif. Il n'avait pas de dossier généré complet sous les
yeux. La génération déterministe effectuée ensuite validait les contraintes
machine, pas l'approbation sémantique par Claude. Les 364 tests précédents
ne garantissaient pas cette approbation ; leur succès ne clôturait pas la
tâche 2. Cette limite n'est pas cachée par une modification du reviewer.

## Corrections et vérifications

Trois fichiers producteurs corrigés :
- scripts/kodjo/lib/vnext-disposable-functional-contract.js : texte cohérent
  et restauration du shared.Existing exact avant restauration des caches ;
- scripts/kodjo/lib/vnext-figma-recipe.js : instruction de test complète,
  suivie séparément des obligations ;
- scripts/kodjo/qualify-vnext-figma-real-path.js : invocation, dépendances
  autorisées et signal d'échec explicités dans le plan du banc.

tests/kodjo/vnext-functional-coherence.pilot.js vérifie le plan généré et
ajoute deux tests de restauration effective sur succès et échec du sentinel.
Ils échoueraient sans la restauration ajoutée ; ce sont des contrôles de
comportement, pas seulement une copie de la formulation.

Tests ciblés : 26 PASS / 0 FAIL. Suite locale complète :
366 PASS / 0 FAIL / 0 SKIP, 33220,992522 ms. Patch whitespace PASS.
Référence complète régénérée depuis les mêmes 222 nœuds et 8425 dispositions
Figma : PASS déterministe, deux scénarios, deux obligations de conservation,
zéro mesure, zéro appel modèle. Source gelée SHA256 inchangée
6b0078efc3ee019fd4c7fc7bbbb12b6db83cd35cf2b66cd89fd7b9cf1b164f45,
plan SHA256 bae4332c6180fe6ead8271d45f773d5bcbff9e909a876cdbf8df91e57fefac27.
Plan et dossier effectivement lus : commande, remise en état et instruction
complète présents ; fragment orphelin absent. Résultats dans
evidence/37516102783/corrected-reference-result.json et corrected-functional-test.json.

Le nouveau code exige une qualification Linux/Windows exacte avant admission.
Elle ne comprend pas de second audit global. Le parcours réel sera demandé
avec une nouvelle identité après succès, puis les tests historiques seulement
si Claude réussit. Il n'est pas déclaré réussi avant observation effective.
Restent hors scope : performance globale, produit, appareils réels et visuel.
Les SHA de livraison, résultat distant, identité de relance et état Git final
seront consignés dans le suivi et la réponse finale après publication vérifiée.
