import { createContext, useContext } from "react";

import type { ProgramService } from "@/features/programs/ProgramService";

/**
 * Exposition React de `ProgramService` (même patron que `PlanningServiceContext`) : le service est construit par
 * `SessionServiceProvider`, sur la même connexion SQLite.
 */
export const ProgramServiceContext = createContext<ProgramService | null>(null);

export function useProgramService(): ProgramService {
  const service = useContext(ProgramServiceContext);
  if (!service) throw new Error("useProgramService must be used within a SessionServiceProvider.");
  return service;
}

/** Variante facultative : `null` hors fournisseur (tests d'écran isolés). */
export function useOptionalProgramService(): ProgramService | null {
  return useContext(ProgramServiceContext);
}
