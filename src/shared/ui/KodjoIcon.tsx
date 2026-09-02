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
  testID?: string;
};

/**
 * Point d'entrée unique des icônes KODJO.
 *
 * Les sources sont les exports SVG exacts du Design System Figma. Les
 * dimensions logiques restent celles des nœuds de référence ; le SVG assure
 * un rendu indépendant de la densité de pixels, sans glyphe de substitution.
 */
export function KodjoIcon({ name, opacity = 1, testID }: KodjoIconProps) {
  const [width, height] = sizes[name];

  return (
    <Image
      source={sources[name]}
      style={{ width, height, opacity }}
      contentFit="contain"
      accessible={false}
      testID={testID}
    />
  );
}
