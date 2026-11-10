import { requireOptionalNativeModule } from "expo";
import type { AudioPlayer } from "expo-audio";

/**
 * Lot PRE-10 son et voix (décision de Hermann du 09/11/2026, recette PRE-10 n° 2, `q-son` ; ch08 « Guidage
 * sonore » ; ch12 §12.11) : sons de guidage par `expo-audio`, au premier plan seulement (arrière-plan : spike
 * RT-001 / P6). Un échec natif est ignoré : il n'interrompt jamais l'Exécution. Module natif absent
 * (application installée avant ce lot) : aucun son, et le module JavaScript n'est pas chargé, car son
 * chargement lève une erreur fatale affichée à l'écran (recette du 09/11/2026, « Cannot find native module
 * 'ExpoAudio' »).
 *
 * Session audio (recettes « Son et voix » du 09/11/2026 : S9 musique non atténuée, puis bips « très en
 * retard » et sifflet absent) : la session est activée une fois au début de l'Exécution, en mélange avec les
 * autres applications, et les sons sont chargés d'avance ; elle reste active entre deux sons, pour qu'un son
 * parte sans délai. Pour une annonce vocale seulement, elle passe en atténuation des autres sons (iOS ne
 * l'applique qu'à l'activation), puis revient en mélange : la musique reprend son volume.
 */
/**
 * Sons retenus par Hermann (formulaire « Guidage sonore KODJO », 10/11/2026) ; fichiers produits avec les
 * recettes du formulaire (`assets/sounds`).
 */
export type BeepTone = "BIP_GRAVE" | "BIP_DOUBLE" | "BIP_LONG" | "SIFFLET_ROULE" | "SIFFLET_PUR" | "SIFFLET_COURT" | "FANFARE_COURTE" | "DING" | "CLIC_DOUX";

export type BeepPort = { readonly play: (tone: BeepTone, volume?: number) => void; readonly prepare?: () => void };

/** Vrai si le module natif est présent dans l'application installée. */
export function hasNativeModule(name: string): boolean {
  try {
    return requireOptionalNativeModule(name) !== null;
  } catch {
    return false;
  }
}

// Opérations de session sérialisées : une activation ne doit pas croiser une désactivation.
let sessionQueue: Promise<void> = Promise.resolve();

function enqueue(operation: (audio: typeof import("expo-audio")) => Promise<void>): Promise<void> {
  if (!hasNativeModule("ExpoAudio")) return Promise.resolve();
  const next = sessionQueue.then(async () => operation(await import("expo-audio"))).catch(() => undefined);
  sessionQueue = next;
  return next;
}

const mode = (duck: boolean) => ({ playsInSilentMode: true, interruptionMode: duck ? ("duckOthers" as const) : ("mixWithOthers" as const), shouldPlayInBackground: false });

let sessionStarted = false;

/** Début d'Exécution : session active, en mélange avec les autres sons. */
export function startExecutionAudio(): Promise<void> {
  if (sessionStarted) return sessionQueue;
  sessionStarted = true;
  return enqueue(async (audio) => {
    await audio.setAudioModeAsync(mode(false));
    await audio.setIsAudioActiveAsync(true);
  });
}

/** Avant une annonce : atténuation des autres sons (réactivation nécessaire sous iOS). */
export function duckOthersForVoice(): Promise<void> {
  sessionStarted = true;
  return enqueue(async (audio) => {
    await audio.setIsAudioActiveAsync(false).catch(() => undefined);
    await audio.setAudioModeAsync(mode(true));
    await audio.setIsAudioActiveAsync(true);
  });
}

/** Après la dernière annonce : les autres sons reprennent leur volume ; la session reste prête pour les sons. */
export function releaseOthersAfterVoice(): Promise<void> {
  return enqueue(async (audio) => {
    await audio.setIsAudioActiveAsync(false).catch(() => undefined);
    await audio.setAudioModeAsync(mode(false));
    await audio.setIsAudioActiveAsync(true);
  });
}

// Ressources audio empaquetées par Metro.
const SOURCES: Record<BeepTone, number> = {
  BIP_GRAVE: require("../../../assets/sounds/bip-grave.wav"),
  BIP_DOUBLE: require("../../../assets/sounds/bip-double.wav"),
  BIP_LONG: require("../../../assets/sounds/bip-long.wav"),
  SIFFLET_ROULE: require("../../../assets/sounds/sifflet-roule.wav"),
  SIFFLET_PUR: require("../../../assets/sounds/sifflet-pur.wav"),
  SIFFLET_COURT: require("../../../assets/sounds/sifflet-court.wav"),
  FANFARE_COURTE: require("../../../assets/sounds/fanfare-courte.wav"),
  DING: require("../../../assets/sounds/ding.wav"),
  CLIC_DOUX: require("../../../assets/sounds/clic-doux.wav"),
};

// Un seul lecteur par son pour toute l'application : deux instances ne peuvent jamais jouer le même son en
// double, légèrement décalé (recette du 10/11/2026, G2, G3, G6 : « un autre son en même temps »).
const sharedPlayers: Partial<Record<BeepTone, AudioPlayer>> = {};

export class ExecutionSounds implements BeepPort {
  private readonly players = sharedPlayers;

  /** Début d'Exécution : session active et lecteurs chargés, pour qu'aucun son ne parte en retard. */
  prepare(): void {
    if (!hasNativeModule("ExpoAudio")) return;
    void startExecutionAudio();
    void (async () => {
      for (const tone of Object.keys(SOURCES) as BeepTone[]) await this.player(tone);
    })().catch(() => undefined);
  }

  play(tone: BeepTone, volume = 1): void {
    void this.playAsync(tone, volume).catch(() => undefined);
  }

  private async player(tone: BeepTone): Promise<AudioPlayer> {
    let player = this.players[tone];
    if (player === undefined) {
      const { createAudioPlayer } = await import("expo-audio");
      player = createAudioPlayer(SOURCES[tone], { keepAudioSessionActive: true });
      this.players[tone] = player;
    }
    return player;
  }

  private async playAsync(tone: BeepTone, volume: number): Promise<void> {
    if (!hasNativeModule("ExpoAudio")) return;
    if (!sessionStarted) void startExecutionAudio();
    const player = await this.player(tone);
    player.volume = volume;
    await player.seekTo(0);
    player.play();
  }
}
