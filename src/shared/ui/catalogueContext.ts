import { colors } from "@/shared/ui/tokens";

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
 * Géométrie verticale de la bande de 115 pt (§2, référence `y = 92..207`). Retrait de la première
 * ligne : 8 de plus que la marge de 16 (`x = 24`, bord droit `x = 378`).
 *
 * D-503 (Hermann, 06/11/2026 ; KODJO-Catalogues-cartes-modales-2026-11-06 §4 ; Figma `10266:20575`,
 * `1992:9910`) : hauteur de la bande inchangée (115) ; texte de la première ligne à `y = 113` (21 sous
 * le haut) ; rangée Rechercher / Filtre / Tri / Créer : visuels de 34 à `y = 146`, à 16 sous la
 * première ligne, cibles de 44 à `y = 141..185`, donc 22 au-dessus du bas de la bande.
 * [Avant : texte à `y = 118` (26 sous le haut), cibles à `y = 155`, 8 au-dessus du bas — remplacé.]
 */
export const CONTEXT_ZONE_GEOMETRY = { paddingTop: 21, paddingBottom: 22, line1Height: 17, line1Inset: 8 } as const;

/**
 * Couleurs et style de la première ligne (spécification §3 à §5). Constantes locales : le jeu de
 * jetons de `tokens.ts` est figé et documenté au chapitre 12 (contrats PRE-3 / PRE-4).
 */
export const CONTEXT_TEXT_COLOR = "#333333";
/**
 * D-503 (Hermann, 06/11/2026 ; §4) : séparateur « · » de la première ligne, commun aux deux Catalogues,
 * 8 pt de part et d'autre, couleur du texte (`#333333`, Figma `10934:19818`, `10681:20037`).
 * [Avant : « | » `#9499A8` à 10 pt pour les Séances, « · » à 6 pt pour les Mouvements — remplacés.]
 */
export const CONTEXT_SEPARATOR = "·";
export const CONTEXT_SEPARATOR_GAP = 8;
/** Libellé ou compteur actif : Inter Semi Bold 14, même interligne que `type.contextLine`. */
export const CONTEXT_LINE_SELECTED = { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 14, lineHeight: 17 } as const;

/**
 * D-501 (Hermann, 06/11/2026 ; KODJO-Catalogues-cartes-modales-2026-11-06 §3) : couleurs propres à chaque
 * Catalogue — `context` (zone de contexte et onglet sélectionné), `background` (fond d'écran, barre
 * d'état, en-tête fixe, fondu au-dessus de la navigation). Programmes : jetons prêts, aucun écran.
 */
export type CatalogueKind = "movements" | "sessions" | "programs";

export function catalogueColors(kind: CatalogueKind): { readonly context: string; readonly background: string } {
  switch (kind) {
    case "movements":
      return { context: colors.catalogueMovementsContext, background: colors.catalogueMovementsBackground };
    case "sessions":
      return { context: colors.catalogueSessionsContext, background: colors.catalogueSessionsBackground };
    case "programs":
      return { context: colors.catalogueProgramsContext, background: colors.catalogueProgramsBackground };
  }
}
