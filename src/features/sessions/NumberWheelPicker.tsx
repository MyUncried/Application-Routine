import { Host, Picker as SwiftUIPicker, Text as SwiftUIText } from "@expo/ui/swift-ui";
import {
  accessibilityLabel as accessibilityLabelModifier,
  foregroundStyle,
  frame,
  pickerStyle,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import type { FailureSeriesTarget } from "@/domain/activities/ExecutionParameters";
import {
  WHEEL_NUMBER_MAX,
  WHEEL_NUMBER_MIN,
  clampIndex,
  indexToOffset,
  offsetToIndex,
  type WheelTargetBounds,
} from "@/features/sessions/wheelPickerMath";
import { WheelSelectionOverlay } from "@/features/sessions/WheelSelectionOverlay";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
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
 *
 * **PRE-4 story 3.5 (AD-7, Q8, Q14)** : Sélecteur de cible en Répétitions par
 * props optionnelles — `targetBounds` (1..100), `failureOption` (ligne de tête
 * « Aucune répétition, à l’échec » DANS la colonne unique, avant les nombres) et
 * `valueAccessibilityLabel` (nombre annoncé avec son unité). Même primitive, même
 * barre ✕ / ✓ ; l'échec sort par `onValidateFailure({ kind: "FAILURE" })`. Sans
 * ces props, 1..99 (`WHEEL_NUMBER_MAX`, non modifié) et rendu inchangés.
 */

const ITEM_HEIGHT = 40;
const VALUES = Array.from(
  { length: WHEEL_NUMBER_MAX - WHEEL_NUMBER_MIN + 1 },
  (_, index) => WHEEL_NUMBER_MIN + index,
);

const WHEEL_TOOLBAR_HEIGHT = dimensions.wheelPicker.toolbarHeight;
const WHEEL_CONTENT_MIN_HEIGHT = dimensions.wheelPicker.wheelContentMinHeight;
const WHEEL_ACTION_VISUAL_CIRCLE = dimensions.wheelPicker.actionVisualCircle;
const WHEEL_ACTION_ICON = dimensions.wheelPicker.actionIcon;
const WHEEL_ACTION_TOUCH_TARGET = dimensions.wheelPicker.actionTouchTarget;
const WHEEL_ACTION_HIT_SLOP = (WHEEL_ACTION_TOUCH_TARGET - WHEEL_ACTION_VISUAL_CIRCLE) / 2;
/**
 * T02-S02 : largeur canonique du panneau `Type=Numeric wheel` (`144`,
 * CE-T01-14/D-104) — « largeur déterminée par deux cibles tactiles de
 * largeur `48` et une colonne sélectionnée `56 × 34` centrée »
 * (`48 + 48 + 48 = 144`, `12 – Architecture technique.md`). La hauteur reste
 * dérivée (`53` + `minHeight 150` = `203`), jamais figée.
 */
const WHEEL_NUMERIC_WIDTH = dimensions.wheelPicker.numericWidth;

/**
 * PRE-4 story 3.5 (AC7, P33) : avec la ligne de tête, la surface prend la largeur du
 * Sélecteur de cible en Durée (`330`, même panneau `AnchoredPanel`, Q41) et la colonne
 * native garde une largeur EXPLICITE (`frame`), élargie à la surface moins ses marges,
 * pour que « Aucune répétition, à l’échec » ne soit pas tronqué. Valeurs d'intégration
 * (aucun jeton modifié, aucun relevé Figma : ligne de tête `NON VÉRIFIABLE`). Sans
 * `failureOption`, `144` / `96` inchangés.
 */
const WHEEL_FAILURE_WIDTH = dimensions.wheelPicker.durationWidth;
const NATIVE_COLUMN_WIDTH = 96;
const NATIVE_FAILURE_COLUMN_WIDTH = WHEEL_FAILURE_WIDTH - 2 * spacing[12];

/**
 * Story 3.5 (Q14, AD-7) : tag SwiftUI de la ligne de tête — chaîne, donc jamais
 * confondue avec un nombre de la colonne (le `Picker` natif accepte des tags `String`
 * et `Double` dans la même liste). Interne au composant : il ne sort jamais.
 */
const FAILURE_TAG = "failure";
const FAILURE_TARGET: FailureSeriesTarget = { kind: "FAILURE" };

type NumberWheelPickerBaseProps = {
  value: number;
  /** Valide exactement la valeur actuellement centrée — jamais appelé pendant le défilement, ni par Annuler. */
  onValidate: (value: number) => void;
  /** Ferme sans rien modifier — le brouillon local est détruit avec le composant, la valeur validée précédente reste inchangée. */
  onCancel: () => void;
  accessibilityLabel: string;
  cancelAccessibilityLabel: string;
  validateAccessibilityLabel: string;
  testID?: string;
  /**
   * PRE-4 story 3.5 (AC7, FR-07-08) — libellé d'accessibilité d'un nombre, avec son
   * unité (lexique, « 12 répétitions »). Sans elle, inchangé (le nombre seul).
   */
  valueAccessibilityLabel?: (value: number) => string;
};

/**
 * PRE-4 story 3.5 (AD-7, AC8) : props optionnelles seulement. `targetBounds` remplace
 * `WHEEL_NUMBER_MIN..WHEEL_NUMBER_MAX` (1..99, inchangés) par les bornes de Cible
 * (1..100) ; `failureOption` exige `targetBounds` (union de props, même patron que
 * `DurationWheelPicker`). Sans elles, comportement actuel strictement inchangé
 * (Composition, roulette des tours, Profil).
 */
export type NumberWheelPickerProps = NumberWheelPickerBaseProps &
  (
    | { targetBounds?: WheelTargetBounds; failureOption?: undefined }
    | { targetBounds: WheelTargetBounds; failureOption: NumberWheelFailureOption }
  );

/**
 * Story 3.5 (Q8, Q14) — ligne de tête « Aucune répétition, à l’échec », PREMIÈRE ligne
 * de la colonne unique, puis les entiers des bornes : ni grisé, ni filet, ni bloc
 * séparé, la sélection est rendue par la roue elle-même. Placée sur la ligne de tête,
 * la roue choisit l'échec : le ✓ émet une `SeriesTarget` `FAILURE` par
 * `onValidateFailure`, jamais un nombre ni une sentinelle (`onValidate` n'est jamais
 * appelé pour l'échec). Aucune haptique ajoutée. Contrat d'usage : la présence de
 * `failureOption` est fixée au montage (la Feuille démonte le panneau au changement de
 * Mode) ; la retirer ou l'ajouter ensuite n'est pas pris en charge (garde au ✓ seulement).
 */
export type NumberWheelFailureOption = {
  /** « Aucune répétition, à l’échec » (lexique). */
  label: string;
  /** Position d'ouverture : la ligne de tête (vrai) ou la valeur numérique `value`. */
  initiallySelected: boolean;
  onValidateFailure: (target: FailureSeriesTarget) => void;
};

/** Bornes effectives et liste des nombres de la colonne (liste partagée sans `targetBounds`). */
function wheelRange(targetBounds: WheelTargetBounds | undefined): {
  min: number;
  max: number;
  values: readonly number[];
} {
  if (targetBounds === undefined) {
    return { min: WHEEL_NUMBER_MIN, max: WHEEL_NUMBER_MAX, values: VALUES };
  }
  const { min, max } = targetBounds;
  // Convention du projet : seule une entrée invalide lève (bornes de Cible du domaine, entières).
  if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
    throw new RangeError(`NumberWheelPicker : bornes de Cible invalides (${min}..${max})`);
  }
  return { min, max, values: Array.from({ length: max - min + 1 }, (_, index) => min + index) };
}

