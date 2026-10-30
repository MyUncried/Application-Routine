/**
 * PRE-9 CAT.1 (spécification « Zones de contexte des Catalogues » du 30/10/2026, CE-CAT-CTX-01) —
 * règles de présentation communes aux deux Catalogues. Module pur.
 */

/** Accord : singulier pour 0 et 1 (« 0 résultat », « 1 résultat »), pluriel au-delà (« 2 résultats »). */
export function pluralFormOf(count: number): "ONE" | "MANY" {
  return count <= 1 ? "ONE" : "MANY";
}

/** Texte accordé : `{count}` remplacé dans le modèle singulier ou pluriel. */
export function countLabel(count: number, templates: { readonly one: string; readonly many: string }): string {
  return (pluralFormOf(count) === "ONE" ? templates.one : templates.many).replace("{count}", String(count));
}

/** Géométrie de référence à 402 pt (§2) : largeur du champ Rechercher. */
export const CONTEXT_SEARCH_WIDTH = { default: 216, compact: 107 } as const;

/**
 * Géométrie verticale de la bande de 115 pt (§2, référence `y = 92..207`) : texte de la première
 * ligne à `y = 118` (26 sous le haut de la bande), champ et cibles de la deuxième ligne à `y = 155`
 * (63 sous le haut), donc 8 sous les cibles de 44. Retrait de la première ligne : 8 de plus que la
 * marge de 16 (`x = 24`, bord droit `x = 378`).
 */
export const CONTEXT_ZONE_GEOMETRY = { paddingTop: 26, paddingBottom: 8, line1Height: 17, line1Inset: 8 } as const;

/**
 * Couleurs et style de la première ligne (spécification §3 à §5). Constantes locales : le jeu de
 * jetons de `tokens.ts` est figé et documenté au chapitre 12 (contrats PRE-3 / PRE-4).
 */
export const CONTEXT_TEXT_COLOR = "#333333";
/** Séparateur « | » de la bascule Séances (§4). */
export const CONTEXT_SEPARATOR_COLOR = "#9499A8";
/** Libellé ou compteur actif : Inter Semi Bold 14, même interligne que `type.contextLine`. */
export const CONTEXT_LINE_SELECTED = { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 14, lineHeight: 17 } as const;
