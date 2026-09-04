import { Host, HStack, Picker as SwiftUIPicker, Text as SwiftUIText } from "@expo/ui/swift-ui";
import {
  accessibilityLabel as accessibilityLabelModifier,
  bold,
  font,
  frame,
  padding,
  pickerStyle,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

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
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

/**
 * Sélecteur partagé minutes/secondes de `Compte à rebours initial` et
 * `Fin de séance` (T01-S07, plan §5/§6), et de la Durée/Pause d'un Exercice
 * (T01-S08). Bornes par défaut (V1, Composition) : minutes 0–59, secondes
 * `0, 1, …, 59` (pas de `1`, R4-05 — voir `wheelPickerMath.ts`), total
 * 0–3599 s. `maxTotalSeconds` permet à un appelant (Exercice) d'étendre la
 * borne haute à 5999 s (99 min 59 s, `08` l.925) sans dupliquer ce
 * composant.
 *
 * **Restauration de la primitive native — REWORK06** (`[ChatGPT]
 * PLAN_APPROVED — REWORK06 — RESTAURATION CIBLÉE DE LA ROULETTE + VERROU DE
 * CAPITALISATION`, 2026-09-04) : le cycle précédent (`REWORK05`) avait
 * remplacé, sur iOS, la roulette native SwiftUI par l'implémentation maison
 * (`ScrollView`), au motif que trois cycles de corrections de géométrie sur
 * la primitive native avaient échoué à la recette device. Cette décision a
 * été déclarée **NON CONFORME / RÉGRESSION MAJEURE** — la primitive native
 * `pickerStyle('wheel')` porte le look & feel Apple (inertie, courbure,
 * fade natif) qu'aucune réimplémentation maison ne peut reproduire, et une
 * suite Jest verte sur l'implémentation de substitution ne constituait pas
 * une preuve de conformité visuelle. **Règle désormais permanente** (voir
 * `.github/AI_ORCHESTRATION.md`, « Priorité aux primitives natives de
 * l'OS ») : lorsqu'une primitive native existe pour l'interaction demandée,
 * elle doit être systématiquement privilégiée et corrigée dans son
 * intégration (conteneur, largeur, alignement) plutôt que remplacée.
 *
 * Sur iOS, ce composant délègue donc de nouveau à la roulette native
 * SwiftUI (`@expo/ui/swift-ui`, `pickerStyle('wheel')`) ; la
 * réimplémentation maison (`ScrollView` + calcul manuel) reste le seul
 * chemin sur Android/web (`@expo/ui/swift-ui` est iOS/tvOS uniquement).
 *
 * **Toolbar Annuler/Valider — contrat R4-08/R4-09** : `onCancel` ferme sans
 * rien modifier, `onValidate` valide exactement les valeurs actuellement
 * centrées puis ferme — ce sont les SEULES actions qui ferment le
 * sélecteur. Aucun appel automatique au démontage : Annuler doit
 * précisément NE PAS committer, un commit automatique à la fermeture
 * rendrait Annuler impossible à distinguer de Valider.
 */

const ITEM_HEIGHT = 40;
const SECONDS_VALUES = Array.from({ length: WHEEL_SECONDS_ITEM_COUNT }, (_, index) =>
  secondsIndexToValue(index),
);

/**
 * Géométrie canonique de la roulette compacte — `R4-07`/`R4-09` (registre
 * REWORK04), `D-098` (`07 – Registre des décisions`, « Validée
 * post-Figma ») pour les hauteurs. Colonnes/unités : `R4-07` donne des
 * largeurs explicites (`min 76`, unité `min` `32`, intervalle central `22`,
 * `s` `76`, unité `s` `20`, écart chiffre/unité `4`).
 *
 * **Tension documentaire non silencieuse** (conservée de REWORK04) : le
 * paragraphe « Contrat complet du picker » de l'autorisation REWORK04
 * donnait `toolbar 48` et `zone roue 196` (panneau `354×244`), tandis que
 * `D-098` (Registre des décisions, rang de préséance le plus élevé selon
 * `docs/INDEX.md` §6) donne `40 + 150 = 190`. Résolu par un rapprochement :
 * la cible tactile de chaque action reste `48×48` (les deux sources
 * s'accordent), obtenue via `hitSlop` autour d'une boîte visuelle de
 * `28×28` dans une rangée de hauteur VISUELLE `40` (`D-098`). Pour la zone
 * roue, `150` (`D-098`) est retenu, appliqué en `minHeight` (pas une
 * hauteur figée, pour ne pas contraindre artificiellement le rendu natif).
 */
const WHEEL_TOOLBAR_HEIGHT = dimensions.wheelPicker.toolbarHeight;
const WHEEL_CONTENT_MIN_HEIGHT = dimensions.wheelPicker.wheelContentMinHeight;
const WHEEL_ACTION_VISUAL_CIRCLE = dimensions.wheelPicker.actionVisualCircle;
const WHEEL_ACTION_TOUCH_TARGET = dimensions.wheelPicker.actionTouchTarget;
const WHEEL_ACTION_HIT_SLOP = (WHEEL_ACTION_TOUCH_TARGET - WHEEL_ACTION_VISUAL_CIRCLE) / 2;

const NATIVE_MINUTES_COLUMN_WIDTH = 76;
const NATIVE_MINUTES_UNIT_WIDTH = 32;
const NATIVE_COLUMN_INTERVAL = 22;
const NATIVE_SECONDS_COLUMN_WIDTH = 76;
const NATIVE_SECONDS_UNIT_WIDTH = 20;
const NATIVE_DIGIT_UNIT_GAP = 4;

export type DurationWheelPickerProps = {
  totalSeconds: number;
  /** Valide exactement les valeurs actuellement centrées (R4-09) — jamais appelé pendant le défilement, ni par Annuler. */
  onValidate: (totalSeconds: number) => void;
  /** Ferme sans rien modifier (R4-09) — le brouillon local est détruit avec le composant, la valeur validée précédente reste inchangée. */
  onCancel: () => void;
  minutesAccessibilityLabel: string;
  secondsAccessibilityLabel: string;
  cancelAccessibilityLabel: string;
  validateAccessibilityLabel: string;
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
 * D-05 : les séparateurs d'unité (`min`/`s`) sont des `SwiftUIText`
 * (`@expo/ui/swift-ui`), jamais des `Text` React Native — un `HStack`
 * natif ne compose que des vues SwiftUI. R4-07 : ces unités sont en gras
 * (`bold()`), taille `14` (`font({size:14})`).
 *
 * D-04 : la zone roue n'a pas de hauteur figée (`WHEEL_CONTENT_MIN_HEIGHT`
 * est un plancher, `minHeight`, pas `height`) — `matchContents` laisse
 * SwiftUI dimensionner la roulette nativement au-delà de ce plancher si
 * nécessaire (inertie/courbure/fade natifs préservés, REWORK06).
 *
 * D-02 : surface opaque blanche, arrondie, bordée et ombrée
 * (`nativeSurface`) enveloppant toolbar + `Host` — masque totalement le
 * contenu sous-jacent.
 *
 * W-01…W-03 : largeurs bornées, valeurs canoniques `R4-07`.
 *
 * W-04/R4-06 : un seul cadre de sélection, natif SwiftUI — aucune bande
 * superposée par ce fichier (aucun second cadre, jamais de bleu).
 *
 * R4-08/R4-09 : aucune fermeture par tap sur un chiffre ou la zone de
 * sélection — seules les actions Annuler/Valider de la toolbar ferment le
 * sélecteur.
 */
function NativeAppleDurationWheelPicker({
  totalSeconds,
  onValidate,
  onCancel,
  minutesAccessibilityLabel,
  secondsAccessibilityLabel,
  cancelAccessibilityLabel,
  validateAccessibilityLabel,
  maxTotalSeconds = WHEEL_TOTAL_SECONDS_MAX,
}: DurationWheelPickerProps) {
  const minutesMaxIndex = minutesMaxIndexFor(maxTotalSeconds);
  const minutesValues = Array.from({ length: minutesMaxIndex + 1 }, (_, index) => index);
  // `useState(() => ...)` : initialisé UNE SEULE FOIS au montage — jamais
  // recalculé depuis `totalSeconds` à un rendu ultérieur (brouillon local).
  const [initial] = useState(() => fromTotalSeconds(totalSeconds, maxTotalSeconds));
  const [draftMinutes, setDraftMinutes] = useState(initial.minutes);
  const [draftSeconds, setDraftSeconds] = useState(initial.seconds);
  const draftRef = useRef({ minutes: initial.minutes, seconds: initial.seconds });

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

  function handleValidate() {
    onValidate(toTotalSeconds(draftRef.current.minutes, draftRef.current.seconds, maxTotalSeconds));
  }

  return (
    <View style={styles.nativeSurface} testID="duration-wheel-picker">
      <PickerToolbar
        onCancel={onCancel}
        onValidate={handleValidate}
        cancelAccessibilityLabel={cancelAccessibilityLabel}
        validateAccessibilityLabel={validateAccessibilityLabel}
      />
      <Host style={styles.nativeHost} matchContents>
        <HStack spacing={0} alignment="center">
          <SwiftUIPicker
            selection={draftMinutes}
            onSelectionChange={handleMinutesChange}
            modifiers={[
              pickerStyle("wheel"),
              frame({ width: NATIVE_MINUTES_COLUMN_WIDTH }),
              padding({ trailing: NATIVE_DIGIT_UNIT_GAP }),
              accessibilityLabelModifier(minutesAccessibilityLabel),
            ]}
            testID="duration-wheel-minutes"
          >
            {minutesValues.map((value) => (
              <SwiftUIText key={value} modifiers={[tag(value)]}>
                {formatTwoDigits(value)}
              </SwiftUIText>
            ))}
          </SwiftUIPicker>
          <SwiftUIText
            modifiers={[
              frame({ width: NATIVE_MINUTES_UNIT_WIDTH }),
              padding({ trailing: NATIVE_COLUMN_INTERVAL }),
              bold(),
              font({ size: 14 }),
            ]}
          >
            min
          </SwiftUIText>
          <SwiftUIPicker
            selection={draftSeconds}
            onSelectionChange={handleSecondsChange}
            modifiers={[
              pickerStyle("wheel"),
              frame({ width: NATIVE_SECONDS_COLUMN_WIDTH }),
              padding({ trailing: NATIVE_DIGIT_UNIT_GAP }),
              accessibilityLabelModifier(secondsAccessibilityLabel),
            ]}
            testID="duration-wheel-seconds"
          >
            {SECONDS_VALUES.map((value) => (
              <SwiftUIText key={value} modifiers={[tag(value)]}>
                {formatTwoDigits(value)}
              </SwiftUIText>
            ))}
          </SwiftUIPicker>
          <SwiftUIText modifiers={[frame({ width: NATIVE_SECONDS_UNIT_WIDTH }), bold(), font({ size: 14 })]}>
            s
          </SwiftUIText>
        </HStack>
      </Host>
    </View>
  );
}

/**
 * Toolbar Annuler/Valider (R4-09) — cercles `28×28` visibles dans une
 * cible tactile `48×48` (`hitSlop`, jamais un agrandissement de la boîte
 * visuelle elle-même — même patron que `addActivityAction`/`CreateAction`
 * déjà établi dans ce projet).
 *
 * **Glyphes Annuler/Valider — actifs canoniques** (REWORK07B, `[ChatGPT]
 * PLAN_APPROVED — REWORK07B — contrôles canoniques + structure Tour`,
 * 2026-09-04) : la lacune DSF déclarée depuis R4-09 (aucune URL d'export
 * Figma fournie pour ces deux glyphes, rendus provisoirement en caractères
 * Unicode `✕`/`✓`) est fermée — `assets/icons/wheel-action-cancel.svg`
 * (`3089:81`) et `assets/icons/wheel-action-validate.svg` (`3089:83`),
 * octets exacts, consommés via `KodjoIcon` (jamais un tracé inventé ni un
 * pictogramme existant détourné). Couleur portée nativement par le SVG
 * (`#141414`/blanc, déjà identique aux tokens `color.wheelAction*Icon`) —
 * aucun `tintColor` nécessaire.
 */
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
    <View style={styles.toolbar} testID="duration-wheel-toolbar">
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel={cancelAccessibilityLabel}
        hitSlop={WHEEL_ACTION_HIT_SLOP}
        style={styles.actionCancel}
        testID="duration-wheel-cancel"
      >
        <KodjoIcon name="wheel-action-cancel" testID="duration-wheel-cancel-icon" />
      </Pressable>
      <Pressable
        onPress={onValidate}
        accessibilityRole="button"
        accessibilityLabel={validateAccessibilityLabel}
        hitSlop={WHEEL_ACTION_HIT_SLOP}
        style={styles.actionValidate}
        testID="duration-wheel-validate"
      >
        <KodjoIcon name="wheel-action-validate" testID="duration-wheel-validate-icon" />
      </Pressable>
    </View>
  );
}

