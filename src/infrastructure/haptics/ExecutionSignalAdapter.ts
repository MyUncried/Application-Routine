import { DEFAULT_GUIDANCE_EVENTS, type GuidanceEvent, type GuidanceEvents, type GuidanceSettings } from "@/domain/preferences/guidanceSettings";
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
 * - Pause demandée par l'utilisateur : double bip (constat a). Achèvement de la Séance : fanfare courte, puis
 *   « Bravo, séance terminée » (recette a1, catégorie début et fin de séance).
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
  // Recette du 10/11/2026 (constat B ; choix « Bip et nom de la phase ») : son provisoire, à choisir dans le formulaire.
  phase: { sound: "BIP_COURT", volume: 0.5, vibration: "LIGHT" },
  minute: { sound: "DING", volume: 0.15, vibration: "LIGHT" },
  // Recette du 11/11/2026 (y5) : mi-temps d'un exercice en Durée définie ; son par défaut de l'événement (Bip long).
  halfTime: { sound: "BIP_LONG", volume: 0.6, vibration: "MEDIUM" },
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

/** Délai entre la fanfare de fin (0,64 s) et « Bravo, séance terminée ». */
export const ANNOUNCEMENT_AFTER_FINISH_MS = 800;

/** Pas de bip de cadence moins de ce délai après un autre son (sifflet, bips de fin, double bip). */
export const CADENCE_QUIET_AFTER_SOUND_MS = 700;


type Defer = (run: () => void, delayMs?: number) => void;

const later: Defer = (run, delayMs = 0) => {
  if (delayMs > 0) setTimeout(run, delayMs);
  else run();
};

/**
 * Guidance d'un signal : son, vibration, annonce et événement du guidage sonore (documentation de main `ebe72f76`,
 * RM-087) dont le réglage Son et Vibration s'applique ; `null` pour une étape qui n'en relève d'aucun.
 */
export type Guidance = { readonly cue: Cue; readonly announcement: string | null; readonly event?: GuidanceEvent | null };

/** Volume d'un son choisi pour un événement qui n'en avait pas par défaut. */
const CHOSEN_SOUND_VOLUME = 0.6;

/**
 * Catégories d'annonces vocales, réglées séparément dans le Profil — décision de Hermann du 10/11/2026 (« Il faut
 * séparer : noms d'exercices ; pauses / récupérations / point d'arrêt ; début / fin de séance ; changements de
 * côté », plus les répétitions ou la durée). L'interrupteur Voix de la séance coupe toutes les annonces.
 */
export type Announcements = {
  /** Nom de l'exercice au départ et « À suivre : … ». */
  readonly names: boolean;
  /** Répétitions, durée, « jusqu'à l'échec ». */
  readonly objective: boolean;
  /** « Pause », « Récupération » (et le Point d'arrêt, sans annonce aujourd'hui). */
  readonly pauses: boolean;
  /** « Préparez-vous » (et la fin de séance, sans annonce aujourd'hui). */
  readonly session: boolean;
  /** « Premier côté », « Changez de côté ». */
  readonly sides: boolean;
  /** Nom de chaque phase du mouvement (« Descente », « Montée »…). */
  readonly phases: boolean;
};

export const ALL_ANNOUNCEMENTS: Announcements = { names: true, objective: true, pauses: true, session: true, sides: true, phases: true };

export class ExecutionSignalAdapter {
  private vibrationEnabled = true;
  private soundEnabled = true;
  private voiceEnabled = true;
  /** Catégories d'annonces du Profil (groupe Guidage). */
  private announce: Announcements = ALL_ANNOUNCEMENTS;
  /** Son et vibration des neuf événements (Profil ou Séance). */
  private events: GuidanceEvents = DEFAULT_GUIDANCE_EVENTS;
  /** Nom déjà annoncé comme « À suivre », pour ne pas le répéter au départ. */
  private announcedNext: string | null = null;
  /** L'étape qui se termine était chronométrée : son zéro est marqué (bip grave). */
  private previousTimed = false;
  /** Dernier signal joué, pour ne jamais restituer deux fois le même. */
  private lastKey: string | null = null;
  /** Instant logique du dernier son autre qu'un bip de cadence. */
  private lastSoundAtMs: number | null = null;
  /** Signaux dont le son est déjà programmé sur l'horloge audio (§8, étape 3) : à leur instant, ni rejoué ni doublé. */
  private readonly scheduled = new Set<string>();
  /** Instant du dernier son programmé autre qu'un bip de cadence (oublié à l'annulation). */
  private lastScheduledSoundAtMs: number | null = null;

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

