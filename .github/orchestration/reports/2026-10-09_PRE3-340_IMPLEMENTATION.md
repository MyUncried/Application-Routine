# PRE-3 — implémentation complète publiée pour revue (#340)

## Identité de la mission

| Champ | Valeur |
|---|---|
| Identifiant | PRE3-340_IMPLEMENTATION |
| Objectif | Développer PRE-3 complet (P3-01..23) depuis le plan approuvé, avec les contrôles et preuves de `docs/preparation/PRE-3/planification/execution/mission-developpement.md`, publier pour revue sans fusion |
| Route | Directe produit (`DIRECT_PRODUCT_IMPLEMENTATION_WITH_VERIFIED_DELIVERY_CONTROLS`) — **aucune** admission VNext canonique revendiquée |
| Écrivain | Claude Code local, worktree isolé, `core.autocrlf=false` |
| Branche | `feat/pre3-exercice-20261009` |
| Référence de départ fournie | `ae50aaedc1aaf506dccbb81c4e406e127af9824b` |
| Tête distante trouvée au démarrage | `c1ea664e7092b82441525d2d69f98e229287fb62` (preuves de démarrage, aucun code) |
| Plan exact | `43e7b344937a2d60b04b987f19636faebb5aee06` (R-1, R-2 validés) |
| Protocole | `main` `46b91bd2` — non modifié |
| Diagnostic historique VNext | Non applicable (aucun échec/régression VNext traité) |

## Périmètre

**Demandé** : P3-01..23 sans réduction ; commits par couche ; R-1/R-2 ; migrations 001..008 intactes ; SQLite réelle, fichiers temporaires réels, 59 assertions, 13 cas numériques, 276 phrases, 8 scénarios de migration ; comparaison visuelle des 41 états ; procédure appareil ; preuves et rapport ; publication sans force, arrêt avant fusion.

**Traité** : tout le périmètre applicatif, dans le `write_scope` du plan (contrôle de portée PASS), à l'exception de **deux suites d'intégration hors `write_scope`** dont les attendus contredisent le périmètre approuvé (voir « Élargissement requis »). Comparaison visuelle : **statique uniquement** (pas de rendu).

## Livraison (commits)

| Couche | Commit | Contenu |
|---|---|---|
| 1 données/domaine | `0a25bffd` | `ExecutionParameters`, brouillon de feuille, calculs (registre), phrase, instantané, transport copies/duplication, service d'import et prêts |
| 2 repositories/migrations/médias | `b98008bb` | migration 009, repositories canoniques, `LocalMediaStore`, `PhotoLibraryPicker`, `VideoPoster`, `expo-video ~57.0.5` |
| 3 adaptateurs/consommateurs | `13e4b024` | service Catalogue (médias), provider, sélection Catalogue (R = 0), résumés exact/≈/≥, i18n |
| 4 UI/accessibilité | `bdc133c3` | éditeur commun, feuille Paramètres, liste de médias, `ExerciseScreen` 4 parcours, steppers PRE-3, sélecteurs Catégorie/Zones |
| documentaire | commit contenant ce rapport | preuves + rapport |

Les commits 1 à 3 sont intermédiaires : la compilation TypeScript complète n'est rétablie qu'avec la couche 4 (le message du commit 1 indiquait à tort la couche 3).

## Constats et décisions techniques

1. **Autorité unique** : le JSON canonique versionné fait foi ; les colonnes scalaires sont des projections écrites avec lui. Les listes de Séances utilisent l'autorité Domaine après une lecture groupée (aucun calcul SQL concurrent).
2. **Anciens objets** : adaptés sans lecture du Profil (uniforme, BY_SIDE, bip 0, CR/Fin 0 — proposition neutre du plan).
3. **Écart de calcul consigné** : la parité bilatérale « un côté après l'autre » passe de 260 à 275 s (l'ancienne formule omettait la Pause finale du premier côté) ; attendu PRE-3 conforme au périmètre §6.
4. **Assertion P3-13/unknown-known** : son texte cite « unilateral 225 » alors que la spécification et le calcul donnent 195 ; BY_SIDE 345 et BY_SERIES 240 concordent. Le test suit le calcul ; incohérence documentaire à trancher par la revue.
5. **expo-video** est chargé à la demande (sinon l'éditeur n'est plus importable sous Jest) ; aucune lecture, aucun son, lecteur libéré.
6. **Médias** : URI interne relative `kodjo-media/<id><ext>` ; aucun fichier référencé n'est supprimé ; nettoyage limité aux préparations du brouillon abandonné, non référencées et non prêtées ; un échec de lecture de référence conserve le fichier.
7. **Catégorie (sélecteur)** : la règle PRE-2 « appui court = sélectionner et fermer » est conservée ; le ✓ d'en-tête Figma ferme en conservant la sélection.
8. **Libellés PRE-3** regroupés dans `src/shared/i18n/index.ts` (`resources/fr.ts` hors périmètre) ; `tokens.ts` inchangé (réutilisation stricte).