/**
 * Mécanisme de détection (chemin maison, Android/web uniquement) :
 * `onScroll` (`scrollEventThrottle={16}`), pas `onMomentumScrollEnd` — voir
 * `wheelPickerMath.ts` pour la justification complète. `onMomentumScrollEnd`/
 * `onScrollEndDrag` ne servent qu'à une correction d'alignement final.
 *
 * `CTRL-01` : chaque valeur visible est aussi sélectionnable par appui
 * direct (`Pressable` par item), pas seulement par glissement — ce tap ne
 * ferme jamais le sélecteur (R4-08, même contrat que le chemin natif).
 *
 * Brouillon local / valeur validée, toolbar Annuler/Valider (voir la note
 * de tête) : même patron que le chemin natif.
 */
function LegacyDurationWheelPicker({
  totalSeconds,
  onValidate,
  onCancel,
  minutesAccessibilityLabel,
  secondsAccessibilityLabel,
  cancelAccessibilityLabel,
  validateAccessibilityLabel,
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
    // Alignement initial, une seule fois au montage — plus de fonction de
    // nettoyage nécessaire ici : aucun commit automatique au démontage à
    // conserver, Annuler/Valider sont les seules actions qui valident/
    // ferment (R4-08/R4-09).
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
    Haptics.selectionAsync().catch(() => {});
    // Pas d'appel de validation ici — brouillon local uniquement (R4-08).
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

  function handleValidate() {
    onValidate(
      toTotalSeconds(
        minutesIndexRef.current,
        secondsIndexToValue(secondsIndexRef.current),
        maxTotalSeconds,
      ),
    );
  }

  return (
    <View style={styles.legacySurface} testID="duration-wheel-picker">
      <PickerToolbar
        onCancel={onCancel}
        onValidate={handleValidate}
        cancelAccessibilityLabel={cancelAccessibilityLabel}
        validateAccessibilityLabel={validateAccessibilityLabel}
      />
      <View style={styles.container}>
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
  },
  // R4-09 : toolbar en haut, hauteur visuelle `40` (`D-098`) — les actions
  // atteignent `48×48` de cible tactile via `hitSlop`, pas via cette
  // hauteur de rangée (voir la note de tête du fichier).
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
  // D-04 : pas de hauteur figée sur le `Host` lui-même — `matchContents`
  // dimensionne au contenu natif réel. `minHeight` garantit seulement le
  // plancher canonique `D-098` (voir la note de tête du fichier).
  // `alignSelf: "center"` centre la roulette (largeur intrinsèque `234`,
  // R4-07) dans `nativeSurface`, plus large (largeur de la ligne hôte).
  nativeHost: {
    alignSelf: "center",
    minHeight: WHEEL_CONTENT_MIN_HEIGHT,
  },
});
