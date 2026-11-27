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
  /** D-553 : rang de la Séance dans l'occurrence, pour « Rattraper » une Séance seule d'un parcours commencé. */
  readonly occurrenceRank?: string;
  /**
   * D-577 point 4 (27/11/2026) : douleur 0–10 choisie avant la première séance du parcours, appliquée à toute la chaîne. Elle voyage
   * avec la route (aucune persistance) ; absente : aucune réponse (jamais 0 par défaut, D-427).
   */
  readonly pain?: string;
};

/**
 * Occurrence d'origine : routine et date/heure d'origine. `rank` (D-553, 21/11/2026, arbitrage 8) : Séance seule d'un parcours
 * commencée hors chaîne (« Rattraper » sur sa carte) ; absent : rang de la chaîne, ou 1.
 */
export type ExecutionOrigin = { readonly routineId: string; readonly occurrenceKey: string; readonly rank?: number };

const SEPARATOR = ",";

/** Paramètres de route d'une séance de la chaîne ; une seule séance : paramètres d'une séance isolée (inchangés). */
export function executionParams(sessionIds: readonly string[], rank = 1, origin?: ExecutionOrigin): ExecutionRouteParams {
  const sessionId = sessionIds[rank - 1]!;
  const from =
    origin === undefined
      ? {}
      : { routineId: origin.routineId, occurrence: origin.occurrenceKey, ...(origin.rank !== undefined ? { occurrenceRank: String(origin.rank) } : {}) };
  if (sessionIds.length < 2) return { sessionId, ...from };
  return { sessionId, chain: sessionIds.join(SEPARATOR), rank: String(rank), ...from };
}

/** Occurrence d'origine lue dans les paramètres de route ; absente ou incomplète : `null`. */
export function parseOrigin(routineId: unknown, occurrence: unknown, occurrenceRank?: unknown): ExecutionOrigin | null {
  if (typeof routineId !== "string" || routineId === "" || typeof occurrence !== "string" || occurrence === "") return null;
  const rank = typeof occurrenceRank === "string" ? Number(occurrenceRank) : Number.NaN;
  return Number.isInteger(rank) && rank >= 1 ? { routineId, occurrenceKey: occurrence, rank } : { routineId, occurrenceKey: occurrence };
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

/** Séance suivante de la chaîne, ou `null` après la dernière. D-577 : la douleur de la première séance suit la chaîne. */
export function nextInChain(chain: ExecutionChain, origin?: ExecutionOrigin | null, pain?: number | null): ExecutionRouteParams | null {
  if (chain.rank >= chain.sessionIds.length) return null;
  const params = executionParams(chain.sessionIds, chain.rank + 1, origin ?? undefined);
  return pain === undefined || pain === null ? params : { ...params, pain: String(pain) };
}
