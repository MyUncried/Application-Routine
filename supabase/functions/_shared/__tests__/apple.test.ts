/**
 * @jest-environment node
 */
import { describe, expect, it } from "@jest/globals";

import {
  APPLE_ISSUER,
  base64UrlDecode,
  base64UrlEncode,
  createAppleClientSecret,
  decryptToken,
  encryptToken,
  exchangeAuthorizationCode,
  revokeRefreshToken,
  verifyAppleNotification,
} from "../apple";
import { processAppleEvent, type AppleEventPorts, type BeginResult } from "../appleEvents";

const encoder = new TextEncoder();

async function ecPem(): Promise<{ pem: string; publicKey: CryptoKey }> {
  const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  const b64 = Buffer.from(pkcs8).toString("base64");
  return { pem: `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----`, publicKey: pair.publicKey };
}

async function rsaSigner() {
  const pair = (await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const jwk = (await crypto.subtle.exportKey("jwk", pair.publicKey)) as { n: string; e: string };
  const sign = async (claims: object, kid = "k1") => {
    const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: "RS256", kid })));
    const payload = base64UrlEncode(encoder.encode(JSON.stringify(claims)));
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, encoder.encode(`${header}.${payload}`));
    return `${header}.${payload}.${base64UrlEncode(new Uint8Array(signature))}`;
  };
  return { keys: [{ kid: "k1", kty: "RSA", n: jwk.n, e: jwk.e }], sign };
}

describe("secret client Apple (ES256)", () => {
  it("produit un JWT signé vérifiable, avec iss, aud, sub et kid attendus", async () => {
    const { pem, publicKey } = await ecPem();
    const jwt = await createAppleClientSecret({ teamId: "RC8F846A68", keyId: "KEY123", privateKeyPem: pem }, "com.ankusha.kodjo.signin", 1000);
    const [h, p, s] = jwt.split(".");
    expect(JSON.parse(new TextDecoder().decode(base64UrlDecode(h)))).toEqual({ alg: "ES256", kid: "KEY123" });
    expect(JSON.parse(new TextDecoder().decode(base64UrlDecode(p)))).toEqual({ iss: "RC8F846A68", iat: 1000, exp: 1300, aud: APPLE_ISSUER, sub: "com.ankusha.kodjo.signin" });
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, publicKey, base64UrlDecode(s), encoder.encode(`${h}.${p}`));
    expect(ok).toBe(true);
  });
});

describe("échange et révocation Apple", () => {
  it("échange : renvoie le refresh_token ; échec explicite sinon", async () => {
    const calls: { url: string; body?: string }[] = [];
    const ok = async (url: string, init?: { body?: string }) => {
      calls.push({ url, body: init?.body });
      return { ok: true, status: 200, json: async () => ({ refresh_token: "rt-1" }) };
    };
    expect(await exchangeAuthorizationCode(ok, "com.ankusha.kodjo", "secret", "code-1")).toBe("rt-1");
    expect(calls[0].url).toBe("https://appleid.apple.com/auth/token");
    expect(calls[0].body).toContain("grant_type=authorization_code");
    const ko = async () => ({ ok: false, status: 400, json: async () => ({ error: "invalid_grant" }) });
    await expect(exchangeAuthorizationCode(ko, "c", "s", "x")).rejects.toThrow("apple_token_exchange_failed:400");
  });

  it("révocation : appel de /auth/revoke avec token_type_hint ; erreur si refusée", async () => {
    let body = "";
    await revokeRefreshToken(async (_u, init) => {
      body = init?.body ?? "";
      return { ok: true, status: 200, json: async () => ({}) };
    }, "c", "s", "rt");
    expect(body).toContain("token_type_hint=refresh_token");
    await expect(revokeRefreshToken(async () => ({ ok: false, status: 500, json: async () => ({}) }), "c", "s", "rt")).rejects.toThrow();
  });
});

