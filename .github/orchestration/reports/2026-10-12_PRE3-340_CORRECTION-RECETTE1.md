# PRE-3 (#340) — correction après la recette iPhone 1 de Hermann

## Identité de la mission

| Élément | Valeur |
|---|---|
| Identifiant | `PRE3-340_CORRECTION-RECETTE1` |
| Objectif | Qualifier les 73 entrées de la recette iPhone 1 contre le contrat approuvé et corriger les défauts établis dans le périmètre autorisé. Les demandes contradictoires vont en arbitrage. Produire ensuite le candidat de recette et des retests ciblés. |
| Source | Prompt du 12/10/2026 (`KODJO_PRE3_Retours_et_Prompt_Claude_Code.txt`), annexe : transcription intégrale du classeur de recette |
| Branche | `feat/pre3-exercice-20261009` (aucune PR ouverte) |
| Tête distante de départ | `9f5cee0e7049494033908fcec586b0c37587e168` (candidat testé, build iOS 7) |
| Base locale | `595700d7` : diagnostic du push du 10/10, local et non publié jusqu’ici, **publié avec cette livraison** |
| Plan approuvé | `43e7b344` |
| Écrivain | Claude Code local, seul, dans un worktree isolé sans conversion des fins de ligne |
| Pilote, revue indépendante | ChatGPT (inchangé) |
| Limites | Aucune fusion, aucune auto-approbation, #340 non clôturée. Aucun `VISUAL_APPROVED` déclaré, aucune modification VNext ou V2, aucun PRE-4. |

## Périmètre

**Demandé** :
- registre unique ;
- défauts fonctionnels F-01 à F-03 en priorité ;
- qualification de UI-01 à UI-06, M-01 et A-01 à A-07 ;
- observations conservées et tests non concluants ;
- publication, candidat de recette et retests ciblés.

**Traité** : tout ce qui précède. Les corrections sont faites dans le `write_scope@43e7b344`, sans extension. Les points qui exigent un chemin hors portée ou un changement de contrat sont consignés, pas appliqués.

## Analyse historique (avant correction)

