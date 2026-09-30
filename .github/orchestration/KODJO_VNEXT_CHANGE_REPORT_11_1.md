# KODJO VNext — Change Report VNext-11.1

## Objet

Traiter le risque F-01 MAJOR non bloquant de l’audit indépendant de la PR #250 sans modifier PRE-1 ni le protocole actif.

Source F-01 : audit indépendant run `36688649888`.

## Évidence de départ

Sur `main` après fusion de #250 :

- HEAD observé : `5b4e811a779239e057faf7f70c763c80ad6327fe` ;
- `.github/workflows/kodjo-slice-finalize.yml` blob : `25515494f5dc2dbe6a98b61bf6849366361cc59e` ;
- permission workflow-level `contents: write` ;
- écriture REST vers `.github/orchestration/v2-activation-registry.json` ;
- `scan-remote-write-capability.js` conserve le filtre `^kodjo-v2-.*` pour les workflows.

Le risque F-01 est donc réel sur le legacy actuel.

## Mécanisme ajouté

Nouveau module :

`scripts/kodjo/lib/vnext-remote-write-policy.js`

Nouveau registre :

`.github/orchestration/KODJO_VNEXT_REMOTE_WRITE_POLICY.json`

Contrats :

- `kodjo.vnext.remote-write-policy.v1`
- `kodjo.vnext.remote-write-report.v1`
- `kodjo.vnext.remote-write-gate.v1`

### Inventaire

Le scanner VNext inspecte tous les fichiers exécutables sous :

- `.github/workflows`
- `.github/actions`
- `scripts/kodjo`

sans sélection par préfixe de workflow.

### Déclaration

Chaque écriture autorisée est liée à :

- producteur exact ;
- blob Git exact ;
- type de capacité ;
- destination ;
- conditions ;
- scope de permission.

Une modification du fichier producteur invalide sa déclaration.

### Least privilege

Un writer de production VNext :

- ne peut déclarer une permission GitHub d’écriture qu’au niveau JOB ;
- ne peut utiliser `persist-credentials: true`.

### Legacy

Le writer F-01 de `kodjo-slice-finalize.yml` est explicitement déclaré `LEGACY_GRANDFATHERED`.

Il doit être retiré quand aucune slice legacy n’est encore active.

### Qualification

Le transport Lean Queue actuel est déclaré `QUALIFICATION`, pas `VNEXT`.

Il peut servir à VNext-12 pour l’E2E jetable, mais sa présence bloque un cutover de production.

## Cutover

Le CutoverPlan est désormais lié à :

- RemoteWriteGate ;
- RemoteWriteReport ;
- RemoteWritePolicy.

L’activation exige :

`REMOTE_WRITE_CONTROL_READY`

Une preuve re-signée ou divergente est refusée.

Un writer `QUALIFICATION` produit :

`BLOCKED_QUALIFICATION_WRITER_PRESENT`

Un writer legacy restant sans slice legacy active produit :

`BLOCKED_LEGACY_WRITERS_NOT_RETIRED`

## Tests ajoutés

`tests/kodjo/vnext-remote-write-security.pilot.js`

Cas couverts :

- workflow arbitrairement nommé ;
- writer déclaré accepté ;
- élargissement JOB → WORKFLOW refusé ;
- REST non déclaré refusé ;
- ajout à un producteur déjà déclaré refusé ;
- credentials Git inventoriés ;
- legacy grandfathered tant qu’une slice legacy est active ;
- legacy résiduel sans slice active bloque ;
- qualification writer bloque le cutover ;
- production VNext workflow-level refusée ;
- `persist-credentials:true` production refusé.

Le test VNext-10 du cutover est étendu afin d’exiger la preuve remote-write exacte.

## Ce que ce lot ne prétend pas

La détection statique ne prouve pas l’absence de tout code arbitraire capable d’écrire.

Le lot ne modifie aucun workflow actif et ne retire aucun workflow legacy.

F-01 ne sera déclaré sans objet qu’après :

1. VNext-12 E2E réel ;
2. writer VNext de production least-privilege qualifié ;
3. fermeture des slices legacy grandfathered ;
4. retrait de leurs writers/triggers/recovery ;
5. scan final `LEGACY_WRITERS_RETIRED`.

## Hors périmètre

- aucune modification PRE-1 ;
- aucune modification des workflows actifs ;
- aucun audit indépendant lancé ;
- aucune activation VNext ;
- aucun retrait legacy avant fermeture de ses slices.
