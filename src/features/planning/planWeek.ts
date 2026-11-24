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
 * - Exécutions hors planification (recette du 22/11/2026, constat a — Hermann : « une séance lancée hors routine doit se
 *   retrouver sous "sans programme", sur la même ligne qu'une séance identique, avec un signe distinctif (une petite
 *   astérisque) ») : dans « Sans programme », sur la ligne d'une routine à une Séance de cette même Séance affichée dans la
 *   semaine, sinon sur sa propre ligne (ordre alphabétique avec les routines) ; une case par Exécution à son heure réelle,
 *   marquée (`unplanned`) ; hors du Total (durée prévue). [Groupe « Hors planification » à part (21/11/2026, p32-hors-plan)
 *   — remplacé.] [Interprétation de Claude, à valider : seule une routine à une Séance « Sans programme » reçoit la case — pas
 *   une ligne de Séance d'un parcours ; plusieurs routines possibles : la première par ordre alphabétique.]
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
  /** Exécution hors planification (recette du 22/11/2026, constat a) : case marquée d'un astérisque. */
  readonly unplanned?: boolean;
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

/**
 * `start` / `end` : période du programme (D-564, 23/11/2026) — seules les occurrences comprises dans la période appartiennent au
 * programme ; absentes : toutes les occurrences de la routine.
 */
export type PlanProgramme = { readonly id: string; readonly name: string; readonly start?: LocalDate; readonly end?: LocalDate };

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
  /**
   * D-561 (23/11/2026) : programmes dont la période recouvre la semaine — leur bande est affichée même sans créneau ; seule, sans
   * les routines du programme absentes de la semaine.
   */
  readonly programmes?: readonly PlanProgramme[];
  /** Recette du 22/11/2026 (constat b) : Séance telle qu'exécutée, par Exécution. */
  readonly executionProjections?: ReadonlyMap<string, SessionCatalogueProjection>;
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
    ...(input.executionProjections !== undefined ? { executionProjections: input.executionProjections } : {}),
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
  const rowsOf = (routine: Routine, cards: readonly { readonly card: AgendaCard; readonly dayIndex: number; readonly parcours: boolean }[], prefix = ""): PlanRow[] => {
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
      return [{ key: prefix + routine.id, kind: "ROUTINE", routine, title: displayName(routine), sessionId: routine.entries[0]?.sessionId ?? cards[0]?.card.sessionId ?? null, cells }];
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
      { key: `${prefix}${routine.id}|title`, kind: "TITLE", routine, title: displayName(routine), cells: days.map(() => []) },
      ...sessions.map((row, index) => ({
        key: `${prefix}${routine.id}|${row.key}`,
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
  // D-564 (23/11/2026) : une routine figure sous la bande de son programme pour ses occurrences comprises dans la période, et sous
  // « Sans programme » pour les autres ; elle peut donc apparaître dans les deux groupes la même semaine.
  type Part = {
    readonly routine: Routine;
    readonly cards: readonly { readonly card: AgendaCard; readonly dayIndex: number; readonly parcours: boolean }[];
    readonly prefix: string;
  };
  const byProgramme = new Map<string, { programme: PlanProgramme | null; routines: Part[] }>();
  const place = (programme: PlanProgramme | null, part: Part) => {
    const key = programme?.id ?? "";
    const group = byProgramme.get(key) ?? { programme, routines: [] };
    group.routines.push(part);
    byProgramme.set(key, group);
  };
  for (const routine of routines) {
    const cards = cardsOf.get(routine.id) ?? [];
    if (cards.length === 0) continue;
    const programme = programmeOf(routine);
    if (programme === null) {
      place(null, { routine, cards, prefix: "" });
      continue;
    }
    const within = (dayIndex: number) =>
      (programme.start === undefined || days[dayIndex]! >= programme.start) && (programme.end === undefined || days[dayIndex]! <= programme.end);
    const inside = cards.filter((item) => within(item.dayIndex));
    const outside = cards.filter((item) => !within(item.dayIndex));
    if (inside.length > 0) place(programme, { routine, cards: inside, prefix: "" });
    if (outside.length > 0) place(null, { routine, cards: outside, prefix: inside.length > 0 ? "out|" : "" });
  }
  // D-561 : bande seule d'un programme dont la période recouvre la semaine.
  for (const programme of input.programmes ?? []) {
    if (byProgramme.has(programme.id)) continue;
    if ((programme.start !== undefined && programme.start > days[6]!) || (programme.end !== undefined && programme.end < days[0]!)) continue;
    byProgramme.set(programme.id, { programme, routines: [] });
  }
  const compare = (a: string, b: string) => a.localeCompare(b, "fr", { sensitivity: "base" });
  const byTime = (a: PlanCell, b: PlanCell) => (a.card.sortTime < b.card.sortTime ? -1 : a.card.sortTime > b.card.sortTime ? 1 : 0);
  const unplannedCell = (card: AgendaCard): PlanCell => ({ key: card.key, label: planTimeLabel(card.timeLabel), tint: planTint(card.status), card, unplanned: true });
  // Constat a (22/11/2026) : routines « Sans programme » et Séances exécutées hors planification, mêlées par ordre alphabétique.
  const noneRoutines = (byProgramme.get("")?.routines ?? []).sort((a, b) => compare(displayName(a.routine), displayName(b.routine)));
  const noneEntries: { readonly name: string; rows: PlanRow[] }[] = noneRoutines.map((part) => ({
    name: displayName(part.routine),
    rows: rowsOf(part.routine, part.cards, part.prefix),
  }));
  for (const [key, row] of unplanned) {
    const host =
      row.sessionId === null
        ? undefined
        : noneEntries.flatMap((entry) => entry.rows).find((candidate) => candidate.kind === "ROUTINE" && candidate.sessionId === row.sessionId);
    if (host !== undefined) {
      const cells = host.cells.map((list) => [...list]);
      for (const { card, dayIndex } of row.cards) cells[dayIndex]!.push(unplannedCell(card));
      const merged: PlanRow = { ...host, cells: cells.map((list) => list.sort(byTime)) };
      for (const entry of noneEntries) entry.rows = entry.rows.map((candidate) => (candidate === host ? merged : candidate));
      continue;
    }
    const cells = days.map(() => [] as PlanCell[]);
    for (const { card, dayIndex } of row.cards) cells[dayIndex]!.push(unplannedCell(card));
    noneEntries.push({ name: row.title, rows: [{ key: "unplanned|" + key, kind: "UNPLANNED", title: row.title, sessionId: row.sessionId, cells: cells.map((list) => list.sort(byTime)) }] });
  }
  const groups: PlanGroup[] = [...byProgramme.entries()]
    .filter(([key]) => key !== "")
    .sort(([, a], [, b]) => compare(a.programme!.name, b.programme!.name))
    .map(([key, group]) => ({
      key,
      programme: group.programme,
      rows: group.routines
        .sort((a, b) => compare(displayName(a.routine), displayName(b.routine)))
        .flatMap((part) => rowsOf(part.routine, part.cards, part.prefix)),
    }));
  if (noneEntries.length > 0) {
    groups.push({ key: "none", programme: null, rows: [...noneEntries].sort((a, b) => compare(a.name, b.name)).flatMap((entry) => entry.rows) });
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
