import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  AccountService,
  subjectFingerprint,
  type AccountGateway,
  type AccountIdentity,
  type AccountLifecycle,
  type AccountLink,
  type AccountStore,
  type DeleteResult,
  type DeletionStatus,
  type LinkResponse,
  type ProviderSession,
  type RefreshResult,
} from "../AccountService";

const hasher = { sha256: async (value: string) => `h(${value})` };

function session(overrides: Partial<ProviderSession> = {}): ProviderSession {
  return {
    authUserId: "auth-x",
    provider: "apple",
    providerSubject: "sub-x",
    email: "x@example.com",
    givenName: "Hermann",
    familyName: "Adjou",
    appleToken: { mode: "native", authorizationCode: "code", clientId: "com.ankusha.kodjo" },
    ...overrides,
  };
}

class MemoryStore implements AccountStore {
  link: AccountLink | null = null;
  lifecycle: AccountLifecycle = { state: "NEVER_LINKED", deletionReceipt: null, deletedProviderSubjectHash: null };
  businessData = false;
  localUserId = "usr_phone1";
  async getLink() {
    return this.link;
  }
  async getLifecycle() {
    return { ...this.lifecycle };
  }
  async saveLink(link: AccountLink) {
    this.link = link;
    this.lifecycle = { state: "LINKED", deletionReceipt: null, deletedProviderSubjectHash: null };
  }
  async setState(state: "REAUTH_REQUIRED" | "LINKED") {
    this.lifecycle.state = state;
  }
  async beginDeletion(receipt: string) {
    this.lifecycle = { ...this.lifecycle, state: "DELETION_PENDING", deletionReceipt: receipt };
  }
  async completeDeletion(hash: string) {
    this.link = null;
    this.lifecycle = { state: "DELETED_ON_THIS_DEVICE", deletionReceipt: null, deletedProviderSubjectHash: hash };
  }
  async hasBusinessData() {
    return this.businessData;
  }
  async getLocalUserId() {
    return this.localUserId;
  }
}

class FakeGateway implements AccountGateway {
  nextSession: ProviderSession | "cancelled" | Error = session();
  signedOut = 0;
  linked: { localUserId: string; givenName: string | null; provider?: string }[] = [];
  discarded = 0;
  identities: AccountIdentity[] = [];
  storedTokens: unknown[] = [];
  deleteResults: DeleteResult[] = [];
  statusResults: DeletionStatus[] = [];
  statusCalls: { authUserId: string; receipt?: string; localUserId?: string }[] = [];
  refreshResult: RefreshResult = "ok";
  linkFails = false;
  tokenFails = false;
  async signIn() {
    if (this.nextSession instanceof Error) throw this.nextSession;
    return this.nextSession;
  }
  async signOutLocal() {
    this.signedOut += 1;
  }
  async discardUnlinkedUser() {
    this.discarded += 1;
  }
  async currentIdentities() {
    return this.identities;
  }
  async linkAccount(localUserId: string, givenName: string | null, _familyName: string | null, provider?: string): Promise<LinkResponse> {
    if (this.linkFails) throw new Error("network");
    this.linked.push({ localUserId, givenName, provider });
    const current = this.nextSession as ProviderSession;
    return {
      authUserId: current.authUserId,
      provider: current.provider,
      providerSubject: current.providerSubject,
      email: current.email,
      emailIsPrivateRelay: false,
      givenName: current.givenName,
      familyName: current.familyName,
      catalogueId: "cat",
    };
  }
  async storeAppleToken(token: unknown) {
    if (this.tokenFails) throw new Error("x");
    this.storedTokens.push(token);
  }
  deleteCalls = 0;
  deleteGate: Promise<void> | null = null;
  async deleteAccount() {
    this.deleteCalls += 1;
    if (this.deleteGate) await this.deleteGate;
    return this.deleteResults.shift() ?? "retryable_error";
  }
  async deletionStatus(input: { authUserId: string; receipt?: string; localUserId?: string }) {
    this.statusCalls.push(input);
    return this.statusResults.shift() ?? "unknown";
  }
  async refreshSession() {
    return this.refreshResult;
  }
}

