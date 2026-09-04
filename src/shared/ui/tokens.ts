/**
 * Design tokens canoniques du MVP.
 *
 * Source : docs/Specifications-fonctionnelles/12 – Architecture technique,
 * « Design tokens canoniques ».
 */

export const colors = {
  primary: "#0508E5",
  selection: "#5F60EE",
  selectionSurface: "#E5F0FF",
  background: "#FFFFFF",
  surface: "#F5F7FA",
  surfaceSubtle: "#F9FAFC",
  textPrimary: "#141414",
  textSecondary: "#595E66",
  iconNeutral: "#5C636E",
  border: "#E0E3E8",
  divider: "#DBE0E8",
  disabled: "#BEC2CC",
  snackbar: "#292B33",
  positive: "#4F9F83",
  warning: "#FF8D28",
  danger: "#D92D20",
  dangerSurface: "#FFF1F0",
  // R4 (`[ChatGPT] REWORK04 IMPLEMENTATION AUTHORIZED — DESIGN COMPLEMENTS
  // REVIEWED`, 2026-09-03 ; `12 – Architecture technique.md`, tokens
  // `color.wheelAction*`) : actions Annuler/Valider de la roulette
  // compacte. Alias sémantiques explicites — `wheelActionCancelBackground`
  // = `surface`, `wheelActionValidateBackground` = `primary`,
  // `wheelActionCancelIcon` = `textPrimary` — jamais réutilisés en dur via
  // le nom du token primitif, pour exprimer l'intention au point d'usage.
  wheelActionCancelBackground: "#F5F7FA",
  wheelActionValidateBackground: "#0508E5",
  wheelActionCancelIcon: "#141414",
  wheelActionValidateIcon: "#FFFFFF",
} as const;

const regular = { fontFamily: "Inter_400Regular", fontWeight: "400" } as const;
const medium = { fontFamily: "Inter_500Medium", fontWeight: "500" } as const;
const semiBold = { fontFamily: "Inter_600SemiBold", fontWeight: "600" } as const;

export const type = {
  timerPrimary: { ...semiBold, fontSize: 58, lineHeight: 64 },
  activityTitle: { ...semiBold, fontSize: 28, lineHeight: 34 },
  metricPrimary: { ...semiBold, fontSize: 22, lineHeight: 28 },
  screenTitle: { ...semiBold, fontSize: 20, lineHeight: 24 },
  modalTitle: { ...semiBold, fontSize: 18, lineHeight: 22 },
  sectionTitle: { ...semiBold, fontSize: 16, lineHeight: 20 },
  cardTitle: { ...semiBold, fontSize: 16, lineHeight: 20 },
  // R4-03 (`KODJO / Card / Title`) : `14/18` Semi Bold — jusqu'ici déclaré
  // à `13/18`, jamais réellement consommé (aucun appelant avant cette
  // mission). Complété au lieu de dupliquer un nouveau token, conformément
  // au garde-fou DSF (« interdire un duplicat local aux mêmes
  // dimensions »).
  compactCardTitle: { ...semiBold, fontSize: 14, lineHeight: 18 },
  body: { ...regular, fontSize: 14, lineHeight: 20 },
  label: { ...medium, fontSize: 14, lineHeight: 18 },
  button: { ...semiBold, fontSize: 14, lineHeight: 18 },
  supporting: { ...regular, fontSize: 12, lineHeight: 16 },
  // R4-03 (`KODJO / Card / Supporting`) : `11/14` — jusqu'ici déclaré à
  // `11/16`, jamais consommé ailleurs. Même remarque que `compactCardTitle`
  // ci-dessus.
  caption: { ...regular, fontSize: 11, lineHeight: 14 },
  navLabel: { ...regular, fontSize: 11, lineHeight: 16 },
} as const;

export const spacing = {
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  12: 12,
  16: 16,
  24: 24,
  32: 32,
} as const;

export const fixedRadii = {
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
} as const;

export const borderWidths = {
  1: 1,
  2: 2,
} as const;

export const icon = {
  control: 14,
  compact: 16,
  section: 18,
  standard: 24,
  action: 28,
  navigation: 32,
  status: 32,
} as const;

export const dimensions = {
  primaryButton: { minHeight: 48, radius: 24, width: "100%" },
  compactSecondaryButton: { visualHeight: 32, radius: 16, minTouchTarget: 48 },
  header: { contentHeight: 48 },
  finalAction: { buttonHeight: 48 },
  mainNavigation: { visualHeight: 66, radius: 33 },
  activeDestination: { visualHeight: 56, radius: 28 },
  globalSearch: { visualDiameter: 58, radius: 29 },
  standardCard: { radius: 12 },
  // R4-02 (`Action / Back`, `2624:3105`) : cible tactile inchangée
  // (`minTouchTarget`), cercle visuel et chevron réduits — auparavant un
  // cercle unique confondu avec la cible tactile elle-même.
  backAction: { visualCircle: 28, chevron: 14 },
  // R4-07/R4-09 (`Picker / Popover — Source exact`, variante
  // `Type=Duration`) : géométrie canonique de la roulette compacte —
  // D-098 (`07 – Registre des décisions`, « Validée post-Figma ») pour la
  // hauteur ; `12 – Architecture technique.md` pour les cibles d'action.
  // La zone roue (`wheelContentMinHeight`) est un plancher (`minHeight`),
  // pas une hauteur figée — voir `DurationWheelPicker.tsx` pour la
  // justification (ne pas reproduire le défaut D-04 corrigé au cycle
  // précédent).
  wheelPicker: {
    toolbarHeight: 40,
    wheelContentMinHeight: 150,
    actionVisualCircle: 28,
    actionTouchTarget: 48,
  },
  // R4-12 (`Composition / Tour Section`, `3067:270`) : le conteneur Tour
  // est plus large que la carte qu'il héberge (rôle de conteneur, pas une
  // carte elle-même) — inversion explicite de `T-01` (cycle précédent, qui
  // avait unifié la largeur de Tour avec celle des cartes limites).
  compositionTourSection: { containerWidth: 374, cardWidth: 354, inset: 10, closedHeight: 54 },
  // REWORK07-A (`[ChatGPT] CHANGES_REQUESTED — REWORK07-A — ICON /
  // STRUCTURE / MOVABLE UNIQUEMENT`, 2026-09-04) : géométrie canonique du
  // pictogramme structurel `Icon / Structure / Movable` (`3066:4676`) —
  // `glyph` est la taille intrinsèque du dessin exporté (`sizes` de
  // `KodjoIcon.tsx`), `slot` la taille du conteneur qui l'entoure quand un
  // écran en a besoin (`CompositionScreen.tsx`, `boundaryRowHandleSlot` →
  // `structureIconSlot`). Source unique partagée par les deux fichiers,
  // remplace les littéraux locaux `24×24`/`32×32` introduits par REWORK04/
  // REWORK06 sur la base d'un asset provisoire (`composition-reorder.svg`,
  // `2537:1456`, `16×16`, encre ne couvrant que `x=5…11`) — le diagnostic
  // REWORK07-A a établi que l'agrandissement de l'affichage d'un glyphe
  // sous-dimensionné n'en corrige pas la proportion visuelle ; seul le
  // remplacement par l'export canonique le corrige réellement.
  structureMovableIcon: { glyph: 20, slot: 28 },
} as const;

export const minTouchTarget = 48;
