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
import { formatDurationRowValue, formatExerciseRecap } from "@/features/sessions/compositionPresentation";
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
import { FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

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
 * §06 Écran 4 ; CE-T01-13). Type verrouillé `Exercice` — le type
 * `Récupération` (et son propre écran) reste hors périmètre de tout T01.
 *
 * **REWORK09 — reconstruction depuis le Shell/composants DS** (mission
 * directe utilisateur, 2026-09-04, `G-01` à `G-08`) : cet écran utilise
 * désormais le Shell partagé (`ScreenShell`/`FixedHeader`/`HeaderSeparator`,
 * déjà validé par `CompositionScreen.tsx`) au lieu d'un en-tête local
 * dupliqué, et une structure de formulaire entièrement reconstruite pour
 * suivre l'ordre canonique vérifié directement sur les nœuds Figma actuels
 * (`1992:9132`/`1992:9212`/`1992:9430`, page `Prototype MVP`) : `Nom de
 * l'activité` → `Type d'activité` (segment `Exercice/Récupération`) →
 * `Mode d'exécution` (segment `Durée/Répétition`) → `Paramètres de
 * l'activité` (rangée compacte `Durée ou Répétitions`/`Pause`/`Séries` +
 * récapitulatif calculé). L'ancien grand titre local (`titleAdd`/
 * `titleEdit`) est supprimé — l'en-tête fixe affiche désormais le nom réel
 * de la Séance, seul titre de cet écran (même patron que
 * `CompositionScreen.tsx`).
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
 *
 * **Roulette de durée — verrou de non-régression (REWORK09)** : aucune
 * ligne de `DurationWheelPicker.tsx` n'est modifiée par cette mission — sa
 * primitive native, son contrat `onValidate`/`onCancel` (brouillon local
 * jusqu'à validation) et son comportement documenté restent strictement
 * intacts. Seul son ANCRAGE change : un unique `PopoverAnchor`, commun aux
 * quatre sélecteurs de la rangée compacte (`duration`/`repetitionCount`/
 * `pauseSeconds`/`seriesCount`), plutôt qu'un `AnchoredRow` par ligne
 * verticale séparée (ancienne structure, incompatible avec la rangée
 * horizontale unique désormais requise) — position, style et interaction
 * du composant lui-même inchangés.
 */
export function ExerciseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft } = useSessionDraft();

  const [initialSnapshot] = useState<SessionDraftExercise>(
    () => draft.exercise ?? createExerciseDraft(),
  );
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
  // REWORK09-B (même correction que `CompositionScreen.tsx`, REWORK08-B) :
  // élève le `ScrollView` lui-même (frère direct réel du `backdrop` dédié
  // ci-dessous), jamais seulement un conteneur imbriqué — un `zIndex` porté
  // par un descendant du `ScrollView` ne se compare jamais au `backdrop`,
  // qui vivrait alors à un niveau de l'arbre différent. Un seul indicateur
  // suffit ici (contrairement à Composition, à deux lignes ancrées
  // séparées) : les quatre sélecteurs de la rangée compacte partagent
  // désormais un unique `PopoverAnchor` commun.
  const bodyElevated = openOverlay !== null;

  return (
    <ScreenShell>
      <FixedHeader
        title={draft.name.length > 0 ? draft.name : strings.screens.composition.name}
        onBack={() => router.back()}
        backAccessibilityLabel={t.backAccessibilityLabel}
      />
      <HeaderSeparator />

      <ScrollView
        style={[styles.body, bodyElevated ? styles.elevated : null]}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        testID="exercise-body"
      >
        {step === 1 ? (
          <>
            {/* Nom de l'activité — `Forms / Text Field — Source exact` (`2537:1075`). */}
            <View>
              <Text style={styles.fieldTitle}>{t.name}</Text>
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
            </View>

            {/*
             * Type d'activité (CE-T01-13, élément structurel obligatoire
             * même hors périmètre fonctionnel) : Récupération n'a ni écran
             * ni parcours dans T01 (tout T01, confirmé) — visible mais
             * désactivé, ne peut jamais ouvrir un écran partiel. `Exercice`
             * reste verrouillé sélectionné. Titre visible (point 5,
             * REWORK09) — un `accessibilityLabel` seul ne suffit plus.
             */}
            <View>
              <Text style={styles.fieldTitle}>{t.type.label}</Text>
              <View
                style={styles.segmentedControl}
                accessibilityRole="tablist"
                accessibilityLabel={t.type.label}
              >
                <SegmentButton label={t.type.exercise} selected onPress={() => {}} />
                <SegmentButton label={t.type.recovery} selected={false} disabled onPress={() => {}} />
              </View>
            </View>

            {/* Mode d'exécution — titre visible (point 5, REWORK09). */}
            <View>
              <Text style={styles.fieldTitle}>{t.executionMode.label}</Text>
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
            </View>

            {/*
             * Paramètres de l'activité — `Activity / Parameter Row —
             * Source exact` : une seule rangée horizontale (remplace les
             * trois anciennes lignes verticales), cadre récapitulatif en
             * dessous.
             */}
            <View>
              <Text style={styles.fieldTitle}>{t.parametersTitle}</Text>
              <View style={styles.parameterCard} testID="exercise-parameter-card">
                <View style={styles.parameterRow} testID="exercise-parameter-row">
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
                  ) : (
                    <ParameterField
                      testID="exercise-field-repetitionCount"
                      width={dimensions.exerciseParameterRow.wideColumnWidth}
                      label={t.repetitionCount.compactLabel}
                      accessibilityLabel={t.repetitionCount.accessibilityLabel}
                      value={String(local.repetitionCount ?? DEFAULT_REPETITION_COUNT)}
                      isOpen={openOverlay === "repetitionCount"}
                      onPress={() => toggleOverlay("repetitionCount")}
                    />
                  )}
                  <ParameterField
                    testID="exercise-field-pauseSeconds"
                    width={dimensions.exerciseParameterRow.wideColumnWidth}
                    label={t.pauseSeconds.compactLabel}
                    accessibilityLabel={t.pauseSeconds.accessibilityLabel}
                    value={formatDurationRowValue(local.pauseSeconds, WHEEL_PAUSE_SECONDS_MAX)}
                    isOpen={openOverlay === "pauseSeconds"}
                    onPress={() => toggleOverlay("pauseSeconds")}
                  />
                  <ParameterField
                    testID="exercise-field-seriesCount"
                    width={dimensions.exerciseParameterRow.narrowColumnWidth}
                    label={t.seriesCount.compactLabel}
                    accessibilityLabel={t.seriesCount.accessibilityLabel}
                    value={String(local.seriesCount)}
                    isOpen={openOverlay === "seriesCount"}
                    onPress={() => toggleOverlay("seriesCount")}
                  />
                </View>

                {openOverlay !== null ? (
                  <PopoverAnchor>
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
                  </PopoverAnchor>
                ) : null}
              </View>

              {/*
               * Cadre récapitulatif (point 8, REWORK09) : largeur utile
               * complète, contenu calculé (`formatExerciseRecap`, jamais
               * une valeur Figma statique), croît verticalement avec le
               * texte (aucune hauteur figée).
               */}
              <View style={styles.summaryCard} testID="exercise-summary-card">
                <Text style={styles.summaryText}>{formatExerciseRecap(local)}</Text>
              </View>
            </View>
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

            <Text style={styles.fieldTitle}>{t.bodyZones.label}</Text>
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

      {/*
       * Backdrop dédié (REWORK09, même mécanisme que `CompositionScreen
       * .tsx`, CMP-01/D-03) — remplace l'ancien `Pressable` racine plein
       * écran (`onPress={closeOverlay}` sur le conteneur entier), qui
       * interceptait le geste avant même qu'il n'atteigne un contrôle
       * imbriqué, y compris parfois le contrôle qu'on cherche justement à
       * ouvrir (même défaut D-03 que Composition avant sa propre
       * correction). Rendu uniquement quand un sélecteur est ouvert,
       * dernier frère direct de `ScreenShell`, sans `zIndex` propre —
       * reste donc sous le `ScrollView` `elevated` (`bodyElevated` ci-
       * dessus) tant qu'un sélecteur y est ancré.
       */}
      {openOverlay !== null ? (
        <Pressable
          onPress={closeOverlay}
          accessible={false}
          testID="exercise-backdrop"
          style={styles.backdrop}
        />
      ) : null}

      {isPendingExit ? (
        <ExerciseExitConfirmModal onCancel={cancelExit} onConfirm={confirmExit} />
      ) : null}
    </ScreenShell>
  );
}

