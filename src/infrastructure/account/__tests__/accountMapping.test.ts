import { describe, expect, it } from "@jest/globals";

import {
  classifyDeleteResponse,
  classifyRefreshError,
  classifyStatusResponse,
  parseAuthCallback,
  toLinkResponse,
  toProviderSession,
} from "@/infrastructure/account/accountMapping";

describe("toProviderSession", () => {
  const user = {
    id: "auth-1",
    email: "x@example.com",
    identities: [{ provider: "google", id: "google-sub" }],
    user_metadata: { full_name: "Hermann Adjou", given_name: "Hermann", family_name: "Adjou" },
  };

  it("sujet du fournisseur, e-mail, nom des métadonnées", () => {
    expect(toProviderSession(user, "google", { givenName: null, familyName: null }, null)).toEqual({
      authUserId: "auth-1",
      provider: "google",
      providerSubject: "google-sub",
      email: "x@example.com",
      givenName: "Hermann",
      familyName: "Adjou",
      appleToken: null,
    });
  });

  it("le nom fourni par Apple prime ; absence de nom : null, rien d'inventé", () => {
    const apple = { id: "a", email: null, identities: [{ provider: "apple", id: "apple-sub" }], user_metadata: {} };
    expect(toProviderSession(apple, "apple", { givenName: "Ana", familyName: null }, null)).toMatchObject({ givenName: "Ana", familyName: null });
    expect(toProviderSession(apple, "apple", { givenName: null, familyName: null }, null)).toMatchObject({ givenName: null, familyName: null, email: null });
  });

  it("sujet introuvable : erreur explicite", () => {
    expect(() => toProviderSession({ id: "a", identities: [] }, "apple", { givenName: null, familyName: null }, null)).toThrow();
  });
});

describe("conversions et classements", () => {
  it("réponse de link_account", () => {
    expect(
      toLinkResponse({ auth_user_id: "a", provider: "apple", provider_subject: "s", email: "r@privaterelay.appleid.com", email_is_private_relay: true, given_name: null, family_name: "", catalogue_id: "c" }),
    ).toEqual({ authUserId: "a", provider: "apple", providerSubject: "s", email: "r@privaterelay.appleid.com", emailIsPrivateRelay: true, givenName: null, familyName: null, catalogueId: "c" });
    expect(() => toLinkResponse({ provider: "x" })).toThrow();
  });

  it("retour de la connexion web : code ou erreur", () => {
    expect(parseAuthCallback("routine://auth/callback?code=abc")).toEqual({ code: "abc" });
    expect(parseAuthCallback("routine://auth/callback#error=access_denied&error_description=Annule")).toEqual({ error: "Annule" });
    expect(parseAuthCallback("routine://auth/callback")).toEqual({ error: "missing_code" });
  });

  it("rafraîchissement : réseau ou 5xx transitoire ; 4xx refusé ; aucune session : refusé", () => {
    expect(classifyRefreshError(null, true)).toBe("ok");
    expect(classifyRefreshError(null, false)).toBe("refused");
    expect(classifyRefreshError({ name: "AuthRetryableFetchError" }, false)).toBe("transient");
    expect(classifyRefreshError({ name: "AuthApiError", status: 503 }, false)).toBe("transient");
    expect(classifyRefreshError({ name: "AuthApiError", status: 400 }, false)).toBe("refused");
    expect(classifyRefreshError({ name: "AuthSessionMissingError" }, false)).toBe("refused");
  });

  it("delete-account et deletion-status", () => {
    expect(classifyDeleteResponse(200, { status: "deleted" })).toBe("deleted");
    expect(classifyDeleteResponse(401, null)).toBe("not_authenticated");
    expect(classifyDeleteResponse(503, { status: "retryable_error" })).toBe("retryable_error");
    expect(classifyDeleteResponse(null, null)).toBe("network");
    expect(classifyStatusResponse(200, { status: "active" })).toBe("active");
    expect(classifyStatusResponse(503, { status: "indeterminate" })).toBe("indeterminate");
    expect(classifyStatusResponse(200, { status: "bizarre" })).toBe("unknown");
    expect(classifyStatusResponse(null, null)).toBe("network");
  });
});
