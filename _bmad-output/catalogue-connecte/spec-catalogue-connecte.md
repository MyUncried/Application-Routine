# Catalogue connecté — fiches Mouvement, catalogue autonome et Bibliothèques (spec du lot)

Ouvert le 11/11/2026 sur instruction de Hermann (« Exécution continue et autonome », tranches P0 → W1 → W2 → A1 → A2 → B1 → R). Branches :
- développement : `catalogue/connecte-dev-20261111` ;
- administration (W1, W2) : `catalogue/connecte-admin-20261111`, fusionnée dans la branche de développement ;
- documentation : `docs/catalogue-bibliotheques-baseline-20261111` ;
- **intégration BMAD** : `catalogue/integration-pre10-20261111`, partie de `composition-phases-duree` (`f5bb4316`, recette iPhone PRE-10 n° 2 entièrement OK).

Rapports de mission :
- `.github/orchestration/reports/2026-11-11_CATALOGUE-CONNECTE-QUALIFICATION-PREREQUIS.md` ;
- `.github/orchestration/reports/2026-11-11_CATALOGUE-BIBLIOTHEQUES-BASELINE-RECONCILIEE.md` ;
- `.github/orchestration/reports/2026-11-11_CATALOGUE-CONNECTE-W1-W2.md` ;
- `.github/orchestration/reports/2026-11-11_CATALOGUE-CONNECTE-LIVRAISON.md`.

## Décisions (Hermann, 11/11/2026)

Les décisions A-1 à A-6 sont recopiées au registre (ch. 07, « Décisions A-1 à A-6 — reprise du chantier Catalogue autonome »). Extraits normatifs :

- **A-1** : « Une Bibliothèque n'est pas définie par un fichier physique. Une Bibliothèque est une collection logique identifiable de références vers des fiches Mouvement. »
- **A-2** : « une fiche Mouvement importée ne peut être ni copiée, ni dupliquée, ni modifiée, même pour créer une version personnelle. »
- **A-3** : l'intégration part de la ligne PRE-10 la plus avancée, stable et qualifiée.
- **A-4** :
  - les écrans Figma existent ;
  - « Mes bibliothèques », « Bibliothèques partagées » et la désinstallation sont reportées hors du premier lot.
- **A-5** : les PR #421 à #434 sont reprises sélectivement ; elles ne sont fermées qu'une fois leur remplacement vérifié.
- **A-6** : le Wi-Fi n'est qu'un canal de transfert du catalogue autonome.

Également appliquées :
- MOUV-D1 à D4 ;
- BIB-19 à BIB-23 ;
- F4-A à F4-G ;
- la décision du 10/11 sur le propriétaire inconnu.

**Base d'intégration (A-3)** :
- `pre10-son-voix` (11/11, migrations 025 à 027) n'est pas sur `origin` et reste en cours (« essai en cours non livré ») : elle n'est donc pas qualifiée ;
- `composition-phases-duree` est la ligne poussée et qualifiée la plus avancée ;
- `git merge-tree` avec `pre10-son-voix` : un seul conflit, documentaire, au ch. 12 ; les deux lignes ajoutent une section en fin de document et la résolution consiste à garder les deux.

## Stories

### P0 — Modèle de données et format autonome

| Livré | Module |
|---|---|
| Format v2 `2.0.0` :<br>— auteur unique ;<br>— `libraries[]` par références `(catalogueId, sheetId)` ;<br>— relecture et conversion de la v1 ;<br>— refus de `LOCAL_DERIVED` ;<br>— sérialisation de référence et aller-retour. | `src/domain/catalogue/MovementCatalogueFile.ts`, `MovementEditorialProvenance.ts` |
| Fichier pilote régénéré en v2 : Bibliothèque privée de recette `kodjo.pilote-60`. | `catalogue/catalogues/kodjo-pilote-60.catalogue.json`, `tools/catalogue/convertPilotCorpus.ts` |
| Registre v2 (base distincte, sans migration de la base principale) :<br>— Bibliothèques installées ;<br>— opérations interrompues ;<br>— décisions ;<br>— conversion v1 sans perte. | `src/infrastructure/catalogue/SqliteCatalogueRegistry.ts` |
| Plan de Bibliothèque :<br>— ajoutées, rattachées, modifiées, retirées, à examiner ;<br>— F4-G ;<br>— états. | `src/domain/catalogue/libraryPlan.ts` |
| Service des Bibliothèques, qui réemploie CA-3 fiche par fiche. | `src/features/catalogue/LibraryService.ts` |
| Garde A-2 dans le service :<br>— `update` et `createAsNew` refusés (`PROTECTED`) ;<br>— canal source `updateFromSource`. | `src/features/activities/MovementCatalogueService.ts`, `src/features/catalogue/importedMovements.ts` |

**Critères d'acceptation**
- Un fichier v1 à 0 ou 1 auteur est converti.
- Un fichier v1 à plusieurs auteurs est refusé.
- Une fiche peut figurer dans plusieurs Bibliothèques sans copie.
- Aller-retour au caractère près.
- Le registre v1 est converti sans perte.
- Modification et duplication d'un Mouvement importé sont refusées par le service.

