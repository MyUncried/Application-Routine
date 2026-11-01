/**
 * PRE-9 B.9 — Nom de séance à trois états (ch08 « Nom de séance — trois états validés le 27/10/2026 »,
 * ARB-14, ARB-15, précisés par Hermann le 01/11/2026, main `fce276fd`).
 *
 * 1. À l'ouverture, le nom du Format peut être proposé comme suggestion initiale, modifiable
 *    immédiatement ; le Format n'impose jamais le nom de la Séance.
 * 2. À l'ajout du premier Exercice, nom de cet Exercice, éditable (aucun suffixe de niveau).
 * 3. À l'ajout du second Exercice, invite « Entrer un nom de séance », grise et éditable ;
 *    l'obligation de nommer apparaît.
 *
 * Un nom personnalisé n'est jamais remplacé automatiquement (ARB-14) ; seul un nom resté suggéré
 * suit ces règles. Les retraits d'Exercices ne créent aucune nouvelle substitution.
 */

type NamedActivity = { readonly type: string; readonly name: string };

/** Exercices de la Séance (une ancienne Récupération autonome ne compte pas). */
function exercisesOf(activities: readonly NamedActivity[]): readonly NamedActivity[] {
  return activities.filter((activity) => activity.type === "EXERCISE");
}

/** État 1 (ARB-15) : nom initial proposé — celui du Format s'il y en a un, sinon aucun. */
export function initialSessionName(formatName: string | null = null): string {
  return formatName ?? "";
}

/**
 * États 2 et 3 : nom suggéré après un changement des Exercices. Seul un AJOUT recalcule : un
 * premier Exercice donne son nom ; un deuxième (ou davantage) efface la suggestion au profit de
 * l'invite. Sans ajout (retrait, modification, réorganisation), le nom suggéré est conservé.
 */
export function suggestedSessionNameAfter(
  previous: readonly NamedActivity[],
  next: readonly NamedActivity[],
  current: string,
): string {
  const before = exercisesOf(previous).length;
  const after = exercisesOf(next);
  if (after.length <= before) return current;
  if (after.length === 1) return after[0]!.name;
  return "";
}

/** État 3 : l'invite « Entrer un nom de séance » remplace le libellé du champ dès deux Exercices. */
export function sessionNamePromptShown(activities: readonly NamedActivity[]): boolean {
  return exercisesOf(activities).length >= 2;
}
