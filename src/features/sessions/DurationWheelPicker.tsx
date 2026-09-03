import { Host, HStack, Picker as SwiftUIPicker, Text as SwiftUIText } from "@expo/ui/swift-ui";
import { accessibilityLabel as accessibilityLabelModifier, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
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
 * ce composant.
 *
 * Sur iOS, ce composant délègue à la roulette native SwiftUI
 * (`@expo/ui/swift-ui`, `pickerStyle('wheel')`) ; la réimplémentation
 * maison (`ScrollView` + calcul manuel) reste le seul chemin sur
 * Android/web (`@expo/ui/swift-ui` est iOS/tvOS uniquement).
 *
 * **Brouillon local / valeur validée** (correction consolidée, `[ChatGPT]
 * DIAGNOSTIC APPROVED — PHASE02 CONSOLIDATED REWORK02`, 2026-09-03, D-03/
 * D-06 + addendum `WHEEL DRAFT VS COMMITTED VALUE`) : les DEUX chemins
 * (natif et maison) séparent désormais explicitement un état de défilement
 * local (`draftMinutes`/`draftSeconds`, jamais réécrit par un re-rendu
 * externe une fois monté) de la valeur métier validée. `onChange` n'est
 * appelé qu'une seule fois, au démontage du composant (fermeture du
 * sélecteur, que ce soit par nouvel appui sur la ligne ou par le backdrop
 * dédié) — jamais à chaque cran de défilement. C'est la cause racine
 * démontrée de D-03 (fermeture prématurée : l'ancienne version réécrivait
 * `selection` depuis un prop externe recalculé à chaque `onChange`, en
 * cours de geste) et de D-06 (aucune distinction brouillon/validé).
 */

const ITEM_HEIGHT = 40;
const SECONDS_VALUES = Array.from({ length: WHEEL_SECONDS_ITEM_COUNT }, (_, index) =>
  secondsIndexToValue(index),
);

/**
 * Hauteur approximative d'une ligne de roulette native SwiftUI
 * (`pickerStyle('wheel')`) — valeur documentée par convention iOS/UIKit
 * (`UIPickerView`), **non mesurée sur ce projet faute d'accès device**.
 * Utilisée uniquement pour positionner la bande de sélection superposée
 * (D-02/roulette native) au centre vertical réel du `Host`, mesuré via
 * `onLayoutContent` — jamais pour contraindre la hauteur du `Host`
 * lui-même (voir D-04 : la contrainte `ITEM_HEIGHT * 3` a été supprimée).
 */
const NATIVE_SELECTION_BAND_HEIGHT = 34;

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
 * options via `<SwiftUIText modifiers={[tag(valeur)]}>`.
 *
 * Correction D-05 : les séparateurs d'unité (`min`/`s`) sont désormais des
 * `SwiftUIText` (`@expo/ui/swift-ui`), jamais des `Text` React Native — un
 * `HStack` natif ne compose que des vues SwiftUI ; mélanger les deux
 * moteurs de rendu comme frères d'un même conteneur natif n'est pas un
 * patron supporté.
 *
 * Correction D-04 : plus aucune hauteur fixe (`ITEM_HEIGHT * 3`) sur le
 * `Host` — `matchContents` laisse SwiftUI dimensionner la roulette
 * nativement (comportement réel non mesurable sans device), la hauteur
 * réelle rendue est captée via `onLayoutContent` uniquement pour
 * positionner la bande de sélection superposée (D-02).
 *
 * Correction D-02 : surface opaque blanche, arrondie, bordée et ombrée
 * (`nativeSurface`) enveloppant le `Host` — masque totalement le contenu
 * sous-jacent, contrairement à la version précédente qui n'avait aucun
 * fond propre à aucun niveau.
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
  // `useState(() => ...)` : initialisé UNE SEULE FOIS au montage — jamais
  // recalculé depuis `totalSeconds` à un rendu ultérieur (brouillon local,
  // voir la note de tête).
  const [initial] = useState(() => fromTotalSeconds(totalSeconds, maxTotalSeconds));
  const [draftMinutes, setDraftMinutes] = useState(initial.minutes);
  const [draftSeconds, setDraftSeconds] = useState(initial.seconds);
  const draftRef = useRef({ minutes: initial.minutes, seconds: initial.seconds });
  const [hostHeight, setHostHeight] = useState<number | null>(null);

  function handleMinutesChange(value: number) {
    if (value === draftRef.current.minutes) {
      return;
    }
    draftRef.current.minutes = value;
    setDraftMinutes(value);
    Haptics.selectionAsync().catch(() => {});
  }

  function handleSecondsChange(value: number) {
    if (value === draftRef.current.seconds) {
      return;
    }
    draftRef.current.seconds = value;
    setDraftSeconds(value);
    Haptics.selectionAsync().catch(() => {});
  }

  useEffect(() => {
    // Ce composant est monté/démonté à chaque ouverture/fermeture de la
    // superposition — le nettoyage à la fermeture est donc l'unique point
    // de validation (D-03/D-06) : la dernière valeur de défilement retenue
    // devient la valeur métier, une seule fois, jamais pendant le geste.
    return () => {
      // `draftRef` n'est pas une ref de nœud DOM — c'est intentionnellement
      // sa valeur AU MOMENT du nettoyage (donc la plus récente) qui doit
      // être lue ici, exactement le comportement que ce commentaire du
      // linter signale par défaut pour une ref de nœud.
      /* eslint-disable react-hooks/exhaustive-deps */
      onChange(
        toTotalSeconds(draftRef.current.minutes, draftRef.current.seconds, maxTotalSeconds),
      );
      /* eslint-enable react-hooks/exhaustive-deps */
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.nativeSurface} testID="duration-wheel-picker">
      {hostHeight !== null ? (
        <View
          testID="duration-wheel-native-selection-band"
          pointerEvents="none"
          style={[
            styles.nativeSelectionBand,
            {
              top: (hostHeight - NATIVE_SELECTION_BAND_HEIGHT) / 2,
              height: NATIVE_SELECTION_BAND_HEIGHT,
            },
          ]}
        />
      ) : null}
      <Host
        style={styles.nativeHost}
        matchContents
        onLayoutContent={(event) => setHostHeight(event.nativeEvent.height)}
      >
        <HStack spacing={spacing[8]} alignment="center">
          <SwiftUIPicker
            selection={draftMinutes}
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
          <SwiftUIText modifiers={[]}>min</SwiftUIText>
          <SwiftUIPicker
            selection={draftSeconds}
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
          <SwiftUIText modifiers={[]}>s</SwiftUIText>
        </HStack>
      </Host>
    </View>
  );
}

