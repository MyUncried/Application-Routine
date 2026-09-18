import { useState, type ReactNode } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  applyTargetTotalDuration,
  computeTotalDurationSeconds,
  type TotalDurationFacts,
} from "@/domain/sessions/calculations";
import { DEFAULT_EXERCISE_DURATION_SECONDS, DEFAULT_REPETITION_COUNT } from "@/domain/sessions/defaults";
import type { SessionDraftExerciseExecutionMode } from "@/domain/sessions/SessionDraft";
import { sideMultiplier, type SideMode } from "@/domain/sessions/sideMode";
import {
  INSTRUCTION_MAX_LENGTH,
  NAME_MAX_LENGTH,
  validateExerciseDurationSeconds,
  validateExerciseName,
  validateRepetitionCount,
} from "@/domain/sessions/validation";
import { BODY_ZONES } from "@/features/reference-data/bodyZones";
import { BodyZoneSelector } from "@/features/sessions/BodyZoneSelector";
import {
  formatCompactDuration,
  formatDurationRowValue,
  formatExerciseDurationLine,
  formatExerciseRecap,
} from "@/features/sessions/compositionPresentation";
import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import { NumberWheelPicker } from "@/features/sessions/NumberWheelPicker";
import { SideModeControl } from "@/features/sessions/SideModeControl";
import { WheelPickerOverlay } from "@/features/sessions/WheelPickerOverlay";
import {
  WHEEL_EXERCISE_DURATION_SECONDS_MAX,
  WHEEL_PAUSE_SECONDS_MAX,
  WHEEL_RECOVERY_SECONDS_MAX,
  WHEEL_TOTAL_DURATION_SECONDS_MAX,
} from "@/features/sessions/wheelPickerMath";
import { strings } from "@/shared/i18n";
import { DisclosureControl } from "@/shared/ui/DisclosureControl";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { TransientNotification } from "@/shared/ui/TransientNotification";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * Formulaire COMMUN d'une Activité (V2-CAT-01, revue indépendante 5732014381,
 * obligation 5 : « extraire et réutiliser le formulaire complet existant
 * d'ExerciseScreen pour Composition ET Catalogue, ne pas maintenir deux
 * éditeurs »).
 *
 * Extrait à l'IDENTIQUE de l'ancien corps de `ExerciseScreen` (roulettes
 * natives, sections repliables, rangée de paramètres compacte, contrôle
 * `Côté`, pilotage `Séries ↔ Durée totale`, synthèse ancrée en bas) —
 * composant purement contrôlé : ne connaît ni `SessionDraftContext` ni
 * `ActivityDefinitionService`. Chaque adaptateur (`CompositionExerciseEditor`
 * pour la Composition, `CatalogueActivityEditorScreen` pour le Catalogue)
 * lui fournit `value`/`onChange` et décide seul de la cible d'enregistrement
 * (D-137) — aucune règle de validation ou de calcul n'est dupliquée.
 *
 * Le nom de l'Activité n'est mis en GRAS que dans la synthèse ancrée en bas
 * (revue 5732014381, obligation 5) — jamais dans le champ de saisie lui-même.
 */
export type ActivityEditorFormValue = {
  readonly name: string;
  readonly instruction: string | null;
  readonly executionMode: SessionDraftExerciseExecutionMode;
  readonly durationSeconds: number | null;
  readonly repetitionCount: number | null;
  readonly seriesCount: number;
  readonly pauseSeconds: number;
  readonly recoverySeconds: number;
  readonly bodyZoneIds: readonly string[];
  readonly sideMode: SideMode;
};

export type ActivityEditorFormProps = {
  value: ActivityEditorFormValue;
  onChange: (patch: Partial<ActivityEditorFormValue>) => void;
  /**
   * V2-BILAT-01 : `true` uniquement pour une Activité `IN_TOUR` de la
   * Composition gouvernée par un Tour déjà bilatéral (le contrôle `Côté`
   * devient alors désactivé, la direction du Tour prévalant). `false` par
   * défaut — le Catalogue n'a pas de notion de Tour.
   */
  isSideModeInherited?: boolean;
  /**
   * V2-CAT-01 (plan §4.3) : le Catalogue affiche EN PLUS une section
   * `Médias` visible et repliable (contrôle, placeholder et `Ajouter un
   * média` désactivés, aucune fonction média réelle). La Composition garde
   * son bouton `+ Ajouter un média` unique de la zone bleue contextuelle
   * (D-105, inchangé — `ExerciseScreen — bouton média désactivé, aucune
   * section Médias`) : ce drapeau reste `false` par défaut pour ne rien lui
   * changer.
   */
  showMediaSection?: boolean;
  /** Libellé de l'action finale (« Terminer »), identique dans les deux contextes. */
  finishLabel: string;
  onFinish: () => void;
  /** Contrainte ADDITIONNELLE à la validité du formulaire (ex. sauvegarde Catalogue en cours). */
  isFinishDisabled?: boolean;
  /** Message d'erreur de sauvegarde (Catalogue uniquement) — rendu au-dessus du bouton, brouillon conservé. */
  errorMessage?: string | null;
  finishSlotTestID: string;
  finishActionTestID: string;
  errorTestID?: string;
};

