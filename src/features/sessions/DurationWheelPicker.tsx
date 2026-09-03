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
  WHEEL_SECONDS_MAX_INDEX,
  WHEEL_TOTAL_SECONDS_MAX,
  formatTwoDigits,
  fromTotalSeconds,
  indexToOffset,
  minutesMaxIndexFor,
  offsetToIndex,
  toTotalSeconds,
} from "@/features/sessions/wheelPickerMath";
import { WheelSelectionOverlay } from "@/features/sessions/WheelSelectionOverlay";
import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * Sélecteur partagé minutes/secondes de `Compte à rebours initial` et
 * `Fin de séance` (T01-S07, plan §5/§6), et de la Durée/Pause d'un Exercice
 * (T01-S08). Bornes par défaut (V1, Composition) : minutes 0–59, secondes
 * 0–59, total 0–3599 s. `maxTotalSeconds` permet à un appelant (Exercice)
 * d'étendre la borne haute à 5999 s (99 min 59 s, `08` l.925) sans dupliquer
 * ce composant — la colonne secondes reste toujours 0–59, seule la colonne
 * minutes s'étend (`minutesMaxIndexFor`).
 *
 * Mécanisme de détection : `onScroll` (`scrollEventThrottle={16}`), pas
 * `onMomentumScrollEnd` — voir `wheelPickerMath.ts` et le rapport
 * d'implémentation pour la justification complète. `onMomentumScrollEnd`/
 * `onScrollEndDrag` ne servent ici qu'à une correction d'alignement final
 * (`scrollTo` vers la position exacte de l'index déjà retenu) — jamais comme
 * déclencheur de valeur ou d'haptique.
 */

const ITEM_HEIGHT = 40;
const SECONDS_VALUES = Array.from({ length: WHEEL_SECONDS_MAX_INDEX + 1 }, (_, index) => index);

export type DurationWheelPickerProps = {
  totalSeconds: number;
  onChange: (totalSeconds: number) => void;
  minutesAccessibilityLabel: string;
  secondsAccessibilityLabel: string;
  /** Borne haute de `totalSeconds`, en secondes. Par défaut `WHEEL_TOTAL_SECONDS_MAX` (3599, V1, Composition). */
  maxTotalSeconds?: number;
};

export function DurationWheelPicker({
  totalSeconds,
  onChange,
  minutesAccessibilityLabel,
  secondsAccessibilityLabel,
  maxTotalSeconds = WHEEL_TOTAL_SECONDS_MAX,
}: DurationWheelPickerProps) {
  const minutesMaxIndex = minutesMaxIndexFor(maxTotalSeconds);
  const minutesValues = Array.from({ length: minutesMaxIndex + 1 }, (_, index) => index);
  const initial = fromTotalSeconds(totalSeconds, maxTotalSeconds);

  // Un seul index de référence par colonne, indépendant de l'autre — la
  // synchronisation immédiate du brouillon (§5 du plan) exige de connaître
  // l'index courant des DEUX colonnes au moment où l'une d'elles change.
  const minutesIndexRef = useRef(initial.minutes);
  const secondsIndexRef = useRef(initial.seconds);
  const minutesScrollRef = useRef<ScrollView>(null);
  const secondsScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Ce composant est monté/démonté à chaque ouverture/fermeture de la
    // superposition (§5) : cet effet s'exécute donc une fois par ouverture,
    // toujours resynchronisé sur la valeur réelle du brouillon à cet
    // instant — jamais sur une frappe locale ultérieure (`totalSeconds`
    // volontairement absent des dépendances : les deux `ref` restent la
    // source de vérité locale une fois montées).
    minutesScrollRef.current?.scrollTo({
      y: indexToOffset(initial.minutes, ITEM_HEIGHT),
      animated: false,
    });
    secondsScrollRef.current?.scrollTo({
      y: indexToOffset(initial.seconds, ITEM_HEIGHT),
      animated: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleColumnScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>,
    column: "minutes" | "seconds",
  ) {
    const max = column === "minutes" ? minutesMaxIndex : WHEEL_SECONDS_MAX_INDEX;
    const ref = column === "minutes" ? minutesIndexRef : secondsIndexRef;
    const index = offsetToIndex(event.nativeEvent.contentOffset.y, ITEM_HEIGHT, max);

    // Condition vérifiée en premier, avant tout autre traitement (§6.3) :
    // aucun appel haptique ni `onChange` si l'index est inchangé.
    if (index === ref.current) {
      return;
    }
    ref.current = index;
    // `.catch()` explicite : un rejet (device sans moteur haptique, OS le
    // refusant) ne doit jamais devenir un rejet de promesse non géré, ni
    // interrompre la synchronisation du brouillon ci-dessous, qui reste
    // indépendante du résultat de l'haptique.
    Haptics.selectionAsync().catch(() => {});
    onChange(toTotalSeconds(minutesIndexRef.current, secondsIndexRef.current, maxTotalSeconds));
  }

  function alignColumn(column: "minutes" | "seconds") {
    const ref = column === "minutes" ? minutesIndexRef : secondsIndexRef;
    const scrollRef = column === "minutes" ? minutesScrollRef : secondsScrollRef;
    scrollRef.current?.scrollTo({ y: indexToOffset(ref.current, ITEM_HEIGHT), animated: true });
  }

  return (
    <View style={styles.container} testID="duration-wheel-picker">
      <WheelColumn
        scrollRef={minutesScrollRef}
        values={minutesValues}
        max={minutesMaxIndex}
        now={initial.minutes}
        accessibilityLabel={minutesAccessibilityLabel}
        testID="duration-wheel-minutes"
        onScroll={(event) => handleColumnScroll(event, "minutes")}
        onMomentumScrollEnd={() => alignColumn("minutes")}
        onScrollEndDrag={() => alignColumn("minutes")}
      />
      <Text style={styles.separator}>min</Text>
      <WheelColumn
        scrollRef={secondsScrollRef}
        values={SECONDS_VALUES}
        max={WHEEL_SECONDS_MAX_INDEX}
        now={initial.seconds}
        accessibilityLabel={secondsAccessibilityLabel}
        testID="duration-wheel-seconds"
        onScroll={(event) => handleColumnScroll(event, "seconds")}
        onMomentumScrollEnd={() => alignColumn("seconds")}
        onScrollEndDrag={() => alignColumn("seconds")}
      />
      <Text style={styles.separator}>s</Text>
    </View>
  );
}

type WheelColumnProps = {
  scrollRef: React.RefObject<ScrollView | null>;
  values: readonly number[];
  max: number;
  now: number;
  accessibilityLabel: string;
  testID: string;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollEnd: () => void;
  onScrollEndDrag: () => void;
};

function WheelColumn({
  scrollRef,
  values,
  max,
  now,
  accessibilityLabel,
  testID,
  onScroll,
  onMomentumScrollEnd,
  onScrollEndDrag,
}: WheelColumnProps) {
  return (
    <View style={styles.wheelArea}>
      <ScrollView
        ref={scrollRef}
        testID={testID}
        style={styles.column}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollEndDrag={onScrollEndDrag}
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: 0, max, now }}
      >
        {values.map((value) => (
          <View key={value} style={styles.item}>
            <Text style={styles.itemLabel}>{formatTwoDigits(value)}</Text>
          </View>
        ))}
      </ScrollView>
      <WheelSelectionOverlay itemHeight={ITEM_HEIGHT} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing[8],
    gap: spacing[4],
  },
  wheelArea: {
    height: ITEM_HEIGHT * 3,
  },
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
  separator: {
    ...type.body,
    color: colors.textSecondary,
  },
});