  /** Catégories d'annonces du Profil (spec `spec-guidage-reglages` §3.1, décision du 10/11/2026). */
  setAnnouncements(announcements: Announcements): void {
    this.announce = announcements;
  }

  /**
   * Réglages du guidage sonore effectifs pour la Séance (Profil, ou modale de Composition validée) : six annonces
   * vocales, son et vibration des neuf événements (RM-087).
   */
  setGuidance(settings: GuidanceSettings): void {
    this.announce = { ...settings.announcements };
    this.events = settings.events;
  }

  /** Sons et Annonces vocales : état initial selon le Profil (groupe Guidage), modifiables pendant (ch08). */
  setAudible(sound: boolean, voice: boolean): void {
    this.soundEnabled = sound;
    this.voiceEnabled = voice;
    if (!sound) this.cancelScheduled();
    if (sound) this.beeps.prepare?.();
    if (voice) this.voice.prepare?.();
  }

  get audible(): { readonly sound: boolean; readonly voice: boolean } {
    return { sound: this.soundEnabled, voice: this.voiceEnabled };
  }

  /**
   * Fin de PRE-10, sons programmés à l'avance (spec `spec-guidage-reglages` §8, étape 3 ; Hermann, 12/11/2026 : « Sons
   * programmés à l’avance ») : le son d'un signal de l'étape (cadence, dernières secondes, minute, mi-temps, phase) est
   * programmé sur l'horloge audio `delayMs` avant son instant, pour tomber à l'heure exacte. À son instant, `play`
   * restitue la vibration et l'annonce, sans rejouer le son. Bibliothèque indisponible : rien n'est programmé, le son
   * est joué à son instant comme avant.
   */
  schedule(signal: ExecutionSignal, delayMs: number): void {
    if (!this.soundEnabled || this.beeps.schedule === undefined || signal.kind === "TRANSITION") return;
    const key = signalKey(signal);
    if (this.scheduled.has(key) || key === this.lastKey || this.quietCadence(signal)) return;
    const sounding = this.soundOf(signal, this.guidance(signal));
    if (sounding === null || !this.beeps.schedule(sounding.sound, sounding.volume, delayMs)) return;
    this.scheduled.add(key);
    if (signal.kind !== "CADENCE") this.lastScheduledSoundAtMs = Math.max(this.lastScheduledSoundAtMs ?? signal.atMs, signal.atMs);
  }

  /** Les sons programmés ne tomberont plus (Pause, étape suivante, Sons coupés…). */
  cancelScheduled(): void {
    this.scheduled.clear();
    this.lastScheduledSoundAtMs = null;
    this.beeps.cancelScheduled?.();
  }

  play(signal: ExecutionSignal): void {
    const key = signalKey(signal);
    if (key === this.lastKey) return;
    this.lastKey = key;
    const preScheduled = this.scheduled.delete(key);
    if (!preScheduled && this.quietCadence(signal)) return;
    if (__DEV__) console.log(`[guidage] ${signal.kind} ${signal.phase ?? "-"} ${signal.atMs} vibration=${this.vibrationEnabled ? "oui" : "non"} sons=${this.soundEnabled ? "oui" : "non"} voix=${this.voiceEnabled ? "oui" : "non"} annonces=${JSON.stringify(this.announce)}`);
    const guidance = this.guidance(signal);
    const { cue, announcement, event } = guidance;
    const setting = event == null ? null : this.events[event];
    const vibrates = setting === null || setting.vibration;
    if (this.vibrationEnabled && vibrates && cue.vibration !== "NONE") this.vibrator.vibrate(cue.vibration);
    const spoken = this.voiceEnabled ? announcement : null;
    const sounding = this.soundOf(signal, guidance);
    const played = this.soundEnabled && sounding !== null;
    if (played && !preScheduled) this.beeps.play(sounding.sound, sounding.volume);
    if (played && signal.kind !== "CADENCE") this.lastSoundAtMs = signal.atMs;
    if (spoken !== null && __DEV__) console.log(`[guidage] annonce « ${spoken} »`);
    const after = signal.kind === "FINISH" ? ANNOUNCEMENT_AFTER_FINISH_MS : ANNOUNCEMENT_AFTER_SOUND_MS;
    if (spoken !== null) this.defer(() => this.voice.say(spoken), played ? after : 0);
  }

