import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { decodeInstructionSteps } from "@/domain/activities/instructionSteps";
import type { MovementPhaseList } from "@/domain/activities/movementPhaseList";
import { variantLevelPosition } from "@/domain/activities/movementSuggestion";
import type { MovementLevels } from "@/features/activities/ActivityDefinitionService";
import { ActivityEditorForm, type ActivityEditorFormValue } from "@/features/activities/ActivityEditorForm";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import type { EditorLevel } from "@/features/activities/MovementLevelMenu";
import {
  EditorHeader,
  editorLevelOf,
  isPersistedMovementOccurrence,
  occurrencePhaseList,
  toEditorCategory,
  useBodyZonesReferential,
  useCategories,
  useProfileDefaults,
} from "@/features/sessions/ExerciseScreen";
import { formatCompactDuration } from "@/features/sessions/compositionPresentation";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { ScreenShell } from "@/shared/ui/ScreenShell";

const noop = () => undefined;

/** Récupération propre à l'Exercice, en phrase ; `null` si elle n'est pas renseignée. */
function recoverySentence(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined) return null;
  const card = strings.executionParameters.card;
  return seconds > 0 ? card.recoveryBeforeNext.replace("{duration}", formatCompactDuration(seconds)) : card.noRecoveryBeforeNext;
}

function renseignedPhases(list: MovementPhaseList): MovementPhaseList {
  return { ...list, phases: list.phases.filter((phase) => phase.label.trim().length > 0) };
}

/**
 * Recette iPhone du 04/11/2026 — décision de Hermann (texte exact) : « décision prise concernant l'affichage
 * de la fiche exercice ou mouvement lors d'un appui court sur la photo d'une carte d'exercice dans la
 * composition de séance. Affichage de la fiche d'exercice avec photo, description phase et synthèse des
 * paramètres d'exécution. Pas de bouton d'action en bas, en lecture seule (donc pas d'accès aux paramètres
 * d'exécution en modification), pas d'affichage du titre de section ni de son champ si aucune valeur n'y est
 * renseignée. Affichage au format de la modale iOS, apparition et disparition par le bas. »
 *
 * Précision de Hermann du même jour (texte exact) : « oui, le reste la fiche ne change pas et on garde les
 * informations de la zone de contexte telles qu'elles sont, renseignées ou pas. »
 *
 * Fiche de l'Exercice (occurrence du brouillon de Séance) en consultation seule, présentée en feuille
 * (route `exercise-sheet`) : même gabarit que l'éditeur d'un Exercice existant (`CompositionExerciseEditor`) —
 * zone de contexte inchangée (nom, Catégorie, Zones corporelles, pastille de Niveau, renseignés ou non, sans
 * accès) ; dans le corps, sections sans valeur absentes ; synthèse des paramètres non touchable ; aucun
 * `Terminer`. Rien n'est écrit dans le brouillon.
 */
