import { router } from "expo-router";

/**
 * Recette PRE-10 (essais K3, K5, K6) : accès au diagnostic des sons depuis le menu développeur du client Expo,
 * en développement seulement. Retour de Hermann du 11/11/2026 (y1) : « Supprimer le titre de section "Diagnostic
 * des sons..." » des Préférences ; l'accès passe donc par le menu développeur (secouer l'iPhone), hors de l'écran.
 */
export function installDevSoundDiagnosticMenu(): void {
  if (!__DEV__) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const devMenu = require("expo-dev-menu") as typeof import("expo-dev-menu");
    void devMenu
      .registerDevMenuItems([
        { name: "Diagnostic des sons (K1 à K6)", callback: () => router.push("/diagnostic-sons"), shouldCollapse: true },
      ])
      .catch(() => undefined);
  } catch {
    // Menu développeur absent (tests, build sans client de développement) : aucun accès.
  }
}
