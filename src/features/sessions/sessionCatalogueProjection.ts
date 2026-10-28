import { seriesCountOf, seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import type { SessionDurationResult } from "@/domain/activities/executionCalculations";
import type { Activity } from "@/domain/sessions/Session";
import type { CatalogueSessionRecord, SessionStatus } from "@/domain/sessions/SessionRepository";
import { computeStructureDuration, structureExercises, type StructureCircuit } from "@/domain/sessions/structure";
import type { CircuitNature } from "@/domain/sessions/circuit";
import { firstMediaPreviewSource, type MediaPreviewSource } from "@/features/activities/MediaPreview";
import { isDisplayableRecovery } from "@/features/sessions/ActivityRecoveryLine";
import { formatOccurrenceSummary } from "@/features/sessions/compositionPresentation";
import { strings } from "@/shared/i18n";

import { FREE_SESSION_FORMAT, sessionFormatOf, type SessionFormatKey } from "./sessionFormats";

/**
 * PRE-8 (epic E, story E.1 ; spécification « Carte de séance et catalogue des séances » du 27/10,
 * §1 et §2 ; D-449 §6) — projection de LECTURE d'une Séance pour le Catalogue unifié. Fonction pure :
 * rien n'est stocké ni réécrit (ni catégories agrégées, ni photo dérivée, ni rang).
 *
 * - Compte : Exercices définis dans la composition, chacun une fois, sans multiplier par séries,
 *   tours ni répétitions de Cycle ; deux Exercices du même Mouvement comptent deux ; les
 *   récupérations (et les anciennes Récupérations autonomes) ne comptent pas.
 * - Catégories : dédupliquées, ordre de première apparition dans la composition (carte et filtres).
 * - Zones corporelles et Étiquette : pour les filtres seulement (Q-E3), jamais sur la carte.
 * - Visuel : média de l'Exercice unique, sinon premier média dans l'ordre de composition, sinon
 *   vignette du format, sinon Libre. Aucun format n'est persisté (Q-E5) : le repli est Libre.
 * - Synthèse : nom du format (jamais aujourd'hui), sinon nombre d'Exercices, sinon — un seul
 *   Exercice — son volume (« 3 × 1 min 30 s », « 1 × 45 s ») ; « 1 exercice » n'est jamais produit.
 *   Une Séance sans Exercice garde « 0 exercice » (D-392, Q-E6).
 * - Durée : autorité unique du Domaine (`computeStructureDuration`), aucune nouvelle formule.
 * - Arbre de la composition : un conteneur (Cycle, Circuit) n'apparaît que s'il se répète ou
 *   contient plus d'un Exercice ; ses membres sont décalés d'un niveau ; deux décalages au plus.
 */

export type CatalogueCategoryRef = { readonly id: string; readonly name: string; readonly color: string };

export type CatalogueVisual =
  | { readonly kind: "MEDIA"; readonly source: MediaPreviewSource }
  | { readonly kind: "FORMAT"; readonly format: SessionFormatKey };

export type CatalogueSummarySlot =
  | { readonly kind: "FORMAT"; readonly label: string }
  | { readonly kind: "COUNT"; readonly count: number }
  | { readonly kind: "VOLUME"; readonly volume: string };

export type CatalogueTreeLine =
  | { readonly kind: "CYCLE"; readonly key: string; readonly depth: number; readonly repeatCount: number }
  | {
      readonly kind: "CIRCUIT";
      readonly key: string;
      readonly depth: number;
      readonly repeatCount: number;
      readonly nature: CircuitNature;
    }
  | { readonly kind: "EXERCISE"; readonly key: string; readonly depth: number; readonly name: string; readonly volume: string }
  | { readonly kind: "RECOVERY"; readonly key: string; readonly depth: number; readonly seconds: number };

export type SessionCatalogueProjection = {
  readonly id: string;
  readonly name: string;
  readonly status: SessionStatus;
  readonly labelId: string | null;
  readonly exerciseCount: number;
  /** Chevron du nom : seulement pour plusieurs Exercices (spécification §1). */
  readonly expandable: boolean;
  readonly categories: readonly CatalogueCategoryRef[];
  readonly bodyZoneIds: readonly string[];
  readonly format: SessionFormatKey;
  readonly visual: CatalogueVisual;
  readonly summary: CatalogueSummarySlot;
  readonly duration: SessionDurationResult;
  readonly tree: readonly CatalogueTreeLine[];
};

const isExercise = (activity: Activity) => activity.type !== "RECOVERY";

/** Durée d'une ancienne Récupération autonome (première cible chiffrée), sinon `null`. */
function legacyRecoverySeconds(activity: Activity): number | null {
  const target = seriesRowsOf(activity.executionParameters)[0]?.target;
  return target?.kind === "NUMBER" ? target.value : null;
}

/**
 * Volume d'un Exercice dans l'emplacement de synthèse (spécification §1 : « 3 × 1 min 30 s »,
 * « 1 × 45 s ») : la synthèse d'occurrence existante (`formatOccurrenceSummary`), dont une série
 * unique chiffrée prend la forme « 1 × cible » exigée par la spécification. Les autres formes
 * (échec, séries variables, paramètres à compléter) sont reprises telles quelles.
 */
export function formatCatalogueVolume(activity: Activity): string {
  const summary = formatOccurrenceSummary({ executionParameters: activity.executionParameters });
  const parameters = activity.executionParameters;
  const rows = seriesRowsOf(parameters);
  const single =
    seriesCountOf(parameters) === 1 &&
    parameters.series.kind === "UNIFORM" &&
    parameters.mode !== null &&
    rows[0]?.target.kind === "NUMBER";
  return single
    ? strings.screens.composition.occurrenceCard.seriesTimes.replace("{n}", "1").replace("{target}", summary)
    : summary;
}

function exerciseLines(activity: Activity, depth: number): CatalogueTreeLine[] {
  if (!isExercise(activity)) {
    const seconds = legacyRecoverySeconds(activity);
    return seconds !== null && isDisplayableRecovery(seconds)
      ? [{ kind: "RECOVERY", key: activity.id, depth, seconds }]
      : [];
  }
  const lines: CatalogueTreeLine[] = [
    {
      kind: "EXERCISE",
      key: activity.id,
      depth,
      name: activity.name,
      volume: formatOccurrenceSummary({ executionParameters: activity.executionParameters }),
    },
  ];
  if (isDisplayableRecovery(activity.postActivityRecoverySeconds)) {
    lines.push({ kind: "RECOVERY", key: `${activity.id}:recovery`, depth, seconds: activity.postActivityRecoverySeconds });
  }
  return lines;
}

const exerciseCountOf = (exercises: readonly Activity[]) => exercises.filter(isExercise).length;

/** Spécification §2 : un conteneur n'apparaît que s'il se répète ou contient plus d'un Exercice. */
const isShownContainer = (repeatCount: number, exercises: readonly Activity[]) =>
  repeatCount > 1 || exerciseCountOf(exercises) > 1;

function circuitLines(circuit: StructureCircuit<Activity>, depth: number): CatalogueTreeLine[] {
  const shown = isShownContainer(circuit.repeatCount, circuit.exercises);
  const childDepth = shown ? depth + 1 : depth;
  return [
    ...(shown
      ? [{ kind: "CIRCUIT" as const, key: circuit.id, depth, repeatCount: circuit.repeatCount, nature: circuit.nature }]
      : []),
    ...circuit.exercises.flatMap((exercise) => exerciseLines(exercise, childDepth)),
  ];
}

export function projectSessionTree(record: Pick<CatalogueSessionRecord, "structure">): readonly CatalogueTreeLine[] {
  return record.structure.elements.flatMap((element): CatalogueTreeLine[] => {
    switch (element.kind) {
      case "EXERCISE":
        return exerciseLines(element.exercise, 0);
      case "CIRCUIT":
        return circuitLines(element.circuit, 0);
      case "CYCLE": {
        const { cycle } = element;
        const shown = isShownContainer(
          cycle.repeatCount,
          cycle.circuits.flatMap((circuit) => circuit.exercises),
        );
        return [
          ...(shown ? [{ kind: "CYCLE" as const, key: cycle.id, depth: 0, repeatCount: cycle.repeatCount }] : []),
          ...cycle.circuits.flatMap((circuit) => circuitLines(circuit, shown ? 1 : 0)),
        ];
      }
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
  });
}

export function projectSessionForCatalogue(
  record: CatalogueSessionRecord,
  categoriesById: ReadonlyMap<string, CatalogueCategoryRef>,
): SessionCatalogueProjection {
  const exercises = structureExercises(record.structure).filter(isExercise);
  const exerciseCount = exercises.length;

  const categories: CatalogueCategoryRef[] = [];
  const bodyZoneIds: string[] = [];
  for (const exercise of exercises) {
    const category = exercise.categoryId ? categoriesById.get(exercise.categoryId) : undefined;
    if (category && !categories.some((known) => known.id === category.id)) categories.push(category);
    for (const zoneId of exercise.bodyZoneIds) if (!bodyZoneIds.includes(zoneId)) bodyZoneIds.push(zoneId);
  }

  // Aucun format persisté (Q-E5) : toute Séance est Libre et le premier emplacement n'affiche jamais
  // de format.
  const format = FREE_SESSION_FORMAT;
  const media = exercises.map((exercise) => firstMediaPreviewSource(exercise.media)).find((source) => source !== null);
  const visual: CatalogueVisual = media ? { kind: "MEDIA", source: media } : { kind: "FORMAT", format };

  const formatHasName = format !== FREE_SESSION_FORMAT;
  const summary: CatalogueSummarySlot = formatHasName
    ? { kind: "FORMAT", label: sessionFormatOf(format).label }
    : exerciseCount === 1
      ? { kind: "VOLUME", volume: formatCatalogueVolume(exercises[0]!) }
      : { kind: "COUNT", count: exerciseCount };

  return {
    id: record.id,
    name: record.name,
    status: record.status,
    labelId: record.labelId,
    exerciseCount,
    expandable: exerciseCount > 1,
    categories,
    bodyZoneIds,
    format,
    visual,
    summary,
    duration: computeStructureDuration(record.structure),
    tree: projectSessionTree(record),
  };
}
