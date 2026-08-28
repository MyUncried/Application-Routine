import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  DEFAULT_EXERCISE_DURATION_SECONDS,
  DEFAULT_REPETITION_COUNT,
} from "@/domain/sessions/defaults";
import {
  createExerciseDraft,
  exerciseEquals,
  type SessionDraftExercise,
  type SessionDraftExerciseExecutionMode,
} from "@/domain/sessions/SessionDraft";
import {
  INSTRUCTION_MAX_LENGTH,
  NAME_MAX_LENGTH,
  validateExerciseDurationSeconds,
  validateExerciseName,
  validateRepetitionCount,
} from "@/domain/sessions/validation";
import { BODY_ZONES } from "@/features/reference-data/bodyZones";
import { BodyZoneSelector } from "@/features/sessions/BodyZoneSelector";
import { formatDurationRowValue } from "@/features/sessions/compositionPresentation";
import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import { ExerciseExitConfirmModal } from "@/features/sessions/ExerciseExitConfirmModal";
import { NumberWheelPicker } from "@/features/sessions/NumberWheelPicker";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import {
  WHEEL_EXERCISE_DURATION_SECONDS_MAX,
  WHEEL_PAUSE_SECONDS_MAX,
} from "@/features/sessions/wheelPickerMath";
import { strings } from "@/shared/i18n";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

type OverlayKind = "duration" | "repetitionCount" | "pauseSeconds" | "seriesCount";

/** Étape 1 valide ⇔ Nom + (Durée ou Répétitions selon le mode) valides — Étape 2 est entièrement facultative (plan T01-S08). */
function isStep1Valid(exercise: SessionDraftExercise): boolean {
  if (!validateExerciseName(exercise.name).ok) {
    return false;
  }
  if (exercise.executionMode === "DURATION") {
    return (
      exercise.durationSeconds !== null &&
      validateExerciseDurationSeconds(exercise.durationSeconds).ok
    );
  }
  return exercise.repetitionCount !== null && validateRepetitionCount(exercise.repetitionCount).ok;
}

/**
 * Écran `Création / modification d'une Activité — Exercice` (T01-S08, docs
 * §06 Écran 4). Type verrouillé `Exercice` — le type `Récupération` (et son
 * propre écran 5) reste hors périmètre de tout T01.
 *
 * Copie de travail locale isolée du `SessionDraft` partagé (revue
 * indépendante ChatGPT, plan T01-S08) : toutes les modifications des deux
 * étapes ne touchent que `local` (état de ce composant), jamais
 * `updateDraft` directement — `Valider` ne fait que changer d'étape ;
 * `Terminer` est l'unique point d'écriture partagée
 * (`updateDraft({ exercise: local })`), exactement une fois. Un abandon
 * (modale D-094) ne réinitialise donc jamais le `SessionDraft` partagé :
 * `draft.exercise` reste inchangé (ajout abandonné → reste `null` ;
 * modification abandonnée → ancienne valeur inchangée). Reprendre
 * `useCompositionExitGuard(isSessionDraftDirty(draft), resetDraft)` tel quel
 * ici serait incorrect (bloquerait sur un `SessionDraft` déjà modifié avant
 * toute frappe, et effacerait toute la Composition à l'abandon) — la garde
 * compare ici `local` à son propre instantané (`exerciseEquals`, exportée).
 *
 * Verrou d'idempotence à deux niveaux (correction demandée en revue,
 * plan v3) : `finishingRef` (`useRef`, synchrone, protège `handleTerminer`
 * lui-même contre un double appel rapproché survenant avant tout rendu
 * intermédiaire — deux responsabilités jamais fusionnées) et `isFinishing`
 * (état React, seul responsable de désarmer la garde de sortie et de
 * déclencher la navigation de retour une fois ce désarmement effectif,
 * `shouldBlockExit = !isFinishing && !exerciseEquals(local, initialSnapshot)`).
 *
 * `useCompositionExitGuard` est appelée avant l'effet de navigation de
 * retour ci-dessous — l'ordre d'exécution des effets d'un même composant
 * (dans l'ordre de déclaration des hooks) garantit que l'effet interne
 * d'`usePreventRemove` (qui resynchronise `PreventRemoveContext` via
 * `setPreventRemove`, revérifié sur `usePreventRemove.js` installé avant
 * l'écriture de ce fichier) s'exécute avant l'effet de retour ci-dessous,
 * jamais l'inverse — démontré par
 * `ExerciseNavigationGuard.integration.test.tsx` (vrai navigateur).
 */
