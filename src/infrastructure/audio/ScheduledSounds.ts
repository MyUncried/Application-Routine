import { TurboModuleRegistry } from "react-native";

import { SOURCES, type BeepTone } from "@/infrastructure/audio/ExecutionSounds";

/**
 * Fin de PRE-10 — bibliothèque de sons courts (spec `spec-guidage-reglages` §8 ; Hermann, 10/11/2026 : « la gestion des
 * sons est importante pour Kodjo, le respect du tempo aussi, sasn décalage »). `react-native-audio-api` (API Web Audio) :
 * chaque son est décodé une fois en mémoire, puis joué par une source neuve, à un instant donné de l'horloge audio
 * (`AudioContext.currentTime`), ce qui permet de programmer les bips à l'avance, sans dépendre du moment où le JavaScript
 * s'exécute.
 *
 * Module natif présent seulement dans la version de l'application construite après le 11/11/2026 (build `2e47648d`) :
 * sans lui, rien n'est chargé (`hasScheduledSounds` faux) et l'appelant garde `expo-audio`.
 */
type AudioApi = typeof import("react-native-audio-api");
type Context = InstanceType<AudioApi["AudioContext"]>;
type Buffer = Awaited<ReturnType<Context["decodeAudioData"]>>;

export type SessionPolicy = "LIBRARY_DUCK" | "LIBRARY_MIX";

/** Vrai si le module natif de la bibliothèque est présent dans l'application installée. */
export function hasScheduledSounds(): boolean {
  try {
    return TurboModuleRegistry.get("AudioAPIModule") != null;
  } catch {
    return false;
  }
}

function api(): AudioApi {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("react-native-audio-api") as AudioApi;
}

export class ScheduledSounds {
  private context: Context | null = null;
  private readonly buffers = new Map<BeepTone, Promise<Buffer>>();

  /** Session audio de l'application, réglée par la bibliothèque : lecture, mode silencieux ignoré, autres sons atténués ou mélangés. */
  async start(policy: SessionPolicy = "LIBRARY_DUCK"): Promise<void> {
    if (!hasScheduledSounds()) return;
    const { AudioManager, AudioContext } = api();
    AudioManager.setSystemOptions({ ios: { category: "playback", mode: "default", options: [policy === "LIBRARY_DUCK" ? "duckOthers" : "mixWithOthers"] } });
    await AudioManager.setAudioSessionActivity(true);
    if (this.context === null) this.context = new AudioContext();
    await this.context.resume();
  }

  /** Décode tous les sons à l'avance (aucun chargement au moment de jouer). */
  async preload(tones: readonly BeepTone[] = Object.keys(SOURCES) as BeepTone[]): Promise<void> {
    await Promise.all(tones.map((tone) => this.buffer(tone)));
  }

  /** Horloge audio, en secondes ; `null` sans contexte. */
  now(): number | null {
    return this.context?.currentTime ?? null;
  }

  /** Joue `tone` à `atSeconds` de l'horloge audio (maintenant si absent ou passé). */
  async schedule(tone: BeepTone, volume: number, atSeconds?: number): Promise<void> {
    const context = this.context;
    if (context === null) return;
    const buffer = await this.buffer(tone);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const gain = context.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(context.destination);
    source.start(Math.max(atSeconds ?? 0, context.currentTime));
  }

  async stop(): Promise<void> {
    const context = this.context;
    this.context = null;
    this.buffers.clear();
    if (context !== null) await context.close().catch(() => undefined);
  }

  private buffer(tone: BeepTone): Promise<Buffer> {
    const context = this.context;
    if (context === null) return Promise.reject(new Error("ScheduledSounds: start() first"));
    let pending = this.buffers.get(tone);
    if (pending === undefined) {
      pending = context.decodeAudioData(SOURCES[tone]);
      this.buffers.set(tone, pending);
    }
    return pending;
  }
}
