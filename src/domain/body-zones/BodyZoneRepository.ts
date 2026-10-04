import type { BodyZone, CreateBodyZoneInput } from "./BodyZone";

/** Résultat discriminé d'une opération de référentiel (même patron pour Étiquette/Catégorie/Zone). */
export type BodyZoneMutationResult =
  | { readonly status: "OK"; readonly value: BodyZone }
  | { readonly status: "DUPLICATE" }
  | { readonly status: "NOT_FOUND" };

/** Contrat de lecture et d'écriture du référentiel persistant des Zones corporelles (V2-PRE-1/V2-PRE-2, plan §3.1/§8). */
export interface BodyZoneRepository {
  /** Zones persistées, actives et retirées confondues — l'appelant filtre `isActive` lui-même selon son besoin. */
  listAll(): Promise<readonly BodyZone[]>;
  /** Crée une Zone, ou RÉACTIVE l'entrée retirée de même clé normalisée (D2). Refuse un doublon ACTIF (`DUPLICATE`). */
  create(input: CreateBodyZoneInput): Promise<BodyZoneMutationResult>;
  /** Renomme sans changer l'identifiant — refuse un doublon actif d'une autre Zone. */
  rename(id: string, name: string): Promise<BodyZoneMutationResult>;
  /** Retire logiquement — les affectations existantes sont conservées (D2, même règle que Catégorie/Étiquette). La règle « au moins une Zone sélectionnée par Exercice » (T17) est une contrainte de SÉLECTION de l'Exercice, pas du référentiel : elle n'est jamais appliquée ici. */
  retire(id: string): Promise<BodyZoneMutationResult>;
  /** `true` si au moins une Activité (Catalogue ou occurrence de Séance) utilise cette Zone — détermine le message de suppression (§4.10 L135). */
  isUsed(id: string): Promise<boolean>;
}
