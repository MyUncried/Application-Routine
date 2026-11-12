# 2026-11-11 — CATALOGUE-CONNECTÉ — Livraison technique P0, W1, W2, A1, A2, B1 et préparation de R

## Identifiant et objectif

- **CATALOGUE-CONNECTÉ, exécution continue.** Instruction de Hermann du 11/11/2026 : « Je t'autorise à engager immédiatement le développement du chantier Catalogue autonome et Bibliothèques, sans nouvelle demande d'autorisation entre les tranches. […] P0 → W1 → W2 → A1 → A2 → B1 → R ».
- Les décisions A-1 à A-6 (version corrigée) sont acquises.
- Restent soumis à l'accord de Hermann :
  - fusion dans `main` ;
  - migration destructive ;
  - modification d'une règle validée ;
  - élargissement du périmètre ;
  - déploiement en production.
- **Build** : elle n'est pas dans la liste des autorisations et la consigne permanente impose un accord pour toute build. **Aucune build n'a été lancée.**

## Branches et commits de départ

| Branche | Départ | Rôle |
|---|---|---|
| `catalogue/connecte-dev-20261111` | `24c99bed` (qualification, sur `catalogue/integration-60-main-20261109`) | Développement P0, A1, A2 ; intègre W1/W2 |
| `catalogue/connecte-admin-20261111` | `b8da709b` | W1, W2 (administration Node, Wi-Fi), confiés à un agent dans un worktree séparé |
| `docs/catalogue-bibliotheques-baseline-20261111` | `7929f256` (ligne A–H) + fusion de `a4d6e50e` (consolidation, 11/11 02:21) | Baseline documentaire réconciliée, A-1 à A-6 au registre |
| `catalogue/integration-pre10-20261111` | `origin/composition-phases-duree` `f5bb4316` | **Intégration BMAD (A-3)** |

**Choix de la base A-3 :**
- `pre10-son-voix` (locale, HEAD `198aa98f` au 11/11 01:56, migrations 025 à 027) n'est **pas sur `origin`** et porte des essais « en cours non livrés ». Elle n'est donc ni distante ni qualifiée.
- `composition-phases-duree` est la ligne poussée la plus avancée. Elle a été qualifiée par la recette iPhone PRE-10 n° 2 « entièrement OK ».
- `pre10-bmad/dev` en est un sous-ensemble : ses 3 commits propres sont des équivalents de patch.

## Périmètre traité

| Tranche | Livré | Commits |
|---|---|---|
| **P0** | — Format v2 : auteur unique, Bibliothèques par références, relecture v1, refus de `LOCAL_DERIVED`, aller-retour.<br>— Registre v2 (base distincte).<br>— Plan et service des Bibliothèques.<br>— Garde A-2 dans le service.<br>— Baseline documentaire réconciliée. | `b8da709b`, `16368fe8` ; docs `8eed89cf`, `5be910b2` |
| **W1** | Administration Node sur le format v2 :<br>— domaine TypeScript transpilé partagé, donc un seul validateur ;<br>— 61e fiche ;<br>— révisions calculées par le serveur ;<br>— médias ;<br>— Bibliothèques. | `bca74dd1`, `848fdd68` (branche admin) |
| **W2** | — Port téléphone 4739 réservé au réseau local.<br>— Appairage par code à 6 chiffres.<br>— Liste et fichier servis à l'octet près.<br>— Boîte d'arrivée.<br>— MOUV-D2 au transfert. | idem ; `a210683f` (MOUV-D2, limites) |
| **A1** | Profil → Bibliothèques, 20 écrans Figma réemployés ; client Wi-Fi ; Mouvement importé en lecture seule ; configuration native. | `36e5f96f`, `f2ffc3e6` |
| **A2** | Envoyer mes mouvements ; aller-retour sans doublon ni écrasement. | `a210683f` |
| **B1** | — Branche d'intégration.<br>— Fusion de la baseline documentaire.<br>— Story BMAD `_bmad-output/catalogue-connecte/`.<br>— Suite complète.<br>— Revue indépendante. | `1acdef06`, `f51b595d`, `fe21e66c` + commit de ce rapport |
| **R** | Cahier versionné et en ligne (40 points OK/KO) ; exécution par Hermann après autorisation de la build. | idem |

## Constats

