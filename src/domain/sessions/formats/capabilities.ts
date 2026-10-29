/**
 * PRE-9 (story D.3, ch11 l.315, ch12 l.1824-1834, FMT-01 à FMT-40, ARB-03) — descripteurs de
 * capacités d'exécution des douze modèles de la grille, appliqués à leur élément porteur.
 *
 * Donnée documentaire sourcée, **sans logique d'exécution** : ce que le futur moteur (PRE-10,
 * PRE-11) devra savoir faire pour chaque modèle. Toute capacité que les sources ne définissent pas
 * porte `"NON_DEFINI"` et la référence de la question, jamais une valeur supposée. Source de la
 * table : `_bmad-output/pre9/planning-artifacts/recherche/03-formats.md` §1.4 et
 * `architecture-pre9.md` §7 ; table commentée dans `spec-d-3-descripteurs-capacites.md`.
 *
 * `executionAvailable` est faux pour tout modèle en PRE-9 : aucun moteur spécialisé n'existe
 * (« Ne pas implémenter le moteur d'exécution spécialisé dans PRE-9 »). La disponibilité du moteur
 * est distincte de la validité de configuration (D.4).
 *
 * Fonctions pures, sans React ni SQLite.
 */

import { type ElementFormatKey, type QuickStartKey } from "./registry";

export type CapabilityModelKey = ElementFormatKey | QuickStartKey | "FREE";

export const UNDEFINED_CAPABILITY = "NON_DEFINI" as const;
type Undefined = { readonly status: typeof UNDEFINED_CAPABILITY; readonly question: string };
type Maybe<T> = T | Undefined;

/** Porteur : élément libre (aucun Format porté, FMT-28) ou élément formaté (ARB-03). */
export type CapabilityCarrier = "FREE_ELEMENTS" | "EXERCISE_OR_CIRCUIT" | "EXERCISE";

/** Plan fini (développé par D.1) ou progressif (segment, borne de l'élément). */
export type CapabilityExpansion = "FINITE" | "PROGRESSIVE";

/** Références temporelles nécessaires (A2). */
export type TimeReference =
  | "STEP"
  | "PHASES"
  | "SERIES_PAUSE"
  | "ELEMENT_WINDOW"
  | "ELEMENT_DEADLINE"
  | "ELEMENT_STOPWATCH"
  | "WINDOW_RANK_FROM_CLOCK";

export type CapabilityTrigger =
  | "TARGET_REACHED"
  | "NEXT"
  | "STEP_DEADLINE"
  | "WINDOW_DEADLINE"
  | "WORK_DONE_TAP"
  | "ELEMENT_BOUND"
  | "DECLARED_STOP";

/** Comportement à l'expiration d'une échéance pendant une étape (A4), lorsqu'il est défini. */
export type ExpiryBehaviour = "STEP_ENDS" | "NEXT_WINDOW_STARTS_NO_INVENTED_REST" | "WINDOW_WITHOUT_TAP_NOT_ACQUIRED";

export type CapabilityEnd = "PLAN_COMPLETED" | "ELEMENT_COMPLETED" | "LAST_WINDOW" | "ELEMENT_BOUND" | "WORK_ACCOMPLISHED" | "DECLARED_STOP";

export type CapabilityProgression = "FIXED" | "CONTENT_REPEATED" | "DYNAMIC_TARGET";

/** Résultats pertinents (A6) : axes génériques (motif, résultat, achèvement) et résultats propres. */
export type CapabilityResult =
  | "END_REASON"
  | "ACHIEVED_RESULT"
  | "COMPLETION_LEVEL"
  | "ROUNDS_COMPLETED"
  | "ELAPSED_TIME"
  | "ACQUIRED_ROUNDS_AND_PARTIAL_REPETITIONS";

