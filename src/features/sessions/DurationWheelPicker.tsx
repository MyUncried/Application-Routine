import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
 * **Changement de primitive — audit indépendant REWORK04** (`[ChatGPT]
 * CHANGES_REQUESTED — Composition d'une séance — audit indépendant
 * REWORK04`, 2026-09-03) : ce composant délégait auparavant, sur iOS, à la
 * roulette native SwiftUI (`@expo/ui/swift-ui`, `pickerStyle('wheel')`).
 * Après **trois cycles consécutifs** de corrections de géométrie sur cette
 * primitive (`REWORK02`, `REWORK03`, `REWORK04`), toutes jugées
 * insuffisantes à la recette device sans qu'aucune preuve de rendu réel
 * n'ait jamais été obtenue dans cet environnement (aucun simulateur/
 * appareil/accès caméra), l'audit indépendant autorise explicitement à
 * « sélectionner une primitive standard Expo/React Native/lib déjà
 * installée et documenter le choix » si `@expo/ui` ne rend pas
 * effectivement le contrat. **Décision retenue** : ce composant utilise
 * désormais l'implémentation maison (`ScrollView` + calcul manuel,
 * auparavant réservée à Android/web) sur **toutes les plateformes**, y
 * compris iOS — `Platform.OS` n'est plus consulté ici. Justification :
 * cette implémentation est intégralement composée de primitives React
 * Native standard (`View`, `ScrollView`, `Text`, `Pressable`), donc son
 * rendu est { a } entièrement sous contrôle direct du code de ce fichier —
 * plus de frontière de rendu natif opaque à ce sandbox — et { b }
 * réellement exercée par les tests Jest de ce projet (contrairement aux
 * mocks `@expo/ui`, qui ne prouvent que la couche JS et masquaient
 * précisément l'échec device signalé par cet audit). Ce choix reste
 * néanmoins `NON_VERIFIABLE_DEVICE` tant qu'une capture iPhone réelle n'a
 * pas confirmé le rendu — voir le rapport de mission.
 *
 * **Toolbar Annuler/Valider — contrat R4-08/R4-09** : `onCancel` ferme sans
 * rien modifier, `onValidate` valide exactement les valeurs actuellement
 * centrées puis ferme — ce sont les SEULES actions qui ferment le
 * sélecteur. Aucun appel automatique au démontage : Annuler doit
 * précisément NE PAS committer, un commit automatique à la fermeture
 * rendrait Annuler impossible à distinguer de Valider.
 *
 * **Bande de sélection unique — R4-06/W-07/W-11** : une seule bande grise
 * (`colors.divider`/`colors.surface`, jamais `colors.selectionSurface`
 * bleu pâle — l'ancienne `WheelSelectionOverlay`, réutilisée par
 * `NumberWheelPicker`, produisait par erreur une bande PAR COLONNE d'une
 * teinte bleue, jamais remarqué jusqu'à cet audit) traverse désormais
 * visuellement les DEUX colonnes ET les DEUX unités en une fois — un seul
 * calque `position: absolute` positionné par rapport au conteneur commun
 * (`wheelRow`), pas un calque par colonne.
 */

const ITEM_HEIGHT = 40;
const SECONDS_VALUES = Array.from({ length: WHEEL_SECONDS_ITEM_COUNT }, (_, index) =>
  secondsIndexToValue(index),
);

const WHEEL_TOOLBAR_HEIGHT = dimensions.wheelPicker.toolbarHeight;
const WHEEL_ACTION_VISUAL_CIRCLE = dimensions.wheelPicker.actionVisualCircle;
const WHEEL_ACTION_TOUCH_TARGET = dimensions.wheelPicker.actionTouchTarget;
const WHEEL_ACTION_HIT_SLOP = (WHEEL_ACTION_TOUCH_TARGET - WHEEL_ACTION_VISUAL_CIRCLE) / 2;

/**
 * Géométrie canonique de la roulette — `R4-07` (mission de design
 * `2026-09-03_design-complements-composition-wheel.md`, registre R4). Ces
 * six mesures sont des valeurs exactes fournies par cette mission, jamais
 * un calcul dynamique dépendant de la largeur de l'écran (abandonné au
 * cycle précédent — un contrat fixe existe désormais, il n'y a plus lieu
 * de le dériver).
 */
const MINUTES_COLUMN_WIDTH = 76;
const MINUTES_UNIT_WIDTH = 32;
const COLUMN_INTERVAL = 22;
const SECONDS_COLUMN_WIDTH = 76;
const SECONDS_UNIT_WIDTH = 20;
const DIGIT_UNIT_GAP = 4;
const WHEEL_ROW_WIDTH =
  MINUTES_COLUMN_WIDTH +
  DIGIT_UNIT_GAP +
  MINUTES_UNIT_WIDTH +
  COLUMN_INTERVAL +
  SECONDS_COLUMN_WIDTH +
  DIGIT_UNIT_GAP +
  SECONDS_UNIT_WIDTH;

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

/**
 * Toolbar Annuler/Valider (R4-09) — cercles `28×28` visibles dans une
 * cible tactile `48×48` (`hitSlop`, jamais un agrandissement de la boîte
 * visuelle elle-même — même patron que `addActivityAction`/`CreateAction`
 * déjà établi dans ce projet).
 *
 * **Glyphes Annuler/Valider — lacune DSF déclarée** (R4-09 exige des
 * icônes croix/coche ; contrairement à l'icône Tour, R4-11, aucune URL
 * d'export Figma n'a été fournie pour ces deux glyphes dans aucune des
 * deux autorisations REWORK04). Rendus provisoirement en caractères
 * Unicode (`✕`, `✓`) plutôt qu'un tracé SVG inventé ou un pictogramme
 * existant détourné — lacune explicitement escaladée dans le rapport de
 * mission, pas un défaut silencieux.
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
        <Text style={styles.actionGlyphCancel}>✕</Text>
      </Pressable>
      <Pressable
        onPress={onValidate}
        accessibilityRole="button"
        accessibilityLabel={validateAccessibilityLabel}
        hitSlop={WHEEL_ACTION_HIT_SLOP}
        style={styles.actionValidate}
        testID="duration-wheel-validate"
      >
        <Text style={styles.actionGlyphValidate}>✓</Text>
      </Pressable>
    </View>
  );
}

/**
 * Bande de sélection unique (R4-06/W-07/W-11) — un seul calque couvrant la
 * largeur totale de `wheelRow` (`WHEEL_ROW_WIDTH`, les deux colonnes ET les
 * deux unités), positionné par rapport à ce conteneur commun. `pointerEvents
 * ="none"` sur chaque calque : ne doit jamais intercepter le geste de
 * défilement des `ScrollView` sous-jacents.
 */
function WheelSelectionBand() {
  return (
    <View style={styles.selectionBandLayer} pointerEvents="none" testID="wheel-selection-overlay">
      <View style={[styles.fade, { height: ITEM_HEIGHT, top: 0 }]} />
      <View
        style={[styles.band, { top: ITEM_HEIGHT, height: ITEM_HEIGHT }]}
        testID="wheel-selection-band"
      />
      <View style={[styles.fade, { height: ITEM_HEIGHT, bottom: 0 }]} />
    </View>
  );
}

/**
 * Mécanisme de détection : `onScroll` (`scrollEventThrottle={16}`), pas
 * `onMomentumScrollEnd` — voir `wheelPickerMath.ts` pour la justification
 * complète. `onMomentumScrollEnd`/`onScrollEndDrag` ne servent qu'à une
 * correction d'alignement final.
 *
 * `CTRL-01` : chaque valeur visible est aussi sélectionnable par appui
 * direct (`Pressable` par item), pas seulement par glissement — ce tap ne
 * ferme jamais le sélecteur (R4-08).
 *
 * Brouillon local / valeur validée, toolbar Annuler/Valider (voir la note
 * de tête du fichier).
 */
export function DurationWheelPicker({
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
    // Alignement initial, une seule fois au montage — aucune fonction de
    // nettoyage : Annuler/Valider sont les seules actions qui valident/
    // ferment (R4-08/R4-09), jamais le démontage seul.
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
    <View style={styles.surface} testID="duration-wheel-picker">
      <PickerToolbar
        onCancel={onCancel}
        onValidate={handleValidate}
        cancelAccessibilityLabel={cancelAccessibilityLabel}
        validateAccessibilityLabel={validateAccessibilityLabel}
      />
      <View style={styles.wheelRow} testID="duration-wheel-row">
        <WheelSelectionBand />
        <WheelColumn
          scrollRef={minutesScrollRef}
          values={minutesValues}
          max={minutesMaxIndex}
          now={initial.minutes}
          accessibilityLabel={minutesAccessibilityLabel}
          testID="duration-wheel-minutes"
          columnWidth={MINUTES_COLUMN_WIDTH}
          onScroll={(event) => handleColumnScroll(event, "minutes")}
          onMomentumScrollEnd={() => alignColumn("minutes")}
          onScrollEndDrag={() => alignColumn("minutes")}
          onItemPress={(index) => handleItemPress(index, "minutes")}
        />
        <Text style={[styles.unit, { width: MINUTES_UNIT_WIDTH, marginRight: COLUMN_INTERVAL }]}>
          min
        </Text>
        <WheelColumn
          scrollRef={secondsScrollRef}
          values={SECONDS_VALUES}
          max={secondsIndexToValue(WHEEL_SECONDS_MAX_INDEX)}
          now={initial.seconds}
          accessibilityLabel={secondsAccessibilityLabel}
          testID="duration-wheel-seconds"
          columnWidth={SECONDS_COLUMN_WIDTH}
          onScroll={(event) => handleColumnScroll(event, "seconds")}
          onMomentumScrollEnd={() => alignColumn("seconds")}
          onScrollEndDrag={() => alignColumn("seconds")}
          onItemPress={(index) => handleItemPress(index, "seconds")}
        />
        <Text style={[styles.unit, { width: SECONDS_UNIT_WIDTH }]}>s</Text>
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
  columnWidth: number;
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
  columnWidth,
  onScroll,
  onMomentumScrollEnd,
  onScrollEndDrag,
  onItemPress,
}: WheelColumnProps) {
  return (
    <ScrollView
      ref={scrollRef}
      testID={testID}
      style={[styles.column, { width: columnWidth, marginRight: DIGIT_UNIT_GAP }]}
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
        const currentIndex = testID === "duration-wheel-seconds" ? secondsValueToIndex(now) : now;
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
  );
}

const styles = StyleSheet.create({
  // Surface opaque blanche, arrondie, bordée et ombrée — masque totalement
  // le contenu sous-jacent.
  surface: {
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
  // R4-09 : toolbar en haut, hauteur visuelle `40` (`D-098`) — les actions
  // atteignent `48×48` de cible tactile via `hitSlop`, pas via cette
  // hauteur de rangée.
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
  actionGlyphCancel: {
    fontSize: 14,
    lineHeight: 16,
    color: colors.wheelActionCancelIcon,
  },
  actionGlyphValidate: {
    fontSize: 14,
    lineHeight: 16,
    color: colors.wheelActionValidateIcon,
  },
  // R4-07 : rangée de largeur canonique fixe (`WHEEL_ROW_WIDTH`, `234`),
  // centrée dans `surface` (plus large — largeur de la ligne hôte).
  wheelRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    width: WHEEL_ROW_WIDTH,
    height: ITEM_HEIGHT * 3,
    paddingVertical: spacing[8],
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
  // R4-07 : unités `min`/`s` en gras, `14/18` — auparavant `type.body`
  // (Regular, `14/20`), et positionnées hors du conteneur commun de
  // colonnes (`separator`, cycle précédent) plutôt qu'alignées au gap exact.
  unit: {
    ...type.compactCardTitle,
    color: colors.textPrimary,
    textAlign: "left",
  },
  // R4-06/W-07/W-11 : bande de sélection UNIQUE couvrant toute la largeur
  // de `wheelRow` (colonnes + unités), voir `WheelSelectionBand` — jamais
  // une bande par colonne (défaut de l'ancienne `WheelSelectionOverlay`,
  // par ailleurs teintée en bleu pâle, `colors.selectionSurface`, plutôt
  // qu'en gris neutre).
  // Aucun `zIndex` explicite : rendu comme PREMIER enfant de `wheelRow`,
  // ce calque peint donc naturellement SOUS les colonnes suivantes (ordre
  // de peinture par défaut de React Native) — visible en arrière-plan des
  // chiffres, jamais par-dessus.
  selectionBandLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  band: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    opacity: 0.55,
  },
});