## Preuves et tests

Fichiers : `docs/preparation/PRE-3/planification/execution/preuves/` — `resultats-tests.json`, `couverture-obligations.json`, `comparaison-visuelle.md`, `procedure-appareil.md` (+ `demarrage-verifie.json` antérieur).

| Contrôle | Résultat |
|---|---|
| `npx tsc --noEmit -p .` | PASS |
| `npx eslint src app` | PASS (0 erreur, 0 avertissement) |
| `npx eslint .` | Échec **préexistant** hors application (scripts `tests/kodjo/*.pilot.js`, `no-undef`), non touché |
| `npx jest` | **1886 / 1893** tests, **95 / 97** suites (référence : 86 suites / 1527 tests) |
| Obligations du plan (442 : 59 assertions × propriétaires, 13 cas numériques, 276 phrases, 8 scénarios de migration, UI) | **442 / 442 PASS** |
| `verifier-passe2.cjs` | PASS (2143 contrôles), avant chaque commit |
| `controle-portee.cjs --start ae50aaed` | PASS avant chaque commit |

Échecs restants (7 tests, 2 suites hors `write_scope`) : `CompositionExerciseFlow.integration.test.tsx` (5) et `CategoriesSaveFlow.integration.test.tsx` (2). Ils pilotent l'ancien éditeur (sections, segmenté de mode en ligne, « Terminer actif dès que le Nom est valide »).

## Élargissement requis — `SCOPE_EXPANSION_REQUIRED`

- **Blocage démontré** : les deux suites ci-dessus attendent l'ancien éditeur et un Terminer actif sans Catégorie/Zone/mode, contrairement au périmètre §5 et au plan (carte + feuille).
- **Adaptation proposée** (non appliquée) : dans ces deux fichiers, remplacer la saisie par sections et le segmenté en ligne par le parcours PRE-3 (Catégorie via `activity-editor-category-button`, Zones via `exercise-body-zones-open` + `body-zone-picker-confirm`, Paramètres via `exercise-parameters-card` → feuille → ✓), sans changer les attendus de persistance, d'ordre d'insertion, de double appui et de Continuer.
- **Second point hors périmètre** : `app.json` → `photosPermission` dit « uniquement pour … la photo de votre profil » ; texte inexact dès l'import de médias d'Exercice, à corriger avant la build de recette.

## Couverture P3-01..23 (tests propriétaires PASS)

P3-01 4 parcours + isolement (ExerciseScreen, SessionDraft, SQLite) · P3-02 éditeur, clavier · P3-03 référentiels, nom vide, retirés · P3-04 bornes · P3-05/06/07/08 brouillon, N, déplacement, N=1 · P3-09 directions · P3-10 défauts Profil · P3-11 bip · P3-12 13 cas, omission · P3-13 R terminale, Séance · P3-14 inversion · P3-15 276 phrases, gras, phrase longue · P3-16 frontière, garde, échec/double appui · P3-17 migration réelle, aller-retour, JSON corrompu, transactions · P3-18 copies, instantané · P3-19 maintien, non-accéléré, exclusivité · P3-20 surfaces (rendu structurel + comparaison statique) · P3-21 accessibilité simulable · P3-22 régressions · P3-23 import, erreurs, permissions, fichiers, affiche vidéo.

## Change Control (PRESERVE / CHANGE / FORBIDDEN)

