/**
 * KODJO — T1 Compte : logique de suppression du compte (plan `_bmad-output/compte/plan-lot-compte.md`, « Suppression »).
 *
 * Module autonome (aucune importation) pour être exécuté à la fois par Deno (fonctions serveur Supabase)
 * et par Jest. Les accès à la base, au service Auth, au stockage et à Apple sont fournis par des ports.
 *
 * Ordre et reprise (étapes de `account_deletions`) :
 *   1. création ou reprise du registre (reçu, empreintes des Utilisateurs locaux) ;
 *   2. révocation Apple (`done`), ou `not_required` (jetons déjà invalidés par Apple), ou `not_applicable` (Google) ;
 *   3. objets Storage du compte ;
 *   4. purge des données (`data_purged_at`) ;
 *   5. suppression Auth (`auth_deleted_at`), précédée d'une vérification d'existence à la reprise.
 * Chaque exécution reprend à la première étape non accomplie. Aucune réponse `deleted` sans preuve.
 */

export type AppleRevocation = "done" | "not_required" | "not_applicable";

export type DeletionRecord = {
  authUserId: string;
  receiptHash: string | null;
  localUserHashes: string[];
  appleRevocation: AppleRevocation | null;
  dataPurgedAt: string | null;
  authDeletedAt: string | null;
};

export type AccountSnapshot = {
  provider: "apple" | "google";
  appleTokensInvalidatedAt: string | null;
  /** CPT-35 : identité Apple rattachée à l'utilisateur, même si le compte indique Google (dernière connexion). */
  hasAppleIdentity: boolean;
};

/** Le service Auth n'a pas répondu : aucune conclusion ne doit être tirée. */
export class AuthUnavailableError extends Error {
  constructor(message = "auth_unavailable") {
    super(message);
    this.name = "AuthUnavailableError";
  }
}

export interface DeletionPorts {
  beginRecord(authUserId: string, receiptHash: string | null, localUserHashes: string[]): Promise<DeletionRecord>;
  loadRecord(authUserId: string): Promise<DeletionRecord | null>;
  loadAccount(authUserId: string): Promise<AccountSnapshot | null>;
  listLocalUserIds(authUserId: string): Promise<string[]>;
  loadAppleToken(authUserId: string): Promise<{ clientId: string; refreshToken: string } | null>;
  /** Rejette (exception) si Apple refuse ou ne répond pas. */
  revokeAppleToken(token: { clientId: string; refreshToken: string }): Promise<void>;
  setAppleRevocation(authUserId: string, value: AppleRevocation): Promise<void>;
  deleteStorageObjects(authUserId: string): Promise<void>;
  /** Étape 4, atomique : catalogues, rattachements, jeton, compte, puis `data_purged_at`. */
  purgeAccountData(authUserId: string): Promise<void>;
  /** Lève `AuthUnavailableError` si le service ne répond pas. */
  authUserExists(authUserId: string): Promise<boolean>;
  deleteAuthUser(authUserId: string): Promise<void>;
  markAuthDeleted(authUserId: string): Promise<void>;
  /** Journal serveur de la cause d'une erreur (jamais renvoyée au client au-delà de `reason`). */
  logError?(reason: string, error: unknown): void;
}

export type DeletionOutcome =
  | { result: "deleted" }
  | { result: "retryable_error"; reason: string };