1. **Deux lignes documentaires avaient divergé** depuis `b3249287`. La consolidation (interdiction de copie) et la ligne A–H (MOUV-D1 à D4, plan en six étapes) se contredisaient dans 10 fichiers. Elles sont réconciliées sur `docs/catalogue-bibliotheques-baseline-20261111` (22 zones). Les règles de copie suivent la formulation de la consolidation ; les apports A–H sont conservés.
2. **Le code ne respectait pas MOUV-D1** (`authors[]`) **ni A-2** (aucune garde). C'est corrigé dans le format v2, avec une garde au niveau du service.
3. **Les PR #421 à #434 entrent en conflit avec `main`.**
   - W1 reprend l'administration Node (#429) et la galerie OVH (#432).
   - Les validateurs `scripts/catalogue/*` (#425, #433) valident d'anciens formats d'entrée et sont remplacés par `parseMovementCatalogueFile` pour le fichier catalogue.
   - Ces PR **ne sont pas fermées** (A-5) : leur fermeture suivra la fusion de la branche d'intégration.
4. **Figma** : les 21 écrans existent (vérifiés en lecture seule). Deux variantes du Profil coexistent ; le premier lot suit `12119:25611`. La mise à jour d'une Bibliothèque se décide globalement (Reporter / Refuser / Mettre à jour).
5. **Garde-fou PRE-4 AC9** (`copiesAndSnapshots.story13`) : il interdit le mot « snapshot » dans `src/infrastructure/`. Le registre CA-3 l'enfreignait depuis CA-3. C'est corrigé par un renommage (`state`), sans modifier le test.

## Preuves et tests

| Commande | Branche | Résultat |
|---|---|---|
| `npx jest src/features/catalogue src/domain/catalogue tools/catalogue src/features/activities src/features/preferences src/infrastructure app` | dev, `a210683f` | **116 suites, 1 639 tests PASS** |
| `node --test tools/catalogue-admin/server.test.mjs scripts/catalogue/__tests__/static-ovh-medias.test.mjs` | dev | **29 PASS** |
| `npx jest src/features/catalogue/__tests__/LibraryScreens.test.tsx` | dev, `f2ffc3e6` | 9 PASS |
| `npx tsc --noEmit -p .` ; `npx eslint` (fichiers modifiés) | dev | 0 erreur |
| Suite Jest complète `npx jest` | intégration `80158876` (après corrections) | **348 suites, 5 847 tests PASS** |
| Suite Jest complète, avant corrections de revue | intégration `fe21e66c` | 347 suites, 5 843 tests PASS |
| `node --test tools/catalogue-admin/server.test.mjs scripts/catalogue/__tests__/static-ovh-medias.test.mjs` | intégration | **29 PASS** |
| `npx tsc --noEmit -p .` | intégration | 0 erreur |
| `npx eslint` sur les fichiers ajoutés ou modifiés par le chantier | intégration | 0 problème |
| `npx eslint src app tools/catalogue-admin` (tout le dépôt) | intégration | 21 erreurs et 9 avertissements, **tous dans des fichiers PRE-10 non touchés par ce chantier** (`CompositionScreen.tsx`, `StickyHeader.tsx`, `formatTimeline.ts`, tests de sessions). Non corrigés (hors périmètre, PRE-10). |
| Revue indépendante (agent distinct, lecture seule, diff `24c99bed..a210683f`) | dev | **9 constats, tous corrigés** dans `0579b4ac` (détail ci-dessous) |

## Revue indépendante : constats et corrections

| # | Gravité | Constat | Correction |
|---|---|---|---|
| 1 | Haute | A-2 contourné par la Séance : le crayon de l'éditeur d'Exercice déverrouillait le contenu du Mouvement importé ; `updateMovementContent` l'écrivait sans passer par la garde, et « Créer un nouveau mouvement » le copiait. | — Crayon masqué pour un Mouvement importé (`ExerciseScreen`).<br>— `SessionService` refuse une correction `EDITED` d'un Mouvement importé.<br>— Test `SessionService.importedMovements.test.ts`. |
| 2 | Moyenne | « Ajouter un niveau » et le réordonnancement restaient proposés sur la fiche importée ; le nouveau niveau était partiellement dérivé. | — Menu Niveau retiré pour un importé.<br>— `createVariant` refusé (`PROTECTED`).<br>— Point maintenu À CLARIFIER. |
| 3 | Moyenne | L'isolement d'un Mouvement personnel ne valait que pour ADOPTABLE ; « Rapprocher » d'une fiche existante le verrouillait sans signalement. | — Marqueur `install.personalMovementIds` (format § 10.3 bis), posé par l'administration.<br>— Isolement quel que soit l'état.<br>— Refus par `CatalogueLoadService.accept` (`PERSONAL_RULE_PENDING`). |
| 4 | Basse à moyenne | Lecture v1 : `libraryId` invalide ou en-tête publiable faisaient refuser des fichiers v1 valides. | Identifiant dérivé ; Bibliothèque implicite privée et non publiable. |
| 5 | Basse | Une exception sur une fiche immobilisait la Bibliothèque en « interrompue ». | L'erreur est rangée dans les échecs ; les autres fiches sont appliquées. |
| 6 | Basse | Course sur la boîte d'arrivée (décisions concurrentes). | Statut contrôlé dans la file d'écriture. |
| 7 | Basse | Délai du client Wi-Fi sans la lecture du corps. | Le corps est lu dans le délai. |
| 8 | Basse | Découverte non authentifiée sur le Wi-Fi (usurpation possible). | L'adresse du PC est affichée après connexion. Limite inhérente au HTTP local, documentée. |
| 9 | Basse | Écran d'envoi bloqué sur erreur de lecture. | Erreurs gérées. |

## Hypothèses non démontrées

- Rendu natif et ergonomie des écrans Bibliothèques, symbole SF Symbols, sélecteur de fichiers, invite iOS d'accès au réseau local : **non vérifiés sur iPhone** (R). Une suite Jest verte ne vaut pas validation sur iPhone.
- Découverte du PC par balayage du /24 : non éprouvée sur un vrai Wi-Fi (box, isolation des clients).
- Interface de l'administration : essai jsdom par l'agent W1, sans contrôle visuel ; compression photo non réexécutée.

## Modifications réalisées

Voir la spec `_bmad-output/catalogue-connecte/spec-catalogue-connecte.md` (§ Stories), les rapports W1-W2 et baseline, et `git diff f5bb4316..HEAD` sur la branche d'intégration.

## Non corrigé ou hors périmètre (À CLARIFIER, spec § À CLARIFIER)

1. Mouvement personnel envoyé puis catalogué : la transition de statut n'est pas arbitrée. Il est isolé (`PERSONAL_ORIGIN`), sans perte.
2. Ajouter un niveau à côté d'un Mouvement importé : permis, à confirmer.
3. Conflit d'une adaptation historique lors d'une mise à jour de Bibliothèque : laissé à examiner, sans choix fiche par fiche (Figma).
4. Homonymes de sources distinctes : migration additive ≥ 029 (028 prise par `pre10-fin`) à coordonner avec la clôture de PRE-10. Non développée ; une fiche homonyme est bloquée et laissée à examiner.
5. Désinstallation, « Mes bibliothèques », « Bibliothèques partagées » : reportées (A-4).
6. Conflit documentaire prévisible au chapitre 12 lors de la fusion avec `pre10-son-voix` : deux sections ajoutées en fin de chapitre, à garder toutes les deux.
7. Fermeture des PR #421 à #434 : à faire après la fusion de l'intégration.

## Vérifications restant à faire sur appareil réel

- Cahier R complet : `_bmad-output/catalogue-connecte/implementation-artifacts/recette-iphone-catalogue-connecte.md`, et en ligne https://claude.ai/artifact/9RszZZ4tEgVBb5KJYEky18.
- Les sections 1 et 2 (PC, Safari) se jouent sans build. Les sections 3 à 7 exigent la build de développement à autoriser.

## Fichiers modifiés

`git diff --stat f5bb4316..HEAD` sur `catalogue/integration-pre10-20261111`. Principaux :
- `src/domain/catalogue/*` ;
- `src/infrastructure/catalogue/*` ;
- `src/features/catalogue/*` ;
- `src/features/activities/MovementCatalogueService.ts`, `ActivityDefinitionService.ts`, `MovementScreen.tsx` ;
- `src/features/preferences/ProfileEditScreen.tsx` ;
- `app/library-*.tsx`, `app.json`, `package.json` (`expo-network`), `jest.setup.js` ;
- `tools/catalogue-admin/*` ;
- `catalogue/catalogues/kodjo-pilote-60.catalogue.json` ;
- `docs/KODJO-Format-catalogue-mouvements-v1.md` (§ 10 à 12) et documents de la baseline ;
- `_bmad-output/catalogue-connecte/*`.

## Commit final et état Git

Commit de ce rapport sur `catalogue/integration-pre10-20261111`, poussé ; hash communiqué dans le compte rendu de session. PR de développement en brouillon vers `composition-phases-duree`, **pas** vers `main`.
- Aucune fusion dans `main`.
- Aucune build, aucune OTA.
- Figma non modifié.
- OVH non modifié.
- PRE-10 non modifié : aucune écriture dans `C:/Dev/PRE10` ni `C:/Dev/PRE10-SON`.

## Correction du 11/11 : mise en page Figma des écrans Bibliothèques

**Constat (recette iPhone).** Les écrans A1 reprenaient les textes et les états des maquettes, pas leur mise en page : titres de section dans les cartes, aucune icône de ligne, chevron dessiné avec le caractère « › » (interdit par `assets/icons/manifest.json`), encarts et pastilles génériques.

**Méthode.** Lecture seule Figma (`G6RY5Ebhgwb4AHIOYDwwvg`, page 510:101), skill `figma-design-to-code`, `get_design_context` sur chaque nœud (captures prises comme cible). Aucune modification Figma. Positions absolues converties en flex, largeur variable. Comportement inchangé : logique, navigation, services, textes, testID.

**Écrans repris.**
- Profil, sections Bibliothèques (12119:25611) : intitulés 11 px #595E66 au-dessus des cartes, icônes Ajouter / Envoyer / livre, chevron SVG.
- Ajouter une bibliothèque (12116:25073) : deux cartes séparées, icônes fichier et PC, petit chevron.
- Connexion (12116:25103, 25138, 25175, 25200, 25238) : cases 48 × 56 centrées, liseré #C7CCD6 ou rouge 1,5 ; chiffres gris pendant la connexion ; état connecté centré (pastille verte, coche) ; encart rouge avec icône pour le code refusé ; PC introuvable centré (pastille rouge, Wi-Fi) et carte de trois conseils à puce bleue ; bouton secondaire gris « Annuler » ou « Importer depuis un fichier ».
- Bibliothèques disponibles (12118:25124, 12119:25204, 12119:25277) : icône livre, nom Medium 15, pastilles bleue, verte ou grise ; ligne « Actualisée à l'instant · Actualiser » ; chargement avec squelette ; liste vide centrée.
- Aperçu avant installation (12118:25170) : grand compteur « N fiches / dans cette bibliothèque », puces bleue et verte, note dans la carte ; encart jaune avec triangle ; section « Nouvelles fiches » avec pastilles vertes et « et N autres fiches nouvelles ».
- Installation terminée (12118:25220) et mise à jour appliquée (12118:25370) : état centré et carte de résumé ; « Voir dans le Catalogue » au-dessus, « Terminer » en gris dessous.
- Aperçu d'une mise à jour (12118:25251) : trois compteurs dans une carte, intitulé de révision au-dessus, pastilles Modifiée (bleue), Nouvelle (verte), Retirée (grise), lien « Voir le détail », « Aussi dans … » ; Reporter et Refuser côte à côte.
- Détail d'une fiche (12118:25316) : une carte par champ, colonnes Actuelle | Nouvelle ; lien « Voir les champs inchangés ».
- Fichier invalide (12119:25162) : encart rouge ; problèmes à puce rouge, la fiche en titre et le problème dessous.
- Reprise après interruption (12119:25245) : carte avec pastille Reprise, barre de progression et décompte ; « Plus tard » en gris.
- Bibliothèque installée (12098:115), sans « Désinstaller » : pastille « Mettre à jour » dans l'en-tête, état en 13 gris, carte des mouvements avec chevrons.
- Pastille du Mouvement importé (12119:25304, `ImportedMovementBadge`) : fond #EAEAFF, hauteur 28, icône livre Figma bleue, libellé Semi Bold 12 bleu. Elle remplace le symbole système `book.closed`, dont le dessin est différent.
- « Envoyer mes mouvements » (sans maquette) : aligné sur ces écrans (introduction, carte, interrupteurs natifs conservés, états centrés).

**Icônes ajoutées.** 15 exports SVG MCP (`MCP_VECTOR_EXPORT`), inscrits dans `KodjoIcon.tsx` et `manifest.json` :
- `icon-bibliotheque-chevron-aller` (12119:25649) et `-chevron-aller-petit` (12116:25097) ;
- `-ajouter` (12119:25658) et `-envoyer` (12119:25659) ;
- `-livre-profil` (12119:25646), `-livre` (12118:25145), `-livre-vide` (12119:25297) et `-source` (12119:25409) ;
- `-fichier` (12116:25094) et `-pc` (12116:25099) ;
- `-succes` (12116:25195), `-erreur` (12116:25233), `-avertissement` (12118:25201), `-wifi` (12116:25258) et `-reprise` (12119:25266).

Aucun SVG identique n'existait déjà. Ces fichiers ne contiennent aucune URL Figma temporaire.

**Écarts restants (non tranchés).**
1. Marges latérales de 16 (`layout.screenGutter`, arbitrage A01 du 27/10) au lieu de 24 sur les maquettes.
2. En-tête : `FixedHeader` partagé, baseline gelée non modifiée. Le cercle Retour est #E5F0FF au lieu du halo blanc Figma.
3. Indicateur de chargement : `ActivityIndicator` natif au lieu de l'illustration statique de la maquette (primitive native).
4. Bibliothèque installée : la maquette la place dans les onglets du Profil (Profil / Préférences / Communauté, retour « ‹ » en ligne). L'application ouvre un écran empilé. La note sur la désinstallation est omise (désinstallation reportée).
5. Reste de l'écran Profil, hors périmètre : fond blanc et écart de 24 au lieu de #F7F7FF et 16.
6. Pictogrammes des pastilles rondes (Wi-Fi, coche) : centrés, alors que la maquette les décale.
7. Séparateur vertical Actuelle | Nouvelle : appliqué à toutes les cartes, alors que la maquette ne le montre que sur la première.
8. Rendu non contrôlé sur appareil (20 nœuds Figma lus) : à vérifier à la recette iPhone.

**La maquette contredit le comportement actuel (signalé, non tranché).**
- **Aperçu d'une mise à jour.** « Voir le détail » ne figure que sur la première fiche modifiée. Le code ouvre le détail depuis toute fiche modifiée.
- **Code refusé.** La note « Le téléphone et le PC doivent être sur le même Wi-Fi. » est absente de la maquette, mais conservée.
- **Connecté.** La ligne « Adresse du PC : … » (revue du 11/11) est absente de la maquette, mais conservée.
- **États sans maquette.** Les pastilles « Reprendre » (jaune) et « Refusée » (grise) n'ont pas de maquette. La ligne d'opération interrompue du Profil n'en a pas non plus.
- **Envoi sans mouvement personnel.** Le message est désormais présenté en titre + texte.

**Tests.**
- `npx jest src/features/catalogue src/features/preferences src/features/activities app` : PASS.
- Suite complète `npx jest --maxWorkers=4` : 348 suites, 5847 tests, tous PASS. `npx tsc --noEmit` : aucune erreur. `npx eslint` des fichiers modifiés : aucune erreur ni avertissement.
- Deux assertions de `LibraryScreens.test.tsx` vérifiaient l'ancienne structure visuelle : une seule chaîne pour le compteur et pour un problème de fichier. Elles vérifient maintenant le même contenu dans la nouvelle structure (compteur par testID, problème « Fiche 12 » et sa raison dans la même ligne).

**Synchronisation code / documentation.** Classe A (conformité aux maquettes). Une ligne a été ajoutée à la spec, section Synchronisation.

## Corrections de la recette du 11/11 (après-midi)

| Constat de Hermann | Cause | Correction | Classe |
|---|---|---|---|
| « Bibliothèques disponibles » clignote entre « Chargement » et la liste, « Maximum update depth exceeded » | Pile Metro : `refresh` relancé par le rappel de focus à chaque rendu (`LibraryScreens.tsx`, `setPhase` chargement). | Rappel de focus indépendant de l'identité de `refresh` (référence), aucun rechargement automatique pendant un chargement ni dans les 2 s suivantes, pas de nouvel état « chargement » s'il l'est déjà. | A |
| « L'appairage […] s'arrête dès que je sors de l'écran » | L'appairage n'était qu'une source en mémoire, et l'écran Connexion redemandait toujours le code. | `librarySession.pairing` (jeton valide jusqu'à son expiration, marge 60 s) ; `pairingStore.ts` le garde dans le dossier de l'application ; Connexion reprend l'appairage (écran « Connecté ») ; jeton refusé par le PC → oublié. Durée : celle du PC, **12 h** (spec W2), pas 24 h. | A (W2 : « jeton de 12 h, révocable ») ; stockage D |
| « · PROPOSED » après les noms du référentiel dans l'interface Web | Statut technique accolé au nom (`app.js`). Le serveur ouvert tournait depuis `KODJO-CAT-ADMIN` (ancienne branche W1/W2), d'où l'absence de la correction. | `7765c325` ; statut en info-bulle. Cahier : chemin exact du dossier à utiliser. | A |

