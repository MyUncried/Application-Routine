# KODJO — Format de catalogue autonome de Mouvements `KODJO_MOVEMENT_CATALOGUE` v1

**Date :** 10 novembre 2026. **Statut :** format de données technique (tranche CA-1) ; aucun chargement dans l'application à ce stade (CA-3 à CA-6 non développés).
**Décision :** Hermann, 10/11/2026 — catalogue autonome (option A), compatible avec un futur téléchargement depuis OVH (option B) sans changer le modèle de données ; plan `.github/orchestration/reports/2026-11-10_CATALOGUE-AUTONOME-PLAN.md` (révision 2).
**[11/11/2026 — version courante : v2 `2.0.0`, voir § 10. La v1 décrite ci-dessous reste relue et convertie ; le nom du fichier de spécification est conservé pour préserver les liens.]**
**Code :** `src/domain/catalogue/MovementCatalogueFile.ts` (types, validateur, projection, empreinte) ; modèle de provenance réemployé `src/domain/catalogue/MovementEditorialProvenance.ts` ; spécification de provenance `docs/KODJO-Provenance-propriete-fiches-mouvements-2026-11-06.md`.

## 1. Rôle

Le fichier catalogue est **la source éditable** des fiches de Mouvements.
- Il se suffit à lui-même : aucune fiche, aucun préclassement ni aucune valeur par défaut n'est embarqué dans le code.
- Une nouvelle fiche s'ajoute en l'écrivant dans le fichier, sans code ni build.
- Le même fichier pourra être sélectionné sur l'appareil (option A) ou téléchargé (option B).

Le fichier pilote `catalogue/catalogues/kodjo-pilote-60.catalogue.json` provient d'une **conversion initiale à usage unique** (`tools/catalogue/convertPilotCorpus.ts`, tranche CA-2). Depuis cette conversion, c'est lui qui fait foi.

## 2. Identités

| Identité | Rôle |
|---|---|
| `catalogue.id` | Catalogue d'origine |
| `sheetId` | Fiche éditoriale : unique dans son catalogue, immuable, indépendante du titre. L'identité globale d'une fiche est le couple (`catalogue.id`, `sheetId`). |
| `Movement.id` | Mouvement local, attribué à l'installation ; jamais porté par le fichier comme identité |
| `install.knownLocalMovementIds` | Identifiants locaux sous lesquels la fiche a déjà pu être installée par un mécanisme antérieur. Pour le pilote : `pilot:<sheetId>`, ce qui permet de reconnaître les 60 Mouvements déjà installés. |

## 3. Structure

```text
format = "KODJO_MOVEMENT_CATALOGUE", formatVersion = "1.0.0"   [11/11/2026 : v2 "2.0.0" ajoute libraries[], § 10]
catalogue    { id, title, revision, owner|null, manager|null, publisher|null, publicationAllowed, notes[] }
references   { categories[], bodyZones[], specialties[], gesturalFamilies[], clinicalProblems[], anatomicalTargets[] }
               entrée { id, label, kind|null, status|null } — ordre = ordre d'affichage
glossary[]   { id, term, definition, synonyms[], relatedSheetIds[] } — ordonné
sheets[]     fiche éditoriale complète :
  sheetId, revision, history[] { revision, date, author|null, summary }
  provenance   { gestureId, origin, upstream, owner|null, authors[], publisher, rightsHolder, license,   [v2 : author|null, MOUV-D1]
                 reviewStatus, visibility }                       ← MovementEditorialProvenance
  content      { name, aliases[] (ordonnés), startingPosition, equipment, steps[] (ordonnées),
                 safetyNotes, notes }
  classification { categoryId, bodyZoneIds[], specialtyIds[], gesturalFamilyIds[], clinicalProblemIds[],
                 anatomicalTargetIds[] (ensembles), basis, review|null, original{}, originalProposedSpecialties[] }
  sources      { documentary { sourceId, section, url, usageStatement }|null, prescriptionContext{} }
               ← référence documentaire originale, distincte de upstream (source d'import) et des droits
  validation   { classification, clinical, rights, corpusReview, licensing, clinicalValidation, publicationAllowed }
  media[]      (ordonnés) { id, kind PHOTO|VIDEO, storage EMBEDDED|REMOTE, url, fileName, caption, alt,
                 sourceUrl, attribution, license, rightsStatus }  ← modèle de l'administration Web
  install      { knownLocalMovementIds[] }
```

