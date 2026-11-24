import type { LocalDate } from "@/domain/planning/Routine";

/**
 * D-563 (recette du Programme du 23/11/2026, `docs/KODJO-Programme-recette-2026-11-23.md` § 3) — période d'un programme choisie
 * dans un seul calendrier natif. Module pur : chaque appui sur une date donne le nouvel état et ce qui est écrit dans le brouillon.
 *
 * 1. Début : un appui sélectionne une date de début ; un second appui sur la même date la confirme. Avant confirmation, un appui
 *    sur une autre date déplace la sélection.
 * 2. Fin : une fois le début confirmé, l'appui suivant sélectionne la date de fin ; un second appui sur la même date la confirme
 *    et ferme le calendrier.
 * 3. Sortie sans confirmer la fin : la date de fin sélectionnée est conservée (elle est écrite dès sa sélection).
 * 4. Appui avant le début confirmé : recommence la sélection du début.
 * 5. Période : chaque jour porte une décoration native (`period`).
 * 6. « au » ouvre le calendrier avec le début déjà confirmé.
 */
export type PeriodPhase = "START" | "END";

export type PeriodSelection = {
  readonly phase: PeriodPhase;
  /** Date affichée sélectionnée (début en cours de choix, ou fin). */
  readonly selected: LocalDate | null;
  /** Début et fin du brouillon (la fin sélectionnée y est écrite aussitôt, règle 3). */
  readonly start: LocalDate | null;
  readonly end: LocalDate | null;
};

export type PeriodStep = {
  readonly state: PeriodSelection;
  /** Champs du brouillon à écrire (absents : inchangés). */
  readonly write: { readonly startDate?: LocalDate; readonly endDate?: LocalDate | null };
  /** Fin confirmée : le calendrier se ferme. */
  readonly close: boolean;
};

/** Ouverture par « Du » (début à choisir) ou par « au » (début déjà confirmé, règle 6). */
export function openPeriodSelection(field: "START" | "END", start: LocalDate | null, end: LocalDate | null): PeriodSelection {
  if (field === "END" && start !== null) return { phase: "END", selected: end, start, end };
  return { phase: "START", selected: start, start, end };
}

/** Appui sur une date du calendrier. */
export function pressPeriodDate(state: PeriodSelection, date: LocalDate): PeriodStep {
  if (state.phase === "START") {
    if (date !== state.selected) return { state: { ...state, selected: date }, write: {}, close: false };
    // Début confirmé ; une fin antérieure n'est plus valable (la période reste cohérente, D-499).
    const end = state.end !== null && state.end >= date ? state.end : null;
    return {
      state: { phase: "END", selected: end, start: date, end },
      write: { startDate: date, ...(end !== state.end ? { endDate: end } : {}) },
      close: false,
    };
  }
  if (state.start !== null && date < state.start) {
    return { state: { ...state, phase: "START", selected: date }, write: {}, close: false };
  }
  if (date === state.selected) return { state, write: {}, close: true };
  return { state: { ...state, selected: date, end: date }, write: { endDate: date }, close: false };
}
