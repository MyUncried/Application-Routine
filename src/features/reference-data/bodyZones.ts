/**
 * Référentiel des Zones corporelles (T01-S08, D-093). Périmètre MVP :
 * exactement 10 zones, sans « Corps entier », sans distinction gauche/droite
 * — sélection multiple sur un Exercice (`SessionDraftExercise.bodyZoneIds`).
 *
 * Volontairement non codé en dur dans `BodyZoneSelector.tsx` : ce fichier
 * reste la seule source des identifiants/libellés/ordre, pour rester
 * évolutif sans toucher au composant de présentation (D-093).
 *
 * `id` est stable et n'est jamais réutilisé pour une autre zone — c'est lui
 * qui est persisté (au sens large : ici, retenu dans le brouillon), jamais
 * `name` ni `order`.
 */

export type BodyZone = {
  readonly id: string;
  readonly name: string;
  /** Ordre d'affichage, 0-indexé. */
  readonly order: number;
};

export const BODY_ZONES: readonly BodyZone[] = [
  { id: "cou", name: "Cou", order: 0 },
  { id: "epaules", name: "Épaules", order: 1 },
  { id: "bras", name: "Bras", order: 2 },
  { id: "poignets-mains", name: "Poignets et mains", order: 3 },
  { id: "dos", name: "Dos", order: 4 },
  { id: "hanches-bassin", name: "Hanches et bassin", order: 5 },
  { id: "cuisses", name: "Cuisses", order: 6 },
  { id: "genoux", name: "Genoux", order: 7 },
  { id: "jambes", name: "Jambes", order: 8 },
  { id: "chevilles-pieds", name: "Chevilles et pieds", order: 9 },
] as const;
