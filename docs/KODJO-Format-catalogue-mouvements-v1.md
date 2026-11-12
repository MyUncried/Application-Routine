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
- projection actuellement livrée : `phases: []`, `nextPhaseId: 1`, `levelGroup: null`. La cible pour les fiches portant une famille est décrite ci-dessous. [11/11/2026 : livrée ; la famille est appliquée après l'écriture du Mouvement, voir « Familles de niveaux des fiches — format retenu ».]

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
  - `libraryId` dérivé de `catalogue.id` (minuscules, caractères non admis remplacés par « - », 64 au plus ; sinon `bibliotheque`) ;
  - titre, révision et propriétaire repris de l’en-tête ;
  - éditeur = `catalogue.publisher` ;
  - toujours `PRIVATE` et non publiable : la conversion n’accorde aucune diffusion [revue du 11/11/2026 : remplace « `PRIVATE` si la publication n’est pas autorisée »] ;
  - toutes les fiches dans l’ordre du fichier.
- Le résultat est un fichier v2 ; le signalement `CONVERTED_FROM_V1` l’indique. Aucun fichier n’est réécrit en v1.

### 10.3 bis Mouvements personnels rattachés (revue du 11/11/2026)

- `install.personalMovementIds` est facultatif. C'est un sous-ensemble de `knownLocalMovementIds` : les Mouvements **personnels** envoyés par un téléphone (A2), puis ajoutés au catalogue ou rapprochés d'une fiche par l'administration.
- Sur le téléphone, le rattachement d'un tel Mouvement n'est **jamais appliqué**. Il en va de même pour un rapprochement avec une fiche `LOCAL_CREATED`. Le service répond `PERSONAL_RULE_PENDING` et l'aperçu de la Bibliothèque affiche « à examiner ». En effet, ce rattachement rendrait le Mouvement importé et verrouillé (A-2), alors que la règle de transition n'est pas arbitrée.
- Les 60 Mouvements du pilote (`EXTERNAL_IMPORTED`, `pilot:*`) ne sont pas concernés.
- Champ hors empreinte, comme tout `install`.

### 10.4 Écriture et aller-retour

- `serializeMovementCatalogueFile(file)` est la sérialisation de référence, utilisée par l’administration, l’export et le Wi-Fi : JSON indenté de 2 espaces, ordre des clés conservé, fin de ligne finale.
- **Aller-retour garanti et testé :** `parse(serialize(f))` redonne `f`, et une seconde sérialisation est identique au caractère près.
- Le même format sert pour le fichier et pour le Wi-Fi : aucun second modèle.

### 10.5 Fichier pilote

Le fichier `kodjo-pilote-60.catalogue.json` est régénéré en v2 par la conversion reproductible (`KODJO_WRITE_CATALOGUE=1 npx jest tools/catalogue`) :
- 60 fiches avec `author: null` ;
- une Bibliothèque privée de recette `kodjo.pilote-60` (« Pilote KODJO — 60 mouvements (recette) »), propriétaire inconnu, non publiable, qui référence les 60 fiches.

Les identités `(kodjo.pilote-60, sheetId)` sont inchangées.

## 11. Administration locale du format v2 (W1, 11/11/2026)

**Code :** `src/domain/catalogue/catalogueEditing.ts` (édition, révisions) ; outil `tools/catalogue-admin/` (serveur Node local, page, README).
**Décisions appliquées :** A-1, A-2, MOUV-D1 (11/11/2026) ; propriétaire inconnu → privé, jamais publiable (10/11/2026).

### 11.1 Rôle

- L'administration locale Node **édite directement** les fichiers `catalogue/catalogues/*.catalogue.json`, sur le PC uniquement.
- Elle valide avec **le même code** que l'application : les modules du domaine (`MovementCatalogueFile.ts`, `catalogueEditing.ts`, `MovementInbox.ts` et leurs dépendances) sont transpilés tels quels (`tools/catalogue-admin/build-domain.mjs`) et utilisés par le serveur **et** par la page. Aucun second validateur.
- La page statique OVH (`tools/catalogue-admin/static-ovh/`) reste la variante historique de l'éditeur de brouillons v0 : conservée, non déployée par nous ; la page en ligne n'est pas modifiée.

### 11.2 Création d'une fiche

Une fiche créée dans l'administration reçoit :
- un `sheetId` unique, jamais réutilisé (fourni ou dérivé du nom : `fiche-<nom>`, suffixe `-2`, `-3`… en cas de collision) ;
- `revision: "1"` et une entrée d'historique ;
- `origin: LOCAL_CREATED`, `upstream: null`, `visibility: PRIVATE`, `reviewStatus: DRAFT`, `validation.publicationAllowed: false` ;
- propriétaire et auteur **tels que déclarés, sinon `null`** (aucune identité inventée) ;
- `install.knownLocalMovementIds: []`, sauf rapprochement explicite.

Catégorie et au moins une Zone restent obligatoires (contrat `Movement`, § 4).

### 11.3 Révisions

- Une révision n'est créée que sur un **changement effectif** :
  - fiche : empreinte éditoriale (`sheetFingerprint`, hors `revision`, `history`, `install`) ;
  - Bibliothèque : tout sauf `revision` et `history` (en-tête et membres ordonnés).
- Réenregistrer sans changement : aucune révision, aucune écriture.
- Le rapprochement (`install.knownLocalMovementIds`) ne crée **pas** de révision de fiche.
- La révision du catalogue (`catalogue.revision`) avance dès que le fichier change, rapprochement compris.
- Règle de la révision suivante :
  - entier → entier suivant (`"4"` → `"5"`) ;
  - suffixe pointé → suffixe suivant (`"2026-10-27.1"` → `"2026-10-27.2"`) ;
  - autre → `.1` ajouté (`"2026-10-27"` → `"2026-10-27.1"`) ;
  - jamais une révision déjà présente dans l'historique.
- Les révisions sont calculées **par le serveur**, à partir du fichier sur disque (`applyFileEdit`). Une révision ou un historique envoyés par la page sont ignorés.
- Refusés : suppression d'une fiche ou d'une Bibliothèque, changement de `catalogue.id`.

### 11.4 Enregistrement

1. Contrôle de révision optimiste (empreinte SHA-256 des octets lus ; sinon `409`).
2. Validation par `parseMovementCatalogueFile` (sinon `422` avec la liste des problèmes).
3. Calcul des révisions, puis revalidation.
4. Écriture atomique de `serializeMovementCatalogueFile` (fichier temporaire puis renommage).

Un fichier v1 est relu en v2 ; il n'est réécrit qu'au premier enregistrement effectif, en v2. L'export renvoie les octets du fichier enregistré.

## 12. Transport Wi-Fi et boîte d'arrivée (W2, 11/11/2026)

**Code :** `src/domain/catalogue/MovementInbox.ts` (contrat partagé) ; `tools/catalogue-admin/server.mjs` et `phone.mjs`.
**Décision appliquée :** A-6 — le Wi-Fi n'est qu'un **canal de transport** du même format et des mêmes validateurs.

### 12.1 Canal

- Option `--lan` du serveur local : second port (4739) sur le réseau local, qui n'expose que l'API du téléphone (`/phone/*`). L'administration reste sur 127.0.0.1.
- Appairage par code à 6 chiffres (5 minutes, usage unique), jeton de 32 octets valable 12 heures, révocable.
- Aucune exposition Internet, aucun CORS ouvert.

### 12.2 Du PC vers le téléphone

- `GET /phone/v1/libraries` liste les Bibliothèques des fichiers valides : `catalogueId`, `libraryId`, titre, description, révision, nombre de fiches, révision du fichier.
- `GET /phone/v1/catalogues/:catalogueId` renvoie **les octets du fichier v2** (sérialisation de référence, validée avant envoi) : le même contenu qu'un import de fichier, relu par le même `parseMovementCatalogueFile`.
- Un fichier invalide n'est pas servi. Un `catalogueId` porté par plusieurs fichiers est ambigu et n'est pas servi.
- **MOUV-D2 — média sans droits confirmés.** Décision de Hermann du 11/11/2026 (recette) : « Refuse uniquement la fiche, il faut en donner le nom ». Une fiche dont un média n'est pas en `PERMISSION_CONFIRMED` est retirée du fichier envoyé (fiche, membres des Bibliothèques, renvois du glossaire) ; les autres fiches partent inchangées. L'en-tête `X-Kodjo-Withheld-Sheets` (JSON encodé : `sheetId`, nom) les nomme. [Avant : « et le téléphone affiche « Fiche non transférée » » — remplacé le 12/11/2026, voir ci-dessous.] Si le fichier ainsi filtré n'est pas valide, tout le fichier est refusé (`409 MEDIA_RIGHTS_UNCONFIRMED`). [Remplace le refus du fichier entier livré le 11/11 au matin.]
- **MOUV-D2 — portée du filtre et signalement (12/11/2026).** Décisions de Hermann du 12/11/2026 (recette) : (a) export et import de fichier filtrés comme le transfert — « J'aurais proposé l'option B, pour que à la source, toute diffusion non autorisée ne puisse arriver. Je suis OK pour A » puis « Je confirme les trois points » (A + B) ; (b) « L'utilisateur n'a pas besoin de savoir qu'une fiche a été retenue, c'est le problème de l'expéditeur » : plus d'encadré « Fiche non transférée » sur le téléphone ; (c) l'administration signale les fiches non diffusables. Règle : aucune fiche dont un média n'est pas en `PERMISSION_CONFIRMED` ne quitte l'administration, ni par le Wi-Fi ni par le fichier exporté ; le téléphone applique le même filtre à tout fichier importé, quelle que soit son origine. Le filtre est unique (`diffusableCatalogue`, domaine). Le téléphone retire ces fiches sans message ; l'administration affiche en permanence « N fiche(s) non diffusable(s) » avec leurs Bibliothèques. Une Bibliothèque entièrement refusée (fichier filtré invalide) reste signalée sur le téléphone (« Bibliothèques non transférées »).
- Administration : la licence se choisit dans une liste (œuvre personnelle, autorisation écrite de l'auteur, Creative Commons CC BY / BY-SA / CC0, banque d'images sous licence, « Autre (préciser) ») et l'autorisation se déclare par un bouton. La règle du format reste : des droits confirmés exigent l'auteur / crédit et la licence.

### 12.3 Du téléphone vers le PC : boîte d'arrivée

Enveloppe `KODJO_MOVEMENT_INBOX` 1.0.0 :

```text
{ format, formatVersion: "1.0.0", sentAt (ISO 8601), device { name },
  movements[] { movementId, name, aliases[], steps[], categoryId, categoryLabel,
                bodyZoneIds[], bodyZoneLabels[], mediaCount } }
```

- **Limites :**
  - 1 à 200 Mouvements par envoi ;
  - nom de 1 à 80 points de code ;
  - au plus 20 alias valides et distincts ;
  - étapes non vides, 1 000 points de code au total une fois encodées (contrat du Mouvement, QN-1) ; aucune borne par étape [11/11/2026 : remplace « au plus 20 étapes, chacune d'au plus 65 points de code », qui aurait refusé des Mouvements valides du téléphone] ;
  - Catégorie et au moins une Zone, libellés alignés sur les identifiants.
- Toute anomalie refuse l'envoi entier.
- Doublons dans un envoi : identiques → fusionnés ; contenus différents pour un même `movementId` → refus.
- **Idempotence :** un Mouvement déjà reçu avec le même contenu n'est pas réenregistré.
- Stockage : un fichier par envoi, écrit atomiquement (`catalogue/admin/inbox/`, non versionné).

**Décisions de l'administrateur (jamais automatiques) :**
- **Ajouter au catalogue** : fiche créée selon le § 11.2, contenu projeté (nom, alias, étapes), Catégorie et Zones choisies dans les référentiels du catalogue (proposées par identifiant puis par libellé, jamais inventées), `install.knownLocalMovementIds: [movementId]`, ajout facultatif à une Bibliothèque. Refusé si le Mouvement est déjà rapproché d'une fiche.
- **Rapprocher** : ajoute le `movementId` à une fiche existante, après confirmation ; aucune révision de la fiche, révision du catalogue.
- **Ignorer**.

Collisions signalées : même nom normalisé (nom ou alias d'une fiche), ou identifiant déjà rapproché.

**Limite de ce lot :** les médias des Mouvements personnels ne sont pas transférés ; seul leur nombre (`mediaCount`) l'est.

## Familles de niveaux des fiches — cible validée le 11 novembre 2026

La fiche éditoriale peut porter une appartenance à une famille de niveaux et une clé de tri dans cette famille. Ces deux valeurs vont ensemble, conformément au modèle Mouvement (`levelGroup`, composé de `groupId` et `sortKey`). Le rang affiché et le nombre de niveaux sont dérivés. Les anciens fichiers et les fiches sans famille restent lisibles avec une appartenance absente.

L’export et le transfert d’une Bibliothèque préservent cette information pour chaque fiche transmise. À l’import, la projection mobile restitue la famille et l’ordre relatif des mouvements reçus. Un second import retrouve les mêmes fiches et la même famille. Deux sources indépendantes utilisant une même clé de groupe ne doivent pas fusionner accidentellement. Un changement d’appartenance ou d’ordre constitue une modification éditoriale de la fiche. Les règles existantes de traitement des révisions et de protection des adaptations locales s’appliquent.

Contrôles de recette cibles : transmettre deux fiches de la même famille dans un ordre de Bibliothèque inverse à leur progression ; vérifier sur le téléphone leur appartenance et leur ordre de niveau. Réimporter, vérifier l’absence de doublon. Charger une ancienne fiche sans famille. Pour une sélection partielle, vérifier que seuls les membres sélectionnés et autorisés sont transmis.

La représentation sérialisée précise et le traitement des conflits entre une progression locale et une révision source relèvent de la conception d’implémentation. Le lecteur actuel initialise encore `levelGroup` à `null`. [Remplacé le 11/11/2026 par le format retenu ci-dessous.]

### Familles de niveaux des fiches — format retenu (implémentation du 11/11/2026)

**Sérialisation.** Propriété facultative de la fiche, au même niveau que `media` et `install` :

```json
"levelGroup": { "groupId": "3f0c…", "sortKey": 1 }
```

- Absente (ou `null`) : aucune famille. Les anciens fichiers restent lisibles, et l'empreinte d'une fiche sans famille est inchangée (la propriété absente n'entre pas dans `sheetFingerprint`).
- `groupId` : identifiant opaque, généré par l'administration à la création de la famille, propre au catalogue (`catalogue.id`). `sortKey` : nombre fini ; ordre croissant = niveau croissant (niveau 1 = le plus facile). Rang et nombre de niveaux sont dérivés.
- Le validateur refuse une `levelGroup` mal formée (`INVALID`) et deux fiches d'une même famille à la même clé (`DUPLICATE`).
- L'appartenance et la clé entrent dans l'empreinte éditoriale : les modifier crée une révision de la fiche à l'enregistrement. Le résumé des changements les classe dans la section « famille de niveaux ».

**Administration (`catalogueEditing.ts`).**
- `joinSheetFamily` rattache une fiche à la famille d'une autre, au niveau le plus élevé ; si la cible n'a pas de famille, une famille est créée (cible niveau 1, fiche niveau 2, règle C1). Une fiche déjà dans une famille doit d'abord la quitter (règle C6).
- `moveSheetInFamily` échange deux positions voisines : seules ces deux fiches sont révisées.
- `leaveSheetFamily` détache la fiche ; s'il ne reste qu'un membre, son appartenance est effacée aussi (règle D2).
- L'écran « Fiches » présente la famille par les noms des mouvements (« Niveau n — Nom »), avec les flèches de réordonnancement et « Détacher » ; identifiants et clés ne sont jamais saisis. L'ordre des membres d'une Bibliothèque reste indépendant.

**Téléphone (`catalogueFamilies.ts`, `CatalogueLoadService`).**
- La famille d'une fiche de catalogue `C` devient sur le téléphone le groupe `catalogue:<C>#<groupId>` : deux catalogues indépendants ne fusionnent jamais, et un réimport retrouve la même famille.
- Après chaque fiche acceptée (installée, rattachée, mise à jour ou enregistrée), le Mouvement est placé dans ce groupe. Les membres importés de la famille occupent leurs emplacements dans l'ordre des clés de leurs fiches ; un Mouvement local que l'utilisateur y aurait placé garde son emplacement. Les groupes existants sont écrits dans une transaction (`MovementRepository.setFamilyOrder`).
- Une sélection partielle ne crée que la famille des fiches reçues ; un membre reçu plus tard s'insère à sa place.
- Protection des adaptations locales : une fiche dont la famille n'a pas changé depuis l'installation ne touche à rien ; si l'appartenance du Mouvement a été modifiée sur le téléphone depuis l'installation, elle est conservée. Un Mouvement existant rattaché à une autre famille locale la garde.
- Une fiche qui quitte sa famille fait sortir le Mouvement (`leaveFamily`, dissolution du dernier couple).
- Limite connue : une interruption entre la confirmation de la fiche et le placement dans la famille laisse le Mouvement sans famille jusqu'à la révision suivante de la fiche.
