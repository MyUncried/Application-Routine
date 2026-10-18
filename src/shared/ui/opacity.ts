/**
 * PRE-4 (AD-11) — opacité d'un élément non sélectionné ou sans effet : 0,45.
 *
 * Hors jetons (`tokens.ts` reste verrouillé par `tokensSpecification.test.ts`) :
 * cette constante remplace la valeur locale `0.45` de la Feuille Paramètres
 * d'exécution (story 3.3). Elle sert au champ de Régime à N = 1, non modifiable
 * (P16), et servira au grisé de la Cible à l'échec (story 3.4). Depuis Q38, la
 * ligne `Ordre des côtés` n'est plus atténuée à N = 1 : elle est masquée.
 */
export const UNSELECTED_OPACITY = 0.45;
