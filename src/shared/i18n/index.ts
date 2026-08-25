import { fr } from "./resources/fr";

/**
 * Point d’accès unique au catalogue de textes.
 *
 * Le MVP est monolingue (français). Ce module reste le seul endroit à
 * modifier pour introduire une sélection de langue future : les écrans ne
 * doivent jamais importer `./resources/fr` directement.
 */
export const strings = fr;

export type Strings = typeof strings;
