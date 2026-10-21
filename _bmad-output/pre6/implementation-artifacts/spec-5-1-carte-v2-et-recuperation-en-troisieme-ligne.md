---
title: 'Story 5.1 — Carte v2 et récupération en troisième ligne'
type: 'feature'
created: '2026-10-21'
status: 'done'
baseline_commit: '445457c8'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La carte d'occurrence de la Composition ne suit plus le rendu Figma du 21/10/2026 (D-435) : deux lignes, poignée visible, pas de média, récupération sur une rangée séparée sous la carte avec un trait.

**Approach:** Adapter `OccurrenceCard` en carte v2 à trois lignes avec média intégré, et intégrer la récupération contextuelle à la troisième ligne en réutilisant `ActivityRecoveryLine` (toucher, appui long, accessibilité) ; supprimer la rangée séparée et la poignée. Aucun changement de donnée, de calcul ni de geste.

## Boundaries & Constraints

**Always:**
- Sources : D-435 (ch07 L8-13), CE-T03-08 (ch13 L1434-1510, notamment L1478 et L1480), ch08 « Présentation des occurrences — révision du 21/10/2026 », DSF-CARTES L124-136. Figma (rendu seulement) : composant v2 `9798:44464` et variantes, instances `8328:28605` (hors Circuit `9798:19935`, dans le Circuit `9819:19961`).
- Rendu à la largeur 402 : carte 370 × 80 (marges 16 de part et d'autre de l'écran), rayon 12, fond blanc ; bord 1 `#E4E7EF` hors Circuit, aucun bord dans le Circuit ; padding 8 à gauche, 12 à droite ; média 64 × 64 (rayon 12, bord 1 `#7A7A80`, fond `#EEF0F6`, icône générique centrée de `9798:19907`, variante Circuit `9819:19963`), écart 12 avant le texte.
  - Ligne 1 : nom Inter Semi Bold 15 `#141414`, ellipse ; icône de changement de côté à droite (existante si identique à `9798:19925`), absente si non bilatéral (ARB-2).
  - Ligne 2 : pastille Catégorie 13 (`9798:19913`) + libellé Catégorie Regular 12 `#7A7A80` (ellipse) ; symbole de durée 13 (`9798:19927`) dans la colonne des symboles ; synthèse de travail Regular 12 `#7A7A80` calée à droite (« 10 rép. / 1 min » tient sur cette ligne).
  - Ligne 3 : pastille Zone 13 (`9798:19919`) + Zones Regular 12 `#7A7A80` (coupées avant la colonne) ; sablier 13 (réutiliser `recovery.hourglass` s'il est identique à `9798:19932`) + valeur de récupération sans préfixe, calée à droite.
  - Écarts verticaux et positions des colonnes relevés dans Figma ; colonnes exprimées par rapport à la largeur utile et au bord droit (pas de x absolu d'exemple), valables à 360, 402 et 440 ; aucune superposition texte / symboles.
- Récupération (ch08, ch10 L599 PR #391) : positive → sablier + valeur ; absente ou à 0 → ni sablier ni valeur (choix D2 de l'epic) ; la donnée et ses calculs ne changent pas. Toucher la récupération ouvre la roulette existante (story 4.2) sans ouvrir l'Exercice ; appui long → bulle « Retirer la récupération » ancrée sur la récupération ; actions accessibles existantes conservées ; cible tactile ≥ 44 limitée au sablier et à la valeur (choix D7), jamais la ligne entière.
- Plus de rangée de récupération sous la carte ni de trait de démarcation (choix D1). Le point d'arrêt hors placement garde provisoirement son rendu actuel, sur une rangée sous la carte, sans trait (refonte en story 5.2) ; le placement (story 4.1) reste fonctionnel tel quel (refonte en story 5.3).
- Plus de poignée ; appui long sur toute la carte ; glisser (dont l'animation 2.3b et le calcul de hauteur des blocs), balayage, Dupliquer, Supprimer inchangés ; la récupération suit l'occurrence.
- Catégorie et Zones depuis les propriétés structurées existantes (`resolveOccurrenceCategory`, `formatExerciseBodyZones`), jamais par découpage d'une chaîne.
- Couleurs Figma absentes du registre ch12 : constantes locales nommées citant DSF/ch13 (choix D5) ; `#7A7A80` correspond à `textTertiary` de ch12 L1010 : réutiliser un jeton s'il existe. Ne modifier aucune valeur existante de `tokens.ts`. Icônes nouvelles exportées en lecture seule depuis Figma (MCP `download_assets` ou asset de `get_design_context`), déclarées dans `assets/icons/manifest.json` selon le patron existant.
- Les cartes hors Composition (Catalogue, sélection) ne changent pas.

**Never:**
- Nouvelle fonctionnalité ; ouvrir l'éditeur d'Exercice au toucher de la récupération ; modifier le défaut Profil ; afficher une photo d'occurrence ; afficher une Pause intrinsèque.
- Modifier modèle, repositories, calculs, formats, `migration001.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Hors Circuit | occurrence BEFORE_TOUR | carte v2 avec bord | — |
| Dans le Circuit | IN_TOUR | carte v2 sans bord | — |
| R positive | 20 s | sablier + « 20 s » en ligne 3 | — |
| R = 0 / absente | — | ligne 3 sans sablier ni valeur | — |
| Toucher R | R = 20 | roulette ; Exercice non ouvert | — |
| Appui long R | — | bulle Retirer | — |
| Bilatéral | sideMode bilatéral | icône de côté ligne 1 | — |
| Répétitions + cadence | 10 rép. / 1 min | ligne 2 seule | — |
| Séries variables / À l'échec | — | synthèse existante, ellipse à droite | — |
| Nom et Zones longs | 360 de large | ellipses, aucun chevauchement | — |
| Glisser / balayage | — | inchangés, sans poignée | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/OccurrenceCard.tsx` -- carte d'occurrence (lignes, poignée, styles).
- `src/features/sessions/ActivityRecoveryLine.tsx` -- récupération (toucher, appui long, accessibilité, point d'arrêt hors placement).
- `src/features/sessions/CompositionScreen.tsx` -- montage de la carte et de la ligne (~L2890-3130), `blockHeightFor`, styles de rangée, ancrage de la bulle (`measureAnchor`), mesure des hauteurs pour le glisser.
- `src/features/sessions/compositionPresentation.ts` -- format de la synthèse et de la récupération.
- `assets/icons/manifest.json`, `src/shared/ui/KodjoIcon*` -- icônes.
- Tests : `CompositionScreen.test.tsx` (poignée, surface, contenu de carte, ligne de récupération, hauteurs), `OccurrenceCard` / `ActivityRecoveryLine` tests, `CompositionPausesFlow.integration.test.tsx`.

## Tasks & Acceptance

**Execution:**
- [x] Icônes (média, pastilles, durée) exportées et déclarées.
- [x] Carte v2 (3 lignes, média, bord selon la zone, largeurs adaptatives, sans poignée) + tests.
- [x] Récupération en ligne 3 (toucher, appui long, bulle, accessibilité), suppression de la rangée et du trait + tests.
- [x] Hauteurs de bloc pour le glisser (story 2.3b) recalées sur la carte v2 + tests existants verts.

**Acceptance Criteria:**
- Given la suite complète, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert ; les attentes de test modifiées ne le sont que là où D-435 change le rendu.
- Given un iPhone, when on ouvre la Composition, then les cartes suivent `8328:28605` (vérification Hermann, J4).

## Implementation Notes

- **Figma (lecture seule, 21/10/2026).** `get_design_context` / `get_metadata` de `9798:44464` (variantes `9798:19935`, `9798:44368`, `9808:19905`), `9819:19961` et `8328:28605`. Mesures retenues (carte 370) : média x 9 (bord 1 + 8), texte x 85, cadre de texte 58 à y 11 (nom 18, écart 5, ligne 2 de 16, écart 2, ligne 3 de 17 dont 2 en haut), symboles x 266, bord des valeurs x 362 avec ou sans bord (8 du bord extérieur), icône de côté 16 à y 11 calée sur le même bord. « 10 rép. / 1 min » mesure 79 : la colonne des valeurs doit pouvoir dépasser 77.
- **Icônes exportées** (`get_design_context` de `9798:19935`, attributs racine retirés, identifiant de groupe décodé ; `MCP_VECTOR_EXPORT`) : `icon-nature-exercice` (`9798:19907`, octets identiques à la variante Circuit `9819:19963`), `icon-pastille-categorie` (`9798:19913`), `icon-pastille-zone-corporelle` (`9798:19919`), `icon-symbole-duree` (`9798:19927`), `icon-sablier-recuperation-v2` (`9798:19932` : tracé plus grand que `recovery.hourglass` `8328:41087`, non réutilisé), `icon-changement-de-cote-v2` (`9798:19925` : même tracé que `side.change`, rempli `#7A7A80` au lieu de `#9499A8` ; la carte de sélection garde l'ancien). Clés `KodjoIcon` : `card-*`.
- **Disposition.** Colonnes en flux : libellés `flex: 1` ; symboles et valeurs `minWidth: "35%"` (96 / 277 à 402), `maxWidth: "60%"`, largeur réelle donnée par la valeur la plus longue, symboles alignés d'une ligne à l'autre ; aucun positionnement absolu. Synthèse, séparateur « / » et durée estimée en textes distincts (la durée estimée garde son format « ≈ … »).
- **Récupération.** `OccurrenceRecovery` (exporté de `ActivityRecoveryLine.tsx`) reprend le contrôle de la story 4.2 en ligne 3 ; `ActivityRecoveryLine` ne porte plus que le point d’arrêt, sans trait. Affichée seulement si `isDisplayableRecovery` (nombre fini > 0 ; NaN, ∞, 0 et absence : rien). Toucher et appui long seulement carte au repos : ni actions révélées, ni carte bloquée par une autre révélation, ni glisser, ni placement. En placement, la ligne 3 montre la valeur effective du sous-brouillon (`recoveryChanges` puis `recoveries`, puis la donnée), sans interaction.
- **Cible tactile (revue 5.1, écart au choix D7, à soumettre à Hermann à J4).** `occurrenceRecoveryHitSlop(bordered)`, calculée depuis les constantes exportées par `OccurrenceCard` (`OCCURRENCE_CARD_TEXT_FRAME`, hauteur, bord) : haut 4 (écart 2 entre les lignes + 2 de marge haute de la ligne 3, la ligne 2 n’est jamais couverte), bas jusqu’au bord intérieur de la carte (10 avec bord, 11 sans), aucune marge latérale. Hauteur obtenue 29 (30 dans le Circuit) au lieu de 44 : 44 n’est pas atteignable sans couvrir la ligne 2 (dont le toucher ouvre l’Exercice et l’appui long engage le glisser). Horizontalement, le `Pressable` occupe la colonne des valeurs (sablier sous le symbole de durée, valeur calée à droite) : `alignSelf: flex-end` demandé par la revue aurait sorti le sablier de la colonne des symboles (Figma x 266, ch13 « symboles x282 ») ; la cible ne contient que le sablier, la valeur et l’espace vide entre eux, jamais les Zones. Point à arbitrer.
- **Accessibilité.** Le contrôle imbriqué est retiré de l’accessibilité (`accessible={false}`, `importantForAccessibility="no"`) : VoiceOver ne traverse pas la carte et TalkBack l’aurait exposé deux fois. La carte porte « …, récupération {durée} » dans son nom (hors placement et en placement, valeur effective) et, quand R > 0 hors placement, les actions « Modifier la récupération » (texte nouveau, `composition.pauses.modifyRecovery`) et « Retirer la récupération ».
- **Focus après retrait.** Récupération retirée (bulle ou action de la carte) : focus à la carte (`cardOnly`), jamais au point voisin. Point retiré : au point s’il en reste un sur la rangée — impossible aujourd’hui, un seul point par emplacement —, sinon à la carte.
- **Ligne 2.** La durée estimée s’abrège d’abord (`flexShrink` 1000), la synthèse ensuite (1) ; le séparateur ne se réduit pas.
- **Carte soulevée dans le Circuit.** Le bord revient ; les marges le compensent (média et valeurs à la même distance du bord extérieur).
- **Hauteur prédite.** `occurrenceCardHeight()` n’a plus de paramètre ; `predictedInsertionHeight` est exportée en forme pure (hauteur mesurée et `cardHeightOf` injectés) et testée avec un écart non nul (64 / 70).
- **Points soumis à Hermann à J4 (non traités ici, à sa demande de revue).** Format « ≈ » de la durée estimée (Figma « 10 rép. / 1 min ») ; pastille de Catégorie grise selon Figma (couleur de Catégorie absente de la carte) ; écart vertical nom → ligne 2 de 5 (Figma) contre 8 (DSF-CARTES L128) ; texte « Modifier la récupération » ; cible de récupération à 29 au lieu de 44 (D7) ; occupation horizontale de la cible (colonne des valeurs) ; format « 1 min 30 s » (Figma « 1 min 30 »).
- **Écart assumé.** La carte occupe la colonne actuelle des étapes : la largeur 370 à x 16 demande le rail sur le média et le débord du Circuit (story 5.2) ; consigné dans `deferred-work.md`, comme le retrait de `composition-reorder` et de `dimensions.structureMovableIcon`, devenus orphelins (jetons verrouillés, non retirés).

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | blind + edge + verification-gap | Cible de la récupération (marge haute 17) recouvrant la synthèse de la ligne 2 : toucher ou appui long détournés | high | patch : marge haute 4, bas jusqu'au bord intérieur, constantes exportées ; test géométrique. Hauteur 29 au lieu de 44 (D7) : J4. |
| 2 | blind + edge | Récupération active avec actions révélées | medium | patch : inactive (révélé, autre carte révélée, glisser, placement) ; tests. |
| 3 | blind + edge | Placement : valeur de la carte contraire à la puce | medium | patch : valeur effective du sous-brouillon, sans interaction ; test. |
| 4 | blind + edge | VoiceOver n'annonce plus la récupération ; double exposition TalkBack ; focus après retrait sur le point | medium | patch : « récupération {durée} » dans le nom de la carte, contrôle imbriqué non accessible, focus sur la carte ; tests. |
| 5 | blind + edge | Ligne 2 : la synthèse se réduit avant la durée estimée | medium | patch : priorité de réduction ; tests Séries variables et À l'échec. |
| 6 | edge | Valeur non finie affichée | low | patch : `isDisplayableRecovery` ; test NaN. |
| 7 | blind + edge | Carte soulevée dans le Circuit décalée de 1 | low | patch : compensation du bord ; test. |
| 8 | blind + verification-gap | Code mort, tests toujours vrais, `predictedInsertionHeight` sans garde-fou | low | patch : nettoyage ; forme pure testée avec écart non nul. |
| 9 | verification-gap | Cible étirée sur la colonne des valeurs (pas `flex-end`) | low, rejeté | Le sablier reste sous le symbole de durée (Figma, ch13 « symboles x282 ») ; la cible ne couvre ni Zones ni ligne 2. J4. |
| 10 | edge | Dynamic Type sur hauteurs fixes | low, différé | `deferred-work.md` ; aucun écran ne le gère aujourd'hui. |
| 11 | blind | Repère du rail non recalé sur la carte de 80 | low, différé | Story 5.2. |
| 12 | verification-gap | Colonnes réelles à 360/402/440, non-propagation native du toucher | — | Appareil, J4. |
| 13 | verification-gap | « ≈ 1 min », pastille grise, écart 5 contre 8, texte « Modifier la récupération », format « 1 min 30 s » | — | Soumis à Hermann (J4). |

## Verification

**Commands:**
- `npx jest src/features/sessions --maxWorkers=2` -- expected: vert.
- `npm test -- --maxWorkers=2` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
