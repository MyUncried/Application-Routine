/**
 * Filtre par routine de l'Agenda (D-539, 20/11/2026) : il reste actif tant qu'il n'est pas retiré, y compris quand on
 * passe au Journal et qu'on revient à l'Agenda. [Durée retenue par Claude (D-539) ; gardé en mémoire pour la session de
 * l'application, non enregistré : interprétation technique.] `null` : aucun filtre.
 */
let current: ReadonlySet<string> | null = null;

export function agendaRoutineFilter(): ReadonlySet<string> | null {
  return current;
}

export function setAgendaRoutineFilter(next: ReadonlySet<string> | null): void {
  current = next;
}
