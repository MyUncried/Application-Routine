---
title: 'Story 5.1b — Photo ou affiche vidéo dans le gabarit, œil des Volumes dans la zone de contexte'
type: 'feature'
created: '2026-10-22'
status: 'done'
baseline_commit: '9bd8ea4c'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La carte v2 (story 5.1) affiche toujours l'icône générique dans son gabarit média (ancien choix D3), et l'œil des Volumes du circuit est dans l'en-tête du Circuit (ancien choix D4). Hermann a remplacé D3 le 21/10/2026 (photo ou affiche vidéo de l'exercice) et D4 le 22/10/2026 (œil dans la zone de contexte).

**Approach:** Réutiliser le mécanisme de la vignette du Catalogue (`CardThumbnail`, `VideoPoster`) pour remplir le gabarit avec le premier média de l'occurrence ; déplacer l'œil de `CircuitHeader` vers les commandes contextuelles de `CompositionContextHeader`, sans changer sa disponibilité, ses modales, son focus ni son nom accessible.

## Acceptance Criteria (epics.md, story 5.1b)

- **AC1** : quand l'occurrence a un média, son premier média (photo, ou image d'affiche d'une vidéo) remplit le gabarit 64 × 64 de la carte v2 (rayon 12, recadrage centré, texte alternatif = nom de l'exercice, place réservée au chargement et en erreur), par le mécanisme existant de la vignette du Catalogue ; sans média, icône générique (D3).
- **AC2** : aucune lecture vidéo, aucun son, rien de persisté ; le média ne devient pas une cible tactile distincte (toucher et appui long de la carte inchangés).
- **AC3** : l'œil qui ouvre les modales « Volumes du circuit » (story 3.4) quitte l'en-tête du Circuit pour la zone de contexte (commandes contextuelles ; D4 remplacé par Hermann le 22/10/2026) ; disponibilité, modales, focus et accessibilité inchangés.

## Boundaries & Constraints

**Always:** D3 et D4 tels que remplacés (epics.md L186-L187) ; D6 (cartes grisées en placement, `04f5493b`) ; cibles tactiles en boîtes réelles (revue 5.3) ; `tokens.ts` inchangé ; données transportées par les repositories existants.

**Never:** lecture vidéo, son, persistance d'une affiche ; migration, changement d'API ou de repository ; modification du rendu du Catalogue.

</frozen-after-approval>

## Code Map

- `src/features/activities/MediaPreview.tsx` (nouveau) -- `MediaPreview` (photo / affiche / place réservée), `firstMediaPreviewSource`, `useMediaUriResolver` ; extraits de `ActivityCard`.
- `src/features/activities/ActivityCard.tsx` -- `CardThumbnail` délègue à `MediaPreview` (testID et styles inchangés).
- `src/features/sessions/OccurrenceCard.tsx` -- prop `media`, `OccurrenceMediaPreview`, styles `mediaImage` / `mediaPlaceholder`.
- `src/features/sessions/CompositionScreen.tsx` -- `media={firstMediaPreviewSource(activity.media)}` ; `onOpenVolumes` / `volumesFocusRequest` passés à `CompositionContextHeader` au lieu de `CircuitHeader`.
- `src/features/sessions/CompositionContextHeader.tsx` -- œil des Volumes (boîte 44, cercle 34, icône 20, focus, placement), `CONTEXT_VOLUMES_ACTION_GEOMETRY`.
- `src/features/sessions/CircuitHeader.tsx` -- œil retiré ; compteur à l'écart Figma 20 ; `CIRCUIT_HEADER_TOUCH_GEOMETRY` refondu.
- Tests : `OccurrenceCardMedia.test.tsx` (nouveau), `CompositionScreen.test.tsx`, `CircuitHeader.test.tsx`.
- READMEs : `src/features/sessions/README.md`, `src/features/activities/README.md`.

## Tasks & Acceptance

**Execution:**
- [x] Extraction `MediaPreview` partagée Catalogue / Composition, tests du Catalogue verts sans changement d'attente.
- [x] Gabarit de la carte v2 : photo, affiche vidéo, place réservée, icône générique sans média, grisé en placement + tests.
- [x] Vérification du chemin des médias jusqu'à l'écran (Catalogue, Séance relue, duplication).
- [x] Œil dans la zone de contexte (gabarit des commandes contextuelles, focus, accessibilité, placement) + tests.
- [x] En-tête du Circuit sans l'œil (écart Figma, cibles disjointes du titre) + tests.