- **Étapes** : elles appartiennent au contenu descriptif (`content.steps`), dans leur ordre, jamais aux classifications.
- **Ordre significatif** : étapes, alias, médias, historique, référentiels, glossaire.
- **Ensembles** : Zones et identifiants de taxonomie.

## 4. Règles de validation (`parseMovementCatalogueFile`)

- **Format** : format et version exacts ; tout autre fichier est refusé, y compris un export « brouillons ». [11/11/2026 : versions relues `1.0.0` et `2.0.0`, la v1 étant convertie (§ 10).]
- **Identités** : `sheetId` uniques, et identifiants locaux connus uniques dans tout le fichier.
- **Unicité dans les listes** : identifiants uniques dans chaque référentiel et dans le glossaire.
- **Références** : Catégorie, Zones et taxonomie présentes dans `references` ; fiches citées par le glossaire présentes dans le fichier.
- **Révisions** : historique non vide, révisions uniques, la dernière entrée portant la `revision` de la fiche, dates ISO.
- **Provenance** : contrôlée par `validateMovementEditorialProvenance`. Une source (`upstream`) est exigée hors création originale ; les auteurs en double sont refusés. [11/11/2026, MOUV-D1 : auteur unique `author|null` ; une liste est refusée.]
- **Médias** : règles de l'administration Web.
  - 30 au plus par fiche ;
  - liens HTTPS uniquement ;
  - photo intégrée de 580 000 caractères au plus ;
  - texte alternatif obligatoire pour une photo ;
  - source obligatoire pour un média distant ;
  - attribution et licence obligatoires lorsque les droits sont déclarés confirmés.
- **Projection Mouvement** : conforme au contrat `Movement` actuel (`validateMovement`).
- **Propriétaire inconnu** (décision du 10/11/2026, spécification de provenance § 7 bis) :
  - `owner` est toujours déclaré ; `null` = inconnu, jamais une identité fictive ; un champ omis est refusé (`REQUIRED`) ;
  - admis pour une fiche `PRIVATE`, avec le signalement `UNKNOWN_OWNER` ;
  - refusé (`INCONSISTENT`) avec `visibility` `UNLISTED` ou `PUBLIC`, ou avec `publicationAllowed: true` (fiche ou catalogue).
- **Gestionnaire administratif** : `catalogue.manager` est toujours déclaré (`null` admis). Il tient le fichier ; il n'est ni propriétaire ni ayant droit des fiches.
- **Signalements non bloquants** :
  - propriétaire inconnu (`UNKNOWN_OWNER`) : aucune attribution par déduction ; à lever avant toute publication ;
  - homonymie (`DUPLICATE_NAME`) : la question A1 de la spécification de provenance reste ouverte.

Le validateur ne lit aucune base locale. La correspondance des Catégories et des Zones avec celles du téléphone relève du chargement (CA-3).

### Catalogue pilote — décisions du 10/11/2026

- `catalogue.owner` : `null` (inconnu) ; `catalogue.manager` : ANKUSHA (`ORGANIZATION:ankusha`) ; `publicationAllowed: false`.
- 60 fiches : `origin: EXTERNAL_IMPORTED` ; `upstream` = classeur `KODJO_Catalogue_reeducation_fitness_60_fiches.xlsx`, fiche d'origine, révision `2026-10-27` ; `owner`, `rightsHolder` et `license` inconnus ; `PRIVATE`, `DRAFT`, publication non autorisée.
- Références documentaires originales conservées par fiche dans `sources.documentary`.

