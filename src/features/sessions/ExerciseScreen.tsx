import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
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
  const insets = useSafeAreaInsets();
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
    <Pressable
      style={[styles.container, { paddingTop: insets.top + spacing[16] }]}
      onPress={closeOverlay}
      accessible={false}
    >
      {/*
       * UI-ACT-002 (cycle de correction après contre-recette iPhone,
       * 2026-09-03) : l'en-tête fixe affiche le vrai nom de la Séance (celui
       * saisi sur Composition), jamais « Ajouter une activité » — ce dernier
       * reste le titre du CORPS défilant (ci-dessous), distinct. Repli sur le
       * placeholder « Nom de la séance » tant qu'aucun nom n'a encore été
       * saisi (Composition n'impose aucun nom avant d'ajouter une Activité).
       */}
      <View style={styles.header} testID="exercise-header">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.backAccessibilityLabel}
          hitSlop={spacing[8]}
          style={styles.backButton}
        >
          <KodjoIcon name="control-back" testID="exercise-back-icon" />
        </Pressable>
        <Text style={styles.title}>
          {draft.name.length > 0 ? draft.name : strings.screens.composition.name}
        </Text>
      </View>
      <View style={styles.headerSeparator} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 ? (
          <>
            <Text style={styles.bodyTitle}>{isEditing ? t.titleEdit : t.titleAdd}</Text>

            {/*
             * Segment `Exercice / Récupération` (CE-T01-13, élément
             * structurel obligatoire même hors périmètre fonctionnel) :
             * Récupération n'a ni écran ni parcours dans T01 (tout T01,
             * confirmé) — visible mais désactivé, ne peut jamais ouvrir un
             * écran partiel. `Exercice` reste verrouillé sélectionné.
             */}
            <View
              style={styles.segmentedControl}
              accessibilityRole="tablist"
              accessibilityLabel={t.type.label}
            >
              <SegmentButton label={t.type.exercise} selected onPress={() => {}} />
              <SegmentButton label={t.type.recovery} selected={false} disabled onPress={() => {}} />
            </View>

            <Text style={styles.fieldLabel}>{t.name}</Text>
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

            <Text style={styles.sectionLabel}>{t.parametersTitle}</Text>

            {local.executionMode === "DURATION" ? (
              <AnchoredRow
                testID="exercise-anchored-row-duration"
                elevated={openOverlay === "duration"}
              >
                <Row
                  label={t.duration.label}
                  accessibilityLabel={t.duration.accessibilityLabel}
                  value={formatDurationRowValue(
                    local.durationSeconds ?? 0,
                    WHEEL_EXERCISE_DURATION_SECONDS_MAX,
                  )}
                  isOpen={openOverlay === "duration"}
                  onPress={() => toggleOverlay("duration")}
                />
                {openOverlay === "duration" ? (
                  <PopoverAnchor>
                    <DurationWheelPicker
                      totalSeconds={local.durationSeconds ?? DEFAULT_EXERCISE_DURATION_SECONDS}
                      onChange={(totalSeconds) => patchLocal({ durationSeconds: totalSeconds })}
                      maxTotalSeconds={WHEEL_EXERCISE_DURATION_SECONDS_MAX}
                      minutesAccessibilityLabel={t.wheelPicker.minutesAccessibilityLabel}
                      secondsAccessibilityLabel={t.wheelPicker.secondsAccessibilityLabel}
                    />
                  </PopoverAnchor>
                ) : null}
              </AnchoredRow>
            ) : (
              <AnchoredRow
                testID="exercise-anchored-row-repetitionCount"
                elevated={openOverlay === "repetitionCount"}
              >
                <Row
                  label={t.repetitionCount.label}
                  isOpen={openOverlay === "repetitionCount"}
                  value={String(local.repetitionCount ?? DEFAULT_REPETITION_COUNT)}
                  onPress={() => toggleOverlay("repetitionCount")}
                />
                {openOverlay === "repetitionCount" ? (
                  <PopoverAnchor>
                    <NumberWheelPicker
                      value={local.repetitionCount ?? DEFAULT_REPETITION_COUNT}
                      onChange={(value) => patchLocal({ repetitionCount: value })}
                      accessibilityLabel={t.repetitionCount.wheelAccessibilityLabel}
                      testID="exercise-repetition-count-wheel"
                    />
                  </PopoverAnchor>
                ) : null}
              </AnchoredRow>
            )}

            <AnchoredRow testID="exercise-anchored-row-pauseSeconds" elevated={openOverlay === "pauseSeconds"}>
              <Row
                label={t.pauseSeconds.label}
                isOpen={openOverlay === "pauseSeconds"}
                value={formatDurationRowValue(local.pauseSeconds, WHEEL_PAUSE_SECONDS_MAX)}
                onPress={() => toggleOverlay("pauseSeconds")}
              />
              {openOverlay === "pauseSeconds" ? (
                <PopoverAnchor>
                  <DurationWheelPicker
                    totalSeconds={local.pauseSeconds}
                    onChange={(totalSeconds) => patchLocal({ pauseSeconds: totalSeconds })}
                    maxTotalSeconds={WHEEL_PAUSE_SECONDS_MAX}
                    minutesAccessibilityLabel={t.wheelPicker.minutesAccessibilityLabel}
                    secondsAccessibilityLabel={t.wheelPicker.secondsAccessibilityLabel}
                  />
                </PopoverAnchor>
              ) : null}
            </AnchoredRow>

            <AnchoredRow testID="exercise-anchored-row-seriesCount" elevated={openOverlay === "seriesCount"}>
              <Row
                label={t.seriesCount.label}
                isOpen={openOverlay === "seriesCount"}
                value={String(local.seriesCount)}
                onPress={() => toggleOverlay("seriesCount")}
              />
              {openOverlay === "seriesCount" ? (
                <PopoverAnchor>
                  <NumberWheelPicker
                    value={local.seriesCount}
                    onChange={(value) => patchLocal({ seriesCount: value })}
                    accessibilityLabel={t.seriesCount.wheelAccessibilityLabel}
                    testID="exercise-series-count-wheel"
                  />
                </PopoverAnchor>
              ) : null}
            </AnchoredRow>
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
          style={[
            styles.primaryAction,
            { marginBottom: insets.bottom + spacing[16] },
            !step1Valid ? styles.primaryActionDisabled : null,
          ]}
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
          style={[
            styles.primaryAction,
            { marginBottom: insets.bottom + spacing[16] },
            !step1Valid ? styles.primaryActionDisabled : null,
          ]}
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

/**
 * Ancre de positionnement d'un sélecteur intégré (correction CE-T01-07/14,
 * AUD-05) — même patron que `CompositionScreen.tsx` (`AnchoredRow`), non
 * partagé entre les deux écrans pour rester local à chacun (aucun état ni
 * dépendance commune au-delà du positionnement).
 *
 * `elevated` (cycle de correction après contre-recette iPhone, 2026-09-03,
 * UI-CTRL-002) : élève cette ligne au-dessus de ses frères (Row/section
 * suivante) tant que son propre popover est ouvert — même cause racine et
 * même correction que `CompositionScreen.tsx`, voir sa note pour le détail
 * géométrique démontré (UI-CTRL-001).
 */
function AnchoredRow({
  children,
  elevated,
  testID,
}: {
  children: React.ReactNode;
  elevated: boolean;
  testID: string;
}) {
  return (
    <View testID={testID} style={[styles.anchoredRow, elevated ? styles.elevated : null]}>
      {children}
    </View>
  );
}

function PopoverAnchor({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.popoverAnchor} testID="exercise-popover-anchor">
      {children}
    </View>
  );
}

