# PRE-3 (#340) — corrections après la recette iPhone 3

## Identité de la mission

| Élément | Valeur |
|---|---|
| Identifiant | `PRE3-340_CORRECTION-RECETTE3` |
| Objectif | Traiter les 7 écarts de la recette 3 (T-49, T-53, N-01 à N-05). Corriger dans le périmètre autorisé, proposer une extension consolidée pour le reste, établir le candidat exécuté, publier et fournir un retest ciblé. |
| Source | `KODJO_PRE3_Recette3_Prompt_Corrections_Claude.md` |
| Branche | `feat/pre3-exercice-20261009`, départ `6c519aa75142ca4bdb3aa029bb90c5c6e335d92a` (local = distant) |
| Plan et autorisations | `write_scope@43e7b344`, X-1 à X-4, diagnostic (arbitrage A). EXT-R2-A, -B et -C **non accordées**. |
| Écrivain | Claude Code local, seul, worktree isolé, sans conversion des fins de ligne |
| Limites | Pas de PRE-4, de fusion, de clôture ni de `VISUAL_APPROVED`. Aucune ligne Conforme rouverte. |

## Périmètre

- **Demandé** : T-49 (Catalogue, Composition), T-53, N-01, N-02, N-03, N-04, N-05 ; candidat exécuté ; registre, documentation, publication, retest.
- **Traité dans le périmètre** : T-53, N-01, N-02, N-05.
- **Proposé, non réalisé** :
  - T-49 Catalogue (EXT-R3-1) ;
  - T-49 Composition (EXT-R3-2) ;
  - N-03 (EXT-R3-3 et ARB-R3-1) ;
  - N-04 (EXT-R3-4).

Détail : `docs/preparation/PRE-3/planification/execution/preuves/registre-recette3.md`.

## Analyse historique (avant correction)

| Écart | Introduction | Détection | Attribution |
|---|---|---|---|
| T-53 | `bdc133c3` : interrupteur RN dans une ligne `alignItems: center`, alors que `Switch.js` (iOS) impose `alignSelf: 'flex-start'` | Recettes 1 à 3 ; non reproduit en recette 2 (je n’avais vérifié que la mesure native) | **Démontrée** par la source de React Native 0.86 et par le style réellement transmis au composant natif ; test rouge sur l’original |
| N-01 / N-02 | `4f1feebe` / `2f7ab292` : formulaire fermé après création (`setIsCreating(false)`), antérieur au maintien du clavier demandé | Recette 3 (nouvelle demande, D-350) | **Démontrée** : démontage du champ qui a le focus, donc fermeture du clavier ; test rouge sur l’original |
| N-05 (↑) | — | Recette 3 (ajout, D-351) | Ajout, pas un défaut |
| `ExerciseScreen.test.tsx` (7 obligations) | `4f1feebe` : fermeture progressive de la Catégorie (D-8), attente de 3 s dans le test (`2f7ab292`) | Rapport `OTA-NON-APPLIQUEE` (attribué à tort à la charge machine) | **Démontrée** par instrumentation : animation terminée (`finished: true`) en ≈ 7 s réelles, au-delà de l’attente ; défaut du test, pas de l’application |

## Candidat exécuté

Aucune capture du diagnostic n’a été reçue : **l’identifiant exécuté pendant la recette 3 n’est pas prouvé**.

Les indices réunis :
- T-15 Conforme et « Annuler » retiré : seuls `a12bb92f` et ses descendants contiennent ces corrections ;
- `01a12fae` : 0 installation ;
- une utilisation d’une mise à jour embarquée enregistrée par EAS.

Ils rendent le **build 8 embarqué** le plus plausible. La méthode de preuve avant le retest est l’étape 0 de `procedure-retest-recette3.md` : lien `routine://diagnostic-updates`, puis lecture de l’identifiant, du type de lancement et de l’état de téléchargement, avec un arbre de décision à arrêt borné.

**Correction d’une affirmation antérieure.** Le rapport `OTA-NON-APPLIQUEE` supposait que mes téléchargements de contrôle fausseraient les compteurs EAS. Ils ne les ont pas modifiés : `01a12fae` est restée à 0 installation après eux. EAS compte donc les installations rapportées par les appareils.

## Modifications

**Code** (`1645b52f3deaa185606aa2375e4ad3192c3675f7`, entièrement dans la `write_scope@43e7b344`) :
- `ExecutionParametersSheet.tsx` (T-53) ;
- `CategoryPickerModal.tsx` (N-01) ;
- `BodyZonePickerModal.tsx` (N-02) ;
- `ActivityEditorForm.tsx` (N-05) ;
- `src/shared/i18n/index.ts` (libellé « Valider la description ») ;
- tests ciblés T-53, N-01, N-02 et N-05.

**Test seul** (commit documentaire de livraison) : `ExerciseScreen.test.tsx`, attente de fermeture portée de 3 à 20 s, avec la mesure en commentaire. Aucun code applicatif.

**PRESERVE / CHANGE / FORBIDDEN** :