## 5. Projection Mouvement

`projectSheetToMovement(sheet, movementId)` produit exactement ce que fait l'importeur pilote :
- nom ;
- alias ordonnés ;
- étapes encodées dans `description` par `encodeInstructionSteps` ;
- Catégorie et Zones ;
- aucun média transporté ;
- structure par défaut (`phases: []`, `nextPhaseId: 1`, `levelGroup: null`).

Les autres propriétés restent dans la fiche éditoriale, sans être ajoutées au modèle `Movement`.

## 6. Révisions et empreinte

- Chaque fiche porte une `revision` (chaîne, comme dans `MovementEditorialProvenance`) et son historique.
- **Toute modification éditoriale doit créer une nouvelle révision** : nouvelle entrée d'historique et `revision` mise à jour.
- `sheetFingerprint(sheet)` couvre la fiche complète : contenu, classifications, sources, validation, provenance, médias et leurs métadonnées.
  - Elle exclut `revision`, `history` et `install`.
  - Elle ignore l'ordre des clés et des ensembles, mais respecte l'ordre des étapes, des alias et des médias.
- Une même révision dont l'empreinte change sera signalée au chargement comme **révision incohérente** (plan, § 5).

## 7. Créer ou modifier une fiche à la main

1. Ajouter (ou modifier) l'objet dans `sheets`.
   - Une nouvelle fiche reçoit un `sheetId` nouveau, `revision: "1"`, une entrée d'historique, `install.knownLocalMovementIds: []` et une provenance complète.
   - Pour une création originale : `origin: "LOCAL_CREATED"` et `upstream: null`.
2. Pour une modification : incrémenter `revision` et ajouter l'entrée d'historique correspondante.
3. Contrôler le fichier : tout fichier `catalogue/catalogues/*.catalogue.json` est validé par `npx jest src/domain/catalogue`, en local et dans la CI de branche.

## 8. Hors format v1 (prévu, non développé)

- [10/11/2026 : développés en CA-3, voir § 9] Chargement et registre d'installation (CA-3, base SQLite distincte provisoire).
- Écran de recette (CA-4).
- Téléchargement (option B).
- Transport physique des médias.
- Partage entre utilisateurs et filiation (`LOCAL_DERIVED`, `SHARED_IMPORTED`). [11/11/2026, A-2 : `LOCAL_DERIVED` est **refusé** par le format v2 — aucune copie, duplication ni dérivation locale d’une fiche importée. `SHARED_IMPORTED` reste hors périmètre (partage reporté, BIB-23).]
- Validation éditoriale et clinique.

## 9. Chargement d'un catalogue (CA-3)

**Décision de Hermann du 10/11/2026**, verbatim :
> « 1. Base SQLite : conserver provisoirement kodjo-catalogue-registry.db, indépendante de la base principale. Son intégration éventuelle sera réévaluée après PRE-10, sans engagement automatique. Garantir la cohérence et la reprise après interruption, sans complexité excessive.
> 2. Conflits : conserver systématiquement les modifications locales et reporter la nouvelle révision. Aucun écrasement, refus ou remplacement automatique. La décision appartient au destinataire.
> 3. Acceptation : procéder fiche par fiche. Présenter systématiquement un résumé des changements avant acceptation, y compris lorsqu'il n'existe aucun conflit. La comparaison détaillée champ par champ doit être accessible à la demande et permettre d'identifier précisément les conflits.
> Le suivi doit couvrir toutes les propriétés éditoriales, pas uniquement les champs de Movement. […] Ne pas ajouter de mécanisme de fusion automatique. »

**Code** : `src/domain/catalogue/catalogueLoadPlan.ts` (classification pure), `src/infrastructure/catalogue/SqliteCatalogueRegistry.ts` (registre), `src/features/catalogue/CatalogueLoadService.ts` (services). Interface : CA-4.

### 9.1 Registre (`kodjo-catalogue-registry.db`, provisoire)

