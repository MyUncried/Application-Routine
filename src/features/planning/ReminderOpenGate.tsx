import { useRouter } from "expo-router";
import { useEffect } from "react";

import { useOptionalExecution } from "@/features/execution/ExecutionServiceContext";
import type { LocalNotifications } from "@/features/planning/ReminderScheduler";
import { expoLocalNotifications } from "@/infrastructure/notifications/ExpoLocalNotifications";

type Props = {
  /** Injecté par les tests ; par défaut l'adaptateur `expo-notifications`. */
  readonly notifications?: Pick<LocalNotifications, "onReminderOpened">;
};

/**
 * RM-054b (décision de Hermann du 18/11/2026) : toucher un rappel ouvre l'écran d'Exécution de la première Séance
 * prévue à cette occurrence, motifs « x fois sur n » compris. L'écran s'ouvre sans rien exécuter : seul
 * « Démarrer » lance la séance. Une Exécution déjà ouverte n'est pas quittée : le toucher ne fait alors
 * qu'afficher l'application.
 */
export function ReminderOpenGate({ notifications = expoLocalNotifications }: Props) {
  const router = useRouter();
  const execution = useOptionalExecution();

  useEffect(
    () =>
      notifications.onReminderOpened((sessionId) => {
        if (execution !== null && execution.service.current() !== null) return;
        router.push({ pathname: "/execution", params: { sessionId } });
      }),
    [notifications, router, execution],
  );

  return null;
}
