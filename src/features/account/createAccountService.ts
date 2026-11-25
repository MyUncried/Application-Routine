import * as Crypto from "expo-crypto";

import { AccountService, type AccountGateway } from "@/domain/account/AccountService";
import type { Database } from "@/infrastructure/database/Database";
import { SqliteAccountRepository } from "@/infrastructure/database/repositories/SqliteAccountRepository";

/**
 * Passerelle chargée au premier appel seulement : Supabase et les modules natifs de connexion ne sont importés que
 * lorsque l'application en a réellement besoin (aucun effet au démarrage ni dans les tests qui n'utilisent pas le compte).
 */
function lazyGateway(): AccountGateway {
  let instance: AccountGateway | null = null;
  const resolve = (): AccountGateway => {
    if (!instance) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { SupabaseAccountGateway } = require("@/infrastructure/account/SupabaseAccountGateway") as typeof import("@/infrastructure/account/SupabaseAccountGateway");
      instance = new SupabaseAccountGateway();
    }
    return instance;
  };
  return {
    signIn: (provider) => resolve().signIn(provider),
    signOutLocal: () => resolve().signOutLocal(),
    linkAccount: (localUserId, givenName, familyName) => resolve().linkAccount(localUserId, givenName, familyName),
    storeAppleToken: (token) => resolve().storeAppleToken(token),
    deleteAccount: (receipt) => resolve().deleteAccount(receipt),
    deletionStatus: (input) => resolve().deletionStatus(input),
    refreshSession: () => resolve().refreshSession(),
  };
}

export function createAccountService(database: Database, gateway: AccountGateway = lazyGateway()): AccountService {
  return new AccountService(
    new SqliteAccountRepository(database),
    gateway,
    { sha256: (value) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value) },
    // Reçu de suppression : 256 bits aléatoires.
    () => `${Crypto.randomUUID()}${Crypto.randomUUID()}`.replace(/-/g, ""),
    () => new Date().toISOString(),
    (message, error) => console.warn(message, error),
  );
}