| Catégorie | Contenu |
|---|---|
| PRESERVE (vérifié) | Recadrage D-349 de la Description (`TextInput` non déplacé ; tests N-05 de la recette 2 verts). Tableau variable et glisser T-15. Validation des noms et doublons. ✓/✕ de la Catégorie (D-343) et des Zones. Couleur de création. Interrupteur : valeur, désactivation, couleurs. |
| CHANGE | Alignement de l’interrupteur. Maintien du formulaire après ↑. Garde contre la double création. Bouton ↑ de la Description. |
| FORBIDDEN (non touché) | `ScreenShell`, `CatalogueScreen`, `CompositionScreen`, `LabelPickerModal`, `ReferenceValueDialog`, protocole |

**Documentation** :
- registre 07 : D-350, D-351 ;
- contrats 13 (CE-UI-09) : D-350 ;
- chapitre 06 (exception de l’éditeur) : D-351.

**Preuves**, dans `docs/preparation/PRE-3/planification/execution/preuves/` :
- `registre-recette3.md`, `procedure-retest-recette3.md` ;
- `couverture-obligations-recette3.json`, `controle-portee-recette3.json` ;
- `compatibilite-ota-recette3.json`, `publication-ota-recette3.json`, `verification-manifeste-ota-recette3.json` ;
- `resultats-tests-recette3.json`.

## Preuves et tests

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit -p .` | PASS |
| `npx eslint src app` | PASS |
| Tests ciblés (Paramètres 45, Catégorie et Zones 47, éditeur 20, diagnostic 2) | PASS |
| Contrôles de mutation | T-53, N-01, N-02, N-05 : **rouges sur l’original**, verts après correction |
| `jest` complet, avant l’ajustement de l’attente | 97/98 suites, 1947/1955 tests (8 échecs, tous à `ExerciseScreen.test.tsx:293`) |
| `jest` complet, final | **98/98 suites, 1955/1955 tests** |
| `ExerciseScreen.test.tsx` seul, après l’ajustement | 26/26 PASS |
| `verifier-passe2.cjs` | PASS (2143) |
| Obligations `@43e7b344` | **442/442 PASS** |
| Contrôle de portée | PASS (10 chemins, tous dans la `write_scope`) |

## Publication

| Étape | Résultat |
|---|---|
| Git | Sans force : `6c519aa7..1645b52f` (code), puis le commit documentaire. Tête vérifiée par l’API GitHub. |
| Compatibilité | `classify-environment-update.js` : `OTA_COMPATIBLE` par rapport au build 8 (`58bbc3bc`) et au build 7 (`9f5cee0e`) ; aucun fichier natif ; **aucun nouveau build** |
| OTA | **`01a130ce-0c5c-75c5-b821-2bc0d85e1113`**, groupe `1ff58f9d-ee9f-4192-9983-31933df66db4`, canal `review`, runtime 1.1.0, `gitCommitHash` `1645b52f…`, créée à 15:49:32 UTC. Paramètres du parcours existant (`kodjo-routine-dev-environment-sync.yml` : `--channel review --environment development`). https://u.expo.dev/update/01a130ce-0c5c-75c5-b821-2bc0d85e1113 |
| Vérification effective | Manifeste du canal : HTTP 200, id `01a130ce…`. 57/57 assets téléchargés comme le client, SHA-256 conformes. Bundle contenant le ↑ de la Description, la route de diagnostic et le repère T-15. |
| Version exécutée | **Non prouvée** : étape 0 du retest |

## Hypothèses non démontrées

- Origine du liseré **bas** du Catalogue : aucun élément de code identifié ; hypothèse de l’arête de la bande (EXT-R3-1).
- N-05 : visibilité de ↑ limitée à la saisie et place réservée au texte, choix d’implémentation à confirmer au retest.
- Version exécutée pendant la recette 3 : build 8 embarqué plausible, non prouvé.

## Non traité, en attente

| Point | Raison |
|---|---|
| T-49 Catalogue et Composition | EXT-R3-1, EXT-R3-2 : extension de fichiers à accorder |
| N-03 | EXT-R3-3 (fichiers) et ARB-R3-1 (comportement A ou B) |
| N-04 | EXT-R3-4 : composant partagé par trois référentiels |
| T-04, T-17, T-42, T-62 à T-65 | Statuts conservés, sans nouvelle preuve |

## Vérifications restant à faire sur l’appareil

`procedure-retest-recette3.md` : étape 0, puis R3-01 à R3-04.

## Résultat final

- Tests : 98/98 suites, 1955/1955 tests ; 442/442 obligations ; vérificateur PASS ; portée PASS.
- Code corrigé et publié : T-53, N-01, N-02, N-05.
- Candidat chargé, retest de Hermann et revue indépendante : **non réalisés**.
- **Prochaine action** : Hermann exécute l’étape 0 puis R3-01 à R3-04 (`procedure-retest-recette3.md`), et décide sur EXT-R3-1 à -4 et ARB-R3-1. La seconde revue indépendante (ChatGPT) vient ensuite.
- **Aucune opération en cours.**
