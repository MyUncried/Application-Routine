/**
 * PRE-7 (A2.3, MFN-05, MFN-06 ; `9882:19049`, `9959:19623`) — sous-titre d'un geste proposé :
 * « Niveau r sur t · n exercices ». Rang et total dérivés du groupe (masqués sans groupe ou pour
 * un singleton, MFN-05) ; nombre d'Exercices du Catalogue calculé, omis à zéro (geste local ou sans
 * Exercice au Catalogue : aucun « 0 exercice », aucune mention d'origine inventée). Les valeurs
 * des maquettes sont des exemples. `null` : aucun sous-titre.
 */

import { strings } from "@/shared/i18n";

import type { MovementChoice } from "./ActivityDefinitionService";

/** Remplacement par fonction : un nom contenant `$&` ou `$'` reste littéral. */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? values[key]! : match));
}

export function formatMovementChoiceSubtitle(choice: MovementChoice): string | null {
  const t = strings.screens.activities.editor.movementSearch;
  const parts: string[] = [];
  if (choice.level !== null) {
    parts.push(fillTemplate(t.level, { rank: String(choice.level.rank), total: String(choice.level.total) }));
  }
  if (choice.definitionCount > 0) {
    parts.push(
      fillTemplate(choice.definitionCount === 1 ? t.exerciseCountSingular : t.exerciseCountPlural, {
        n: String(choice.definitionCount),
      }),
    );
  }
  return parts.length > 0 ? parts.join(t.separator) : null;
}