export function ExerciseScreen() {
  const router = useRouter();
  const { draft, updateDraft } = useSessionDraft();

  const [initialSnapshot] = useState<SessionDraftExercise>(
    () => draft.exercise ?? createExerciseDraft(),
  );
  const isEditing = draft.exercise !== null;
  const [local, setLocal] = useState<SessionDraftExercise>(initialSnapshot);
  const [step, setStep] = useState<1 | 2>(1);
  const [isFinishing, setIsFinishing] = useState(false);
  const finishingRef = useRef(false);
  const [openOverlay, setOpenOverlay] = useState<OverlayKind | null>(null);

  const shouldBlockExit = !isFinishing && !exerciseEquals(local, initialSnapshot);
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(
    shouldBlockExit,
    // La copie de travail locale n'est jamais partagée avant `Terminer` :
    // un abandon n'a donc rien à réinitialiser dans le `SessionDraft`
    // partagé (`draft.exercise` reste tel quel) — ce composant est de toute
    // façon démonté juste après le rejeu de la navigation interceptée.
    () => {},
  );

  useEffect(() => {
    if (isFinishing && !shouldBlockExit) {
      router.back();
    }
  }, [isFinishing, shouldBlockExit, router]);

  function closeOverlay() {
    setOpenOverlay(null);
  }

  function toggleOverlay(kind: OverlayKind) {
    Keyboard.dismiss();
    setOpenOverlay((current) => (current === kind ? null : kind));
  }

  function patchLocal(patch: Partial<SessionDraftExercise>) {
    setLocal((current) => ({ ...current, ...patch }));
  }

  function handleExecutionModeChange(mode: SessionDraftExerciseExecutionMode) {
    if (mode === local.executionMode) {
      return;
    }
    closeOverlay();
    if (mode === "DURATION") {
      patchLocal({
        executionMode: "DURATION",
        durationSeconds: local.durationSeconds ?? DEFAULT_EXERCISE_DURATION_SECONDS,
        repetitionCount: null,
      });
    } else {
      patchLocal({
        executionMode: "REPETITIONS",
        repetitionCount: local.repetitionCount ?? DEFAULT_REPETITION_COUNT,
        durationSeconds: null,
      });
    }
  }

  function toggleBodyZone(zoneId: string) {
    patchLocal({
      bodyZoneIds: local.bodyZoneIds.includes(zoneId)
        ? local.bodyZoneIds.filter((id) => id !== zoneId)
        : [...local.bodyZoneIds, zoneId],
    });
  }

  function handleTerminer() {
    // Verrou synchrone : positionné avant tout autre traitement, y compris
    // avant `updateDraft` — voir la note de tête sur l'idempotence à deux
    // niveaux. Un deuxième appel survenant avant le prochain rendu retourne
    // immédiatement, sans effet.
    if (finishingRef.current) {
      return;
    }
    finishingRef.current = true;
    updateDraft({ exercise: local });
    setIsFinishing(true);
  }

  const step1Valid = isStep1Valid(local);
  const t = strings.screens.exercise;

  return (
    <Pressable style={styles.container} onPress={closeOverlay} accessible={false}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.backAccessibilityLabel}
          hitSlop={spacing[8]}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{isEditing ? t.titleEdit : t.titleAdd}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 ? (
          <>
            <TextInput
              value={local.name}
              onChangeText={(text) => patchLocal({ name: text })}
              onFocus={closeOverlay}
              placeholder={t.name}
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel={t.name}
              maxLength={NAME_MAX_LENGTH}
              style={styles.nameInput}
            />

            <View
              style={styles.segmentedControl}
              accessibilityRole="tablist"
              accessibilityLabel={t.executionMode.label}
            >
              <SegmentButton
                label={t.executionMode.duration}
                selected={local.executionMode === "DURATION"}
                onPress={() => handleExecutionModeChange("DURATION")}
              />
              <SegmentButton
                label={t.executionMode.repetitions}
                selected={local.executionMode === "REPETITIONS"}
                onPress={() => handleExecutionModeChange("REPETITIONS")}
              />
            </View>

            {local.executionMode === "DURATION" ? (
              <>
                <Row
                  label={t.duration.label}
                  accessibilityLabel={t.duration.accessibilityLabel}
                  value={formatDurationRowValue(
                    local.durationSeconds ?? 0,
                    WHEEL_EXERCISE_DURATION_SECONDS_MAX,
                  )}
                  onPress={() => toggleOverlay("duration")}
                />
                {openOverlay === "duration" ? (
                  <DurationWheelPicker
                    totalSeconds={local.durationSeconds ?? DEFAULT_EXERCISE_DURATION_SECONDS}
                    onChange={(totalSeconds) => patchLocal({ durationSeconds: totalSeconds })}
                    maxTotalSeconds={WHEEL_EXERCISE_DURATION_SECONDS_MAX}
                    minutesAccessibilityLabel={t.wheelPicker.minutesAccessibilityLabel}
                    secondsAccessibilityLabel={t.wheelPicker.secondsAccessibilityLabel}
                  />
                ) : null}
              </>
            ) : (
              <>
                <Row
                  label={t.repetitionCount.label}
                  value={String(local.repetitionCount ?? DEFAULT_REPETITION_COUNT)}
                  onPress={() => toggleOverlay("repetitionCount")}
                />
                {openOverlay === "repetitionCount" ? (
                  <NumberWheelPicker
                    value={local.repetitionCount ?? DEFAULT_REPETITION_COUNT}
                    onChange={(value) => patchLocal({ repetitionCount: value })}
                    accessibilityLabel={t.repetitionCount.accessibilityLabel}
                    testID="exercise-repetition-count-wheel"
                  />
                ) : null}
              </>
            )}

            <Row
              label={t.pauseSeconds.label}
              value={formatDurationRowValue(local.pauseSeconds, WHEEL_PAUSE_SECONDS_MAX)}
              onPress={() => toggleOverlay("pauseSeconds")}
            />
            {openOverlay === "pauseSeconds" ? (
              <DurationWheelPicker
                totalSeconds={local.pauseSeconds}
                onChange={(totalSeconds) => patchLocal({ pauseSeconds: totalSeconds })}
                maxTotalSeconds={WHEEL_PAUSE_SECONDS_MAX}
                minutesAccessibilityLabel={t.wheelPicker.minutesAccessibilityLabel}
                secondsAccessibilityLabel={t.wheelPicker.secondsAccessibilityLabel}
              />
            ) : null}

            <Row
              label={t.seriesCount.label}
              value={String(local.seriesCount)}
              onPress={() => toggleOverlay("seriesCount")}
            />
            {openOverlay === "seriesCount" ? (
              <NumberWheelPicker
                value={local.seriesCount}
                onChange={(value) => patchLocal({ seriesCount: value })}
                accessibilityLabel={t.seriesCount.accessibilityLabel}
                testID="exercise-series-count-wheel"
              />
            ) : null}
          </>
        ) : (
          <>
            <TextInput
              value={local.instruction ?? ""}
              onChangeText={(text) => patchLocal({ instruction: text.length > 0 ? text : null })}
              placeholder={t.instruction.label}
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel={t.instruction.label}
              maxLength={INSTRUCTION_MAX_LENGTH}
              multiline
              style={styles.instructionInput}
            />

            <Text style={styles.sectionLabel}>{t.bodyZones.label}</Text>
            <BodyZoneSelector
              zones={BODY_ZONES}
              selectedIds={local.bodyZoneIds}
              onToggle={toggleBodyZone}
              accessibilityLabel={t.bodyZones.accessibilityLabel}
            />
          </>
        )}
      </ScrollView>

      {step === 1 ? (
        <Pressable
          disabled={!step1Valid}
          onPress={() => setStep(2)}
          accessibilityRole="button"
          accessibilityState={{ disabled: !step1Valid }}
          accessibilityLabel={t.validateAction}
          style={[styles.primaryAction, !step1Valid ? styles.primaryActionDisabled : null]}
        >
          <Text style={styles.primaryActionLabel}>{t.validateAction}</Text>
        </Pressable>
      ) : (
        <Pressable
          disabled={!step1Valid}
          onPress={handleTerminer}
          accessibilityRole="button"
          accessibilityState={{ disabled: !step1Valid }}
          accessibilityLabel={t.finishAction}
          style={[styles.primaryAction, !step1Valid ? styles.primaryActionDisabled : null]}
        >
          <Text style={styles.primaryActionLabel}>{t.finishAction}</Text>
        </Pressable>
      )}

      {isPendingExit ? (
        <ExerciseExitConfirmModal onCancel={cancelExit} onConfirm={confirmExit} />
      ) : null}
    </Pressable>
  );
}