/**
 * Mécanisme de détection (chemin maison, Android/web uniquement) :
 * `onScroll` (`scrollEventThrottle={16}`), pas `onMomentumScrollEnd` — voir
 * `wheelPickerMath.ts` pour la justification complète. `onMomentumScrollEnd`/
 * `onScrollEndDrag` ne servent qu'à une correction d'alignement final.
 *
 * Correction `CTRL-01` : chaque valeur visible est aussi sélectionnable par
 * appui direct (`Pressable` par item), pas seulement par glissement.
 *
 * Brouillon local / valeur validée (voir la note de tête) : même patron
 * que le chemin natif — `applyColumnIndex` ne met à jour que l'état local
 * (`draftMinutesRef`/`draftSecondsIndexRef` + re-rendu pour l'affichage),
 * `onChange` n'est appelé qu'au démontage.
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
  const [initial] = useState(() => fromTotalSeconds(totalSeconds, maxTotalSeconds));

  const minutesIndexRef = useRef(initial.minutes);
  const secondsIndexRef = useRef(secondsValueToIndex(initial.seconds));
  const minutesScrollRef = useRef<ScrollView>(null);
  const secondsScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
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

  useEffect(() => {
    // Validation unique à la fermeture (D-03/D-06) — voir la note de tête.
    return () => {
      // Même remarque que la version native : lire ici la valeur la plus
      // récente des refs est le comportement intentionnel, pas une fuite.
      /* eslint-disable react-hooks/exhaustive-deps */
      onChange(
        toTotalSeconds(
          minutesIndexRef.current,
          secondsIndexToValue(secondsIndexRef.current),
          maxTotalSeconds,
        ),
      );
      /* eslint-enable react-hooks/exhaustive-deps */
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyColumnIndex(index: number, column: "minutes" | "seconds") {
    const ref = column === "minutes" ? minutesIndexRef : secondsIndexRef;

    if (index === ref.current) {
      return;
    }
    ref.current = index;
    Haptics.selectionAsync().catch(() => {});
    // Plus d'appel à `onChange` ici — voir la note de tête (brouillon local).
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
  values: readonly number[];
  max: number;
  now: number;
  accessibilityLabel: string;
  testID: string;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollEnd: () => void;
  onScrollEndDrag: () => void;
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
        onAccessibilityAction={(event) => {
          const currentIndex =
            testID === "duration-wheel-seconds" ? secondsValueToIndex(now) : now;
          if (event.nativeEvent.actionName === "increment") {
            onItemPress(Math.min(currentIndex + 1, values.length - 1));
          } else if (event.nativeEvent.actionName === "decrement") {
            onItemPress(Math.max(currentIndex - 1, 0));
          }
        }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
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
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
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
  // D-02 : surface opaque blanche, arrondie, bordée, ombrée — masque
  // totalement le contenu sous-jacent (le `Host` lui-même n'a et ne doit
  // avoir aucun fond propre, c'est cette surface qui le porte).
  nativeSurface: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  },
  // D-04 : pas de hauteur fixe — `matchContents` (prop `Host`) dimensionne
  // au contenu natif réel.
  nativeHost: {
    width: 260,
  },
  // D-02 (bande de sélection native) : une seule bande, positionnée par
  // rapport à `nativeSurface` (parent immédiat commun avec le `Host`),
  // traverse donc visuellement les deux colonnes ET les unités — jamais
  // des capsules séparées par colonne.
  nativeSelectionBand: {
    position: "absolute",
    left: spacing[4],
    right: spacing[4],
    backgroundColor: colors.selectionSurface,
    borderRadius: 8,
  },
});
