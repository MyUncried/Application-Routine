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