- Base distincte de `kodjo.db`. Elle n'entraîne aucune migration du schéma principal. Son schéma est versionné par `PRAGMA user_version` (version 1), et une version plus récente est refusée.
- Le registre contient quatre tables :
  - `installed_sheets` : instantané éditorial **complet** installé (B), révision, empreinte et Mouvement rattaché (un Mouvement par fiche) ;
  - `pending_operations` : écriture de Mouvement en cours ;
  - `sheet_decisions` : refus ou report, par révision ;
  - `saved_local_values` : valeur personnelle sauvegardée avant d'être remplacée par choix explicite.
- Une écriture de Mouvement suit toujours la même séquence, et une interruption entre deux étapes est reprise au chargement suivant :
  1. l'opération est inscrite comme en cours ;
  2. le Mouvement est écrit par le service Catalogue existant ;
  3. la confirmation est faite en une seule transaction du registre.
- Reprise au chargement suivant :
  - écriture faite → confirmée ;
  - écriture non faite → abandonnée, la fiche est reproposée ;
  - aucune écriture de Mouvement pendant la reprise.
- Les lectures, du registre comme des Mouvements locaux, se font dans une transaction : c'est la leçon de l'incident du 9/11.

### 9.2 États d'une fiche

| État | Signification | Décisions possibles |
|---|---|---|
| `NEW` | Aucune trace locale | Accepter (installation), reporter, refuser |
| `ADOPTABLE` | Mouvement déjà présent sous un identifiant de `install.knownLocalMovementIds`, identique | Accepter (registre seul), reporter, refuser |
| `TO_RECONCILE` | Mouvement probable (identifiant connu ou même nom) sans base fiable ; toute différence est un conflit | Accepter avec choix par champ, reporter, refuser |
| `UP_TO_DATE` | Même révision, même empreinte (une modification locale est signalée et conservée) | — |
| `NEW_REVISION` | Révision plus récente (filiation par `history`) | Accepter (choix par champ si conflit), reporter, refuser |
| `OLDER_REVISION` | Révision antérieure à l'installée | — |
| `INCOHERENT_REVISION` | Même révision, empreinte différente ; ou filiation rompue | — |
| `REFUSED_REVISION` | Révision déjà refusée | — (une révision ultérieure est reproposée) |
| `WITHDRAWN_LOCALLY` | Mouvement supprimé ou archivé localement | — (jamais réinstallé ni modifié) |
| `INTERRUPTED` | Opération en cours non reprise | — |

**Empêchements** (`blockers`) :
- Catégorie ou Zone absente du téléphone (`LOCAL_REFERENCE_MISSING`), sans création implicite ;
- nom pris par un autre Mouvement (`NAME_CONFLICT`).

### 9.3 Résumé et comparaison

- Chaque fiche porte un **résumé systématique**, y compris sans conflit :
  - nombre de champs modifiés, par section (provenance, contenu, classification, sources, validation, médias) ;
  - champs du Mouvement qui seraient modifiés ;
  - conflits ;
  - modifications locales conservées ;
  - indication « purement éditorial ».
- La **comparaison détaillée** est disponible à la demande. Elle couvre **toutes** les propriétés éditoriales de la fiche, avec pour chaque champ :
  - les valeurs installée, entrante et, pour les champs projetés, locale ;
  - les indicateurs « modifié par le fichier », « modifié localement » et « conflit ».
- Seuls cinq champs sont projetés sur le Mouvement et peuvent entrer en conflit : nom, alias, étapes, Catégorie, Zones. Un **conflit** est un champ modifié localement **et** dans la nouvelle révision, avec des valeurs différentes. Une modification locale égale à la nouvelle valeur n'est pas un conflit.

### 9.4 Décisions (aucune fusion automatique)