Tests : `npx jest --maxWorkers=4` sur le fichier pilote versionné, 348 suites et 5 847 tests verts (+ `librarySession.pairing.test.ts`) ; `tsc` 0 erreur ; eslint des fichiers modifiés 0 problème ; `node --test tools/catalogue-admin/server.test.mjs` 24 verts. Les données de recette (61 fiches, « Recette Hyrox ») ont été recopiées de `KODJO-CAT-ADMIN` dans le dossier d'intégration, sans commit.

### Suite de la recette (11/11, après-midi)

| Constat / décision de Hermann | Correction | Classe |
|---|---|---|
| « Autorisation déclarée » puis Enregistrer ne change rien | Refus (auteur et licence requis) affiché sous le formulaire ; fichier actuel indiqué en modification (`a3b4611a`). | A |
| « Refuse uniquement la fiche, il faut en donner le nom » | Serveur : fiches au média non confirmé retirées du fichier envoyé (fiches, membres, glossaire), nommées dans `X-Kodjo-Withheld-Sheets` ; téléphone : encart « Fiche non transférée » avec le nom. Le client transmet désormais les en-têtes de réponse (défaut trouvé par le test). | B |
| « il faut le choix entre un bouton pour l'autorisation et le champ de texte de licence (…) c'est vraiment du texte libre ? » | Licence choisie dans une liste de cas courants + « Autre (préciser) » ; boutons bascule « Autorisation déclarée » / « Utilisation interdite ». Règle du format inchangée. | B |
| « ma fiche a disparu » | **Incident causé par la session** : pour lancer les tests, le fichier pilote du dossier d'intégration (lu par le serveur d'administration en marche) a été remplacé trois fois quelques minutes par la version versionnée, puis rétabli. Vérification : fichier actuel = copie de recette (61 fiches, fiche `fiche-squat-test-recette` rév. 4) ; aucune écriture perdue (le dernier enregistrement de Hermann était refusé par la validation). Désormais les tests de l'administration lisent `KODJO_TEST_PILOT` et le fichier de recette n'est plus touché. | — |

