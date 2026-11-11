# 2026-11-10 — CATALOGUE-AUTONOME — Décisions de provenance et préparation de CA-3

## Identifiant et objectif

- **CATALOGUE-AUTONOME** : intégrer les deux décisions de Hermann du 10/11 (propriétaire, provenance) au modèle et aux contrôles, puis préparer CA-3 (registre d'installation et moteur de chargement), sans le développer.
- Décision, verbatim :
  > « 1. Propriétaire : conserver « Inconnu » pour les 60 fiches. ANKUSHA peut être identifié comme gestionnaire administratif du catalogue pilote, mais pas comme propriétaire ou titulaire des droits des fiches sans justification. L'absence de propriétaire reste non bloquante pour les tests privés, mais doit être signalée et prise en compte avant toute publication. Formalise explicitement ce cas dans le modèle de provenance, sans attribuer d'identité fictive.
  > 2. Provenance : je valide EXTERNAL_IMPORTED, avec le classeur Excel du 27/10/2026 comme source d'import. Conserve également les références documentaires originales de chaque fiche, distinctes de la source d'import et des informations de propriété intellectuelle. Les 60 fiches restent PRIVATE et DRAFT, sans autorisation de publication.
  > Ces décisions doivent être intégrées au modèle et aux contrôles concernés, avec modification minimale et sans conséquence sur PRE-10. Tu peux poursuivre la préparation de CA-3 sur cette base, sans build, OTA ni fusion dans main. »

## Branche et commit de départ

- `catalogue/integration-60-main-20261109`, worktree `C:/Dev/KODJO-CAT60-MAIN`.
- Départ : `58588d14` (livraison CA-1 et CA-2).

## Périmètre demandé / traité

- **Traité** :
  1. propriétaire inconnu formalisé dans `MovementEditorialProvenance` ;
  2. gestionnaire administratif du catalogue ajouté au format ;
  3. contrôles de publication ;
  4. provenance des 60 fiches vérifiée par test ;
  5. spécifications mises à jour ;
  6. préparation détaillée de CA-3 (§ « Préparation de CA-3 » ci-dessous).
- **Non traité** : aucun code de CA-3 à CA-6. Aucune build, aucune OTA, aucune fusion dans `main`, rien sur PRE-10.

## Modifications réalisées (modification minimale)

### Modèle de provenance (`MovementEditorialProvenance.ts`)

- `owner: EditorialActorRef | null`. `null` = propriétaire **inconnu déclaré** ; aucune identité fictive.
- Validateur :
  - champ omis → `REQUIRED` (l'inconnu se déclare, il ne s'omet pas) ;
  - `null` admis avec `visibility: PRIVATE` ;
  - `null` avec `UNLISTED` ou `PUBLIC` → `INCONSISTENT`.
- `hasUnknownOwner(record)` : prédicat explicite, à utiliser par toute future étape de publication.

### Format v1 (`MovementCatalogueFile.ts`)

- Le contournement local du contrôle du propriétaire est supprimé : le format s'appuie désormais directement sur le validateur de provenance.
- `catalogue.manager` (gestionnaire administratif, toujours déclaré, `null` admis) : tient le fichier, n'est ni propriétaire ni ayant droit des fiches.
- Contrôles de publication :
  - fiche à propriétaire inconnu avec `validation.publicationAllowed: true` → `INCONSISTENT` (`UNKNOWN_OWNER`) ;
  - catalogue à propriétaire inconnu avec `publicationAllowed: true` → `INCONSISTENT`.
- Le signalement non bloquant `UNKNOWN_OWNER` est conservé.
- Commentaire de type : `sources.documentary` = référence documentaire originale, distincte de `provenance.upstream` (source d'import) et des informations de propriété intellectuelle.

### Fichier pilote

- Seul ajout : `catalogue.manager = { kind: "ORGANIZATION", id: "ankusha" }` (constante `PILOT_CATALOGUE_MANAGER` du convertisseur), 4 lignes.
- Inchangés et vérifiés par test pour les 60 fiches :
  - `owner`, `rightsHolder` et `license` : `null` ;
  - `EXTERNAL_IMPORTED`, avec pour `upstream` le classeur `KODJO_Catalogue_reeducation_fitness_60_fiches.xlsx`, la fiche d'origine et la révision `2026-10-27` ;
  - `PRIVATE`, `DRAFT`, `publicationAllowed: false` ;
  - `sources.documentary` égal à la référence documentaire du corpus (18 sources distinctes : AAOS, NHS, Pilates Anytime…), en HTTPS et distinct de la source d'import.

## Synchronisation code / documentation

Classe **B** (décision explicite de Hermann du 10/11).

- `docs/KODJO-Provenance-propriete-fiches-mouvements-2026-11-06.md` :
  - cardinalité de `owner` annotée (texte d'origine conservé) ;
  - nouveau § 7 bis, qui recopie la décision et en tire six règles.
- `docs/KODJO-Format-catalogue-mouvements-v1.md` :
  - structure (`manager`) ;
  - règles du propriétaire inconnu et du gestionnaire ;
  - section « Catalogue pilote — décisions du 10/11/2026 ».
- Plan, révision 2 : point ouvert n° 1 annoté comme résolu.
- Hors de cette branche : les chapitres 01 et 04 à 13, ainsi que `PRODUCT.md` et `INDEX.md` (cf. rapport CA-1/CA-2, « Hors périmètre »).

## Preuves et tests

| Commande | Résultat |
|---|---|
| `npx jest --runInBand src/domain/catalogue tools/catalogue` | PASS, 50 tests (provenance 9, format 29, conversion 11) — +4 tests |
| Importeur actuel, commande, Catalogue, repository Mouvement, migrations, schéma, catalogue (23 suites) | PASS, 304 tests |
| `npx tsc --noEmit` | OK |
| `npx eslint src/domain/catalogue tools/catalogue` | OK |
| Reproductibilité : fichier versionné = conversion | PASS |

Nouveaux cas testés :
- propriétaire inconnu :
  - admis en privé ;
  - refusé en `UNLISTED` ou `PUBLIC` ;
  - refusé s'il est omis ;
  - refusé avec une autorisation de publication, au niveau de la fiche comme du catalogue ;
- gestionnaire administratif :
  - exigé et validé ;
  - distinct du propriétaire ;
- décisions du 10/11 sur les 60 fiches.

## Préparation de CA-3 — registre d'installation et moteur de chargement

Il s'agit d'une conception destinée à la validation : **aucun code n'est écrit**. Elle précise le § 5 du plan (révision 2), qui reste la référence pour la classification.

### Réemploi

| Besoin | Mécanisme existant réemployé |
|---|---|
| Ouverture de la base distincte | `openExpoDatabase(name)` et `STANDARD_PRAGMAS` (`src/infrastructure/database/ExpoDatabase.ts`) |
| Écriture des Mouvements | `MovementCatalogueService.createIndependent`, `update`, `isArchived` et `listEntries` : mêmes règles que les écrans |
| Relecture fiable | Relecture dans la transaction (correctif `2631c322` / PR #436) |
| Identifiant de Mouvement | `Crypto.randomUUID()`, comme `MovementScreen` |
| Nom et Zones | `normalizeMovementName` ; Zones comparées comme ensemble (`sameZones` de l'importeur actuel) |
| Validation, projection, empreinte | `parseMovementCatalogueFile`, `projectSheetToMovement`, `sheetFingerprint` (CA-1) |
| Tests SQLite | `NodeSqliteDatabase` et le double « connexion principale en retard » (`staleMainConnectionAfterCommit`) |

Aucune dépendance nouvelle et aucune migration du schéma principal : `DATABASE_VERSION` reste à 23, sans collision avec PRE-10 (24).

### Découpage du code (trois unités)

1. **`src/domain/catalogue/catalogueLoadPlan.ts`** — classification pure, sans E/S.
   - Signature : `planCatalogueLoad(file, registry, localMovements, localReferentials) → LoadPlan`.
   - Le plan contient une entrée par fiche, avec son cas (§ 5), la décision proposée par défaut et, en cas de conflit, le détail champ par champ.
   - Elle est testable de façon exhaustive.
2. **`src/infrastructure/catalogue/SqliteCatalogueRegistry.ts`** — le registre, dans une base distincte et provisoire `kodjo-catalogue-registry.db`.
3. **`src/features/catalogue/applyCatalogueLoad.ts`** — exécute les décisions retenues : écrit les Mouvements par le service, puis le registre.

### Schéma du registre (base distincte, `PRAGMA user_version = 1`)

```text
installed_sheets
  catalogue_id, sheet_id                  PK
  movement_id                             UNIQUE
  state                                   PENDING | INSTALLED
  installed_revision, installed_fingerprint
  installed_sheet_json                    instantané éditorial complet (B), provenance comprise
  installed_projection_json               Projection(B)
  installed_at, updated_at

sheet_decisions
  catalogue_id, sheet_id, revision        PK
  decision                                REFUSED | DEFERRED
  decided_at

saved_local_values
  catalogue_id, sheet_id, revision, field PK
  value_json, saved_at                    valeur personnelle sauvegardée avant tout écrasement choisi
```

- Le registre ne copie jamais le Mouvement : la valeur locale actuelle (L) est relue dans la base principale à chaque chargement.
- La provenance de la copie installée est **dérivée**, pas inventée :
  - `origin: CATALOGUE_INSTALLED` ;
  - `upstream = (catalogue.id, sheetId, installed_revision)` ;
  - le propriétaire, les auteurs et les droits restent ceux de l'instantané. Pour le pilote, le propriétaire reste **inconnu**.

### Ordre d'écriture entre deux bases (pas de transaction commune)

Pour l'installation d'une fiche nouvelle :
1. Écrire le registre `PENDING`, avec le `movement_id` choisi et B.
2. Créer le Mouvement par `createIndependent`.
3. Passer le registre à `INSTALLED`.

Reprise au chargement suivant :
- `PENDING` avec un Mouvement présent et égal à la projection → finalisé ;
- `PENDING` sans Mouvement → nouvelle tentative avec le même identifiant ;
- `PENDING` avec un Mouvement différent → « à rapprocher ».

Pour une révision acceptée, l'ordre est le même. Les valeurs locales écrasées sont d'abord sauvegardées dans `saved_local_values`.

Ainsi, une interruption ne produit ni doublon ni conflit de nom au chargement suivant. C'est la leçon de l'incident « could not be read back ».

### Règles de chargement complétant le § 5

- **Rapprochement initial** (aucune ligne au registre) :
  - si un Mouvement local porte un identifiant de `install.knownLocalMovementIds` et égale Projection(R) → **adopté** : registre seul, aucune écriture sur le Mouvement ;
  - s'il diffère → **à rapprocher**, sans écriture.
  - Pilote attendu : **60 adoptés, 0 écriture**.
- **Mise à jour d'un Mouvement** : seuls les champs projetés (nom, alias, étapes encodées, Catégorie, Zones) sont fusionnés sur L. Médias, phases, groupe de niveaux et archivage locaux sont conservés.
- **Référentiels du téléphone** : une Catégorie ou une Zone de la fiche absente du téléphone écarte la fiche, avec un signalement (`LOCAL_REFERENCE_MISSING`). Rien n'est créé implicitement.
- **Mouvement archivé** (`isArchived`) ou supprimé : la fiche est « retirée localement » ; elle n'est ni réinstallée ni modifiée.
- **Propriétaire inconnu** : sans effet sur un chargement privé. Le statut et le propriétaire sont conservés tels quels dans B, pour la future étape de publication (`hasUnknownOwner`).
- **Fichier invalide** : le validateur CA-1 refuse le fichier entier, avant tout plan.
- **Fiche invalide pour le téléphone** (conflit de nom, référentiel absent) : seule cette fiche est écartée ; les autres continuent.

### Tests prévus pour CA-3

- **Classification pure** : un test par ligne du tableau du § 5, plus le rapprochement initial, le conflit champ par champ, l'archivage et les référentiels absents.
- **SQLite réelle (`NodeSqliteDatabase`)**, sur les deux bases :
  - pilote sur une base contenant les 60 : 60 adoptés, 0 écriture ;
  - rechargement : aucune écriture ;
  - fichier édité (une fiche modifiée, une fiche créée dans le fichier) ;
  - accepter, refuser, reporter ;
  - modification personnelle préservée ;
  - interruption entre le Mouvement et le registre (`PENDING`), puis reprise ;
  - perte du registre : « à rapprocher », sans écriture ;
  - connexion principale en retard.
- **Non-régression** : importeur actuel, service Catalogue, migrations.

### Points à valider avant de développer CA-3

1. **Nom de la base distincte** `kodjo-catalogue-registry.db`, provisoire, à intégrer au schéma principal après PRE-10. Elle n'existe que dans la variante « Routine Catalogue » tant que CA-4 n'est pas livré.
2. **Décision par défaut en cas de conflit** : la valeur locale est conservée et la révision est « reportée ». Le refus et l'écrasement exigent un choix explicite (CA-4).
3. **Granularité de l'acceptation d'une révision** : par fiche, avec un détail champ par champ seulement en cas de conflit. L'acceptation champ par champ hors conflit est jugée non nécessaire.

## Hypothèses non démontrées

- La reconnaissance des 60 Mouvements sur l'iPhone reste démontrée par égalité de projection, et non par un chargement réel (CA-3 et CA-6).

## Hors périmètre / non corrigé

- CA-3 à CA-6 : code non écrit.
- Annotations des chapitres de spécification de l'ancienne pile (cf. rapport CA-1/CA-2).
- Validateur de l'administration Web OVH : non modifié. Il ne connaît pas encore `manager` ni la règle du propriétaire inconnu ; ce sera une évolution future.
- PR #436 : toujours en attente de la validation de la build `6987d086` sur iPhone.

## Vérifications restant à faire sur appareil réel

- Aucune pour cette livraison, qui n'a aucun effet sur l'application. Les vérifications sur iPhone viendront avec CA-6.

## Fichiers modifiés

- `src/domain/catalogue/MovementEditorialProvenance.ts`
- `src/domain/catalogue/__tests__/MovementEditorialProvenance.test.ts`
- `src/domain/catalogue/MovementCatalogueFile.ts`
- `src/domain/catalogue/__tests__/MovementCatalogueFile.test.ts`
- `tools/catalogue/convertPilotCorpus.ts`
- `tools/catalogue/__tests__/convertPilotCorpus.test.ts`
- `catalogue/catalogues/kodjo-pilote-60.catalogue.json` (ajout de `catalogue.manager`)
- `docs/KODJO-Provenance-propriete-fiches-mouvements-2026-11-06.md`
- `docs/KODJO-Format-catalogue-mouvements-v1.md`
- `.github/orchestration/reports/2026-11-10_CATALOGUE-AUTONOME-PLAN.md`
- `.github/orchestration/reports/2026-11-10_CATALOGUE-AUTONOME-PROVENANCE-CA3-PREPARATION.md`

## Commit final et état Git

Commit unique, poussé sur `catalogue/integration-60-main-20261109`, contenant ce rapport ; hash et CI communiqués dans le compte rendu de session. Aucune modification de PRE-10, aucune build, aucune OTA, aucune fusion dans `main`.