let store: MemoryStore;
let gateway: FakeGateway;
let service: AccountService;

beforeEach(() => {
  store = new MemoryStore();
  gateway = new FakeGateway();
  service = new AccountService(store, gateway, hasher, () => "receipt-123456789012", () => "2026-11-25T10:00:00.000Z");
});

describe("porte d'entrée", () => {
  it("sans lien : É1 ; installation neuve ou existante selon les données", async () => {
    expect(await service.gate()).toEqual({ kind: "sign_in", existingInstallation: false });
    store.businessData = true;
    expect(await service.gate()).toEqual({ kind: "sign_in", existingInstallation: true });
  });

  it("lien présent : ouverture, hors ligne compris ; REAUTH_REQUIRED : É1 avant ouverture, lien conservé", async () => {
    await service.signIn("apple");
    expect(await service.gate()).toEqual({ kind: "open" });
    await store.setState("REAUTH_REQUIRED");
    expect(await service.gate()).toEqual({ kind: "sign_in", existingInstallation: true });
    expect(store.link).not.toBeNull();
  });
});

describe("rattachement R1 à R6", () => {
  it("R1 compte neuf : rattachement de l'Utilisateur local, nom et jeton Apple enregistrés", async () => {
    expect(await service.signIn("apple")).toEqual({ kind: "linked" });
    expect(gateway.linked).toEqual([{ localUserId: "usr_phone1", givenName: "Hermann", provider: "apple" }]);
    expect(gateway.storedTokens).toHaveLength(1);
    expect(store.link).toMatchObject({ authUserId: "auth-x", provider: "apple", givenName: "Hermann", linkedAt: "2026-11-25T10:00:00.000Z" });
  });

  it("R2/R3 : même compte sur un second téléphone (autre identifiant local) : accepté, sans fusion", async () => {
    store.localUserId = "usr_phone2";
    store.businessData = true;
    expect(await service.signIn("apple")).toEqual({ kind: "linked" });
    expect(gateway.linked[0].localUserId).toBe("usr_phone2");
  });

  it("annulation : aucun effet", async () => {
    gateway.nextSession = "cancelled";
    expect(await service.signIn("google")).toEqual({ kind: "cancelled" });
    expect(store.link).toBeNull();
  });

  it("R4 : autre compte sur un téléphone lié à X : refus É4, lien et données de X intacts, aucun rattachement", async () => {
    await service.signIn("apple");
    await store.setState("REAUTH_REQUIRED");
    gateway.nextSession = session({ authUserId: "auth-y", provider: "google", providerSubject: "sub-y", email: "y@example.com" });
    gateway.linked = [];
    expect(await service.signIn("google")).toEqual({ kind: "refused_other_account", provider: "apple", email: "x@example.com" });
    expect(gateway.linked).toEqual([]);
    expect(store.link?.authUserId).toBe("auth-x");
    expect(gateway.signedOut).toBe(1);
    expect(gateway.discarded).toBe(1);
  });

  it("R5 : après suppression, même identifiant (compte neuf) : rattaché ; autre identifiant, neuf ou existant : refus É4-R5", async () => {
    store.link = null;
    store.lifecycle = {
      state: "DELETED_ON_THIS_DEVICE",
      deletionReceipt: null,
      deletedProviderSubjectHash: await subjectFingerprint(hasher, "apple", "sub-x"),
    };
    gateway.nextSession = session({ authUserId: "auth-y", provider: "google", providerSubject: "sub-y" });
    expect(await service.signIn("google")).toEqual({ kind: "refused_deleted_account" });
    expect(gateway.linked).toEqual([]);
    gateway.nextSession = session({ authUserId: "auth-x2", providerSubject: "sub-x" });
    expect(await service.signIn("apple")).toEqual({ kind: "linked" });
    expect((await store.getLink())?.authUserId).toBe("auth-x2");
  });

  it("CPT-35 : connexion transmise au rattachement avec son fournisseur", async () => {
    gateway.nextSession = session({ provider: "google", providerSubject: "sub-g" });
    await service.signIn("google");
    expect(gateway.linked.at(-1)?.provider).toBe("google");
  });

  it("CPT-35 : compte supprimé avec identités Apple et Google (même e-mail) : l'une ou l'autre est acceptée ensuite", async () => {
    await service.signIn("apple");
    gateway.identities = [{ provider: "apple", subject: "sub-x" }, { provider: "google", subject: "sub-g" }];
    gateway.deleteResults = ["deleted"];
    expect(await service.deleteAccount()).toBe("deleted");
    expect(store.lifecycle.deletedProviderSubjectHash?.split(",")).toHaveLength(2);
    gateway.nextSession = session({ authUserId: "auth-g", provider: "google", providerSubject: "sub-g" });
    expect(await service.signIn("google")).toEqual({ kind: "linked" });
  });

  it("CPT-35 : identités illisibles à la suppression : l'identifiant du lien reste accepté, un autre est refusé", async () => {
    await service.signIn("apple");
    gateway.currentIdentities = async () => {
      throw new Error("network");
    };
    gateway.deleteResults = ["deleted"];
    expect(await service.deleteAccount()).toBe("deleted");
    gateway.nextSession = session({ authUserId: "auth-g", provider: "google", providerSubject: "sub-g" });
    expect(await service.signIn("google")).toEqual({ kind: "refused_deleted_account" });
    expect(gateway.discarded).toBe(1);
    gateway.nextSession = session({ authUserId: "auth-x3", providerSubject: "sub-x" });
    expect(await service.signIn("apple")).toEqual({ kind: "linked" });
  });

  it("CPT-32 : lien présent, même titulaire avec un nouvel auth_user_id (ancien compte supprimé) : accepté", async () => {
    await service.signIn("apple");
    gateway.nextSession = session({ authUserId: "auth-x-new" });
    expect(await service.signIn("apple")).toEqual({ kind: "linked" });
    expect(store.link?.authUserId).toBe("auth-x-new");
  });

  it("R6 : coupure pendant le rattachement : pas de lien écrit, nouvel essai possible", async () => {
    gateway.linkFails = true;
    expect(await service.signIn("apple")).toEqual({ kind: "error" });
    expect(store.link).toBeNull();
    gateway.linkFails = false;
    expect(await service.signIn("apple")).toEqual({ kind: "linked" });
  });

  it("jeton Apple non enregistré : la connexion aboutit quand même", async () => {
    gateway.tokenFails = true;
    expect(await service.signIn("apple")).toEqual({ kind: "linked" });
  });
});

