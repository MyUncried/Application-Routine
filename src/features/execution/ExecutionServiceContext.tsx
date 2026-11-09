import { createContext, useContext } from "react";

import type { ExecutionService } from "@/features/execution/ExecutionService";
import type { ExecutionSignalAdapter } from "@/infrastructure/haptics/ExecutionSignalAdapter";

/** PRE-10 : service d'Exécution et adaptateur de signaux, construits sur la connexion SQLite commune. */
export type ExecutionContextValue = { readonly service: ExecutionService; readonly signals: ExecutionSignalAdapter };

export const ExecutionServiceContext = createContext<ExecutionContextValue | null>(null);

export function useExecution(): ExecutionContextValue {
  const value = useContext(ExecutionServiceContext);
  if (value === null) throw new Error("useExecution must be used within a SessionServiceProvider.");
  return value;
}

/** Variante tolérante : `null` tant que la base n'est pas prête. */
export function useOptionalExecution(): ExecutionContextValue | null {
  return useContext(ExecutionServiceContext);
}
