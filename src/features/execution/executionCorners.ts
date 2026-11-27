/**
 * Quatre coins du chronomètre — D-529 et contrat CE-UI-14 (Hermann, 18/11/2026 : « ne pas déplacer une information d'un type
 * d'exercice à l'autre » ; « oui » aux emplacements proposés). Source unique de l'écran d'exécution : l'écran ne place aucune
 * information de coin en dehors de cette table.
 *
 * Règle : une information, un coin, dans tous les formats ; un coin vide reste vide, les autres ne se décalent pas.
 * Haut gauche : objectif. Haut droite : limite de temps. Bas gauche : charge. Bas droite : information dynamique.
 * Ni le rang de la fenêtre ni l'incrément ne sont affichés (CE-UI-14 §3) ; les tours acquis figurent dans le bouton « +Tour ».
 */

export type CornerSlot = "TOP_LEFT" | "TOP_RIGHT" | "BOTTOM_LEFT" | "BOTTOM_RIGHT";

/**
 * Informations de coin.
 * - `OBJECTIVE` : objectif (répétitions ou durée de la Série, durée de la pause ou de la récupération, durée de la phase Tabata /
 *   30-30, objectif du tour en For time, du mouvement en AMRAP, du rang en Death by).
 * - `TIME_LIMIT` : limite de temps (temps max du For time, temps limite du bloc AMRAP, intervalle EMOM et Death by), valeur fixe.
 * - `LOAD` : charge ; pendant une pause ou une récupération, charge de la série suivante.
 * - `MOVEMENT_COUNT` : nombre de mouvements faits d'après le guidage des phases.
 * - `REST_COUNTDOWN` : compte à rebours du repos (EMOM en répétitions uniquement).
 * - `SCORE` : score cumulé (AMRAP à un seul mouvement en Max, D-531 / RM-272 : somme des séries saisies).
 * - `SERIES_COUNTDOWN` : compte à rebours d'une Série en Durée active d'un Format (For time, AMRAP, EMOM en durée, Death by quand la
 *   projection l'expose). Complément D-529 / CE-UI-14 validé par Hermann le 26/11/2026 : information dynamique **en bas à droite**,
 *   exclusive des autres informations dynamiques de ce coin ; la charge reste en bas à gauche. [Bas à gauche, exclusif de la charge
 *   (17/11/2026, ft-borne ; 18/11/2026, emom-6 et emom-e1 ; rapport 2026-11-19_COINS-CHRONO-D529) — remplacé le 26/11/2026.]
 */
export type CornerItem = "OBJECTIVE" | "TIME_LIMIT" | "LOAD" | "MOVEMENT_COUNT" | "REST_COUNTDOWN" | "SCORE" | "SERIES_COUNTDOWN";

/** Scénarios de CE-UI-14 §2. */
export type CornerScenario =
  | "EXERCISE_REPETITIONS"
  | "EXERCISE_PHASES"
  | "PAUSE"
  | "FOR_TIME"
  | "AMRAP"
  | "AMRAP_MAX"
  | "EMOM_REPETITIONS"
  | "EMOM_DURATION"
  | "DEATH_BY"
  | "TABATA";

/** Coin fixe de chaque information, identique dans tous les formats. */
export const CORNER_OF: Readonly<Record<CornerItem, CornerSlot>> = {
  OBJECTIVE: "TOP_LEFT",
  TIME_LIMIT: "TOP_RIGHT",
  LOAD: "BOTTOM_LEFT",
  SERIES_COUNTDOWN: "BOTTOM_RIGHT",
  MOVEMENT_COUNT: "BOTTOM_RIGHT",
  REST_COUNTDOWN: "BOTTOM_RIGHT",
  SCORE: "BOTTOM_RIGHT",
};

type Row = Readonly<Record<CornerSlot, readonly CornerItem[]>>;

/**
 * Tableau de CE-UI-14 §2 : scénario → coin → information(s), dans l'ordre de priorité quand deux informations exclusives partagent
 * un coin. Le nombre de mouvements reste au bas à droite quand il existe et que le coin est libre (D-529 : « Bas droite : nombre de
 * mouvements pendant l'effort ») ; il n'existe aujourd'hui que pour une Série en répétitions guidée par des phases.
 * Bas à droite (complément D-529 du 26/11/2026) : une seule information dynamique, celle de l'étape active, dans l'ordre de la liste.
 */
