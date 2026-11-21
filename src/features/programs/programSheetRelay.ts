/**
 * Relais des feuilles posées sur la modale d'un programme (même patron que `planningSheetRelay`) : la modale dépose la
 * demande, la route `formSheet` la lit, puis rend le choix par le rappel. Rien n'est persisté ici.
 * - `consent` : feuille de consentement au suivi de la douleur (Figma « PROG — 13b », D-551) ;
 * - `attach` : « Rattacher une routine existante » (D-549).
 */
export type ProgramSheetRequest =
  | { readonly kind: "consent"; readonly onAllow: () => void; readonly onCancel: () => void }
  | { readonly kind: "attach"; readonly programId: string; readonly onAttached: () => void };

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
