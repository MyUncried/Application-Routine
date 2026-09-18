import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { CreateActivityDefinitionInput } from "@/domain/activities";
import {
  DEFAULT_EXERCISE_DURATION_SECONDS,
  DEFAULT_REPETITION_COUNT,
  DEFAULT_SIDE_MODE,
} from "@/domain/sessions/defaults";
import type { ExerciseExecutionMode } from "@/domain/sessions/Session";
import { INSTRUCTION_MAX_LENGTH, NAME_MAX_LENGTH } from "@/domain/sessions/validation";
import { BODY_ZONES } from "@/features/reference-data/bodyZones";
import { BodyZoneSelector } from "@/features/sessions/BodyZoneSelector";
import { SideModeControl } from "@/features/sessions/SideModeControl";
import { strings } from "@/shared/i18n";
import { DisclosureControl } from "@/shared/ui/DisclosureControl";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

export type ActivityEditorFormValue = CreateActivityDefinitionInput;

export type ActivityEditorFormProps = {
  value: ActivityEditorFormValue;
  onChange: (patch: Partial<ActivityEditorFormValue>) => void;
};

/**
 * Formulaire commun d'une Activité (V2-CAT-01, plan §7 étape 4) — les champs
 * partagés entre la Composition (`SessionActivity`, via `ExerciseScreen`) et
 * le Catalogue (`ActivityDefinition`, via `CatalogueActivityEditorScreen`).
 * Composant purement contrôlé : ne connaît ni `SessionDraftContext` ni
 * `ActivityDefinitionService` — chaque adaptateur lui fournit `value` et
 * reçoit ses patches via `onChange`, puis décide seul de la cible
 * d'enregistrement (D-137, deux cibles distinctes, aucune règle de
 * validation/calcul dupliquée).
 *
 * `Médias` est une section visible et repliable, dont le contrôle,
 * `Ajouter un média` et le placeholder restent désactivés (plan §4.3) —
 * aucune fonction média réelle.
 */