export type FormatCapabilityDescriptor = {
  readonly model: CapabilityModelKey;
  readonly carrier: CapabilityCarrier;
  readonly expansion: CapabilityExpansion;
  readonly timeReferences: readonly TimeReference[];
  readonly triggers: readonly CapabilityTrigger[];
  readonly onExpiry: Maybe<ExpiryBehaviour | "NOT_APPLICABLE">;
  readonly end: CapabilityEnd;
  readonly progression: CapabilityProgression;
  readonly results: readonly CapabilityResult[];
  /** Points non définis propres au modèle (en plus de `onExpiry`), avec leur question. */
  readonly undefinedAspects: readonly Undefined[];
  readonly executionAvailable: false;
  readonly sources: readonly string[];
};

const GENERIC_RESULTS: readonly CapabilityResult[] = ["END_REASON", "ACHIEVED_RESULT", "COMPLETION_LEVEL"];

/** Commun AMRAP et Death by sous ARB-03 : suite de la Séance après l'élément (`arbitrages-pre9.md` §3, A4). */
const NEXT_AFTER_PROGRESSIVE: Undefined = {
  status: UNDEFINED_CAPABILITY,
  question: "Suite de la Séance après la fin de l'élément lorsqu'il est suivi d'autres éléments (A4, avant PRE-11).",
};

const freeModel = (model: CapabilityModelKey): FormatCapabilityDescriptor => ({
  model,
  carrier: "FREE_ELEMENTS",
  expansion: "FINITE",
  timeReferences: ["STEP", "PHASES", "SERIES_PAUSE"],
  triggers: ["TARGET_REACHED", "NEXT", "STEP_DEADLINE"],
  onExpiry: "STEP_ENDS",
  end: "PLAN_COMPLETED",
  progression: "FIXED",
  results: GENERIC_RESULTS,
  undefinedAspects: [],
  executionAvailable: false,
  sources: ["FMT-28", "ch08 l.504-560", "recherche/03-formats §1.4"],
});