Tests : Jest complet sur le fichier pilote versionné, 349 suites et 5 850 tests verts ; `node --test tools/catalogue-admin/server.test.mjs` (avec `KODJO_TEST_PILOT`) 24 verts ; éditeur de médias vérifié dans jsdom (refus sans licence, confirmation avec licence, photo conservée) ; `tsc` 0 erreur.

### Champs de l'administration (11/11, tableau de Hermann)

Un premier retrait trop large (`304aa1da`, classification comprise) a été poussé avant la lecture des messages de Hermann (« on garde les éléments de classification zone anatomique, etc bien évidemment » ; « fais moi d'abord la liste de ce que tu vas supprimer ») ; il a été annulé par `cdf1c18b`. Hermann a ensuite tranché champ par champ (30 lignes) ; appliqué tel quel :
- retirés : n° 6 fondement des valeurs, 7 revue de classification, 8 classification d'origine, 9 spécialités proposées à l'origine, 10 saisie de l'identifiant de geste, 19 Installation, 28 notes du catalogue ;
- lecture seule : n° 11 origine (libellé français), 17 visibilité de la fiche, 23 publication de la Bibliothèque, 27 publication du catalogue ;
- n° 29 : empreinte et version lue dans « Détails techniques » repliés ;
- tous les autres champs gardés et modifiables (alias, position de départ, matériel, consignes, notes éditoriales, classification complète, provenance, sources, historiques, glossaire, référentiels).

Données : aucune valeur modifiée ni supprimée du fichier. Tests : `node --test tools/catalogue-admin/server.test.mjs` 24 verts ; eslint `app.js` 0 problème.

### Recette du 11/11, résultats de 14 h 18

| Point | Constat de Hermann | Analyse et correction | Classe |
|---|---|---|---|
| a1-medias (KO) | Une bibliothèque avec une fiche non transférable bloque toutes les bibliothèques ; les retirer des bibliothèques ne suffit pas | Le serveur d'administration tournait depuis 13 h 35, avant la correction `cd83ddd1` (vers 13 h 58) : ancien comportement (refus du fichier entier). Vérifié sur une copie de son fichier avec le code actuel : une fiche au média non confirmé → HTTP 200, 63 fiches sur 64 envoyées, fiche nommée, les trois Bibliothèques transmises. Action : redémarrer le serveur. | — (déjà corrigé) |
| a1-lecture-seule (KO) | « Ne laisser que le symbole, dans un cadre tel que celui de l'édition. A l'appui, affichage des information complémentaires de la fiche (source, propriétaire, auteur, éditeur, version, etc.) Réappuyer sur la fiche ferme la fenêtre d'information. » | `ImportedMovementAction` (cadre du crayon, icône livre) et `ImportedMovementInfoPanel` (bibliothèque, catalogue, source, propriétaire, auteur, éditeur, ayant droit, licence, version) ; lecture `importedMovementInfo` dans le registre. | B |
| a1-reseau | non testé | — | — |

Tests : test d'intégration A-2 de `MovementScreen` mis à jour (ouverture et fermeture) ; suite complète : 342 suites vertes, les 7 suites qui lisent le fichier pilote du dossier échouent à cause des données de recette (61+ fiches) et sont rejouées sur le fichier versionné dans un dossier de travail séparé (voir ci-dessous).

### Écran Profil aligné sur Figma (11/11)

Demande de Hermann : « Tu dois encore modifier l'écran de Profil pour qu'il corresponde à Figma […] Ça concerne les trois onglets, la couleur, la disposition de la photo, du nom et du pseudo, enfin de toute la partie au dessus de la section bibliothèque. » Cible : Figma `G6RY5Ebhgwb4AHIOYDwwvg`, nœud `12119:25611`, partie au-dessus de « Bibliothèques » (lecture seule MCP, `get_design_context`). Départ : `ccb32a1f`, branche `catalogue/integration-pre10-20261111`.

Repris (`src/features/preferences/ProfileEditScreen.tsx`, route `app/profile-edit.tsx`) :
- fond d'écran #F7F7FF (`color/catalogue/seances/background`) ; zone « Enregistrer » fondue vers ce fond ;
- en-tête : trois onglets « Profil » (sélectionné, Bold 17, forme d'onglet #EAEAFF), « Préférences », « Communauté » (Regular 17 #595E66), composant existant `CatalogueNavigation` (même tracé que l'asset `Onglet sélectionné` 12119:25663, déjà validé sur les Catalogues) ; bande 14 pt #EAEAFF → #F7F7FF dessous (12119:25662) ; titre « Modifier le profil », Retour et trait gris retirés comme sur la maquette ;
- intitulé « Profil » (Regular 11 #595E66) au-dessus d'une carte identique à celles des Bibliothèques (`libraryUi` `Section`/`Card`) ;
- avatar 64 (asset `Avatar — Initiales`, #1A1C26) avec initiales blanches Semi Bold 22, ou la photo ; pastille bleue 30 avec icône appareil photo à (40, 40) de l'avatar (même action que le libellé, masquée de VoiceOver pour ne pas doubler le bouton) ; « Modifier la photo » Medium 13 bleu dessous ;
- à droite (x = 152 de la carte) : ligne « Nom » (Regular 13, 66 pt) et sa valeur éditable en Regular 14 (`TextInput` natif conservé, sans cadre) ; messages d'erreur dessous ;
- séparateur #E0E3E8 puis silhouettes dans des cercles blancs de 40 centrés, écart 15 : choisie liseré #0508E5 1,25 et tracé bleu, non choisie liseré #CCD1E0 0,625 et tracé #9499A8.

Comportement inchangé : brouillon, validation du nom (1..80), photo (choix, annulation, erreur, suppression de l'ancienne copie après enregistrement), silhouette par défaut homme, « Enregistrer », garde d'abandon ; testID existants conservés. Section Bibliothèques non modifiée (seul l'écart vertical entre sections passe de 24 à 16, valeur de la maquette).

Données ou écrans absents — rien d'inventé (À CLARIFIER n° 7 de la spec) :
- **Pseudo** (« @hermann ») : aucun champ dans le Profil, ni dans le registre ni dans les ch. 09/13 ; ligne non affichée, aucun champ ni migration ;
- **« Compte gratuit »** : aucun type de compte ; pastille non affichée ;
- **onglet « Préférences »** : pas d'écran de ce nom ; l'appui ramène à l'écran Profil de la barre basse, qui porte les réglages et préférences, avec la même garde d'abandon que l'ancien Retour (interprétation la moins inventive qui garde un retour visible) ;
- **onglet « Communauté »** : visible et désactivé (« Communauté — indisponible »), comme dans la navigation basse (E01).
Point à arbitrer : faut-il un pseudo et un type de compte (donnée, règles, migration ≥ 029) ? « Préférences » doit-il devenir un écran distinct, et l'écran Profil de la barre basse prendre les mêmes onglets ?

Icônes ajoutées (exports MCP de 12119:25611, attributs racine nettoyés, `manifest.json` et `KodjoIcon`) : `icon-profil-avatar-initiales` (12119:25615, 64 × 64), `icon-profil-appareil-photo` (12119:25618, 16 × 16), `icon-profil-silhouette-homme` (12119:25625, 9,31 × 27,5), `icon-profil-silhouette-femme` (12119:25627, 9,02 × 27,5). Les silhouettes existantes `body-zone-*` (24 × 24, trait 0,8 #5C636E) n'étaient pas identiques (trait et couleur) ; elles restent utilisées ailleurs. L'onglet sélectionné réutilise `CatalogueNavigation` plutôt qu'un nouvel SVG.

Écarts restants : l'onglet sélectionné repose sur le bas de l'en-tête (94 pt de la maquette au lieu de 93), la bande le recouvre ; sur un écran plus étroit que 402 pt, les onglets se répartissent au tiers de la largeur (règle des Catalogues). Toast « Pilates désinstallée » et désinstallation : hors périmètre (A-4). Aucun contrôle visuel sur iPhone n'a été fait : à vérifier en recette.

Classe : A (conformité à la maquette) ; interprétations listées ci-dessus, sans règle créée. Documents : spec (Synchronisation, À CLARIFIER n° 7) et ce rapport.

Tests : `ProfileEditScreen.test.tsx` 20 verts (6 nouveaux : onglets et retour par « Préférences », garde d'abandon par l'onglet, carte Profil sans pseudo ni type de compte, pastille appareil photo, silhouettes 40 teintées, fond #F7F7FF) ; `npx jest src/features/preferences app` 9 suites, 70 tests verts (avant ajout des nouveaux tests) ; suite complète `npx jest --maxWorkers=4` : 342 suites et 5 838 tests verts, 7 suites (18 tests) en échec — les 7 suites attendues qui lisent le fichier pilote de recette du dossier (LibraryScreens, CatalogueLoadScreen, LibraryService.sqlite, CatalogueLoadService.sqlite, catalogueEditing, convertPilotCorpus, catalogueLoadPlan) ; `tsc --noEmit` 0 erreur ; eslint 0 problème sur les fichiers modifiés. Fichier `catalogue/catalogues/kodjo-pilote-60.catalogue.json` non touché.

## Familles de niveaux des fiches (11/11)

Demande de Hermann : « Implémente la gestion des familles de niveaux dans les fiches Mouvement du catalogue, depuis l'administration web jusqu'à l'import d'une Bibliothèque sur le téléphone », avec le patch `KODJO-familles-niveaux.patch` (conception validée). Départ : `b1b70890`, branche `catalogue/integration-pre10-20261111`. Demande ajoutée en cours : « Peux tu aussi retirer le bouton "Charger un catalogue (test local)" qui se trouve sur le catalogue des mouvements. »

Documentation : le commit `1b83b07d` n'existe pas dans ce dépôt ; aucun des quatre documents n'était à jour sur la branche. Le patch s'applique sans conflit (`git apply --check`) et a été appliqué tel quel (ch. 07, conception du partage, parcours cibles, format). Le format retenu est ajouté au document de format (§ « Familles de niveaux des fiches — format retenu ») ; la phrase « Le lecteur actuel initialise encore `levelGroup` à `null` » est annotée comme remplacée.

Réalisé :
- **Format** (`MovementCatalogueFile.ts`) : propriété facultative `levelGroup: { groupId, sortKey }` de la fiche ; validation (`INVALID`, `DUPLICATE` pour deux fiches à la même position d'une famille) ; empreinte éditoriale sensible à l'appartenance et à la position, inchangée pour une fiche sans famille ; anciens fichiers lisibles. Section « famille de niveaux » dans le résumé des changements du téléphone.
- **Administration** (`catalogueEditing.ts`, `app.js`) : section « Famille de niveaux » de la fiche, par les noms (« Niveau n — Nom »). Rattacher à une famille existante ou créer une famille avec un mouvement sans famille (C1), réordonner (↑ ↓, seules deux fiches révisées), détacher (dissolution du dernier couple, D2), changement de famille seulement après détachement (C6). Identifiants générés par l'application, clés jamais saisies. Révision de chaque fiche dont la famille change effectivement, par le mécanisme existant (`applyFileEdit`). Ordre des Bibliothèques inchangé et indépendant.
- **Téléphone** (`catalogueFamilies.ts`, `CatalogueLoadService`, `MovementRepository.setFamilyOrder`) : après chaque fiche acceptée, le Mouvement est placé dans le groupe `catalogue:<catalogue.id>#<groupId>` (pas de fusion entre catalogues, même famille au réimport) ; membres importés rangés par la clé de leur fiche, membres locaux à leur place ; import partiel limité aux fiches reçues ; adaptations locales conservées (appartenance changée sur le téléphone depuis l'installation, ou Mouvement existant d'une autre famille). Médias, phases et archivage toujours intouchés. `gestureId` et familles gestuelles non utilisés.
- **Bouton retiré** : « Charger un catalogue (test local) » n'est plus affiché sur le Catalogue des mouvements (`CatalogueScreen.tsx`). La route `catalogue-load` et son écran restent, sans point d'entrée.

Hypothèse et limite : une interruption entre la confirmation d'une fiche et son placement dans la famille laisse le Mouvement sans famille jusqu'à la révision suivante de la fiche (documenté dans le format). Le parcours « Changer de niveau » sur un Mouvement importé (lecture seule, A-2) n'a pas été vérifié sur iPhone.

Classe : B (décision explicite de Hermann et patch validé) ; documents : patch appliqué, format (format retenu), spec (Synchronisation). Bouton : B, aucun document.

## Messages des droits et propriétaire par défaut (11/11, soir)

Question de Hermann sur l'aperçu « Mise à jour de Course à pied » : « La gestion des droits sur les fiches est assez incompréhensible. Les règles ne sont expliquées nulle part. […] Que veulent dire ces deux messages ? » Proposition acceptée (« Ok »), puis : « Il faut mettre mon compte / mon nom pour toutes les fiches de test par défaut. »

Réalisé :
- **Cause précise d'une fiche non appliquée** (`libraryPresentation.reviewLabel`) : archivée ou supprimée sur ce téléphone (restaurer depuis le Catalogue), révision incohérente (rien n'est modifié ; une nouvelle modification dans l'administration la repropose), révision refusée (la suivante sera proposée), installation interrompue. Remplace la phrase qui regroupait trois causes.
- **Bandeau « Propriétaire inconnu »** : nomme la cause (Bibliothèque sans propriétaire, fiches sans propriétaire avec leurs noms, trois au plus puis « et n autres »), rappelle la conséquence (utilisable sur le téléphone, ni partage ni redistribution) et comment la lever. `LibraryPreview` porte `ownerlessLibrary` et `ownerlessSheets`.
- **Propriétaire par défaut** : une nouvelle fiche ou Bibliothèque reprend le propriétaire déclaré du catalogue (`createSheet`, `createLibrary`), sauf déclaration explicite. Aide sous chaque « Propriétaire » de l'administration : déclaratif, non vérifié, aucun compte dans le MVP.
- **Données de recette** (`kodjo-pilote-60.catalogue.json`, non versionné) : propriétaire du catalogue, des 64 fiches et des 3 Bibliothèques mis à `LOCAL_USER` « hermann Adjou Moumouni » (valeur saisie par Hermann sur sa fiche), par l'API du serveur d'administration en marche (révision du catalogue 27 → 28 ; 63 fiches et 2 Bibliothèques révisées). **Incident :** l'écriture a remplacé toutes les valeurs, pas seulement les vides ; deux Bibliothèques (pilote et Recette Hyrox, modifiées par Hermann à 21:15) et une fiche avaient un autre propriétaire non vide, désormais perdu. Le fichier versionné du pilote n'est pas modifié.

Réponse sur le champ Propriétaire : les cinq choix (inconnu, utilisateur local, personne, organisation, plateforme) viennent du document validé du 06/11 (« Provenance, propriété et fiches éditoriales »). Sans comptes (hors MVP), la valeur est une déclaration non vérifiable ; elle ne devient contraignante qu'avec une authentification (règle 7 de ce document : aucune publication sans authentification ni vérification des permissions). Son seul effet actuel : « inconnu » rend le contenu privé.

Classe : B (textes et valeur par défaut demandés) ; règles fonctionnelles inchangées.

Puis, demande de Hermann : « Et met mon prénom en tant que propriétaire de toutes les fiches du catalogue actuel. » Les 64 fiches portent `LOCAL_USER` « Hermann » (même voie, révision du catalogue 31). Le propriétaire du catalogue (valeur par défaut des nouvelles fiches) et ceux des Bibliothèques, que Hermann a lui-même ressaisis entre-temps, restent « hermann Adjou Moumouni ».

### Tests (familles de niveaux, messages, propriétaire par défaut, bouton retiré)

- Nouveaux : `catalogueFamilies.test.ts` (11 : format, validation, édition C1/C6/D2, placement), `catalogueFamilies.sqlite.test.ts` (10, deux bases SQLite réelles : progression mur → genoux → sol transmise par une Bibliothèque en ordre inverse, réimport sans doublon, réordonnancement, détachement, dissolution D2, import partiel puis complément, deux catalogues sans fusion, adaptation locale conservée, ancien catalogue sans famille), `libraryPresentation.owner.test.ts` (8).
- Suite complète dans un dossier de travail séparé (même diff, fichier pilote versionné, jonction `node_modules`) : `npx jest` 352 suites, 5 885 tests verts ; `node --test tools/catalogue-admin/server.test.mjs` 24 verts.
- `tsc --noEmit` 0 erreur ; eslint 0 problème sur les fichiers modifiés.
- Dans le dossier du chantier, les suites qui lisent le fichier pilote échouent toujours à cause des données de recette (non versionnées, inchangées par les tests).

Vérifications restant à faire sur iPhone : cahier de recette, section 8 « Familles de niveaux » (fn1 à fn14). Le serveur d'administration doit être redémarré depuis `C:\Dev\KODJO-CAT-INTEG` (le domaine partagé est régénéré au démarrage).

## Recette des familles de niveaux (12/11)

Résultats saisis par Hermann dans le cahier (section 8) : fn1 à fn12 OK ; fn13 non joué ; fn14 « je ne comprends pas le test ».

- **fn1** : le libellé supposait des fiches « Pompes » déjà présentes ; corrigé (étape de création explicite). Aucune anomalie du code.
- **fn6** : OK avec la remarque « changer de niveau n'est pas proposé dans les fiches ». Cause : sur un Mouvement importé, la fiche supprimait tout le menu Niveau (`menu: null`), consultation comprise, alors que A-2 n'interdit que la modification. Correction : menu conservé, « Ouvrir un autre niveau » actif, « Ajouter un niveau » et « Réordonner les niveaux » grisés (`onReorderLevels` accepte `null`). Classe A. Fichiers : `src/features/activities/MovementLevelMenu.tsx`, `src/features/activities/MovementScreen.tsx`, test `MovementScreen.b2.integration.test.tsx` (« recette fn6 (12/11) »). Nouveau test iPhone fn6b.
- **fn14** : libellé réécrit en étapes numérotées avec le critère OK.
- **fn13** : à jouer.

- **Erreur de typage découverte** : `libraryPresentation.owner.test.ts` (commit ef1241bd) ne passait pas `tsc` (tuple `as const` en lecture seule dans `it.each`) ; l'annonce « tsc 0 erreur » du 11/11 était inexacte. Corrigé (type explicite du tableau).

Tests (12/11) : `tsc --noEmit` 0 erreur ; eslint 0 problème sur les fichiers modifiés ; Jest ciblé (`MovementLevelMenu`, `MovementScreen*`, `MovementLevelsScreen*`, `ExerciseScreen*`, `libraryPresentation*`) 12 suites, 182 tests verts. Suite complète non relancée : la passe Mouvements + Séances a été arrêtée par le système faute de mémoire (Metro 8082 arrêté par la même cause).

## KO restants de la recette du 11/11 (traités le 12/11)

KO saisis entre 22 h 37 et 22 h 49 le 11/11, restés sans traitement pendant le chantier des familles (commit 22 h 50).

| Point | Constat de Hermann | Analyse / correction | Classe |
|---|---|---|---|
| c1-profil-haut | « Il manque la zone de contexte avec dégradé vers la couleur de l'écran. » | La bande de 14 pt ne fondait que sur ses 20 % inférieurs (≈ 3 pt). Bande suivie d'une part fondue `CONTEXT_BAND_FADE_HEIGHT` (#EAEAFF → transparent), au-dessus du corps qui remonte d'autant et défile derrière (patron des Catalogues, D-224). | B |
| c2-profil-carte | « retirer le texte Modifier la photo », « faire l'icône de la photo plus petit », « zone de profil, pas de cadre », « Je ne vois pas le champ pour le pseudo » | Libellé retiré ; pastille 30 → 22, icône 16 → 12, devenue la commande accessible (`profile-edit-photo-action`) ; zone Profil sans fond, contour ni ombre. Pseudo : aucune donnée (À CLARIFIER n° 7) — non créé, question posée à Hermann. | B |
| e3-doublon / e4-ajouter | « je ne vois pas la fiche locale dans la liste du catalogue web » | Pas d'anomalie : la soumission « Mvt Hermann » (22 h 23) est dans `catalogue/admin/inbox`, statut PENDING, une seule fois. Un mouvement envoyé arrive dans l'onglet « Boîte d'arrivée » et n'entre dans les Fiches qu'après « Ajouter au catalogue ». Consignes du cahier réécrites. | — |
| f1-fichier / f2-invalide | « Je ne sais pas comment faire ce test. » | Consignes réécrites (Exporter, transfert vers l'iPhone, Depuis un fichier). Fichier invalide préparé hors dépôt : `C:UsershadjoDownloadskodjo-test-INVALIDE.catalogue.json` (REED-001 sans nom) ; `parseMovementCatalogueFile` le refuse (`sheets[0].content.name REQUIRED`). | — |
| c12-admin-biblio | « je ne sais pas comment tester ça » | Consigne réécrite ; elle disait à tort la Visibilité de la Bibliothèque en lecture seule (le tableau de Hermann : seule la publication l'est, n° 23). | — |
| a1-medias | KO du 11/11 à 14 h 18 | Déjà expliqué (serveur antérieur à `cd83ddd1`) ; à rejouer avec le serveur redémarré. | — |

Fichiers : `src/features/preferences/ProfileEditScreen.tsx`, `src/features/preferences/__tests__/ProfileEditScreen.test.tsx` (test « recette c1/c2 du 11/11 », pastille 22 sans libellé).

Tests : `tsc --noEmit` 0 erreur ; eslint 0 problème ; `npx jest --maxWorkers=2 src/features/preferences app` 9 suites, 77 tests verts. Suite complète non relancée (mémoire du PC). Aucun contrôle visuel sur iPhone.
