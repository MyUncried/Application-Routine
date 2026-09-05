/**
 * Référentiel MVP des Catégories prédéfinies (T01-S09, D-106/D-107) — même
 * patron que `@/features/reference-data/bodyZones.ts` (D-093) : identité,
 * nom, ordre d'affichage, jamais codé en dur dans un écran.
 *
 * `id` est stable et n'est jamais réutilisé pour une autre Catégorie — c'est
 * lui qui est persisté tel quel comme `categories.id` (migration002, seed),
 * jamais régénéré par `Crypto.randomUUID()` : une Catégorie prédéfinie doit
 * conserver le même identifiant sur toute réinstallation/migration.
 *
 * `migration002.ts` reste la source exécutée (l'insertion SQL réelle), mais
 * calcule ses valeurs à partir de CETTE liste plutôt que de les dupliquer en
 * dur — un seul endroit à faire évoluer si le référentiel MVP change.
 */

export type PredefinedCategoryDefinition = {
  readonly id: string;
  readonly name: string;
  readonly displayOrder: number;
};

export const PREDEFINED_CATEGORIES: readonly PredefinedCategoryDefinition[] = [
  { id: "renforcement", name: "Renforcement", displayOrder: 0 },
  { id: "cardio", name: "Cardio", displayOrder: 1 },
  { id: "mobilite", name: "Mobilité", displayOrder: 2 },
  { id: "etirements", name: "Étirements", displayOrder: 3 },
  { id: "equilibre", name: "Équilibre", displayOrder: 4 },
  { id: "coordination", name: "Coordination", displayOrder: 5 },
  { id: "recuperation", name: "Récupération", displayOrder: 6 },
  { id: "respiration", name: "Respiration", displayOrder: 7 },
  { id: "meditation", name: "Méditation", displayOrder: 8 },
  { id: "autre", name: "Autre", displayOrder: 9 },
] as const;