/** Nombre ramené dans les bornes (entier) — aucune valeur hors bornes ni fractionnaire ne sort (AC5). */
function clampToRange(value: number, min: number, max: number): number {
  // Story 3.5 : une valeur non finie (NaN, ±∞) ouvre sur la borne basse, même garde que `handleChange`.
  if (!Number.isFinite(value)) return min;
  return min + clampIndex(Math.round(value) - min, max - min);
}

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
 *
 * **Correction bloquante — visibilité des valeurs** (« CORRECTION
 * BLOQUANTE AVANT T01-S09 — VISIBILITÉ DES ROULETTES », 2026-09-05) : même
 * cause racine et même correction que `NativeAppleDurationWheelPicker`
 * (voir sa note de tête pour la justification complète) — chaque
 * `SwiftUIText` de la colonne porte désormais explicitement
 * `foregroundStyle(colors.textPrimary)`, jamais la couleur de premier plan
 * par défaut de SwiftUI (dynamique, non fiable derrière ce pont natif).
 */
function NativeAppleNumberWheelPicker({
  value,
  onValidate,
  onCancel,
  accessibilityLabel,
  cancelAccessibilityLabel,
  validateAccessibilityLabel,
  testID = "number-wheel-picker",
  valueAccessibilityLabel,
  targetBounds,
  failureOption,
}: NumberWheelPickerProps) {
  const range = wheelRange(targetBounds);
  // `useState(() => ...)` : initialisé UNE SEULE FOIS au montage — jamais
  // recalculé depuis `value` à un rendu ultérieur (brouillon local), même
  // patron que `DurationWheelPicker`. Story 3.5 : la ligne de tête est une
  // position d'ouverture possible (`initiallySelected`).
  const [initial] = useState<number | typeof FAILURE_TAG>(() =>
    failureOption?.initiallySelected === true ? FAILURE_TAG : clampToRange(value, range.min, range.max),
  );
  const [draft, setDraft] = useState(initial);
  const draftRef = useRef(initial);

  function handleChange(received: number | string) {
    // Story 3.5 (AC5) : seule la ligne de tête (avec `failureOption`) ou un nombre des
    // bornes devient le brouillon ; toute autre valeur native est ignorée ou bornée.
    let next: number | typeof FAILURE_TAG;
    if (received === FAILURE_TAG) {
      if (!failureOption) return;
      next = FAILURE_TAG;
    } else if (typeof received === "number" && Number.isFinite(received)) {
      next = clampToRange(received, range.min, range.max);
    } else {
      return;
    }
    if (next === draftRef.current) {
      return;
    }
    draftRef.current = next;
    setDraft(next);
    Haptics.selectionAsync().catch(() => {});
  }

  function handleValidate() {
    const current = draftRef.current;
    if (current === FAILURE_TAG) {
      // Le parent monte la roue avec une `failureOption` stable : le panneau de la Feuille
      // est démonté au changement de Mode. Garde seulement : sans elle, la tête ne peut
      // pas sortir comme échec, le ✓ valide la borne basse (jamais une chaîne).
      if (failureOption) {
        failureOption.onValidateFailure(FAILURE_TARGET);
      } else {
        onValidate(range.min);
      }
      return;
    }
    onValidate(current);
  }

  // AC7 (H13) : sur iOS, la primitive annonce la ligne courante ; les éléments ne portent
  // qu'un libellé (nombre avec son unité) — sans `valueAccessibilityLabel`, inchangés.
  const itemModifiers = (item: number) =>
    valueAccessibilityLabel
      ? [tag(item), foregroundStyle(colors.textPrimary), accessibilityLabelModifier(valueAccessibilityLabel(item))]
      : [tag(item), foregroundStyle(colors.textPrimary)];
  const columnWidth = failureOption ? NATIVE_FAILURE_COLUMN_WIDTH : NATIVE_COLUMN_WIDTH;

  return (
    <View style={failureOption ? [styles.nativeSurface, styles.nativeSurfaceWithFailure] : styles.nativeSurface} testID={testID}>
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
          modifiers={[pickerStyle("wheel"), frame({ width: columnWidth }), accessibilityLabelModifier(accessibilityLabel)]}
          testID="number-wheel-column"
        >
          {/* Story 3.5 (Q14) : ligne de tête, premier élément de la même colonne native. */}
          {failureOption ? (
            <SwiftUIText
              key={FAILURE_TAG}
              modifiers={[tag(FAILURE_TAG), foregroundStyle(colors.textPrimary), accessibilityLabelModifier(failureOption.label)]}
            >
              {failureOption.label}
            </SwiftUIText>
          ) : null}
          {range.values.map((item) => (
            <SwiftUIText key={item} modifiers={itemModifiers(item)}>
              {String(item)}
            </SwiftUIText>
          ))}
        </SwiftUIPicker>
      </Host>
    </View>
  );
}

