/**
 * PRE-10 — projection de l'état d'Exécution pour l'interface (conception §16.2 ; CE-EXEC-SESSION-01 ;
 * RM-077, RM-126). Fonction pure : l'interface ne maintient aucun second compte à rebours métier ; la
 * commande disponible est dérivée de l'état, pas d'un compteur React local.
 *
 * Progression (RM-077, plans finis hors fenêtres de Formats) : M étapes contributives ; R Séries sans durée
 * déterminable (À l'échec, Répétitions chiffrées sans cadence) pesant 1/M chacune, acquises à Suivant ;
 * étapes temporelles de durée d (phases chronométrées positives, Ri×Ci des Répétitions cadencées) pesant
 * (1 − R/M) × d / T. Points d'arrêt et phases de 0 s : aucun poids. La Pause manuelle n'ajoute rien ; une
 * Série cadencée progresse par intervalles complets acquis. 100 % uniquement après la Fin de séance.
 */

import { phaseGuidanceAt, workPhasesCycleSeconds } from "@/domain/activities/phaseGuidance";
import type { SeriesTarget } from "@/domain/activities/ExecutionParameters";

import { leafElapsedMs, leafStepRef, leafTarget, needsNextConfirmation, resettable, runningMs, sessionStopwatch, type EngineState, type FinishReason, type Ms, type PauseReason } from "./kernel";
import { guidedPhases, type AmrapScopeConfig, type ChildSpec, type DeathByScopeConfig, type EmomScopeConfig, type ExecutablePlan, type ForTimeScopeConfig, type LeafKind, type LeafSpec } from "./plan";
import { AMRAP_PILOT, amrapLeafOf, amrapPendingDuration, isAmrapDurationLeaf, roundLeaves, segmentLeaves, type AmrapLocal } from "./policies/amrap";
import { DEATH_BY_PILOT, deathByLeafOf, windowLeaves, type DeathByLocal } from "./policies/deathBy";
import { bannerWindow, EMOM_PILOT, type EmomLocal } from "./policies/emom";
import { activityCount, FOR_TIME_PILOT, isDurationLeaf, pendingDurationOf, roundKeyOf, type ForTimeLocal } from "./policies/forTime";

export type TimerView =
  | { readonly kind: "COUNTDOWN"; readonly remainingMs: Ms; readonly totalMs: Ms; readonly elapsedMs: Ms }
  | { readonly kind: "STOPWATCH"; readonly elapsedMs: Ms; readonly nominalMs: Ms | null }
  | { readonly kind: "NONE" };

export type NextView = {
  readonly kind: LeafKind;
  readonly name: string | null;
  readonly plannedMs: Ms | null;
  readonly target: SeriesTarget | null;
  readonly mode: LeafSpec["mode"] | null;
  /** Série de l'étape suivante, affichée après le nom (recette PRE-10 du 09/11/2026). */
  readonly series: { readonly current: number; readonly total: number } | null;
  /** Côté de l'étape suivante (Série suivante du même côté : écran sans fondu, recette du 13/11/2026). */
  readonly sideRank: 1 | 2 | null;
};

/**
 * Liste des étapes de la Séance pendant l'Exécution — essai demandé par Hermann le 10/11/2026 (« besoin à
 * suivre » : en cours en gras, passé en gris puis effacé ; puis « Faire apparaître les pauses, etc. »), avant le
 * Figma cible. Une ligne par étape du plan (séries, pauses, récupérations, Point d'arrêt), sans le Compte à rebours
 * initial ni la Fin de séance (« Sauf compte à rebours et fin de séance ») ; les étapes antérieures à la
 * précédente sont retirées ; la précédente est « passée ».
 */
export type OutlineItem = {
  readonly key: string;
  readonly kind: LeafKind;
  readonly name: string | null;
  readonly series: { readonly current: number; readonly total: number } | null;
  readonly sideRank: 1 | 2 | null;
  readonly tour: { readonly current: number; readonly total: number } | null;
  /** Durée prévue d'une étape chronométrée ; `null` sinon. */
  readonly plannedMs: Ms | null;
  readonly status: "past" | "current" | "upcoming";
};

export type EstimatedDuration = { readonly kind: "exact" | "estimated" | "lowerBound"; readonly ms: Ms };

/**
 * Recette du 12/11/2026 (Hermann, e1b : « Il faut que les deux présentent le nombre de séries et de tours de l'exercice
 * à venir » ; e1f : « le titre de l'écran et l'écran entier, n'est pas point d'arrêt, mais l'exercice qui suit ») :
 * exercice à venir pendant le Compte à rebours initial et au Point d'arrêt ; `null` ailleurs. `after` : l'étape qui
 * le suit (« À suivre » au Point d'arrêt).
 */
export type UpcomingActivity = {
  readonly name: string | null;
  readonly series: { readonly current: number; readonly total: number } | null;
  readonly tour: { readonly current: number; readonly total: number } | null;
  /** Répétition du Cycle (D-451) ; `null` hors Cycle (recette du 13/11/2026). */
  readonly cycle: { readonly current: number; readonly total: number } | null;
  readonly sideRank: 1 | 2 | null;
  readonly mode: LeafSpec["mode"] | null;
  readonly target: SeriesTarget | null;
  readonly loadKg: number | null;
  /** Durée d'une étape chronométrée (compte à rebours) ; `null` sinon. */
  readonly timedMs: Ms | null;
  readonly after: NextView | null;
  /**
   * Partie d'un For time (recette du 17/11/2026, Hermann : « Pendant le compte à rebours initial, le contenu du cadre gris (séries /
   * tours) doit être déjà préparé pour l'exercice suivant. dans ce cas "Buy In" doit être affiché ») ; `null` hors buy-in et buy-out.
   */
  readonly segment: "BUY_IN" | "BUY_OUT" | null;
  /**
   * Recette EMOM du 18/11/2026 (emom-1, Hermann : « Bouton suivant pas conforme (couleur de fond, épaisseur du trait…) / Bouton Pause pas
   * conforme (taille doit rester « standard ») et doit être au format inactif ») : Format de l'élément à venir, pour que la barre de
   * commandes du Compte à rebours initial soit déjà celle du Format ; `null` hors Format.
   */
  readonly format: FormatView["kind"] | null;
};

export type Counters = {
  readonly series: { readonly current: number; readonly total: number } | null;
  readonly tour: { readonly current: number; readonly total: number } | null;
  readonly cycle: { readonly current: number; readonly total: number } | null;
};

/**
 * PRE-11 (T1) — élément formaté en cours. For time : temps réalisé (chronomètre de l'élément), borne facultative,
 * puis Clôture (D3) avec le temps réalisé figé et, si la borne a fermé un travail, ce travail à compléter.
 */
