import type { CreateLabelInput, Label } from "./Label";

/** Contrat de lecture et de création du référentiel persistant des Étiquettes (V2-PRE-1, plan §3.1/§8/§13 §4.10). */
export interface LabelRepository {
  /** Étiquettes persistées, actives et retirées confondues — l'appelant filtre `isActive` selon son besoin. */
  listAll(): Promise<readonly Label[]>;
  /** Crée une nouvelle Étiquette (modale de sélection Étiquettes, « ajoutées ensuite ») — jamais de doublon exact, l'appelant valide l'entrée au préalable (`validateCreateLabelInput`). */
  create(input: CreateLabelInput): Promise<Label>;
}
