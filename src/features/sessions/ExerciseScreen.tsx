import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { WheelPickerOverlay } from "@/features/sessions/WheelPickerOverlay";
import {
  WHEEL_EXERCISE_DURATION_SECONDS_MAX,
  WHEEL_PAUSE_SECONDS_MAX,
} from "@/features/sessions/wheelPickerMath";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

type OverlayKind = "duration" | "repetitionCount" | "pauseSeconds" | "seriesCount";

/**
 * Étape 1 valide ⇔ Nom + cible du mode (Durée / Répétitions) valides. Le
 * mode « À l'échec » (T01-S10, D-111) n'a AUCUNE cible : le seul Nom suffit.
 * L'étape 2 reste entièrement facultative (plan T01-S08).
 */
function isStep1Valid(exercise: SessionDraftExercise): boolean {
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

/**
 * Écran `Création / modification d'une Activité — Exercice` (T01-S08, docs
 * §06 Écran 4 ; CE-T01-13). Type verrouillé `Exercice` — le type
 * `Récupération` (et son propre écran) reste hors périmètre de tout T01.
 *
 * **REWORK09 — reconstruction depuis le Shell/composants DS** (mission
 * directe utilisateur, 2026-09-04, `G-01` à `G-08`) : cet écran utilise le
 * Shell partagé (`ScreenShell`/`FixedHeader`/`HeaderSeparator`, déjà validé
 * par `CompositionScreen.tsx`) au lieu d'un en-tête local dupliqué.
 *
 * **Complétion REWORK12** (`[ChatGPT] Applique impérativement le protocole
 * KODJO actif...`, 2026-09-04, D-105 ; référence Figma vérifiée directement
 * `1992:9132`/`1992:9212`/`1992:9292`, frames à jour) : le titre local
 * (`titleAdd`/`titleEdit`), retiré par REWORK09, est **réintroduit** avec
 * un sens différent — un titre FONCTIONNEL (`Ajouter une activité`/
 * `Modifier une activité` à l'étape 1, `Informations complémentaires` à
 * l'étape 2), jamais plus le nom de la Séance (déplacé dans la nouvelle
 * zone bleue contextuelle, `ActivityContextBand` ci-dessous, visible
 * uniquement à l'étape 1). Ordre du formulaire de l'étape 1 : zone bleue
 * (contexte de Séance + champ Nom) → `Type d'activité` (segment `Exercice/
 * Récupération`) → `Mode d'exécution` (segment `Durée/Répétition`) →
 * `Paramètres de l'activité` (rangée compacte) → récapitulatif calculé,
 * ancré en bas du contenu défilant (frère du groupe Paramètres, jamais son
 * enfant — vérifié directement sur `3261:4156`/`3261:4157`).
 *
 * **Plusieurs Activités et bouton persistant** (complétion REWORK12,
 * explicitement autorisée : « La transformation du brouillon actuel,
 * limité à un champ `exercise` unique, vers une collection ordonnée
 * d'activités est explicitement autorisée dans ce lot ») : `SessionDraft
 * .exercises` est désormais une collection ordonnée
 * (`SessionDraft.ts`). Cet écran est ouvert soit pour AJOUTER une nouvelle
 * Activité (aucun paramètre de route, `exerciseId` absent — un `id` frais
 * est généré ici via `Crypto.randomUUID()`, la génération d'identifiants
 * réels restant hors de `SessionDraft.ts`, fonction pure), soit pour
 * MODIFIER une Activité existante ciblée par son identifiant
 * (`useLocalSearchParams<{ exerciseId?: string }>()`, transmis par
 * `CompositionScreen.tsx` via `router.push({ pathname: "/exercise",
 * params: { exerciseId } })`). Le déplacement réel d'une Activité au sein
 * de la collection reste hors périmètre de S08 (poignée indicative
 * uniquement, COMP-01) et appartient à S09.
 *
 * Copie de travail locale isolée du `SessionDraft` partagé (revue
 * indépendante ChatGPT, plan T01-S08) : toutes les modifications des deux
 * étapes ne touchent que `local` (état de ce composant), jamais
 * `updateDraft` directement — `Valider` ne fait que changer d'étape ;
 * `Terminer` est l'unique point d'écriture partagée, exactement une fois :
 * remplace l'élément de `draft.exercises` partageant le même `id` que
 * `local` s'il existe déjà (modification), sinon l'ajoute en fin de
 * collection (ajout) — jamais un remplacement complet de la collection. Un
 * abandon (modale D-094) ne réinitialise donc jamais le `SessionDraft`
 * partagé : `draft.exercises` reste inchangé (ajout abandonné → l'Activité
 * en cours de création n'y figure jamais ; modification abandonnée →
 * l'ancienne valeur de cet élément reste inchangée). Reprendre
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
 * **Roulettes — verrou de non-régression (REWORK09/REWORK12)** : aucune
 * ligne de `DurationWheelPicker.tsx` n'est modifiée par cette mission — sa
 * primitive native, son contrat `onValidate`/`onCancel` (brouillon local
 * jusqu'à validation) et son comportement documenté restent strictement
 * intacts. `NumberWheelPicker.tsx` (primitive native également, corrigée
 * par la mission précédente REWORK12) n'est pas non plus modifié ici.
 *
 * **Correction VISUAL (T01-S09, correction tentative 2, point D)** : les
 * quatre sélecteurs de la rangée compacte (`duration`/`repetitionCount`/
 * `pauseSeconds`/`seriesCount`) ne partagent plus un `PopoverAnchor` local
 * ancré sous le cadre de Paramètres — ils s'ouvrent désormais dans
 * `WheelPickerOverlay`, la même superposition plein écran TRANSVERSALE que
 * `CompositionScreen.tsx` (position indépendante du déclencheur et du
 * défilement, arrière-plan atténué, fermeture uniquement par Annuler/
 * Confirmer). Position, style et interaction des composants
 * `DurationWheelPicker`/`NumberWheelPicker` eux-mêmes restent inchangés —
 * seul leur conteneur de positionnement change.
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
  const [step, setStep] = useState<1 | 2>(1);
  const [isFinishing, setIsFinishing] = useState(false);
  const finishingRef = useRef(false);
  const [openOverlay, setOpenOverlay] = useState<OverlayKind | null>(null);

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
    } else if (mode === "REPETITIONS") {
      patchLocal({
        executionMode: "REPETITIONS",
        repetitionCount: local.repetitionCount ?? DEFAULT_REPETITION_COUNT,
        durationSeconds: null,
      });
    } else {
      // « À l'échec » (T01-S10, D-111) : aucune cible de durée ni de
      // répétitions ; Séries et Pause sont conservées telles quelles.
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

  function handleTerminer() {
    // Verrou synchrone : positionné avant tout autre traitement, y compris
    // avant `updateDraft` — voir la note de tête sur l'idempotence à deux
    // niveaux. Un deuxième appel survenant avant le prochain rendu retourne
    // immédiatement, sans effet.
    if (finishingRef.current) {
      return;
    }
    finishingRef.current = true;
    // Complétion REWORK12 : remplace l'élément existant par `id` (parcours
    // modification) ou ajoute `local` en fin de collection (parcours
    // ajout) — jamais un remplacement complet de `draft.exercises`, pour
    // ne jamais perdre les autres Activités déjà présentes.
    const alreadyPresent = draft.exercises.some((exercise) => exercise.id === local.id);
    const nextExercises = alreadyPresent
      ? draft.exercises.map((exercise) => (exercise.id === local.id ? local : exercise))
      : [...draft.exercises, local];
    updateDraft({ exercises: nextExercises });
    setIsFinishing(true);
  }

  const step1Valid = isStep1Valid(local);
  const t = strings.screens.exercise;

  const headerTitle = step === 1 ? (isEditingExisting ? t.titleEdit : t.titleAdd) : t.titleInformation;

  /**
   * **Correction compacte LOT_3_OF_3 — Retour de l'étape Zones corporelles.**
   *
   * L'étape 2 (`Informations complémentaires` : Consigne + Zones corporelles)
   * est une étape INTERNE de cet écran, pas un écran distinct : elle n'a
   * jamais sa propre entrée de pile de navigation (`setStep(2)`, un simple
   * état local — voir `Valider`). Router `back()` depuis cette étape faisait
   * donc quitter l'écran Activité ENTIER vers la Composition, ce que la garde
   * de sortie interprétait correctement comme un abandon (brouillon local
   * sale dès la première Zone cochée) : la modale d'abandon s'ouvrait alors
   * qu'aucune sortie réelle n'était demandée, et confirmer perdait tout le
   * travail de l'étape 1.
   *
   * Le Retour revient désormais D'ABORD à l'étape 1, sans navigation, donc
   * sans interception par la garde et sans modale. La copie de travail locale
   * (`local`) n'est jamais démontée entre les deux étapes : Consigne et Zones
   * sélectionnées restent intactes dans le brouillon local et réapparaissent
   * telles quelles si l'utilisateur revient dans l'étape.
   *
   * La modale d'abandon reste, elle, strictement inchangée pour une SORTIE
   * RÉELLE de l'écran Activité vers la Composition avec un brouillon sale
   * (Retour depuis l'étape 1, geste système) — c'est `useCompositionExitGuard`
   * qui l'assure, et il n'est pas touché ici : seule la destination du bouton
   * Retour à l'étape 2 change.
   */
  function handleBack() {
    if (step === 2) {
      setStep(1);
      return;
    }
    router.back();
  }

  return (
    <ScreenShell>
      <FixedHeader
        title={headerTitle}
        onBack={handleBack}
        backAccessibilityLabel={t.backAccessibilityLabel}
      />
      <HeaderSeparator />

      {/*
       * Zone bleue contextuelle (complétion REWORK12, D-105 ; T01-S10,
       * doc13 §8 « Le bandeau commence par `Nom de l'activité`, sans
       * contexte de Séance ») : accolée sans espace au séparateur de
       * l'en-tête, fixe (frère du `ScrollView`, jamais son descendant),
       * visible uniquement à l'étape 1 (absente de `1992:9292`, étape 2).
       * Commence par le champ `Nom de l'activité` — plus aucun rappel du nom
       * de la Séance (T01-S10). Le champ conserve sa géométrie/anatomie
       * (`dimensions.exerciseTextField`, fond transparent, liseré blanc
       * `colors.sessionNameBorder`).
       *
       * **Correction compacte LOT_3_OF_3** : le bandeau porte désormais un
       * SECOND élément, `+ Ajouter un média` (désactivé), immédiatement sous
       * le Nom — voir ci-dessous. L'ordre `Nom` puis `média` est structurel :
       * le Nom reste le premier élément du bandeau.
       */}
      {step === 1 ? (
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

          {/*
           * **Correction compacte LOT_3_OF_3 — `+ Ajouter un média` dans la
           * zone bleue.** Le bouton était rendu dans le corps défilant, après
           * le cadre `Paramètres de l'activité` ; il est DÉPLACÉ ici, dans le
           * bandeau contextuel fixe, immédiatement sous le champ `Nom de
           * l'activité` — qui reste le premier élément du bandeau. Il redonne
           * au bandeau la substance qu'il avait perdue quand T01-S10 en a
           * retiré la ligne `Séance · {nom}` (voir `contextBand` dans les
           * styles pour la hauteur dérivée et la traçabilité du `115`
           * documentaire).
           *
           * Le bouton reste VISIBLE mais DÉSACTIVÉ (`disabled`) : aucun
           * `onPress`, aucune navigation, aucune section Médias, aucun import/
           * galerie/lecture/stockage — Médias V2 reste hors périmètre. Seul
           * son emplacement change ; son anatomie, son `testID` et son état
           * désactivé sont repris à l'identique.
           */}
          <Pressable
            disabled
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            accessibilityLabel={t.addMediaUnavailableAccessibilityLabel}
            style={styles.addMediaButton}
            testID="exercise-add-media"
          >
            <Text style={styles.addMediaLabel}>{t.addMedia}</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        testID="exercise-body"
      >
        {step === 1 ? (
          <>
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
                <SegmentButton
                  label={t.executionMode.toFailure}
                  selected={local.executionMode === "TO_FAILURE"}
                  onPress={() => handleExecutionModeChange("TO_FAILURE")}
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
                  {/*
                   * Mode « À l'échec » (T01-S10, D-111) : ni Durée cible ni
                   * Répétitions cible — Pause et Séries restent aux positions
                   * canoniques.
                   */}
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
              </View>
            </View>

            {/*
             * Espace flexible (complétion REWORK12, vérifié directement sur
             * `3261:4156`/`3261:4165`) : pousse le récapitulatif au bas du
             * contenu défilant lorsque celui-ci tient dans la hauteur
             * visible (`bodyContent.flexGrow: 1` ci-dessous rend ce
             * comportement effectif) ; s'efface silencieusement (hauteur
             * nulle) dès que le contenu dépasse la hauteur visible — le
             * défilement normal reprend alors, jamais bloqué par ce
             * spacer.
             */}
            <View style={styles.recapSpacer} />

            {/*
             * Cadre récapitulatif (point 8, REWORK09 ; reformulé REWORK12,
             * ACT-08/09) : frère du groupe Paramètres, jamais son enfant
             * (vérifié directement sur `3261:4156`/`3261:4157`) — largeur
             * utile complète, contenu calculé (`formatExerciseRecap`,
             * jamais une valeur Figma statique), croît verticalement avec
             * le texte (aucune hauteur figée).
             */}
            <View style={styles.summaryCard} testID="exercise-summary-card">
              <Text style={styles.summaryText}>{formatExerciseRecap(local)}</Text>
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
       * T01-S09, correction VISUAL (point D) : les quatre sélecteurs de la
       * rangée compacte partagent désormais un unique `WheelPickerOverlay`
       * — superposition plein écran, frère direct de `ScreenShell`, jamais
       * un descendant du `ScrollView` ni ancrée au cadre de Paramètres. Un
       * seul peut être ouvert à la fois (`OverlayKind`), donc un seul bloc
       * conditionnel suffit à l'intérieur. Son voile de fond n'est pas
       * pressable — seules Annuler/Confirmer (dans le composant roulette
       * lui-même) ferment désormais le sélecteur, remplaçant l'ancien
       * `exercise-backdrop` dismissible au toucher (REWORK09/CMP-01/D-03,
       * mécanisme retiré de cet écran par cette correction).
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
      </WheelPickerOverlay>

      {isPendingExit ? (
        <ExerciseExitConfirmModal onCancel={cancelExit} onConfirm={confirmExit} />
      ) : null}
    </ScreenShell>
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
  // Complétion REWORK12 : `flexGrow: 1` rend effectif `recapSpacer`
  // ci-dessous (pousse le récapitulatif au bas du contenu lorsque celui-ci
  // tient dans la hauteur visible), sans jamais empêcher le défilement
  // normal si le contenu la dépasse — voir la note de tête de
  // `recapSpacer`.
  bodyContent: {
    flexGrow: 1,
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
  // Complétion REWORK12 (D-105, `3261:4151`) : « Zone bleue — Contexte
  // séance et nom de l'activité » — fixe, sous l'en-tête, accolée sans
  // espace au séparateur (`marginTop`/`padding` de l'en-tête déjà nuls,
  // aucun ajustement local nécessaire). Hauteur DSF fixe de 115 pt
  // (voir `dimensions.exerciseContextBand`).
  //
  // **Correction compacte LOT_3_OF_3 — contenu restauré.**
  // Le bandeau contient de nouveau DEUX éléments : `Nom de l'activité` en
  // premier, puis `+ Ajouter un média` (désactivé) immédiatement sous lui.
  // Le champ et le bouton sont distribués dans les 115 pt par
  // `justifyContent: "space-between"` : aucun `gap` local non documenté n'est
  // inventé. Les paddings, le fond et la position du Shell restent inchangés.
  contextBand: {
    backgroundColor: colors.exerciseContextBandBackground,
    paddingHorizontal: spacing[24],
    height: dimensions.exerciseContextBand.height,
    paddingTop: dimensions.exerciseContextBand.paddingTop,
    paddingBottom: dimensions.exerciseContextBand.paddingBottom,
    justifyContent: "space-between",
  },
  // Complétion REWORK12 : même géométrie que la précédente implémentation
  // (`dimensions.exerciseTextField`, `46/8/14`, inchangée — REWORK09) mais
  // fond transparent et liseré blanc intérieur (`colors.sessionNameBorder`,
  // même token que `Nom de la séance` dans Composition), posée sur la zone
  // bleue plutôt qu'un fond blanc opaque.
  //
  // REWORK13 (R13-01, `[ChatGPT] CHANGES_REQUESTED — REWORK13 —
  // typographie Nom d'activité + périmètre synthèse Tour`, 2026-09-04 ;
  // `.github/orchestration/reports/2026-09-04_activity-name-typography-
  // tour-summary-scope.md`) : valeur portée de `type.modalTitle` (`18/22`
  // Semi Bold, REWORK12-bis) à `type.screenTitle` (`20/24` Semi Bold) —
  // identique au style de `Nom de la séance` dans Composition, vérifié
  // directement sur `1992:9132` (référence Figma explicitement citée par
  // l'autorisation). Géométrie du champ (46/8/14), fond transparent, liseré
  // blanc, bandeau contextuel et `Séance · {nom}` en `14/17` : strictement
  // préservés, aucune autre propriété modifiée.
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
  // `flex: 1` distribue une largeur EXACTEMENT ÉGALE à chaque segment du
  // conteneur (deux pour `Type d'activité`, trois pour `Mode d'exécution`
  // depuis T01-S10 : `Durée / Répétitions / À l'échec`) — dérivé par
  // construction plutôt qu'une largeur codée en dur, mêmes proportions que
  // la source Figma.
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
  // Complétion REWORK12 : `flex: 1` — pousse `summaryCard` au bas du
  // contenu défilant lorsque celui-ci tient dans la hauteur visible
  // (rendu effectif par `bodyContent.flexGrow: 1`) ; s'efface (hauteur
  // nulle) dès que le contenu dépasse la hauteur visible, laissant le
  // défilement normal reprendre — jamais un blocage. Vérifié directement
  // sur `3261:4156`/`3261:4165` (« Espace flexible — pousse la synthèse en
  // bas »).
  recapSpacer: {
    flex: 1,
  },
  // T01-S10 (doc13 §8) : `+ Ajouter un média` — bouton centré, désactivé
  // (Médias V2 hors périmètre). Anatomie du bouton secondaire compact DSF
  // (`dimensions.compactSecondaryButton`, `colors.primary` en liseré),
  // texte atténué pour signaler l'indisponibilité.
  //
  // Correction compacte LOT_3_OF_3 : ce bouton est désormais rendu DANS la
  // zone bleue, immédiatement sous le champ `Nom de l'activité` (auparavant
  // dans le corps défilant, après le cadre Paramètres). Aucune propriété de
  // ce style n'est modifiée — le fond blanc explicite reste nécessaire, la
  // zone bleue étant teintée, exactement comme `addActivityAction` sur la
  // bande Context de `CompositionScreen.tsx`.
  addMediaButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
  // (même valeur que la source Figma, `#CDCEFA`, déjà réutilisée pour le
  // carré des chevrons ci-dessus — pas de nouveau token dupliqué), rayon
  // `12`, marges internes horizontales `12`/verticales `8`. Aucune hauteur
  // figée : le cadre grandit avec le texte (`formatExerciseRecap`, jamais
  // une valeur Figma statique). `marginTop` retiré (complétion REWORK12) :
  // `summaryCard` est désormais un frère du groupe Paramètres séparé par
  // `recapSpacer`/le `gap` uniforme de `bodyContent`, plus un enfant
  // directement accolé nécessitant sa propre marge locale.
  summaryCard: {
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
