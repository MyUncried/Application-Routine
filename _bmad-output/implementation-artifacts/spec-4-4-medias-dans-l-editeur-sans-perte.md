---
title: 'Story 4.4 — Médias dans l''Éditeur, sans perte'
type: 'feature'
created: '2026-10-18'
status: 'done'
route: 'dispatch'
baseline_commit: '3dd1060f'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-4.md'
  - '{project-root}/_bmad-output/implementation-artifacts/bilan-ecarts-2026-10-17.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-4-2-ecran-principal-conforme-aux-references.md'
  - '{project-root}/_bmad-output/planning-artifacts/prds/prd-kodjo-pre4-2026-10-16/prd.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-kodjo-pre4-2026-10-16/ARCHITECTURE-SPINE.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/questions-ouvertes.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/recette-iphone.md'
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les Médias de l'Éditeur sont conformes depuis PRE-3 (ajout, galerie, menu Retirer / Monter / Descendre, réessai), mais il n'existe ni relevé visuel du bloc Médias, ni preuve de non-régression dans les quatre parcours, et la carte du Catalogue n'affiche pas la vignette du premier Média.

**Approach:** Implémenter la **story 4.4 (AC1 à AC7, `epics-parts/epic-4.md`)** comme une story de **vérification et d'un ajout** (bilan des écarts) : relevé visuel AC1 d'abord ; tests de non-régression dans les quatre parcours (CC, MC, CS, MS), écrits **indépendamment du geste** d'ouverture du menu pour être repris tels quels par 4.5 ; un seul ajout de code attendu : la vignette du premier Média sur la carte du Catalogue (`ActivityCard.tsx`, l.~106). Ne toucher ni `MediaTile`, ni `useMediaImport`, ni le menu.

## Boundaries & Constraints

