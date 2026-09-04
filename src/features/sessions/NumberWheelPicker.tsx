import { Host, Picker as SwiftUIPicker, Text as SwiftUIText } from "@expo/ui/swift-ui";
import {
  accessibilityLabel as accessibilityLabelModifier,
  frame,
  pickerStyle,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import {
  WHEEL_NUMBER_MAX,
  WHEEL_NUMBER_MIN,
  clampIndex,
  indexToOffset,
  offsetToIndex,
} from "@/features/sessions/wheelPickerMath";
import { WheelSelectionOverlay } from "@/features/sessions/WheelSelectionOverlay";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

/**
 * Roulette à colonne unique pour Répétitions/Séries d'un Exercice (T01-S08,
 * D-092), reconstruite en **REWORK12** (`[ChatGPT] CHANGES_REQUESTED —
 * REWORK12 — Activité + intégration dans Composition`, 2026-09-04, ACT-07)
 * pour suivre le contrat transverse `Picker / Popover — Source exact`
 * (`2537:1174`), variante `Type=Numeric wheel` (`3210:49`) — voir
 * `13 – Contrats d'écran.md`, « Contrat transverse — Sélections numériques
 * compactes », et le rapport de généralisation
 * `.github/orchestration/reports/2026-09-04_numeric-wheel-generalization.md`
 * (frame ouverte de référence pour Séries : `1992:9618`, instance
 * `3211:4012`). L'ancienne implémentation (`onChange` immédiat à chaque cran
 * de défilement, jamais de brouillon ni de confirmation explicite) est
 * remplacée : ce composant est désormais « non fonctionnel » au sens du
 * contrat transverse, qui exige un brouillon local détruit par Annuler et
 * validé uniquement par Confirmer — jamais un engagement au fil du geste.
 *
 * **Primitive native — même priorité que `DurationWheelPicker`** (`.github/
 * AI_ORCHESTRATION.md`, « Priorité aux primitives natives de l'OS ») : sur
 * iOS, ce composant délègue à `@expo/ui/swift-ui`
 * (`pickerStyle('wheel')`) — une seule colonne, valeurs `WHEEL_NUMBER_MIN`…
 * `WHEEL_NUMBER_MAX` (`1`…`99`). La réimplémentation `ScrollView` reste le
 * seul chemin sur Android/web (`@expo/ui/swift-ui` est iOS/tvOS uniquement),
 * même patron que `DurationWheelPicker`, non répété en détail ici.
 *
 * **Toolbar Annuler/Confirmer** : `PickerToolbar` ci-dessous réutilise
 * volontairement les mêmes actifs canoniques (`wheel-action-cancel.svg`/
 * `wheel-action-validate.svg`) et les mêmes tokens de géométrie/couleur
 * (`dimensions.wheelPicker`, `colors.wheelAction*`) que celle de
 * `DurationWheelPicker.tsx` — **dupliquée localement plutôt qu'importée**,
 * cette dernière restant une baseline gelée qu'aucune mission n'est
 * autorisée à modifier (y compris pour en extraire un import partagé) sans
 * autorisation `CHANGE_REQUEST_REQUIRED` distincte ; la duplication porte
 * ici sur un composant de präsentation minimal (deux `Pressable`), pas sur
 * une logique/geometrie dupliquée par ailleurs interdite par le protocole.
 *
 * Contrat `onValidate`/`onCancel` — identique à `DurationWheelPicker` :
 * `onValidate` valide exactement la valeur actuellement centrée (jamais
 * pendant le défilement) ; `onCancel` ferme sans rien modifier. Toucher la
 * roulette, la zone sélectionnée ou arrêter le défilement ne ferme jamais le
 * sélecteur (seules Annuler/Confirmer ferment).
 */

const ITEM_HEIGHT = 40;
const VALUES = Array.from(
  { length: WHEEL_NUMBER_MAX - WHEEL_NUMBER_MIN + 1 },
  (_, index) => WHEEL_NUMBER_MIN + index,
);

const WHEEL_TOOLBAR_HEIGHT = dimensions.wheelPicker.toolbarHeight;
const WHEEL_CONTENT_MIN_HEIGHT = dimensions.wheelPicker.wheelContentMinHeight;
const WHEEL_ACTION_VISUAL_CIRCLE = dimensions.wheelPicker.actionVisualCircle;
const WHEEL_ACTION_TOUCH_TARGET = dimensions.wheelPicker.actionTouchTarget;
const WHEEL_ACTION_HIT_SLOP = (WHEEL_ACTION_TOUCH_TARGET - WHEEL_ACTION_VISUAL_CIRCLE) / 2;

export type NumberWheelPickerProps = {
  value: number;
  /** Valide exactement la valeur actuellement centrée — jamais appelé pendant le défilement, ni par Annuler. */
  onValidate: (value: number) => void;
  /** Ferme sans rien modifier — le brouillon local est détruit avec le composant, la valeur validée précédente reste inchangée. */
  onCancel: () => void;
  accessibilityLabel: string;
  cancelAccessibilityLabel: string;
  validateAccessibilityLabel: string;
  testID?: string;
};

export function NumberWheelPicker(props: NumberWheelPickerProps) {
  if (Platform.OS === "ios") {
    return <NativeAppleNumberWheelPicker {...props} />;
  }
  return <LegacyNumberWheelPicker {...props} />;
}

/**
 * Roulette native SwiftUI (iOS uniquement) — `Host` + `Picker`
 * (`pickerStyle('wheel')`), une seule colonne, chaque option portant sa
 * valeur via `<SwiftUIText modifiers={[tag(valeur)]}>`. Même patron que
 * `NativeAppleDurationWheelPicker` (`DurationWheelPicker.tsx`), pas répété
 * en détail ici : zone roue en `minHeight` (jamais figée), surface opaque
 * blanche arrondie/bordée/ombrée, aucune fermeture par toucher d'un chiffre
 * ou de la zone sélectionnée.
 */
function NativeAppleNumberWheelPicker({
  value,
  onValidate,
  onCancel,
  accessibilityLabel,
  cancelAccessibilityLabel,
  validateAccessibilityLabel,
  testID = "number-wheel-picker",
}: NumberWheelPickerProps) {
  // `useState(() => ...)` : initialisé UNE SEULE FOIS au montage — jamais
  // recalculé depuis `value` à un rendu ultérieur (brouillon local), même
  // patron que `DurationWheelPicker`.
  const [initial] = useState(() => WHEEL_NUMBER_MIN + clampIndex(value - WHEEL_NUMBER_MIN, WHEEL_NUMBER_MAX - WHEEL_NUMBER_MIN));
  const [draft, setDraft] = useState(initial);
  const draftRef = useRef(initial);

  function handleChange(next: number) {
    if (next === draftRef.current) {
      return;
    }
    draftRef.current = next;
    setDraft(next);
    Haptics.selectionAsync().catch(() => {});
  }

  function handleValidate() {
    onValidate(draftRef.current);
  }

  return (
    <View style={styles.nativeSurface} testID={testID}>
      <PickerToolbar
        onCancel={onCancel}
        onValidate={handleValidate}
        cancelAccessibilityLabel={cancelAccessibilityLabel}
        validateAccessibilityLabel={validateAccessibilityLabel}
      />
      <Host style={styles.nativeHost} matchContents>
        <SwiftUIPicker
          selection={draft}
          onSelectionChange={handleChange}
          modifiers={[pickerStyle("wheel"), frame({ width: 96 }), accessibilityLabelModifier(accessibilityLabel)]}
          testID="number-wheel-column"
        >
          {VALUES.map((item) => (
            <SwiftUIText key={item} modifiers={[tag(item)]}>
              {String(item)}
            </SwiftUIText>
          ))}
        </SwiftUIPicker>
      </Host>
    </View>
  );
}

/** Même patron que `PickerToolbar` de `DurationWheelPicker.tsx` — voir la note de tête pour la justification de la duplication locale. */
function PickerToolbar({
  onCancel,
  onValidate,
  cancelAccessibilityLabel,
  validateAccessibilityLabel,
}: {
  onCancel: () => void;
  onValidate: () => void;
  cancelAccessibilityLabel: string;
  validateAccessibilityLabel: string;
}) {
  return (
    <View style={styles.toolbar} testID="number-wheel-toolbar">
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel={cancelAccessibilityLabel}
        hitSlop={WHEEL_ACTION_HIT_SLOP}
        style={styles.actionCancel}
        testID="number-wheel-cancel"
      >
        <KodjoIcon name="wheel-action-cancel" testID="number-wheel-cancel-icon" />
      </Pressable>
      <Pressable
        onPress={onValidate}
        accessibilityRole="button"
        accessibilityLabel={validateAccessibilityLabel}
        hitSlop={WHEEL_ACTION_HIT_SLOP}
        style={styles.actionValidate}
        testID="number-wheel-validate"
      >
        <KodjoIcon name="wheel-action-validate" testID="number-wheel-validate-icon" />
      </Pressable>
    </View>
  );
}

/**
 * Chemin Android/web — `ScrollView` + détection `onScroll` (même patron que
 * `LegacyDurationWheelPicker`, pas répété en détail ici) : brouillon local
 * uniquement pendant le défilement/l'appui direct, validé uniquement par
 * Confirmer.
 */
function LegacyNumberWheelPicker({
  value,
  onValidate,
  onCancel,
  accessibilityLabel,
  cancelAccessibilityLabel,
  validateAccessibilityLabel,
  testID = "number-wheel-picker",
}: NumberWheelPickerProps) {
  const initialIndex = clampIndex(value - WHEEL_NUMBER_MIN, WHEEL_NUMBER_MAX - WHEEL_NUMBER_MIN);
  const [initial] = useState(() => initialIndex);
  const indexRef = useRef(initial);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: indexToOffset(initial, ITEM_HEIGHT), animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyIndex(index: number) {
    if (index === indexRef.current) {
      return;
    }
    indexRef.current = index;
    Haptics.selectionAsync().catch(() => {});
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = offsetToIndex(
      event.nativeEvent.contentOffset.y,
      ITEM_HEIGHT,
      WHEEL_NUMBER_MAX - WHEEL_NUMBER_MIN,
    );
    applyIndex(index);
  }

  function align() {
    scrollRef.current?.scrollTo({ y: indexToOffset(indexRef.current, ITEM_HEIGHT), animated: true });
  }

  function handleItemPress(index: number) {
    applyIndex(index);
    align();
  }

  function handleValidate() {
    onValidate(WHEEL_NUMBER_MIN + indexRef.current);
  }

  return (
    <View style={styles.legacySurface} testID={testID}>
      <PickerToolbar
        onCancel={onCancel}
        onValidate={handleValidate}
        cancelAccessibilityLabel={cancelAccessibilityLabel}
        validateAccessibilityLabel={validateAccessibilityLabel}
      />
      <View style={styles.wheelArea}>
        <ScrollView
          ref={scrollRef}
          testID="number-wheel-column"
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
          accessibilityValue={{
            min: WHEEL_NUMBER_MIN,
            max: WHEEL_NUMBER_MAX,
            now: WHEEL_NUMBER_MIN + initial,
          }}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "increment") {
              handleItemPress(Math.min(indexRef.current + 1, VALUES.length - 1));
            } else if (event.nativeEvent.actionName === "decrement") {
              handleItemPress(Math.max(indexRef.current - 1, 0));
            }
          }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        >
          {VALUES.map((item, index) => (
            <Pressable
              key={item}
              style={styles.item}
              onPress={() => handleItemPress(index)}
              accessibilityRole="button"
              accessibilityLabel={String(item)}
              testID={`number-wheel-column-item-${item}`}
            >
              <Text style={styles.itemLabel}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <WheelSelectionOverlay itemHeight={ITEM_HEIGHT} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: spacing[8],
  },
  legacySurface: {
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
    alignItems: "center",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: WHEEL_TOOLBAR_HEIGHT,
  },
  actionCancel: {
    width: WHEEL_ACTION_VISUAL_CIRCLE,
    height: WHEEL_ACTION_VISUAL_CIRCLE,
    borderRadius: WHEEL_ACTION_VISUAL_CIRCLE / 2,
    backgroundColor: colors.wheelActionCancelBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  actionValidate: {
    width: WHEEL_ACTION_VISUAL_CIRCLE,
    height: WHEEL_ACTION_VISUAL_CIRCLE,
    borderRadius: WHEEL_ACTION_VISUAL_CIRCLE / 2,
    backgroundColor: colors.wheelActionValidateBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  nativeHost: {
    alignSelf: "center",
    minHeight: WHEEL_CONTENT_MIN_HEIGHT,
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
});
