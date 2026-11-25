import * as Network from "expo-network";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import type { GateState } from "@/domain/account/AccountService";
import { AccountGateRefreshContext, useAccountService } from "@/features/account/AccountServiceContext";
import { SignInScreen } from "@/features/account/SignInScreen";

/**
 * Porte d'entrée du compte (T1, CPT-02) : É1 tant qu'aucun lien n'existe, ou si la réauthentification est requise.
 * Un lien présent ouvre l'application, hors ligne compris. Au démarrage et au retour au premier plan, avec réseau :
 * reprise d'une suppression en suspens, puis contrôle de la session (cas c : `deletion-status`).
 */
export function AccountGate({ children }: { children: ReactNode }) {
  const service = useAccountService();
  const [gate, setGate] = useState<GateState | null>(null);
  const checking = useRef(false);

  const refresh = useCallback(() => {
    service.gate().then(setGate, (error: unknown) => {
      console.warn("État du compte illisible.", error);
      setGate({ kind: "sign_in", existingInstallation: true });
    });
  }, [service]);

  const checkWithNetwork = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    try {
      const network = await Network.getNetworkStateAsync().catch(() => null);
      if (network?.isConnected === false) return;
      await service.resumePendingDeletion();
      const result = await service.checkSession();
      if (result === "deleted" || result === "reauth_required") refresh();
    } catch (error) {
      console.warn("Contrôle du compte impossible.", error);
    } finally {
      checking.current = false;
    }
  }, [service, refresh]);

  useEffect(() => {
    refresh();
    void checkWithNetwork().then(refresh);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void checkWithNetwork();
    });
    return () => subscription.remove();
  }, [refresh, checkWithNetwork]);

  if (!gate) return null;
  return (
    <AccountGateRefreshContext.Provider value={refresh}>
      {gate.kind === "open" ? children : <SignInScreen existingInstallation={gate.existingInstallation} onLinked={refresh} />}
    </AccountGateRefreshContext.Provider>
  );
}
