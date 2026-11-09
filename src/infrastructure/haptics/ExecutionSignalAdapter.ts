import * as Haptics from "expo-haptics";

import type { ExecutionSignal } from "@/features/execution/ExecutionService";
import { ExecutionSounds, type BeepPort, type BeepTone } from "@/infrastructure/audio/ExecutionSounds";
import { ExecutionVoice, type VoicePort } from "@/infrastructure/speech/ExecutionVoice";

/**
 * PRE-10.2 — signaux d'exécution (ch12 §12.11 ; conception §16.1). Le moteur demande un signal ; cet adaptateur
 * le restitue sur trois canaux indépendants : vibration (préférence `Vibrations` du Profil), Sons et Annonces
 * vocales (interrupteurs de l'Exécution ; ch08 « Guidage sonore »).
 *
 * Table de guidage : définition de Hermann du 10/11/2026 (formulaire « Guidage sonore KODJO », recopiée dans
 * ch08 et la spec `pre10-son-voix`). Le nom de l'exercice est annoncé avant son départ, au début du Compte à
 * rebours initial ou de la récupération qui le précède (« Prochain exercice : … ») ; au départ, seulement le
 * son, sauf si le nom n'a pas été annoncé avant. Une étape sans son défini et dont l'annonce est coupée
 * reçoit un bip grave (S5). Premier plan seulement (arrière-plan : tranche suivante). Un échec natif
 * n'interrompt jamais l'Exécution.
 */
export type Vibration = "NONE" | "LIGHT" | "MEDIUM" | "HEAVY";
export type Cue = { readonly sound: BeepTone | null; readonly volume: number; readonly vibration: Vibration };

export const GUIDANCE = {
  countdownStart: { sound: null, volume: 1, vibration: "HEAVY" },
  lastSeconds: { sound: "BIP_GRAVE", volume: 1, vibration: "MEDIUM" },
  startTimed: { sound: "SIFFLET_ROULE", volume: 1, vibration: "HEAVY" },
  startStopwatch: { sound: "SIFFLET_PUR", volume: 0.55, vibration: "HEAVY" },
  sideChange: { sound: "BIP_DOUBLE", volume: 0.55, vibration: "HEAVY" },
  cadence: { sound: "CLIC_DOUX", volume: 0.35, vibration: "LIGHT" },
  minute: { sound: "DING", volume: 0.15, vibration: "LIGHT" },
  seriesPause: { sound: null, volume: 1, vibration: "HEAVY" },
  recovery: { sound: null, volume: 1, vibration: "HEAVY" },
  stopPoint: { sound: "BIP_DOUBLE", volume: 1, vibration: "HEAVY" },
  sessionEnd: { sound: "BIP_LONG", volume: 1, vibration: "MEDIUM" },
  other: { sound: "BIP_GRAVE", volume: 1, vibration: "HEAVY" },
} as const satisfies Record<string, Cue>;

/** Délai entre le son de départ et l'annonce, pour ne pas les superposer. */
export const ANNOUNCEMENT_AFTER_SOUND_MS = 500;

const IMPACT: Record<Exclude<Vibration, "NONE">, Haptics.ImpactFeedbackStyle> = {
  LIGHT: Haptics.ImpactFeedbackStyle.Light,
  MEDIUM: Haptics.ImpactFeedbackStyle.Medium,
  HEAVY: Haptics.ImpactFeedbackStyle.Heavy,
};

type Defer = (run: () => void, delayMs?: number) => void;

const later: Defer = (run, delayMs = 0) => {
  if (delayMs > 0) setTimeout(run, delayMs);
  else run();
};

export type Guidance = { readonly cue: Cue; readonly announcement: string | null };

export class ExecutionSignalAdapter {
  private vibrationEnabled = true;
  private soundEnabled = true;
  private voiceEnabled = true;
  /** Nom déjà annoncé comme « Prochain exercice », pour ne pas le répéter au départ. */
  private announcedNext: string | null = null;

  constructor(
    private readonly haptics: Pick<typeof Haptics, "impactAsync"> = Haptics,
    private readonly beeps: BeepPort = new ExecutionSounds(),
    private readonly voice: VoicePort = new ExecutionVoice(),
    private readonly defer: Defer = later,
  ) {}

  /** Préférence Vibrations du Profil (vibrations fonctionnelles de séance). */
  setVibrationEnabled(enabled: boolean): void {
    this.vibrationEnabled = enabled;
  }

