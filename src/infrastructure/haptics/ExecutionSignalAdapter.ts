import * as Haptics from "expo-haptics";

import type { ExecutionSignal } from "@/features/execution/ExecutionService";

/**
 * PRE-10.2 — premiers signaux d'exécution (ch12 §12.11 ; conception §16.1). Le moteur demande un signal ;
 * cet adaptateur le restitue par une vibration fonctionnelle (préférence `Vibrations` du Profil), seul
 * canal natif disponible dans le projet : transition d'étape (impact fort), trois dernières secondes
 * (impact moyen), bip de cadence et signal minute (impact léger).
 *
 * Son et annonces vocales : aucune bibliothèque audio ni de synthèse vocale n'est installée (Expo 57 :
 * `expo-audio`, `expo-speech` à ajouter, nouvelle version native requise). Les interrupteurs Sons et
 * Annonces vocales de l'écran pilotent l'état demandé (`soundEnabled`, `voiceEnabled`) sans restitution
 * sonore dans cette livraison ; à raccorder après le spike RT-001 / P6 (verrouillage, arrière-plan).
 * Un échec natif n'interrompt jamais l'Exécution.
 */
export class ExecutionSignalAdapter {
  private vibrationEnabled = true;
  private soundEnabled = true;
  private voiceEnabled = true;

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

  constructor(private readonly haptics: Pick<typeof Haptics, "impactAsync"> = Haptics) {}

  play(signal: ExecutionSignal): void {
    if (!this.vibrationEnabled) return;
    const style =
      signal.kind === "TRANSITION" ? Haptics.ImpactFeedbackStyle.Heavy : signal.kind === "COUNTDOWN" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light;
    this.haptics.impactAsync(style).catch(() => undefined);
  }
}