describe("notifications Apple : vérification du JWS", () => {
  it("accepte un jeton signé valide et extrait (iss, jti, type, sub)", async () => {
    const { keys, sign } = await rsaSigner();
    const jws = await sign({ iss: APPLE_ISSUER, aud: "com.ankusha.kodjo", jti: "j-1", events: JSON.stringify({ type: "email-disabled", sub: "s-1" }) });
    expect(await verifyAppleNotification(jws, keys, ["com.ankusha.kodjo"])).toEqual({ iss: APPLE_ISSUER, jti: "j-1", aud: "com.ankusha.kodjo", type: "email-disabled", sub: "s-1" });
  });

  it("refuse signature altérée, aud inconnu, iss inattendu ou clé inconnue", async () => {
    const { keys, sign } = await rsaSigner();
    const good = await sign({ iss: APPLE_ISSUER, aud: "com.ankusha.kodjo", jti: "j", events: JSON.stringify({ type: "t", sub: "s" }) });
    const tampered = good.slice(0, -4) + (good.endsWith("AAAA") ? "BBBB" : "AAAA");
    expect(await verifyAppleNotification(tampered, keys, ["com.ankusha.kodjo"])).toBeNull();
    expect(await verifyAppleNotification(good, keys, ["autre"])).toBeNull();
    const badIss = await sign({ iss: "https://evil", aud: "com.ankusha.kodjo", jti: "j", events: JSON.stringify({ type: "t", sub: "s" }) });
    expect(await verifyAppleNotification(badIss, keys, ["com.ankusha.kodjo"])).toBeNull();
    const otherKid = await sign({ iss: APPLE_ISSUER, aud: "com.ankusha.kodjo", jti: "j", events: "{}" }, "k2");
    expect(await verifyAppleNotification(otherKid, keys, ["com.ankusha.kodjo"])).toBeNull();
  });
});

describe("chiffrement du jeton stocké", () => {
  it("chiffre et déchiffre ; deux chiffrements diffèrent (IV aléatoire)", async () => {
    const key = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64");
    const a = await encryptToken("refresh-token", key);
    const b = await encryptToken("refresh-token", key);
    expect(a).not.toBe(b);
    expect(a).not.toContain("refresh-token");
    expect(await decryptToken(a, key)).toBe("refresh-token");
  });
});

describe("processAppleEvent — idempotence et reprise (F3)", () => {
  function eventPorts(beginResults: BeginResult[], opts: { purgeFinished?: boolean[]; signOutFails?: boolean } = {}) {
    const calls: string[] = [];
    const ports: AppleEventPorts = {
      async begin() {
        calls.push("begin");
        return beginResults.shift()!;
      },
      async signOut() {
        calls.push("signOut");
        if (opts.signOutFails) throw new Error("x");
      },
      async purge() {
        calls.push("purge");
        return opts.purgeFinished?.shift() ?? true;
      },
      async done() {
        calls.push("done");
      },
    };
    return { calls, ports };
  }
  const event = { iss: APPLE_ISSUER, jti: "j", sub: "s", type: "account-delete" };

  it("événement déjà done : 200 sans effet", async () => {
    const { calls, ports } = eventPorts([{ status: "done", authUserId: "u", followup: "none", first: false }]);
    expect(await processAppleEvent(event, ports)).toEqual({ httpStatus: 200, state: "done" });
    expect(calls).toEqual(["begin"]);
  });

  it("account-delete interrompu (purge inachevée) : 500 ; la nouvelle livraison reprend, termine, passe à done ; livraison suivante 200 sans effet", async () => {
    const { calls, ports } = eventPorts(
      [
        { status: "received", authUserId: "u", followup: "purge", first: true },
        { status: "received", authUserId: "u", followup: "purge", first: false },
        { status: "done", authUserId: "u", followup: "none", first: false },
      ],
      { purgeFinished: [false, true] },
    );
    expect(await processAppleEvent(event, ports)).toEqual({ httpStatus: 500, state: "pending" });
    expect(await processAppleEvent(event, ports)).toEqual({ httpStatus: 200, state: "done" });
    expect(await processAppleEvent(event, ports)).toEqual({ httpStatus: 200, state: "done" });
    expect(calls).toEqual(["begin", "purge", "begin", "purge", "done", "begin"]);
  });

  it("consent-revoked : fermeture des sessions puis done ; échec de fermeture → 500, sans done", async () => {
    const ok = eventPorts([{ status: "received", authUserId: "u", followup: "sign_out", first: true }]);
    expect(await processAppleEvent({ ...event, type: "consent-revoked" }, ok.ports)).toEqual({ httpStatus: 200, state: "done" });
    expect(ok.calls).toEqual(["begin", "signOut", "done"]);
    const ko = eventPorts([{ status: "received", authUserId: "u", followup: "sign_out", first: true }], { signOutFails: true });
    expect(await processAppleEvent({ ...event, type: "consent-revoked" }, ko.ports)).toEqual({ httpStatus: 500, state: "pending" });
    expect(ko.calls).not.toContain("done");
  });

  it("échec de la transaction initiale : 500, aucun effet", async () => {
    const ports: AppleEventPorts = {
      begin: async () => {
        throw new Error("tx");
      },
      signOut: async () => undefined,
      purge: async () => true,
      done: async () => undefined,
    };
    expect(await processAppleEvent(event, ports)).toEqual({ httpStatus: 500, state: "pending" });
  });
});