export const FORMAT_CAPABILITIES: Readonly<Record<CapabilityModelKey, FormatCapabilityDescriptor>> = {
  TABATA: {
    model: "TABATA",
    carrier: "EXERCISE_OR_CIRCUIT",
    expansion: "FINITE",
    timeReferences: ["STEP", "SERIES_PAUSE"],
    triggers: ["STEP_DEADLINE"],
    onExpiry: "STEP_ENDS",
    end: "ELEMENT_COMPLETED",
    progression: "FIXED",
    results: GENERIC_RESULTS,
    undefinedAspects: [{ status: UNDEFINED_CAPABILITY, question: "Résultat spécifique d'un Tabata partiel (au-delà des statuts génériques)." }],
    executionAvailable: false,
    sources: ["FMT-10…18", "ch12 l.1828", "ARB-25", "recherche/03-formats §1.4"],
  },
  INTERVALS_30_30: {
    model: "INTERVALS_30_30",
    carrier: "EXERCISE_OR_CIRCUIT",
    expansion: "FINITE",
    timeReferences: ["STEP", "SERIES_PAUSE"],
    triggers: ["STEP_DEADLINE"],
    onExpiry: "STEP_ENDS",
    end: "ELEMENT_COMPLETED",
    progression: "FIXED",
    results: GENERIC_RESULTS,
    undefinedAspects: [{ status: UNDEFINED_CAPABILITY, question: "Résultat spécifique d'un 30/30 partiel (au-delà des statuts génériques)." }],
    executionAvailable: false,
    sources: ["FMT-19", "FMT-27", "ARB-18a", "recherche/03-formats §1.4"],
  },
  EMOM: {
    model: "EMOM",
    carrier: "EXERCISE_OR_CIRCUIT",
    expansion: "FINITE",
    timeReferences: ["ELEMENT_WINDOW", "STEP", "PHASES"],
    triggers: ["WINDOW_DEADLINE", "WORK_DONE_TAP"],
    onExpiry: "NEXT_WINDOW_STARTS_NO_INVENTED_REST",
    end: "LAST_WINDOW",
    progression: "FIXED",
    results: GENERIC_RESULTS,
    undefinedAspects: [
      { status: UNDEFINED_CAPABILITY, question: "Résultat d'une fenêtre non terminée (A6, PRE-11)." },
      { status: UNDEFINED_CAPABILITY, question: "Coexistence de la fenêtre avec une série Durée, des phases ou des côtés (A2, R-02)." },
    ],
    executionAvailable: false,
    sources: ["FMT-20…25", "REC-13", "ch12 l.1829", "recherche/03-formats §1.4"],
  },
  AMRAP: {
    model: "AMRAP",
    carrier: "EXERCISE_OR_CIRCUIT",
    expansion: "PROGRESSIVE",
    timeReferences: ["ELEMENT_DEADLINE", "STEP", "PHASES"],
    triggers: ["ELEMENT_BOUND", "TARGET_REACHED", "NEXT"],
    onExpiry: { status: UNDEFINED_CAPABILITY, question: "Étape en cours à l'échéance de l'élément (A4, PRE-11)." },
    end: "ELEMENT_BOUND",
    progression: "CONTENT_REPEATED",
    results: [...GENERIC_RESULTS, "ROUNDS_COMPLETED"],
    undefinedAspects: [{ status: UNDEFINED_CAPABILITY, question: "Tour partiel à l'échéance (A6, PRE-11)." }, NEXT_AFTER_PROGRESSIVE],
    executionAvailable: false,
    sources: ["FMT-26", "REC-15", "ch12 l.1829", "ARB-03", "recherche/03-formats §1.4"],
  },
  FOR_TIME: {
    model: "FOR_TIME",
    carrier: "EXERCISE_OR_CIRCUIT",
    expansion: "FINITE",
    timeReferences: ["ELEMENT_STOPWATCH", "STEP", "PHASES"],
    triggers: ["TARGET_REACHED", "NEXT"],
    // Aucune limite de temps dans les sources : aucune échéance n'expire.
    onExpiry: "NOT_APPLICABLE",
    end: "WORK_ACCOMPLISHED",
    progression: "FIXED",
    results: [...GENERIC_RESULTS, "ELAPSED_TIME"],
    undefinedAspects: [],
    executionAvailable: false,
    sources: ["FMT-30…32", "ARB-18b", "recherche/03-formats §1.4"],
  },
  DEATH_BY: {
    model: "DEATH_BY",
    // Plusieurs Exercices : réservé (R-03, ch05 l.484).
    carrier: "EXERCISE",
    expansion: "PROGRESSIVE",
    timeReferences: ["ELEMENT_WINDOW", "WINDOW_RANK_FROM_CLOCK"],
    triggers: ["WINDOW_DEADLINE", "WORK_DONE_TAP", "DECLARED_STOP"],
    onExpiry: "WINDOW_WITHOUT_TAP_NOT_ACQUIRED",
    end: "DECLARED_STOP",
    progression: "DYNAMIC_TARGET",
    results: [...GENERIC_RESULTS, "ACQUIRED_ROUNDS_AND_PARTIAL_REPETITIONS"],
    undefinedAspects: [
      { status: UNDEFINED_CAPABILITY, question: "Suite après une fenêtre non acquise (A4)." },
      { status: UNDEFINED_CAPABILITY, question: "Death by à plusieurs Exercices (R-03)." },
      NEXT_AFTER_PROGRESSIVE,
    ],
    executionAvailable: false,
    sources: ["FMT-33…38", "D-368", "CE-FMT-05 §15", "ch05 l.484", "recherche/03-formats §1.4"],
  },
  STRENGTH: freeModel("STRENGTH"),
  CORE_MOBILITY: freeModel("CORE_MOBILITY"),
  SUPERSET: freeModel("SUPERSET"),
  PROGRESSION: freeModel("PROGRESSION"),
  UNTIL_FAILURE: freeModel("UNTIL_FAILURE"),
  FREE: freeModel("FREE"),
};

export function formatCapabilitiesOf(model: CapabilityModelKey): FormatCapabilityDescriptor {
  return FORMAT_CAPABILITIES[model];
}
