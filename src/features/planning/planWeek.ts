import { addDays, daysBetween, mondayOf, parseLocalDate, type LocalDate, type Routine } from "@/domain/planning/Routine";
import type { AgendaExecution } from "@/domain/planning/occurrenceExecutions";
import type { Occurrence } from "@/domain/planning/occurrences";
import { buildAgendaGroups, type AgendaCard } from "@/features/planning/agendaCards";
import type { AgendaStatus } from "@/features/planning/RoutineAgendaCard";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";

/**
 * Plan — grille d'une semaine (D-554, 21/11/2026 ; DSF Plan § 2 à § 6 ; Figma « P-Calendrier — Plan » `12983:19`). Calcul pur,
 * sans rendu :
 * - semaines d'un mois : une semaine appartient au mois qui en compte le plus de jours (règle du libellé du mois), donc au mois
 *   de son jeudi ; 4 ou 5 semaines par mois ; numéro de semaine ISO (« S47 ») ;
 * - routines ayant au moins un créneau dans la semaine, regroupées par programme puis « Sans programme », par ordre
 *   alphabétique dans un groupe ;
 * - une routine à une Séance = une ligne ; un parcours = une ligne de titre « Ⓟ nom » sans case, puis une ligne par Séance ;
 * - cases : mêmes heures et états que l'Agenda (D-553, \`buildAgendaGroups\`), heure pleine sans minutes (« 8h ») ; deux
 *   créneaux le même jour empilés dans l'ordre chronologique ;
 * - Exécutions hors planification (recette du 21/11/2026, p32-hors-plan — Hermann : « Une séance lancée depuis le catalogue
 *   doit être visible dans le plan ») : groupe « Hors planification » après les programmes, une ligne par Séance (ordre
 *   alphabétique), une case par Exécution à son heure réelle ; hors du Total (durée prévue). [Exécutions hors planification
 *   absentes (DSF Plan § 3) — remplacé ; groupe, ordre et exclusion du Total : choix de Claude, à valider.]
 * - Total : durée estimée de tout ce qui est prévu, jours passés compris ; un parcours compte la somme de ses Séances.
 */

/**
 * Teinte d'une case : vert complétée, orange partielle, rouge manquée ou expirée, bleu à venir, gris arrêtée. Recette du
 * 21/11/2026 (p32-cases — Hermann : « À venir doit être en couleur bleue, voir l'agenda »). [DSF Plan § 3 : gris à venir ou
 * arrêtée — remplacé.]
 */
export type PlanTint = "COMPLETED" | "PARTIAL" | "MISSED" | "UPCOMING" | "STOPPED";

export function planTint(status: AgendaStatus): PlanTint {
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "PARTIAL") return "PARTIAL";
  if (status === "MISSED" || status === "EXPIRED") return "MISSED";
  if (status === "STOPPED") return "STOPPED";
  return "UPCOMING";
}

/** DSF Plan § 3 : « 8h », « 14h » ; « 18h30 » ; « — » inchangé. */
export function planTimeLabel(agendaLabel: string): string {
  return agendaLabel.endsWith("h00") ? agendaLabel.slice(0, -2) : agendaLabel;
}

/** Jeudi de la semaine du lundi \`monday\` : il porte le mois et l'année ISO de la semaine. */
function thursdayOf(monday: LocalDate): LocalDate {
  return addDays(monday, 3);
}

/** Numéro de semaine ISO 8601 (« S47 »). */
export function isoWeekNumber(monday: LocalDate): number {
  const thursday = thursdayOf(mondayOf(monday));
  const firstOfYear = `${thursday.slice(0, 4)}-01-01`;
  return Math.floor(daysBetween(firstOfYear, thursday) / 7) + 1;
}

/** Mois (\`AAAA-MM-01\`) auquel appartient la semaine : celui de son jeudi. */
export function monthOfWeek(monday: LocalDate): LocalDate {
  return `${thursdayOf(mondayOf(monday)).slice(0, 7)}-01`;
}

