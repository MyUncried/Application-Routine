# 2026-11-11 — CATALOGUE-CONNECTÉ — Qualification des prérequis P1 à P6

## Identifiant et objectif

- **CATALOGUE-CONNECTÉ, qualification des prérequis**.
- Mission de Hermann du 11/11 : « Exécuter maintenant la qualification des prérequis, sans engager de migration ou de développement fonctionnel prématuré. » W1 ne commence pas avant validation de la matrice.
- Nature : **audit, sans correction**. Aucun fichier applicatif n'a été modifié. Ce rapport est la seule modification.

## Branche et commit de départ

- Rapport écrit sur `catalogue/integration-60-main-20261109` (`7b43c2d5`), dans le worktree `C:/Dev/KODJO-CAT60-MAIN`.
- Audit Git en lecture seule depuis `C:/Dev/PRE10` :
  - `git fetch` ;
  - `log`, `merge-tree`, `cherry`, `grep` ;
  - **aucun checkout, reset, rebase, stash ni écriture** dans les worktrees PRE-10.
- Figma en lecture seule : `get_metadata` et `get_screenshot`, sans aucune écriture.

## Périmètre

- **Demandé** :
  - état exact de l'existant (PR #421 à #436, branches catalogue, PRE-10, conception récente) ;
  - P1 à P6 ;
  - Figma ;
  - les huit livrables ;
  - les arbitrages bloquants.
- **Traité** : les mêmes points. Le modèle de données et le contrat de format sont **consolidés à partir des documents existants**, sans nouvelle règle (§ 5 et § 6).
- **Non traité** :
  - aucune correction documentaire sur la ligne de conception ;
  - aucune fusion ;
  - aucun code.

---

## 1. État de l'existant (livrable 3)

### 1.1 Branches de référence (11/11/2026, après `git fetch`)

| Ligne | Branche / HEAD | Constat |
|---|---|---|
| `main` | `7e5fb6a2` | Contient #420 (PRE-9) et #436 (relecture à la création). Migrations jusqu'à **023**. |
| PRE-10, ligne poussée | `composition-phases-duree` `f5bb4316` (09/11) | `pre10-bmad/dev` (`47e78378`), plus D-514 et D-515. Les 3 commits propres à `pre10-bmad/dev` sont des **équivalents de patch** (`git cherry` : `-`). Migration **024**. |
| **PRE-10, ligne la plus avancée** | **`pre10-son-voix` `ddd4c735` (11/11 01:39), locale, NON poussée** (worktree `C:/Dev/PRE10-SON`) | **56 commits** au-delà de `composition-phases-duree`, qu'elle contient (fusion `e25fa704`) : Circuits, annonces vocales, bips. Migrations **025 à 027**. 92 fichiers. **`composition-phases-duree` n'est donc plus la ligne PRE-10 de référence.** |
| Catalogue (code) | `catalogue/integration-60-main-20261109` `7b43c2d5` | Partie de `main` : 14 commits, dont CA-1 à CA-4, l'import de recette des 60 Mouvements et la relecture. Migrations jusqu'à 023, aucune ajoutée. |
| Catalogue, recette précédente | `catalogue/chargement-60-recette-20261109` `b0c0adb4` | Remplacée par la branche d'intégration. À conserver comme historique. |
| **Conception Bibliothèques / fiche Mouvement** | chaîne de 8 branches `docs/…` et `revue/…` des 10 et 11/11, dont le sommet est **`docs/mouvements-reconciliation-A-H-20261111` `7929f256`** | Aucune PR. Non fusionnée. Les deux branches `revue/…` sont des rameaux qui ne portent que des rapports de revue. Le sommet contient les décisions **BIB-19 à BIB-23**, **MOUV-D1 à D4** et le **plan en six étapes** confirmé par Hermann. |

### 1.2 PR Catalogue

