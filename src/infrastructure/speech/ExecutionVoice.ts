import { duckOthersForVoice, hasNativeModule, releaseOthersAfterVoice, startExecutionAudio } from "@/infrastructure/audio/ExecutionSounds";

// Atténuation de la musique pendant les annonces, les bips de fin et les sifflets : voir `ExecutionSounds`.

/**
 * Lot PRE-10 son et voix (décision de Hermann du 09/11/2026, recette PRE-10 n° 2, `q-son` ; ch08 « Guidage
 * sonore » ; ch12 §12.11) : annonces vocales en français par `expo-speech`, dans la session audio de
 * l'application (lecture en mode silencieux). Une nouvelle annonce remplace celle en cours, sans file
 * d'attente qui la retarderait. Un échec natif est ignoré : il n'interrompt jamais l'Exécution ; module
 * natif absent : aucune annonce, sans charger `expo-speech` (voir `ExecutionSounds`).
 *
 * Recette « Son et voix » du 09/11/2026 :
 * - S2 (voix « très robotique ») : la voix française de meilleure qualité installée sur l'appareil est
 *   choisie (Améliorée ou Premium avant la voix par défaut) ;
 * - S2 (début de la première annonce qui « saute ») et S9 (musique non atténuée) : la session audio est
 *   activée avant de parler, puis libérée à la fin de la dernière annonce pour rendre le volume aux autres
 *   applications.
 */
export type VoicePort = { readonly say: (text: string) => void; readonly prepare?: () => void };

export const EXECUTION_VOICE_LANGUAGE = "fr-FR";

/** Attente entre l'activation de la session audio et le début de la parole. */
export const VOICE_START_DELAY_MS = 180;

type VoiceInfo = { readonly identifier: string; readonly language: string; readonly quality: string };

/** Voix française préférée : qualité Premium, puis Améliorée, puis toute voix fr-FR ; `null` sinon. */
export function bestFrenchVoice(voices: readonly VoiceInfo[]): string | null {
  const french = voices.filter((voice) => voice.language.replace("_", "-").toLowerCase() === "fr-fr");
  const rank = (voice: VoiceInfo) => (/premium/i.test(voice.quality) || /premium/i.test(voice.identifier) ? 2 : /enhanced/i.test(voice.quality) ? 1 : 0);
  const best = [...french].sort((a, b) => rank(b) - rank(a))[0];
  return best?.identifier ?? null;
}

export class ExecutionVoice implements VoicePort {
  private voiceId: Promise<string | null> | null = null;
  private generation = 0;

  /** Préparation au début de l'Exécution : session audio et choix de la voix, avant la première annonce. */
  prepare(): void {
    if (!hasNativeModule("ExpoSpeech")) return;
    void startExecutionAudio();
    void this.voice().catch(() => null);
  }

  say(text: string): void {
    void this.sayAsync(text).catch(() => undefined);
  }

  private voice(): Promise<string | null> {
    if (this.voiceId === null) {
      this.voiceId = import("expo-speech").then(async (Speech) => bestFrenchVoice(await Speech.getAvailableVoicesAsync()));
    }
    return this.voiceId;
  }

  private async sayAsync(text: string): Promise<void> {
    if (!hasNativeModule("ExpoSpeech")) return;
    const generation = ++this.generation;
    const Speech = await import("expo-speech");
    const voice = await this.voice().catch(() => null);
    await Speech.stop();
    await duckOthersForVoice();
    // Chaque annonce libère une seule fois l'atténuation qu'elle a demandée.
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      releaseOthersAfterVoice();
    };
    // Recette du 10/11/2026 (constat d) : premier mot ou première syllabe coupés. La sortie audio n'est pas
    // encore prête juste après la réactivation de la session : la parole attend un court instant.
    await new Promise((resolve) => setTimeout(resolve, VOICE_START_DELAY_MS));
    if (generation !== this.generation) {
      release();
      return;
    }
    Speech.speak(text, {
      language: EXECUTION_VOICE_LANGUAGE,
      ...(voice === null ? {} : { voice }),
      useApplicationAudioSession: true,
      onDone: release,
      onStopped: release,
      onError: release,
    });
  }
}
