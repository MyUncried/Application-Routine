import type { BusinessStatus } from "@/domain/execution/results";

/**
 * Lien entre une occurrence de routine et les Exécutions de ses séances (recette du 19/11/2026 au soir — Hermann, réponse
 * à « Quand doit être fait ce lien ? » et règles s19-passees, s19-arret, constats D, E et G). [Lien absent du modèle
 * jusqu'ici (D-525, q19-teintes) — remplacé.]
 *
 * Une Exécution lancée depuis une carte de routine (Agenda) porte la routine, la date/heure d'origine de l'occurrence et
 * le rang de la séance dans l'occurrence. Les Exécutions lancées hors routine (Catalogue) n'ont pas de lien.
 */
export type OccurrenceLink = {
  readonly routineId: string;
  /** Date/heure d'origine `AAAA-MM-JJTHH:MM` (identité de l'occurrence dans sa routine). */
  readonly occurrenceKey: string;
  /** Rang de la séance dans l'occurrence, à partir de 1. */
  readonly rank: number;
};

export type OccurrenceExecution = OccurrenceLink & {
  readonly executionId: string;
  /**
   * D-553 (21/11/2026) : Séance exécutée — rattache l'Exécution à sa carte de Séance dans l'Agenda, même si une Séance du
   * créneau a été supprimée depuis (le rang seul se décalerait). Absent : données de test antérieures.
   */
  readonly sessionId?: string | null;
  readonly startedAt: string;
  /** `null` : Exécution non terminée. */
  readonly businessStatus: BusinessStatus | null;
};

/**
 * Statut d'exécution d'une occurrence (s19-passees : « Complétée », « Arrêtée » ou « Partielle » selon le statut
 * d'exécution de la ou des séances) :
 * - `NONE` : aucune séance terminée ;
 * - `COMPLETED` (« Complétée ») : chaque séance de l'occurrence a été menée à son terme ;
 * - `STOPPED` (« Arrêtée », abandonnée) : les séances terminées ont toutes été arrêtées volontairement, sans qu'aucune
 *   n'aboutisse ;
 * - `PARTIAL` (« Partielle ») : tous les autres cas — au moins une séance aboutie (complète ou partielle) sans que toutes
 *   le soient (s19-arret : arrêter une séance d'un parcours rend l'occurrence partielle).
 *
 * Pour chaque rang, la dernière Exécution terminée fait foi (une séance rejouée remplace la précédente).
 * [Hypothèse technique, 19/11/2026 : frontière entre « Arrêtée » et « Partielle » — à confirmer par Hermann.]
 */
export type OccurrenceExecutionStatus = "NONE" | "COMPLETED" | "PARTIAL" | "STOPPED";

export function occurrenceExecutionStatus(sessionCount: number, executions: readonly OccurrenceExecution[]): OccurrenceExecutionStatus {
  const latest = new Map<number, OccurrenceExecution>();
  for (const execution of executions) {
    if (execution.businessStatus === null) continue;
    const current = latest.get(execution.rank);
    if (current === undefined || current.startedAt < execution.startedAt) latest.set(execution.rank, execution);
  }
  const statuses = [...latest.values()].map((execution) => execution.businessStatus);
  if (statuses.length === 0) return "NONE";
  if (statuses.every((status) => status === "INTERRUPTED")) return "STOPPED";
  const complete = Array.from({ length: Math.max(1, sessionCount) }, (_, index) => latest.get(index + 1)?.businessStatus === "COMPLETED").every(Boolean);
  return complete ? "COMPLETED" : "PARTIAL";
}

/**
 * D-553 (21/11/2026) : Exécution lue par l'Agenda, rattachée à un créneau ou non (« Hors planification »). L'Agenda lit toutes
 * les Exécutions (spécification du 21/11/2026, § 4 : la migration 033 ne couvre pas les Exécutions libres). Nom de la Séance :
 * celui de l'instantané (historique), indépendant d'un renommage, d'un archivage ou d'une suppression ultérieurs.
 */
export type AgendaExecution = {
  readonly executionId: string;
  readonly sessionId: string | null;
  readonly sessionName: string;
  readonly startedAt: string;
  /** `null` : Exécution non terminée. */
  readonly endedAt: string | null;
  readonly businessStatus: BusinessStatus | null;
  /** `null` : Exécution hors planification. */
  readonly link: OccurrenceLink | null;
};

/** Clé d'une occurrence dans une routine, pour regrouper ses Exécutions. */
export function occurrenceExecutionKey(routineId: string, occurrenceKey: string): string {
  return `${routineId}|${occurrenceKey}`;
}

export function groupOccurrenceExecutions(executions: readonly OccurrenceExecution[]): ReadonlyMap<string, readonly OccurrenceExecution[]> {
  const map = new Map<string, OccurrenceExecution[]>();
  for (const execution of executions) {
    const key = occurrenceExecutionKey(execution.routineId, execution.occurrenceKey);
    const list = map.get(key) ?? [];
    list.push(execution);
    map.set(key, list);
  }
  return map;
}
