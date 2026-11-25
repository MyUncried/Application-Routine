/**
 * @jest-environment node
 */
import { describe, expect, it, jest } from "@jest/globals";

import {
  AuthUnavailableError,
  deletionStatus,
  proofHash,
  runDeletion,
  type AppleRevocation,
  type DeletionPorts,
  type DeletionRecord,
} from "../deletion";

const UID = "00000000-0000-0000-0000-0000000000aa";

type FakeState = {
  record: DeletionRecord | null;
  account: { provider: "apple" | "google"; appleTokensInvalidatedAt: string | null } | null;
  localUsers: string[];
  token: { clientId: string; refreshToken: string } | null;
  authExists: boolean;
  calls: string[];
  fail: Partial<Record<"revoke" | "storage" | "purge" | "authExists" | "deleteAuth" | "markAuth", boolean>>;
};

function fake(overrides: Partial<FakeState> = {}): { state: FakeState; ports: DeletionPorts } {
  const state: FakeState = {
    record: null,
    account: { provider: "apple", appleTokensInvalidatedAt: null },
    localUsers: ["usr_1", "usr_2"],
    token: { clientId: "com.ankusha.kodjo", refreshToken: "rt" },
    authExists: true,
    calls: [],
    fail: {},
    ...overrides,
  };
  const ports: DeletionPorts = {
    async beginRecord(authUserId, receiptHash, localUserHashes) {
      state.calls.push("begin");
      state.record ??= { authUserId, receiptHash, localUserHashes, appleRevocation: null, dataPurgedAt: null, authDeletedAt: null };
      state.record.receiptHash ??= receiptHash;
      return { ...state.record };
    },
    async loadRecord() {
      return state.record ? { ...state.record } : null;
    },
    async loadAccount() {
      return state.account;
    },
    async listLocalUserIds() {
      return state.localUsers;
    },
    async loadAppleToken() {
      return state.token;
    },
    async revokeAppleToken() {
      state.calls.push("revoke");
      if (state.fail.revoke) throw new Error("apple down");
    },
    async setAppleRevocation(_uid, value: AppleRevocation) {
      state.record!.appleRevocation = value;
    },
    async deleteStorageObjects() {
      state.calls.push("storage");
      if (state.fail.storage) throw new Error("storage");
    },
    async purgeAccountData() {
      state.calls.push("purge");
      if (state.fail.purge) throw new Error("purge");
      state.account = null;
      state.token = null;
      state.record!.dataPurgedAt = "t4";
    },
    async authUserExists() {
      state.calls.push("authExists");
      if (state.fail.authExists) throw new AuthUnavailableError();
      return state.authExists;
    },
    async deleteAuthUser() {
      state.calls.push("deleteAuth");
      if (state.fail.deleteAuth) throw new Error("auth");
      state.authExists = false;
    },
    async markAuthDeleted() {
      state.calls.push("markAuth");
      if (state.fail.markAuth) throw new Error("interrupted");
      state.record!.authDeletedAt = "t5";
    },
  };
  return { state, ports };
}

