import { ensureExecutionAudioMode } from "@/infrastructure/audio/ExecutionSounds";

/**
 * Lot PRE-10 son et voix (décision de Hermann du 09/11/2026, recette PRE-10 n° 2, `q-son` ; ch08 « Guidage
 * sonore » ; ch12 §12.11) : annonces vocales en français par `expo-speech`, dans la session audio de
 * l'application (lecture en mode silencieux). Une nouvelle annonce remplace celle en cours, sans file
 * d'attente qui la retarderait. Un échec natif est ignoré : il n'interrompt jamais l'Exécution.
 */
export type VoicePort = { readonly say: (text: string) => void };

export const EXECUTION_VOICE_LANGUAGE = "fr-FR";

export class ExecutionVoice implements VoicePort {
  say(text: string): void {
    void this.sayAsync(text).catch(() => undefined);
  }

  private async sayAsync(text: string): Promise<void> {
    await ensureExecutionAudioMode();
    const Speech = await import("expo-speech");
    await Speech.stop();
    Speech.speak(text, { language: EXECUTION_VOICE_LANGUAGE, useApplicationAudioSession: true });
  }
}