function Row({
  label,
  value,
  isOpen,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  value: string;
  isOpen: boolean;
  onPress: () => void;
  /** Distinct du libellé visuel uniquement lorsque celui-ci entre en collision avec un autre contrôle (ex. `Durée`, partagé avec l'onglet de mode). */
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ expanded: isOpen }}
      style={styles.row}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowTrailing}>
        <Text style={styles.rowValue}>{value}</Text>
        <KodjoIcon
          name={isOpen ? "control-chevron-up" : "control-chevron-down"}
          testID={`exercise-row-chevron-${isOpen ? "up" : "down"}`}
        />
      </View>
    </Pressable>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  title: {
    ...type.screenTitle,
    color: colors.textPrimary,
  },
  // UI-ACT-002 : ligne de séparation sous l'en-tête fixe (Header/corps),
  // même patron que `CompositionScreen.tsx` n'en avait pas encore besoin —
  // ici explicitement requise par le contrat d'écran (Header → séparateur →
  // corps défilant).
  headerSeparator: {
    height: 1,
    backgroundColor: colors.border,
  },
  bodyTitle: {
    ...type.screenTitle,
    color: colors.textPrimary,
  },
  fieldLabel: {
    ...type.supporting,
    color: colors.textSecondary,
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
  segmentDisabled: {
    opacity: 0.5,
  },
  segmentLabelDisabled: {
    color: colors.disabled,
  },
  anchoredRow: {
    // Sert uniquement de contexte de positionnement pour son sélecteur
    // (voir `AnchoredRow` ci-dessus) ; aucune propriété de layout propre.
  },
  // Voir `CompositionScreen.tsx` (même nom, même rôle, même correction
  // UI-CTRL-002) : élève une ligne au-dessus de ses frères tant que son
  // sélecteur est ouvert, sans quoi le popover reste partiellement ou
  // totalement recouvert par la ligne/section suivante.
  elevated: {
    zIndex: 1,
  },
  popoverAnchor: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: spacing[4],
    zIndex: 20,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
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
  rowTrailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
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