**Tests** :
- `src/domain/catalogue/__tests__/MovementCatalogueFile.test.ts` ;
- `LibraryService.sqlite.test.ts`.

### W1 — Administration Web sur le format v2

Le serveur Node local évolue (`tools/catalogue-admin/`) :
- domaine TypeScript transpilé et partagé entre le serveur et la page, donc un seul validateur ;
- `catalogueEditing.ts` : création d'une fiche, révision seulement si l'empreinte change, Bibliothèques ;
- galerie de médias de la page OVH reprise ;
- révisions recalculées par le serveur ;
- écriture atomique et contrôle 409.

La page OVH en ligne reste inchangée.

**Critères d'acceptation**
- Création d'une 61e fiche.
- Modification de toutes les propriétés.
- Révision +1 seulement en cas de changement effectif.
- L'export est relu sans perte.
- Un fichier invalide est refusé.

**Tests** : `node --test tools/catalogue-admin/server.test.mjs`, `catalogueEditing.test.ts`.

### W2 — Connexion Wi-Fi

- Port téléphone 4739 (`--lan`), réservé au réseau local.
- Appairage par code à 6 chiffres :
  - valable 5 minutes, usage unique ;
  - verrouillage après trop d'échecs ;
  - jeton de 12 h, révocable.
- Bibliothèques et fichier v2 servis à l'octet près.
- Boîte d'arrivée `KODJO_MOVEMENT_INBOX`.
- MOUV-D2 : un fichier contenant un média aux droits non confirmés n'est pas transféré (409 `MEDIA_RIGHTS_UNCONFIRMED`). [Remplacé le 11/11/2026, décision de Hermann pendant la recette : « Refuse uniquement la fiche, il faut en donner le nom ». Seule la fiche concernée est retirée du transfert et nommée sur le téléphone (« Fiche non transférée ») ; refus du fichier entier seulement si le fichier filtré n'est pas valide.]

**Critères d'acceptation** : appairage et transferts dans les deux sens, testés et sécurisés.

**Contrôle manuel** : essai Safari sur l'iPhone (§ R, partie W2).

### A1 — Profil → Bibliothèques

Écrans Figma réemployés, page 510:101 :

| Écran | Nœud Figma |
|---|---|
| Profil | 12119:25611 |
| Ajouter | 12116:25073 |
| Connexion | 12116:25103 à 12116:25238 |
| Disponibles | 12118:25124, 12119:25204, 12119:25277 |
| Aperçu et installation | 12118:25170, 12118:25220 |
| Mise à jour | 12118:25251, 12118:25316, 12118:25370 |
| Fichier invalide | 12119:25162 |
| Reprise | 12119:25245 |
| Bibliothèque installée | 12098:115, sans « Désinstaller » |
| Mouvement importé en lecture seule | 12119:25304 |

- Code : `src/features/catalogue/LibraryScreens.tsx`, `ProfileLibrariesSection.tsx`, `adminClient.ts`, `app/library-*.tsx`, `MovementScreen.tsx`.
- Configuration native : `expo-network`, `NSLocalNetworkUsageDescription`, `NSAllowsLocalNetworking`. Une build est nécessaire.

**Critères d'acceptation**
- Installation sans doublon des 60.
- Mise à jour volontaire, avec Reporter et Refuser.
- Reprise après interruption.
- Fichier invalide refusé en entier.
- Lecture seule des fiches importées.
- Aucune fonction reportée n'est affichée.

**Tests** :
- `src/features/catalogue/__tests__/LibraryScreens.test.tsx` ;
- `MovementScreen.b2.integration.test.tsx` (A-2) ;
- `ProfileEditScreen.test.tsx`.

### A2 — Envoyer mes mouvements

- Seuls les Mouvements personnels sont proposés (jamais les importés).
- Choix par interrupteur natif.
- Envoi validé par le contrat partagé, sans modification locale.
- Côté administration : « Ajouter au catalogue » et « Rapprocher », avec `knownLocalMovementIds`.

**Critères d'acceptation**
- Au rechargement, le Mouvement est reconnu par son identifiant : ni doublon, ni écrasement.
- Le rattachement d'un Mouvement personnel reste **non appliqué** tant que la règle n'est pas arbitrée (À CLARIFIER n° 1).

**Tests** : `LibraryService.sqlite.test.ts` (aller-retour) et `LibraryScreens.test.tsx`.

### B1 — Consolidation

- Branche d'intégration, avec fusion de la baseline documentaire.
- Suite complète exécutée : voir le rapport de livraison.
- Revue indépendante et corrections : rapport de livraison.

### R — Recette connectée

Cahier : `_bmad-output/catalogue-connecte/implementation-artifacts/recette-iphone-catalogue-connecte.md`, avec sa version en ligne (OK/KO). La recette exige une build de développement : à autoriser par Hermann.

## Synchronisation code / documentation