  /** Sons et Annonces vocales : actifs au début de chaque Exécution, modifiables pendant (ch08). */
  setAudible(sound: boolean, voice: boolean): void {
    this.soundEnabled = sound;
    this.voiceEnabled = voice;
    if (sound) this.beeps.prepare?.();
    if (voice) this.voice.prepare?.();
  }

  get audible(): { readonly sound: boolean; readonly voice: boolean } {
    return { sound: this.soundEnabled, voice: this.voiceEnabled };
  }

  play(signal: ExecutionSignal): void {
    const { cue, announcement } = this.guidance(signal);
    if (this.vibrationEnabled && cue.vibration !== "NONE") this.haptics.impactAsync(IMPACT[cue.vibration]).catch(() => undefined);
    const spoken = this.voiceEnabled ? announcement : null;
    const sound = cue.sound ?? (signal.kind === "TRANSITION" && spoken === null ? GUIDANCE.other.sound : null);
    const played = this.soundEnabled && sound !== null;
    if (played) this.beeps.play(sound, cue.sound === null ? GUIDANCE.other.volume : cue.volume);
    if (spoken !== null) this.defer(() => this.voice.say(spoken), played ? ANNOUNCEMENT_AFTER_SOUND_MS : 0);
  }

  /** Son, vibration et annonce d'un signal ; tient compte du « Prochain exercice » déjà annoncé. */
  guidance(signal: ExecutionSignal): Guidance {
    if (signal.kind === "COUNTDOWN") return { cue: GUIDANCE.lastSeconds, announcement: null };
    if (signal.kind === "CADENCE") return { cue: GUIDANCE.cadence, announcement: null };
    if (signal.kind === "MINUTE") return { cue: GUIDANCE.minute, announcement: null };
    const name = cleanName(signal.exerciseName);
    switch (signal.phase) {
      case "INITIAL_COUNTDOWN":
        return { cue: GUIDANCE.countdownStart, announcement: this.withNext("Préparez-vous", signal) };
      case "SERIES_PAUSE":
        return { cue: GUIDANCE.seriesPause, announcement: this.withNext("Pause", signal) };
      case "SIDE_RECOVERY":
      case "POST_ACTIVITY_RECOVERY":
      case "BLOCK_REST":
        return { cue: GUIDANCE.recovery, announcement: this.withNext("Récupération", signal) };
      case "STOP_POINT":
        return { cue: GUIDANCE.stopPoint, announcement: null };
      case "SESSION_END":
        return { cue: GUIDANCE.sessionEnd, announcement: null };
      case "ACTIVITY": {
        const alreadyAnnounced = name !== null && this.announcedNext === name;
        this.announcedNext = null;
        if (signal.sideRank === 2) return { cue: GUIDANCE.sideChange, announcement: name === null ? "Côté 2" : `${name}, côté 2` };
        const cue = signal.timed === false ? GUIDANCE.startStopwatch : GUIDANCE.startTimed;
        const side = signal.sideRank === 1 ? "côté 1" : null;
        if (alreadyAnnounced) return { cue, announcement: side === null ? null : "Côté 1" };
        return { cue, announcement: name === null ? null : side === null ? name : `${name}, ${side}` };
      }
      default:
        return { cue: GUIDANCE.other, announcement: null };
    }
  }

  /** « Récupération. Prochain exercice : Fente » lorsque l'étape suivante est un autre exercice. */
  private withNext(text: string, signal: ExecutionSignal): string {
    const next = signal.next;
    const nextName = next?.phase === "ACTIVITY" ? cleanName(next.exerciseName) : null;
    if (nextName === null || nextName === cleanName(signal.exerciseName)) return text;
    if (this.voiceEnabled) this.announcedNext = nextName;
    return `${text}. Prochain exercice : ${nextName}`;
  }
}

function cleanName(name: string | null | undefined): string | null {
  return name === null || name === undefined || name.trim() === "" ? null : name.trim();
}

/** Texte annoncé au début d'une étape, sans contexte d'enchaînement (ch08 « Guidage sonore »). */
export function announcementOf(signal: Pick<ExecutionSignal, "phase" | "exerciseName" | "sideRank">): string | null {
  const silent = new ExecutionSignalAdapter({ impactAsync: async () => undefined }, { play: () => undefined }, { say: () => undefined });
  return silent.guidance({ kind: "TRANSITION", atMs: 0, ...signal }).announcement;
}