describe("suppression", () => {
  beforeEach(async () => {
    await service.signIn("apple");
  });

  it("réussie : lien effacé, empreinte conservée, session fermée", async () => {
    gateway.deleteResults = ["deleted"];
    expect(await service.deleteAccount()).toBe("deleted");
    expect(store.link).toBeNull();
    expect(store.lifecycle).toEqual({
      state: "DELETED_ON_THIS_DEVICE",
      deletionReceipt: null,
      deletedProviderSubjectHash: await subjectFingerprint(hasher, "apple", "sub-x"),
    });
    expect(gateway.signedOut).toBeGreaterThan(0);
  });

  it("sans réseau : rien n'est effacé, suppression en suspens conservée", async () => {
    gateway.deleteResults = ["network"];
    expect(await service.deleteAccount()).toBe("offline");
    expect(store.link).not.toBeNull();
    expect(store.lifecycle).toMatchObject({ state: "DELETION_PENDING", deletionReceipt: "receipt-123456789012" });
  });

  it("cas a : erreur reprenable puis reprise au lancement avec le même reçu", async () => {
    gateway.deleteResults = ["retryable_error"];
    expect(await service.deleteAccount()).toBe("error");
    expect(store.link).not.toBeNull();
    gateway.deleteResults = ["deleted"];
    expect(await service.resumePendingDeletion()).toBe("deleted");
    expect(store.link).toBeNull();
  });

  it("cas b1/b2 : session inutilisable, preuve par le reçu ; deleted → nettoyage", async () => {
    gateway.deleteResults = ["network"];
    await service.deleteAccount();
    gateway.deleteResults = ["not_authenticated"];
    gateway.statusResults = ["deleted"];
    expect(await service.resumePendingDeletion()).toBe("deleted");
    expect(gateway.statusCalls[0]).toEqual({ authUserId: "auth-x", receipt: "receipt-123456789012" });
    expect(store.link).toBeNull();
  });

  it("bouton de É3 et reprise au premier plan simultanés : un seul appel au serveur, même résultat", async () => {
    let release: () => void = () => undefined;
    gateway.deleteGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    gateway.deleteResults = ["deleted"];
    const fromButton = service.deleteAccount();
    while (gateway.deleteCalls === 0) await Promise.resolve();
    const fromResume = service.resumePendingDeletion();
    release();
    expect(await fromButton).toBe("deleted");
    expect(await fromResume).toBe("deleted");
    expect(gateway.deleteCalls).toBe(1);
    expect(store.link).toBeNull();
  });

  it("cas b2, service Auth indisponible : indeterminate, lien conservé, nouvel essai plus tard", async () => {
    gateway.deleteResults = ["not_authenticated"];
    gateway.statusResults = ["indeterminate"];
    expect(await service.deleteAccount()).toBe("error");
    expect(store.link).not.toBeNull();
    expect(store.lifecycle.state).toBe("DELETION_PENDING");
  });
});

