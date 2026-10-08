# REVISION — constat valide rattaché au plan complet

Mission : diagnostic du run 37546076263, correction et relancement direct selon la demande permanente utilisateur. Branche protocol/vnext-proof-stability-20260930 ; départ local 532e0fd0c3c55b575b4556ebe29fd5f0c59874f2 ; contrôleur distant 1e1061f006cd3a2e9ed7c57beb4841305ec2a4bc.

## Diagnostic et histoire avant correction

Run completed/failure, job prepare-revision 112550332108. Artefact 11450527445, SHA-256 a788bb56bb3d99a06e6759a16f5d55dc828e18fea7a96b423a7e77575e1ba2e7. Arrêt BOUNDED_CORRECTION : VNEXT12_REVISION_REQUIRES_DIAGNOSIS. Claude a correctement produit REVISE sur l'erreur volontaire 3 au lieu de 2. Son unique constat PLAN_GAP cible PLAN_CONTRACT, cite exactement l'item et les deux CHG dans required_correction, et demande de conserver les tests et preuves attendus à 2. Les dépendances incluent l'item exact. Le contrat générique buildAllowedChangeSet accepte ce rattachement ; seul le driver de ce scénario refuse PLAN_CONTRACT.

Restriction déjà présente dans eccaf5c8f1d890af615bd58ce9bb556e8384dcc3 : refus de toute cible autorisée autre que PLAN_ITEM. f7350762ce44a593a9cc5c85e2f22d46c4f8ae74 distingue les dépendances probatoires des mutations mais n'accepte encore que le constat PLAN_ITEM. 4c3047368926f19af61a8260d4c56c9514ca9b2b ajoute TEST_GAP/TEST avec parent et CHG exacts ; PLAN_CONTRACT demeure refusé. Attribution démontrée à une limite héritée du driver, pas au correctif causal f7d6cbe3. Le compactage de revue existe dans le commit mixte 4c304736 mais aucune preuve ne démontre qu'il cause le choix PLAN_CONTRACT de Claude.

Succès historique comparable conservé : REVISION 36881458781 sur 3a931996 ; aucun succès récent du cycle complet. Run précédent 37543466873 a dépassé la correction et échoué à VERIFY_CAUSAL_OUTCOME, faute de documents causaux transmis à la seconde revue. Le nouveau run n'a pas atteint cette seconde revue : efficacité du correctif précédent encore non démontrée, pas invalidée. INITIAL 37538282108 ne remplace pas une preuve REVISION.

## Correctif prévu

Accepter le constat PLAN_GAP/PLAN_CONTRACT uniquement s'il cible le hash exact du plan, concerne le seul item du scénario, déclare cet item dans les dépendances, réentre en PLAN et cite les deux identifiants CHG exacts dans la correction. Conserver le constat original, les contrats d'autorisation et la correction limitée aux intentions du seul item. Tests, preuves, exigences, impacts et périmètre restent figés par completeRevision. Aucun verdict synthétique, nouvelle exigence ou nouveau contrôle du parcours générique.

Vérifier localement la correction contre les documents réels de cet échec, sans appel Claude ni suite jetable/qualification. Syntaxe et publication exacte à vérifier avant publication sélective avec lease. Relancer PREPARE_REVISION avec DIRECT_REAL_USER_REQUEST et identité neuve, sans navigateur, audit ou qualifications Linux/Windows. Le développement REVISION est une étape ultérieure au handoff, pas un succès acquis par cette préparation.

## Livraison

Code concerné : scripts/kodjo/prepare-vnext12-revision.js. Preuves complètes conservées dans reports/evidence/37546076263/revision-37546076263.zip. Aucun fichier applicatif modifié. Aucun contrôle sur appareil réel applicable. Résultat du parcours corrigé encore inconnu. Commit final et état Git fournis après livraison ; publication et relancement à consigner ci-dessous.

## Vérifications effectuées

La preuve historique revision/prepared.json conserve deux constats PLAN_ITEM/PLAN_GAP et une seconde revue APPROVE : le cas PLAN_CONTRACT n'était donc pas exercé par ce succès. Le reçu réel du nouveau run a été vérifié par Chain.verifyReceipt puis passé à deriveCorrection corrigé : PASS, une seule correction de l'item exact, intentions rétablies identiques au recipe de référence, constat original PLAN_CONTRACT conservé. Aucun modèle invoqué, aucun scénario jetable ni suite de qualification exécutés. Node --check et git diff --check PASS. Demande génération 70, préparation 18, UUID 96c44f96-b631-48d4-832e-24efafa497f0. Checkpoint 102 conserve l'échec terminal et indique que la transmission causale précédente n'a pas été atteinte.
