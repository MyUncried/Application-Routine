/**
 * Données de classification des Mouvements importés, pour les filtres validés (MOUV-UX-20261117, décision de
 * Hermann du 17/11/2026 : « ajouter les axes spécialités, familles gestuelles, cibles anatomiques et problèmes
 * cliniques » ; « Les métadonnées de classification conservées doivent être utilisables sur mobile, pas seulement
 * stockées dans le registre »). Le détail des filtres et leurs interactions sera défini dans Figma : ce module ne
 * crée aucun parcours, il expose seulement les valeurs et leurs libellés.
 *
 * Module pur : fiches installées (instantanés du registre) + référentiels enregistrés par catalogue.
 */
import type { CatalogueReferenceEntry, CatalogueReferences, CatalogueSheet } from "@/domain/catalogue/MovementCatalogueFile";

/** Axes de classification des filtres validés, dans l'ordre de la décision. */
export const CLASSIFICATION_FILTER_AXES = ["specialties", "gesturalFamilies", "anatomicalTargets", "clinicalProblems"] as const;
export type ClassificationFilterAxis = (typeof CLASSIFICATION_FILTER_AXES)[number];

const SHEET_FIELD: Readonly<Record<ClassificationFilterAxis, keyof CatalogueSheet["classification"]>> = {
  specialties: "specialtyIds",
  gesturalFamilies: "gesturalFamilyIds",
  anatomicalTargets: "anatomicalTargetIds",
  clinicalProblems: "clinicalProblemIds",
};

/** Valeur d'un axe : identifiant propre au catalogue et libellé (identifiant si le référentiel est inconnu). */
export type ClassificationValue = { readonly catalogueId: string; readonly id: string; readonly label: string };

export type MovementClassification = Readonly<Record<ClassificationFilterAxis, readonly ClassificationValue[]>>;

/** Entrée minimale lue au registre (fiche installée). */
export type InstalledClassificationSource = {
  readonly catalogueId: string;
  readonly movementId: string;
  readonly sheet: Pick<CatalogueSheet, "classification">;
};

const AXIS_REFERENCES: Readonly<Record<ClassificationFilterAxis, keyof CatalogueReferences>> = {
  specialties: "specialties",
  gesturalFamilies: "gesturalFamilies",
  anatomicalTargets: "anatomicalTargets",
  clinicalProblems: "clinicalProblems",
};

/** Classification d'une fiche installée, valeurs rangées dans l'ordre du référentiel du catalogue. */
export function sheetClassification(
  catalogueId: string,
  sheet: Pick<CatalogueSheet, "classification">,
  references: CatalogueReferences | undefined,
): MovementClassification {
  const result = {} as Record<ClassificationFilterAxis, ClassificationValue[]>;
  for (const axis of CLASSIFICATION_FILTER_AXES) {
    const ids = (sheet.classification[SHEET_FIELD[axis]] ?? []) as readonly string[];
    const entries: readonly CatalogueReferenceEntry[] = references?.[AXIS_REFERENCES[axis]] ?? [];
    const order = new Map(entries.map((entry, index) => [entry.id, index] as const));
    result[axis] = [...ids]
      .sort((a, b) => (order.get(a) ?? Number.MAX_SAFE_INTEGER) - (order.get(b) ?? Number.MAX_SAFE_INTEGER) || a.localeCompare(b))
      .map((id) => ({ catalogueId, id, label: entries.find((entry) => entry.id === id)?.label ?? id }));
  }
  return result;
}

/** Classification de chaque Mouvement importé, par identifiant de Mouvement local. */
export function movementClassifications(
  installed: readonly InstalledClassificationSource[],
  references: ReadonlyMap<string, CatalogueReferences>,
): ReadonlyMap<string, MovementClassification> {
  return new Map(installed.map((record) => [
    record.movementId,
    sheetClassification(record.catalogueId, record.sheet, references.get(record.catalogueId)),
  ]));
}

/**
 * Valeurs proposables par axe : celles portées par au moins un Mouvement importé, sans doublon (identité
 * `catalogueId` + `id`), dans l'ordre de première apparition selon les référentiels.
 */
export function classificationFilterOptions(
  classifications: ReadonlyMap<string, MovementClassification>,
): Readonly<Record<ClassificationFilterAxis, readonly ClassificationValue[]>> {
  const result = {} as Record<ClassificationFilterAxis, ClassificationValue[]>;
  for (const axis of CLASSIFICATION_FILTER_AXES) {
    const seen = new Map<string, ClassificationValue>();
    for (const classification of classifications.values()) {
      for (const value of classification[axis]) {
        const key = value.catalogueId + "\u0000" + value.id;
        if (!seen.has(key)) seen.set(key, value);
      }
    }
    result[axis] = [...seen.values()];
  }
  return result;
}

/** Mouvements importés portant une valeur donnée sur un axe. */
export function movementsWithValue(
  classifications: ReadonlyMap<string, MovementClassification>,
  axis: ClassificationFilterAxis,
  value: Pick<ClassificationValue, "catalogueId" | "id">,
): readonly string[] {
  return [...classifications]
    .filter(([, classification]) => classification[axis].some((entry) => entry.catalogueId === value.catalogueId && entry.id === value.id))
    .map(([movementId]) => movementId);
}