describe("retour du réseau (cas c)", () => {
  beforeEach(async () => {
    await service.signIn("apple");
  });

  it("session valide ou erreur transitoire : aucun changement", async () => {
    gateway.refreshResult = "ok";
    expect(await service.checkSession()).toBe("ok");
    gateway.refreshResult = "transient";
    expect(await service.checkSession()).toBe("unchanged");
    expect(store.lifecycle.state).toBe("LINKED");
  });

  it("session refusée, compte supprimé ailleurs (preuve local_user_id) : nettoyage, données conservées", async () => {
    gateway.refreshResult = "refused";
    gateway.statusResults = ["deleted"];
    expect(await service.checkSession()).toBe("deleted");
    expect(gateway.statusCalls[0]).toEqual({ authUserId: "auth-x", localUserId: "usr_phone1" });
    expect(store.link).toBeNull();
  });

  it("session refusée, compte actif / en cours / état non prouvé : É1 avant ouverture, lien conservé", async () => {
    for (const status of ["active", "in_progress", "unknown"] as const) {
      await store.setState("LINKED");
      gateway.refreshResult = "refused";
      gateway.statusResults = [status];
      expect(await service.checkSession()).toBe("reauth_required");
      expect(await service.gate()).toEqual({ kind: "sign_in", existingInstallation: true });
      expect(store.link).not.toBeNull();
    }
  });

  it("session refusée, service Auth indisponible (indeterminate) : écran courant conservé, pas de É1, lien conservé", async () => {
    gateway.refreshResult = "refused";
    gateway.statusResults = ["indeterminate"];
    expect(await service.checkSession()).toBe("unchanged");
    expect(await service.gate()).toEqual({ kind: "open" });
    expect(store.lifecycle.state).toBe("LINKED");
  });

  it("session révoquée puis reconnexion du même compte : R3, état LINKED", async () => {
    gateway.refreshResult = "refused";
    gateway.statusResults = ["active"];
    await service.checkSession();
    expect(await service.signIn("apple")).toEqual({ kind: "linked" });
    expect(await service.gate()).toEqual({ kind: "open" });
  });
});