| Défaut | Parcours | Introduction | Détection | Attribution |
|---|---|---|---|---|
| F-01 (T-15) | Glisser une Série variable | `12506088` (revue 1, REV-06 : poignée de glisser avec responder natif) | Recette 1 sur le build 7 (`9f5cee0e`) | **Démontrée** : un test rouge sur `9f5cee0e` donne l’erreur exacte, et le recyclage `destructor()` existe dans `ReactFabric-prod.js` de RN 0.86.2. Aucun succès antérieur comparable : le glisser n’existait pas avant `12506088`. Jest masquait le défaut, car `fireEvent` fournit des événements durables. |
| M-01 (T-39, T-43) | Affiche vidéo | `b98008bb` (génération immédiate après `createVideoPlayer`) | Recette 1 | **Démontrée** par le code natif d’expo-video 57.0.5 : chargement asynchrone, puis `[]` sans erreur. Les tests précédents utilisaient un faux lecteur toujours prêt. |
| F-03 (T-34, T-35, T-59) | Création ou modification Catégorie/Zone | `bdc133c3` : feuille ancrée en bas, sans évitement du clavier, autour du formulaire en ligne de PRE-2 (`10ac761e`) | Recette 1 | **Démontrée** par la lecture du code ; le test est rouge sur l’original. |
| A-05 | Groupe Séries variables replié | `12506088` (groupe encadré DSF) | Recette 1 | **Démontrée** par la variante figée « Cadre=Non » |
| A-02/A-07, contour | Cellule à renseigner | `12506088` (E19 « contour danger », non sourcé v13) | Recette 1 | **Démontrée** par le figé 6665:27232 (#FF8D28, 1,5) |
| T-61, en-têtes | Titres des feuilles au texte agrandi | `bdc133c3` (hauteur fixe 56, une ligne) | Recette 1 | **Plausible** : la cause statique est certaine, mais le rendu n’est pas observé sur cet environnement. |
| F-02 (T-10) | Changement de mode | — | Recette 1 | **Indéterminée** : non reproduit sur `9f5cee0e` par 5 trajets. Le symptôme correspond à REV-01, déjà corrigé dans `12506088`. Le trajet exact est demandé. |

Aucune de ces anomalies ne relève d’une optimisation, du transport ou du protocole.

## Constats et modifications

Le registre complet, avec la traçabilité des 73 entrées et les sources citées, se trouve dans `docs/preparation/PRE-3/planification/execution/preuves/registre-recette1.md`.

**Corrigé dans `50691dc0c552f4d888609e10ebc45c0939ff083a`** (9 fichiers, tous dans le `write_scope`) :

- **F-01** (`ExecutionParametersSheet.tsx`) : la position du responder est lue de façon synchrone et le départ du geste est gardé dans une ref. Une interruption système remet la ligne en place.
- **F-03** (`CategoryPickerModal.tsx`, `BodyZonePickerModal.tsx`) :
  - `KeyboardAvoidingView` (iOS, `padding`) à la place du voile ;
  - formulaire ramené en vue à son ouverture et à l’apparition du clavier.
- **M-01** (`VideoPoster.ts`) :
  - l’affiche n’est générée qu’après l’état `readyToPlay` (`statusChange`, docs SDK 57 vérifiées), avec un délai maximal de 10 s ;
  - en cas d’`error` ou de délai dépassé, le repli actuel reste affiché ;
  - le lecteur est toujours libéré.
- **A-05** (`ExecutionParametersSheet.tsx`) : le cadre du groupe n’apparaît que si le tableau est déployé.
- **A-02/A-07, partiel** (`ProfileStepper.tsx`, `InlineStepper`) :
  - le contour de la cellule à renseigner passe à #FF8D28 en 1,5, valeur figée ;
  - les **messages sont conservés**, en arbitrage ;
  - le Profil n’utilise pas ce style.
- **T-61, partiel** : les en-têtes des trois feuilles passent de `height: 56` à `minHeight: 56`, et le titre n’est plus limité à une ligne.

**Préservé** :
- roulette native (R-1) ;
- politique du stepper Profil (R-2) ;
- `SegmentedControl`, tokens, `ColorPalette`, `ScreenShell` et `LabelPickerModal` : non modifiés ;
- migrations, domaine des paramètres, phrase et calculs : non modifiés ;
- aucune dépendance ni aucun asset ajouté ;
- aucune primitive native remplacée (interrupteur et `Modal` natifs conservés).

**Assertion remplacée** : dans `P3-16/fold-incomplete`, la couleur `#D92D20` devient `#FF8D28` avec une épaisseur de 1,5. Raison : l’obligation du plan n’impose aucune couleur, et la valeur rouge venait de E19 (revue 1), sans source v13. Rien n’a été supprimé.

## Preuves et tests

Environnement : poste Windows 11 ARM64, Node v24.19.0, Jest (jest-expo). Ni appareil ni simulateur.

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit -p .` | PASS |
| `npx eslint src app` | PASS (0 erreur, 0 avertissement) |
| `npx jest --json` | **97/97 suites, 1926/1926 tests**, 0 échec, 0 ignoré. Avant : 1914. |
| `verifier-passe2.cjs` | PASS (2143 contrôles) |
| `controle-portee.cjs --start 9f5cee0e…` | **PASS** : `write_scope@43e7b344`, aucune extension |
| Obligations `tests-and-preservation.json@43e7b344` (mêmes tests propriétaires que dans `couverture-obligations-revue1.json`) | **442/442 PASS**, dont les 276 phrases et les 13 cas numériques |
| `classify-environment-update.js 9f5cee0e… 50691dc0…` | `OTA_COMPATIBLE` (aucun fichier natif) |

**Contrôles de mutation** : chaque nouveau test a été exécuté sur le code d’origine.
- F-01 : rouge avec `TypeError … reading 'pageY'`.
- F-03, Catégorie : rouge.
- M-01 : rouge sur les 2 tests.
- Tous sont verts après correction.

**Preuves publiées** dans `docs/preparation/PRE-3/planification/execution/preuves/` :
- `registre-recette1.md` ;
- `procedure-appareil-recette1.md` ;
- `resultats-tests-recette1.json` ;
- `couverture-obligations-recette1.json` ;
- `controle-portee-recette1.json` ;
- `compatibilite-ota-recette1.json`.

Les preuves antérieures sont conservées intactes.

## Hypothèses non démontrées

- Le rendu réel des corrections n’est pas observé sur iPhone : glisser, clavier, affiche vidéo, cadre et contour, titres agrandis.
- L’état initial du lecteur expo-video sur iOS (`loading` ou `idle`) est déduit du code natif. Le délai maximal de 10 s couvre aussi le cas `idle`.
- Le build installé est le build 7 : c’est le seul produit depuis `9f5cee0e`, mais le cadre de la grille est vide.
- F-02 : la cause n’est pas déterminée sur `9f5cee0e`.

## Non corrigé, en attente ou hors périmètre

| Catégorie | Points |
|---|---|
| **Arbitrages** (changement de contrat ou préférence non prescrite) | R-04 fermeture du sélecteur après choix ; R-05 Mode en regular (contraire au DSF) ; R-06 couleur et dégradé du bandeau (contradiction entre D3 du 07/10 et le figé du 08/10 ; dégradé = dépendance native et nouveau build) ; R-08 cadre d’Annuler et fermeture au toucher ; R-10 bouton ↑ au lieu d’Annuler/Ajouter ; R-11 16 pastels au lieu de 12 couleurs ; R-14 tableau redéployé à la réactivation ; R-15 suppression des messages ; R-16 pas de 1 puis 5 ; R-17 animation du voile ; R-19 pauses variables dans la phrase À l’échec |
| **Extension de portée demandée** | `LabelPickerModal.tsx` (clavier Étiquette) ; `SegmentedControl.tsx` (Côté, Ordre, sélection nulle, hauteur fixe) ; asset et `KodjoIcon.tsx` (icône Catégorie) ; `ColorPalette.tsx` (bandeau) ; `ScreenShell.tsx` (halo, hauteur des titres d’écran) |
| **À reproduire** | R-02 / F-02 (trajet exact demandé) |
| **Hors tranche** | Catalogue (Créer/Filtrer/Trier), Profil au texte agrandi, couleur de la Composition |

## Vérifications restant à faire sur appareil réel

Retests RT-01 à RT-11 de `procedure-appareil-recette1.md`. Aucun contrôle de base de données ni de calcul n’y est demandé. VoiceOver (T-63 à T-65) fera l’objet d’une procédure courte après les décisions, sans nouvelle recette globale.

## Fichiers modifiés (`9f5cee0e` → tête)

- **Diagnostic du 10/10, publié** : `.github/orchestration/reports/2026-10-10_PRE3-340_DIAGNOSTIC-PUSH-NON-PUBLIE.md`.
- **Code** : `ExecutionParametersSheet.tsx`, `CategoryPickerModal.tsx`, `BodyZonePickerModal.tsx`, `VideoPoster.ts`, `ProfileStepper.tsx`.
- **Tests** : `ExecutionParametersSheet.test.tsx`, `CategoryPickerModal.test.tsx`, `BodyZonePickerModal.test.tsx`, `VideoPoster.test.ts`.
- **Documentaire** : ce rapport et les 6 preuves `*-recette1.*`.

## Commit final, publication et état Git

- Commit de code : `50691dc0c552f4d888609e10ebc45c0939ff083a`.
- Le commit documentaire qui contient ce rapport, la publication sans force sur `origin/feat/pre3-exercice-20261009` et la mise à jour OTA du canal `review` sont consignés dans la section « Publication » ajoutée après leur exécution.
