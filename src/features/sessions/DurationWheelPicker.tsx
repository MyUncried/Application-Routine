import { Host, HStack, Picker as SwiftUIPicker, Text as SwiftUIText } from "@expo/ui/swift-ui";
import { accessibilityLabel as accessibilityLabelModifier, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import {
  WHEEL_SECONDS_ITEM_COUNT,
  WHEEL_SECONDS_MAX_INDEX,
  WHEEL_TOTAL_SECONDS_MAX,
  formatTwoDigits,
  fromTotalSeconds,
  indexToOffset,
  minutesMaxIndexFor,
  offsetToIndex,
  secondsIndexToValue,
  secondsValueToIndex,
  toTotalSeconds,
} from "@/features/sessions/wheelPickerMath";
import { WheelSelectionOverlay } from "@/features/sessions/WheelSelectionOverlay";
import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * Sélecteur partagé minutes/secondes de `Compte à rebours initial` et
 * `Fin de séance` (T01-S07, plan §5/§6), et de la Durée/Pause d'un Exercice
 * (T01-S08). Bornes par défaut (V1, Composition) : minutes 0–59, secondes
 * `0, 5, …, 55` (pas de `5`, CE-T01-07/14 — voir `wheelPickerMath.ts`),
 * total 0–3599 s. `maxTotalSeconds` permet à un appelant (Exercice)
 * d'étendre la borne haute à 5999 s (99 min 59 s, `08` l.925) sans dupliquer
 * ce composant — la colonne secondes garde toujours le même pas, seule la
 * colonne minutes s'étend (`minutesMaxIndexFor`).
 *
 * Correction `PHASE02 REWORK01 ADDENDUM — NATIVE APPLE WHEEL TARGET`
 * (contre-recette iPhone, 2026-09-03) : sur iOS, ce composant délègue
 * désormais à la roulette native SwiftUI (`@expo/ui/swift-ui`,
 * `pickerStyle('wheel')`) plutôt qu'à la réimplémentation maison
 * (`ScrollView` + calcul manuel de décalage) — perspective cylindrique,
 * fondu, mise à l'échelle progressive, inertie et sémantique
 * d'accessibilité natifs, jamais recréés manuellement. La réimplémentation
 * maison reste le seul chemin sur Android/web (`@expo/ui/swift-ui` est
 * iOS/tvOS uniquement) — `Platform.select` ci-dessous, aucune duplication
 * de la logique de bornes/pas, partagée via `wheelPickerMath.ts` dans les
 * deux chemins.
 *
 * `@expo/ui` est une dépendance déjà installée (`package.json`,
 * `~57.0.13`) et confirmée incluse dans Expo Go par la documentation
 * officielle (`docs.expo.dev/versions/latest/sdk/ui/swift-ui`, section
 * « Included in Expo Go ») — aucune nouvelle dépendance, aucun build de
 * développement personnalisé requis a priori. Non vérifié sur device réel
 * dans cette mission (voir le rapport).
 */

const ITEM_HEIGHT = 40;
const SECONDS_VALUES = Array.from({ length: WHEEL_SECONDS_ITEM_COUNT }, (_, index) =>
  secondsIndexToValue(index),
);

export type DurationWheelPickerProps = {
  totalSeconds: number;
  onChange: (totalSeconds: number) => void;
  minutesAccessibilityLabel: string;
  secondsAccessibilityLabel: string;
  /** Borne haute de `totalSeconds`, en secondes. Par défaut `WHEEL_TOTAL_SECONDS_MAX` (3599, V1, Composition). */
  maxTotalSeconds?: number;
};

export function DurationWheelPicker(props: DurationWheelPickerProps) {
  if (Platform.OS === "ios") {
    return <NativeAppleDurationWheelPicker {...props} />;
  }
  return <LegacyDurationWheelPicker {...props} />;
}

/**
 * Roulette native SwiftUI (iOS uniquement) — `Host` + `HStack` +
 * `Picker` × 2 (`pickerStyle('wheel')`), chaque colonne portant ses propres
 * options via `<Text modifiers={[tag(valeur)]}>`. La sélection (`tag`) est
 * la valeur elle-même (minutes ou secondes), jamais un index intermédiaire
 * — l'API native gère elle-même le geste, le magnétisme, le rendu et
 * l'accessibilité ; aucune de ces couches n'est recréée ici.
 */
function NativeAppleDurationWheelPicker({
  totalSeconds,
  onChange,
  minutesAccessibilityLabel,
  secondsAccessibilityLabel,
  maxTotalSeconds = WHEEL_TOTAL_SECONDS_MAX,
}: DurationWheelPickerProps) {
  const minutesMaxIndex = minutesMaxIndexFor(maxTotalSeconds);
  const minutesValues = Array.from({ length: minutesMaxIndex + 1 }, (_, index) => index);
  const initial = fromTotalSeconds(totalSeconds, maxTotalSeconds);

  // Même patron que la version maison : deux références indépendantes,
  // synchronisées ensemble à chaque changement effectif (§5 du plan) — ici
  // des valeurs directes (minutes/secondes), pas des index de défilement,
  // la roulette native n'exposant que la valeur sélectionnée (`tag`).
  const minutesRef = useRef(initial.minutes);
  const secondsRef = useRef(initial.seconds);

  function handleMinutesChange(value: number) {
    if (value === minutesRef.current) {
      return;
    }
    minutesRef.current = value;
    // `.catch()` explicite : voir la version maison ci-dessous pour la
    // justification complète, identique ici.
    Haptics.selectionAsync().catch(() => {});
    onChange(toTotalSeconds(minutesRef.current, secondsRef.current, maxTotalSeconds));
  }

  function handleSecondsChange(value: number) {
    if (value === secondsRef.current) {
      return;
    }
    secondsRef.current = value;
    Haptics.selectionAsync().catch(() => {});
    onChange(toTotalSeconds(minutesRef.current, secondsRef.current, maxTotalSeconds));
  }

  return (
    <Host style={styles.nativeHost} testID="duration-wheel-picker">
      <HStack spacing={spacing[4]} alignment="center">
        <SwiftUIPicker
          selection={initial.minutes}
          onSelectionChange={handleMinutesChange}
          modifiers={[pickerStyle("wheel"), accessibilityLabelModifier(minutesAccessibilityLabel)]}
          testID="duration-wheel-minutes"
        >
          {minutesValues.map((value) => (
            <SwiftUIText key={value} modifiers={[tag(value)]}>
              {formatTwoDigits(value)}
            </SwiftUIText>
          ))}
        </SwiftUIPicker>
        <Text style={styles.separator}>min</Text>
        <SwiftUIPicker
          selection={initial.seconds}
          onSelectionChange={handleSecondsChange}
          modifiers={[pickerStyle("wheel"), accessibilityLabelModifier(secondsAccessibilityLabel)]}
          testID="duration-wheel-seconds"
        >
          {SECONDS_VALUES.map((value) => (
            <SwiftUIText key={value} modifiers={[tag(value)]}>
              {formatTwoDigits(value)}
            </SwiftUIText>
          ))}
        </SwiftUIPicker>
        <Text style={styles.separator}>s</Text>
      </HStack>
    </Host>
  );
}

/**
 * Mécanisme de détection (chemin maison, Android/web uniquement) :
 * `onScroll` (`scrollEventThrottle={16}`), pas `onMomentumScrollEnd` — voir
 * `wheelPickerMath.ts` et le rapport d'implémentation pour la justification
 * complète. `onMomentumScrollEnd`/`onScrollEndDrag` ne servent ici qu'à une
 * correction d'alignement final (`scrollTo` vers la position exacte de
 * l'index déjà retenu) — jamais comme déclencheur de valeur ou d'haptique.
 *
 * Correction `CTRL-01` (contre-recette iPhone, cause racine démontrée par
 * `2026-09-03_P0-diagnostic-controles-interactifs.md`, point 1) : chaque
 * valeur visible est aussi sélectionnable par appui direct (`Pressable` par
 * item), pas seulement par glissement. `applyColumnIndex` centralise la
 * logique déjà validée pour le glissement (garde d'index inchangé, haptique
 * unique, `onChange`) — réutilisée à l'identique par le geste ET par le
 * toucher direct, jamais dupliquée. Un appui rejoue ensuite `alignColumn`
 * pour recentrer visuellement la roulette sur la valeur choisie.
 *
 * Colonne secondes en pas de `5` (CE-T01-07/14) : les index de défilement
 * (`0..WHEEL_SECONDS_MAX_INDEX`) et les valeurs affichées/retenues
 * (`0, 5, …, 55`) divergent désormais — `secondsIndexToValue`/
 * `secondsValueToIndex` (`wheelPickerMath.ts`) font la conversion aux deux
 * points de contact (calcul du total, alignement visuel).
 */
function LegacyDurationWheelPicker({
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
  // Pour les secondes, il s'agit de l'INDEX de défilement (0..11), jamais
  // de la valeur affichée directement (0, 5, …, 55) — voir la conversion
  // dans `applyColumnIndex`/`alignColumn` ci-dessous.
  const minutesIndexRef = useRef(initial.minutes);
  const secondsIndexRef = useRef(secondsValueToIndex(initial.seconds));
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
      y: indexToOffset(secondsIndexRef.current, ITEM_HEIGHT),
      animated: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyColumnIndex(index: number, column: "minutes" | "seconds") {
    const ref = column === "minutes" ? minutesIndexRef : secondsIndexRef;

    if (index === ref.current) {
      return;
    }
    ref.current = index;
    // `.catch()` explicite : un rejet (device sans moteur haptique, OS le
    // refusant) ne doit jamais devenir un rejet de promesse non géré, ni
    // interrompre la synchronisation du brouillon ci-dessous, qui reste
    // indépendante du résultat de l'haptique.
    Haptics.selectionAsync().catch(() => {});
    onChange(
      toTotalSeconds(
        minutesIndexRef.current,
        secondsIndexToValue(secondsIndexRef.current),
        maxTotalSeconds,
      ),
    );
  }

  function handleColumnScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>,
    column: "minutes" | "seconds",
  ) {
    const max = column === "minutes" ? minutesMaxIndex : WHEEL_SECONDS_MAX_INDEX;
    const index = offsetToIndex(event.nativeEvent.contentOffset.y, ITEM_HEIGHT, max);
    applyColumnIndex(index, column);
  }

  function alignColumn(column: "minutes" | "seconds") {
    const ref = column === "minutes" ? minutesIndexRef : secondsIndexRef;
    const scrollRef = column === "minutes" ? minutesScrollRef : secondsScrollRef;
    scrollRef.current?.scrollTo({ y: indexToOffset(ref.current, ITEM_HEIGHT), animated: true });
  }

  /** Toucher direct d'une valeur visible (`CTRL-01`) : sélectionne puis recentre visuellement, comme la correction finale déjà appliquée après un glissement. */
  function handleItemPress(index: number, column: "minutes" | "seconds") {
    applyColumnIndex(index, column);
    alignColumn(column);
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
        onItemPress={(index) => handleItemPress(index, "minutes")}
      />
      <Text style={styles.separator}>min</Text>
      <WheelColumn
        scrollRef={secondsScrollRef}
        values={SECONDS_VALUES}
        max={secondsIndexToValue(WHEEL_SECONDS_MAX_INDEX)}
        now={initial.seconds}
        accessibilityLabel={secondsAccessibilityLabel}
        testID="duration-wheel-seconds"
        onScroll={(event) => handleColumnScroll(event, "seconds")}
        onMomentumScrollEnd={() => alignColumn("seconds")}
        onScrollEndDrag={() => alignColumn("seconds")}
        onItemPress={(index) => handleItemPress(index, "seconds")}
      />
      <Text style={styles.separator}>s</Text>
    </View>
  );
}

type WheelColumnProps = {
  scrollRef: React.RefObject<ScrollView | null>;
  /** Valeurs affichées, dans l'ordre des index de défilement — peuvent différer des index eux-mêmes (colonne secondes, pas de `5`). */
  values: readonly number[];
  /** Borne haute exposée à l'accessibilité — la valeur réelle maximale (`59` pour les secondes), pas l'index maximal de défilement. */
  max: number;
  now: number;
  accessibilityLabel: string;
  testID: string;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollEnd: () => void;
  onScrollEndDrag: () => void;
  /** Toucher direct d'une valeur visible (`CTRL-01`) — reçoit l'INDEX de défilement (position dans `values`), jamais la valeur affichée elle-même. */
  onItemPress: (index: number) => void;
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
  onItemPress,
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
        {values.map((value, index) => (
          <Pressable
            key={value}
            style={styles.item}
            onPress={() => onItemPress(index)}
            accessibilityRole="button"
            accessibilityLabel={formatTwoDigits(value)}
            testID={`${testID}-item-${value}`}
          >
            <Text style={styles.itemLabel}>{formatTwoDigits(value)}</Text>
          </Pressable>
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
  // Largeur explicite requise par la roulette native : « segmented and
  // wheel pickers stretch to the width they are given, so they collapse
  // under matchContents » (docs.expo.dev, référence Picker/@expo/ui/swift-ui)
  // — valeur par défaut raisonnée, non confirmée contre un rendu device réel
  // (voir le rapport de mission).
  nativeHost: {
    width: 260,
    height: ITEM_HEIGHT * 3,
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
