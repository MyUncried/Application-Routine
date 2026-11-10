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
 * parte sans délai. Pour une annonce, les bips de fin, les sifflets et les bips de départ et d'arrêt, elle
 * passe en atténuation des autres sons (iOS ne l'applique qu'à l'activation), puis revient en mélange : la
 * musique reprend son volume (recette du 10/11/2026, t7 ; voir `duckOthers`).
 */
/**
 * Sons retenus par Hermann (formulaire « Guidage sonore KODJO », 10/11/2026) ; fichiers produits avec les
 * recettes du formulaire (`assets/sounds`).
 */
export type BeepTone = "BIP_GRAVE" | "BIP_DOUBLE" | "BIP_LONG" | "SIFFLET_ROULE" | "SIFFLET_PUR" | "SIFFLET_COURT" | "FANFARE_COURTE" | "DING" | "CLIC_DOUX";

export type BeepPort = {
  readonly play: (tone: BeepTone, volume?: number) => void;
  readonly prepare?: () => void;
  /** Atténuation anticipée de la musique, avant des bips à l'heure (signal `PREPARE`). */
  readonly duckAhead?: () => void;
};

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

// Reconfigurations de session en cours : un son demandé pendant ce temps partirait en retard.
let reconfiguring = 0;

// Fin prévue du dernier son lancé (horloge murale, ms).
let soundingUntil = 0;

/** Marge après la fin d'un son avant de désactiver la session. */
const AFTER_SOUND_MARGIN_MS = 40;

function reconfigure(duck: boolean): Promise<void> {
  reconfiguring += 1;
  return enqueue(async (audio) => {
    // Recette du 10/11/2026 (click sur la Pause et les sifflets) : désactiver la session arrête net le son en
    // cours, ce qui produit un click. La reconfiguration attend donc la fin du son.
    const wait = soundingUntil + AFTER_SOUND_MARGIN_MS - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    if (__DEV__) console.log(`[guidage] session ${duck ? "atténuation" : "retour du volume"} ${Date.now()}`);
    await audio.setIsAudioActiveAsync(false).catch(() => undefined);
    await audio.setAudioModeAsync(mode(duck));
    await audio.setIsAudioActiveAsync(true);
  }).finally(() => {
    reconfiguring -= 1;
  });
}

// Atténuation des autres applications (musique) — recette du 10/11/2026 (t7) : pendant les annonces, les bips
// de fin, les sifflets et les bips de départ et d'arrêt, jamais pour la cadence ni le signal minute. iOS ne
// l'applique qu'en réactivant la session, ce qui retarde un son : elle est donc demandée à l'avance avant les
// bips de fin (signal `PREPARE`) et maintenue entre deux sons rapprochés.
let ducked = false;
let duckHolds = 0;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;

/** Délai sans son ni annonce atténuant avant que la musique reprenne son volume. */
export const DUCK_RELEASE_AFTER_MS = 1500;

/** Maintien de l'atténuation anticipée, jusqu'au premier des bips de fin. */
const DUCK_AHEAD_HOLD_MS = 2000;

/** Sons qui n'atténuent pas la musique. */
const NOT_DUCKING: ReadonlySet<BeepTone> = new Set(["CLIC_DOUX", "DING"]);

/** Atténue les autres sons ; immédiat si c'est déjà le cas. */
export function duckOthers(): Promise<void> {
  sessionStarted = true;
  if (releaseTimer !== null) clearTimeout(releaseTimer);
  releaseTimer = null;
  if (ducked) return sessionQueue;
  ducked = true;
  return reconfigure(true);
}

/** Les autres sons reprennent leur volume après `afterMs` sans son ni annonce atténuant. */
export function releaseOthersLater(afterMs: number = DUCK_RELEASE_AFTER_MS): void {
  if (releaseTimer !== null) clearTimeout(releaseTimer);
  releaseTimer = setTimeout(() => {
    releaseTimer = null;
    if (duckHolds > 0 || !ducked) return;
    ducked = false;
    void reconfigure(false);
  }, afterMs);
}

/** Avant une annonce : atténuation des autres sons, maintenue jusqu'à la fin de l'annonce. */
export async function duckOthersForVoice(): Promise<void> {
  duckHolds += 1;
  await duckOthers();
}

/** Fin d'une annonce (terminée, interrompue ou en échec). */
export function releaseOthersAfterVoice(): void {
  duckHolds = Math.max(0, duckHolds - 1);
  releaseOthersLater();
}

/**
 * Sons qu'il vaut mieux omettre que jouer en retard pendant une reconfiguration de session (recette du
 * 10/11/2026, constat b : « deux clics très rapprochés juste après une annonce »).
 */
const SKIPPABLE_WHILE_RECONFIGURING: ReadonlySet<BeepTone> = new Set(["CLIC_DOUX"]);

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

// Durée des fichiers (ms), pour ne jamais couper un son en reconfigurant la session.
const DURATION_MS: Record<BeepTone, number> = {
  BIP_GRAVE: 200,
  BIP_DOUBLE: 260,
  BIP_LONG: 620,
  SIFFLET_ROULE: 440,
  SIFFLET_PUR: 420,
  SIFFLET_COURT: 240,
  FANFARE_COURTE: 640,
  DING: 1220,
  CLIC_DOUX: 45,
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

  /** Atténuation anticipée : la musique est déjà baissée quand les bips de fin arrivent. */
  duckAhead(): void {
    if (!hasNativeModule("ExpoAudio")) return;
    void duckOthers();
    releaseOthersLater(DUCK_AHEAD_HOLD_MS);
  }

  private async player(tone: BeepTone): Promise<AudioPlayer> {
    let player = this.players[tone];
    if (player === undefined) {
      const { createAudioPlayer } = await import("expo-audio");
      const created = createAudioPlayer(SOURCES[tone], { keepAudioSessionActive: true });
      // Recette du 10/11/2026 (k5 : clic « légèrement après le tempo ») : le lecteur revient au début dès la
      // fin du son, pour que le suivant parte sans attendre un repositionnement.
      created.addListener("playbackStatusUpdate", (status) => {
        if (status.didJustFinish) void created.seekTo(0).catch(() => undefined);
      });
      player = created;
      this.players[tone] = player;
    }
    return player;
  }

  private async playAsync(tone: BeepTone, volume: number): Promise<void> {
    if (!hasNativeModule("ExpoAudio")) return;
    if (!sessionStarted) void startExecutionAudio();
    if (reconfiguring > 0 && SKIPPABLE_WHILE_RECONFIGURING.has(tone)) return;
    const ducking = !NOT_DUCKING.has(tone);
    if (ducking) await duckOthers();
    const player = await this.player(tone);
    player.volume = volume;
    if (player.playing || player.currentTime > 0.01) await player.seekTo(0);
    player.play();
    soundingUntil = Math.max(soundingUntil, Date.now() + DURATION_MS[tone]);
    if (__DEV__) console.log(`[guidage] son ${tone} ${Date.now()}`);
    if (ducking) releaseOthersLater();
  }
}
