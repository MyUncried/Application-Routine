import { requireOptionalNativeModule } from "expo";
import { TurboModuleRegistry } from "react-native";
import type { AudioPlayer } from "expo-audio";

import type { ScheduledSounds } from "@/infrastructure/audio/ScheduledSounds";

/**
 * Lot PRE-10 son et voix (décision de Hermann du 09/11/2026, recette PRE-10 n° 2, `q-son` ; ch08 « Guidage
 * sonore » ; ch12 §12.11) : sons de guidage par `expo-audio`, au premier plan seulement (arrière-plan : spike
 * RT-001 / P6). Un échec natif est ignoré : il n'interrompt jamais l'Exécution. Module natif absent
 * (application installée avant ce lot) : aucun son, et le module JavaScript n'est pas chargé, car son
 * chargement lève une erreur fatale affichée à l'écran (recette du 09/11/2026, « Cannot find native module
 * 'ExpoAudio' »).
 *
 * Session audio — décision de Hermann du 10/11/2026 (« 1.A ») : la musique d'une autre application est
 * atténuée pendant toute l'Exécution. La session est réglée et activée une seule fois, au début de
 * l'Exécution, et n'est plus jamais désactivée pendant la séance : chaque désactivation coupait net le son en
 * cours (click audible aux écouteurs, absent de l'écran de diagnostic qui ne reconfigure pas la session) et
 * retardait ou supprimait des bips. C'était aussi le fonctionnement de la première livraison (b362aa34), sans
 * click. Les sons sont chargés d'avance pour partir sans délai.
 */
/**
 * Sons retenus par Hermann (formulaire « Guidage sonore KODJO », 10/11/2026) ; fichiers produits avec les
 * recettes du formulaire (`assets/sounds`).
 */
export type BeepTone = "BIP_COURT" | "BIP_GRAVE" | "BIP_DOUBLE" | "BIP_LONG" | "SIFFLET_ROULE" | "SIFFLET_PUR" | "SIFFLET_COURT" | "FANFARE_COURTE" | "DING" | "CLIC_DOUX";

export type BeepPort = { readonly play: (tone: BeepTone, volume?: number) => void; readonly prepare?: () => void };

/** Vrai si le module natif est présent dans l'application installée. */
export function hasNativeModule(name: string): boolean {
  try {
    return requireOptionalNativeModule(name) !== null;
  } catch {
    return false;
  }
}

let session: Promise<void> | null = null;

/** Début d'Exécution : session active une fois pour toutes, autres sons atténués, audible en mode silencieux. */
export function startExecutionAudio(): Promise<void> {
  if (!hasNativeModule("ExpoAudio")) return Promise.resolve();
  if (session === null) {
    session = (async () => {
      const audio = await import("expo-audio");
      await audio.setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "duckOthers", shouldPlayInBackground: false });
      await audio.setIsAudioActiveAsync(true);
    })().catch(() => {
      session = null;
    });
  }
  return session;
}

