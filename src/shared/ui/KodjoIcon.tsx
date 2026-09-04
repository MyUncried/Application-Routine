import { Image } from "expo-image";

import { dimensions } from "./tokens";

const sources = {
  "action-add": require("../../../assets/icons/action-add.svg"),
  "action-start": require("../../../assets/icons/action-start.svg"),
  "control-back": require("../../../assets/icons/control-back.svg"),
  "control-chevron-down": require("../../../assets/icons/control-chevron-down.svg"),
  "control-chevron-up": require("../../../assets/icons/control-chevron-up.svg"),
  "navigation-sessions-active": require("../../../assets/icons/navigation-sessions.svg"),
  "navigation-sessions-inactive": require("../../../assets/icons/navigation-sessions-inactive.svg"),
  "navigation-calendar-active": require("../../../assets/icons/navigation-calendar-active.svg"),
  "navigation-calendar-inactive": require("../../../assets/icons/navigation-calendar.svg"),
  "navigation-history-active": require("../../../assets/icons/navigation-history-active.svg"),
  "navigation-history-inactive": require("../../../assets/icons/navigation-history.svg"),
  "navigation-profile-active": require("../../../assets/icons/navigation-profile-active.svg"),
  "navigation-profile-inactive": require("../../../assets/icons/navigation-profile.svg"),
  "navigation-search": require("../../../assets/icons/navigation-search.svg"),
  "composition-initial-countdown": require("../../../assets/icons/composition-initial-countdown.svg"),
  "composition-main-content": require("../../../assets/icons/composition-main-content.svg"),
  "composition-end-session": require("../../../assets/icons/composition-end-session.svg"),
  "composition-reorder": require("../../../assets/icons/composition-reorder.svg"),
  "state-selected": require("../../../assets/icons/state-selected.svg"),
  "icon-tour": require("../../../assets/icons/icon-tour.svg"),
  "wheel-action-cancel": require("../../../assets/icons/wheel-action-cancel.svg"),
  "wheel-action-validate": require("../../../assets/icons/wheel-action-validate.svg"),
} as const;

const sizes = {
  "action-add": [24, 24],
  "action-start": [28, 28],
  // R4-02 (cycle REWORK04) : affichage réduit de `24×24` à `14×14` — la
  // cible tactile (`minTouchTarget`, inchangée) était portée par le
  // `hitSlop`/conteneur de l'appelant, jamais par cette taille d'affichage.
  // REWORK07B (`[ChatGPT] PLAN_APPROVED — REWORK07B — contrôles canoniques
  // + structure Tour`, 2026-09-04) : **revenu à `24×24`** — le registre de
  // traçabilité canonique (`12 – Architecture technique.md`, `Action /
  // Back`, `2624:3105`) documente explicitement le cadre SVG à `24×24`
  // (cible tactile `48×48` et cercle visible `28×28` inchangés, toujours
  // portés par `dimensions.backAction`/`hitSlop` dans `ScreenShell.tsx`,
  // jamais par cette taille d'affichage). `14×14` était non conforme.
  // Effet de bord accepté, déjà documenté au cycle R4-02 : `ExerciseScreen
  // .tsx` (hors périmètre de cette revue, non modifié) consomme la même
  // icône partagée et hérite donc de la même taille d'affichage — aucun
  // fichier de cet écran n'est modifié, seul le rendu de l'icône change,
  // effet inhérent à la correction d'un token DSF réellement partagé.
  "control-back": [24, 24],
  "control-chevron-down": [24, 24],
  "control-chevron-up": [24, 24],
  "navigation-sessions-active": [30, 20],
  "navigation-sessions-inactive": [30, 20],
  "navigation-calendar-active": [26, 26],
  "navigation-calendar-inactive": [26, 26],
  "navigation-history-active": [26, 21],
  "navigation-history-inactive": [26, 21],
  "navigation-profile-active": [26, 29],
  "navigation-profile-inactive": [26, 29],
  "navigation-search": [26, 26],
  "composition-initial-countdown": [24, 24],
  "composition-main-content": [18, 18],
  "composition-end-session": [24, 24],
  // R4-04 (cycle REWORK04) : affichage porté de `16×16` à `20×20`. REWORK06
  // (addendum « écarts visuels encore ouverts », 2026-09-04) : porté à
  // `24×24` sur la base de l'asset provisoire alors en place
  // (`composition-reorder.svg`, `2537:1456`, `16×16`). REWORK07-A
  // (`[ChatGPT] CHANGES_REQUESTED — REWORK07-A — ICON / STRUCTURE /
  // MOVABLE UNIQUEMENT`, 2026-09-04) : diagnostic indépendant établi —
  // l'ancien master ne dessinait son encre que dans `x=5…11` de son
  // `viewBox` `16×16`, donc agrandir sa boîte d'affichage n'agrandissait
  // pas proportionnellement le tracé visible, expliquant l'aspect « encore
  // trop petit » malgré les deux hausses précédentes. **Asset remplacé**
  // par l'export canonique du composant Figma/DSF `Icon / Structure /
  // Movable` (`3066:4676`, octets exacts, jamais redessiné) et la taille
  // ramenée à son glyphe intrinsèque réel (`dimensions.structureMovableIcon
  // .glyph`, `20×20`) — cette baisse numérique n'est pas un retour en
  // arrière : le tracé du nouvel asset couvre l'essentiel de son canevas,
  // contrairement à l'ancien.
  "composition-reorder": [dimensions.structureMovableIcon.glyph, dimensions.structureMovableIcon.glyph],
  "state-selected": [24, 24],
  // R4-11 (`[ChatGPT] REWORK04 IMPLEMENTATION AUTHORIZED — DESIGN
  // COMPLEMENTS REVIEWED`, 2026-09-03) : export canonique `icon-tour.svg`
  // (composant Figma `3066:4685`, octets exacts téléchargés depuis
  // l'asset MCP fourni par l'autorisation, jamais redessiné).
  "icon-tour": [20, 20],
  // REWORK07B (`[ChatGPT] PLAN_APPROVED — REWORK07B — contrôles canoniques
  // + structure Tour`, 2026-09-04) : actifs SVG canoniques `wheel-action-
  // cancel.svg`/`wheel-action-validate.svg` (`3089:81`/`3089:83`),
  // remplaçant les glyphes Unicode `✕`/`✓` de `PickerToolbar` dans
  // `DurationWheelPicker.tsx`. Cadre `24×24`, matching le `viewBox` exact
  // de chaque export — le cercle visible `28×28` et la cible tactile
  // `48×48` restent portés par `dimensions.wheelPicker`, jamais par cette
  // taille d'affichage (même patron que `control-back`).
  "wheel-action-cancel": [24, 24],
  "wheel-action-validate": [24, 24],
} as const;

