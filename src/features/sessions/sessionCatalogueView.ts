import type { SessionCatalogueProjection } from "./sessionCatalogueProjection";

/**
 * PRE-8 (epic E, story E.4 ; spécification du 27/10 §4 ; D-449 §6) — vues filtrées du segment
 * Séances. Module pur.
 *
 * - Bascule « Un exercice | Plusieurs » : aucune option choisie (`null`) = collection complète ;
 *   toucher l'option active la désélectionne. Une Séance sans Exercice n'appartient à aucune des
 *   deux vues (elle n'a ni un exercice ni plusieurs) : elle figure dans la collection complète.
 * - Rangée de commandes responsive (Q-E4, option B complétée) : `commandRowLayout`.
 */

export type SessionCatalogueView = "SINGLE" | "MULTIPLE";

export function matchesView(projection: SessionCatalogueProjection, view: SessionCatalogueView | null): boolean {
  if (view === null) return true;
  return view === "SINGLE" ? projection.exerciseCount === 1 : projection.exerciseCount > 1;
}

/** Toucher une option : la choisir, ou la désélectionner si elle est déjà active. */
export function toggledView(current: SessionCatalogueView | null, touched: SessionCatalogueView): SessionCatalogueView | null {
  return current === touched ? null : touched;
}

/**
 * Q-E4 (Hermann, 28/10) : disposition de la rangée « bascule + Filtre / Tri / Créer ».
 *
 * - `ROW_EXTENDED` : filtre actif étendu (rond bleu qui réinitialise + zone texte qui ouvre), quand
 *   toute la rangée tient (≈ 382 pt avec les mesures Figma : 440 oui, 402 et 360 non) ;
 * - `ROW_COMPACT` : filtre actif compact (deux commandes distinctes : ouvrir, croix qui réinitialise)
 *   quand seule cette forme tient ;
 * - `TWO_LINES` : la bascule sur une ligne, les commandes sur la suivante, plutôt que de se chevaucher
 *   ou de masquer une fonction (largeur compacte, texte agrandi). La ligne des commandes reprend
 *   alors l'état étendu s'il y tient seul, sinon l'état compact.
 *
 * Toutes les largeurs sont MESURÉES (bascule, commande étendue) : aucune constante de largeur d'écran.
 * Filtre inactif : un seul bouton rond (`filterActive` faux, largeurs étendue et compacte ignorées).
 */
export type CommandRowLayout = {
  readonly lines: 1 | 2;
  readonly filter: "ROUND" | "EXTENDED" | "COMPACT";
};

export function commandRowLayout(input: {
  /** Largeur disponible de la rangée (entre les marges). */
  readonly available: number;
  /** Largeur naturelle de la bascule de vue. */
  readonly toggle: number;
  readonly filterActive: boolean;
  /** Largeur naturelle de la commande étendue (rond + texte). */
  readonly extendedFilter: number;
  /** Largeur de la forme compacte (deux ronds). */
  readonly compactFilter: number;
  /** Bouton rond (Tri, Créer, filtre inactif). */
  readonly circle: number;
  /** Écart entre deux commandes, et minimum entre la bascule et les commandes. */
  readonly gap: number;
}): CommandRowLayout {
  const { available, toggle, filterActive, extendedFilter, compactFilter, circle, gap } = input;
  const commands = (filter: number) => filter + 2 * (gap + circle);
  const fitsBeside = (filter: number) => toggle + gap + commands(filter) <= available;
  if (!filterActive) {
    return { lines: fitsBeside(circle) ? 1 : 2, filter: "ROUND" };
  }
  if (fitsBeside(extendedFilter)) return { lines: 1, filter: "EXTENDED" };
  if (fitsBeside(compactFilter)) return { lines: 1, filter: "COMPACT" };
  return { lines: 2, filter: commands(extendedFilter) <= available ? "EXTENDED" : "COMPACT" };
}
