import { createContext, useContext } from "react";

import type { AccountService } from "@/domain/account/AccountService";

/** T1 Compte — exposition de `AccountService` (construit par `SessionServiceProvider`, même connexion SQLite). */
export const AccountServiceContext = createContext<AccountService | null>(null);

export function useAccountService(): AccountService {
  const service = useContext(AccountServiceContext);
  if (!service) throw new Error("useAccountService must be used within a SessionServiceProvider.");
  return service;
}

/** Réévaluation de la porte d'entrée (après une connexion ou une suppression). */
export const AccountGateRefreshContext = createContext<() => void>(() => undefined);

export function useAccountGateRefresh(): () => void {
  return useContext(AccountGateRefreshContext);
}
