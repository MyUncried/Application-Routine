/**
 * PRE-7 (A2.3) — gabarits des textes des mouvements proposés. PRE-7 R-5 : le sous-titre
 * « Niveau r sur t · n exercices » de l'ancienne carte de choix est retiré avec elle ; la carte
 * Résultat (`MovementResultCard`, `10199:22268`) affiche « Niveau N » et la description.
 */

/** Remplacement par fonction : un nom contenant `$&` ou `$'` reste littéral. */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? values[key]! : match));
}
