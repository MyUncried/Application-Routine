/**
 * Référentiel PERSISTANT des Zones corporelles (V2-PRE-1, plan §3.1) : nom et
 * état actif/retiré, sans couleur. Distinct de `@/features/reference-data/
 * bodyZones.ts` (`BODY_ZONES`), qui reste une source historique de seed et de
 * compatibilité — la lecture RUNTIME cible passe exclusivement par ce
 * référentiel persistant (`BodyZoneRepository`).
 *
 * Une Zone retirée (`isActive: false`) est indisponible pour une NOUVELLE
 * affectation mais reste représentable par les objets existants qui la
 * référencent déjà (plan §3.1 : « Une valeur retirée est indisponible pour
 * les nouvelles affectations mais reste représentable par les objets
 * existants. Aucune réaffectation automatique n'est effectuée. »).
 */

export type BodyZone = {
  readonly id: string;
  readonly name: string;
  readonly isActive: boolean;
  readonly createdAt: string;
};

/** Une Zone est disponible pour une NOUVELLE affectation si et seulement si elle est active. */
export function isBodyZoneAssignable(zone: BodyZone): boolean {
  return zone.isActive;
}

/** Sous-ensemble assignable à une NOUVELLE sélection (actives uniquement), dans l'ordre d'origine — jamais utilisé pour filtrer l'affichage d'une Zone déjà référencée par un objet existant. */
export function listAssignableBodyZones(zones: readonly BodyZone[]): readonly BodyZone[] {
  return zones.filter(isBodyZoneAssignable);
}
