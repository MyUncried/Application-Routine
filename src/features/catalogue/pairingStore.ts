/**
 * Conservation de l'appairage avec l'administration du PC entre deux ouvertures de l'application
 * (recette du 11/11/2026 : « L'appairage […] s'arrête dès que je sors de l'écran »). Le jeton a la
 * durée fixée par le PC (12 h, révocable) ; il est gardé dans le dossier privé de l'application et
 * oublié dès que le PC le refuse. Choix technique (classe D) : aucune donnée du catalogue n'y figure.
 */
import type { AdminSession } from "@/features/catalogue/adminClient";
import { librarySession } from "@/features/catalogue/librarySession";

const FILE_NAME = "kodjo-admin-pairing.json";

type FileSystem = typeof import("expo-file-system");

function pairingFile() {
  // Chargé à l'appel : module natif absent des tests et des anciennes builds.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { File, Paths } = require("expo-file-system") as FileSystem;
  return new File(Paths.document, FILE_NAME);
}

function parse(raw: string): AdminSession | null {
  try {
    const value = JSON.parse(raw) as Partial<AdminSession>;
    if (typeof value.host !== "string" || typeof value.port !== "number" || typeof value.token !== "string") return null;
    return {
      host: value.host,
      port: value.port,
      name: typeof value.name === "string" ? value.name : value.host,
      token: value.token,
      expiresAt: typeof value.expiresAt === "string" ? value.expiresAt : null,
    };
  } catch {
    return null;
  }
}

let restored = false;

/** Appairage valide : celui de la mémoire, sinon celui du fichier (lu une fois par lancement). */
export async function currentPairing(): Promise<AdminSession | null> {
  const inMemory = librarySession.pairing();
  if (inMemory || restored) return inMemory;
  restored = true;
  try {
    const file = pairingFile();
    if (!file.exists) return null;
    const session = parse(await file.text());
    if (!session) return null;
    librarySession.restorePairing(session);
    return librarySession.pairing();
  } catch {
    return null;
  }
}

export function storePairing(session: AdminSession): void {
  try {
    pairingFile().write(JSON.stringify(session));
  } catch {
    // Sans fichier, l'appairage reste valable jusqu'à la fermeture de l'application.
  }
}

export function forgetStoredPairing(): void {
  librarySession.forgetPairing();
  try {
    const file = pairingFile();
    if (file.exists) file.delete();
  } catch {
    // Rien à oublier.
  }
}
