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
 * - Sons (lot son et voix, décision de Hermann du 09/11/2026, recette PRE-10 n° 2, `q-son` ; ch08 « Guidage
 *   sonore ») : bip aigu pendant les trois dernières secondes d'une étape chronométrée ; bip grave pour la
 *   cadence et le signal minute ;
 * - Annonces vocales (même décision ; ch08, RM-243) : au début d'un Exercice, son nom, suivi de « côté 1 » /
 *   « côté 2 » pour un Exercice bilatéral ; au début d'une récupération chronométrée, « Récupération ».
 *
 * Choix provisoires du lot (spec `pre10-son-voix`, À CLARIFIER 1 et 2) : une transition sans annonce vocale
 * (voix coupée, ou étape sans annonce : Compte à rebours initial, Pause entre séries, Fin de séance, Point
 * d'arrêt) donne un bip grave si les Sons sont actifs ; aucun autre bip pendant une Durée. Premier plan
 * seulement (arrière-plan : spike RT-001 / P6). Un échec natif n'interrompt jamais l'Exécution.
 */
export class ExecutionSignalAdapter {
  private vibrationEnabled = true;
  private soundEnabled = true;
  private voiceEnabled = true;

  constructor(
    private readonly haptics: Pick<typeof Haptics, "impactAsync"> = Haptics,
    private readonly beeps: BeepPort = new ExecutionSounds(),
    private readonly voice: VoicePort = new ExecutionVoice(),
  ) {}

  /** Préférence Vibrations du Profil (vibrations fonctionnelles de séance). */
  setVibrationEnabled(enabled: boolean): void {
    this.vibrationEnabled = enabled;
  }

  /** Sons et Annonces vocales : actifs au début de chaque Exécution, modifiables pendant (ch08). */
  setAudible(sound: boolean, voice: boolean): void {
    this.soundEnabled = sound;
    this.voiceEnabled = voice;
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
    const announcement = signal.kind === "TRANSITION" && this.voiceEnabled ? announcementOf(signal) : null;
    if (announcement !== null) {
      this.voice.say(announcement);
      return;
    }
    if (this.soundEnabled) this.beeps.play(toneOf(signal));
  }
}

/** Texte annoncé au début d'une étape ; `null` pour une étape sans annonce (ch08 « Guidage sonore »). */
export function announcementOf(signal: Pick<ExecutionSignal, "phase" | "exerciseName" | "sideRank">): string | null {
  if (signal.phase === "SIDE_RECOVERY" || signal.phase === "POST_ACTIVITY_RECOVERY") return "Récupération";
  if (signal.phase !== "ACTIVITY" || signal.exerciseName === null || signal.exerciseName.trim() === "") return null;
  return signal.sideRank === null ? signal.exerciseName : `${signal.exerciseName}, côté ${signal.sideRank}`;
}

/** Bip aigu : trois dernières secondes ; bip grave : cadence, signal minute, transition sans annonce. */
function toneOf(signal: ExecutionSignal): BeepTone {
  return signal.kind === "COUNTDOWN" ? "HIGH" : "LOW";
}