/**
 * Même patron que `PickerToolbar` de `DurationWheelPicker.tsx` — voir la note de tête pour la justification de la duplication locale.
 * Exportée pour les tests seulement (prop `validateDisabled`, story 3.4) ; aucun autre consommateur.
 */
export function PickerToolbar({
  onCancel,
  onValidate,
  cancelAccessibilityLabel,
  validateAccessibilityLabel,
  validateDisabled,
}: {
  onCancel: () => void;
  onValidate: () => void;
  cancelAccessibilityLabel: string;
  validateAccessibilityLabel: string;
  /** PRE-4 story 3.4 (AD-7) : même prop, à l'identique, que la copie de `DurationWheelPicker.tsx`. */
  validateDisabled?: boolean;
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
        <KodjoIcon
          name="wheel-action-cancel"
          size={WHEEL_ACTION_ICON}
          testID="number-wheel-cancel-icon"
        />
      </Pressable>
      <Pressable
        onPress={onValidate}
        accessibilityRole="button"
        accessibilityLabel={validateAccessibilityLabel}
        hitSlop={WHEEL_ACTION_HIT_SLOP}
        style={validateDisabled ? [styles.actionValidate, styles.validateDisabled] : styles.actionValidate}
        {...(validateDisabled ? { disabled: true, accessibilityState: { disabled: true } } : {})}
        testID="number-wheel-validate"
      >
        <KodjoIcon
          name="wheel-action-validate"
          size={WHEEL_ACTION_ICON}
          testID="number-wheel-validate-icon"
        />
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
  valueAccessibilityLabel,
  targetBounds,
  failureOption,
}: NumberWheelPickerProps) {
  const range = wheelRange(targetBounds);
  // Story 3.5 (Q14) : avec `failureOption`, l'index 0 est la ligne de tête et les
  // nombres commencent à l'index 1 (même ordre que la colonne native).
  const headCount = failureOption ? 1 : 0;
  const lastIndex = headCount + range.values.length - 1;
  const [initial] = useState(() =>
    failureOption?.initiallySelected === true
      ? 0
      : headCount + clampToRange(value, range.min, range.max) - range.min,
  );
  const indexRef = useRef(initial);
  const scrollRef = useRef<ScrollView>(null);
  // Story 3.5 (AC7) : index courant pour l'état d'accessibilité, seulement avec les
  // nouvelles props — sans elles, `accessibilityValue` reste celle de l'ouverture (inchangé).
  const [currentIndex, setCurrentIndex] = useState(initial);
  const tracksCurrent = targetBounds !== undefined;

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: indexToOffset(initial, ITEM_HEIGHT), animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyIndex(index: number) {
    if (index === indexRef.current) {
      return;
    }
    indexRef.current = index;
    if (tracksCurrent) setCurrentIndex(index);
    Haptics.selectionAsync().catch(() => {});
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = offsetToIndex(event.nativeEvent.contentOffset.y, ITEM_HEIGHT, lastIndex);
    applyIndex(index);
  }

  function align() {
    scrollRef.current?.scrollTo({ y: indexToOffset(indexRef.current, ITEM_HEIGHT), animated: true });
  }

  function handleItemPress(index: number) {
    applyIndex(index);
    align();
  }

  /** Nombre à l'index `index` de la colonne (hors ligne de tête). */
  const numberAt = (index: number) => range.values[index - headCount] ?? range.min;

  function handleValidate() {
    if (failureOption && indexRef.current === 0) {
      failureOption.onValidateFailure(FAILURE_TARGET);
      return;
    }
    onValidate(numberAt(indexRef.current));
  }

  const itemLabel = (item: number) => (valueAccessibilityLabel ? valueAccessibilityLabel(item) : String(item));
  // AC7 (H13) : valeur courante annoncée en texte (ligne de tête, ou nombre avec son unité).
  const accessibilityValue = !tracksCurrent
    ? { min: WHEEL_NUMBER_MIN, max: WHEEL_NUMBER_MAX, now: WHEEL_NUMBER_MIN + initial }
    : failureOption && currentIndex === 0
      ? { text: failureOption.label }
      : { min: range.min, max: range.max, now: numberAt(currentIndex), text: itemLabel(numberAt(currentIndex)) };

  return (
    <View style={failureOption ? [styles.legacySurface, styles.legacySurfaceWithFailure] : styles.legacySurface} testID={testID}>
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
          accessibilityValue={accessibilityValue}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "increment") {
              handleItemPress(Math.min(indexRef.current + 1, lastIndex));
            } else if (event.nativeEvent.actionName === "decrement") {
              handleItemPress(Math.max(indexRef.current - 1, 0));
            }
          }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        >
          {/* Story 3.5 (Q14) : ligne de tête, premier élément de la même colonne ; son état
              sélectionné ou non est annoncé (AC7, H13), sans grisé ni filet. */}
          {failureOption ? (
            <Pressable
              key={FAILURE_TAG}
              style={styles.item}
              onPress={() => handleItemPress(0)}
              accessibilityRole="button"
              accessibilityLabel={failureOption.label}
              accessibilityState={{ selected: currentIndex === 0 }}
              testID="number-wheel-column-item-failure"
            >
              {/* P33 : aucun rétrécissement silencieux du libellé ; la surface est élargie. */}
              <Text style={styles.failureItemLabel} numberOfLines={1}>
                {failureOption.label}
              </Text>
            </Pressable>
          ) : null}
          {range.values.map((item, valueIndex) => (
            <Pressable
              key={item}
              style={styles.item}
              onPress={() => handleItemPress(headCount + valueIndex)}
              accessibilityRole="button"
              accessibilityLabel={itemLabel(item)}
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
    width: WHEEL_NUMERIC_WIDTH,
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
  // Story 3.5 (AC7) : largeur de la surface avec la ligne de tête (voir `WHEEL_FAILURE_WIDTH`).
  nativeSurfaceWithFailure: {
    width: WHEEL_FAILURE_WIDTH,
  },
  // Story 3.5 (AC7, P33) : même largeur qu'iOS avec la ligne de tête, libellé non tronqué.
  legacySurfaceWithFailure: {
    width: WHEEL_FAILURE_WIDTH,
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
  // PRE-4 story 3.4 (AC7) : ✓ indisponible.
  validateDisabled: {
    opacity: UNSELECTED_OPACITY,
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
  // Story 3.5 : ligne de tête en texte courant (Legacy), même couleur que les nombres.
  failureItemLabel: {
    ...type.body,
    color: colors.textPrimary,
  },
});
