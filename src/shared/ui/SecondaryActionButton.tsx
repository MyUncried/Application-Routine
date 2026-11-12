import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";

import { minTouchTarget } from "@/shared/ui/tokens";

/**
 * « Bouton secondaire » du DS (ch12 « DSF — Actions de la Composition et interrupteurs », documentation de main
 * `ebe72f76`) : base commune aux actions Édition (`12153:27697`) et Guidage sonore (`12145:2108`) — 40 × 32, rayon 10,
 * fond gris clair `#F3F4F9` sans contour ; cible tactile portée à 44 par `hitSlop`. Chaque action fournit son symbole.
 * [L'action Édition de la fiche (`ExerciseScreen`, constantes locales identiques) n'est pas encore rebranchée ici.]
 */
export const SECONDARY_ACTION = { width: 40, height: 32, radius: 10, background: "#F3F4F9" } as const;

export function SecondaryActionButton({
  onPress,
  accessibilityLabel,
  accessibilityHint,
  selected,
  testID,
  children,
}: {
  readonly onPress: () => void;
  readonly accessibilityLabel: string;
  readonly accessibilityHint?: string;
  readonly selected?: boolean;
  readonly testID: string;
  readonly children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      {...(accessibilityHint === undefined ? {} : { accessibilityHint })}
      {...(selected === undefined ? {} : { accessibilityState: { selected } })}
      hitSlop={{
        top: (minTouchTarget - SECONDARY_ACTION.height) / 2,
        bottom: (minTouchTarget - SECONDARY_ACTION.height) / 2,
        left: (minTouchTarget - SECONDARY_ACTION.width) / 2,
        right: (minTouchTarget - SECONDARY_ACTION.width) / 2,
      }}
      style={styles.button}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SECONDARY_ACTION.width,
    height: SECONDARY_ACTION.height,
    borderRadius: SECONDARY_ACTION.radius,
    backgroundColor: SECONDARY_ACTION.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
