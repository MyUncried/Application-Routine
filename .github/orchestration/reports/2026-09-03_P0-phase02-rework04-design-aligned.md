# Rapport de mission — Phase 2 Composition, correction alignée design REWORK04

TÂCHE
T01-S07/S08 — Composition d'une séance (roulette de durée, cartes limites, carte Tour), correction alignée sur la mission de design dédiée
Autorisation : `[ChatGPT] REWORK04 IMPLEMENTATION AUTHORIZED — DESIGN COMPLEMENTS REVIEWED` (remplace le gate `[ChatGPT] DEVICE NO-GO — PHASE02 REWORK04 INPUT REGISTERED / DESIGN GATE`, commentaire #5527890287)

STATUT
`PHASE02_REWORK04_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`

BRANCHE ET COMMIT DE DÉPART
`feat/creation-seance-catalogue`, HEAD `ba88c717147df32a3ccbf82b5b9a859b73ea3662` (vérifié propre et synchronisé avec `origin` par `git fetch` avant implémentation — précondition explicite de l'autorisation).

## Reprise — commentaires relus depuis le dernier checkpoint (`d606d66`)

Conformément à la règle de reprise cumulative de cette session, les **trois** commentaires publiés depuis mon dernier checkpoint (`d606d66`) ont été relus intégralement avant toute modification :

1. `[ChatGPT] DEVICE NO-GO — PHASE02 REWORK04 INPUT REGISTERED / DESIGN GATE` (registre initial R4-01…R4-12, `PHASE02_REWORK04_SPEC_PENDING`, stop gate explicite — ne pas coder avant l'autorisation dédiée).
2. `[ChatGPT] DESIGN COMPLEMENTS READY — COMPOSITION / DURATION PICKER` (mission de design pure, commit `ed84285`, rapport `2026-09-03_design-complements-composition-wheel.md`).
3. `[ChatGPT] REWORK04 IMPLEMENTATION AUTHORIZED — DESIGN COMPLEMENTS REVIEWED` (autorisation de code effective, registre R4 précisé avec dimensions et tokens Figma exacts).

Le rapport de design et les documents modifiés au commit de baseline (`b5b5dbc` : doc06, doc07/D-098/D-099, doc08, doc10, doc12) ont également été lus en entier avant implémentation.

## Périmètre demandé

Registre R4-01 à R4-12 (texte intégral dans le commentaire GitHub source), export et intégration de l'icône Tour canonique, garde-fou DSF (composant/token exact, lacune déclarée si absent), tests obligatoires listés dans l'autorisation.

## Périmètre réellement traité

L'intégralité du registre R4-01 à R4-12 a été traitée. Deux lacunes DSF restent explicitement déclarées (glyphes Annuler/Valider, icône `Icon / Structure / Movable` dédiée) — voir « Points non résolus ».

## Tension documentaire résolue — non silencieuse

**Hauteur de la roulette compacte.** Le paragraphe « Contrat complet du picker » de l'autorisation donne `toolbar 48` + `zone roue 196` (`244` total). `D-098` (`07 – Registre des décisions`, statut « Validée post-Figma », commit `b5b5dbc`, horodaté **après** l'autorisation — 21:47:38 UTC contre 22:01:51 UTC pour l'autorisation, donc rédigé avec ce commit déjà en préparation ou juste après) donne `40 + 150 = 190`.

Résolution appliquée, disclosed dans le code (`DurationWheelPicker.tsx`, tête de fichier) :
- **Cible tactile des actions** : les deux sources s'accordent sur `48×48` — obtenue via `hitSlop` autour d'un cercle visuel `28×28` dans une rangée de hauteur **visuelle** `40` (`D-098`). Ce rapprochement élimine la contradiction apparente entre `40` et `48` : ce ne sont pas deux mesures concurrentes de la même chose.
- **Zone roue** : aucun rapprochement équivalent n'existe entre `150` et `196`. `150` (`D-098`, rang de préséance le plus élevé selon `docs/INDEX.md` §6, et commit le plus récent) est retenu, appliqué en **`minHeight`** (pas une hauteur figée) pour ne pas reproduire le défaut `D-04` déjà corrigé au cycle précédent (contrainte de hauteur causant un écrêtage).

Ce point reste `NON_VERIFIABLE_DEVICE` — seule une capture réelle tranchera si `150` est visuellement suffisant.

## Corrections livrées (registre R4)

| ID | Source Figma | Composant/token DSF | Fichier(s) modifié(s) | Correction | Test | Preuve | Statut |
|---|---|---|---|---|---|---|---|
| R4-01 | Composition `2028:11153` | `color/text-primary` | — | **Déjà conforme** : `nameInput.color` était déjà `colors.textPrimary` avant cette mission (`CompositionScreen.tsx`) — aucune modification nécessaire, verrouillé par un nouveau test explicite. | `CompositionScreen.test.tsx` — describe REWORK04, test R4-01 | PASS | CONFORME (préexistant) |
| R4-02 | `Action / Back`, `2624:3105` | `dimensions.backAction` (nouveau : `visualCircle=28`, `chevron=14`) | `tokens.ts`, `ScreenShell.tsx`, `KodjoIcon.tsx` | Cible tactile `48×48` inchangée (`hitSlop`), cercle visuel réduit `48→28`, chevron réduit `24→14`. Composant unique déjà partagé (`FixedHeader`), aucune variante locale créée. | `ScreenShell.test.tsx` | PASS | CONFORME (JS) |
| R4-03 | DSF `2537:1475` | `type.compactCardTitle` (complété `13/18→14/18`), `type.caption` (complété `11/16→11/14`) — tokens existants mais jamais consommés, complétés au lieu de dupliqués (garde-fou DSF) | `tokens.ts`, `CompositionScreen.tsx` | Titres de carte (`rowLabel`, `tourCardLabel`) et sous-libellé (`boundaryRowSecondaryLine`) basculés sur ces styles. | `CompositionScreen.test.tsx` — R4-03 ×2 | PASS | CONFORME (JS) |
| R4-04 | DSF `2537:1475`, propriété `Structure icon` | `composition-reorder` (affichage `16×16→20×20`, même master vectoriel) ; slot `24×24→28×28` | `KodjoIcon.tsx`, `CompositionScreen.tsx` | Slot et icône agrandis. **Lacune DSF déclarée** : aucun export téléchargeable de `Icon / Structure / Movable` (`3066:4676`, mentionné par la mission de design) n'a été fourni avec une URL dans cette autorisation — le master existant (`composition-reorder.svg`) est réutilisé à taille d'affichage augmentée, pas redessiné. | `CompositionScreen.test.tsx` — R4-04 | PASS | PARTIELLEMENT CONFORME (géométrie oui, asset dédié non fourni) |
| R4-05 | Mission de design §8 | — | `wheelPickerMath.ts` + tests | Pas des secondes `5→1` (`00…59`). `WHEEL_SECONDS_STEP=1`, `WHEEL_SECONDS_ITEM_COUNT=60`, `WHEEL_SECONDS_MAX_INDEX=59`. | `wheelPickerMath.test.ts`, `DurationWheelPicker.test.tsx` | PASS | CONFORME |
| R4-06 | mini-design `3067:4809` | cadre de sélection natif seul | `DurationWheelPicker.tsx` | Déjà conforme depuis `REWORK03` (W-04) — aucune bande superposée n'existe plus dans ce fichier. Reconduit, testé de nouveau. | `DurationWheelPicker.test.tsx` — W-04 | PASS | CONFORME |
| R4-07 | mini-design `3067:4809` | `frame()`/`padding()` (`@expo/ui/swift-ui/modifiers`) | `DurationWheelPicker.tsx` | Largeurs canoniques exactes : minutes `76`, unité `min` `32`, intervalle central `22`, secondes `76`, unité `s` `20`, écart chiffre/unité `4`. Remplace le calcul dynamique (`useWindowDimensions`) du cycle précédent, devenu inutile. Unités en gras `14pt`. | `DurationWheelPicker.test.tsx` — géométrie R4-07 | PASS | CONFORME (JS) |
| R4-08 | Mission de design §1 | — | `DurationWheelPicker.tsx` | Le mécanisme `onRequestClose`/`nativeCloseTapArea` du cycle précédent (tap sur le cadre = fermeture/commit) est **supprimé** — un tap sur un chiffre ou la zone de sélection ne fait plus que positionner la valeur (brouillon), jamais fermer. | `DurationWheelPicker.test.tsx` — R4-08 | PASS | CONFORME |
| R4-09 | Mission de design §1-7 | `Picker / Popover — Source exact`, variante `Type=Duration` | `DurationWheelPicker.tsx`, `CompositionScreen.tsx`, `ExerciseScreen.tsx`, `fr.ts` (×2) | Toolbar Annuler(croix)/Valider(coche) ajoutée, en haut. Contrat de props remplacé : `onChange`→`onValidate`+`onCancel` (changement cassant, propagé à tous les appelants, y compris `ExerciseScreen.tsx` — nécessité mécanique de compilation, aucune autre modification de cet écran). Validate commit puis ferme ; Cancel ferme sans committer. Indépendance Initial/Final et restauration à la réouverture conservées (héritées de `REWORK02`). | `DurationWheelPicker.test.tsx`, `CompositionScreen.test.tsx` | PASS | CONFORME (JS) — **glyphes croix/coche en Unicode, lacune DSF déclarée (voir ci-dessous)** |
| R4-10 | DSF `3067:270` | contrôle Tour partagé | `CompositionScreen.tsx` | Contrôle réduit `36×36→28×28`, fond `colors.selection` (`#5F60EE`), chevron blanc redimensionné (`KodjoIcon`'s nouveau prop `size`, `24→12`) pour tenir dans le carré plus compact. | `CompositionScreen.test.tsx` — CMP-04/T-04 (resserré) | PASS | CONFORME (JS) |
| R4-11 | `Icon / Tour`, `3066:4685` | `icon.tour` (manifeste) | `assets/icons/icon-tour.svg` (nouveau), `manifest.json`, `KodjoIcon.tsx`, `CompositionScreen.tsx` | **Icône Tour intégrée** — octets exacts téléchargés depuis l'URL d'export fournie par l'autorisation (`https://www.figma.com/api/mcp/asset/229f5952-…svg`), vérifiés identiques byte-à-byte (949 octets, `diff` sans écart hors fin de ligne), jamais redessinés. Rendue dans le slot icône de la carte Tour. | `CompositionScreen.test.tsx` — R4-11 | PASS | **CONFORME — blocage T-02/REWORK02/03 fermé** |
| R4-12 | DSF `3067:270` | `dimensions.compositionTourSection` (nouveau) | `tokens.ts`, `CompositionScreen.tsx` | Conteneur Tour (`374`) désormais plus large que la carte interne (`354`, inset `10`/côté) — `marginHorizontal: -10` fait déborder le conteneur du padding de `body` (`24`), dérivant `374` sur le canevas de référence sans constante codée en dur. **Inverse explicitement `T-01`** (qui avait unifié la largeur de Tour avec les cartes limites) — la géométrie de BOÎTE (padding/bordure/rayon) reste, elle, unifiée via `limitCardBase`. | `CompositionScreen.test.tsx` — R4-12 | PASS | CONFORME (JS) |

## Preuves et tests

```
commande : npx tsc --noEmit
résultat : PASS (aucune sortie)

commande : npx eslint .
résultat : PASS (aucune sortie)

commande : npx jest --maxWorkers=2
résultat : PASS — 37 suites, 474 tests, 0 échec
```

Détail des tests ajoutés/modifiés ce cycle :
- `wheelPickerMath.test.ts` : réécrit pour le pas de `1` (identité index=valeur, bornes `0…59`).
- `DurationWheelPicker.test.tsx` : réécrit intégralement pour le nouveau contrat `onValidate`/`onCancel` (35 tests) + geométrie R4-07 + toolbar R4-09.
- `CompositionScreen.test.tsx` : 2 tests réécrits (Validate remplace le re-appui sur la ligne), 1 nouveau test (Annuler ne commit jamais), 6 nouveaux tests REWORK04 (R4-01/03×2/04/11/12), 1 test resserré (contrôle Tour `28×28` exact).
- `ScreenShell.test.tsx` : test Retour réécrit pour `28×28`+`hitSlop`.
- `compositionPresentation.test.ts` : 3 assertions mises à jour (`:55`→`:59`, pas de 1).
- `src/shared/i18n/index.test.ts` : 2 assertions étendues (`cancelAccessibilityLabel`/`validateAccessibilityLabel`).

## Hypothèses non démontrées

- **Zone roue `minHeight:150`** : hauteur canonique `D-098` appliquée comme plancher — le rendu natif réel (nombre de lignes visibles, dépassement éventuel) n'est pas mesurable sans device.
- **Largeurs de colonne R4-07** (`76`/`32`/`22`/`76`/`20`/`4`) : appliquées via `frame()`/`padding()` SwiftUI — leur rendu pixel-exact sur un `Picker(style: .wheel)` réel n'est pas vérifiable en environnement Jest.
- **Interaction tactile de la toolbar** : le `hitSlop` de `10pt` étendant les cercles `28×28` à une cible `48×48` n'a jamais été vérifié sur device — comportement standard React Native, cohérent avec le patron déjà établi (`addActivityAction`), mais non mesuré ici.
- **Tension `40+150` vs `48+196`** : résolue par précédence documentaire (voir section dédiée ci-dessus) — reste `NON_VERIFIABLE_DEVICE` tant qu'une capture réelle n'a pas confirmé laquelle des deux hauteurs correspond au rendu Figma/natif voulu.

## Modifications réalisées

Fichiers applicatifs modifiés :
- `assets/icons/icon-tour.svg` (nouveau)
- `assets/icons/manifest.json`
- `src/features/sessions/CompositionScreen.tsx`
- `src/features/sessions/DurationWheelPicker.tsx`
- `src/features/sessions/ExerciseScreen.tsx` (câblage mécanique du nouveau contrat de props uniquement — aucune autre modification)
- `src/features/sessions/wheelPickerMath.ts`
- `src/shared/i18n/resources/fr.ts`
- `src/shared/ui/KodjoIcon.tsx`
- `src/shared/ui/ScreenShell.tsx`
- `src/shared/ui/tokens.ts`

Fichiers de test modifiés :
- `src/features/sessions/__tests__/CompositionScreen.test.tsx`
- `src/features/sessions/__tests__/DurationWheelPicker.test.tsx`
- `src/features/sessions/__tests__/compositionPresentation.test.ts`
- `src/features/sessions/__tests__/wheelPickerMath.test.ts`
- `src/shared/i18n/index.test.ts`
- `src/shared/ui/__tests__/ScreenShell.test.tsx`

## Éléments non corrigés ou hors périmètre

- **Glyphes Annuler/Valider (R4-09)** : rendus en caractères Unicode (`✕`, `✓`) plutôt qu'un export SVG dédié — aucune URL d'export n'a été fournie pour ces deux glyphes dans cette autorisation (contrairement à l'icône Tour, R4-11, qui en avait une). Lacune DSF déclarée, pas un défaut silencieux — voir « Points non résolus ».
- **`Icon / Structure / Movable` (`3066:4676`)** : aucun export dédié fourni ; le master existant (`composition-reorder.svg`, `2537:1456`) est réutilisé à taille d'affichage augmentée (`20×20`).
- `ExerciseScreen.tsx` : uniquement le câblage mécanique du nouveau contrat de props (`onValidate`/`onCancel`), rendu obligatoire par le changement d'API du composant partagé — aucune autre modification (géométrie, comportement propre à cet écran) n'a été apportée, conformément à l'exclusion explicite de cette revue.
- Catalogue, Calendrier, Suivi, Profil : non modifiés.
- Écran « Ajouter une activité » (Exercice) au-delà du câblage mécanique ci-dessus, et tout écran suivant : non entamés.

## Vérifications restant à effectuer sur appareil réel

1. Roulette ouverte (Compte à rebours et Fin de séance) : toolbar Annuler/Valider en haut, colonnes minutes/secondes aux largeurs `76`/`76`, unités `min`/`s` en gras rapprochées de leur colonne, secondes `00…59` sans saut, un seul cadre gris natif.
2. Tap sur un chiffre ou la zone de sélection : ne ferme jamais, positionne seulement.
3. Annuler : ferme sans modifier la valeur affichée sur la ligne. Valider : ferme et affiche exactement la valeur centrée.
4. Cartes Compte à rebours/Fin de séance : titre plus gras/grand, slot structure `28×28` avec icône `20×20` visible.
5. Carte Tour : icône Tour canonique visible, contrôle carré violet `28×28` avec chevron blanc lisible malgré la réduction, conteneur visuellement plus large que les cartes limites.
6. Retour : cercle visuellement plus petit, cible tactile toujours confortable.
7. Captures requises : roulette Compte à rebours ouverte (toolbar visible), roulette Fin de séance ouverte, Composition fermée (cartes + Tour + Retour), Annuler et Valider en action.

Les tests Jest ne constituent pas une preuve de fluidité, de centrage ou d'alignement natifs, ni de lisibilité des glyphes Unicode de la toolbar : une vérification finale sur iPhone réel reste obligatoire avant toute clôture.

## Points non résolus

1. **Glyphes Annuler/Valider (R4-09)** — aucun export SVG fourni cette fois-ci (contrairement à l'icône Tour). Rendus en Unicode (`✕`/`✓`), pas un tracé inventé ni un pictogramme détourné, mais un état intérimaire explicitement déclaré. Nécessite soit une URL d'export Figma (comme celle fournie pour l'icône Tour), soit une confirmation que le rendu Unicode est acceptable.
2. **`Icon / Structure / Movable` dédiée (`3066:4676`)** — le master existant (`composition-reorder.svg`) reste réutilisé à taille augmentée ; aucun export dédié téléchargé ce cycle.
3. **Tension documentaire `40+150` vs `48+196`** (voir section dédiée) — résolue par précédence, non confirmée contre un rendu réel.

## Fichiers modifiés

Voir « Modifications réalisées » ci-dessus (liste exhaustive, 15 fichiers + 1 asset).

## Commit final

Code applicatif et ce rapport committés séparément (voir état Git ci-dessous et le commentaire de transition GitHub pour les hash exacts, publiés après ce commit).

## État Git

Branche `feat/creation-seance-catalogue`. Avant implémentation : HEAD local `ba88c717147df32a3ccbf82b5b9a859b73ea3662`, identique à `origin` (`git fetch` vérifié), worktree propre. Après cette mission : voir le commentaire de transition GitHub pour les hash finaux.

## Self-check Claude

- `tsc --noEmit` : PASS. `eslint .` : PASS. `jest --maxWorkers=2` : PASS, 474/474, 0 échec, 0 ignoré.
- Les trois commentaires publiés depuis le dernier checkpoint (`d606d66`) ont été relus intégralement avant modification, dans l'ordre chronologique.
- Registre R4-01 à R4-12 entièrement traité, chacun statué explicitement ci-dessus avec source Figma, token/composant, fichiers, test et preuve.
- Aucune commande Git destructive (`reset`, `rebase`, `force-push`) exécutée.
- Icône Tour canonique intégrée avec vérification byte-à-byte contre l'export fourni — blocage T-02/REWORK02/03 fermé.
- Deux lacunes DSF restent explicitement déclarées (glyphes Annuler/Valider, icône structure dédiée) — escaladées, pas reconduites silencieusement.
- Écran Exercice : uniquement le câblage mécanique nécessaire à la compilation du nouveau contrat de props partagé ; aucune autre modification.
- Catalogue, Calendrier, Suivi, Profil : non modifiés. Écran suivant : non entamé.