/**
 * Ancre de positionnement du sélecteur intégré (correction CE-T01-07/14,
 * AUD-05, patron déjà établi) : React Native positionne un enfant
 * `position: "absolute"` relativement à la boîte de son parent immédiat.
 *
 * **REWORK09** : un unique `PopoverAnchor`, désormais commun aux quatre
 * sélecteurs de la rangée compacte (`duration`/`repetitionCount`/
 * `pauseSeconds`/`seriesCount`) — vérifié directement sur le nœud Figma
 * `1992:9430` : le sélecteur ouvert (`Durée — Roulette compacte 190`,
 * `330` de large) est positionné CENTRÉ sous `Cadre compact —
 * Paramètres` (`354` de large, `(354-330)/2 = 12` de marge de chaque
 * côté), jamais sous une seule colonne de `124`/`74`. Remplace les trois
 * `PopoverAnchor` séparés (un par ancienne ligne verticale), incompatibles
 * avec la rangée horizontale unique désormais requise.
 */
function PopoverAnchor({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.popoverAnchor} testID="exercise-popover-anchor">
      {children}
    </View>
  );
}

/**
 * `Activity / Parameter Row — Source exact` — une colonne (`Champ —
 * Durée`/`Pause`/`Séries`/`Répétitions`) : libellé court au-dessus
 * (`type.parameterColumnLabel`), contrôle `Forms / Select Field — Source
 * exact` en dessous (fond blanc, liseré `colors.exerciseParameterControlBorder`,
 * rayon `10`, hauteur `42`) — valeur alignée à gauche, carré chevron
 * `28×28` (`colors.tourSurface`, `#CDCEFA`, rayon `6`) aligné à droite,
 * chevron blanc `14×14` (`select-field-chevron`, point 7 REWORK09 —
 * jamais un chevron sombre isolé).
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
 * `Controls / Segmented` (`2586:2759`), traduction canonique vérifiée
 * directement sur les nœuds Figma actuels (`1992:9150`) — REWORK09,
 * point 4. Remplace l'ancien composant local qui affichait la sélection
 * sur fond blanc (`colors.background`) dans un conteneur `colors.surface` :
 * conteneur blanc bordé (`colors.border`), option sélectionnée
 * `colors.selection` (`#5F60EE`) avec texte blanc, option non
 * sélectionnée transparente avec texte `colors.textSecondary`, libellés
 * centrés (`justifyContent`/`alignItems: "center"`), états accessibles
 * (`accessibilityRole="tab"`, `accessibilityState`) conservés.
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
  elevated: {
    zIndex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
    paddingBottom: spacing[16],
    gap: spacing[24],
  },
  // REWORK09, point 3 : `Forms / Text Field — Source exact` (`2537:1075`)
  // — fond blanc, liseré dédié (distinct de `colors.border`), rayon `8`,
  // hauteur `46`. Plus aucun style local gris hérité de l'ancien écran
  // (`colors.surface`, rayon `12`).
  fieldTitle: {
    ...type.sectionTitle,
    color: colors.textPrimary,
    marginBottom: spacing[8],
  },
  nameInput: {
    ...type.exerciseFieldValue,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.exerciseFieldBorder,
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
  // `colors.border` (identique à la source Figma, `#e0e3e8`), padding `4`,
  // écart entre segments `14`, rayon externe `12`.
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
  // `flex: 1` distribue exactement 166pt à chacun des deux segments dans
  // ce conteneur (354 - 2×4 padding - 14 gap = 332, /2 = 166) — dérivé par
  // construction plutôt qu'une largeur codée en dur, mêmes proportions
  // exactes que la source Figma.
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
  // `colors.exerciseParameterCardBackground`).
  parameterCard: {
    width: dimensions.exerciseParameterRow.cardWidth,
    padding: dimensions.exerciseParameterRow.cardPadding,
    borderRadius: dimensions.exerciseParameterRow.cardRadius,
    backgroundColor: colors.exerciseParameterCardBackground,
  },
  // Rangée utile `338×66` — une seule rangée horizontale, remplace les
  // trois anciennes lignes verticales.
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
  // Carré canonique `28×28`, fond DSF `#CDCEFA` (`colors.tourSurface`,
  // valeur identique déjà réutilisée pour la structure Tour de
  // `CompositionScreen.tsx` — même token, pas de doublon), rayon `6`
  // (point 7, REWORK09) — jamais un chevron sombre isolé sans cadre.
  parameterChevronBox: {
    width: dimensions.exerciseParameterRow.chevronBox,
    height: dimensions.exerciseParameterRow.chevronBox,
    borderRadius: dimensions.exerciseParameterRow.chevronBoxRadius,
    backgroundColor: colors.tourSurface,
    alignItems: "center",
    justifyContent: "center",
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
  // Point 8 (REWORK09) : largeur utile complète, liseré `colors.tourSurface`
  // (même valeur que la source Figma, `#CDCEFA`, déjà réutilisée pour le
  // carré des chevrons ci-dessus — pas de nouveau token dupliqué), rayon
  // `12`, marges internes horizontales `12`/verticales `8`. Aucune hauteur
  // figée : le cadre grandit avec le texte (`formatExerciseRecap`, jamais
  // une valeur Figma statique).
  summaryCard: {
    marginTop: spacing[12],
    borderWidth: 1,
    borderColor: colors.tourSurface,
    borderRadius: dimensions.exerciseSummaryCard.radius,
    paddingHorizontal: dimensions.exerciseSummaryCard.paddingHorizontal,
    paddingVertical: dimensions.exerciseSummaryCard.paddingVertical,
  },
  summaryText: {
    ...type.body,
    color: colors.exerciseParameterValueText,
  },
  // Backdrop dédié (REWORK09) — même mécanisme que `CompositionScreen
  // .tsx` : couvre tout l'écran, rendu uniquement pendant qu'un sélecteur
  // est ouvert, sans `zIndex` propre — reste donc peint sous le
  // `ScrollView` `elevated` (`bodyElevated`) par cette seule valeur par
  // défaut (0), tout en restant au-dessus des autres frères directs de
  // `ScreenShell` du seul fait de son ordre de rendu (dernier frère).
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