type OverlayKind =
  | "duration"
  | "repetitionCount"
  | "pauseSeconds"
  | "seriesCount"
  | "recoverySeconds"
  | "totalDuration";

type SectionKey = "description" | "bodyZones" | "executionMode" | "media";

/**
 * Activité valide ⇔ Nom + cible du mode (Durée / Répétitions) valides. Le
 * mode « À l'échec » (T01-S10, D-111) n'a AUCUNE cible : le seul Nom suffit.
 * Description et Zone corporelle restent entièrement facultatives. Exportée
 * pour que chaque adaptateur gouverne l'action finale (`Terminer`) sans
 * dupliquer cette règle.
 */
export function isActivityEditorFormValid(value: ActivityEditorFormValue): boolean {
  if (!validateExerciseName(value.name).ok) {
    return false;
  }
  if (value.executionMode === "TO_FAILURE") {
    return true;
  }
  if (value.executionMode === "DURATION") {
    return value.durationSeconds !== null && validateExerciseDurationSeconds(value.durationSeconds).ok;
  }
  return value.repetitionCount !== null && validateRepetitionCount(value.repetitionCount).ok;
}

/** Facteurs `A`/`B`/`R` de la formule canonique conditionnelle (`calculations.ts`). */
function totalDurationFacts(value: ActivityEditorFormValue): TotalDurationFacts {
  return {
    durationSeconds: value.executionMode === "DURATION" ? (value.durationSeconds ?? 0) : 0,
    pauseSeconds: value.pauseSeconds,
    recoverySeconds: value.recoverySeconds,
  };
}

