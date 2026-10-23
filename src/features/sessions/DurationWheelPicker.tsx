import { Host, HStack, Picker as SwiftUIPicker, Text as SwiftUIText } from "@expo/ui/swift-ui";
import {
  accessibilityLabel as accessibilityLabelModifier,
  bold,
  font,
  foregroundStyle,
  frame,
  padding,
  pickerStyle,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import type { FailureSeriesTarget } from "@/domain/activities/ExecutionParameters";
import {
  WHEEL_SECONDS_ITEM_COUNT,
  WHEEL_TOTAL_SECONDS_MAX,
  boundedMinutesValues,
  boundedSecondsValues,
  formatTwoDigits,
  fromTotalSeconds,
  gridMinutesValues,
  gridSecondsValues,
  indexToOffset,
  minutesMaxIndexFor,
  offsetToIndex,
  secondsIndexToValue,
  snapBoundedSeconds,
  snapGridSeconds,
  snapToGrid,
  toTotalSeconds,
  type WheelTargetBounds,
} from "@/features/sessions/wheelPickerMath";
import { WheelSelectionOverlay } from "@/features/sessions/WheelSelectionOverlay";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
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
 * **Tension documentaire — désormais RÉSOLUE PAR LA SOURCE (T02-S02)** : le
 * paragraphe « Contrat complet du picker » de REWORK04 donnait `toolbar 48`
 * et `zone roue 196` ; `D-098` donnait alors `40 + 150 = 190`. Le
 * rapprochement local (`28×28` + `hitSlop` dans une rangée de `40`) devient
 * caduc : `D-098` est révisée par `D-142` et la documentation publie
 * désormais une géométrie unique — panneau `330 × 203` pour
 * `Type=Duration`, barre d'actions `53`, zone roue `150`, cercle visible
 * `38 × 38`, icône `24 × 24`, cible tactile `48 × 48` (conteneur de mise en
 * page `48 × 53`, `7,5` points de respiration verticale, qui n'agrandit
 * jamais la cible). La cible tactile reste obtenue par `hitSlop` autour du
 * cercle, mécanisme inchangé ; seules les VALEURS bougent.
 *
 * La zone roue reste appliquée en `minHeight` (pas une hauteur figée, pour
 * ne pas contraindre artificiellement le rendu natif — défaut `D-04`).
 */
const WHEEL_TOOLBAR_HEIGHT = dimensions.wheelPicker.toolbarHeight;
const WHEEL_CONTENT_MIN_HEIGHT = dimensions.wheelPicker.wheelContentMinHeight;
const WHEEL_ACTION_VISUAL_CIRCLE = dimensions.wheelPicker.actionVisualCircle;
const WHEEL_ACTION_ICON = dimensions.wheelPicker.actionIcon;
const WHEEL_ACTION_TOUCH_TARGET = dimensions.wheelPicker.actionTouchTarget;
const WHEEL_ACTION_HIT_SLOP = (WHEEL_ACTION_TOUCH_TARGET - WHEEL_ACTION_VISUAL_CIRCLE) / 2;
/** Largeur canonique du panneau `Type=Duration` (`330`, CE-T01-07/CE-T01-14). */
const WHEEL_DURATION_WIDTH = dimensions.wheelPicker.durationWidth;

const NATIVE_MINUTES_COLUMN_WIDTH = 76;
const NATIVE_MINUTES_UNIT_WIDTH = 32;
const NATIVE_COLUMN_INTERVAL = 22;
const NATIVE_SECONDS_COLUMN_WIDTH = 76;
const NATIVE_SECONDS_UNIT_WIDTH = 20;
const NATIVE_DIGIT_UNIT_GAP = 4;

/** Story 3.4 : option échec dessinée sur 30 de haut, cible tactile portée à 44 (P30, NFR-09). */
const FAILURE_OPTION_HEIGHT = 30;
const FAILURE_OPTION_HIT_SLOP = { top: 7, bottom: 7 };

/** PRE-6 story 4.1 : titre de la barre (Figma `8328:28862`, Inter Semi Bold 18, interligne Auto). */
const WHEEL_TITLE_TEXT = { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 18, lineHeight: 22 } as const;

type DurationWheelPickerBaseProps = {
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
  /**
   * PRE-6 story 4.1 (CE-T03-08 §14, E12) — grille de valeurs totales proposées, en secondes,
   * croissantes (ex. `RECOVERY_WHEEL_VALUES`). Les minutes et, pour chaque minute, les secondes
   * de la roue sont celles de la grille ; l'ouverture se fait sur la valeur la plus proche ; la
   * borne haute est la plus grande valeur. Sans elle, comportement inchangé. Non combinée avec
   * `targetBounds` / `failureOption` (aucun appelant ne les associe).
   */
  valueGrid?: readonly number[];
  /**
   * PRE-6 story 4.1 (Figma `8328:28862`) — titre centré entre ✕ et ✓ (« Durée de récupération »),
   * Inter Semi Bold 18. Sans lui, barre inchangée.
   */
  title?: string;
};

/**
 * PRE-4 story 3.4 (AD-7) : `failureOption` exige `targetBounds` (union de props) —
 * sans bornes, `00:00` resterait validable et sortirait comme une Cible nulle.
 */
export type DurationWheelPickerProps = DurationWheelPickerBaseProps &
  (
    | { targetBounds?: WheelTargetBounds; failureOption?: undefined }
    | { targetBounds: WheelTargetBounds; failureOption: DurationWheelFailureOption }
  );

/** Documentation des deux props de la story 3.4 (voir `DurationWheelPickerProps`). */
export type DurationWheelTargetProps = {
  /**
   * PRE-4 story 3.4 (AD-7, Q36) — bornes de Cible (1..3535 depuis D-430). Elles remplacent
   * `maxTotalSeconds` : minutes 00..58 sans rebouclage, secondes au pas de 1,
   * 00..55 à 58 min, position `00:00` conservée ; le ✓ est indisponible sous la
   * borne basse en sélection numérique (`00:00`, Q15). Sans elles, comportement
   * inchangé (Composition, roulette des tours). PRE-4 story 3.7 (FR-14-03) : la roulette
   * de Durée totale de la Feuille les reçoit à T(1)..min(T(99), 5999), sans option échec ;
   * dès `min ≥ 60`, la colonne des minutes commence à `floor(min / 60)`
   * (`boundedMinutesValues`).
   */
  targetBounds?: WheelTargetBounds;
  /**
   * PRE-4 story 3.4 (AD-7, FR-08-01, FR-08-02) — option « Aucune durée, à l’échec »
   * au-dessus de la roue. Sans elle, comportement inchangé.
   */
  failureOption?: DurationWheelFailureOption;
};

/**
 * Story 3.4 — option échec du Sélecteur de cible en Durée. Choisie, elle remet la
 * roue sur `00:00` et atténue le bloc minutes-secondes (opacité 0,45 autour de la
 * primitive, jamais `disabled`) ; faire tourner la roue revient au numérique, sans
 * déverrouillage (P5). Le ✓ émet alors une `SeriesTarget` `FAILURE` par
 * `onValidateFailure`, jamais un nombre : `onValidate` n'est jamais appelé pour
 * l'échec. Aucune haptique ajoutée.
 */
export type DurationWheelFailureOption = {
  /** « Aucune durée, à l’échec » (lexique). */
  label: string;
  /** Position d'ouverture : l'option échec (vrai) ou la valeur numérique `totalSeconds`. */
  initiallySelected: boolean;
  onValidateFailure: (target: FailureSeriesTarget) => void;
};

const FAILURE_TARGET: FailureSeriesTarget = { kind: "FAILURE" };

/** Secondes proposées pour une minute : liste fixe 00..59 sans bornes de Cible (inchangé). */
function secondsValuesFor(
  minutes: number,
  targetBounds: WheelTargetBounds | undefined,
  valueGrid?: readonly number[],
): readonly number[] {
  // PRE-6 story 4.1 : grille de valeurs (récupération) — secondes de la grille pour cette minute.
  if (valueGrid !== undefined) return gridSecondsValues(valueGrid, minutes);
  return targetBounds === undefined ? SECONDS_VALUES : boundedSecondsValues(minutes, targetBounds);
}

/** Story 3.4 : recalage d'une seconde hors de la liste de sa minute (`snapBoundedSeconds`) ; sans bornes, inchangée. */
function snapSeconds(
  seconds: number,
  minutes: number,
  targetBounds: WheelTargetBounds | undefined,
  valueGrid?: readonly number[],
): number {
  if (valueGrid !== undefined) return snapGridSeconds(seconds, minutes, valueGrid);
  return targetBounds === undefined ? seconds : snapBoundedSeconds(seconds, minutes, targetBounds);
}

/**
 * Minutes proposées : 0..`floor(max / 60)` sans bornes (inchangé) ; sous bornes,
 * `boundedMinutesValues` (story 3.7 : à partir de `floor(min / 60)` si `min ≥ 60`).
 */
function minutesValuesFor(
  maxTotalSeconds: number,
  targetBounds: WheelTargetBounds | undefined,
  valueGrid?: readonly number[],
): readonly number[] {
  if (valueGrid !== undefined) return gridMinutesValues(valueGrid);
  return targetBounds === undefined
    ? Array.from({ length: minutesMaxIndexFor(maxTotalSeconds) + 1 }, (_, index) => index)
    : boundedMinutesValues(targetBounds);
}

/** Position d'ouverture (minutes, secondes) : déjà dans les bornes, jamais recalée par la roue (AC4). */
function openingPosition(
  totalSeconds: number,
  maxTotalSeconds: number,
  targetBounds: WheelTargetBounds | undefined,
  failureSelected: boolean,
  valueGrid?: readonly number[],
): { minutes: number; seconds: number } {
  // PRE-6 story 4.1 : sous une grille, ouverture sur la valeur de la grille la plus proche.
  if (valueGrid !== undefined) {
    const snapped = snapToGrid(totalSeconds, valueGrid);
    return { minutes: Math.floor(snapped / 60), seconds: snapped % 60 };
  }
  // Story 3.7 : défense — sous une borne basse d'au moins 60 s, aucune minute 0 n'est
  // proposée ; une valeur reçue sous la borne s'ouvre sur la borne (l'appelant passe une
  // valeur déjà bornée, AD-16). Sous 60 s (story 3.4), comportement inchangé.
  const opening =
    targetBounds !== undefined && targetBounds.min >= 60 ? Math.max(totalSeconds, targetBounds.min) : totalSeconds;
  const position = fromTotalSeconds(failureSelected ? 0 : opening, maxTotalSeconds);
  if (targetBounds === undefined) {
    return position;
  }
  return { minutes: position.minutes, seconds: snapSeconds(position.seconds, position.minutes, targetBounds) };
}

/** PRE-6 story 4.1 : grille vide ou absente → `undefined` (comportement sans grille). */
function normalizedGrid(valueGrid: readonly number[] | undefined): readonly number[] | undefined {
  return valueGrid !== undefined && valueGrid.length > 0 ? valueGrid : undefined;
}

/** PRE-6 story 4.1 : borne haute d'une grille (sa plus grande valeur) ; sans grille, `undefined`. */
function gridMax(valueGrid: readonly number[] | undefined): number | undefined {
  return valueGrid === undefined || valueGrid.length === 0 ? undefined : Math.max(...valueGrid);
}

/** AC7 (FR-08-04, Q15) : sous la borne basse (`00:00`), en sélection numérique, le ✓ est indisponible. */
function isValidateDisabled(
  targetBounds: WheelTargetBounds | undefined,
  failureSelected: boolean,
  minutes: number,
  seconds: number,
): boolean {
  return targetBounds !== undefined && !failureSelected && minutes * 60 + seconds < targetBounds.min;
}

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
 *
 * **Correction bloquante — visibilité des valeurs** (« CORRECTION
 * BLOQUANTE AVANT T01-S09 — VISIBILITÉ DES ROULETTES », 2026-09-05) :
 * chaque `SwiftUIText` (chiffres des deux colonnes, unités `min`/`s`)
 * portait précédemment ses seuls modificateurs de mise en page/typo
 * (`frame`/`padding`/`bold`/`font`), sans jamais fixer explicitement sa
 * couleur de premier plan. `Text` (`@expo/ui/swift-ui`) sans
 * `foregroundStyle` explicite retombe sur la couleur de premier plan par
 * défaut de SwiftUI (`Color.primary`, dynamique clair/sombre) — une
 * couleur dont la résolution dépend de l'environnement de trait
 * (`colorScheme`) effectivement propagé jusqu'à la vue native via le pont
 * `Host` ; en pratique sur ce pont, cette résolution s'est révélée non
 * fiable (valeurs invisibles constatées sur device malgré une roulette
 * pleinement manipulable — cause racine retenue parmi celles listées par
 * l'autorisation : « couleur dynamique iOS non résolue »). Chaque
 * `SwiftUIText` porte désormais explicitement `foregroundStyle(colors
 * .textPrimary)` — même token que la valeur affichée par le chemin
 * Android/web (`itemLabel`, `colors.textPrimary`), pour une identité
 * visuelle réelle entre les deux plateformes plutôt qu'une simple
 * ressemblance. Aucun changement de mise en page, de géométrie, de cadre
 * de sélection ni de comportement — uniquement l'ajout de cette seule
 * propriété de couleur, sur les nœuds de texte déjà existants.
 */
function NativeAppleDurationWheelPicker({
  totalSeconds,
  onValidate,
  onCancel,
  minutesAccessibilityLabel,
  secondsAccessibilityLabel,
  cancelAccessibilityLabel,
  validateAccessibilityLabel,
  maxTotalSeconds: maxTotalSecondsProp = WHEEL_TOTAL_SECONDS_MAX,
  targetBounds,
  failureOption,
  valueGrid: valueGridProp,
  title,
}: DurationWheelPickerProps) {
  // PRE-6 story 4.1 : une grille vide vaut absence de grille.
  const valueGrid = normalizedGrid(valueGridProp);
  const maxTotalSeconds = targetBounds?.max ?? gridMax(valueGrid) ?? maxTotalSecondsProp;
  const minutesValues = minutesValuesFor(maxTotalSeconds, targetBounds, valueGrid);
  // `useState(() => ...)` : initialisé UNE SEULE FOIS au montage — jamais
  // recalculé depuis `totalSeconds` à un rendu ultérieur (brouillon local).
  const [initialFailure] = useState(() => failureOption?.initiallySelected === true);
  const [initial] = useState(() => openingPosition(totalSeconds, maxTotalSeconds, targetBounds, initialFailure, valueGrid));
  const [draftMinutes, setDraftMinutes] = useState(initial.minutes);
  const [draftSeconds, setDraftSeconds] = useState(initial.seconds);
  const [failureSelected, setFailureSelected] = useState(initialFailure);
  const draftRef = useRef({ minutes: initial.minutes, seconds: initial.seconds, failure: initialFailure });
  const secondsValues = secondsValuesFor(draftMinutes, targetBounds, valueGrid);

  /** Story 3.4 (P5) : faire tourner la roue revient au numérique, sans déverrouillage. */
  function leaveFailure() {
    if (draftRef.current.failure) {
      draftRef.current.failure = false;
      setFailureSelected(false);
    }
  }

  function handleMinutesChange(value: number) {
    if (value === draftRef.current.minutes) {
      return;
    }
    draftRef.current.minutes = value;
    setDraftMinutes(value);
    // Story 3.4 (AC2) : à la minute maximale (ou à 0), les secondes hors bornes
    // rejoignent la plus proche valeur proposée (58:57 → 58:55 ; sous une borne basse de 5 s, 01:02 → 00:05 ; jamais 00:00).
    const seconds = snapSeconds(draftRef.current.seconds, value, targetBounds, valueGrid);
    if (seconds !== draftRef.current.seconds) {
      draftRef.current.seconds = seconds;
      setDraftSeconds(seconds);
    }
    leaveFailure();
    Haptics.selectionAsync().catch(() => {});
  }

  function handleSecondsChange(received: number) {
    // Story 3.4 : une valeur native absente de la liste courante (57 à 58 min) est
    // ramenée à la plus proche proposée : le brouillon reste une valeur affichée.
    const value = snapSeconds(received, draftRef.current.minutes, targetBounds, valueGrid);
    if (value === draftRef.current.seconds) {
      return;
    }
    draftRef.current.seconds = value;
    setDraftSeconds(value);
    leaveFailure();
    Haptics.selectionAsync().catch(() => {});
  }

  /** Story 3.4 (AC5) : l'option passe à 100 %, la roue revient à `00:00`, atténuée. */
  function handleFailurePress() {
    if (draftRef.current.failure) {
      return;
    }
    draftRef.current = { minutes: 0, seconds: 0, failure: true };
    setDraftMinutes(0);
    setDraftSeconds(0);
    setFailureSelected(true);
  }

  function handleValidate() {
    const draft = draftRef.current;
    if (draft.failure && failureOption) {
      failureOption.onValidateFailure(FAILURE_TARGET);
      return;
    }
    if (isValidateDisabled(targetBounds, false, draft.minutes, draft.seconds)) {
      return;
    }
    onValidate(toTotalSeconds(draft.minutes, draft.seconds, maxTotalSeconds));
  }

  const validateDisabled = isValidateDisabled(targetBounds, failureSelected, draftMinutes, draftSeconds);
  const host = (
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
              <SwiftUIText key={value} modifiers={[tag(value), foregroundStyle(colors.textPrimary)]}>
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
              foregroundStyle(colors.textPrimary),
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
            {secondsValues.map((value) => (
              <SwiftUIText key={value} modifiers={[tag(value), foregroundStyle(colors.textPrimary)]}>
                {formatTwoDigits(value)}
              </SwiftUIText>
            ))}
          </SwiftUIPicker>
          <SwiftUIText
            modifiers={[
              frame({ width: NATIVE_SECONDS_UNIT_WIDTH }),
              bold(),
              font({ size: 14 }),
              foregroundStyle(colors.textPrimary),
            ]}
          >
            s
          </SwiftUIText>
        </HStack>
      </Host>
  );

  return (
    <View style={styles.nativeSurface} testID="duration-wheel-picker">
      <PickerToolbar
        onCancel={onCancel}
        onValidate={handleValidate}
        cancelAccessibilityLabel={cancelAccessibilityLabel}
        validateAccessibilityLabel={validateAccessibilityLabel}
        validateDisabled={validateDisabled || undefined}
        title={title}
      />
      {failureOption ? (
        <>
          <FailureOptionRow option={failureOption} selected={failureSelected} onPress={handleFailurePress} />
          {/* AD-7 : le grisé est une opacité autour de la primitive native, jamais `disabled`. */}
          <View style={failureSelected ? styles.attenuated : null} testID="duration-wheel-block">
            {host}
          </View>
        </>
      ) : (
        host
      )}
    </View>
  );
}

/**
 * Story 3.4 (AC2, AC5, AC11) — option « Aucune durée, à l’échec », centrée, au-dessus
 * d'un filet puis de la roue (maître `8452:13297`, visuel seulement). Non choisie,
 * elle est atténuée à 45 % ; son état est annoncé par VoiceOver (« sélectionnée » /
 * « non sélectionnée », lexique), jamais par le gris seul. Dessinée sur 30 de haut,
 * sa cible tactile atteint 44 par `hitSlop` (P30).
 */
function FailureOptionRow({
  option,
  selected,
  onPress,
}: {
  option: DurationWheelFailureOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={option.label}
        accessibilityState={{ selected }}
        hitSlop={FAILURE_OPTION_HIT_SLOP}
        style={[styles.failureOption, selected ? null : styles.attenuated]}
        testID="duration-wheel-failure-option"
      >
        <Text style={styles.failureOptionText} testID="duration-wheel-failure-option-text">
          {option.label}
        </Text>
      </Pressable>
      <View style={styles.failureOptionRule} testID="duration-wheel-failure-option-rule" />
    </>
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
  validateDisabled,
  title,
}: {
  onCancel: () => void;
  onValidate: () => void;
  cancelAccessibilityLabel: string;
  validateAccessibilityLabel: string;
  /**
   * PRE-4 story 3.4 (AD-7, AC7) — seule prop ajoutée, à l'identique dans la copie de
   * `NumberWheelPicker.tsx` : ✓ indisponible (`disabled`, état d'accessibilité,
   * opacité `UNSELECTED_OPACITY`) ; ✕ reste disponible. Sans elle, inchangé.
   */
  validateDisabled?: boolean;
  /** PRE-6 story 4.1 : titre facultatif, centré entre les deux actions. */
  title?: string;
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
        <KodjoIcon
          name="wheel-action-cancel"
          size={WHEEL_ACTION_ICON}
          testID="duration-wheel-cancel-icon"
        />
      </Pressable>
      {title !== undefined ? (
        <Text style={styles.toolbarTitle} numberOfLines={1} accessibilityRole="header" testID="duration-wheel-title">
          {title}
        </Text>
      ) : null}
      <Pressable
        onPress={onValidate}
        accessibilityRole="button"
        accessibilityLabel={validateAccessibilityLabel}
        hitSlop={WHEEL_ACTION_HIT_SLOP}
        style={validateDisabled ? [styles.actionValidate, styles.validateDisabled] : styles.actionValidate}
        {...(validateDisabled ? { disabled: true, accessibilityState: { disabled: true } } : {})}
        testID="duration-wheel-validate"
      >
        <KodjoIcon
          name="wheel-action-validate"
          size={WHEEL_ACTION_ICON}
          testID="duration-wheel-validate-icon"
        />
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
  maxTotalSeconds: maxTotalSecondsProp = WHEEL_TOTAL_SECONDS_MAX,
  targetBounds,
  failureOption,
  valueGrid: valueGridProp,
  title,
}: DurationWheelPickerProps) {
  // PRE-6 story 4.1 : une grille vide vaut absence de grille.
  const valueGrid = normalizedGrid(valueGridProp);
  const maxTotalSeconds = targetBounds?.max ?? gridMax(valueGrid) ?? maxTotalSecondsProp;
  // Story 3.7 : la colonne des minutes peut commencer après 0 (borne basse ≥ 60 s) ;
  // `minutesIndexRef` est un INDEX dans `minutesValues`, la minute est `minuteAt(index)`.
  // Sans bornes, ou sous 60 s (story 3.4), index et minute coïncident (inchangé).
  const minutesValues = minutesValuesFor(maxTotalSeconds, targetBounds, valueGrid);
  const minutesMaxIndex = minutesValues.length - 1;
  const minuteAt = (index: number) => minutesValues[index] ?? minutesValues[0] ?? 0;
  const [initialFailure] = useState(() => failureOption?.initiallySelected === true);
  const [initial] = useState(() => openingPosition(totalSeconds, maxTotalSeconds, targetBounds, initialFailure, valueGrid));

  const minutesIndexRef = useRef(Math.max(0, minutesValues.indexOf(initial.minutes)));
  // Index dans la liste des secondes courante (identique à la valeur sans bornes de Cible).
  const secondsIndexRef = useRef(secondsValuesFor(initial.minutes, targetBounds, valueGrid).indexOf(initial.seconds));
  const minutesScrollRef = useRef<ScrollView>(null);
  const secondsScrollRef = useRef<ScrollView>(null);
  // Story 3.4 : minutes et secondes courantes (liste des secondes, ✓ indisponible) et option échec.
  const [draftMinutes, setDraftMinutes] = useState(initial.minutes);
  const [draftSeconds, setDraftSeconds] = useState(initial.seconds);
  const [failureSelected, setFailureSelected] = useState(initialFailure);
  const failureRef = useRef(initialFailure);
  const secondsValues = secondsValuesFor(draftMinutes, targetBounds, valueGrid);
  /** Secondes proposées pour la minute courante (lue dans les refs, au moment de l'événement). */
  const currentSecondsValues = () => secondsValuesFor(minuteAt(minutesIndexRef.current), targetBounds, valueGrid);
  // Story 3.4 : réalignement de la colonne des secondes en attente (liste changée avec la
  // minute) ; ses `onScroll` sont ignorés tant que la colonne garde l'ancien décalage.
  const secondsRealignPendingRef = useRef(false);

  useEffect(() => {
    // Story 3.4 : sous bornes de Cible, la liste des secondes dépend de la minute ; après
    // le rendu de la nouvelle liste, la colonne est réalignée sur la seconde courante
    // (index déjà recalculé dans `applyColumnIndex`), sans animation. Dépendance
    // volontairement réduite à `draftMinutes` : l'effet ne doit jouer qu'au changement
    // de minute, et ne lit que des refs et des valeurs stables.
    if (targetBounds === undefined && valueGrid === undefined) return;
    alignColumn("seconds", false);
    secondsRealignPendingRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftMinutes]);

  useEffect(() => {
    // Alignement initial, une seule fois au montage — plus de fonction de
    // nettoyage nécessaire ici : aucun commit automatique au démontage à
    // conserver, Annuler/Valider sont les seules actions qui valident/
    // ferment (R4-08/R4-09).
    minutesScrollRef.current?.scrollTo({
      y: indexToOffset(minutesIndexRef.current, ITEM_HEIGHT),
      animated: false,
    });
    secondsScrollRef.current?.scrollTo({
      y: indexToOffset(secondsIndexRef.current, ITEM_HEIGHT),
      animated: false,
    });
  }, []);

  function applyColumnIndex(index: number, column: "minutes" | "seconds") {
    const ref = column === "minutes" ? minutesIndexRef : secondsIndexRef;

    if (index === ref.current) {
      return;
    }
    const previousSeconds = currentSecondsValues()[secondsIndexRef.current] ?? 0;
    ref.current = index;
    if (column === "minutes") {
      // Story 3.4 (AC2) : seconde hors de la nouvelle liste → la plus proche proposée
      // (jamais 00:00 par recalage) ; l'index est remappé dans la nouvelle liste.
      const minute = minuteAt(index);
      const seconds = snapSeconds(previousSeconds, minute, targetBounds, valueGrid);
      secondsIndexRef.current = secondsValuesFor(minute, targetBounds, valueGrid).indexOf(seconds);
      if (targetBounds !== undefined || valueGrid !== undefined) secondsRealignPendingRef.current = true;
      setDraftMinutes(minute);
      setDraftSeconds(seconds);
    } else {
      setDraftSeconds(currentSecondsValues()[index] ?? 0);
    }
    // Story 3.4 (P5) : faire tourner la roue revient au numérique, sans déverrouillage.
    if (failureRef.current) {
      failureRef.current = false;
      setFailureSelected(false);
    }
    Haptics.selectionAsync().catch(() => {});
    // Pas d'appel de validation ici — brouillon local uniquement (R4-08).
  }

  /** Story 3.4 (AC5) : même transition que la roue native — `00:00`, bloc atténué. */
  function handleFailurePress() {
    if (failureRef.current) {
      return;
    }
    failureRef.current = true;
    // `failureOption` exige des bornes de Cible sous 60 s (story 3.4) : la minute 0 est à l'index 0.
    minutesIndexRef.current = Math.max(0, minutesValues.indexOf(0));
    secondsIndexRef.current = 0;
    setFailureSelected(true);
    setDraftMinutes(0);
    setDraftSeconds(0);
    minutesScrollRef.current?.scrollTo({ y: 0, animated: false });
    secondsScrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function handleColumnScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>,
    column: "minutes" | "seconds",
  ) {
    if (column === "seconds" && secondsRealignPendingRef.current) return;
    const max = column === "minutes" ? minutesMaxIndex : currentSecondsValues().length - 1;
    const index = offsetToIndex(event.nativeEvent.contentOffset.y, ITEM_HEIGHT, max);
    applyColumnIndex(index, column);
  }

  function alignColumn(column: "minutes" | "seconds", animated = true) {
    const ref = column === "minutes" ? minutesIndexRef : secondsIndexRef;
    const scrollRef = column === "minutes" ? minutesScrollRef : secondsScrollRef;
    scrollRef.current?.scrollTo({ y: indexToOffset(ref.current, ITEM_HEIGHT), animated });
  }

  function handleItemPress(index: number, column: "minutes" | "seconds") {
    applyColumnIndex(index, column);
    alignColumn(column);
  }

  function handleValidate() {
    if (failureRef.current && failureOption) {
      failureOption.onValidateFailure(FAILURE_TARGET);
      return;
    }
    const minutes = minuteAt(minutesIndexRef.current);
    const seconds = currentSecondsValues()[secondsIndexRef.current] ?? 0;
    if (isValidateDisabled(targetBounds, false, minutes, seconds)) {
      return;
    }
    onValidate(toTotalSeconds(minutes, seconds, maxTotalSeconds));
  }

  const validateDisabled = isValidateDisabled(targetBounds, failureSelected, draftMinutes, draftSeconds);

  return (
    <View style={styles.legacySurface} testID="duration-wheel-picker">
      <PickerToolbar
        onCancel={onCancel}
        onValidate={handleValidate}
        cancelAccessibilityLabel={cancelAccessibilityLabel}
        validateAccessibilityLabel={validateAccessibilityLabel}
        validateDisabled={validateDisabled || undefined}
        title={title}
      />
      {failureOption ? (
        <FailureOptionRow option={failureOption} selected={failureSelected} onPress={handleFailurePress} />
      ) : null}
      {/* AD-7 : grisé par opacité autour des colonnes, jamais `disabled`. */}
      <View style={failureSelected ? [styles.container, styles.attenuated] : styles.container} testID="duration-wheel-block">
        <WheelColumn
          scrollRef={minutesScrollRef}
          values={minutesValues}
          max={minuteAt(minutesMaxIndex)}
          now={draftMinutes}
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
          values={secondsValues}
          max={secondsValues[secondsValues.length - 1] ?? 0}
          now={draftSeconds}
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
          // Index de la valeur `now` dans la colonne (identique à la valeur sans bornes de Cible).
          const currentIndex = Math.max(0, values.indexOf(now));
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
  //
  // T02-S02 : largeur canonique `330` publiée pour `Type=Duration`
  // (CE-T01-07/CE-T01-14). La HAUTEUR reste dérivée (`53` de barre +
  // `minHeight 150` de zone roue = `203` au repos), jamais figée — figer la
  // hauteur reproduirait le défaut `D-04` en contraignant le rendu natif.
  nativeSurface: {
    width: WHEEL_DURATION_WIDTH,
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
  // R4-09, révisé T02-S02 (D-142) : toolbar en haut, hauteur de MISE EN
  // PAGE `53` — les actions atteignent `48×48` de cible tactile via
  // `hitSlop` autour du cercle `38×38`, jamais via cette hauteur de rangée
  // (voir la note de tête du fichier).
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: WHEEL_TOOLBAR_HEIGHT,
  },
  // PRE-6 story 4.1 (Figma `8328:28862`) : Inter Semi Bold 18, `text-primary`, centré.
  toolbarTitle: {
    ...WHEEL_TITLE_TEXT,
    flex: 1,
    textAlign: "center",
    color: colors.textPrimary,
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
  // Story 3.4 (AD-7, AD-11) : grisé de l'option non choisie et du bloc à l'échec.
  attenuated: {
    opacity: UNSELECTED_OPACITY,
  },
  // Story 3.4 (AC7) : ✓ indisponible.
  validateDisabled: {
    opacity: UNSELECTED_OPACITY,
  },
  // Story 3.4 (maître `8452:13297`, visuel seulement) : option centrée sur 30 de haut,
  // texte Regular 20, puis filet de 1 (`color.border`). Aucun jeton modifié.
  failureOption: {
    height: FAILURE_OPTION_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  failureOptionText: {
    ...type.body,
    fontSize: 20,
    lineHeight: 24,
    color: colors.textPrimary,
    textAlign: "center",
  },
  failureOptionRule: {
    height: 1,
    backgroundColor: colors.border,
  },
});
