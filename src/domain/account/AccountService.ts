/**
 * T1 Compte — service de compte (plan `_bmad-output/compte/plan-lot-compte.md`, T1).
 *
 * Décisions : CPT-02 (compte obligatoire, hors ligne après la première connexion), CPT-03 et CPT-12 (Apple, Google),
 * CPT-08 à CPT-10 (suppression, données locales conservées), CPT-13 (fournisseur, nom, e-mail), CPT-14 (refus d'un autre
 * compte), CPT-32 (après suppression, seul le même identifiant Apple ou Google retrouve les données), CPT-35 (identités
 * Apple et Google de même e-mail rattachées à un seul compte : l'une ou l'autre est acceptée).
 *
 * Le service ne dépend ni de Supabase ni de SQLite : il reçoit des ports. Il n'écrit jamais dans les données métier et ne
 * réécrit jamais `users.id`.
 */

export type AccountProvider = "apple" | "google";

export type AccountLink = {
  authUserId: string;
  provider: AccountProvider;
  providerSubject: string;
  email: string | null;
  emailIsPrivateRelay: boolean;
  givenName: string | null;
  familyName: string | null;
  catalogueId: string | null;
  linkedAt: string;
};

export type LifecycleState = "NEVER_LINKED" | "LINKED" | "REAUTH_REQUIRED" | "DELETION_PENDING" | "DELETED_ON_THIS_DEVICE";

export type AccountLifecycle = {
  state: LifecycleState;
  deletionReceipt: string | null;
  deletedProviderSubjectHash: string | null;
};

export interface AccountStore {
  getLink(): Promise<AccountLink | null>;
  getLifecycle(): Promise<AccountLifecycle>;
  /** Écrit le lien et passe à `LINKED` (efface le reçu et l'empreinte de suppression). */
  saveLink(link: AccountLink): Promise<void>;
  setState(state: "REAUTH_REQUIRED" | "LINKED"): Promise<void>;
  /** `DELETION_PENDING` avec le reçu ; le lien est conservé. */
  beginDeletion(receipt: string): Promise<void>;
  /**
   * Efface le lien et le reçu, conserve les empreintes des identifiants du compte supprimé (une ou plusieurs, séparées
   * par des virgules, CPT-35), passe à `DELETED_ON_THIS_DEVICE`.
   */
  completeDeletion(deletedProviderSubjectHash: string): Promise<void>;
  /** Vrai si le téléphone contient des données métier (installation existante). */
  hasBusinessData(): Promise<boolean>;
  getLocalUserId(): Promise<string>;
}

export type ProviderSession = {
  authUserId: string;
  provider: AccountProvider;
  providerSubject: string;
  email: string | null;
  givenName: string | null;
  familyName: string | null;
  appleToken: { mode: "native"; authorizationCode: string; clientId: string } | { mode: "web"; providerRefreshToken: string } | null;
};

export type LinkResponse = {
  authUserId: string;
  provider: AccountProvider;
  providerSubject: string;
  email: string | null;
  emailIsPrivateRelay: boolean;
  givenName: string | null;
  familyName: string | null;
  catalogueId: string | null;
};

export type AccountIdentity = { provider: AccountProvider; subject: string };

export type DeleteResult = "deleted" | "retryable_error" | "not_authenticated" | "network";
export type DeletionStatus = "deleted" | "in_progress" | "active" | "unknown" | "indeterminate" | "network";
export type RefreshResult = "ok" | "transient" | "refused";

export interface AccountGateway {
  /** Ouvre la connexion du fournisseur ; `cancelled` si l'utilisateur annule. Lève une erreur en cas d'échec. */
  signIn(provider: AccountProvider): Promise<ProviderSession | "cancelled">;
  /** Ferme la session sur ce téléphone seulement (aucun appel réseau requis). */
  signOutLocal(): Promise<void>;
  /** `provider` : fournisseur de la connexion en cours ; le compte retient cette identité (CPT-35). */
  linkAccount(localUserId: string, givenName: string | null, familyName: string | null, provider: AccountProvider): Promise<LinkResponse>;
  /** Connexion refusée par l'app : supprime l'utilisateur Auth s'il n'a pas de compte KODJO (CPT-35). */
  discardUnlinkedUser(): Promise<void>;
  /** Identités Apple et Google de l'utilisateur connecté (rattachées par Supabase quand l'e-mail est le même, CPT-35). */
  currentIdentities(): Promise<AccountIdentity[]>;
  storeAppleToken(token: NonNullable<ProviderSession["appleToken"]>): Promise<void>;
  deleteAccount(receipt: string): Promise<DeleteResult>;
  deletionStatus(input: { authUserId: string; receipt?: string; localUserId?: string }): Promise<DeletionStatus>;
  refreshSession(): Promise<RefreshResult>;
}

