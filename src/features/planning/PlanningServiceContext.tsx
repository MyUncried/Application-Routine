import { createContext, useContext } from "react";

import type { PlanningService } from "@/features/planning/PlanningService";

/**
 * Contrat React pur d'exposition de `PlanningService` (même patron que `SessionServiceContext`) : aucun import
 * `expo-sqlite` ici. Le service est construit par `SessionServiceProvider`, sur la même connexion SQLite.
 */
export const PlanningServiceContext = createContext<PlanningService | null>(null);

export function usePlanningService(): PlanningService {
  const service = useContext(PlanningServiceContext);
  if (!service) throw new Error("usePlanningService must be used within a SessionServiceProvider.");
  return service;
}