/** Lundis des semaines du mois \`month\` (\`AAAA-MM-01\`), dans l'ordre : 4 ou 5. */
export function weeksOfMonth(month: LocalDate): LocalDate[] {
  const first = `${month.slice(0, 7)}-01`;
  let monday = mondayOf(first);
  if (monthOfWeek(monday) !== first) monday = addDays(monday, 7);
  const weeks: LocalDate[] = [];
  while (monthOfWeek(monday) === first) {
    weeks.push(monday);
    monday = addDays(monday, 7);
  }
  return weeks;
}

/** Première semaine du mois décalé de \`shift\` par rapport au mois de la semaine \`monday\` (doubles flèches). */
export function firstWeekOfShiftedMonth(monday: LocalDate, shift: -1 | 1): LocalDate {
  const month = parseLocalDate(monthOfWeek(monday));
  const target = new Date(month.getFullYear(), month.getMonth() + shift, 1);
  const key = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-01`;
  return weeksOfMonth(key)[0]!;
}

/** Jours d'une semaine en petit : « 16–22 » (jours du lundi et du dimanche). */
export function weekDaysLabel(monday: LocalDate): string {
  return `${parseLocalDate(monday).getDate()}–${parseLocalDate(addDays(monday, 6)).getDate()}`;
}

export type PlanCell = {
  readonly key: string;
  readonly label: string;
  readonly tint: PlanTint;
  readonly card: AgendaCard;
};

export type PlanRow = {
  readonly key: string;
  /** \`ROUTINE\` : routine à une Séance ; \`TITLE\` : ligne « Ⓟ nom » d'un parcours ; \`SESSION\` : une Séance d'un parcours. */
  /** \`UNPLANNED\` (recette du 21/11/2026) : une Séance exécutée hors planification, sans routine. */
  readonly kind: "ROUTINE" | "TITLE" | "SESSION" | "UNPLANNED";
  /** Absente pour une ligne \`UNPLANNED\`. */
  readonly routine?: Routine;
  readonly title: string;
  /** Séance de la ligne (durée sous le nom, recette du 21/11/2026) ; absente pour une ligne \`TITLE\`. */
  readonly sessionId?: string | null;
  /** Sept jours, lundi → dimanche ; cases empilées dans l'ordre chronologique. */
  readonly cells: readonly (readonly PlanCell[])[];
  /** Dernière Séance d'un parcours (lien et filet de fermeture). */
  readonly last?: boolean;
};

export type PlanProgramme = { readonly id: string; readonly name: string };

export type PlanGroup = {
  readonly key: string;
  /** \`null\` : « Sans programme ». */
  readonly programme: PlanProgramme | null;
  /** Groupe « Hors planification » (recette du 21/11/2026). */
  readonly unplanned?: boolean;
  readonly rows: readonly PlanRow[];
};

export type PlanWeek = {
  readonly days: readonly LocalDate[];
  readonly groups: readonly PlanGroup[];
  /** Occurrences de chaque routine par jour (toucher une case). */
  readonly occurrencesOf: (routineId: string, day: LocalDate) => readonly Occurrence[];
  /** Durée estimée prévue, en secondes, par jour ; \`null\` : jour sans créneau. */
  readonly dayTotals: readonly (number | null)[];
  readonly weekTotal: number | null;
};

/** Durée estimée d'une Séance (secondes) ; inconnue : 0. */
function estimatedSeconds(projection: SessionCatalogueProjection | undefined): number {
  if (projection === undefined) return 0;
  if (typeof projection.forTimeBound === "number") return projection.forTimeBound;
  return Number.isFinite(projection.duration.seconds) ? Math.max(0, projection.duration.seconds) : 0;
}

/** DSF Plan § 6 (Figma \`12992:59\`) : « 28’ » sous une heure, « 3h31 » au-delà ; « — » sans créneau. */
export function formatPlanTotal(seconds: number | null): string {
  if (seconds === null) return "—";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}’`;
  return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}`;
}

export type PlanWeekInput = {
  readonly monday: LocalDate;
  readonly routines: readonly Routine[];
  readonly occurrences: readonly Occurrence[];
  readonly executions: readonly AgendaExecution[];
  readonly projections: ReadonlyMap<string, SessionCatalogueProjection>;
  readonly isPlannable: (sessionId: string) => boolean;
  readonly now: number;
  readonly displayName: (routine: Routine) => string;
  /** Programme de la routine ; \`null\` : « Sans programme ». */
  readonly programmeOf: (routine: Routine) => PlanProgramme | null;
};

export function buildPlanWeek(input: PlanWeekInput): PlanWeek {
  const { monday, routines, projections, displayName, programmeOf } = input;
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  const byDay = buildAgendaGroups({
    occurrences: input.occurrences,
    executions: input.executions,
    projections,
    isPlannable: input.isPlannable,
    routineFilter: null,
    now: input.now,
  });
  const routinesById = new Map(routines.map((routine) => [routine.id, routine]));
  // Cartes de la semaine par routine (Exécutions hors planification exclues : DSF Plan § 3).
  const cardsOf = new Map<string, { readonly card: AgendaCard; readonly dayIndex: number; readonly parcours: boolean }[]>();
  const occurrencesByKey = new Map<string, Occurrence[]>();
  const unplanned = new Map<string, { title: string; sessionId: string | null; cards: { readonly card: AgendaCard; readonly dayIndex: number }[] }>();
  for (const [day, groups] of byDay) {
    const dayIndex = daysBetween(monday, day);
    if (dayIndex < 0 || dayIndex > 6) continue;
    for (const group of groups) {
      if (group.routineId === null) {
        for (const card of group.cards) {
          const key = card.sessionId ?? `name:${card.title}`;
          const row = unplanned.get(key) ?? { title: card.title, sessionId: card.sessionId, cards: [] };
          row.cards.push({ card, dayIndex });
          unplanned.set(key, row);
        }
        continue;
      }
      if (!routinesById.has(group.routineId)) continue;
      const list = cardsOf.get(group.routineId) ?? [];
      for (const card of group.cards) list.push({ card, dayIndex, parcours: group.parcours });
      cardsOf.set(group.routineId, list);
      const occurrence = group.cards[0]?.occurrence;
      if (occurrence !== undefined) {
        const key = `${group.routineId}|${day}`;
        const known = occurrencesByKey.get(key) ?? [];
        if (!known.some((item) => item.key === occurrence.key)) known.push(occurrence);
        occurrencesByKey.set(key, known);
      }
    }
  }

  const dayTotals: (number | null)[] = days.map(() => null);
  const rowsOf = (routine: Routine): PlanRow[] => {
    const cards = cardsOf.get(routine.id) ?? [];
    const parcours = routine.entries.length > 1 || cards.some((item) => item.parcours);
    const emptyCells = () => days.map(() => [] as PlanCell[]);
    const cell = (card: AgendaCard): PlanCell => ({ key: card.key, label: planTimeLabel(card.timeLabel), tint: planTint(card.status), card });
    for (const { card, dayIndex } of cards) {
      if (!card.planned) continue;
      dayTotals[dayIndex] = (dayTotals[dayIndex] ?? 0) + estimatedSeconds(card.projection);
    }
    if (!parcours) {
      const cells = emptyCells();
      for (const { card, dayIndex } of cards) cells[dayIndex]!.push(cell(card));
      for (const list of cells) list.sort((a, b) => (a.card.sortTime < b.card.sortTime ? -1 : a.card.sortTime > b.card.sortTime ? 1 : 0));
      return [{ key: routine.id, kind: "ROUTINE", routine, title: displayName(routine), sessionId: routine.entries[0]?.sessionId ?? cards[0]?.card.sessionId ?? null, cells }];
    }
    // Lignes de Séance : entrées de la routine dans l'ordre de sa liste, puis Séances ajoutées à un seul créneau.
    const rowKeyOf = (card: AgendaCard) => {
      const session = card.sessionIndex !== undefined ? card.occurrence?.sessions[card.sessionIndex] : undefined;
      return session?.entryId ?? `added:${card.sessionId ?? ""}`;
    };
    const sessionRows = new Map<string, { title: string; sessionId: string | null; cells: PlanCell[][] }>();
    for (const entry of routine.entries) sessionRows.set(entry.id, { title: projections.get(entry.sessionId)?.name ?? "", sessionId: entry.sessionId, cells: emptyCells() });
    for (const { card, dayIndex } of cards) {
      const key = rowKeyOf(card);
      const row = sessionRows.get(key) ?? { title: card.title, sessionId: card.sessionId, cells: emptyCells() };
      if (row.title === "") row.title = card.title;
      row.cells[dayIndex]!.push(cell(card));
      sessionRows.set(key, row);
    }
    const sessions = [...sessionRows.entries()].map(([key, row]) => ({ key, ...row }));
    return [
      { key: `${routine.id}|title`, kind: "TITLE", routine, title: displayName(routine), cells: days.map(() => []) },
      ...sessions.map((row, index) => ({
        key: `${routine.id}|${row.key}`,
        kind: "SESSION" as const,
        routine,
        title: row.title,
        sessionId: row.sessionId,
        cells: row.cells.map((list) => list.sort((a, b) => (a.card.sortTime < b.card.sortTime ? -1 : a.card.sortTime > b.card.sortTime ? 1 : 0))),
        ...(index === sessions.length - 1 ? { last: true } : {}),
      })),
    ];
  };

  // Groupes : programmes (ordre alphabétique de leur nom), puis « Sans programme » ; routines par ordre alphabétique.
  const shown = routines.filter((routine) => (cardsOf.get(routine.id) ?? []).length > 0);
  const byProgramme = new Map<string, { programme: PlanProgramme | null; routines: Routine[] }>();
  for (const routine of shown) {
    const programme = programmeOf(routine);
    const key = programme?.id ?? "";
    const group = byProgramme.get(key) ?? { programme, routines: [] };
    group.routines.push(routine);
    byProgramme.set(key, group);
  }
  const compare = (a: string, b: string) => a.localeCompare(b, "fr", { sensitivity: "base" });
  const groups: PlanGroup[] = [...byProgramme.entries()]
    .sort(([keyA, a], [keyB, b]) => (keyA === "" ? 1 : keyB === "" ? -1 : compare(a.programme!.name, b.programme!.name)))
    .map(([key, group]) => ({
      key: key === "" ? "none" : key,
      programme: group.programme,
      rows: group.routines.sort((a, b) => compare(displayName(a), displayName(b))).flatMap(rowsOf),
    }));
  if (unplanned.size > 0) {
    const byTime = (a: PlanCell, b: PlanCell) => (a.card.sortTime < b.card.sortTime ? -1 : a.card.sortTime > b.card.sortTime ? 1 : 0);
    groups.push({
      key: "unplanned",
      programme: null,
      unplanned: true,
      rows: [...unplanned.entries()]
        .sort(([, a], [, b]) => compare(a.title, b.title))
        .map(([key, row]) => {
          const cells = days.map(() => [] as PlanCell[]);
          for (const { card, dayIndex } of row.cards) cells[dayIndex]!.push({ key: card.key, label: planTimeLabel(card.timeLabel), tint: planTint(card.status), card });
          return { key: "unplanned|" + key, kind: "UNPLANNED" as const, title: row.title, sessionId: row.sessionId, cells: cells.map((list) => list.sort(byTime)) };
        }),
    });
  }
  const weekTotal = dayTotals.some((value) => value !== null) ? dayTotals.reduce<number>((sum, value) => sum + (value ?? 0), 0) : null;
  return {
    days,
    groups,
    occurrencesOf: (routineId, day) => occurrencesByKey.get(`${routineId}|${day}`) ?? [],
    dayTotals,
    weekTotal,
  };
}