describe("runDeletion — ordre et reprise", () => {
  it("Apple : révocation en premier, puis stockage, purge, suppression Auth ; réponse deleted", async () => {
    const { state, ports } = fake();
    expect(await runDeletion(UID, "receipt", ports)).toEqual({ result: "deleted" });
    expect(state.calls).toEqual(["begin", "revoke", "storage", "purge", "authExists", "deleteAuth", "markAuth"]);
    expect(state.record).toMatchObject({ appleRevocation: "done", dataPurgedAt: "t4", authDeletedAt: "t5" });
    expect(state.record!.receiptHash).toBe(await proofHash(UID, "receipt"));
  });

  it("échec de la révocation Apple : retryable_error, rien n'est supprimé", async () => {
    const { state, ports } = fake({ fail: { revoke: true } });
    expect(await runDeletion(UID, "r", ports)).toEqual({ result: "retryable_error", reason: "apple_revoke" });
    expect(state.calls).not.toContain("purge");
    expect(state.account).not.toBeNull();
  });

  it("registre impossible à créer (droits manquants) : retryable_error « record », cause journalisée côté serveur", async () => {
    const { ports } = fake();
    const cause = new Error("permission denied for table account_local_users");
    ports.listLocalUserIds = async () => {
      throw cause;
    };
    const logError = jest.fn();
    expect(await runDeletion(UID, "r", { ...ports, logError })).toEqual({ result: "retryable_error", reason: "record" });
    expect(logError).toHaveBeenCalledWith("record", cause);
  });

  it("Google : not_applicable, aucun appel de révocation", async () => {
    const { state, ports } = fake({ account: { provider: "google", appleTokensInvalidatedAt: null }, token: null });
    expect(await runDeletion(UID, "r", ports)).toEqual({ result: "deleted" });
    expect(state.calls).not.toContain("revoke");
    expect(state.record!.appleRevocation).toBe("not_applicable");
  });

  it("consent-revoked sans nouvelle autorisation : not_required, purge sans révocation", async () => {
    const { state, ports } = fake({ token: null, account: { provider: "apple", appleTokensInvalidatedAt: "t" } });
    expect(await runDeletion(UID, "r", ports)).toEqual({ result: "deleted" });
    expect(state.calls).not.toContain("revoke");
    expect(state.record!.appleRevocation).toBe("not_required");
  });

  it("consent-revoked puis nouvelle autorisation : le nouveau jeton présent est révoqué", async () => {
    // Le nouveau jeton remet le marqueur à vide (store_apple_token) ; même s'il restait renseigné, un jeton présent est révoqué.
    const { state, ports } = fake({ account: { provider: "apple", appleTokensInvalidatedAt: "ancien" }, token: { clientId: "com.ankusha.kodjo.signin", refreshToken: "nouveau" } });
    expect(await runDeletion(UID, "r", ports)).toEqual({ result: "deleted" });
    expect(state.calls).toContain("revoke");
    expect(state.record!.appleRevocation).toBe("done");
  });

  it("compte Apple sans jeton ni invalidation : aucune suppression sans révocation", async () => {
    const { state, ports } = fake({ token: null });
    expect(await runDeletion(UID, "r", ports)).toEqual({ result: "retryable_error", reason: "apple_token_missing" });
    expect(state.calls).not.toContain("purge");
  });

  it("cas a : purge faite, deleteUser en échec, puis reprise à l'étape 5 sans révocation répétée", async () => {
    const { state, ports } = fake({ fail: { deleteAuth: true } });
    expect(await runDeletion(UID, "r", ports)).toEqual({ result: "retryable_error", reason: "auth_delete" });
    expect(state.record!.dataPurgedAt).toBe("t4");
    state.fail = {};
    state.calls = [];
    expect(await runDeletion(UID, "r", ports)).toEqual({ result: "deleted" });
    expect(state.calls).toEqual(["begin", "authExists", "deleteAuth", "markAuth"]);
  });

  it("reprise de l'étape 5 avec compte déjà absent : pas de second deleteUser", async () => {
    const { state, ports } = fake({ fail: { markAuth: true } });
    expect((await runDeletion(UID, "r", ports)).result).toBe("retryable_error");
    expect(state.authExists).toBe(false);
    state.fail = {};
    state.calls = [];
    expect(await runDeletion(UID, "r", ports)).toEqual({ result: "deleted" });
    expect(state.calls).toEqual(["begin", "authExists", "markAuth"]);
  });

  it("service Auth indisponible à l'étape 5 : retryable_error, aucune conclusion", async () => {
    const { state, ports } = fake({ fail: { authExists: true } });
    expect(await runDeletion(UID, "r", ports)).toEqual({ result: "retryable_error", reason: "auth_unavailable" });
    expect(state.record!.authDeletedAt).toBeNull();
  });

  it("déjà achevée : deleted sans aucune étape", async () => {
    const { state, ports } = fake();
    await runDeletion(UID, "r", ports);
    state.calls = [];
    expect(await runDeletion(UID, "r", ports)).toEqual({ result: "deleted" });
    expect(state.calls).toEqual(["begin"]);
  });
});

