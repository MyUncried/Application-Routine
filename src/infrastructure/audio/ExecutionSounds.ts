import type { AudioPlayer } from "expo-audio";

/**
 * Lot PRE-10 son et voix (décision de Hermann du 09/11/2026, recette PRE-10 n° 2, `q-son` ; ch08 « Guidage
 * sonore » ; ch12 §12.11) : bips de guidage par `expo-audio`, au premier plan seulement (arrière-plan : spike
 * RT-001 / P6). Un lecteur par son, créé au premier usage et rejoué depuis le début. Session audio : lecture
 * en mode silencieux, autres sons atténués pendant le bip (`duckOthers`). Un échec natif est ignoré : il
 * n'interrompt jamais l'Exécution.
 */
export type BeepTone = "HIGH" | "LOW";

export type BeepPort = { readonly play: (tone: BeepTone) => void };

let audioModeReady: Promise<void> | null = null;

/** Session audio commune aux bips et aux annonces vocales, configurée une fois. */
export function ensureExecutionAudioMode(): Promise<void> {
  if (audioModeReady === null) {
    audioModeReady = (async () => {
      const { setAudioModeAsync } = await import("expo-audio");
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "duckOthers", shouldPlayInBackground: false });
    })().catch(() => {
      audioModeReady = null;
    });
  }
  return audioModeReady;
}

// Ressources audio empaquetées par Metro.
const SOURCES: Record<BeepTone, number> = {
  HIGH: require("../../../assets/sounds/beep-high.wav"),
  LOW: require("../../../assets/sounds/beep-low.wav"),
};

export class ExecutionSounds implements BeepPort {
  private readonly players: Partial<Record<BeepTone, AudioPlayer>> = {};

  play(tone: BeepTone): void {
    void this.playAsync(tone).catch(() => undefined);
  }

  private async playAsync(tone: BeepTone): Promise<void> {
    await ensureExecutionAudioMode();
    let player = this.players[tone];
    if (player === undefined) {
      const { createAudioPlayer } = await import("expo-audio");
      player = createAudioPlayer(SOURCES[tone]);
      this.players[tone] = player;
    }
    await player.seekTo(0);
    player.play();
  }
}
