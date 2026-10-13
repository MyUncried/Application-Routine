# PRE-3 (#340) — finalisation : extensions X-1 à X-4, valeurs D-341, candidat de recette consolidé

## Identité de la mission

| Élément | Valeur |
|---|---|
| Identifiant | `PRE3-340_FINALISATION-RECETTE` |
| Objectif | Consigner les autorisations X-1 à X-4 et les valeurs D-6 (D-341) ; réaliser les corrections ; tester ; publier ; préparer et vérifier la mise à disposition de la recette dans Routine Dev ; fournir une procédure finale unique. |
| Branche | `feat/pre3-exercice-20261009` (sans PR) |
| Tête de départ | `69be05f2` |
| Plan approuvé | `43e7b344` |
| Écrivain | Claude Code local, seul, même worktree isolé, sans conversion des fins de ligne |
| Limites | Aucune fusion, aucune clôture, aucune auto-approbation, aucun `VISUAL_APPROVED`, aucun PRE-4, aucune modification du protocole |

## Périmètre

**Demandé** :
- X-1 avec les valeurs D-6 ;
- X-2 avec vérification d’identité du master et preuve ;
- X-3 appliqué au rendu et aligné dans la documentation, sans toucher les autres consommateurs ;
- X-4 sans changement à taille normale ;
- tests ciblés, publication, mise à jour de recette vérifiée, procédure finale unique avec F-02.

**Traité** : tout le périmètre demandé.

## Constats

- **X-2** :
  - Le master `icon/categorie` (6296:10530) est identique en live et dans le figé : id, nom, 24×24, position (1176, 180).
  - L’icône de l’écran figé (« Icône catégorie — pleine », 7287:13722) n’est l’instance d’aucun master et **n’existe plus** dans Figma. Ses dimensions (11,667 × 16,25) sont **exactement** celles du glyphe du master (14 × 19,5) à l’échelle 20/24.
  - L’asset reprend donc les 4 tracés du master, affichés à 20×20. Preuve : `x2-icone-categorie/correspondance.json` et les exports bruts.
- **X-3** :
  - `exerciseContextBandBackground` reste utilisé par la Composition : il n’est pas modifié.
  - Deux tokens dédiés sont créés : `exerciseEditorContextBand` (#EAEAFF) et `variableSeriesGroupSurface` (#F3F3F6).
- **X-4** : `minHeight` égal à l’ancienne hauteur, donc rendu identique à taille normale. Les suites des écrans consommateurs sont vertes.
- **Limite constatée** : le halo sous Retour est calculé pour un en-tête de 48. Au texte agrandi maximal, l’en-tête grandit et le halo, rogné à la zone, peut se décaler légèrement sous le bouton. C’est une présentation à vérifier en R-19 ; aucune information n’est masquée.

## Modifications

**Code** (`6fd6d40d55a57b40aa53661bc7933794bcedebdc`) :
- `SegmentedControl.tsx` (X-1) : variante `parameters`, valeur nulle, sous-titres, hauteur minimale. Le rendu standard du Catalogue est inchangé.
- `ExecutionParametersSheet.tsx` : D-341 (Mode, Côté et Ordre) et X-3 (fond du groupe).
- `ActivityEditorForm.tsx` : X-2 (icône 20×20) et X-3 (zone #EAEAFF).
- `KodjoIcon.tsx`, `assets/icons/icon-categorie.svg`, `assets/icons/manifest.json` (X-2).
- `tokens.ts` : 5 couleurs et 1 style typographique.
- `i18n/index.ts` : libellés Côté sur deux lignes et sous-titres d’ordre.
- `ScreenShell.tsx` (X-4).
- Chapitre 12 : 6 lignes de tokens.
- Tests : `SegmentedControl` (+5), feuille (+1), `ScreenShell` (+1), assertions de couleur X-3 dans l’éditeur et la feuille.

**Documentation** :
- `4795289c` : registre de recette §9, preuves X-2, contrôles.
- `0f86cddb` : procédure finale `procedure-recette-finale-pre3.md`.

## Preuves et tests

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit -p .` | PASS |
| `npx eslint src app` | PASS |
| `npx jest --json` | **97/97 suites, 1943/1943 tests** |
| Suites des consommateurs (`shared`, Catalogue, Composition, `ExerciseScreen`) | 350/350 PASS |
| `verifier-passe2.cjs` | PASS (2143) |
| Obligations `@43e7b344` | **442/442 PASS** |
| Contrôle étendu (`controle-portee-recette1d.json`) | PASS : 56 chemins, aucun hors périmètre |

## Hypothèses non démontrées

- Rendu natif non observé : typographie, deux lignes, hauteur adaptative, icône, couleurs, halo au texte agrandi.
- F-02 n’est toujours pas reproduit ; il est conservé dans la recette (R-11).

## Non réalisé ou hors périmètre

- Clavier de l’Étiquette (PRE-2) ; Catalogue et Profil au texte agrandi.
- Pauses variables dans la phrase (D-338) ; fond rouge de la cellule incomplète (D-337).
- VoiceOver : procédure courte séparée.

## Vérifications restant à faire sur appareil

`procedure-recette-finale-pre3.md`, R-01 à R-21.

## Publication

| Étape | Résultat |
|---|---|
| Publication Git | Sans force, `69be05f2..0f86cddb`. |
| Vérification GitHub (API, pas seulement le message du push) | `branches/feat/pre3-exercice-20261009` → `0f86cddb262364030d324a79ef96b8cde03a9351` ; `compare 6fd6d40d...branche` : ahead 2, behind 0 ; commit `6fd6d40d` présent (14 fichiers) |
| Compatibilité avec le build installé | Build iOS **7** (`e1deb07e-3f67-43d3-9d34-9b15147af94b`, commit `9f5cee0e`, runtime 1.1.0) : `OTA_COMPATIBLE`, aucun fichier natif parmi 59 modifiés. **Aucun nouveau build nécessaire.** |
| Configuration | `Routine Dev`, `com.ankusha.kodjo.dev`, runtime 1.1.0, URL de mise à jour du projet `0ee44f86-…` |
| Mise à jour publiée | **`01a12f22-927f-70a1-9060-17e3379ccc2d`**, groupe `2011ac0b-aa7d-4a24-a499-1bae0fe1162e`, canal `review`, `gitCommitHash` **`0f86cddb262364030d324a79ef96b8cde03a9351`**, https://u.expo.dev/update/01a12f22-927f-70a1-9060-17e3379ccc2d |
| Vérification effective | `update:list --branch review` : c’est la plus récente. **Requête du manifeste comme l’iPhone** (`expo-platform: ios`, `expo-runtime-version: 1.1.0`, `expo-channel-name: review`) : HTTP 200, id `01a12f22-927f-70a1-9060-17e3379ccc2d` ; nouvelle icône présente (md5 `a9192b1d…`). Preuves : `publication-ota-finale.json`, `compatibilite-ota-finale.json`, `verification-manifeste-ota-finale.json`. |
| Correspondance | Build 7 + OTA `01a12f22…` = code exact de `0f86cddb` (code identique à `6fd6d40d`, les commits suivants étant documentaires) |

Le commit qui ajoute ce rapport est documentaire seulement ; il ne change pas le code livré.

**Prochaine action** : recette finale par Hermann ; ensuite, une seconde revue indépendante (ChatGPT). Aucune opération en cours.
