---
title: 'B.3 — Changement de côté et barre du clavier (B5, B9)'
type: 'feature'
created: '2026-10-24'
status: 'done'
baseline_commit: '832e61ab4142312c5efc6e467524a417fb18e89f'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/implementation-artifacts/epic-B-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le choix de l'Enchainement (option Avec sélectionnée du Changement de côté) passe par le menu natif SwiftUI (`SideOrderMenu`, `Host` + `RNHostView matchContents`), dont l'hôte, dimensionné sur son contenu, laisse la notation déborder de l'option après fermeture et réouverture de la Feuille (B5). La barre du clavier n'a ni emplacements stables ni boutons dessinés (B9). D-447 (ch07 l.73-85), annotations D-447 de D-431 (l.117) et D-434 (l.134), CE-UI-10 (ch13 l.1112, l.1227).

**Approach:** Présentation seule. B5 : déroulant Figma `9462:18987` (deux rangées de 44, ancré sur l'option, chevron) construit sur `AnchoredPanel`, ouvert par un déclencheur React Native de taille fixe dans l'option ; menu natif, `Alert` et hôte SwiftUI supprimés. B9 : `KeyboardAccessoryBar` en quatre emplacements égaux, boutons arrondis, Fermer bleu KODJO ; mécanisme RC-1 inchangé.

## Boundaries & Constraints

**Always:** notations D-431 (`sideOrderSubtitles`) et noms accessibles neutres (`sideOrders`, D-407) ; RC-13 (notation seulement si Avec sélectionné à N > 1, option de 146) ; une seule surface ouverte (`sheetSurfaceReducer`) ; toucher extérieur ou échappement VoiceOver ferment sans changer ; barre rendue par la Feuille au-dessus du clavier natif (RC-1), focus, ordre et navigation (D-434, `keyboardFieldOrder`) inchangés ; règle D-434 libellés / flèches seules selon la largeur ; jetons existants, constantes locales documentées.

**Never:** modifier `tokens.ts`, `app.json`, `package.json`, `.github/`, le domaine, `@expo/ui` (dépendance conservée) ; `InputAccessoryView` ou clavier personnalisé ; Droite / Gauche ; affaiblir un test (garde-fous zéro `ScrollView` iOS) ; toucher B1–B4, B6–B8, B10.

**Arbitrages (Hermann absent, option la plus conservatrice, à confirmer en recette JB) :**
- A1 (largeur) : Figma `9462:18987` mesure 144, largeur de l'option Avec sous RC-6 (`SegmentedControl.tsx:106-118`) ; RC-12 / RC-13 (ch07 l.113-115), maintenues par D-447, la portent à 146. Le déroulant prend la largeur de l'option (146 × 88) pour la recouvrir exactement (« ancré sur l'option ») ; aligné sur son bord gauche et son bord haut (Figma : x 3, y 3 dans le segmenté). Alternative : 144 strict, laissant 2 px de l'option visibles à droite.
- A2 (ordre) : rangées dans l'ordre D-431 (« dans cet ordre », ch07 l.109) : `BY_SIDE` puis `BY_SERIES` ; la notation choisie en violet (`colors.selection`, texte blanc Semi Bold 10), l'autre sur `colors.surface` (`#4A4A52`, Regular 10) ; chevron vers le haut dans la première rangée. Figma ne montre que `BY_SIDE` choisi ; alternative : choisie toujours en première rangée.
- A3 (plates-formes) : le déroulant vaut sur toutes les plates-formes (composant React Native) ; l'`Alert` hors iOS disparaît avec le menu natif.
- A4 (barre) : fond de barre conservé (`#E6E9ED`, constante existante, relevé `9292:18077`) ; boutons sur `colors.background` (blanc, fond des touches iOS clair), rayon local 8 ; texte des autres boutons inchangé (`#5C4DFF`) ; Fermer `colors.primary`, texte `colors.background` ; emplacement réservé vide, non accessible, quand « À l'échec » ne s'applique pas ; flèches seules quand le libellé le plus large de Précédent / Suivant ne tient pas dans un emplacement.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Ouverture | Avec, N > 1, `BY_SIDE` | appui sur l'option → déroulant 146 × 88, rôle menu, deux rangées | — |
| Choix | déroulant ouvert, appui `BY_SERIES` | `setSideOrder`, fermeture, option « (D1 → G1) ➜ (D2 → G2) » | — |
| Même choix / extérieur / échappement | déroulant ouvert | fermeture, Brouillon inchangé | — |
| N = 1 ou Sans | — | « Avec » sans déclencheur ni déroulant | — |
| Réouverture de la Feuille | `BY_SERIES` | déclencheur 146 × 26, notation dedans, aucun hôte SwiftUI | — |
| Barre, cellule Cible | focus Cible | 4 emplacements égaux : À l'échec, Précédent, Suivant, Fermer | — |
| Barre, Pause / Charge | focus | emplacement 1 vide réservé, Précédent / Suivant au même endroit | — |
| Barre étroite | libellé > emplacement | flèches seules, libellés d'accessibilité inchangés | — |

</frozen-after-approval>

## Code Map

- `src/features/activities/ExecutionParametersSheet.tsx` -- `SideOrderMenu` (~l.3030-3106) à remplacer par un déclencheur `Pressable` (146 × 26, `styles.sideOrderTrigger`, testID `execution-sheet-side-order-menu` conservé, rôle bouton, nom « Enchainement », valeur `sideOrders`, `expanded`) ; `sideControl` (~l.1438) ; `chooseSideOrder` (~l.930, passe par `chooseInline` qui refuse sous un sélecteur ouvert : choix du déroulant par fonction dédiée) ; `PanelControl` / `PANEL_FRAME` / `PANEL_TEST_IDS` (~l.383-421), `panelControl` (~l.1114, iOS seulement : le déroulant n'en dépend pas), `trackRow`, `anchorTop`, rendu `panel` (~l.1760) et hôte (~l.2316) ; `Row` accepte `onLayout` ; `SIDE_CONTROL_RESERVED_WIDTH` (l.3154). Imports `@expo/ui`, `Alert` à retirer s'ils deviennent inutiles.
- `src/features/activities/sheetSurface.ts` -- `SheetSelector` : ajouter `"sideOrder"` (famille sélecteur : T10, ✓ / ✕ absorbés, fermeture par clé).
- `src/features/activities/AnchoredPanel.tsx` -- réutilisé tel quel (zone extérieure, `accessibilityViewIsModal`, `onAccessibilityEscape`).
- `src/features/activities/KeyboardAccessoryBar.tsx` -- disposition, styles, `keyboardBarCompact` (sémantique : largeur de la barre, plus large libellé Précédent / Suivant), mesure hors écran.
- `src/shared/ui/SegmentedControl.tsx` -- `INLINE_OPTION_WIDTHS.notation` (146), `inlineSelectedCompactLabelStyle`, `inlineChevronFrameStyle` : réutilisés, non modifiés.
- Tests : `ExecutionParametersSheet.test.tsx` (aides `orderText` / `chooseOrder` l.212-245, l.1230-1252, l.2537-2575, l.2891-2905, l.6023-6030, barre l.5557, 6863-6985) ; `ExecutionParametersSheet.phases.test.tsx` (barre l.391-404) ; `sheetSurface` tests si le type est énuméré.

## Tasks & Acceptance

**Execution:**
- [x] `src/features/activities/sheetSurface.ts` -- sélecteur `sideOrder` -- surface unique.
- [x] `src/features/activities/ExecutionParametersSheet.tsx` -- déclencheur fixe, déroulant sur `AnchoredPanel` (placement calculé depuis la ligne mesurée), choix dédié, suppression du menu natif -- B5, A1-A3.
- [x] `src/features/activities/KeyboardAccessoryBar.tsx` -- quatre emplacements égaux, boutons arrondis, Fermer bleu, emplacement réservé -- B9, A4.
- [x] Tests -- remplacer les tests du menu natif et de l'`Alert` par ceux du déroulant (géométrie, rôles, choix, extérieur, échappement, réouverture) ; mettre à jour la géométrie de la barre et `keyboardBarCompact`.

**Acceptance Criteria:**
- Given Avec sélectionné à N > 1, when on ouvre le déroulant puis touche hors du panneau, then il se ferme et `sideOrder` est inchangé ; ✓ / ✕ de la Feuille sont absorbés tant qu'il est ouvert.
- Given la Feuille fermée puis rouverte avec `BY_SERIES`, when on lit l'option Avec, then la notation est dans un déclencheur de 146 × 26 et aucun `Host` ni `RNHostView` n'est rendu dans la Feuille.
- Given une cellule Pause focalisée, when la barre s'affiche, then Précédent et Suivant occupent les emplacements 2 et 3, de même largeur que Fermer.

## Implementation Notes

- Implémentation par un sous-agent depuis la spec, correctifs de revue par le même sous-agent.
- Figma lu (lecture seule) : `9462:18986` (segmenté 214 × 32), `9462:18987` (144 × 88 à x 3, y 3 ; rangée choisie `#5F60EE`, Semi Bold 10 blanc, marge 8, écart 6, chevron 10 ; rangée non choisie `color/surface`, Regular 10 `#4A4A52` ; rayon 4), contexte `8328:38193`.
- B5 : `SideOrderTrigger` (Pressable 146 × 26, testID `execution-sheet-side-order-menu` conservé, rôle bouton, `expanded`) ; `SideOrderDropdown` sur `AnchoredPanel` (`execution-sheet-side-order-panel`, rôle menu, rangées `menuitem`), surface `selector(sideOrder)` ; placement : haut = cadre Côtés + ligne mesurée + (hauteur − 32)/2 + 3, droite = `FRAME_INSET` + 3 + 62 + 2 ; rangées alignées à gauche (marge 8) ; réserve sous les cadres étendue au déroulant (`contentRoom`). Cause B5 : `Host` + `RNHostView matchContents` dimensionnés sur leur contenu, supprimés ; imports `@expo/ui` et `Alert` retirés de la Feuille (dépendance conservée). Clé `sideSequenceCancel` retirée.
- B9 : quatre emplacements `flex` égaux (`minWidth` 44, hauteur 36 dans la barre de 44, débord tactile de 4), boutons blancs rayon 8, Fermer `colors.primary` / blanc, emplacement réservé `execution-sheet-keyboard-failure-slot` ; `keyboardBarSlotWidth`, `keyboardBarCompact(barre, plus large libellé Précédent / Suivant)` ; marges 8, écart 6, marge intérieure 2.
- Contrôles finaux : 149 suites, 4 085 tests verts ; `tsc` et `lint` sans erreur. Garde-fous zéro `ScrollView` et PRE4-3.8/AC7 intacts.

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Suite |
|---|---|---|---|---|
| 1 | cas limites + aveugle | Sélecteur `sideOrder` resté ouvert si N passe à 1 ou si Sans est choisi | false | sous un Sélecteur ouvert, `chooseInline` et le réducteur (T10) ferment sans appliquer ; la zone extérieure couvre le contenu, ✓ / ✕ absorbés : le déclencheur ne peut pas disparaître déroulant ouvert |
| 2 | cas limites | `chooseSideOrder` sans `keyboard.flush` | false | surface unique : aucun champ clavier n'est ouvert quand le déroulant l'est ; l'ouverture applique déjà la saisie (`toggleSideOrderDropdown`) |
| 3 | cas limites | Texte agrandi : notation rognée dans 146 × 26 / 44 | low | rejeté : hauteurs fixes identiques à toutes les options `inline` (et à l'ancien hôte), correctif non direct ; à observer en recette JB |
| 4 | cas limites + aveugle | Seuls Précédent / Suivant mesurés ; « À l'échec » Semi Bold (62,9, fontTools) passe sur deux lignes à 360 (emplacement 76 − 2 × 8) | medium | patch : marges 8 / écart 6 / marge intérieure 2 (emplacements 81,5 / 92 / 101,5 ; « À l'échec » tient à 360 ; « ← Précédent » (85,4) complet à 402 et 440, flèches à 360). `numberOfLines={1}` / `adjustsFontSizeToFit` non appliqués : interdits par le garde-fou existant PRE4-3.8/AC7 (texte agrandi jamais plafonné ni réduit), qui n'est pas affaibli ; une ligne en texte agrandi reste non garantie (point renvoyé à Hermann) |
| 5 | aveugle | Largeur minimale 44 des zones tactiles retirée sans décision | low | patch : `minWidth: 44` remis sur l'emplacement |
| 6 | aveugle | Position du déroulant calculée, non mesurée ; constantes du segmenté recopiées (`#4A4A52`, 3, 2, 32) | low | rejeté : géométrie du segmenté verrouillée par les tests (216 × 32, options 146 / 62) ; mesurer la chaîne de vues ajouterait de la complexité ; à observer en JB |
| 7 | aveugle | Le test 414 / 80 rejoue la formule | low | rejeté : même limite que la mise en page sous Jest (aucune mesure réelle) ; la géométrie du segmenté est testée ailleurs |
| 8 | aveugle | En-tête d'`AnchoredPanel` et README périmés | low | patch (commentaires) |
| 9 | aveugle | TalkBack / VoiceOver : focus non déplacé dans le déroulant à l'ouverture, modalité Android | maybe-false | différé : même comportement que les panneaux existants ; à vérifier sur appareil (VoiceOver, JB) |
| 10 | aveugle | Clé `sideSequenceCancel` orpheline | low | patch : clé et assertion retirées |
| 11 | aveugle | Commentaires et titres de tests périmés ; échafaudage `Alert` du test D-341 | low | patch (commentaires, titre) ; l'espion `Alert` est gardé : il prouve l'absence d'`Alert` |
| 12 | aveugle | testID du déclencheur `…-side-order-menu` peu parlant | low | rejeté : conservé pour limiter le remaniement des tests existants |
| 13 | aveugle | Ouverture avec saisie en cours, garde `isOpen`, `setIsTableSelected` non testés | low | rejeté : chemins défensifs alignés sur `chooseInline` |
| 14 | aveugle | Recette iPhone non planifiée | false | prévue par la spec (Verification) et le plan (jalon JB) |
| 15 | lacunes | Réserve `contentRoom` du déroulant non affirmée | low | patch : assertion ajoutée |
| 16 | lacunes | Garde « deux mesures » de la barre non vérifiée dans le composant | low | patch : test ajouté |
| 17 | lacunes | `framesBottom` nul avant mesure → réserve provisoire | low | rejeté : comportement existant de `panelRoom`, identique |
| 18 | orchestrateur (relevé Figma) | Rangées du déroulant centrées ; Figma `9462:18987` les aligne à gauche (marge 8) | low | patch |

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- Recette JB (iPhone, iOS 26, 360 / 402 / 440) : déroulant ancré et contenu, notation contenue après réouverture, barre du clavier (emplacements, Fermer bleu, fond, flèches à 360).
