# 2026-11-26 — RECETTE-26-11-MOSAIQUE : carte de séance du catalogue (mosaïque, repli, chronomètre)

## Identification

- **Mission** : paquet MOSAIQUE des corrections de la recette iPhone du 26/11/2026 (après-midi) — brief commun `brief-commun-r26.md`.
- **Objectif** : traiter les écarts notés par Hermann sur la carte de séance du catalogue (D-600 à D-602), lignes du cahier `cs-mosaique-plus`, `cs-repli`, `cs-ligne2`.
- **Branche** : `fix/recette-26-11-mosaique` (worktree `C:\Dev\KODJO-R26-MOSAIQUE`).
- **Commit de départ** : `30214251f` (`feat/exercice-libre-page-20261126`, imposé par le brief), puis avance rapide (`git merge --ff-only`) sur `acf3703e8` = `recette/agenda-axe-20261124`, HEAD du serveur de recette `C:\Dev\KODJO-SERVE` au moment de la mission (voir « Écart de mise en place »).

### Écart de mise en place (À CLARIFIER pour l'intégration)

La base du brief (`feat/exercice-libre-page-20261126`) **ne contient pas** la mosaïque : le code D-600 à D-602 vit sur `feat/carte-seance-mosaique-20261125`, fusionnée seulement dans `recette/agenda-axe-20261124`. Une fusion de cette branche dans la base donnait des conflits (migrations 036 à 040, constantes de base). Lecture la plus prudente retenue : avance rapide de ma branche sur `acf3703e8` (= le code exact installé sur l'iPhone, qui contient déjà la base du brief), sans rebase ni reset. Conséquence : ma branche se fusionne sans bruit dans `recette/agenda-axe-20261124` ; la fusionner ailleurs entraînerait tout le contenu de la recette.

## Périmètre

- **Demandé** : (1a) mouvements d'un circuit/format comptés dans la mosaïque ; (1b) 5 images : 3 images + « +2 » ; (2) séance sans photo : vignette Libre et non un cadre gris ; image ignorée (enquête) ; (3) traits du chronomètre aussi fins que ceux de l'haltère.
- **Hors périmètre** (autre agent) : régression « hauteur du circuit / cycle ».
- **Traité** : les quatre points ; (1a) et (1b) sans modification de code (voir constats).

## PRESERVE / CHANGE / FORBIDDEN

| | Éléments |
|---|---|
| PRESERVE | dispositions `mosaicLayout` (1 à 5+), projection `sessionCatalogueProjection` (collecte, dédoublonnage par mouvement), recadrage `cropFrame`, lignes 1 et 3, Démarrer, variante Sélection ; `MediaPreview` pour tous ses autres appelants ; icône chronomètre de la carte de routine de l'Agenda (`icon-agenda-chronometre.svg`) |
| CHANGE | `SessionCard` : images illisibles ignorées, repli Libre ; icône chronomètre de la ligne 2 ; `MediaPreview` : prop facultative `onUnavailable` (additive) ; nouvelle icône `icon-carte-seance-chronometre.svg` + entrée du manifeste |
| FORBIDDEN | redessin d'icône, changement de primitive (`expo-image` conservé), modification de la disposition, de la projection, de l'Agenda ; toute modification dans `C:\Dev\KODJO-SERVE` |

Démonstration PRESERVE : `git diff acf3703e8 -- src/features/sessions/sessionMosaic.ts src/features/sessions/sessionCatalogueProjection.ts src/features/activities/mediaCrop.ts src/features/planning assets/icons/icon-agenda-chronometre.svg` est vide ; `MediaPreview` : sans `onUnavailable`, le rendu est inchangé (l'effet n'appelle rien).

## Constats et causes

### 1a. « 5 exercices dont deux dans un circuit Tabata, il en compte 4 »

- **Constat** : la collecte (`projectSessionForCatalogue` → `structureExercises`, Circuits et Cycles compris) compte les mouvements des circuits. Reproduction sur **SQLite réelle** (`sessionMosaic.r26.test.ts` : 3 exercices libres + circuit Tabata `SERIES` de 2, cinq mouvements photographiés, `createStructured` puis `listCatalogue`) : **5 images**, dans l'ordre. Même résultat au rendu (`SessionCard.test.tsx` : trois images et « +2 »). Le Tabata « À la suite » (`inSequence`) et « En alternance » (`standardCircuit`) produisent des Circuits ordinaires, lus par le même chemin (`toActivity`, médias du Mouvement).
- **Cause sur l'iPhone : non démontrée.** Le code ne réduit le compte que dans deux cas, conformes à D-600 : un mouvement **répété** (même Mouvement dans les exercices libres et dans le Tabata) ou un mouvement **sans photo** (par exemple un mouvement créé en tapant un nom inexistant dans le choix du format). Hypothèse plausible, non vérifiable sans la base du téléphone.
- **Modification** : aucune dans le code ; tests de non-régression ajoutés.

### 1b. « 5 exercices libres, il en compte 5 et j'ai la mosaïque 3+2 »

- `mosaicLayout(5)` = trois images + case grise « +2 » (D-600, D-602, cahier `cs-mosaique-plus`). Lecture retenue : Hermann décrit le cas qui fonctionne (5 comptés, 3 images + « +2 ») par contraste avec le cas Tabata. Aucune disposition « 3 + 2 images » n'existe dans le code. **Aucune modification.** À CLARIFIER si Hermann voyait réellement cinq images.

### 2. « L'image est un cadre gris sans symbole. L'image est ignorée dans la mosaïque. » (ligne « Séance sans photo »)

- La vignette Libre (`assets/formats/format-libre.png`, cadre pointillé + « Libre ») n'est affichée que si la projection n'a **aucune** entrée de mosaïque. Un **cadre gris sans symbole** est exactement la place réservée de `MediaPreview` (`fallbackStyle` = fond `colors.surface`) : rendue quand une image existe en base (le mouvement a un média) mais **ne peut pas être affichée** — fichier absent du dossier `kodjo-media/` ou illisible (`Image.loadAsync` puis `onError` d'`expo-image`), vidéo sans affiche. Ces mouvements apparaissent aussi en cadre gris dans le catalogue des mouvements, d'où « sans photo » pour l'utilisateur. Les photos sont toutes locales (`CatalogueMediaWriter`, `LocalMediaStore` : URI relative `kodjo-media/…` résolue par `resolveMediaUri`) ; aucune photo distante.
- **Correction** : une image définitivement indisponible est traitée comme une absence de photo — ignorée de la mosaïque (la disposition se recalcule sur les images affichables) ; s'il n'en reste aucune, vignette du format Libre. `MediaPreview` signale l'indisponibilité par `onUnavailable` (effet, après le rendu) ; `CardVisual` mémorise les images indisponibles.
- **« L'image est ignorée dans la mosaïque »** : À CLARIFIER. Lecture retenue : constat conforme à la règle (mouvement sans photo ignoré). Si Hermann voulait dire qu'une photo **visible ailleurs** (fiche, Composition) manque dans la mosaïque, la cause n'est pas reproduite : même source de données (`exercise.media`, `firstMediaPreviewSource`) et même composant ; il faudra le nom du mouvement.

### 3. « Il faut que les traits du chronomètre soient aussi fins que les traits de l'haltère. »

- Chronomètre (`icon-agenda-chronometre.svg`) : trait 1,5 dans un viewBox 10,83 × 12,58 affiché à 14 → ≈ 1,67 pt. Haltère (`icon-carte-seance-haltere.svg`, forme pleine 12 × 16 à l'échelle 1) : traits ≈ 0,57 pt (horizontaux) à 0,77 pt (verticaux).
- Aucune variante fine n'existait. Le SVG d'origine est partagé avec la carte de routine de l'Agenda (`RoutineAgendaCard`), hors périmètre : nouvelle icône `icon-carte-seance-chronometre.svg`, **même tracé**, seul `stroke-width` passe de 1,5 à 0,6 (≈ 0,67 pt affiché), déclarée au manifeste (`catalogue.sessionCard.duration`). Utilisée par `SessionCard` (catalogue, Sélection et cartes de séance de l'Agenda qui emploient `SessionCard`).

## Modifications

- `src/features/sessions/SessionCard.tsx` : import de l'icône fine ; `CardVisual` filtre les images indisponibles, repli Libre.
- `src/features/activities/MediaPreview.tsx` : prop facultative `onUnavailable`.
- `assets/icons/icon-carte-seance-chronometre.svg` (nouveau), `assets/icons/manifest.json` (entrée).
- Tests : `src/features/sessions/__tests__/SessionCard.test.tsx` (+2 tests), `src/infrastructure/database/__tests__/sessionMosaic.r26.test.ts` (nouveau).
- Documentation : registre (D-600, D-601 : compléments datés), `docs/DSF-CARTE-SEANCE-VISUEL-INFOS-2026-11-24.md` §§ 1 et 2.

## Tests et résultats

- `npx jest -w 1 --workerIdleMemoryLimit=800MB src/features/sessions/__tests__/SessionCard.test.tsx src/infrastructure/database/__tests__/sessionMosaic.r26.test.ts src/shared/ui/__tests__/visualAssets.test.ts` : **3 suites, 45 tests, PASS**.
- Jest ciblé complémentaire (`photoThumbnails.test.tsx`, `SessionCatalogueList.e5.test.tsx`, `PlanningSelection.test.tsx`, `CatalogueScreen.test.tsx`) : **4 suites, 42 tests, PASS**.
- `npx tsc --noEmit` : aucune erreur. `npx eslint` sur les fichiers TS modifiés : aucune erreur.
- Passe Jest complète non lancée (consigne du brief : le coordinateur s'en charge).
- Une suite Jest verte ne prouve pas le rendu sur iPhone (épaisseur réelle du trait, chargement réel des photos).

## Classe documentaire

- Point 2 : **A** (règles « sans photo ignoré », « aucune image → Libre » déjà écrites) avec interprétation consignée (image illisible = sans photo) — registre D-600 et DSF § 1 annotés, à confirmer.
- Point 3 : **B** (demande explicite de Hermann) — registre D-601 et DSF § 2 annotés.
- Points 1a / 1b : **A** (règle inchangée, non-régression testée) — registre D-600 annoté (1a).
- Aucune nouvelle décision numérotée.

## À CLARIFIER

1. Intégration : ma branche part de `recette/agenda-axe-20261124` (`acf3703e8`) et non de `feat/exercice-libre-page-20261126` seule (mosaïque absente de cette base).
2. 1a : composition exacte de la séance Tabata (un mouvement répété ? un mouvement sans photo ?).
3. 1b : « 3+2 » = trois images et « +2 » (conforme) ou cinq images ?
4. 2 : « L'image est ignorée dans la mosaïque » = constat de la règle, ou photo visible ailleurs absente de la mosaïque (nom du mouvement) ?

## Vérifications restant à faire sur iPhone

- Séance dont les seuls mouvements n'ont pas de photo affichable (cadre gris dans le catalogue des mouvements) : vignette Libre (cadre pointillé, « Libre »).
- Séance mêlant photos et mouvements en cadre gris : seules les photos affichées, disposition selon leur nombre.
- Séance 3 libres + Tabata de 2, cinq mouvements différents tous photographiés : trois images et « +2 ».
- Ligne 2 : traits du chronomètre comparables à ceux de l'haltère.

## Fichiers modifiés

Voir « Modifications » ; plus ce rapport.

## Commit final et état Git

- Commit de code et de documentation : `5f540adc1` ; le commit documentaire qui suit ne complète que ce rapport (résultats des tests, état Git).
- Branche `fix/recette-26-11-mosaique` poussée sur `origin`, suivie ; arbre de travail propre après le commit du rapport (la jonction `node_modules` est ignorée par Git).

## Complément du 26/11/2026 — réponses de Hermann et reprise du point 1a

### Réponses reçues (par le coordinateur)

1. La séance Tabata contenait un mouvement sans photo (et peut-être un mouvement répété) : le « 4 » sur 5 exercices peut être conforme à D-600.
2. « 3+2 » = 3 images + case « +2 » : conforme, rien à faire (point 1b clos).
3. « L'image est ignorée dans la mosaïque » : séance de plusieurs exercices, dont certains dans un circuit ; les photos des mouvements du circuit étaient ignorées (de mémoire de test).

### Vérification demandée : origines réelles des circuits, enregistrement puis relecture du Catalogue

Le premier test SQLite saisissait directement une structure (`createStructured`) et ne passait pas par les parcours de l'application. Il a été remplacé par des parcours réels, sur SQLite réelle, chacun jusqu'à la relecture du Catalogue des séances : brouillon → `toStructuredSessionInput` → `createStructured` ou `updateStructured` → `listCatalogue` → `projectSessionForCatalogue`. Cinq mouvements différents, tous photographiés (`movement_media` + `media_assets`). Le test se trouve dans `src/infrastructure/database/__tests__/sessionMosaic.r26.test.ts`.

| Cas | Construction | Images relues |
|---|---|---|
| Structure saisie directement (test initial) | `createStructured` | 5 / 5 |
| (a) Format Tabata « À la suite » | fenêtre « Créer un exercice » → format : `buildModelElements` + `appendModelToDraft` | 5 / 5 |
| (a) Format Tabata « En alternance » | idem | 5 / 5 |
| (a) Format EMOM « Dans chaque intervalle » (circuit porteur, `format` au circuit et aux membres) | idem | 5 / 5 |
| (b) Circuit composé à la main | Créer → circuit (`wrapInContainer` sur un exercice), puis entrée d'un second exercice (`moveExerciseToCircuit`) | 5 / 5 |
| Modification d'une séance enregistrée | séance de 3 libres relue (`toSessionDraft`), Tabata ajouté, `updateStructured` | 5 / 5 |
| Cycle autour d'un circuit | Tabata « En alternance » enveloppé dans un cycle (`wrapInContainer`, conteneur CYCLE) | 5 / 5 |

Résultat : **7 tests, PASS.** Dans aucun cas les mouvements d'un circuit ou d'un cycle ne manquent après enregistrement et relecture. La collecte à la source est correcte, donc **aucune correction du code applicatif**. Seul ce test a été modifié. Le Catalogue se recharge à chaque retour au premier plan (`CatalogueScreen`, `useFocusEffect` → `reloadSessions`) : la fermeture de la feuille de Composition relit donc la base. Ce mécanisme a été lu dans le code ; il n'a pas été testé sur iPhone.

### Conclusion sur 1a / « photos du circuit ignorées »

- **Démontré** : quelle que soit l'origine du circuit (format, porteur, main, cycle, création ou modification), ses mouvements photographiés figurent dans la mosaïque après relecture.
- **Plausible** (réponse 1 de Hermann) : le mouvement manquant est le mouvement sans photo du Tabata. Un mouvement répété compte une fois (D-600, comportement conforme).
- **Plausible, à vérifier sur iPhone** : une photo qui n'apparaît pas (fichier absent ou illisible) s'affichait en cadre gris avant `5f540adc1`. Elle est désormais ignorée, comme une absence de photo. Si une photo **visible ailleurs** (fiche du mouvement, Composition) manque encore dans la mosaïque d'une séance à circuit, il faut le nom du mouvement et de la séance : la cause ne serait alors ni dans la collecte ni dans l'enregistrement.
- **Indéterminé** : la séance exacte du test de Hermann (« de mémoire »).

### Vérification iPhone ajoutée

- Séance de 3 exercices libres + Tabata de 2 (5 mouvements différents, **tous avec photo visible dans le catalogue des mouvements**), enregistrée puis catalogue rouvert : 3 images + « +2 ». Même contrôle avec un circuit composé à la main et avec un cycle autour du circuit.

### Tests du complément

- `npx jest -w 1 --workerIdleMemoryLimit=800MB src/infrastructure/database/__tests__/sessionMosaic.r26.test.ts` : 7/7 PASS.
- `npx tsc --noEmit` : aucune erreur ; `npx eslint` sur le test : aucune erreur.
