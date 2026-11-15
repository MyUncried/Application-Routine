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
- MOUV-D2 : un fichier contenant un média aux droits non confirmés n'est pas transféré (409 `MEDIA_RIGHTS_UNCONFIRMED`). [Remplacé le 11/11/2026, décision de Hermann pendant la recette : « Refuse uniquement la fiche, il faut en donner le nom ». Seule la fiche concernée est retirée du transfert et nommée sur le téléphone (« Fiche non transférée ») ; refus du fichier entier seulement si le fichier filtré n'est pas valide.] [12/11/2026, classe B : filtre étendu à l'export et à l'import d'un fichier ; encadré « Fiche non transférée » retiré du téléphone ; fiches non diffusables signalées dans l'administration. Décisions de Hermann du 12/11/2026 (recette) : (a) export et import de fichier filtrés comme le transfert — « J'aurais proposé l'option B, pour que à la source, toute diffusion non autorisée ne puisse arriver. Je suis OK pour A » puis « Je confirme les trois points » (A + B) ; (b) « L'utilisateur n'a pas besoin de savoir qu'une fiche a été retenue, c'est le problème de l'expéditeur » : plus d'encadré « Fiche non transférée » sur le téléphone ; (c) l'administration signale les fiches non diffusables.]

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
- Mise à jour volontaire, avec Refuser et Mettre à jour. [12/11/2026, constat d) : « Reporter » supprimé — remplacé ; texte d'origine : « avec Reporter et Refuser ».]
- Reprise après interruption.
- Fichier invalide refusé en entier.
- Lecture seule des fiches importées.
- Aucune fonction reportée n'est affichée.

**Tests** :
- `src/features/catalogue/__tests__/LibraryScreens.test.tsx` ;
- `MovementScreen.b2.integration.test.tsx` (A-2) ;
- `ProfileEditScreen.test.tsx`.

### A2 — Envoyer mes mouvements

> [12/11/2026 — RETIRÉ du Profil par décision de Hermann : « on retire "Envoyer mes mouvements" il n'y a pas de scénario pour cela. On partage une bibliothèque de mouvements, pas des mouvements individuels. » Le texte ci-dessous est conservé. L'écran d'envoi, sa route et la Boîte d'arrivée du PC restent dans le code, sans point d'entrée : suppression à décider.]

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
| Mouvement importé : symbole livre seul, dans le cadre du crayon ; un appui ouvre la fenêtre d'information de la fiche (bibliothèque, catalogue, source, propriétaire, auteur, éditeur, ayant droit, licence, version), un nouvel appui la ferme (recette du 11/11, a1-lecture-seule : « Ne laisser que le symbole, dans un cadre tel que celui de l'édition […] ») | B | spec A1 ; Figma 12119:25304 (pastille « Fitness · rév. 2 ») remplacée par cette décision |
| Licence choisie dans une liste, autorisation déclarée par un bouton (administration) | B (demande de Hermann du 11/11) ; règle du format inchangée | format § 12.2 |
| Premier lot du Profil : Ajouter, Envoyer, Installées (A-4) | B | ch. 06, 08, 13 |
| Mise en page Figma des écrans Bibliothèques (correction du 11/11 : cartes, intitulés au-dessus, icônes et chevrons SVG, pastilles, encarts, états centrés) | A (conformité aux maquettes 510:101) | aucun ; écarts restants dans le rapport de livraison, section « Correction du 11/11 » |
| Écran Profil (Modifier le profil) aligné sur Figma 12119:25611 au-dessus des Bibliothèques (demande de Hermann du 11/11 : « les trois onglets, la couleur, la disposition de la photo, du nom et du pseudo ») : onglets Profil / Préférences / Communauté à la place du titre et du Retour, fond #F7F7FF, carte « Profil » (avatar 64, pastille appareil photo, « Modifier la photo », ligne « Nom », silhouettes 40) ; comportement d'édition et d'enregistrement inchangé | A (conformité à la maquette) ; interprétations sans donnée ni écran : point 7 ci-dessous | aucun ; rapport de livraison, section « Écran Profil aligné sur Figma (11/11) » |
| Familles de niveaux des fiches (décision de Hermann du 11/11/2026, patch « KODJO-familles-niveaux ») : administration (créer, rattacher, réordonner, détacher, par les noms), propriété `levelGroup` de la fiche, révision à chaque changement effectif, transfert, placement sur le téléphone (`catalogue:<catalogue.id>#<groupId>`), adaptations locales conservées | B | patch appliqué : ch. 07 (décision du 11/11), conception du partage, parcours cibles, format (§ « Familles de niveaux des fiches — cible » et « format retenu ») |
| Bouton « Charger un catalogue (test local) » retiré du Catalogue des mouvements (demande de Hermann du 11/11 : « Peux tu aussi retirer le bouton […] ») | B (outil de recette, sans règle fonctionnelle) | aucun ; la route `catalogue-load` reste, sans point d'entrée |
| Fiche non appliquée : cause précise (archivée ou supprimée sur le téléphone, révision incohérente, révision refusée, interruption) et action possible ; bandeau « Propriétaire inconnu » nommant la Bibliothèque ou les fiches sans propriétaire (demande de Hermann du 11/11 : « Que veulent dire ces deux messages ? », réponse « Ok » à la proposition) | B (textes) ; règles inchangées (propriétaire inconnu = privé, décision du 10/11) | spec (ce tableau) |
| [12/11/2026 — défaut remplacé par « Utilisateur local » (ce PC), voir la ligne « Identité des acteurs » ci-dessous ; l'aide reste.] Propriétaire par défaut des nouvelles fiches et Bibliothèques = propriétaire déclaré du catalogue ; aide « Déclaratif, non vérifié (aucun compte dans le MVP) » sous chaque « Propriétaire » (Hermann, 11/11 : « Il faut mettre mon compte / mon nom pour toutes les fiches de test par défaut ») | B | spec ; la règle « aucune attribution par déduction » (10/11) reste : le propriétaire est une déclaration de l'administrateur, pas une déduction |
| Fiche d'un Mouvement importé en famille : le menu Niveau reste affiché, « Ouvrir un autre niveau » actif ; « Ajouter un niveau » et « Réordonner les niveaux » grisés (recette fn6 du 12/11 : « changer de niveau n'est pas proposé dans les fiches ») | A (A-2 n'interdit que la modification ; consulter un autre niveau n'en est pas une ; point 2 « Depuis la fiche, ni « Ajouter un niveau » ni réordonnancement » respecté) | aucun |
| [12/11/2026 — hauteur de la zone de contexte, intitulé « Profil » et place des silhouettes remplacés : voir la ligne « recette c1/c2 du 12/11 ».] Écran Profil, recette c1/c2 du 11/11 (Hermann : « Il manque la zone de contexte avec dégradé vers la couleur de l'écran » ; « retirer le texte Modifier la photo », « faire l'icône de la photo plus petit », « zone de profil, pas de cadre ») : bande des onglets suivie d'une part fondue vers la transparence (D-224), corps défilant derrière ; libellé « Modifier la photo » retiré, pastille 22 / icône 12 devenue la commande accessible de la photo ; zone Profil sans fond, contour ni ombre | B (demande explicite ; écarts à Figma 12119:25611 voulus) | aucun document fonctionnel ; Pseudo toujours absent (À CLARIFIER n° 7, non traité) |
| Identité des acteurs dans l'administration (décision de Hermann du 12/11/2026, cahier de recette, « Autres remarques » c) : « Un acteur n'a de valeur que s'il est une identité stable, unique et traçable. Aucun texte libre. » Menu réduit à « Inconnu (null) » et « Utilisateur local » pour l'en-tête d'une Bibliothèque (« Éditeur (composition) », « Propriétaire ») et la Provenance d'une fiche (« Propriétaire », « Auteur (unique) », « Diffuseur », « Ayant droit ») ; « Utilisateur local » = identifiant généré une fois pour l'installation PC, persistant (`catalogue/admin/installation.json`, non versionné), jamais saisi, nom affiché « PC Administrateur » ; défaut d'une fiche ou Bibliothèque créée dans l'administration : « Utilisateur local » (propriétaire ; éditeur pour la Bibliothèque) ; valeurs existantes hors menu lisibles, conservées, signalées | B | spec ; provenance § 7 ter (ajouté) ; README de l'outil. Le texte cite « branche cat60, sections 7 bis et 7 ter » : 7 bis existe, 7 ter n'existe sur aucune branche ni worktree — recopié ici depuis le texte de Hermann |
| Écran Profil, recette c1/c2 du 12/11 (Hermann : « la zone de contexte doit avoir la taille standard, vérifie car là elle est beaucoup moins haute » ; « Retirer le titre de section Profil », « remonter la photo et le nom (qui viendra plus tard du compte utilisateur) », « retirer "Nom" […], retirer la barre de séparation verticale », « les deux silhouettes doivent être dans la zone de contexte ») : zone de contexte à la hauteur standard des Catalogues (115, fondu D-224), silhouettes dedans ; plus d'intitulé « Profil » ni de libellé « Nom » ; séparateur de la carte retiré. Aucune barre verticale trouvée dans le code (à confirmer sur l'iPhone). Pseudo non développé (À CLARIFIER n° 7). Contre-recette du même jour (« corrige la zone de contexte, tu vois bien qu'elle n'est pas conforme » ; « il faut remonter la photo, le nom » ; « UTILISE LES COMPOSANTS STANDARDS TOUT LE TEMPS ») : zone remplacée par le composant canonique `ContextBand` des Catalogues (fondu par couches, géométrie CE-CAT-CTX-01) ; photo et nom remontés (retrait de la liste des Catalogues), nom centré sur la photo | B (demande explicite ; remplace la bande de 14 pt de la ligne c1/c2 du 11/11) | aucun document fonctionnel |
| Aperçus d'une Bibliothèque sur l'iPhone (constat d) du 12/11/2026, cahier de recette, « Autres remarques ») — **avant installation** : « Une fiche est "déjà présente" si elle existe dans le Catalogue de l'utilisateur, quelle que soit la bibliothèque (installée ou personnelle) qui l'a apportée. Sinon elle est "nouvelle". » ; invariant nouvelles + déjà présentes = total ; avertissement « Propriétaire inconnu : usage privé / Ces fiches restent sur ce téléphone : elles ne peuvent être ni partagées, ni redistribuées. » « uniquement si le propriétaire de la bibliothèque est inconnu ». **Mise à jour** : libellé « Révision N → M · détail par fiche » ; compteurs accordés ; « supprimer le bouton "Reporter" » ; « Refuser » pleine largeur au-dessus de « Mettre à jour » ; « Si une mise à jour ne contient aucun écart réel, ne pas proposer l'écran : la révision est considérée à jour. » Cause des 0 : les fiches déjà installées par une autre Bibliothèque (état « à jour ») n'étaient comptées nulle part ; « Nouvelle » d'une mise à jour = fiche qui entre dans la Bibliothèque, déjà au Catalogue ou non. Titre : le code affiche déjà le nom de la Bibliothèque ; « Bibliothèque publiable » est le nom réel d'une Bibliothèque du fichier de recette (6 fiches, dont une retenue pour média → 5) | B | spec ; aucun document fonctionnel ne décrivait ces compteurs. [Remplacé : bandeau « Cause : … » nommant les fiches sans propriétaire (recette fn14 du 11/11) ; « Reporter » (mise à jour volontaire, spec A1 « avec Reporter et Refuser »)] |
| Sections du Profil (décision de Hermann du 12/11/2026 : « "Mes bibliothèques" avec en dessous une ligne "Créer une Bibliothèque" […] "Bibliothèques installées" reste comme elle est, avec en première ligne "Ajouter une bibliothèque" » ; recette c2 : « se référer à Figma, écran "P-Profil — Modifier le profil — Sections sans bibliothèque" », 12116:25015) : deux sections toujours affichées. [12/11/2026 — remplacé par la ligne « Bibliothèques personnelles, premier temps » : « Créer une bibliothèque » ouvre l'écran Figma 12206:26111 et les Bibliothèques de l'utilisateur suivent.] « Créer une bibliothèque » n'ouvre encore rien (Bibliothèques personnelles non développées). « Envoyer mes mouvements » retiré (décision de Hermann du 12/11/2026 : « on retire "Envoyer mes mouvements" il n'y a pas de scénario pour cela. On partage une bibliothèque de mouvements, pas des mouvements individuels. »). La pastille « Compte gratuit » de la maquette n'est pas affichée (aucun type de compte dans le MVP) | B | spec |
| Bibliothèques personnelles, premier temps (iPhone) — décisions de Hermann du 12/11/2026 : auteur « A été décidé » (identifiant invisible créé une fois sur l'iPhone, plus tard celui du compte ; nom affiché = Nom du Profil) ; « Les écrans sont fait » (Figma 12206:26111, 12206:26333, 12210:26150, 12213:26248, 12217:26131, 12217:26236) ; « Suivre les écrans Figma, tu peux commencer ». Livré : registre v3 additif (identité d'auteur, Bibliothèques, membres ordonnés) ; Profil « Mes bibliothèques » (Créer, liste) ; Créer (nom dans la zone de contexte, list-plus en bascule, « Tout sélectionner », cartes sélectionnées #EAEAFF / contour bleu, « Créer (N) » inactif sans nom ni Mouvement) ; nom unique par auteur sans casse, refus « Vous avez déjà une bibliothèque nommée « X ». » au toucher de Créer / Valider ; Ma bibliothèque (membres seuls, fiche au toucher, list-plus → Modifier, menu « … » natif : Partager, Exporter, Supprimer en rouge) ; Modifier (nom souligné pendant la saisie, membres présélectionnés, « Valider ») ; Supprimer (confirmation native, Mouvements conservés) ; Partager (« Vers mon PC » et trois destinations grisées « Disponible avec un compte KODJO. »). Ordre des membres = ordre du Catalogue (aucun réordonnancement dans les maquettes). Interprétation des maquettes, à confirmer en recette : list-plus est une bascule (sélectionné : tout le Catalogue ; normal : seulement les Mouvements choisis, vide au départ comme 12206:26111) ; « Tout sélectionner » coche les Mouvements actifs affichés. Deuxième temps (non livré) : « Vers mon PC », « Exporter un fichier » (affichés inactifs), Boîte d'arrivée du PC « Bibliothèque reçue », reconnaissance de sa propre Bibliothèque | B | spec (cette ligne) ; spécification partagée NGm95S1vjAqdzLVr5SefHF supplantée par les écrans Figma sur les points du tableau de la réponse du 12/11 (création en un écran, menu, Modifier sans réordonnancement, Partager) |
| Archivage d'un Mouvement membre d'une Bibliothèque personnelle (décision de Hermann du 12/11/2026 : « Oui, sachant qu'avant de le supprimer on l'archive, donc il faut l'annoncer pendant l'archive ») : confirmation native « Archiver ce mouvement ? / Il fait partie de votre bibliothèque « X ». Archivé, il n'y apparaîtra plus. » (Annuler / Archiver) ; le Mouvement reste membre | B | spec |
| Suppression d'un Mouvement importé (décision de Hermann du 13/11/2026 : « suppression d'un mouvement importé : l'interdire, garder l'archivage, et s'en défaire en désinstallant la bibliothèque. ») : le service refuse (`PROTECTED`, rien n'est écrit) ; dans les Archivés, « Supprimer » d'un Mouvement importé affiche l'alerte « Suppression impossible / Ce mouvement vient de la bibliothèque « X ». Il reste archivé ; seule la désinstallation de la bibliothèque le retirera de votre Catalogue. » sans ouvrir la confirmation. [Remplacé le 13/11/2026 : « La désinstallation reste hors premier lot (A-4) » — voir la ligne suivante.] | B | spec (ce tableau ; point ouvert ci-dessous annoté résolu) |
| Désinstallation d'une Bibliothèque installée (décisions de Hermann du 13/11/2026 : « Oui ajoute la désinstallation à ce lot » ; mouvement aussi présent dans une Bibliothèque personnelle : « Il reste ») — Figma 12098:115 : carte « Désinstaller la bibliothèque » (Medium 14 rouge) sous les mouvements, note « Les mouvements utilisés dans une séance ou dans une autre bibliothèque restent dans le Catalogue. » (« installée » retiré de la note de Figma, la règle couvrant aussi les Bibliothèques personnelles). Confirmation native « Désinstaller « X » ? » : « N mouvements quitteront votre Catalogue. » / « M mouvements restent : utilisés dans une séance ou dans une autre bibliothèque. » ; Désinstaller ramène au Profil. Un Mouvement utilisé dans une Séance, une autre Bibliothèque installée ou une Bibliothèque personnelle reste au Catalogue, toujours importé et protégé (A-2) ; les autres, actifs ou archivés, le quittent. Choix technique (D) : Mouvements supprimés avant le registre, désinstallation rejouable après interruption | B | spec (ce tableau) ; registre chapitre 07 (A-4 et « Limites de validation ») annoté remplacé |
| Écran Profil sans « Enregistrer » (demande de Hermann du 13/11/2026 : « Retirer le bouton enregistrer de l'écran d'accueil du profil », arbitrage « Immédiate ») : photo et silhouette enregistrées dès le choix (`ProfileService.saveAppearance`, le nom enregistré reste tel quel, même absent), nom à la fin de la saisie (`saveIdentity`, inchangé : vide ou plus de 80 caractères refusé, message sous le champ, l'ancien nom reste) ; écritures en file, chacune repartant du dernier Profil enregistré ; plus de dialogue « Abandonner les modifications ? » ni de zone d'action fixe. La barre bleue signalée au focus du nom (même demande : « Retirer la barre horizontale bleue lorsqu'on met le focus sur la zone du nom ») est attribuée, sans preuve sur l'iPhone, à la zone d'action fixe d'« Enregistrer » restée visible au-dessus du clavier ; à vérifier en recette. | B | ch. 13 (Modifier le profil : quatre formulations annotées) ; D-444 inchangée (règle générale du bouton d'action, l'écran Profil n'en a simplement plus) |
| Écran Profil, recette c2 du 13/11/2026 (Hermann : « la photo et le nom ne sont pas dans la zone de contexte » ; « se référer à Figma, écran "P-Profil — Modifier le profil — Sections sans bibliothèque" » ; arbitrage : « Prends comme modèle l'écran figma […] J'ai retiré "Compte gratuit" » ; puis « rendre le fond de la pastille du genre transparente », « tracé bleu, fond blanc », « grandir le cercle pour qu'il fasse la même taille que celui de la photo, et remettre le liseré bleu ») : dans la zone de contexte standard (`ContextBand`), sur une ligne, photo (pastille appareil photo 22, recette du 11/11 conservée), nom, puis un seul rond de silhouette (la choisie ; un appui change de silhouette), 64 pt, fond transparent, liseré bleu, icône non teintée (contour bleu, intérieur blanc) ; Bibliothèques juste dessous. Pseudo de la maquette non affiché (prévu après la fusion de PRE-10). | B (rendu, sans règle métier ; la silhouette reste homme/femme, homme par défaut) | aucun document fonctionnel (Figma définit le rendu) ; cahier v23 : `pr-zone-profil`, lignes c2-profil-carte, c5-profil-biblio, x-c2-zone, x-c2-profil marquées remplacées |
| Écrans Créer / Modifier / Ma bibliothèque, recette du 13/11 (bp-creer-vide, bp-creer-selection, bp-tout-selectionner : « Le format de la zone de contexte n'est pas conforme, vérifier avec le catalogue des mouvements » ; « retirer le trait bleu ») : `ContextBand` du Catalogue (lilas #EAEAFF opaque puis fondu vers la transparence, Figma 12206:26333), liste de Ma bibliothèque remontée sous la part fondue ; soulignement bleu du nom pendant la saisie retiré. | A (zone : conformité à Figma et au Catalogue) et B (trait : Figma 12217:26529 remplacé par la demande) | aucun document fonctionnel ; cahier `bp-zone-contexte`, `bp-trait-nom` |
| Libellé des Bibliothèques disponibles, recette du 13/11 (x-d-maj : « L'information 7 fiches · Révision 8 disponible ne veut rien dire ») : « N fiches · mise à jour disponible » / « … mise à jour refusée », comme l'écran d'une Bibliothèque installée. | B | aucun document fonctionnel (libellé) ; cahier `x-d-libelle` |
| Refus d'une mise à jour, recette du 13/11 (x-d-maj : « Bouton refuser : on reste sur l'écran […] Il faudrait directement revenir sur l'écran ») : retour immédiat à l'écran précédent, plus d'écran « Mise à jour refusée ». | B | aucun document fonctionnel ; cahier `x-d-refuser` |
| Bibliothèque refusée par le PC (média aux droits non confirmés), recette du 13/11 (a1-medias : « Le destinataire n'a pas à savoir que des fiches ne lui sont pas transférées, c'est à l'expéditeur de le savoir et de corriger ») : plus d'encadré « Bibliothèques non transférées » sur l'iPhone ; l'information reste dans l'administration du PC. Prolonge la décision du 12/11 (fiche retenue sans encadré), qui gardait l'encadré pour une Bibliothèque entière. | B | spec du lot (cette ligne) ; cahier `a1-pas-de-message` ; x-d-compteurs réécrit pas à pas (la bibliothèque testée était déjà installée : écran de mise à jour, sans « Installer ») |
| Écran Profil (« Modifier le profil »), demande du 14/11 (« Ajoute la barre de navigation Kodjo à la page d'accueil du Profil ») : écran de l'onglet Profil, barre de navigation affichée avec Profil actif, adresse `/profile-edit` inchangée ; « Préférences » ouvre l'écran Préférences par son adresse ; la liste se termine au-dessus de la barre. Figma 12116:25015 sans barre : remplacé par la demande. | B (rendu ; choix technique : route d'onglet masquée de la barre, `href: null`) | aucun document fonctionnel ; cahier `pr-barre-navigation` |
| Message « Mouvement archivé », recette du 15/11 (« Mouvement archivé s’arrête, réduire la durée à 2.5 secondes ») : affiché 2,5 s puis effacé (`ARCHIVE_NOTICE_MS`). Les autres messages temporaires gardent leur durée (5 s par défaut, 3 s pour les familles). | B (la durée de 5 s était non sourcée, `TransientNotification`) | aucun document fonctionnel (durée d’affichage) ; cahier `cat-archive-duree` |
| Halo de l’action de gauche (✕) sur Créer une bibliothèque et Ma bibliothèque, recette du 14 et du 15/11 (bp-creer-vide, bp-zone-contexte : « il manque le halo et la courbure sous le bouton Annuler (UTILISER LE COMPOSANT STANDARD) ») : option `backHalo` de `ContextBand` (composant partagé, absente par défaut : autres écrans inchangés), géométrie D-348 de la Composition. | A (Figma 12206:26111, 12210:26150) ; choix technique : option du composant partagé | aucun document fonctionnel ; cahier `bp-halo` |
| Nom de la Bibliothèque coupé en bas, recette du 14 et du 15/11 (« Le nom est tronqué horizontalement (lignes coupées en bas) ») : le nom garde sa hauteur propre (28) centrée sur la ligne 1 de 17 de la zone, au lieu d’être mesuré à 17 et rogné. | A | aucun ; cahier `bp-nom-coupe` |
| Ma bibliothèque modifiée sur place, recette du 14 et du 15/11 (« appuyer sur ajouter doit faire apparaître la liste des mouvements, mais pas changer d'écran. Conserver le titre », « le champ nom doit rester modifiable indépendamment de l'appui sur le bouton ajouter », « il doit apparaître comme une modale ») et arbitrage du 15/11 (enregistrement automatique ; feuille plein écran fermée par ✕) : nom modifiable, enregistré à la fin de la saisie (vide ou déjà pris : refusé, l’ancien nom reste) ; « liste + » montre tout le Catalogue dans le même écran, chaque Mouvement coché ou décoché enregistré aussitôt (le dernier ne peut pas être retiré) ; Créer une bibliothèque et Ma bibliothèque en `fullScreenModal`. [Avant : « liste + » ouvrait l’écran Modifier (12217:26131) et « Valider » enregistrait — remplacé.] | B | spec du lot (cette ligne) ; cahier `bp-sur-place`, `bp-modale` |
| Filtre de Créer une bibliothèque, recette du 14/11 (bp-creer-vide : « Quand aucune carte n'est affichée le bouton filtre ne doit pas être actif ») : Filtre inactif tant que la liste est vide. | B | aucun ; cahier `bp-filtre-inactif` |
| Menu « … » de Ma bibliothèque, recette du 14/11 (bp-menu : « "Supprimer la bibliothèque" doit être sur une ligne ») et arbitrage du 15/11 (menu natif d’iOS, largeur fixée par le système) : libellé « Supprimer ». [Avant : « Supprimer la bibliothèque » (12213:26248) — remplacé.] | B | aucun ; cahier `bp-menu-supprimer` |
| Profil, nom refusé, recette du 15/11 (pr-enregistrement : « quitter et rouvrir après le message « Le nom est obligatoire. » […] le nom n'est pas revenu, il est vide ») : en quittant l’écran, une saisie refusée est abandonnée ; au retour, le nom enregistré, sans message. Conséquence de l’écran resté monté dans l’onglet Profil (14/11). | B (précise l’enregistrement immédiat du 13/11) | aucun ; cahier `pr-nom-retour` |
| « Tout sélectionner », recette du 15/11 (bp-zone-contexte : « Tout sélectionner doit passer à Tout désélectionner lorsqu'il est activé, et vice versa », « Ces liens doivent être présents aussi pour les écrans Ma bibliothèque, en mode modification ») : « Tout désélectionner » quand tous les Mouvements affichés sont choisis ; présent dans Créer et dans Ma bibliothèque avec « liste + » (enregistrement automatique ; le dernier Mouvement ne peut pas être retiré). [Avant : « Tout sélectionner » seul, grisé une fois tout coché — remplacé.] | B | aucun ; cahier `bp-tout-deselectionner` |
| Piles en sélection, recette du 15/11 (bp-zone-contexte : « Les piles doivent être sélectionnées aussi, visuellement ») : en sélection `HIGHLIGHT` (Bibliothèques personnelles), une pile repliée dont au moins un Mouvement est choisi prend l’apparence sélectionnée (fond #EAEAFF, contour bleu). Choix « au moins un » : interprétation, signalée. | B | aucun ; cahier `bp-piles-selectionnees` |
| Statut des Bibliothèques installées dans le Profil, remarque du 15/11 (« devrait être mis à jour automatiquement à l'affichage de cet écran, sans avoir à passer par Ajouter une bibliothèque ») : à l’affichage du Profil, relecture silencieuse de l’administration appairée (même lecture que « Actualiser », `fetchAdminPreviews`) ; sans appairage ou PC injoignable, aucun message, le statut connu reste. | B | aucun ; cahier `pr-statut-auto` |

## Élargissement demandé le 12/11/2026 : Bibliothèques personnelles partagées (analyse, non développé)

Décision de Hermann du 12/11/2026, en réponse à « Si tu veux qu'un mouvement puisse être partagé depuis une Bibliothèque de l'iPhone dès maintenant, il faut élargir le périmètre de ce lot » : « oui, et une bibliothèque créée localement et partagée identifie son auteur, deux bibliothèques peuvent avoir le même nom mais avec des auteurs différents. Deux bibliothèques d'un même auteur ne peuvent avoir un même nom. Regardes ce qu'il faut faire sur l'iphone et sur l'interface. »

- Remplace partiellement A-4 (« Mes bibliothèques » reportée hors du premier lot) : la création locale et l'envoi au PC entrent dans le lot ; partage entre utilisateurs, permissions, modération centrale et Espace en étoile restent hors lot.
- Règles retenues : la Bibliothèque partagée porte son auteur ; unicité du nom par auteur ; homonymes admis entre auteurs différents. Le référencement d'un Mouvement importé n'en crée aucune copie (A-2, MOUV-D3, PU-02).
- Figma : seule la section « Mes bibliothèques » du Profil existe (12119:25611) ; aucun écran de création, de composition ni d'envoi (« Figma reste à concevoir », parcours cibles § 5).
- Plan et questions ouvertes : rapport de livraison, section « Élargissement : Bibliothèques personnelles partagées (12/11) ». Aucun code avant les réponses de Hermann.
- Réponses de Hermann du 12/11/2026 (classe B) :
  - Présentation du Profil : « Deux sections : 1. Bibliothèques devient : "Mes bibliothèques" avec en dessous une ligne "Créer une Bibliothèque" et dessous la liste des bibliothèques de l'utilisateur. 2. Bibliothèques installées reste comme elle est, avec en première ligne "Ajouter une bibliothèque" qui est la ligne qui est actuellement sous Bibliothèque. »
  - Retour de sa propre Bibliothèque : « Oui il faut que l'iPhone la reconnaisse » (pas de seconde installation).
  - Tables additives dans la base du registre catalogue de l'iPhone : « je l'autorise ».
  - Écrans : « Quels écrans doivent être créés, fais moi une spécification à partager » → spécification partagée « Bibliothèques personnelles — spécification des écrans » (https://claude.ai/artifact/NGm95S1vjAqdzLVr5SefHF), à valider avant code.
  - Identité de l'auteur : non tranchée. Hermann : « Si on choisi le Pseudo L'auteur peux changer, or il devrait être clairement identifiable, j'aurais choisi le nom du Profil (qui vient du compte lorsqu'il sera créé) ». Proposition en attente de confirmation : identifiant stable créé sur l'iPhone (puis celui du compte), Nom du Profil comme nom affiché.
- [Résolu le 12/11/2026 : « Envoyer mes mouvements » retiré ; avertissement annoncé à l'archivage (voir le tableau de synchronisation).] À CLARIFIER (bloque seulement le développement de ce lot) : place de la ligne « Envoyer mes mouvements », absente de la présentation retenue ; avertissement éventuel à la suppression d'un Mouvement personnel présent dans une Bibliothèque.
- Réponses de Hermann du 12/11/2026 (suite) : identité de l'auteur « A été décidé » (identifiant stable créé sur l'iPhone, puis celui du compte ; Nom du Profil affiché) ; écrans Figma fournis ; « Suivre les écrans Figma, tu peux commencer ». [Résolu le 13/11/2026 : proposition retenue par Hermann, voir le tableau de synchronisation.] Ouvert : suppression ou archivage d'un Mouvement importé (proposition : interdire la suppression individuelle, garder l'archivage, s'en défaire en désinstallant la Bibliothèque) — sans effet sur le premier temps.

## À CLARIFIER

Points restants, sans décision inventée :

1. **Mouvement personnel envoyé puis catalogué ou rapproché (A2).** On ignore s'il devient une fiche importée en lecture seule une fois rattaché. Il est préservé, reconnu sans doublon, mais **non rattaché** : marqueur `install.personalMovementIds` posé par l'administration, aperçu « à examiner », service `PERSONAL_RULE_PENDING`. Seule cette opération est bloquée.
2. **Familles de niveaux autour d'un Mouvement importé.** Après la revue indépendante, une prudence au titre de A-2 a été retenue, car le niveau créé serait une dérivation partielle (nom, Catégorie, Zones repris). Depuis la fiche, ni « Ajouter un niveau » ni réordonnancement ; `createVariant` est refusé dans le service. Le regroupement par glissement dans le Catalogue (`placeInFamily`, `leaveFamily`) reste permis : organisation locale, pas le contenu de la fiche. **À confirmer** : faut-il admettre ou exclure les familles autour d'un Mouvement importé ?
3. **Conflit d'une adaptation historique des 60 pendant une mise à jour de Bibliothèque.** Figma ne montre pas de choix fiche par fiche. La fiche est laissée « à examiner » (canal CA-3/CA-4), jamais écrasée.
4. **Homonymes de sources distinctes.** Ils exigent une migration additive de `movements.normalized_name`. Son numéro doit être ≥ 029 (`pre10-son-voix` utilise 025 à 027, `pre10-fin` la 028 — guidage de la Séance), à coordonner avec la clôture de PRE-10. Non développée. En attendant, une fiche homonyme est « bloquée » et laissée à examiner.
5. **Désinstallation, « Mes bibliothèques », « Bibliothèques partagées »** : reportées (A-4) ; les écrans Figma sont conservés.
6. **Section « Validation » d'une fiche (administration)** — question de Hermann du 11/11 : « que veulent dire tous ces champs, comment suis-je supposé les renseigner ? ». Constat : `classification`, `clinical`, `rights` (classeur des 60, `validation`) et `corpusReview`, `licensing`, `clinicalValidation` (statut de revue et proposition du corpus) sont des **textes libres** repris tels quels de la transcription des 60 ; aucune liste de valeurs n'est définie ; aucun code ne s'en sert, sauf `publicationAllowed` (exige un propriétaire identifié ; conditionne la publication d'une Bibliothèque). « Droits » et « Licences » se recouvrent, comme « Clinique » et « Validation clinique ». **Tranché le 11/11/2026** (Hermann : « je n'ai exprimé aucun besoin, alors pourquoi les développer s'ils ne sont pas nécessaires, c'est de l'administration, du temps, des questions absolument pour rien ») : section retirée de l'administration ; valeurs existantes conservées dans le fichier, sans affichage ni effet.
7. **Profil, maquette 12119:25611 (11/11/2026)** — éléments sans donnée ni écran, non inventés : (a) **Pseudo** (« @hermann ») : le Profil n'a pas ce champ (ni registre, ni ch. 09/13) ; ligne non affichée, aucun champ ni migration ajoutés ; (b) **pastille « Compte gratuit »** : aucun type de compte n'existe ; non affichée ; (c) **onglet « Préférences »** : aucun écran de ce nom ; l'appui ramène à l'écran Profil, qui porte les réglages et les quatre préférences (même garde d'abandon que l'ancien Retour) ; (d) **onglet « Communauté »** : visible et désactivé, comme dans la navigation basse (E01). Le Retour disparaît de l'en-tête comme sur la maquette (retour par l'onglet Préférences, le balayage iOS ou le bouton Android). **À arbitrer** : faut-il un pseudo et un type de compte (donnée, règles, migration ≥ 029) ? L'onglet « Préférences » doit-il ouvrir un écran à part, et l'écran Profil de la barre basse adopter les mêmes onglets ?
   - Réponse de Hermann du 12/11/2026 (recette x-c2-pseudo) pour le Pseudo : « le créer, doit être unique, 30 caractères ». Reste à arbitrer avant code : (1) unique parmi qui — sans compte ni serveur, l'iPhone ne connaît qu'un seul Profil, l'unicité n'est vérifiable qu'en local ; (2) le Profil est dans la base principale (`profiles`, migration 007) : ajouter le champ demande une migration de la base principale, concurrente de PRE-10, soumise à autorisation explicite.
   - Décision de Hermann du 12/11/2026 : migration de la base principale autorisée (« 1. oui ») ; unicité vérifiée seulement quand les comptes existeront, 30 caractères au plus (« 2. ok ») ; ajout « Après la fusion » : migration n° 30, après la fusion de `pre10-fin` (qui occupe déjà 025 à 029) dans la branche Catalogue, à la fin de la recette PRE-10. Obligatoire ou facultatif : à préciser au moment du développement.

8. ~~Place de « Envoyer mes mouvements » dans le Profil~~ — résolu le 12/11 : ligne retirée (voir A2).