describe("deletionStatus — preuve sans session", () => {
  function statusPorts(record: DeletionRecord | null, opts: { linked?: string[]; authExists?: boolean; authDown?: boolean } = {}) {
    const writes: string[] = [];
    return {
      writes,
      ports: {
        async loadRecord() {
          return record;
        },
        async accountHasLocalUser(_uid: string, localUserId: string) {
          return (opts.linked ?? []).includes(localUserId);
        },
        async authUserExists() {
          if (opts.authDown) throw new AuthUnavailableError();
          return opts.authExists ?? false;
        },
        async markAuthDeleted() {
          writes.push("markAuth");
        },
      },
    };
  }

  async function record(partial: Partial<DeletionRecord>): Promise<DeletionRecord> {
    return {
      authUserId: UID,
      receiptHash: await proofHash(UID, "receipt"),
      localUserHashes: [await proofHash(UID, "usr_2")],
      appleRevocation: "done",
      dataPurgedAt: null,
      authDeletedAt: null,
      ...partial,
    };
  }

  it("cas b1 : suppression achevée, reçu valable → deleted", async () => {
    const { ports } = statusPorts(await record({ dataPurgedAt: "t4", authDeletedAt: "t5" }));
    expect(await deletionStatus(UID, { receipt: "receipt" }, ports)).toBe("deleted");
  });

  it("cas b2 : interruption après deleteUser (pas d'auth_deleted_at), compte absent vérifié → deleted et registre complété", async () => {
    const { ports, writes } = statusPorts(await record({ dataPurgedAt: "t4" }), { authExists: false });
    expect(await deletionStatus(UID, { receipt: "receipt" }, ports)).toBe("deleted");
    expect(writes).toEqual(["markAuth"]);
  });

  it("cas b2 avec service Auth indisponible → indeterminate, aucune écriture", async () => {
    const { ports, writes } = statusPorts(await record({ dataPurgedAt: "t4" }), { authDown: true });
    expect(await deletionStatus(UID, { receipt: "receipt" }, ports)).toBe("indeterminate");
    expect(writes).toEqual([]);
  });

  it("cas a vu par deletion-status : purge faite, compte Auth encore présent → in_progress", async () => {
    const { ports } = statusPorts(await record({ dataPurgedAt: "t4" }), { authExists: true });
    expect(await deletionStatus(UID, { receipt: "receipt" }, ports)).toBe("in_progress");
  });

  it("cas c : autre téléphone du compte supprimé (local_user_id) → deleted", async () => {
    const { ports } = statusPorts(await record({ dataPurgedAt: "t4", authDeletedAt: "t5" }));
    expect(await deletionStatus(UID, { localUserId: "usr_2" }, ports)).toBe("deleted");
  });

  it("cas c : compte actif (session seule révoquée) → active", async () => {
    const { ports } = statusPorts(null, { linked: ["usr_2"] });
    expect(await deletionStatus(UID, { localUserId: "usr_2" }, ports)).toBe("active");
  });

  it("preuve incorrecte → unknown, sans fuite", async () => {
    const { ports } = statusPorts(await record({ authDeletedAt: "t5" }));
    expect(await deletionStatus(UID, { receipt: "faux" }, ports)).toBe("unknown");
    expect(await deletionStatus(UID, { localUserId: "usr_autre" }, ports)).toBe("unknown");
  });

  it("registre purgé (après 90 jours) et compte inexistant → unknown", async () => {
    const { ports } = statusPorts(null);
    expect(await deletionStatus(UID, { receipt: "receipt", localUserId: "usr_2" }, ports)).toBe("unknown");
  });
});