| PR | Branche (base) | État | Dans la branche d'intégration ? |
|---|---|---|---|
| #421 provenance et fiches éditoriales | `docs/movement-provenance-ownership-20261106` (main) | OUVERTE | Non par fusion. Le document de provenance et le code `MovementEditorialProvenance` ont été **portés** puis modifiés (décisions du 10/11). |
| #423 60 fiches et chargeur SQLite de test | empilée sur #421 | OUVERTE | Corpus porté (`catalogue/catalogues/kodjo-pilote-60.catalogue.json`). `seedMovementTestCorpus` **absent**. |
| #425 taxonomie V0 | empilée sur #423 | OUVERTE | `scripts/catalogue/validate-taxonomy.mjs` et référentiels **absents**. Les identifiants du pilote sont repris dans le fichier v1. |
| #429 admin locale Node | empilée sur #425 | OUVERTE | `tools/catalogue-admin/*` **absent**. |
| #432 admin OVH et médias | empilée sur #429 | OUVERTE | `tools/catalogue-admin/static-ovh/index.html` **absent**. |
| #433 préclassement des 60 | empilée sur #432 | OUVERTE | Revue `REVUE-preclassement-60` **absente**. Préclassement repris dans le fichier v1. |
| #434 import manuel dans KODJO | empilée sur #433 | OUVERTE | Remplacé par l'import de recette, puis par CA-3 et CA-4. |
| #436 relecture à la création | `fix/movement-create-readback-20261109` | **FUSIONNÉE** (`7e5fb6a2`) | Oui (`2631c322`, équivalent). |

**Conflits démontrés** (`git merge-tree`) :
- la pile #421 à #434 entre en conflit avec `main`, avec la branche d'intégration et avec la ligne de conception. Fichiers concernés :
  - `INDEX` ;
  - `PRODUCT` ;
  - chapitres 01, 04, 06 à 12 ;
  - `CatalogueScreen.tsx` ;
  - `MovementEditorialProvenance.ts` ;
  - documents de provenance et d'import.
- **Cette pile ne peut pas être fusionnée telle quelle.** Le réemploi passe par un **portage sélectif** : `tools/catalogue-admin/` et `scripts/catalogue/validate-*.mjs`.

Fusions sans conflit (`merge-tree`, code 0) :
- catalogue + `composition-phases-duree` ;
- catalogue + **`pre10-son-voix`** ;
- catalogue + ligne de conception ;
- ligne de conception + `composition-phases-duree` ;
- `pre10-son-voix` + `main`.

### 1.3 Ce que contient réellement la branche d'intégration catalogue

| Élément | Fichier(s) | État |
|---|---|---|
| Format v1 `KODJO_MOVEMENT_CATALOGUE` `1.0.0`, validation stricte, empreinte | `src/domain/catalogue/MovementCatalogueFile.ts` | Livré (CA-1). **`authors[]`**, non conforme à MOUV-D1. |
| Provenance : owner inconnu `null`, manager | `MovementEditorialProvenance.ts` | Livré le 10/11. **`authors[]`**. |
| Conversion du pilote, fichier des 60 | `tools/catalogue/convertPilotCorpus.ts`, `catalogue/catalogues/kodjo-pilote-60.catalogue.json` | Livré (CA-2). |
| Plan de chargement : états, B/L/R, conflits | `src/domain/catalogue/catalogueLoadPlan.ts` | Livré (CA-3). Aucune notion de lecture seule. |
| Registre séparé `kodjo-catalogue-registry.db` | `src/infrastructure/catalogue/SqliteCatalogueRegistry.ts` | Livré (CA-3). |
| Service : préparer, reprendre, accepter, reporter, refuser | `src/features/catalogue/CatalogueLoadService.ts` | Livré (CA-3). Pas d'export, pas de rapprochement inverse. |
| Écran de recette « Charger un catalogue » | `src/features/catalogue/CatalogueLoadScreen.tsx`, `app/catalogue-load.tsx` | Livré (CA-4). **Non validé sur iPhone.** |
| Bibliothèque, médias physiques, lecture seule, homonymes | — | **Absents**. |
| `Movement` local | `src/domain/activities/Movement.ts` | Aucun champ d'origine. Le lien vers la fiche est porté par le seul registre. |

### 1.4 Constat Figma (fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page `510:101`, lecture seule)

