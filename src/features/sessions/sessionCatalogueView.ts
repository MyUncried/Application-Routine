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
 * Q-E4 (Hermann, 28/10), revu à la recette du 28/10/2026 (q4-02, e4-02) : disposition de la rangée
 * « bascule + Filtre / Tri / Créer », toujours sur UNE ligne.
 *
 * - Filtre inactif : bouton rond (`ROUND`).
 * - Filtre actif : toujours la forme étendue (rond bleu qui réinitialise + zone texte qui ouvre) ; la
 *   forme compacte à deux ronds et le passage sur deux lignes sont retirés. Le texte est le résumé
 *   courant (`SUMMARY` : nom du critère, ou « N filtres ») quand toute la rangée tient, sinon le
 *   seul nombre de filtres (`COUNT` : « 1 filtre », « N filtres »).
 *
 * Largeurs MESURÉES (bascule, commande étendue avec le résumé) : aucune constante de largeur d'écran.
 */
export type CommandRowLayout = {
  readonly filter: "ROUND" | "EXTENDED";
  readonly label: "SUMMARY" | "COUNT";
};

export function commandRowLayout(input: {
  /** Largeur disponible de la rangée (entre les marges). */
  readonly available: number;
  /** Largeur naturelle de la bascule de vue. */
  readonly toggle: number;
  readonly filterActive: boolean;
  /** Largeur naturelle de la commande étendue avec le résumé courant (rond + texte). */
  readonly extendedFilter: number;
  /** Bouton rond (Tri, Créer, filtre inactif). */
  readonly circle: number;
  /** Écart entre deux commandes, et minimum entre la bascule et les commandes. */
  readonly gap: number;
}): CommandRowLayout {
  const { available, toggle, filterActive, extendedFilter, circle, gap } = input;
  if (!filterActive) return { filter: "ROUND", label: "SUMMARY" };
  const fits = toggle + gap + extendedFilter + 2 * (gap + circle) <= available;
  return { filter: "EXTENDED", label: fits ? "SUMMARY" : "COUNT" };
}
