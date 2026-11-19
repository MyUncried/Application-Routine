/**
 * Enchaînement des séances d'une routine (D-534, 19/11/2026 ; DSF Agenda — Planning § 7) — couche d'orchestration
 * AU-DESSUS du moteur d'exécution, qui ne change pas : chaque séance reste une Exécution complète et indépendante
 * (`prepare` → `start` → fin → `release`), avec son propre point de reprise, ses résultats et son historique.
 *
 * La chaîne voyage dans les paramètres de la route `/execution` (liste ordonnée des séances, rang courant) : aucune
 * persistance nouvelle. Une reprise après interruption du processus (\`ExecutionRecoveryGate\`, route sans paramètre)
 * ne reconstitue donc pas la chaîne : seule la séance interrompue est reprise, puis retour au calendrier.
 */

export type ExecutionChain = {
  /** Séances de l'occurrence, dans l'ordre de la liste de la routine (au moins deux). */
  readonly sessionIds: readonly string[];
  /** Rang de la séance courante, à partir de 1. */
  readonly rank: number;
};

export type ExecutionRouteParams = {
  readonly sessionId: string;
  readonly chain?: string;
  readonly rank?: string;
  /** Occurrence de routine d'où la séance est lancée (statut de l'occurrence, recette du 19/11/2026 au soir). */
  readonly routineId?: string;
  readonly occurrence?: string;
};

/** Occurrence d'origine : routine et date/heure d'origine. */
export type ExecutionOrigin = { readonly routineId: string; readonly occurrenceKey: string };

const SEPARATOR = ",";

/** Paramètres de route d'une séance de la chaîne ; une seule séance : paramètres d'une séance isolée (inchangés). */
export function executionParams(sessionIds: readonly string[], rank = 1, origin?: ExecutionOrigin): ExecutionRouteParams {
  const sessionId = sessionIds[rank - 1]!;
  const from = origin === undefined ? {} : { routineId: origin.routineId, occurrence: origin.occurrenceKey };
  if (sessionIds.length < 2) return { sessionId, ...from };
  return { sessionId, chain: sessionIds.join(SEPARATOR), rank: String(rank), ...from };
}

/** Occurrence d'origine lue dans les paramètres de route ; absente ou incomplète : `null`. */
export function parseOrigin(routineId: unknown, occurrence: unknown): ExecutionOrigin | null {
  if (typeof routineId !== "string" || routineId === "" || typeof occurrence !== "string" || occurrence === "") return null;
  return { routineId, occurrenceKey: occurrence };
}

/** Chaîne lue dans les paramètres ; absente, incohérente ou d'une seule séance : `null` (séance isolée). */
export function parseChain(sessionId: string | null, chain: unknown, rank: unknown): ExecutionChain | null {
  if (sessionId === null || typeof chain !== "string" || typeof rank !== "string") return null;
  const sessionIds = chain.split(SEPARATOR).filter((id) => id.length > 0);
  const index = Number(rank);
  if (sessionIds.length < 2 || !Number.isInteger(index) || index < 1 || index > sessionIds.length) return null;
  if (sessionIds[index - 1] !== sessionId) return null;
  return { sessionIds, rank: index };
}

/** Séance suivante de la chaîne, ou `null` après la dernière. */
export function nextInChain(chain: ExecutionChain, origin?: ExecutionOrigin | null): ExecutionRouteParams | null {
  if (chain.rank >= chain.sessionIds.length) return null;
  return executionParams(chain.sessionIds, chain.rank + 1, origin ?? undefined);
}