export type FormatView = {
  /**
   * PRE-11 (T2) : `EMOM` — les champs propres au For time y sont neutres (aucune borne, aucune commande « + Tour »).
   * PRE-11 (T3) : `AMRAP` — barre, commandes et exercices en durée du For time ; `capMs` est la durée du bloc (le grand chrono la
   * décompte), `elapsedMs` le temps écoulé du bloc.
   * PRE-11 (T4) : `DEATH_BY` — écran de l'EMOM (fenêtre du rang dans `emom`, sans bandeau), rang courant et rangs acquis dans
   * `deathBy`.
   */
  readonly kind: "FOR_TIME" | "EMOM" | "AMRAP" | "DEATH_BY";
  readonly name: string;
  readonly phase: "WORK" | "CLOSURE";
  readonly elapsedMs: Ms;
  readonly capMs: Ms | null;
  readonly capReached: boolean;
  readonly completedActivities: number;
  readonly totalActivities: number;
  /** Travail fermé par la borne (Clôture : répétitions faites à déclarer) ; `null` sinon. */
  readonly interrupted: { readonly name: string | null; readonly target: SeriesTarget | null; readonly mode: LeafSpec["mode"] | null } | null;
  /** Précision FT-15 (14/11/2026) : début de chaque étape en temps réalisé, et sa nature (segments de l'anneau). */
  readonly phaseStarts: readonly { readonly atMs: Ms; readonly kind: LeafSpec["kind"] }[];
  /**
   * Registre ch07, « For time — exécution : exercices en durée, « + Tour », sans Pause » (16/11/2026) ; Formats §11.1 :
   * exercice en durée du tour — à lancer après la Série en répétitions courante (`PENDING`), en cours (`RUNNING`) ou retenu
   * (`HELD`) — avec son compte à rebours ; `null` sans exercice en durée à lancer ou en cours (écran standard).
   */
  readonly duration: {
    readonly state: "PENDING" | "RUNNING" | "HELD";
    readonly name: string | null;
    readonly remainingMs: Ms;
    readonly totalMs: Ms;
  } | null;
  /**
   * Commande de droite (recette du 17/11/2026) : `NEXT` « Suivant » (buy-in, buy-out, exercice de la boucle avant le dernier du
   * tour), `ROUND` « + Tour » (dernier exercice du tour), `SUCCESS` (dernier exercice du For time) ; et partie en cours.
   * `null` hors travail (pause entre séries comprise : étape qui n'est pas un exercice).
   *
   * Mission du 17/11/2026 (Hermann, « Bouton de droite, par ordre de priorité ») : exercice en durée en cours (`duration`), le
   * bouton est affiché inactif — Succès au dernier exercice, Suivant au buy-in et au buy-out, « + Tour » dans les tours ; au dernier
   * exercice du dernier tour suivi d'un buy-out, « Suivant » compte le tour (`advance` `ROUND`).
   */
  readonly command: {
    readonly kind: "NEXT" | "ROUND" | "SUCCESS";
    readonly segment: "BUY_IN" | "ROUNDS" | "BUY_OUT";
    /** Effet de l'appui : étape suivante (`NEXT`) ou tour compté (`ROUND`, « + Tour » et Succès compris). */
    readonly advance: "NEXT" | "ROUND";
    /** L'exercice en cours est un exercice en durée : bouton inactif (fin à son terme). */
    readonly duration: boolean;
  } | null;
  /** PRE-11 (T2) : fenêtre EMOM en cours ; `null` hors EMOM. */
  readonly emom: EmomView | null;
  /** PRE-11 (T3) : bloc AMRAP en cours — tour en cours, tours acquis, bloc et nombre de blocs ; `null` hors AMRAP. */
  readonly amrap: { readonly round: number; readonly completedRounds: number; readonly block: number; readonly blocks: number } | null;
  /** PRE-11 (T4) : Death by en cours — rang courant et rangs entièrement acquis ; `null` hors Death by. */
  readonly deathBy: { readonly rank: number; readonly acquiredRanks: number } | null;
  /**
   * D-530 / RM-269 (Hermann, 18/11/2026) : l'étape en cours ouvre un tour du For time ou de l'AMRAP (premier exercice du tour, hors
   * buy-in et buy-out) — rang du tour et objectif de répétitions du tour qui démarre ; `repetitions` vaut `null` quand cet objectif
   * n'est pas un nombre unique (exercices du tour d'objectifs différents, ou en durée : cas non tranché, voir rapport). Absent ou
   * `null` ailleurs. Sert seulement à l'annonce des tours.
   */
  readonly roundStart?: RoundStart | null;
};

/** Début d'un tour (D-530) : rang (1 = premier) et objectif de répétitions commun du tour, `null` s'il n'est pas unique. */
export type RoundStart = { readonly rank: number; readonly repetitions: number | null };

/**
 * D-530 : objectif de répétitions d'un tour — le nombre commun à toutes ses Séries en Répétitions chiffrées ; `null` si une Série est
 * en durée, sans objectif chiffré, ou si les objectifs diffèrent.
 */
function roundRepetitions(leaves: readonly LeafSpec[]): number | null {
  const activities = leaves.filter((leaf) => leaf.kind === "ACTIVITY");
  if (activities.length === 0) return null;
  const values = new Set<number>();
  for (const leaf of activities) {
    if (leaf.mode !== "REPETITIONS" || leaf.target === undefined || leaf.target.kind !== "NUMBER") return null;
    values.add(leaf.target.value);
  }
  return values.size === 1 ? [...values][0]! : null;
}

/** Rang d'un tour du For time d'après sa clé (`roundKeyOf`) : `…#<k>` (alternance, à la suite) ou `…/s<k>` (une Série). */
function forTimeRoundRank(roundKey: string): number | null {
  const match = /#(\d+)$/.exec(roundKey) ?? /\/s(\d+)$/.exec(roundKey);
  return match === null ? null : Number(match[1]);
}

/** D-530 : l'étape `index` du For time ouvre-t-elle un tour (premier exercice du tour, hors buy-in et buy-out) ? */
function forTimeRoundStartOf(config: ForTimeScopeConfig, index: number): RoundStart | null {
  const current = config.items[index];
  if (current?.type !== "LEAF" || current.leaf.kind !== "ACTIVITY") return null;
  if (BUY_IN_KEY.test(current.leaf.key) || BUY_OUT_KEY.test(current.leaf.key)) return null;
  const round = roundKeyOf(current.leaf);
  const leaves = childLeaves(config.items).filter((leaf) => roundKeyOf(leaf) === round);
  if (leaves.find((leaf) => leaf.kind === "ACTIVITY") !== current.leaf) return null;
  const rank = forTimeRoundRank(round);
  return rank === null ? null : { rank, repetitions: roundRepetitions(leaves) };
}

/** D-530 : l'étape en cours de la boucle AMRAP ouvre-t-elle le tour `local.round` (premier exercice du tour) ? */
function amrapRoundStartOf(leaves: readonly LeafSpec[], local: AmrapLocal): RoundStart | null {
  if (local.segment !== "LOOP") return null;
  const current = leaves[local.index];
  if (current === undefined || current.kind !== "ACTIVITY") return null;
  if (leaves.slice(0, local.index).some((leaf) => leaf.kind === "ACTIVITY")) return null;
  return { rank: local.round, repetitions: roundRepetitions(leaves) };
}

/**
 * PRE-11 (T2) — EMOM (FMT-20 à FMT-25 ; Figma `8982:15709` « Exécution d'une séance — EMOM — repos déclaré ») : rang et nombre des
 * fenêtres, temps restant de la fenêtre (grand chrono), repos révélé par le travail terminé, et bandeau Q1 d'une fenêtre
 * précédente non terminée (répétitions faites à déclarer, valeur proposée 0).
 */
export type EmomView = {
  readonly window: number;
  readonly windows: number;
  readonly windowMs: Ms;
  readonly elapsedMs: Ms;
  readonly remainingMs: Ms;
  /** Travail de la fenêtre terminé : repos jusqu'à l'échéance. */
  readonly resting: boolean;
  /** Temps de la fenêtre à la fin du travail ; `null` avant (portion « travail » de l'anneau). */
  readonly workEndedMs: Ms | null;
  readonly banner: { readonly window: number; readonly name: string | null; readonly target: SeriesTarget | null } | null;
  /** Clôture : fenêtre dont les répétitions faites sont demandées ; `null` sinon. */
  readonly closingWindow: number | null;
  /**
   * Recette du 18/11/2026 (emom-6) : le travail de la fenêtre en cours est une Série en Durée (EMOM en durée : effort cumulé, retenue au
   * centre, repos à l'objectif). Toujours `false` hors EMOM.
   */
  readonly timedWork?: boolean;
};