export const CORNER_TABLE: Readonly<Record<CornerScenario, Row>> = {
  // Exercice en répétitions : objectif répétitions | — | charge | —
  EXERCISE_REPETITIONS: { TOP_LEFT: ["OBJECTIVE"], TOP_RIGHT: [], BOTTOM_LEFT: ["LOAD"], BOTTOM_RIGHT: [] },
  // Exercice avec phases : objectif | — | charge | nombre de mouvements
  EXERCISE_PHASES: { TOP_LEFT: ["OBJECTIVE"], TOP_RIGHT: [], BOTTOM_LEFT: ["LOAD"], BOTTOM_RIGHT: ["MOVEMENT_COUNT"] },
  // Pause ou récupération : durée de la pause | — | charge de la série suivante | —
  PAUSE: { TOP_LEFT: ["OBJECTIVE"], TOP_RIGHT: [], BOTTOM_LEFT: ["LOAD"], BOTTOM_RIGHT: [] },
  // For time : objectif du tour | temps max si défini | charge | décompte de Série en Durée actif ; sinon compteur guidé ; sinon —
  FOR_TIME: { TOP_LEFT: ["OBJECTIVE"], TOP_RIGHT: ["TIME_LIMIT"], BOTTOM_LEFT: ["LOAD"], BOTTOM_RIGHT: ["SERIES_COUNTDOWN", "MOVEMENT_COUNT"] },
  // AMRAP : objectif du mouvement | temps limite du bloc | charge | décompte de Série en Durée actif ; sinon compteur guidé ; sinon —
  AMRAP: { TOP_LEFT: ["OBJECTIVE"], TOP_RIGHT: ["TIME_LIMIT"], BOTTOM_LEFT: ["LOAD"], BOTTOM_RIGHT: ["SERIES_COUNTDOWN", "MOVEMENT_COUNT"] },
  // AMRAP à un seul mouvement en Max : — | temps limite du bloc | charge | score cumulé
  AMRAP_MAX: { TOP_LEFT: [], TOP_RIGHT: ["TIME_LIMIT"], BOTTOM_LEFT: ["LOAD"], BOTTOM_RIGHT: ["SCORE"] },
  // EMOM en répétitions : objectif répétitions | intervalle | charge | compte à rebours du repos
  EMOM_REPETITIONS: { TOP_LEFT: ["OBJECTIVE"], TOP_RIGHT: ["TIME_LIMIT"], BOTTOM_LEFT: ["LOAD"], BOTTOM_RIGHT: ["REST_COUNTDOWN", "MOVEMENT_COUNT"] },
  // EMOM en durée : objectif durée | intervalle | charge | décompte de Série en Durée actif ; sinon — (repos en secondaire au centre,
  // D-528). Aucun compteur « mouv. » n'est produit pour une Série en Durée (`autoRepetitionsOf`) ; le repli `MOVEMENT_COUNT` ne sert
  // qu'à une Série en Répétitions guidée par phases jouée dans une fenêtre qui porte aussi une Série en Durée (comportement conservé).
  EMOM_DURATION: { TOP_LEFT: ["OBJECTIVE"], TOP_RIGHT: ["TIME_LIMIT"], BOTTOM_LEFT: ["LOAD"], BOTTOM_RIGHT: ["SERIES_COUNTDOWN", "MOVEMENT_COUNT"] },
  // Death by : objectif du rang | intervalle | charge | décompte de Série en Durée (la projection l'expose) ; sinon compteur guidé ; sinon —
  DEATH_BY: { TOP_LEFT: ["OBJECTIVE"], TOP_RIGHT: ["TIME_LIMIT"], BOTTOM_LEFT: ["LOAD"], BOTTOM_RIGHT: ["SERIES_COUNTDOWN", "MOVEMENT_COUNT"] },
  // Tabata / 30-30 : durée de la phase | — | charge | —
  TABATA: { TOP_LEFT: ["OBJECTIVE"], TOP_RIGHT: [], BOTTOM_LEFT: ["LOAD"], BOTTOM_RIGHT: [] },
};

export type CornerAssignment = Readonly<Record<CornerSlot, CornerItem | null>>;

const SLOTS: readonly CornerSlot[] = ["TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT"];

/** Affectation des coins d'un scénario d'après les informations disponibles : au plus une par coin, coin vide sinon. */
export function assignCorners(scenario: CornerScenario, available: ReadonlySet<CornerItem>): CornerAssignment {
  const row = CORNER_TABLE[scenario];
  const out: Record<CornerSlot, CornerItem | null> = { TOP_LEFT: null, TOP_RIGHT: null, BOTTOM_LEFT: null, BOTTOM_RIGHT: null };
  for (const slot of SLOTS) out[slot] = row[slot].find((item) => available.has(item)) ?? null;
  return out;
}

/** Position d'un coin pour `ExecutionCornerBadge`. */
export function badgePlacement(slot: CornerSlot): { readonly side: "left" | "right"; readonly vertical: "top" | "bottom" } {
  return {
    side: slot === "TOP_LEFT" || slot === "BOTTOM_LEFT" ? "left" : "right",
    vertical: slot === "TOP_LEFT" || slot === "TOP_RIGHT" ? "top" : "bottom",
  };
}

/** Données de l'écran utiles au choix du scénario. */
export type CornerScenarioInput = {
  readonly formatKind: "FOR_TIME" | "EMOM" | "AMRAP" | "DEATH_BY" | null;
  readonly formatWork: boolean;
  /** D-531 / RM-272 : AMRAP à un seul mouvement en Max (score cumulé en bas à droite). Absent : non. */
  readonly amrapMax?: boolean;
  readonly emomTimed: boolean;
  readonly pauseOrRecovery: boolean;
  readonly guided: boolean;
};

/** Scénario de CE-UI-14 d'une étape. Tabata / 30-30 s'exécutent en Séries en durée et Pauses : mêmes coins (`TABATA` = `EXERCISE_*`). */
export function cornerScenarioOf(input: CornerScenarioInput): CornerScenario {
  if (input.formatKind !== null && input.formatWork) {
    if (input.formatKind === "FOR_TIME") return "FOR_TIME";
    if (input.formatKind === "AMRAP") return input.amrapMax === true ? "AMRAP_MAX" : "AMRAP";
    if (input.formatKind === "DEATH_BY") return "DEATH_BY";
    return input.emomTimed ? "EMOM_DURATION" : "EMOM_REPETITIONS";
  }
  if (input.pauseOrRecovery) return "PAUSE";
  return input.guided ? "EXERCISE_PHASES" : "EXERCISE_REPETITIONS";
}