**Always:**
- AC1 avant tout changement de `src/` : relevé (galerie, aperçu tronqué, tuile d'ajout et son icône `icon/ajouter` comparée à `action-add`, vignettes photo et vidéo, pictogrammes de lecture et plein écran pour 4.5) ; états sans capture `NON VÉRIFIABLE`. Aucun chiffre lu n'y devient une règle (D-255).
- Comportement PRE-3 conservé (NFR-03) : menu natif Retirer / Monter / Descendre au toucher (le geste passe à l'appui long en 4.5, pas ici), actions VoiceOver, réessai, textes d'erreur et de permission, sources et formats.
- Vignette de carte : premier Média ; image de couverture pour une vidéo ; sans Média, la carte reste comme aujourd'hui. Composant et API existants réutilisés (aucun nouveau générateur de vignette si une couverture existe déjà).
- Copies : la Définition garde ses Médias et leur ordre ; un retrait ne supprime que l'association (FR-21-53, FR-21-54, livrés en 1.3).
- Aucun fichier du moteur d'exécution touché (AC6). Jetons intouchés ; lexique pour tout texte.

**Never:**
- Ne pas modifier `MediaTile`, `useMediaImport`, le menu des Médias ni le geste (4.5).
- Aucune limite, source, permission ni caméra nouvelle ; pas de lecture en exécution.
- Aucune conformité visuelle déclarée (NFR-04).

</frozen-after-approval>

## Code Map

- `src/features/activities/ActivityMediaList.tsx`, `ActivityEditorForm.tsx` (section Médias), `MediaTile` (lecture seule).
- `src/features/activities/ActivityCard.tsx` (carte du Catalogue ; l'emplacement `src/features/sessions/` du cadrage était inexact) et `src/features/activities/catalogueVideoCover.ts` (couverture vidéo en cache, ajouté par la revue).
- `src/domain/media/`, `src/infrastructure/media/` (lecture).
- Tests : `src/features/activities/__tests__/ActivityMediaList.test.tsx`, `src/features/activities/__tests__/ActivityCard.test.tsx`, `src/features/sessions/__tests__/ExerciseEditingPaths.integration.test.tsx` ; utilitaire `src/features/activities/testing/mediaMenu.ts`.
- Frames : `8328:35698`, `8328:35740`.
- Recette `recette-iphone.md` §4.4 : R-4.4-01 à 04.

## Tasks & Acceptance

**Execution:**
- [x] Relevé visuel AC1 (avant tout changement de `src/`) -- Implementation Notes (E-F1 ; E-V17 à E-V22, E-V13 rappelé). Consigné avant la première modification de `src/` dans la session ; il arrivera dans le même commit local que le code (aucune preuve d'antériorité au-delà du processus suivi).
- [x] Tests de non-régression des quatre parcours (AC2, AC3, AC5, AC7), indépendants du geste -- `ExerciseEditingPaths.integration.test.tsx` ; menu par `testing/mediaMenu.ts` (`openMediaMenu`).
- [x] Vignette du premier Média sur la carte du Catalogue -- `ActivityCard.tsx` (E-F1).
- [x] AC6 vérifié par le diff -- voir « Correspondance ».
- [x] Tests `PRE4-4.4/AC1` à `AC7` ; recette R-4.4-01 à 04 ; READMEs -- table ci-dessous ; `recette-iphone.md` §4.4 ; READMEs `src/features/activities`, `src/features/activities/testing`.

**Acceptance Criteria:**
- Given la story 4.4, when elle est livrée, then chacun de ses critères AC1 à AC7 est vérifié par un test nommé, une citation précise d'un test existant ou, pour AC1, par le relevé consigné ; `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Implementation Notes

### Relevé visuel AC1 (consigné le 2026-10-18, avant toute modification de `src/`)

Sources : arbres `docs/preparation/PRE-4/figma/8328-35698.json.gz` (**A** Initial, aucun Média) et `8328-35740.json.gz` (**B** Nom Description Média), lus par un script de lecture jetable (supprimé) ; maîtres et variables de `sources-caa2a5cf/…/fermeture-maitres-et-variables.json.gz` ; pour la vignette de carte, ch. 13 consolidé §4.11 (l. 165) et l. 396 (règle écrite) et la frame `6354:16964` « Wireframe — Photo » lue dans Figma **en lecture seule** (`get_metadata`, `get_screenshot` du nœud `8693:14498`, aucune modification). Code relevé : `3dd1060f`. Les chiffres sont des constats, jamais des règles (D-255, NFR-01) ; aucune coordonnée absolue n'est reprise. **Constat d'échelle :** dans A et B, les tuiles sont des instances agrandies de 1,115 (289,9 × 237,5 = 260 × 213 × 1,115 ; rayon 13,38 = 12 × 1,115 ; trait 1,115 ; icône 26,76 = 24 × 1,115) : les valeurs du code (260 × 213, rayon 12, icône 24) sont celles du maître non agrandi. Écarts : **E-F** corrigé dans la story, **E-V** signalé à Hermann, non corrigé.

| # | Frame / état | Élément (nœud) | Maître / variante | Style / variable lié | Police | Couleurs | Contour | Ombre / effets | Espacement relatif | Jeton retenu (code `3dd1060f`) | Écart |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | A, B | Bloc Médias (`Accordéon — Médias — Déployé` `8328:35781` / `8328:35727`) | — | — | — | — | — | — | 354 de large, sans titre | titre de section « Médias » `type.sectionTitle` au-dessus de la galerie | aucun titre dans les frames : E-V13 de 4.2, toujours ouvert |
| 2 | A, B | Galerie horizontale (`Media / Gallery — Source exact` `8328:35783` / `8328:35729`) | — | fond `color/media/surface` ; marges et écart `spacing/8` ; rayon `radius/16` | — | #F5F7FA | aucun | aucun | 354 × 253, marges 8, écart 8, mise en page horizontale, contenu rogné | `ScrollView horizontal` (`galleryFrame` `colors.mediaSurface`, `fixedRadii[16]` ; `gallery` `spacing[8]` en marge et écart) | conforme |
| 3 | B | Tuile Média, photo (`Media / Preview — Illustration activité` `8328:35784`) | — | fond `color/background` | — | #FFFFFF ; image recadrée (illustration de démonstration) | **aucun** (`strokes` vide) | aucun | 289,9 × 237,5 (× 1,115), rayon 13,38 | `MediaTile` : 260 × 213, `fixedRadii[12]`, `colors.background`, image `contentFit="cover"` ; contour 1 `colors.mediaBorder` #CDCEFA | contour #CDCEFA présent dans le code, absent des frames : E-V17 |
| 4 | B | Aperçu tronqué du Média suivant (`Media / Preview — Ajouter` `8328:35803` à x 305,9) | — | — | — | — | — | — | ≈ 40 visibles sur 354 | tuile suivante à 8 + 260 + 8 = 276 : ≈ 70 visibles sur 354 | aperçu tronqué présent (conforme) ; part visible différente (largeur de tuile, D-255 : non reprise) |
| 5 | A, B | Tuile d'ajout (`Media / Preview — Ajouter` `8328:35803` / `8328:35733`) | — | fond `color/background` | — | #FFFFFF | **aucun** | aucun | 289,9 × 237,5, rayon 13,38 ; icône centrée | `Pressable` `preview` + `addTile` : 260 × 213, rayon 12, contour 1 `colors.mediaBorder` | contour : E-V17 |
| 6 | A, B | Icône de la tuile d'ajout (`Icône photo — ajouter` `8328:35804` / `8328:35734`) | **`icon/photo-ajouter` `7021:13149`** (cadre photo, montagne, soleil, « + ») — et non `icon/ajouter` `6959:15706` | trait `color/icon-neutral` | — | trait #595E66, 1,8 (2,007 × 1/1,115) | — | — | 24 (26,76 × 1/1,115), centrée | `KodjoIcon` `action-add` = `assets/icons/action-add.svg`, export exact de `icon/ajouter` `6959:15706` (croix seule, trait 2), teinte `colors.textSecondary` #595E66 ; l'export exact `icon-photo-ajouter.svg` (`7021:13149`) est déposé au manifeste, non câblé | **E-V18** : le code porte `icon/ajouter` (glyphe nommé par AC1 et FR-21-02), les frames `icon/photo-ajouter` ; aucun « + » typographique dans les deux cas (conforme). Non corrigé : la règle écrite nomme `icon/ajouter` ; arbitrage de Hermann (Spec Change Log) |
| 7 | A | Tuile de démonstration sans Média (`Media / Preview — Illustration activité` `8328:35730`) | — | — | — | #FFFFFF | aucun | — | première tuile : `icon/photo-ajouter` + pictogramme plein écran, puis une tuile d'ajout | sans Média, la galerie ne rend que la tuile d'ajout | non reprise : une tuile sans Média n'a ni contenu ni consultation (P18, code de départ) ; signalée (E-V19) |
| 8 | B | Pictogramme de lecture (`Média — Lecture` `8328:35802`, pour 4.5) | `Action=Lecture` `7872:14696` (ensemble `5613:5357`) | aucune variable | « ▶ » Inter Regular 20 / auto (**caractère typographique**) | disque #0F0F14 à 55 %, glyphe #FFFFFF | — | — | Ø 56, centré dans la tuile | absent (rendu par 4.5) | relevé pour 4.5 ; le glyphe est un caractère « ▶ » et non un vecteur : à arbitrer en 4.5 (E-V20) |
| 9 | A, B | Pictogramme de plein écran (`Média — Plein écran` `8328:35801` / `8328:35732`, pour 4.5) | `Action=Plein écran` `5613:5346` (variante sœur `Action=Fermer le plein écran` `5613:5351`) | disque `color/observed/fcfcfe`, contour `color/neutral/white-FFFFFF` ; icône `charm:screen-maximise` (remplissage `color/observed/1e1e22`, trait `color/observed/000000`) ; effet « KODJO / DSF / Effet observé / 01 » | — | disque #FCFCFE, icône trait #000000 1,5 | blanc 1 | ombre portée #1A1A26 8 %, (0, 2), flou 10 | Ø 32, en bas à droite de la tuile (≈ 8 du bord), icône 16 | absent (rendu par 4.5) ; aucun jeton d'ombre | relevé pour 4.5 ; ombre sans jeton (comme E-V4 de 4.3) |
| 10 | — | Vignette vidéo (affiche) | — | — | — | — | — | — | — | `VideoPreview` : affiche `generateVideoPoster` (expo-video) en `cover`, repli `colors.surface` ; badge « Vidéo » `type.supporting` blanc sur `colors.snackbar`, rayon 6, en bas à gauche | **NON VÉRIFIABLE** : aucune frame ne montre une vidéo réelle (B montre le pictogramme de lecture sur une illustration) ; le badge « Vidéo » du code n'a pas d'équivalent dans les frames (E-V21) |
| 11 | — | Import en cours (`Importation…`, indicateur) | — | — | — | — | — | — | — | tuile `previewPending`, `ActivityIndicator` `colors.primary`, `type.body` `colors.textSecondary` | **NON VÉRIFIABLE** (aucune frame) ; validé par Hermann |
| 12 | — | Erreur d'import et `Réessayer` | — | — | — | — | — | — | — | texte `type.body` `colors.danger` ; `Réessayer` `type.button` `colors.primary`, cible 48 | **NON VÉRIFIABLE** (aucune frame) ; validé par Hermann |
| 13 | — | Menu Retirer / Monter / Descendre | — | — | — | — | — | — | — | feuille d'actions native iOS (`ActionSheetIOS`), `Alert` ailleurs ; ouvert au toucher (4.5 : appui long) | **NON VÉRIFIABLE** (rendu natif, aucune frame) ; validé par Hermann |
| 14 | — | Fichier introuvable | — | — | — | — | — | — | — | photo : `expo-image` sans source lisible (fond `colors.background`) ; vidéo : repli `colors.surface` ; clé `media.missingFile` présente au lexique, non rendue | **NON VÉRIFIABLE** (aucune frame) ; texte inchangé ; état d'erreur visible relève de 4.5 (AC6, FR-21-58) |
| 15 | — | Avis de permission (refus, refus définitif, accès limité, photothèque indisponible) | — | — | — | — | — | — | sous la galerie, écart 8 | `type.body` `colors.textSecondary` ; `Ouvrir les réglages` `type.button` `colors.primary` | **NON VÉRIFIABLE** (aucune frame) ; textes du code de départ |
| 16 | `6354:16964` (ch. 13 §4.11, l. 396) | Vignette de la carte d'Exercice du Catalogue (`Photo — cadre carré` `8693:14498`) | — | — | — | photo recadrée centrée | aucun visible | — | carré 64 à 12 du bord gauche, texte à x 88 ; coins légèrement arrondis (capture, rayon non lisible dans `get_metadata`) | absente au départ (`ActivityCard.tsx:105-106` : « gouttière… non implémentée ») | **E-F1** ajoutée (premier Média, couverture d'une vidéo, touchable et décorative : Q50 e) ; rayon : `fixedRadii[6]`, plus petit rayon existant, à juger (E-V22) ; vidéo sans marque visuelle (E-V23) ; sans Média : carte inchangée, sans icône de nature (Spec Change Log, Q50) |

**Textes et éléments des captures non repris :** illustration « Squat assisté » (donnée de démonstration) ; tuile de démonstration sans Média de A (E-V19) ; noms de calques « Médias — Aperçus de l’exercice — Proposition — Local », « Accordéon ».

**Écarts à corriger (E-F) :** E-F1 vignette du premier Média sur la carte du Catalogue (FR-21-02, D-264).

**Écarts signalés à Hermann, non corrigés (E-V)** — numérotés à la suite de 4.2 (E-V1 à E-V16) ; chacun demanderait de changer `MediaTile` (interdit ici), un jeton, ou une règle écrite :

- E-V13 (rappel de 4.2) — titre « Médias » affiché par le code, absent des frames.
- E-V17 — tuiles Média et tuile d'ajout : contour 1 `colors.mediaBorder` #CDCEFA dans le code, aucun contour dans les frames. Style de `MediaTile` (non modifiable en 4.4).
- E-V18 — icône de la tuile d'ajout : `icon/ajouter` (croix) dans le code et dans la règle écrite (AC1, AC3, FR-21-02), `icon/photo-ajouter` (`7021:13149`, export exact déjà déposé) dans les frames A et B. Le basculement serait d'une ligne (`KodjoIcon` + manifeste), mais contredirait le texte de FR-21-02 : arbitrage demandé.
- E-V19 — frame A (aucun Média) : une tuile de démonstration avec icône d'ajout et pictogramme de plein écran précède la tuile d'ajout ; le code ne rend que la tuile d'ajout.
- E-V20 (pour 4.5) — pictogramme de lecture : caractère « ▶ » Inter 20 sur disque #0F0F14 à 55 % ; un glyphe typographique serait à confirmer ou à remplacer par un vecteur en 4.5.
- E-V21 — badge « Vidéo » de la tuile vidéo : présent dans le code (PRE-3), absent des frames (qui montrent le pictogramme de lecture de 4.5).
- E-V22 — vignette de carte : rayon des coins non lisible ; `fixedRadii[6]` retenu.
- E-V23 (revue) — vignette vidéo de la carte : aucune marque visuelle de vidéo (image de couverture seule) ; les sources (ch. 13 §4.11, l. 396) n'en prévoient que l'icône de nature, sans Média. À arbitrer par Hermann (R-4.4-04).

**Assertions qui changent selon l'arbitrage de Hermann.** E-V17 (contour retiré) : `ActivityMediaList.test.tsx` `PRE4-4.4/AC1`, boucle « État actuel du code (E-V17) » (`borderWidth: 1`, `colors.mediaBorder`) ; changement de `MediaTile`, donc en 4.5 ou après. E-V18 (`icon/photo-ajouter` retenue) : même test, `props.name` `action-add` → `icon-photo-ajouter`, et l'assertion de manifeste `action-add` ; les assertions des frames (`7021:13149`) ne changent pas. E-V22, E-V23 : `ActivityCard.test.tsx` `PRE4-4.4/AC3` (style du carré, absence de badge).

### Constat de départ (2026-10-18)

Suites PRE-3 et PRE-4 vertes au départ. Comportement constaté conforme sans changement : ajout depuis la photothèque seule (`PhotoLibraryPicker`, `launchImageLibraryAsync`, jamais la caméra), sélection multiple sans plafond, ajout en fin de liste (`useMediaImport.append`), annulation neutre, erreurs locales avec `Réessayer` sans doublon (`placeRetriedMedia`), avis de permission et d'accès limité, menu natif Retirer / Monter / Descendre au toucher, bornes exclues, actions VoiceOver équivalentes, enregistrement à `Terminer` (Catalogue) ou au `Continuer` (Séance), Copies à liens propres (1.3). Seul écart fonctionnel : la vignette de carte (E-F1, déjà au bilan).

### Réalisation (2026-10-18)

- `ActivityCard.tsx` (E-F1) : vignette du premier Média (`definition.media[0]`, ordre du Repository `ORDER BY position`), carré 64 × 64 entre la barre de couleur et le texte, dans un emplacement de hauteur fixe 91 (`CARD_MIN_HEIGHT`) ancré en haut : centrée sur la hauteur repliée même quand la carte grandit ; photo par `expo-image` (`cover`, `onError` → repli neutre) ; vidéo par sa couverture (`useCatalogueVideoCover`, repli neutre pendant la génération ou en échec) ; URI par `useMediaUriResolver` (`ActivityDefinitionService.resolveMediaUri`, même dégradation silencieuse que les Zones) ; vignette touchable (`onOpen`, comme la surface principale) et décorative, masquée de l'accessibilité (Q50 e) ; texte à 88 (`contentAfterThumbnail`) ; sans Média, aucun changement de rendu. Aucun texte nouveau, aucun jeton.
- `catalogueVideoCover.ts` (nouveau, revue) : couverture par `generateVideoPoster` (générateur existant), en cache par URI pour la durée du processus (une génération par vidéo, échec compris) ; rejet capturé ; coût documenté dans le README.
- `ActivityMediaList.tsx` : identique au code de départ après revue (l'export de `VideoPreview` est retiré, la carte n'en dépend plus) ; `MediaTile`, menu, geste, `useMediaImport` (dans `ActivityEditorForm.tsx`) non touchés.
- `testing/mediaMenu.ts` (nouveau) : `openMediaMenu(rang)` ; geste isolé dans `performMenuGesture`, interception dans `interceptMenu` (espions restaurés par `finally` ; erreur si aucun menu, aucune option `Annuler` ou option absente, avec la liste des options, sur iOS comme ailleurs). 4.5 adapte les deux.
- Non touchés : `tokens.ts`, `migration001.ts`, garde-fous zéro `ScrollView`, moteur d'exécution, lexique (aucune clé ajoutée ni retirée), `ActivitySelectionScreen.tsx` (carte de choix, voir Spec Change Log).

**Correspondance des critères et des tests**

| AC | Preuve |
|---|---|
| AC1 | Relevé ci-dessus ; `ActivityMediaList.test.tsx` `PRE4-4.4/AC1` (galerie horizontale des frames A et B, tuiles sans contour ; icône d'ajout sélectionnée par nom de tuile et type de nœud : `7021:13149` dans les frames contre `action-add` = `6959:15706` dans le code ; aucun « + » typographique ; contour actuel du code `colors.mediaBorder` épinglé ; pictogrammes de lecture `7872:14696` et de plein écran `5613:5346` relevés, absents du code) |
| AC2 | `ExerciseEditingPaths.integration.test.tsx` `PRE4-4.4/AC2` ×4 (CC, MC, CS, MS : photo puis vidéo en dernière position, enregistrées à `Terminer` ou au `Continuer`, rien d'écrit avant en Séance) ; aucune caméra, photothèque seule, sans plafond : `ActivityMediaImportService.test.ts` « P3-23/permissions — photothèque seule… » (`launchCameraAsync` jamais appelé, `selectionLimit: 0`) et « P3-23/import-multiple — … aucune conversion ni plafond » |
| AC3 | `ActivityMediaList.test.tsx` `PRE4-4.4/AC3` ×3 (galerie horizontale et ordonnée, aperçu du suivant tronqué à 402 et à 375 ; menu indépendant du geste : options selon la position, bornes exclues, `Annuler` sans effet, option absente signalée, espions restaurés, iOS et Android ; effets Retirer / Monter / Descendre par le menu et par les actions VoiceOver) ; `ActivityCard.test.tsx` `PRE4-4.4/AC3` ×8 (photo : carré 64, `cover`, URI résolue, texte à 88, emplacement 91 ancré en haut pour une carte plus haute ; vignette touchable et masquée de VoiceOver, un seul bouton « Modifier l'exercice » ; photo illisible → repli ; vidéo : couverture du seul premier Média dans le carré 64, `cover`, sans badge ; couverture en échec ou rejet → repli ; cache : une génération pour deux montages et deux cartes ; chemin réel `ActivityDefinitionService` → `ActivityMediaImportService` → `resolveUri` ; sans Média) ; `ExerciseEditingPaths.integration.test.tsx` `PRE4-4.4/AC3` (MC : vignette du premier Média, Monter, `Terminer`, réouverture même ordre et même identité, vignette mise à jour, retrait par action VoiceOver sans suppression de l'asset ni du fichier) ; zone Médias sous la Carte : `ActivityEditorForm.test.tsx` `PRE4-4.2/AC3` (ordre … Carte, Médias, `Terminer`, en flux, sans superposition) ; icône d'ajout : `PRE4-4.4/AC1` |
| AC4 | `ActivityMediaList.test.tsx` `PRE4-4.4/AC4` (la tuile reste la seule cible, aucun bouton ajouté, aucun lecteur ni plein écran) ; consultation renvoyée à 4.5 |
| AC5 | `ExerciseEditingPaths.integration.test.tsx` `PRE4-4.4/AC5` ×2 (MC à deux Médias : annulation sans effet ; `ERROR` et refus : avis du départ ; `COPY_FAILED`, `STORAGE_FULL`, `INCOMPATIBLE` : Brouillon intact, messages du lexique ; le réessai de l'élément `COPY_FAILED`, touché deux fois avant toute réponse, ajoute un seul Média, en dernière position, sans doublon, et l'élément quitte les échecs ; restent `STORAGE_FULL` et `INCOMPATIBLE` ; textes du départ épinglés) ; `ExerciseScreen.test.tsx` « P3-23/cancel-local-error… » |
| AC6 | Diff de la story (`git diff --stat`) : `ActivityCard.tsx`, `catalogueVideoCover.ts`, `testing/mediaMenu.ts`, tests, READMEs, documents ; `ActivityMediaList.tsx` inchangé ; aucun fichier de `src/features/execution*`, `src/domain/execution*`, ni moteur de lecture ; aucun import d'`expo-video` ajouté hors du générateur d'affiche existant |
| AC7 | `ExerciseEditingPaths.integration.test.tsx` `PRE4-4.4/AC7` (MS : Monter puis Retirer sur la Copie, `Terminer`, `Continuer` : Définition à deux Médias dans leur ordre, asset et fichier retirés conservés) ; règles de données : stories 1.1 et 1.3 |

Tests ajoutés : 21 (`ActivityMediaList.test.tsx` 5, `ActivityCard.test.tsx` 8, `ExerciseEditingPaths.integration.test.tsx` 8) ; aucun test existant retiré ni modifié dans ses attendus. Vérification complète après revue : par le coordinateur.

## Spec Change Log

- 2026-10-18 — **Icône de la tuile d'ajout** : AC1, AC3 et FR-21-02 nomment `icon/ajouter` ; les deux frames de référence portent l'instance `icon/photo-ajouter` (`7021:13149`), dont l'export exact est déjà déposé (`assets/icons/icon-photo-ajouter.svg`, non câblé). Le code de départ porte `action-add`, export exact de `icon/ajouter` (`6959:15706`) : même glyphe que la règle écrite, différent des frames. Lu selon la règle écrite (FR-21-02) : aucun changement ; écart inscrit (E-V18) et soumis à Hermann. Si Hermann retient `icon/photo-ajouter`, le changement tient en une clé de `KodjoIcon` et une ligne de la tuile d'ajout, et FR-21-02 / AC1 / AC3 seraient à corriger.
- 2026-10-18 — **Vignette sans Média** : la section frozen dit « sans Média, la carte reste comme aujourd'hui » ; ch. 08 l. 220 et 1566 et ch. 13 l. 165, 396 (copies `caa2a5cf`) prévoient une **gouttière permanente** avec l'**icône de nature** sans Média, pendant le chargement ou en erreur. La section frozen fait foi : aucune gouttière ni icône de nature ajoutée. Pendant le chargement de la couverture d'une vidéo, si elle échoue, ou si une photo est illisible, l'emplacement montre un repli neutre (`colors.surface`), non l'icône de nature. Écart avec les sources à arbitrer par Hermann.
- 2026-10-18 — **Carte de choix** : D-264 vise aussi « les listes de sélection d'exercices » (`ActivitySelectionScreen.tsx`, carte propre). La story et le bilan ne visent que la carte du Catalogue : la carte de choix n'est pas modifiée. À arbitrer (story ultérieure ou 4.6).
- 2026-10-18 — **Vignette touchable et décorative** (revue ; décision de Claude, Q50 e) : d'abord élément accessible distinct (`image`, nom de l'Exercice, ch. 13 l. 432) hors de la surface `Modifier l'exercice`, la vignette fait désormais partie de cette surface (son toucher ouvre l'Éditeur) et elle est masquée de l'accessibilité, pour éviter un arrêt VoiceOver qui répète le nom. Le « texte alternatif égal au nom » de ch. 13 l. 432 n'est donc pas annoncé : à arbitrer par Hermann (Q50 e, R-4.4-04).
- 2026-10-18 — **Placement de la vignette** : la barre de couleur fixe de la carte (4, code de départ) est conservée ; « 12 du bord » est lu comme 4 + 8 et « texte à x 88 » comme 4 + 8 + 64 + 12. La frame `6354:16964` masque cette barre (ch. 13 : « aucune barre verticale hors Jour ») : écart préexistant, hors story, non corrigé.
- 2026-10-18 — **« Reste sous la Carte en cas de chevauchement »** (AC3, ch. 08 l. 220, 1566 : « la Synthèse reste au-dessus ») : lu comme l'ordre de mise en page Carte puis Médias, en flux, sans superposition possible ; prouvé par `PRE4-4.2/AC3`, aucun `zIndex` ajouté.
- 2026-10-18 — **Couverture vidéo de la carte** (revue) : `VideoPreview` avait d'abord été exporté d'`ActivityMediaList.tsx` ; la carte dépendait alors de la galerie de l'Éditeur, régénérait l'affiche à chaque montage et laissait la gestion d'échec au composant de la tuile. Remplacé par `catalogueVideoCover.ts` : même générateur (`generateVideoPoster`, aucun nouveau), cache par URI, rejet capturé, repli neutre côté carte. `ActivityMediaList.tsx` revient au code de départ : aucun risque pour `MediaTile` ni pour 4.5. Coût : une affiche ≤ 256 px par vidéo distincte en tête de carte, gardée jusqu'à la fin du processus (README).
- 2026-10-18 — **Fichier introuvable** : la clé `media.missingFile` (« Fichier introuvable ») existe au lexique mais n'est rendue nulle part dans le code de départ ; texte épinglé inchangé (AC5) ; un état visible relève de 4.5 (AC6, FR-21-58).
- 2026-10-18 — **Antériorité du relevé** : relevé AC1 consigné avant toute modification de `src/` dans la session ; même commit local que le code.

## Review Triage Log

Revue du 2026-10-18 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V, aucun manque). Correctifs appliqués par l'implémenteur ; Q50 ouverte par Claude.

| Constat | Verdict | Route |
|---|---|---|
| B1 — scénarios de recette qui cassent l'état des suivants | medium | patch (ordre imposé, état laissé) |
| B2/E1 — vignette centrée sur toute la carte quand elle grandit | medium | patch |
| B3 — arbitrages absents de `questions-ouvertes.md` | medium | patch (Q50) |
| B4/E4/E5 — espions de `mediaMenu.ts` non restaurés si le geste lève | low | patch (`try/finally`) |
| B5/E6/E7 — `mediaMenu.ts` incohérent entre iOS et `Alert` | low | patch |
| B6 — carte dépendante du module de galerie de l'Éditeur | low | patch (cache dédié ; `ActivityMediaList.tsx` revenu au départ) |
| B7/E2 — couverture vidéo régénérée à chaque montage | medium | patch (cache par URI) |
| B8/E3 — photo introuvable, couverture en échec, rejet non géré | medium | patch (repli neutre) |
| B9 — vignette non touchable, annonce en double non recettées | medium | patch (vignette touchable et décorative, Q50 e ; R-4.4-04) |
| B10 — Code Map erroné | low | patch |
| B11 — résolution réelle d'URI et contenu de la carte vidéo non testés | low | patch |
| B12/E8 — test AC1 fragile, écarts figés sans contrepartie côté code | low | patch |
| B13 — aperçu tronqué testé à la seule largeur 402 | low | patch (343 à 375) |
| B14 — vignette vidéo sans marque | low | patch documentaire (E-V23, à arbitrer) |
| E9 — réessai : absence de doublon non prouvée | medium | patch |


## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
