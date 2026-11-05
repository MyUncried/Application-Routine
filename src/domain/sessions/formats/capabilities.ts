/**
 * PRE-9 (story D.3, ch11 l.315, ch12 l.1824-1834, FMT-01 à FMT-40, ARB-03) — descripteurs de
 * capacités d'exécution des modèles de la fenêtre Formats, appliqués à leur élément porteur (Exercice
 * autonome ou Circuit porteur depuis le 02/11/2026 ; ou des éléments libres). [« douze modèles » et
 * « Exercice formaté seul (D-02) » — remplacés le 02/11/2026.]
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
 * Réalignement du 02/11/2026 (référence Formats §1, §9, FMT-01) : Tabata et les départs rapides sont
 * des préconfigurations standards (éléments libres) ; les quatre Formats spécialisés sont portés par
 * l'Exercice autonome ou par le Circuit porteur. Les questions de rang et de fin du Death by alterné
 * sont tranchées (A2 : Circuit porteur, arrêt collectif au premier échec).
 *
 * Fonctions pures, sans React ni SQLite.
 */

import { type ElementFormatKey, type PreconfigurationKey } from "./registry";

export type CapabilityModelKey = ElementFormatKey | PreconfigurationKey | "FREE";

export const UNDEFINED_CAPABILITY = "NON_DEFINI" as const;
type Undefined = { readonly status: typeof UNDEFINED_CAPABILITY; readonly question: string };
type Maybe<T> = T | Undefined;

