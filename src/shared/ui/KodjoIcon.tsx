import { Image } from "expo-image";

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
} as const;

const sizes = {
  "action-add": [24, 24],
  "action-start": [28, 28],
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
  "composition-reorder": [16, 16],
  "state-selected": [24, 24],
} as const;

export type KodjoIconName = keyof typeof sources;

export type KodjoIconProps = {
  name: KodjoIconName;
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
  testID?: string;
};

/**
 * Point d'entrée unique des icônes KODJO.
 *
 * Les sources sont les exports SVG exacts du Design System Figma. Les
 * dimensions logiques restent celles des nœuds de référence ; le SVG assure
 * un rendu indépendant de la densité de pixels, sans glyphe de substitution.
 */
export function KodjoIcon({ name, opacity = 1, tintColor, testID }: KodjoIconProps) {
  const [width, height] = sizes[name];

  return (
    <Image
      source={sources[name]}
      style={{ width, height, opacity, tintColor }}
      contentFit="contain"
      accessible={false}
      testID={testID}
    />
  );
}