export type ExecutionProjection = {
  readonly status: EngineState["status"];
  /** Élément formaté en cours (PRE-11) ; `null` hors Format. */
  readonly format: FormatView | null;
  readonly pauseReason: PauseReason | null;
  readonly finishReason: FinishReason | null;
  readonly sessionName: string;
  readonly phase: LeafKind | null;
  /** Étape visée par les commandes de l'interface (`clé#tentative`). */
  readonly target: string | null;
  readonly exerciseName: string | null;
  readonly series: { readonly current: number; readonly total: number } | null;
  readonly tour: { readonly current: number; readonly total: number } | null;
  /**
   * Répétition du Cycle en cours (D-451) ; `null` hors Cycle. Recette du 13/11/2026 (Hermann : « Il faut ajouter le
   * cycle et donc séparer le cadre en trois »).
   */
  readonly cycle: { readonly current: number; readonly total: number } | null;
  /**
   * Compteur automatique des répétitions faites en suivant le guidage des phases (cycles complets du motif) ; `null`
   * hors Répétitions guidées. Recette du 13/11/2026 (Hermann : « on peut ajouter un compteur automatique dans ce cas
   * puisqu'on est supposé suivre ce guidage »).
   */
  readonly autoRepetitions: number | null;
  /**
   * Recette du 13/11/2026 (Hermann : « En mode répétition, le bouton suivant doit être en fond bleu KODJO (symbole blanc)
   * dès le début de l'exercice, ou dès que l'objectif est atteint lorsqu'il y a des phases cadencées ou une cadence de
   * bip. Il reste toujours actif quelle que soit sa couleur. ») : Suivant mis en avant. Répétitions sans phases ni bip de
   * cadence : dès le début ; avec phases (ou bip de cadence) : dès que les répétitions guidées atteignent la cible chiffrée.
   */
  readonly nextHighlighted: boolean;
  /**
   * Recette du 13/11/2026 (Hermann : « Lorsqu'on a atteint une pause, une récupération ou un point d'arrêt, le nombre de
   * séries, de tours et de cycles ne doit pas changer, on reste exactement sur les valeurs qui existaient à l'issue de
   * l'exercice précédent ») : Série, Tour et Cycle de l'exercice qui vient de se terminer, pendant une pause, une
   * récupération, un repos ou au Point d'arrêt ; `null` ailleurs.
   */
  readonly previousCounters: Counters | null;
  /** Côté 1 ou côté 2 (RM-243) ; `null` sans changement de côté. */
  readonly sideRank: 1 | 2 | null;
  readonly mode: LeafSpec["mode"] | null;
  readonly seriesTarget: SeriesTarget | null;
  readonly loadKg: number | null;
  readonly timer: TimerView;
  /**
   * Phase guidée courante (motif de phases, D-446) ; `null` sans motif. `phaseMs` : durée de la phase, affichée
   * à la place de son décompte (recette e1 du 12/11/2026, Hermann : « Phases : montrer le texte le nombre de minutes /
   * secondes, mais pas le décompte »).
   */
  readonly guidance: { readonly label: string; readonly remainingMs: Ms; readonly phaseMs: Ms } | null;
  readonly next: NextView | null;
  readonly upcoming: UpcomingActivity | null;
  readonly outline: readonly OutlineItem[];
  readonly sessionElapsedMs: Ms;
  readonly estimated: EstimatedDuration;
  /** 0..1 (RM-077). */
  readonly progress: number;
  readonly commands: {
    readonly reset: boolean;
    /** « Réinitialiser la récupération » pendant une pause ou une récupération (CE §Commandes principales). */
    readonly resetScope: "EXERCISE" | "RECOVERY";
    readonly pause: boolean;
    readonly next: boolean;
    /** Suivant demande confirmation : étape chronométrée avant son terme (ch08). */
    readonly nextNeedsConfirmation: boolean;
    /** Le bouton Suivant vaut « Continuer » (Point d'arrêt). */
    readonly isContinue: boolean;
  };
};

/** Étapes d'une liste d'enfants dans l'ordre d'exécution, portées de Format comprises (PRE-11). */
function childLeaves(items: readonly ChildSpec[]): LeafSpec[] {
  return items.flatMap((item: ChildSpec) => (item.type === "LEAF" ? [item.leaf] : childLeaves((item.scope.config as { items?: readonly ChildSpec[] } | null)?.items ?? [])));
}

type PlanIndex = { readonly leaves: readonly LeafSpec[]; readonly index: ReadonlyMap<string, number> };

const LEAVES = new WeakMap<ExecutablePlan, PlanIndex>();

function planIndex(plan: ExecutablePlan): PlanIndex {
  const known = LEAVES.get(plan);
  if (known !== undefined) return known;
  const leaves = childLeaves(plan.items);
  const computed: PlanIndex = { leaves, index: new Map(leaves.map((leaf, position) => [leaf.key, position] as const)) };
  LEAVES.set(plan, computed);
  return computed;
}

function rootLeaves(plan: ExecutablePlan): readonly LeafSpec[] {
  return planIndex(plan).leaves;
}

/**
 * Position de l'étape courante dans les étapes du plan : `index` (étape affichée comme courante) et `passed`
 * (étapes entièrement passées). Pendant la Clôture d'un Format, l'étape courante est le dernier travail de
 * l'élément, déjà passé.
 */
function positionOf(plan: ExecutablePlan, state: EngineState): { readonly index: number; readonly passed: number } {
  const { leaves, index } = planIndex(plan);
  const leaf = state.leaf;
  if (leaf !== null) {
    // PRE-11 (T3) : une étape d'un tour de boucle AMRAP est indexée par son étape-modèle.
    const at = index.get(leaf.spec.key) ?? (leaf.spec.loopOf === undefined ? undefined : index.get(leaf.spec.loopOf));
    if (at !== undefined) return { index: at, passed: at };
    if (leaf.spec.kind === "CLOSURE") {
      // PRE-11 (T2) : Clôture EMOM, une par fenêtre (`<portée>/closure/f<rang>`).
      const scope = [...state.frames].reverse().find((frame) => leaf.spec.key === `${frame.spec.key}/closure` || leaf.spec.key.startsWith(`${frame.spec.key}/closure/`));
      const items = (scope?.spec.config as { items?: readonly ChildSpec[] } | undefined)?.items ?? [];
      const inner = childLeaves(items);
      const last = inner.length === 0 ? undefined : index.get(inner[inner.length - 1]!.key);
      if (last !== undefined) return { index: last, passed: last + 1 };
    }
  }
  // Sans étape (fin) : premier enfant non encore ouvert de la Séance.
  const root = state.frames[0];
  const rootPosition = root === undefined ? 0 : ((root.local as { index?: number } | null)?.index ?? 0);
  const start = childLeaves(plan.items.slice(0, rootPosition)).length;
  return { index: Math.min(start, Math.max(0, leaves.length - 1)), passed: start };
}

/** Étape sans durée déterminable : Séries manuelles sans cadence ou À l'échec (R de RM-077). */
function isUntimedSeries(leaf: LeafSpec): boolean {
  // PRE-11 (T2) : une étape de fenêtre EMOM ne pèse rien ; la fenêtre pèse par son repos (durée de la fenêtre).
  if (leaf.inWindow === true || leaf.inBlock === true) return false;
  return leaf.kind === "ACTIVITY" && leaf.end === "MANUAL" && !(leaf.cadenceMs !== undefined && leaf.target?.kind === "NUMBER" && leaf.plannedMs !== null);
}

/**
 * Recette du 14/11/2026 (Hermann : « Barre de progression : elle ne doit pas intégrer le compte à rebours ni la fin de séance ») :
 * Compte à rebours initial et Fin de séance sans poids — la barre est pleine à la fin du dernier exercice. [Plan complet, Compte
 * à rebours et `SESSION_END` compris — remplacé.]
 */
function temporalMs(leaf: LeafSpec): Ms {
  if (leaf.kind === "STOP_POINT" || leaf.kind === "INITIAL_COUNTDOWN" || leaf.kind === "SESSION_END" || leaf.inWindow === true || leaf.inBlock === true || isUntimedSeries(leaf)) return 0;
  return leaf.plannedMs ?? 0;
}

type Weights = { readonly m: number; readonly r: number; readonly t: Ms };

function weightsOf(leaves: readonly LeafSpec[]): Weights {
  let m = 0;
  let r = 0;
  let t = 0;
  for (const leaf of leaves) {
    if (isUntimedSeries(leaf)) {
      m += 1;
      r += 1;
    } else {
      const d = temporalMs(leaf);
      if (d > 0) {
        m += 1;
        t += d;
      }
    }
  }
  return { m, r, t };
}

function weightOf(leaf: LeafSpec, weights: Weights): number {
  if (weights.m === 0) return 0;
  if (isUntimedSeries(leaf)) return 1 / weights.m;
  const d = temporalMs(leaf);
  if (d <= 0 || weights.t === 0) return 0;
  return ((weights.r === 0 ? 1 : 1 - weights.r / weights.m) * d) / weights.t;
}