- Fiche par fiche : `accept`, `defer`, `refuse`. Aucune décision n'est prise sans le destinataire ; en cas de conflit, la proposition par défaut est `DEFER`.
- **Accepter en cas de conflit** exige, pour **chaque** champ en conflit, un choix explicite : `KEEP_LOCAL` ou `TAKE_INCOMING`. Sans ce choix, rien n'est écrit (`RESOLUTION_REQUIRED`). Une valeur locale remplacée est d'abord sauvegardée au registre.
- **Accepter sans conflit** :
  - un champ modifié par le fichier et non localement prend la nouvelle valeur ;
  - un champ modifié localement garde la valeur locale ;
  - les propriétés hors Mouvement entrent dans l'instantané du registre.
- Le Mouvement n'est écrit que si un champ projeté change, et toujours par le service Catalogue existant. Médias, phases, famille et archivage locaux ne sont jamais modifiés.
- Une décision est recalculée sur l'état actuel au moment où elle est prise, jamais sur un plan ancien.
- Une fiche absente du fichier n'est jamais supprimée localement.

### 9.5 Écran de recette « Charger un catalogue » (CA-4)

**Code** :
- `src/features/catalogue/CatalogueLoadScreen.tsx` (route `app/catalogue-load.tsx`) ;
- `CatalogueLoadCommand.tsx` ;
- `catalogueLoadPresentation.ts`.

Outil de recette interne, hors MVP et **sans référence Figma**. Comme l'outil qu'il remplace (« Importer 60 fiches », PR #434), il n'est affiché que dans une build construite avec `EXPO_PUBLIC_KODJO_CATALOGUE_IMPORT=1` (variante « Routine Catalogue »). Ailleurs, la route affiche « indisponible ».

**Parcours**

1. **Choisir un fichier catalogue** (sélecteur de documents du téléphone, JSON, 24 Mo au plus).
   - Si le fichier est invalide, il est refusé en entier, avec la liste des problèmes ; rien n'est écrit.
2. **Liste des fiches**, groupées par état. Les fiches qui attendent une décision viennent d'abord.
   - Chaque fiche porte une ligne courte : conflits, changements du Mouvement, report, blocage.
   - Les signalements du fichier sont affichés, par exemple « Propriétaire inconnu : chargement privé possible, aucune publication ».
   - Une reprise après interruption est annoncée.
3. **Fiche**, qui présente toujours :
   - le **résumé systématique** (§ 9.3) ;
   - la **comparaison détaillée** à la demande : toutes les propriétés éditoriales, avec les valeurs installée, nouvelle et sur ce téléphone.
   - Les **conflits sont toujours visibles**. Chacun porte un sélecteur segmenté natif iOS (« Garder ma valeur » / « Prendre la nouvelle »), **sans valeur par défaut**.
   - « Accepter » reste inactif tant qu'un conflit n'est pas tranché ou qu'un empêchement existe.
4. **Décisions** :
   - **Accepter** : confirmation qui reprend le résumé, puis compte rendu ;
   - **Reporter** : immédiat, la révision sera reproposée ;
   - **Refuser** : confirmation, la révision ne sera plus proposée.
   - Après chaque décision, le plan est recalculé sur l'état réel.
5. **Rattachement groupé** des seules fiches « déjà présentes, identiques », après confirmation : aucun Mouvement n'est modifié, seul l'historique d'installation est enregistré. [Choix d'ergonomie de recette, soumis à validation : voir le rapport CA-4.]

De retour sur le Catalogue des Mouvements, la liste est relue au retour sur l'écran (mécanisme existant).

## 10. Format v2 `2.0.0` (P0, 11/11/2026)

**Décisions appliquées :** MOUV-D1 (auteur unique), A-1 et A-2 du 11/11/2026 (Hermann), BIB-03/04 et F4-G (registre des décisions).

### 10.1 Changements par rapport à la v1

| Élément | v1 | v2 |
|---|---|---|
| `formatVersion` | `1.0.0` | `2.0.0` ; la v1 reste lisible |
| Auteur de la fiche | `provenance.authors[]` | `provenance.author: ActorRef | null` (MOUV-D1) ; distinct de `history[].author` (auteur d’une révision) |
| Bibliothèques | absentes | `libraries[]` obligatoire (vide admis) |
| `LOCAL_DERIVED` | accepté structurellement | **refusé** (`INCONSISTENT`) : aucune copie ni dérivation (A-2) |

