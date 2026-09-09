import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  applyTargetTotalDuration,
  computeTotalDurationSeconds,
  type TotalDurationFacts,
} from "@/domain/sessions/calculations";
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
import {
  formatCompactDuration,
  formatDurationRowValue,
  formatExerciseDurationLine,
  formatExerciseRecap,
} from "@/features/sessions/compositionPresentation";
import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import { ExerciseExitConfirmModal } from "@/features/sessions/ExerciseExitConfirmModal";
import { NumberWheelPicker } from "@/features/sessions/NumberWheelPicker";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
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
import { FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

type OverlayKind =
  | "duration"
  | "repetitionCount"
  | "pauseSeconds"
  | "seriesCount"
  | "recoverySeconds"
  | "totalDuration";

type SectionKey = "description" | "bodyZones" | "executionMode";

/**
 * Activité valide ⇔ Nom + cible du mode (Durée / Répétitions) valides. Le
 * mode « À l'échec » (T01-S10, D-111) n'a AUCUNE cible : le seul Nom suffit.
 * Description et Zone corporelle restent entièrement facultatives.
 *
 * T02-S02 (D-137) : l'écran n'a plus deux étapes — cette fonction, qui
 * gardait l'accès à l'étape 2 (`isStep1Valid`), garde désormais directement
 * l'action `Terminer`. La Récupération n'entre pas dans cette validité :
 * `0 s` est une valeur légitime (borne basse `RECOVERY_SECONDS_MIN`).
 */
function isActivityValid(exercise: SessionDraftExercise): boolean {
  if (!validateExerciseName(exercise.name).ok) {
    return false;
  }
  if (exercise.executionMode === "TO_FAILURE") {
    return true;
  }
  if (exercise.executionMode === "DURATION") {
    return (
      exercise.durationSeconds !== null &&
      validateExerciseDurationSeconds(exercise.durationSeconds).ok
    );
  }
  return exercise.repetitionCount !== null && validateRepetitionCount(exercise.repetitionCount).ok;
}

/** Facteurs `A`/`B`/`R` de la formule canonique `D = C × A + (C − 1) × B + R` (RM-129). */
function totalDurationFacts(exercise: SessionDraftExercise): TotalDurationFacts {
  return {
    // Modes `Répétitions`/« À l'échec » : `A` est INDÉTERMINÉ, donc `0` — la
    // durée obtenue est alors la borne inférieure (RM-132), jamais une durée
    // conventionnelle inventée pour l'Exercice.
    durationSeconds: exercise.executionMode === "DURATION" ? (exercise.durationSeconds ?? 0) : 0,
    pauseSeconds: exercise.pauseSeconds,
    recoverySeconds: exercise.recoverySeconds,
  };
}

/**
 * Écran unifié `Ajouter / Modifier une activité` (T02-S02, D-137, CE-T01-13).
 *
 * **Ce que cette tranche change** — l'écran était en DEUX étapes internes
 * (`step === 1` paramètres essentiels, `step === 2` « Informations
 * complémentaires » : Consigne + Zones corporelles, atteinte par un bouton
 * `Valider`). Il devient UN SEUL écran : la Description de l'activité et la
 * Zone corporelle d'exécution deviennent deux SECTIONS REPLIABLES (fermées
 * par défaut), le Mode d'exécution une troisième (déployée par défaut), et
 * l'unique action finale est `Terminer`. Le segment `Type d'activité`
 * (`Exercice / Récupération`) et le titre `Paramètres de l'activité` sont
 * supprimés : la Récupération n'est plus un type d'Activité mais un
 * PARAMÈTRE attaché (`recoverySeconds`), rendu dans la même rangée compacte.
 *
 * **Ce qui est conservé à l'identique** (Conservation des acquis) : le Shell
 * partagé (`ScreenShell`/`FixedHeader`/`HeaderSeparator`), la zone bleue
 * contextuelle (`Nom de l'activité` puis `+ Ajouter un média` désactivé), la
 * rangée `Activity / Parameter Row — Source exact`, le cadre récapitulatif
 * ancré en bas, les primitives natives de roulette
 * (`DurationWheelPicker`/`NumberWheelPicker`, aucune ligne modifiée), le
 * `WheelPickerOverlay` transversal, la copie de travail locale isolée du
 * `SessionDraft` partagé, la garde de sortie et son verrou d'idempotence à
 * deux niveaux (`finishingRef` synchrone + `isFinishing` React).
 *
 * **Pilotage `Séries` ↔ `Durée totale`** (RM-129/RM-130, DM-015/DM-016) : la
 * `Durée totale` est DÉRIVÉE, jamais persistée. La modifier applique le
 * calcul inverse `Cth = (D − R + B) / (A + B)` (arrondi `.5` vers le haut,
 * bornes `[1, 99]`) et n'écrit QUE `seriesCount` ; si la durée atteignable
 * diffère de la cible, `adjustmentMessage` l'annonce explicitement plutôt
 * que de corriger silencieusement.
 *
 * **Unicité des noms accessibles** : le titre d'une section repliable
 * (`sections.description` = « Description de l'activité ») est identique au
 * libellé du champ qu'elle contient (`instruction.label`) — c'est le même
 * élément fonctionnel. L'en-tête pressable ne porte donc PAS le titre nu
 * comme nom accessible : il compose `Déployer/Replier la section {titre}`
 * (`CollapsibleSection` ci-dessous), et le chevron `DisclosureControl`
 * imbriqué est rendu `decorative` (retiré de l'arbre d'accessibilité, geste
 * conservé). Le champ reste ainsi le SEUL nœud nommé « Description de
 * l'activité », sans dégrader son propre libellé.
 */
export function ExerciseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft } = useSessionDraft();
  const params = useLocalSearchParams<{ exerciseId?: string }>();

  // `existingExercise` : l'Activité réellement ciblée par `exerciseId`, si
  // ce paramètre est présent ET correspond effectivement à un élément de
  // `draft.exercises` — sinon `null`, traité comme une création (jamais un
  // écran d'erreur silencieux : un identifiant obsolète ou absent retombe
  // proprement sur le parcours d'ajout).
  const requestedExerciseId = params.exerciseId;
  const existingExercise =
    typeof requestedExerciseId === "string"
      ? (draft.exercises.find((exercise) => exercise.id === requestedExerciseId) ?? null)
      : null;
  const isEditingExisting = existingExercise !== null;

  const [initialSnapshot] = useState<SessionDraftExercise>(
    () => existingExercise ?? createExerciseDraft(Crypto.randomUUID()),
  );
  const [local, setLocal] = useState<SessionDraftExercise>(initialSnapshot);
  const [isFinishing, setIsFinishing] = useState(false);
  const finishingRef = useRef(false);
  const [openOverlay, setOpenOverlay] = useState<OverlayKind | null>(null);
  // CE-T01-15 : Description et Zone corporelle FERMÉES par défaut, Mode
  // d'exécution DÉPLOYÉ par défaut.
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    description: false,
    bodyZones: false,
    executionMode: true,
  });
  // Message d'ajustement de la Durée totale — non persisté, effacé dès que
  // n'importe quel autre paramètre change (il ne décrirait alors plus la
  // valeur affichée).
  const [adjustmentMessage, setAdjustmentMessage] = useState<string | null>(null);

  const shouldBlockExit = !isFinishing && !exerciseEquals(local, initialSnapshot);
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(
    shouldBlockExit,
    // La copie de travail locale n'est jamais partagée avant `Terminer` :
    // un abandon n'a donc rien à réinitialiser dans le `SessionDraft`
    // partagé (`draft.exercises` reste tel quel) — ce composant est de
    // toute façon démonté juste après le rejeu de la navigation
    // interceptée.
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

  function toggleSection(key: SectionKey) {
    Keyboard.dismiss();
    closeOverlay();
    setExpandedSections((current) => ({ ...current, [key]: !current[key] }));
  }

  function patchLocal(patch: Partial<SessionDraftExercise>) {
    setAdjustmentMessage(null);
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
    } else if (mode === "REPETITIONS") {
      patchLocal({
        executionMode: "REPETITIONS",
        repetitionCount: local.repetitionCount ?? DEFAULT_REPETITION_COUNT,
        durationSeconds: null,
      });
    } else {
      // « À l'échec » (T01-S10, D-111) : aucune cible de durée ni de
      // répétitions ; Séries, Pause et Récupération sont conservées telles
      // quelles.
      patchLocal({
        executionMode: "TO_FAILURE",
        durationSeconds: null,
        repetitionCount: null,
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

  /**
   * Confirmation d'une `Durée totale` CIBLE : n'écrit jamais la durée
   * elle-même (DM-015/DM-016) — elle pilote `seriesCount` par le calcul
   * inverse, puis la durée réellement atteignable est recalculée par la
   * formule directe. `setAdjustmentMessage` est positionné APRÈS
   * `patchLocal` (qui l'efface systématiquement), l'ordre étant significatif.
   */
  function handleTotalDurationConfirmed(targetTotalSeconds: number) {
    const adjusted = applyTargetTotalDuration(targetTotalSeconds, totalDurationFacts(local));
    patchLocal({ seriesCount: adjusted.seriesCount });
    closeOverlay();
    if (adjusted.wasAdjusted) {
      setAdjustmentMessage(
        strings.screens.exercise.adjustedTotalDurationMessage.replace(
          "{duration}",
          formatCompactDuration(adjusted.totalDurationSeconds),
        ),
      );
    }
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
    // Remplace l'élément existant par `id` (parcours modification) ou ajoute
    // `local` en fin de collection (parcours ajout) — jamais un remplacement
    // complet de `draft.exercises`, pour ne jamais perdre les autres
    // Activités déjà présentes.
    const alreadyPresent = draft.exercises.some((exercise) => exercise.id === local.id);
    const nextExercises = alreadyPresent
      ? draft.exercises.map((exercise) => (exercise.id === local.id ? local : exercise))
      : [...draft.exercises, local];
    updateDraft({ exercises: nextExercises });
    setIsFinishing(true);
  }

  const activityValid = isActivityValid(local);
  const t = strings.screens.exercise;

  const recapFacts = {
    name: local.name,
    executionMode: local.executionMode,
    durationSeconds: local.durationSeconds,
    repetitionCount: local.repetitionCount,
    seriesCount: local.seriesCount,
    pauseSeconds: local.pauseSeconds,
    recoverySeconds: local.recoverySeconds,
  };
  const totalDurationSeconds = computeTotalDurationSeconds(
    local.seriesCount,
    totalDurationFacts(local),
  );

  return (
    <ScreenShell>
      <FixedHeader
        title={isEditingExisting ? t.titleEdit : t.titleAdd}
        onBack={() => router.back()}
        backAccessibilityLabel={t.backAccessibilityLabel}
      />
      <HeaderSeparator />

      {/*
       * Zone bleue contextuelle (D-105 ; T01-S10, doc13 §8) : accolée sans
       * espace au séparateur de l'en-tête, fixe (frère du `ScrollView`,
       * jamais son descendant). Commence par le champ `Nom de l'activité`,
       * suivi de `+ Ajouter un média` (visible mais désactivé, Médias V2
       * hors périmètre). T02-S02 : elle n'est plus conditionnée par l'étape
       * — l'écran n'en a plus qu'une — donc TOUJOURS visible.
       */}
      <View style={styles.contextBand} testID="exercise-context-band">
        <TextInput
          value={local.name}
          onChangeText={(text) => patchLocal({ name: text })}
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
        {/*
         * Section 1 — Description de l'activité (fermée par défaut).
         * Remplace l'ancienne étape 2 : le champ multiligne est identique
         * (mêmes `INSTRUCTION_MAX_LENGTH`, `multiline`, `accessibilityLabel`),
         * seul son conteneur change.
         */}
        <CollapsibleSection
          testID="exercise-section-description"
          title={t.sections.description}
          expanded={expandedSections.description}
          onToggle={() => toggleSection("description")}
        >
          <TextInput
            value={local.instruction ?? ""}
            onChangeText={(text) => patchLocal({ instruction: text.length > 0 ? text : null })}
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

        {/* Section 2 — Zone corporelle d'exécution (fermée par défaut). */}
        <CollapsibleSection
          testID="exercise-section-body-zones"
          title={t.sections.bodyZones}
          expanded={expandedSections.bodyZones}
          onToggle={() => toggleSection("bodyZones")}
        >
          <BodyZoneSelector
            zones={BODY_ZONES}
            selectedIds={local.bodyZoneIds}
            onToggle={toggleBodyZone}
            accessibilityLabel={t.bodyZones.accessibilityLabel}
          />
        </CollapsibleSection>

        {/* Section 3 — Mode d'exécution (DÉPLOYÉE par défaut). */}
        <CollapsibleSection
          testID="exercise-section-execution-mode"
          title={t.sections.executionMode}
          expanded={expandedSections.executionMode}
          onToggle={() => toggleSection("executionMode")}
        >
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
            <SegmentButton
              label={t.executionMode.toFailure}
              selected={local.executionMode === "TO_FAILURE"}
              onPress={() => handleExecutionModeChange("TO_FAILURE")}
            />
          </View>
        </CollapsibleSection>

        {/*
         * Paramètres — `Activity / Parameter Row — Source exact`, désormais
         * sur DEUX rangées (CE-T01-13/CE-T01-14) et sans titre
         * `Paramètres de l'activité` (supprimé, D-137) :
         * - rangée 1 : `Séries`, puis le paramètre du mode
         *   (`Durée`/`Répétitions`/badge « À l'échec »), puis `Pause` ;
         * - rangée 2 : `Récupération` (attachée, T02-S02), puis
         *   `Durée totale` (dérivée et PILOTE, jamais persistée).
         */}
        <View style={styles.parameterCard} testID="exercise-parameter-card">
          <View style={styles.parameterRow} testID="exercise-parameter-row">
            <ParameterField
              testID="exercise-field-seriesCount"
              width={dimensions.exerciseParameterRow.narrowColumnWidth}
              label={t.seriesCount.compactLabel}
              accessibilityLabel={t.seriesCount.accessibilityLabel}
              value={String(local.seriesCount)}
              isOpen={openOverlay === "seriesCount"}
              onPress={() => toggleOverlay("seriesCount")}
            />
            {local.executionMode === "DURATION" ? (
              <ParameterField
                testID="exercise-field-duration"
                width={dimensions.exerciseParameterRow.wideColumnWidth}
                label={t.duration.label}
                accessibilityLabel={t.duration.accessibilityLabel}
                value={formatDurationRowValue(
                  local.durationSeconds ?? 0,
                  WHEEL_EXERCISE_DURATION_SECONDS_MAX,
                )}
                isOpen={openOverlay === "duration"}
                onPress={() => toggleOverlay("duration")}
              />
            ) : null}
            {local.executionMode === "REPETITIONS" ? (
              <ParameterField
                testID="exercise-field-repetitionCount"
                width={dimensions.exerciseParameterRow.wideColumnWidth}
                label={t.repetitionCount.compactLabel}
                accessibilityLabel={t.repetitionCount.accessibilityLabel}
                value={String(local.repetitionCount ?? DEFAULT_REPETITION_COUNT)}
                isOpen={openOverlay === "repetitionCount"}
                onPress={() => toggleOverlay("repetitionCount")}
              />
            ) : null}
            {local.executionMode === "TO_FAILURE" ? (
              <ToFailureField
                testID="exercise-field-toFailure"
                width={dimensions.exerciseParameterRow.wideColumnWidth}
                value={t.executionMode.toFailure}
              />
            ) : null}
            <ParameterField
              testID="exercise-field-pauseSeconds"
              width={dimensions.exerciseParameterRow.wideColumnWidth}
              label={t.pauseSeconds.compactLabel}
              accessibilityLabel={t.pauseSeconds.accessibilityLabel}
              value={formatDurationRowValue(local.pauseSeconds, WHEEL_PAUSE_SECONDS_MAX)}
              isOpen={openOverlay === "pauseSeconds"}
              onPress={() => toggleOverlay("pauseSeconds")}
            />
          </View>

          <View style={styles.parameterRow} testID="exercise-parameter-row-secondary">
            <ParameterField
              testID="exercise-field-recoverySeconds"
              width={dimensions.exerciseParameterRow.wideColumnWidth}
              label={t.recoverySeconds.compactLabel}
              accessibilityLabel={t.recoverySeconds.accessibilityLabel}
              value={formatDurationRowValue(local.recoverySeconds, WHEEL_RECOVERY_SECONDS_MAX)}
              isOpen={openOverlay === "recoverySeconds"}
              onPress={() => toggleOverlay("recoverySeconds")}
            />
            <ParameterField
              testID="exercise-field-totalDuration"
              width={dimensions.exerciseParameterRow.wideColumnWidth}
              label={t.totalDuration.compactLabel}
              accessibilityLabel={t.totalDuration.accessibilityLabel}
              // La durée CALCULÉE peut légitimement dépasser la borne de la
              // roulette (jusqu'à 99 Séries de 99 min 59 s) : elle est
              // AFFICHÉE intégralement, la borne ne s'appliquant qu'à la
              // valeur saisissable — limite disclosée dans
              // `wheelPickerMath.ts`.
              value={formatDurationRowValue(
                totalDurationSeconds,
                Math.max(WHEEL_TOTAL_DURATION_SECONDS_MAX, totalDurationSeconds),
              )}
              isOpen={openOverlay === "totalDuration"}
              onPress={() => toggleOverlay("totalDuration")}
            />
          </View>
        </View>

        {/*
         * Message d'ajustement (RM-130) — rendu uniquement lorsque la Durée
         * totale confirmée n'était pas atteignable exactement avec un nombre
         * entier de Séries dans `[1, 99]`.
         */}
        {adjustmentMessage !== null ? (
          <Text style={styles.adjustmentMessage} testID="exercise-adjustment-message">
            {adjustmentMessage}
          </Text>
        ) : null}

        {/*
         * Espace flexible (`3261:4156`/`3261:4165`) : pousse la synthèse au
         * bas du contenu défilant lorsque celui-ci tient dans la hauteur
         * visible (`bodyContent.flexGrow: 1`) ; s'efface silencieusement dès
         * que le contenu la dépasse — le défilement normal reprend alors.
         */}
        <View style={styles.recapSpacer} />

        {/*
         * Synthèse FIXE (jamais repliable, CE-T01-13) : phrase récapitulative
         * calculée, puis ligne de durée `Durée totale : {D}` (mode Durée) ou
         * `Durée minimale : ≥ {D}` (modes non chronométrés, RM-132).
         */}
        <View style={styles.summaryCard} testID="exercise-summary-card">
          <Text style={styles.summaryText}>{formatExerciseRecap(recapFacts)}</Text>
          <Text style={styles.summaryDurationText} testID="exercise-summary-duration">
            {formatExerciseDurationLine(recapFacts)}
          </Text>
        </View>
      </ScrollView>

      {/*
       * Action finale unique (D-137) : `Terminer`. L'ancien `Valider`, qui
       * ne faisait que passer à l'étape 2, n'a plus d'objet — l'écran unifié
       * n'a plus d'étape intermédiaire.
       */}
      <Pressable
        disabled={!activityValid}
        onPress={handleTerminer}
        accessibilityRole="button"
        accessibilityState={{ disabled: !activityValid }}
        accessibilityLabel={t.finishAction}
        style={[
          styles.primaryAction,
          { marginBottom: insets.bottom + spacing[16] },
          !activityValid ? styles.primaryActionDisabled : null,
        ]}
      >
        <Text style={styles.primaryActionLabel}>{t.finishAction}</Text>
      </Pressable>

      {/*
       * Superposition plein écran TRANSVERSALE partagée par les six
       * sélecteurs (T01-S09, correction VISUAL point D) — frère direct de
       * `ScreenShell`, jamais un descendant du `ScrollView`. Un seul
       * sélecteur peut être ouvert à la fois (`OverlayKind`).
       */}
      <WheelPickerOverlay visible={openOverlay !== null}>
        {openOverlay === "duration" ? (
          <DurationWheelPicker
            totalSeconds={local.durationSeconds ?? DEFAULT_EXERCISE_DURATION_SECONDS}
            onValidate={(totalSeconds) => {
              patchLocal({ durationSeconds: totalSeconds });
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
            value={local.repetitionCount ?? DEFAULT_REPETITION_COUNT}
            onValidate={(value) => {
              patchLocal({ repetitionCount: value });
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
            totalSeconds={local.pauseSeconds}
            onValidate={(totalSeconds) => {
              patchLocal({ pauseSeconds: totalSeconds });
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
            value={local.seriesCount}
            onValidate={(value) => {
              patchLocal({ seriesCount: value });
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
            totalSeconds={local.recoverySeconds}
            onValidate={(totalSeconds) => {
              patchLocal({ recoverySeconds: totalSeconds });
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
        {openOverlay === "totalDuration" ? (
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

      {isPendingExit ? (
        <ExerciseExitConfirmModal onCancel={cancelExit} onConfirm={confirmExit} />
      ) : null}
    </ScreenShell>
  );
}

/**
 * Section repliable de l'écran Activité (CE-T01-13/CE-T01-15) : en-tête
 * pressable (titre + chevron DSF) au-dessus d'un contenu rendu uniquement
 * lorsqu'il est déployé.
 *
 * **Nom accessible composé — verrou d'unicité.** L'en-tête ne porte JAMAIS
 * le titre nu : `sections.description` vaut exactement `instruction.label`,
 * et le champ multiligne qu'elle contient porte déjà ce libellé, qui est le
 * sien. Deux nœuds nommés à l'identique rendraient toute requête
 * d'accessibilité ambiguë. L'en-tête compose donc
 * `« Déployer la section {titre} »` / `« Replier la section {titre} »` —
 * l'action ET sa cible, ce qui est aussi plus informatif pour un lecteur
 * d'écran que le titre seul. Le `DisclosureControl` imbriqué est rendu
 * `decorative` (aucun rôle, aucun état, aucun libellé propre) mais conserve
 * son `onPress` : il reste tapable, sans dupliquer une troisième fois le nom
 * de l'en-tête qui le contient.
 *
 * Le chevron reste le contrôle canonique `Controls / Disclosure — Source
 * exact` (`DisclosureControl`), jamais une copie graphique locale.
 */
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

/**
 * `Activity / Parameter Row — Source exact` — une colonne (`Champ —
 * Durée`/`Pause`/`Séries`/`Répétitions`/`Récupération`/`Durée totale`) :
 * libellé court au-dessus (`type.parameterColumnLabel`), contrôle `Forms /
 * Select Field — Source exact` en dessous (fond blanc, liseré
 * `colors.exerciseParameterControlBorder`, rayon `10`, hauteur `42`) —
 * valeur alignée à gauche, carré chevron `28×28` (`colors.tourSurface`,
 * `#CDCEFA`, rayon `6`) aligné à droite, chevron blanc `14×14`
 * (`select-field-chevron`).
 */
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

/**
 * Badge statique du mode « À l'échec » (correctif T02, 2026-09-08, point
 * 4) — occupe exactement l'emplacement du contrôle `Durée`/`Répétitions`
 * dans `Activity / Parameter Row`, mais sans chevron ni action : ce mode ne
 * porte aucune cible chiffrée à ouvrir (D-111), rien n'y est sélectionnable.
 */
function ToFailureField({
  testID,
  width,
  value,
}: {
  testID: string;
  width: number;
  value: string;
}) {
  return (
    <View style={{ width, gap: dimensions.exerciseParameterRow.labelGap }} testID={testID}>
      <View
        style={[styles.parameterControl, styles.parameterControlStatic, { width }]}
        accessibilityRole="text"
        accessibilityLabel={value}
        testID={`${testID}-control`}
      >
        <Text style={styles.parameterValueToFailure} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

/**
 * `Controls / Segmented` (`2586:2759`), traduction canonique vérifiée
 * directement sur les nœuds Figma actuels (`1992:9150`) — REWORK09,
 * point 4.
 */
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
  // R4-13/S-01…S-09 (même contrat que `CompositionScreen.tsx`) : `body`
  // est le `ScrollView` lui-même (style du conteneur défilant, sans
  // padding propre) — le padding/l'écart entre champs vivent dans
  // `bodyContent` (`contentContainerStyle`). Header/séparateur/action
  // finale restent hors de ce `ScrollView`, jamais recouverts.
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
  // T02-S02 : en-tête de section repliable — titre à gauche, chevron DSF à
  // droite, hauteur de cible tactile portée par `DisclosureControl`
  // lui-même (`minTouchTarget`), aucune hauteur locale improvisée.
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  // Même typographie que l'ancien `fieldTitle` des titres de champ
  // (`type.sectionTitle`), sans sa marge basse : l'espacement vertical est
  // désormais assuré par `sectionContent` lorsque la section est déployée,
  // et doit être NUL lorsqu'elle est repliée.
  sectionTitle: {
    ...type.sectionTitle,
    color: colors.textPrimary,
  },
  sectionContent: {
    marginTop: spacing[12],
  },
  // D-105 (`3261:4151`) : « Zone bleue — Contexte séance et nom de
  // l'activité » — fixe, sous l'en-tête, accolée sans espace au séparateur.
  // Hauteur DSF fixe de 115 pt (`dimensions.contextBand`, partagé avec
  // Catalogue et Composition) ; `Nom de l'activité` puis `+ Ajouter un
  // média` distribués par `justifyContent: "space-between"`.
  contextBand: {
    backgroundColor: colors.exerciseContextBandBackground,
    paddingHorizontal: spacing[24],
    height: dimensions.contextBand.height,
    paddingTop: dimensions.contextBand.paddingTop,
    paddingBottom: dimensions.contextBand.paddingBottom,
    justifyContent: "space-between",
  },
  // REWORK13 (R13-01) : `type.screenTitle` (`20/24` Semi Bold), géométrie
  // `dimensions.exerciseTextField` (46/8/14), fond transparent, liseré blanc
  // `colors.sessionNameBorder` — strictement préservés.
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
  // REWORK09, point 4 : conteneur `354×42`, fond blanc, liseré
  // `colors.border`, padding `4`, écart entre segments `14`, rayon `12`.
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
  // REWORK09, point 6/7 : `Activity / Parameter Row — Source exact` —
  // cadre compact englobant (`354` large, padding `8`, rayon `16`, fond
  // `colors.exerciseParameterCardBackground`). T02-S02 : `gap` ajouté pour
  // séparer les DEUX rangées, même valeur que l'écart de colonnes déjà
  // canonique (`columnGap`) — aucune valeur nouvelle introduite.
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
  // `Forms / Select Field — Source exact` (`2537:1095`) : fond blanc,
  // liseré dédié, rayon `10`, hauteur `42`, padding gauche `12`/droite `4`.
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
  },
  parameterValueToFailure: {
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
  // T02-S02 (RM-130) : message d'ajustement de la Durée totale — texte
  // simple sous le cadre de paramètres, teinté `colors.selection` (seul
  // token « violet » canonique du Design System), jamais un bandeau
  // d'erreur : l'ajustement est un comportement normal, pas un défaut.
  adjustmentMessage: {
    ...type.body,
    color: colors.selection,
  },
  recapSpacer: {
    flex: 1,
  },
  // T01-S10 (doc13 §8) : `+ Ajouter un média` — bouton centré, désactivé
  // (Médias V2 hors périmètre), rendu dans la zone bleue sous le Nom.
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
  addMediaLabel: {
    ...type.button,
    color: colors.textSecondary,
  },
  // Point 8 (REWORK09) : largeur utile complète, liseré `colors.tourSurface`
  // (`#CDCEFA`), rayon `12`, marges internes `12`/`8`. Aucune hauteur figée :
  // le cadre grandit avec le texte. T02-S02 : il porte désormais DEUX lignes
  // (phrase récapitulative + ligne de durée), séparées par le même écart que
  // les marges verticales du cadre.
  summaryCard: {
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
  summaryDurationText: {
    ...type.label,
    color: colors.textPrimary,
  },
  primaryAction: {
    marginHorizontal: spacing[24],
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