/** Durée estimée d'exécution (CE : exacte, ≈ avec cadence ou motif, ≥ avec composante inconnue). */
export function estimatedDuration(plan: ExecutablePlan): EstimatedDuration {
  let ms = 0;
  let kind: EstimatedDuration["kind"] = "exact";
  for (const leaf of rootLeaves(plan)) {
    if (leaf.kind === "STOP_POINT" || leaf.inWindow === true || leaf.inBlock === true) continue;
    if (leaf.contribution === "omitted") {
      kind = "lowerBound";
      continue;
    }
    ms += leaf.plannedMs ?? 0;
    if (leaf.contribution === "estimated" && kind === "exact") kind = "estimated";
  }
  return { kind, ms };
}

function progressOf(plan: ExecutablePlan, state: EngineState, atMs: Ms): number {
  if (state.status === "FINISHED") return state.finish?.reason === "COMPLETED" ? 1 : progressBefore(plan, state, atMs);
  return progressBefore(plan, state, atMs);
}

function progressBefore(plan: ExecutablePlan, state: EngineState, atMs: Ms): number {
  const leaves = rootLeaves(plan);
  if (state.status === "READY") return 0;
  const weights = weightsOf(leaves);
  const { passed } = positionOf(plan, state);
  let value = 0;
  for (let i = 0; i < Math.min(passed, leaves.length); i += 1) value += weightOf(leaves[i]!, weights);
  const leaf = state.leaf;
  const emomFrame = [...state.frames].reverse().find((frame) => frame.spec.pilot === EMOM_PILOT);
  const amrapFrame = [...state.frames].reverse().find((frame) => frame.spec.pilot === AMRAP_PILOT);
  if (leaf !== null && state.status !== "FINISHED" && amrapFrame !== undefined && (amrapFrame.local as AmrapLocal | null)?.phase === "WORK") {
    // PRE-11 (T3) : le bloc AMRAP en cours avance avec son temps (poids porté par son étape de poids, durée du bloc).
    const config = amrapFrame.spec.config as AmrapScopeConfig;
    const weightLeaf = config.items[config.items.length - 1];
    const blockRef = state.refs.find((ref) => ref.owner === amrapFrame.spec.key && ref.name === "block");
    if (weightLeaf?.type === "LEAF" && blockRef !== undefined && config.blockMs > 0) {
      value += weightOf(weightLeaf.leaf, weights) * Math.min(1, runningMs(blockRef, atMs) / config.blockMs);
    }
  } else if (leaf !== null && state.status !== "FINISHED" && emomFrame !== undefined && (emomFrame.local as EmomLocal | null)?.phase === "WORK") {
    // PRE-11 (T2) : la fenêtre EMOM en cours avance avec son temps (poids porté par son repos), travail et repos compris.
    const config = emomFrame.spec.config as EmomScopeConfig;
    const local = emomFrame.local as EmomLocal;
    const rest = config.items[(config.windows[local.window]?.end ?? 0) - 1];
    const windowRef = state.refs.find((ref) => ref.owner === emomFrame.spec.key && ref.name === "window");
    if (rest?.type === "LEAF" && windowRef !== undefined && config.windowMs > 0) {
      value += weightOf(rest.leaf, weights) * Math.min(1, runningMs(windowRef, atMs) / config.windowMs);
    }
  } else if (leaf !== null && state.status !== "FINISHED" && leaf.spec.kind !== "CLOSURE") {
    const weight = weightOf(leaf.spec, weights);
    const planned = temporalMs(leaf.spec);
    if (planned > 0 && !isUntimedSeries(leaf.spec)) {
      let done: Ms;
      if (leaf.spec.end === "MANUAL" && leaf.spec.cadenceMs !== undefined) {
        // Cadence : intervalles complets acquis seulement (RM-077, T04).
        const running = leaf.cadenceAnchorMs === null ? 0 : Math.floor(Math.max(0, atMs - leaf.cadenceAnchorMs) / leaf.spec.cadenceMs);
        done = (leaf.cadenceAcquired + running) * leaf.spec.cadenceMs;
      } else {
        done = leafElapsedMs(state, atMs);
      }
      value += weight * Math.min(1, done / planned);
    }
  }
  // Jamais 100 % avant la clôture de la Fin de séance.
  return Math.min(value, 0.999);
}

function nextOf(plan: ExecutablePlan, state: EngineState): NextView | null {
  // PRE-11 (T3) : dans un bloc AMRAP, l'étape suivante est celle du segment, puis le premier exercice du tour suivant (la boucle
  // ne finit qu'à l'échéance).
  const amrapFrame = [...state.frames].reverse().find((frame) => frame.spec.pilot === AMRAP_PILOT);
  const amrapLocal = amrapFrame === undefined ? null : (amrapFrame.local as AmrapLocal | null);
  if (amrapFrame !== undefined && amrapLocal !== null && amrapLocal.phase === "WORK") {
    const config = amrapFrame.spec.config as AmrapScopeConfig;
    const following = segmentLeaves(config, amrapLocal)[amrapLocal.index + 1] ?? roundLeaves(config, amrapLocal.segment === "BUY_IN" ? 1 : amrapLocal.round + 1)[0];
    return following === undefined ? null : nextViewOf(plan, following);
  }
  // PRE-11 (T4) : dans un Death by, l'étape suivante de la fenêtre, puis la fenêtre suivante du rang, puis le rang suivant (régime
  // ouvert : le défi ne finit qu'à la première fenêtre manquée ou à la limite de l'intervalle).
  const deathByFrame = [...state.frames].reverse().find((frame) => frame.spec.pilot === DEATH_BY_PILOT);
  const deathByLocal = deathByFrame === undefined ? null : (deathByFrame.local as DeathByLocal | null);
  if (deathByFrame !== undefined && deathByLocal !== null && deathByLocal.phase === "WORK") {
    const config = deathByFrame.spec.config as DeathByScopeConfig;
    const work = (leaves: readonly LeafSpec[]) => leaves.filter((leaf) => leaf.kind !== "WINDOW_REST");
    const lastSlot = deathByLocal.slot + 1 >= config.slots.length;
    const following =
      work(windowLeaves(config, deathByLocal.rank, deathByLocal.slot))[deathByLocal.index + 1] ??
      work(windowLeaves(config, lastSlot ? deathByLocal.rank + 1 : deathByLocal.rank, lastSlot ? 0 : deathByLocal.slot + 1))[0];
    return following === undefined ? null : nextViewOf(plan, following);
  }
  const leaves = rootLeaves(plan);
  const following = leaves[positionOf(plan, state).index + 1];
  if (following === undefined || following.kind === "SESSION_END") return null;
  return nextViewOf(plan, following);
}

/** Compteurs du dernier exercice joué, pendant l'étape qui le suit (recette du 13/11/2026). */
function previousCountersOf(plan: ExecutablePlan, state: EngineState): Counters | null {
  const kind = state.leaf?.spec.kind;
  if (kind === undefined || kind === "ACTIVITY" || kind === "INITIAL_COUNTDOWN" || kind === "SESSION_END") return null;
  const leaves = rootLeaves(plan);
  const { index: at, passed } = positionOf(plan, state);
  for (let index = Math.min(at, passed) - (passed > at ? 0 : 1); index >= 0; index -= 1) {
    const spec = leaves[index]!;
    if (spec.kind !== "ACTIVITY") continue;
    return { ...countersOf(plan, spec), cycle: cycleOf(spec) };
  }
  return null;
}

