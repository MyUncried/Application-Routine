import { seriesCountOf, seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import type { SessionDurationResult } from "@/domain/activities/executionCalculations";
import type { Activity } from "@/domain/sessions/Session";
import type { CatalogueSessionRecord, SessionStatus } from "@/domain/sessions/SessionRepository";
import { computeStructureDuration, cycleExercises, structureCircuits, structureExercises, type StructureCircuit } from "@/domain/sessions/structure";
import type { CircuitNature } from "@/domain/sessions/circuit";
import { firstMediaPreviewSource, type MediaPreviewSource } from "@/features/activities/MediaPreview";
import { isDisplayableRecovery } from "@/features/sessions/ActivityRecoveryLine";
import { circuitDisplayTitle } from "@/features/sessions/carrierPresentation";
import { formatOccurrenceSummary, isIncompleteSummary, isToVerifySummary } from "@/features/sessions/compositionPresentation";
import { strings } from "@/shared/i18n";

import { FREE_SESSION_FORMAT, type SessionFormatKey } from "./sessionFormats";

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
 * - [Synthèse : nom du format (jamais aujourd'hui), sinon nombre d'Exercices, sinon — un seul
 *   Exercice — son volume (« 3 × 1 min 30 s », « 1 × 45 s ») ; « 1 exercice » n'est jamais produit.
 *   — remplacé le 06/11/2026.]
 *   D-505 (Hermann, 06/11/2026 ; KODJO-Catalogues-cartes-modales-2026-11-06 §5) : ligne 3
 *   « N circuits · N exercices » (`shownCircuitCount`, `exerciseCount`) ; le nombre de circuits est
 *   omis sans circuit, ou pour un seul circuit joué une seule fois ; « 1 exercice » pour une Séance
 *   d'un seul Exercice. Une Séance sans Exercice garde « 0 exercice » (D-392, Q-E6).
 * - Durée : autorité unique du Domaine (`computeStructureDuration`), aucune nouvelle formule.
 * - Arbre de la composition : un conteneur (Cycle, Circuit) n'apparaît que s'il se répète ou
 *   contient plus d'un Exercice ; ses membres sont décalés d'un niveau ; deux décalages au plus.
 */

export type CatalogueCategoryRef = { readonly id: string; readonly name: string; readonly color: string };

export type CatalogueVisual =
  | { readonly kind: "MEDIA"; readonly source: MediaPreviewSource }
  | { readonly kind: "FORMAT"; readonly format: SessionFormatKey };

export type CatalogueTreeLine =
  | { readonly kind: "CYCLE"; readonly key: string; readonly depth: number; readonly repeatCount: number }
  | {
      readonly kind: "CIRCUIT";
      readonly key: string;
      readonly depth: number;
      readonly repeatCount: number;
      readonly nature: CircuitNature;
      /**
       * Recette iPhone n° 3 du 03/11/2026 (autres constats) : nom du Format (Circuit porteur) ou du modèle
       * d'origine, à la place de « Circuit » ; absent : « Circuit ».
       */
      readonly title?: string;
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
  /**
   * D-505 (Hermann, 06/11/2026) : nombre de Circuits affiché en ligne 3 (« N circuits · N exercices »),
   * compte structurel (Circuits des Cycles compris, sans multiplier par tours ni passages) ; `null`
   * quand il est omis : aucun Circuit, ou un seul Circuit joué une seule fois. [Avant : `summary`,
   * format ou volume en ligne 3 — remplacé.]
   */
  readonly shownCircuitCount: number | null;
  readonly duration: SessionDurationResult;
  readonly tree: readonly CatalogueTreeLine[];
  /**
   * Contre-recette iPhone du 30/10/2026 (Hermann : « Une séance incomplète doit avoir le même format
   * qu'un exercice incomplet (fond rouge liseré rouge) ») : au moins un de ses Exercices porte la
   * synthèse « Paramètres à compléter. » — même signal que la carte d'Exercice de la Composition
   * (D-448 point 7, `isIncompleteSummary`). Lecture seule, rien n'est stocké.
   */
  readonly incomplete: boolean;
  /**
   * PRE-9, contre-recette n° 3 du 31/10/2026 (cr4-verifier, Hermann : « La carte de la séance dans le
   * catalogue de séances doit aussi être orange. ») : au moins un de ses Exercices porte la synthèse
   * « Paramètre à vérifier » (`isToVerifySummary`, marque `phasesToVerify` encore active) — et aucun
   * n'est à compléter (`incomplete` prime). La carte suit ses Exercices : la marque d'un Exercice
   * tombe à l'ouverture de sa feuille des paramètres. Lecture seule, rien n'est stocké.
   */
  readonly toVerify: boolean;
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
 * [D-505 (Hermann, 06/11/2026) : la ligne 3 de la carte n'affiche plus de volume — fonction plus lue par la
 * carte, conservée pour ses appelants de test.]
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

/** Recette iPhone n° 3 du 03/11/2026 : nom du Circuit (Format ou modèle d'origine), comme la Composition. */
function titleOf(circuit: StructureCircuit<Activity>): { readonly title?: string } {
  const title = circuitDisplayTitle(circuit);
  return title === undefined ? {} : { title };
}

function circuitLines(circuit: StructureCircuit<Activity>, depth: number): CatalogueTreeLine[] {
  const shown = isShownContainer(circuit.repeatCount, circuit.exercises);
  const childDepth = shown ? depth + 1 : depth;
  return [
    ...(shown
      ? [
          {
            kind: "CIRCUIT" as const,
            key: circuit.id,
            depth,
            repeatCount: circuit.repeatCount,
            nature: circuit.nature,
            ...titleOf(circuit),
          },
        ]
      : []),
    ...circuit.exercises.flatMap((exercise) => exerciseLines(exercise, childDepth)),
  ];
}

/**
 * Durée de la carte Catalogue (D-391, Hermann 17/10/2026 : « durées exactes et estimées des cartes
 * Catalogue et Composition affichées en minutes et secondes, sans arrondi à la minute supérieure ;
 * règles des durées partielles avec ≥ conservées ») : montant exact, préfixé « ≈ » (estimée) ou « ≥ »
 * (borne minimale), comme la durée de la carte Exercice du Catalogue (`totalClauseAmount`).
 */
export function formatCatalogueSessionDuration(duration: SessionDurationResult): string {
  const amount = formatPhraseDuration(Number.isFinite(duration.seconds) ? Math.max(0, duration.seconds) : 0);
  const { estimatedPrefix, lowerBoundPrefix } = strings.shared.durationNature;
  if (duration.kind === "estimated") return `${estimatedPrefix}${amount}`;
  if (duration.kind === "lowerBound") return `${lowerBoundPrefix}${amount}`;
  return amount;
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
        const shown = isShownContainer(cycle.repeatCount, cycleExercises(cycle));
        return [
          ...(shown ? [{ kind: "CYCLE" as const, key: cycle.id, depth: 0, repeatCount: cycle.repeatCount }] : []),
          // PRE-9 (A.1, D-451) : Exercices directs et Circuits du Cycle, dans leur ordre.
          ...cycle.members.flatMap((member) =>
            member.kind === "CIRCUIT" ? circuitLines(member.circuit, shown ? 1 : 0) : exerciseLines(member.exercise, shown ? 1 : 0),
          ),
        ];
      }
      default: {
        const unreachable: never = element;
        return unreachable;
      }
    }
  });
}