export interface AccountHasher {
  sha256(value: string): Promise<string>;
}

export type SignInOutcome =
  | { kind: "linked" }
  | { kind: "cancelled" }
  | { kind: "refused_other_account"; provider: AccountProvider; email: string | null }
  | { kind: "refused_deleted_account" }
  | { kind: "error" };

export type DeleteOutcome = "deleted" | "offline" | "error";

export type GateState = { kind: "open" } | { kind: "sign_in"; existingInstallation: boolean };

export function subjectFingerprint(hasher: AccountHasher, provider: AccountProvider, subject: string): Promise<string> {
  return hasher.sha256(`kodjo-subject:${provider}:${subject}`);
}

export class AccountService {
  constructor(
    private readonly store: AccountStore,
    private readonly gateway: AccountGateway,
    private readonly hasher: AccountHasher,
    private readonly newReceipt: () => string,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly warn: (message: string, error?: unknown) => void = () => undefined,
  ) {}

  /** Porte d'entrée : un lien présent ouvre l'application, sauf `REAUTH_REQUIRED` (priorité de la réauthentification). */
  async gate(): Promise<GateState> {
    const [link, lifecycle] = await Promise.all([this.store.getLink(), this.store.getLifecycle()]);
    if (link && lifecycle.state !== "REAUTH_REQUIRED") return { kind: "open" };
    const existingInstallation =
      link !== null || lifecycle.state === "DELETED_ON_THIS_DEVICE" || (await this.store.hasBusinessData());
    return { kind: "sign_in", existingInstallation };
  }

  getLink(): Promise<AccountLink | null> {
    return this.store.getLink();
  }

  async signIn(provider: AccountProvider): Promise<SignInOutcome> {
    let session: ProviderSession | "cancelled";
    try {
      session = await this.gateway.signIn(provider);
    } catch (error) {
      this.warn("Connexion impossible.", error);
      return { kind: "error" };
    }
    if (session === "cancelled") return { kind: "cancelled" };

    const [link, lifecycle] = await Promise.all([this.store.getLink(), this.store.getLifecycle()]);
    if (link) {
      const sameAccount = session.authUserId === link.authUserId;
      // CPT-32 : même identifiant Apple ou Google, nouveau compte (l'ancien a été supprimé) : rattachement accepté.
      const sameHolder = session.provider === link.provider && session.providerSubject === link.providerSubject;
      if (!sameAccount && !sameHolder) {
        await this.safeDiscard();
        await this.safeSignOut();
        return { kind: "refused_other_account", provider: link.provider, email: link.email };
      }
    } else if (lifecycle.state === "DELETED_ON_THIS_DEVICE" && lifecycle.deletedProviderSubjectHash) {
      // CPT-32, CPT-35 : un des identifiants (Apple ou Google) du compte supprimé.
      const fingerprint = await subjectFingerprint(this.hasher, session.provider, session.providerSubject);
      if (!lifecycle.deletedProviderSubjectHash.split(",").includes(fingerprint)) {
        await this.safeDiscard();
        await this.safeSignOut();
        return { kind: "refused_deleted_account" };
      }
    }

    try {
      const localUserId = await this.store.getLocalUserId();
      const response = await this.gateway.linkAccount(localUserId, session.givenName, session.familyName, session.provider);
      if (session.appleToken) {
        try {
          await this.gateway.storeAppleToken(session.appleToken);
        } catch (error) {
          // Non bloquant : un nouveau jeton sera enregistré à la prochaine connexion Apple.
          this.warn("Jeton Apple non enregistré.", error);
        }
      }
      await this.store.saveLink({ ...response, linkedAt: this.now() });
      return { kind: "linked" };
    } catch (error) {
      this.warn("Rattachement impossible.", error);
      await this.safeDiscard();
      await this.safeSignOut();
      return { kind: "error" };
    }
  }

