# KODJO — Intégration du chargement des 60 Mouvements sur `main` et variante « Routine Catalogue »

| Champ | Valeur |
|---|---|
| Identifiant | `CATALOGUE-60-INTEGRATION-MAIN` |
| Date | 9 novembre 2026 |
| Objectif | Reporter sur le dernier `origin/main` le strict nécessaire à l'import des 60 Mouvements pilotes, préparer une variante iOS isolée « Routine Catalogue », qualifier ; s'arrêter avant toute build, OTA ou fusion |
| Décisions de Hermann (9/11) | Publication autorisée de `catalogue/chargement-60-recette-20261109` ; intégration sur `origin/main` (pas PRE-10) sans la pile historique ; variante iOS temporaire distincte (identifiant, base SQLite, OTA) ; tests sur les 60 fiches Git + comportement avec export OVH réel (limite de taille avec photos) ; pas de build, d'OTA ni de fusion |
| Mission précédente | `.github/orchestration/reports/2026-11-09_CATALOGUE-60-CHARGEMENT-RECETTE.md` (branche `catalogue/chargement-60-recette-20261109`, commits `f43c261f`, `b0c0adb4`) |
| Worktree | `C:/Dev/KODJO-CAT60-MAIN` |
| Branche | `catalogue/integration-60-main-20261109` |
| Commit de départ | `origin/main` = `901d7b4c` (Merge PR #420), schéma SQLite v23 |

## 1. Isolation et publication

- `catalogue/chargement-60-recette-20261109` vérifiée (2 commits d'avance, arbre propre, absente du distant) puis poussée. PR #434 non modifiée.
- Worktree jetable de la mission précédente (`C:/Dev/KODJO-CAT60-port`, HEAD détaché sur PRE-10) supprimé ; aucun autre usage de la branche PRE-10.
- Nouveau worktree `C:/Dev/KODJO-CAT60-MAIN` depuis `origin/main` ; `node_modules` propres à ce worktree.
- `C:/Dev/PRE10` : aucune écriture.

## 2. Éléments reportés (et non reportés)

| Reporté sur `main` | Origine |
|---|---|
| `catalogue/pilote/mouvements-60-candidats.json`, `catalogue/referentiels/preclassement-60-candidats-v0.json` | identiques à la pile (#423, #433) |
| `src/features/activities/pilotMovementImport.ts` (avec correctif Zones/interruption `f43c261f`) | #434 + mission précédente |
| `pilotMovementImport.test.ts`, `pilotMovementImport.sqlite.test.ts` | #434 + mission précédente |
| `docs/KODJO-Import-catalogue-admin-vers-mobile-2026-11-07.md` (adapté) | #434 |

Non reportés : administration Web (#429, #432), taxonomie (#425), provenance (#421), scripts de validation catalogue, `catalogue/admin/brouillons.json` (vide, inutile à l'import), et les 7 annotations « non normatives » de #434 dans les spécifications (INDEX, PRODUCT, ch. 06, 07, 08, 09, 12) : outil temporaire hors MVP, aucune décision fonctionnelle nouvelle (classe D) ; la variante BMAD, précédent comparable, n'est pas non plus documentée dans les spécifications.

## 3. Adaptations à `main`

- **Catalogue remanié par PRE-9** : le raccordement de #434 ne s'appliquait plus. La commande est isolée dans `src/features/activities/PilotMovementImportCommand.tsx` ; `CatalogueScreen.tsx` ne reçoit que 5 lignes (import, rendu sous la zone de contexte des Mouvements si `EXPO_PUBLIC_KODJO_CATALOGUE_IMPORT=1`, relecture de la liste après import, y compris après interruption).
- **Module natif chargé à la demande** : `expo-document-picker` exécute `requireNativeModule` au chargement ; il est désormais requis au toucher de la commande (même motif que `expo-video` dans `MediaConsultation`). Le code de cette branche reste chargeable par un binaire qui n'embarque pas le module. Garde-fou testé : aucun import statique.
- **Taille réelle** : si le sélecteur ne fournit pas la taille, celle du fichier est lue avant tout chargement en mémoire.
- **Schéma SQLite** : aucune migration ; importeur exécuté sur le schéma v23 réel (tests SQLite).

## 4. Variante iOS « Routine Catalogue » (préparée, non construite)

| Caractéristique | Valeur |
|---|---|
| Profil EAS | `catalogue-recette` (`eas.json`) |
| `APP_VARIANT` | `catalogue` |
| Nom affiché | Routine Catalogue |
| Identifiant iOS | `com.ankusha.kodjo.catalogue` (nouveau, distinct de Routine, Routine Dev, Routine BMAD) |
| Schémas de lien | `routine-catalogue`, `com.ankusha.kodjo.catalogue` (`exp+routine` du dev client désactivé, comme BMAD) |
| Base SQLite | conteneur de l'application : indépendante des autres apps |
| OTA | `EXUpdatesEnabled = false` (bundle embarqué uniquement) ; **aucun canal** dans le profil |
| Type | build interne (`distribution: internal`), sans dev client (`developmentClient: false`), appareil physique |
| Commande d'import | activée (`EXPO_PUBLIC_KODJO_CATALOGUE_IMPORT=1`, injectée dans le bundle : vérifié) |
| Runtime / version | `1.1.0` / `1.0.0` (inchangés, sans effet puisque OTA désactivées) |
| Modules natifs | 36 modules Expo autolinkés, dont `expo-document-picker@57.0.3` ; autres versions identiques à `main` (lockfile) |
| Icône | icône de base (pas de nouvel asset) ; différenciation par le nom |

Vérifications : configuration résolue des variantes `""`, `development`, `bmad`, `production` **strictement identique** avant/après ; introspection `expo config --type introspect` (Info.plist, Expo.plist, entitlements vides) ; `expo-modules-autolinking resolve` ; `expo export --platform ios` local réussi (bundle Hermes 6,0 Mo contenant la commande, le module et les 60 fiches).

À prévoir au moment de la build : nouvel identifiant → création de l'App ID et d'un profil de provisionnement ad hoc par EAS (identifiants Apple, appareil enregistré) ; `appVersionSource: remote` initialise un numéro de build propre à cet identifiant.

## 5. Données et export OVH

- Tests techniques sur les **60 fiches Git** (239 étapes), brouillon vide.
- **Aucun export réel `kodjo-admin-brouillons.json` disponible** (absent du dépôt et de ce poste, voir rapport précédent) : le comportement avec un export réel n'est **pas vérifié**. Vérifié à la place, sur le code de l'administration (`tools/catalogue-admin/static-ovh/index.html`, PR #432) et un export synthétique au même format :
  - photo embarquée : WebP base64, 1 050 px, ≤ 580 000 caractères ; ≤ 30 médias par fiche ; **l'export n'est pas plafonné** ; la limite de 24 Mo ne s'applique qu'à la relecture (administration et mobile, en octets) ;
  - 42 photos au plafond : export < 24 Mo, 60 Mouvements importés, 42 médias signalés comme restant dans le fichier, aucun média créé ;
  - 44 photos au plafond : export > 24 Mo, **refusé en entier** avant lecture, aucune écriture.
- Brouillons et médias originaux non modifiés (aucun accès à l'administration OVH).

## 6. Tests (worktree `C:/Dev/KODJO-CAT60-MAIN`, Node 24.19)

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npx eslint` (commande, test, CatalogueScreen, app.config.js) | PASS (0 erreur, 0 avertissement) |
| `npx jest pilotMovementImport PilotMovementImportCommand` (3 fichiers) | PASS — 23 tests : SQLite réelle, idempotence, collisions, préservation, interruption au 31e puis reprise, commande, taille, export OVH 42/44 photos, isolation |
| Non-régression : `Catalogue*` (sessions), `MovementCatalogue*`, `SqliteMovementRepository`, `migrateDatabase`, `targetSchema` + import | PASS — 20 suites, 253 tests (avant l'ajout des 2 tests OVH) |
| `npx expo install --check` | 22 écarts de version corrective **préexistants sur `main`** ; `expo-document-picker` aligné ; non corrigés (hors périmètre, changeraient toutes les variantes) |
| `npx expo export --platform ios` (variante catalogue) | PASS |
| Suite Jest complète | non exécutée (plusieurs heures en `--runInBand` sur ce poste ; diff limité au Catalogue des Mouvements) |

CI : workflow `kodjo-catalogue-import-recette.yml`, déclenché uniquement par un push de cette branche (aucune exigence ajoutée à `main`).

## 7. Risques

- **PRE-10** : aucun fichier d'exécution ni de migration touché. `CatalogueScreen.tsx` est modifié par les deux lignes de travail (5 lignes chacune) : risque de conflit textuel à contrôler à l'intégration (voir § 9).
- **Base personnelle et recette PRE-10** : non concernées tant que la build reste sous `com.ankusha.kodjo.catalogue`.
- **Export OVH avec photos** : au-delà d'environ 43 photos lourdes, l'import mobile est refusé ; il faudrait alors un export allégé ou un arbitrage sur la limite (non décidé).
- **Pas de rollback global** (60 transactions successives) ; reprise vérifiée.
- Interface de la commande non validée visuellement (outil interne, sans référence Figma).

## 8. Vérifications sur appareil (après build autorisée)

Installation à côté des autres apps ; Catalogue › Mouvements : commande visible ; sélection du JSON dans Fichiers ; export réel (taille, nombre de médias) ; import 60/60 ; réimport « 0 ajouté, 60 identiques » ; 60 Mouvements visibles et classés ; aucune Séance/Exercice créé ; aucune mise à jour OTA reçue.

## 9. Fichiers modifiés, commit et état Git

Fichiers : `.github/workflows/kodjo-catalogue-import-recette.yml` (nouveau), `app.config.js`, `eas.json`, `package.json`, `package-lock.json`, `catalogue/pilote/mouvements-60-candidats.json` (nouveau), `catalogue/referentiels/preclassement-60-candidats-v0.json` (nouveau), `src/features/activities/pilotMovementImport.ts` (nouveau), `src/features/activities/PilotMovementImportCommand.tsx` (nouveau), `src/features/activities/__tests__/pilotMovementImport.test.ts` (nouveau), `src/features/activities/__tests__/pilotMovementImport.sqlite.test.ts` (nouveau), `src/features/activities/__tests__/PilotMovementImportCommand.test.tsx` (nouveau), `src/features/sessions/CatalogueScreen.tsx`, `docs/KODJO-Import-catalogue-admin-vers-mobile-2026-11-07.md` (nouveau sur `main`), ce rapport.

- Commit de code, tests, configuration et rapport : `d989313ec7bd63e88e245c7a763cd97f1881fe7f` (parent `901d7b4c`) ; ce paragraphe est ajouté par le commit documentaire qui le suit directement.
- Branche poussée : `origin/catalogue/integration-60-main-20261109`. Aucune PR, aucune fusion dans `main`.
- CI GitHub : run `42599908263` « KODJO catalogue import recette » — **success** (installation, typecheck, tests d'import, non-régression Catalogue) sur Node 22. Le workflow VNext (`42599908280`) est `skipped` pour ce push.
- Fusion simulée en mémoire (`git merge-tree`, aucune référence modifiée) avec `origin/pre10-bmad/dev` (`9aa90d5f`) et `pre10-bmad/dev` local (`5f80c443`) : **sans conflit**.
- `catalogue/chargement-60-recette-20261109` poussée (`b0c0adb4`).
- Worktrees : `C:/Dev/KODJO-CAT60` (`catalogue/chargement-60-recette-20261109`, propre) et `C:/Dev/KODJO-CAT60-MAIN` (cette branche, propre après commit) ; `C:/Dev/PRE10` non modifié.

## 10. Build `catalogue-recette` — état au 9/11 (bloqué avant lancement)

Autorisation de Hermann (9/11) : lancer uniquement la build iOS interne `catalogue-recette` depuis cette branche, après vérification du HEAD et de la CI ; identifiant `com.ankusha.kodjo.catalogue`, isolation SQLite et OTA désactivées impératifs ; ni installation, ni App Store, ni fusion ; préciser toute action Apple nouvelle avant de poursuivre.

Vérifications faites :

- HEAD local = distant = `d87d0fe38e7566bcd8f0a4b55bc2605cfe1ca2b6`, arbre propre ; CI « KODJO catalogue import recette » **success** sur ce HEAD (run `42600249733`).
- Variables d'environnement serveur EAS (`development`, `preview`, `production`) : aucune — rien ne peut écraser `APP_VARIANT` ni réactiver les OTA.
- Identifiants iOS du projet `@ankushas-team/routine` (API EAS, lecture seule) : équipe Apple `RC8F846A68` (ANKUSHA) ; profils ad hoc actifs jusqu'au 29/08/2027 pour `com.ankusha.kodjo`, `.dev`, `.bmad` (certificat de distribution `2638F145…`, commun) ; **aucun identifiant pour `com.ankusha.kodjo.catalogue`** ; **aucune clé API App Store Connect** enregistrée sur le compte.

Conséquence : la création de l'App ID et du profil ad hoc exige une connexion Apple interactive (identifiant Apple + 2FA), impossible depuis la session Claude (sans entrée interactive). **Build non lancée** ; action requise de Hermann (voir compte rendu de session). Aucune écriture effectuée chez Apple ni chez EAS.
