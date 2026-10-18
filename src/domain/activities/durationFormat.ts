/**
 * PRE-4 (story 2.2, AC1, AD-5, FR-17-01, H8) — formateur unique d'une durée
 * d'Exercice en minutes et secondes.
 *
 * Fonction pure, sans dépendance hors du domaine. `formatPhraseDuration` est
 * déplacée telle quelle depuis `executionPhrase.ts` (`[ADOPTED]`) : la Phrase,
 * la Feuille, la carte Catalogue (par `totalClauseAmount`) et
 * `formatCompactDuration` (Composition) l'importent ; aucun autre module ne
 * formate une durée d'Exercice en minutes et secondes. Au-delà de 59 min, les
 * minutes continuent sans heures (H8). Exempté du lexique (AD-11).
 */

/** « X min Y s » / « X min » / « Y s » — aucune heure, aucun zéro inutile. */
export function formatPhraseDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0 && seconds > 0) {
    return `${minutes} min ${seconds} s`;
  }
  return minutes > 0 ? `${minutes} min` : `${seconds} s`;
}