export function ActivityEditorForm({
  value,
  onChange,
  isSideModeInherited = false,
  showMediaSection = false,
  finishLabel,
  onFinish,
  isFinishDisabled = false,
  errorMessage = null,
  finishSlotTestID,
  finishActionTestID,
  errorTestID,
}: ActivityEditorFormProps) {
  const insets = useSafeAreaInsets();
  const [openOverlay, setOpenOverlay] = useState<OverlayKind | null>(null);
  // CE-T01-15 : Description et Zone corporelle FERMÉES par défaut, Mode
  // d'exécution DÉPLOYÉ par défaut ; Médias (Catalogue) fermée par défaut.
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    description: false,
    bodyZones: false,
    executionMode: true,
    media: false,
  });
  /**
   * Ajustement de la `Durée totale` à un nombre entier de Séries (D-136) —
   * non persisté, effacé dès que n'importe quel autre paramètre change.
   */
  const [adjustment, setAdjustment] = useState<{
    readonly message: string;
    readonly previousSeriesCount: number;
  } | null>(null);

  const t = strings.screens.exercise;
  const mediaStrings = strings.screens.activities.editor.media;

  function closeOverlay() {
    setOpenOverlay(null);
  }

  function toggleOverlay(kind: OverlayKind) {
    Keyboard.dismiss();
    setOpenOverlay((current) => (current === kind ? null : kind));
  }

  function toggleSection(key: SectionKey) {
    Keyboard.dismiss();
    closeOverlay();
    setExpandedSections((current) => ({ ...current, [key]: !current[key] }));
  }

  function patch(next: Partial<ActivityEditorFormValue>) {
    setAdjustment(null);
    onChange(next);
  }

  function handleExecutionModeChange(mode: SessionDraftExerciseExecutionMode) {
    if (mode === value.executionMode) {
      return;
    }
    closeOverlay();
    if (mode === "DURATION") {
      patch({
        executionMode: "DURATION",
        durationSeconds: value.durationSeconds ?? DEFAULT_EXERCISE_DURATION_SECONDS,
        repetitionCount: null,
      });
    } else if (mode === "REPETITIONS") {
      patch({
        executionMode: "REPETITIONS",
        repetitionCount: value.repetitionCount ?? DEFAULT_REPETITION_COUNT,
        durationSeconds: null,
      });
    } else {
      patch({ executionMode: "TO_FAILURE", durationSeconds: null, repetitionCount: null });
    }
  }

  function toggleBodyZone(zoneId: string) {
    patch({
      bodyZoneIds: value.bodyZoneIds.includes(zoneId)
        ? value.bodyZoneIds.filter((id) => id !== zoneId)
        : [...value.bodyZoneIds, zoneId],
    });
  }

  /**
   * Confirmation d'une `Durée totale` CIBLE : n'écrit jamais la durée
   * elle-même (DM-015/DM-016) — elle pilote `seriesCount` par le calcul
   * inverse, puis la durée réellement atteignable est recalculée par la
   * formule directe.
   */
  function handleTotalDurationConfirmed(targetTotalSeconds: number) {
    const previousSeriesCount = value.seriesCount;
    const adjusted = applyTargetTotalDuration(
      targetTotalSeconds,
      totalDurationFacts(value),
      sideMultiplier(value.sideMode),
    );
    patch({ seriesCount: adjusted.seriesCount });
    closeOverlay();
    if (adjusted.wasAdjusted) {
      setAdjustment({
        message: strings.screens.exercise.adjustedTotalDurationMessage.replace(
          "{duration}",
          formatCompactDuration(adjusted.totalDurationSeconds),
        ),
        previousSeriesCount,
      });
    }
  }

  function handleUndoAdjustment() {
    const restored = adjustment?.previousSeriesCount;
    setAdjustment(null);
    if (restored !== undefined) {
      onChange({ seriesCount: restored });
    }
  }

  const sideModeStrings = strings.shared.sideMode;
  const sideModeAccessibilityLabel = isSideModeInherited
    ? `${sideModeStrings.activity.accessibilityLabels[value.sideMode]} — ${sideModeStrings.activity.inheritedAccessibilitySuffix}`
    : sideModeStrings.activity.accessibilityLabels[value.sideMode];

  const recapFacts = {
    name: value.name,
    executionMode: value.executionMode,
    durationSeconds: value.durationSeconds,
    repetitionCount: value.repetitionCount,
    seriesCount: value.seriesCount,
    pauseSeconds: value.pauseSeconds,
    recoverySeconds: value.recoverySeconds,
    sideMode: value.sideMode,
    isSideModeInherited,
  };
  const totalDurationSeconds = computeTotalDurationSeconds(
    value.seriesCount,
    totalDurationFacts(value),
    sideMultiplier(value.sideMode),
  );
  const formattedTotalDuration = formatDurationRowValue(
    totalDurationSeconds,
    Math.max(WHEEL_TOTAL_DURATION_SECONDS_MAX, totalDurationSeconds),
  );
  const isTotalDurationDriveable = value.executionMode === "DURATION";
  const isValid = isActivityEditorFormValid(value);
  const finishDisabled = !isValid || isFinishDisabled;

  return (
    <>
      {/*
       * Zone bleue contextuelle (D-105 ; T01-S10, doc13 §8) : accolée sans
       * espace au séparateur de l'en-tête, fixe (frère du `ScrollView`,
       * jamais son descendant). Commence par le champ `Nom de l'activité`,
       * suivi de `+ Ajouter un média` (visible mais désactivé).
       */}
      <View style={styles.contextBand} testID="exercise-context-band">
        <TextInput
          value={value.name}
          onChangeText={(text) => patch({ name: text })}
          onFocus={closeOverlay}
          placeholder={t.name}
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel={t.name}
          maxLength={NAME_MAX_LENGTH}
          style={styles.nameInput}
          testID="exercise-name-input"
        />

        <Pressable
          disabled
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          accessibilityLabel={t.addMediaUnavailableAccessibilityLabel}
          style={styles.addMediaButton}
          testID="exercise-add-media"
        >
          <KodjoIcon name="action-add" testID="exercise-add-media-icon" />
          <Text style={styles.addMediaLabel}>{t.addMedia}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        testID="exercise-body"
      >
        <CollapsibleSection
          testID="exercise-section-description"
          title={t.sections.description}
          expanded={expandedSections.description}
          onToggle={() => toggleSection("description")}
        >
          <TextInput
            value={value.instruction ?? ""}
            onChangeText={(text) => patch({ instruction: text.length > 0 ? text : null })}
            onFocus={closeOverlay}
            placeholder={t.instruction.label}
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel={t.instruction.label}
            maxLength={INSTRUCTION_MAX_LENGTH}
            multiline
            style={styles.instructionInput}
            testID="exercise-instruction-input"
          />
        </CollapsibleSection>

        <CollapsibleSection
          testID="exercise-section-body-zones"
          title={t.sections.bodyZones}
          expanded={expandedSections.bodyZones}
          onToggle={() => toggleSection("bodyZones")}
        >
          <BodyZoneSelector
            zones={BODY_ZONES}
            selectedIds={value.bodyZoneIds}
            onToggle={toggleBodyZone}
            accessibilityLabel={t.bodyZones.accessibilityLabel}
          />
        </CollapsibleSection>

        <CollapsibleSection
          testID="exercise-section-execution-mode"
          title={t.sections.executionMode}
          expanded={expandedSections.executionMode}
          onToggle={() => toggleSection("executionMode")}
        >
          <View style={styles.executionModeGroup} testID="exercise-execution-mode-group">
            <View
              style={styles.segmentedControl}
              accessibilityRole="tablist"
              accessibilityLabel={t.executionMode.label}
            >
              <SegmentButton
                label={t.executionMode.duration}
                selected={value.executionMode === "DURATION"}
                onPress={() => handleExecutionModeChange("DURATION")}
              />
              <SegmentButton
                label={t.executionMode.repetitions}
                selected={value.executionMode === "REPETITIONS"}
                onPress={() => handleExecutionModeChange("REPETITIONS")}
              />
              <SegmentButton
                label={t.executionMode.toFailure}
                selected={value.executionMode === "TO_FAILURE"}
                onPress={() => handleExecutionModeChange("TO_FAILURE")}
              />
            </View>

            <View style={styles.parameterCard} testID="exercise-parameter-card">
              <View style={styles.parameterRow} testID="exercise-parameter-row">
                <ParameterField
                  testID="exercise-field-seriesCount"
                  width={dimensions.exerciseParameterRow.narrowColumnWidth}
                  label={t.seriesCount.compactLabel}
                  accessibilityLabel={t.seriesCount.accessibilityLabel}
                  value={String(value.seriesCount)}
                  isOpen={openOverlay === "seriesCount"}
                  onPress={() => toggleOverlay("seriesCount")}
                />
                {value.executionMode === "DURATION" ? (
                  <ParameterField
                    testID="exercise-field-duration"
                    width={dimensions.exerciseParameterRow.wideColumnWidth}
                    label={t.duration.label}
                    accessibilityLabel={t.duration.accessibilityLabel}
                    value={formatDurationRowValue(
                      value.durationSeconds ?? 0,
                      WHEEL_EXERCISE_DURATION_SECONDS_MAX,
                    )}
                    isOpen={openOverlay === "duration"}
                    onPress={() => toggleOverlay("duration")}
                  />
                ) : null}
                {value.executionMode === "REPETITIONS" ? (
                  <ParameterField
                    testID="exercise-field-repetitionCount"
                    width={dimensions.exerciseParameterRow.wideColumnWidth}
                    label={t.repetitionCount.compactLabel}
                    accessibilityLabel={t.repetitionCount.accessibilityLabel}
                    value={String(value.repetitionCount ?? DEFAULT_REPETITION_COUNT)}
                    isOpen={openOverlay === "repetitionCount"}
                    onPress={() => toggleOverlay("repetitionCount")}
                  />
                ) : null}
                {value.executionMode === "TO_FAILURE" ? (
                  <StaticParameterField
                    testID="exercise-field-toFailure"
                    width={dimensions.exerciseParameterRow.wideColumnWidth}
                    label={null}
                    value={t.executionMode.toFailure}
                    accessibilityLabel={t.executionMode.toFailure}
                  />
                ) : null}
                <ParameterField
                  testID="exercise-field-pauseSeconds"
                  width={dimensions.exerciseParameterRow.wideColumnWidth}
                  label={t.pauseSeconds.compactLabel}
                  accessibilityLabel={t.pauseSeconds.accessibilityLabel}
                  value={formatDurationRowValue(value.pauseSeconds, WHEEL_PAUSE_SECONDS_MAX)}
                  isOpen={openOverlay === "pauseSeconds"}
                  onPress={() => toggleOverlay("pauseSeconds")}
                />
              </View>

              <View style={styles.parameterRow} testID="exercise-parameter-row-secondary">
                <SideModeControl
                  value={value.sideMode}
                  onChange={(next) => patch({ sideMode: next })}
                  title={sideModeStrings.activity.label}
                  accessibilityLabel={sideModeAccessibilityLabel}
                  disabled={isSideModeInherited}
                  testID="exercise-side-mode"
                />
                <ParameterField
                  testID="exercise-field-recoverySeconds"
                  width={dimensions.exerciseParameterRow.wideColumnWidth}
                  label={t.recoverySeconds.compactLabel}
                  accessibilityLabel={t.recoverySeconds.accessibilityLabel}
                  value={formatDurationRowValue(value.recoverySeconds, WHEEL_RECOVERY_SECONDS_MAX)}
                  isOpen={openOverlay === "recoverySeconds"}
                  onPress={() => toggleOverlay("recoverySeconds")}
                />
                {isTotalDurationDriveable ? (
                  <ParameterField
                    testID="exercise-field-totalDuration"
                    width={dimensions.exerciseParameterRow.wideColumnWidth}
                    label={t.totalDuration.compactLabel}
                    accessibilityLabel={t.totalDuration.accessibilityLabel}
                    value={formattedTotalDuration}
                    isOpen={openOverlay === "totalDuration"}
                    onPress={() => toggleOverlay("totalDuration")}
                  />
                ) : (
                  <StaticParameterField
                    testID="exercise-field-totalDuration"
                    width={dimensions.exerciseParameterRow.wideColumnWidth}
                    label={t.totalDuration.compactLabelLowerBound}
                    value={formattedTotalDuration}
                    accessibilityLabel={t.totalDuration.accessibilityLabelLowerBound}
                  />
                )}
              </View>
            </View>
          </View>
        </CollapsibleSection>

        {/*
         * V2-CAT-01 (plan §4.3) : section `Médias` — Catalogue uniquement.
         * Visible et repliable ; contrôle, placeholder et `Ajouter un média`
         * restent désactivés, aucune fonction média réelle.
         */}
        {showMediaSection ? (
          <CollapsibleSection
            testID="activity-editor-section-media"
            title={mediaStrings.label}
            expanded={expandedSections.media}
            onToggle={() => toggleSection("media")}
          >
            <Text style={styles.mediaPlaceholder} testID="activity-editor-media-placeholder">
              {mediaStrings.placeholder}
            </Text>
            <Pressable
              disabled
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              accessibilityLabel={mediaStrings.addMediaUnavailableAccessibilityLabel}
              style={styles.addMediaSectionButton}
              testID="activity-editor-add-media"
            >
              <KodjoIcon name="action-add" testID="activity-editor-add-media-icon" />
              <Text style={styles.addMediaLabel}>{mediaStrings.addMedia}</Text>
            </Pressable>
          </CollapsibleSection>
        ) : null}
      </ScrollView>

      {/*
       * Synthèse FIXE et NON DÉFILANTE (CE-T01-13). Le nom de l'Activité est
       * en GRAS uniquement ici (revue 5732014381, obligation 5) — jamais
       * dans le champ de saisie.
       */}
      <View style={styles.summaryCard} testID="exercise-summary-card">
        <Text style={styles.summaryText}>
          <BoldenedName recap={formatExerciseRecap(recapFacts)} name={value.name} />
        </Text>
        <Text style={styles.summaryDurationText} testID="exercise-summary-duration">
          {formatExerciseDurationLine(recapFacts)}
        </Text>
      </View>

      <WheelPickerOverlay visible={openOverlay !== null}>
        {openOverlay === "duration" ? (
          <DurationWheelPicker
            totalSeconds={value.durationSeconds ?? DEFAULT_EXERCISE_DURATION_SECONDS}
            onValidate={(totalSeconds) => {
              patch({ durationSeconds: totalSeconds });
              closeOverlay();
            }}
            onCancel={closeOverlay}
            maxTotalSeconds={WHEEL_EXERCISE_DURATION_SECONDS_MAX}
            minutesAccessibilityLabel={t.wheelPicker.minutesAccessibilityLabel}
            secondsAccessibilityLabel={t.wheelPicker.secondsAccessibilityLabel}
            cancelAccessibilityLabel={t.wheelPicker.cancelAccessibilityLabel}
            validateAccessibilityLabel={t.wheelPicker.validateAccessibilityLabel}
          />
        ) : null}
        {openOverlay === "repetitionCount" ? (
          <NumberWheelPicker
            value={value.repetitionCount ?? DEFAULT_REPETITION_COUNT}
            onValidate={(next) => {
              patch({ repetitionCount: next });
              closeOverlay();
            }}
            onCancel={closeOverlay}
            accessibilityLabel={t.repetitionCount.wheelAccessibilityLabel}
            cancelAccessibilityLabel={t.wheelPicker.cancelAccessibilityLabel}
            validateAccessibilityLabel={t.wheelPicker.validateAccessibilityLabel}
            testID="exercise-repetition-count-wheel"
          />
        ) : null}
        {openOverlay === "pauseSeconds" ? (
          <DurationWheelPicker
            totalSeconds={value.pauseSeconds}
            onValidate={(totalSeconds) => {
              patch({ pauseSeconds: totalSeconds });
              closeOverlay();
            }}
            onCancel={closeOverlay}
            maxTotalSeconds={WHEEL_PAUSE_SECONDS_MAX}
            minutesAccessibilityLabel={t.wheelPicker.minutesAccessibilityLabel}
            secondsAccessibilityLabel={t.wheelPicker.secondsAccessibilityLabel}
            cancelAccessibilityLabel={t.wheelPicker.cancelAccessibilityLabel}
            validateAccessibilityLabel={t.wheelPicker.validateAccessibilityLabel}
          />
        ) : null}
        {openOverlay === "seriesCount" ? (
          <NumberWheelPicker
            value={value.seriesCount}
            onValidate={(next) => {
              patch({ seriesCount: next });
              closeOverlay();
            }}
            onCancel={closeOverlay}
            accessibilityLabel={t.seriesCount.wheelAccessibilityLabel}
            cancelAccessibilityLabel={t.wheelPicker.cancelAccessibilityLabel}
            validateAccessibilityLabel={t.wheelPicker.validateAccessibilityLabel}
            testID="exercise-series-count-wheel"
          />
        ) : null}
        {openOverlay === "recoverySeconds" ? (
          <DurationWheelPicker
            totalSeconds={value.recoverySeconds}
            onValidate={(totalSeconds) => {
              patch({ recoverySeconds: totalSeconds });
              closeOverlay();
            }}
            onCancel={closeOverlay}
            maxTotalSeconds={WHEEL_RECOVERY_SECONDS_MAX}
            minutesAccessibilityLabel={t.wheelPicker.minutesAccessibilityLabel}
            secondsAccessibilityLabel={t.wheelPicker.secondsAccessibilityLabel}
            cancelAccessibilityLabel={t.wheelPicker.cancelAccessibilityLabel}
            validateAccessibilityLabel={t.wheelPicker.validateAccessibilityLabel}
          />
        ) : null}
        {openOverlay === "totalDuration" && isTotalDurationDriveable ? (
          <DurationWheelPicker
            totalSeconds={Math.min(totalDurationSeconds, WHEEL_TOTAL_DURATION_SECONDS_MAX)}
            onValidate={handleTotalDurationConfirmed}
            onCancel={closeOverlay}
            maxTotalSeconds={WHEEL_TOTAL_DURATION_SECONDS_MAX}
            minutesAccessibilityLabel={t.wheelPicker.minutesAccessibilityLabel}
            secondsAccessibilityLabel={t.wheelPicker.secondsAccessibilityLabel}
            cancelAccessibilityLabel={t.wheelPicker.cancelAccessibilityLabel}
            validateAccessibilityLabel={t.wheelPicker.validateAccessibilityLabel}
          />
        ) : null}
      </WheelPickerOverlay>

      {/*
       * Action finale unique (D-137) : `Terminer`. Enveloppée dans un
       * conteneur de POSITIONNEMENT (`finishActionSlot`) qui sert aussi de
       * repère à la notification temporaire, laquelle le recouvre
       * EXACTEMENT. Un message d'erreur de sauvegarde (Catalogue) reste
       * visible au-dessus du bouton, sans perdre le brouillon local.
       */}
      <View
        style={[styles.finishActionSlot, { marginBottom: insets.bottom + spacing[16] }]}
        testID={finishSlotTestID}
      >
        {errorMessage ? (
          <Text style={styles.saveErrorText} testID={errorTestID}>
            {errorMessage}
          </Text>
        ) : null}
        <Pressable
          disabled={finishDisabled}
          onPress={onFinish}
          accessibilityRole="button"
          accessibilityState={{ disabled: finishDisabled }}
          accessibilityLabel={finishLabel}
          style={[styles.primaryAction, finishDisabled ? styles.primaryActionDisabled : null]}
          testID={finishActionTestID}
        >
          <Text style={styles.primaryActionLabel}>{finishLabel}</Text>
        </Pressable>

        <TransientNotification
          message={adjustment?.message ?? null}
          actionLabel={t.adjustedTotalDurationUndoAction}
          onAction={handleUndoAdjustment}
          onDismiss={() => setAdjustment(null)}
          testID="exercise-adjustment-notification"
        />
      </View>
    </>
  );
}