| Nœud | Contenu observé (capture) |
|---|---|
| `1992:778` « P-Profil — Modifier le profil — MVP » | Section « Bibliothèques » :<br>— « Mes bibliothèques — Celles que je crée et rends disponibles » ;<br>— « Bibliothèques partagées — Celles que je peux importer ».<br>Section « Bibliothèques installées » :<br>— Fitness « 14 mouvements · à jour » ;<br>— Pilates « 8 mouvements », avec la pastille **« Mettre à jour »**. |
| `12098:115` « Profil — Bibliothèque installée » | **Détail** « < Pilates », « Mettre à jour », « 8 mouvements · mise à jour disponible ».<br>Liste des mouvements à chevron.<br>Action **« Désinstaller la bibliothèque »**.<br>Note : « Les mouvements utilisés dans une séance ou dans une autre bibliothèque installée restent dans le Catalogue. » |
| `10419:22924` « Mouvement — Repris (lecture seule) », `10453:23030` | Fiche Mouvement **sans provenance ni source affichée**. On ne peut pas démontrer qu'elle représente une fiche importée. |

**Non représentés dans Figma** :
- le contenu de « Mes bibliothèques » et de « Bibliothèques partagées » ;
- le chargement depuis un fichier ;
- l'aperçu d'une mise à jour et la revue de révision ;
- la confirmation de désinstallation ;
- l'appairage Wi-Fi ;
- la provenance sur la fiche Mouvement importée ;
- l'écran d'arrivée d'un chevron de mouvement.

Écarts avec la documentation :
- chapitres 06 et 13 : ils citent `1992:778`, mais **pas `12098:115`**, qui représente pourtant la désinstallation, alors que le registre classe celle-ci « À CLARIFIER » ;
- les noms de calques de `1992:778` (« Mon entraînement maison », « Hyrox ») ne correspondent plus au texte affiché.

---

## 2. Matrice de complétude P1 à P6

Légende :
- **ARBITRÉ** : décision de Hermann citée.
- **DOCUMENTÉ** : contrat écrit, non contredit.
- **PROPOSÉ** : proposition non validée.
- **À CLARIFIER**.
- **CODE** : état d'implémentation.

