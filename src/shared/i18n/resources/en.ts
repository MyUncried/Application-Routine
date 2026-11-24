/**
 * J1 « Gestion des langues » (23/11/2026) : catalogue anglais (repli de toutes les langues, règle 3 du ch. 07),
 * traduit selon le glossaire validé (`docs/preparation/langues/GLOSSAIRE-EN-2026-11-23.md`). Assemblé à partir de
 * quatre parties, qui reprennent l'ordre et les clés de `fr.ts`.
 */
import type { fr } from "./fr";
import { enCore } from "./enCore";
import { enScreensActivities } from "./enScreensActivities";
import { enScreensComposition } from "./enScreensComposition";
import { enScreensMovement } from "./enScreensMovement";
import type { Widen } from "./types";

export type FrResource = Widen<typeof fr>;

export const en: FrResource = {
  ...enCore,
  screens: { ...enCore.screens, ...enScreensActivities, ...enScreensComposition, ...enScreensMovement },
};
