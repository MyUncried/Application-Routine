import type { LocalDate, Routine } from "@/domain/planning/Routine";

/**
 * Relais des feuilles posées sur la modale d'un programme (même patron que `planningSheetRelay`) : la modale dépose la
 * demande, la route `formSheet` la lit, puis rend le choix par le rappel. Rien n'est persisté ici.
 * - `consent` : feuille de consentement au suivi de la douleur (Figma « PROG — 13b », D-551) ;
 * - `attach` : « Rattacher une routine existante » (D-549) ; recette du 23/11/2026 (p4-rattacher, p4-croix) : plusieurs routines,
 *   rendues à la modale sans écriture (la coche les enregistre), avec le choix fait pour leurs créneaux hors période (D-566).
 */
export type AttachedRoutine = { readonly routine: Routine; readonly removeOutside: boolean };

export type ProgramSheetRequest =
  | { readonly kind: "consent"; readonly onAllow: () => void; readonly onCancel: () => void }
  | {
      readonly kind: "attach";
      /** Période du programme dans la modale (enregistrée ou non). */
      readonly period: { readonly start: LocalDate; readonly end: LocalDate };
      /** Routines déjà rattachées dans la modale : non proposées. */
      readonly excluded: ReadonlySet<string>;
      /** Routines retirées du programme dans la modale : proposées. */
      readonly released: ReadonlySet<string>;
      readonly onAttach: (routines: readonly AttachedRoutine[]) => void;
    };

let pending: ProgramSheetRequest | null = null;

export function requestProgramSheet(request: ProgramSheetRequest): void {
  pending = request;
}

export function pendingProgramSheet<K extends ProgramSheetRequest["kind"]>(kind: K): Extract<ProgramSheetRequest, { kind: K }> | null {
  return pending !== null && pending.kind === kind ? (pending as Extract<ProgramSheetRequest, { kind: K }>) : null;
}

export function releaseProgramSheet(): void {
  pending = null;
}