/**
 * Opacité par défaut intrinsèque à un nom d'icône — REWORK07-A (`[ChatGPT]
 * CHANGES_REQUESTED — REWORK07-A — ICON / STRUCTURE / MOVABLE UNIQUEMENT`,
 * 2026-09-04) : jusqu'ici, l'opacité `0.5` du pictogramme
 * `Icon / Structure / Movable` était un littéral local (`opacity={0.5}`)
 * répété à chaque appelant (`CompositionScreen.tsx`, rangées limites et
 * ligne Exercice) — aucune garantie qu'un futur appelant l'applique aussi.
 * Portée ici comme valeur par défaut du composant partagé : tout appel
 * `<KodjoIcon name="composition-reorder" />` sans prop `opacity` obtient
 * automatiquement `0.5`, sans paramètre d'écran. Absente de ce registre
 * pour un nom = opacité par défaut `1`, comportement inchangé pour toutes
 * les autres familles d'icônes. La prop `opacity` explicite reste
 * disponible et prioritaire si un appelant a un besoin réellement différent
 * (aucun cas actuel).
 */
const defaultOpacities: Partial<Record<keyof typeof sources, number>> = {
  "composition-reorder": 0.5,
};

export type KodjoIconName = keyof typeof sources;

export type KodjoIconProps = {
  name: KodjoIconName;
  /**
   * Opacité explicite — remplace la valeur par défaut intrinsèque de `name`
   * (`defaultOpacities`, `1` si absente) pour CETTE instance uniquement.
   * Optionnel ; la plupart des appelants n'ont pas besoin de la fournir,
   * REWORK07-A ayant justement supprimé les littéraux locaux redondants
   * pour `composition-reorder`.
   */
  opacity?: number;
  /**
   * Recolore l'icône (`Image.tintColor`, `expo-image`) — correction T-04
   * (contre-recette iPhone, `[ChatGPT] DEVICE NO-GO — PHASE02 REWORK03
   * CUMULATIVE CORRECTION`, 2026-09-03) : premier appelant, le chevron
   * blanc du contrôle Tour sur fond violet. Optionnel, `undefined` par
   * défaut — n'affecte aucun des appels existants (rendu SVG source
   * inchangé). Rendu réel non vérifiable sans device
   * (`NON_VERIFIABLE_DEVICE`, voir le rapport de mission) : `tintColor`
   * recolore fiablement une image à canal alpha uniforme, mais son effet
   * exact sur un SVG multicolore n'est pas garanti — n'utiliser que sur des
   * glyphes monochromes connus (chevrons, flèches).
   */
  tintColor?: string;
  /**
   * Taille d'affichage explicite, en points (carrée) — remplace la taille
   * par défaut de `name` pour CETTE instance uniquement, sans jamais
   * modifier la taille par défaut des autres appelants du même nom.
   * Correction T-04/R4-10 (contrôle Tour, `[ChatGPT] REWORK04
   * IMPLEMENTATION AUTHORIZED — DESIGN COMPLEMENTS REVIEWED`, 2026-09-03) :
   * premier appelant, le chevron du contrôle Tour (`28×28`), trop petit
   * pour la taille par défaut de `control-chevron-down` (`24×24`,
   * partagée avec `SessionCard`/`ExerciseScreen`, non modifiable
   * globalement sans les affecter). Optionnel, `undefined` par défaut —
   * n'affecte aucun appel existant qui ne le fournit pas. Un
   * redimensionnement d'affichage d'un SVG vectoriel n'altère pas son
   * tracé (contrairement à un remplacement d'asset).
   */
  size?: number;
  testID?: string;
};

/**
 * Point d'entrée unique des icônes KODJO.
 *
 * Les sources sont les exports SVG exacts du Design System Figma. Les
 * dimensions logiques restent celles des nœuds de référence ; le SVG assure
 * un rendu indépendant de la densité de pixels, sans glyphe de substitution.
 */
export function KodjoIcon({ name, opacity, tintColor, size, testID }: KodjoIconProps) {
  const [defaultWidth, defaultHeight] = sizes[name];
  const width = size ?? defaultWidth;
  const height = size ?? defaultHeight;
  const resolvedOpacity = opacity ?? defaultOpacities[name] ?? 1;

  return (
    <Image
      source={sources[name]}
      style={{ width, height, opacity: resolvedOpacity, tintColor }}
      contentFit="contain"
      accessible={false}
      testID={testID}
    />
  );
}
