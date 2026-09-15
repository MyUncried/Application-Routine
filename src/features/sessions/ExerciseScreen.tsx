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
import { appendActivityAfterLastDisplayed } from "@/domain/sessions/composition";
import {
  DEFAULT_EXERCISE_DURATION_SECONDS,
  DEFAULT_REPETITION_COUNT,
  DEFAULT_TOUR_SIDE_MODE,
} from "@/domain/sessions/defaults";
import {
  createExerciseDraft,
  exerciseEquals,
  type SessionDraftExercise,
  type SessionDraftExerciseExecutionMode,
} from "@/domain/sessions/SessionDraft";
import { sideMultiplier } from "@/domain/sessions/sideMode";
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
import { SideModeControl } from "@/features/sessions/SideModeControl";
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
import { TransientNotification } from "@/shared/ui/TransientNotification";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

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

/** Facteurs `A`/`B`/`R` de la formule canonique conditionnelle (`calculations.ts`). */
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
 * calcul inverse conditionnel de `calculations.ts` (arrondi `.5` vers le
 * haut, bornes `[1, 99]`) et n'écrit QUE `seriesCount` ; si la durée
 * atteignable diffère de la cible, une NOTIFICATION TEMPORAIRE l'annonce et
 * propose `Annuler`, plutôt que de corriger silencieusement.
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
  /**
   * Ajustement de la `Durée totale` à un nombre entier de Séries (D-136) —
   * non persisté, effacé dès que n'importe quel autre paramètre change (il
   * ne décrirait alors plus la valeur affichée), automatiquement après son
   * délai, ou immédiatement par son action `Annuler`.
   *
   * `previousSeriesCount` mémorise la valeur qui précédait l'ajustement :
   * c'est ce que `Annuler` restitue. Sans elle, l'action serait un simple
   * bouton de fermeture — la notification canonique exige une action de
   * CORRECTION (RM-010).
   */
  const [adjustment, setAdjustment] = useState<{
    readonly message: string;
    readonly previousSeriesCount: number;
  } | null>(null);

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
    setAdjustment(null);
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
   * formule directe. `setAdjustment` est positionné APRÈS `patchLocal` (qui
   * l'efface systématiquement), l'ordre étant significatif.
   */
  function handleTotalDurationConfirmed(targetTotalSeconds: number) {
    const previousSeriesCount = local.seriesCount;
    const adjusted = applyTargetTotalDuration(
      targetTotalSeconds,
      totalDurationFacts(local),
      sideMultiplier(local.sideMode),
    );
    patchLocal({ seriesCount: adjusted.seriesCount });
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

  /**
   * `Annuler` de la notification temporaire : restitue le nombre de Séries
   * qui précédait l'ajustement. `setLocal` est appelé DIRECTEMENT plutôt que
   * `patchLocal` — ce dernier efface l'ajustement, ce qui est bien le but,
   * mais l'ordre inverse laisserait un instant un message décrivant une
   * valeur déjà annulée.
   */
  function handleUndoAdjustment() {
    const restored = adjustment?.previousSeriesCount;
    setAdjustment(null);
    if (restored !== undefined) {
      setLocal((current) => ({ ...current, seriesCount: restored }));
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
    // `local` APRÈS la dernière carte ACTUELLEMENT AFFICHÉE, dont il reprend
    // la zone (parcours ajout, `appendActivityAfterLastDisplayed`) — jamais un
    // remplacement complet de `draft.exercises`, pour ne jamais perdre les
    // autres Activités déjà présentes.
    //
    // `draft.exercises` est relu ICI, à l'instant exact où l'utilisateur
    // termine sa création : ni la position, ni la zone observées à l'OUVERTURE
    // de l'écran ne sont utilisées. La zone que `createExerciseDraft` a figée
    // dans `local` au montage n'est donc jamais consultée pour ce placement.
    const alreadyPresent = draft.exercises.some((exercise) => exercise.id === local.id);
    const nextExercises = alreadyPresent
      ? draft.exercises.map((exercise) => (exercise.id === local.id ? local : exercise))
      : appendActivityAfterLastDisplayed(draft.exercises, local);
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
    sideMode: local.sideMode,
  };
  const totalDurationSeconds = computeTotalDurationSeconds(
    local.seriesCount,
    totalDurationFacts(local),
    sideMultiplier(local.sideMode),
  );
  const formattedTotalDuration = formatDurationRowValue(
    totalDurationSeconds,
    Math.max(WHEEL_TOTAL_DURATION_SECONDS_MAX, totalDurationSeconds),
  );
  /**
   * La `Durée totale` ne PILOTE le nombre de Séries qu'en mode `Durée`
   * (T02-S02, seconde recette, point 9) : ailleurs, `A` — la durée d'une
   * Série — est inconnue, le calcul inverse n'a pas de sens et le champ
   * devient purement informatif. Un seul prédicat gouverne à la fois le
   * composant rendu ET l'existence de la roulette associée : les deux ne
   * peuvent donc pas diverger.
   */
  const isTotalDurationDriveable = local.executionMode === "DURATION";

  /**
   * V2-BILAT-01 (plan `## UI`) : le contrôle `Côté` est désactivé — la
   * direction propre de l'Activité devient sans effet — pour une Activité
   * `IN_TOUR` gouvernée par un Tour déjà bilatéral. Le nom accessible
   * complet APPEND alors exactement le suffixe publié par le plan, jamais
   * une reformulation locale.
   */
  const sideModeStrings = strings.shared.sideMode;
  const isSideModeInherited =
    local.structuralPosition === "IN_TOUR" &&
    (draft.tourSideMode ?? DEFAULT_TOUR_SIDE_MODE) !== "UNILATERAL";
  const sideModeAccessibilityLabel = isSideModeInherited
    ? `${sideModeStrings.activity.accessibilityLabels[local.sideMode]} — ${sideModeStrings.activity.inheritedAccessibilitySuffix}`
    : sideModeStrings.activity.accessibilityLabels[local.sideMode];

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

        {/*
         * Section 3 — Mode d'exécution (DÉPLOYÉE par défaut).
         *
         * **T02-S02 (continuation après recette visuelle)** : le cadre de
         * paramètres est désormais un ENFANT de cette section. Son chevron
         * replie donc d'un seul geste le contrôle segmenté ET l'intégralité
         * des paramètres qui en dépendent — les deux formaient déjà un bloc
         * fonctionnel unique (le mode choisi détermine quel paramètre la
         * première rangée affiche), mais le chevron ne repliait que le
         * segment, laissant les paramètres orphelins à l'écran.
         */}
        <CollapsibleSection
          testID="exercise-section-execution-mode"
          title={t.sections.executionMode}
          expanded={expandedSections.executionMode}
          onToggle={() => toggleSection("executionMode")}
        >
          {/*
           * `executionModeGroup` porte l'écart RÉDUIT entre le contrôle
           * segmenté et le cadre de paramètres — auparavant l'écart
           * structurel de `bodyContent` (`24`), disproportionné entre deux
           * éléments d'un même bloc.
           */}
          <View style={styles.executionModeGroup} testID="exercise-execution-mode-group">
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

            {/*
             * Paramètres — `Activity / Parameter Row — Source exact`, sur
             * DEUX rangées (CE-T01-13/CE-T01-14) et sans titre `Paramètres
             * de l'activité` (supprimé, D-137) :
             * - rangée 1 : `Séries`, puis le paramètre du mode
             *   (`Durée`/`Répétitions`/badge « À l'échec »), puis `Pause` ;
             * - rangée 2 : `Côté` sous `Séries` (V2-BILAT-01, plan `## UI` —
             *   « ligne 2, colonne 1, sous Séries »), `Récupération` sous le
             *   paramètre de mode, puis `Durée totale` sous `Pause` —
             *   l'alignement en colonnes est obtenu par la largeur PARTAGÉE
             *   de la colonne `Séries`/`Côté` (`narrowColumnWidth`), jamais
             *   par des largeurs de colonne différentes entre les deux
             *   rangées.
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
                  value={formatDurationRowValue(local.pauseSeconds, WHEEL_PAUSE_SECONDS_MAX)}
                  isOpen={openOverlay === "pauseSeconds"}
                  onPress={() => toggleOverlay("pauseSeconds")}
                />
              </View>

              <View style={styles.parameterRow} testID="exercise-parameter-row-secondary">
                {/*
                 * V2-BILAT-01 (plan `## UI`) : contrôle `Côté`, ligne 2/
                 * colonne 1 — directement SOUS `Séries`, dans les TROIS
                 * modes d'exécution (hors de tout bloc conditionnel de
                 * mode). Remplace l'ancienne cale purement structurelle de
                 * cette colonne — même largeur (`narrowColumnWidth`), la
                 * grille de colonnes reste donc inchangée. Désactivé, et
                 * proprement `UNILATERAL`, pour une Activité `IN_TOUR`
                 * gouvernée par un Tour déjà bilatéral (le brouillon l'y a
                 * déjà remise par `applyTourSideModeTransition` au moment
                 * de l'activation, jamais restaurée) — la direction du Tour
                 * prévaut alors, la direction propre de cette Activité
                 * resterait sans effet si le contrôle l'autorisait ; le nom
                 * accessible l'annonce alors explicitement.
                 */}
                <SideModeControl
                  value={local.sideMode}
                  onChange={(next) => patchLocal({ sideMode: next })}
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
                  value={formatDurationRowValue(local.recoverySeconds, WHEEL_RECOVERY_SECONDS_MAX)}
                  isOpen={openOverlay === "recoverySeconds"}
                  onPress={() => toggleOverlay("recoverySeconds")}
                />
                {/*
                 * **`Durée totale` — pilote en mode Durée, INFORMATIVE
                 * sinon** (T02-S02, seconde recette, point 9).
                 *
                 * En modes `Répétitions` et « À l'échec », la durée d'une
                 * Série est inconnue : le calcul inverse n'a alors aucun
                 * sens et la Durée totale ne peut plus piloter les Séries.
                 * Elle reste néanmoins AFFICHÉE — c'est une information
                 * utile — sous forme d'une BORNE MINIMALE, non modifiable :
                 * libellé `Durée totale ≥`, fond transparent, texte violet,
                 * aucun chevron, aucune ouverture de roulette. Cette règle
                 * remplace la demande antérieure de MASQUER ce champ dans
                 * ces deux modes : masquer privait l'utilisateur d'une
                 * information qu'il peut lire mais pas fixer.
                 *
                 * La durée CALCULÉE peut légitimement dépasser la borne de
                 * la roulette (jusqu'à 99 Séries de 99 min 59 s) : elle est
                 * AFFICHÉE intégralement, la borne ne s'appliquant qu'à la
                 * valeur saisissable — limite disclosée dans
                 * `wheelPickerMath.ts`.
                 */}
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
      </ScrollView>

      {/*
       * **Synthèse FIXE et NON DÉFILANTE** (CE-T01-13 : « La synthèse est
       * immuable : le déploiement d'une section fait défiler le contenu sans
       * déplacer sa zone ni l'action finale `Terminer` »).
       *
       * T02-S02 (continuation) : elle était jusqu'ici le DERNIER ENFANT du
       * `ScrollView`, poussé en bas par une cale flexible — donc défilante
       * dès que le contenu dépassait la hauteur visible. Elle devient un
       * FRÈRE du corps défilant, entre lui et l'action finale : sa zone ne
       * bouge plus jamais, quel que soit l'état de déploiement des sections.
       * La cale flexible (`recapSpacer`) disparaît avec ce déplacement.
       */}
      <View style={styles.summaryCard} testID="exercise-summary-card">
        <Text style={styles.summaryText}>{formatExerciseRecap(recapFacts)}</Text>
        <Text style={styles.summaryDurationText} testID="exercise-summary-duration">
          {formatExerciseDurationLine(recapFacts)}
        </Text>
      </View>

      {/*
       * Action finale unique (D-137) : `Terminer`. L'ancien `Valider`, qui
       * ne faisait que passer à l'étape 2, n'a plus d'objet — l'écran unifié
       * n'a plus d'étape intermédiaire.
       *
       * **T02-S02 (seconde recette visuelle, points 5 et 6)** — l'action est
       * désormais enveloppée dans un conteneur de POSITIONNEMENT
       * (`finishActionSlot`), qui n'ajoute aucune surface visible et porte
       * deux rôles :
       *
       * 1. sa marge haute (`spacing/16`) crée l'espace vertical VISIBLE
       *    demandé entre le cadre de synthèse et le bouton — les deux se
       *    touchaient jusqu'ici ;
       * 2. il sert de repère de position à la notification temporaire, qui
       *    le recouvre EXACTEMENT (`position: "absolute"`, quatre côtés à
       *    zéro) : la notification est donc centrée verticalement sur le
       *    bouton et le masque le temps de son affichage, sans qu'aucune
       *    coordonnée ne soit calculée ni recopiée.
       */}
      <View
        style={[styles.finishActionSlot, { marginBottom: insets.bottom + spacing[16] }]}
        testID="exercise-finish-action-slot"
      >
        <Pressable
          disabled={!activityValid}
          onPress={handleTerminer}
          accessibilityRole="button"
          accessibilityState={{ disabled: !activityValid }}
          accessibilityLabel={t.finishAction}
          style={[
            styles.primaryAction,
            !activityValid ? styles.primaryActionDisabled : null,
          ]}
        >
          <Text style={styles.primaryActionLabel}>{t.finishAction}</Text>
        </Pressable>

        {/*
         * **Notification noire temporaire** (D-136, RM-010) — remplace le
         * texte permanent inséré dans le corps défilant : elle est
         * superposée (ne déplace aucun contenu), s'efface d'elle-même et
         * porte l'action `Annuler`, qui restitue le nombre de Séries d'avant
         * l'ajustement.
         */}
        <TransientNotification
          message={adjustment?.message ?? null}
          actionLabel={t.adjustedTotalDurationUndoAction}
          onAction={handleUndoAdjustment}
          onDismiss={() => setAdjustment(null)}
          testID="exercise-adjustment-notification"
        />
      </View>

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
        {/*
         * `isTotalDurationDriveable` conditionne AUSSI la roulette, pas
         * seulement le contrôle fermé : « aucune roulette associée » dans
         * les modes non chronométrés (T02-S02, seconde recette, point 9).
         * Le même prédicat gouverne les deux — aucun état d'ouverture
         * résiduel ne peut donc faire réapparaître une roulette qu'aucun
         * contrôle ne sait plus ouvrir.
         */}
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
/**
 * Contenu du libellé de RÉSERVATION d'une colonne sans libellé propre
 * (« À l'échec », `Durée totale` informative). Une espace insécable produit
 * exactement UNE ligne, aux métriques identiques à celles de n'importe quel
 * libellé de colonne réel — la hauteur réservée est donc mesurée par le
 * moteur de texte, jamais présumée. Un `Text` VIDE, lui, peut se réduire à
 * une hauteur nulle.
 */
const LABEL_PLACEHOLDER = " ";

/**
 * Complément vertical portant la cible tactile d'un contrôle de paramètre de
 * `42` (hauteur visible canonique) à `minTouchTarget` (`48`). Dérivé, jamais
 * codé en dur : ajuster l'une des deux valeurs canoniques recalcule le
 * complément.
 */
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
        // T02-S02 (continuation) : le cadre visible reste à sa hauteur
        // canonique `42` (`Forms / Select Field`), mais il OUVRE une
        // roulette — sa cible tactile doit donc atteindre `48`
        // (`size/touch-target-min`), comme toute action du DSF. Même patron
        // que `Action / Back` et que les actions de roulette : `hitSlop`
        // autour de la boîte visuelle, jamais un agrandissement de celle-ci.
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

/**
 * Colonne INFORMATIVE de `Activity / Parameter Row` — même géométrie qu'une
 * `ParameterField`, mais rien n'y est modifiable : aucun `Pressable`, aucun
 * chevron, aucune roulette associée, fond transparent et valeur en violet
 * (`colors.selection`). Deux usages :
 *
 * - le badge du mode « À l'échec » (D-111 : ce mode ne porte aucune cible
 *   chiffrée à ouvrir), rendu SANS libellé ;
 * - la `Durée totale` des modes `Répétitions` et « À l'échec » (T02-S02,
 *   seconde recette, point 9) : elle reste AFFICHÉE — c'est une information
 *   utile, une borne minimale — mais ne peut plus piloter le nombre de
 *   Séries, faute de durée d'Exercice connue. Son libellé porte le `≥` qui
 *   dit exactement cela.
 *
 * **Alignement vertical (seconde recette, point 2)** — la cale de hauteur
 * FIXE posée à la continuation précédente ne suffisait pas : elle présumait
 * qu'un `Text` de style `parameterColumnLabel` occupe exactement sa
 * `lineHeight`, ce que la mesure réelle du moteur de texte ne garantit pas.
 * Toute différence, même d'un point, décale visiblement cette colonne de ses
 * voisines. Une colonne sans libellé rend donc un `Text` RÉEL, du même style
 * et sur une seule ligne : la structure interne devient identique à celle
 * d'une `ParameterField` — même nœud, mêmes métriques de police, même
 * hauteur MESURÉE — et l'alignement est vrai par construction. Ce texte ne
 * porte aucun contenu lisible et est retiré de l'arbre d'accessibilité :
 * c'est une réservation de place, jamais un libellé fantôme.
 */
function StaticParameterField({
  testID,
  width,
  label,
  value,
  accessibilityLabel,
}: {
  testID: string;
  width: number;
  /** `null` : colonne sans libellé — une réservation de place est rendue à sa place. */
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
  // Fond TRANSPARENT (et non blanc) : ce cadre n'est pas un contrôle
  // ouvrable, rien n'y est sélectionnable (D-111) — il ne doit donc pas
  // reprendre la surface blanche des `Forms / Select Field` réellement
  // pressables. Le fond du cadre de paramètres reste visible au travers.
  parameterControlStatic: {
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  // Valeur d'une colonne INFORMATIVE (badge « À l'échec », `Durée totale`
  // des modes non chronométrés) : violet `colors.selection`, seul token
  // « violet » canonique du DSF — jamais la couleur d'une valeur
  // modifiable, précisément pour que la différence se voie.
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
  // T02-S02 (continuation) : écart RÉDUIT entre le contrôle segmenté et le
  // cadre de paramètres, qui appartiennent au même bloc fonctionnel — ils
  // héritaient jusqu'ici de l'écart STRUCTUREL de `bodyContent` (`24`),
  // destiné à séparer des sections entières. `spacing/8` est le même token
  // que l'écart interne du cadre de paramètres (`columnGap`) : aucune valeur
  // nouvelle n'est introduite.
  executionModeGroup: {
    gap: spacing[8],
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
  //
  // T02-S02 (continuation) : la synthèse étant sortie du `ScrollView`, elle
  // porte désormais elle-même ses marges horizontales — auparavant héritées
  // du `paddingHorizontal` de `bodyContent`. Sa marge haute la sépare du
  // corps défilant, sans quoi le dernier élément défilant viendrait la
  // toucher.
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
  summaryDurationText: {
    ...type.label,
    color: colors.textPrimary,
  },
  //
  // T02-S02 (seconde recette visuelle, points 5 et 6) : conteneur de
  // POSITIONNEMENT de l'action finale — aucune surface visible propre.
  //
  // - `marginTop` crée l'espace vertical VISIBLE entre le cadre de synthèse
  //   et le bouton, qui se touchaient jusqu'ici ;
  // - `position: "relative"` en fait le repère de la notification temporaire
  //   qu'il héberge, laquelle le recouvre exactement — donc recouvre le
  //   bouton, centrée verticalement sur lui ;
  // - les marges horizontale et basse, jusqu'ici portées par le bouton,
  //   REMONTENT ici sans changer de valeur : la géométrie du bouton est
  //   rigoureusement conservée, seul son porteur de marges change.
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
});