| Prérequis | Arbitré / documenté | Manque ou écart | Complétude |
|---|---|---|---|
| **P1 — Fiche Mouvement** | — Séparation `Movement` / `CatalogueSheet` ; identité `(catalogue.id, sheetId)`.<br>— Owner inconnu `null` ; manager distinct.<br>— EXTERNAL_IMPORTED, PRIVATE, DRAFT.<br>— **MOUV-D1** : auteur unique.<br>— **MOUV-D2** : médias distants et cache.<br>— **MOUV-D3** : importée non modifiable et non duplicable.<br>— **MOUV-D4** : mise à jour volontaire.<br>— BIB-08 : paramètres d'Exercice libres.<br>— Profil n'est pas un éditeur. | — Statut après rattachement des **60 historiques** : lecture seule ou non ? (**A-2**)<br>— Statut d'un Mouvement **personnel envoyé puis catalogué** (A2) (**A-2**).<br>— Projection des phases et familles : non importées, règle absente (**non bloquant**, hors projection actuelle).<br>— Champs éditoriaux sur le mobile : seulement selon Figma. | **Suffisant pour W1**, à condition que A-2 soit tranché pour A2 et le mobile. |
| **P2 — Bibliothèques et catalogues** | — BIB-19 à 23 : premier lot = Bibliothèques génériques KODJO.<br>— F4-G : une révision active par fiche source.<br>— Homonymes de sources distinctes admis, sans suffixe.<br>— « Le fichier catalogue n'est pas une Bibliothèque utilisateur. » | — **Relation fichier catalogue ↔ Bibliothèque** : non définie. Le format n'a aucune notion de Bibliothèque ni de composition (**A-1, bloquant pour W1**).<br>— Désinstallation : « À CLARIFIER » au registre, mais représentée dans Figma `12098:115` (**A-4**).<br>— Coexistence de plusieurs catalogues : le registre la supporte (`installed_sheets` par catalogue, `movement_id UNIQUE`). La règle pour une même fiche présente dans deux Bibliothèques suit F4-G, pas encore codée. | **Incomplet** : A-1 est bloquant. |
| **P3 — Modèle de données** | — Registre CA-3 réemployé (registre séparé admis provisoirement).<br>— Migration additive dans la base principale, numérotée à l'intégration.<br>— `normalized_name UNIQUE` (migration 013) à assouplir pour les sources. | — Garde de lecture seule : aucune donnée persistée ne porte l'origine dans `Movement`. Le registre seul le permet.<br>— Numéro de migration : **≥ 028**, car 024 à 027 sont occupées par `pre10-son-voix`. La documentation dit « 024 occupée » : elle est **dépassée**.<br>— Tables Bibliothèque et composition : proposées, non arrêtées.<br>— Métadonnées des médias : présentes dans la fiche. Le cache n'est pas spécifié (technique). | **Suffisant pour W1** (aucune persistance mobile requise). Les migrations attendent la base d'intégration (**A-3**). |
| **P4 — Format autonome** | Format v1 `1.0.0` documenté (`docs/KODJO-Format-catalogue-mouvements-v1.md`, sur la branche catalogue seulement) : validation stricte, refus atomique, empreinte, médias `EMBEDDED`/`REMOTE` (HTTPS), au plus 30 par fiche. | — `authors[]` à remplacer par `author` (MOUV-D1). Il faut une **version 2** avec relecture de la v1 (0 ou 1 auteur converti, plusieurs auteurs refusés). Changement **technique**, déjà arbitré sur le fond.<br>— Bibliothèque : selon A-1.<br>— Aller-retour sans perte : non testé avec un éditeur (aucun éditeur v1 n'existe). | **Bloqué par A-1.** Le reste est technique et déterminé. |
| **P5 — Contrats de services** | — Chargement CA-3 livré : `prepare`, `recoverInterrupted`, `accept`, `defer`, `refuse`.<br>— API cible proposée au chapitre 11 (`applyLibraryUpdate` …). | — **Validateur unique pour Node et application** : le domaine TS doit être exécutable par Node, ce qui demande une compilation ciblée (choix technique de W1).<br>— Création et révision automatique d'une fiche : à écrire, dans le domaine partagé.<br>— Export, inventaire des Mouvements non rattachés, rapprochement A2 : absents.<br>— Appairage et réseau : non spécifiés (contrat W2).<br>— Garde de lecture seule dans `MovementCatalogueService` : absente. | **Suffisant pour W1** : le contrat création/révision est écrit dans le plan W1. Le reste est à écrire par tranche. |
| **P6 — Intégration** | — Plan en six étapes (Hermann, 11/11).<br>— Aucune migration concurrente.<br>— Pas de fusion dans `main` sans accord. | — **Base B1** : la ligne la plus avancée, `pre10-son-voix`, n'est pas poussée (**A-3**).<br>— Ligne de conception non fusionnée, sans PR : elle doit rejoindre B1.<br>— Pile #421 à #434 : à **clore** après portage sélectif (**A-5**). | **Bloqué pour B1 seulement.** |

---

## 3. Arbitrages restant à valider (livrable 2)

Chaque arbitrage vient avec une proposition. Aucune n'est appliquée.

| ID | Question | Bloque | Proposition |
|---|---|---|---|
| **A-1** | Comment un **fichier catalogue** se rattache-t-il à une **Bibliothèque** (Fitness, Pilates…) ? | W1, P4, A1 | **Un fichier = une Bibliothèque** : `catalogue.id` est l'identité de la Bibliothèque, `catalogue.title` son nom, les fiches sa composition. Le pilote des 60 reste une Bibliothèque privée de recette. Une fiche commune à deux Bibliothèques garde la même identité `(source, sheetId)` : c'est F4-G. Cela ajoute un champ `catalogue.source` (éditeur KODJO) distinct de `catalogue.id`. |
| **A-2** | Statut des Mouvements après rattachement :<br>(a) les **60 historiques** rattachés deviennent-ils des fiches importées en lecture seule (MOUV-D3) ?<br>(b) un Mouvement **personnel** envoyé à l'administration (A2), puis catalogué et rattaché, devient-il une fiche importée en lecture seule ? | Garde de lecture seule, A2, A1 | (a) **Oui**, après le rattachement. Le circuit de conflits CA-3 reste réservé aux révisions qui arrivent sur une adaptation **antérieure**.<br>(b) **Oui** : le rattachement transfère la propriété éditoriale à la source. L'utilisateur garde ses paramètres d'Exercice (BIB-08). |
| **A-3** | **Base de la branche d'intégration B1** : `pre10-son-voix` (locale, non poussée, la plus avancée) ou la clôture de PRE-10 ? | B1, migrations, A1, R | Partir de **`pre10-son-voix` dès qu'elle est poussée**. Sinon, attendre la clôture de PRE-10. W1 et W2 ne dépendent pas de cette base : ils se développent sur la branche catalogue. |
| **A-4** | **Figma, étape 3** (le plan en six étapes la place avant le mobile) :<br>(a) qui conçoit ?<br>(b) les entrées « Mes bibliothèques » et « Bibliothèques partagées » : masquées ou inactives au premier lot ?<br>(c) la désinstallation de `12098:115` est-elle dans le premier lot ? | A1 | (a) Proposition de maquettes par Claude dans Figma, **sur ton autorisation explicite**, puis validation.<br>(b) **Masquées.**<br>(c) **Hors premier lot.** On confirme seulement que la règle affichée (les mouvements utilisés restent) sera la règle future. |
| **A-5** | Sort de la pile #421 à #434 | Hygiène, B1 | **Portage sélectif** de `tools/catalogue-admin/` et des validateurs dans W1, puis **fermeture** des PR avec un renvoi. Aucune fusion. |
| **A-6** | Ce que contient la tranche **W2**, absente du plan en six étapes | W2 | La conserver : arbitrage Wi-Fi du 10/11. Elle se rattache aux étapes 4 et 6 comme **canal de transport** du même format. |
| A-7 *(confirmation)* | Retrait de mon conseil du 10/11, « Profil sans maquette d'abord » | — | Ce conseil **contredit** l'étape 3 confirmée le 11/11 : je le retire. |

Points non bloquants (choix techniques, signalés et non arbitrés comme règles) :
- version 2 du format pour `author` ;
- compilation du domaine TS pour Node ;
- médias dans W1 :
  - les photos `EMBEDDED` sont conservées (capacité OVH existante) ;
  - les vidéos sont `REMOTE` en HTTPS ;
  - aucun transfert physique vers le téléphone avant le bloc C ;
- stratégie de cache ;
- index partiel des homonymes.

---

## 4. Modèle de données consolidé (livrable 4)

Il s'appuie sur les sources existantes. Les éléments **proposés** sont marqués comme tels.

```
Source éditoriale (KODJO, ANKUSHA…)         [proposé A-1 : catalogue.source]
  └─1:N─ Bibliothèque = fichier catalogue    catalogue.id, title, revision, owner|null, manager|null, publisher|null, publicationAllowed
           ├─ références (catégories, zones, spécialités, familles gestuelles, problèmes cliniques, cibles)
           ├─ glossaire
           └─1:N─ CatalogueSheet             identité (catalogue.id, sheetId) — [A-1 : (source, sheetId)]
                    revision, history[] (révision ↔ auteur de révision)
                    provenance : author|null (MOUV-D1), owner|null, publisher, rightsHolder, license, upstream, origin, visibility
                    content (name, aliases[], startingPosition, equipment, steps[], safetyNotes, notes)
                    classification, sources.documentary (≠ upstream ≠ PI), validation
                    media[0..30] (id, kind, storage, url, caption, alt, sourceUrl, attribution, license, rightsStatus)
                    install.knownLocalMovementIds[]

Téléphone — base principale (kodjo.db)
  Movement (id stable ; name, description, aliases, media, categoryId, bodyZoneIds, phases, levelGroup)
     ← ActivityDefinition.movementId (Exercices) ← Séances / historiques   (jamais modifiés par un import)
  [migration additive ≥ 028, à l'intégration] unicité du nom limitée aux créations personnelles

Téléphone — registre séparé (kodjo-catalogue-registry.db, v1)
  installed_sheets (catalogue_id, sheet_id) → movement_id UNIQUE, revision, fingerprint, sheet_json   = révision active (F4-G)
  pending_operations (reprise), sheet_decisions (reporter/refuser par révision), saved_local_values
  [à ajouter] garde de lecture seule = « movement_id présent dans installed_sheets »   (dépend de A-2)

Administration PC (W1/W2)
  catalogue/catalogues/*.catalogue.json (source éditable) ; boîte d'arrivée des Mouvements envoyés (A2)
```

**Correspondances.**
- La projection `Movement` ← fiche porte sur 5 champs : nom, alias, étapes, catégorie, zones.
- Ne sont pas projetés aujourd'hui :
  - les médias (bloc C) ;
  - les phases et familles (règle absente).

**Compatibilité avec les 60.**
- Les 60 Mouvements sont rattachés via `knownLocalMovementIds` (état ADOPTABLE), sans doublon, comme démontré par les tests CA-3 et CA-4.

---

## 5. Contrat du format autonome (livrable 5)

**Base** : `docs/KODJO-Format-catalogue-mouvements-v1.md`, sur la branche catalogue. Ce document est absent de la ligne de conception, qui y renvoie. Évolutions attendues :

1. **Version** :
   - le lecteur accepte `1.0.0` et `2.0.0`, et l'éditeur écrit `2.0.0` ;
   - la v1 est relue avec `authors[]` : 0 → `null`, 1 → auteur, plus de 1 → refus explicite de la fiche ;
   - tout autre format ou version → refus du fichier entier, comme aujourd'hui.
2. **Bibliothèque** : selon A-1.
3. **Révision** :
   - toute modification effective d'une fiche (empreinte différente) incrémente `revision` de 1 et ajoute une entrée `history[]` (date, auteur de la révision, résumé) ;
   - toute modification d'un en-tête ou d'une référence incrémente `catalogue.revision`.
4. **Médias** :
   - les métadonnées et l'ordre sont conservés ;
   - `EMBEDDED` est lisible et admis pour les photos (≤ 580 000 caractères) ;
   - `REMOTE` exige une URL HTTPS et une source ;
   - un média non autorisé ne quitte jamais la fiche privée (MOUV-D2).
5. **Validation** :
   - même validateur pour l'application et l'administration ;
   - refus atomique : aucun chargement partiel d'un fichier invalide ;
   - les fiches valides dans un fichier invalide ne sont pas importées ; le problème est affiché.
6. **Aller-retour** : `parse(export(f))` doit égaler `f` à l'octet près après normalisation canonique (`canonicalJson`). Ce critère est testé en W1.

---

## 6. Dépendances entre tranches (livrable 6)

| Tranche | Dépend de | Étape du plan en six | Build ? |
|---|---|---|---|
| **M1** (préalable) : auteur unique, format v2, garde de lecture seule côté service | MOUV-D1 (arbitré), A-2 pour la garde | 2, bloc A | Non |
| **W1** : administration v1/v2 | M1 (format), **A-1** | 5 | Non |
| **W2** : Wi-Fi et appairage | W1, A-6 | 4 et 6 (transport) | Non (essai Safari) |
| **Figma Profil** | A-4 | 3 | Non |
| **B1** : intégration BMAD | **A-3**, M1 | 2 (migration ≥ 028) et 6 | Non |
| **A1** : Profil → Bibliothèques | Figma validé, B1, W2 | 6 | **Oui** (réseau local natif) |
| **A2** : envoi des Mouvements | **A-2**, W2, A1 | 4 et 6 | Oui (même build qu'A1) |
| **R** : recette connectée | A1, A2 | 6 | Oui |

Chemin critique : **A-1 → M1 → W1 → W2**. En parallèle : **A-4 → Figma**, et **A-3 → B1**. Les deux se rejoignent pour A1, puis A2 et R.

---

## 7. Plan de réalisation BMAD (livrable 7)

- La story `_bmad-output/catalogue-connecte/` est créée **en B1**, sur la base A-3. Avant cela, les tranches vivent sur `catalogue/integration-60-main-20261109`, comme CA-1 à CA-4.
- Réemploi, sans reconstruction :
  - CA-1 à CA-4 ;
  - `tools/catalogue-admin/` porté depuis #429 et #432 (serveur, sécurité, écriture atomique, interface OVH, médias) ;
  - `scripts/catalogue/validate-*.mjs` (#425, #433).
- B1 intègre :
  - la ligne de conception `docs/mouvements-reconciliation-A-H-20261111` (fusion sans conflit démontrée) ;
  - la branche catalogue ;
  - la base PRE-10 ;
  - la migration additive ≥ 028.
- Chaque tranche suit le même déroulé : plan, développement, tests, revue indépendante, rapport, **point d'arrêt**.

## 8. Critères d'acceptation et tests (livrable 8)

| Tranche | Critères principaux | Tests |
|---|---|---|
| M1 | — Fichier v1 à 0 ou 1 auteur relu sans perte, à plusieurs auteurs refusé.<br>— Le pilote est réécrit en v2 avec une empreinte de contenu inchangée hors auteur.<br>— `update`, `duplicate` et variante sont refusés par le **service** pour un Mouvement rattaché (selon A-2).<br>— Les paramètres d'Exercice restent modifiables. | Jest : format, provenance, conversion, service sur SQLite réelle (`NodeSqliteDatabase`). |
| W1 | — Ouverture du fichier des 60.<br>— Création d'une **61e fiche**.<br>— Modification de toutes les propriétés et médias.<br>— Révision +1 avec entrée d'historique seulement si changement effectif.<br>— Export relu par `parseMovementCatalogueFile` sans transformation (aller-retour).<br>— Fichier invalide refusé.<br>— Anciens brouillons importables.<br>— Contrôles Host/Origin/CSP conservés. | `node --test` serveur ; Jest domaine ; aller-retour ; essai manuel navigateur PC par Hermann. |
| W2 | — Écoute sur le réseau local avec code d'appairage temporaire, révocable et expirant.<br>— Sans code : refus (401).<br>— Taille limitée.<br>— Listes et téléchargement au même format.<br>— Boîte d'arrivée validée.<br>— Rien d'exposé sur Internet. | `node --test` ; **essai Safari iPhone** (pare-feu, box). |
| Figma | Écrans validés par Hermann : liste, détail, chargement, aperçu de mise à jour, provenance éventuelle. | Validation visuelle humaine. |
| B1 | — Fusion sans conflit.<br>— Migration ≥ 028 testée sur base peuplée (60 Mouvements, Séances, historiques conservés).<br>— Suite complète exécutée, résultats réels. | Jest complet, `tsc`, `eslint`. |
| A1 | — Liste des installées (registre).<br>— Chargement par fichier et par administration.<br>— Revue fiche par fiche (CA-4 réemployé).<br>— 60 rattachées sans doublon.<br>— Les Séances restent intactes. | Jest écran et service ; iPhone. |
| A2 | — Seuls les Mouvements non rattachés sont envoyés.<br>— « Ajouter au catalogue » renseigne `knownLocalMovementIds`.<br>— Rechargement → ADOPTABLE, ni écriture ni doublon. | Jest et `node --test` ; iPhone. |
| R | Cahier OK/KO en ligne (format PRE-9) : 60 Mouvements, 61e fiche, médias, révisions, adaptations, homonymes, coupure et reprise, reconnexion, non-régression des Séances. | iPhone réel. |

---

## Preuves et tests

| Commande | Résultat |
|---|---|
| `git fetch`, `log`, `cherry`, `merge-tree` (§ 1) | Constats cités. |
| `npx jest src/domain/catalogue src/features/catalogue tools/catalogue` sur `7b43c2d5` | **PASS, 7 suites, 88 tests** (96 s). L'existant CA-1 à CA-4 est sain ; aucun code modifié. Suite complète non relancée (hors périmètre d'un audit). |
| Figma `get_metadata` et `get_screenshot` (`1992:778`, `12098:115`, `10419:22924`…) | Constats du § 1.4. |

## Hypothèses non démontrées

- La rétro-compatibilité de lecture v1 → v2 est proposée, pas codée.
- La compilation du domaine TS pour Node n'est pas essayée.
- La joignabilité Wi-Fi n'est pas essayée.
- `pre10-son-voix` n'est pas observée sur le dépôt distant. Son contenu est lu en local.

## Modifications réalisées / non corrigé

- Seul ce rapport a été écrit.
- Non corrigés, signalés :
  - documentation « migration 024 » dépassée ;
  - chapitres 06 et 13 sans `12098:115` ;
  - noms de calques Figma obsolètes.
  
  Ces corrections sont à faire dans la ligne de conception ou en B1.

## Vérifications restant à faire sur appareil réel

- CA-4 n'a jamais été validé sur iPhone.
- A1, A2 et R : voir § 8.

## Fichiers modifiés

- `.github/orchestration/reports/2026-11-11_CATALOGUE-CONNECTE-QUALIFICATION-PREREQUIS.md`

## Commit final et état Git

Commit documentaire sur `catalogue/integration-60-main-20261109`, poussé. Le hash est communiqué dans le compte rendu de session.
- Aucune modification de PRE-10.
- Aucune build, aucune OTA.
- Aucune fusion dans `main`.
- Figma non modifié.