function upcomingOf(plan: ExecutablePlan, state: EngineState): UpcomingActivity | null {
  const kind = state.leaf?.spec.kind;
  if (kind !== "INITIAL_COUNTDOWN" && kind !== "STOP_POINT") return null;
  const leaves = rootLeaves(plan);
  const from = positionOf(plan, state).index + 1;
  for (let index = from; index < leaves.length; index += 1) {
    const spec = leaves[index]!;
    if (spec.kind === "SESSION_END") return null;
    if (spec.kind !== "ACTIVITY") continue;
    const followingLeaf = leaves[index + 1];
    const following: ChildSpec | undefined = followingLeaf === undefined ? undefined : { type: "LEAF", leaf: followingLeaf };
    const counters = countersOf(plan, spec);
    return {
      name: spec.exerciseId === undefined ? null : (plan.exercises[spec.exerciseId]?.name ?? null),
      series: counters.series,
      tour: counters.tour,
      cycle: cycleOf(spec),
      sideRank: spec.sideRank ?? null,
      mode: spec.mode ?? null,
      target: spec.target === undefined ? null : spec.target,
      loadKg: spec.loadKg ?? null,
      timedMs: spec.end === "TIMED" ? (spec.plannedMs ?? 0) : null,
      after: following === undefined || following.type !== "LEAF" || following.leaf.kind === "SESSION_END" ? null : nextViewOf(plan, following.leaf),
      segment: BUY_IN_KEY.test(spec.key) ? "BUY_IN" : BUY_OUT_KEY.test(spec.key) ? "BUY_OUT" : null,
      format: formatKindOfLeaf(plan, spec.key),
    };
  }
  return null;
}

const FORMAT_PILOTS: Readonly<Record<string, FormatView["kind"]>> = { [FOR_TIME_PILOT]: "FOR_TIME", [EMOM_PILOT]: "EMOM", [AMRAP_PILOT]: "AMRAP", [DEATH_BY_PILOT]: "DEATH_BY" };
const LEAF_FORMATS = new WeakMap<ExecutablePlan, ReadonlyMap<string, FormatView["kind"]>>();

/** Format de la portée la plus interne qui contient l'étape `key` ; `null` hors Format. */
export function formatKindOfLeaf(plan: ExecutablePlan, key: string): FormatView["kind"] | null {
  let known = LEAF_FORMATS.get(plan);
  if (known === undefined) {
    const found = new Map<string, FormatView["kind"]>();
    const walk = (items: readonly ChildSpec[], kind: FormatView["kind"] | null) => {
      for (const item of items) {
        if (item.type === "LEAF") {
          if (kind !== null) found.set(item.leaf.key, kind);
        } else walk((item.scope.config as { items?: readonly ChildSpec[] } | null)?.items ?? [], FORMAT_PILOTS[item.scope.pilot] ?? kind);
      }
    };
    walk(plan.items, null);
    known = found;
    LEAF_FORMATS.set(plan, known);
  }
  return known.get(key) ?? null;
}

/** Étape du plan de clé `key` (synthèse de la séance, recette EMOM du 18/11/2026) ; `undefined` si inconnue. */
export function planLeafOf(plan: ExecutablePlan, key: string): LeafSpec | undefined {
  const { leaves, index } = planIndex(plan);
  const at = index.get(key);
  return at === undefined ? undefined : leaves[at];
}

/** Suivant mis en avant en Répétitions (recette du 13/11/2026). */
function nextHighlightedOf(plan: ExecutablePlan, state: EngineState, atMs: Ms): boolean {
  const spec = state.leaf?.spec;
  if ((state.status !== "RUNNING" && state.status !== "PAUSED") || spec === undefined || spec.kind !== "ACTIVITY" || spec.mode !== "REPETITIONS") return false;
  // Recette du 13/11/2026 (Hermann : « Tant que l’exercice n’a pas démarré au début, il reste en fond blanc ») ; une fois
  // démarré, la Pause ne lui retire pas sa couleur.
  const elapsed = leafElapsedMs(state, atMs);
  if (elapsed <= 0) return false;
  const phases = guidedPhases(plan, spec);
  const cycle = workPhasesCycleSeconds(phases);
  const periodMs = cycle !== null && cycle > 0 ? cycle * 1000 : spec.cadenceMs !== undefined && spec.cadenceMs > 0 ? spec.cadenceMs : null;
  if (periodMs === null) return true;
  const goal = spec.target !== undefined && spec.target.kind === "NUMBER" ? spec.target.value : null;
  if (goal === null) return false;
  return Math.floor(elapsed / periodMs + 1e-9) >= goal;
}

/** Répétitions faites d'après le guidage des phases : cycles complets du motif depuis le début de la Série. */
function autoRepetitionsOf(plan: ExecutablePlan, state: EngineState, atMs: Ms): number | null {
  const spec = state.leaf?.spec;
  if (spec === undefined || spec.kind !== "ACTIVITY" || spec.mode !== "REPETITIONS" || spec.exerciseId === undefined) return null;
  const cycle = workPhasesCycleSeconds(guidedPhases(plan, spec));
  if (cycle === null || cycle <= 0) return null;
  return Math.floor(leafElapsedMs(state, atMs) / (cycle * 1000) + 1e-9);
}

/** Répétition du Cycle d'une étape (D-451) ; `null` hors Cycle. */
function cycleOf(spec: LeafSpec): { readonly current: number; readonly total: number } | null {
  const cycle = spec.context?.cycle ?? null;
  return cycle === null ? null : { current: cycle.repetition, total: cycle.count };
}

function nextViewOf(plan: ExecutablePlan, spec: LeafSpec): NextView {
  return {
    kind: spec.kind,
    name: spec.exerciseId === undefined ? null : (plan.exercises[spec.exerciseId]?.name ?? null),
    plannedMs: spec.plannedMs,
    target: spec.target === undefined ? null : spec.target,
    mode: spec.mode ?? null,
    series: spec.kind === "ACTIVITY" ? seriesViewOf(spec) : null,
    sideRank: spec.sideRank ?? null,
  };
}

function outlineOf(plan: ExecutablePlan, state: EngineState): readonly OutlineItem[] {
  if (state.status === "FINISHED") return [];
  const at = state.status === "READY" ? 0 : positionOf(plan, state).index;
  const current = state.status === "READY" ? -1 : at;
  return rootLeaves(plan).flatMap((spec, index): OutlineItem[] => {
    if (index < at - 1) return [];
    // PRE-11 (T3) : l'étape de poids d'un bloc AMRAP n'est jamais jouée ni listée.
    if (spec.kind === "INITIAL_COUNTDOWN" || spec.kind === "SESSION_END" || spec.blockWeight === true) return [];
    const circuit = spec.context?.circuit ?? null;
    return [
      {
        key: spec.key,
        kind: spec.kind,
        name: spec.exerciseId === undefined ? null : (plan.exercises[spec.exerciseId]?.name ?? null),
        series: spec.kind === "ACTIVITY" && spec.series !== undefined && spec.series !== null && spec.seriesCount !== undefined && spec.seriesCount > 1 ? { current: spec.series, total: spec.seriesCount } : null,
        sideRank: spec.kind === "ACTIVITY" ? (spec.sideRank ?? null) : null,
        tour: circuit === null ? null : { current: circuit.tour, total: circuit.count },
        plannedMs: spec.end === "TIMED" ? spec.plannedMs : null,
        status: index < current ? "past" : index === current ? "current" : "upcoming",
      },
    ];
  });
}

/**
 * Série affichée d'une étape. Recette du 17/11/2026 (Hermann, constat d : For time en alternance, « On devrait avoir :
 * exercice 1 Tour 1 : Série 1/1 Tour 1/2 […] exercice 1 Tour 2 : Série 1/1 Tour 2/2 ») : un exercice de la boucle d'un For time
 * en alternance fait une Série par tour. Les membres de tour d'un For time sont ceux dont le guidage est retiré
 * (`phasesSilenced`, plan.ts) ; leur clé d'alternance est `…/circuit:<id>#<tour>/…`. [Série = numéro du tour — remplacé.]
 */
