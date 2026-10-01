import type { BodyZone } from "./BodyZone";

/** Contrat de lecture du référentiel persistant des Zones corporelles (V2-PRE-1, plan §3.1/§8). */
export interface BodyZoneRepository {
  /** Zones persistées, actives et retirées confondues — l'appelant filtre `isActive` lui-même selon son besoin (nouvelle affectation vs. affichage d'une référence existante). */
  listAll(): Promise<readonly BodyZone[]>;
}