export function ActivityEditorForm({ value, onChange }: ActivityEditorFormProps) {
  const [mediaExpanded, setMediaExpanded] = useState(false);
  const t = strings.screens.activities.editor;
  const exerciseStrings = strings.screens.exercise;

  function handleExecutionModeChange(mode: ExerciseExecutionMode) {
    if (mode === value.executionMode) {
      return;
    }
    if (mode === "DURATION") {
      onChange({
        executionMode: "DURATION",
        durationSeconds: value.durationSeconds ?? DEFAULT_EXERCISE_DURATION_SECONDS,
        repetitionCount: null,
      });
    } else if (mode === "REPETITIONS") {
      onChange({
        executionMode: "REPETITIONS",
        repetitionCount: value.repetitionCount ?? DEFAULT_REPETITION_COUNT,
        durationSeconds: null,
      });
    } else {
      onChange({ executionMode: "TO_FAILURE", durationSeconds: null, repetitionCount: null });
    }
  }

  function toggleBodyZone(zoneId: string) {
    onChange({
      bodyZoneIds: value.bodyZoneIds.includes(zoneId)
        ? value.bodyZoneIds.filter((id) => id !== zoneId)
        : [...value.bodyZoneIds, zoneId],
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content} testID="activity-editor-form">
      <TextInput
        value={value.name}
        onChangeText={(text) => onChange({ name: text })}
        placeholder={t.name}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={t.name}
        maxLength={NAME_MAX_LENGTH}
        style={styles.nameInput}
        testID="activity-editor-name-input"
      />

      <TextInput
        value={value.description ?? ""}
        onChangeText={(text) => onChange({ description: text.length > 0 ? text : null })}
        placeholder={exerciseStrings.instruction.label}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={exerciseStrings.instruction.label}
        maxLength={INSTRUCTION_MAX_LENGTH}
        multiline
        style={styles.instructionInput}
        testID="activity-editor-description-input"
      />

      <View
        style={styles.segmentedControl}
        accessibilityRole="tablist"
        accessibilityLabel={exerciseStrings.executionMode.label}
      >
        <SegmentButton
          label={exerciseStrings.executionMode.duration}
          selected={value.executionMode === "DURATION"}
          onPress={() => handleExecutionModeChange("DURATION")}
        />
        <SegmentButton
          label={exerciseStrings.executionMode.repetitions}
          selected={value.executionMode === "REPETITIONS"}
          onPress={() => handleExecutionModeChange("REPETITIONS")}
        />
        <SegmentButton
          label={exerciseStrings.executionMode.toFailure}
          selected={value.executionMode === "TO_FAILURE"}
          onPress={() => handleExecutionModeChange("TO_FAILURE")}
        />
      </View>

      {value.executionMode === "DURATION" ? (
        <NumericField
          label={exerciseStrings.duration.label}
          value={value.durationSeconds}
          onChangeValue={(next) => onChange({ durationSeconds: next })}
          testID="activity-editor-duration"
        />
      ) : null}
      {value.executionMode === "REPETITIONS" ? (
        <NumericField
          label={exerciseStrings.repetitionCount.label}
          value={value.repetitionCount}
          onChangeValue={(next) => onChange({ repetitionCount: next })}
          testID="activity-editor-repetitionCount"
        />
      ) : null}

      <NumericField
        label={exerciseStrings.seriesCount.label}
        value={value.seriesCount}
        onChangeValue={(next) => onChange({ seriesCount: next ?? value.seriesCount })}
        testID="activity-editor-seriesCount"
      />
      <NumericField
        label={exerciseStrings.pauseSeconds.label}
        value={value.pauseSeconds}
        onChangeValue={(next) => onChange({ pauseSeconds: next ?? 0 })}
        testID="activity-editor-pauseSeconds"
      />
      <NumericField
        label={exerciseStrings.recoverySeconds.label}
        value={value.recoverySeconds}
        onChangeValue={(next) => onChange({ recoverySeconds: next ?? 0 })}
        testID="activity-editor-recoverySeconds"
      />

      <SideModeControl
        value={value.sideMode ?? DEFAULT_SIDE_MODE}
        onChange={(next) => onChange({ sideMode: next })}
        title={strings.shared.sideMode.activity.label}
        accessibilityLabel={strings.shared.sideMode.activity.accessibilityLabels[value.sideMode ?? DEFAULT_SIDE_MODE]}
        testID="activity-editor-side-mode"
      />

      <Text style={styles.sectionTitle}>{exerciseStrings.bodyZones.label}</Text>
      <BodyZoneSelector
        zones={BODY_ZONES}
        selectedIds={value.bodyZoneIds}
        onToggle={toggleBodyZone}
        accessibilityLabel={exerciseStrings.bodyZones.accessibilityLabel}
      />

      <Pressable
        onPress={() => setMediaExpanded((current) => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded: mediaExpanded }}
        accessibilityLabel={
          mediaExpanded ? t.media.collapseAccessibilityLabel : t.media.expandAccessibilityLabel
        }
        style={styles.mediaHeader}
        testID="activity-editor-media-header"
      >
        <Text style={styles.sectionTitle}>{t.media.label}</Text>
        <DisclosureControl expanded={mediaExpanded} decorative testID="activity-editor-media-disclosure" />
      </Pressable>
      {mediaExpanded ? (
        <View testID="activity-editor-media-content">
          <Text style={styles.mediaPlaceholder}>{t.media.placeholder}</Text>
          <Pressable
            disabled
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            accessibilityLabel={t.media.addMediaUnavailableAccessibilityLabel}
            style={styles.addMediaButton}
            testID="activity-editor-add-media"
          >
            <KodjoIcon name="action-add" testID="activity-editor-add-media-icon" />
            <Text style={styles.addMediaLabel}>{t.media.addMedia}</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

function NumericField({
  label,
  value,
  onChangeValue,
  testID,
}: {
  label: string;
  value: number | null;
  onChangeValue: (next: number | null) => void;
  testID: string;
}) {
  return (
    <View style={styles.numericField} testID={testID}>
      <Text style={styles.numericFieldLabel}>{label}</Text>
      <TextInput
        value={value === null ? "" : String(value)}
        onChangeText={(text) => {
          const trimmed = text.trim();
          if (trimmed.length === 0) {
            onChangeValue(null);
            return;
          }
          const parsed = Number.parseInt(trimmed, 10);
          onChangeValue(Number.isFinite(parsed) ? parsed : null);
        }}
        keyboardType="number-pad"
        accessibilityLabel={label}
        style={styles.numericFieldInput}
        testID={`${testID}-input`}
      />
    </View>
  );
}

function SegmentButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[styles.segment, selected ? styles.segmentSelected : null]}
    >
      <Text style={[styles.segmentLabel, selected ? styles.segmentLabelSelected : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing[24],
    gap: spacing[16],
  },
  nameInput: {
    ...type.screenTitle,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
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
    minHeight: 100,
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
  numericField: {
    gap: spacing[6],
  },
  numericFieldLabel: {
    ...type.parameterColumnLabel,
    color: colors.exerciseParameterLabelText,
  },
  numericFieldInput: {
    ...type.label,
    color: colors.exerciseParameterValueText,
    height: dimensions.exerciseParameterRow.controlHeight,
    borderWidth: 1,
    borderColor: colors.exerciseParameterControlBorder,
    borderRadius: dimensions.exerciseParameterRow.controlRadius,
    paddingHorizontal: spacing[12],
  },
  sectionTitle: {
    ...type.sectionTitle,
    color: colors.textPrimary,
  },
  mediaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mediaPlaceholder: {
    ...type.body,
    color: colors.textSecondary,
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
    marginTop: spacing[8],
  },
  addMediaLabel: {
    ...type.button,
    color: colors.textSecondary,
  },
});