| Comportement | Classe | Documents |
|---|---|---|
| Bibliothèque = collection logique de références (A-1) | B | ch. 07 (A-1 à A-6), ch. 04, 09, PRODUCT, INDEX ; format § 10 |
| Fiche importée non modifiable, non duplicable, garde dans le service (A-2) | B | ch. 07, 08, 10, documents Bibliothèques ; BIB-06/07 révisés |
| Auteur unique, format v2 | B (MOUV-D1) et D (version de format) | format § 10, ch. 07 |
| Registre v2, base distincte | D | ch. 12, format § 10 |
| Administration v2 et Wi-Fi | B (A-6) et D | format § 11 et § 12, README de l'outil |
| Boîte d'arrivée : bornes du contrat du Mouvement (QN-1) | A | format § 12 (borne 20/65 remplacée, annotée) |
| Transfert Wi-Fi refusé si un média a des droits non confirmés | A (MOUV-D2) | format § 12, rapport de livraison |
| Seule la fiche au média non confirmé est retenue, et nommée (décision du 11/11, recette) | B | format § 12.2 ; spec (W2) |
| Champs de l'administration : tableau de Hermann du 11/11/2026 (30 lignes, recommandation et justification par champ). Retirés : fondement des valeurs, revue de classification, classification d'origine, spécialités proposées à l'origine, saisie de l'identifiant de geste (« qui attribue cet identifiant et comment choisir le geste de référence restent explicitement à arbitrer »), bloc Installation de la fiche, notes du catalogue. Lecture seule : origine, visibilité de la fiche, publication autorisée (Bibliothèque, catalogue). Empreinte et version lue : « Détails techniques » repliés. Tout le reste est gardé, classification comprise (« on garde les éléments de classification zone anatomique, etc bien évidemment »). Valeurs conservées dans le fichier. | B | spec (ce tableau) |
| Licence choisie dans une liste, autorisation déclarée par un bouton (administration) | B (demande de Hermann du 11/11) ; règle du format inchangée | format § 12.2 |
| Premier lot du Profil : Ajouter, Envoyer, Installées (A-4) | B | ch. 06, 08, 13 |
| Mise en page Figma des écrans Bibliothèques (correction du 11/11 : cartes, intitulés au-dessus, icônes et chevrons SVG, pastilles, encarts, états centrés) | A (conformité aux maquettes 510:101) | aucun ; écarts restants dans le rapport de livraison, section « Correction du 11/11 » |

## À CLARIFIER

Points restants, sans décision inventée :

1. **Mouvement personnel envoyé puis catalogué ou rapproché (A2).** On ignore s'il devient une fiche importée en lecture seule une fois rattaché. Il est préservé, reconnu sans doublon, mais **non rattaché** : marqueur `install.personalMovementIds` posé par l'administration, aperçu « à examiner », service `PERSONAL_RULE_PENDING`. Seule cette opération est bloquée.
2. **Familles de niveaux autour d'un Mouvement importé.** Après la revue indépendante, une prudence au titre de A-2 a été retenue, car le niveau créé serait une dérivation partielle (nom, Catégorie, Zones repris). Depuis la fiche, ni « Ajouter un niveau » ni réordonnancement ; `createVariant` est refusé dans le service. Le regroupement par glissement dans le Catalogue (`placeInFamily`, `leaveFamily`) reste permis : organisation locale, pas le contenu de la fiche. **À confirmer** : faut-il admettre ou exclure les familles autour d'un Mouvement importé ?
3. **Conflit d'une adaptation historique des 60 pendant une mise à jour de Bibliothèque.** Figma ne montre pas de choix fiche par fiche. La fiche est laissée « à examiner » (canal CA-3/CA-4), jamais écrasée.
4. **Homonymes de sources distinctes.** Ils exigent une migration additive de `movements.normalized_name`. Son numéro doit être ≥ 029 (`pre10-son-voix` utilise 025 à 027, `pre10-fin` la 028 — guidage de la Séance), à coordonner avec la clôture de PRE-10. Non développée. En attendant, une fiche homonyme est « bloquée » et laissée à examiner.
5. **Désinstallation, « Mes bibliothèques », « Bibliothèques partagées »** : reportées (A-4) ; les écrans Figma sont conservés.
6. **Section « Validation » d'une fiche (administration)** — question de Hermann du 11/11 : « que veulent dire tous ces champs, comment suis-je supposé les renseigner ? ». Constat : `classification`, `clinical`, `rights` (classeur des 60, `validation`) et `corpusReview`, `licensing`, `clinicalValidation` (statut de revue et proposition du corpus) sont des **textes libres** repris tels quels de la transcription des 60 ; aucune liste de valeurs n'est définie ; aucun code ne s'en sert, sauf `publicationAllowed` (exige un propriétaire identifié ; conditionne la publication d'une Bibliothèque). « Droits » et « Licences » se recouvrent, comme « Clinique » et « Validation clinique ». **Tranché le 11/11/2026** (Hermann : « je n'ai exprimé aucun besoin, alors pourquoi les développer s'ils ne sont pas nécessaires, c'est de l'administration, du temps, des questions absolument pour rien ») : section retirée de l'administration ; valeurs existantes conservées dans le fichier, sans affichage ni effet.