/**
 * Rend `recap` en mettant en gras la première occurrence de `name` — le
 * nom de l'Activité, seul élément en gras de la synthèse (revue 5732014381,
 * obligation 5). Un nom vide (encore invalide, `Terminer` désactivé) rend le
 * texte intégral sans mise en forme particulière.
 */
function BoldenedName({ recap, name }: { recap: string; name: string }): ReactNode {
  if (name.length === 0) {
    return recap;
  }
  const index = recap.indexOf(name);
  if (index === -1) {
    return recap;
  }
  const before = recap.slice(0, index);
  const after = recap.slice(index + name.length);
  return (
    <>
      {before}
      <Text style={styles.summaryTextBoldName} testID="exercise-summary-name">
        {name}
      </Text>
      {after}
    </>
  );
}

function CollapsibleSection({
  testID,
  title,
  expanded,
  onToggle,
  children,
}: {
  testID: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const sections = strings.screens.exercise.sections;
  const headerAccessibilityLabel = `${expanded ? sections.collapseAction : sections.expandAction} ${title}`;

  return (
    <View testID={testID}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={headerAccessibilityLabel}
        style={styles.sectionHeader}
        testID={`${testID}-header`}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <DisclosureControl
          expanded={expanded}
          onPress={onToggle}
          decorative
          testID={`${testID}-disclosure`}
        />
      </Pressable>
      {expanded ? (
        <View style={styles.sectionContent} testID={`${testID}-content`}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

const LABEL_PLACEHOLDER = " ";

const PARAMETER_CONTROL_HIT_SLOP = {
  top: (minTouchTarget - dimensions.exerciseParameterRow.controlHeight) / 2,
  bottom: (minTouchTarget - dimensions.exerciseParameterRow.controlHeight) / 2,
  left: 0,
  right: 0,
} as const;

function ParameterField({
  testID,
  width,
  label,
  value,
  isOpen,
  onPress,
  accessibilityLabel,
}: {
  testID: string;
  width: number;
  label: string;
  value: string;
  isOpen: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <View style={{ width, gap: dimensions.exerciseParameterRow.labelGap }} testID={testID}>
      <Text style={styles.parameterLabel} numberOfLines={1}>
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: isOpen }}
        hitSlop={PARAMETER_CONTROL_HIT_SLOP}
        style={[styles.parameterControl, { width }]}
        testID={`${testID}-control`}
      >
        <Text style={styles.parameterValue} numberOfLines={1}>
          {value}
        </Text>
        <View style={styles.parameterChevronBox} testID={`${testID}-chevron-box`}>
          <KodjoIcon name="select-field-chevron" testID={`${testID}-chevron`} />
        </View>
      </Pressable>
    </View>
  );
}

function StaticParameterField({
  testID,
  width,
  label,
  value,
  accessibilityLabel,
}: {
  testID: string;
  width: number;
  label: string | null;
  value: string;
  accessibilityLabel: string;
}) {
  return (
    <View style={{ width, gap: dimensions.exerciseParameterRow.labelGap }} testID={testID}>
      {label === null ? (
        <Text
          style={styles.parameterLabel}
          numberOfLines={1}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          testID={`${testID}-label-spacer`}
        >
          {LABEL_PLACEHOLDER}
        </Text>
      ) : (
        <Text style={styles.parameterLabel} numberOfLines={1}>
          {label}
        </Text>
      )}
      <View
        style={[styles.parameterControl, styles.parameterControlStatic, { width }]}
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel}
        testID={`${testID}-control`}
      >
        <Text style={styles.parameterValueStatic} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function SegmentButton({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="tab"
      accessibilityState={{ selected, disabled: Boolean(disabled) }}
      accessibilityLabel={label}
      style={[
        styles.segment,
        selected ? styles.segmentSelected : null,
        disabled ? styles.segmentDisabled : null,
      ]}
    >
      <Text
        style={[
          styles.segmentLabel,
          selected ? styles.segmentLabelSelected : null,
          disabled ? styles.segmentLabelDisabled : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
    paddingBottom: spacing[16],
    gap: spacing[24],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    ...type.sectionTitle,
    color: colors.textPrimary,
  },
  sectionContent: {
    marginTop: spacing[12],
  },
  contextBand: {
    backgroundColor: colors.exerciseContextBandBackground,
    paddingHorizontal: spacing[24],
    height: dimensions.contextBand.height,
    paddingTop: dimensions.contextBand.paddingTop,
    paddingBottom: dimensions.contextBand.paddingBottom,
    justifyContent: "space-between",
  },
  nameInput: {
    ...type.screenTitle,
    color: colors.textPrimary,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.sessionNameBorder,
    borderRadius: dimensions.exerciseTextField.radius,
    height: dimensions.exerciseTextField.height,
    paddingHorizontal: dimensions.exerciseTextField.paddingHorizontal,
  },
  instructionInput: {
    ...type.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    minHeight: 120,
    textAlignVertical: "top",
  },
  segmentedControl: {
    flexDirection: "row",
    width: "100%",
    height: dimensions.segmentedControl.height,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.segmentedControl.containerRadius,
    padding: dimensions.segmentedControl.padding,
    gap: dimensions.segmentedControl.gap,
  },
  segment: {
    flex: 1,
    height: dimensions.segmentedControl.segmentHeight,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: dimensions.segmentedControl.segmentRadius,
  },
  segmentSelected: {
    backgroundColor: colors.selection,
  },
  segmentLabel: {
    ...type.label,
    color: colors.textSecondary,
  },
  segmentLabelSelected: {
    color: colors.background,
  },
  segmentDisabled: {
    opacity: 0.5,
  },
  segmentLabelDisabled: {
    color: colors.disabled,
  },
  parameterCard: {
    width: dimensions.exerciseParameterRow.cardWidth,
    padding: dimensions.exerciseParameterRow.cardPadding,
    borderRadius: dimensions.exerciseParameterRow.cardRadius,
    backgroundColor: colors.exerciseParameterCardBackground,
    gap: dimensions.exerciseParameterRow.columnGap,
  },
  parameterRow: {
    flexDirection: "row",
    width: dimensions.exerciseParameterRow.rowWidth,
    height: dimensions.exerciseParameterRow.rowHeight,
    gap: dimensions.exerciseParameterRow.columnGap,
  },
  parameterLabel: {
    ...type.parameterColumnLabel,
    color: colors.exerciseParameterLabelText,
  },
  parameterControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: dimensions.exerciseParameterRow.controlHeight,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.exerciseParameterControlBorder,
    borderRadius: dimensions.exerciseParameterRow.controlRadius,
    paddingLeft: dimensions.exerciseParameterRow.controlPaddingLeft,
    paddingRight: dimensions.exerciseParameterRow.controlPaddingRight,
  },
  parameterValue: {
    ...type.label,
    color: colors.exerciseParameterValueText,
  },
  parameterControlStatic: {
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  parameterValueStatic: {
    ...type.label,
    color: colors.selection,
  },
  parameterChevronBox: {
    width: dimensions.exerciseParameterRow.chevronBox,
    height: dimensions.exerciseParameterRow.chevronBox,
    borderRadius: dimensions.exerciseParameterRow.chevronBoxRadius,
    backgroundColor: colors.tourSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  executionModeGroup: {
    gap: spacing[8],
  },
  addMediaButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[6],
    height: dimensions.compactSecondaryButton.visualHeight,
    borderRadius: dimensions.compactSecondaryButton.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[16],
  },
  addMediaSectionButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[6],
    height: dimensions.compactSecondaryButton.visualHeight,
    borderRadius: dimensions.compactSecondaryButton.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[16],
    marginTop: spacing[8],
  },
  addMediaLabel: {
    ...type.button,
    color: colors.textSecondary,
  },
  mediaPlaceholder: {
    ...type.body,
    color: colors.textSecondary,
  },
  summaryCard: {
    marginHorizontal: spacing[24],
    marginTop: spacing[8],
    borderWidth: 1,
    borderColor: colors.tourSurface,
    borderRadius: dimensions.exerciseSummaryCard.radius,
    paddingHorizontal: dimensions.exerciseSummaryCard.paddingHorizontal,
    paddingVertical: dimensions.exerciseSummaryCard.paddingVertical,
    gap: dimensions.exerciseSummaryCard.paddingVertical,
  },
  summaryText: {
    ...type.body,
    color: colors.exerciseParameterValueText,
  },
  summaryTextBoldName: {
    ...type.body,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    color: colors.exerciseParameterValueText,
  },
  summaryDurationText: {
    ...type.label,
    color: colors.textPrimary,
  },
  finishActionSlot: {
    position: "relative",
    marginTop: spacing[16],
    marginHorizontal: spacing[24],
  },
  primaryAction: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[12],
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  primaryActionDisabled: {
    backgroundColor: colors.disabled,
  },
  primaryActionLabel: {
    ...type.button,
    color: colors.background,
  },
  saveErrorText: {
    ...type.body,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing[8],
  },
});
