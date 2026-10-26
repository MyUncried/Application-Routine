/**
 * PRE-7 (A2.3) — gabarits des textes des mouvements proposés. PRE-7 R-5 : le sous-titre
 * « Niveau r sur t · n exercices » de l'ancienne carte de choix est retiré avec elle ; la carte
 * Résultat (`MovementResultCard`, `10199:22268`) affiche « Niveau N » et la description.
 */

import type { MovementLevelPosition } from "@/domain/activities/movementSuggestion";
import { strings } from "@/shared/i18n";

/** Remplacement par fonction : un nom contenant `$&` ou `$'` reste littéral. */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? values[key]! : match));
}

/**
 * PRE-7 (R-6, D-445 C06, v7 l.69, MFN-10 l.426) : nom d'une carte sans pastille de niveau, suivi du
 * suffixe dérivé « - Nn » (« Squat assisté - N1 »). Sans position (mouvement sans groupe, ou seul
 * dans le sien) : le nom seul. Présentation uniquement : jamais écrit dans un nom ni dans la clé
 * d'unicité (C01).
 */
export function withLevelSuffix(name: string, position: MovementLevelPosition | null | undefined): string {
  if (position === null || position === undefined) {
    return name;
  }
  return fillTemplate(strings.screens.activities.card.levelSuffix, { name, rank: String(position.rank) });
}