export function ExerciseSheet({
  exerciseId,
  onBodyMeasure,
}: {
  readonly exerciseId: string | null;
  readonly onBodyMeasure?: (measure: { readonly frame: number; readonly content: number }) => void;
}) {
  const router = useRouter();
  const { draft } = useSessionDraft();
  const service = useActivityDefinitionService();
  const bodyZones = useBodyZonesReferential(service);
  const { categories } = useCategories();
  const profile = useProfileDefaults();
  const exercise = exerciseId === null ? null : (draft.exercises.find((candidate) => candidate.id === exerciseId) ?? null);
  const [mediaDraftId] = useState(() => `exercise-sheet:${exerciseId ?? "none"}`);

  // Pastille de Niveau de la zone de contexte, comme l'éditeur d'un Exercice existant (sans menu : lecture seule).
  const movementId = (exercise?.sourceMovementId ?? "").trim();
  const persisted = exercise !== null && movementId.length > 0 && isPersistedMovementOccurrence(exercise, draft.movements);
  const variantOrigin = !persisted && movementId.length > 0 ? (draft.movements?.[movementId]?.levelOrigin ?? null) : null;
  const lookupId =
    service.supportsMovementLevels === true ? (persisted ? movementId : (variantOrigin?.movementId ?? null)) : null;
  const [loaded, setLoaded] = useState<{ readonly id: string; readonly levels: MovementLevels | "error" } | null>(null);
  useEffect(() => {
    if (lookupId === null) return;
    let cancelled = false;
    Promise.resolve()
      .then(() => service.getMovementLevels(lookupId))
      .then(
        (result) => {
          if (!cancelled) setLoaded({ id: lookupId, levels: result ?? "error" });
        },
        (error: unknown) => {
          if (cancelled) return;
          console.error("Les niveaux du mouvement n'ont pas pu être chargés.", error);
          setLoaded({ id: lookupId, levels: "error" });
        },
      );
    return () => {
      cancelled = true;
    };
  }, [service, lookupId]);
  const levels = loaded !== null && loaded.id === lookupId ? loaded.levels : null;
  const levelPending = lookupId !== null && levels === null;
  let level: EditorLevel | null = null;
  if (persisted) {
    level = editorLevelOf(levels, null);
  } else if (variantOrigin !== null && levels !== null && levels !== "error") {
    level = { position: variantLevelPosition(levels.position, variantOrigin.placement), menu: null };
  }

  const value: ActivityEditorFormValue | null =
    exercise === null
      ? null
      : {
          name: exercise.name,
          instructionSteps: decodeInstructionSteps(exercise.instruction),
          executionParameters: exercise.executionParameters,
          bodyZoneIds: exercise.bodyZoneIds,
          media: exercise.media ?? [],
        };

  return (
    <ScreenShell>
      <EditorHeader
        // Titre de consultation de la fiche d'un Exercice existant (`CompositionExerciseEditor`, Figma
        // `10419:22924` « Mouvement — Repris (lecture seule) ») ; le nom de l'Exercice suit, en tête de fiche.
        // Complément du 5 novembre 2026 (§10, Figma `11580:21528`) : titre « Fiche de l'exercice ».
        title={strings.executionParameters.card.exerciseSheetTitle}
        onClose={() => router.back()}
        accessibilityLabel={strings.screens.movement.close}
        topInset={0}
      />
      {value !== null && exercise !== null && !levelPending ? (
        <ActivityEditorForm
          variant="movement"
          executionParametersCard
          value={value}
          onChange={noop}
          // Phases de l'occurrence (libellés, ordre) ; une phase sans libellé n'est pas une valeur renseignée.
          movementPhases={{ value: renseignedPhases(occurrencePhaseList(exercise, draft.movements)), onChange: noop }}
          bodyZones={bodyZones}
          silhouette={profile.silhouette}
          category={toEditorCategory(exercise.categoryId ?? null, categories)}
          onOpenCategory={noop}
          level={level}
          profileSideRecoverySecondsDefault={0}
          exerciseSignals="absent"
          // Contenu verrouillé : nom, Catégorie et Zones affichés sans accès (`contentLocked`).
          contentLocked
          hideEmptySections
          parametersReadOnly
          // Complément du 5 novembre 2026 (§10) : « Dans cette séance » — Phrase des paramètres et Récupération propre à
          // l'Exercice (Figma `11580:21528` : « Récupération de 30 s avant l'exercice suivant. »).
          inThisSession={{ recovery: recoverySentence(exercise.postActivityRecoverySeconds) }}
          mediaService={service}
          mediaDraftId={mediaDraftId}
          finishLabel=""
          onFinish={noop}
          isFinishDisabled
          hideFinish
          {...(onBodyMeasure !== undefined ? { onBodyMeasure } : {})}
          finishSlotTestID="exercise-sheet-finish-slot"
          finishActionTestID="exercise-sheet-finish-action"
        />
      ) : null}
    </ScreenShell>
  );
}
