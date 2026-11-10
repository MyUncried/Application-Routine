import type { ExecutionSignal, SignalObjective } from "@/features/execution/ExecutionService";
import { ExecutionSounds, type BeepPort, type BeepTone } from "@/infrastructure/audio/ExecutionSounds";
import { ExecutionVoice, type VoicePort } from "@/infrastructure/speech/ExecutionVoice";

import { deviceVibration, type VibrationPort } from "./ExecutionVibration";

/**
 * PRE-10.2 — signaux d'exécution (ch12 §12.11 ; conception §16.1). Le moteur demande un signal ; cet adaptateur
 * le restitue sur trois canaux indépendants : vibration (préférence `Vibrations` du Profil), Sons et Annonces
 * vocales (interrupteurs de l'Exécution ; ch08 « Guidage sonore »).
 *
 * Table de guidage : définition de Hermann du 10/11/2026 (formulaire « Guidage sonore KODJO »), mise à jour
 * avec ses choix suivants dans le formulaire et la recette du 10/11/2026 (G2 à G10, constats). Recopiée dans
 * ch08 et la spec `pre10-son-voix`.
 * - Le prochain exercice est annoncé avant son départ (« À suivre : Pompes »), au début du Compte à rebours
 *   initial, de la Pause ou de la récupération qui le précède ; au départ, après le sifflet, son objectif
 *   (« 12 répétitions »), précédé du nom s'il n'a pas été annoncé avant (recette h4, constat c).
 * - Bilatéral : « premier côté » au départ, « Changez de côté » au changement de côté.
 * - Zéro d'une étape chronométrée : double bip, sauf si l'étape suivante a son propre son (un seul signal par
 *   instant, T07 ; recette h2). Arrivée sur une Pause ou une récupération : double bip (recette k3).
 * - Pause demandée par l'utilisateur : double bip (constat a). Achèvement de la Séance : fanfare courte.
 * - Aucun bip de cadence juste après un autre son (recette h2 : sifflet et clic ensemble).
 * - Une étape sans son défini et dont l'annonce est coupée reçoit un bip grave (S5).
 * Premier plan seulement (arrière-plan : tranche suivante). Un échec natif n'interrompt jamais l'Exécution.
 */
export type Vibration = "NONE" | "LIGHT" | "MEDIUM" | "HEAVY";
export type Cue = { readonly sound: BeepTone | null; readonly volume: number; readonly vibration: Vibration };

export const GUIDANCE = {
  countdownStart: { sound: null, volume: 1, vibration: "HEAVY" },
  lastSeconds: { sound: "BIP_GRAVE", volume: 1, vibration: "MEDIUM" },
  zero: { sound: "BIP_DOUBLE", volume: 1, vibration: "NONE" },
  startTimed: { sound: "SIFFLET_ROULE", volume: 0.55, vibration: "HEAVY" },
  startStopwatch: { sound: "SIFFLET_PUR", volume: 0.55, vibration: "HEAVY" },
  sideChange: { sound: "SIFFLET_COURT", volume: 0.55, vibration: "HEAVY" },
  cadence: { sound: "CLIC_DOUX", volume: 0.35, vibration: "LIGHT" },
  minute: { sound: "DING", volume: 0.15, vibration: "LIGHT" },
  // Recette du 10/11/2026 (k3) : double bip à l'arrivée sur une Pause ou une récupération, au zéro comme après Suivant.
  seriesPause: { sound: "BIP_DOUBLE", volume: 1, vibration: "HEAVY" },
  recovery: { sound: "BIP_DOUBLE", volume: 1, vibration: "HEAVY" },
  stopPoint: { sound: "BIP_DOUBLE", volume: 1, vibration: "HEAVY" },
  userPause: { sound: "BIP_DOUBLE", volume: 1, vibration: "HEAVY" },
  sessionEnd: { sound: null, volume: 1, vibration: "MEDIUM" },
  finish: { sound: "FANFARE_COURTE", volume: 0.6, vibration: "MEDIUM" },
  other: { sound: "BIP_GRAVE", volume: 1, vibration: "HEAVY" },
} as const satisfies Record<string, Cue>;

/** Délai entre le son et l'annonce, pour ne pas les superposer. */
export const ANNOUNCEMENT_AFTER_SOUND_MS = 500;

