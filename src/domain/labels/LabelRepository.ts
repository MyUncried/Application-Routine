import type { CreateLabelInput, Label } from "./Label";

/** Résultat discriminé d'une opération de référentiel (même patron pour Étiquette/Catégorie/Zone). */
export type LabelMutationResult =
  | { readonly status: "OK"; readonly value: Label }
  | { readonly status: "DUPLICATE" }
  | { readonly status: "NOT_FOUND" };

/** Contrat de lecture et d'écriture du référentiel persistant des Étiquettes (V2-PRE-1/V2-PRE-2, plan §3.1/§8/§13 §4.10). */
export interface LabelRepository {
  /** Étiquettes persistées, actives et retirées confondues — l'appelant filtre `isActive` selon son besoin. */
  listAll(): Promise<readonly Label[]>;
  /**
   * Crée une Étiquette, ou RÉACTIVE l'entrée retirée de même clé normalisée
   * (D2) : même identifiant, associations conservées, couleur choisie
   * appliquée. Refuse un doublon ACTIF (`DUPLICATE`).
   */
  create(input: CreateLabelInput): Promise<LabelMutationResult>;
  /** Renomme sans changer l'identifiant — refuse un doublon actif d'une autre Étiquette. */
  rename(id: string, name: string): Promise<LabelMutationResult>;
  /** Change la couleur sans changer l'identifiant ni le nom. */
  recolor(id: string, color: Label["color"]): Promise<LabelMutationResult>;
  /** Retire logiquement — les affectations existantes sont conservées, jamais de nouvelle affectation. */
  retire(id: string): Promise<LabelMutationResult>;
  /** `true` si au moins une Séance utilise cette Étiquette — détermine le message de suppression (§4.10 L135). */
  isUsed(id: string): Promise<boolean>;
}