  /** É3 confirmée : suppression ; nettoyage local seulement après preuve `deleted`. Données métier conservées. */
  async deleteAccount(): Promise<DeleteOutcome> {
    const link = await this.store.getLink();
    if (!link) return "error";
    const lifecycle = await this.store.getLifecycle();
    const receipt = lifecycle.state === "DELETION_PENDING" && lifecycle.deletionReceipt ? lifecycle.deletionReceipt : this.newReceipt();
    await this.store.beginDeletion(receipt);
    return this.pursueDeletion(link, receipt);
  }

  /** Au lancement : reprise d'une suppression en suspens. */
  async resumePendingDeletion(): Promise<DeleteOutcome | "none"> {
    const [link, lifecycle] = await Promise.all([this.store.getLink(), this.store.getLifecycle()]);
    if (!link || lifecycle.state !== "DELETION_PENDING" || !lifecycle.deletionReceipt) return "none";
    return this.pursueDeletion(link, lifecycle.deletionReceipt);
  }

  /**
   * Retour du réseau (cas c) : la conclusion d'une session refusée vient seulement de `deletion-status`.
   * `deleted` → nettoyage ; `active`, `in_progress`, `unknown` → `REAUTH_REQUIRED` ; `indeterminate` ou réseau → aucun changement.
   */
  async checkSession(): Promise<"ok" | "unchanged" | "reauth_required" | "deleted"> {
    const [link, lifecycle] = await Promise.all([this.store.getLink(), this.store.getLifecycle()]);
    if (!link) return "unchanged";
    if (lifecycle.state === "DELETION_PENDING") {
      const resumed = await this.resumePendingDeletion();
      return resumed === "deleted" ? "deleted" : "unchanged";
    }
    const refresh = await this.gateway.refreshSession();
    if (refresh === "ok") return "ok";
    if (refresh === "transient") return "unchanged";
    const localUserId = await this.store.getLocalUserId();
    const status = await this.gateway.deletionStatus({ authUserId: link.authUserId, localUserId });
    if (status === "deleted") {
      await this.finalizeDeletion(link);
      return "deleted";
    }
    if (status === "indeterminate" || status === "network") return "unchanged";
    await this.store.setState("REAUTH_REQUIRED");
    return "reauth_required";
  }

  /** Une seule suppression à la fois : le bouton de É3 et la reprise au premier plan partagent le même appel. */
  private deletionInFlight: Promise<DeleteOutcome> | null = null;

  private pursueDeletion(link: AccountLink, receipt: string): Promise<DeleteOutcome> {
    this.deletionInFlight ??= this.runPursueDeletion(link, receipt).finally(() => {
      this.deletionInFlight = null;
    });
    return this.deletionInFlight;
  }

  private async runPursueDeletion(link: AccountLink, receipt: string): Promise<DeleteOutcome> {
    // CPT-35 : identités du compte relevées avant la suppression, pour accepter ensuite l'une ou l'autre.
    const identities = await this.safeIdentities();
    const result = await this.gateway.deleteAccount(receipt);
    if (result === "deleted") {
      await this.finalizeDeletion(link, identities);
      return "deleted";
    }
    if (result === "network") return "offline";
    if (result === "not_authenticated") {
      // Session inutilisable (cas b1, b2) : preuve par le reçu.
      const status = await this.gateway.deletionStatus({ authUserId: link.authUserId, receipt });
      if (status === "deleted") {
        await this.finalizeDeletion(link, identities);
        return "deleted";
      }
      return status === "network" ? "offline" : "error";
    }
    return "error";
  }

  private async finalizeDeletion(link: AccountLink, identities: AccountIdentity[] = []): Promise<void> {
    const subjects = [{ provider: link.provider, subject: link.providerSubject }, ...identities];
    const fingerprints = await Promise.all(subjects.map((identity) => subjectFingerprint(this.hasher, identity.provider, identity.subject)));
    await this.store.completeDeletion([...new Set(fingerprints)].join(","));
    await this.safeSignOut();
  }

  private async safeIdentities(): Promise<AccountIdentity[]> {
    try {
      return await this.gateway.currentIdentities();
    } catch (error) {
      this.warn("Identités du compte illisibles.", error);
      return [];
    }
  }

  private async safeDiscard(): Promise<void> {
    try {
      await this.gateway.discardUnlinkedUser();
    } catch (error) {
      this.warn("Utilisateur sans compte non supprimé.", error);
    }
  }

  private async safeSignOut(): Promise<void> {
    try {
      await this.gateway.signOutLocal();
    } catch (error) {
      this.warn("Fermeture de session locale impossible.", error);
    }
  }
}
