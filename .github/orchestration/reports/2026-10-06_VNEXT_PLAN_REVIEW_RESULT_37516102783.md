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

### Construction des prescriptions du banc

Le protocole normatif n'a pas ajouté spontanément les trois prescriptions.
Le contrôleur compose le scénario de qualification dans
qualify-vnext-figma-real-path.js : DOCUMENT/DOCUMENTARY_STATES définissent
le comportement fictif ; QUALIFICATION_CONTRACT ajoute les contraintes de
test et de conservation. vnext-figma-recipe.build transforme ces entrées en
implementation_constraints, intentions, test_obligations et proof_obligations
du plan. Le texte Functional.EXPECTED fournit notamment les deux processus,
la sentinelle et la gestion des caches. Ce détail vient du banc, pas d'une
nouvelle exigence utilisateur ou produit.

La revue indépendante lit ce plan via vnext-live-chain. Claude propose les
findings et leur catégorie. Dans review-contract.js, isBlockingCategory
retourne true pour toute catégorie sauf SUGGESTION : PLAN_GAP devient donc
automatiquement bloquant et buildReviewReport en déduit REVISE. Ce classement
s'applique aussi à TECHNICAL_RISK : le finding de cache relève
exactement de cette catégorie, les deux autres de PLAN_GAP. La fonction
isBlockingCategory est identique dans c1ea9aef, avant l'optimisation b0bf7edf.
La règle de refus n'est donc pas nouvelle ; le plan enrichi et ses nouvelles
prescriptions techniques exposent de nouveaux motifs à cette règle existante.
Le driver exige APPROVE avant tout développement. Cette chaîne explique comment une
imprécision, même rédactionnelle ou hypothétique, produit un arrêt complet.
Le programme n'avait pas oublié comment lancer le test : ses instructions
transmises au reviewer/implémenteur ne décrivaient pas entièrement ce qu'il
exécutait déjà. Le nettoyage demandé découle d'une technique de preuve
introduite dans le banc au fil des corrections, pas du comportement produit.

L'accumulation de prescriptions techniques dans le banc augmente les motifs
possibles de refus. Les findings ne sont pas traités comme des autorisations
automatiques d'étendre le protocole : les demandes sont confrontées aux sources,
leur limite est notée pour le risque de cache, et les corrections restent locales
au scénario existant. Aucune catégorie de revue ni barrière générale n'est
supprimée/modifiée dans cette mission ; aucune exigence de navigateur ajoutée.

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

## Rectification du rappel des axes d'optimisation

L'utilisateur a fourni le 6 octobre à 21:35 Paris la capture
image(20261006-193444).png. Elle a été effectivement lue. Elle établit sept
axes ; le rappel précédent de quatre axes de transport/contexte était une
confusion avec un autre chantier. La liste de cette capture est la référence
de la présente comparaison, sans prétendre que chaque proposition a été
autorisée ou achevée simplement parce qu'elle figure dans le tableau.

| Axe de la capture | Mise en œuvre vérifiée |
| --- | --- |
| Ajouter des chronométrages | Profilage opt-in vnext-performance.js des opérations Git/contrats/copies, diagnostics de durée de revue. Appliqué ; les journaux de profilage ne sont pas forcés dans tous les jobs. |
| Régler le parallélisme | test-vnext.js accepte 1 à 32 ; mesures ciblées 1/2/4. Réglage optimal Windows non établi, non généralisé aux workflows qui lancent directement node --test. |
| Mettre en cache les téléchargements npm | Aucun cache npm dédié déclaré dans les workflows VNext observés. Le cache implicite de npm n'est pas une optimisation nouvelle livrée. |
| Regrouper les lectures Git | impact-graph/vnext-git-batch : lots bornés, empreintes vérifiées, benchmark équivalent. Appliqué dans b0bf7edf. Aucun défaut de ce lecteur identifié dans les échecs observés. |
| Mutualiser la base des fixtures | Pas de base Git préparée une fois puis réutilisée : les helpers créent encore un répertoire et un dépôt/copie par fixture. Partager un helper n'est pas mutualiser cette base. Non réalisé. |
| Séparer les jobs | Qualification, runtime Claude et historique séparés ; enchaînement contrôles → Claude → historique dans e72309a3, selon demande utilisateur. Appliqué. |
| Sélectionner les tests ou réutiliser des qualifications | Réutilisation d'une qualification réussie lorsque scripts/tests/workflows/policy/source gelée ont une empreinte identique ; sélection différentielle de tests selon les changements non mise en place. L'historique complet reste exigé après runtime réussi. |

Le pilote Figma, le navigateur ajouté dans b0bf7edf, les contrôles HTML et les
tests de provenance/conservation enrichis n'appartiennent pas à cette liste
d'optimisation. Le chantier Figma était distinct et autorisé séparément ;
l'ajout de navigateur/contrôles de rendu était une interprétation du contrôleur,
retirée à la demande explicite de l'utilisateur. Le lot b0bf7edf mélangeait
donc optimisation de lecture Git et autres modifications du parcours. La
compaction transport 4c304736 puis c6bbacad est aussi un chantier distinct :
la consigne impossible d'exécuter unpackUi avec Read/Glob/Grep venait de
c6bbacad, ensuite corrigée par reconstruction machine. Elle ne doit pas être
effacée de l'attribution sous prétexte que le scanner Git était équivalent.

Le dernier refus 37516102783 porte sur le plan enrichi de ce nouveau banc,
pas sur un mauvais contenu lu par le scanner. Les succès antérieurs du
parcours réel restent établis. Le nouveau pilote et ses preuves ont changé
ce qui était demandé : une réduction de durée à parcours inchangé ne peut
pas être revendiquée à partir de ce lot. Mes réponses antérieures confondaient
ces niveaux ; cette correction documentaire les distingue explicitement.

## Qualification exacte du correctif de plan

Candidat distant 67bafd3371e59f2d95c91f566d793c69346a825c,
arbre 068587337342c8496973633dc1e37beb98ed5129, parent
f776cf813dffd8800c7645cb4438e003562b6989. Run 37518686328,
create, tentative 1 : SUCCESS. Jobs Linux 112458131079 et Windows
112458131354 SUCCESS, 366 PASS / 0 FAIL / 0 SKIP chacun, artefacts
11439050499 et 11439465979 effectivement lus. Validation native
PowerShell 5.1 SUCCESS. Architecture-audit 112462082957 SKIPPED.
Preuve structurée dans evidence/37516102783/corrected-qualification.json.

Nouvelle demande FIGMA_INITIAL génération 65, request_id
4eb21d6a-feda-43ba-b4e5-b07f396b2af1, qualifiée sur ce candidat exact.
Le contrôleur ne change que rapport/preuves/checkpoint/demande ; l'empreinte
de code reste 4661dac776a0577274364128094b47ac13c71cfe22193aa7c86b7e3acf6e7090.
La publication et le run réel seront confirmés dans le suivi après leur lecture.