export async function sha256Hex(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Empreinte d'une preuve (reçu de suppression ou identifiant local), salée par le compte. */
export function proofHash(authUserId: string, proof: string): Promise<string> {
  return sha256Hex(`kodjo-deletion:${authUserId}:${proof}`);
}

function failure(ports: DeletionPorts, reason: string, error: unknown): { result: "retryable_error"; reason: string } {
  ports.logError?.(reason, error);
  return { result: "retryable_error", reason };
}

export async function runDeletion(
  authUserId: string,
  receipt: string | null,
  ports: DeletionPorts,
): Promise<DeletionOutcome> {
  let record: DeletionRecord;
  try {
    const localUserIds = await ports.listLocalUserIds(authUserId);
    const localUserHashes = await Promise.all(localUserIds.map((id) => proofHash(authUserId, id)));
    const receiptHash = receipt ? await proofHash(authUserId, receipt) : null;
    record = await ports.beginRecord(authUserId, receiptHash, localUserHashes);
  } catch (error) {
    return failure(ports, "record", error);
  }
  if (record.authDeletedAt) return { result: "deleted" };

  if (!record.dataPurgedAt) {
    if (!record.appleRevocation) {
      const revocation = await revokeIfNeeded(authUserId, ports);
      if (revocation.result === "retryable_error") return revocation;
    }
    try {
      await ports.deleteStorageObjects(authUserId);
    } catch (error) {
      return failure(ports, "storage", error);
    }
    try {
      await ports.purgeAccountData(authUserId);
    } catch (error) {
      return failure(ports, "purge", error);
    }
  }

  return finishAuthDeletion(authUserId, ports);
}

async function revokeIfNeeded(authUserId: string, ports: DeletionPorts): Promise<DeletionOutcome | { result: "ok" }> {
  let account: AccountSnapshot | null;
  try {
    account = await ports.loadAccount(authUserId);
  } catch (error) {
    return failure(ports, "account", error);
  }
  try {
    if (!account || (account.provider === "google" && !account.hasAppleIdentity)) {
      await ports.setAppleRevocation(authUserId, "not_applicable");
      return { result: "ok" };
    }
    // Règle de l'étape 2 : un jeton présent est toujours révoqué, même après un ancien `consent-revoked`.
    const token = await ports.loadAppleToken(authUserId);
    if (token) {
      try {
        await ports.revokeAppleToken(token);
      } catch (error) {
        return failure(ports, "apple_revoke", error);
      }
      await ports.setAppleRevocation(authUserId, "done");
      return { result: "ok" };
    }
    if (account.appleTokensInvalidatedAt) {
      await ports.setAppleRevocation(authUserId, "not_required");
      return { result: "ok" };
    }
    // Compte Apple sans jeton ni invalidation connue : aucune suppression sans révocation.
    return failure(ports, "apple_token_missing", null);
  } catch (error) {
    return failure(ports, "revocation_state", error);
  }
}

/** Étape 5 : vérifie l'existence du compte Auth avant de le supprimer (reprise après interruption, cas b2). */
async function finishAuthDeletion(authUserId: string, ports: DeletionPorts): Promise<DeletionOutcome> {
  try {
    const exists = await ports.authUserExists(authUserId);
    if (exists) {
      try {
        await ports.deleteAuthUser(authUserId);
      } catch (error) {
        // Exécution concurrente (recette 25/11/2026) : l'autre exécution a déjà supprimé le compte Auth.
        // Seule une absence vérifiée vaut succès ; sinon l'erreur d'origine est conservée.
        if (await ports.authUserExists(authUserId)) throw error;
      }
    }
    await ports.markAuthDeleted(authUserId);
    return { result: "deleted" };
  } catch (error) {
    return failure(ports, error instanceof AuthUnavailableError ? "auth_unavailable" : "auth_delete", error);
  }
}

export type DeletionStatus = "deleted" | "in_progress" | "active" | "unknown" | "indeterminate";

export interface DeletionStatusPorts {
  loadRecord(authUserId: string): Promise<DeletionRecord | null>;
  /** Vrai si `local_user_id` est rattaché au compte encore existant. */
  accountHasLocalUser(authUserId: string, localUserId: string): Promise<boolean>;
  authUserExists(authUserId: string): Promise<boolean>;
  markAuthDeleted(authUserId: string): Promise<void>;
}

/**
 * `deletion-status` : sans session, sur preuve (reçu de suppression ou `local_user_id`).
 * Sans preuve valable : `unknown`, sans autre information. Service Auth indisponible : `indeterminate`, aucune écriture.
 */
export async function deletionStatus(
  authUserId: string,
  proof: { receipt?: string; localUserId?: string },
  ports: DeletionStatusPorts,
): Promise<DeletionStatus> {
  const record = await ports.loadRecord(authUserId);
  if (record) {
    const hashes: string[] = [];
    if (proof.receipt) hashes.push(await proofHash(authUserId, proof.receipt));
    if (proof.localUserId) hashes.push(await proofHash(authUserId, proof.localUserId));
    const proven = hashes.some((hash) => hash === record.receiptHash || record.localUserHashes.includes(hash));
    if (proven) {
      if (record.authDeletedAt) return "deleted";
      if (record.dataPurgedAt) {
        try {
          const exists = await ports.authUserExists(authUserId);
          if (exists) return "in_progress";
          await ports.markAuthDeleted(authUserId);
          return "deleted";
        } catch {
          return "indeterminate";
        }
      }
      return "in_progress";
    }
  }
  if (proof.localUserId && (await ports.accountHasLocalUser(authUserId, proof.localUserId))) {
    return record ? "in_progress" : "active";
  }
  return "unknown";
}
