/**
 * T1 « Gestion des langues » (23/11/2026) : les textes de l'Exécution sont dans le catalogue
 * (`strings.execution`, `src/shared/i18n/resources/frExecution.ts`). Reste ici le format d'horloge.
 */
/** `m:ss`, ou `h:mm:ss` au-delà d'une heure ; secondes entières, arrondi supérieur pour un compte à rebours. */
export function formatClock(ms: number, roundUp = false): string {
  const total = Math.max(0, roundUp ? Math.ceil(ms / 1000 - 1e-9) : Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${ss}` : `${String(minutes).padStart(2, "0")}:${ss}`;
}
