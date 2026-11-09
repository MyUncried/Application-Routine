# KODJO — Chargement des 60 mouvements pilotes : préparation et qualification (parallèle à PRE-10)

| Champ | Valeur |
|---|---|
| Identifiant | `CATALOGUE-60-CHARGEMENT-RECETTE` |
| Date | 9 novembre 2026 |
| Objectif | Préparer et qualifier le chargement des 60 Mouvements du pilote dans KODJO en réutilisant la passerelle de la PR #434, sans perturber PRE-10 ni la version iPhone en recette |
| Type | Audit + correction technique ciblée (aucune livraison, build, OTA, fusion ni écriture dans une base personnelle) |
| Worktree | `C:/Dev/KODJO-CAT60` (créé pour cette mission) |
| Branche | `catalogue/chargement-60-recette-20261109` (locale, non poussée) |
| Commit de départ | `11cd3523` = tête distante de `feat/catalogue-import-local-60-20261107` (PR #434) au 9/11 |

## 1. Isolation

- Session PRE-10 : worktree `C:/Dev/PRE10`, branche `pre10-bmad/dev` (au début : `7f5e3454` + 12 fichiers modifiés non commités ; à la fin : `5f80c443`, arbre propre — avancement de la session PRE-10 elle-même).
- Aucune commande d'écriture n'a été exécutée dans `C:/Dev/PRE10` (lectures `git status`/`log`/`grep` seulement). Aucun checkout, reset, rebase, clean ni stash. `pre10-bmad/dev` non modifiée.
- `git worktree add -b catalogue/chargement-60-recette-20261109 C:/Dev/KODJO-CAT60 origin/feat/catalogue-import-local-60-20261107`.
- Worktree jetable `C:/Dev/KODJO-CAT60-port` en **HEAD détaché** (sans branche) pour les essais de portabilité sur `origin/main` puis `origin/pre10-bmad/dev` ; aucune écriture sur ces branches.
- `node_modules` installés séparément dans chaque worktree (`npm ci`). Tests SQLite exclusivement sur bases `node:sqlite` en mémoire.

## 2. Pile des PR (état au 9/11, aucune fusion)

| PR | Branche → base | État | CI VNext | CI catalogue |
|---|---|---|---|---|
| #421 | `docs/movement-provenance-ownership-20261106` → `main` | brouillon, CLEAN | — | — |
| #423 | `feat/catalogue-pilote-fixtures-20261106` → #421 | brouillon, CLEAN | — | — |
| #425 | `docs/catalogue-taxonomie-v0-20261107` → #423 | brouillon, UNSTABLE | — | — |
| #429 | `feat/catalogue-admin-local-v0-20261107` → #425 | brouillon, UNSTABLE | 4 échecs | vert |
| #432 | `feat/catalogue-admin-static-medias-20261107` → #429 | brouillon, UNSTABLE | — | — |
| #433 | `catalogue/preclassement-60-revue-20261107` → #432 | brouillon, UNSTABLE | 4 échecs | vert |
| #434 | `feat/catalogue-import-local-60-20261107` → #433 | brouillon, UNSTABLE | 4 échecs | vert |

- Base de la pile : `main@1a28c7f6`. `main` actuel (`901d7b4c`) a **170 commits** d'avance ; la pile en a 102 propres.
- **Échecs VNext** (`historical-equivalence` ×2 : `VNEXT_EQ_EXECUTION_INCOMPLETE` ; `qualification` ×2, dont Windows : `VNEXT_PUBLICATION_WRITER_POLICY_INVALID … cleanup-workspace-smoke.ps1`) : **préexistants**, identiques sur #429 et #433 ; le diff de #434 ne touche aucun fichier `scripts/kodjo/**` ni workflow VNext. Attribution à #434 : **écartée (démontrée)**. Cause racine VNext : hors périmètre, non analysée.

## 3. Compatibilité iPhone

### Éléments vérifiés (EAS, lecture seule : `eas build:list`, `eas update:list`)

| Build | Profil | Identifiant | Build n° | Runtime | Canal | Commit | Date |
|---|---|---|---|---|---|---|---|
| `aef5efd5` | preview | `com.ankusha.kodjo` (Routine) | 1 | 1.1.0 | stable | `88f4ec67` | 26/10 |
| `f0939230` | preview | `com.ankusha.kodjo` | 1 | 1.1.0 | stable | `ad189847` | 20/10 |
| `df00eb68` | development-bmad (dev client) | `com.ankusha.kodjo.bmad` (Routine BMAD) | 1 | 1.1.0 | — | `fa738e31` (absent du dépôt distant) | 17/10 |
| `38bf5fc2` | review | `com.ankusha.kodjo.dev` (Routine Dev) | 8 | 1.1.0 | review | `58bbc3bc` | 12/10 |

- Dernière OTA : canal `stable`, « KODJO stable PRE-5 BMAD ad189847 » (≈ 2 semaines).
- **Aucune build iOS depuis le 26/10.** `expo-document-picker` n'apparaît dans l'historique qu'au commit `cec35606` (7/11). Absent de `package.json` à `88f4ec67` et `ad189847` (vérifié) ; `fa738e31` n'est pas consultable, mais est antérieur de trois semaines. → **Aucun binaire existant ne contient `expo-document-picker`** (démontré pour les builds preview, déduit par chronologie pour le dev client BMAD).
- `runtimeVersion` est une chaîne fixe `1.1.0` (pas de politique d'empreinte) : EAS Update n'empêcherait pas une OTA de livrer du JS appelant un module natif absent.
- `expo-document-picker/build/ExpoDocumentPicker.js` exécute `requireNativeModule('ExpoDocumentPicker')` **au chargement du module**. `CatalogueScreen.tsx` de #434 l'importe en tête de fichier : servi (Metro ou OTA) à un binaire qui ne contient pas le module, l'écran Catalogue échouerait **même avec la commande désactivée**.
- **Schéma SQLite** : la branche #434 s'arrête à `DATABASE_VERSION = 15` ; `main` est en v23, PRE-10 en v24. `migrateDatabase` refuse une base plus récente (« Database version N is newer than supported version 15 »). Une build construite depuis #434 telle quelle ne peut pas ouvrir une base déjà migrée par une version récente du même identifiant d'application.

### Informations manquantes (non inférables depuis le code)

- Quelle application est réellement utilisée pour la recette PRE-10 (Routine, Routine Dev ou Routine BMAD) et son numéro de build (Réglages › Général › Stockage iPhone, ou écran d'information de l'app).
- Si PRE-10 est servi par Metro au dev client « Routine BMAD » (pratique observée en PRE-8/PRE-9, non vérifiée pour PRE-10) ou par OTA.
- La version de schéma de la base personnelle (v23 ou v24 selon le code qui l'a ouverte en dernier).

### Conclusion

1. **Version installée, directement : impossible** (aucun binaire ne contient le sélecteur de fichier).
2. **OTA ou Metro du code #434 : exclu** — module natif absent (plantage de l'écran Catalogue) et schéma v15 incompatible avec la base existante.
3. **Nouvelle build native dédiée à la recette : seule voie pour le trajet complet #434** (fichier `kodjo-admin-brouillons.json` → Fichiers → import), et cette build doit partir de la ligne de code actuelle (`main` ou PRE-10), pas de la branche #434 seule.

Variante sans nouvelle build (non implémentée, nécessite ton accord) : une commande JS « charger les 60 fiches embarquées » appelant `preparePilotMovementImport(brouillons vides)` puis `installPilotMovements`, sans sélecteur de fichier. Compatible avec les binaires existants (aucun module natif nouveau), mais **ne peut pas reprendre les modifications OVH** (elles exigent le fichier) et écrirait dans la base de l'application qui la reçoit.

## 4. Import (#434) — constats et correction

### Constats

- Mécanisme conforme à la description : `preparePilotMovementImport` (validation complète des 60 fiches avant écriture, refus des fiches étrangères, des noms normalisés en double, des formats non conformes) → `installPilotMovements` (préflight sans écriture : collisions d'identifiant divergent et de nom refusées avant toute insertion) → `MovementCatalogueService.createIndependent` → `SqliteMovementRepository` (une transaction par Mouvement). Ni Exercice, ni Séance, ni Format, ni média.
- Les tests de #434 utilisent un **faux catalogue en mémoire** : l'aller-retour SQLite n'était pas couvert.
- **Défaut démontré** : `SqliteMovementRepository` relit `movement_body_zones` sans `ORDER BY` (pas de colonne de position) ; `equivalent()` comparait l'ordre exact des Zones. 30 fiches sur 60 ont des Zones non triées alphabétiquement. Conséquence : **après un premier import réussi, tout réimport est refusé** (`pilot:REED-004 existe déjà avec un contenu différent`) — idempotence annoncée non tenue et **reprise après interruption impossible**. Reproduit sur la branche #434, sur `origin/main` et sur `origin/pre10-bmad/dev`.
- **Écart secondaire** : une exception SQLite (et non un statut `DUPLICATE_NAME`/`INVALID`) remontait brute, sans le message « Import interrompu après N insertion(s) … relancer avec le même fichier est sûr ».
- Historique (règle de comparaison) : aucun succès antérieur comparable (premier test sur SQLite réelle) ; défaut introduit par `c0cb00e0` (création de `pilotMovementImport.ts`), détecté par cette mission. Attribution : **démontrée**.
- Pas de transaction globale sur les 60 fiches : confirmé, **aucun rollback intégral n'est garanti**. Chaque Mouvement est atomique (aucun alias ni Zone orphelin après échec, vérifié) et la reprise avec le même fichier complète les manquants.
- Le raccordement UI de #434 (`CatalogueScreen.tsx`) **ne s'applique pas** sur `main` (écran remanié par PRE-9 : +701/−558 lignes depuis la base de la pile) ; PRE-10 n'y ajoute que 5 lignes.

### Modifications (classe A : conformité à la règle documentée « import exact répété = aucune nouvelle création » et « relancer avec le même JSON est sûr »)

- `src/features/activities/pilotMovementImport.ts` : Zones comparées comme un ensemble (`sameZones`) ; exception d'écriture convertie en message « Import interrompu après N insertion(s) … ».
- `src/features/activities/__tests__/pilotMovementImport.sqlite.test.ts` (nouveau) : 7 tests sur le vrai repository SQLite.
- `.github/workflows/kodjo-catalogue-qualification.yml` : le nouveau test est ajouté à l'étape Jest existante et au filtre de chemins.
- `docs/KODJO-Import-catalogue-admin-vers-mobile-2026-11-07.md` : une ligne dans « Contrôles ».
- Aucune règle métier, aucun périmètre MVP, aucune spécification fonctionnelle modifiés. Aucun fichier du moteur d'exécution touché.

## 5. Données

- Corpus Git : `catalogue/pilote/mouvements-60-candidats.json` — 60 candidats, 239 étapes, `publicationAllowed:false` (validé). Préclassement `catalogue/referentiels/preclassement-60-candidats-v0.json` — 60/60, 0 référence inconnue, 60 revues `PENDING` ; Catégories utilisées : renforcement, mobilite, coordination, etirements, equilibre, cardio, recuperation ; Zones : cuisses, genoux, hanches-bassin, epaules, dos, bras, poignets-mains, chevilles-pieds, jambes, cou (toutes présentes dans le schéma migré : l'insertion des 60 réussit sur v15, v23 et v24).
- `catalogue/admin/brouillons.json` versionné : **0 fiche modifiée** (initialisation du 7/11, `b951334f`).
- **Aucun export réel `kodjo-admin-brouillons.json` de l'administration OVH n'a été récupéré** (absent du dépôt et des dossiers Téléchargements/Bureau/Documents/OneDrive/iCloudDrive de ce poste). Aucune modification administrative n'est donc intégrée ; rien n'a été inventé.
- La qualification porte sur **les données Git** (brouillon vide + un brouillon synthétique de test). Elle ne vaut pas recette du chargement des fiches effectivement administrées sur OVH.

## 6. Preuves et tests (worktree `C:/Dev/KODJO-CAT60`, Node 24.19, sauf mention)

| Commande | Résultat |
|---|---|
| `node scripts/catalogue/validate-preclassification.mjs` | PASS (60/60) |
| `node --test scripts/catalogue/__tests__/preclassification.test.mjs` | PASS |
| `node scripts/catalogue/validate-pilot-corpus.mjs` | PASS (60, 239 étapes) |
| `node scripts/catalogue/validate-taxonomy.mjs` | PASS |
| `node --test …validate-pilot-corpus.test.mjs …validate-taxonomy.test.mjs` | PASS |
| `node --check` admin (`app.js`, `server.mjs`, `drafts.mjs`) | PASS |
| `node --test scripts/catalogue/__tests__/static-ovh-medias.test.mjs` | PASS |
| `node --test tools/catalogue-admin/server.test.mjs` | PASS |
| `npx tsc --noEmit` | PASS (branche, `origin/main`+importeur, `origin/pre10-bmad/dev`+importeur) |
| `npx jest pilotMovementImport` (2 fichiers, 14 tests) | PASS sur les trois lignes de code |
| Contre-preuve : importeur #434 d'origine + test SQLite, sur `origin/main` | 3 échecs (réimport ×2, reprise) — défaut reproduit |
| `npx jest MovementEditorialProvenance seedMovementTestCorpus` | PASS |
| `npx jest --runInBand` MovementCatalogueService, SqliteMovementRepository, seedMovementTestCorpus, migrateDatabase, pilotMovementImport (×2), CatalogueScreen (×3) | PASS — 9 suites, 136 tests |
| `npx jest --runInBand` (suite complète, 220 fichiers) | **non abouti** : arrêté volontairement après 6 fichiers verts (≈ 15 min, plusieurs heures estimées) ; il qualifierait la ligne #434 (v15), qui n'est pas celle de la future build. Remplacé par la non-régression ciblée ci-dessus |

Limites : aucun test sur appareil ; `expo install --check`/`expo-doctor` non exécutés (ils interrogent le réseau Expo et ne qualifient pas le binaire installé) ; le sélecteur de fichier et la lecture `expo-file-system` ne sont pas testés hors iPhone.

## 7. Risques

- **PRE-10** : aucun impact (aucune écriture dans son worktree ni sa branche ; aucun fichier d'exécution modifié). Une future intégration du raccordement UI touchera `CatalogueScreen.tsx`, que PRE-10 modifie aussi (5 lignes).
- **SQLite** : un binaire construit depuis la pile #434 seule (schéma v15) installé sous un identifiant dont la base est en v23/v24 ne s'ouvrirait plus (refus explicite, pas de perte de données, mais application inutilisable jusqu'à réinstallation d'une version récente).
- **Recette actuelle** : servir le code #434 par Metro ou OTA aux binaires existants ferait échouer l'écran Catalogue (module natif absent).
- **Import** : pas de rollback global ; reprise fiable après correction. Les 60 noms peuvent entrer en collision avec des Mouvements personnels de même nom : l'import est alors refusé en bloc, sans écriture.

## 8. Prochaine action minimale (à décider, rien n'est lancé)

1. Choisir la base de la build de recette : `main` (v23) ou PRE-10 une fois stabilisée (v24) — elle doit être au moins aussi récente que la base de l'application qui recevra l'import.
2. Sur une branche issue de cette base : ajouter `catalogue/pilote/…`, `catalogue/referentiels/preclassement-…`, `pilotMovementImport.ts` corrigé et ses deux tests (portabilité déjà vérifiée), `expo-document-picker@~57.0.3`, et **réadapter** le raccordement de `CatalogueScreen.tsx` (commande derrière `EXPO_PUBLIC_KODJO_CATALOGUE_IMPORT=1`).
3. Construire une build native de recette ; de préférence sous un identifiant distinct de l'application personnelle (p. ex. profil `review`, « Routine Dev », données séparées) pour ne pas toucher la base personnelle ni l'app de recette PRE-10.
4. Récupérer le dernier export réel `kodjo-admin-brouillons.json` depuis l'administration OVH, le déposer dans Fichiers, puis importer.

## 9. Vérifications restant à faire sur appareil

Sélection du JSON dans Fichiers, lecture d'un export réel (taille, médias comptés), récapitulatif, import 60/60, réimport « 0 ajouté, 60 identiques », affichage des 60 Mouvements dans Catalogue › Mouvements, absence d'effet sur Séances/Exercices/historique.

## 10. Fichiers modifiés

- `src/features/activities/pilotMovementImport.ts`
- `src/features/activities/__tests__/pilotMovementImport.sqlite.test.ts` (nouveau)
- `.github/workflows/kodjo-catalogue-qualification.yml`
- `docs/KODJO-Import-catalogue-admin-vers-mobile-2026-11-07.md`
- `.github/orchestration/reports/2026-11-09_CATALOGUE-60-CHARGEMENT-RECETTE.md` (ce rapport)

## 11. Commit final et état Git

Voir § 11 bis (complété après commit).
