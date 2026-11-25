import type { LocalDate } from "@/domain/planning/Routine";

/**
 * D-564 / D-567 / RM-275 (Hermann, 23/11/2026 ; `docs/KODJO-Programme-recette-2026-11-23.md` § 4) : une occurrence appartient au
 * programme de sa routine seulement si sa date est comprise dans la période du programme ; sinon elle est hors programme. La
 * routine garde un seul programme (`Routine.programId`) ; l'appartenance d'une occurrence se calcule par sa date. Une routine
 * détachée (sans programme) a toutes ses occurrences hors programme. Module pur.
 */
export type ProgramPeriod = { readonly startDate: LocalDate; readonly endDate: LocalDate };

/** Date d'une occurrence comprise dans la période du programme (bornes incluses) : l'occurrence appartient au programme. */
export function withinProgramPeriod(period: ProgramPeriod, date: LocalDate): boolean {
  return date >= period.startDate && date <= period.endDate;
}