/**
 * D-505 (Hermann, 06/11/2026 ; KODJO-Catalogues-cartes-modales-2026-11-06 §5) : nombre de Circuits de la
 * ligne 3 — compte structurel du Domaine (`structureCircuits`, Circuits des Cycles compris), chacun une
 * fois, jamais multiplié par tours ni passages. Omis (`null`) sans Circuit, ou pour un seul Circuit joué
 * une seule fois : un tour, hors d'un Cycle répété (un Circuit d'un tour dans un Cycle de plusieurs
 * passages est joué plusieurs fois — interprétation retenue de « joué une seule fois »).
 */
export function shownCircuitCountOf(structure: Pick<CatalogueSessionRecord["structure"], "elements">): number | null {
  // Un Circuit sans Exercice (ancien Circuit implicite vide, PRE-9 B.2 : « un conteneur n'est jamais
  // vide ») ne compte pas.
  const circuits = structureCircuits(structure).filter((circuit) => circuit.exercises.some(isExercise));
  if (circuits.length === 0) return null;
  if (circuits.length > 1) return circuits.length;
  const only = circuits[0]!;
  const enclosingCycle = structure.elements.find(
    (element) =>
      element.kind === "CYCLE" && element.cycle.members.some((member) => member.kind === "CIRCUIT" && member.circuit.id === only.id),
  );
  const cyclePasses = enclosingCycle?.kind === "CYCLE" ? enclosingCycle.cycle.repeatCount : 1;
  return only.repeatCount === 1 && cyclePasses === 1 ? null : 1;
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

  const summaries = exercises.map((exercise) =>
    formatOccurrenceSummary({ executionParameters: exercise.executionParameters, phasesToVerify: exercise.phasesToVerify }),
  );
  const incomplete = summaries.some(isIncompleteSummary);
  return {
    id: record.id,
    name: record.name,
    status: record.status,
    labelId: record.labelId,
    exerciseCount,
    // [Recette iPhone n° 3 du 03/11/2026 : chevron et vue déployée pour toute séance — ce champ n'est plus lu par la carte.]
    expandable: exerciseCount > 1,
    categories,
    bodyZoneIds,
    format,
    visual,
    shownCircuitCount: shownCircuitCountOf(record.structure),
    duration: computeStructureDuration(record.structure),
    tree: projectSessionTree(record),
    incomplete,
    toVerify: !incomplete && summaries.some(isToVerifySummary),
  };
}
