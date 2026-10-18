---
title: 'Story 4.5 — Consulter un Média dans l''Éditeur (lecteur natif)'
type: 'feature'
created: '2026-10-18'
status: 'in-progress'
route: 'dispatch'
baseline_commit: '72833e24'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-4.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-4-4-medias-dans-l-editeur-sans-perte.md'
  - '{project-root}/_bmad-output/planning-artifacts/prds/prd-kodjo-pre4-2026-10-16/prd.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-kodjo-pre4-2026-10-16/ARCHITECTURE-SPINE.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/questions-ouvertes.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/recette-iphone.md'
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Dans la galerie de l'Éditeur, le toucher d'une tuile ouvre le menu Retirer / Monter / Descendre ; aucun Média ne peut être consulté (vidéo lue, photo agrandie) sans quitter l'Éditeur. Q27 et Q31 inversent les gestes : toucher → consultation par le lecteur natif, appui long → menu contextuel natif.

**Approach:** Implémenter la **story 4.5 (AC1 à AC9, `epics-parts/epic-4.md`)** en **deux phases** :
1. **Phase A — essai AC9, avant tout autre changement de `MediaTile` :** prototype minimal du menu contextuel natif `ContextMenu` d'`@expo/ui` 57.0.13 (API relue dans la documentation versionnée SDK 57) autour de la tuile, sans toucher au reste. Les tests restent verts. **Arrêt** : Hermann essaie sur iPhone (appui long → menu natif avec aperçu ; toucher simple reçu ; galerie défilable). Le résultat est consigné tel que rapporté par Hermann, sans résultat fabriqué. En cas d'échec, repli d'AD-17 (appui long → feuille d'actions native existante), signalé à Hermann avant la suite.
2. **Phase B — après le retour de Hermann** *(renégocié le 2026-10-18 : Hermann a demandé de poursuivre les stories ; la phase B est développée avant l'essai, qui se joue en tête de la recette, R-4.5-00 ; s'il échoue, le repli s'active par la constante `IOS_LONG_PRESS_MENU`)* : consultation au toucher (vidéo : `expo-video` en plein écran natif, aucune lecture automatique, pause et libération ; photo : présentation modale native et `expo-image`), retour sans perte du Brouillon, erreur locale pour un fichier absent ou illisible, accessibilité, livraison atomique du changement de geste (AD-17), tests 4.4 du menu rejoués avec l'appui long sans changer leurs attendus.

## Boundaries & Constraints

**Always:**
- Primitives natives (AGENTS.md, NFR-02) : menu contextuel natif (ou repli natif), lecteur et plein écran natifs ; aucun menu, contrôle de lecture ni plein écran réimplémenté en composants React Native.
- Aucune lecture automatique ; aucun lecteur créé au montage ; `VideoPoster.ts` inchangé. Aucun module du moteur d'Exécution créé, importé ni modifié.
- Livraison atomique (AD-17) : la tuile ne passe jamais par un état sans menu ni consultation.
- Actions VoiceOver Retirer / Monter / Descendre conservées (alternative à l'appui long) ; indications « Lire la vidéo » / « Agrandir le média » par le lexique (H23).
- Helper `mediaMenu.ts` de 4.4 : adapter le geste et l'interception, jamais les attendus.
- Jetons intouchés ; lexique pour tout texte ; garde-fous zéro `ScrollView` intacts.

**Never:**
- Pas de bouton ajouté sur la tuile, pas de zoom ni de navigation entre Médias, pas de visionneuse tierce, pas d'option nouvelle au menu.
- Aucun résultat d'essai sur appareil inventé ; aucune conformité visuelle déclarée (NFR-04).

</frozen-after-approval>

## Code Map

- `src/features/activities/ActivityMediaList.tsx` (`MediaTile`, commentaire D-335 l.~167-172), `src/features/activities/testing/mediaMenu.ts`.
- `src/infrastructure/media/VideoPoster.ts` (lecture : cycle de vie d'un lecteur `expo-video`).
- `@expo/ui` 57.0.13 (`ContextMenu`, `Host`, `RNHostView`), `expo-video`, `expo-image`.
- `src/shared/i18n/` ; tests `ActivityMediaList.test.tsx`, `ExerciseEditingPaths.integration.test.tsx`.
- Recette `recette-iphone.md` §4.4 : R-4.5-00 (essai AC9), R-4.5-01 à 05.

## Tasks & Acceptance

**Execution:**
- [ ] Phase A : prototype `ContextMenu` (AC9), tests verts, R-4.5-00 rédigé ; arrêt pour l'essai de Hermann. *(Prototype livré et R-4.5-00 rédigé ; tâche cochée seulement quand l'essai sera consigné.)*
- [ ] Essai consigné (retour de Hermann) ; voie retenue.
- [x] Phase B : consultation vidéo et photo, retour sans perte, erreurs, accessibilité, menu à l'appui long.
- [x] Tests `PRE4-4.5/AC1` à `AC9` ; recette R-4.5-01 à 05 ; READMEs.

**Acceptance Criteria:**
- Given la story 4.5, when elle est livrée, then chacun de ses critères AC1 à AC9 est vérifié par un test nommé, AC9 par l'essai consigné de Hermann ; `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Implementation Notes

### Phase A — prototype du menu contextuel natif (AC9), en attente de l'essai de Hermann

**Sources relues :** documentation versionnée SDK 57 de `ContextMenu` (`docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/contextmenu/` : ouverture à l'appui long, `Trigger` / `Items` / `Preview` facultatif, `Button` à `role="destructive"`) et de `RNHostView` (hébergement d'une vue React Native dans une vue SwiftUI, premier enfant seul, `matchContents`) ; types installés `@expo/ui` 57.0.13 (`ContextMenu`, `Host`, `RNHostView`, `Section`, modificateur `contentShape` de type `contextMenuPreview`). La documentation n'illustre `RNHostView` que dans `Preview`, `BottomSheet` et `Popover`, pas dans `Trigger` : c'est précisément ce que l'essai vérifie. Antécédent pertinent : en 3.1, une tuile hébergée par `RNHostView` dans `Popover.Trigger` ne recevait pas le toucher (commentaire de `NativeRowPopover`, `ExecutionParametersSheet.tsx`).

**Voie d'intégration (iOS seulement, `ActivityMediaList.tsx`, composant `NativeTileContextMenu`) :** `Host` à la taille exacte de la tuile (260 × 213, sans habillage) → `ContextMenu` → `ContextMenu.Trigger` → `RNHostView matchContents` → `Pressable` existant de `MediaTile`, inchangé (toucher, libellé, indication, actions VoiceOver, style). Aucun `ContextMenu.Preview` : iOS soulève la tuile elle-même comme aperçu, ses coins arrondis à 12 par `contentShape(roundedRectangle, "contextMenuPreview")`. `ContextMenu.Items` : une `Section` titrée du libellé du Média (« Photo 2 sur 3 »), puis les `Button` SwiftUI construits depuis le même tableau `options` que la feuille d'actions (mêmes libellés, ordre, bornes exclues et rappels ; `Retirer` en `destructive`) ; aucun `Annuler`, l'appui extérieur fermant le menu natif ; aucune option nouvelle. Android et web : tuile inchangée, aucun `Host`. Réversible : supprimer `NativeTileContextMenu`, son style `contextMenuHost`, ses imports et les trois lignes d'enveloppe de `MediaTile`.

**État en phase A (périmé depuis la phase B) :** le toucher simple ouvrait encore la feuille d'actions de départ. Depuis la phase B, il consulte le Média (voir plus bas) ; l'accessibilité, les textes, le commentaire D-335 et `mediaMenu.ts` ont été adaptés en phase B.

**Tests (`ActivityMediaList.test.tsx`, `describe` « câblage du menu contextuel natif (AC9) »), simulacres jest-expo des vues SwiftUI, câblage seul :** iOS — chaque tuile est hébergée dans le `Trigger` (`RNHostView matchContents`), titre de `Section` et options selon la position (1 : `Retirer`, `Descendre` ; 2 : les trois ; 3 : `Retirer`, `Monter`), `Retirer` destructif ; effets des options (déplacement d'un rang, retrait) ; le toucher simple n'ouvre plus la feuille d'actions (il consulte) ; Android et web — aucun menu contextuel. Rien n'y prouve le menu, l'aperçu, la réception du toucher ni le défilement sur l'appareil (NFR-04).

**Ce que Hermann doit observer (R-4.5-00, `recette-iphone.md` §4.4) :** (1) appui long sur une tuile → la tuile se soulève, menu contextuel natif titré du Média, `Retirer` / `Monter` / `Descendre` selon la position, effets corrects, et ni feuille d'actions ni consultation en plus, y compris après avoir fermé le menu par un toucher extérieur puis relâché ; (2) toucher simple → consultation du Média (le `Pressable` reçoit bien le toucher à travers `RNHostView`) ; (3) la galerie défile horizontalement, y compris en partant du doigt posé sur une tuile ; (4) tuile au repos inchangée. Un seul point en échec → repli d'AD-17 (`IOS_LONG_PRESS_MENU = "actionSheet"`) signalé à Hermann avant les autres scénarios.

**Résultat de l'essai :** en attente du retour de Hermann ; aucun résultat consigné. L'essai R-4.5-00 se jouera en ouverture de la recette de la phase B (voir Spec Change Log) ; ses attendus ont été mis à jour pour la phase B (le toucher simple consulte désormais le Média).

### Phase B — consultation au toucher, menu à l'appui long (AC1 à AC8)

**Besoin explicite (principe de Hermann du 2026-10-18) :** seuls Q27 (consultation des Médias dans l'Éditeur) et Q31 (toucher → consultation, appui long → menu contextuel natif) modifient le comportement PRE-3 de la tuile. Les options, leur ordre, leurs bornes, leurs effets, le titre du menu et les actions VoiceOver de PRE-3 sont conservés tels quels.

**Sources relues :** documentation versionnée SDK 57 d'`expo-video` (`useVideoPlayer` crée un lecteur libéré au démontage du composant ; `createVideoPlayer` impose `release()` ; `VideoView.enterFullscreen()` / `exitFullscreen()`, `onFullscreenExit`, `fullscreenOptions.enable`, `nativeControls` ; `statusChange` : `idle` / `loading` / `readyToPlay` / `error` ; `loop` vaut `false` par défaut) et types installés `expo-video` 57.0.5.

**Gestes (`ActivityMediaList.tsx`, `MediaTile`) :**
- Toucher (`onPress`) : consultation (photo ou vidéo).
- Appui long sur iOS, voie `"contextMenu"` : géré par le `ContextMenu` SwiftUI de la phase A. Le `Pressable` reçoit un `onLongPress` vide, pour que le relâché d'un appui long ne déclenche pas aussi `onPress` (pas de consultation à l'appui long).
- Appui long sur iOS, voie `"actionSheet"` (repli d'AD-17) : `onLongPress` ouvre la feuille d'actions existante.
- Appui long sur Android et web : `onLongPress` ouvre l'`Alert` existante.

**Repli :** il s'active par une seule ligne, `export const IOS_LONG_PRESS_MENU: IosLongPressMenu = "contextMenu"` → `"actionSheet"`. La prop interne `iosLongPressMenu` de `ActivityMediaList` sert uniquement aux tests du repli ; aucun appelant ne la passe.

**Vidéo (`MediaConsultation.tsx`, `VideoConsultation`) :**
- Le module `expo-video` est chargé à la première consultation, comme `VideoPoster.ts`. S'il est indisponible, la tuile affiche l'erreur locale.
- `useVideoPlayer(uri)` (sans boucle) n'est appelé qu'au montage de la consultation, donc au toucher. Aucun lecteur n'existe au montage de la galerie, au défilement ni à l'appui long.
- `VideoView` (contrôles natifs, plein écran autorisé, image dans l'image désactivée) est superposé à la tuile, sans toucher ni focus propres. Une fois `readyToPlay` atteint : `enterFullscreen()`, puis `play()`.
- `onFullscreenExit` met en pause et ferme ; le crochet libère le lecteur au démontage. Un `onFullscreenExit` reçu après démontage, ou pendant une sortie pour erreur, est ignoré (aucun `pause()` sur un lecteur libéré).
- Sont traités comme une erreur, en erreur locale sans exception : l'état `error`, 10 s de garde sans source prête (même borne que l'affiche), le refus de `enterFullscreen` et un `enterFullscreen` qui ne se résout pas en 10 s.
- Erreur avec plein écran ouvert : `exitFullscreen()` d'abord (attendu, au plus 10 s), puis seulement l'erreur locale. Erreur ou démontage pendant que `enterFullscreen()` est en cours : à sa résolution, sortie du plein écran au lieu de la lecture. Démontage avec plein écran ouvert (Éditeur quitté) : sortie du plein écran.
- Étapes suivies par `VideoPhase` (`waiting`, `entering`, `playing`, `closed`, `failed`).
- Typage : `require("expo-video") as typeof import("expo-video")` ; `tsc` vérifie les props de `VideoView` et les méthodes du lecteur. Le chargement paresseux ne rend pas l'Éditeur indépendant des modules natifs (`@expo/ui` y est importé statiquement) : il garde la galerie sans objet de lecture avant le toucher, et un module indisponible devient une erreur locale.
- `VideoPoster.ts` est inchangé.

**Photo (`PhotoConsultation`) :** `Modal` en `presentationStyle="fullScreen"`, image entière par `expo-image` (`contain`, libellée du Média), un seul bouton « Fermer » (icône `control-close`, cible `minTouchTarget`, soit 48 × 48). Ni zoom, ni geste, ni navigation entre Médias. Un `onError` d'`expo-image` produit l'erreur locale. À la fermeture, la présentation reste montée en `visible={false}` jusqu'à `onDismiss` (iOS), puis seulement la consultation est libérée et le focus rendu ; sur Android, dès la fermeture. Barre d'état claire (`StatusBar` `light-content`) pendant la présentation. Jetons réutilisés, sans nouveau jeton : `colors.snackbar` (fond), `colors.background` (✕ et voile d'erreur), `minTouchTarget`, `spacing[8]`, `spacing[12]`.

**Erreur locale (FR-21-58) :** le texte « Média indisponible. » (clé `media.unavailable`) s'affiche dans la tuile à la place du Média. Le badge « Vidéo » reste visible au-dessus du voile. Le texte est porté par `accessibilityValue` de la tuile et annoncé en file (`announceForAccessibilityWithOptions(…, { queue: true })`) APRÈS la fermeture du plein écran ou de la présentation et le retour du focus, pour qu'iOS ne perde pas l'annonce. Le lien n'est pas touché ; le menu reste disponible ; un nouveau toucher réessaie ; une fermeture normale efface l'erreur.

**Accessibilité :**
- L'activation (double toucher) consulte.
- Indications `videoHint` (« Lire la vidéo. Menu du média par appui long ou par les actions ») et `photoHint` (« Agrandir le média. Menu du média par appui long ou par les actions »), à valider par Hermann (H23, Q51 b). Elles ne listent aucune option, car celles-ci dépendent de la position (bornes exclues), et elles mentionnent les actions VoiceOver à côté de l'appui long. La clé `menuHint` est retirée.
- Les actions VoiceOver Retirer / Monter / Descendre sont inchangées.
- À la fermeture, le focus revient à la tuile par `AccessibilityInfo.sendAccessibilityEvent(tuile, "focus")` : photo, à `onDismiss` du `Modal` sur iOS et dès la fermeture sur Android ; vidéo, à `onFullscreenExit` (ou après la sortie pour erreur).
- La voie du menu (`nativeContextMenu`) est calculée au rendu de la tuile et réutilisée par les rappels ; `Platform.OS` n'est pas relu au moment de l'appui.

**Brouillon (AC4) :** la consultation est un état local de `MediaTile` ; aucun rappel du Brouillon, aucune écriture.

**Exécution (AC5) :** aucun module d'Exécution n'est créé, importé ni modifié. Un test relit les imports DIRECTS des deux fichiers ; limite nommée : il ne parcourt pas les dépendances transitives.

**Commentaire D-335 :** réécrit selon Q31.

**`mediaMenu.ts` :**
- Le geste devient `fireEvent(tuile, "longPress")`.
- Tuile rendue avec le menu contextuel (choix par la présence du `Host`, comme la tuile le décide au rendu) : **le geste natif n'est pas simulable sous Jest**. Le helper ne prouve donc pas l'ouverture du menu et ne peut pas détecter un menu qui ne s'ouvrirait pas. Il vérifie seulement que l'appui long côté React Native n'ouvre ni consultation, ni feuille d'actions, ni `Alert`, et il lit la configuration du menu dans `ContextMenu.Items` (titre de `Section`, `Button` choisis par `buttonPress`, `cancel` sans effet).
- Sinon, il intercepte la feuille d'actions (repli) ou l'`Alert`, comme avant.
- Les attendus des tests 4.4 sont inchangés et passent tels quels, y compris dans `ExerciseEditingPaths.integration.test.tsx`.

**Tests PRE-3 adaptés au seul changement de geste prescrit par Q31** (`ActivityMediaList.test.tsx`) :
- INTERACTION : sur iOS, le menu passe par `openMediaMenu` avec les mêmes titre, options et effet ; sur Android, l'`Alert` s'ouvre à l'appui long, avec les mêmes attendus.
- ACCESSIBILITY : l'indication attendue devient celle d'AC7.

**Tests 4.5 :**
- `ActivityMediaList.test.tsx` : AC1 ; AC2 (×3, dont le démontage pendant l'entrée en plein écran) ; AC3 (×2, dont la barre d'état) ; AC4 (×2, iOS et Android) ; AC5 ; AC6 (×5 : erreur avant l'entrée, refus et délai, photo, erreur après l'entrée, entrée jamais résolue) ; AC7 ; AC8 (×4, dont la vraie séquence Pressability `userEvent.longPress` dans les deux voies) ; AC9 (×3, câblage du menu).
  - Le lecteur `expo-video` y est simulé : `useVideoPlayer` au contrat du crochet, `VideoView` à `enterFullscreen` et `exitFullscreen` espionnés.
  - Le `Modal` y est le composant RÉEL de React Native, et non le simulacre du preset, qui rend `null` dès `visible={false}` sans jamais émettre `onDismiss`. Le retrait est produit par l'événement natif `dismiss` de `RCTModalHostView`, que le `Modal` traduit en `onDismiss` sur iOS.
- `ExerciseEditingPaths.integration.test.tsx` : `PRE4-4.5/AC4`. Brouillon MC modifié (nom, description, Paramètres par ✓, ordre des Médias), photo ouverte puis fermée : Brouillon identique champ par champ, état de `Terminer` identique, base relue identique.

**Rien de ceci ne prouve le rendu ni le comportement sur iPhone (NFR-04) :** R-4.5-00 à R-4.5-05.

**Points à juger sur iPhone, non vérifiables sous Jest :**
- l'entrée en plein écran depuis une vue superposée à une tuile hébergée dans le `ContextMenu` ;
- le délai entre le toucher et le plein écran, sans indicateur de chargement : la source locale est supposée prête rapidement ;
- l'absence de son après la fermeture ;
- le retour du focus.

## Spec Change Log

- 2026-10-18 — Ordre d'AC9 aménagé : phase B développée avant l'essai, à la demande de Hermann de poursuivre (2026-10-18) ; le menu contextuel reste à valider sur iPhone ; repli prêt. Partie figée inchangée.

## Review Triage Log

Revue du 2026-10-18 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V). Correctifs appliqués par l'implémenteur ; Q51 ouverte et frozen annotée (renégociation de l'ordre d'AC9) par Claude.

| Constat | Verdict | Route |
|---|---|---|
| B1/E6/E8/V3 — photo : `Modal` démonté, `onDismiss` jamais émis, focus non rendu ; test qui appelle `onDismiss` à la main | high | patch (monté invisible jusqu'à `onDismiss` ; `Modal` réel en test) |
| B2/E1/E3/V2 — erreur vidéo pendant ou après le plein écran : lecteur libéré trop tôt, plein écran orphelin | high | patch (machine d'étapes, sortie attendue, tests) |
| E2 — `enterFullscreen()` qui ne se résout jamais : tuile bloquée | medium | patch (garde de 10 s) |
| V1/E4 — appui long : relâché qui ouvrirait la consultation, non testé | medium | patch (`userEvent.longPress`) ; preuve sur appareil en R-4.5-00 |
| E5 — `Platform.OS` relu à l'appui | low | patch |
| B5/V-autre — helper : geste iOS non simulable, menu non détecté | low | patch (limite déclarée, absence de consultation vérifiée) |
| B7 — indications VoiceOver promettant des options absentes | medium | patch (textes sans liste d'options, Q51 b) |
| B8 — API `expo-video` non typée | medium | patch |
| B9 — test AC5 plus faible que son titre | low | patch (limite nommée) |
| B10/B11 — recette : chargement, fin de lecture, attendus manquants | low | patch |
| B12 — barre d'état, jetons réutilisés, balayage sans objet | low | patch |
| B13 — badge masqué par l'erreur, annonce perdue, erreur non effacée | low | patch |
| B3/B4 — frozen et notes périmées, `baseline_commit`, tâche AC9 cochée | low | patch (frozen annotée par Claude) |
| E9 — cible du bouton Fermer (48, pas 44) | low | patch (spec) |
| V4 — focus Android à la fermeture d'une photo | low | patch (assertion ajoutée) |
| B6 — doublon VoiceOver autour de l'enveloppe SwiftUI | low | defer (recette R-4.5-04, non simulable) |


## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
