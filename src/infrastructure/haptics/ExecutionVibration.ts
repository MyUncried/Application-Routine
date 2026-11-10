import * as Haptics from "expo-haptics";
import { Vibration as DeviceVibration } from "react-native";

/**
 * Vibrations de séance — décision de Hermann du 10/11/2026 (« Mélange ») : les vibrations n'étaient que de
 * petits tapotements (impact du moteur haptique), à peine perceptibles pendant l'effort.
 * - Forte : vibration classique de l'iPhone (environ 0,4 s ; iOS n'en règle ni la force ni la durée).
 * - Moyenne : trois tapotements rapprochés.
 * - Légère : un tapotement (cadence, signal minute).
 * Un échec natif est ignoré : il n'interrompt jamais l'Exécution.
 */
export type VibrationLevel = "LIGHT" | "MEDIUM" | "HEAVY";

export type VibrationPort = { readonly vibrate: (level: VibrationLevel) => void };

/** Écart entre les trois tapotements d'une vibration moyenne. */
export const MEDIUM_TAP_INTERVAL_MS = 90;

type Devices = {
  readonly impactAsync: typeof Haptics.impactAsync;
  readonly vibrate: () => void;
  readonly later: (run: () => void, delayMs: number) => void;
};

const defaultDevices: Devices = {
  impactAsync: Haptics.impactAsync,
  vibrate: () => DeviceVibration.vibrate(),
  later: (run, delayMs) => {
    setTimeout(run, delayMs);
  },
};

export function deviceVibration(devices: Devices = defaultDevices): VibrationPort {
  const tap = (style: Haptics.ImpactFeedbackStyle) => {
    try {
      devices.impactAsync(style).catch(() => undefined);
    } catch {
      // Module natif absent : aucune vibration.
    }
  };
  return {
    vibrate: (level) => {
      if (level === "HEAVY") {
        try {
          devices.vibrate();
        } catch {
          // Aucune vibration disponible.
        }
      } else if (level === "MEDIUM") {
        tap(Haptics.ImpactFeedbackStyle.Heavy);
        devices.later(() => tap(Haptics.ImpactFeedbackStyle.Heavy), MEDIUM_TAP_INTERVAL_MS);
        devices.later(() => tap(Haptics.ImpactFeedbackStyle.Heavy), 2 * MEDIUM_TAP_INTERVAL_MS);
      } else {
        tap(Haptics.ImpactFeedbackStyle.Light);
      }
    },
  };
}