**Acceptance Criteria:**
- Given la suite ciblée, when `npx jest src/features/sessions src/features/activities src/domain/sessions src/shared src/infrastructure/media --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then vert hors travaux parallèles de la story 6.1 ; attentes modifiées seulement là où la story l'impose.
- Given un iPhone, when on ouvre une Composition avec photos et vidéos, then les gabarits et l'œil suivent cette spec (vérification Hermann, J4).

## Implementation Notes

- **Chemin des médias (aucun correctif nécessaire).** `SessionDraftExercise.media` (`DraftMediaItem[]`, ordre de la galerie) est déjà alimenté : ajout depuis le Catalogue (`activityDefinitionToDraftExercise`, copie des liens), Séance relue (`SqliteSessionRepository.readSession` → `listSessionActivityMediaByIds` → `Activity.media` → `toSessionDraft` / `activityToDraftExercise` → `toDraftMediaItems`), duplication d'occurrence (`duplicateActivity`). L'écran lit `activity.media` dans `CompositionActivityRow` ; l'URI de stockage (relative `kodjo-media/…`) est résolue à l'affichage par `ActivityDefinitionService.resolveMediaUri`, fourni à toute l'application par `SessionServiceProvider` (`ActivityDefinitionServiceProvider`). Aucun repository, aucune API, aucune migration modifiés.
- **Extraction.** `MediaPreview` reprend à l'identique le choix de `CardThumbnail` (photo `expo-image` en `cover`, `onError` rattaché à l'URI ; vidéo par `useCatalogueVideoCover`, même cache) ; `useMediaUriResolver` est déplacé tel quel. `CardThumbnail` garde son cadre, sa cible (`onOpen`) et ses testID : `ActivityCard.test.tsx` passe sans changement.
- **Gabarit.** Image 100 % × 100 % à l'intérieur du bord de 1 (62 × 62), rayon 11 (12 − bord) ; le gabarit garde bord `#7A7A80`, fond `#EEF0F6`, rayon 12, `overflow: hidden`. Place réservée : le fond du gabarit, sans icône (choix : l'icône générique signifie « pas de média », la place vide « affiche en cours de génération » ; revue 5.1b : un média illisible prend l'icône générique). Texte alternatif : le nom de l'exercice porté par la carte (élément accessible) ; l'image est `accessible={false}`, sans libellé (revue 5.1b). Pas de `pointerEvents="none"` : ni le gabarit ni l'image ne sont des répondeurs, le toucher remonte à la carte.
- **Placement, soulevé, balayage.** Le gabarit est déjà dans les parties grisées (`attenuated`, D6) : l'image l'est avec lui. Il est dans le `Pressable` de la carte : il suit la translation du glisser et du balayage.
- **Œil (Figma lu le 22/10/2026, lecture seule).** `get_metadata` de `8328:28608` (Standard) et `5271:5455` (modification), `get_design_context` de `8328:28611` : aucun œil dans la zone de contexte (ni dans l'en-tête du Circuit de ces deux maquettes). Gabarit retenu : commandes contextuelles de ch13 (L1480, L1591 : 34 / dessin 20 / gap 10 / cibles 44), cercle identique au « + » (fond blanc, contour 1 `primary`, rayon 17), icône `view-volumes` (`8165:13756`) à 20, en tête du groupe (œil, « Ajouter un arrêt », « + »). Cible réelle 44 × 44 (revue 5.1b : boîtes jointives contenues par leurs parents, voir plus bas).
- **Disponibilité.** Inchangée hors placement (toujours présent, deux natures, Circuit vide compris). En placement, l'œil était inactif et masqué avec l'en-tête du Circuit ; il prend le traitement du « + » (atténué 0,45, `disabled`, `accessibilityState.disabled`), resté visible à VoiceOver comme le « + ».
- **En-tête du Circuit.** Écart titre → compteur 20 (`9819:19948` : titre 45–97, stepper révélé à 117), même valeur au repos et révélé (avant : 18 / 12 après l'œil). Le titre n'est pas une cible : la contrainte de disjonction devient « la cible du compteur ne remonte pas sur le titre » (au repos 20 − 12 = 8, révélé 20 + 4 − 10 = 14). Ordre de cession (durée puis titre) et compteur incompressible inchangés.
- **Tests modifiés (rendu changé par la story).** `CircuitHeader.test.tsx` : harnais sans l'œil ; test de disjonction refondu (titre / compteur) ; bloc « œil des volumes » remplacé par « sans l'œil » (absence, ligne du titre, actions du compteur). `CompositionScreen.test.tsx` : `EYE` = `composition-volumes-action` (tests 3.4 de modales, focus, Android, sortie inchangés) ; test « l'œil dans l'en-tête » remplacé par « l'œil dans la zone de contexte » ; disjonction en-tête / première carte sans l'œil ; titre du test du gabarit sans média. **Ajoutés** : gabarit des commandes contextuelles, placement de l'œil, bloc « photo ou affiche vidéo » (5 tests) ; `OccurrenceCardMedia.test.tsx` (9 tests : premier média, photo, erreur, affiche vidéo par le vrai `generateVideoPoster` avec fabrique `expo-video` simulée, vidéo sans affiche, sans média, sans service, placement, aucune cible).

- **Revue 5.1b (correctifs appliqués, 22/10/2026).**
  - *Affiches vidéo* (`catalogueVideoCover.ts`, partagé avec le Catalogue) : au plus deux générations à la fois (`MAX_CONCURRENT_GENERATIONS`, file FIFO) ; un échec (affiche absente, délai, rejet) n'est plus gardé pour la vie du processus — l'entrée est retirée, un montage ultérieur réessaie, le montage en échec reste `failed` ; les affiches générées sont gardées à part et lues de façon synchrone au rendu (aucune place réservée au remontage : glisser d'une zone à l'autre, retour à l'écran). Tests : `catalogueVideoCover.test.tsx` (6 : file et ordre FIFO, une génération par URI, nouvel essai après échec, montage en échec puis remontage, état initial synchrone, changement d'URI). `ActivityCard.test.tsx` inchangé et vert.
  - *Média définitivement indisponible* : la place réservée ne sert plus qu'au chargement de l'affiche ; photo en erreur ou vidéo sans affiche → icône générique dans la carte d'occurrence (`MediaPreview.unavailable` ; le Catalogue ne la passe pas et garde son repli neutre). L'échec d'une photo est oublié dès que l'URI change (ajustement d'état au rendu). `firstMediaPreviewSource` : sans `kind`, le type MIME décide (`video/*`). `useMediaUriResolver` : une résolution qui lève rend l'URI brute.
  - *Focus après retrait du point « après le Circuit » sans occurrence après lui* : plus l'œil (désormais en haut de l'écran) ; le compteur de l'en-tête du Circuit (`counterRef` de `CircuitHeader`, élément accessible au repos ou révélé), à défaut la borne « Fin de séance » (`BoundaryStep` reçoit `ref`). Test ajouté.
  - *Œil* : inactif pendant le glisser d'une carte (sans atténuation, état passager) et `openCircuitVolumes` n'ouvre rien tant qu'une carte est soulevée ; l'ouvrir referme les actions glissées révélées et la bulle « Retirer » (CIR-10). Cibles réelles : œil, « Ajouter un arrêt » et « + » sont des boîtes de 44 × 44 jointives (écart visuel de 10 par les marges des cercles), sans `hitSlop` ni marge négative ; la bande de 32 devient une boîte de 44 aux marges verticales de −6, l'en-tête s'étend de 5 à droite (dernière boîte, comme la zone Figma jusqu'à x 359) et de 6 en bas, compensés (le nom garde sa largeur) : chaque parent contient ses cibles. Écart bande d'informations → premier cercle conservé (3 + 5). Écran étroit : durée de séance `flexShrink: 1`, `minWidth: 0` (ellipse), groupe d'informations `minWidth: 0`, commandes incompressibles. Test « jamais de focus au montage, un seul à la fermeture » restauré au niveau de l'écran.
  - *Tests sans preuve* : libellé de l'image retiré (le nom de la carte est le texte alternatif) et son assertion supprimée ; test de `contentPosition` (valeur par défaut du simulateur) supprimé ; après l'appui long, l'état soulevé est vérifié (surface soulevée, défilement neutralisé) ; le test de disjonction des commandes vérifie les dimensions réelles (boîtes, marges, hauteur des parents) au lieu d'une identité arithmétique.
  - *Acceptés sans changement* : œil atténué et inactif en placement comme le « + » (D-a) ; style de l'œil = gabarit des commandes contextuelles (D-b, J4).
  - *Tests modifiés en plus* : « + » et « Ajouter un arrêt » (cercle lu sur `…-circle`, boîte de 44, plus de `hitSlop`), bande d'informations (boîte de 44, encombrement 32).

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | blind + edge | Affiches vidéo générées toutes à la fois ; échec gardé pour tout le processus ; place réservée qui clignote au remontage | medium | patch : 2 générations au plus (FIFO), échec non conservé, état initial synchrone ; tests. |
| 2 | edge | Média définitivement indisponible : place réservée vide sans fin ; `kind` absent ; résolveur qui lève | medium | patch : icône générique (Composition seulement), repli sur le type MIME, résolveur protégé ; tests. |
| 3 | blind + edge | Focus après retrait du point « après le Circuit » envoyé à l'œil, en haut d'écran | medium | patch : compteur du Circuit, sinon Fin de séance ; test. |
| 4 | edge | Œil ouvrable pendant un glisser, avec actions ou bulle ouvertes ; cibles réelles hors parent ; bandeau étroit | medium | patch : garde, fermeture préalable, boîtes réelles de 44 (œil, « Ajouter un arrêt », « + »), durée tronquée ; tests. |
| 5 | blind + verification-gap | Texte alternatif mort ; tests sans preuve (`contentPosition`, appui long, disjonction arithmétique) ; test « jamais au montage » perdu | low | patch : libellé retiré (nom de la carte), tests réécrits, garde-fou restauré. |
| 6 | verification-gap | Œil en placement annoncé désactivé (D-a) ; style de l'œil sans dessin Figma (D-b) | — | Accepté, J4. |

## Verification
