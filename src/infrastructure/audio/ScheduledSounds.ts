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
  private policy: SessionPolicy = "LIBRARY_DUCK";
  private released = false;
  private readonly buffers = new Map<BeepTone, Promise<Buffer>>();

  /** Session audio de l'application, réglée par la bibliothèque : lecture, mode silencieux ignoré, autres sons atténués ou mélangés. */
  async start(policy: SessionPolicy = "LIBRARY_DUCK"): Promise<void> {
    if (!hasScheduledSounds()) return;
    const { AudioManager, AudioContext } = api();
    this.policy = policy;
    AudioManager.setSystemOptions({ ios: { category: "playback", mode: "default", options: [policy === "LIBRARY_DUCK" ? "duckOthers" : "mixWithOthers"] } });
    await AudioManager.setAudioSessionActivity(true);
    if (this.context === null) this.context = new AudioContext();
    await this.context.resume();
  }

  /**
   * Recette du 11/11/2026 (Hermann, m2) : « Lance d'une séance > lancement de spotify > retour sur la séance > Reprendre la séance : La musique ne baisse à aucun moment lors de la séance. » iOS n'atténue que la musique déjà en cours au moment où la session
   * de l'application est activée ; une musique lancée ensuite (séance quittée, Spotify ouvert) reste à plein volume.
   * Au retour dans l'application, la session est donc désactivée puis réactivée, ce qui atténue de nouveau la musique.
   */
  async reclaim(): Promise<void> {
    if (this.context === null || !hasScheduledSounds()) return;
    // Recette du 11/11/2026, second essai m2 (Hermann) : « Lance d'une séance > lancement de spotify > retour sur la séance > Reprendre la séance : La musique baisse > retour sur spotify : la musique ne redevient pas au volume initial > retour sur la séance : le son augmente et diminue de suite > Reprendre la séance : le volume reste diminué. » La session est rendue quand l'application quitte le
    // premier plan (`release`) : la musique retrouve son volume hors de la séance ; au retour, la session est seulement
    // réactivée, sans remontée passagère. [Désactivation puis réactivation au retour — remplacé, sauf si la session
    // n'a pas pu être rendue.]
    if (!this.released) await api().AudioManager.setAudioSessionActivity(false).catch(() => undefined);
    this.released = false;
    await this.start(this.policy);
  }

  /** Session rendue (`release`) et pas encore reprise. */
  get isReleased(): boolean {
    return this.released;
  }

  /** Application quittée pendant l'Exécution : session rendue, la musique des autres applications retrouve son volume. */
  async release(): Promise<void> {
    if (this.context === null || !hasScheduledSounds()) return;
    await api().AudioManager.setAudioSessionActivity(false);
    this.released = true;
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