  /** Pas de bip de cadence juste après un autre son (recette h2). */
  private quietCadence(signal: ExecutionSignal): boolean {
    if (signal.kind !== "CADENCE") return false;
    return [this.lastSoundAtMs, this.lastScheduledSoundAtMs].some((at) => at !== null && signal.atMs >= at && signal.atMs - at < CADENCE_QUIET_AFTER_SOUND_MS);
  }

  /** Son restitué pour un signal, selon la table de guidage et le réglage Son de son événement (RM-087). */
  private soundOf(signal: ExecutionSignal, { cue, announcement, event }: Guidance): { readonly sound: BeepTone; readonly volume: number } | null {
    const setting = event == null ? null : this.events[event];
    const spoken = this.voiceEnabled ? announcement : null;
    // « Aucun » coupe uniquement le son de l'événement, sans bip de remplacement (RM-087).
    const muted = setting !== null && setting.sound === "NONE";
    const fallback = signal.kind === "TRANSITION" && spoken === null && !muted ? GUIDANCE.other : null;
    const base = cue.sound !== null ? cue : fallback;
    const chosen = setting !== null && setting.sound !== "DEFAULT" && setting.sound !== "NONE" ? setting.sound : null;
    if (muted) return null;
    if (chosen !== null) return { sound: chosen, volume: base?.volume ?? CHOSEN_SOUND_VOLUME };
    return base !== null && base.sound !== null ? { sound: base.sound, volume: base.volume } : null;
  }

  /** Son, vibration et annonce d'un signal ; tient compte du « À suivre » déjà annoncé et de l'étape précédente. */
  guidance(signal: ExecutionSignal): Guidance {
    if (signal.kind === "COUNTDOWN") return { cue: GUIDANCE.lastSeconds, announcement: null, event: "COUNTDOWN" };
    if (signal.kind === "CADENCE") return { cue: GUIDANCE.cadence, announcement: null, event: "CADENCE" };
    if (signal.kind === "MINUTE") return { cue: GUIDANCE.minute, announcement: null, event: "EVERY_MINUTES" };
    if (signal.kind === "HALF_TIME") return { cue: GUIDANCE.halfTime, announcement: null, event: "HALF_TIME" };
    if (signal.kind === "PHASE") return { cue: GUIDANCE.phase, announcement: this.announce.phases ? cleanName(signal.phaseLabel) : null, event: "PHASE_CHANGE" };
    // Recette du 10/11/2026 (a1) : « Bravo, séance terminée » après la fanfare, catégorie début et fin de séance.
    if (signal.kind === "FINISH") return { cue: GUIDANCE.finish, announcement: this.announce.session ? "Bravo, séance terminée" : null, event: "SESSION_END" };
    if (signal.kind === "PAUSE") return { cue: GUIDANCE.userPause, announcement: null, event: "STOP_POINT" };
    if (signal.phase === "INITIAL_COUNTDOWN") {
      // Nouvelle Exécution : rien n'est hérité de la précédente (recette du 10/11/2026, constat f).
      this.announcedNext = null;
      this.previousTimed = false;
    }
    const previousTimed = this.previousTimed;
    this.previousTimed = signal.timed === true;
    const { cue, announcement } = this.transition(signal);
    const event = transitionEvent(signal);
    // Zéro de l'étape chronométrée qui se termine : double bip (événement Compte à rebours), si l'étape qui commence
    // n'a pas son propre son.
    if (cue.sound === null && previousTimed) return { cue: { ...GUIDANCE.zero, vibration: cue.vibration }, announcement, event: event === "SESSION_END" ? "COUNTDOWN" : event };
    return { cue, announcement, event };
  }