### 10.2 Bibliothèques (A-1)

```text
libraries[] { libraryId, title, description|null, revision, history[] (vide admis), editor|null, owner|null,
              visibility PRIVATE|UNLISTED|PUBLIC, publicationAllowed, members[] { catalogueId, sheetId } (ordonnés) }
```

- Une Bibliothèque est une **collection logique** identifiée par `(catalogue.id, libraryId)`. Le fichier n’est qu’une unité de stockage et de transport : il peut contenir zéro, une ou plusieurs Bibliothèques, et des fiches qui n’appartiennent à aucune.
- Un membre est une **référence** à l’identité d’une fiche `(catalogueId, sheetId)`, jamais une copie. Une même fiche peut figurer dans plusieurs Bibliothèques.
- Un membre d’une autre source (`catalogueId` ≠ `catalogue.id`) est admis et signalé (`EXTERNAL_MEMBER`). Il est résolu à l’installation s’il est déjà présent sur l’appareil.
- Aucune restriction sur le nombre, la nature, la spécialité ou l’éditeur des fiches.
- **Contrôles :**
  - `libraryId` unique au format `^[a-z0-9][a-z0-9.-]{1,63}$` ;
  - membres sans doublon ;
  - membre interne présent dans `sheets` (sinon `UNKNOWN_REFERENCE`) ;
  - `editor` et `owner` déclarés (`null` admis) ;
  - propriétaire inconnu → `PRIVATE` et `publicationAllowed: false` obligatoires ;
  - Bibliothèque publiable → chaque fiche interne doit être publiable (`MEMBER_NOT_PUBLISHABLE` sinon : aucune diffusion d’une fiche dont les droits ne sont pas établis).
- La révision d’une Bibliothèque porte sur sa **composition**. Les fiches gardent leur propre révision. Une fiche installée n’a qu’une révision active sur l’appareil, quelle que soit la Bibliothèque qui l’a apportée (F4-G).

### 10.3 Lecture d’un fichier v1 (conversion déterministe, sans perte)

- `authors[]` est converti : 0 auteur → `null`, 1 auteur → cet auteur, plusieurs → **refus explicite** (`INCONSISTENT`, `MULTIPLE_AUTHORS`), jamais de choix arbitraire.
- Une **Bibliothèque implicite** est créée :
  - `libraryId` = `catalogue.id` ;
  - titre, révision, propriétaire et autorisation repris de l’en-tête ;
  - éditeur = `catalogue.publisher` ;
  - `PRIVATE` si la publication n’est pas autorisée ;
  - toutes les fiches dans l’ordre du fichier.
- Le résultat est un fichier v2 ; le signalement `CONVERTED_FROM_V1` l’indique. Aucun fichier n’est réécrit en v1.

### 10.4 Écriture et aller-retour

- `serializeMovementCatalogueFile(file)` est la sérialisation de référence, utilisée par l’administration, l’export et le Wi-Fi : JSON indenté de 2 espaces, ordre des clés conservé, fin de ligne finale.
- **Aller-retour garanti et testé :** `parse(serialize(f))` redonne `f`, et une seconde sérialisation est identique au caractère près.
- Le même format sert pour le fichier et pour le Wi-Fi : aucun second modèle.

### 10.5 Fichier pilote

Le fichier `kodjo-pilote-60.catalogue.json` est régénéré en v2 par la conversion reproductible (`KODJO_WRITE_CATALOGUE=1 npx jest tools/catalogue`) :
- 60 fiches avec `author: null` ;
- une Bibliothèque privée de recette `kodjo.pilote-60` (« Pilote KODJO — 60 mouvements (recette) »), propriétaire inconnu, non publiable, qui référence les 60 fiches.

Les identités `(kodjo.pilote-60, sheetId)` sont inchangées.

