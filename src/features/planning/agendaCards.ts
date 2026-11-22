import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import { formatLocalDate, occurrenceInstant, type LocalDate, type LocalTime } from "@/domain/planning/Routine";
import type { AgendaExecution, OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";
import type { Occurrence, OccurrenceContent } from "@/domain/planning/occurrences";
import { formatAgendaTime, sessionsDurationLabel } from "@/features/planning/agendaFormat";
import type { AgendaStatus } from "@/features/planning/RoutineAgendaCard";
import type { SessionSnapshot } from "@/domain/sessions/sessionSnapshot";
import { projectSnapshotForCatalogue, type CatalogueCategoryRef, type SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";

/**
 * Agenda centré sur les Séances (D-553, 21/11/2026 ; spécification « Agenda centré sur les Séances, Journal et filtre », § 1
 * à § 5 et arbitrages 1 à 9 ; Figma « P-Calendrier — Semaine — Séances, parcours et hors planification (proposition B — lien
 * fin) » `12906:47`). Calcul pur des cartes, sans rendu :
 *
 * - une carte par Séance : planifiée, exécutée, ou Exécution « Hors planification » (lancée hors Agenda sans créneau
 *   éligible) ; titre = nom de la Séance (nom de l'instantané pour une Séance exécutée), jamais celui de la Routine ;
 * - parcours (occurrence à plusieurs Séances) : un groupe, sous le jour du créneau (arbitrage 2, passage de minuit compris),
 *   avec la ligne « Ⓟ nom de la Routine » ; une Routine à une Séance n'a ni ligne ni lien ;
 * - heure : Séance exécutée → heure réelle de démarrage ; première Séance non exécutée → heure prévue ; Séance suivante non
 *   exécutée d'un parcours → « — » ; durée estimée avant l'exécution, réelle après ;
 * - Séance seule exécutée : carte placée à sa date et heure réelles (heure prévue conservée dans l'occurrence) ;
 * - statut par Séance seulement, jamais de statut de parcours ;
 * - actions : première Séance d'un créneau non commencé → « Démarrer » / « Rattraper » la chaîne complète (D-534, inchangé) ;
 *   Séance suivante d'un parcours non lancé → aucune ; Séance non exécutée d'un créneau commencé → « Rattraper » pour elle
 *   seule jusqu'au créneau suivant de la routine (10 jours pour le dernier), puis « Expirée » (arbitrage 8).
 *
 * [Choix techniques : ordre des cartes d'un parcours = ordre des Séances du créneau ; groupe d'un parcours placé à l'heure de sa
 * première carte ; durée réelle = fin − début de l'Exécution (pauses comprises) ; Exécution non terminée : la carte reste non
 * exécutée et aucune carte « Hors planification » n'est montrée tant qu'elle n'est pas terminée.]
 */

export type AgendaCardAction = "START_CHAIN" | "CATCH_UP_ONE" | null;

export type AgendaCard = {
  readonly key: string;
  /** Carte d'une Séance planifiée ; `false` : Exécution hors planification. */
  readonly planned: boolean;
  readonly sessionId: string | null;
  readonly title: string;
  readonly projection: SessionCatalogueProjection | undefined;
  /** Jour sous lequel la carte apparaît. */
  readonly day: LocalDate;
  /** « 8h00 », ou « — » pour une Séance suivante non exécutée d'un parcours. */
  readonly timeLabel: string;
  /** Heure de tri `HH:MM` (réelle si exécutée, prévue sinon). */
  readonly sortTime: LocalTime;
  readonly duration: string;
  readonly status: AgendaStatus;
  readonly action: AgendaCardAction;
  readonly executed: boolean;
  /** Séance planifiée : occurrence, rang dans la chaîne (à partir de 1) et rang dans la liste des séances de l'occurrence. */
  readonly occurrence?: Occurrence;
  readonly position?: number;
  readonly sessionIndex?: number;
};

export type AgendaGroup = {
  readonly key: string;
  readonly day: LocalDate;
  readonly sortTime: LocalTime;
  /** Routine du groupe ; `null` : Exécution hors planification. */
  readonly routineId: string | null;
  /** Parcours : plusieurs Séances dans l'occurrence (ligne « Ⓟ » et lien). */
  readonly parcours: boolean;
  readonly cards: readonly AgendaCard[];
};

const BUSINESS_STATUS: Readonly<Record<"COMPLETED" | "PARTIAL" | "INTERRUPTED", AgendaStatus>> = {
  COMPLETED: "COMPLETED",
  PARTIAL: "PARTIAL",
  INTERRUPTED: "STOPPED",
};

/** Date et heure locales d'un instant ISO. */
function localParts(iso: string): { readonly day: LocalDate; readonly time: LocalTime } {
  const date = new Date(iso);
  return { day: formatLocalDate(date), time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` };
}

function realDuration(execution: AgendaExecution): string | null {
  if (execution.endedAt === null) return null;
  const seconds = Math.max(0, Math.round((new Date(execution.endedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000));
  return formatPhraseDuration(seconds);
}

/** Exécutions liées connues seulement par le lien (sans liste complète) : forme minimale. */
export function mergeAgendaExecutions(all: readonly AgendaExecution[], linked: readonly OccurrenceExecution[]): AgendaExecution[] {
  const known = new Set(all.map((execution) => execution.executionId));
  return [
    ...all,
    ...linked
      .filter((execution) => !known.has(execution.executionId))
      .map((execution) => ({
        executionId: execution.executionId,
        sessionId: execution.sessionId ?? null,
        sessionName: "",
        startedAt: execution.startedAt,
        endedAt: null,
        businessStatus: execution.businessStatus,
        link: { routineId: execution.routineId, occurrenceKey: execution.occurrenceKey, rank: execution.rank },
      })),
  ];
}

/**
 * Exécution terminée de chaque Séance d'une occurrence : par Séance (identifiant) puis par rang, pour ne pas confondre deux
 * fois la même Séance ; la plus récente fait foi. `cards[i]` : Séance et rang dans la chaîne.
 */
function matchExecutions(
  slots: readonly { readonly sessionId: string; readonly position: number }[],
  executions: readonly AgendaExecution[],
): (AgendaExecution | undefined)[] {
  const finished = [...executions].filter((execution) => execution.businessStatus !== null).sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  const used = new Set<string>();
  const result: (AgendaExecution | undefined)[] = slots.map(() => undefined);
  const take = (index: number, predicate: (execution: AgendaExecution) => boolean) => {
    const found = finished.find((execution) => !used.has(execution.executionId) && predicate(execution));
    if (found === undefined) return;
    used.add(found.executionId);
    // Les autres Exécutions de la même Séance et du même rang (rejouée) ne créent pas d'autre carte.
    for (const other of finished) if (other.sessionId === found.sessionId && other.link?.rank === found.link?.rank) used.add(other.executionId);
    result[index] = found;
  };
  slots.forEach((slot, index) => take(index, (execution) => execution.sessionId === slot.sessionId && execution.link?.rank === slot.position));
  slots.forEach((slot, index) => {
    if (result[index] === undefined) take(index, (execution) => execution.sessionId === slot.sessionId);
  });
  // Données sans Séance connue (liens antérieurs) : par rang.
  slots.forEach((slot, index) => {
    if (result[index] === undefined) take(index, (execution) => (execution.sessionId === null || execution.sessionId === undefined) && execution.link?.rank === slot.position);
  });
  return result;
}

export type AgendaBuildInput = {
  readonly occurrences: readonly Occurrence[];
  readonly executions: readonly AgendaExecution[];
  readonly projections: ReadonlyMap<string, SessionCatalogueProjection>;
  /** Séance encore proposée (active) ; une Séance exécutée reste montrée même si elle ne l'est plus (historique). */
  readonly isPlannable: (sessionId: string) => boolean;
  /** Filtre par routine (D-539) ; `null` : sans filtre. Filtre actif : Exécutions hors planification masquées. */
  readonly routineFilter: ReadonlySet<string> | null;
  readonly now: number;
  /**
   * Recette du 22/11/2026 (constat b) : Séance telle qu'exécutée, par Exécution (instantané) ; une carte exécutée la montre au
   * lieu de la Séance actuelle du Catalogue. Absente : Séance du Catalogue.
   */
  readonly executionProjections?: ReadonlyMap<string, SessionCatalogueProjection>;
};

/**
 * Projections des Séances exécutées (recette du 23/11/2026) : une par instantané, calculée une seule fois (l'instantané, lu une
 * fois par le service, est le même objet d'un chargement à l'autre).
 */
const snapshotProjectionCache = new WeakMap<SessionSnapshot, SessionCatalogueProjection>();

export function executedProjections(
  snapshots: ReadonlyMap<string, SessionSnapshot>,
  categories: ReadonlyMap<string, CatalogueCategoryRef>,
): ReadonlyMap<string, SessionCatalogueProjection> {
  const result = new Map<string, SessionCatalogueProjection>();
  for (const [id, snapshot] of snapshots) {
    let projection = snapshotProjectionCache.get(snapshot);
    if (projection === undefined) {
      projection = projectSnapshotForCatalogue(snapshot, categories);
      snapshotProjectionCache.set(snapshot, projection);
    }
    result.set(id, projection);
  }
  return result;
}

/** Groupes de l'Agenda, par jour, dans l'ordre chronologique. */
export function buildAgendaGroups(input: AgendaBuildInput): Map<LocalDate, AgendaGroup[]> {
  const { occurrences, executions, projections, isPlannable, routineFilter, now } = input;
  const executed = (execution: AgendaExecution | undefined) => (execution === undefined ? undefined : input.executionProjections?.get(execution.executionId));
  const byOccurrence = new Map<string, AgendaExecution[]>();
  for (const execution of executions) {
    if (execution.link === null) continue;
    const key = `${execution.link.routineId}|${execution.link.occurrenceKey}`;
    byOccurrence.set(key, [...(byOccurrence.get(key) ?? []), execution]);
  }
  const groups: AgendaGroup[] = [];

  for (const occurrence of occurrences) {
    if (routineFilter !== null && !routineFilter.has(occurrence.routineId)) continue;
    const occurrenceKey = `${occurrence.routineId}|${occurrence.key}`;
    const linked = byOccurrence.get(occurrenceKey) ?? [];
    // Rang dans la chaîne : séances jouées de l'occurrence, dans l'ordre (comme « Démarrer », D-534).
    const slots = occurrence.contents.map((content, index) => ({ content, sessionId: content.sessionId, position: index + 1 }));
    const matched = matchExecutions(slots, linked);
    const shown = slots
      .map((slot, index) => ({ ...slot, execution: matched[index] }))
      .filter((slot) => slot.execution !== undefined || (isPlannable(slot.sessionId) && projections.has(slot.sessionId)));
    if (shown.length === 0) continue;
    // Statut du créneau pour les Séances non exécutées (D-536 point 5, D-540).
    const planned = occurrenceInstant(occurrence.date, occurrence.time).getTime();
    const slotStatus: AgendaStatus = planned >= now ? "UPCOMING" : occurrence.expired ? "EXPIRED" : "MISSED";
    // Parcours : occurrence à plusieurs Séances, désactivées comprises — une Séance supprimée seule laisse la ligne « Ⓟ » tant
    // qu'une carte reste (arbitrage 9).
    const parcours = occurrence.sessions.length > 1;
    const cards = shown.map(({ content, sessionId, position, execution }) =>
      plannedCard({ occurrence, occurrenceKey, content, sessionId, position, execution, projection: executed(execution) ?? projections.get(sessionId), parcours, slotStatus, now }),
    );
    if (!parcours) {
      const card = cards[0]!;
      groups.push({ key: `${occurrenceKey}`, day: card.day, sortTime: card.sortTime, routineId: occurrence.routineId, parcours: false, cards });
      continue;
    }
    // Arbitrage 2 : les cartes d'un parcours restent groupées sous le jour du créneau, chacune à son heure.
    const grouped = cards.map((card) => ({ ...card, day: occurrence.date }));
    groups.push({ key: occurrenceKey, day: occurrence.date, sortTime: grouped[0]!.sortTime, routineId: occurrence.routineId, parcours: true, cards: grouped });
  }

  // § 4 : Exécutions hors planification, à leur heure réelle ; masquées quand un filtre par routine est actif (§ 5).
  if (routineFilter === null) {
    for (const execution of executions) {
      if (execution.link !== null || execution.businessStatus === null) continue;
      const { day, time } = localParts(execution.startedAt);
      const projection = executed(execution) ?? (execution.sessionId !== null ? projections.get(execution.sessionId) : undefined);
      groups.push({
        key: `free|${execution.executionId}`,
        day,
        sortTime: time,
        routineId: null,
        parcours: false,
        cards: [
          {
            key: `free|${execution.executionId}`,
            planned: false,
            sessionId: execution.sessionId,
            title: execution.sessionName !== "" ? execution.sessionName : (projection?.name ?? ""),
            projection,
            day,
            timeLabel: formatAgendaTime(time),
            sortTime: time,
            duration: realDuration(execution) ?? (projection !== undefined ? sessionsDurationLabel([projection]) : ""),
            status: BUSINESS_STATUS[execution.businessStatus],
            action: null,
            executed: true,
          },
        ],
      });
    }
  }

  const byDay = new Map<LocalDate, AgendaGroup[]>();
  for (const group of groups) byDay.set(group.day, [...(byDay.get(group.day) ?? []), group]);
  for (const list of byDay.values()) list.sort((a, b) => (a.sortTime === b.sortTime ? 0 : a.sortTime < b.sortTime ? -1 : 1));
  return byDay;
}

function plannedCard({
  occurrence,
  occurrenceKey,
  content,
  sessionId,
  position,
  execution,
  projection,
  parcours,
  slotStatus,
  now,
}: {
  readonly occurrence: Occurrence;
  readonly occurrenceKey: string;
  readonly content: OccurrenceContent;
  readonly sessionId: string;
  readonly position: number;
  readonly execution: AgendaExecution | undefined;
  readonly projection: SessionCatalogueProjection | undefined;
  readonly parcours: boolean;
  readonly slotStatus: AgendaStatus;
  readonly now: number;
}): AgendaCard {
  const base = {
    // Routine à une Séance : clé de l’occurrence (identifiants inchangés) ; parcours : clé de l’occurrence et rang.
    key: parcours ? `${occurrenceKey}|${position}` : occurrenceKey,
    planned: true,
    sessionId,
    projection,
    occurrence,
    position,
    sessionIndex: content.rank,
  } as const;
  if (execution !== undefined && execution.businessStatus !== null) {
    // Séance exécutée : heure réelle de démarrage, à sa date réelle ; durée réelle ; nom de l'instantané.
    const { day, time } = localParts(execution.startedAt);
    return {
      ...base,
      title: execution.sessionName !== "" ? execution.sessionName : (projection?.name ?? ""),
      day,
      timeLabel: formatAgendaTime(time),
      sortTime: time,
      duration: realDuration(execution) ?? (projection !== undefined ? sessionsDurationLabel([projection]) : ""),
      status: BUSINESS_STATUS[execution.businessStatus],
      action: null,
      executed: true,
    };
  }
  const estimated = projection !== undefined ? sessionsDurationLabel([projection]) : "";
  const common = {
    ...base,
    title: projection?.name ?? "",
    day: occurrence.date,
    // Première Séance : heure prévue ; Séance suivante non exécutée d'un parcours : « — » (jamais un vide ni une heure calculée).
    timeLabel: parcours && position > 1 ? "—" : formatAgendaTime(occurrence.time),
    sortTime: occurrence.time,
    duration: estimated,
    executed: false,
  };
  if (occurrence.started) {
    // Arbitrage 8 : créneau commencé — la Séance non exécutée se rattrape seule, jusqu'au créneau suivant, puis « Expirée ».
    const expired = occurrence.catchUpEnd !== undefined && now >= occurrence.catchUpEnd;
    return { ...common, status: expired ? "EXPIRED" : "MISSED", action: expired ? null : "CATCH_UP_ONE" };
  }
  // Créneau non commencé : la première Séance lance la chaîne ; les suivantes n'ont aucune action (arbitrage 5).
  if (slotStatus === "EXPIRED") return { ...common, status: "EXPIRED", action: null };
  return { ...common, status: slotStatus, action: position === 1 ? "START_CHAIN" : null };
}