  private transition(signal: ExecutionSignal): Guidance {
    const name = cleanName(signal.exerciseName);
    switch (signal.phase) {
      case "INITIAL_COUNTDOWN":
        return { cue: GUIDANCE.countdownStart, announcement: sentences(this.announce.session ? "Préparez-vous" : null, this.nextPart(signal)) };
      case "SERIES_PAUSE":
        return { cue: GUIDANCE.seriesPause, announcement: sentences(this.announce.pauses ? "Pause" : null, this.nextPart(signal)) };
      case "SIDE_RECOVERY":
      case "POST_ACTIVITY_RECOVERY":
      case "BLOCK_REST":
        return { cue: GUIDANCE.recovery, announcement: sentences(this.announce.pauses ? "Récupération" : null, this.nextPart(signal)) };
      case "STOP_POINT":
        return { cue: GUIDANCE.stopPoint, announcement: null };
      case "SESSION_END":
        return { cue: GUIDANCE.sessionEnd, announcement: null };
      case "ACTIVITY": {
        const alreadyAnnounced = name !== null && this.announcedNext === name;
        this.announcedNext = null;
        if (signal.sideRank === 2) return { cue: GUIDANCE.sideChange, announcement: this.announce.sides ? "Changez de côté" : null };
        const cue = signal.timed === false ? GUIDANCE.startStopwatch : GUIDANCE.startTimed;
        // Après le sifflet : nom (s'il n'a pas été annoncé avant), côté, puis objectif (recette h4, constat c).
        const parts = [
          this.announce.names && !alreadyAnnounced ? name : null,
          this.announce.sides && signal.sideRank === 1 ? "premier côté" : null,
          this.announce.objective ? objectiveText(signal.objective) : null,
        ].filter((part): part is string => part !== null);
        return { cue, announcement: parts.length === 0 ? null : capitalize(parts.join(", ")) };
      }
      default:
        return { cue: GUIDANCE.other, announcement: null };
    }
  }

  /**
   * « À suivre : Fente » lorsque l'étape suivante est un autre exercice et que les noms sont annoncés. Pendant le
   * Compte à rebours initial d'une Séance de plusieurs Exercices : « Premier exercice : Fente » (recette du 11/11/2026,
   * constat b, Hermann : « Première annonce d'exercices, dire "Premier exercice" s'il y en a plus d'un, et sinon "A
   * suivre" comme maintenant »).
   */
  private nextPart(signal: ExecutionSignal): string | null {
    const next = signal.next;
    const nextName = next?.phase === "ACTIVITY" ? cleanName(next.exerciseName) : null;
    if (!this.announce.names || nextName === null || nextName === cleanName(signal.exerciseName)) return null;
    if (this.voiceEnabled) this.announcedNext = nextName;
    const first = signal.phase === "INITIAL_COUNTDOWN" && (signal.exerciseCount ?? 0) > 1;
    return first ? `Premier exercice : ${nextName}` : `À suivre : ${nextName}`;
  }
}

function signalKey(signal: Pick<ExecutionSignal, "kind" | "atMs">): string {
  return `${signal.kind}@${signal.atMs}`;
}

/** Événement du guidage sonore d'une transition (ch13 : « Point d’arrêt » regroupe pauses, récupérations et points d’arrêt). */
function transitionEvent(signal: ExecutionSignal): GuidanceEvent | null {
  switch (signal.phase) {
    case "INITIAL_COUNTDOWN":
      return "COUNTDOWN";
    case "SERIES_PAUSE":
    case "SIDE_RECOVERY":
    case "POST_ACTIVITY_RECOVERY":
    case "BLOCK_REST":
    case "STOP_POINT":
      return "STOP_POINT";
    case "SESSION_END":
      return "SESSION_END";
    case "ACTIVITY":
      return signal.sideRank === 2 ? "SIDE_CHANGE" : "EXERCISE_START";
    default:
      return null;
  }
}

/** Phrases d'une annonce, dans l'ordre ; `null` si aucune. */
function sentences(...parts: readonly (string | null)[]): string | null {
  const kept = parts.filter((part): part is string => part !== null);
  return kept.length === 0 ? null : kept.join(". ");
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
  if (target === undefined) return null;
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