// Ressources audio empaquetées par Metro (exportées pour l'écran de diagnostic des sons).
export const SOURCES: Record<BeepTone, number> = {
  BIP_COURT: require("../../../assets/sounds/bip-court.wav"),
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

/**
 * Un lecteur neuf par son joué, préparé à l'avance — cause racine du click démontrée le 10/11/2026 sur l'écran
 * de diagnostic des sons : après une annonce vocale, un même lecteur rembobiné et rejoué claque à partir du
 * deuxième son (essai F), quel que soit le son ou le mode de session ; un lecteur neuf à chaque son ne claque
 * jamais (essai H). Chaque son joue donc un lecteur jamais utilisé, chargé d'avance ; il est libéré peu après.
 */
const ready: Partial<Record<BeepTone, Promise<AudioPlayer>>> = {};

/** Délai avant de libérer un lecteur joué (plus long que le plus long des sons). */
const RELEASE_AFTER_MS = 3000;

async function load(tone: BeepTone): Promise<AudioPlayer> {
  const { createAudioPlayer } = await import("expo-audio");
  return createAudioPlayer(SOURCES[tone], { keepAudioSessionActive: true });
}

/** Lecteur prêt pour ce son ; le suivant est aussitôt préparé. */
function take(tone: BeepTone): Promise<AudioPlayer> {
  const player = ready[tone] ?? load(tone);
  ready[tone] = load(tone);
  ready[tone]!.catch(() => {
    ready[tone] = undefined;
  });
  return player;
}

/**
 * Recette du 11/11/2026 (Hermann, constat : « Le bip de cadence est en retard par rapport au chronomètre » ; essais
 * K3, K5 et K6 OK — K3 : « La première série est irrégulière […] La seconde est régulière. ») : quand le module natif
 * de la bibliothèque de sons courts est présent (`react-native-audio-api`, build `2e47648d`), les sons de l'Exécution
 * sont joués par elle (sons décodés d'avance, départ sur l'horloge audio, musique atténuée — K6), comme annoncé dans la
 * spec `spec-guidage-reglages` (« Le remplacement de `BeepPort` attend K3, K5 et K6 »). Sans ce module, `expo-audio`
 * reste utilisé. [Lecteur `expo-audio` neuf à chaque son, seule voie — remplacé quand la bibliothèque est présente.]
 */
let library: ScheduledSounds | null = null;
let libraryReady: Promise<ScheduledSounds | null> | null = null;

/** Module natif de la bibliothèque présent (même contrôle que `hasScheduledSounds`). */
function hasLibraryModule(): boolean {
  try {
    return TurboModuleRegistry.get("AudioAPIModule") != null;
  } catch {
    return false;
  }
}

function scheduledLibrary(): Promise<ScheduledSounds | null> {
  if (libraryReady !== null) return libraryReady;
  // Chargé à la demande : `ScheduledSounds` importe `SOURCES` de ce module (pas de cycle au chargement).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const scheduled = require("@/infrastructure/audio/ScheduledSounds") as typeof import("@/infrastructure/audio/ScheduledSounds");
  if (!scheduled.hasScheduledSounds()) return (libraryReady = Promise.resolve(null));
  const sounds = new scheduled.ScheduledSounds();
  libraryReady = sounds
    .start("LIBRARY_DUCK")
    .then(() => sounds.preload())
    .then(() => (library = sounds))
    .catch(() => {
      libraryReady = null;
      return null;
    });
  return libraryReady;
}

/**
 * Recette du 11/11/2026 (Hermann, m2) : « Lance d'une séance > lancement de spotify > retour sur la séance > Reprendre la séance : La musique ne baisse à aucun moment lors de la séance. » Retour de l'application au premier plan pendant une Exécution : la
 * session audio est réactivée pour atténuer la musique lancée entre-temps (voir `ScheduledSounds.reclaim`).
 */
export function reclaimExecutionAudio(): void {
  if (library !== null) {
    void library.reclaim().catch(() => undefined);
    return;
  }
  if (session === null || !hasNativeModule("ExpoAudio")) return;
  session = (async () => {
    const audio = await import("expo-audio");
    await audio.setIsAudioActiveAsync(false).catch(() => undefined);
    await audio.setIsAudioActiveAsync(true);
  })().catch(() => {
    session = null;
  });
}

export class ExecutionSounds implements BeepPort {
  /** Début d'Exécution : session active et un lecteur prêt par son, pour qu'aucun son ne parte en retard. */
  prepare(): void {
    if (hasLibraryModule()) {
      void scheduledLibrary();
      return;
    }
    if (!hasNativeModule("ExpoAudio")) return;
    void startExecutionAudio();
    for (const tone of Object.keys(SOURCES) as BeepTone[]) {
      if (ready[tone] === undefined) {
        ready[tone] = load(tone);
        ready[tone]!.catch(() => {
          ready[tone] = undefined;
        });
      }
    }
  }

  play(tone: BeepTone, volume = 1): void {
    void this.playAsync(tone, volume).catch(() => undefined);
  }

  private async playAsync(tone: BeepTone, volume: number): Promise<void> {
    if (hasLibraryModule()) {
      const sounds = library ?? (await scheduledLibrary());
      if (sounds !== null) {
        await sounds.schedule(tone, volume);
        if (__DEV__) console.log(`[guidage] son ${tone} ${Date.now()} (bibliothèque)`);
        return;
      }
    }
    if (!hasNativeModule("ExpoAudio")) return;
    void startExecutionAudio();
    const player = await take(tone);
    player.volume = volume;
    player.play();
    if (__DEV__) console.log(`[guidage] son ${tone} ${Date.now()}`);
    setTimeout(() => {
      try {
        player.remove();
      } catch {
        // Lecteur déjà libéré.
      }
    }, RELEASE_AFTER_MS);
  }
}