/** Pas de bip de cadence moins de ce délai après un autre son (sifflet, bips de fin, double bip). */
export const CADENCE_QUIET_AFTER_SOUND_MS = 700;


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
  /** Nom déjà annoncé comme « À suivre », pour ne pas le répéter au départ. */
  private announcedNext: string | null = null;
  /** L'étape qui se termine était chronométrée : son zéro est marqué (bip grave). */
  private previousTimed = false;
  /** Dernier signal joué, pour ne jamais restituer deux fois le même. */
  private lastKey: string | null = null;
  /** Instant logique du dernier son autre qu'un bip de cadence. */
  private lastSoundAtMs: number | null = null;

  constructor(
    private readonly vibrator: VibrationPort = deviceVibration(),
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
    const key = `${signal.kind}@${signal.atMs}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    if (signal.kind === "CADENCE" && this.lastSoundAtMs !== null && signal.atMs >= this.lastSoundAtMs && signal.atMs - this.lastSoundAtMs < CADENCE_QUIET_AFTER_SOUND_MS) return;
    if (__DEV__) console.log(`[guidage] ${signal.kind} ${signal.phase ?? "-"} ${signal.atMs} vibration=${this.vibrationEnabled ? "oui" : "non"}`);
    const { cue, announcement } = this.guidance(signal);
    if (this.vibrationEnabled && cue.vibration !== "NONE") this.vibrator.vibrate(cue.vibration);
    const spoken = this.voiceEnabled ? announcement : null;
    const fallback = signal.kind === "TRANSITION" && spoken === null ? GUIDANCE.other : null;
    const sounding = cue.sound !== null ? cue : fallback;
    const played = this.soundEnabled && sounding !== null && sounding.sound !== null;
    if (played) this.beeps.play(sounding.sound!, sounding.volume);
    if (played && signal.kind !== "CADENCE") this.lastSoundAtMs = signal.atMs;
    if (spoken !== null) this.defer(() => this.voice.say(spoken), played ? ANNOUNCEMENT_AFTER_SOUND_MS : 0);
  }

  /** Son, vibration et annonce d'un signal ; tient compte du « À suivre » déjà annoncé et de l'étape précédente. */
  guidance(signal: ExecutionSignal): Guidance {
    if (signal.kind === "COUNTDOWN") return { cue: GUIDANCE.lastSeconds, announcement: null };
    if (signal.kind === "CADENCE") return { cue: GUIDANCE.cadence, announcement: null };
    if (signal.kind === "MINUTE") return { cue: GUIDANCE.minute, announcement: null };
    if (signal.kind === "FINISH") return { cue: GUIDANCE.finish, announcement: null };
    if (signal.kind === "PAUSE") return { cue: GUIDANCE.userPause, announcement: null };
    if (signal.phase === "INITIAL_COUNTDOWN") {
      // Nouvelle Exécution : rien n'est hérité de la précédente (recette du 10/11/2026, constat f).
      this.announcedNext = null;
      this.previousTimed = false;
    }
    const previousTimed = this.previousTimed;
    this.previousTimed = signal.timed === true;
    const { cue, announcement } = this.transition(signal);
    // Zéro de l'étape chronométrée qui se termine : bip grave, si l'étape qui commence n'a pas son propre son.
    if (cue.sound === null && previousTimed) return { cue: { ...GUIDANCE.zero, vibration: cue.vibration }, announcement };
    return { cue, announcement };
  }

  private transition(signal: ExecutionSignal): Guidance {
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
        if (signal.sideRank === 2) return { cue: GUIDANCE.sideChange, announcement: "Changez de côté" };
        const cue = signal.timed === false ? GUIDANCE.startStopwatch : GUIDANCE.startTimed;
        // Après le sifflet : nom (s'il n'a pas été annoncé avant), côté, puis objectif (recette h4, constat c).
        const parts = [alreadyAnnounced ? null : name, signal.sideRank === 1 ? "premier côté" : null, objectiveText(signal.objective)].filter((part): part is string => part !== null);
        return { cue, announcement: parts.length === 0 ? null : capitalize(parts.join(", ")) };
      }
      default:
        return { cue: GUIDANCE.other, announcement: null };
    }
  }

  /** « Récupération. À suivre : Fente » lorsque l'étape suivante est un autre exercice. */
  private withNext(text: string, signal: ExecutionSignal): string {
    const next = signal.next;
    const nextName = next?.phase === "ACTIVITY" ? cleanName(next.exerciseName) : null;
    if (nextName === null || nextName === cleanName(signal.exerciseName)) return text;
    if (this.voiceEnabled) this.announcedNext = nextName;
    return `${text}. À suivre : ${nextName}`;
  }
}

function cleanName(name: string | null | undefined): string | null {
  return name === null || name === undefined || name.trim() === "" ? null : name.trim();
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Objectif annoncé avec le nom (recette du 10/11/2026, G8 ; spec `spec-guidage-reglages` §7.3). */
export function objectiveText(objective: SignalObjective | undefined): string | null {
  const target = objective?.target;
  if (target === undefined || target === null) return null;
  if (target.kind === "FAILURE") return "jusqu'à l'échec";
  if (target.kind !== "NUMBER" || target.value <= 0) return null;
  if (objective?.mode === "REPETITIONS") return target.value === 1 ? "1 répétition" : `${target.value} répétitions`;
  if (objective?.mode === "DURATION") return durationWords(target.value);
  return null;
}

function durationWords(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  const unit = (n: number, word: string) => (n === 1 ? `1 ${word}` : `${n} ${word}s`);
  if (minutes === 0) return unit(rest, "seconde");
  if (rest === 0) return unit(minutes, "minute");
  return `${unit(minutes, "minute")} ${rest}`;
}

/** Texte annoncé au début d'une étape, sans contexte d'enchaînement (ch08 « Guidage sonore »). */
export function announcementOf(signal: Pick<ExecutionSignal, "phase" | "exerciseName" | "sideRank">): string | null {
  const silent = new ExecutionSignalAdapter({ vibrate: () => undefined }, { play: () => undefined }, { say: () => undefined });
  return silent.guidance({ kind: "TRANSITION", atMs: 0, ...signal }).announcement;
}