- **PRESERVE** (prouvé par les suites conservées, relancées vertes) : roulette native `DurationWheelPicker.tsx` (non modifiée, R-1), politique du stepper Profil (`ProfileStepper.test.tsx` vert, R-2), règles PRE-2 des sélecteurs (suites existantes vertes), Profil, Composition/Catalogue hors adaptations minimales, migrations 001..008.
- **CHANGE** : fichiers du `write_scope` listés ci-dessous.
- **FORBIDDEN respecté** : aucun moteur d'exécution, son, lecture de média, refonte PRE-4/PRE-5, changement de protocole.

## Hypothèses non démontrées

- Rendu réel aux largeurs 360/402/440, texte agrandi, clavier, Safe Areas (comparaison statique uniquement, 20 écarts nommés E1–E20).
- Comportement réel du sélecteur iOS (accès limité, vidéos iCloud, formats), affiches vidéo natives, VoiceOver natif de `Picker(.wheel)`.
- Absence de glisser-déposer des séries (alternative Monter/Descendre seule) — écart E17 à valider.

## Éléments non corrigés / hors périmètre

Deux suites d'intégration et `app.json` (ci-dessus) ; libellés `resources/fr.ts` (titres de feuilles, dialogue d'abandon, E11–E13) ; `SessionService.ts`, `SessionDraftContext.tsx`, `SessionDraftProvider.tsx`, `ActivityCard.tsx`, `tokens.ts`, `ActivityDefinitionRepository.ts` : autorisés mais aucune modification nécessaire.

## Vérifications restant à faire sur appareil réel

`procedure-appareil.md` : feuille et gestes (A1–A12), médias et permissions (B1–B9), VoiceOver (C1–C6), non-régressions perceptibles (D). Aucun contrôle de base de données ni de calcul n'y est délégué.

## Fichiers modifiés (ae50aaed → bdc133c3, 71 fichiers)

`package.json`, `package-lock.json` ; domaine : `src/domain/activities/{ActivityDefinition,ExecutionParameters,ExecutionParametersDraft,executionCalculations,executionPhrase,exerciseSnapshot}.ts`, `src/domain/media/{ActivityMedia,ActivityMediaImportService,MediaAsset,MediaDraftLeases,MediaRepository}.ts`, `src/domain/sessions/{Session,SessionDraft,calculations,composition,validation}.ts` ; infrastructure : `src/infrastructure/database/{constants,migrateDatabase}.ts`, `migrations/migration009.ts`, `repositories/Sqlite{ActivityDefinition,Media,Session}Repository.ts`, `types/DatabaseRows.ts`, `src/infrastructure/media/{LocalMediaStore,PhotoLibraryPicker,VideoPoster}.ts` ; features : `activities/{ActivityDefinitionService,ActivityEditorForm,ActivityMediaList,ActivitySelectionScreen,ExecutionParametersSheet}`, `reference-data/{BodyZonePickerModal,CategoryPickerModal}`, `sessions/{ExerciseScreen,SessionCard,SessionServiceProvider,compositionPresentation,formatSessionSummary}` ; shared : `i18n/index.ts`, `ui/ProfileStepper.tsx` ; tests correspondants (`__tests__`, dont nouveaux `ExecutionParametersSheet`, `ActivityMediaList`, `ProfileStepper.test.ts`, `LocalMediaStore`, `VideoPoster`, `ActivityMediaImportService`) ; `docs/preparation/PRE-3/planification/execution/preuves/demarrage-verifie.json` (commit c1ea664e, antérieur).

Réécritures complètes délibérées : `ActivityEditorForm.tsx` (nouvel éditeur), `calculations.ts` (autorité unique), `ExerciseScreen.test.tsx` (blocs de l'ancien éditeur remplacés par les obligations PRE-3 ; contrats conservés : en-tête, retour, zone bleue, modification, insertion, garde d'abandon, chargement Catalogue).

## Commit final et état Git

- Tête de code livrée : `bdc133c3` ; commit final = commit documentaire contenant ce rapport (hash communiqué dans la réponse de livraison).
- Distant avant publication : `origin/feat/pre3-exercice-20261009` = `c1ea664e` (vérifié par fetch, aucune avance concurrente).
- Publication sans force ; aucune fusion ; #340 non clôturée ; aucune auto-approbation. Revue indépendante ChatGPT attendue.
