# KODJO VNext — Change Report F01 Remote Write Security

## Objet

Fermer le risque de sécurité F-01 identifié par l'audit indépendant de PR #250, sans modifier le protocole actif ni PRE-1.

Le risque traité est l'ajout possible d'une écriture distante dans un workflow exclu du scanner historique par son nom.

## Décision

VNext ne réutilise pas ce filtre de sécurité.

Le contrôle F-01 :

- inventorie tous les workflows sous `.github/workflows` indépendamment de leur nom ;
- inventorie tous les scripts exécutables sous `scripts/kodjo` ;
- fige les surfaces legacy existantes par Git blob OID exact pendant la coexistence ;
- exige une déclaration explicite pour tout nouveau writer VNext ;
- interdit les permissions write au niveau workflow pour les writers VNext ;
- bloque le cutover si l'attestation de sécurité des writers vaut FAIL ;
- exige le retrait des writers legacy après fermeture de la dernière slice legacy.

## Fichiers

Ajouts :
- `.github/orchestration/KODJO_VNEXT_REMOTE_WRITE_POLICY.json`
- `scripts/kodjo/lib/vnext-remote-write-security.js`
- `tests/kodjo/vnext-remote-write-security.pilot.js`

Modifications :
- `scripts/kodjo/lib/vnext-cutover-contract.js`
- `tests/kodjo/vnext-cutover-preparation.pilot.js`
- `.github/orchestration/KODJO_PROTOCOL_VNEXT_SPEC.md`
- `.github/orchestration/KODJO_VNEXT_ANTI_REGRESSION_MATRIX.md`

Aucun workflow actif n'est modifié.

## Politique transitoire legacy

La policy fige exactement les surfaces présentes au HEAD VNext-11 qualifié :

- 62 workflows ;
- 108 scripts legacy figés après exclusion des contrats canoniques VNext destinés à évoluer.

Le mode figé n'autorise aucune modification de ces fichiers.

Un changement de blob produit :
`VNEXT_REMOTE_WRITE_FROZEN_PRODUCER_DRIFT`

## Writers VNext

Un futur writer VNext doit déclarer :

- producer ;
- producer_blob_oid ;
- authorization_condition ;
- required_job ;
- capability ;
- destination ;
- scope.

Une permission write au niveau workflow est interdite.

## Tests

Le test `vnext-remote-write-security.pilot.js` vérifie :

1. scan réel du dépôt sans filtre de préfixe ;
2. workflow arbitrairement nommé avec write → FAIL ;
3. script appelé avec git push → FAIL ;
4. REST repository write non déclaré → FAIL ;
5. legacy exact accepté uniquement tant qu'une slice legacy est ACTIVE ;
6. ajout d'une écriture à un legacy figé → FAIL ;
7. writer VNext déclaré précisément → PASS ;
8. permission write workflow-level VNext → FAIL.

Le test de cutover vérifie en plus :

9. dernière slice legacy CLOSED + writers legacy encore présents → cutover bloqué.

## Relation à F-01

Avant retrait legacy :
`PASS_WITH_FROZEN_LEGACY`

Après retrait complet :
`PASS_RETIRED`

F-01 n'est considéré sans objet qu'au second état.

## Limite assumée

Le scanner est statique.

Il ne promet pas la détection universelle de code arbitraire ou obfusqué. La sécurité repose donc sur la combinaison :

- inventaire transversal ;
- empreinte exacte des surfaces legacy ;
- déclarations fermées des writers VNext ;
- permissions job-level ;
- credentials bornés ;
- tests négatifs ;
- retrait effectif des anciens workflows writers.

## Gate

Résultat attendu après qualification :

`F01_REMOTE_WRITE_READY`

Ce gate est requis avant VNext-12.
