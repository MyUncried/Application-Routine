import { hasNativeModule } from "@/infrastructure/audio/ExecutionSounds";

/**
 * ch09 Profil, « Écran maintenu actif » : empêche la mise en veille pendant une exécution de séance, pendant
 * l'exécution uniquement (fin de PRE-10, 11/11/2026). `expo-keep-awake` (SDK 57) ; sans module natif dans
 * l'application installée, rien n'est fait et l'Exécution continue.
 */
export const EXECUTION_AWAKE_TAG = "kodjo-execution";

export type ScreenAwakePort = { readonly keepAwake: (active: boolean) => void };

export function deviceScreenAwake(): ScreenAwakePort {
  return {
    keepAwake: (active) => {
      if (!hasNativeModule("ExpoKeepAwake")) return;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const keepAwake = require("expo-keep-awake") as typeof import("expo-keep-awake");
      const result = active ? keepAwake.activateKeepAwakeAsync(EXECUTION_AWAKE_TAG) : keepAwake.deactivateKeepAwake(EXECUTION_AWAKE_TAG);
      void Promise.resolve(result).catch(() => undefined);
    },
  };
}
