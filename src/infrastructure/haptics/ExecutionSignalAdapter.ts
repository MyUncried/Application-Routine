import * as Haptics from "expo-haptics";

import type { ExecutionSignal } from "@/features/execution/ExecutionService";
import { ExecutionSounds, type BeepPort, type BeepTone } from "@/infrastructure/audio/ExecutionSounds";
import { ExecutionVoice, type VoicePort } from "@/infrastructure/speech/ExecutionVoice";

/**
 * PRE-10.2 — signaux d'exécution (ch12 §12.11 ; conception §16.1). Le moteur demande un signal ; cet adaptateur
 * le restitue sur trois canaux indépendants :
 *
 * - vibration fonctionnelle (préférence `Vibrations` du Profil) : transition d'étape (impact fort), trois
 *   dernières secondes (impact moyen), bip de cadence et signal minute (impact léger) ;
 * - Sons (lot son et voix, décision de Hermann du 09/11/2026, `q-son` ; ch08 « Guidage sonore ») ;
 * - Annonces vocales (même décision ; ch08, RM-243).
 *
 * Règles (recette « Son et voix » du 09/11/2026, décisions de Hermann sur S2, S3, S5, S6) :
 * - début d'un Exercice : sifflet, puis annonce du nom (« côté 1 » / « côté 2 » pour un bilatéral) ;
 * - début d'une récupération (entre côtés, après l'exercice, entre blocs) : « Récupération » ; début d'une
 *   Pause entre séries : « Pause » ;
 * - Point d'arrêt : son spécifique (deux notes descendantes), sans annonce ;
 * - début du Compte à rebours initial : « Préparez-vous », sans sifflet (recette du 09/11/2026, 2e passage) ;
 * - autre début d'étape, ou annonce coupée : bip grave (S5 confirmé) ;
 * - trois dernières secondes : bip aigu ; cadence : un seul son, grave et discret (« tac ») ; signal minute :
 *   bip grave.
 *
 * Les sons partent immédiatement (2e passage : le report à l'image suivante, ajouté pour S1, a mis les bips
 * « très en retard » ; il est retiré). Premier plan seulement (S7). Un échec natif n'interrompt jamais
 * l'Exécution.
 */
export const ANNOUNCEMENT_AFTER_WHISTLE_MS = 500;

type Defer = (run: () => void, delayMs?: number) => void;

const later: Defer = (run, delayMs = 0) => {
  if (delayMs > 0) setTimeout(run, delayMs);
  else run();
};

export class ExecutionSignalAdapter {
  private vibrationEnabled = true;
  private soundEnabled = true;
  private voiceEnabled = true;

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
    if (this.vibrationEnabled) {
      const style =
        signal.kind === "TRANSITION" ? Haptics.ImpactFeedbackStyle.Heavy : signal.kind === "COUNTDOWN" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light;
      this.haptics.impactAsync(style).catch(() => undefined);
    }
    if (signal.kind !== "TRANSITION") {
      if (this.soundEnabled) this.beeps.play(toneOf(signal));
      return;
    }
    const announcement = this.voiceEnabled ? announcementOf(signal) : null;
    if (signal.phase === "ACTIVITY") {
      if (this.soundEnabled) this.beeps.play("WHISTLE");
      if (announcement !== null) this.defer(() => this.voice.say(announcement), this.soundEnabled ? ANNOUNCEMENT_AFTER_WHISTLE_MS : 0);
      return;
    }
    if (signal.phase === "STOP_POINT") {
      if (this.soundEnabled) this.beeps.play("STOP_POINT");
      return;
    }
    if (announcement !== null) this.voice.say(announcement);
    else if (this.soundEnabled) this.beeps.play("LOW");
  }

}

function toneOf(signal: ExecutionSignal): BeepTone {
  return signal.kind === "COUNTDOWN" ? "HIGH" : signal.kind === "CADENCE" ? "TAC" : "LOW";
}

/** Texte annoncé au début d'une étape ; `null` pour une étape sans annonce (ch08 « Guidage sonore »). */
export function announcementOf(signal: Pick<ExecutionSignal, "phase" | "exerciseName" | "sideRank">): string | null {
  if (signal.phase === "SIDE_RECOVERY" || signal.phase === "POST_ACTIVITY_RECOVERY" || signal.phase === "BLOCK_REST") return "Récupération";
  if (signal.phase === "SERIES_PAUSE") return "Pause";
  if (signal.phase === "INITIAL_COUNTDOWN") return "Préparez-vous";
  if (signal.phase !== "ACTIVITY" || signal.exerciseName === null || signal.exerciseName.trim() === "") return null;
  return signal.sideRank === null ? signal.exerciseName : `${signal.exerciseName}, côté ${signal.sideRank}`;
}
