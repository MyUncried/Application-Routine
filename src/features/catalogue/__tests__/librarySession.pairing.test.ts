import { librarySession } from "@/features/catalogue/librarySession";

/** Recette du 11/11 : l'appairage survit à la sortie de l'écran, jusqu'à l'expiration du jeton du PC. */
describe("appairage conservé", () => {
  const session = { host: "192.168.0.16", port: 4739, name: "PC", token: "t", expiresAt: "2026-11-11T23:00:00.000Z" };
  const now = Date.parse("2026-11-11T12:00:00.000Z");

  beforeEach(() => librarySession.reset());

  it("reste valide après un changement de source, jusqu'à l'expiration du jeton", () => {
    librarySession.setSource({ kind: "ADMIN", session, entries: [], refreshedAt: 0 });
    librarySession.setSource(null);
    expect(librarySession.pairing(now)).toEqual(session);
    expect(librarySession.pairing(Date.parse("2026-11-11T22:59:30.000Z"))).toBeNull();
  });

  it("est oublié quand le PC refuse le jeton", () => {
    librarySession.restorePairing(session);
    librarySession.forgetPairing();
    expect(librarySession.pairing(now)).toBeNull();
  });
});