function Row({
  label,
  value,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  value: string;
  onPress: () => void;
  /** Distinct du libellé visuel uniquement lorsque celui-ci entre en collision avec un autre contrôle (ex. `Durée`, partagé avec l'onglet de mode). */
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={styles.row}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </Pressable>
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
      <Text style={[styles.segmentLabel, selected ? styles.segmentLabelSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing[24],
    paddingHorizontal: spacing[24],
    gap: spacing[16],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
  },
  backButton: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -spacing[12],
  },
  backIcon: {
    ...type.activityTitle,
    color: colors.textPrimary,
  },
  title: {
    ...type.screenTitle,
    color: colors.textPrimary,
  },
  scrollContent: {
    gap: spacing[16],
    paddingBottom: spacing[16],
  },
  nameInput: {
    ...type.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
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
  sectionLabel: {
    ...type.sectionTitle,
    color: colors.textPrimary,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing[4],
    gap: spacing[4],
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[8],
    borderRadius: 8,
  },
  segmentSelected: {
    backgroundColor: colors.background,
  },
  segmentLabel: {
    ...type.button,
    color: colors.textSecondary,
  },
  segmentLabelSelected: {
    color: colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  rowLabel: {
    ...type.body,
    color: colors.textPrimary,
  },
  rowValue: {
    ...type.body,
    color: colors.textSecondary,
  },
  primaryAction: {
    marginBottom: spacing[16],
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
});