function seriesViewOf(spec: LeafSpec): { readonly current: number; readonly total: number } | null {
  if (spec.series === undefined || spec.series === null || spec.seriesCount === undefined) return null;
  if (spec.phasesSilenced === true && /\/circuit:[^/#]+#\d+\//.test(spec.key)) return { current: 1, total: 1 };
  return { current: spec.series, total: spec.seriesCount };
}

type CounterView = { readonly current: number; readonly total: number };

/**
 * Compteurs Série et Tour d'une étape. Constat a) de la recette du 18/11/2026 (Hermann, « Concept série / tour de l'EMOM à plusieurs
 * mouvements » : « Un tour est un passage de tous les mouvements. Une série est une fenêtre d'un mouvement ») — EMOM à M mouvements :
 * - « À la suite » (Circuit groupé d'un tour, sans Format porteur) : série inchangée, « Le tour est le rang du mouvement » (T = rang / M) ;
 * - « Dans chaque intervalle » (Circuit porteur EMOM) et « En alternance » (Circuit à séries alternées) : « La série est la position du
 *   mouvement dans le tour, remise à 1 à chaque nouveau tour » (S = rang / M), tour inchangé.
 * Affichage seulement : clés, étapes et résultats enregistrés inchangés. Hors EMOM, EMOM à un seul mouvement, autre forme : inchangés.
 */
function countersOf(plan: ExecutablePlan, spec: LeafSpec): { readonly series: CounterView | null; readonly tour: CounterView | null } {
  const circuit = spec.context?.circuit ?? null;
  const series = spec.kind === "ACTIVITY" ? seriesViewOf(spec) : null;
  const tour = circuit === null ? null : { current: circuit.tour, total: circuit.count };
  if (circuit === null || spec.kind !== "ACTIVITY" || spec.exerciseId === undefined) return { series, tour };
  const info = plan.circuits?.[circuit.id];
  if (info === undefined || info.exerciseIds.length < 2 || formatKindOfLeaf(plan, spec.key) !== "EMOM") return { series, tour };
  const rank = info.exerciseIds.indexOf(spec.exerciseId) + 1;
  if (rank < 1) return { series, tour };
  const movements = info.exerciseIds.length;
  if (info.carrier === "EMOM" || (info.carrier === null && info.nature === "SERIES")) return { series: { current: rank, total: movements }, tour };
  if (info.carrier === null && info.nature === "TOURS" && circuit.count === 1) return { series, tour: { current: rank, total: movements } };
  return { series, tour };
}

/** Étapes du buy-in et du buy-out d'un Circuit For time (clés du développement D.1). */
const BUY_IN_KEY = /\/circuit:[^/#]+#buy-in\//;
const BUY_OUT_KEY = /\/circuit:[^/#]+#buy-out\//;

/**
 * Commande du For time en cours (recette du 17/11/2026, Hermann) : buy-in et buy-out, « le bouton "Suivant" classique, à la
 * même taille que le bouton "+ Tour" » ; « "+ Tour" ne doit pas être actif tant qu'on n'arrive pas au dernier exercice du
 * tour » ; « le bouton de succès pour le dernier exercice du For Time (en boucle ou en Buy-out) ».
 */
function forTimeCommandOf(config: ForTimeScopeConfig, index: number): FormatView["command"] {
  const current = config.items[index];
  if (current?.type !== "LEAF") return null;
  const spec = current.leaf;
  const segment = /\/circuit:[^/#]+#buy-in\//.test(spec.key) ? "BUY_IN" : /\/circuit:[^/#]+#buy-out\//.test(spec.key) ? "BUY_OUT" : "ROUNDS";
  const round = roundKeyOf(spec);
  let lastOfRound = true;
  let nextActivity: LeafSpec | null = null;
  for (let at = index + 1; at < config.items.length; at += 1) {
    const item = config.items[at]!;
    if (item.type !== "LEAF" || item.leaf.kind !== "ACTIVITY") continue;
    nextActivity ??= item.leaf;
    if (roundKeyOf(item.leaf) === round) lastOfRound = false;
  }
  const duration = isDurationLeaf(spec);
  if (nextActivity === null) return { kind: "SUCCESS", segment, advance: "ROUND", duration };
  if (segment !== "ROUNDS") return { kind: "NEXT", segment, advance: "NEXT", duration };
  // Règle 8 : exercice en durée du tour qui n'est pas le dernier — « + Tour » inactif. [Suivant inactif — remplacé.]
  if (duration) return { kind: "ROUND", segment, advance: "ROUND", duration };
  // Règle 5, exception : dernier exercice du dernier tour, un buy-out suit — « Suivant » compte le tour et passe au buy-out.
  if (lastOfRound && /\/circuit:[^/#]+#buy-out\//.test(nextActivity.key)) return { kind: "NEXT", segment, advance: "ROUND", duration };
  return lastOfRound ? { kind: "ROUND", segment, advance: "ROUND", duration } : { kind: "NEXT", segment, advance: "NEXT", duration };
}

/** Élément For time en cours (portée la plus interne pilotée par `FOR_TIME`), `null` sinon. */
function formatOf(plan: ExecutablePlan, state: EngineState, atMs: Ms): FormatView | null {
  const frame = [...state.frames]
    .reverse()
    .find((candidate) => candidate.spec.pilot === FOR_TIME_PILOT || candidate.spec.pilot === EMOM_PILOT || candidate.spec.pilot === AMRAP_PILOT || candidate.spec.pilot === DEATH_BY_PILOT);
  if (frame === undefined || frame.local === null) return null;
  if (frame.spec.pilot === DEATH_BY_PILOT) return deathByFormatOf(plan, state, frame.spec.key, frame.spec.config as DeathByScopeConfig, frame.local as DeathByLocal, atMs);
  if (frame.spec.pilot === EMOM_PILOT) return emomFormatOf(plan, state, frame.spec.key, frame.spec.config as EmomScopeConfig, frame.local as EmomLocal, atMs);
  if (frame.spec.pilot === AMRAP_PILOT) return amrapFormatOf(plan, state, frame.spec.key, frame.spec.config as AmrapScopeConfig, frame.local as AmrapLocal, atMs);
  const config = frame.spec.config as ForTimeScopeConfig;
  const local = frame.local as ForTimeLocal;
  const stopwatch = state.refs.find((ref) => ref.owner === frame.spec.key && ref.name === "elapsed");
  const interruptedSpec = local.interruptedKey === null ? undefined : childLeaves(config.items).find((leaf) => leaf.key === local.interruptedKey);
  return {
    kind: "FOR_TIME",
    name: config.name,
    phase: local.phase,
    elapsedMs: local.measuredMs ?? (stopwatch === undefined ? 0 : runningMs(stopwatch, atMs)),
    capMs: config.capMs,
    capReached: local.capReached,
    completedActivities: local.doneActivities,
    totalActivities: activityCount(config),
    phaseStarts: local.phaseStarts ?? [],
    duration: local.phase === "WORK" ? durationOf(plan, state, config, local, atMs) : null,
    command: local.phase === "WORK" ? forTimeCommandOf(config, local.index) : null,
    roundStart: local.phase === "WORK" ? forTimeRoundStartOf(config, local.index) : null,
    emom: null,
    amrap: null,
    deathBy: null,
    interrupted:
      interruptedSpec === undefined
        ? null
        : {
            name: interruptedSpec.exerciseId === undefined ? null : (plan.exercises[interruptedSpec.exerciseId]?.name ?? null),
            target: interruptedSpec.target === undefined ? null : interruptedSpec.target,
            mode: interruptedSpec.mode ?? null,
          },
  };
}

/**
 * PRE-11 (T2) — EMOM en cours : fenêtre, temps restant, repos révélé, bandeau Q1 ; Série en Durée en cours (compte à rebours dans le
 * coin du bas à gauche, comme le For time) ; Clôture : Série interrompue de la fenêtre dont les répétitions sont demandées.
 */
function emomFormatOf(plan: ExecutablePlan, state: EngineState, scopeKey: string, config: EmomScopeConfig, local: EmomLocal, atMs: Ms): FormatView {
  const windowRef = state.refs.find((ref) => ref.owner === scopeKey && ref.name === "window");
  const elapsedMs = windowRef === undefined ? config.windowMs : Math.min(config.windowMs, runningMs(windowRef, atMs));
  const nameOf = (leaf: LeafSpec | undefined) => (leaf?.exerciseId === undefined ? null : (plan.exercises[leaf.exerciseId]?.name ?? null));
  const leafOf = (key: string | null) => (key === null ? undefined : childLeaves(config.items).find((leaf) => leaf.key === key));
  const banner = bannerWindow(config, local);
  const bannerLeaf = leafOf(banner?.interruptedKey ?? null);
  const closing = local.phase === "CLOSURE" ? local.outcomes.find((outcome) => outcome.window === local.closing) : undefined;
  const closingLeaf = leafOf(closing?.interruptedKey ?? null);
  const spec = state.leaf?.spec ?? null;
  const timed = spec !== null && spec.kind === "ACTIVITY" && spec.end === "TIMED" && local.phase === "WORK";
  const totalMs = timed ? (spec.plannedMs ?? 0) : 0;
  return {
    kind: "EMOM",
    name: config.name,
    phase: local.phase,
    elapsedMs,
    capMs: null,
    capReached: false,
    completedActivities: local.outcomes.filter((outcome) => outcome.terminated).length,
    totalActivities: config.windows.length,
    phaseStarts: [],
    // Recette du 18/11/2026 (emom-6, Hermann : « L'appui au centre met en pause uniquement le compteur d'effort cumulé, jamais le chrono
    // de la minute ») : Série en Durée retenue (`HELD`) ou en cours, comme l'exercice en durée du For time.
    duration: timed ? { state: leafStepRef(state)?.held === true ? "HELD" : "RUNNING", name: nameOf(spec), remainingMs: Math.max(0, totalMs - leafElapsedMs(state, atMs)), totalMs } : null,
    command: null,
    amrap: null,
    deathBy: null,
    interrupted:
      closingLeaf === undefined
        ? null
        : { name: nameOf(closingLeaf), target: closingLeaf.target === undefined ? null : closingLeaf.target, mode: closingLeaf.mode ?? null },
    emom: {
      window: config.windows[Math.min(local.window, config.windows.length - 1)]?.number ?? 1,
      windows: config.windows.length,
      windowMs: config.windowMs,
      elapsedMs,
      remainingMs: Math.max(0, config.windowMs - elapsedMs),
      resting: local.phase === "WORK" && local.workDone,
      workEndedMs: local.workEndedMs,
      banner: banner === null ? null : { window: banner.window, name: nameOf(bannerLeaf), target: bannerLeaf === undefined || bannerLeaf.target === undefined ? null : bannerLeaf.target },
      closingWindow: local.phase === "CLOSURE" ? local.closing : null,
      timedWork: emomWindowTimed(config, local.window),
    },
  };
}

/** Recette du 18/11/2026 (emom-6) : la fenêtre `window` (indice) contient-elle une Série en Durée ? */
function emomWindowTimed(config: EmomScopeConfig, window: number): boolean {
  const spec = config.windows[Math.min(window, config.windows.length - 1)];
  if (spec === undefined) return false;
  return childLeaves(config.items.slice(spec.start, spec.end)).some((leaf) => leaf.kind === "ACTIVITY" && leaf.end === "TIMED");
}

/**
 * PRE-11 (T4) — Death by en cours : écran de l'EMOM (le grand chrono décompte la fenêtre du rang, repos révélé par le travail
 * terminé, Série en Durée avec son compte à rebours), sans bandeau ; Clôture : travail entamé de la fenêtre manquée (D2).
 */
function deathByFormatOf(plan: ExecutablePlan, state: EngineState, scopeKey: string, config: DeathByScopeConfig, local: DeathByLocal, atMs: Ms): FormatView {
  const windowMs = config.slots[local.slot]?.windowMs ?? 0;
  const windowRef = state.refs.find((ref) => ref.owner === scopeKey && ref.name === "window");
  const elapsedMs = local.phase === "CLOSURE" || windowRef === undefined ? windowMs : Math.min(windowMs, runningMs(windowRef, atMs));
  const nameOf = (leaf: LeafSpec | undefined) => (leaf?.exerciseId === undefined ? null : (plan.exercises[leaf.exerciseId]?.name ?? null));
  const closing = local.phase === "CLOSURE" && local.interruptedKey !== null ? deathByLeafOf(config, local.interruptedKey) : undefined;
  const spec = state.leaf?.spec ?? null;
  const timed = spec !== null && spec.kind === "ACTIVITY" && spec.end === "TIMED" && local.phase === "WORK";
  const totalMs = timed ? (spec.plannedMs ?? 0) : 0;
  return {
    kind: "DEATH_BY",
    name: config.name,
    phase: local.phase,
    elapsedMs,
    capMs: null,
    capReached: local.phase === "CLOSURE",
    completedActivities: local.acquiredRanks,
    totalActivities: 0,
    phaseStarts: [],
    duration: timed ? { state: "RUNNING", name: nameOf(spec), remainingMs: Math.max(0, totalMs - leafElapsedMs(state, atMs)), totalMs } : null,
    command: null,
    amrap: null,
    deathBy: { rank: local.rank, acquiredRanks: local.acquiredRanks },
    interrupted: closing === undefined ? null : { name: nameOf(closing), target: closing.target === undefined ? null : closing.target, mode: closing.mode ?? null },
    emom: {
      window: local.rank,
      windows: 0,
      windowMs,
      elapsedMs,
      remainingMs: Math.max(0, windowMs - elapsedMs),
      resting: local.phase === "WORK" && local.workDone,
      workEndedMs: local.workEndedMs,
      banner: null,
      closingWindow: null,
    },
  };
}

/**
 * PRE-11 (T3) — bloc AMRAP en cours : temps du bloc (le grand chrono le décompte), tours acquis, commande de droite du For time
 * transposée, exercice en durée du segment (à lancer, en cours, retenu) ; Clôture : étape dont le résultat est demandé.
 */
function amrapFormatOf(plan: ExecutablePlan, state: EngineState, scopeKey: string, config: AmrapScopeConfig, local: AmrapLocal, atMs: Ms): FormatView {
  const blockRef = state.refs.find((ref) => ref.owner === scopeKey && ref.name === "block");
  const elapsedMs = local.phase === "CLOSURE" || blockRef === undefined ? config.blockMs : Math.min(config.blockMs, runningMs(blockRef, atMs));
  const nameOf = (leaf: LeafSpec | undefined | null) => (leaf === undefined || leaf === null || leaf.exerciseId === undefined ? null : (plan.exercises[leaf.exerciseId]?.name ?? null));
  const leaves = segmentLeaves(config, local);
  const spec = state.leaf?.spec ?? null;
  let duration: FormatView["duration"] = null;
  if (local.phase === "WORK" && spec !== null) {
    if (isAmrapDurationLeaf(spec)) {
      const totalMs = spec.plannedMs ?? 0;
      duration = { state: leafStepRef(state)?.held === true ? "HELD" : "RUNNING", name: nameOf(spec), remainingMs: Math.max(0, totalMs - leafElapsedMs(state, atMs)), totalMs };
    } else {
      const pending = amrapPendingDuration(leaves, local.index);
      if (pending !== null) duration = { state: "PENDING", name: nameOf(pending), remainingMs: pending.plannedMs ?? 0, totalMs: pending.plannedMs ?? 0 };
    }
  }
  const closing = local.phase === "CLOSURE" && local.pending[0] !== undefined ? amrapLeafOf(config, local.pending[0]) : undefined;
  return {
    kind: "AMRAP",
    name: config.name,
    phase: local.phase,
    elapsedMs,
    capMs: config.blockMs,
    capReached: local.phase === "CLOSURE",
    completedActivities: local.completedRounds,
    totalActivities: 0,
    phaseStarts: [],
    duration,
    command: local.phase === "WORK" ? amrapCommandOf(leaves, local) : null,
    roundStart: local.phase === "WORK" ? amrapRoundStartOf(leaves, local) : null,
    emom: null,
    amrap: { round: local.round, completedRounds: local.completedRounds, block: config.block, blocks: config.blocks },
    deathBy: null,
    interrupted: closing === undefined ? null : { name: nameOf(closing), target: closing.target === undefined ? null : closing.target, mode: closing.mode ?? null },
  };
}

/**
 * Commande de droite d'un bloc AMRAP — règles du For time (recette du 17/11/2026) transposées (arbitrage de Hermann du 18/11/2026 :
 * « + Tour au dernier exercice d'un tour, Suivant ailleurs ») : buy-in, « Suivant » à chaque série ; boucle, « + Tour » au dernier
 * exercice du tour, « Suivant » avant ; exercice en durée, bouton inactif (fin à son terme) ; pendant une pause ou une Récupération,
 * « Suivant » la passe (Q3, l'échéance continue). Jamais « Succès » : la boucle ne finit qu'à l'échéance.
 */
function amrapCommandOf(leaves: readonly LeafSpec[], local: AmrapLocal): FormatView["command"] {
  const current = leaves[local.index];
  if (current === undefined) return null;
  const segment = local.segment === "BUY_IN" ? "BUY_IN" : "ROUNDS";
  if (current.kind !== "ACTIVITY") return { kind: "NEXT", segment, advance: "NEXT", duration: false };
  const duration = isAmrapDurationLeaf(current);
  if (segment === "BUY_IN") return { kind: "NEXT", segment, advance: "NEXT", duration };
  if (duration) return { kind: "ROUND", segment, advance: "ROUND", duration };
  const lastOfRound = leaves.slice(local.index + 1).every((leaf) => leaf.kind !== "ACTIVITY");
  return lastOfRound ? { kind: "ROUND", segment, advance: "ROUND", duration } : { kind: "NEXT", segment, advance: "NEXT", duration };
}

/** Exercice en durée du tour courant d'un For time (voir `FormatView.duration`). */
function durationOf(plan: ExecutablePlan, state: EngineState, config: ForTimeScopeConfig, local: ForTimeLocal, atMs: Ms): FormatView["duration"] {
  const spec = state.leaf?.spec ?? null;
  if (spec === null) return null;
  const nameOf = (leaf: LeafSpec) => (leaf.exerciseId === undefined ? null : (plan.exercises[leaf.exerciseId]?.name ?? null));
  if (isDurationLeaf(spec)) {
    const totalMs = spec.plannedMs ?? 0;
    const held = leafStepRef(state)?.held === true;
    return { state: held ? "HELD" : "RUNNING", name: nameOf(spec), remainingMs: Math.max(0, totalMs - leafElapsedMs(state, atMs)), totalMs };
  }
  const pending = pendingDurationOf(config, local.index);
  if (pending === null) return null;
  return { state: "PENDING", name: nameOf(pending), remainingMs: pending.plannedMs ?? 0, totalMs: pending.plannedMs ?? 0 };
}

function timerOf(state: EngineState, atMs: Ms, format: FormatView | null): TimerView {
  const leaf = state.leaf;
  if (leaf === null || leaf.spec.end === "INTERACTION") return { kind: "NONE" };
  // PRE-11 (T1) : pendant un For time, le grand chrono compte le temps réalisé de l'élément ; l'anneau va jusqu'à la
  // borne s'il y en a une (décision de Hermann du 13/11/2026 : « Temps écoulé. La borne peut apparaître dans le
  // triangle du haut à gauche »).
  // PRE-11 (T2) : EMOM — le grand chrono décompte la fenêtre (Figma `8982:15709`), travail et repos compris.
  // PRE-11 (T4) : Death by — de même, fenêtre du rang en cours.
  if (format !== null && (format.kind === "EMOM" || format.kind === "DEATH_BY") && format.emom !== null && format.phase === "WORK")
    return { kind: "COUNTDOWN", remainingMs: format.emom.remainingMs, totalMs: format.emom.windowMs, elapsedMs: format.emom.elapsedMs };
  // PRE-11 (T3) : AMRAP — le grand chrono décompte le bloc (durée du bloc, buy-in compris : T13).
  if (format !== null && format.kind === "AMRAP" && format.phase === "WORK" && format.capMs !== null)
    return { kind: "COUNTDOWN", remainingMs: Math.max(0, format.capMs - format.elapsedMs), totalMs: format.capMs, elapsedMs: format.elapsedMs };
  if (format !== null && format.phase === "WORK") return { kind: "STOPWATCH", elapsedMs: format.elapsedMs, nominalMs: format.capMs };
  // PRE-11, correction 4 (14/11/2026) : fin normale du For time — le grand chrono montre le temps final, figé, sans saisie.
  if (format !== null && format.phase === "CLOSURE" && leaf.spec.kind === "CLOSURE") return { kind: "STOPWATCH", elapsedMs: format.elapsedMs, nominalMs: null };
  const elapsedMs = leafElapsedMs(state, atMs);
  // Recette e1 du 12/11/2026 (Hermann, f : « Au point d'arrêt […] Un chronomètre se déclenche ») : l'attente d'un
  // Point d'arrêt est chronométrée à l'écran. [Point d'arrêt sans chrono — remplacé.]
  if (leaf.spec.end === "WAIT") return { kind: "STOPWATCH", elapsedMs, nominalMs: null };
  if (leaf.spec.end === "TIMED") {
    const totalMs = leaf.spec.plannedMs ?? 0;
    return { kind: "COUNTDOWN", remainingMs: Math.max(0, totalMs - elapsedMs), totalMs, elapsedMs };
  }
  return { kind: "STOPWATCH", elapsedMs, nominalMs: leaf.spec.plannedMs };
}

function guidanceOf(plan: ExecutablePlan, state: EngineState, atMs: Ms): ExecutionProjection["guidance"] {
  const leaf = state.leaf;
  if (leaf === null || leaf.spec.kind !== "ACTIVITY" || leaf.spec.exerciseId === undefined) return null;
  const phases = guidedPhases(plan, leaf.spec);
  if (phases.length === 0 || workPhasesCycleSeconds(phases) === null) return null;
  const limit = leaf.spec.end === "TIMED" ? (leaf.spec.plannedMs ?? 0) / 1000 : null;
  const at = phaseGuidanceAt(phases, leafElapsedMs(state, atMs) / 1000, limit);
  const phase = phases[at.phaseIndex]!;
  return { label: phase.label, remainingMs: at.phaseRemainingSeconds * 1000, phaseMs: phase.durationSeconds * 1000 };
}

export function projectExecution(plan: ExecutablePlan, state: EngineState, atMs: Ms): ExecutionProjection {
  const leaf = state.leaf;
  const spec = leaf?.spec ?? null;
  const running = state.status === "RUNNING";
  const elapsed = leafElapsedMs(state, atMs);
  const stopwatch = sessionStopwatch(state);
  const recoveryLike = spec !== null && spec.kind !== "ACTIVITY";
  const format = formatOf(plan, state, atMs);
  const counters = spec === null ? { series: null, tour: null } : countersOf(plan, spec);
  return {
    status: state.status,
    format,
    pauseReason: state.pause?.reason ?? null,
    finishReason: state.finish?.reason ?? null,
    sessionName: plan.sessionName,
    phase: spec?.kind ?? null,
    target: leaf === null ? null : leafTarget(leaf),
    exerciseName: spec?.exerciseId === undefined || spec === null ? null : (plan.exercises[spec.exerciseId]?.name ?? null),
    series: counters.series,
    tour: counters.tour,
    cycle: spec === null ? null : cycleOf(spec),
    autoRepetitions: autoRepetitionsOf(plan, state, atMs),
    nextHighlighted: nextHighlightedOf(plan, state, atMs),
    sideRank: spec?.sideRank ?? null,
    mode: spec?.mode ?? null,
    seriesTarget: spec === null || spec.target === undefined ? null : spec.target,
    loadKg: spec?.loadKg ?? null,
    timer: timerOf(state, atMs, format),
    guidance: guidanceOf(plan, state, atMs),
    next: nextOf(plan, state),
    upcoming: upcomingOf(plan, state),
    previousCounters: previousCountersOf(plan, state),
    outline: outlineOf(plan, state),
    sessionElapsedMs: stopwatch === null ? 0 : runningMs(stopwatch, atMs),
    estimated: estimatedDuration(plan),
    progress: progressOf(plan, state, atMs),
    commands: {
      // PRE-11, correction 3 : Réinitialiser désactivé pendant le travail d'un For time.
      reset: running && spec !== null && resettable(spec) && !(format?.kind === "FOR_TIME" && format.phase === "WORK") && format?.kind !== "EMOM" && format?.kind !== "AMRAP" && format?.kind !== "DEATH_BY",
      resetScope: recoveryLike ? "RECOVERY" : "EXERCISE",
      pause: running,
      next: running && spec !== null && (spec.end === "MANUAL" || spec.end === "WAIT" || spec.end === "TIMED"),
      nextNeedsConfirmation: running && spec !== null && needsNextConfirmation(spec) && elapsed < (spec.plannedMs ?? 0),
      isContinue: spec?.kind === "STOP_POINT",
    },
  };
}