/** Porteur : éléments libres (aucun Format porté, FMT-28) ou Exercice autonome / Circuit porteur (FMT-01, 02/11/2026). */
export type CapabilityCarrier = "FREE_ELEMENTS" | "EXERCISE_OR_CIRCUIT";

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
  | "ACQUIRED_ROUNDS_AND_PARTIAL_REPETITIONS"
  /** Complément du 5 novembre 2026 (Hermann), §13 : Death by arrêté avant un rang dont le travail prévu ne tient pas dans sa fenêtre (« limite de l'intervalle atteinte »). */
  | "INTERVAL_LIMIT_REACHED";

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
  /**
   * Mise à jour consolidée des écrans Formats du 04/11/2026 (§6 bis 2, §6 quater bis) — besoins de configuration
   * que le moteur PRE-10/11 devra lire (descriptif, aucune exécution) : Rôles admis dans le Circuit porteur
   * (zones ordonnées, plusieurs buy-in/out, une seule exécution), Condition d'arrêt admise d'un buy-in, saisie
   * différée du résultat d'un buy-in à l'échec, Modes admis des membres, incrément par tour dans l'unité de
   * l'objectif, charges lues par série dans l'instantané (jamais recalculées).
   */
  readonly configuration?: {
    readonly roles: readonly ("BUY_IN" | "TOUR" | "BUY_OUT")[];
    readonly buyInStop: readonly ("TARGET" | "FAILURE")[];
    readonly buyInResult: "AT_FIRST_BLOCK_CLOSE" | "NOT_APPLICABLE";
    readonly memberModes: readonly ("REPETITIONS" | "DURATION")[];
    readonly incrementUnit: "OBJECTIVE" | "NOT_APPLICABLE";
    readonly loads: "PER_SERIES_FROM_SNAPSHOT";
  };
  /**
   * Complément du 5 novembre 2026 (Hermann) — prescriptions que le moteur PRE-10/11 devra lire (descriptif, aucune exécution) : EMOM, objectifs et charges
   * effectifs par série, aucun incrément ; AMRAP, incrément signé et objectif calculé borné à 1 ; Death by, Répétitions ou
   * Durée, incrément ≥ + 1 dans l'unité, arrêt avant un rang incompatible (`deathByLimit.ts`).
   */
  readonly prescription?: {
    readonly memberModes?: readonly ("REPETITIONS" | "DURATION")[];
    readonly perSeries?: true;
    readonly increment?: "SIGNED_FLOOR_ONE" | "POSITIVE_MIN_ONE" | "NONE";
    readonly intervalLimit?: "STOP_BEFORE_INCOMPATIBLE_RANK";
  };
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
  // Préconfigurations standards (référence du 02/11, §9, FMT-10, FMT-19) : éléments libres.
  TABATA: freeModel("TABATA"),
  INTERVALS_30_30: freeModel("INTERVALS_30_30"),
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
    prescription: { memberModes: ["REPETITIONS", "DURATION"], perSeries: true, increment: "NONE" },
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
    prescription: { increment: "SIGNED_FLOOR_ONE" },
    undefinedAspects: [{ status: UNDEFINED_CAPABILITY, question: "Tour partiel à l'échéance (A6, PRE-11)." }, NEXT_AFTER_PROGRESSIVE],
    executionAvailable: false,
    // MAJ 04/11 §6 bis 2 : buy-in pris sur le premier bloc, « Terminé » lance la boucle sans saisie intercalée.
    configuration: { roles: ["BUY_IN", "TOUR"], buyInStop: ["TARGET", "FAILURE"], buyInResult: "AT_FIRST_BLOCK_CLOSE", memberModes: ["REPETITIONS", "DURATION"], incrementUnit: "OBJECTIVE", loads: "PER_SERIES_FROM_SNAPSHOT" },
    sources: ["FMT-26", "REC-15", "ch12 l.1829", "ARB-03", "recherche/03-formats §1.4"],
  },
  FOR_TIME: {
    model: "FOR_TIME",
    carrier: "EXERCISE_OR_CIRCUIT",
    expansion: "FINITE",
    timeReferences: ["ELEMENT_STOPWATCH", "STEP", "PHASES"],
    triggers: ["TARGET_REACHED", "NEXT"],
    // Référence du 02/11/2026 (§11, FMT-32, D-21) : temps limite facultatif ; atteint, il arrête l'élément
    // avec un résultat incomplet, sans finir la Séance. L'étape en cours à cet instant n'est pas décrite.
    onExpiry: {
      status: UNDEFINED_CAPABILITY,
      question: "Étape en cours lorsque le temps limite facultatif du For time est atteint (élément arrêté, résultat incomplet ; détail PRE-10/11).",
    },
    end: "WORK_ACCOMPLISHED",
    progression: "FIXED",
    results: [...GENERIC_RESULTS, "ELAPSED_TIME"],
    undefinedAspects: [],
    executionAvailable: false,
    // MAJ 04/11 §6 bis 2 : buy-in et buy-out à l'objectif ; une durée fixe s'ajoute au chrono ; au moins un Exercice
    // de l'ensemble du Circuit en Répétitions.
    configuration: { roles: ["BUY_IN", "TOUR", "BUY_OUT"], buyInStop: ["TARGET"], buyInResult: "NOT_APPLICABLE", memberModes: ["REPETITIONS", "DURATION"], incrementUnit: "NOT_APPLICABLE", loads: "PER_SERIES_FROM_SNAPSHOT" },
    sources: ["FMT-30…32", "ARB-18b", "recherche/03-formats §1.4"],
  },
  DEATH_BY: {
    model: "DEATH_BY",
    carrier: "EXERCISE_OR_CIRCUIT",
    expansion: "PROGRESSIVE",
    timeReferences: ["ELEMENT_WINDOW", "WINDOW_RANK_FROM_CLOCK"],
    triggers: ["WINDOW_DEADLINE", "WORK_DONE_TAP", "DECLARED_STOP"],
    onExpiry: "WINDOW_WITHOUT_TAP_NOT_ACQUIRED",
    end: "DECLARED_STOP",
    progression: "DYNAMIC_TARGET",
    results: [...GENERIC_RESULTS, "ACQUIRED_ROUNDS_AND_PARTIAL_REPETITIONS", "INTERVAL_LIMIT_REACHED"],
    prescription: { memberModes: ["REPETITIONS", "DURATION"], increment: "POSITIVE_MIN_ONE", intervalLimit: "STOP_BEFORE_INCOMPATIBLE_RANK" },
    undefinedAspects: [
      { status: UNDEFINED_CAPABILITY, question: "Suite après une fenêtre non acquise (A4)." },
      NEXT_AFTER_PROGRESSIVE,
    ],
    executionAvailable: false,
    // 02/11 (A2, §6.1, §12) : un Death by autonome rejoué dans un Circuit groupé repart de son départ initial et
    // finit localement ; le Death by alterné est porté par le Circuit, arrêt collectif au premier échec.
    sources: ["FMT-33…38", "§12", "A2", "§6.1", "D-368", "CE-FMT-05 §15", "ch05 l.484", "D-16", "D-18", "D-29", "recherche/03-formats §1.4"],
  },
  STRENGTH: freeModel("STRENGTH"),
  SUPERSET: freeModel("SUPERSET"),
  PROGRESSION: freeModel("PROGRESSION"),
  UNTIL_FAILURE: freeModel("UNTIL_FAILURE"),
  FREE: freeModel("FREE"),
};

export function formatCapabilitiesOf(model: CapabilityModelKey): FormatCapabilityDescriptor {
  return FORMAT_CAPABILITIES[model];
}
