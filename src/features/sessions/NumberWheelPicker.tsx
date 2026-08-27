import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import {
  WHEEL_NUMBER_MAX,
  WHEEL_NUMBER_MIN,
  clampIndex,
  indexToOffset,
  offsetToIndex,
} from "@/features/sessions/wheelPickerMath";
import { colors, type } from "@/shared/ui/tokens";

/**
 * Roulette à colonne unique pour Répétitions/Séries d'un Exercice
 * (T01-S08, D-092). Bornes 1–99 (`WHEEL_NUMBER_MIN`/`WHEEL_NUMBER_MAX`),
 * incrément 1. Même patron de détection que `DurationWheelPicker`
 * (`onScroll`, pas `onMomentumScrollEnd`, une seule condition de garde
 * avant tout traitement) — voir ce composant pour la justification
 * complète, non répétée ici.
 */

const ITEM_HEIGHT = 40;
const VALUES = Array.from(
  { length: WHEEL_NUMBER_MAX - WHEEL_NUMBER_MIN + 1 },
  (_, index) => WHEEL_NUMBER_MIN + index,
);

export type NumberWheelPickerProps = {
  value: number;
  onChange: (value: number) => void;
  accessibilityLabel: string;
  testID?: string;
};

export function NumberWheelPicker({
  value,
  onChange,
  accessibilityLabel,
  testID = "number-wheel-picker",
}: NumberWheelPickerProps) {
  const initialIndex = clampIndex(value - WHEEL_NUMBER_MIN, WHEEL_NUMBER_MAX - WHEEL_NUMBER_MIN);
  const indexRef = useRef(initialIndex);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Même patron que `DurationWheelPicker` : ce composant est monté/démonté
    // à chaque ouverture/fermeture de la roulette, cet effet resynchronise
    // donc la position visuelle sur `value` à l'ouverture — jamais rejoué
    // ensuite (`value` volontairement absent des dépendances).
    scrollRef.current?.scrollTo({
      y: indexToOffset(initialIndex, ITEM_HEIGHT),
      animated: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = offsetToIndex(
      event.nativeEvent.contentOffset.y,
      ITEM_HEIGHT,
      WHEEL_NUMBER_MAX - WHEEL_NUMBER_MIN,
    );

    if (index === indexRef.current) {
      return;
    }
    indexRef.current = index;
    Haptics.selectionAsync().catch(() => {});
    onChange(WHEEL_NUMBER_MIN + index);
  }

  function align() {
    scrollRef.current?.scrollTo({
      y: indexToOffset(indexRef.current, ITEM_HEIGHT),
      animated: true,
    });
  }

  return (
    <ScrollView
      ref={scrollRef}
      testID={testID}
      style={styles.column}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      scrollEventThrottle={16}
      onScroll={handleScroll}
      onMomentumScrollEnd={align}
      onScrollEndDrag={align}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: WHEEL_NUMBER_MIN, max: WHEEL_NUMBER_MAX, now: value }}
    >
      {VALUES.map((item) => (
        <View key={item} style={styles.item}>
          <Text style={styles.itemLabel}>{item}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  column: {
    height: ITEM_HEIGHT * 3,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: {
    ...type.metricPrimary,
    color: colors.textPrimary,
  },
});
